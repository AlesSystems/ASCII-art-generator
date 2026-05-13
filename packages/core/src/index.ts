export { RAMPS } from "./ramp.js";
export type { RampName } from "./ramp.js";

import { grayscale } from "./grayscale.js";
import { downsample } from "./downsample.js";
import { RAMPS, resolveRamp, mapToRamp } from "./ramp.js";
import type { RampName } from "./ramp.js";

export interface PixelsToAsciiOpts {
  width?: number;
  ramp?: RampName | string;
  invert?: boolean;
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

  let rampStr = resolveRamp(rampKey);
  if (invert) {
    rampStr = rampStr.split("").reverse().join("");
  }

  const gray = grayscale(rgba);
  const { data, width: dstW, height: dstH } = downsample(gray, width, height, targetW);
  const chars = mapToRamp(data, rampStr);

  const lines: string[] = [];
  for (let row = 0; row < dstH; row++) {
    lines.push(chars.slice(row * dstW, row * dstW + dstW).join(""));
  }
  return lines.join("\n");
}
