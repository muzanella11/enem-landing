import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_events')
export class TrackingEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column()
  name!: string;

  @Column({ type: 'json', nullable: true })
  payload!: unknown | null;

  @Column({ type: 'varchar', nullable: true })
  path!: string | null;

  @Column({ type: 'datetime', precision: 6 })
  occurredAt!: Date;
}
