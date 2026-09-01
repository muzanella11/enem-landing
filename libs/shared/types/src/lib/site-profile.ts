export interface SocialLink {
  platform: string;
  url: string;
}

/**
 * Single-row config, not a list — there is exactly one site profile per
 * deployment (see Story 06, `PUT /site-profile`).
 */
export interface SiteProfile {
  heroTitle: string;
  heroSubtitle: string;
  bio: string;
  avatarUrl: string;
  socialLinks: SocialLink[];
}
