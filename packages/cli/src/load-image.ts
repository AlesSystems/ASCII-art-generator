import sharp from "sharp";

export interface FrameData {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  delayMs: number;
}

export interface LoadedImage {
  frames: FrameData[];
  width: number;
  height: number;
  isAnimated: boolean;
}

export async function loadImage(path: string): Promise<LoadedImage> {
  // First, get metadata to detect animated images (pages > 1)
  const meta = await sharp(path).metadata();
  const pages = meta.pages ?? 1;

  if (pages > 1) {
    // Animated image: load all frames stacked in a single buffer
    const { data, info } = await sharp(path, { animated: true })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const frameWidth = info.width;
    // info.height = pageHeight * pages for animated images
    const pageHeight = Math.round(info.height / pages);

    // Per-frame delays: sharp provides `delay` array in metadata (ms) for animated images.
    // Re-read metadata with animated:true to get delay array.
    const animMeta = await sharp(path, { animated: true }).metadata();
    // animMeta.delay is number[] | undefined (ms per frame, for GIF/WEBP)
    const delayArray: number[] = Array.isArray(animMeta.delay)
      ? (animMeta.delay as number[])
      : [];

    const frames: FrameData[] = [];
    const bytesPerFrame = frameWidth * pageHeight * 4; // 4 channels RGBA

    for (let i = 0; i < pages; i++) {
      const start = i * bytesPerFrame;
      const slice = data.subarray(start, start + bytesPerFrame);
      const rgba = new Uint8ClampedArray(slice.buffer, slice.byteOffset, slice.byteLength);
      // GIFs commonly encode 0 ms ("as fast as possible") which would peg CPU
      // when exported as setTimeout-driven animated HTML — clamp to 20 ms min.
      const rawDelay = delayArray[i] ?? 100;
      const delayMs = Math.max(20, rawDelay);
      frames.push({ rgba, width: frameWidth, height: pageHeight, delayMs });
    }

    return {
      frames,
      width: frameWidth,
      height: pageHeight,
      isAnimated: true,
    };
  }

  // Static image — single frame
  const { data, info } = await sharp(path)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  return {
    frames: [{ rgba, width: info.width, height: info.height, delayMs: 0 }],
    width: info.width,
    height: info.height,
    isAnimated: false,
  };
}
