# Hero Image Pipeline: Original SVG Diagram → PNG

Every article needs an original `images/hero.png`: never a stock photo, never something pulled
from Google Images. For technical articles, the highest-value image is a small architecture/flow
diagram that actually explains a mechanism from the article (Dockerfile → image → container →
network, request → controller → service → repository, etc.), not decoration.

## Why SVG + Headless Chromium, Not an Image Generator

There's no image-generation tool available in this environment. What *is* reliably available:

- **ImageMagick (`magick`/`convert`)** is installed, but its SVG delegate expects `rsvg-convert`,
  which is not installed, and its built-in MSVG renderer fails on text (`unable to read font`).
  Don't try to install `rsvg-convert` or any new system package for this: there's a working path
  without it.
- **Playwright is already a project dependency** (`node_modules/playwright`, with a Chromium
  binary already downloaded under `~/Library/Caches/ms-playwright/` on this machine). Headless
  Chromium renders SVG and text correctly using real system fonts, so the pipeline is: write plain
  SVG → wrap in a tiny HTML shell → screenshot with Playwright → save as PNG.

## The Pipeline

1. Design the diagram as boxes and arrows that map directly to real concepts from the article
   (see examples below). Canvas: 1200x630 (a standard hero/OG image ratio).
2. Write it as a `.svg` file, or generate it via a small Node script using reusable
   box/arrow/text helpers (recommended once you're making more than one diagram: avoids
   hand-writing repetitive `<rect>`/`<text>` XML). A reusable helper module looks like:

```javascript
// svg-kit.mjs (rebuild as needed in scratch space; keep it if reusing across a batch)
export function box(x, y, w, h, label, opts = {}) { /* rounded rect + centered label + optional sub-label */ }
export function arrow(x1, y1, x2, y2, opts = {}) { /* straight or elbow path with arrowhead marker */ }
export function wrap(children, opts = {}) { /* full <svg> with dark background, kicker + title text, marker defs */ }
```

Palette used across this batch's diagrams (keep it consistent if adding more articles, so the
blog's hero images read as one visual system): background `#0b1220`, box fill `#131c2e`, primary
box stroke `#3b82f6`, secondary/muted box `#131c2e`/`#475569`, arrow `#64748b`, accent arrow
`#38bdf8`, text `#e2e8f0`, dim text `#94a3b8`, kicker label `#38bdf8`. Title font: bold sans-serif.
Box labels representing code/config: monospace. Sub-labels: smaller sans-serif, dim color.

3. Render the SVG to PNG using Playwright, run from the **repo root** (module resolution needs
   `node_modules/playwright` on the path: running the script from a scratch directory elsewhere
   fails with `ERR_MODULE_NOT_FOUND`):

```javascript
// render-svg.mjs: run via `node render-svg.mjs input.svg output.png` from the repo root
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [, , svgPath, pngPath] = process.argv;
const svg = readFileSync(svgPath, 'utf-8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;}svg{display:block;}</style></head><body>${svg}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
```

`deviceScaleFactor: 2` renders at 2400x1260 for crisp text, and the PNG can be used as-is: no
separate downscale step needed, browsers and CMS uploads handle the resolution fine.

4. Write output directly to `articles/<slug>/images/hero.png`. Delete any intermediate `.svg`
   source file from the repo afterward (keep the generation script in the scratch directory if you
   want to tweak and re-render, but don't leave `.svg` files sitting in `articles/*/images/`: the
   deliverable is the PNG).

## Diagram Content Guidance

Match the diagram to what the article actually explains: a linear pipeline (Dockerfile → image →
container), a branching flow (one source feeding multiple consumers, or multiple sources
converging on one), or a request lifecycle (controller → service → repository). Use short,
real identifiers as labels (`Dockerfile`, `setup()`, `useAuth()`) rather than vague generic boxes
like "Step 1" / "Step 2". A sub-label under a box (smaller, dimmer text) is useful for a one-line
clarification ("named volume", "business logic") without cluttering the main label.

## Alt Text

Write `imageAlt` in frontmatter as a genuine description of what the diagram shows and how the
pieces connect (e.g., "Diagram showing a Node.js Docker workflow: a Dockerfile builds a Docker
image, which runs as a container, connected over a Docker network to PostgreSQL and Redis
containers"): descriptive, not a keyword list.
