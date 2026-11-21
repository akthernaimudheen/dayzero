#!/usr/bin/env bash
# DayZero — local PocketBase launch.
#
# Uses the .superuser file (created once by `./pocketbase admin login`) so the
# server starts with the same superuser token used during development.
#
# Origins are locked to the DayZero web origin so that only that origin may
# call the API with credentials.  Android calls are same-host and do not send
# an Origin header, so they are unaffected by this restriction.

set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
cd "$dir"

# PocketBase 0.40 has no --config flag and ignores POCKETBASE_CONFIG_DIR; the
# data directory is selected with --dir and must be passed explicitly so the
# server can never fall back to another location.
export POCKETBASE_ENV=development

exec ./pocketbase.exe serve \
    --http=127.0.0.1:8090 \
    --origins=http://127.0.0.1:3000 \
    --dir="$dir/pb_data" \
    --hooksDir="$dir/pb_hooks" \
    --migrationsDir="$dir/pb_migrations"
