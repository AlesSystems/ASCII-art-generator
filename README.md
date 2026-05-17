# ASCII Art Generator

Convert any image — including animated GIFs — to ASCII art. Runs entirely on your machine: no uploads, no accounts, $0 cost. Ships as a CLI tool, a Next.js web app, and a reusable TypeScript library.

## Features

- **Pure TypeScript core** — Rec. 709 luminance, box-filter downsample with 0.5 vertical aspect correction, default ramp `" .:-=+*#%@"`
- **Three conversion modes**: `brightness` (ramp mapping), `edges` (Sobel line art), `hybrid` (edges where gradients are strong, ramp elsewhere)
- **Color output** — ANSI truecolor escapes for the CLI; `<span style="color:#RRGGBB">` HTML spans for the web app
- **Image quality controls** — gamma-correct luminance, percentile auto-contrast (2/98 clip), brightness offset (-100..100), Floyd-Steinberg dithering, ramp invert
- **Custom ramps** — pass a preset name (`default`, `extended`) or any raw character string
- **Animated GIF support** — per-frame conversion with stable auto-contrast across frames; web preview animates in-browser; CLI produces a self-contained animated HTML file
- **Web app** — drag-and-drop upload, live preview via Web Worker, copy to clipboard / download `.txt` / download `.html`, fully local (nothing is sent to a server)
- **CLI** — stdout, `--output <path>`, `--clipboard`; `--color` ANSI output; `--animate` for animated HTML; `--legacy` for byte-identical pre-v2 output

## Try it

### Web app

Clone the repo and run locally:

```bash
git clone https://github.com/AlesSystems/ASCII-art-generator.git
cd ASCII-art-generator
npm install
npm run dev -w @ascii-art/web
```

Open [http://localhost:3000](http://localhost:3000). Drag an image (including an animated GIF) onto the page and adjust the controls.

The web app is designed to deploy to Vercel free tier. Connect the repo in the Vercel dashboard; it builds with `npm run build -w @ascii-art/web`.

### CLI

**Local development (npm link):**

```bash
git clone https://github.com/AlesSystems/ASCII-art-generator.git
cd ASCII-art-generator
npm install
npm run build -w @ascii-art/cli
cd packages/cli
npm link
```

Then from anywhere:

```bash
ascii-art photo.jpg
```

Once the package is published to npm you will also be able to run:

```bash
npx @ascii-art/cli photo.jpg
```

**Example commands:**

```bash
# 120-character wide output
ascii-art photo.jpg --width 120

# ANSI truecolor output in the terminal
ascii-art photo.jpg --color

# Sobel edge-detection mode
ascii-art photo.jpg --mode edges

# Hybrid mode with Floyd-Steinberg dithering
ascii-art photo.jpg --mode hybrid --dither

# Brighten a dark image and save to a file
ascii-art photo.jpg --brightness 30 --output out.txt

# Animated HTML from a GIF
ascii-art animation.gif --animate --output animation.html

# Copy result to clipboard
ascii-art photo.jpg --clipboard

# Use the extended character ramp, inverted
ascii-art photo.jpg --ramp extended --invert
```

## CLI reference

| Flag | Default | Description |
|---|---|---|
| `-w, --width <n>` | `80` | Target character width |
| `-r, --ramp <preset\|string>` | `default` | Ramp preset name or raw character string |
| `-i, --invert` | off | Invert the ramp |
| `-o, --output <path>` | — | Write result to a file instead of stdout |
| `-c, --clipboard` | off | Copy result to clipboard (suppresses stdout) |
| `-C, --color` | off | Colorize output using ANSI truecolor escapes |
| `-e, --edges` | off | Shortcut for `--mode edges` (backwards compat) |
| `-m, --mode <mode>` | `brightness` | `brightness`, `edges`, or `hybrid` |
| `-a, --animate` | off | Convert all GIF frames to animated HTML (requires `--output`) |
| `--no-gamma` | — | Disable gamma-correct luminance (naive sRGB byte weighting) |
| `--no-auto-contrast` | — | Disable percentile auto-contrast |
| `--dither` | off | Floyd-Steinberg dithering for smoother gradients |
| `-b, --brightness <n>` | `0` | Brightness offset, -100..100 |
| `--edge-threshold <n>` | `30` | Sobel threshold on a normalized 0..255 scale |
| `--legacy` | off | Byte-identical pre-v2 output (disables gamma, auto-contrast, dither) |

## Library usage

`@ascii-art/core` exports a single pure function with no I/O dependencies. Use it directly in any TypeScript or JavaScript project.

```typescript
import { pixelsToAscii } from "@ascii-art/core";
import type { PixelsToAsciiOpts } from "@ascii-art/core";

// rgba is a Uint8ClampedArray from Canvas getImageData or any RGBA source
const opts: PixelsToAsciiOpts = {
  width: 100,              // target character columns (default 80)
  ramp: "default",         // preset name or raw string
  invert: false,
  mode: "brightness",      // 'brightness' | 'edges' | 'hybrid'
  output: "plain",         // 'plain' | 'html' | 'ansi'
  gamma: true,             // gamma-correct Rec. 709 luminance
  autoContrast: true,      // percentile clip [2, 98]
  dither: false,           // Floyd-Steinberg dithering
  brightness: 0,           // additive offset -100..100
  edgeThreshold: 30,       // normalized Sobel threshold 0..255
};

const ascii = pixelsToAscii(rgba, imageWidth, imageHeight, opts);
console.log(ascii);
```

Key option notes:

- `output: 'html'` emits `<span style="color:#RRGGBB">` per character; useful for colored web rendering or downloadable HTML files.
- `output: 'ansi'` emits ANSI truecolor escape sequences for terminal color.
- `frameStats` can be passed for animated GIFs to stabilize auto-contrast across frames (see `computeFrameStats` in the package).

## Project structure

```
packages/
  core/   — Pure pixel-to-ASCII algorithm (@ascii-art/core). No I/O, no framework.
  cli/    — CLI wrapper using sharp for image loading (@ascii-art/cli).
  web/    — Next.js 15 web app using Canvas API + gifuct-js (@ascii-art/web).
docs/     — Architecture, phase plan, tech stack, error log.
```

## Development

Requires **Node 20 LTS**.

```bash
# Install all workspace dependencies
npm install

# Run all tests (vitest)
npm test

# Build all packages
npm run build

# Type-check all packages
npm run typecheck

# Lint all packages
npm run lint

# Run just the core tests
npm test -w @ascii-art/core

# Start the web dev server
npm run dev -w @ascii-art/web
```

Tests are written with [Vitest](https://vitest.dev/).

## Architecture

The conversion algorithm lives entirely in `@ascii-art/core` as a pure function (`pixelsToAscii`) with no Node, browser, filesystem, or framework dependencies. Image loading is handled by thin platform wrappers: the CLI uses `sharp` to decode images to a raw RGBA buffer; the web app uses the Canvas `getImageData` API plus `gifuct-js` for GIF decoding. `sharp` never enters the web bundle — this is verified on every `next build`. For a full description of design decisions and the phase roadmap, see:

- [docs/architecture.md](docs/architecture.md)
- [docs/phases.md](docs/phases.md)
- [docs/tech-stack.md](docs/tech-stack.md)

## License

MIT. See [LICENSE](LICENSE).
