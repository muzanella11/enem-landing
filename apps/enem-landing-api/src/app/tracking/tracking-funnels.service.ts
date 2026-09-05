import type { TrackingFunnelReportStep } from '@enem-landing/shared-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateFunnelDto } from './dto/create-funnel.dto.js';
import { UpdateFunnelDto } from './dto/update-funnel.dto.js';
import { TrackingEventEntity } from './tracking-event.entity.js';
import { TrackingFunnelEntity } from './tracking-funnel.entity.js';
import { TrackingPageviewEntity } from './tracking-pageview.entity.js';

@Injectable()
export class TrackingFunnelsService {
  constructor(
    @InjectRepository(TrackingFunnelEntity)
    private readonly funnelRepository: Repository<TrackingFunnelEntity>,
    @InjectRepository(TrackingPageviewEntity)
    private readonly pageviewRepository: Repository<TrackingPageviewEntity>,
    @InjectRepository(TrackingEventEntity)
    private readonly eventRepository: Repository<TrackingEventEntity>,
  ) {}

  findAll(): Promise<TrackingFunnelEntity[]> {
    return this.funnelRepository.find();
  }

  create(dto: CreateFunnelDto): Promise<TrackingFunnelEntity> {
    return this.funnelRepository.save(this.funnelRepository.create(dto));
  }

  async update(
    id: string,
    dto: UpdateFunnelDto,
  ): Promise<TrackingFunnelEntity> {
    const funnel = await this.findOrThrow(id);
    Object.assign(funnel, dto);
    return this.funnelRepository.save(funnel);
  }

  async remove(id: string): Promise<void> {
    const funnel = await this.findOrThrow(id);
    await this.funnelRepository.remove(funnel);
  }

  async getReport(id: string): Promise<TrackingFunnelReportStep[]> {
    const funnel = await this.findOrThrow(id);

    // Sessions still "in" the funnel, mapped to the timestamp at which
    // they reached the previous step - `null` means "no step reached
    // yet" (the very first step has no lower-bound timestamp to respect).
    let eligible: Map<string, Date> | null = null;
    const report: TrackingFunnelReportStep[] = [];

    for (const step of funnel.steps) {
      const sessionIdFilter =
        eligible === null ? undefined : [...eligible.keys()];

      const [pageviews, events] = await Promise.all([
        this.pageviewRepository.find({
          where: {
            path: step,
            ...(sessionIdFilter ? { sessionId: In(sessionIdFilter) } : {}),
          },
        }),
        this.eventRepository.find({
          where: {
            name: step,
            ...(sessionIdFilter ? { sessionId: In(sessionIdFilter) } : {}),
          },
        }),
      ]);

      const reachedAt = new Map<string, Date>();
      const consider = (sessionId: string, timestamp: Date) => {
        const lowerBound = eligible?.get(sessionId) ?? null;
        if (lowerBound !== null && timestamp < lowerBound) return;

        const existing = reachedAt.get(sessionId);
        if (!existing || timestamp < existing) {
          reachedAt.set(sessionId, timestamp);
        }
      };

      for (const pageview of pageviews) {
        consider(pageview.sessionId, pageview.enteredAt);
      }
      for (const event of events) {
        consider(event.sessionId, event.occurredAt);
      }

      report.push({ step, count: reachedAt.size });
      eligible = reachedAt;
    }

    return report;
  }

  private async findOrThrow(id: string): Promise<TrackingFunnelEntity> {
    const funnel = await this.funnelRepository.findOne({ where: { id } });
    if (!funnel) {
      throw new NotFoundException('Funnel not found');
    }
    return funnel;
  }
}
