import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tracking_funnels')
export class TrackingFunnelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  /** Ordered list of step identifiers - each may match a pageview `path` or an event `name` (see TrackingFunnelsService.getReport). */
  @Column({ type: 'json' })
  steps!: string[];
}
