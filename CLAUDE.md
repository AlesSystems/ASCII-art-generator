# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

**Greenfield.** Only planning docs exist (`docs/architecture.md`, `docs/phases.md`, `docs/tech-stack.md`) — no `package.json`, no source code yet. When implementing, follow the phase plan in [docs/phases.md](docs/phases.md) and don't move on from a phase until its exit criterion is met.

## Planned commands

The repo will be an npm workspaces monorepo (Node 20 LTS, ESM, TypeScript 5). Once scaffolded:

- `npm test` from the root, or `npm test -w @ascii-art/core` for a single package
- `npm run -w @ascii-art/core test -- <pattern>` to run a single vitest file
- `npm run build -w @ascii-art/web` (Next.js 15, App Router)
- `npm link` inside `packages/cli` for local CLI testing before `npm publish`

## Architecture (read this before writing code)

The single most important design constraint: **the conversion algorithm is a pure function** living in `@ascii-art/core`. It takes `(rgba: Uint8ClampedArray, width, height, opts)` and returns a string. It has **no** Node, browser, filesystem, `sharp`, or canvas dependencies.

Image **loading** is platform-specific and stays in thin wrappers:

- `packages/cli/` — uses `sharp` to decode → raw RGBA buffer → core
- `packages/web/` — uses Canvas API (`getImageData`) → `Uint8ClampedArray` → core

When adding any feature, ask: *does this belong in core (pixel math) or in a platform package (I/O, UI, flags)?* `sharp` must never leak into the web bundle — verify with `next build` output.

### Conversion pipeline (inside core)

1. **Grayscale** — Rec. 709 luminance: `Y = 0.2126·R + 0.7152·G + 0.0722·B` (not naive average).
2. **Downsample** — box-filter averaging to target character width, with a **0.5 vertical correction** because terminal characters are ~2× taller than wide. Forgetting this correction produces visibly squashed output.
3. **Ramp mapping** — `Math.floor(brightness / 256 * ramp.length)`. Default ramp: `" .:-=+*#%@"`.
4. **Optional Sobel mode** (Phase 4b) — replace ramp lookup with gradient-direction characters (`- / | \`) from Sobel-X/Y kernels.
5. **Optional color output** (Phase 4a) — emit `<span style="color:#RRGGBB">X</span>` (HTML) or ANSI escapes instead of bare chars.

### Why this structure matters

A reviewer reading `packages/core/src/index.ts` should see the algorithm in isolation — no I/O, no framework, no file-not-found handling. Keep platform packages as thin shells.

## Constraints

- **$0 budget.** Every dependency and service must be free without a credit card. No Cloudinary/imgix/Railway/paid Vercel tiers. See [docs/tech-stack.md](docs/tech-stack.md) for the approved stack and the "explicitly avoided" list.
- **`sharp` install fragility** on some CI architectures — pin the version. Documented fallback is `jimp` (pure JS, slower).

## Error Logging

Every error — including agent-discovered issues — must be appended to `docs/ERROR.md` using the ERR-XXXX template. Update the index table. Never delete entries.

## Documentation Rule

Whenever you create or modify a file in `src/db/`, add or change a Server Action, or alter a core route, update the relevant file in `docs/` to reflect the change. Do not wait to be asked.

## Multi-Agent Notes

Multiple agents may work on different modules simultaneously. Do not revert unexpected changes — another agent may have made them. When delegating complex tasks, spawn sub-agents in parallel using claude-sonnet-4-6 by default.

## Important Notes

- Be concise and clear when providing information to user about implementation or error faced.
- Do not create documents in base directory.
- For complex tasks, use sub-agents to implement the tasks parallel with accuracy.
- For sub-agents, use sonnet 4.6 as a default agent if not another model specifically mentioned.
- Do not get confused if there are different changes on different modules. Team is working in this team so agents work on different modules at the same time simultaneously.
- If you see sudden changes in the codebase, do not revert as different agents are running paralelly for same or different modules at the same time. 
- On Windows/PowerShell, do not use Bash heredocs (`<<EOF`); pipe PowerShell here-strings to the target command or use `-c`.
- Documentation Rule: Whenever you create or modify a file(s) in src/db, add or change a server action, or alter a core route, you MUST proactively open the corresponding markdown file in the docs/ directory and update it to reflect your changes. Do not wait for me to ask.

## When completing tasks:

1. Analyze repository structure
2. Use relevant skills from .github/skills (if exists)
3. If have any questions or uncertanity, just ask developer to clarify.

## After implementation finish:

- Write short summary text in console to inform developer what to expect from that implementation.
- Provide guidance on how to test the current phase and inform user if manual approach is needed
- Ensure .github\workflows\ci.yml test will pass as soon as I push to github: Lint check and Type Check.

## About Errors:
- Before implementing, check ERRORS.md for known failure patterns 
related to project. List any that apply before writing code.
- After fixed a bug. Now:
  1. State the root cause in one sentence
  2. Write the generalized rule that prevents this class of error
  3. Append it to ERRORS.md, can be found in each module specifically.
  4. Check if copilot-instructions.md needs updating.
- Do not just fix the symptom. Identify: (a) why this happened, (b) where else in the codebase this same assumption might be wrong, (c) what rule would have prevented it.
