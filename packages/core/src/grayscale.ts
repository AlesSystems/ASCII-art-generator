// sRGB ↔ linear LUTs precomputed once at module load.
// Standard sRGB EOTF: c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
const SRGB_TO_LINEAR_LUT: Float32Array = (() => {
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const c = i / 255;
    lut[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return lut;
})();

function linearToSrgbByte(linear: number): number {
  // Inverse sRGB EOTF: linear → sRGB byte
  const c = linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(c * 255)));
}

export interface GrayscaleOpts {
  // When true (default), pixels are linearized before Rec.709 weighting and
  // re-encoded to sRGB, giving perceptually accurate luminance (shadow detail
  // is preserved instead of crushed). When false, the legacy naive byte path
  // runs — kept for byte-identical compatibility with pre-v2 fixtures.
  gamma?: boolean;
}

export function grayscale(rgba: Uint8ClampedArray, opts?: GrayscaleOpts): Uint8Array {
  const gamma = opts?.gamma ?? true;
  const pixelCount = rgba.length / 4;
  const out = new Uint8Array(pixelCount);

  if (!gamma) {
    for (let i = 0; i < pixelCount; i++) {
      const r = rgba[i * 4]!;
      const g = rgba[i * 4 + 1]!;
      const b = rgba[i * 4 + 2]!;
      out[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
    return out;
  }

  for (let i = 0; i < pixelCount; i++) {
    const r = SRGB_TO_LINEAR_LUT[rgba[i * 4]!]!;
    const g = SRGB_TO_LINEAR_LUT[rgba[i * 4 + 1]!]!;
    const b = SRGB_TO_LINEAR_LUT[rgba[i * 4 + 2]!]!;
    const yLinear = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    out[i] = linearToSrgbByte(yLinear);
  }
  return out;
}
