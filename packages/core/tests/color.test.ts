import { describe, it, expect } from "vitest";
import { pixelsToAscii } from "../src/index.js";

/** Creates a solid-color 1×1 RGBA image */
function solidPixel(r: number, g: number, b: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(4);
  data[0] = r; data[1] = g; data[2] = b; data[3] = 255;
  return data;
}

/**
 * 2×2 RGBA — all pixels same solid color so box-filter always yields that color.
 * Using 2x2 input at width=2: targetH = max(1, round((2/2)*2*0.5)) = 1,
 * so we get a single-row output but preserving per-column RGB.
 */
function solid2x2Rgba(r: number, g: number, b: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(4 * 4);
  for (let i = 0; i < 4; i++) {
    data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = 255;
  }
  return data;
}

describe("color output — html", () => {
  it("red solid pixel produces #FF0000 span", () => {
    const result = pixelsToAscii(solidPixel(255, 0, 0), 1, 1, { width: 1, output: 'html' });
    expect(result).toContain('style="color:#FF0000"');
  });

  it("green solid pixel produces #00FF00 span", () => {
    const result = pixelsToAscii(solidPixel(0, 255, 0), 1, 1, { width: 1, output: 'html' });
    expect(result).toContain('style="color:#00FF00"');
  });

  it("blue solid pixel produces #0000FF span", () => {
    const result = pixelsToAscii(solidPixel(0, 0, 255), 1, 1, { width: 1, output: 'html' });
    expect(result).toContain('style="color:#0000FF"');
  });

  it("black solid pixel produces #000000 span", () => {
    const result = pixelsToAscii(solidPixel(0, 0, 0), 1, 1, { width: 1, output: 'html' });
    expect(result).toContain('style="color:#000000"');
  });
});

describe("color output — ansi", () => {
  it("red pixel emits ANSI truecolor escape and reset", () => {
    const result = pixelsToAscii(solidPixel(255, 0, 0), 1, 1, { width: 1, output: 'ansi' });
    expect(result).toContain("\x1b[38;2;255;0;0m");
    expect(result).toContain("\x1b[0m");
  });

  it("blue pixel emits correct ANSI blue sequence", () => {
    const result = pixelsToAscii(solidPixel(0, 0, 255), 1, 1, { width: 1, output: 'ansi' });
    expect(result).toContain("\x1b[38;2;0;0;255m");
  });
});

describe("html escaping", () => {
  it("html-escapes ramp chars that are '<' but not the surrounding span tags", () => {
    // Use a ramp starting with '<' — black pixel (luminance 0) maps to first ramp char
    const ramp = "<X";
    const blackPixel = new Uint8ClampedArray(4); // r=g=b=0, alpha=0 treated as black
    blackPixel[3] = 255;

    const result = pixelsToAscii(blackPixel, 1, 1, { width: 1, ramp, output: 'html' });
    // The character '<' should be escaped to '&lt;' in the span content
    expect(result).toContain("&lt;");
    // But the surrounding span tags should still use actual '<' and '>'
    expect(result).toContain("<span");
    expect(result).not.toContain("&lt;span");
  });
});

describe("plain output regression", () => {
  it("output='plain' is byte-identical to calling without the option", () => {
    // Use a deterministic 4x4 gradient
    const w = 4, h = 4;
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const v = Math.round((i / (w * h - 1)) * 255);
      rgba[i * 4] = v; rgba[i * 4 + 1] = v; rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = 255;
    }
    const withOpt = pixelsToAscii(rgba, w, h, { width: 4, output: 'plain' });
    const withoutOpt = pixelsToAscii(rgba, w, h, { width: 4 });
    expect(withOpt).toBe(withoutOpt);
  });
});
