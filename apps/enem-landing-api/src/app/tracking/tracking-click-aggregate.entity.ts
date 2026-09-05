import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** One row per (path, deviceBucket, gridX, gridY) cell - see TrackingHeatmapService for the upsert-by-natural-key aggregation job. */
@Entity('tracking_click_aggregates')
@Index(['path', 'deviceBucket', 'gridX', 'gridY'], { unique: true })
export class TrackingClickAggregateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
