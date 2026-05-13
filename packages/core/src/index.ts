export { RAMPS } from "./ramp.js";
export type { RampName } from "./ramp.js";
export { htmlEscape } from "./color.js";

import { grayscale } from "./grayscale.js";
import { downsample, downsampleRgb } from "./downsample.js";
import { RAMPS, resolveRamp, mapToRamp } from "./ramp.js";
import { wrapHtmlSpan, wrapAnsi, ANSI_RESET } from "./color.js";
import type { RampName } from "./ramp.js";

export type AsciiOutput = 'plain' | 'html' | 'ansi';

export interface PixelsToAsciiOpts {
  width?: number;
  ramp?: RampName | string;
  invert?: boolean;
  output?: AsciiOutput;  // default 'plain'
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
