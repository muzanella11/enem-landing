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

## Deploying the stack

`scripts/deploy.sh <dev|prod> <host-ip> <deploy-vars.yml>` (story 09) runs
`playbooks/deploy.yml` against an already-provisioned host - copies
`compose.yml` + the matching `compose.<env>.yml` override, logs into GHCR,
rolls the 5 services out one at a time via `docker stack deploy`. See that
playbook's own header comment for the full `deploy-vars.yml` shape
(`ghcr_pat` + `app_env` - only real secrets, never CORS/internal-host
wiring, that lives directly in `compose.yml`).

## Memory budget (story 10)

`compose.prod.yml` caps each of the 5 app containers at 100M with
`NODE_OPTIONS=--max-old-space-size=60` - 500 MB total allocated, same
tuning approach mau-apps uses (see that file's header for the full
reasoning). Unlike mau-apps, there's no self-hosted MySQL/Redis/RabbitMQ
container to budget for here at all - Aiven/Upstash from day one - so this
workspace never had mau-apps' original ~1.7-2 GB budget pressure. Actual
server RAM hasn't been confirmed against this budget yet (no VPS
provisioned this session).

## Not yet in this story (deferred to real infra)

- Real VPS provisioning/DNS/TLS - no server to target this session.
- GitHub Actions workflows (lint/test/e2e/build-push/migrate/deploy) - not
  yet built, still open in story 10.
- `check-memory.sh` monitoring cron - copied to the server by
  `init-server.yml` (story 09) but not scheduled anywhere yet.
