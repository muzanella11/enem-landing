#!/usr/bin/env bash
# Daily MySQL backup to object storage outside the VPS. Installed by
# deploy-mysql.yml to /opt/enem-landing/bin/mysql-backup.sh and run by
# mysql-backup.timer (systemd). Settings come from
# /opt/enem-landing/mysql/backup.env (EnvironmentFile of the unit).
#
# Per database: mysqldump (inside the mysql_mysql container, as root over
# the socket) | gzip | rclone rcat to the bucket. Not encrypted (decided
# 2026-11-23), so the files open with plain gunzip. Dumps are per single database
# without CREATE DATABASE/USE, so a file can be restored into any database
# name (handy for restore tests).
#
# BACKUP_TARGETS is a space separated list of <database>:<bucket>, so prod
# databases go to the prod uploads bucket and dev databases to the develop
# one. Everything lives under BACKUP_PREFIX, apart from the uploads, and
# retention only ever deletes inside that prefix:
#   <bucket>/<prefix>/daily/<stamp>/<db>_<stamp>.sql.gz    kept 7 days
#   <bucket>/<prefix>/weekly/<stamp>/<db>_<stamp>.sql.gz   Sunday copies, kept 28 days
# <stamp> is the UTC start time of the run, e.g. 20261123T190000Z.
#
# Both buckets are public through custom domains (cdn.muzanella.com and
# cdn-dev.muzanella.com). Because the dumps are plain, a Cloudflare WAF rule
# blocks every request to /mysql-backup on those domains. Keep that rule in place: without it a
# dump could be downloaded by guessing its path. Backups are fetched from
# the R2 dashboard or the S3 API instead, which the rule does not affect.
#
# Any failure posts to BACKUP_NOTIFY_WEBHOOK_URL (JSON with both `content`
# and `text`, so Discord and Slack style webhooks both work) and exits 1,
# which also marks the systemd unit as failed.
#
# Usage:
#   mysql-backup.sh              run a backup
#   mysql-backup.sh --force-fail test the failure notification

set -Eeuo pipefail

: "${BACKUP_R2_ENDPOINT:?}" "${BACKUP_R2_ACCESS_KEY_ID:?}" "${BACKUP_R2_SECRET_ACCESS_KEY:?}"
: "${BACKUP_TARGETS:?}" "${BACKUP_PREFIX:?}"

BACKUP_DAILY_KEEP="${BACKUP_DAILY_KEEP:-7d}"
BACKUP_WEEKLY_KEEP="${BACKUP_WEEKLY_KEEP:-28d}"
HOST_LABEL="$(hostname)"

notify() {
  local message="$1"
  echo "$message" >&2
  if [[ -n "${BACKUP_NOTIFY_WEBHOOK_URL:-}" ]]; then
    local payload
    payload=$(printf '{"content":"%s","text":"%s"}' "$message" "$message")
    curl -fsS -m 20 -X POST -H 'Content-Type: application/json' \
      --data "$payload" "$BACKUP_NOTIFY_WEBHOOK_URL" >/dev/null ||
      echo "Failure notification could not be sent" >&2
  fi
}

on_error() {
  local exit_code=$? line=$1
  trap - ERR
  notify "MySQL backup FAILED on ${HOST_LABEL} (line ${line}, exit ${exit_code}). Check: journalctl -u mysql-backup.service"
  exit 1
}
trap 'on_error $LINENO' ERR

if [[ "${1:-}" == "--force-fail" ]]; then
  echo "Forcing a failure to test the notification"
  false
fi

# rclone remote "backup", configured only through env vars (no config file).
# Provider "Other" works with the older rclone in Ubuntu 22.04 as well.
export RCLONE_CONFIG_BACKUP_TYPE=s3
export RCLONE_CONFIG_BACKUP_PROVIDER=Other
export RCLONE_CONFIG_BACKUP_ENDPOINT="$BACKUP_R2_ENDPOINT"
export RCLONE_CONFIG_BACKUP_ACCESS_KEY_ID="$BACKUP_R2_ACCESS_KEY_ID"
export RCLONE_CONFIG_BACKUP_SECRET_ACCESS_KEY="$BACKUP_R2_SECRET_ACCESS_KEY"
export RCLONE_CONFIG_BACKUP_REGION=auto
export RCLONE_CONFIG_BACKUP_NO_CHECK_BUCKET=true
# Hides the "config file not found" notice; errors still show.
export RCLONE_LOG_LEVEL=ERROR

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
prefix="${BACKUP_PREFIX%/}"
if [[ -z "$prefix" || "$prefix" == "/" ]]; then
  echo "BACKUP_PREFIX must not be empty (retention would touch the uploads)" >&2
  false
fi

container="$(docker ps -q \
  --filter label=com.docker.swarm.service.name=mysql_mysql \
  --filter health=healthy | head -n1)"
if [[ -z "$container" ]]; then
  echo "No healthy mysql_mysql container found" >&2
  false
fi

buckets=()
for item in $BACKUP_TARGETS; do
  db="${item%%:*}"
  bucket="${item#*:}"
  base="backup:${bucket}/${prefix}"
  target="${base}/daily/${stamp}/${db}_${stamp}.sql.gz"
  echo "Dumping ${db} -> ${target}"
  docker exec "$container" mysqldump \
    --single-transaction --quick --routines --triggers --events \
    --no-tablespaces --set-gtid-purged=OFF "$db" |
    gzip -6 |
    rclone rcat "$target"

  size="$(rclone size --json "$target" | sed -E 's/.*"bytes":([0-9]+).*/\1/')"
  if [[ -z "$size" || "$size" -lt 100 ]]; then
    echo "Backup of ${db} looks empty (${size:-?} bytes)" >&2
    false
  fi
  echo "  ${size} bytes"

  case " ${buckets[*]-} " in
    *" ${bucket} "*) ;;
    *) buckets+=("$bucket") ;;
  esac
done

for bucket in "${buckets[@]}"; do
  base="backup:${bucket}/${prefix}"

  # Sunday (ISO day 7): keep a weekly copy (server-side copy, no re-upload).
  if [[ "$(date -u +%u)" == "7" ]]; then
    echo "Copying ${bucket} to weekly/${stamp}"
    rclone copy "${base}/daily/${stamp}" "${base}/weekly/${stamp}"
  fi

  echo "Retention in ${bucket}/${prefix} (daily ${BACKUP_DAILY_KEEP}, weekly ${BACKUP_WEEKLY_KEEP})"
  rclone delete --min-age "$BACKUP_DAILY_KEEP" "${base}/daily"
  rclone delete --min-age "$BACKUP_WEEKLY_KEEP" "${base}/weekly"
  rclone rmdirs --leave-root "${base}/daily" || true
  rclone rmdirs --leave-root "${base}/weekly" || true
done

echo "Backup ${stamp} done"
