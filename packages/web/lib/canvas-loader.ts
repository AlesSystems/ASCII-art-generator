'use client';

import { parseGIF, decompressFrames, type ParsedGif } from 'gifuct-js';
import type { FrameImage } from './types';

/**
 * Loads a File (image) by drawing it to an offscreen canvas and extracting
 * the raw RGBA pixel data as ImageData.
 *
 * For GIF files, each frame is decoded and composited with full disposal-type
 * handling, returning an array of FrameImage objects.
 *
 * For other formats (PNG, JPEG, WebP), a single-frame array is returned.
 *
 * The caller is responsible for calling revokeThumbnail(thumbnailUrl) when
 * the file is removed or replaced to free the object URL.
 */
export async function loadImage(file: File): Promise<{
  frames: FrameImage[];
  thumbnailUrl: string;
  width: number;
  height: number;
  isAnimated: boolean;
}> {
  if (file.type === 'image/gif') {
    return loadGif(file);
  }
  return loadStatic(file);
}

// ── GIF loader ──────────────────────────────────────────────────────────────

async function loadGif(file: File): Promise<{
  frames: FrameImage[];
  thumbnailUrl: string;
  width: number;
  height: number;
  isAnimated: boolean;
}> {
  const arrayBuffer = await file.arrayBuffer();
  // parseGIF expects ArrayBuffer; file.arrayBuffer() returns ArrayBuffer
  const gif: ParsedGif = parseGIF(arrayBuffer);
  const rawFrames = decompressFrames(gif, true);

  if (rawFrames.length === 0) {
    throw new Error(`GIF has no frames: ${file.name}`);
  }

  // Logical canvas size from the GIF's Logical Screen Descriptor
  const canvasW: number = gif.lsd.width;
  const canvasH: number = gif.lsd.height;

  // iOS Safari 16M-pixel cap
  const MAX_PIXELS = 4096 * 4096;
  let w = canvasW;
  let h = canvasH;
  if (w * h > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (w * h));
    w = Math.max(1, Math.floor(w * scale));
    h = Math.max(1, Math.floor(h * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not obtain 2D canvas context for GIF');

  // Secondary canvas to store "restore to previous" snapshot for disposal type 3
  const prevCanvas = document.createElement('canvas');
  prevCanvas.width = w;
  prevCanvas.height = h;
  const prevCtx = prevCanvas.getContext('2d', { willReadFrequently: true });
  if (!prevCtx) throw new Error('Could not obtain 2D canvas context for GIF prev-canvas');

  const frames: FrameImage[] = [];

  for (const rawFrame of rawFrames) {
    // Save state before drawing this frame for disposal type 3 (restore-to-prev)
    if (rawFrame.disposalType === 3) {
      const snapshot = ctx.getImageData(0, 0, w, h);
      prevCtx.putImageData(snapshot, 0, 0);
    }

    const { left, top, width: fw, height: fh } = rawFrame.dims;

    // Scale frame position/size to fit within our possibly-downscaled canvas
    const scaleX = w / canvasW;
    const scaleY = h / canvasH;
    const dLeft = Math.round(left * scaleX);
    const dTop = Math.round(top * scaleY);
    const dW = Math.max(1, Math.round(fw * scaleX));
    const dH = Math.max(1, Math.round(fh * scaleY));

    // Create ImageData from this frame's patch.
    // rawFrame.patch is Uint8ClampedArray; ImageData constructor needs a fresh copy
    // with a plain ArrayBuffer (not SharedArrayBuffer) for strict TS checks.
    const patchCopy = new Uint8ClampedArray(rawFrame.patch);
    const frameImgData = new ImageData(patchCopy, fw, fh);

    // Use a temporary canvas to draw the frame patch at the correct (possibly scaled) size
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = fw;
    tmpCanvas.height = fh;
    const tmpCtx = tmpCanvas.getContext('2d');
    if (!tmpCtx) throw new Error('Could not obtain 2D canvas context for GIF frame patch');
    tmpCtx.putImageData(frameImgData, 0, 0);

    ctx.drawImage(tmpCanvas, dLeft, dTop, dW, dH);

    // Capture the full composited frame
    const fullImageData = ctx.getImageData(0, 0, w, h);

    // GIF delay is in centiseconds; convert to ms, clamp to minimum 20ms
    const delayMs = Math.max(20, (rawFrame.delay ?? 10) * 10);

    frames.push({ image: fullImageData, delayMs });

    // Handle disposal type for next iteration
    switch (rawFrame.disposalType) {
      case 2:
        // Restore to background color — clear the frame area
        ctx.clearRect(dLeft, dTop, dW, dH);
        break;
      case 3:
        // Restore to previous state
        ctx.putImageData(prevCtx.getImageData(0, 0, w, h), 0, 0);
        break;
      case 1:
      default:
        // Leave in place — nothing to do
        break;
    }
  }

  // Thumbnail = first frame as an object URL
  const thumbnailUrl = await canvasToObjectUrl(frames[0]!.image, w, h);

  return {
    frames,
    thumbnailUrl,
    width: w,
    height: h,
    isAnimated: frames.length > 1,
  };
}

// ── Static image loader ──────────────────────────────────────────────────────

async function loadStatic(file: File): Promise<{
  frames: FrameImage[];
  thumbnailUrl: string;
  width: number;
  height: number;
  isAnimated: false;
}> {
  const url = URL.createObjectURL(file);

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () =>
      reject(new Error(`Failed to decode image: ${file.name}`));
    el.src = url;
  });

  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;

  if (naturalW === 0 || naturalH === 0) {
    URL.revokeObjectURL(url);
    throw new Error(
      `Image has zero dimensions (${naturalW}×${naturalH}): ${file.name}`
    );
  }

  // iOS Safari caps canvas at ~16M pixels. Downscale large images.
  const MAX_PIXELS = 4096 * 4096;
  let w = naturalW;
  let h = naturalH;
  if (naturalW * naturalH > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (naturalW * naturalH));
    w = Math.max(1, Math.floor(naturalW * scale));
    h = Math.max(1, Math.floor(naturalH * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Could not obtain 2D canvas context');
  }
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);

  // The object URL doubles as the thumbnail URL.
  return {
    frames: [{ image: imageData, delayMs: 0 }],
    thumbnailUrl: url,
    width: w,
    height: h,
    isAnimated: false,
  };
}

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Convert an ImageData to a blob object URL for use as a thumbnail.
 */
async function canvasToObjectUrl(
  imageData: ImageData,
  w: number,
  h: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D context for thumbnail');
  ctx.putImageData(imageData, 0, 0);
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Failed to create thumbnail blob')); return; }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

/**
 * Revokes a thumbnail object URL created by loadImage.
 * Call this when the loaded file is removed or replaced.
 */
export function revokeThumbnail(url: string): void {
  URL.revokeObjectURL(url);
}
