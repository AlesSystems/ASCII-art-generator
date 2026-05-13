import sharp from "sharp";

export interface LoadedImage {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

export async function loadImage(path: string): Promise<LoadedImage> {
  const { data, info } = await sharp(path)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  return { rgba, width: info.width, height: info.height };
}
