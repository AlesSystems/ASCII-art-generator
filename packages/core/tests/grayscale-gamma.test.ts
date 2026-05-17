import { describe, it, expect } from "vitest";
import { grayscale } from "../src/grayscale.js";

function makeRGBA(r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  return new Uint8ClampedArray([r, g, b, a]);
}

describe("grayscale (gamma-correct, default)", () => {
  it("default opts apply gamma", () => {
    const naive = grayscale(makeRGBA(255, 0, 0), { gamma: false });
    const gamma = grayscale(makeRGBA(255, 0, 0));
    // Linearizing pure red and re-encoding gives a different (higher) value
    // than naive 0.2126 * 255 — sRGB encoding of a partial linear value is
    // brighter than the linear value itself.
    expect(gamma[0]).not.toBe(naive[0]);
    expect(gamma[0]).toBeGreaterThan(naive[0]!);
  });

  it("equal-RGB pixels round-trip to the input byte under gamma", () => {
    // sRGB→linear→weighted (R=G=B passes through)→sRGB is the identity
    // (modulo a 1-byte rounding error). The gamma path only diverges from
    // naive when channels differ — see the pure-red and pure-green cases.
    for (const v of [30, 64, 128, 200]) {
      const out = grayscale(makeRGBA(v, v, v))[0]!;
      expect(Math.abs(out - v)).toBeLessThanOrEqual(1);
    }
  });

  it("pure green under gamma yields a brighter byte than naive", () => {
    const naive = grayscale(makeRGBA(0, 255, 0), { gamma: false })[0]!;
    const gamma = grayscale(makeRGBA(0, 255, 0))[0]!;
    expect(gamma).toBeGreaterThan(naive);
  });

  it("identity at black/white", () => {
    expect(grayscale(makeRGBA(0, 0, 0))[0]).toBe(0);
    expect(grayscale(makeRGBA(255, 255, 255))[0]).toBe(255);
  });

  it("mid-grey 128 maps near 128 under gamma (round-trip stable)", () => {
    // Equal R=G=B passes through linearize → weighted sum → re-encode → byte.
    // Round-trip should land within ±1 of input.
    const v = grayscale(makeRGBA(128, 128, 128))[0]!;
    expect(Math.abs(v - 128)).toBeLessThanOrEqual(1);
  });

  it("multi-pixel array has correct length", () => {
    const rgba = new Uint8ClampedArray(4 * 4 * 4);
    const result = grayscale(rgba);
    expect(result.length).toBe(16);
  });
});
