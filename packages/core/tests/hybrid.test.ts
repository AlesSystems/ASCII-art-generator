import { describe, it, expect } from "vitest";
import { pixelsToAscii } from "../src/index.js";

// 16×16 vertical step: left half black, right half white.
function makeVerticalStepRGBA(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = x < w / 2 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
    }
  }
  return data;
}

// Uniform 16×16 mid-gray field.
function makeUniformRGBA(w: number, h: number, v: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = v; data[i + 1] = v; data[i + 2] = v; data[i + 3] = 255;
  }
  return data;
}

describe("pixelsToAscii mode:'hybrid'", () => {
  it("uniform image → no edge chars (brightness ramp only)", () => {
    const rgba = makeUniformRGBA(16, 16, 128);
    const result = pixelsToAscii(rgba, 16, 16, { mode: 'hybrid', width: 8 });
    expect(result).not.toMatch(/[|/\\]/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("vertical step → edge chars overlay brightness fills", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: 'hybrid', width: 16 });
    // Must contain a vertical edge char somewhere
    expect(result).toContain("|");
    // Must also contain ramp characters from the bright/dark fills
    expect(result).toMatch(/[ .@#%]/);
  });

  it("very high edgeThreshold suppresses edges, falls back to brightness", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, {
      mode: 'hybrid', width: 16, edgeThreshold: 999,
    });
    expect(result).not.toContain("|");
  });

  it("hybrid + output:'html' produces colored spans", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, {
      mode: 'hybrid', width: 16, output: 'html',
    });
    expect(result).toContain('<span style="color:');
    expect(result).toMatch(/[|/\\]/);
  });

  it("normalized Sobel: same threshold works on 16-wide and 64-wide images", () => {
    // Same step image at two resolutions — with normalization, the same
    // threshold should detect edges in both.
    const small = makeVerticalStepRGBA(16, 16);
    const large = makeVerticalStepRGBA(64, 64);
    const r1 = pixelsToAscii(small, 16, 16, { mode: 'edges', width: 8, edgeThreshold: 30 });
    const r2 = pixelsToAscii(large, 64, 64, { mode: 'edges', width: 8, edgeThreshold: 30 });
    expect(r1).toContain("|");
    expect(r2).toContain("|");
  });
});
