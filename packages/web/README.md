# @ascii-art/web

Next.js 15 App Router front-end for the ASCII art generator.

## Local development

```bash
npm run dev -w @ascii-art/web
```

Run from the repo root. The app starts at http://localhost:3000.

## Build

```bash
npm run build -w @ascii-art/web
```

## Notes

Image decoding happens in the browser via Canvas. No uploads, no backend, no `sharp` in the bundle.

## Vercel deployment

Deployment is configured at the repo root via [`vercel.json`](../../vercel.json) — no per-project setup is required in the Vercel dashboard.

1. Import the repository into Vercel and **leave the Root Directory as the repo root** (do not point it at `packages/web`).
2. Vercel reads `vercel.json` and runs:
   - `installCommand`: `npm install` (installs all workspaces at the root)
   - `buildCommand`: `npm run build -w @ascii-art/core && npm run build -w @ascii-art/web` (core is built first so `dist/index.js` exists when web resolves the workspace import)
   - `outputDirectory`: `packages/web/.next`
3. No environment variables are required. All routes are statically prerendered.

The build output is fully static — no serverless functions, no edge runtime, no `sharp` (CLI-only dep stays out of the web bundle). Fits the Vercel Hobby (free) tier.
