export { RAMPS } from "./ramp.js";
export type { RampName } from "./ramp.js";
export { htmlEscape } from "./color.js";

import { grayscale } from "./grayscale.js";
import { downsample, downsampleRgb } from "./downsample.js";
import { RAMPS, resolveRamp, mapToRamp } from "./ramp.js";
import { wrapHtmlSpan, wrapAnsi, ANSI_RESET } from "./color.js";
import { sobel } from "./sobel.js";
import { directionToChar } from "./edge-ramp.js";
import type { RampName } from "./ramp.js";

export type AsciiOutput = 'plain' | 'html' | 'ansi';
export type AsciiMode = 'brightness' | 'edges';

export interface PixelsToAsciiOpts {
  width?: number;
  ramp?: RampName | string;
  invert?: boolean;
  mode?: AsciiMode;         // default 'brightness'
  output?: AsciiOutput;     // default 'plain'
  edgeThreshold?: number;   // default 30 (0–255 scale on Sobel magnitude)
}

export function pixelsToAscii(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  opts?: PixelsToAsciiOpts
): string {
  const targetW = opts?.width ?? 80;
  const rampKey = opts?.ramp ?? "default";
  const invert = opts?.invert ?? false;
  const output = opts?.output ?? 'plain';
  const mode = opts?.mode ?? 'brightness';
  const edgeThreshold = opts?.edgeThreshold ?? 30;

  // ── Edges mode ──────────────────────────────────────────────────────────────
  if (mode === 'edges') {
    const gray = grayscale(rgba);
    const { data: grayData, width: dstW, height: dstH } = downsample(gray, width, height, targetW);

    // Apply Sobel to the downsampled grayscale image
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

    // Color edges — sample RGB per cell for colorization
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

  // Fast path — plain output is byte-identical to legacy behavior
  if (output === 'plain') {
    const gray = grayscale(rgba);
    const { data, width: dstW, height: dstH } = downsample(gray, width, height, targetW);
    const chars = mapToRamp(data, rampStr);

    const lines: string[] = [];
    for (let row = 0; row < dstH; row++) {
      lines.push(chars.slice(row * dstW, row * dstW + dstW).join(""));
    }
    return lines.join("\n");
  }

  // Color paths — need per-cell RGB + grayscale for ramp lookup
  const gray = grayscale(rgba);
  const { data: grayData, width: dstW, height: dstH } = downsample(gray, width, height, targetW);
  const { rgb } = downsampleRgb(rgba, width, height, targetW);
  const chars = mapToRamp(grayData, rampStr);

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
