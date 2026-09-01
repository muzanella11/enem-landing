#!/usr/bin/env bash
# Convenience wrapper untuk provisioning server dev/prod pakai deploy key
# yang sudah di-generate ke ~/.ssh/id_ed25519_enem_landing_deploy. Ported
# dari mau-apps/scripts/provision-server.sh.
#
# Usage: ./scripts/provision-server.sh <dev|prod> <host-ip>
#
# BEDA dari infra/ansible/init-server.sh: script ini TIDAK auto-append host
# ke inventory - tetap manual (single-node per environment, host
# ditambahkan sengaja/deliberate, bukan otomatis). Kalau IP belum ada di
# inventory, script berhenti dan kasih instruksi jelas.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_KEY="$HOME/.ssh/id_ed25519_enem_landing_deploy"

usage() {
  echo "Usage: $0 <dev|prod> <host-ip>" >&2
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

if [[ ! -f "${DEPLOY_KEY}.pub" ]]; then
  echo "Error: deploy public key tidak ditemukan di ${DEPLOY_KEY}.pub" >&2
  echo "Generate dulu: ssh-keygen -t ed25519 -f ${DEPLOY_KEY} -N \"\"" >&2
  exit 1
fi

INVENTORY="$SCRIPT_DIR/infra/ansible/inventories/$ENV/hosts.ini"

if [[ ! -f "$INVENTORY" ]] || ! grep -qE "(^|[[:space:]])${HOST_IP//./\\.}([[:space:]]|\$)" "$INVENTORY"; then
  echo "Error: host '$HOST_IP' belum ada di $INVENTORY" >&2
  echo "Tambahkan manual dulu (single-node per environment, sengaja bukan auto-append):" >&2
  echo "  echo \"$HOST_IP ansible_user=root\" >> $INVENTORY" >&2
  exit 1
fi

if ! command -v ansible-playbook &>/dev/null; then
  echo "Error: ansible-playbook tidak ditemukan di PATH." >&2
  echo "Kalau baru di-install via 'pip install --user ansible-core', tambahkan dulu:" >&2
  echo "  export PATH=\"\$PATH:\$HOME/Library/Python/3.9/bin\"" >&2
  exit 1
fi

echo "Provisioning $ENV server at $HOST_IP menggunakan ${DEPLOY_KEY}.pub..."

DEPLOY_PUBLIC_KEY="$(cat "${DEPLOY_KEY}.pub")" \
  "$SCRIPT_DIR/infra/ansible/init-server.sh" "$ENV" "$HOST_IP"

# Verifikasi akses user `deploy` di sini (plain SSH), BUKAN lewat Ansible -
# lihat catatan precedence di infra/ansible/playbooks/init-server.yml.
echo ""
echo "Verifikasi akses user deploy..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes -o IdentitiesOnly=yes \
  -i "$DEPLOY_KEY" "deploy@${HOST_IP}" "whoami && docker service ls"; then
  echo ""
  echo "Provisioning selesai dan terverifikasi."
else
  echo ""
  echo "WARNING: provisioning playbook selesai, tapi verifikasi akses" >&2
  echo "user deploy GAGAL. Cek manual:" >&2
  echo "  ssh -i ${DEPLOY_KEY} deploy@${HOST_IP}" >&2
  exit 1
fi
