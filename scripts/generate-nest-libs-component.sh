#!/bin/bash
# Ported near-verbatim from mau-apps/scripts/generate-nest-libs-component.sh -
# fully generic (no mau-apps-specific naming), useful as-is for scaffolding
# controllers/services/modules/DTOs inside libs/backend/* (e.g. sso, redis).

set -euo pipefail

# Receive baseDir and libraryName as arguments
baseDir="$1"
libraryName="$2"

# Function to generate a controller
generateController() {
  read -p "Enter controller name: " controllerName
  nx g @nestjs/schematics:controller "${controllerName}" --project="$libraryName"
}

# Function to generate a service
generateService() {
  read -p "Enter service name: " serviceName
  nx g @nestjs/schematics:service "${serviceName}" --project="$libraryName"
}

# Function to generate a module
generateModule() {
  read -p "Enter module name: " moduleName
  nx g @nestjs/schematics:module "${moduleName}" --project="$libraryName"
}

# Function to generate a DTO (Data Transfer Object), as a plain class - not
# a full Nx generator, just a stub file to fill in by hand.
generateDto() {
  read -p "Enter DTO name: " dtoName

  dtoDir="./src$baseDir/dto"
  mkdir -p "$dtoDir"

  dtoFileName="$(echo "$dtoName" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')"
  dtoClassName="$(echo "$dtoName" | sed -r 's/(^|-)(\w)/\U\2/g')"

  dtoPath="$dtoDir/${dtoFileName}.dto.ts"
  echo "export class ${dtoClassName}Dto {}" > "$dtoPath"

  echo "DTO created at $dtoPath"
}

# Main function to handle the generation of components (controller, service, module, DTO)
generateComponent() {
  echo "What do you want to generate?"
  echo "Options (separate multiple numbers with space):"
  echo "1) Controller"
  echo "2) Service"
  echo "3) Module"
  echo "4) DTO (as plain class)"
  read -p "Enter your choices: " choices

  for choice in $choices; do
    case $choice in
      "1") generateController ;;
      "2") generateService ;;
      "3") generateModule ;;
      "4") generateDto ;;
      *) echo "Invalid option: $choice" ;;
    esac
  done
}

generateComponent
