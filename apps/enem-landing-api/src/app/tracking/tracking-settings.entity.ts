import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Single-row config — see TrackingSettingsService for the get-or-create-default logic. */
@Entity('tracking_settings')
export class TrackingSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
