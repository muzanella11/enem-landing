import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { GoldPriceEntity } from './gold-price.entity.js';

const TASK_ID = 'tools-gold-price-daily';
const CRON = '0 3 * * *'; // daily 03:00 UTC = 10:00 WIB
const TROY_OUNCE_GRAMS = 31.1034768;
const TIMEOUT_MS = 8000;

export interface GoldPricePoint {
  tanggal: string;
  pricePerGram: number;
}

/**
 * Records the spot gold price once a day (Story 38): international spot
 * (gold-api.com, USD/oz) x USD/IDR (exchangerate-api.com), per gram.
 * Only the price is stored - nothing about any visitor.
 */
@Injectable()
export class GoldPriceService implements OnModuleInit {
  private readonly logger = new Logger(GoldPriceService.name);

  constructor(
    @InjectRepository(GoldPriceEntity)
    private readonly repository: Repository<GoldPriceEntity>,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(TASK_ID, CRON, () =>
      this.recordToday(),
    );
    // Fill today's point on boot too, so history starts immediately.
    void this.schedulerService
      .runWithLock(TASK_ID, () => this.recordToday())
      .catch(() => undefined);
  }

  static todayWib(now = new Date()): string {
    return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`${url} -> ${response.status}`);
    return (await response.json()) as T;
  }

  async fetchSpot(): Promise<{ pricePerGram: number; updatedAt: Date }> {
    const [gold, fx] = await Promise.all([
      this.fetchJson<{ price: number; updatedAt: string }>(
        'https://api.gold-api.com/price/XAU',
      ),
      this.fetchJson<{ rates: Record<string, number> }>(
        'https://open.er-api.com/v6/latest/USD',
      ),
    ]);
    const usdIdr = fx.rates['IDR'];
    if (!gold.price || !usdIdr) throw new Error('Incomplete gold/FX data');
    return {
      pricePerGram: Math.round((gold.price * usdIdr) / TROY_OUNCE_GRAMS),
      updatedAt: new Date(gold.updatedAt),
    };
  }

  async recordToday(): Promise<void> {
    const tanggal = GoldPriceService.todayWib();
    try {
      const spot = await this.fetchSpot();
      await this.repository.save(
        this.repository.create({
          tanggal,
          pricePerGram: spot.pricePerGram,
          sourceUpdatedAt: spot.updatedAt,
        }),
      );
    } catch (error) {
      this.logger.warn(`Gold price for ${tanggal} not recorded`, error);
    }
  }

  async history(days: number): Promise<GoldPricePoint[]> {
    const since = new Date(Date.now() - days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const rows = await this.repository.find({
      where: { tanggal: MoreThanOrEqual(since) },
      order: { tanggal: 'ASC' },
    });
    return rows.map((row) => ({
      tanggal: row.tanggal,
      pricePerGram: row.pricePerGram,
    }));
  }
}
