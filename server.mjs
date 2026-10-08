// Production entry point (`npm start`). Fills the data directory from seed/
// on first boot — existing files are never overwritten, so admin edits and
// uploads on the Railway volume survive every redeploy — then starts the
// Astro standalone server.
import { cpSync, existsSync } from 'node:fs';

const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH;

if (dataDir && existsSync('seed')) {
  cpSync('seed', dataDir, { recursive: true, force: false, errorOnExist: false });
}

// Railway routes traffic to $PORT on all interfaces.
process.env.HOST ||= '0.0.0.0';

await import('./dist/server/entry.mjs');
