// Passenger (cPanel "Setup Node.js App") entry point. Passenger can't load the
// ESM server directly, so this CommonJS shim imports it.
import('./dist/server/entry.mjs');
