import { describe, it, expect } from "vitest";
import { autoContrast, computeContrastStats, applyBrightness } from "../src/auto-contrast.js";

describe("computeContrastStats", () => {
  it("flat gray returns lo=hi (then collapses to full range fallback)", () => {
    const { lo, hi } = computeContrastStats(new Uint8Array(16).fill(128));
    // hi <= lo triggers the fallback to full [0,255]
    expect(lo).toBe(0);
    expect(hi).toBe(255);
  });

  it("full gradient at percentile=0 returns [0,255]", () => {
    const gray = new Uint8Array(256);
    for (let i = 0; i < 256; i++) gray[i] = i;
    const { lo, hi } = computeContrastStats(gray, 0);
    expect(lo).toBe(0);
    expect(hi).toBe(255);
  });

  it("clips outliers at percentile=2 on a gradient with extreme spikes", () => {
    // 200 pixels spanning [100,200], plus a black and white outlier at each end.
    const gray = new Uint8Array(202);
    for (let i = 0; i < 200; i++) gray[i] = 100 + Math.floor((i / 199) * 100);
    gray[200] = 0;
    gray[201] = 255;
    const { lo, hi } = computeContrastStats(gray, 2);
    expect(lo).toBeGreaterThan(0);
    expect(hi).toBeLessThan(255);
    expect(lo).toBeLessThan(hi);
  });
});

describe("autoContrast", () => {
  it("stretches narrow range to full [0,255]", () => {
    const gray = new Uint8Array([100, 110, 120, 130, 140, 150]);
    const out = autoContrast(gray, 0);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(255);
  });

  it("uses supplied stats when given (no histogram pass)", () => {
    const gray = new Uint8Array([100, 150, 200]);
    const out = autoContrast(gray, 2, { lo: 0, hi: 200 });
    // 100 → 127.5, 150 → 191.25, 200 → 255
    expect(out[2]).toBe(255);
    expect(out[1]).toBeGreaterThan(out[0]!);
  });

  it("returns copy (never mutates input)", () => {
    const gray = new Uint8Array([0, 128, 255]);
    const before = Array.from(gray);
    autoContrast(gray, 0);
    expect(Array.from(gray)).toEqual(before);
  });

  it("clamps values that fall outside the supplied stats range", () => {
    const gray = new Uint8Array([0, 50, 250]);
    const out = autoContrast(gray, 2, { lo: 50, hi: 250 });
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(0);
    expect(out[2]).toBe(255);
  });
});

describe("applyBrightness", () => {
  it("brightness=0 is identity", () => {
    const gray = new Uint8Array([0, 128, 255]);
    applyBrightness(gray, 0);
    expect(Array.from(gray)).toEqual([0, 128, 255]);
  });

  it("brightness=100 raises every pixel to 255", () => {
    const gray = new Uint8Array([0, 128, 255]);
    applyBrightness(gray, 100);
    expect(gray[2]).toBe(255);
    // 128 + 255 = 383 clamps to 255
    expect(gray[1]).toBe(255);
  });

  it("brightness=-100 drops every pixel to 0", () => {
    const gray = new Uint8Array([0, 128, 255]);
    applyBrightness(gray, -100);
    expect(gray[0]).toBe(0);
    expect(gray[1]).toBe(0);
  });

  it("mid offset shifts the midtone correctly", () => {
    const gray = new Uint8Array([128]);
    applyBrightness(gray, 20);
    // 20 * 2.55 = 51, 128 + 51 = 179
    expect(gray[0]).toBe(179);
  });
});
