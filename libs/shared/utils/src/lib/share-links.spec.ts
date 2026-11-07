import { SHARE_ICONS } from './share-icons.js';
import { buildShareLinks } from './share-links.js';

describe('buildShareLinks', () => {
  const url = 'https://muzanella.com/blog/cara-hitung-thr?ref=a&b=c';
  const title = 'Cara Hitung THR & Pajaknya';
  const links = buildShareLinks(url, title);
  const byPlatform = Object.fromEntries(links.map((l) => [l.platform, l]));

  it('lists WhatsApp first', () => {
    expect(links[0]?.platform).toBe('whatsapp');
    expect(links.map((l) => l.platform)).toEqual([
      'whatsapp',
      'telegram',
      'facebook',
      'x',
      'linkedin',
    ]);
  });

  it('puts title and url in the WhatsApp text', () => {
    const text = new URL(byPlatform['whatsapp']!.href).searchParams.get('text');
    expect(text).toBe(`${title} ${url}`);
  });

  it('encodes the url so its own query string survives', () => {
    for (const link of links) {
      const params = new URL(link.href).searchParams;
      const shared = params.get('url') ?? params.get('u') ?? params.get('text');
      expect(shared).toContain(url);
    }
  });

  it('passes the title where the platform supports it', () => {
    expect(new URL(byPlatform['telegram']!.href).searchParams.get('text')).toBe(
      title,
    );
    expect(new URL(byPlatform['x']!.href).searchParams.get('text')).toBe(title);
  });
});

describe('SHARE_ICONS', () => {
  it('has a brand color for every share platform', () => {
    for (const link of buildShareLinks('https://muzanella.com', 'x')) {
      expect(SHARE_ICONS[link.platform].color).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
