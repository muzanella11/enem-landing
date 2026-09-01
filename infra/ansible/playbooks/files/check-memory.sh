#!/usr/bin/env bash
# Cek cepat pemakaian memori sistem + container. Ported verbatim dari
# mau-apps/infra/ansible/playbooks/files/check-memory.sh - fully generic,
# no app-specific content.
#
# Usage: ./check-memory.sh
# Threshold override: MEMORY_THRESHOLD_PERCENT=90 ./check-memory.sh

set -euo pipefail

THRESHOLD_PERCENT="${MEMORY_THRESHOLD_PERCENT:-85}"

TOTAL_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
AVAILABLE_KB=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
USED_KB=$((TOTAL_KB - AVAILABLE_KB))
USED_PERCENT=$((USED_KB * 100 / TOTAL_KB))

echo "=== Docker container memory usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "=== System memory ==="
echo "Total: $((TOTAL_KB / 1024)) MB | Used: $((USED_KB / 1024)) MB (${USED_PERCENT}%) | Threshold: ${THRESHOLD_PERCENT}%"

if [[ "$USED_PERCENT" -ge "$THRESHOLD_PERCENT" ]]; then
  echo ""
  echo "WARNING: pemakaian memori ${USED_PERCENT}% >= threshold ${THRESHOLD_PERCENT}%"
  echo "Konsisten di atas threshold ini = waktunya pertimbangkan upgrade server,"
  echo "bukan cuma lonjakan sesaat."
  exit 1
fi

exit 0
