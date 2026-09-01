#!/bin/bash
# Ported near-verbatim from mau-apps/scripts/create-library.sh. Optional/
# low-priority per issues/09-dev-tooling-scripts.md - kept minimal on
# purpose (mau-apps' own version is minimal too, single Nest-library type).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Select library type:"
echo "1) Nest"
read -p "Enter your choice: " libraryType

if [ -z "$libraryType" ]; then
  echo "Error: Please select a library type." >&2
  exit 1
fi

case $libraryType in
  "1")
    read -p "Enter library name (kebab-case): " libraryName

    if [ -z "$libraryName" ]; then
      echo "Error: Library name cannot be empty." >&2
      exit 1
    fi

    libsPath="libs/backend/$libraryName"

    nx g @nx/nest:library "$libsPath"

    echo "Library $libraryName created successfully."

    baseDir="$libsPath/src/lib"

    if ! bash "$SCRIPT_DIR/generate-nest-libs-component.sh" "$baseDir" "$libraryName"; then
      echo "Error: Failed to generate components." >&2
      exit 1
    fi
    ;;
  *)
    echo "Invalid choice. Please input the number." >&2
    exit 1
    ;;
esac
