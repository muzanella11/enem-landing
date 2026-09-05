import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_pageviews')
export class TrackingPageviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column()
  path!: string;

  @Column({ type: 'datetime', precision: 6 })
  enteredAt!: Date;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;
}
