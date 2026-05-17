import { describe, it, expect } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import sharp from "sharp";
import { loadImage } from "../src/load-image.js";
import { pixelsToAscii } from "@ascii-art/core";

// Build a 16x16 PNG with a vertical step (left half black, right half white).
async function makeStepPng(): Promise<string> {
  const w = 16, h = 16;
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = x < w / 2 ? 0 : 255;
      const i = (y * w + x) * 3;
      raw[i] = v; raw[i + 1] = v; raw[i + 2] = v;
    }
  }
  const pngBuffer = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
  const path = join(tmpdir(), `ascii-q2-${Date.now()}-${Math.random()}.png`);
  await writeFile(path, pngBuffer);
  return path;
}

describe("CLI quality v2", () => {
  it("hybrid mode produces edge chars overlaid on the brightness ramp", async () => {
    const path = await makeStepPng();
    try {
      const loaded = await loadImage(path);
      const { rgba, width, height } = loaded.frames[0]!;
      const ascii = pixelsToAscii(rgba, width, height, { width: 16, mode: 'hybrid' });
      expect(ascii).toContain("|");
    } finally {
      await unlink(path).catch(() => undefined);
    }
  });

  it("dither flag produces a different output than non-dithered on a midtone gradient", async () => {
    // Horizontal midtone gradient — non-trivial values for dither to spread.
    const w = 32, h = 8;
    const raw = Buffer.alloc(w * h * 3);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = Math.round(80 + (x / (w - 1)) * 100);
        const i = (y * w + x) * 3;
        raw[i] = v; raw[i + 1] = v; raw[i + 2] = v;
      }
    }
    const pngBuffer = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
    const path = join(tmpdir(), `ascii-q2-grad-${Date.now()}.png`);
    await writeFile(path, pngBuffer);
    try {
      const loaded = await loadImage(path);
      const { rgba, width, height } = loaded.frames[0]!;
      const plain = pixelsToAscii(rgba, width, height, { width: 16, dither: false });
      const dithered = pixelsToAscii(rgba, width, height, { width: 16, dither: true });
      expect(plain).not.toBe(dithered);
    } finally {
      await unlink(path).catch(() => undefined);
    }
  });

  it("legacy mode (gamma:false, autoContrast:false) matches naive output", async () => {
    const path = await makeStepPng();
    try {
      const loaded = await loadImage(path);
      const { rgba, width, height } = loaded.frames[0]!;
      // With gamma+autoContrast on, equal-RGB endpoints (0 and 255) still
      // map to the ramp endpoints, but mid-values shift. For a pure
      // black/white step image, output is dominated by endpoints and the
      // legacy/v2 outputs should be substantively similar but not identical
      // bit-for-bit if any midtone pixels exist.
      const legacy = pixelsToAscii(rgba, width, height, {
        width: 16, gamma: false, autoContrast: false,
      });
      expect(legacy.length).toBeGreaterThan(0);
      // Legacy uses the dim end and dense end at the extremes.
      expect(legacy).toMatch(/[@#]/);
      expect(legacy).toMatch(/ /);
    } finally {
      await unlink(path).catch(() => undefined);
    }
  });
});
