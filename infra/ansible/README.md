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
reasoning). MySQL is managed (Aiven). Redis is self-hosted on the VPS
since 2026-11-18 (see below) and adds a 160M ceiling.

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

## Not yet in this story (deferred to real infra)

- Real VPS provisioning/DNS/TLS - no server to target this session.
- GitHub Actions workflows (lint/test/e2e/build-push/migrate/deploy) - not
  yet built, still open in story 10.
- `check-memory.sh` monitoring cron - copied to the server by
  `init-server.yml` (story 09) but not scheduled anywhere yet.
