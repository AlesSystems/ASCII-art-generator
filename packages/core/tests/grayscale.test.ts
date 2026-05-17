import { describe, it, expect } from "vitest";
import { grayscale } from "../src/grayscale.js";

function makeRGBA(r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  return new Uint8ClampedArray([r, g, b, a]);
}

// These tests exercise the legacy naive byte path (gamma:false) so the exact
// byte values from the original Rec.709 weighting stay locked.
describe("grayscale (legacy / gamma:false)", () => {
  const opts = { gamma: false } as const;

  it("all-black → all-0", () => {
    const result = grayscale(new Uint8ClampedArray([0, 0, 0, 255]), opts);
    expect(result[0]).toBe(0);
  });

  it("all-white → all-255", () => {
    const result = grayscale(new Uint8ClampedArray([255, 255, 255, 255]), opts);
    expect(result[0]).toBe(255);
  });

  it("pure red → 0.2126 * 255 ≈ 54", () => {
    const result = grayscale(makeRGBA(255, 0, 0), opts);
    expect(result[0]).toBe(Math.round(0.2126 * 255));
  });

  it("pure green → 0.7152 * 255 ≈ 182", () => {
    const result = grayscale(makeRGBA(0, 255, 0), opts);
    expect(result[0]).toBe(Math.round(0.7152 * 255));
  });

  it("pure blue → 0.0722 * 255 ≈ 18", () => {
    const result = grayscale(makeRGBA(0, 0, 255), opts);
    expect(result[0]).toBe(Math.round(0.0722 * 255));
  });

  it("multi-pixel array has correct length", () => {
    const rgba = new Uint8ClampedArray(4 * 4 * 4);
    const result = grayscale(rgba, opts);
    expect(result.length).toBe(16);
  });

  it("rounding: mid-grey 128,128,128 → 128", () => {
    const result = grayscale(makeRGBA(128, 128, 128), opts);
    expect(result[0]).toBe(128);
  });
});
