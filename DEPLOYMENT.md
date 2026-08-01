# Production Deployment Guide — Origin UPVC

This site runs as a **Node.js server** (via `@astrojs/node`, standalone mode)
— it is not a static export. That's required because the admin panel and
portfolio manager read/write real files on disk at runtime:

- `src/data/requests.json`
- `src/content/portfolio/portfolio.json`
- `public/portfolio/*` (uploaded images)

Any host that can keep a Node process running works: a VPS (Ubuntu/Debian),
a Docker container, or a platform like Render/Railway. Static-only hosts
(GitHub Pages, Netlify's static tier, Vercel's static output) will **not**
work here.

---

## 1. Before you build — pre-deploy checklist

- [ ] Set the real production domain in `astro.config.mjs` (`SITE_URL` constant near the top).
- [ ] Update the `Sitemap:` line in `public/robots.txt` to match the real domain.
- [ ] Replace every placeholder marked `TODO: replace with client asset` — logo, phone number, WhatsApp number, address, social media links, product/portfolio photos, YouTube video links. Search the codebase:
  ```sh
  grep -rn "TODO: replace with client asset" src public
  ```
- [ ] Choose a real `ADMIN_PASSWORD` (see step 3) — don't ship the dev/test password.

---

## 2. Build

```sh
npm ci          # clean install from package-lock.json
npm run build
```

This produces:

- `dist/client/` — static assets (JS, CSS, optimized images, sitemap, robots.txt)
- `dist/server/entry.mjs` — the Node server entry point

---

## 3. Configure `ADMIN_PASSWORD`

The admin panel (`/admin`) and portfolio manager (`/admin/portfolio`) both
check this single password. Set it **on the production machine** — never
commit a real password to git.

**Option A — `.env` file on the server (simplest):**

```sh
cp .env.example .env
```

Edit `.env`:

```
ADMIN_PASSWORD=a-strong-real-password
```

The server loads this automatically at startup via the `dotenv` package.
Changing it later just requires **restarting the server** — no rebuild.

**Option B — a real OS/process-manager environment variable** (takes
precedence over `.env` if both are set) — see the PM2/systemd/Docker
examples below.

---

## 4. Run the server

The server **must run from the project root** — it resolves
`src/data/requests.json`, `src/content/portfolio/portfolio.json`, and
`public/portfolio/` relative to its working directory.

By default it listens on port `4321`. Override with `HOST`/`PORT`:

```sh
HOST=0.0.0.0 PORT=4321 node ./dist/server/entry.mjs
```

Quick manual test (no process manager yet):

```sh
node ./dist/server/entry.mjs
```

Then in another terminal: `curl http://localhost:4321/` — should redirect
to `/ar/`.

Don't run it this way long-term though — use a process manager (below) so it
restarts automatically on crash or server reboot.

### Option: PM2

```sh
npm install -g pm2
pm2 start ./dist/server/entry.mjs --name origin-upvc --cwd /path/to/project
pm2 save
pm2 startup   # follow the printed instructions to enable on-boot start
```

PM2 respects the project's `.env` file automatically as long as `--cwd`
points at the project root.

### Option: systemd

Create `/etc/systemd/system/origin-upvc.service`:

```ini
[Unit]
Description=Origin UPVC website
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=on-failure
User=www-data
Environment=HOST=0.0.0.0
Environment=PORT=4321
# Either rely on the project's .env file, or set the real password here instead:
# Environment=ADMIN_PASSWORD=a-strong-real-password

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now origin-upvc
sudo systemctl status origin-upvc
```

### Option: Docker

```dockerfile
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

```sh
docker build -t origin-upvc .
docker run -d \
  -p 4321:4321 \
  -e ADMIN_PASSWORD=a-strong-real-password \
  -v $(pwd)/data-volume/requests.json:/app/src/data/requests.json \
  -v $(pwd)/data-volume/portfolio.json:/app/src/content/portfolio/portfolio.json \
  -v $(pwd)/data-volume/portfolio-images:/app/public/portfolio \
  --name origin-upvc \
  origin-upvc
```

The volume mounts are important — without them, uploaded portfolio images
and submitted call requests disappear every time the container is rebuilt
(see step 6).

---

## 5. Put a reverse proxy in front (HTTPS + real domain)

The Node server itself doesn't handle TLS. Use nginx or Caddy in front.

### nginx

```nginx
server {
    listen 80;
    server_name www.yourdomain.com yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then get a free TLS cert:

```sh
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Caddy (auto-HTTPS, simpler)

```
yourdomain.com, www.yourdomain.com {
    reverse_proxy 127.0.0.1:4321
}
```

Caddy handles TLS certificates automatically — no certbot needed.

---

## 6. Protect your data across redeploys

`src/data/requests.json`, `src/content/portfolio/portfolio.json`, and
`public/portfolio/*` are written to at runtime and are **not part of your
git history or build output** in the usual sense — they live on the
server's disk. Whatever your redeploy process is, make sure it doesn't wipe
these:

- **Git-pull-based deploys:** deploy by `git pull` + `npm run build` inside
  the existing project directory, rather than deleting and re-cloning. These
  files aren't tracked by git (see `.gitignore`), so a `git pull` won't
  touch them.
- **Docker:** mount them as volumes (see the Docker example above) so they
  survive `docker build`/container recreation.
- **Any setup:** back them up periodically:
  ```sh
  cp src/data/requests.json backups/requests-$(date +%F).json
  cp src/content/portfolio/portfolio.json backups/portfolio-$(date +%F).json
  ```

---

## 7. Redeploying after a code change

```sh
git pull                # or however you get new code onto the server
npm ci
npm run build
pm2 restart origin-upvc # or: sudo systemctl restart origin-upvc
```

Because `ADMIN_PASSWORD` is read from `.env`/environment at server *startup*
(not baked into the build), you generally don't need to touch it on
redeploy — it's only affected if you edit `.env` and restart.

---

## 8. Post-deploy smoke test

```sh
curl -I https://yourdomain.com/                 # should redirect to /ar/
curl -I https://yourdomain.com/en/
curl -I https://yourdomain.com/robots.txt
curl -I https://yourdomain.com/sitemap-index.xml
curl -I https://yourdomain.com/admin            # should load (noindex, password gate)
```

Then in a browser: submit a test call request via `/en/contact/`, confirm
it shows up in `/admin`, and try adding/deleting a portfolio item via
`/admin/portfolio`.
