# Production Deployment Guide — Origin UPVC

The site runs on **Railway** as a Node.js server (`@astrojs/node`, standalone
mode). It isn't a static export because the admin panel writes files while the
site is live:

- `src/data/requests.json` — call requests from the contact form
- `src/content/portfolio/portfolio.json` + `public/portfolio/*` (images)
- `src/content/products/products.json` + `public/products/*` (images)

On Railway these live on a **volume** (a persistent disk). Code deploys never
touch it. `seed/` holds the starting content in the same folder layout, and
`server.mjs` copies it into the volume on first boot. Files that already
exist are never overwritten.

**How a deploy works:** push to `main` → Railway runs `npm ci` and
`npm run build` → starts `npm start` (`server.mjs`) → checks that `/ar/`
responds → switches traffic to the new version.

---

## 1. Before the first deploy

- [ ] `SITE_URL` in `astro.config.mjs` and the `Sitemap:` line in
      `public/robots.txt` use the real domain (currently
      `https://www.originupvc.com`).
- [ ] No placeholders left: `grep -rn "TODO: replace with client asset" src public`
- [ ] **Moving the current live content from Bluehost?** Do this *before* the
      first Railway deploy, because `seed/` is only copied into an empty volume:
      1. In Bluehost cPanel → File Manager, download from `~/origin-site/`:
         `src/content/portfolio/portfolio.json`,
         `src/content/products/products.json`, and the `public/portfolio/` and
         `public/products/` folders.
      2. Put them into the same paths under `seed/` (replace what's there),
         then commit and push.
      3. **Don't commit `src/data/requests.json`.** It contains customers'
         names and phone numbers. Export anything still needed from `/admin`
         by hand instead.

---

## 2. Railway setup (one time)

1. Push this repo to GitHub (`main` branch).
2. Go to <https://railway.com>, sign in **with GitHub**, and choose the
   **Hobby** plan.
3. **New Project → Deploy from GitHub repo** → pick `Origin-Client-Website`.
   If it isn't listed, click *Configure GitHub App* and give Railway access
   to the repo. The first build starts automatically. Let it run; it will be
   redeployed in the next steps.
4. **Add the volume** (this is what keeps the data):
   open the project canvas → right-click the service (or press `Ctrl+K`) →
   **Add Volume** → attach it to this service → mount path **`/data`**.
   Railway sets `RAILWAY_VOLUME_MOUNT_PATH=/data` itself, and the app uses it
   automatically.
5. **Variables** tab of the service → **New Variable**:
   - `ADMIN_PASSWORD` = a strong real password (never the dev one)

   Saving variables triggers a redeploy.
6. **Settings → Networking → Generate Domain**. You get a temporary
   `something.up.railway.app` address. Open it and check the site works
   (see section 5) before touching DNS.
7. **Settings → Source** should show branch `main` with auto-deploy on
   (the default). From now on, every push to `main` goes live in about 2 minutes.

Build and start settings come from `railway.json` in the repo, so there's
nothing to configure for them in the dashboard. The Node version comes from
`engines.node` in `package.json`.

---

## 3. Connect the GoDaddy domain

**a. Add the domain in Railway**

1. Service → **Settings → Networking → Custom Domain** → enter
   `www.originupvc.com`.
2. Railway shows the DNS records to create: a **CNAME** for `www` (target
   like `xxxx.up.railway.app`) and possibly a **TXT** verification record.
   Keep this page open.

**b. Check who manages the DNS**

GoDaddy → **My Products** → the domain → **DNS** → **Nameservers**.

- If they're GoDaddy's (`nsXX.domaincontrol.com`), continue below.
- If they point to Bluehost, either click **Change Nameservers → GoDaddy
  Nameservers (recommended)**, or make the same record changes in Bluehost's
  Zone Editor instead. Changing nameservers drops any records that were only
  set up at Bluehost (for example email/MX), so recreate those in GoDaddy
  first.

**c. Point `www` at Railway** (GoDaddy → domain → **DNS → DNS Records**)

1. Find the existing `CNAME` record named `www` → **Edit** (pencil icon).
   If there's none, **Add New Record** → Type `CNAME`, Name `www`.
2. **Value** = the target Railway showed. TTL = 1 hour (or 600 seconds).
   Save.
3. If Railway showed a TXT record, **Add New Record** → Type `TXT`, with
   exactly the Name and Value it gave you.
4. Don't change `MX` records (email) or any other records you don't recognise.

**d. Send the bare domain to `www`** (GoDaddy can't point the root `@` at a
CNAME)

1. Same DNS page → **Forwarding** tab → **Add Forwarding** → **Domain**.
2. Forward to `https://` + `www.originupvc.com`, type **Permanent (301)**,
   no masking. Save.
3. GoDaddy updates the root `A` record for the forward. Delete any leftover
   `A` record for `@` that pointed at Bluehost if GoDaddy didn't replace it.

**e. Wait for verification**

Back in Railway's Networking settings the domain turns green once DNS
propagates (usually minutes, sometimes up to a few hours). Railway issues
the HTTPS certificate automatically, with no other setup.

---

## 4. Turn off Bluehost

Only after `https://www.originupvc.com` loads from Railway and section 5
passes:

1. Delete the repository secrets `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `SSH_PORT`
   (GitHub repo → Settings → Secrets and variables → Actions). The old
   deploy workflow has already been removed from the repo.
2. Cancel the Bluehost hosting plan, but keep it until you're sure nothing
   else (such as email) still depends on it.

---

## 5. Smoke test (after the first deploy and after DNS)

```sh
curl -I https://www.originupvc.com/                  # 302 → /ar/
curl -I https://originupvc.com/                      # 301 → https://www.originupvc.com/
curl -I https://www.originupvc.com/en/
curl -I https://www.originupvc.com/sitemap-index.xml
curl -I https://www.originupvc.com/portfolio/portfolio-1.jpg   # 200 image/jpeg
```

Then in a browser:

1. Submit a call request on `/en/contact/` and check it appears in `/admin`.
2. Add a portfolio item with a photo in `/admin/portfolio` and check the photo
   shows on `/en/portfolio/`.
3. Push any small commit, wait for the deploy to finish, and check that the
   item from step 2 is **still there**. That proves the volume works.

---

## 6. Day to day

- **Deploying:** commit and push to `main`. Watch progress in Railway's
  **Deployments** tab. A failed build doesn't take the site down: the
  previous version keeps running.
- **Rolling back:** Deployments → open an older successful deploy →
  **Redeploy**.
- **Logs:** Deployments → the active deploy → **View Logs**.
- **Changing the admin password:** edit `ADMIN_PASSWORD` in Variables. The
  service restarts with it, and no code change is needed.
- **Backups:** the volume holds the only copy of the client's uploads and
  requests. Turn on backups on the volume (click the volume →
  **Backups**) if your plan includes them. Otherwise, periodically download
  copies from `/admin`.
- **Cost:** the Hobby plan is a monthly fee that includes some usage. A site
  this size normally stays within or close to it. Check **Usage** in the
  Railway account settings during the first month.

---

## Running the production build locally

```sh
npm ci
npm run build
ADMIN_PASSWORD=test npm start          # http://localhost:4321
```

Without `DATA_DIR`, data is read from and written to the project root (the
git-ignored files, same as `astro dev`). Set `DATA_DIR=/some/folder` to
test with a separate empty data folder, which gets filled from `seed/`.
