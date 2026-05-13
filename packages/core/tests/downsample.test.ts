import { describe, it, expect } from "vitest";
import { downsample } from "../src/downsample.js";

function uniformGray(w: number, h: number, value: number): Uint8Array {
  return new Uint8Array(w * h).fill(value);
}

describe("downsample", () => {
  it("4×4 source, targetW=2 → width=2 and height uses 0.5 correction", () => {
    const gray = uniformGray(4, 4, 128);
    const { width, height } = downsample(gray, 4, 4, 2);
    expect(width).toBe(2);
    // 0.5 correction: targetH = round(4/4 * 2 * 0.5) = 1
    expect(height).toBe(1);
  });

  it("all-equal pixels in → all-equal pixels out", () => {
    const gray = uniformGray(4, 4, 200);
    const { data, width, height } = downsample(gray, 4, 4, 2);
    for (let i = 0; i < width * height; i++) {
      expect(data[i]).toBe(200);
    }
  });

  it("checkerboard 4×4 averages to mid-grey", () => {
    // 2×2 checkerboard of 0 and 255 tiled across 4×4
    const gray = new Uint8Array(16);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        gray[y * 4 + x] = (x + y) % 2 === 0 ? 0 : 255;
      }
    }
    const { data } = downsample(gray, 4, 4, 2);
    // Each 2×1 (due to 0.5 correction) source region should average to ~127/128
    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBeGreaterThanOrEqual(120);
      expect(data[i]).toBeLessThanOrEqual(135);
    }
  });

  it("vertical height is smaller than naive aspect-preserving would give", () => {
    // naive: targetH = round(srcH/srcW * targetW) = round(8/4 * 2) = 4
    // with 0.5 correction: targetH = round(8/4 * 2 * 0.5) = 2
    const gray = uniformGray(4, 8, 100);
    const { height } = downsample(gray, 4, 8, 2);
    expect(height).toBe(2);
  });

  it("single-pixel source returns single pixel", () => {
    const gray = new Uint8Array([42]);
    const { data, width, height } = downsample(gray, 1, 1, 1);
    expect(width).toBe(1);
    expect(height).toBe(1);
    expect(data[0]).toBe(42);
  });
});
