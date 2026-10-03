# Fiyan Portfolio

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/egenhets-projects/fiyan)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)

This is a modern portfolio website built with **Next.js 16**, **React 19**, **Tailwind CSS**, and **Payload CMS**. Portfolio projects are managed in Payload, stored in **Neon Postgres**, and media is stored in **Cloudflare R2**.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: 22.x or later
- **Package Manager**: pnpm 12.x

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dhiodhaha/fiyan-portfolio-cms.git
    cd fiyan-portfolio-cms
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Prepare environment variables:**
    ```bash
    cp .env.example .env.local
    ```

    Fill the values described in [Environment Variables](#environment-variables).

4.  **Run database migrations:**
    ```bash
    pnpm run payload:migrate
    ```

5.  **Import existing hardcoded portfolio content and images:**
    ```bash
    pnpm run payload:seed
    ```

    This reads `data/projects.ts`, `data/project-images.ts`, and `public/projects/**`, then creates Payload project/media records and uploads media to R2. The script is idempotent by project `slug` and media `filename`.

6.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the site.

Payload admin is available at [http://localhost:3000/admin](http://localhost:3000/admin).

## Environment Variables

Create `.env.local` for local development and add the same values to Vercel Project Settings for Preview/Production.

```bash
DATABASE_URL=
PAYLOAD_SECRET=
NEXT_PUBLIC_SITE_URL=
R2_BUCKET=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_PUBLIC_URL=
PAYLOAD_PREVIEW_SECRET=
CRON_SECRET=
```

### Required Values

- `DATABASE_URL`: Neon Postgres connection string. Use the pooled Neon connection string for Vercel unless you have a reason to use direct connections. Make SSL explicit with `sslmode=verify-full`, for example `postgres://user:password@host/db?sslmode=verify-full`.
- `PAYLOAD_SECRET`: Long random secret used by Payload for auth/session encryption. Generate with `openssl rand -base64 32`.
- `R2_BUCKET`: Cloudflare R2 bucket name, for example `fiyan-portfolio-media`.
- `R2_ENDPOINT`: Cloudflare R2 S3 API endpoint, usually `https://<account-id>.r2.cloudflarestorage.com`.
- `R2_ACCESS_KEY_ID`: R2 API token access key with read/write access to the bucket.
- `R2_SECRET_ACCESS_KEY`: R2 API token secret key.
- `R2_PUBLIC_URL`: Public R2/custom-domain base URL with no trailing slash, for example `https://media.example.com`.

Production startup and deployment builds require the database, a non-placeholder Payload secret, site URL, and all R2 values. Credential-free CI builds and local development may use static seed/fallback content; a local database without R2 stores uploads on local disk. Production preview is disabled without `PAYLOAD_PREVIEW_SECRET`; cron bearer authentication is disabled without `CRON_SECRET`. Neither secret belongs in a `NEXT_PUBLIC_*` variable.

### Cloudflare R2 Notes

- Configure the R2 bucket for public reads through a custom domain or public bucket URL.
- `R2_PUBLIC_URL` is what the frontend uses for images.
- `R2_ENDPOINT` is the private S3-compatible API endpoint used by Payload uploads.
- Payload admin uploads use direct browser uploads to R2, so the bucket needs CORS for local development and Vercel.

Example R2 CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-project.vercel.app",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Replace the Vercel and production domains with the real domains. If images display as broken, also confirm `R2_PUBLIC_URL` points to the bucket's public/custom-domain URL, not the S3 API endpoint.

### First Production Setup

1. Set the required variables in Vercel **Production**. Never share Production's `DATABASE_URL` with Preview; use a separate Neon branch/database and Preview credentials, or disable CMS/database access in Preview. Inspect each variable's scopes before enabling Preview deployments.
2. Back up the production database and rehearse the migrations against a copy. If Payload reports a previous dev-mode schema push and asks whether to proceed, **do not accept without first rehearsing against a backup**: the migration runner cannot determine whether that schema contains untracked changes.
3. Deploy the app. `vercel.json` runs `pnpm run build:vercel`: Production runs `payload:migrate` immediately before `next build`; Preview runs `next build` without migrations. A failed migration/build prevents the new deployment from becoming Ready and leaves the previous deployment serving traffic. Never run `payload:seed` as part of a deployment.
4. On a **new, empty** database only, run `pnpm run payload:seed` once with production Neon/R2 env vars.
5. Open `/admin` and create the first Payload user.
6. In **Site Settings → Profile**, set Description and upload a **Brand mark** (alt text is managed in the Media Library; leave it empty to keep the gradient mark). Publish the **Home Page** global with selected projects or the featured fallback enabled. Optional: edit the **Projects Page** global to change the archive eyebrow, heading, and description.

The `20261002_103348_portfolio_stability_schema` migration brings databases created solely from the older checked-in migrations up to the current CMS schema (media metadata, Project and Article versions/draft status, the Home Page and Site Settings globals, redirects, folders). `20261002_151056` adds the Projects Page global and renames the Site Settings brand-mark column. `20261002_153655_media_prefix` creates `media.prefix`, which the R2 storage plugin expects when enabled; a credential-free migration or schema push alone would omit it.

These migrations are idempotent and drift-aware: a database where Payload's dev-time schema push already created part of the schema (commonly the Site Settings global or R2 prefix) receives only the missing pieces, existing content is not recreated or dropped by these migrations, and the legacy status backfills only run when the draft-status column is genuinely new. The stabilization migration also fails loudly if it cannot produce the expected tables and columns.

`pnpm run test:db` rehearses this against a local Postgres: fresh database, historical-migrations-only database, historical database with a pre-existing Site Settings global, and a re-run of the newest migration. CI runs the same suite against an ephemeral Postgres service.

## 🛠️ Contribution Guidelines (Read Carefully!)

We welcome contributions! However, to keep the codebase clean and stable, please adhere to the following rules:

### 1. DRY Principle (Don't Repeat Yourself)
- **Reusable Components:** If you find yourself copying JSX, create a component in `components/ui/`.
- **Centralized Content:**
    - Production project content lives in Payload CMS.
    - `data/projects.ts` and `data/project-images.ts` are legacy seed/fallback sources only.
    - **DO NOT** hardcode portfolio content in page files. Add/edit projects and media in Payload.
    - Sidebar profile copy and the optional brand mark come from the **Site Settings** global; `lib/site-settings.ts` holds the single fallback used when the CMS is unavailable. Homepage slide selection lives in the **Home Page** global (Project-level "Featured" only feeds the fallback used when that selection is empty). Project archive copy lives in the **Projects Page** global with its fallback in `lib/projects-page.ts`.
- The archive's category filter omits empty categories on legacy/imported projects; those projects still appear under **All**.

### 2. Next.js 16 Compatibility
We use Next.js 16 with Payload's supported 3.84.1 package set.
- **Async Params:** In `page.tsx` or `layout.tsx`, dynamic route parameters (`params`) and `searchParams` are **Promises**. You MUST `await` them before use.
    ```tsx
    // CORRECT ✅
    export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
      const { slug } = await params;
      // ...
    }

    // INCORRECT ❌ (Will break in Next.js 15+)
    export default function Page({ params }: { params: { slug: string } }) {
      const slug = params.slug;
    }
    ```

### 3. Project Structure
- `app/`: App Router pages and layouts.
    - `app/(payload)/`: Payload admin and API route handlers.
- `components/`: React components.
    - `ui/`: Generic UI elements (buttons, inputs, cards).
- `collections/`: Payload collection definitions.
- `data/`: Legacy seed/fallback data sources.
- `lib/projects-cms.ts`: Payload-backed project query adapter with static fallback.
- `lib/homepage-slides.ts`: homepage slide selection with a non-blank fallback.
- `migrations/`: Payload Postgres migrations.
- `scripts/seed-payload.ts`: One-time/idempotent migration from legacy hardcoded data to Payload/R2.
- `utils/`: Helper functions (image association, category logic).
- `/portfolio` and nested paths redirect to `/` via `next.config.mjs`; `proxy.ts` and the old route are removed.

### 4. Verification Before Pushing
GitHub Actions runs frozen install, typecheck, lint, Payload type generation with a committed-file diff check, production build, and Playwright browser regressions on pushes to `main` and pull requests. Run locally:

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run lint
pnpm run payload:types  # commit payload-types.ts if it changes
pnpm run build
pnpm run test:smoke
pnpm exec playwright install chromium  # first run only
pnpm run test:e2e
pnpm dlx knip  # investigate findings; do not delete Payload entrypoints or seed data blindly
```

For a build without access to the CMS, set `DATABASE_URL=` in the command environment. For CMS verification, use an isolated Postgres database, run `pnpm run payload:migrate`, and test `/admin`, API, preview, and cache revalidation against that database. Do not run migrations against production without reviewing the generated additive migration first. Existing `data/projects.ts`, `data/project-images.ts`, and original images under `public/projects/` remain seed/static fallback content.

### 5. Media & Image Derivatives
Static seed media ships with pre-generated derivatives next to the originals:

- `public/projects/<slug>/<name>.webp` — original upload (seed source only).
- `public/project-media/<slug>/<name>-{thumb,detail,lightbox}.webp` — per-image derivatives.
- `public/project-thumbnails/<slug>.webp` — listing card thumbnails.
- CMS uploads get the same names from the `media` collection `imageSizes` (`thumbnail`, `gallery`, `detail`, `lightbox`, `og`).

Request the size the surface actually needs, and resolve URLs through `lib/media-url.ts` (`mediaUrl`, `mediaSizeUrl`, `mediaSrc`, `projectMediaVariantUrl`, `withProjectImageVariants`) instead of re-deriving R2/static paths locally:

| Surface | Derivative |
| --- | --- |
| Project listing card | `project-thumbnails/<slug>.webp`, else `thumbnail`/`gallery` |
| Project hero | `detail` |
| Gallery grid tile | `thumb` |
| Lightbox (mounted only while open) | `lightbox` |

Known legacy assets, kept deliberately: `public/images/lalu-fityan-new-profile.webp` is the only `/images/**` file referenced in code (site-settings fallback) — `public/og-image.webp` is a byte-identical unreferenced copy. The rest of `public/images/**`, the `*-professional.png` portraits and `placeholder-*.{png,svg,jpg}` have no code references. `diskominfo-kota-mataram` has no images, so its listing card falls back to `/placeholder.svg`; `switch-on-creative` reuses Kinta/Loka/Balakosa images from their own folders.

The 3.72 MiB `public/projects/switch-on-creative/output.gif` stays as legacy seed media; static lightboxes load its 0.67 MiB animated WebP derivative (`public/project-media/switch-on-creative/output-motion.webp`) only when opened. Animated lightboxes use the derivative URL directly to preserve motion; other images use Next Image optimization. Large multi-megabyte originals under `public/projects/` remain seed sources; cards use small derivatives instead. Nine hash-confirmed redundant copies under `public/images/` and `public/projects/smcp/` were removed (7.80 MiB). The remaining byte-identical OG/profile pair is kept because `/og-image.webp` may be referenced externally.

## 📄 License

This project is proprietary. Please contact the owner for usage rights.
