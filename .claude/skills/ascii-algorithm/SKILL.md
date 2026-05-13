---
name: ascii-algorithm
description: Use when editing packages/core/ or anything involving grayscale, luminance, downsample, ramp, brightness mapping, Sobel, edge detection, or the pixelsToAscii function.
---

# ASCII Conversion Algorithm

Entry point: `pixelsToAscii(rgba: Uint8ClampedArray, width: number, height: number, opts) → string`
Lives in `packages/core/src/index.ts`. Pure function — no I/O, no side effects.

## Step 1 — Grayscale (Rec. 709 luminance)
```ts
Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
```
Do NOT use `(R+G+B)/3`. The 709 weights model human eye sensitivity to green/red/blue correctly.

## Step 2 — Downsample (box-filter + aspect correction)
```ts
const targetH = Math.round(targetW * (srcH / srcW) * 0.5);
```
The `0.5` vertical correction is mandatory — terminal chars are ~2x taller than wide.
Omitting it produces output that looks vertically squashed.
Box-filter: average all source pixels that fall within each target cell.

## Step 3 — Ramp mapping
```ts
const idx = Math.floor(brightness / 256 * ramp.length);
chars[i] = ramp[idx];
```
Clamp `brightness` to 0–255 before this formula. Without clamping, `brightness=256` gives `idx = ramp.length` → out-of-bounds.

## Preset ramps
| Name     | String (dark→bright)                          | Length |
|----------|-----------------------------------------------|--------|
| default  | `" .:-=+*#%@"`                                | 10     |
| inverted | `"@%#*+=-:. "`                                | 10     |
| extended | `" .'^\",;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"` | 70 |

`invert: true` reverses the effective ramp (bright pixels → sparse chars).

## Step 4 (Phase 4b) — Sobel edge mode
`mode: 'edges'` replaces ramp lookup with directional characters.
1. Apply 3x3 Sobel-X and Sobel-Y kernels to the grayscale image.
2. Gradient direction: `atan2(gy, gx)`.
3. Map angle to character: `─` (horizontal), `│` (vertical), `╱` (diagonal /), `╲` (diagonal \).
   ASCII fallback: `- | / \`.

## Step 5 (Phase 4a) — Color output
`output: 'html'` → emit `<span style="color:#RRGGBB">X</span>` using per-pixel RGB from downsampled source.
`output: 'ansi'` → ANSI escape codes for terminal color.

## Testing
Unit tests use synthetic 4x4/8x8 fixtures with known RGBA values → assert deterministic string output.
