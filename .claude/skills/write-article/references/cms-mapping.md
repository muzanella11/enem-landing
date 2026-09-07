# Frontmatter → CMS Field Mapping

The blog is database-driven: content is authored in `enem-landing-cms` as Quill Delta JSON via
`pages/blog/[id].vue`, stored through `CreateBlogPostDto`/`UpdateBlogPostDto` in
`apps/enem-landing-api/src/app/blog/`. There is **no markdown ingestion pipeline**: these
frontmatter fields exist so a human can copy values across into the CMS form by hand, not for any
automated import.

**Re-verify this table before trusting it** (application code may have changed since this file was
written):

```bash
grep -n "label=" apps/enem-landing-cms/app/pages/blog/\[id\].vue
cat apps/enem-landing-api/src/app/blog/dto/create-blog-post.dto.ts
```

## Mapping (last verified 2026-09-07)

| Frontmatter field | CMS form field | Notes |
|---|---|---|
| `title` | Title | |
| `slug` | *(not settable)* | CMS auto-generates from Title server-side and locks it permanently at creation (`BlogPostsService.resolveUniqueSlug`): it is not in `CreateBlogPostDto`/`UpdateBlogPostDto` at all. The frontmatter `slug` is a planning reference for the article's own folder name and expected URL, not something pasted anywhere in the CMS. |
| `excerpt` | Excerpt | |
| *(H1 + body)* | Content editor (Quill, Delta JSON) | Paste/reformat the Markdown body into the rich text editor; fenced code blocks need to become Quill code blocks manually. |
| *(none)* | Upload cover image | Upload `images/hero.png` here manually. No frontmatter field automates this; `featuredImage`/`imageAlt` in frontmatter are just there so the intended image and alt text are documented next to the article. |
| `categories` | Categories (multiselect) | Create the category first under `pages/blog/categories` if it doesn't already exist: there is no seeded/fixed taxonomy. |
| `tags` | Tags (multiselect) | Same as categories: create under `pages/blog/tags` if new. |
| `metaTitle` | Meta Title | |
| `metaDescription` | Meta Description | |
| *(none)* | OG Image URL | Optional in the CMS form; falls back to the cover image when blank. Usually leave blank/skip. |
| `keywords` | *(no CMS field)* | Reference only: tracks what the article targets for `articles/SEO-PLAN.md`, never submitted to the CMS. |
| `author` | *(no CMS field)* | Single-author site by design (see `issues/19-blog.md`, "Out of scope: Multi-author / atribusi penulis"). Keep in frontmatter for planning only. |
| `date` | *(no CMS field)* | `publishedAt` is set automatically by the backend the first time a post is switched from draft to published; there's no manual date field. |
| `status` | Draft/Published toggle | Draft articles produced by this skill should default to `status: draft` in frontmatter: publishing is always a manual decision made by the author in the CMS, never automatic. |

## Frontmatter Template

```yaml
---
title: "..."
slug: "..."
excerpt: "..."
metaTitle: "..."
metaDescription: "..."
categories:
  - "..."
tags:
  - "..."
keywords:
  - "..."
featuredImage: "./images/hero.png"
imageAlt: "..."
status: "draft"
author: "Nurfirliana Muzanella"
date: "YYYY-MM-DD"
---
```
