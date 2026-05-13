'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { pixelsToAscii, type RampName } from '@ascii-art/core';
import { applyContrast } from './contrast';
import type { AsciiOpts, LoadedFile } from './types';

interface AsciiState {
  ascii: string;
  renderMs: number | null;
}

/**
 * React hook that converts a loaded image file to ASCII art whenever its
 * inputs change, debounced by ~120 ms to keep slider drag smooth.
 *
 * Returns:
 *   ascii       — the rendered ASCII string (empty string before first render)
 *   renderMs    — milliseconds taken by the last conversion (null until first)
 *   isComputing — true while the debounce timer is pending or conversion runs
 */
export function useAscii(
  file: LoadedFile | null,
  opts: AsciiOpts
): {
  ascii: string;
  renderMs: number | null;
  isComputing: boolean;
} {
  const [state, setState] = useState<AsciiState>({
    ascii: '',
    renderMs: null,
  });
  const [isComputing, setIsComputing] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Memoize the contrast-adjusted RGBA buffer so it only recomputes when the
  // source image or contrast value changes (not on every width/ramp tweak).
  const adjustedRgba = useMemo(() => {
    if (!file) return null;
    return applyContrast(file.image.data, opts.contrast);
  }, [file, opts.contrast]);

  useEffect(() => {
    if (!file || !adjustedRgba) {
      setState({ ascii: '', renderMs: null });
      setIsComputing(false);
      return;
    }

    setIsComputing(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const t0 = performance.now();

      const rampArg: string | RampName =
        opts.ramp === 'custom'
          ? opts.customRamp || ' .:-=+*#%@'
          : opts.ramp;

      const ascii = pixelsToAscii(adjustedRgba, file.width, file.height, {
        width: opts.width,
        ramp: rampArg,
        invert: opts.invert,
        output: opts.outputMode === 'color' ? 'html' : 'plain',
      });

      const renderMs = Math.round(performance.now() - t0);
      setState({ ascii, renderMs });
      setIsComputing(false);
    }, 120);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [file, adjustedRgba, opts.width, opts.ramp, opts.customRamp, opts.invert, opts.outputMode, opts.nonce]);

  return { ascii: state.ascii, renderMs: state.renderMs, isComputing };
}
