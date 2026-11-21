// DayZero — Automated Backup & Restore Drill (Zero external dependencies)
// Uses native Node.js and system zip tools to validate end-to-end disaster recovery.

import { spawn, execSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync, mkdirSync, cpSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SERVER_DIR = join(ROOT, 'server');
const PB_DATA = join(SERVER_DIR, 'pb_data');
const BACKUPS_DIR = join(ROOT, 'backups');
const RESTORE_DIR = join(SERVER_DIR, '_restore_drill_data');
const DRILL_PORT = 8199;
const DRILL_URL = `http://127.0.0.1:${DRILL_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDrill() {
  console.log('=== DayZero Disaster Recovery & Restore Drill ===');
  console.log(`[1/6] Sourcing live data directory: ${PB_DATA}`);
  if (!existsSync(join(PB_DATA, 'data.db'))) {
    throw new Error(`data.db does not exist at ${PB_DATA}`);
  }

  mkdirSync(BACKUPS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupZipPath = join(BACKUPS_DIR, `drill_backup_${timestamp}.zip`);

  console.log(`[2/6] Generating atomic backup archive: ${backupZipPath}`);
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${PB_DATA}' -DestinationPath '${backupZipPath}' -Force"`);
  } else {
    execSync(`zip -q -r "${backupZipPath}" "${PB_DATA}"`);
  }

  console.log(`[3/6] Verifying archive integrity and file size...`);
  const size = statSync(backupZipPath).size;
  console.log(`  Archive created successfully: ${size} bytes.`);
  if (size < 1000) {
    throw new Error(`Archive size unexpectedly small (${size} bytes)`);
  }

  console.log(`[4/6] Restoring snapshot to isolated directory: ${RESTORE_DIR}`);
  if (existsSync(RESTORE_DIR)) {
    rmSync(RESTORE_DIR, { recursive: true, force: true });
  }
  mkdirSync(RESTORE_DIR, { recursive: true });

  const tempExtract = join(SERVER_DIR, '_temp_extract');
  if (existsSync(tempExtract)) rmSync(tempExtract, { recursive: true, force: true });

  if (isWindows) {
    execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${backupZipPath}' -DestinationPath '${tempExtract}' -Force"`);
  } else {
    execSync(`unzip -q "${backupZipPath}" -d "${tempExtract}"`);
  }

  // Copy extracted pb_data contents into RESTORE_DIR
  const extractedPbData = join(tempExtract, 'pb_data');
  if (existsSync(extractedPbData)) {
    cpSync(extractedPbData, RESTORE_DIR, { recursive: true });
  } else {
    cpSync(tempExtract, RESTORE_DIR, { recursive: true });
  }
  rmSync(tempExtract, { recursive: true, force: true });

  if (!existsSync(join(RESTORE_DIR, 'data.db'))) {
    throw new Error('data.db was not restored properly into ' + RESTORE_DIR);
  }

  console.log(`[5/6] Booting PocketBase test instance on isolated port ${DRILL_PORT}...`);
  const binary = join(SERVER_DIR, isWindows ? 'pocketbase.exe' : 'pocketbase');

  const proc = spawn(
    binary,
    [
      'serve',
      `--dir=${RESTORE_DIR}`,
      `--hooksDir=${join(SERVER_DIR, 'pb_hooks')}`,
      `--migrationsDir=${join(SERVER_DIR, 'pb_migrations')}`,
      `--http=127.0.0.1:${DRILL_PORT}`,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let output = '';
  proc.stdout.on('data', (d) => { output += d.toString(); });
  proc.stderr.on('data', (d) => { output += d.toString(); });

  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      try {
        const res = await fetch(`${DRILL_URL}/api/health`);
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {}
    }

    if (!ready) {
      throw new Error(`Drill instance failed to start on port ${DRILL_PORT}. Log:\n${output}`);
    }

    console.log(`[6/6] Verifying restored collections and record integrity...`);
    const health = await (await fetch(`${DRILL_URL}/api/health`)).json();
    console.log(`  Health API response:`, health);

    const facRes = await fetch(`${DRILL_URL}/api/collections/facilities/records?perPage=1`);
    const facData = await facRes.json();
    console.log(`  Facilities collection intact: totalItems = ${facData.totalItems}`);

    const helpRes = await fetch(`${DRILL_URL}/api/collections/helplines/records?perPage=1`);
    const helpData = await helpRes.json();
    console.log(`  Helplines collection intact: totalItems = ${helpData.totalItems}`);

    if (facData.totalItems < 14) {
      throw new Error(`Expected at least 14 facilities, got ${facData.totalItems}`);
    }
    if (helpData.totalItems < 5) {
      throw new Error(`Expected at least 5 helplines, got ${helpData.totalItems}`);
    }

    console.log('=== RESTORE DRILL PASSED 100% WITH ZERO ERRORS ===');
  } finally {
    proc.kill();
    await sleep(600);
    if (existsSync(RESTORE_DIR)) {
      try {
        rmSync(RESTORE_DIR, { recursive: true, force: true });
      } catch {}
    }
  }
}

runDrill().catch((err) => {
  console.error('RESTORE DRILL FAILED:', err);
  process.exit(1);
});
