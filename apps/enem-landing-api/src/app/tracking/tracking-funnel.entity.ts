import type { TrackingSite } from '@enem-landing/shared-definitions';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_funnels')
export class TrackingFunnelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Which tracked site this row belongs to (Story 25) - `landing` for every row recorded before multi-site tracking. */
  @Column({ type: 'varchar', length: 32, default: 'landing' })
  site!: TrackingSite;

  @Column()
  name!: string;

  /** Ordered list of step identifiers - each may match a pageview `path` or an event `name` (see TrackingFunnelsService.getReport). */
  @Column({ type: 'json' })
  steps!: string[];
}
