---
name: manual-deploy-prod
description: >
  Manually build, push, and roll out prod images to the VPS without going through GitHub
  Actions (mau-apps-prod.yml) - for when GH Actions is rate-limited or otherwise unavailable.
  Triggers on requests to deploy manually, deploy from local, or bypass GitHub Actions for a
  prod release.
---

# Manual Deploy to Prod

Reproduces what `.github/workflows/mau-apps-prod.yml` + `build-push.yml` +
`infra/ansible/playbooks/deploy.yml` do on a `v*.*.*` tag push, but run locally. Use this when
GitHub Actions minutes/quota are exhausted and a fix needs to reach prod before quota resets.

**Why this is safe for the automated pipeline later:** `compose.prod.yml` pins every service to
the floating `ghcr.io/muzanella11/<app>:prod` tag, and `docker stack deploy` /
`docker service update` are idempotent (see comments in `infra/ansible/playbooks/deploy.yml`).
This flow never pushes a git tag, so it never triggers `mau-apps-prod.yml` and never touches
GHCR's immutable `vX.Y.Z` tags. When Actions quota comes back and a real `v*.*.*` tag is pushed,
that run rebuilds everything fresh and redeploys normally - no conflict with anything done here.

**This is a production action.** Confirm scope with the user before running anything (which
apps, whether to redeploy or just build+push), and confirm again before the actual prod rollout
step (Step 5) since it touches every service if run for all apps.

## Prerequisites

- Docker Desktop running locally, logged out of `ghcr.io` beforehand (check with
  `docker system info` / `cat ~/.docker/config.json`)
- A GitHub PAT with `write:packages` scope stored at `.claude/config.local.yaml` under
  `ghcr.pat` (see `.claude/rules/ai-config.md` for the config file convention). **Never**
  hardcode a PAT value into this skill file or any other tracked file - `config.local.yaml`
  is gitignored specifically for this. If the key is missing, ask the user to generate one at
  https://github.com/settings/tokens (classic token, `write:packages` scope, short expiry is
  fine since it's only used for manual deploys) and add it there.
- SSH access to prod (`mauuu-prod` alias in `~/.ssh/config` at time of writing)

## Step 1 - Confirm Scope

Check what actually changed since the last release tag:

```bash
git describe --tags --abbrev=0   # e.g. v0.0.22
git log <last-tag>..HEAD --oneline
git diff <last-tag>..HEAD --stat
```

If nothing changed outside one or two apps, ask the user whether to build+deploy just the
affected apps or all 14 (a full release always rebuilds everything - see the comment in
`build-push.yml` about why: an app can silently "lose" a change if a past release's E2E gate
failed before its build-push ran). Get the full app list from Nx:

```bash
node_modules/.bin/nx show projects --type=app --json
```

## Step 2 - Build via Nx

Use the Node version pinned in `.nvmrc` to match CI exactly:

```bash
source ~/.nvm/nvm.sh && nvm use "$(cat .nvmrc)"
node_modules/.bin/nx run-many -t build --projects=<app1>,<app2>,...
```

## Step 3 - Build and Push Docker Images

**Prod is `linux/amd64` (a standard x86_64 VPS) - always pass `--platform linux/amd64`
explicitly.** Confirmed 2026-08-30: building without it on an Apple Silicon (arm64) laptop
silently produces an arm64-only image (`docker build` defaults to the *host's* architecture,
not the target's). GHCR happily accepts the push, `docker service update` on prod happily
*accepts* the update too, and only fails asynchronously when Swarm actually tries to schedule
the task - by which point the command has already returned success. All 14 services were
"deployed" this way with zero actual effect before this was caught. Never skip `--platform`,
and don't trust that a build without it "probably matches" just because past builds happened to
work - verify per Step 3b below instead.

Read the PAT from `.claude/config.local.yaml` (`ghcr.pat`) without ever printing it, and log in:

```bash
python3 -c "import yaml; print(yaml.safe_load(open('.claude/config.local.yaml'))['ghcr']['pat'])" \
  | docker login ghcr.io -u muzanella11 --password-stdin
```

For each app in scope (Dockerfile target name == app name):

```bash
docker build --platform linux/amd64 --target "$app" -t "ghcr.io/muzanella11/$app:prod" .
docker push "ghcr.io/muzanella11/$app:prod"
```

Then `docker logout ghcr.io` locally (don't leave credentials cached).

### Step 3b - Verify Architecture Before Trusting the Push

Don't skip this - it's the check that would have caught the bug above before it reached prod:

```bash
docker image inspect "ghcr.io/muzanella11/$app:prod" --format '{{.Architecture}}'   # must print "amd64"
```

For extra certainty after push, check what GHCR actually has (must show an `amd64` platform
entry, not just `arm64`/`unknown`):

```bash
docker manifest inspect "ghcr.io/muzanella11/$app:prod" | grep -A3 '"platform"'
```

## Step 4 - Confirm Before Touching Prod

Before rolling anything out, explicitly confirm with the user: which services, and that this
is a live production rollout. Don't skip this even if Steps 1-3 were already approved - building
and pushing images is reversible/inert, rolling them out to prod is not.

## Step 5 - Roll Out on Prod (one service at a time)

Prod is a 2GB RAM VPS - rolling out all services simultaneously previously caused resource
contention severe enough to make the SSH/sudo session itself unresponsive (see the 2026-08-28
header comment in `infra/ansible/playbooks/deploy.yml`). Always roll out one service at a time,
waiting for convergence before moving to the next.

Log in to GHCR on the prod host too (needed for `--with-registry-auth` to actually pull):

```bash
python3 -c "import yaml; print(yaml.safe_load(open('.claude/config.local.yaml'))['ghcr']['pat'])" \
  | ssh mauuu-prod "docker login ghcr.io -u muzanella11 --password-stdin"
```

Service names on the Swarm are `mau-apps_<app>` (confirm with
`ssh mauuu-prod "docker service ls --format '{{.Name}}'"` - don't assume, names occasionally
drift from the app list). For each app in scope, roll out and wait up to 3 minutes for
convergence before continuing:

**Always pass `--force`.** `compose.prod.yml` pins every service to the floating `:prod` tag,
and `docker service update --image` diffs the image *string*, not the digest it resolves to. If
the string is byte-identical to what the service is already running (which it always is here,
since the tag never changes), Swarm treats the update as a no-op on the *spec* - it still prints
the full `overall progress` / `verify: ... converged` sequence and creates a new task ID, but the
node never actually re-pulls, and the old container just keeps running unchanged. Confirmed
2026-08-30: a rollout without `--force` "converged" in seconds and reported `1/1`, but
`docker inspect` on the running container's `.Image` still showed the pre-deploy digest, not the
one just pushed. Only re-running the identical command with `--force` triggered a real pull (took
~1-3 minutes instead of seconds) and produced a container with the correct new digest. Never trust
a "converged" or `1/1` result alone as proof the new image is live - see the digest verification
step below, which is what actually caught this.

```bash
ssh mauuu-prod bash -s <<'EOF'
svc="mau-apps_<app>"
docker service update --force --image "ghcr.io/muzanella11/<app>:prod" --with-registry-auth "$svc"
for _ in $(seq 1 36); do
  replicas=$(docker service ls --format '{{.Name}} {{.Replicas}}' | awk -v s="$svc" '$1==s{print $2}')
  current="${replicas%/*}"; desired="${replicas#*/}"
  [ -n "$current" ] && [ "$current" = "$desired" ] && break
  sleep 5
done
echo "$svc -> $replicas"
EOF
```

**This replica-count check is NOT sufficient on its own - confirmed 2026-08-30 it gives a false
"converged" reading when every new task is being rejected.** These services use `start-first`
update order: the old task keeps running (holding replicas at 1/1) while the new task is
rejected and retried in the background, so the loop above exits "converged" almost immediately
even though nothing actually changed. Always follow up with a check of the **running task's
actual image digest**, not just the replica count:

```bash
ssh mauuu-prod "docker service ps mau-apps_<app> --no-trunc --format '{{.Image}} {{.CurrentState}} {{.Error}}' | head -3"
```

The `Running` row's image must show the digest you just pushed (`docker inspect
ghcr.io/muzanella11/<app>:prod --format '{{.Id}}'` locally, or just check the timestamp reads
"X seconds/minutes ago" rather than hours/days old). Any `Rejected` rows with an `Error` column
filled in mean the update is failing - most commonly the `linux/amd64/v3` platform mismatch from
Step 3 if that check was skipped. A stalled/unconverged service (confirmed via image+error, not
just replica count) is a warning, not a hard stop - report it and continue to the next service
rather than aborting the whole rollout (matches the `failed_when: false` philosophy in
`deploy.yml`: one crash-looping service shouldn't block redeploying the healthy ones) - but it
must be reported accurately as failed, never described as successful just because replicas
read 1/1.

**Best proof is the actually-running container, not `docker service ps`'s Image column** (that
column just echoes the configured image string, which is always `...:prod` regardless of which
digest is actually running - it will NOT reveal a missed `--force`, see above). Check the real
container instead:

```bash
ssh mauuu-prod "cid=\$(docker ps --filter 'name=mau-apps_<app>' -q); docker inspect \$cid --format '{{.Image}} {{.Created}}'"
```

Compare `.Image` against the digest from `docker inspect ghcr.io/muzanella11/<app>:prod --format
'{{.Id}}'` run locally right after the push, and confirm `.Created` is recent (minutes, not hours
or days) - this is the check that actually caught the missing-`--force` no-op above.

If this whole-fleet rollout is run as a single non-interactive script rather than step by step,
expect the auto-mode permission classifier to block it (it did previously) - that's a reasonable
gate for a command that touches every prod service in one shot, so surface it to the user
instead of trying to route around it.

After the last service, `ssh mauuu-prod "docker logout ghcr.io"` to clean up credentials on the
server.

## Step 5b - Clean Up Old Images on Prod

Do this after every rollout, not just when disk is visibly tight - the VPS only has 2GB RAM and
limited disk, and each superseded `:prod` image is 200-400MB. Confirmed 2026-08-30: after a
14-service rollout, 14 old images (1.48GB) were left behind because the tag moved to a new
digest but the old digest stayed around, still referenced by the stopped container Swarm keeps
per service for its task-history/rollback buffer (`TaskHistoryRetentionLimit`, default 5 - here
effectively 1 old task per service in practice). `docker system df` reports these as `0%
reclaimable` because they're still tagged/referenced, so a plain `docker image prune` won't
touch them - the stopped containers have to go first:

```bash
ssh mauuu-prod bash -s <<'EOF'
docker container prune -f
docker image prune -a -f
docker system df
EOF
```

This only removes stopped containers and images with no running container referencing them -
it never touches a currently-running service. Losing that task-history buffer just means
`docker service ps` shows less pre-rollout debug history; Swarm rebuilds its own bookkeeping
around whatever's left and nothing about the live services is affected. Sanity-check afterwards
that `docker images | grep muzanella11` shows exactly one row per app (the one just deployed).

## Step 6 - Migrations (only if needed)

Only relevant if new migration files were added since the last release (check
`apps/*/src/database/migrations/` diff in Step 1). If nothing changed under
`apps/*/src/database/migrations/`, skip this step entirely.

Mirrors `.github/workflows/migrate.yml`: DB connection vars are shared across all 4 apps that
have real migrations (`mau-account-api`, `mau-topup-api`, `mau-notification-api`,
`mau-undang-api` - `mau-compro-api` has empty migration/seed arrays, safe no-op), but
`DATABASE_NAME` differs per app (`mau_<domain>_prod`). Aiven requires TLS
(`DATABASE_SSL_ENABLED=true` + `DATABASE_CA_CERT`, base64).

Read connection vars from `.claude/config.local.yaml` under a `database:` key (ask the user to
fill it in if missing - **never** hardcode these values into this skill file or any tracked
file):

```yaml
database:
  host: "<Aiven host>"
  port: "<Aiven port>"
  username: "<value>"
  password: "<value>"
  ssl_enabled: "true"
  ca_cert: "<base64 CA cert, matches DATABASE_CA_CERT secret>"
```

Run migrations for all 4 apps first, in this exact order (matches `migrate.yml` - migrations
before seeds across apps, not interleaved per app), then seeds for all 4:

```bash
db=$(python3 -c "import yaml,json; print(json.dumps(yaml.safe_load(open('.claude/config.local.yaml'))['database']))")
export DATABASE_HOST=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['host'])")
export DATABASE_PORT=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['port'])")
export DATABASE_USERNAME=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['username'])")
export DATABASE_PASSWORD=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")
export DATABASE_SSL_ENABLED=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['ssl_enabled'])")
export DATABASE_CA_CERT=$(echo "$db" | python3 -c "import sys,json; print(json.load(sys.stdin)['ca_cert'])")

for app_domain in "mau-account-api:mau_account_prod" "mau-topup-api:mau_topup_prod" "mau-notification-api:mau_notification_prod" "mau-undang-api:mau_undang_prod"; do
  app="${app_domain%%:*}"; DATABASE_NAME="${app_domain##*:}"
  DATABASE_NAME="$DATABASE_NAME" yarn nx run "$app:migration:run"
done

for app_domain in "mau-account-api:mau_account_prod" "mau-topup-api:mau_topup_prod" "mau-notification-api:mau_notification_prod" "mau-undang-api:mau_undang_prod"; do
  app="${app_domain%%:*}"; DATABASE_NAME="${app_domain##*:}"
  DATABASE_NAME="$DATABASE_NAME" yarn nx run "$app:seed:run"
done
```

Aiven's firewall must already allow the connecting IP (per the header comment in
`migrate.yml`, it's set to allow all IPs with auth+TLS as the only gate - if a connection is
refused, that's the first thing to check, not a code issue). Migrations must succeed before
Step 5's rollout for any app whose schema changed - an app must never run against a schema
older than what it expects.

## PAT Hygiene

If the user generated a fresh PAT just for this deploy, remind them to revoke it afterwards at
https://github.com/settings/tokens once the rollout is confirmed healthy - no need to keep a
live `write:packages` token sitting in `config.local.yaml` between deploys.
