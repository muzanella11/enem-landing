# Multi-stage Dockerfile for the 5 Nx apps (Story 10, issues/10-infra-cicd.md),
# ported from mau-apps' Dockerfile pattern as closely as this workspace's own
# build layout allows.
#
# Build one app: `DOCKER_BUILDKIT=1 docker build -t <app>:local --target <app> .`
# Prerequisite: `yarn nx run <app>:prune` (API apps) / `yarn nx build <app>`
# (Nuxt apps) already ran - this Dockerfile only COPYs the already-built
# output, it never builds Nx inside the container. CI runs the Nx build
# before `docker build`, same as mau-apps.
#
# Differs from mau-apps in two ways, both because this workspace's Nx build
# output lives at `apps/<app>/dist` / `apps/<app>/.output` (per-app, this
# workspace's own convention - verified against the real build output, not
# assumed), not mau-apps' root `dist/apps/<app>`:
#   1. COPY paths are `./apps/<app>/dist` / `./apps/<app>/.output`, not
#      `./dist/apps/<app>`.
#   2. The 2 NestJS apps depend on in-repo libs (`@enem-landing/backend-sso`,
#      `shared-types`, etc.) that aren't published to a registry. This
#      workspace resolves that via Nx's `prune-lockfile` +
#      `copy-workspace-modules` executors (the `prune` target), which emit a
#      `dist/package.json` pointing at those libs as
#      `file:./workspace_modules/@enem-landing/<lib>` plus the
#      `dist/workspace_modules/` folder itself (verified: `yarn nx run
#      enem-landing-api:prune` produces exactly this). mau-apps' own APIs
#      don't hit this (its Dockerfile has no equivalent COPY), so each API
#      stage here has one extra `COPY .../workspace_modules` line mau-apps'
#      doesn't.
#   3. `yarn install --production` (no `--frozen-lockfile`) - verified that
#      Nx's `prune-lockfile` executor's emitted yarn.lock doesn't satisfy
#      yarn classic's frozen-lockfile integrity check even immediately after
#      a fresh, uncached prune (a plain `yarn install --production` succeeds
#      and just re-saves the lockfile with no dependency changes - this is
#      an Nx/yarn-classic quirk, not a real drift). mau-apps' Dockerfile can
#      use `--frozen-lockfile` because it relies on the older
#      `generatePackageJson: true` webpack option instead, which apparently
#      doesn't hit this.
#
# Port map (verified against each app's real devServer.port / PORT env var /
# NITRO_PORT in its package.json `prod:*` script - see scripts/kill-ports.sh
# for the same list):
#   enem-landing-account-api: 3000 (PORT env var, apps/enem-landing-account-api/src/main.ts)
#   enem-landing-api:         3001 (PORT env var, apps/enem-landing-api/src/main.ts)
#   enem-landing-cms:         4000 (NITRO_PORT)
#   enem-landing-account-web: 8000 (NITRO_PORT)
#   enem-landing-web:         8001 (NITRO_PORT)
#
# Node 26 (this workspace's `engines.node`, package.json) - mau-apps uses
# node:20-alpine, not carried over since this workspace targets a newer
# Node major.

# base: the 2 NestJS APIs - webpack:node externalizes deps (main.js is a
# thin bundle, not a full bundle), so still genuinely needs node_modules at
# runtime. `node:26-alpine`, unlike mau-apps' `node:20-alpine3.19`, does NOT
# bundle yarn (verified) - installed explicitly here, adds ~5MB, negligible
# against a small-spec server's OOM budget.
FROM node:26-alpine AS base
WORKDIR /api
RUN npm install --global yarn --no-fund --no-audit

# base-web: the 3 Nuxt apps - Nitro's `.output` is self-contained (its own
# `server/node_modules`, bundled via Rollup), no separate install step
# needed, same as mau-apps' `base-web`.
FROM node:26-alpine AS base-web
WORKDIR /web

# --- Identity/auth ---
FROM base AS enem-landing-account-api
COPY ./apps/enem-landing-account-api/dist/package.json ./apps/enem-landing-account-api/dist/yarn.lock ./
COPY ./apps/enem-landing-account-api/dist/workspace_modules ./workspace_modules
RUN yarn install --production && yarn cache clean
COPY ./apps/enem-landing-account-api/dist ./
EXPOSE 3000
CMD [ "node", "/api/main.js" ]

FROM base-web AS enem-landing-account-web
COPY ./apps/enem-landing-account-web/.output ./
ENV NITRO_PORT=8000
EXPOSE 8000
CMD [ "node", "/web/server/index.mjs" ]

# --- Business domain ---
FROM base AS enem-landing-api
COPY ./apps/enem-landing-api/dist/package.json ./apps/enem-landing-api/dist/yarn.lock ./
COPY ./apps/enem-landing-api/dist/workspace_modules ./workspace_modules
RUN yarn install --production && yarn cache clean
COPY ./apps/enem-landing-api/dist ./
EXPOSE 3001
CMD [ "node", "/api/main.js" ]

FROM base-web AS enem-landing-cms
COPY ./apps/enem-landing-cms/.output ./
ENV NITRO_PORT=4000
EXPOSE 4000
CMD [ "node", "/web/server/index.mjs" ]

FROM base-web AS enem-landing-web
COPY ./apps/enem-landing-web/.output ./
ENV NITRO_PORT=8001
EXPOSE 8001
CMD [ "node", "/web/server/index.mjs" ]
