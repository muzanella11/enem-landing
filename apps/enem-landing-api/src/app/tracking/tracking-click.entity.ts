import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_clicks')
export class TrackingClickEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
