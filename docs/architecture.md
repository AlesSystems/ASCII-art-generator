# Architecture

## Goal

Convert images to ASCII art across two surfaces (CLI and web) without duplicating the conversion algorithm.

## Key decision: separate pure logic from platform I/O

The conversion algorithm is a **pure function** that takes raw RGBA pixel data and returns a string. It has no dependency on Node, the browser, the filesystem, or `sharp`. This lets the same code run identically in a CLI process and in a browser tab.

Image **loading** is platform-specific and lives in thin wrapper packages:

- **Node** uses `sharp` to decode JPEG/PNG/WebP/GIF into a raw RGBA buffer.
- **Browser** uses the Canvas API (`<canvas>` + `getImageData`) to extract RGBA from a `File` or `<img>`.

Both produce the same `Uint8ClampedArray` shape, which is what the core consumes.

```
┌──────────────────────────────────────────────────────────┐
│  @ascii-art/core  (pure TS, no platform deps)            │
│  ─────────────────────────────────────────────────────   │
│  pixelsToAscii(rgba: Uint8ClampedArray,                  │
│                width, height, opts) → string             │
│  Handles: grayscale, downsample, ramp mapping, invert,   │
│           Sobel edges, colored HTML output               │
└──────────────────────────────────────────────────────────┘
            ▲                                ▲
            │                                │
   ┌────────┴─────────┐            ┌─────────┴────────┐
   │ @ascii-art/cli   │            │ @ascii-art/web   │
   │ ──────────────── │            │ ──────────────── │
   │ sharp → RGBA     │            │ <canvas> → RGBA  │
   │ commander flags  │            │ React UI, live   │
   │ stdout/file/clip │            │ preview, sliders │
   └──────────────────┘            └──────────────────┘
```

## Conversion pipeline

Inside `core`, every conversion follows the same pipeline:

1. **Grayscale** — collapse RGBA to luminance using Rec. 709 weights: `Y = 0.2126·R + 0.7152·G + 0.0722·B`. These weights model human eye sensitivity better than a naive average.
2. **Downsample** — resize to the target character width using box-filter averaging. Apply a **0.5 vertical correction** because terminal characters are roughly twice as tall as they are wide; without it, output looks vertically stretched.
3. **Map to ramp** — index each pixel's brightness into a character ramp (e.g., `" .:-=+*#%@"`). Darker pixels → sparser characters, brighter → denser.
4. **(Optional) Sobel mode** — replace step 3 with edge-direction-based character selection (`- / | \`) using the gradient direction from Sobel-X and Sobel-Y convolutions.
5. **(Optional) Color output** — emit `<span style="color:#RRGGBB">X</span>` instead of bare characters, using the per-pixel RGB from the downsampled source.

## Repo layout

```
ASCII-art-generator/
├── packages/
│   ├── core/       # Phase 1: pure conversion
│   ├── cli/        # Phase 2: sharp + commander
│   └── web/        # Phase 3: Next.js + Canvas API
├── docs/
│   ├── architecture.md   (this file)
│   ├── tech-stack.md
│   ├── phases.md
│   └── algorithm.md      (Phase 5: math + diagrams)
├── .github/workflows/    # CI
└── README.md
```

`packages/` is wired together via npm workspaces. The `web` and `cli` packages depend on `@ascii-art/core` as a workspace dependency — no publishing dance required for local development.

## Why this matters

A reviewer reading `packages/core/src/index.ts` sees the algorithm in isolation: no I/O, no framework, no error handling for missing files. The platform packages stay thin shells. This is the structure that holds up under code review.
