'use client';

/**
 * Loads a File (image) by drawing it to an offscreen canvas and extracting
 * the raw RGBA pixel data as ImageData.
 *
 * The caller is responsible for calling revokeThumbnail(thumbnailUrl) when
 * the file is removed or replaced to free the object URL.
 */
export async function loadImage(file: File): Promise<{
  image: ImageData;
  thumbnailUrl: string;
  width: number;
  height: number;
}> {
  // 1. Create an object URL from the File blob.
  const url = URL.createObjectURL(file);

  // 2. Load the URL into an HTMLImageElement, await decode.
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

  // iOS Safari caps canvas at ~16M pixels and will produce a blank buffer
  // beyond that. Downscale large images to fit within MAX_PIXELS while
  // preserving aspect ratio — the ASCII output is width-bounded anyway,
  // so the visual impact is negligible.
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

  // 4. Get 2D context with willReadFrequently hint and draw the image.
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Could not obtain 2D canvas context');
  }
  ctx.drawImage(img, 0, 0, w, h);

  // 5. Extract raw RGBA pixel data.
  const imageData = ctx.getImageData(0, 0, w, h);

  // 6. The same object URL doubles as the thumbnail URL.
  //    The caller passes it to <img src> and revokes it on cleanup.
  return {
    image: imageData,
    thumbnailUrl: url,
    width: w,
    height: h,
  };
}

/**
 * Revokes a thumbnail object URL created by loadImage.
 * Call this when the loaded file is removed or replaced.
 */
export function revokeThumbnail(url: string): void {
  URL.revokeObjectURL(url);
}
