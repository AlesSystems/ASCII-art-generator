import { describe, it, expect } from "vitest";
import { sobel } from "../src/sobel.js";
import { directionToChar } from "../src/edge-ramp.js";

// Helper: build a Uint8Array from a 2D array of brightness values
function makeGray(rows: number[][]): { gray: Uint8Array; w: number; h: number } {
  const h = rows.length;
  const w = rows[0]!.length;
  const gray = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      gray[y * w + x] = rows[y]![x]!;
    }
  }
  return { gray, w, h };
}

describe("sobel()", () => {
  it("uniform image → all magnitudes = 0", () => {
    const { gray, w, h } = makeGray([
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
      [128, 128, 128, 128, 128],
    ]);
    const { magnitude } = sobel(gray, w, h);
    for (let i = 0; i < magnitude.length; i++) {
      expect(magnitude[i]).toBe(0);
    }
  });

  it("horizontal step (left=0, right=255) → interior step pixels have large magnitude", () => {
    // 5-wide, 3-tall; step at x=2/3
    const { gray, w, h } = makeGray([
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
      [0, 0, 255, 255, 255],
    ]);
    const { magnitude, direction } = sobel(gray, w, h);

    // Interior pixels at the step boundary: (x=1,y=1) and (x=2,y=1)
    const idx1 = 1 * w + 1; // left side of step
    const idx2 = 1 * w + 2; // right side of step
    expect(magnitude[idx1]).toBeGreaterThan(100);
    expect(magnitude[idx2]).toBeGreaterThan(100);

    // Gradient is primarily horizontal (gx > 0), so direction ≈ 0
    expect(Math.abs(direction[idx2]!)).toBeLessThan(Math.PI / 4);
  });

  it("vertical step (top=0, bottom=255) → interior step pixels have direction ≈ π/2", () => {
    const { gray, w, h } = makeGray([
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [255, 255, 255, 255, 255],
      [255, 255, 255, 255, 255],
      [255, 255, 255, 255, 255],
    ]);
    const { magnitude, direction } = sobel(gray, w, h);

    // Interior pixel at the vertical step: (x=2, y=2)
    const idx = 2 * w + 2;
    expect(magnitude[idx]).toBeGreaterThan(100);

    // gy > 0, gx ≈ 0 → atan2(gy, 0) = π/2
    expect(Math.abs(direction[idx]! - Math.PI / 2)).toBeLessThan(0.1);
  });
});

describe("directionToChar()", () => {
  const THRESHOLD = 30;
  const ABOVE = 100; // magnitude above threshold

  it("returns | for theta=0 (gradient horizontal → edge vertical)", () => {
    expect(directionToChar(0, ABOVE, THRESHOLD)).toBe("|");
  });

  it("returns - for theta=π/2 (gradient vertical → edge horizontal)", () => {
    expect(directionToChar(Math.PI / 2, ABOVE, THRESHOLD)).toBe("-");
  });

  it("returns / for theta≈π/4 (gradient diagonal ↗ → edge /)", () => {
    expect(directionToChar(Math.PI / 4, ABOVE, THRESHOLD)).toBe("/");
  });

  it("returns \\ for theta≈3π/4 (gradient diagonal ↖ → edge \\)", () => {
    expect(directionToChar((3 * Math.PI) / 4, ABOVE, THRESHOLD)).toBe("\\");
  });

  it("returns space when magnitude < threshold", () => {
    expect(directionToChar(0, 10, THRESHOLD)).toBe(" ");
    expect(directionToChar(Math.PI / 2, 0, THRESHOLD)).toBe(" ");
    expect(directionToChar(Math.PI / 4, THRESHOLD - 1, THRESHOLD)).toBe(" ");
  });
});
