#!/bin/bash

set -e

# ─── Helpers ────────────────────────────────────────────────────────────────

print_step() { echo ""; echo "▶  $1"; }
print_done() { echo "✔  $1"; }

# ─── Ports ──────────────────────────────────────────────────────────────────
# One entry per app that binds a port (see each app's .env.example / PORT /
# nuxt.config.ts devServer.port) - update this list whenever a new app is
# added via create-app.sh. Plain "port:name" strings, not an associative
# array - macOS ships bash 3.2 by default, which doesn't have them.

PORTS=(
  "3000:enem-landing-account-api"
  "3001:enem-landing-api"
  "4000:enem-landing-cms"
  "8000:enem-landing-account-web"
  "8001:enem-landing-web"
)

# ─── Kill ───────────────────────────────────────────────────────────────────

print_step "Checking enem-landing ports"

killed_any=false

for entry in "${PORTS[@]}"; do
  port="${entry%%:*}"
  name="${entry#*:}"
  pids=$(lsof -ti "tcp:$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  Killing port $port ($name) - pid(s): $pids"
    kill -9 $pids 2>/dev/null || true
    killed_any=true
  fi
done

if [ "$killed_any" = true ]; then
  print_done "All occupied enem-landing ports have been freed."
else
  print_done "No enem-landing ports were in use."
fi
