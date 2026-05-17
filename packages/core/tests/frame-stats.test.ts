import { describe, it, expect } from "vitest";
import { computeFrameStats, pixelsToAscii } from "../src/index.js";

// Build a uniform frame of brightness `v`.
function uniformFrame(w: number, h: number, v: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
  }
  return data;
}

// Build a horizontal gradient frame spanning [lo, hi].
function gradientFrame(w: number, h: number, lo: number, hi: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.round(lo + (x / (w - 1)) * (hi - lo));
      const i = (y * w + x) * 4;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return data;
}

describe("computeFrameStats", () => {
  it("returns stats matching the conversion's preprocessing", () => {
    const frame = gradientFrame(32, 8, 64, 192);
    const stats = computeFrameStats(frame, 32, 8, { width: 16 });
    expect(stats.lo).toBeGreaterThanOrEqual(60);
    expect(stats.hi).toBeLessThanOrEqual(200);
    expect(stats.lo).toBeLessThan(stats.hi);
  });
});

describe("GIF frame stability via frameStats", () => {
  it("supplying combined frameStats makes two different-range frames render consistently", () => {
    // Frame A: gradient 0..128; Frame B: gradient 128..255. Without
    // frameStats each frame gets stretched to [0,255] independently, so
    // they look identical. With combined { lo:0, hi:255 } frameStats,
    // frame A occupies the lower ramp half and frame B the upper half.
    const w = 32, h = 8;
    const frameA = gradientFrame(w, h, 0, 128);
    const frameB = gradientFrame(w, h, 128, 255);

    // Without frameStats (per-frame stretch): both will land near full range.
    const indepA = pixelsToAscii(frameA, w, h, { width: 16, dither: false });
    const indepB = pixelsToAscii(frameB, w, h, { width: 16, dither: false });
    // Both should contain dense ramp chars near their right edge (they each
    // stretched to full range).
    expect(indepA).toContain("@");
    expect(indepB).toContain("@");

    // With combined stats, frame A is stuck in the dark half — should not
    // contain the densest ramp char.
    const stats = { lo: 0, hi: 255 };
    const stableA = pixelsToAscii(frameA, w, h, { width: 16, frameStats: stats });
    const stableB = pixelsToAscii(frameB, w, h, { width: 16, frameStats: stats });
    expect(stableA).not.toContain("@");
    expect(stableB).toContain("@");
  });

  it("uniform frames given the same frameStats render identically", () => {
    const stats = { lo: 0, hi: 255 };
    const a = pixelsToAscii(uniformFrame(16, 4, 200), 16, 4, { width: 16, frameStats: stats });
    const b = pixelsToAscii(uniformFrame(16, 4, 200), 16, 4, { width: 16, frameStats: stats });
    expect(a).toBe(b);
  });
});
