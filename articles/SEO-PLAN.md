# SEO Content Plan: muzanella.com Blog

This batch covers 8 articles across 5 topic clusters, chosen to match the author's demonstrated
expertise (Frontend Engineer / Full Stack JavaScript Developer) rather than broad, highly
competitive keywords. None of these claim guaranteed search rankings: the goal is topical
authority and long-tail search intent coverage that compounds as more articles are published.

## Article Table

| Article | Primary Keyword | Search Intent | Secondary Keywords | Cluster | Priority |
|---|---|---|---|---|---|
| [Docker Fundamentals for Node.js Developers](fundamental-docker/fundamental-docker.md) | docker for node.js developers | Informational: learn core Docker concepts (image/container/network/volume) specifically in a Node.js context | dockerize node.js app, docker image vs container explained, docker node.js best practices | Docker / DevOps | 1 |
| [Docker Compose for Node.js Development Environments](docker-compose-nodejs/docker-compose-nodejs.md) | docker compose node.js development | Informational/practical: set up a multi-container local dev stack (app + db + cache) | docker compose node.js postgres redis, docker compose live reload node, docker compose bind mount node_modules | Docker / DevOps | 2 |
| [Node.js Environment Variables: A Practical Guide to Configuration Management](nodejs-environment-variables/nodejs-environment-variables.md) | node.js environment variables | Informational/practical: structure and validate config instead of raw process.env reads | node.js configuration management, process.env validation, typed config node.js | Node.js / Backend | 1 |
| [How to Structure a NestJS Project with TypeScript](nestjs-project-structure/nestjs-project-structure.md) | nestjs project structure | Practical/how-to: organize a growing NestJS codebase correctly | nestjs typescript architecture, nestjs feature module pattern, nestjs controller service repository | Node.js / Backend | 2 |
| [Vue 3 Composition API: Practical Patterns for Real Projects](vue-3-composition-api-patterns/vue-3-composition-api-patterns.md) | vue 3 composition api patterns | Practical/how-to: decide between ref/reactive and watch/watchEffect correctly | vue 3 ref vs reactive, vue 3 watch vs watcheffect, vue composition api best practices | Vue / Frontend | 1 |
| [Building Reusable Vue Composables: A Practical Guide](vue-composables-guide/vue-composables-guide.md) | vue composables | Practical/how-to: extract genuinely reusable composables without shared-state bugs | vue 3 custom composables, vue composable best practices, reusable logic vue 3 | Vue / Frontend | 2 |
| [Nuxt 3 SEO: A Practical Guide to Meta Tags, Sitemaps, and Structured Data](nuxt-3-seo-guide/nuxt-3-seo-guide.md) | nuxt 3 seo | Practical/how-to: implement per-page SEO correctly (useSeoMeta, canonical, JSON-LD, sitemap) | nuxt useseometa, nuxt ssr seo, nuxt structured data json-ld, nuxt canonical url | Nuxt | 1 |
| [React useEffect: A Practical Guide to Dependency Arrays and Cleanup](react-useeffect-dependency-array/react-useeffect-dependency-array.md) | react useeffect dependency array | Practical/how-to: fix infinite loops and stale closures by understanding the Object.is comparison and cleanup lifecycle | react useeffect infinite loop, react useeffect stale closure, react useeffect cleanup function, react exhaustive-deps | React | 1 |

## Why These Keywords

Every primary keyword is a long-tail phrase with a clear, single search intent, deliberately
avoiding head terms like "Docker," "Node.js," or "Vue" alone, which are dominated by official
documentation and large-scale publishers and are not realistic targets for a personal portfolio
site. Each keyword also maps to a real, specific problem a developer searches for while working
(not a definitional "what is X" query), which is what the content actually answers.

## Topic Clusters and How They Connect

**Docker / DevOps**: `fundamental-docker` establishes core concepts (images, containers,
networking, volumes) using a Node.js example throughout. `docker-compose-nodejs` builds directly
on it for local multi-container development. Each links to the other, plus both link out to
`nodejs-environment-variables` for how secrets and config should be injected into containers.

**Node.js / Backend**: `nodejs-environment-variables` and `nestjs-project-structure` cross-link:
the environment variables article shows the framework-agnostic and NestJS-specific config
patterns; the NestJS structure article shows where that config module fits alongside controllers,
services, and repositories.

**Vue / Frontend**: `vue-3-composition-api-patterns` covers the foundational reactivity
decisions (ref vs reactive, watch vs watchEffect); `vue-composables-guide` builds on it directly,
covering when and how to extract that logic into reusable composables. Each links to the other.

**Nuxt**: `nuxt-3-seo-guide` is currently a single-article cluster, but it's deliberately wired
into the Vue cluster: it links to `vue-3-composition-api-patterns` for the reactivity model
`useSeoMeta`/`useHead` are built on, and that article links back to it as a practical example of
Composition API usage inside a real framework. This is a natural cluster to expand (Nuxt SSR
internals, Nuxt SSG, Nuxt routing) once this batch is published and has a chance to accumulate
some initial traffic and internal link equity.

**React**: `react-useeffect-dependency-array` is also a single-article cluster today, added to
cover React specifically (part of the author's stated expertise alongside Vue), rather than
leaving the site's frontend content Vue-only. It cross-links with `vue-3-composition-api-patterns`
in both directions: each article contrasts React's explicit dependency array against Vue's
automatic dependency tracking in `watchEffect`, which is a genuine, non-forced comparison for a
reader who works across both frameworks. Future React additions (custom hooks, `useMemo` vs
`useCallback`, React Server Components) would build this into a full cluster the same way Docker
and Node.js grew into theirs.

## Internal Linking Strategy

Links were added only where they genuinely help the reader continue an in-progress thought (e.g.,
"here's how to inject the secret you just decided not to bake into the image"), not appended
mechanically to hit a link count. Every link uses descriptive anchor text naming the linked
article's actual topic, never "click here" or "read more." No article links to itself, and no two
articles link to each other for the same reason twice.

## Which Article to Publish First

Recommended order: **`fundamental-docker` → `nodejs-environment-variables` →
`vue-3-composition-api-patterns` → `react-useeffect-dependency-array` → `nuxt-3-seo-guide` →
`docker-compose-nodejs` → `nestjs-project-structure` → `vue-composables-guide`.**

Reasoning: the first article in each cluster (Docker, Node.js, Vue, React, Nuxt) is published
before its follow-up, so no published article ever links to a draft/unpublished one.
`fundamental-docker` goes first because it's the most foundational and highest-intent entry point
across all clusters. `react-useeffect-dependency-array` is placed right after
`vue-3-composition-api-patterns` since the two link to each other; publishing them close together
means neither sits with a dangling link to an unpublished article for long. `nuxt-3-seo-guide` is
placed early relative to its low internal-link count today, since publishing it sooner gives it
more time to accumulate external signals before the rest of a future Nuxt cluster arrives.

## Publishing via the CMS

The blog is database-driven (Quill Delta content via `enem-landing-cms`), not a static file
renderer: these Markdown files are drafts to paste into the CMS form, not files the app reads
directly. Frontmatter fields map to the CMS post form (`pages/blog/[id].vue`) as follows:

| Frontmatter field | CMS field | Notes |
|---|---|---|
| `title` | Title | |
| `slug` | *(not editable)* | CMS auto-generates the slug from Title and locks it permanently. The frontmatter `slug` is a planning reference only: it matches what the title is expected to generate. |
| `excerpt` | Excerpt | |
| *(article body)* | Content editor (Quill) | Paste/format the Markdown body into the rich text editor; code blocks need to be re-created as Quill code blocks. |
| *(none)* | Upload cover image | Upload `images/hero.png` here manually; there is no frontmatter-to-upload automation. |
| `categories` | Categories | Create the category in CMS first (`pages/blog/categories`) if it doesn't exist yet. |
| `tags` | Tags | Create the tag in CMS first (`pages/blog/tags`) if it doesn't exist yet. |
| `metaTitle` | Meta Title | |
| `metaDescription` | Meta Description | |
| *(none)* | OG Image URL | Optional; falls back to the cover image if left blank, so it can usually be skipped. |
| `keywords` | *(no CMS field)* | Reference only, for tracking what each article targets, not submitted anywhere. |
| `author` | *(no CMS field)* | The site has a single author with no per-post attribution field; kept in frontmatter for planning only. |
| `date` | *(no CMS field)* | `publishedAt` is set automatically by the CMS when a post is switched from draft to published. |
| `status` | Draft/Published toggle | All 7 articles ship as `status: draft` here: publishing is a manual decision left to the author. |

## Final Quality Check (applies to all 8 articles)

- [x] Search intent defined per article before writing
- [x] One primary keyword per article, no overlap between articles
- [x] Unique title and meta description per article
- [x] Exactly one H1 per article, no heading level skipped
- [x] Original SVG-based diagrams rendered to PNG per article (no stock photos, no third-party
      image licensing needed)
- [x] Descriptive image alt text, no keyword stuffing
- [x] Descriptive internal link anchor text, added only where genuinely helpful
- [x] No fabricated personal projects, clients, metrics, or incidents: claims use "a practical
      approach is..." framing rather than invented first-hand stories
- [x] Technical claims grounded in current, official documentation for each technology
- [x] No application code touched; all output is confined to `articles/`
