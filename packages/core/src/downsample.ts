export interface DownsampleResult {
  data: Uint8Array;
  width: number;
  height: number;
}

export function downsample(
  gray: Uint8Array,
  srcW: number,
  srcH: number,
  targetW: number
): DownsampleResult {
  // 0.5 correction: terminal chars are ~2x taller than wide, so halve the row count
  const targetH = Math.max(1, Math.round((srcH / srcW) * targetW * 0.5));
  const scaleX = srcW / targetW;
  const scaleY = srcH / targetH;
  const data = new Uint8Array(targetW * targetH);

  for (let ty = 0; ty < targetH; ty++) {
    const srcY0 = ty * scaleY;
    const srcY1 = srcY0 + scaleY;
    const y0 = Math.floor(srcY0);
    const y1 = Math.min(Math.ceil(srcY1), srcH);

    for (let tx = 0; tx < targetW; tx++) {
      const srcX0 = tx * scaleX;
      const srcX1 = srcX0 + scaleX;
      const x0 = Math.floor(srcX0);
      const x1 = Math.min(Math.ceil(srcX1), srcW);

      let sum = 0;
      let count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          sum += gray[sy * srcW + sx]!;
          count++;
        }
      }
      data[ty * targetW + tx] = count === 0 ? 0 : Math.round(sum / count);
    }
  }

  return { data, width: targetW, height: targetH };
}

export interface DownsampleRgbResult {
  rgb: Uint8Array;
  targetH: number;
}

/**
 * Box-filter downsample of raw RGBA pixels to target width, returning
 * interleaved RGB (length = targetW * targetH * 3).
 * Uses the same 0.5 vertical correction as `downsample`.
 */
export function downsampleRgb(
  rgba: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  targetW: number
): DownsampleRgbResult {
  const targetH = Math.max(1, Math.round((srcH / srcW) * targetW * 0.5));
  const scaleX = srcW / targetW;
  const scaleY = srcH / targetH;
  const rgb = new Uint8Array(targetW * targetH * 3);

  for (let ty = 0; ty < targetH; ty++) {
    const srcY0 = ty * scaleY;
    const srcY1 = srcY0 + scaleY;
    const y0 = Math.floor(srcY0);
    const y1 = Math.min(Math.ceil(srcY1), srcH);

    for (let tx = 0; tx < targetW; tx++) {
      const srcX0 = tx * scaleX;
      const srcX1 = srcX0 + scaleX;
      const x0 = Math.floor(srcX0);
      const x1 = Math.min(Math.ceil(srcX1), srcW);

      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const base = (sy * srcW + sx) * 4;
          sumR += rgba[base]!;
          sumG += rgba[base + 1]!;
          sumB += rgba[base + 2]!;
          count++;
        }
      }
      const out = (ty * targetW + tx) * 3;
      if (count === 0) {
        rgb[out] = 0; rgb[out + 1] = 0; rgb[out + 2] = 0;
      } else {
        rgb[out] = Math.round(sumR / count);
        rgb[out + 1] = Math.round(sumG / count);
        rgb[out + 2] = Math.round(sumB / count);
      }
    }
  }

  return { rgb, targetH };
}
