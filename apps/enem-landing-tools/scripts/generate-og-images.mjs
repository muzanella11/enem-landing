/**
 * Generates the Open Graph images (1200x630 PNG) for tools.muzanella.com:
 * one per tool in the registry snapshot, plus `default.png` for the hub
 * and other pages. Runs at build time (see package.json `generate-og`),
 * so the server never renders images at runtime.
 *
 * satori lays the card out and turns text into vector paths using the
 * bundled Inter font; resvg rasterizes the SVG to PNG. No user input is
 * ever part of these images.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { TOOLS_SNAPSHOT } from '../shared/tools-registry.ts';

const require = createRequire(import.meta.url);
const appDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(appDir, 'public', 'og');

const font = (weight) =>
  readFileSync(
    require.resolve(
      `@fontsource/inter/files/inter-latin-${weight}-normal.woff`,
    ),
  );
const fonts = [
  { name: 'Inter', data: font(400), weight: 400, style: 'normal' },
  { name: 'Inter', data: font(700), weight: 700, style: 'normal' },
  { name: 'Inter', data: font(800), weight: 800, style: 'normal' },
];

const CATEGORY_LABELS = {
  keuangan: 'Keuangan dan bisnis',
  dokumen: 'Dokumen, PDF, dan gambar',
  ibadah: 'Ibadah',
};

const h = (type, style, children) => ({ type, props: { style, children } });

const card = ({ eyebrow, title, description }) =>
  h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundImage:
        'linear-gradient(135deg, #0E7C6B 0%, #0B5D50 60%, #08463D 100%)',
      color: '#ffffff',
      fontFamily: 'Inter',
    },
    [
      h('div', { display: 'flex', alignItems: 'center', gap: '18px' }, [
        h(
          'div',
          {
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: '#ffffff',
            color: '#0E7C6B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 800,
          },
          'T',
        ),
        h('div', { fontSize: '30px', fontWeight: 700 }, 'Tools muzanella'),
      ]),
      h('div', { display: 'flex', flexDirection: 'column', gap: '20px' }, [
        h(
          'div',
          {
            fontSize: '26px',
            fontWeight: 700,
            color: '#A7F3D0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          },
          eyebrow,
        ),
        h(
          'div',
          {
            fontSize: title.length > 24 ? '68px' : '84px',
            fontWeight: 800,
            lineHeight: 1.05,
          },
          title,
        ),
        h(
          'div',
          {
            fontSize: '30px',
            lineHeight: 1.35,
            color: '#D1FAE5',
            maxWidth: '1000px',
          },
          description,
        ),
      ]),
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '26px',
        },
        [
          h('div', { fontWeight: 700 }, 'tools.muzanella.com'),
          h(
            'div',
            { color: '#A7F3D0' },
            'Gratis · Tanpa upload · Bahasa Indonesia',
          ),
        ],
      ),
    ],
  );

const truncate = (text, max) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

const render = async (name, content) => {
  const svg = await satori(card(content), { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();
  writeFileSync(join(outDir, `${name}.png`), png);
};

mkdirSync(outDir, { recursive: true });

await render('default', {
  eyebrow: 'Gratis · Berbahasa Indonesia',
  title: 'Kalkulator dan alat PDF',
  description:
    'Semua berjalan di browsermu. Angka dan file yang kamu isi tidak pernah di-upload.',
});

for (const tool of TOOLS_SNAPSHOT.tools) {
  await render(tool.slug, {
    eyebrow: CATEGORY_LABELS[tool.category] ?? 'Tools',
    title: tool.name,
    description: truncate(tool.shortDescription, 110),
  });
}

console.log(
  `OG images written to ${outDir} (${TOOLS_SNAPSHOT.tools.length + 1} files)`,
);
