# Deploying to Vercel

The site is a standard Next.js 16 app that builds with **no environment variables at all** (it then uses the
Vercel domain and shows "Email me instead" instead of the contact form). Everything below is click by click.
Nothing here has been deployed yet: this is the guide for doing it.

**You need:** a Vercel account (sign up with GitHub at https://vercel.com/signup), access to the GitHub
repository **adminkatha/ijeportfolio**, and, for the contact form, the two values from `docs/CONTACT-SETUP.md`.

---

## 1. Import the repository
1. Go to https://vercel.com and log in (**Continue with GitHub**).
2. Click **Add New…** (top right) → **Project**.
3. Under **Import Git Repository**, find **adminkatha/ijeportfolio** and click **Import**.
   - Not in the list? Click **Adjust GitHub App Permissions** (or **Install** the Vercel app), give it access to
     that repository, and come back.

## 2. Configure the project (the screen after Import)
1. **Project Name:** e.g. `ehjay-lorenzo` (it becomes `ehjay-lorenzo.vercel.app` if that's free).
2. **Framework Preset:** **Next.js** (detected automatically). **Root Directory:** leave `./`.
3. **Build and Output Settings:** leave everything as it is. Vercel runs `pnpm install` and `pnpm build`
   (`next build`) because the repository has `pnpm-lock.yaml` and pins `"packageManager": "pnpm@12.9.1"`.
4. **Environment Variables:** open the section and add:

   | Name | Value | Why |
   |---|---|---|
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` | Makes Vercel install exactly pnpm 12.9.1 (see "About pnpm 12" below). |
   | `CONTACT_WEBHOOK_URL` | the `/exec` URL | The contact form (`docs/CONTACT-SETUP.md`). Optional for the first deploy. |
   | `CONTACT_SECRET` | the secret | Same. Add both or neither. |

   Don't add `SITE_URL` yet: until there's a custom domain, the site uses its `vercel.app` address by itself.
5. Click **Deploy** and wait for the confetti (about 2 minutes). Click the preview image to open the site.

## 3. Check the settings once
In the project: **Settings**.
1. **Build and Deployment → Node.js Version:** **24.x** (the default). Next.js 16 needs Node 20.9 or newer,
   and 24.x includes the Corepack version pnpm 12 needs.
2. **Environment Variables:** each variable above should be ticked for **Production** and **Preview**
   (click the variable's **⋯ → Edit** to change). Changing a variable needs a redeploy:
   **Deployments → the latest one → ⋯ → Redeploy**.

### About pnpm 12 (plain version)
- Vercel's documentation lists pnpm 6 to 10 as supported. This repository uses pnpm **12.9.1**, and its
  lockfile has the newer two-part format that only recent pnpm versions read.
- With `ENABLE_EXPERIMENTAL_COREPACK=1`, Vercel uses Corepack to install exactly the version in
  `package.json` (`pnpm@12.9.1`). That works on Node 24.x (the default) and recent 22.x. The build log
  should then say something like `Detected ENABLE_EXPERIMENTAL_COREPACK=1 and "pnpm@12.9.1" in package.json`.
- **If the install step fails anyway** (for example `ERR_PNPM_BROKEN_LOCKFILE` or `MODULE_NOT_FOUND` early in
  the log): remove the `ENABLE_EXPERIMENTAL_COREPACK` variable, add a file called `vercel.json` to the
  repository root with exactly this, push it, and redeploy:
  ```json
  {
    "installCommand": "npx --yes pnpm@12.9.1 install --frozen-lockfile",
    "buildCommand": "npx --yes pnpm@12.9.1 run build"
  }
  ```
  If the log then stops at `ERR_PNPM_IGNORED_BUILDS`, add the package it names to `allowBuilds` in
  `pnpm-workspace.yaml`.

## 4. Add your domain (when you have one)
1. **Settings → Domains → Add Domain**, type the domain (e.g. `example.com`) and click **Add**.
   Vercel suggests also adding `www.example.com` with a redirect to the main one: accept it.
2. Vercel shows the DNS records to create (an **A** record for the bare domain and/or a **CNAME** for `www`).
   Copy them exactly as shown.
3. At your domain registrar (where you bought the domain), open its DNS settings and add those records.
   Remove any old A/CNAME records for the same names that point elsewhere.
4. Back in Vercel, wait until the domain shows **Valid Configuration** (minutes, sometimes up to 48 hours).
   HTTPS is set up automatically.
5. **Settings → Environment Variables → Add:** `SITE_URL` = `https://example.com` (your real domain, with
   `https://` and no trailing slash), for **Production**. This puts the domain into canonical URLs, the
   sitemap and the share images' links.
6. **Deployments → ⋯ → Redeploy.**

## 5. Turn on Analytics and Speed Insights
The site already includes both, switched off until you enable them (otherwise their scripts would 404). In the project:
1. **Analytics** tab → **Enable**. Then **Settings → Environment Variables → Add:** `ENABLE_VERCEL_ANALYTICS` = `1` (Production).
2. **Speed Insights** tab → **Enable**. Then add `ENABLE_SPEED_INSIGHTS` = `1` (Production).
3. **Deployments → ⋯ → Redeploy**, then visit the site once. Data shows up after a few visits. (With Analytics on, the hero's "See the work" click is recorded as a custom event.)

## 6. After each deploy: checklist
- [ ] The site opens on the production URL, and the browser console (F12 → Console) shows no errors.
- [ ] **Contact form:** send a test message → "Thanks…" appears, a row arrives in the sheet's
      **Submissions** tab, and an email reaches ehjaylorenzo2@gmail.com (`docs/CONTACT-SETUP.md`, step 11).
      Without the two variables you should see "Email me instead" instead.
- [ ] **Lighthouse:** in Chrome, F12 → **Lighthouse** → Mode **Navigation**, Device **Mobile** → **Analyze**,
      for the homepage and one case study. Targets: Performance 90+, Accessibility 100, Best Practices 100, SEO 100.
- [ ] **Sitemap:** `https://<your-domain>/sitemap.xml` lists the homepage, `/work`, every case study and `/now`,
      all on your domain (if it shows `vercel.app` or `localhost`, `SITE_URL` is missing: step 4.5).
- [ ] **Robots:** `https://<your-domain>/robots.txt` ends with `Sitemap: https://<your-domain>/sitemap.xml`.
- [ ] **llms.txt:** `https://<your-domain>/llms.txt` shows the summary and the work list.
- [ ] **Share preview:** paste the homepage and a case-study URL into a preview tool (e.g. LinkedIn's
      Post Inspector, https://www.linkedin.com/post-inspector/) and check the title, description and image.
- [ ] **Analytics / Speed Insights:** the tabs start showing visits.
- [ ] Optional: in Google Search Console, add the domain and submit `sitemap.xml`.

## Day to day
- **Publishing a change:** push to the `main` branch (run `pnpm check:push` first). Vercel builds and
  publishes it automatically. Other branches get their own preview URL, which search engines are told not to index.
- **Undo a bad deploy:** **Deployments** → pick the last good one → **⋯ → Promote to Production** (Instant Rollback).
- **Run it on this PC:** double-click `run-local.bat` (installs if needed, builds, starts and opens
  http://localhost:3000, or the next free port if another program uses 3000; a specific port: `run-local.bat 3001`).

## Checked before handing over
On 2026-10-06 a fresh clone of the repository, with no `.env` files, installed with `pnpm install --frozen-lockfile`
(15 s) and built with `pnpm build` (65 s), both without errors. That is what Vercel runs.
