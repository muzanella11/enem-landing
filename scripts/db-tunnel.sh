#!/usr/bin/env bash
# SSH tunnel to the self-hosted MySQL on the VPS. MySQL publishes no port;
# the `mysql-tunnel` socat sidecar listens on the VPS loopback only
# (127.0.0.1:33300), so `ssh -L` is the only way in from outside.
#
# Usage:
#   ./scripts/db-tunnel.sh open     open the tunnel in the background
#   ./scripts/db-tunnel.sh status   show whether it is open
#   ./scripts/db-tunnel.sh close    close it again
#
# While open, connect to 127.0.0.1:33300 with the app user of the database
# you want (enem_prod or enem_dev), e.g.
#   mysql -h 127.0.0.1 -P 33300 -u enem_dev -p enem_landing_api_dev
#
# Overrides:
#   DB_TUNNEL_HOST        SSH host or ~/.ssh/config alias (default enem-prod)
#   DB_TUNNEL_LOCAL_PORT  local port (default 33300)
#   DB_TUNNEL_SSH_OPTS    extra ssh options, e.g. "-i ~/.ssh/other_key"
#
# For TablePlus use its "Over SSH" mode instead of this script, see
# infra/ansible/README.md.

set -euo pipefail

HOST="${DB_TUNNEL_HOST:-enem-prod}"
LOCAL_PORT="${DB_TUNNEL_LOCAL_PORT:-33300}"
REMOTE="127.0.0.1:33300"
# shellcheck disable=SC2206 # word splitting is intended here
SSH_OPTS=(${DB_TUNNEL_SSH_OPTS:-})
# Short fixed dir: unix socket paths are limited to ~104 chars on macOS.
SOCKET="/tmp/enem-db-tunnel-${LOCAL_PORT}.sock"

is_open() {
  ssh ${SSH_OPTS[@]+"${SSH_OPTS[@]}"} -S "$SOCKET" -O check "$HOST" >/dev/null 2>&1
}

port_listening() {
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$LOCAL_PORT" >/dev/null 2>&1
  else
    (exec 3<>"/dev/tcp/127.0.0.1/${LOCAL_PORT}") >/dev/null 2>&1
  fi
}

case "${1:-}" in
  open)
    if is_open; then
      echo "Tunnel already open: 127.0.0.1:${LOCAL_PORT} -> ${HOST} ${REMOTE}"
      exit 0
    fi
    if port_listening; then
      echo "Local port ${LOCAL_PORT} is already in use. Set DB_TUNNEL_LOCAL_PORT." >&2
      exit 1
    fi
    ssh ${SSH_OPTS[@]+"${SSH_OPTS[@]}"} -f -N -M -S "$SOCKET" \
      -o ExitOnForwardFailure=yes \
      -o ServerAliveInterval=30 \
      -L "127.0.0.1:${LOCAL_PORT}:${REMOTE}" \
      "$HOST"
    echo "Tunnel open: 127.0.0.1:${LOCAL_PORT} -> ${HOST} ${REMOTE}"
    echo "Close it with: $0 close"
    ;;
  status)
    if is_open; then
      echo "Tunnel open: 127.0.0.1:${LOCAL_PORT} -> ${HOST} ${REMOTE}"
      if port_listening; then
        echo "Local port ${LOCAL_PORT}: listening"
      else
        echo "Local port ${LOCAL_PORT}: NOT listening" >&2
        exit 1
      fi
    else
      echo "Tunnel closed"
      exit 1
    fi
    ;;
  close)
    if is_open; then
      ssh ${SSH_OPTS[@]+"${SSH_OPTS[@]}"} -S "$SOCKET" -O exit "$HOST" >/dev/null 2>&1
      echo "Tunnel closed"
    else
      echo "Tunnel was not open"
    fi
    ;;
  *)
    echo "Usage: $0 {open|status|close}" >&2
    exit 2
    ;;
esac
