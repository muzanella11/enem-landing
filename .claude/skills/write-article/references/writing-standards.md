# Writing Standards for muzanella.com Blog Articles

## Author Context (do not deviate without asking)

The site belongs to **Nurfirliana Muzanella**, positioned as a **Frontend Engineer / Full Stack
JavaScript Developer**. Grounded expertise: JavaScript, TypeScript, Vue.js (Vue 2 Composition API,
Vue 3), Nuxt, React, Next.js, Node.js, NestJS, Express, Firebase, Firestore, PostgreSQL, MySQL,
MariaDB, SQLite, TypeORM, Knex, Redis, RabbitMQ, Docker, Cloudflare, VPS, GitHub Actions, Nx
monorepo, Playwright, Cypress, Jest, Webpack, Vite.

**Never fabricate** personal projects, clients, production incidents, performance numbers, or
business outcomes that weren't given. When the article needs first-hand-sounding framing, use
phrasing like "A practical approach is..." or "One pattern that holds up in real projects is...";
never invent a specific story to sound authentic.

## Goal

Organic search visibility and topical authority for muzanella.com. **Never claim or imply an
article is guaranteed to rank on page one of Google**: frame outcomes as realistic SEO practice
(search intent, long-tail targeting, helpful content, internal linking), not guarantees.

## Keyword Strategy

- One primary keyword per article, several secondary keywords, related terms/entities.
- Long-tail only. Never target bare head terms alone: "JavaScript", "Docker", "Vue.js", "Node.js",
  "React" are too competitive and too broad to be the primary keyword.
- Before writing, define explicitly (doesn't need to appear in the published article, but decide
  it first): primary keyword, search intent, target audience, the problem, the expected answer,
  related queries.
- Don't force a keyword unnaturally into a sentence. No keyword stuffing, ever.

## Topic Clusters

Prioritize these unless the author specifies otherwise:
- **Node.js / Backend**: env vars, NestJS structure/error handling/auth architecture, REST API
  architecture
- **Vue / Frontend**: Composition API, composables, state management, component architecture,
  performance
- **Nuxt**: SEO, SSR, SSG, performance, routing
- **Docker / DevOps**: fundamentals for Node.js devs, Compose, production images, multi-stage
  builds, networking

Don't force every example topic into existence: pick the strongest, least-overlapping subset.
Check `articles/SEO-PLAN.md` (if present) before choosing, to avoid duplicating an existing
primary keyword or search intent.

## Article Quality Bar

Avoid generic "What is X?" articles unless there's a genuinely specific angle. Prefer:
- "Docker Fundamentals for Node.js Developers" over "What is Docker?"
- "How to Structure a NestJS Project with TypeScript" over "What is NestJS?"

Every article must answer a real developer problem, not just define a term. Length follows
complexity: a focused ~1,200-1,900 words beats a padded 3,000. Never add a paragraph solely to
raise word count; every paragraph should carry information the reader didn't already have.

## Structure (required)

```text
H1
Introduction (state the problem directly, answer search intent, say what the reader will learn)
Main sections (## then ### as needed: never skip from H1 straight to H4)
Practical examples, code where relevant
Common Mistakes
Best Practices
FAQ (only if genuinely useful: skip if forced)
Conclusion
References
```

**Introduction bans:** never open with "In today's fast-paced digital world...", "Technology is
evolving rapidly...", or any equivalent generic scene-setting. Start on the actual technical
problem in the first sentence.

## Code Examples

Valid, minimal, and load-bearing for the concept being explained: never added just to make the
article look longer or more substantial. Prefer a well-commented ~10-30 line snippet that
demonstrates one idea clearly over a long file dump.

## First-Hand Expertise Voice

Include trade-offs, architectural reasoning, common mistakes, "when to use / when not to",
maintainability and production considerations where relevant. Don't just state a rule: explain
*why* it exists. Example: not "use Docker volumes for persistence" alone, but why containers are
disposable, when a volume is the right tool, and when a managed service is the more pragmatic
choice instead.

## Writing So It Doesn't Read as AI-Generated

This matters both for reader trust and because generic-sounding AI content tends to underperform
in search regardless of technical accuracy. Concretely:

- **No em dash character in the output, anywhere, including this file.** Use commas, parentheses,
  or split into two sentences instead.
  This is a hard rule for this codebase (see `.claude/rules/core-conventions.md`), and also
  happens to be one of the most common AI-writing tells: doubly worth enforcing here.
- **Vary sentence length and structure.** A paragraph of uniformly medium-length sentences reads
  as machine-generated. Mix a short, direct sentence next to a longer one that carries a
  qualification or trade-off.
- **Avoid AI-cliché transition and hedge phrases.** Don't use: "It's important to note that...",
  "In conclusion,", "Moreover,", "Furthermore,", "That being said,", "At the end of the day,",
  "It's worth noting...", "Let's dive in", "In today's...", "delve into", "In the world of...",
  "seamless(ly)", "robust" (as filler), "leverage" (as a verb for "use"), "unlock the power of".
  Say the thing directly instead.
- **Don't over-use bullet lists as a crutch.** A list is for genuinely parallel, scannable items
  (a checklist, a set of flags). Explaining reasoning, trade-offs, or a sequence of cause and
  effect belongs in prose, not a bulleted breakdown of every sentence.
- **Don't restate the intro in the conclusion.** A conclusion that just re-summarizes what was
  already said reads as template filler. Give it one genuinely useful closing thought instead
  (the core mental model to hold onto, the next thing to learn).
- **No meta-commentary about the writing itself.** Never write things like "In this article, we
  will explore..." followed later by "As we've explored in this article...". State things once,
  directly.
- **Never add AI attribution, disclosure, or generation notices anywhere in article content.**
  No "Generated by AI", no "Written with Claude", no model name, no watermark, no note in
  frontmatter or body. This applies regardless of what attribution rules apply to git commits;
  article content is a published-facing deliverable, and none of that machinery belongs in it.
- Vary how each article opens its Common Mistakes / Best Practices sections rather than using an
  identical template phrase across every article in a batch: check the other files already in
  `articles/` for phrasing that's already been used, and don't repeat it verbatim.

## Internal Linking

Only link when it genuinely helps the reader continue a thought: never to hit a link quota. Use
descriptive anchor text naming the actual topic of the linked article (never "click here", "read
more", "this article", "here"). When adding a link from article A to article B, consider whether a
reciprocal link from B to A is also genuinely useful (not automatic): see how the existing
articles cross-link within `articles/*/*.md` for the pattern.

## Technical Accuracy

Prioritize official documentation over third-party blog posts: MDN, Vue docs, Nuxt docs, Node.js
docs, NestJS docs, Docker docs, TypeScript docs, Firebase docs, Cloudflare docs, Google Search
Central. Don't invent API behavior. If something is version-dependent, say so explicitly rather
than presenting one version's behavior as universal.

## Frontmatter

See `references/cms-mapping.md` for the exact field set and how it maps to the CMS post form.
**Verify that file is still current before trusting it**, per Step 5 in `SKILL.md`.

## Quality Checklist (run before finishing)

```text
[ ] Search intent defined before writing (even if not printed in the article)
[ ] Primary keyword clear, not stuffed
[ ] Title unique across articles/
[ ] Meta description unique, roughly 150-160 characters
[ ] Exactly one H1; heading hierarchy never skips a level
[ ] Genuinely helpful, not filler; no paragraph added purely for word count
[ ] No keyword stuffing
[ ] No fabricated experience, projects, clients, or metrics
[ ] Code examples are valid and minimal
[ ] Internal links are relevant, not forced, descriptive anchor text
[ ] hero.png exists and is an original diagram relevant to the content
[ ] Image alt text is descriptive, not keyword-stuffed
[ ] Slug is SEO-friendly (lowercase, hyphenated) and folder name matches it
[ ] Not a near-duplicate of an existing article in articles/
[ ] No AI attribution or generation disclosure anywhere in the content
[ ] Reads as varied, human prose: no banned filler phrases, no em dashes, no uniform sentence
    cadence
[ ] Technical claims match current official documentation
```
