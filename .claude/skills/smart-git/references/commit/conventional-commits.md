# Commit Message Convention

## Format

```
type: short description
```

Optional body (blank line after subject):
```
type: short description

Longer explanation of why the change was made, what problem it solves,
or any context that isn't obvious from the subject line alone.
```

---

## Type Reference

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New feature, new endpoint, new UI component, new capability | `feat: add guest export to CSV` |
| `fix` | Bug fix — something was broken, now it's not | `fix: guest list not refreshing after delete` |
| `hotfix` | Urgent / critical fix that needs immediate attention | `hotfix: kiosk session not clearing on back button` |
| `refactor` | Code restructure — same behavior, cleaner implementation | `refactor: extract sort order logic into shared util` |
| `chore` | Deps, config, build scripts, tooling, version bumps | `chore: bump backend dependencies` |
| `test` | Adding or updating tests only | `test: add unit tests for purpose sort order` |
| `docs` | Documentation only — no code change | `docs: update SETUP_GUIDE with Node version warning` |
| `feedback` | Addressing review comments / feedback | `feedback: use updateBulk in updateSortOrder to avoid N+1` |
| `perf` | Performance improvement — measurable speedup | `perf: batch sort order updates in single transaction` |
| `ci` | CI/CD pipeline, GitHub Actions, workflow files | `ci: add Node 14 version check to build workflow` |
| `style` | Formatting only — whitespace, semicolons, no logic change | `style: fix indentation in purpose.service.ts` |

---

## Rules

### Subject line
- Max **72 characters**
- **Lowercase** — no capital first letter
- **No trailing period**
- **Imperative mood** — "add", "fix", "remove", not "added", "fixing", "removed"
- Describes **what** the change does, not how

### Body (optional)
- Separated from subject by a **blank line**
- Wrap at **100 characters**
- Explains **why**, not what (the diff shows what)
- Use bullet points for multi-part changes

### PR reference (optional)
- Append `(#123)` at end of subject for PR-linked commits: `feat: add vendor management (#88)`

---

## Choosing the Right Type

**Ambiguous cases:**

| Situation | Use |
|-----------|-----|
| New API endpoint + service + migration | `feat` (it's a new capability) |
| Fix a bug introduced in this branch | `fix` |
| Remove dead code / unused imports | `refactor` |
| Update `.env.example` or config template | `chore` |
| Rename a variable or extract a function | `refactor` |
| Add seed data or migration only | `chore` |
| Revert a commit | `revert: <original message>` |
| Mixed changes (unrelated) | Split into multiple commits |

---

## Project Examples (from git log)

```
feat: csv automatic export improvement (#74)
fix: logic change cron expression time
hotfix: kiosk entry not prune state when click back button (#100)
hotfix: add language switch kiosk (#99)
chore: add missing field
chore: bump version
feedback: pin update frequency in date schedule (#76)
refactor: extract department sort order into dedicated method
```
