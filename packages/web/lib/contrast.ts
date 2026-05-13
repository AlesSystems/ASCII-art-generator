/**
 * Applies a linear contrast adjustment to an RGBA pixel buffer.
 *
 * contrast=100 is the identity (no change); contrast<100 reduces contrast;
 * contrast>100 increases contrast. Range: 0–200.
 *
 * Algorithm: linear stretch around mid-gray (128).
 *   out_channel = (in_channel - 128) * (contrast / 100) + 128
 *
 * The alpha channel is passed through unchanged.
 * Returns the same buffer reference when contrast===100 (no allocation).
 */
export function applyContrast(
  rgba: Uint8ClampedArray,
  contrast: number
): Uint8ClampedArray {
  if (contrast === 100) return rgba;

  const factor = contrast / 100; // 0..2
  const out = new Uint8ClampedArray(rgba.length);

  for (let i = 0; i < rgba.length; i += 4) {
    // Uint8ClampedArray clamps on assignment — no explicit clamp helper needed.
    out[i]     = (rgba[i]!     - 128) * factor + 128;
    out[i + 1] = (rgba[i + 1]! - 128) * factor + 128;
    out[i + 2] = (rgba[i + 2]! - 128) * factor + 128;
    out[i + 3] = rgba[i + 3]!;
  }

  return out;
}
