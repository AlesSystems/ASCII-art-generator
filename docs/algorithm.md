# Algorithm reference

This document explains the math inside `@ascii-art/core`'s `pixelsToAscii()`.
Read alongside [`packages/core/src/index.ts`](../packages/core/src/index.ts).

## Pipeline

For brightness and hybrid modes:

```
RGBA bytes
   │
   ▼
gamma-correct grayscale  (grayscale.ts)
   │
   ▼
box-filter downsample    (downsample.ts; 0.5 vertical correction)
   │
   ▼
percentile auto-contrast (auto-contrast.ts; optional)
   │
   ▼
brightness offset        (auto-contrast.ts; additive)
   │
   ▼
[Floyd–Steinberg dither] (dither.ts; optional)
   │
   ▼
ramp lookup              (ramp.ts; mapToRamp or mapIndicesToChars)
   │
   ▼
[Sobel overlay if hybrid]
   │
   ▼
plain / HTML span / ANSI escape rendering
```

Edges-only mode replaces the ramp lookup with `directionToChar(...)` on
normalized Sobel magnitudes.

## 1. Gamma-correct luminance

The naive luminance formula `Y = 0.2126·R + 0.7152·G + 0.0722·B` applied to
sRGB byte values is **not** physically correct. sRGB pixels are
gamma-encoded; the Rec. 709 coefficients describe a weighted sum in
**linear** light. Applying them directly to gamma-encoded bytes biases the
result toward darker tones, especially for saturated colors.

The pipeline now linearizes each channel via the standard sRGB EOTF before
weighting and re-encodes the weighted sum back to sRGB:

```
c_linear = c_srgb / 255 ≤ 0.04045
            ? c_srgb / (255 · 12.92)
            : ((c_srgb / 255 + 0.055) / 1.055) ^ 2.4

Y_linear = 0.2126 · R_linear + 0.7152 · G_linear + 0.0722 · B_linear

Y_srgb = Y_linear ≤ 0.0031308
            ? round(Y_linear · 12.92 · 255)
            : round((1.055 · Y_linear^(1/2.4) - 0.055) · 255)
```

Equal-RGB pixels round-trip unchanged (the linear → weighted → sRGB chain
is the identity when R=G=B). Pure red, green, blue produce noticeably
brighter byte values than the naive path.

Gated by `opts.gamma` (default true). 256-entry LUTs amortize the cost.

## 2. Aspect-ratio correction

Terminal characters are roughly twice as tall as wide. The downsampler
halves the target height to compensate:

```
targetH = round(srcH / srcW · targetW · 0.5)
```

Without this correction the output looks vertically squashed by ~2×.

## 3. Box-filter downsampling

For each target cell, average all source pixels covered by the cell's
rectangle in source coordinates. Faster and simpler than Lanczos; produces
acceptable results at typical web widths (40–200 chars). Implementation in
[`downsample.ts`](../packages/core/src/downsample.ts).

## 4. Percentile auto-contrast

Many real-world photos use only a fraction of the brightness range — an
indoor portrait might cluster around 80..180. Mapping that compressed range
through the ramp gives output that uses only 3–4 distinct characters.

The auto-contrast pass builds a 256-bucket histogram of the downsampled
gray, walks inward from both ends until each tail has accumulated `N%` of
the pixels (default `N=2`), and linearly stretches `[lo, hi]` to `[0, 255]`.
The histogram tail trim makes the stretch robust to specular highlights
and shadow noise.

Disabled by `opts.autoContrast: false`.

## 5. Brightness offset

Additive offset applied after auto-contrast. Slider range `[-100, 100]`
maps to byte offset `[-255, 255]` via `offset = round(brightness · 2.55)`.
Cheap inline pass; clamped to `[0, 255]` per pixel.

## 6. Floyd–Steinberg dithering

Quantizing brightness to a small ramp produces visible banding on smooth
gradients (skies, faces). Floyd–Steinberg spreads each pixel's quantization
error into the unprocessed neighbors:

```
                       │  *  │ 7/16 │
            ───────────┼─────┼──────┤
            │ 3/16     │5/16 │ 1/16 │
```

The cell at `*` quantizes to its nearest ramp step; the residual `(oldVal
- newVal)` is added to the neighbors in fractional amounts. The
implementation uses a `Float32Array` working buffer so accumulated error
isn't clamped to bytes mid-loop.

Off by default — opt-in via the Dither toggle or `--dither` flag because
the visible noise can read as "gritty" on small character widths.

## 7. Sobel edge detection

For edges and hybrid modes, two 3×3 kernels approximate the partial
derivatives of brightness:

```
Kx = [-1  0  1     Ky = [-1 -2 -1
      -2  0  2            0  0  0
      -1  0  1]           1  2  1]

gx = sum(Kx ⊙ window),  gy = sum(Ky ⊙ window)
magnitude = sqrt(gx² + gy²)
direction = atan2(gy, gx)
```

The gradient direction is **perpendicular** to the edge. Folding direction
into `[0, π)` (edges at θ and θ+π are the same edge) and snapping to the
nearest π/4 sector gives four characters:

| folded direction | edge | char |
|---|---|---|
| ≈ 0     | vertical    | `\|` |
| ≈ π/4   | diagonal ↘  | `/`  |
| ≈ π/2   | horizontal  | `-`  |
| ≈ 3π/4  | diagonal ↙  | `\`  |

### Magnitude normalization

The raw Sobel magnitude depends on image contrast and resolution — a
threshold of `30` reads very differently on a 16-wide vs 200-wide image,
and across the frames of a GIF where brightness varies. The pipeline
divides every magnitude by the per-image max and rescales to `[0, 255]`
before threshold comparison. `edgeThreshold` is now a stable percentage of
the strongest edge in the image (default 30 → roughly 12% of max).

## 8. Hybrid mode

`mode: 'hybrid'` combines the brightness ramp with edge detection. For
each cell:

```
char = normalizedMagnitude[i] >= edgeThreshold
         ? directionToChar(...)    // strong edge
         : brightnessChar[i]       // brightness ramp (possibly dithered)
```

Colorization uses the same per-cell RGB regardless of which character
won, so the output keeps both shaded fills and crisp outlines.

## 9. GIF frame stability

Auto-contrast applied per-frame produces a flicker on GIFs whose
brightness range shifts between frames (sunset gradients, beating hearts).
The pipeline lets callers compute a combined window once and reuse it:

```ts
let lo = 255, hi = 0;
for (const f of file.frames) {
  const s = computeFrameStats(f.rgba, f.width, f.height, { width, gamma });
  if (s.lo < lo) lo = s.lo;
  if (s.hi > hi) hi = s.hi;
}
const frameStats = { lo, hi };
// then pass `frameStats` to every per-frame pixelsToAscii call
```

`pixelsToAscii` with `frameStats` skips its own histogram pass and
stretches against the supplied window. Every frame lands in the same
brightness mapping → playback is stable.

The web app does this inside `useAscii` (memoized per file); the CLI does
it before the per-frame loop in the `--animate` path.

## References

- Rec. ITU-R BT.709-6, _Parameter values for the HDTV standards for production and international programme exchange_
- IEC 61966-2-1:1999, _sRGB color space_
- Floyd, R.W. & Steinberg, L. (1976). _An adaptive algorithm for spatial greyscale_. Proc. SID 17(2): 75–77.
- Sobel, I. & Feldman, G. (1968). _A 3×3 isotropic gradient operator for image processing_.
