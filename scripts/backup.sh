#!/usr/bin/env bash
# DayZero PocketBase Hardened Automated Backup Script
# Handles SQLite WAL mode safely, verifies archive integrity, and protects against total backup loss.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/dayzero/backups}"
SERVER_DIR="${SERVER_DIR:-/opt/dayzero/server}"
PB_DATA_DIR="${PB_DATA_DIR:-${SERVER_DIR}/pb_data}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dayzero_backup_${TIMESTAMP}.zip"
TEMP_DIR=$(mktemp -d "/tmp/dayzero_backup_XXXXXX")

cleanup() {
    rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting DayZero backup..."

if [ ! -d "${PB_DATA_DIR}" ]; then
    echo "ERROR: Data directory not found: ${PB_DATA_DIR}" >&2
    exit 1
fi

# Ensure data.db exists
if [ ! -f "${PB_DATA_DIR}/data.db" ]; then
    echo "ERROR: Database file not found: ${PB_DATA_DIR}/data.db" >&2
    exit 1
fi

# Copy database files (including WAL and SHM if present for consistency)
mkdir -p "${TEMP_DIR}/pb_data"
cp "${PB_DATA_DIR}/data.db" "${TEMP_DIR}/pb_data/"
[ -f "${PB_DATA_DIR}/data.db-wal" ] && cp "${PB_DATA_DIR}/data.db-wal" "${TEMP_DIR}/pb_data/"
[ -f "${PB_DATA_DIR}/data.db-shm" ] && cp "${PB_DATA_DIR}/data.db-shm" "${TEMP_DIR}/pb_data/"
[ -f "${PB_DATA_DIR}/auxiliary.db" ] && cp "${PB_DATA_DIR}/auxiliary.db" "${TEMP_DIR}/pb_data/"

# Create compressed archive
(
    cd "${TEMP_DIR}"
    zip -q -r "${BACKUP_FILE}" pb_data/
)
chmod 600 "${BACKUP_FILE}"

# Verify archive integrity
if ! unzip -tq "${BACKUP_FILE}" > /dev/null 2>&1; then
    echo "ERROR: Backup archive integrity check failed: ${BACKUP_FILE}" >&2
    rm -f "${BACKUP_FILE}"
    exit 2
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup verified and created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Safe pruning: Count existing valid backups before pruning
VALID_BACKUPS=($(ls -1t "${BACKUP_DIR}"/dayzero_backup_*.zip 2>/dev/null || true))
TOTAL_BACKUPS=${#VALID_BACKUPS[@]}

# Never delete backups if total is 2 or fewer
if [ "${TOTAL_BACKUPS}" -gt 2 ]; then
    # Keep the latest 2 backups regardless of age, prune older than 30 days among the rest
    for (( i=2; i<TOTAL_BACKUPS; i++ )); do
        FILE="${VALID_BACKUPS[$i]}"
        # If older than 30 days (2592000 seconds)
        if [ $(($(date +%s) - $(stat -c %Y "${FILE}"))) -gt 2592000 ]; then
            echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Pruning expired backup: ${FILE}"
            rm -f "${FILE}"
        fi
    done
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup routine finished successfully. Retained ${TOTAL_BACKUPS} snapshot(s)."
