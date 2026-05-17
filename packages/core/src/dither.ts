// Floyd–Steinberg error-diffusion quantizer.
//
// Returns ramp indices (0..rampLen-1) one per cell. Operates on a Float32
// working copy of `gray` so accumulated error doesn't get clamped to bytes
// mid-loop. Dithering happens on brightness values; the caller maps the
// returned indices to ramp characters.
//
// Error distribution kernel (Floyd–Steinberg, 1976):
//          [   * 7/16 ]
//   [ 3/16   5/16  1/16 ]
export function floydSteinbergMap(
  gray: Uint8Array,
  w: number,
  h: number,
  rampLen: number
): Uint8Array {
  if (rampLen < 2) {
    // Degenerate ramp — every cell maps to index 0.
    return new Uint8Array(gray.length);
  }
  const work = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) work[i] = gray[i]!;

  const out = new Uint8Array(gray.length);
  const step = 255 / (rampLen - 1);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const oldVal = work[i]!;
      const idx = Math.max(0, Math.min(rampLen - 1, Math.round(oldVal / step)));
      const newVal = idx * step;
      const err = oldVal - newVal;
      out[i] = idx;

      // Distribute error to forward neighbors (bounds-checked).
      if (x + 1 < w) work[i + 1] = work[i + 1]! + (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0)     work[i + w - 1] = work[i + w - 1]! + (err * 3) / 16;
                        work[i + w]     = work[i + w]!     + (err * 5) / 16;
        if (x + 1 < w) work[i + w + 1] = work[i + w + 1]! + (err * 1) / 16;
      }
    }
  }
  return out;
}
