import { describe, it, expect } from "vitest";
import { floydSteinbergMap } from "../src/dither.js";
import { mapIndicesToChars } from "../src/ramp.js";

describe("floydSteinbergMap", () => {
  it("flat-gray field produces near-50% coverage with a 2-char ramp", () => {
    const w = 32, h = 32;
    const gray = new Uint8Array(w * h).fill(128);
    const indices = floydSteinbergMap(gray, w, h, 2);
    const ones = indices.reduce<number>((a, v) => a + v, 0);
    // mid-gray on a 2-step ramp should split roughly 50/50.
    expect(ones).toBeGreaterThan(w * h * 0.4);
    expect(ones).toBeLessThan(w * h * 0.6);
  });

  it("all-black input → all index 0", () => {
    const indices = floydSteinbergMap(new Uint8Array(64), 8, 8, 10);
    for (const v of indices) expect(v).toBe(0);
  });

  it("all-white input → all index rampLen-1", () => {
    const indices = floydSteinbergMap(new Uint8Array(64).fill(255), 8, 8, 10);
    for (const v of indices) expect(v).toBe(9);
  });

  it("indices are bounded [0, rampLen-1]", () => {
    const w = 16, h = 16;
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < gray.length; i++) gray[i] = (i * 17) % 256;
    const indices = floydSteinbergMap(gray, w, h, 10);
    for (const v of indices) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it("gradient produces a monotone (non-strict) index sequence", () => {
    // 1×16 horizontal gradient — at the average level, indices should
    // trend upward over the row even with dither noise.
    const w = 16, h = 1;
    const gray = new Uint8Array(w);
    for (let i = 0; i < w; i++) gray[i] = Math.round((i / (w - 1)) * 255);
    const indices = floydSteinbergMap(gray, w, h, 10);
    expect(indices[0]).toBeLessThan(indices[w - 1]!);
  });

  it("degenerate rampLen<2 returns all zeros", () => {
    const indices = floydSteinbergMap(new Uint8Array(4).fill(128), 2, 2, 1);
    for (const v of indices) expect(v).toBe(0);
  });
});

describe("mapIndicesToChars", () => {
  it("maps indices to ramp chars", () => {
    const chars = mapIndicesToChars(new Uint8Array([0, 1, 2, 3]), "abcd");
    expect(chars).toEqual(["a", "b", "c", "d"]);
  });

  it("clamps out-of-range indices to the last ramp char", () => {
    const chars = mapIndicesToChars(new Uint8Array([0, 9, 99]), "ab");
    expect(chars).toEqual(["a", "b", "b"]);
  });
});
