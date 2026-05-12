# Tech Stack

Every choice here is **free of charge** with no credit card required. The project will never depend on a paid service.

## Runtime & language

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript 5** | Type safety; same code runs in Node and the browser |
| Node runtime | **Node 20 LTS** | Current LTS, supported by Vercel and GitHub Actions |
| Module system | ESM | Native, no transpilation hacks |

## Image processing

| Surface | Library | Why |
|---|---|---|
| Node-side decode | **`sharp`** | libvips bindings, fast, decodes JPEG/PNG/WebP/animated GIF |
| Browser-side decode | **Canvas API** | Built-in, zero dependencies, gives `Uint8ClampedArray` directly |
| Animated GIF (browser) | **`gifuct-js`** | MIT-licensed, frame-by-frame decoding |

## CLI (Phase 2)

| Need | Library | Why |
|---|---|---|
| Argument parsing | **`commander`** | Smallest learning curve, well-documented |
| Clipboard | **`clipboardy`** | Cross-platform, no native compilation step |

## Web (Phase 3)

| Need | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | First-class Vercel deploy; `@vercel/og` for shareable OG images |
| Styling | **Tailwind CSS** | Fast to iterate, zero runtime cost |
| Hosting | **Vercel Hobby** | $0; auto-deploy from GitHub `main`; 100 GB bandwidth/mo |

## Tooling

| Need | Choice | Why |
|---|---|---|
| Monorepo | **npm workspaces** | Built into npm; no extra tooling to learn |
| Tests | **vitest** | Fast, TS-native, runs the same in core and web |
| CI | **GitHub Actions** | Unlimited minutes on public repos |
| Package registry | **npm** | Free for public scoped packages |

## Explicitly avoided

- Paid image APIs (Cloudinary, imgix, etc.)
- Paid hosting (Railway, Fly paid tiers, etc.)
- Paid analytics — if needed, use Vercel Analytics free tier or self-hosted Plausible
- Anything that requires a credit card during sign-up

## Dependency-risk notes

- **`sharp`** ships prebuilt binaries for macOS (arm64/x64) and Linux. Pin the version in `package.json` to avoid surprises in CI. Fallback if a platform breaks: `jimp` (pure JS, slower, zero native deps).
- **`sharp` is Node-only** and must never end up in the browser bundle. Verify after `next build` that `@ascii-art/core` is the only shared dependency leaking into the web build.
