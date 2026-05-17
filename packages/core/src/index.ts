export { RAMPS } from "./ramp.js";
export type { RampName } from "./ramp.js";
export { htmlEscape } from "./color.js";
export { computeContrastStats, computeFrameStats, type ContrastStats, type FrameStatsOpts } from "./auto-contrast.js";

import { grayscale } from "./grayscale.js";
import { downsample, downsampleRgb } from "./downsample.js";
import { RAMPS, resolveRamp, mapToRamp, mapIndicesToChars } from "./ramp.js";
import { wrapHtmlSpan, wrapAnsi, ANSI_RESET } from "./color.js";
import { sobel } from "./sobel.js";
import { directionToChar } from "./edge-ramp.js";
import { autoContrast, applyBrightness, type ContrastStats } from "./auto-contrast.js";
import { floydSteinbergMap } from "./dither.js";
import type { RampName } from "./ramp.js";

export type AsciiOutput = 'plain' | 'html' | 'ansi';
export type AsciiMode = 'brightness' | 'edges' | 'hybrid';

export interface PixelsToAsciiOpts {
  width?: number;
  ramp?: RampName | string;
  invert?: boolean;
  mode?: AsciiMode;                  // default 'brightness'
  output?: AsciiOutput;              // default 'plain'
  edgeThreshold?: number;            // default 30 (normalized 0–255)
  gamma?: boolean;                   // default true
  autoContrast?: boolean;            // default true
  autoContrastPercentile?: number;   // default 2 (clip [2,98])
  dither?: boolean;                  // default false (Floyd–Steinberg)
  brightness?: number;               // default 0, range -100..100
  frameStats?: ContrastStats;        // optional per-frame stats for GIF stability
}

function prepareGray(rgba: Uint8ClampedArray, srcW: number, srcH: number, opts: PixelsToAsciiOpts): {
  gray: Uint8Array;
  width: number;
  height: number;
} {
  const targetW = opts.width ?? 80;
  const gamma = opts.gamma ?? true;
  const useAutoContrast = opts.autoContrast ?? true;
  const percentile = opts.autoContrastPercentile ?? 2;
  const brightness = opts.brightness ?? 0;

  const grayFull = grayscale(rgba, { gamma });
  const { data, width, height } = downsample(grayFull, srcW, srcH, targetW);
  let work: Uint8Array = data;
  if (useAutoContrast) {
    work = autoContrast(work, percentile, opts.frameStats);
  }
  if (brightness !== 0) {
    if (work === data) work = new Uint8Array(data);
    applyBrightness(work, brightness);
  }
  return { gray: work, width, height };
}

// Normalize raw Sobel magnitudes to a stable 0–255 scale so the same
// edgeThreshold reads consistently across image sizes and GIF frames.
function normalizeMagnitudes(magnitude: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < magnitude.length; i++) {
    const v = magnitude[i]!;
    if (v > max) max = v;
  }
  if (max === 0) return magnitude;
  const scale = 255 / max;
  const out = new Float32Array(magnitude.length);
  for (let i = 0; i < magnitude.length; i++) out[i] = magnitude[i]! * scale;
  return out;
}

export function pixelsToAscii(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  opts?: PixelsToAsciiOpts
): string {
  const o = opts ?? {};
  const targetW = o.width ?? 80;
  const rampKey = o.ramp ?? "default";
  const invert = o.invert ?? false;
  const output = o.output ?? 'plain';
  const mode = o.mode ?? 'brightness';
  const edgeThreshold = o.edgeThreshold ?? 30;

  const { gray: grayData, width: dstW, height: dstH } = prepareGray(rgba, width, height, o);
  const cellCount = dstW * dstH;

  // Per-cell character selection — single source of truth for all modes.
  let chars: string[];

  if (mode === 'edges') {
    const { magnitude, direction } = sobel(grayData, dstW, dstH);
    const normMag = normalizeMagnitudes(magnitude);
    chars = new Array(cellCount);
    for (let i = 0; i < cellCount; i++) {
      chars[i] = directionToChar(direction[i]!, normMag[i]!, edgeThreshold);
    }
  } else {
    // Resolve ramp once for brightness + hybrid modes.
    let rampStr = resolveRamp(rampKey);
    if (invert) rampStr = rampStr.split("").reverse().join("");

    const brightChars = (o.dither ?? false)
      ? mapIndicesToChars(floydSteinbergMap(grayData, dstW, dstH, rampStr.length), rampStr)
      : mapToRamp(grayData, rampStr);

    if (mode === 'hybrid') {
      const { magnitude, direction } = sobel(grayData, dstW, dstH);
      const normMag = normalizeMagnitudes(magnitude);
      chars = new Array(cellCount);
      for (let i = 0; i < cellCount; i++) {
        chars[i] = normMag[i]! >= edgeThreshold
          ? directionToChar(direction[i]!, normMag[i]!, edgeThreshold)
          : brightChars[i]!;
      }
    } else {
      chars = brightChars;
    }
  }

  // Render — single rendering pass keyed by `output`.
  if (output === 'plain') {
    const lines: string[] = [];
    for (let row = 0; row < dstH; row++) {
      lines.push(chars.slice(row * dstW, row * dstW + dstW).join(""));
    }
    return lines.join("\n");
  }

  const { rgb } = downsampleRgb(rgba, width, height, targetW);
  const lines: string[] = [];

  if (output === 'html') {
    for (let row = 0; row < dstH; row++) {
      let line = '';
      for (let col = 0; col < dstW; col++) {
        const idx = row * dstW + col;
        const rgbBase = idx * 3;
        line += wrapHtmlSpan(chars[idx]!, rgb[rgbBase]!, rgb[rgbBase + 1]!, rgb[rgbBase + 2]!);
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  // output === 'ansi'
  for (let row = 0; row < dstH; row++) {
    let line = '';
    for (let col = 0; col < dstW; col++) {
      const idx = row * dstW + col;
      const rgbBase = idx * 3;
      line += wrapAnsi(chars[idx]!, rgb[rgbBase]!, rgb[rgbBase + 1]!, rgb[rgbBase + 2]!);
    }
    lines.push(line + ANSI_RESET);
  }
  return lines.join("\n");
}
