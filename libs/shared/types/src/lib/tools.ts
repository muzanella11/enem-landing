/**
 * Tools hub registry (Story 25). String unions mirror the runtime
 * constants in `@enem-landing/shared-definitions` (TOOL_CATEGORIES,
 * TOOL_BADGES, DONATION_PLATFORMS); this lib stays type-only.
 */
export type ToolCategoryValue = 'keuangan' | 'dokumen' | 'ibadah';
export type ToolBadgeValue = 'baru' | 'populer';
export type DonationPlatformValue =
  'sociabuzz' | 'saweria' | 'trakteer' | 'qris' | 'other';

export interface Tool {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: ToolCategoryValue;
  sortOrder: number;
  enabled: boolean;
  badge: ToolBadgeValue | null;
  adsEnabled: boolean;
  updatedAt: string;
}

export interface DonationOption {
  id: string;
  label: string;
  platform: DonationPlatformValue;
  url: string | null;
  qrisImageUrl: string | null;
  note: string | null;
  enabled: boolean;
  sortOrder: number;
}

export interface ToolsSettings {
  id: string;
  adsEnabled: boolean;
  adsenseClientId: string | null;
  donationCtaText: string;
  blockedCategoriesNote: string | null;
}

/** Public payload served by `GET /tools/config` (and the tools app's BFF). */
export interface ToolsPublicConfig {
  tools: Omit<Tool, 'id' | 'updatedAt'>[];
  donationOptions: Omit<DonationOption, 'enabled' | 'sortOrder'>[];
  settings: {
    adsEnabled: boolean;
    adsenseClientId: string | null;
    donationCtaText: string;
  };
}

/** Per-tool usage for the CMS tool list (last 30 days, from tracking events). */
export interface ToolUsageStats {
  toolId: string;
  views: number;
  calculations: number;
}

/** Per-donation-option click counts for the CMS donation list (last 30 days). */
export interface DonationClickStats {
  donationOptionId: string;
  clicks: number;
  byTool: { toolId: string; clicks: number }[];
}
