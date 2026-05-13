import { describe, it, expect } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import sharp from "sharp";
import { loadImage } from "../src/load-image.js";
import { pixelsToAscii } from "@ascii-art/core";

describe("CLI smoke test", () => {
  it("loads a 4x4 PNG and produces ASCII output with expected line count", async () => {
    // Create a 4x4 grey PNG in a temp file
    const tmpPath = join(tmpdir(), `ascii-smoke-${Date.now()}.png`);
    const pngBuffer = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .png()
      .toBuffer();

    await writeFile(tmpPath, pngBuffer);

    try {
      const loaded = await loadImage(tmpPath);
      const { rgba, width, height } = loaded.frames[0]!;

      // Should be a 4x4 image with 4 channels (RGBA after ensureAlpha)
      expect(width).toBe(4);
      expect(height).toBe(4);
      expect(rgba.length).toBe(4 * 4 * 4); // width * height * channels
      expect(loaded.isAnimated).toBe(false);
      expect(loaded.frames).toHaveLength(1);

      // Run the full pipeline
      const ascii = pixelsToAscii(rgba, width, height, { width: 4 });

      // Should be a non-empty string
      expect(ascii.length).toBeGreaterThan(0);

      // For a 4-wide target, each row should be 4 chars wide
      const lines = ascii.split("\n");
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.length).toBe(4);
      }
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  });

  it("handles different ramp options", async () => {
    const tmpPath = join(tmpdir(), `ascii-smoke-ramp-${Date.now()}.png`);
    const pngBuffer = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: { r: 200, g: 150, b: 100 },
      },
    })
      .png()
      .toBuffer();

    await writeFile(tmpPath, pngBuffer);

    try {
      const loaded = await loadImage(tmpPath);
      const { rgba, width, height } = loaded.frames[0]!;

      const asciiDefault = pixelsToAscii(rgba, width, height, { width: 8, ramp: "default" });
      const asciiInverted = pixelsToAscii(rgba, width, height, { width: 8, ramp: "inverted" });
      const asciiExtended = pixelsToAscii(rgba, width, height, { width: 8, ramp: "extended" });

      expect(asciiDefault.length).toBeGreaterThan(0);
      expect(asciiInverted.length).toBeGreaterThan(0);
      expect(asciiExtended.length).toBeGreaterThan(0);
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  });
});
