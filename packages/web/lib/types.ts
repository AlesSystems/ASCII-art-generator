import type { RampName } from '@ascii-art/core';

export type { RampName };

export type Ramp = RampName | 'custom';

export type OutputMode = 'plain' | 'color' | 'edges' | 'hybrid';

export interface FrameImage {
  image: ImageData;
  delayMs: number; // 0 for static (single-frame) images
}

export interface LoadedFile {
  name: string;
  size: number;        // bytes
  width: number;       // image px
  height: number;
  thumbnailUrl: string; // objectURL for <img src>
  frames: FrameImage[]; // length >= 1; static images have 1 frame
  isAnimated: boolean;
}

export interface AsciiOpts {
  width: number;                // target char width 40..200
  ramp: RampName | 'custom';
  customRamp: string;
  invert: boolean;
  brightness: number;           // -100..100, 0 = identity
  autoContrast: boolean;        // percentile histogram stretch
  dither: boolean;              // Floyd–Steinberg
  gamma: boolean;               // gamma-correct luminance
  outputMode?: OutputMode;      // controls color vs plain vs edges vs hybrid
  nonce?: number;               // bump to force a re-render without changing inputs
}
