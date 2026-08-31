---
name: scan
description: >
  Security scanning for the codebase: detect committed secrets and common vulnerabilities
  (SQL injection, XSS, command injection, path traversal). Triggers on requests to scan
  for secrets, leaked credentials, API keys, or security issues.
---

# Scan

Security scanning: detect committed secrets and scan source code for common vulnerabilities.

**Available operations:**
- `secrets` -- scan working directory and git history for leaked credentials, API keys, and tokens
- `security` -- scan source code for common vulnerabilities (SQL injection, XSS, command injection, path traversal)

If no operation is specified, ask: "Which scan do you want to run? (secrets / security)"

---

## Secrets

Scan the codebase and git history for accidentally committed secrets, API keys, tokens, and passwords.

### Scan Working Directory

```bash
grep -rn \
  -e "password\s*=\s*['\"][^'\"]\+['\"]" \
  -e "api_key\s*=\s*['\"][^'\"]\+['\"]" \
  -e "apikey\s*=\s*['\"][^'\"]\+['\"]" \
  -e "secret\s*=\s*['\"][^'\"]\+['\"]" \
  -e "token\s*=\s*['\"][^'\"]\+['\"]" \
  -e "private_key\s*=\s*['\"][^'\"]\+['\"]" \
  -e "AWS_SECRET\|GITHUB_TOKEN\|SLACK_TOKEN\|SENDGRID_API" \
  -e "-----BEGIN.*PRIVATE KEY-----" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --include="*.env*" --include="*.json" --include="*.yaml" --include="*.yml" \
  --include="*.py" --include="*.go" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  --exclude="*.lock" \
  . 2>/dev/null
```

### Scan Git History (Last 50 Commits)

```bash
git log --oneline -50 --all | while read hash msg; do
  git show $hash -- "*.env*" "*.json" 2>/dev/null | grep -l \
    "password\|api_key\|secret\|token\|private_key" 2>/dev/null
done
```

Flag commits where `.env` files or config files were modified.

### Check .gitignore Coverage

```bash
cat .gitignore 2>/dev/null | grep -E "\.env|secrets|credentials|\.key|\.pem"
```

Report any missing patterns:
- `.env` not ignored -> HIGH risk
- `.env.local`, `.env.production` not ignored -> MEDIUM risk

### Display Results

```
+------------------------------------------------------------------+
|  Secret scan results                                             |
|                                                                  |
|  CRITICAL: Potential secrets in code (3)                        |
|    ! src/config/database.ts:14                                   |
|      password = "mypassword123"                                  |
|    ! apps/backend/src/mail.config.ts:8                           |
|      apiKey = "SG.xxxx..."                                       |
|                                                                  |
|  WARNING: .gitignore gaps (1)                                   |
|    ~ .env.production is not covered by .gitignore                |
|                                                                  |
|  HISTORY: Sensitive files in recent commits (1)                 |
|    ~ commit a1b2c3d: .env file was modified (2026-01-10)         |
+------------------------------------------------------------------+
```

### Offer Remediation Guidance

For each CRITICAL finding, show remediation steps:

1. **Replace hardcoded value** with environment variable reference
2. **Rotate the secret** immediately if it was ever pushed to remote
3. **Add to .gitignore** if the file should not be tracked
4. **Remove from git history** if committed: `git filter-repo` or BFG Repo Cleaner

Ask: "Show remediation steps for a specific finding? yes / no"

**Safety Rules:**
- Read-only scan:  never modify files automatically
- Never display full secret values in output: mask after first 4 chars (e.g. `ghp_xxxx...`)
- Do not scan binary files or `node_modules/`
- If a committed secret is found in history, strongly recommend rotating it immediately regardless of branch visibility

---

## Security

Scan source code for common security vulnerabilities based on OWASP Top 10 patterns.

**Vulnerability Coverage:**

| Category | What's Checked |
|----------|---------------|
| SQL Injection | Raw string interpolation in queries |
| XSS | Unescaped user input in HTML/template output |
| Path Traversal | User input used directly in file paths |
| Insecure Direct Object Reference | Unvalidated IDs from request params |
| Hardcoded Credentials | Passwords/keys in source (use Secrets section for deeper scan) |
| Insecure Deserialization | `eval()`, `JSON.parse` without validation |
| Missing Auth Check | Routes/endpoints without auth middleware |
| Unsafe Regex | ReDoS-vulnerable patterns |
| Command Injection | `exec()`/`spawn()` with user input |

### Detect Tech Stack

```bash
cat package.json | grep -E '"dependencies"|"devDependencies"' -A 50 | head -60
```

### Run Pattern Scans

Run each check visibly with a label before each:

**SQL Injection:**
```bash
grep -rn \
  -e "query\s*(\`\|query\s*(\".*\${\|query\s*('.*+" \
  -e "\.raw(\|\.execute(\|createQueryBuilder" \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules .
```

**XSS - innerHTML / dangerouslySetInnerHTML:**
```bash
grep -rn "innerHTML\s*=\|dangerouslySetInnerHTML\|document\.write(" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules .
```

**Command Injection:**
```bash
grep -rn "exec(\|execSync(\|spawn(\|spawnSync(" \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules .
```

**Path Traversal:**
```bash
grep -rn "readFile\|writeFile\|createReadStream\|path\.join\|path\.resolve" \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules . \
  | grep -v "\.spec\.\|\.test\."
```

**eval / unsafe deserialization:**
```bash
grep -rn "\beval\b\|new Function(\|JSON\.parse.*req\." \
  --include="*.ts" --include="*.js" --exclude-dir=node_modules .
```

### Analyze Findings

For each match, assess context:
- Is the input from a user-controlled source (`req.body`, `req.params`, `req.query`)?
- Is there input validation or sanitization before the operation?
- Is there an ORM/parameterized query used, or raw string interpolation?

Classify:
- **CRITICAL**: direct user input flows into dangerous operation with no sanitization
- **WARNING**: pattern present, needs manual review to confirm exploitability
- **INFO**: pattern exists but appears safe in context

### Display Results

```
+----------------------------------------------------------------------+
|  Security scan  .  9 findings                                        |
|                                                                      |
|  CRITICAL (2)                                                        |
|    ! SQL Injection                                                   |
|      src/report/report.repository.ts:67                             |
|      query(`SELECT * FROM users WHERE name = '${req.query.name}'`)  |
|                                                                      |
|    ! Command Injection                                               |
|      src/export/export.service.ts:112                               |
|      exec(`convert ${req.body.filename} output.pdf`)                |
|                                                                      |
|  WARNING (4)                                                         |
|    ~ XSS risk: dangerouslySetInnerHTML                              |
|      apps/frontend/src/components/RichText.tsx:23                   |
|    ~ Path traversal: readFile with param                            |
|      src/files/file.service.ts:45                                   |
|    ...                                                               |
|                                                                      |
|  INFO (3)                                                            |
|    - eval() detected but in test file (likely safe)                  |
|    ...                                                               |
+----------------------------------------------------------------------+
```

### Show Fix Guidance

For each CRITICAL finding, show a concrete fix example.

**SQL Injection fix:**
```typescript
// Vulnerable
query(`SELECT * FROM users WHERE name = '${req.query.name}'`)

// Fixed:  use parameterized query
query(`SELECT * FROM users WHERE name = $1`, [req.query.name])
// Or use ORM: User.findOne({ where: { name: req.query.name } })
```

Ask: "Show fix for a specific finding? yes / no"

**Safety Rules:**
- Read-only analysis:  never modify source files automatically
- Flag patterns as WARNING when context is unclear:  do not over-report as CRITICAL
- Exclude `*.spec.ts`, `*.test.ts`, and `node_modules/` from all scans
- This is a static analysis tool: not a substitute for a full penetration test
