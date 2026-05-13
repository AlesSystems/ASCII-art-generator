import { describe, it, expect } from "vitest";
import { pixelsToAscii, RAMPS } from "../src/index.js";

function makeGradientRGBA(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const brightness = Math.round(((y * w + x) / (w * h - 1)) * 255);
      const i = (y * w + x) * 4;
      data[i] = brightness;
      data[i + 1] = brightness;
      data[i + 2] = brightness;
      data[i + 3] = 255;
    }
  }
  return data;
}

describe("pixelsToAscii", () => {
  const rgba8x8 = makeGradientRGBA(8, 8);

  it("is deterministic on an 8×8 synthetic gradient", () => {
    const a = pixelsToAscii(rgba8x8, 8, 8, { width: 4 });
    const b = pixelsToAscii(rgba8x8, 8, 8, { width: 4 });
    expect(a).toBe(b);
  });

  it("returns a string with newlines separating rows", () => {
    const result = pixelsToAscii(rgba8x8, 8, 8, { width: 4 });
    const lines = result.split("\n");
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.length).toBe(4);
    }
  });

  it("invert:true produces the ramp-flipped version of invert:false", () => {
    const normal = pixelsToAscii(rgba8x8, 8, 8, { width: 4, ramp: "default" });
    const inverted = pixelsToAscii(rgba8x8, 8, 8, { width: 4, ramp: "default", invert: true });
    expect(normal).not.toBe(inverted);
    const defaultRamp = RAMPS.default;
    const reversedRamp = defaultRamp.split("").reverse().join("");
    const expected = pixelsToAscii(rgba8x8, 8, 8, { width: 4, ramp: reversedRamp });
    expect(inverted).toBe(expected);
  });

  it("passing a raw ramp string works", () => {
    const result = pixelsToAscii(rgba8x8, 8, 8, { width: 4, ramp: " #" });
    const chars = new Set(result.replace(/\n/g, "").split(""));
    expect([...chars].every((c) => c === " " || c === "#")).toBe(true);
  });

  it("default width is 80", () => {
    const rgba = makeGradientRGBA(160, 160);
    const result = pixelsToAscii(rgba, 160, 160);
    const lines = result.split("\n");
    for (const line of lines) {
      expect(line.length).toBe(80);
    }
  });

  it("gradient starts with sparse and ends with dense chars", () => {
    const result = pixelsToAscii(rgba8x8, 8, 8, { width: 8 });
    const lines = result.split("\n");
    const firstLine = lines[0]!;
    const lastLine = lines[lines.length - 1]!;
    const ramp = RAMPS.default;
    const firstIdx = ramp.indexOf(firstLine[0]!);
    const lastIdx = ramp.indexOf(lastLine[lastLine.length - 1]!);
    expect(firstIdx).toBeLessThan(lastIdx);
  });
});
