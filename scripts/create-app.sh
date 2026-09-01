#!/bin/bash
# Scaffold a new Nx app + wire it into the dev conventions (kill-ports.sh
# entry, .env.example skeleton, root package.json's aggregate nx:*/dev:*
# scripts). Ported from mau-apps/scripts/create-app.sh - correction to an
# earlier version of this comment: enem-landing's root package.json DOES
# have its own aggregate scripts, same convention as mau-apps, just fewer
# of them (~40, not ~200) since there are fewer apps; see the "Wire into
# root package.json scripts" step below. Only 2 app kinds (nest, nuxt), not
# mau-apps' 3 - enem-landing has no separate "Web (Vuetify dashboard)" vs
# "Landing (Tailwind public)" app kind distinction at the script level;
# nuxt apps just pick a preset.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ─── Helpers ────────────────────────────────────────────────────────────────

print_step() { echo ""; echo "▶  $1"; }
print_done() { echo "✔  $1"; }
print_error() { echo "✖  $1" >&2; exit 1; }

require_kebab_case() {
  if [[ ! "$1" =~ ^[a-z][a-z0-9-]*$ ]]; then
    print_error "Name must be kebab-case (lowercase letters, numbers, hyphens). Got: '$1'"
  fi
}

# Register a new app's port in scripts/kill-ports.sh's PORTS array. Idempotent.
register_kill_port() {
  local port="$1"
  local name="$2"
  local killPortsFile="$ROOT_DIR/scripts/kill-ports.sh"

  [[ -f "$killPortsFile" ]] || return
  grep -q "\"${port}:" "$killPortsFile" 2>/dev/null && return

  # `mv` from a fresh mktemp file replaces the original inode, losing
  # kill-ports.sh's +x bit - capture and restore it explicitly (mau-apps hit
  # this as a real bug, see its create-app.sh comment on the same line).
  local origMode
  origMode=$(stat -f "%Lp" "$killPortsFile" 2>/dev/null || stat -c "%a" "$killPortsFile" 2>/dev/null || echo "755")

  local tmpFile
  tmpFile=$(mktemp)
  awk -v entry="  \"${port}:${name}\"" '
    /^\)$/ && !done { print entry; done=1 }
    { print }
  ' "$killPortsFile" > "$tmpFile"
  mv "$tmpFile" "$killPortsFile"
  chmod "$origMode" "$killPortsFile"
}

# Next available port in a range, scanning every existing app's
# .env.example for a "PORT=<n>" line, AND every existing Nuxt app's
# nuxt.config.ts for "port: <n>" (devServer.port) - most apps here read
# PORT from .env, but enem-landing-web's port is hardcoded straight into
# nuxt.config.ts with no matching .env.example PORT= line at all (found by
# actually running this against the real apps/ dir - the first version of
# this function, scanning .env.example only, collided a new app onto
# enem-landing-web's already-taken 8001).
next_available_port() {
  local base="$1"
  local port="$base"
  local taken
  while true; do
    taken=false
    for envFile in "$ROOT_DIR"/apps/*/.env.example; do
      [[ -f "$envFile" ]] || continue
      if grep -qE "^PORT=${port}$" "$envFile" 2>/dev/null; then
        taken=true
        break
      fi
    done
    if [[ "$taken" == false ]]; then
      for nuxtConfig in "$ROOT_DIR"/apps/*/nuxt.config.ts; do
        [[ -f "$nuxtConfig" ]] || continue
        if grep -qE "port:[[:space:]]*${port}[,)]" "$nuxtConfig" 2>/dev/null; then
          taken=true
          break
        fi
      done
    fi
    if [[ "$taken" == false ]]; then
      echo "$port"
      return
    fi
    port=$((port + 1))
  done
}

# ─── Select app kind ────────────────────────────────────────────────────────

echo "Select app kind:"
echo "1) nest  (NestJS API)          → port 3xxx"
echo "2) nuxt  (Nuxt 4 frontend)     → port 4xxx (Vuetify) or 8xxx (Tailwind)"
read -r -p "Enter your choice: " kindChoice

case "$kindChoice" in
  1) kind="nest" ;;
  2) kind="nuxt" ;;
  *) print_error "Invalid choice. Enter 1 or 2." ;;
esac

preset=""
if [[ "$kind" == "nuxt" ]]; then
  echo ""
  echo "Select preset:"
  echo "1) tailwind (public-facing app, e.g. enem-landing-web/-account-web)"
  echo "2) vuetify  (admin dashboard, e.g. enem-landing-cms)"
  read -r -p "Enter your choice: " presetChoice
  case "$presetChoice" in
    1) preset="tailwind" ;;
    2) preset="vuetify" ;;
    *) print_error "Invalid choice. Enter 1 or 2." ;;
  esac
fi

# ─── App name ───────────────────────────────────────────────────────────────

read -r -p "Enter app name (kebab-case, e.g. enem-landing-blog): " appName

if [[ -z "$appName" ]]; then
  print_error "App name cannot be empty."
fi

require_kebab_case "$appName"

if [[ "$appName" != enem-landing-* ]]; then
  print_error "App name must start with 'enem-landing-' to match the existing apps."
fi

APP_DIR="$ROOT_DIR/apps/$appName"

if [[ -d "$APP_DIR" ]]; then
  print_error "App '$appName' already exists at apps/$appName"
fi

# ─── Port ───────────────────────────────────────────────────────────────────

case "$kind" in
  nest) port=$(next_available_port 3000) ;;
  nuxt)
    if [[ "$preset" == "vuetify" ]]; then
      port=$(next_available_port 4000)
    else
      port=$(next_available_port 8000)
    fi
    ;;
esac

echo ""
echo "  App:    $appName"
echo "  Kind:   $kind${preset:+ ($preset)}"
echo "  Port:   $port"
echo ""
read -r -p "Confirm? (y/n): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

# ─── Generate app ───────────────────────────────────────────────────────────

case "$kind" in

  nest)
    print_step "Generating NestJS app: $appName"
    (cd "$ROOT_DIR" && yarn nx g @nx/nest:app "apps/$appName" --e2eTestRunner=none --no-interactive)
    print_done "App generated."

    print_step "Writing .env.example"
    cat > "$APP_DIR/.env.example" <<ENVEOF
PORT=$port
CORS_ORIGIN=

# Aiven MySQL (or local MySQL in dev) - see issues/10-infra-cicd.md.
# Leave unset if this app has no database of its own.
DATABASE_URL=mysql://user:user@localhost:3306/${appName//-/_}

# Base URL of enem-landing-account-api - only needed if this app validates
# tokens via SsoAuthGuard (libs/backend/sso).
ACCOUNT_API_HOST=http://localhost:3000
ENVEOF
    print_done ".env.example written - trim/adjust to what this app actually needs."
    ;;

  nuxt)
    print_step "Generating Nuxt app: $appName"
    (cd "$ROOT_DIR" && yarn nx g @nx/nuxt:app "apps/$appName" --e2eTestRunner=playwright --no-interactive)
    print_done "App generated."

    print_step "Wiring $preset preset into nuxt.config.ts"
    NUXT_CONFIG="$APP_DIR/nuxt.config.ts"
    # `@nx/nuxt:app` already generates workspaceDir/devtools/devServer/
    # typescript/imports/css/vite - matching every other app in this repo -
    # so this only needs to ADD `modules` (not generated by default) and
    # fix the 2 values that differ from this repo's convention (devServer
    # port defaults to 4200; typescript.typeCheck defaults to true, which
    # breaks `nuxt build` under this Nx/Nuxt/TS combo - see
    # refactor/README.md). A first version of this patch block-inserted a
    # whole second copy of the config instead of editing these values in
    # place - found by actually generating an app and reading the result:
    # the generator's OWN `port: 4200,` came later in the object literal
    # and silently won, so the app would never have run on the port this
    # script just told the operator it was assigning.
    node - "$NUXT_CONFIG" "$preset" "$port" <<'NODE'
const fs = require('fs');
const [, , configPath, preset, port] = process.argv;
let src = fs.readFileSync(configPath, 'utf8');

const modules = preset === 'vuetify'
  ? "['@pinia/nuxt', 'vuetify-nuxt-module']"
  : "['@pinia/nuxt', '@nuxtjs/tailwindcss']";

src = src.replace(
  'export default defineNuxtConfig({',
  `export default defineNuxtConfig({\n  modules: ${modules},`,
);

src = src.replace(/port: \d+,/, `port: ${port},`);
src = src.replace('typeCheck: true,', 'typeCheck: false,');

fs.writeFileSync(configPath, src);
console.log('nuxt.config.ts wired with the ' + preset + ' preset.');
NODE

    mkdir -p "$APP_DIR/app/assets/css"
    if [[ "$preset" == "tailwind" ]]; then
      cat > "$APP_DIR/app/assets/css/styles.css" <<'CSSEOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
CSSEOF
    else
      touch "$APP_DIR/app/assets/css/styles.css"
    fi

    print_step "Writing .env.example"
    cat > "$APP_DIR/.env.example" <<ENVEOF
PORT=$port

# Server-only - BFF routes (server/api/**) call these, the browser never
# sees them. Adjust to whichever backend(s) this app actually talks to.
API_HOST=http://localhost:3001
ENVEOF
    print_done ".env.example written - trim/adjust to what this app actually needs."

    echo ""
    echo "  Manual follow-ups (not automated - app-specific):"
    echo "    - yarn install (pulls in ${preset} module deps declared in root package.json)"
    echo "    - wire runtimeConfig/BFF routes per this app's actual needs"
    echo "    - if this is a public-facing app, mount libs/frontend's shared favicon"
    echo "      via nitro.publicAssets (see enem-landing-web/nuxt.config.ts)"
    echo "    - the generated apps/${appName}-e2e/playwright.config.mts uses Nx's"
    echo "      default webServer (nx run-based, single command) - rewrite it to"
    echo "      match this repo's \"serverless\" convention instead (see any"
    echo "      existing apps/*-e2e/playwright.config.mts): webServer array"
    echo "      listing every real backend this app's e2e specs actually hit,"
    echo "      each entry set to \`process.env['BASE_URL'] ? undefined : [...]\`."
    echo "      Then wire it into .github/workflows/e2e.yml (Build/Start"
    echo "      all servers/Wait for all servers steps - add this app's build +"
    echo "      nohup start + health URL) and package.json (nx:e2e:${appName}"
    echo "      + :serverless variant with BASE_URL=http://localhost:${port}, and"
    echo "      add both into the root e2e / e2e:serverless aggregate scripts)."
    ;;

esac

# ─── Wire into root package.json scripts ───────────────────────────────────

# enem-landing's root package.json DOES have its own per-app aggregate
# scripts (nx:lint:*, nx:build:*, nx:serve:*, prod:*, etc. - see its
# "scripts" block), unlike this header comment used to claim. That claim
# went stale, not a deliberate simplification: found by actually reading
# the file while fixing the exact gap this step now closes - a freshly
# generated app had no nx:seed:* alias at all, so `yarn seed` silently
# skipped it. Regex string-edits (not JSON.parse+stringify) to avoid
# reformatting/reordering the whole scripts block, same reasoning as the
# nuxt.config.ts patch above.
print_step "Wiring $appName into root package.json scripts"
node - "$ROOT_DIR/package.json" "$appName" "$kind" "$port" <<'NODE'
const fs = require('fs');
const [, , pkgPath, name, kind, port] = process.argv;
let src = fs.readFileSync(pkgPath, 'utf8');

const insertBefore = (anchor, line) => {
  const idx = src.indexOf(anchor);
  if (idx === -1) throw new Error(`Anchor not found: ${anchor}`);
  src = src.slice(0, idx) + line + '\n' + src.slice(idx);
};

const addToProjectList = (aggregateLine, extra) => {
  const idx = src.indexOf(aggregateLine);
  if (idx === -1) throw new Error(`Aggregate line not found: ${aggregateLine}`);
  src = src.slice(0, idx) + aggregateLine.replace('",', `${extra}",`) + src.slice(idx + aggregateLine.length);
};

insertBefore('    "lint":', `    "nx:lint:${name}": "yarn nx lint ${name}",`);
insertBefore('    "lint:fix":', `    "nx:lint:fix:${name}": "yarn nx lint ${name} --fix",`);
insertBefore('    "lint:format":', `    "nx:lint:format:${name}": "yarn nx lint:format ${name}",`);
insertBefore('    "lint:format:fix":', `    "nx:lint:format:fix:${name}": "yarn nx lint:format:fix ${name}",`);
insertBefore('    "test":', `    "nx:test:${name}": "yarn nx test ${name}",`);

insertBefore(
  '    "build": "yarn nx run-many -t build -p',
  `    "nx:build:${name}": "yarn nx build ${name}",`,
);
addToProjectList(
  '    "build": "yarn nx run-many -t build -p enem-landing-account-api enem-landing-account-web enem-landing-api enem-landing-cms enem-landing-web",',
  ` ${name}`,
);

insertBefore(
  '    "dev": "yarn nx run-many -t serve -p',
  `    "nx:serve:${name}": "yarn nx run ${name}:serve",`,
);
{
  const devAnchor = /"dev": "yarn nx run-many -t serve -p ([^"]+) --parallel=(\d+)",/;
  const match = src.match(devAnchor);
  if (!match) throw new Error('dev aggregate script not found');
  const nextParallel = Number(match[2]) + 1;
  src = src.replace(
    devAnchor,
    `"dev": "yarn nx run-many -t serve -p ${match[1]} ${name} --parallel=${nextParallel}",`,
  );
}

if (kind === 'nuxt') {
  insertBefore('    "e2e": "yarn nx:e2e:', `    "nx:e2e:${name}": "yarn nx e2e ${name}-e2e",`);
  {
    const e2eAnchor = /"e2e": "([^"]+)",/;
    const match = src.match(e2eAnchor);
    src = src.replace(e2eAnchor, `"e2e": "${match[1]} && yarn nx:e2e:${name}",`);
  }
  insertBefore(
    '    "e2e:serverless": "yarn nx:e2e:',
    `    "nx:e2e:${name}:serverless": "BASE_URL=http://localhost:${port} yarn nx e2e ${name}-e2e",`,
  );
  {
    const e2eSlAnchor = /"e2e:serverless": "([^"]+)",/;
    const match = src.match(e2eSlAnchor);
    src = src.replace(e2eSlAnchor, `"e2e:serverless": "${match[1]} && yarn nx:e2e:${name}:serverless",`);
  }
}

const prodLine =
  kind === 'nest'
    ? `    "prod:${name}": "node apps/${name}/dist/main.js",`
    : `    "prod:${name}": "NITRO_PORT=${port} node apps/${name}/.output/server/index.mjs",`;
insertBefore('    "prod:prepare":', prodLine);

fs.writeFileSync(pkgPath, src);
console.log('package.json wired for ' + name + ' (' + kind + ').');
NODE
print_done "package.json updated - review the diff before committing."

echo ""
echo "  NOT automated (needs a DB, decided per-app, not knowable at"
echo "  generation time): if $appName gets its own TypeORM connection later,"
echo "  add \"nx:migration:run:${appName}\"/\"nx:migration:revert:${appName}\""
echo "  and \"nx:seed:run:${appName}\" entries to package.json (copy the"
echo "  enem-landing-api ones) and append them into the \"migration\"/\"seed\""
echo "  aggregate scripts - this exact gap (a real seed target with no"
echo "  root-level alias, so 'yarn seed' silently skipped it) is what"
echo "  prompted this whole step to be added."

# ─── Register port ──────────────────────────────────────────────────────────

print_step "Registering port $port in scripts/kill-ports.sh"
register_kill_port "$port" "$appName"
print_done "kill-ports.sh updated."

print_step "Done!"
echo ""
echo "  App '$appName' created at apps/$appName (port $port)."
echo "  Remember to review the generated .env.example and commit the changes."
echo ""
