import type { ToolBadge, ToolCategory } from '@enem-landing/shared-definitions';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * One tool on tools.muzanella.com (Story 25). The tool's page and logic
 * live in enem-landing-tools' code; this row only controls how it is
 * listed (order, badge, on/off) and whether ads show on it.
 */
@Entity('tools')
export class ToolEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Same as the tool's route in enem-landing-tools, e.g. `kalkulator-gaji-bersih`. */
  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 512 })
  shortDescription!: string;

  @Column({ type: 'varchar', length: 32 })
  category!: ToolCategory;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 16, nullable: true })
  badge!: ToolBadge | null;

  @Column({ default: true })
  adsEnabled!: boolean;

  @UpdateDateColumn({ type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
