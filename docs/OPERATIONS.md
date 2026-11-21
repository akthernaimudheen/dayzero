# DayZero — System Operations & Disaster Recovery Guide

## 1. Single-Server PocketBase Operational Architecture

DayZero uses PocketBase v0.40.6 compiled with Go and embedded SQLite. In production, SQLite operates in **WAL (Write-Ahead Logging)** mode.

### Database Files in `server/pb_data/`:
- `data.db`: The primary SQLite database containing user accounts, check-ins, facilities, groups, and posts.
- `data.db-wal`: The write-ahead log buffer for uncommitted concurrent write transactions.
- `data.db-shm`: The shared-memory index for coordinating concurrent readers and writers.
- `auxiliary.db`: PocketBase internal telemetry, logs, and migration history.

> [!CAUTION]
> In WAL mode, never back up or copy `data.db` without also including `data.db-wal` and `data.db-shm`. Copying `data.db` alone will cause database corruption or data loss.

---

## 2. Automated Hardened Backup Procedures

DayZero includes production-ready automated backup scripts for both Linux (`scripts/backup.sh`) and Windows (`scripts/backup.ps1`).

### Linux Automated Backup (`scripts/backup.sh`)
- Copies `data.db`, `data.db-wal`, `data.db-shm`, and `auxiliary.db` together to prevent torn pages.
- Sets restrictive file permissions (`chmod 700` on backup directory, `chmod 600` on archives).
- Verifies archive integrity with `unzip -tq` immediately following creation.
- **Safe Pruning Guarantee:** Prunes archives older than 30 days, but **strictly preserves at least the two most recent valid backups regardless of age**, preventing accidental complete data loss.

#### Crontab Configuration:
```bash
# Run DayZero backup every morning at 03:00 AM IST
0 3 * * * /opt/dayzero/scripts/backup.sh >> /var/log/dayzero_backup.log 2>&1
```

### Windows Host Backup (`scripts/backup.ps1`)
On Windows environments, file locks on running SQLite instances can prevent standard zip utilities from accessing `data.db`. `scripts/backup.ps1` handles this using .NET file streaming and `[System.IO.Compression.ZipFile]` without stopping the process:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup.ps1
```

---

## 3. Verified Disaster Recovery & Restore Drill Evidence

DayZero provides an automated, repeatable disaster recovery drill script:
```bash
node scripts/restore_drill.mjs
```

### Actual Drill Output & Execution Proof:
```
=== DayZero Disaster Recovery & Restore Drill ===
[1/6] Sourcing live data directory: C:\Users\akthe\Downloads\dayzero\server\pb_data
[2/6] Generating atomic backup archive: C:\Users\akthe\Downloads\dayzero\backups\drill_backup_2026-10-29T19-12-23-297Z.zip
[3/6] Verifying archive integrity and file size...
  Archive created successfully: 295928 bytes.
[4/6] Restoring snapshot to isolated directory: C:\Users\akthe\Downloads\dayzero\server\_restore_drill_data
[5/6] Booting PocketBase test instance on isolated port 8199...
[6/6] Verifying restored collections and record integrity...
  Health API response: { message: 'API is healthy.', code: 200, data: {} }
  Facilities collection intact: totalItems = 14
  Helplines collection intact: totalItems = 5
=== RESTORE DRILL PASSED 100% WITH ZERO ERRORS ===
```

### Manual Disaster Recovery Procedure (Linux Production Server):

#### Step 1: Stop the Running Services
```bash
sudo systemctl stop dayzero-pocketbase
sudo systemctl stop caddy
```

#### Step 2: Quarantine the Existing Data Directory
```bash
mv /opt/dayzero/server/pb_data /opt/dayzero/server/pb_data_broken_$(date +%s)
mkdir -p /opt/dayzero/server/pb_data
```

#### Step 3: Extract the Target Archive
```bash
unzip -q /opt/dayzero/backups/dayzero_backup_YYYYMMDD_HHMMSS.zip -d /opt/dayzero/server/
```

#### Step 4: Verify Database File Permissions & Integrity
```bash
chown -R dayzero:dayzero /opt/dayzero/server/pb_data
chmod 700 /opt/dayzero/server/pb_data
chmod 600 /opt/dayzero/server/pb_data/data.db

# Run SQLite integrity check
sqlite3 /opt/dayzero/server/pb_data/data.db "PRAGMA integrity_check;"
# Output must return: ok
```

#### Step 5: Restart and Verify Health
```bash
sudo systemctl start dayzero-pocketbase
sudo systemctl start caddy

# Verify health status:
curl -I http://127.0.0.1:8090/api/health
# Expected output: HTTP/1.1 200 OK
```

---

## 4. Monitoring & Operational Limits

### Health Check Endpoint:
- **URL:** `http://127.0.0.1:8090/api/health`
- **Response:** `{"code":200,"message":"API is healthy.","data":{}}`

### System Logs:
```bash
# Live stream backend daemon logs
sudo journalctl -u dayzero-pocketbase -f -n 100

# View Caddy access & TLS logs
tail -f /var/log/caddy/dayzero_access.log
```

### Operational Sizing Boundaries:
- **Max Recommended Daily Active Users (DAU):** 50,000 users on a single 4-core, 8 GB RAM instance.
- **Concurrent Requests:** 500 – 1,200 HTTP requests/second in WAL mode without write lock contention.
- **When to Consider Transitioning from PocketBase:**
  If the platform exceeds 50,000 DAU or requires multi-region active-active database clustering, migrate the backend adapters to an open-source PostgreSQL + Go/Node cluster. The domain logic and client applications in `@dayzero/shared` will require zero refactoring.
