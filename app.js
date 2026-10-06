// Passenger (cPanel Application Manager) entry point. Passenger always starts
// app.js; this just loads the Astro standalone server. Plain dynamic import so
// it works whether Passenger loads this file as CommonJS or ESM.
import('./dist/server/entry.mjs');
