# Ansible - Provisioning & Deploying enem-landing

Ansible playbooks for provisioning a new server (dev/prod) and deploying
the 5-app stack to it. Ported from `mau-apps/infra/ansible/`, scaled down
to enem-landing's own decisions - see `issues/09-dev-tooling-scripts.md`
and `issues/10-infra-cicd.md` for the story-level breakdown.

## Prerequisites

- Ansible Core installed on the machine running the playbook (not on the
  target server).
- Install the collection dependency:
  ```bash
  ansible-galaxy collection install -r infra/ansible/requirements.yml
  ```
- Target server already reachable via SSH (key or password) as the initial
  root/admin user, matching `ansible_user` in the inventory.
- A public key ready for the `deploy` user this playbook creates (usually
  `~/.ssh/id_ed25519.pub`, or a dedicated deploy key - see the "SSH access"
  note under story 10's own plan: a fresh key for enem-landing rather than
  reusing the old `.drone.yml` secrets, since those are Drone-server-side
  and unreadable from here).
- **Manually add the target server's IP to the right inventory** before
  running `provision-server.sh` - see `inventories/dev/hosts.ini` /
  `inventories/prod/hosts.ini`. Neither file has a real host in it yet
  (placeholder only) - the real prod IP lives in Drone's `SSH_HOST` secret,
  not readable from this repo.

## What `init-server.yml` does

Creates a non-root `deploy` user with sudo NOPASSWD, installs Docker Engine
+ Compose plugin, initializes Docker Swarm, deploys the base Traefik stack,
creates the `enem-landing-network` overlay network. Idempotent - safe to
re-run for config-drift repair. Full detail in `scripts/provision-server.sh`
and the playbook itself (story 09).

## `enem-landing-account-api`: internal-only, not exposed publicly

Decided (story 10), not left open: `enem-landing-account-api` gets
`traefik.enable=false` in `compose.yml` - reachable only over the internal
`enem-landing-network`, no public router/subdomain.

Evidence: grepped `enem-landing-account-web` and `enem-landing-cms`'s
`app/` (browser-side code) for any reference to `ACCOUNT_API_HOST` outside
`server/api/**` (which runs server-side and is fine to call it) - none
found. Both apps' `nuxt.config.ts` confirm this structurally:
`accountApiHost` is declared as a plain (server-only) `runtimeConfig` key,
never under `runtimeConfig.public`. Compare `ACCOUNT_WEB_HOST`, which *is*
`runtimeConfig.public` (used client-side by `useAuthGuard`/
`useAuthCookie` to build the signin redirect and set the shared-domain
cookie) - that one does get a public router in `compose.yml`. Every call
to `enem-landing-account-api` is BFF-proxied through each app's own
`server/api/**` routes, same pattern as `enem-landing-api`, which is
internal-only for the same reason.

## Public domains

All behind Cloudflare (proxied) and Traefik on the same VPS. The wildcard
`*.muzanella.com` cert is requested once by `enem-landing-web`'s router and
reused by every other router via SNI, so a new subdomain only needs a DNS
record plus a Traefik router label in compose.

| App | Prod | Dev |
|---|---|---|
| enem-landing-web | `muzanella.com` | `dev.muzanella.com` |
| enem-landing-account-web | `account.muzanella.com` | `dev-account.muzanella.com` |
| enem-landing-cms | `cms.muzanella.com` | `dev-cms.muzanella.com` |
| enem-landing-tools | `tools.muzanella.com` | `dev-tools.muzanella.com` |
| enem-landing-api, enem-landing-account-api | internal only | internal only |

DNS records `tools` and `dev-tools` were added in Cloudflare by the user on
2026-11-06 (verified resolving through the Cloudflare proxy the same day).

## Deploying the stack

`scripts/deploy.sh <dev|prod> <host-ip> <deploy-vars.yml>` (story 09) runs
`playbooks/deploy.yml` against an already-provisioned host - copies
`compose.yml` + the matching `compose.<env>.yml` override, logs into GHCR,
rolls the 6 services out one at a time via `docker stack deploy`. See that
playbook's own header comment for the full `deploy-vars.yml` shape
(`ghcr_pat` + `app_env` - only real secrets, never CORS/internal-host
wiring, that lives directly in `compose.yml`).

## Memory budget (story 10)

`compose.prod.yml` caps each of the 6 app containers at 100M with
`NODE_OPTIONS=--max-old-space-size=60` - 600 MB total allocated
(`enem-landing-tools` added in Story 20), same
tuning approach mau-apps uses (see that file's header for the full
reasoning). Redis is self-hosted on the VPS since 2026-11-18 (see below)
and adds a 160M ceiling. MySQL is self-hosted too (see below) and adds a
640M ceiling (384M reserved), plus 32M for the `mysql-tunnel` sidecar.

## Shared Redis (`deploy-redis.yml`)

Upstash's free tier (500k commands a month) ran out on 2026-11-18 and took
both APIs down, so Redis now runs as its own `redis` stack on the VPS, the
same way Traefik does. One instance serves prod and dev: dev keys carry the
`dev` prefix (`REDIS_KEY_PREFIX`, see `compose.dev.yml`). It joins both env
overlay networks and publishes no port. The password lives in a rendered
`redis.conf` (mode 0600), and AOF data is kept in
`/opt/enem-landing/storage/redis`.

```bash
cd infra/ansible
ansible-playbook playbooks/deploy-redis.yml -i inventories/prod/hosts.ini \
  -e "redis_password=<strong random value>"
```

Then set the same values in both GitHub environments (`production` and
`development`): `REDIS_HOST=redis_redis`, `REDIS_PORT=6379`,
`REDIS_USERNAME` empty, `REDIS_PASSWORD=<same value>`, `REDIS_DB=0`,
`REDIS_TLS_ENABLED=false`, and redeploy both stacks. Keep the existing
`REDIS_KEY_PREFIX` values.

## Shared MySQL (`deploy-mysql.yml`)

MySQL runs as its own `mysql` stack on the VPS (`mysql:8.4`), replacing
Aiven. One instance serves prod and dev, isolated by database and user:

| Env | User | Databases |
|---|---|---|
| prod | `enem_prod` | `enem_landing_api`, `enem_landing_account` |
| dev | `enem_dev` | `enem_landing_api_dev`, `enem_landing_account_dev` |

Each user only has privileges on its own databases (no `SUPER`, `FILE` or
`GRANT OPTION`). `root` exists only as `root@localhost`, so it can only be
used through `docker exec`; its password is generated on the VPS on the
first run and stays in `/opt/enem-landing/mysql/secrets` (do not delete that
directory, see the playbook header).

**No port is published.** Apps reach it over the overlay network as
`mysql_mysql:3306`. From outside, the only way in is an SSH tunnel: the
`mysql-tunnel` container (socat, plain `docker run`, not a Swarm service)
listens on the VPS loopback `127.0.0.1:33300` and forwards to
`mysql_mysql:3306` over the dedicated `mysql_admin` overlay. Because it binds
to loopback, the "Docker bypasses UFW" problem does not apply.

```
apps (prod/dev) --overlay--> mysql_mysql:3306

TablePlus / GitHub runner
  --SSH:22--> VPS 127.0.0.1:33300 (mysql-tunnel)
  --overlay mysql_admin--> mysql_mysql:3306
```

Data lives in `/opt/enem-landing/storage/mysql`, the server config in
`/opt/enem-landing/mysql/conf.d/enem.cnf` (from `playbooks/files/mysql.cnf`:
256M buffer pool, `performance_schema` off, 60 connections, `local_infile`
off, utf8mb4).

### Deploy

Create a local `mysql-vars.yml` (never commit it, the full shape is in the
playbook header), then:

```bash
cd infra/ansible
ansible-playbook playbooks/deploy-mysql.yml -i inventories/prod/hosts.ini \
  -e ansible_user=deploy -e ansible_ssh_private_key_file=<deploy key> \
  -e @mysql-vars.yml
```

Re-running is safe: users and grants are re-applied every time, so changing
`mysql_prod_password`/`mysql_dev_password` and re-running rotates them
(update the `DATABASE_URL_*` secrets and redeploy right after).

Then set `DATABASE_URL_ACCOUNT_API` and `DATABASE_URL_API` in both GitHub
environments (see `docs/github-actions-secrets.md`). The host must be
`mysql_mysql:3306`: `migrate.yml` rewrites exactly that to the tunnel and
refuses to run otherwise.

### Access from a laptop

**TablePlus**: new MySQL connection, enable "Over SSH":

- SSH server `43.133.149.209`, port `22`, user `muzanella`, key
  `~/.ssh/id_ed25519_enem_prod`;
- MySQL host `127.0.0.1`, port `33300`;
- user `enem_dev` (dev) or `enem_prod` (prod) with its password and
  database.

**CLI**: `scripts/db-tunnel.sh open` opens `ssh -L 33300:127.0.0.1:33300
enem-prod` in the background (`status` and `close` too), then connect to
`127.0.0.1:33300`.

**Root/admin**: on the VPS,
`docker exec -it $(docker ps -q -f name=mysql_mysql) mysql`.

### Slow query log

`slow_query_log` is on (`long_query_time=1`), written to
`/opt/enem-landing/storage/mysql-logs/slow.log` and rotated weekly (4 kept)
by `/etc/logrotate.d/enem-mysql`. The error log goes to the container
output: `docker service logs mysql_mysql`.

### Backup

`mysql-backup.timer` runs `/opt/enem-landing/bin/mysql-backup.sh` daily at
19:00 UTC (02:00 WIB). Each database is dumped with `mysqldump
--single-transaction`, gzipped (not encrypted) and streamed to the existing R2 uploads
buckets under the `mysql-backup/` prefix: prod databases to `prod`, dev
databases to `develop`. `daily/` keeps 7 days and `weekly/` (Sunday copies)
keeps 28 days. Retention only deletes inside that prefix, never the uploads.
A failure posts to `mysql_backup_notify_webhook_url`.

Both buckets are public (`prod` through `cdn.muzanella.com`, `develop`
through `cdn-dev.muzanella.com`) and the dumps are plain SQL, so a
Cloudflare WAF custom rule on the `muzanella.com` zone ("Block MySQL backups
on CDN", added 2026-11-23) blocks every request whose URL-decoded,
lowercased path contains `/mysql-backup` on those two hosts:

```
(http.host in {"cdn.muzanella.com" "cdn-dev.muzanella.com"}
 and lower(url_decode(http.request.uri.path)) contains "/mysql-backup")
```

**Do not remove or disable it**: without it a dump (password hashes, contact form messages, tracking data) could be
downloaded by guessing its path. Download backups from the R2 dashboard or
through the S3 API instead; the rule does not affect those.

One-time setup:

1. Create an R2 API token with Object Read & Write on the `prod` and
   `develop` buckets (a separate token from the apps' upload one).
2. Set `mysql_backup_enabled: true` and the other `mysql_backup_*` settings,
   then re-run the playbook.

On the VPS:

```bash
sudo systemctl start mysql-backup.service        # run one now
journalctl -u mysql-backup.service -n 50         # result
systemctl list-timers mysql-backup.timer         # next run
sudo bash -c 'set -a; . /opt/enem-landing/mysql/backup.env; \
  /opt/enem-landing/bin/mysql-backup.sh --force-fail'   # test the alert
```

Restore test, from a laptop with an `rclone` remote (here `r2`) for the
bucket, or a file downloaded from the R2 dashboard. Dumps hold one database without `CREATE DATABASE`, so they
load into any name. `root` is localhost-only, so the load runs through
`docker exec` on the VPS:

```bash
M='docker exec -i $(docker ps -q -f name=mysql_mysql) mysql'
ssh enem-prod "$M -e 'CREATE DATABASE restore_test'"
rclone cat r2:prod/mysql-backup/daily/<stamp>/enem_landing_api_<stamp>.sql.gz \
  | gunzip | ssh enem-prod "$M restore_test"
# compare row counts with enem_landing_api, then:
ssh enem-prod "$M -e 'DROP DATABASE restore_test'"
```

### Moving data from Aiven

Dev first as a rehearsal, then prod at a quiet hour:

1. Freeze writes: scale the env's `enem-landing-api` and
   `enem-landing-account-api` to 0
   (`docker service scale <stack>_enem-landing-api=0 ...`).
2. Dump each database from Aiven:
   `mysqldump --single-transaction --set-gtid-purged=OFF --no-tablespaces
   --routines --triggers -h <aiven host> -P <port> -u <user> -p
   --ssl-mode=REQUIRED <aiven db> > <db>.sql`. Aiven names are
   `enem_landing_*_dev` and `enem_landing_*_prod`; the new prod names have
   no `_prod` suffix.
3. Import through the tunnel as the app user:
   `mysql -h 127.0.0.1 -P 33300 -u enem_dev -p enem_landing_api_dev < <db>.sql`.
4. Compare exact row counts per table on both sides
   (`SELECT COUNT(*)` per table, not `information_schema.TABLES.TABLE_ROWS`,
   which is an estimate).
5. Update `DATABASE_URL_*` in the GitHub environment and redeploy (this also
   scales the APIs back up).
6. Keep Aiven for at least 7 days as a fallback before shutting it down.

## Not yet in this story (deferred to real infra)

- Real VPS provisioning/DNS/TLS - no server to target this session.
- GitHub Actions workflows (lint/test/e2e/build-push/migrate/deploy) - not
  yet built, still open in story 10.
- `check-memory.sh` monitoring cron - copied to the server by
  `init-server.yml` (story 09) but not scheduled anywhere yet.
