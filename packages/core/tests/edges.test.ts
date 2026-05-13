import { describe, it, expect } from "vitest";
import { pixelsToAscii } from "../src/index.js";

// Build a 16×16 RGBA image: left half black, right half white (sharp vertical step)
function makeVerticalStepRGBA(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const brightness = x < w / 2 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = brightness;
      data[i + 1] = brightness;
      data[i + 2] = brightness;
      data[i + 3] = 255;
    }
  }
  return data;
}

// Build a uniform RGBA image
function makeUniformRGBA(w: number, h: number, v: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  return data;
}

const RAMP_CHARS = new Set([' ', '.', ':', '-', '=', '+', '*', '#', '%', '@']);

describe("pixelsToAscii with mode:'edges'", () => {
  it("vertical step → output contains | and no ramp chars", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: 'edges', width: 8 });
    expect(result).toContain("|");
    // Ensure no brightness-ramp-specific chars like # or @ appear
    const chars = new Set(result.replace(/[\n|\/\-\\]/g, "").split("").filter(Boolean));
    for (const c of chars) {
      // Allow space (background) but not dense ramp chars
      if (c !== " ") {
        expect(RAMP_CHARS.has(c), `unexpected ramp char "${c}" found in edges output`).toBe(false);
      }
    }
  });

  it("mode:'edges' + output:'html' produces edge chars and <span style=\"color:", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: 'edges', output: 'html', width: 8 });
    expect(result).toContain('<span style="color:');
    // Should still contain edge characters (possibly inside spans)
    expect(result).toMatch(/[|\/\-\\]/);
  });

  it("uniform image + mode:'edges' → output is all spaces and newlines", () => {
    const rgba = makeUniformRGBA(16, 16, 128);
    const result = pixelsToAscii(rgba, 16, 16, { mode: 'edges', width: 8 });
    // All chars should be spaces or newlines — no edge detected in uniform image
    expect(result.replace(/[ \n]/g, "")).toBe("");
  });
});
