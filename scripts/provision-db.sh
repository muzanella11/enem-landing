#!/usr/bin/env bash
# Provisioning database MySQL di instance managed (Aiven) - Story 09
# (issues/09-dev-tooling-scripts.md), ported dari mau-apps/scripts/provision-db.sh.
# Membuat 2 database (bukan dev/prod x 4 domain seperti mau-apps) -
# enem-landing sudah dikonfirmasi story 03 pakai 1 database per app, bukan
# per-environment suffix: enem-landing-account (enem-landing-account-api),
# enem-landing (enem-landing-api).
#
# Idempotent - aman dijalankan ulang (CREATE DATABASE IF NOT EXISTS).
#
# Usage:
#   ./scripts/provision-db.sh
#   (akan prompt interaktif minta DATABASE_URL, input tidak ditampilkan di layar)
#
# Atau non-interaktif, DATABASE_URL lewat env var (bukan argumen command line -
# supaya credential tidak ter-render ke shell history/process list `ps`):
#   DATABASE_URL="mysql://user:pass@host:port?ssl-mode=REQUIRED" ./scripts/provision-db.sh
#
# DATABASE_URL di sini adalah connection string ke SERVER (tanpa nama
# database di path) - dipakai untuk connect lalu CREATE DATABASE, beda dari
# tiap app's own DATABASE_URL di .env (yang SUDAH menunjuk ke satu database
# spesifik, lihat apps/enem-landing-account-api/.env.example dan
# apps/enem-landing-api/.env.example).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  read -r -s -p "DATABASE_URL (mysql://user:pass@host:port[?ssl-mode=REQUIRED]): " DATABASE_URL
  echo
  export DATABASE_URL
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL kosong, batal." >&2
  exit 1
fi

if [[ ! -d "$SCRIPT_DIR/node_modules/mysql2" ]]; then
  echo "mysql2 tidak ditemukan di node_modules - jalankan 'yarn install' di root repo dulu." >&2
  exit 1
fi

node -e '
const mysql = require("mysql2/promise");

(async () => {
  const url = process.env.DATABASE_URL;
  const databases = ["enem-landing-account", "enem-landing"];

  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  const conn = await mysql.createConnection(
    isLocal ? {uri: url} : {uri: url, ssl: {rejectUnauthorized: true}},
  );

  const [ver] = await conn.query("SELECT VERSION() as v");
  console.log("Connected. Server version:", ver[0].v);

  for (const db of databases) {
    await conn.query("CREATE DATABASE IF NOT EXISTS `" + db + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    console.log("Ensured database:", db);
  }

  const [rows] = await conn.query("SHOW DATABASES LIKE \"enem-landing%\"");
  console.log("Database enem-landing* yang ada sekarang:", rows.map((r) => Object.values(r)[0]).join(", "));

  await conn.end();
  console.log("Selesai.");
})().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
'
