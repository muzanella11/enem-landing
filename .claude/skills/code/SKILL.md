---
name: code
description: >
  Code health utilities: formatting, dependency auditing, change impact analysis, and TODO/FIXME
  scanning. Triggers on requests to format code, check or audit packages, analyze the blast radius
  of a change, or find tech debt and TODO/FIXME markers across the codebase.
---

# Code

Code health utilities: formatting, dependency auditing, change impact analysis, and TODO/FIXME scanning.

**Available operations:**
- `format` -- format source files using the appropriate formatter for each language
- `deps` -- audit dependencies for outdated versions and security vulnerabilities
- `impact` -- analyze the blast radius of a change and score its risk
- `todo` -- scan and group TODO/FIXME/HACK/BUG markers across the codebase

If no operation is specified, ask: "Which would you like to run? (format / deps / impact / todo)"

---

## Format

Format source files using the appropriate formatter for each language. User overrides in `.claude/settings.local.json` take precedence over defaults.

### User Settings

Check for `.claude/settings.local.json`. If it has a `format` key, merge those settings into the defaults below. User values win on conflict.

```json
{
  "format": {
    "typescript": { "printWidth": 100, "singleQuote": false },
    "python": { "line-length": 100, "formatter": "ruff" },
    "go": { "goimports": true }
  }
}
```

### Default Rules by Language

| Language | Formatter | Defaults |
|----------|-----------|---------|
| TypeScript / JavaScript | Prettier | printWidth: 80, singleQuote: true, trailingComma: "es5", semi: true |
| Python | Black | line-length: 88, target-version: py311 |
| Go | gofmt | standard; add goimports if setting enabled |
| Rust | rustfmt | edition: 2021 |
| Java | google-java-format | AOSP style |
| CSS / SCSS | Prettier | same as JS defaults |
| JSON / YAML | Prettier | tabWidth: 2 |
| PHP | PHP-CS-Fixer | PSR-12 |
| Ruby | RuboCop | default config |
| C / C++ | clang-format | Google style |

### Run

For each target file or directory, check if the formatter is installed. If not, show the install command and stop -- never install automatically.

Apply merged config and preview a unified diff before writing anything:

```bash
# Examples
prettier --check "src/**/*.{ts,tsx,js,jsx,css,json}"
black --diff src/
gofmt -l .
rustfmt --check src/**/*.rs
```

Show the diff, then ask: "Apply these formatting changes? yes / no"

Only write files after explicit confirmation.

### Output

```
+----------------------------------------------------------+
|  Format  .  12 files checked                             |
|                                                          |
|  CHANGED (4)                                             |
|    src/auth/auth.service.ts    -- 14 lines reformatted   |
|    src/user/user.controller.ts -- 3 lines reformatted    |
|    src/app.module.ts           -- 1 line reformatted     |
|    src/main.ts                 -- 2 lines reformatted    |
|                                                          |
|  CLEAN (8)  no changes needed                            |
+----------------------------------------------------------+
```

**Rules:**
- Never write files without explicit confirmation
- Never install formatters automatically; show the install command and stop
- If `.claude/settings.local.json` is missing or has no `format` key, use defaults silently
- Skip generated files: `dist/`, `node_modules/`, `*.lock`, `*.min.js`, `*.min.css`

---

## Deps

Audit project dependencies: outdated versions, security vulnerabilities, and unused packages.

### Detect Package Manager

```bash
ls package.json yarn.lock package-lock.json pnpm-lock.yaml 2>/dev/null
```

### Check for Outdated Packages

```bash
# npm
npm outdated --json 2>/dev/null

# yarn
yarn outdated --json 2>/dev/null

# pnpm
pnpm outdated 2>/dev/null
```

Classify each outdated package by how far behind it is (major/minor/patch).

### Security Audit

```bash
npm audit --json 2>/dev/null
```

Parse results. Show only `critical` and `high` severity vulnerabilities with:
- Package name and version
- Vulnerability description
- Fix available? (yes/no + command)

### Display Summary

```
+------------------------------------------------------------------+
|  Dependency audit  .  142 packages total                         |
|                                                                  |
|  OUTDATED (12)                                                   |
|    HIGH    axios         0.27.2  ->  1.7.0   (major, breaking)  |
|    MEDIUM  dayjs         1.11.7  ->  1.11.13 (minor)            |
|    LOW     prettier      3.2.4   ->  3.3.3   (patch)            |
|    ...                                                           |
|                                                                  |
|  VULNERABILITIES (2)                                             |
|    CRITICAL  lodash@4.17.19  prototype pollution                 |
|              fix: npm install lodash@4.17.21                     |
|    HIGH      axios@0.27.2    SSRF vulnerability                  |
|              fix: npm install axios@1.7.0                        |
+------------------------------------------------------------------+
```

### Offer Actions

```
Actions: [u] show update commands  [f] filter by level  [q] quit
```

- **u** -> output a ready-to-run command to update safe packages (patch/minor only). Separately list major updates that need manual review.
- **f** -> show only HIGH / MEDIUM / LOW
- **q** -> stop

**Safety Rules:**
- Never run `npm install` or update commands automatically:  always show and ask for confirmation
- Never suggest updating major versions without a warning about breaking changes
- Skip `devDependencies` from vulnerability reporting unless user asks

---

## Impact

Evaluate change blast radius, map ripple effects, and quantify risk. Ground every claim in actual code. No generic analysis without evidence.

Load `references/analysis-patterns.md` when the change type matches one of the categories it covers.

### Identify Change Scope

Load `references/analysis-patterns.md` for the matching change type. Skip for trivial isolated renames with no API impact.

### Code Exploration

Dig into the actual code. Record specific files, line numbers, and function names, not just module names.

### Map Dependencies

- **Direct**: files that import or call the changed code
- **Downstream**: components depending on direct-impact areas

### Assess Relevant Impact Dimensions

Evaluate only dimensions applicable to the change:

| Dimension | Evaluate when... |
|-----------|----------------|
| Feature impact | Any change touching user-facing flows |
| Security | Auth, validation, data exposure touched |
| API breaking | Public signatures, endpoints, or events changed |
| Performance | Queries, loops, memory, or network calls modified |
| Cross-service | Shared contracts, events, or SDKs affected |
| Database | Schema, migrations, or ORM entities changed |

### Score Risk

| # | Dimension | Score (1-5) | Reason |
|---|-----------|-------------|--------|
| 1 | Scope Size | | |
| 2 | Criticality | | |
| 3 | Surface Area | | |
| 4 | Change Type | refactor=1-2, logic=3, contract=4-5 | |
| 5 | Test Coverage | low coverage = high score | |
| 6 | Security Impact | | |
| 7 | API Stability | | |
| 8 | Performance | | |
| 9 | Cross-team | | |

**Total (9-45):** 9-18 = Low · 19-31 = Medium · 32-45 = High

**Increase score:** shared util/base class, public API change, auth touched, schema/migration, multi-team, low/no tests.
**Decrease score:** pure internal refactor, isolated well-tested module, additive-only change.

### Output

**Change Summary**: what changed, why, and which files were explored.
**Directly Affected**: specific `file:line` references.
**Indirect Impact**: downstream dependencies found during exploration.
**Feature Impact**:  user-visible or behavioral changes.
**Security & API**: breaking changes or "None identified."
**Risk Matrix**: filled table from Step 5.
**Regression Checklist**: tests to write/update, edge cases, backward compat, monitoring signals.
**Next Steps**: ordered: [Immediate] · [Before release] · [Post-release].

---

## Todo

Scan, group, and manage TODO/FIXME/HACK/NOTE comments across the codebase.

### Scan for Markers

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|NOTE\|OPTIMIZE\|BUG" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.go" --include="*.java" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  .
```

### Classify by Severity

Group by marker type: `FIXME`/`BUG`/`XXX` as high, `HACK` as medium, `TODO`/`OPTIMIZE` as low, `NOTE` as info.

### Display Grouped Summary

```
+----------------------------------------------------------------+
|  Code TODO scan  .  23 items found                             |
|                                                                |
|  HIGH: FIXME / BUG (4)                                        |
|    ! src/auth/auth.service.ts:142     FIXME: token not revoked |
|    ! src/payment/payment.service.ts:87  BUG: race condition    |
|    ...                                                         |
|                                                                |
|  MEDIUM: HACK (6)                                             |
|    ~ src/db/connection.ts:34       HACK: retry workaround      |
|    ...                                                         |
|                                                                |
|  LOW: TODO / OPTIMIZE (13)                                    |
|    + src/reports/report.service.ts:78  TODO: add pagination    |
|    ...                                                         |
+----------------------------------------------------------------+
```

### Offer Actions

```
Actions: [f] filter by severity  [s] sort by file  [e] export to markdown  [q] quit
```

- **f** -> show only HIGH / MEDIUM / LOW
- **s** -> re-render grouped by file path
- **e** -> write `docs/TODO_REPORT.md` with full list, grouped by severity

**Export Format (docs/TODO_REPORT.md):**

```markdown
# TODO Report
Generated: <date>

## High Priority (FIXME / BUG): N items

| File | Line | Comment |
|------|------|---------|
| src/auth/auth.service.ts | 142 | FIXME: token not revoked on logout |

## Medium Priority (HACK): N items
...
```

**Safety Rules:**
- Read-only scan:  no file modifications
- Never modify or delete TODO comments automatically
- Skip binary files, lock files, and generated files (`dist/`, `node_modules/`, `*.lock`)
