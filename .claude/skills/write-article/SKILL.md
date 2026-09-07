---
name: write-article
description: >
  Write SEO-optimized draft articles (content + hero image) for the muzanella.com blog and save
  them to articles/. Covers topic/keyword selection, CMS-aligned frontmatter, natural non-AI-sounding
  prose, an original SVG-diagram hero image, and updating articles/SEO-PLAN.md. Never touches
  application code. Triggers on requests to write a blog article, draft SEO content, create an
  article, or add to the article batch.
---

# Write Article

Produces one or more SEO-oriented Markdown draft articles for muzanella.com's personal portfolio
blog, each with an original hero diagram, saved under `articles/<slug>/`. This skill never
creates blog features, never edits application code (`apps/`, `libs/`), and never touches the
database: the blog is CMS/database-driven (Quill Delta content via `enem-landing-cms`), and this
skill's entire output is Markdown + PNG files the author manually pastes into the CMS.

**Available operations:**
- `new`: write one new article on a given topic or keyword (or let the skill pick one from the
  existing topic clusters if none is specified)
- `batch`: write several articles (5-8) covering multiple topic clusters in one pass
- `audit`: review existing articles in `articles/` against the quality checklist without writing
  new content

If no operation is specified but a topic/keyword is given, assume `new`. If neither is given, ask:
"One article on a specific topic, or a batch across clusters?"

Reference files (load before the corresponding step, not all at once):
- `references/writing-standards.md`: voice, structure, natural/non-AI-detectable writing rules,
  what never to fabricate, the full quality checklist
- `references/cms-mapping.md`: how frontmatter fields map to the actual CMS post form; **always
  re-verify against the live CMS form and DTO before trusting this file**, since application code
  can change after this skill was written
- `references/image-pipeline.md`: how to generate an original SVG diagram and render it to
  `hero.png` via headless Chromium (Playwright), with no new tool installs

---

## Step 1: Confirm Scope

Before writing anything, check `articles/SEO-PLAN.md` if it exists, to see which clusters and
keywords are already covered. Don't duplicate a primary keyword or produce two articles that
answer the same search intent.

For `new`: confirm (or choose) primary keyword, target audience, the specific problem it solves,
and which existing article cluster it belongs to (Node.js/Backend, Vue/Frontend, Nuxt,
Docker/DevOps, or a new cluster if the author's stated expertise supports it: see
`references/writing-standards.md` for the full tech list and keyword strategy).

For `batch`: pick 5-8 topics spanning at least 2 clusters, favoring long-tail keywords with clear
search intent over broad/competitive terms (never target bare terms like "Docker", "Vue.js",
"Node.js" alone). Avoid near-duplicate topics within the batch.

For `audit`: skip to the checklist in `references/writing-standards.md` and report findings
per article; do not modify files unless asked.

## Step 2: Scaffold the Folder

```text
articles/<article-slug>/
├── <article-slug>.md
└── images/
    └── hero.png
```

`<article-slug>` is the expected CMS-generated slug: lowercase, hyphen-separated, derived from
the title. Use `mkdir -p articles/<slug>/images` before writing files into it.

## Step 3: Write the Article Body

Load `references/writing-standards.md` first. It covers:
- structure (H1 → Introduction → sections → common mistakes → best practices → FAQ if relevant →
  conclusion → references), with correct heading hierarchy
- voice and first-hand-expertise framing without fabricating experience
- **how to avoid sounding AI-generated**: sentence rhythm, banned filler phrases/openers,
  avoiding uniform paragraph/list cadence, no AI attribution or disclosure text anywhere in the
  content
- internal linking rules (only when genuinely useful, descriptive anchor text, update the
  linked-to article too if a reciprocal link makes sense)
- technical accuracy sourcing (official docs only, version-aware claims)

Write the frontmatter using `references/cms-mapping.md` for the field set, but confirm the
mapping is still accurate first (see Step 5).

## Step 4: Generate the Hero Image

Load `references/image-pipeline.md`. Design a small, original flow/architecture diagram that
actually explains a mechanism from the article (not decoration), build it as SVG using the shared
helper pattern described there, and render it to `articles/<slug>/images/hero.png` via headless
Chromium: no new system packages, no stock photos, no third-party image licensing needed.

## Step 5: Verify the CMS Field Mapping Is Still Current

Before finalizing frontmatter field names, spot-check that `references/cms-mapping.md` still
matches reality:

```bash
grep -n "label=" apps/enem-landing-cms/app/pages/blog/\[id\].vue
cat apps/enem-landing-api/src/app/blog/dto/create-blog-post.dto.ts
```

If the fields differ from what's documented in `references/cms-mapping.md`, update that reference
file to match before writing frontmatter: the goal is frontmatter the author can paste straight
across into the CMS form without translation.

## Step 6: Update `articles/SEO-PLAN.md`

Create it if it doesn't exist (use the table format and sections already established in this
repo's `articles/SEO-PLAN.md`, if present, as the template). Otherwise, append a row per new
article to the table, and update the cluster/internal-linking narrative sections to mention the
new article and any links it added to or received from existing articles.

## Step 7: Final Check and Summary

Run through the quality checklist in `references/writing-standards.md` for every article written
this run. Then report:

```text
Articles created:
1. ...

SEO clusters touched:
- ...

Primary keywords:
- ...

Files created:
- ...
```

**Never do any of the following:** create or modify blog application code, routing, CMS forms,
database migrations, or the article renderer; add AI attribution or disclosure text to article
content; fabricate personal projects, clients, metrics, or incidents; claim guaranteed search
rankings.
