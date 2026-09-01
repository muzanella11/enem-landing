#!/usr/bin/env bash
# Convenience wrapper - deploy app stack (compose.yml + compose.<env>.yml,
# added in story 10) ke server yang sudah diprovisioning
# (scripts/provision-server.sh). Ported dari mau-apps/scripts/deploy.sh.
#
# Usage: ./scripts/deploy.sh <dev|prod> <host-ip> <path-ke-deploy-vars.yml>
#
# deploy-vars.yml format lengkap ada di header comment
# infra/ansible/playbooks/deploy.yml - berisi ghcr_pat + app_env
# (DATABASE_URL_ACCOUNT_API/DATABASE_URL_API, REDIS_*, JWT_SECRET, R2_*).
# File itu SENGAJA tidak jadi argumen default/hardcoded di sini - taruh di
# luar repo (misal scratchpad), JANGAN PERNAH commit ke git, berisi
# credential asli.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_KEY="$HOME/.ssh/id_ed25519_enem_landing_deploy"

usage() {
  echo "Usage: $0 <dev|prod> <host-ip> <path-ke-deploy-vars.yml>" >&2
  exit 1
}

ENV="${1:-}"
HOST_IP="${2:-}"
DEPLOY_VARS="${3:-}"

if [[ -z "$ENV" || -z "$HOST_IP" || -z "$DEPLOY_VARS" ]]; then
  usage
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: environment must be 'dev' or 'prod', got '$ENV'" >&2
  exit 1
fi

if [[ ! -f "$DEPLOY_VARS" ]]; then
  echo "Error: deploy-vars.yml tidak ditemukan di '$DEPLOY_VARS'" >&2
  exit 1
fi

# Cek deploy-vars.yml tidak sengaja diletakkan di dalam repo - kalau iya,
# ini beresiko ke-commit tanpa sadar (berisi credential asli). Resolve ke
# absolute path dulu - perbandingan string "$DEPLOY_VARS" == "$SCRIPT_DIR"/*
# apa adanya cuma menangkap path absolute, path relative dari dalam repo
# (misal "infra/ansible/deploy-vars.yml", cara paling wajar orang menjalankan
# ini) lolos begitu saja - ditemukan langsung dari test end-to-end script ini
# (mau-apps' versi asli punya celah yang sama).
DEPLOY_VARS="$(cd "$(dirname "$DEPLOY_VARS")" && pwd)/$(basename "$DEPLOY_VARS")"
if [[ "$DEPLOY_VARS" == "$SCRIPT_DIR"/* ]]; then
  echo "Error: deploy-vars.yml ('$DEPLOY_VARS') ada DI DALAM repo ($SCRIPT_DIR)." >&2
  echo "File ini berisi credential asli - taruh di luar repo (misal scratchpad)," >&2
  echo "supaya tidak resiko ke-commit tanpa sadar." >&2
  exit 1
fi

INVENTORY="$SCRIPT_DIR/infra/ansible/inventories/$ENV/hosts.ini"

if [[ ! -f "$INVENTORY" ]] || ! grep -qE "(^|[[:space:]])${HOST_IP//./\\.}([[:space:]]|\$)" "$INVENTORY"; then
  echo "Error: host '$HOST_IP' belum ada di $INVENTORY" >&2
  exit 1
fi

if ! command -v ansible-playbook &>/dev/null; then
  echo "Error: ansible-playbook tidak ditemukan di PATH." >&2
  echo "Kalau baru di-install via 'pip install --user ansible-core', tambahkan dulu:" >&2
  echo "  export PATH=\"\$PATH:\$HOME/Library/Python/3.9/bin\"" >&2
  exit 1
fi

echo "Deploy $ENV ke $HOST_IP menggunakan $DEPLOY_VARS..."

ansible-playbook "$SCRIPT_DIR/infra/ansible/playbooks/deploy.yml" \
  -i "$INVENTORY" -l "$HOST_IP" \
  -e "env=$ENV" -e "@$DEPLOY_VARS"

echo ""
echo "Deploy selesai. Cek status service:"
echo "  ssh -i ${DEPLOY_KEY} deploy@${HOST_IP} 'docker service ls'"
