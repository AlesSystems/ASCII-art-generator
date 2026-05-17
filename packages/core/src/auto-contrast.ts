export interface ContrastStats {
  lo: number;
  hi: number;
}

// Walk the histogram inward from both ends to find the value below which
// `percentile`% of pixels sit (lo) and above which the symmetric tail sits (hi).
export function computeContrastStats(gray: Uint8Array, percentile: number = 2): ContrastStats {
  const total = gray.length;
  if (total === 0) return { lo: 0, hi: 255 };

  const hist = new Uint32Array(256);
  for (let i = 0; i < total; i++) hist[gray[i]!]!++;

  const cut = Math.max(0, Math.min(50, percentile)) / 100;
  const target = Math.floor(total * cut);

  let lo = 0, acc = 0;
  for (let i = 0; i < 256; i++) {
    acc += hist[i]!;
    if (acc > target) { lo = i; break; }
  }
  let hi = 255;
  acc = 0;
  for (let i = 255; i >= 0; i--) {
    acc += hist[i]!;
    if (acc > target) { hi = i; break; }
  }
  if (hi <= lo) { lo = 0; hi = 255; }
  return { lo, hi };
}

// Stretch [lo, hi] → [0, 255]. If `stats` is given, skip the histogram pass.
// Returns a new buffer; never mutates `gray`.
export function autoContrast(
  gray: Uint8Array,
  percentile: number = 2,
  stats?: ContrastStats
): Uint8Array {
  const { lo, hi } = stats ?? computeContrastStats(gray, percentile);
  const range = hi - lo;
  const out = new Uint8Array(gray.length);
  if (range < 1) {
    out.set(gray);
    return out;
  }
  const scale = 255 / range;
  for (let i = 0; i < gray.length; i++) {
    const v = (gray[i]! - lo) * scale;
    out[i] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
  }
  return out;
}

// Additive offset in [-100, 100] mapped to [-255, 255]. Mutates the buffer
// in place; callers pass a fresh buffer when they want to preserve the input.
export function applyBrightness(gray: Uint8Array, brightness: number): Uint8Array {
  if (brightness === 0) return gray;
  const offset = Math.round(brightness * 2.55);
  for (let i = 0; i < gray.length; i++) {
    const v = gray[i]! + offset;
    gray[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return gray;
}
