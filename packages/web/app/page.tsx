"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Footer } from "@/components/Footer";
import { ControlsPane } from "@/components/ControlsPane";
import { MobileSheet } from "@/components/MobileSheet";
import { PreviewPane } from "@/components/PreviewPane";
import { loadImage, revokeThumbnail } from "@/lib/canvas-loader";
import { useAscii } from "@/lib/use-ascii";
import { copyToClipboard, downloadText } from "@/lib/download";
import type { LoadedFile, OutputMode } from "@/lib/types";

type RampName = "default" | "inverted" | "extended" | "custom";
type SheetTab = "basics" | "advanced" | "export";

interface State {
  file: LoadedFile | null;
  width: number;
  contrast: number;
  ramp: RampName;
  customRamp: string;
  invert: boolean;
  outputMode: OutputMode;
  sobel: boolean;
  dithering: boolean;
  zoom: number;
  mobileTab: SheetTab;
  renderTick: number;
}

type Action =
  | { type: "setFile"; file: LoadedFile | null }
  | { type: "setWidth"; v: number }
  | { type: "setContrast"; v: number }
  | { type: "setRamp"; v: RampName }
  | { type: "setCustomRamp"; v: string }
  | { type: "setInvert"; v: boolean }
  | { type: "setOutputMode"; v: OutputMode }
  | { type: "setSobel"; v: boolean }
  | { type: "setDithering"; v: boolean }
  | { type: "setZoom"; v: number }
  | { type: "setMobileTab"; v: SheetTab }
  | { type: "rerender" };

const initialState: State = {
  file: null,
  width: 120,
  contrast: 100,
  ramp: "default",
  customRamp: "",
  invert: false,
  outputMode: "plain",
  sobel: false,
  dithering: false,
  zoom: 100,
  mobileTab: "basics",
  renderTick: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setFile": return { ...state, file: action.file };
    case "setWidth": return { ...state, width: action.v };
    case "setContrast": return { ...state, contrast: action.v };
    case "setRamp": return { ...state, ramp: action.v };
    case "setCustomRamp": return { ...state, customRamp: action.v };
    case "setInvert": return { ...state, invert: action.v };
    case "setOutputMode": return { ...state, outputMode: action.v };
    case "setSobel": return { ...state, sobel: action.v };
    case "setDithering": return { ...state, dithering: action.v };
    case "setZoom": return { ...state, zoom: action.v };
    case "setMobileTab": return { ...state, mobileTab: action.v };
    case "rerender": return { ...state, renderTick: state.renderTick + 1 };
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

  const { ascii, renderMs } = useAscii(state.file, {
    width: state.width,
    contrast: state.contrast,
    ramp: state.ramp,
    customRamp: state.customRamp,
    invert: state.invert,
    outputMode: state.outputMode,
    nonce: state.renderTick,
  });

  const currentFile = state.file;

  const onFiles = useCallback(async (files: FileList) => {
    const file = files.item(0);
    if (!file) return;
    setError(null);
    try {
      const loaded = await loadImage(file);
      // Revoke the previous file's URL before swapping in the new one so we
      // never leak when a user uploads sequentially without removing first.
      if (currentFile) revokeThumbnail(currentFile.thumbnailUrl);
      dispatch({
        type: "setFile",
        file: {
          name: file.name,
          size: file.size,
          width: loaded.width,
          height: loaded.height,
          thumbnailUrl: loaded.thumbnailUrl,
          image: loaded.image,
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

  const onCopy = useCallback(async () => {
    if (!ascii) return;
    try {
      await copyToClipboard(ascii);
    } catch {
      setError("Couldn't copy. Try selecting and copying manually.");
    }
  }, [ascii]);

  const onDownloadTxt = useCallback(() => {
    if (!ascii) return;
    const base = state.file?.name.replace(/\.[^.]+$/, "") ?? "ascii";
    downloadText(`${base}.txt`, ascii);
  }, [ascii, state.file]);

  const onDownloadHtml = useCallback(() => {
    if (!ascii) return;
    const base = state.file?.name.replace(/\.[^.]+$/, "") ?? "ascii";
    // In color mode, ascii already contains valid <span> markup — use it directly.
    // In plain mode, HTML-escape the raw text before inserting into <pre>.
    const preContent =
      state.outputMode === "color" ? ascii : escapeHtml(ascii);
    const html = `<!doctype html><meta charset="utf-8"><title>${base}</title><pre style="font-family:JetBrains Mono,monospace;font-size:10px;line-height:1;letter-spacing:-0.02em;white-space:pre">${preContent}</pre>`;
    downloadText(`${base}.html`, html, "text/html");
  }, [ascii, state.file, state.outputMode]);

  const onZoomIn = useCallback(() => {
    dispatch({ type: "setZoom", v: Math.min(200, state.zoom + 10) });
  }, [state.zoom]);
  const onZoomOut = useCallback(() => {
    dispatch({ type: "setZoom", v: Math.max(50, state.zoom - 10) });
  }, [state.zoom]);
  const onRerender = useCallback(() => {
    dispatch({ type: "rerender" });
  }, []);

  const lines = ascii ? ascii.split("\n") : [];
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
    contrast: state.contrast,
    ramp: state.ramp,
    customRamp: state.customRamp,
    invert: state.invert,
    outputMode: state.outputMode,
    sobel: state.sobel,
    dithering: state.dithering,
    renderMs,
  };

  const on = {
    files: onFiles,
    removeFile: onRemoveFile,
    width: (v: number) => dispatch({ type: "setWidth", v }),
    contrast: (v: number) => dispatch({ type: "setContrast", v }),
    ramp: (v: RampName) => dispatch({ type: "setRamp", v }),
    customRamp: (v: string) => dispatch({ type: "setCustomRamp", v }),
    invert: (v: boolean) => dispatch({ type: "setInvert", v }),
    outputMode: (v: OutputMode) => dispatch({ type: "setOutputMode", v }),
    sobel: (v: boolean) => dispatch({ type: "setSobel", v }),
    dithering: (v: boolean) => dispatch({ type: "setDithering", v }),
    copy: onCopy,
    downloadTxt: onDownloadTxt,
    downloadHtml: onDownloadHtml,
  };

  return (
    <div className="frame">
      <Topbar />
      <div className="main">
        <ControlsPane state={stateForControls} on={on} />
        <PreviewPane
          ascii={ascii}
          charWidth={charWidth}
          charHeight={charHeight}
          zoom={state.zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onRerender={onRerender}
          frame={{ current: 1, total: 1 }}
          showPlaceholder={!state.file}
          isHtml={state.outputMode === "color"}
        />
        <MobileSheet
          state={stateForControls}
          on={on}
          activeTab={state.mobileTab}
          onTabChange={(t) => dispatch({ type: "setMobileTab", v: t })}
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
