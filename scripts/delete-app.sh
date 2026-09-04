#!/bin/bash
# Counterpart to create-app.sh: remove an app + its wiring, including root
# package.json's aggregate nx:*/dev:* scripts (see create-app.sh's header
# comment - an earlier version of that comment, and of this one, claimed
# root package.json had nothing to clean up here; it does).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ─── Helpers ────────────────────────────────────────────────────────────────

print_step() { echo ""; echo "▶  $1"; }
print_done() { echo "✔  $1"; }
print_error() { echo "✖  $1" >&2; exit 1; }

unregister_kill_port() {
  local name="$1"
  local killPortsFile="$ROOT_DIR/scripts/kill-ports.sh"

  [[ -f "$killPortsFile" ]] || return

  local origMode
  origMode=$(stat -f "%Lp" "$killPortsFile" 2>/dev/null || stat -c "%a" "$killPortsFile" 2>/dev/null || echo "755")

  local tmpFile
  tmpFile=$(mktemp)
  grep -v "\"[0-9]*:${name}\"" "$killPortsFile" > "$tmpFile"
  mv "$tmpFile" "$killPortsFile"
  chmod "$origMode" "$killPortsFile"
}

# ─── List existing apps ──────────────────────────────────────────────────────

print_step "Existing apps:"
apps=()
i=1
for dir in "$ROOT_DIR/apps"/*/; do
  name=$(basename "$dir")
  if [[ "$name" != *"-e2e" ]]; then
    apps+=("$name")
    echo "  $i) $name"
    ((i++))
  fi
done

if [[ ${#apps[@]} -eq 0 ]]; then
  print_error "No apps found in apps/."
fi

# ─── App name ────────────────────────────────────────────────────────────────

echo ""
read -r -p "Enter the app name to delete (exactly as listed above): " appName

if [[ -z "$appName" ]]; then
  print_error "App name cannot be empty."
fi

APP_DIR="$ROOT_DIR/apps/$appName"
E2E_DIR="$ROOT_DIR/apps/${appName}-e2e"

if [[ ! -d "$APP_DIR" ]]; then
  print_error "App '$appName' not found at apps/$appName"
fi

# ─── Confirm ─────────────────────────────────────────────────────────────────

echo ""
echo "  ⚠️  This will permanently delete:"
echo "     apps/$appName"
[[ -d "$E2E_DIR" ]] && echo "     apps/${appName}-e2e"
echo ""
read -r -p "Type the app name to confirm: " confirm

if [[ "$confirm" != "$appName" ]]; then
  echo "Cancelled."
  exit 0
fi

# ─── Remove via NX ───────────────────────────────────────────────────────────

print_step "Removing app via NX"
(cd "$ROOT_DIR" && yarn nx g @nx/workspace:remove --project="$appName" --no-interactive --forceRemove) || true

if [[ -d "$APP_DIR" ]]; then
  rm -rf "$APP_DIR"
fi
print_done "Deleted apps/$appName"

# ─── Clean root package.json scripts ────────────────────────────────────────

# Counterpart to create-app.sh's "Wire into root package.json scripts" step
# (see that file's header comment - root package.json DOES have per-app
# aggregate scripts, unlike this file's own stale header comment used to
# claim). Regex string-edits, not JSON.parse+stringify, for the same
# reformatting-avoidance reason as create-app.sh.
print_step "Cleaning $appName out of root package.json scripts"
node - "$ROOT_DIR/package.json" "$appName" <<'NODE'
const fs = require('fs');
const [, , pkgPath, name] = process.argv;
let src = fs.readFileSync(pkgPath, 'utf8');
const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Any alias line whose JSON key ends in ":<name>" or ":<name>:serverless"
// (nx:lint*:<name>, nx:build:<name>, nx:serve:<name>, prod:<name>,
// nx:e2e:<name>(:serverless), nx:migration:*:<name>, nx:seed:run:<name>).
src = src.replace(new RegExp(`^ {4}"[^"]*:${esc}(:serverless)?": "[^"]*",\\n`, 'gm'), '');

const removeFromProjectList = (aggregateKey) => {
  const re = new RegExp(`("${aggregateKey}": "[^"]*?) ${esc}([ "])`);
  src = src.replace(re, '$1$2');
};
removeFromProjectList('build');

// Shared by "dev" and the dev:<group> scripts (dev:account/dev:core/dev:cms)
// - all follow the same "yarn nx run-many -t serve -p <list> --parallel=<n>"
// shape, so removal is the same string surgery for each.
const removeFromServeScript = (scriptKey) => {
  const anchor = new RegExp(`"${scriptKey}": "yarn nx run-many -t serve -p ([^"]+) --parallel=(\\d+)",`);
  const match = src.match(anchor);
  if (!match) return;
  const listRe = new RegExp(`(^| )${esc}( |$)`);
  if (!listRe.test(match[1])) return;
  const newList = match[1].replace(listRe, '$2').trim();
  const newParallel = Math.max(1, Number(match[2]) - 1);
  src = src.replace(
    anchor,
    `"${scriptKey}": "yarn nx run-many -t serve -p ${newList} --parallel=${newParallel}",`,
  );
};
removeFromServeScript('dev');
['account', 'core', 'cms'].forEach((group) => removeFromServeScript(`dev:${group}`));

src = src.split(` && yarn nx:e2e:${name}:serverless`).join('');
src = src.split(` && yarn nx:e2e:${name}`).join('');

fs.writeFileSync(pkgPath, src);
console.log('package.json cleaned of ' + name + '.');
NODE
print_done "package.json updated - review the diff before committing."

# ─── Remove e2e project ──────────────────────────────────────────────────────

if [[ -d "$E2E_DIR" ]]; then
  print_step "Removing e2e project"
  (cd "$ROOT_DIR" && yarn nx g @nx/workspace:remove --project="${appName}-e2e" --no-interactive --forceRemove) || true
  [[ -d "$E2E_DIR" ]] && rm -rf "$E2E_DIR"
  print_done "Deleted apps/${appName}-e2e"
fi

# ─── Clean tsconfig.json references ─────────────────────────────────────────

print_step "Cleaning tsconfig.json project references"
node - "$appName" <<'NODE'
const fs = require('fs');
const name = process.argv[2];
const path = './tsconfig.json';
if (!fs.existsSync(path)) process.exit(0);
const tsconfig = JSON.parse(fs.readFileSync(path, 'utf8'));
if (Array.isArray(tsconfig.references)) {
  const before = tsconfig.references.length;
  tsconfig.references = tsconfig.references.filter(
    (ref) => ref.path !== `./apps/${name}` && ref.path !== `./apps/${name}-e2e`,
  );
  if (tsconfig.references.length !== before) {
    fs.writeFileSync(path, JSON.stringify(tsconfig, null, 2) + '\n');
    console.log('tsconfig.json references cleaned.');
  } else {
    console.log('No matching tsconfig.json references found (nx sync may not have added any yet).');
  }
}
NODE

# ─── Clean kill-ports.sh ─────────────────────────────────────────────────────

print_step "Cleaning scripts/kill-ports.sh"
unregister_kill_port "$appName"
print_done "kill-ports.sh cleaned."

print_step "Done!"
echo ""
echo "  App '$appName' has been removed."
echo ""
echo "  Manual follow-ups (not automated - app-specific):"
echo "    - package.json: if this app had its own \"nx:migration:*:${appName}\""
echo "      / \"nx:seed:run:${appName}\" entries, those alias lines were"
echo "      removed but the app's own segment inside the chained \"migration\""
echo "      / \"seed\" aggregate strings was not spliced out automatically -"
echo "      edit those two lines by hand"
echo "    - .github/workflows/e2e.yml: remove this app's build + nohup start +"
echo "      health-check URL from the Build/Start all servers/Wait for all"
echo "      servers steps, if it was wired in there"
echo "    - grep other apps' apps/*-e2e/playwright.config.mts webServer arrays"
echo "      for a lingering 'nx run ${appName}:serve' entry - any e2e suite"
echo "      that depended on this app (e.g. via SSO redirect or a BFF call)"
echo "      needs that entry removed too"
echo "  Remember to commit the changes."
echo ""
