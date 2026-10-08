# Origin UPVC — Website

A bilingual (Arabic/English) marketing website for Origin UPVC, built with
Astro + React islands + Tailwind CSS. Content is file-based (Markdown +
JSON) — there is no database.

## Tech stack

- **Astro** — static-first rendering for every marketing page (fast, SEO-friendly)
- **React** — only for interactive islands: contact form, language switcher, portfolio lightbox, admin panels
- **Tailwind CSS v4** — styling (`src/styles/global.css`)
- **Astro Content Collections** — product pages (`src/content/products`)
- **@astrojs/node** — the site runs as a small Node server (not a static export), because the admin panel and portfolio manager read/write JSON files and images on disk at runtime

## Project structure

```
src/
  components/         reusable Astro + React components
  content/
    products/          en/*.md, ar/*.md — one file per product per language
    portfolio/
      portfolio.json   portfolio items (read/written at runtime)
  data/
    requests.json      call request submissions (read/written at runtime)
  i18n/                ar.ts / en.ts dictionaries + routing helpers
  layouts/             BaseLayout (public pages), AdminLayout (admin pages)
  pages/
    ar/, en/           localized routes (home, products, portfolio, contact)
    admin.astro        call requests dashboard (password protected, noindex)
    admin/portfolio.astro   portfolio manager (password protected, noindex)
    api/               server endpoints (contact form, admin auth, portfolio CRUD)
public/
  portfolio/           portfolio images (admin uploads land here)
```

Routing: Arabic is the default language, served at `/ar/...`; English is at
`/en/...`. The bare `/` redirects to `/ar/`. Admin pages (`/admin`,
`/admin/portfolio`) intentionally live outside the `/ar`/`/en` namespace and
are excluded from search indexing.

## Getting started

```sh
npm install
cp .env.example .env   # then edit .env and set a real ADMIN_PASSWORD
npm run dev
```

| Command           | Action                                                  |
| ------------------ | -------------------------------------------------------- |
| `npm install`      | Install dependencies                                      |
| `npm run dev`      | Start the local dev server at `localhost:4321`             |
| `npm run build`    | Build the production server into `./dist/`                 |
| `npm run preview`  | Run the built server locally (same as production)          |

## Setting `ADMIN_PASSWORD`

The admin panel (`/admin`) and portfolio manager (`/admin/portfolio`) are
protected by a single password read from the `ADMIN_PASSWORD` environment
variable — there's no username, database, or user table.

Copy `.env.example` to `.env` and set your own password:

```
ADMIN_PASSWORD=your-real-password
```

This works the same way in development and production — the server loads
`.env` from the project root at startup (via the `dotenv` package). Editing
`.env` and **restarting the server** (dev or production) picks up a new
password; no rebuild required. You can also set a real OS-level environment
variable instead of (or in addition to) `.env` — an existing environment
variable always takes precedence over the `.env` file.

## Adding / removing portfolio items

Go to `/admin`, enter the admin password, then click **Manage Portfolio** (or
go directly to `/admin/portfolio` — same password unlocks both pages).

- **Add:** upload an image (JPG/PNG/WebP, max 5MB), fill in the Arabic and
  English descriptions and a date, and submit. The image is saved to
  `public/portfolio/` and a new entry is appended to
  `src/content/portfolio/portfolio.json` — no rebuild required, it appears on
  the live `/portfolio` page and homepage teaser immediately.
- **Delete:** click **Delete** on any item in the grid and confirm. This
  removes both the image file and its JSON entry.

You can also hand-edit `src/content/portfolio/portfolio.json` directly if
you prefer (fields: `id`, `imagePath`, `descriptionAr`, `descriptionEn`,
`date`); just make sure `imagePath` points at a real file in `public/portfolio/`.

## Updating product content

Each product (`windows`, `shower-cabins`, `shutters`) has one Markdown file
per language in `src/content/products/en/` and `src/content/products/ar/`.
Edit the frontmatter (title, tagline, meta description, YouTube URL, photo
list) or the Markdown body (the full article) directly — no code changes
needed. Product photos referenced in frontmatter live in
`src/content/products/_images/`; add new images there and reference them
with a relative path (e.g. `../_images/my-photo.jpg`).

After editing content, redeploy (rebuild + restart the server) for the
change to go live — unlike the portfolio, product content is compiled at
build time.

## What still needs the client's real assets

Search the codebase for `TODO: replace with client asset` — it marks every
placeholder that needs a final value before launch:

- Logo (currently a text placeholder, "Origin UPVC", in the navbar)
- Real phone number, WhatsApp number, and business address (footer + JSON-LD)
- Real social media links (Instagram, TikTok, Facebook, YouTube, WhatsApp — currently `#`)
- Real product/portfolio photography (currently generated placeholder images)
- Real YouTube video links on each product page
- The production domain — update `SITE_URL` in `astro.config.mjs` and the
  `Sitemap:` line in `public/robots.txt`

## Deployment

The site is hosted on **Railway**. Every push to `main` is built and deployed
automatically. Runtime data (call requests, portfolio/products JSON and
uploaded images) lives on a Railway volume, so redeploys never touch it.

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full setup, including the
GoDaddy DNS steps. Short version:

- `npm run build`, then `npm start` (runs `server.mjs`, which copies `seed/`
  into an empty data directory on first boot and then starts the server).
- `DATA_DIR` (or Railway's `RAILWAY_VOLUME_MOUNT_PATH`) sets where runtime
  data is stored; without it, the project root is used, as in local dev.
- `ADMIN_PASSWORD` must be set as an environment variable.
