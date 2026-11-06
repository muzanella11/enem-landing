import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Single-row settings for the tools hub (Story 25) - get-or-create like `TrackingSettingsEntity`. */
@Entity('tools_settings')
export class ToolsSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Global kill switch - ads show on a tool only when this AND the tool's own `adsEnabled` are on. */
  @Column({ default: false })
  adsEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  adsenseClientId!: string | null;

  @Column({ default: 'Traktir kopi' })
  donationCtaText!: string;

  /** Internal reminder of the AdSense categories blocked for this site (pinjol, judi, ...). */
  @Column({ type: 'text', nullable: true })
  blockedCategoriesNote!: string | null;
}
