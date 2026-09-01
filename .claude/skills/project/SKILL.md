---
name: project
description: >
  Project documentation and local environment setup. Generates PROJECT_GUIDE.md (architecture
  overview) or SETUP_GUIDE.md (installation and run guide), and runs the project locally
  with pre-flight checks. Triggers on requests to document, explain, or get the project running.
---

# Project

Project documentation and local environment setup.

**Available operations:**
- `docs` -- generate or update PROJECT_GUIDE.md (architecture) or SETUP_GUIDE.md (installation)
- `run` -- prepare the environment and run the project locally with pre-flight checks

If no operation is specified, ask: "What do you need? (docs / run)"

---

## Docs

Generate or update one of two documents based on what the user needs.

If the intent is about architecture, explaining the project, or documenting features, target `docs/PROJECT_GUIDE.md`. If it's about setup, installation, or how to run the project, target `docs/SETUP_GUIDE.md`. If unclear, ask: "Architecture guide (PROJECT_GUIDE) or setup/installation guide (SETUP_GUIDE)?"

### Mode A - Architecture (PROJECT_GUIDE.md)

Output: `docs/PROJECT_GUIDE.md`
Load `references/project-guide-structure.md` for document structure and writing style.

If the file already exists, run in update mode:
1. Read the existing file
2. Identify stale or missing sections based on recent code changes
3. Load `references/project-guide-structure.md` only if sections need restructuring
4. Update only affected sections; preserve all manual notes
5. Add a short "Last Updated Changes" summary at the top
6. Stop; do not run the full analysis below

If it does not exist, load `references/project-guide-structure.md` now, then run the analysis:

**Project Overview** -- identify project name, purpose, main domain/business context.

**Tech Stack** -- check `package.json`, `*.config.*`, and lock files. Determine: languages, frameworks/libraries, runtime, package manager, build tools.

**Architecture** -- map the folder structure. Describe: key modules/services, data flow, API/service layers.

**Database Analysis** -- search for ORM imports, migration files, entity definitions. If found: document type (SQL/NoSQL), ORM, main entities, relationships, migration strategy.

**Feature Extraction** -- identify features via routes/pages, modules, domain services, UI flows, controllers. For each feature: name, purpose, key files, user flow (step-by-step), dependencies, API endpoints.

**Feature Flow** -- express each flow as:
   ```
   User action -> System process -> Data change -> Output
   ```
   Avoid deep implementation details unless necessary.

### Mode B - Setup (SETUP_GUIDE.md)

Output: `docs/SETUP_GUIDE.md`
Load `references/setup-guide-structure.md` for the full output template and writing style.

If the file already exists, run in update mode:
Load `references/setup-update-rules.md` only. Do NOT load the full template.
1. Read the existing file in full
2. Compare detected state (dependencies, scripts, env vars) against existing content
3. Update only stale or missing sections
4. Preserve all manually written notes and custom sections
5. Add `Last Updated: {date} - Changes: {one-line summary}` at the top
6. Stop; do not run the full analysis below

If it does not exist, load `references/setup-guide-structure.md` now, then run the analysis:

**Project Overview** -- check root for `README.md`, `package.json`. Identify: project name, purpose, main domain.

**Tech Stack** -- check `package.json`, `*.config.*`, lock files, `Dockerfile`, `docker-compose.*`. Determine: language, runtime version, frameworks, package manager, build tools, infra dependencies.

**Project Structure** -- map the root layout (2-3 levels). Identify key modules, config file locations, env file conventions.

**Environment Variables** -- look for `.env.example`, `.env.sample`, `.env.template`. List required and optional variables with safe example values.

**Setup Steps** -- derive the complete local setup sequence:
   - Prerequisites (tools, runtime versions, services, API keys)
   - Clone & install
   - Environment configuration
   - Database initialization (if any): create -> migrate -> seed
   - Build
   - Run (dev and production modes)
   - Tests (if test runner configured)

**Troubleshooting** -- search for common error patterns. Identify top 3-5 failure points: missing env vars, port conflicts, dependency mismatches, migration errors.

Reference files:

- `references/project-guide-structure.md` -- PROJECT_GUIDE.md document structure, feature template, writing style
- `references/setup-guide-structure.md` -- SETUP_GUIDE.md full output template, section guidance, writing style
- `references/setup-update-rules.md` -- rules for SETUP_GUIDE.md update mode (what counts as stale, what to preserve)

---

## Runner

Prepare the environment and run the project safely and reproducibly.

Every command must run with visible output. Label each check before running it, capture both stdout and stderr, and never swallow output. The developer needs to see exactly what's happening at each step.

### Clarify Run Mode

Ask: **`dev`** (hot-reload) or **`prod`** (requires prior build)? Default to `dev` if not specified.

### Ensure Setup Documentation

If `docs/SETUP_GUIDE.md` exists and contains all four sections (Prerequisites, Installation, Environment Configuration, Running the Project), announce "Setup guide found and complete." and skip.

Otherwise generate or update it first using the Docs section above (Setup mode).

### Pre-flight Checks

Run each check visibly and label it:

| Check | Command | Expectation |
|-------|---------|-------------|
| Node.js version | `node -v` | Matches prerequisites range |
| Package manager | `yarn -v` / `npm -v` | Installed |
| Port availability | `lsof -ti:<port>` | All required ports free |
| Env files | Check file existence | Must exist |

Show raw output for each. Report all failures before proceeding. If a port is in use, show the conflicting process and ask how to proceed.

### Environment Preparation

Announce each sub-step before running it:

1. **"Installing dependencies..."** -> run install command and show output
2. **"Checking env files..."** -> check existence; if missing, ask before creating/overwriting
3. **"Running database setup..."** -> run migrations/seeds if required, show output
4. **"Building..."** -> only if mode is `prod` or SETUP_GUIDE requires it; show build output

### Run Project

Start services in dependency order (e.g., database -> backend -> frontend). For each service, show the PID and wait for startup confirmation before moving to the next.

### Health Check

Run health checks and show results in a table (service, URL/port, status).

If any fail: show the raw output, tail the last 10 lines of the service log, and stop.

### Ready State

```
+----------------------------------------------+
|  All systems go!                             |
|                                              |
|  Backend   -> http://localhost:3008          |
|  Frontend  -> http://localhost:3009          |
|                                              |
|  Mode: dev  |  Stack: Node 14 / Yarn         |
+----------------------------------------------+
```

At the end, summarize: detected stack, steps performed (done/failed/skipped), running services, and next actions.

**Safety Rules:**
- Never overwrite env files without explicit user confirmation
- Never run destructive database commands (drop, truncate, reset) unless explicitly asked
- State all assumptions before running any command
- If unsure about a destructive action, ask first
