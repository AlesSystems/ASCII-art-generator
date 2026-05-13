import { describe, it, expect } from "vitest";
import { pixelsToAscii } from "@ascii-art/core";

/** Build an RGBA buffer with a vertical step: left half=0, right half=255 */
function makeVerticalStepRGBA(w: number, h: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = x < w / 2 ? 0 : 255;
      const i = (y * w + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return data;
}

describe("CLI edges wiring — unit tests", () => {
  it("mode:'edges' on a vertical-step image produces | characters", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: "edges", width: 8 });
    expect(result).toContain("|");
  });

  it("mode:'edges' output contains only edge chars and spaces", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: "edges", width: 8 });
    // Only edge chars + space + newline should be present
    const invalid = result.split("").filter((c) => !/[|\/\-\\ \n]/.test(c));
    expect(invalid).toHaveLength(0);
  });

  it("mode:'edges' + output:'ansi' wraps edge chars with ANSI escapes", () => {
    const rgba = makeVerticalStepRGBA(16, 16);
    const result = pixelsToAscii(rgba, 16, 16, { mode: "edges", output: "ansi", width: 8 });
    expect(result).toContain("\x1b[");
    expect(result).toContain("|");
  });
});
