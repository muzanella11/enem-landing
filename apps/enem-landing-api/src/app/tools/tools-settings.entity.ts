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

  /** AdSense ad unit id for the slot below results (Story 27). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  adsenseSlotResult!: string | null;

  /** AdSense ad unit id for the desktop sidebar slot (Story 27). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  adsenseSlotSidebar!: string | null;

  /** Story 56: ads in muzanella.com blog articles; also needs `adsEnabled`. */
  @Column({ default: false })
  blogAdsEnabled!: boolean;

  /** AdSense ad unit id for the blog article slots (Story 56). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  adsenseSlotArticle!: string | null;

  @Column({ default: 'Traktir kopi' })
  donationCtaText!: string;

  /** Internal reminder of the AdSense categories blocked for this site (pinjol, judi, ...). */
  @Column({ type: 'text', nullable: true })
  blockedCategoriesNote!: string | null;
}
