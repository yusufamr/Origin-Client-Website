# SEO Setup Guide

Three things to do after deploying the site to `https://www.originupvc.com` — all free, all outside the codebase.

## 1. Google Business Profile

This is what makes Origin UPVC show up on Google Maps and in the map box when someone searches "UPVC windows Cairo" — think of it as a free business listing card Google shows to people searching nearby.

1. Go to **google.com/business** and sign in with a Google account (make one for the business if needed, e.g. `originupvc@gmail.com`).
2. Click **"Add your business"** and enter the name: **Origin UPVC**.
3. Pick a category — e.g. **"Window installation service"** or **"Door supplier"**. This tells Google what kind of searches to show you for.
4. It will ask if customers can visit in person:
   - Have a shop/showroom people can walk into? → give the real address (Badr, Cairo).
   - Only visit customers' homes (no walk-in shop)? → mark it as a "service area business" and just list Cairo/Badr as the area served, without a public address.
5. Add the phone number: **+20 127 368 3473**.
6. Add the website: **https://www.originupvc.com**.
7. **Verification** — Google needs proof the business is real. It will offer one of:
   - A postcard mailed to your address with a code on it (1–2 weeks, most common in Egypt)
   - A phone call with an automated code
   - Instant verification, if available
   Enter the code back on the Business Profile site to confirm.
8. Once verified, fill in the rest: business hours, a description, and **upload real photos** — finished windows/shutters/shower cabin installations. Listings with photos get picked far more often.
9. Ask happy customers to leave a **Google review**. This is one of the biggest ranking factors for local search — a handful of good reviews matters more than almost anything else here.

Once verified and filled out, the business starts appearing on Google Maps and in local search results.

## 2. Google Search Console

This is what tells Google "here's my site, please read it" — registering the site so Google knows to visit and index its pages.

1. Go to **search.google.com/search-console** and sign in with the same Google account.
2. Click **"Add property"**, choose **"URL prefix"**, and enter `https://www.originupvc.com`.
3. Prove ownership. Easiest method: Google gives a small meta tag, which gets pasted into the site's `<head>` — then click "Verify" and it's done in seconds. (Other options: upload a file, or add a DNS record with the domain host.)
4. Once verified, go to **"Sitemaps"** in the sidebar, enter `sitemap-index.xml`, and click Submit. This file lists every page on the site — Astro generates it automatically.
5. Google crawls and indexes pages over the next few days to weeks (not instant). Check progress under "Pages" in the sidebar — it flags anything it couldn't read.

## 3. Make sure `originupvc.com` and `www.originupvc.com` aren't two separate live sites

The site's canonical address is `www.originupvc.com`. The non-www version (`originupvc.com`) needs to **redirect** to it, not load as its own separate working copy — otherwise Google sees two identical sites and splits ranking between them instead of counting it all toward one.

**How to check:** type `http://originupvc.com` (no www) into a browser and look at the address bar after it loads:
- Address bar **changes** to `www.originupvc.com` → correct, it's a proper redirect. ✅
- Address bar **stays** as `originupvc.com` with no www, but the page still loads → both are live separately, needs fixing. ❌

**How to fix it:** wherever the domain is hosted/managed (Cloudflare, GoDaddy, Namecheap, Vercel, etc.), there's a "redirect" or "domain forwarding" setting — point `originupvc.com` → `https://www.originupvc.com` as a 301 (permanent) redirect. The exact steps depend on the host.

## Order of operations

1. Deploy the site to `www.originupvc.com`, and confirm the non-www redirect (section 3 above).
2. Set up Search Console (a few minutes).
3. Start the Google Business Profile process early — the mail verification step can take 1–2 weeks.
