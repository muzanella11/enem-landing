# SETUP_GUIDE.md — Output Structure & Writing Guide

## Table of Contents

1. [Output Template](#output-template)
2. [Section Guidance](#section-guidance)
3. [Writing Style](#writing-style)
4. [Update Mode Rules](#update-mode-rules)

---

## Output Template

```markdown
# {Project Name} — Setup Guide

> Last Updated: {date} · Changes: {brief description if updating}

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Build](#build)
9. [Running the Project](#running-the-project)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

{1–3 sentences: what the project does, who uses it, main domain.}

---

## Tech Stack

| Category         | Technology         | Version   |
|------------------|--------------------|-----------|
| Language         | TypeScript         | 5.x       |
| Runtime          | Node.js            | 20.x      |
| Framework        | Next.js            | 14.x      |
| Package Manager  | pnpm               | 9.x       |
| ...              | ...                | ...       |

---

## Project Structure

\`\`\`
project-root/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # Route pages
│   ├── services/       # Business logic
│   └── utils/          # Helpers
├── public/             # Static assets
├── .env.example        # Environment variable template
├── package.json
└── ...
\`\`\`

{1–2 sentences highlighting the most important directories.}

---

## Prerequisites

Before starting, install and configure:

| Requirement     | Minimum Version | Notes                        |
|-----------------|-----------------|------------------------------|
| Node.js         | 20.x            | Use nvm for version management |
| pnpm / npm / yarn | 9.x           | Package manager              |
| Docker          | 24.x            | Required for local database  |
| ...             | ...             | ...                          |

**Accounts / API Keys required:**
- `SERVICE_NAME` — [how to obtain]

---

## Installation

\`\`\`bash
# 1. Clone the repository
git clone <repo-url>
cd <project-directory>

# 2. Install dependencies
pnpm install
\`\`\`

---

## Environment Configuration

\`\`\`bash
# Copy the example environment file
cp .env.example .env
\`\`\`

Edit `.env` and fill in the required values:

| Variable               | Required | Example Value         | Description                  |
|------------------------|----------|-----------------------|------------------------------|
| `DATABASE_URL`         | Yes      | `postgres://...`      | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL`  | Yes      | `http://localhost:3000` | Base API URL               |
| `SECRET_KEY`           | Yes      | *(generate securely)* | Session secret               |
| `OPTIONAL_FEATURE_FLAG`| No       | `true`                | Enables X feature            |

> Never commit real credentials. Use `.env.example` for reference only.

---

## Database Setup

{Omit this section if the project has no database.}

\`\`\`bash
# Create the database
createdb my_database

# Run migrations
pnpm db:migrate

# (Optional) Seed with sample data
pnpm db:seed
\`\`\`

**ORM / Driver:** {name}
**Migration tool:** {name}

---

## Build

\`\`\`bash
# Development build (with watch mode)
pnpm dev

# Production build
pnpm build
\`\`\`

Output artifacts are written to `{dist/build/.next/etc.}`.

---

## Running the Project

\`\`\`bash
# Development mode (hot reload)
pnpm dev
# → http://localhost:3000

# Production mode (after build)
pnpm start
# → http://localhost:3000
\`\`\`

{Mention background jobs, workers, or additional services if applicable.}

---

## Testing

{Omit this section if no tests are configured.}

\`\`\`bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
\`\`\`

**Test types:** unit, integration, e2e
**Coverage tool:** {Vitest / Jest / etc.}

---

## Troubleshooting

### `MODULE_NOT_FOUND` or missing package error
Run `pnpm install` again. If the issue persists, delete `node_modules` and reinstall.

### Port already in use (EADDRINUSE)
Another process is using port 3000. Stop it with:
\`\`\`bash
lsof -ti:3000 | xargs kill
\`\`\`

### Database connection refused
Ensure the database service is running and `DATABASE_URL` in `.env` is correct.

### Migration failed
Check that the database exists and credentials are correct. Run `pnpm db:migrate` again.

### Environment variable not picked up
Restart the dev server after editing `.env`. Some frameworks require a full restart.
```

---

## Section Guidance

### Project Overview
- Keep to 1–3 sentences.
- Mention the primary user/audience.
- Do not describe architecture — save that for Project Structure.

### Tech Stack table
- Include all first-class dependencies.
- Specify versions to avoid "works on my machine" issues.
- Skip transitive/internal-only packages.

### Project Structure tree
- Show 2–3 levels deep, no more.
- Annotate each directory with a brief comment.
- Highlight any non-obvious conventions (e.g., co-located tests, generated code).

### Prerequisites table
- List only what a fresh machine needs.
- Include the minimum version, not "latest".
- Add a "Notes" column for install tips (e.g., "use nvm", "requires Docker Desktop").

### Environment Variables table
- Mark each variable Required/Optional.
- Provide safe example values (not real secrets).
- Add a description so developers understand the impact of each variable.

### Troubleshooting
- Write symptom → cause → fix, not just the fix.
- Cover the top 3–5 most likely failure points.
- Include runnable commands where possible.

---

## Writing Style

- **Use numbered steps** for sequential actions.
- **Use code blocks** for every command, path, and filename.
- **Explain the why** when a step is not self-evident.
- **Active voice**: "Run migrations" not "Migrations should be run".
- **No assumptions**: state explicitly when a prerequisite must be installed/configured.
- **Avoid speculation**: only document what is verifiable in the codebase.
- **Omit empty sections**: skip Database Setup, Testing, etc. when they don't apply.

---

## Update Mode Rules

When `SETUP_GUIDE.md` already exists:

1. Read the file in full before making any changes.
2. Compare detected state (dependencies, scripts, env vars) against existing content.
3. Update only sections that are stale or missing information.
4. Preserve any manually written notes or custom sections.
5. Add a `Last Updated` line at the top with the date and a one-line change summary.
6. Do not reformat or reorganise sections that are already correct.
