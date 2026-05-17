export { RAMPS } from "./ramp.js";
export type { RampName } from "./ramp.js";
export { htmlEscape } from "./color.js";
export { computeContrastStats, type ContrastStats } from "./auto-contrast.js";

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
export type AsciiMode = 'brightness' | 'edges';

export interface PixelsToAsciiOpts {
  width?: number;
  ramp?: RampName | string;
  invert?: boolean;
  mode?: AsciiMode;                  // default 'brightness'
  output?: AsciiOutput;              // default 'plain'
  edgeThreshold?: number;            // default 30 (Sobel magnitude)
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
    // applyBrightness mutates — ensure we own the buffer.
    if (work === data) work = new Uint8Array(data);
    applyBrightness(work, brightness);
  }
  return { gray: work, width, height };
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

  // ── Edges mode ──────────────────────────────────────────────────────────────
  if (mode === 'edges') {
    const { gray: grayData, width: dstW, height: dstH } = prepareGray(rgba, width, height, o);
    const { magnitude, direction } = sobel(grayData, dstW, dstH);

    if (output === 'plain') {
      const lines: string[] = [];
      for (let row = 0; row < dstH; row++) {
        let line = '';
        for (let col = 0; col < dstW; col++) {
          const idx = row * dstW + col;
          line += directionToChar(direction[idx]!, magnitude[idx]!, edgeThreshold);
        }
        lines.push(line);
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
          const ch = directionToChar(direction[idx]!, magnitude[idx]!, edgeThreshold);
          const rgbBase = idx * 3;
          const r = rgb[rgbBase]!;
          const g = rgb[rgbBase + 1]!;
          const b = rgb[rgbBase + 2]!;
          line += wrapHtmlSpan(ch, r, g, b);
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
        const ch = directionToChar(direction[idx]!, magnitude[idx]!, edgeThreshold);
        const rgbBase = idx * 3;
        const r = rgb[rgbBase]!;
        const g = rgb[rgbBase + 1]!;
        const b = rgb[rgbBase + 2]!;
        line += wrapAnsi(ch, r, g, b);
      }
      lines.push(line + ANSI_RESET);
    }
    return lines.join("\n");
  }

  // ── Brightness mode ──────────────────────────────────────────────────────────
  let rampStr = resolveRamp(rampKey);
  if (invert) {
    rampStr = rampStr.split("").reverse().join("");
  }

  const { gray: grayData, width: dstW, height: dstH } = prepareGray(rgba, width, height, o);
  const chars = (o.dither ?? false)
    ? mapIndicesToChars(floydSteinbergMap(grayData, dstW, dstH, rampStr.length), rampStr)
    : mapToRamp(grayData, rampStr);

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
        const r = rgb[rgbBase]!;
        const g = rgb[rgbBase + 1]!;
        const b = rgb[rgbBase + 2]!;
        const ch = chars[idx]!;
        line += wrapHtmlSpan(ch, r, g, b);
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
      const r = rgb[rgbBase]!;
      const g = rgb[rgbBase + 1]!;
      const b = rgb[rgbBase + 2]!;
      const ch = chars[idx]!;
      line += wrapAnsi(ch, r, g, b);
    }
    lines.push(line + ANSI_RESET);
  }
  return lines.join("\n");
}
