import { describe, it, expect } from "vitest";
import { pixelsToAscii } from "@ascii-art/core";

/** Solid-color 4×4 RGBA image */
function solidRgba(r: number, g: number, b: number, w = 4, h = 4): Uint8ClampedArray {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

describe("CLI color wiring — unit tests", () => {
  it("output:'ansi' produces output starting with ESC sequence", () => {
    const rgba = solidRgba(200, 100, 50);
    const result = pixelsToAscii(rgba, 4, 4, { width: 4, output: "ansi" });
    // ANSI escape is \x1b[
    expect(result.startsWith("\x1b[")).toBe(true);
  });

  it("output:'ansi' contains reset at each line end", () => {
    const rgba = solidRgba(0, 128, 255);
    const result = pixelsToAscii(rgba, 4, 4, { width: 4, output: "ansi" });
    // Every line should end with ANSI_RESET before the newline (or at end)
    const lines = result.split("\n");
    for (const line of lines) {
      expect(line.endsWith("\x1b[0m")).toBe(true);
    }
  });

  it("output:'plain' does not contain ESC sequences (regression)", () => {
    const rgba = solidRgba(255, 0, 0);
    const result = pixelsToAscii(rgba, 4, 4, { width: 4, output: "plain" });
    expect(result).not.toContain("\x1b[");
  });

  it("plain and ansi differ when color flag is active", () => {
    const rgba = solidRgba(100, 200, 50);
    const plain = pixelsToAscii(rgba, 4, 4, { width: 4, output: "plain" });
    const ansi = pixelsToAscii(rgba, 4, 4, { width: 4, output: "ansi" });
    expect(plain).not.toBe(ansi);
  });
});
