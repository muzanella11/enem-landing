import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_sessions')
export class TrackingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  visitorId!: string;

  @Column({ type: 'datetime', precision: 6 })
  startedAt!: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  referrer!: string | null;

  @Column({ type: 'varchar', nullable: true })
  utmSource!: string | null;

  @Column({ type: 'varchar', nullable: true })
  utmMedium!: string | null;

  @Column({ type: 'varchar', nullable: true })
  utmCampaign!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceType!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceVendor!: string | null;

  @Column({ type: 'varchar', nullable: true })
  deviceModel!: string | null;

  @Column({ type: 'varchar', nullable: true })
  browserName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  browserVersion!: string | null;

  @Column({ type: 'varchar', nullable: true })
  engineName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  engineVersion!: string | null;

  @Column({ type: 'varchar', nullable: true })
  osName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  osVersion!: string | null;

  @Column({ type: 'varchar', nullable: true })
  cpuArchitecture!: string | null;

  @Column({ type: 'varchar', nullable: true })
  language!: string | null;

  @Column({ type: 'varchar', nullable: true })
  timezone!: string | null;

  @Column({ type: 'int', nullable: true })
  screenWidth!: number | null;

  @Column({ type: 'int', nullable: true })
  screenHeight!: number | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', nullable: true })
  region!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'double', nullable: true })
  latitude!: number | null;

  @Column({ type: 'double', nullable: true })
  longitude!: number | null;

  /**
   * Decided once, server-side, at session creation (a dice roll against
   * `sessionRecordingSampleRatePct`) - not a client self-report, so it's
   * durable and can be re-checked when a chunk actually comes in, and its
   * distribution across many sessions can be verified to match the
   * configured rate.
   */
  @Column({ default: false })
  recordingSampled!: boolean;
}
