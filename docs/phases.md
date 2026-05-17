# Phase Plan

Five phases, each with a clear exit criterion. Don't move on until the current phase's exit criterion is met — every phase should leave the project in a shippable state.

For high-level structure, see [architecture.md](./architecture.md). For library choices, see [tech-stack.md](./tech-stack.md).

---

## Phase 1 — Core Engine

**Goal**: `pixelsToAscii(rgba, width, height, opts)` returns an ASCII string. Pure function, no I/O.

**Lives in**: `packages/core/`

**Steps**:

1. Initialize npm workspace root + `packages/core` with TypeScript + vitest.
2. Implement `grayscale(rgba)` → `Uint8Array` using Rec. 709 luminance: `0.2126·R + 0.7152·G + 0.0722·B`.
3. Implement `downsample(gray, srcW, srcH, targetW)` — preserve aspect ratio with a **0.5 vertical correction** (terminal chars are ~2x taller than wide). Box-filter averaging.
4. Implement `mapToRamp(gray, ramp)` — index into the ramp string by `Math.floor(brightness / 256 * ramp.length)`.
5. Export preset ramps:
   - default: `" .:-=+*#%@"`
   - inverted: `"@%#*+=-:. "`
   - extended: `" .'\` ^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"`
6. Add an `invert: boolean` option.
7. Unit tests with synthetic 4x4 / 8x8 fixtures — verify deterministic output for known inputs.

**Exit criterion**: `npm test` passes; `import { pixelsToAscii } from '@ascii-art/core'` works in a sibling package.

---

## Phase 2 — CLI Wrapper

**Goal**: `npx ascii-art cat.jpg --width 80` works and is published to npm.

**Lives in**: `packages/cli/`

**Steps**:

1. Scaffold `packages/cli` with `commander`, `sharp`, `clipboardy`.
2. Load image with sharp:
   ```ts
   sharp(path).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
   ```
   gives `{ data: Buffer, info: { width, height } }`.
3. Pass buffer to `pixelsToAscii` from `@ascii-art/core`.
4. Flags:
   - `-w, --width <n>` (default 80)
   - `-r, --ramp <preset|string>` (`default`, `inverted`, `extended`, or custom)
   - `-i, --invert`
   - `-o, --output <path>` (file; omit for stdout)
   - `-c, --clipboard` (copy to clipboard)
5. Add `bin` field in `package.json` pointing to `bin/ascii-art.js` (shebang wrapper).
6. Test locally with `npm link`.
7. Publish to npm under a scoped name (free for public packages).

**Exit criterion**: published to npm; `npx <pkg> photo.jpg` prints ASCII to terminal.

---

## Phase 3 — Web Interface

**Goal**: drag-and-drop image → live ASCII preview, deployed to Vercel.

**Lives in**: `packages/web/`

**Steps**:

1. Scaffold `packages/web` with `create-next-app` (App Router, TypeScript, Tailwind).
2. `lib/canvas-loader.ts`: accept a `File` or `HTMLImageElement`, draw to off-screen `<canvas>`, return `ImageData.data` (Uint8ClampedArray). Pass into core's `pixelsToAscii`.
3. UI components:
   - **Uploader** — drag-and-drop zone + file input fallback
   - **Controls** — width slider (40–200), contrast slider, ramp picker, invert toggle
   - **PreviewPane** — `<pre>` with monospace font, debounced re-render on slider change
   - **Actions** — Copy to clipboard, Download .txt
4. (Optional) move conversion to a Web Worker if slider drag is visibly janky.
5. Configure `next.config.js` to transpile the `@ascii-art/core` workspace package.
6. Connect repo to Vercel — auto-deploys on push to `main`.

**Exit criterion**: public URL on `*.vercel.app`; drag-and-drop works on iPhone Safari (falls back to file picker) and desktop.

---

## Phase 4 — Advanced Features

Three features prioritized for portfolio impact. Build in order; ship after each.

### 4a. Colored ASCII (HTML output)

Add `output: 'plain' | 'html' | 'ansi'` option in core. For `'html'`, emit `<span style="color:#RRGGBB">X</span>` per character using the per-pixel RGB from the downsampled source. Web app provides a "Download as .html" button. ANSI variant for the CLI gives colored terminal output.

### 4b. Sobel Edge Detection

Add `mode: 'brightness' | 'edges'`. For `'edges'`:

1. Apply Sobel-X and Sobel-Y 3x3 kernels to the grayscale image.
2. Compute gradient magnitude `sqrt(gx² + gy²)` and direction `atan2(gy, gx)`.
3. **Directional character selection** — map gradient direction to characters `─ ╱ │ ╲` (or ASCII `- / | \`) instead of brightness ramp. Produces the iconic line-art look.

### 4c. Animated GIFs

- **Browser**: `gifuct-js` to decode frames → call `pixelsToAscii` per frame → render at the GIF's frame delay via `requestAnimationFrame`.
- **CLI**: `sharp(path, { animated: true }).raw()` returns frames stacked vertically; slice and convert each.
- **UI**: play/pause button, "Download as animated HTML" (single self-contained file that cycles frames).

**Deferred** (out of scope for now): tweet-sized mode.

---

## Phase 4d — Quality v2

**Goal**: better default output for real-world photos and GIFs without
adding new dependencies. Built on top of phase 4c.

**Lives in**: `packages/core/` (algorithm), `packages/web/` and `packages/cli/` (exposure).

**What shipped**:

1. **Gamma-correct luminance** (`grayscale.ts`) — sRGB pixels are linearized
   before Rec.709 weighting and re-encoded to sRGB. Equal-RGB pixels round-trip
   unchanged; pure colors no longer look crushed. Gated by `opts.gamma` (default true).
2. **Percentile auto-contrast** (`auto-contrast.ts`) — 256-bucket histogram, clip
   `[N, 100-N]` percentile (default 2), linear stretch to [0,255]. Pulls the full
   ramp out of low-contrast photos. Gated by `opts.autoContrast` (default true).
3. **Brightness offset** — additive `[-100..100]` mapped to `[-255..255]` post
   auto-contrast. Surfaced as a Brightness slider in the web UI and `--brightness`
   in the CLI.
4. **Floyd–Steinberg dithering** (`dither.ts`) — error-diffusion quantizer on a
   Float32 working buffer (7/16 right, 3/16 below-left, 5/16 below, 1/16
   below-right). Dramatic improvement for smooth gradients. Gated by `opts.dither`
   (default false; opt-in toggle in UI / `--dither` in CLI).
5. **Hybrid mode** (`mode: 'hybrid'`) — brightness ramp in flat regions, Sobel
   edge characters where the gradient is strong. Most recognizable single-image
   output for portraits and line art.
6. **Normalized Sobel threshold** — magnitudes scaled to 0..255 per image, so
   `edgeThreshold` reads consistently across image sizes and GIF frames.
7. **Per-GIF frame stability** (`computeFrameStats`) — callers compute the
   contrast window once across every frame and pass it as `opts.frameStats` per
   frame. Auto-contrast stretches to the same window across the animation →
   no more brightness pulse on playback.

**Legacy escape hatch**: setting `{ gamma: false, autoContrast: false, dither: false }`
on the core call (or `--legacy` on the CLI) produces byte-identical output to the
pre-v2 algorithm. Used by the legacy fixture tests.

**Exit criterion**: `cd packages/core && npm test` passes (78 tests). Web build
succeeds with `sharp` absent from the bundle. CLI smoke test for `--mode hybrid`
and `--dither` passes. Manual: a low-contrast photo uses the full ramp width with
defaults; a GIF with brightness-varying frames plays back without pulsing.

---

## Phase 5 — Polish (Portfolio Layer)

This is what turns "working" into "hireable." Each item is a deliverable:

1. **Gallery** — `docs/gallery/` with 6–8 before/after pairs (portrait, landscape, line-art, animated). Use only your own photos or Creative Commons.
2. **README rewrite** — hero image, 30-second quickstart, links to live demo + npm + blog post, one algorithm diagram.
3. **`docs/algorithm.md`** — brightness-mapping math for a curious reader:
   - Why Rec. 709 luminance weights vs. naive average
   - The 0.5 vertical aspect correction (with squashed-vs-correct comparison)
   - Sobel kernel diagrams
4. **Blog post** — "How I built an ASCII art generator," published on dev.to or your own site (both free). Cross-link from README.
5. **Open Graph tags** — dynamic OG image showing the user's last conversion via `@vercel/og` (free), so shares on Twitter/LinkedIn look slick.
6. **Lighthouse** — aim 95+ on Performance, Accessibility, Best Practices, SEO. Credibility signal reviewers check.

---

## Verification per phase

| Phase | How to verify |
|---|---|
| 1 | `cd packages/core && npm test` — all unit tests pass; snapshot test for known 8x8 fixture |
| 2 | `ascii-art sample.jpg --width 80` → readable ASCII; `-c` copies to clipboard; `-o out.txt` writes file |
| 3 | Vercel preview URL loads; image drag-and-drop works; slider updates preview within 100ms |
| 4 | Colored HTML matches source; Sobel mode produces recognizable line art; GIF plays at original frame rate |
| 5 | Lighthouse 95+; a stranger can understand and run the project from the README in 60 seconds |

---

## Risks

- **`sharp` install issues** on some CI architectures. Pin a version with prebuilt binaries. Fallback: `jimp` (pure JS, slower).
- **Animated GIF decoding is the hardest piece.** Build 4c last; if it slips, colored + Sobel alone is already strong.
- **Bundle bloat** — `sharp` must not leak into the web bundle. Verify with `next build` output.
