import { Injectable, Logger } from '@nestjs/common';

const TOR_EXIT_LIST_URL = 'https://check.torproject.org/torbulkexitlist';
const REFRESH_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

/**
 * Tor exit node addresses from the Tor Project's official bulk list,
 * downloaded at most once a day and kept in memory (~1-2k entries).
 */
@Injectable()
export class TorExitListService {
  private readonly logger = new Logger(TorExitListService.name);
  private addresses: Set<string> | null = null;
  private loadedAt = 0;
  private loading: Promise<void> | null = null;

  /** True/false, or null when the list couldn't be loaded. */
  async isTorExit(ip: string | null): Promise<boolean | null> {
    if (!ip) return null;
    await this.ensureFresh();
    return this.addresses ? this.addresses.has(ip) : null;
  }

  private async ensureFresh(): Promise<void> {
    if (this.addresses && Date.now() - this.loadedAt < REFRESH_MS) return;
    this.loading ??= this.load().finally(() => {
      this.loading = null;
    });
    await this.loading;
  }

  private async load(): Promise<void> {
    try {
      const response = await fetch(TOR_EXIT_LIST_URL, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      this.addresses = new Set(
        text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#')),
      );
      this.loadedAt = Date.now();
    } catch (error) {
      // Keep serving a stale list rather than none; retry on the next call.
      this.logger.warn(`Could not load the Tor exit list: ${String(error)}`);
    }
  }
}
