"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";
import { ControlsPane } from "@/components/ControlsPane";
import { MobileSheet } from "@/components/MobileSheet";
import { PreviewPane } from "@/components/PreviewPane";
import { loadImage, revokeThumbnail } from "@/lib/canvas-loader";
import { useAscii } from "@/lib/use-ascii";
import { useAnimation } from "@/lib/use-animation";
import { buildAnimatedHtml } from "@/lib/animated-html";
import { copyToClipboard, copyRichToClipboard, downloadText, htmlToPlainAscii } from "@/lib/download";
import type { LoadedFile, OutputMode } from "@/lib/types";

type RampName = "default" | "inverted" | "extended" | "custom";
type SheetTab = "basics" | "advanced" | "export";

interface State {
  file: LoadedFile | null;
  width: number;
  brightness: number;
  autoContrast: boolean;
  dither: boolean;
  gamma: boolean;
  ramp: RampName;
  customRamp: string;
  invert: boolean;
  outputMode: OutputMode;
  mobileTab: SheetTab;
  renderTick: number;
  isPlaying: boolean;
}

type Action =
  | { type: "setFile"; file: LoadedFile | null }
  | { type: "setWidth"; v: number }
  | { type: "setBrightness"; v: number }
  | { type: "setAutoContrast"; v: boolean }
  | { type: "setDither"; v: boolean }
  | { type: "setGamma"; v: boolean }
  | { type: "setRamp"; v: RampName }
  | { type: "setCustomRamp"; v: string }
  | { type: "setInvert"; v: boolean }
  | { type: "setOutputMode"; v: OutputMode }
  | { type: "setMobileTab"; v: SheetTab }
  | { type: "rerender" }
  | { type: "setIsPlaying"; v: boolean };

const initialState: State = {
  file: null,
  width: 120,
  brightness: 0,
  autoContrast: true,
  dither: false,
  gamma: true,
  ramp: "default",
  customRamp: "",
  invert: false,
  outputMode: "plain",
  mobileTab: "basics",
  renderTick: 0,
  isPlaying: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setFile": return { ...state, file: action.file, isPlaying: true };
    case "setWidth": return { ...state, width: action.v };
    case "setBrightness": return { ...state, brightness: action.v };
    case "setAutoContrast": return { ...state, autoContrast: action.v };
    case "setDither": return { ...state, dither: action.v };
    case "setGamma": return { ...state, gamma: action.v };
    case "setRamp": return { ...state, ramp: action.v };
    case "setCustomRamp": return { ...state, customRamp: action.v };
    case "setInvert": return { ...state, invert: action.v };
    case "setOutputMode": return { ...state, outputMode: action.v };
    case "setMobileTab": return { ...state, mobileTab: action.v };
    case "rerender": return { ...state, renderTick: state.renderTick + 1 };
    case "setIsPlaying": return { ...state, isPlaying: action.v };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    return "&gt;";
  });
}

export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [error, setError] = useState<string | null>(null);

  // useAscii now returns frames (one per GIF frame, or one for static images)
  const { frames, renderMs, isComputing } = useAscii(state.file, {
    width: state.width,
    brightness: state.brightness,
    autoContrast: state.autoContrast,
    dither: state.dither,
    gamma: state.gamma,
    ramp: state.ramp,
    customRamp: state.customRamp,
    invert: state.invert,
    outputMode: state.outputMode,
    nonce: state.renderTick,
  });

  // Per-frame delays from the loaded file; fall back to [0] for static images.
  // Memoized to avoid new array reference on every render (used in useCallback deps).
  const delaysMs = useMemo(
    () => state.file?.frames.map((f) => f.delayMs) ?? [0],
    [state.file]
  );
  const isAnimated = state.file?.isAnimated ?? false;

  // Animation loop — drives currentFrame based on per-frame delays
  const { currentFrame } = useAnimation(frames.length, delaysMs, state.isPlaying && isAnimated);

  const currentFile = state.file;

  const onFiles = useCallback(async (files: FileList) => {
    const file = files.item(0);
    if (!file) return;
    setError(null);
    try {
      const loaded = await loadImage(file);
      // Revoke the previous file's URL before swapping in the new one.
      if (currentFile) revokeThumbnail(currentFile.thumbnailUrl);
      dispatch({
        type: "setFile",
        file: {
          name: file.name,
          size: file.size,
          width: loaded.width,
          height: loaded.height,
          thumbnailUrl: loaded.thumbnailUrl,
          frames: loaded.frames,
          isAnimated: loaded.isAnimated,
        },
      });
    } catch {
      setError("Hmm, that didn't decode. Try a different image?");
    }
  }, [currentFile]);

  const onRemoveFile = useCallback(() => {
    if (currentFile) revokeThumbnail(currentFile.thumbnailUrl);
    dispatch({ type: "setFile", file: null });
  }, [currentFile]);

  useEffect(() => {
    return () => {
      if (currentFile) revokeThumbnail(currentFile.thumbnailUrl);
    };
  }, [currentFile]);

  // Current ASCII frame to display (empty if not yet rendered)
  const currentAscii = frames[currentFrame] ?? "";

  const onCopy = useCallback(async () => {
    if (!currentAscii) return;
    try {
      if (state.outputMode === "color") {
        await copyRichToClipboard(currentAscii, htmlToPlainAscii(currentAscii));
      } else {
        await copyToClipboard(currentAscii);
      }
    } catch {
      setError("Couldn't copy. Try selecting and copying manually.");
    }
  }, [currentAscii, state.outputMode]);

  const onDownloadTxt = useCallback(() => {
    if (!currentAscii) return;
    const base = state.file?.name.replace(/\.[^.]+$/, "") ?? "ascii";
    downloadText(`${base}.txt`, currentAscii);
  }, [currentAscii, state.file]);

  const onDownloadHtml = useCallback(() => {
    if (frames.length === 0) return;
    const base = state.file?.name.replace(/\.[^.]+$/, "") ?? "ascii";

    if (isAnimated && frames.length > 1) {
      // Animated: download a full animated HTML file
      const format = state.outputMode === "color" ? "html" : "text";
      const html = buildAnimatedHtml(frames, delaysMs, base, format);
      downloadText(`${base}.html`, html, "text/html");
    } else {
      // Static: single-frame HTML wrap
      const ascii = frames[0] ?? "";
      const preContent =
        state.outputMode === "color" ? ascii : escapeHtml(ascii);
      const html = `<!doctype html><meta charset="utf-8"><title>${base}</title><pre style="font-family:JetBrains Mono,monospace;font-size:10px;line-height:1;letter-spacing:-0.02em;white-space:pre">${preContent}</pre>`;
      downloadText(`${base}.html`, html, "text/html");
    }
  }, [frames, delaysMs, isAnimated, state.file, state.outputMode]);

  const onDownloadAnimatedHtml = useCallback(() => {
    if (!isAnimated || frames.length === 0) return;
    const base = state.file?.name.replace(/\.[^.]+$/, "") ?? "ascii";
    const format = state.outputMode === "color" ? "html" : "text";
    const html = buildAnimatedHtml(frames, delaysMs, base, format);
    downloadText(`${base}-animated.html`, html, "text/html");
  }, [frames, delaysMs, isAnimated, state.file, state.outputMode]);

  const onPlayPause = useCallback(() => {
    dispatch({ type: "setIsPlaying", v: !state.isPlaying });
  }, [state.isPlaying]);

  const onRerender = useCallback(() => {
    dispatch({ type: "rerender" });
  }, []);

  const lines = currentAscii ? currentAscii.split("\n") : [];
  const charHeight = lines.length;
  const charWidth = lines[0]?.length ?? state.width;

  const stateForControls = {
    file: state.file
      ? {
          name: state.file.name,
          size: state.file.size,
          width: state.file.width,
          height: state.file.height,
          thumbnailUrl: state.file.thumbnailUrl,
        }
      : null,
    width: state.width,
    brightness: state.brightness,
    autoContrast: state.autoContrast,
    dither: state.dither,
    gamma: state.gamma,
    ramp: state.ramp,
    customRamp: state.customRamp,
    invert: state.invert,
    outputMode: state.outputMode,
    renderMs,
  };

  const on = {
    files: onFiles,
    removeFile: onRemoveFile,
    width: (v: number) => dispatch({ type: "setWidth", v }),
    brightness: (v: number) => dispatch({ type: "setBrightness", v }),
    autoContrast: (v: boolean) => dispatch({ type: "setAutoContrast", v }),
    dither: (v: boolean) => dispatch({ type: "setDither", v }),
    gamma: (v: boolean) => dispatch({ type: "setGamma", v }),
    ramp: (v: RampName) => dispatch({ type: "setRamp", v }),
    customRamp: (v: string) => dispatch({ type: "setCustomRamp", v }),
    invert: (v: boolean) => dispatch({ type: "setInvert", v }),
    outputMode: (v: OutputMode) => dispatch({ type: "setOutputMode", v }),
    copy: onCopy,
    downloadTxt: onDownloadTxt,
    downloadHtml: onDownloadHtml,
    downloadAnimatedHtml: onDownloadAnimatedHtml,
  };

  return (
    <div className="frame">
      <Topbar active="convert" />
      <div className="main">
        <ControlsPane state={stateForControls} on={on} isAnimated={isAnimated} />
        <PreviewPane
          ascii={currentAscii}
          charWidth={charWidth}
          charHeight={charHeight}
          onRerender={onRerender}
          frame={{ current: currentFrame + 1, total: Math.max(1, frames.length) }}
          showPlaceholder={!state.file}
          isHtml={state.outputMode === "color"}
          showPlayButton={isAnimated}
          isPlaying={state.isPlaying}
          onPlayPause={onPlayPause}
          isComputing={isComputing}
        />
        <MobileSheet
          state={stateForControls}
          on={on}
          activeTab={state.mobileTab}
          onTabChange={(t) => dispatch({ type: "setMobileTab", v: t })}
          isAnimated={isAnimated}
        />
      </div>
      <Footer />
      {error !== null && (
        <div role="alert" className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}
    </div>
  );
}
