import type { RampName } from '@ascii-art/core';

export type { RampName };

export type Ramp = RampName | 'custom';

export type OutputMode = 'plain' | 'color' | 'edges';

export interface LoadedFile {
  name: string;
  size: number;        // bytes
  width: number;       // image px
  height: number;
  thumbnailUrl: string; // objectURL for <img src>
  image: ImageData;    // raw pixel buffer for conversion
}

export interface AsciiOpts {
  width: number;           // target char width 40..200
  ramp: RampName | 'custom';
  customRamp: string;
  invert: boolean;
  contrast: number;        // 0..200, 100 = identity
  outputMode?: OutputMode; // controls color vs plain output
  nonce?: number;          // bump to force a re-render without changing inputs
}
