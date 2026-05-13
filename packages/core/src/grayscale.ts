export function grayscale(rgba: Uint8ClampedArray): Uint8Array {
  const pixelCount = rgba.length / 4;
  const out = new Uint8Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const r = rgba[i * 4]!;
    const g = rgba[i * 4 + 1]!;
    const b = rgba[i * 4 + 2]!;
    out[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }
  return out;
}
