#!/bin/bash
# Counterpart to create-app.sh: remove an app + its wiring. Ported from
# mau-apps/scripts/delete-app.sh, minus the package.json script cleanup
# (enem-landing's root package.json has no aggregate nx:*/dev:* scripts to
# clean up - see create-app.sh's header comment).

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
echo "    - package.json: remove nx:e2e:${appName}(:serverless) and its"
echo "      root e2e / e2e:serverless aggregate entries, if this app had them"
echo "    - .github/workflows/e2e.yml: remove this app's build + nohup start +"
echo "      health-check URL from the Build/Start all servers/Wait for all"
echo "      servers steps, if it was wired in there"
echo "    - grep other apps' apps/*-e2e/playwright.config.mts webServer arrays"
echo "      for a lingering 'nx run ${appName}:serve' entry - any e2e suite"
echo "      that depended on this app (e.g. via SSO redirect or a BFF call)"
echo "      needs that entry removed too"
echo "  Remember to commit the changes."
echo ""
