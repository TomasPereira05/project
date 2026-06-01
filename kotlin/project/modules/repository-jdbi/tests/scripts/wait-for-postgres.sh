#!/usr/bin/env sh
set -eu

HOST="${1:-localhost}"
PORT="${2:-5432}"
USER="${POSTGRES_USER:-postgres}"
DB="${POSTGRES_DB:-jagoz}"

until pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB"; do
  sleep 1
done
