---
name: monorepo-conventions
description: Use when editing files under packages/, touching workspace config, mentioning monorepo, workspace, cross-cutting changes between core/cli/web, ESM, Node version, budget, or ERROR.md logging.
---

# Monorepo Conventions

## Pure-core boundary (most important rule)
`packages/core` must have ZERO imports from: Node built-ins, `sharp`, Canvas API, DOM, `fs`, `path`.
Any import that would fail in a browser is forbidden in core.

## Package commands
```sh
npm test                              # run all tests
npm test -w @ascii-art/core           # single package
npm run -w @ascii-art/core test -- <pattern>  # single file
npm run build -w @ascii-art/web       # Next.js build
npm link                              # inside packages/cli — local CLI test
```

## Workspace layout
```
packages/core/   @ascii-art/core   — pure conversion (no platform deps)
packages/cli/    @ascii-art/cli    — sharp + commander
packages/web/    @ascii-art/web    — Next.js + Canvas API
```
`web` and `cli` depend on `@ascii-art/core` as a workspace dependency (`"@ascii-art/core": "*"`).

## Shared data contract
Both platforms produce `Uint8ClampedArray` of RGBA bytes and pass it to core. That is the only shared type.

## Runtime & module system
- Node 20 LTS, TypeScript 5, ESM-only (`"type": "module"` in every package.json).
- Do not use CommonJS (`require`, `module.exports`). Do not use `__dirname` — use `import.meta.url` instead.

## $0 budget — forbidden services
Never add: Cloudinary, imgix, Railway, paid Vercel tiers, any service requiring a credit card.
Approved free hosting: Vercel Hobby. Approved free registry: npm public scoped packages.

## sharp must never leak to web
After every `next build`, verify `sharp` is absent from the browser bundle.
`sharp` is Node-only; importing it in `packages/web` will break the build.

## Error logging
Every discovered error must be appended to `docs/ERROR.md`:
- Format: `ERR-XXXX | <date> | <package> | <one-line description>`
- Update the index table at the top of the file.
- Never delete entries.

## CI
GitHub Actions (unlimited minutes on public repos). Lint + type-check must pass before merge.
