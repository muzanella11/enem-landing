import type { TrackingSite } from '@enem-landing/shared-definitions';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** One row per (site, path, deviceBucket, gridX, gridY) cell - see TrackingHeatmapService for the upsert-by-natural-key aggregation job. */
@Entity('tracking_click_aggregates')
@Index(
  'IDX_tracking_click_aggregates_natural_key',
  ['site', 'path', 'deviceBucket', 'gridX', 'gridY'],
  {
    unique: true,
  },
)
export class TrackingClickAggregateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Which tracked site this row belongs to (Story 25) - `landing` for every row recorded before multi-site tracking. */
  @Column({ type: 'varchar', length: 32, default: 'landing' })
  site!: TrackingSite;

  @Column()
  path!: string;

  @Column()
  deviceBucket!: string;

  @Column({ type: 'int' })
  gridX!: number;

  @Column({ type: 'int' })
  gridY!: number;

  @Column({ type: 'int', default: 0 })
  count!: number;
}
