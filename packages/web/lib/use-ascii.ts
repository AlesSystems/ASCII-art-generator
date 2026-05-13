'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!file) {
      setState({ ascii: '', renderMs: null });
      setIsComputing(false);
      return;
    }

    setIsComputing(true);

    // Clear any pending debounce timer before scheduling a new one.
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const t0 = performance.now();

      // Apply contrast adjustment (returns the same buffer when contrast===100).
      const rgba = applyContrast(file.image.data, opts.contrast);

      // Resolve ramp: 'custom' uses the free-form string; named presets pass
      // the key directly. Fall back to the default ramp if customRamp is empty
      // to avoid a divide-by-zero inside core's mapToRamp.
      const rampArg: string | RampName =
        opts.ramp === 'custom'
          ? opts.customRamp || ' .:-=+*#%@'
          : opts.ramp;

      const ascii = pixelsToAscii(rgba, file.width, file.height, {
        width: opts.width,
        ramp: rampArg,
        invert: opts.invert,
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
  // Primitive fields used individually so the effect only re-runs when a
  // value actually changes, not on every new opts object reference.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, opts.width, opts.ramp, opts.customRamp, opts.invert, opts.contrast]);

  return { ascii: state.ascii, renderMs: state.renderMs, isComputing };
}
