import type { MonitorAlertEmailPayload } from '@enem-landing/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { MonitorStore } from '../store/monitor-store.js';
import { AlertMailer } from './alert-mailer.js';

export interface OutboxItem {
  historyId: string;
  attempts: number;
  /** Epoch ms; 0 = as soon as possible. */
  nextAttemptAt: number;
  lastError?: string;
  payload: MonitorAlertEmailPayload;
}

export const OUTBOX_MAX = 200;
/** Wait before retry 1..4. A failure after the last one drops the item. */
export const RETRY_DELAYS_MS = [1, 5, 15, 60].map(
  (minutes) => minutes * 60_000,
);

export type StatusWriter = (
  historyId: string,
  status: {
    emailStatus: 'sent' | 'failed' | 'queued' | 'cms-disabled';
    emailError?: string;
    emailAttempts?: number;
  },
) => Promise<void>;

/**
 * Email outbox in Redis (no message broker: one sender, a few emails a day):
 * - new items are LPUSHed to `alert-outbox`; when it holds more than 200
 *   the oldest (right end) are dropped and reported back;
 * - the processor takes one item at a time with an atomic
 *   `LMOVE alert-outbox alert-processing RIGHT LEFT`, so two processors
 *   can never take the same item, and an item survives a restart in
 *   `alert-processing` (moved back on startup by `recover()`);
 * - once handled the item is removed with `LPOP alert-processing` (it is
 *   always at the left end, one at a time), or put back with
 *   `LSET` + `LMOVE ... LEFT LEFT` carrying its new retry time.
 * Runs as a single replica: `recover()` assumes nobody else is mid-item.
 */
@Injectable()
export class AlertOutbox {
  private readonly logger = new Logger(AlertOutbox.name);

  constructor(
    private readonly store: MonitorStore,
    private readonly mailer: AlertMailer,
  ) {}

  private get outboxKey() {
    return this.store.key('alert-outbox');
  }

  private get processingKey() {
    return this.store.key('alert-processing');
  }

  size(): Promise<number> {
    return this.store.client.llen(this.outboxKey);
  }

  /** Returns the history ids dropped because the outbox was full. */
  async enqueue(item: OutboxItem): Promise<string[]> {
    const client = this.store.client;
    let length = await client.lpush(this.outboxKey, JSON.stringify(item));
    const dropped: string[] = [];
    while (length > OUTBOX_MAX) {
      const raw = await client.rpop(this.outboxKey);
      if (raw === null) break;
      length -= 1;
      try {
        dropped.push((JSON.parse(raw) as OutboxItem).historyId);
      } catch {
        // corrupt item, nothing to report
      }
    }
    if (dropped.length)
      this.logger.warn(`outbox full, dropped ${dropped.length} alert(s)`);
    return dropped;
  }

  /** Moves items left in `alert-processing` by a crash back to the outbox. */
  async recover(): Promise<number> {
    let moved = 0;
    while (
      (await this.store.client.lmove(
        this.processingKey,
        this.outboxKey,
        'LEFT',
        'RIGHT',
      )) !== null
    ) {
      moved += 1;
    }
    if (moved) this.logger.warn(`recovered ${moved} alert(s) from processing`);
    return moved;
  }

  /** One pass over the outbox: sends what is due, reschedules failures. */
  async process(writeStatus: StatusWriter, now = Date.now): Promise<number> {
    const client = this.store.client;
    const total = await client.llen(this.outboxKey);
    let sent = 0;
    for (let index = 0; index < total; index += 1) {
      const raw = await client.lmove(
        this.outboxKey,
        this.processingKey,
        'RIGHT',
        'LEFT',
      );
      if (raw === null) break;
      let item: OutboxItem;
      try {
        item = JSON.parse(raw) as OutboxItem;
      } catch {
        await client.lpop(this.processingKey);
        continue;
      }
      if (item.nextAttemptAt > now()) {
        await client.lmove(this.processingKey, this.outboxKey, 'LEFT', 'LEFT');
        continue;
      }

      const result = await this.mailer.send(item.payload);
      const attempts = item.attempts + 1;
      if (result.status === 'sent' || result.status === 'cms-disabled') {
        await client.lpop(this.processingKey);
        await writeStatus(item.historyId, {
          emailStatus: result.status,
          emailAttempts: attempts,
        });
        if (result.status === 'sent') sent += 1;
        continue;
      }

      const delay = RETRY_DELAYS_MS[attempts - 1];
      if (delay === undefined) {
        await client.lpop(this.processingKey);
        await writeStatus(item.historyId, {
          emailStatus: 'failed',
          emailError: result.error,
          emailAttempts: attempts,
        });
        this.logger.warn(
          `alert ${item.historyId} failed for good: ${result.error}`,
        );
        continue;
      }
      const next: OutboxItem = {
        ...item,
        attempts,
        nextAttemptAt: now() + delay,
        lastError: result.error,
      };
      await client.lset(this.processingKey, 0, JSON.stringify(next));
      await client.lmove(this.processingKey, this.outboxKey, 'LEFT', 'LEFT');
      await writeStatus(item.historyId, {
        emailStatus: 'queued',
        emailError: result.error,
        emailAttempts: attempts,
      });
    }
    return sent;
  }
}
