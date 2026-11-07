export type SharePlatform =
  'whatsapp' | 'telegram' | 'facebook' | 'x' | 'linkedin';

export interface ShareLink {
  platform: SharePlatform;
  label: string;
  href: string;
}

/**
 * Share-intent URLs for a page, in the order they are shown (WhatsApp first:
 * it is how most Indonesian visitors share). Only the page URL and its title
 * go into these links, never anything the visitor typed.
 */
export const buildShareLinks = (url: string, title: string): ShareLink[] => {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const text = encodeURIComponent(`${title} ${url}`);
  return [
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${text}`,
    },
    {
      platform: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${u}&text=${t}`,
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    },
    {
      platform: 'x',
      label: 'X',
      href: `https://x.com/intent/post?url=${u}&text=${t}`,
    },
    {
      platform: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    },
  ];
};
