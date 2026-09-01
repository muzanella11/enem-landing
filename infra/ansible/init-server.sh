#!/usr/bin/env bash
# Wrapper provisioning server baru - menjalankan playbooks/init-server.yml
# terhadap host yang SUDAH ditambahkan manual ke
# inventories/<env>/hosts.ini (script ini TIDAK auto-append inventory).
# Ported dari mau-apps/infra/ansible/init-server.sh.
#
# Usage:
#   ./init-server.sh <dev|prod> <host-ip>
#
# Public key deploy diambil dari env var DEPLOY_PUBLIC_KEY, atau fallback
# ke ~/.ssh/id_ed25519.pub kalau ada.
#
# ACME_EMAIL dan CF_DNS_API_TOKEN wajib diisi juga (playbook assert
# keduanya di awal run, terlepas dari tujuan re-run-nya apa - konsisten
# dengan DEPLOY_PUBLIC_KEY yang sudah begitu).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat >&2 <<EOF
Usage: $0 <dev|prod> <host-ip>

  Provisions a server via playbooks/init-server.yml. The host IP must
  already exist in infra/ansible/inventories/<env>/hosts.ini - this
  script does NOT auto-append it.

Environment variables:
  DEPLOY_PUBLIC_KEY   Public key content for the 'deploy' user. Falls back
                      to ~/.ssh/id_ed25519.pub if not set.
  ACME_EMAIL          Email for Let's Encrypt ACME account registration.
  CF_DNS_API_TOKEN    Scoped Cloudflare API Token (Zone:DNS:Edit, enem-landing's
                      zone only) for the DNS-01 challenge.
EOF
  exit 1
}

ENV="${1:-}"
HOST_IP="${2:-}"

if [[ -z "$ENV" || -z "$HOST_IP" ]]; then
  usage
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: environment must be 'dev' or 'prod', got '$ENV'" >&2
  exit 1
fi

INVENTORY="$SCRIPT_DIR/inventories/$ENV/hosts.ini"

if [[ ! -f "$INVENTORY" ]]; then
  echo "Error: inventory file not found: $INVENTORY" >&2
  exit 1
fi

if ! grep -qE "(^|[[:space:]])${HOST_IP//./\\.}([[:space:]]|\$)" "$INVENTORY"; then
  echo "Error: host '$HOST_IP' not found in $INVENTORY" >&2
  echo "Add it manually to the inventory first, e.g.:" >&2
  echo "  $HOST_IP ansible_user=root" >&2
  exit 1
fi

if [[ -z "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  DEFAULT_KEY="$HOME/.ssh/id_ed25519.pub"
  if [[ -f "$DEFAULT_KEY" ]]; then
    DEPLOY_PUBLIC_KEY="$(cat "$DEFAULT_KEY")"
  else
    echo "Error: DEPLOY_PUBLIC_KEY is not set and no default key found at $DEFAULT_KEY" >&2
    echo "Set it explicitly:" >&2
    echo "  DEPLOY_PUBLIC_KEY=\"\$(cat ~/.ssh/id_ed25519.pub)\" $0 $ENV $HOST_IP" >&2
    exit 1
  fi
fi

echo "Provisioning $ENV server at $HOST_IP..."

# Extra-vars WAJIB lewat file (bukan inline "-e key=value"), karena
# deploy_public_key mengandung spasi (format "ssh-ed25519 AAAA... comment").
# Ansible mem-parsing "-e key=value" inline dengan MEMISAH per-spasi jadi
# beberapa key=value - value dengan spasi jadi terpotong diam-diam (bug
# nyata yang sudah ditemukan mau-apps dari provisioning run pertama ke
# server produksi, lihat versi asli file ini).
EXTRA_VARS_FILE="$(mktemp)"
trap 'rm -f "$EXTRA_VARS_FILE"' EXIT
{
  printf 'deploy_public_key: "%s"\n' "$DEPLOY_PUBLIC_KEY"
  printf 'acme_email: "%s"\n' "${ACME_EMAIL:-}"
  printf 'cf_dns_api_token: "%s"\n' "${CF_DNS_API_TOKEN:-}"
} > "$EXTRA_VARS_FILE"

ansible-playbook \
  "$SCRIPT_DIR/playbooks/init-server.yml" \
  -i "$INVENTORY" \
  -l "$HOST_IP" \
  -e "@${EXTRA_VARS_FILE}"
