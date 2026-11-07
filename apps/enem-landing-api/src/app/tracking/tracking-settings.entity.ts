import type { TrackingSite } from '@enem-landing/shared-definitions';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Single-row config — see TrackingSettingsService for the get-or-create-default logic. */
@Entity('tracking_settings')
export class TrackingSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Which tracked site this row belongs to (Story 25) - `landing` for every row recorded before multi-site tracking. */
  @Column({ type: 'varchar', length: 32, default: 'landing' })
  site!: TrackingSite;

  @Column({ default: false })
  pageviewEnabled!: boolean;

  @Column({ default: false })
  eventsEnabled!: boolean;

  @Column({ default: false })
  heatmapEnabled!: boolean;

  @Column({ default: false })
  sessionRecordingEnabled!: boolean;

  /** Rolled once per new session, client-side - keeps recording (and its R2 storage cost) to a sample of visits rather than every one. */
  @Column({ type: 'int', default: 10 })
  sessionRecordingSampleRatePct!: number;
}
