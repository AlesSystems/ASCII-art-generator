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
