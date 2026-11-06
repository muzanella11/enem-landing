import type { TrackingSite } from '@enem-landing/shared-definitions';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_clicks')
export class TrackingClickEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Which tracked site this row belongs to (Story 25) - `landing` for every row recorded before multi-site tracking. */
  @Column({ type: 'varchar', length: 32, default: 'landing' })
  site!: TrackingSite;

  @Column()
  path!: string;

  /** 0-1, relative to the full rendered page height/width, not the viewport - stays consistent regardless of scroll position. */
  @Column({ type: 'double' })
  xPct!: number;

  @Column({ type: 'double' })
  yPct!: number;

  @Column()
  deviceBucket!: string;

  @Column({ type: 'datetime', precision: 6 })
  occurredAt!: Date;
}
