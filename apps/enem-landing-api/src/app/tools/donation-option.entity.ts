import type { DonationPlatform } from '@enem-landing/shared-definitions';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One way to support the tools hub (Story 20/25), e.g. a SociaBuzz page or
 * a static QRIS image. Kept as a list so the platform can be swapped or a
 * second option added from the CMS without a deploy.
 */
@Entity('tools_donation_options')
export class DonationOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  label!: string;

  @Column({ type: 'varchar', length: 32 })
  platform!: DonationPlatform;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  url!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  qrisImageUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
