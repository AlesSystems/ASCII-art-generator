import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import sharp from "sharp";
import { loadImage } from "../src/load-image.js";

/**
 * A valid 2-frame animated GIF (4×4 px, loop forever).
 *
 * Hand-crafted to match the GIF89a spec:
 *   - 4-color global color table: red, blue, green, white
 *   - Netscape loop extension (infinite)
 *   - Frame 1: delay 10 cs (100 ms)
 *   - Frame 2: delay 20 cs (200 ms)
 *
 * Verified to decode correctly via sharp 0.33.5 on macOS/Linux.
 */
function makeAnimatedGifBuffer(): Buffer {
  return Buffer.from([
    // GIF89a signature + logical screen descriptor
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
    0x04, 0x00, 0x04, 0x00,             // logical width=4, height=4
    0xF1, 0x00, 0x00,                   // GCT: 4 colors, bg=0, aspect=0
    // Global Color Table (4 entries x 3 bytes)
    0xFF, 0x00, 0x00,  // index 0: red
    0x00, 0x00, 0xFF,  // index 1: blue
    0x00, 0xFF, 0x00,  // index 2: green
    0xFF, 0xFF, 0xFF,  // index 3: white
    // Netscape Application Extension (loop count = 0 = infinite)
    0x21, 0xFF, 0x0B,
    0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30, // "NETSCAPE2.0"
    0x03, 0x01, 0x00, 0x00, 0x00,       // sub-block: loop count=0
    // Frame 1: Graphic Control Extension
    0x21, 0xF9, 0x04,
    0x00,              // disposal=leave, no input/transparency
    0x0A, 0x00,        // delay = 10 cs = 100 ms
    0x00, 0x00,        // transparent idx (unused), block terminator
    // Frame 1: Image Descriptor
    0x2C,
    0x00, 0x00, 0x00, 0x00,  // left=0, top=0
    0x04, 0x00, 0x04, 0x00,  // width=4, height=4
    0x00,                    // no LCT, not interlaced
    // Frame 1: Image Data (LZW min-code-size=2)
    0x02,
    0x08, // sub-block length = 8
    0x8C, 0x2D, 0x99, 0x87, 0x2A, 0x1C, 0xDC, 0x33,
    0x00,  // block terminator
    // Frame 2: Graphic Control Extension
    0x21, 0xF9, 0x04,
    0x00,
    0x14, 0x00,        // delay = 20 cs = 200 ms
    0x00, 0x00,
    // Frame 2: Image Descriptor
    0x2C,
    0x00, 0x00, 0x00, 0x00,
    0x04, 0x00, 0x04, 0x00,
    0x00,
    // Frame 2: Image Data
    0x02,
    0x08,
    0x8D, 0x2D, 0x99, 0x87, 0x2A, 0x1C, 0xDC, 0x33,
    0x00,
    // GIF Trailer
    0x3B,
  ]);
}

describe("loadImage — animated GIF support", () => {
  let gifPath: string;
  let staticPngPath: string;

  beforeAll(async () => {
    gifPath = join(tmpdir(), `anim-test-${Date.now()}.gif`);
    await writeFile(gifPath, makeAnimatedGifBuffer());

    staticPngPath = join(tmpdir(), `static-test-${Date.now()}.png`);
    const pngBuf = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .png()
      .toBuffer();
    await writeFile(staticPngPath, pngBuf);
  });

  afterAll(async () => {
    await unlink(gifPath).catch(() => undefined);
    await unlink(staticPngPath).catch(() => undefined);
  });

  it("static PNG returns 1 frame with isAnimated=false", async () => {
    const loaded = await loadImage(staticPngPath);
    expect(loaded.isAnimated).toBe(false);
    expect(loaded.frames).toHaveLength(1);
    expect(loaded.frames[0]!.delayMs).toBe(0);
    expect(loaded.frames[0]!.width).toBe(4);
    expect(loaded.frames[0]!.height).toBe(4);
    // 4 x 4 x 4 channels = 64 bytes
    expect(loaded.frames[0]!.rgba.length).toBe(4 * 4 * 4);
  });

  it("animated GIF returns 2 frames with isAnimated=true", async () => {
    const loaded = await loadImage(gifPath);
    expect(loaded.isAnimated).toBe(true);
    expect(loaded.frames).toHaveLength(2);
    expect(loaded.width).toBe(4);
    expect(loaded.height).toBe(4);
  });

  it("animated GIF frames have correct per-frame delays", async () => {
    const loaded = await loadImage(gifPath);
    // Frame 1: 100 ms, Frame 2: 200 ms (from the GIF fixture)
    expect(loaded.frames[0]!.delayMs).toBe(100);
    expect(loaded.frames[1]!.delayMs).toBe(200);
  });

  it("animated GIF frames have correct RGBA buffer size", async () => {
    const loaded = await loadImage(gifPath);
    for (const frame of loaded.frames) {
      // 4 x 4 x 4 channels = 64 bytes per frame
      const expectedBytes = frame.width * frame.height * 4;
      expect(frame.rgba.length).toBe(expectedBytes);
      expect(frame.rgba).toBeInstanceOf(Uint8ClampedArray);
    }
  });
});
