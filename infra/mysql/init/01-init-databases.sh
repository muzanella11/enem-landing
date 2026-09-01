#!/bin/bash
set -e

# Run automatically by the MySQL entrypoint only on first init (empty data
# dir). Creates one database per app and grants access to the MYSQL_USER
# the entrypoint already created from MYSQL_USER/MYSQL_PASSWORD. Ported
# from mau-apps/infra/mysql/init/01-init-databases.sh - same idempotent
# logic as scripts/provision-db.sh (story 09), duplicated here because this
# needs to run inside MySQL's own first-boot init hook, not as a separate
# step after `docker compose up`.

DATABASES="enem_landing_account enem_landing_api"

for db in $DATABASES; do
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e \
    "CREATE DATABASE IF NOT EXISTS \`$db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

  if [ -n "$MYSQL_USER" ]; then
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e \
      "GRANT ALL PRIVILEGES ON \`$db\`.* TO '$MYSQL_USER'@'%';"
  fi
done

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "FLUSH PRIVILEGES;"
