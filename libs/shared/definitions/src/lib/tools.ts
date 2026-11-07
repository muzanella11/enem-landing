/** Categories used to group tools on the tools hub index (Story 25). */
export const TOOL_CATEGORIES = [
  'keuangan',
  'dokumen',
  'ibadah',
  'kesehatan',
  'pendidikan',
] as const;
export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export const TOOL_BADGES = ['baru', 'populer'] as const;
export type ToolBadge = (typeof TOOL_BADGES)[number];

export const DONATION_PLATFORMS = [
  'sociabuzz',
  'saweria',
  'trakteer',
  'qris',
  'other',
] as const;
export type DonationPlatform = (typeof DONATION_PLATFORMS)[number];
