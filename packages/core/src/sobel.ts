export interface SobelResult {
  magnitude: Float32Array; // length w*h; border pixels = 0
  direction: Float32Array; // length w*h; radians from atan2(gy, gx)
}

/**
 * Computes Sobel edge magnitudes and gradient directions on a grayscale image.
 * Border pixels are set to magnitude=0 (avoids out-of-bounds reads).
 * Magnitude is raw sqrt(gx^2 + gy^2) — not normalised.
 */
export function sobel(gray: Uint8Array, w: number, h: number): SobelResult {
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);

  // Sobel kernels:
  // Kx = [-1  0  1; -2  0  2; -1  0  1]
  // Ky = [-1 -2 -1;  0  0  0;  1  2  1]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y - 1) * w + (x - 1)]!;
      const tc = gray[(y - 1) * w + x]!;
      const tr = gray[(y - 1) * w + (x + 1)]!;
      const ml = gray[y * w + (x - 1)]!;
      const mr = gray[y * w + (x + 1)]!;
      const bl = gray[(y + 1) * w + (x - 1)]!;
      const bc = gray[(y + 1) * w + x]!;
      const br = gray[(y + 1) * w + (x + 1)]!;

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;

      const idx = y * w + x;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }

  return { magnitude, direction };
}
