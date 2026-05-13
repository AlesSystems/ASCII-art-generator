"use client";

import type { JSX } from "react";
import { Slider } from "@/components/Slider";
import { CharsetPicker } from "@/components/CharsetPicker";
import { ToggleRow } from "@/components/ToggleRow";

type RampName = "default" | "inverted" | "extended" | "custom";
type OutputMode = "plain" | "color" | "edges";
type SheetTab = "basics" | "advanced" | "export";

type MobileSheetState = {
  file: {
    name: string;
    size: number;
    width: number;
    height: number;
    thumbnailUrl: string;
  } | null;
  width: number;
  contrast: number;
  ramp: RampName;
  customRamp: string;
  invert: boolean;
  outputMode: OutputMode;
  renderMs: number | null;
};

type MobileSheetOn = {
  files: (files: FileList) => void;
  removeFile: () => void;
  width: (v: number) => void;
  contrast: (v: number) => void;
  ramp: (v: RampName) => void;
  customRamp: (s: string) => void;
  invert: (v: boolean) => void;
  outputMode: (v: OutputMode) => void;
  copy: () => void;
  downloadTxt: () => void;
  downloadHtml: () => void;
  downloadAnimatedHtml?: () => void;
};

type MobileSheetProps = {
  state: MobileSheetState;
  on: MobileSheetOn;
  activeTab: SheetTab;
  onTabChange: (t: SheetTab) => void;
  isAnimated?: boolean;
};

const RAMP_PREVIEWS: Record<RampName, string> = {
  default: " .:-=+*#%@",
  inverted: "@%#*+=-:. ",
  extended: " .'`^\",;Il!",
  custom: "",
};

const TABS: { value: SheetTab; label: string }[] = [
  { value: "basics", label: "Basics" },
  { value: "advanced", label: "Advanced" },
  { value: "export", label: "Export" },
];

export function MobileSheet({
  state,
  on,
  activeTab,
  onTabChange,
  isAnimated = false,
}: MobileSheetProps): JSX.Element {
  const previewChars =
    state.ramp === "custom"
      ? state.customRamp
      : RAMP_PREVIEWS[state.ramp] ?? "";

  return (
    <div className="mobile-sheet">
      <div className="sheet-handle" />

      <div className="sheet-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            className={"sheet-tab" + (activeTab === tab.value ? " active" : "")}
            onClick={() => onTabChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "basics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Slider
            label="Width"
            value={state.width}
            suffix=" ch"
            min={40}
            max={200}
            onChange={on.width}
          />
          <Slider
            label="Contrast"
            value={state.contrast}
            suffix="%"
            min={0}
            max={200}
            onChange={on.contrast}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="btn primary"
              style={{ flex: 1, fontSize: 12.5, padding: "10px" }}
              onClick={on.copy}
            >
              Copy
            </button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, fontSize: 12.5, padding: "10px" }}
              onClick={on.downloadTxt}
            >
              .txt
            </button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, fontSize: 12.5, padding: "10px" }}
              onClick={on.downloadHtml}
            >
              .html
            </button>
          </div>
        </div>
      )}

      {activeTab === "advanced" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CharsetPicker
            value={state.ramp}
            customRamp={state.customRamp}
            onValueChange={on.ramp}
            onCustomChange={on.customRamp}
            previewChars={previewChars}
          />
          <ToggleRow
            label="Invert colors"
            sub="dark pixels become light chars"
            on={state.invert}
            onChange={on.invert}
          />
        </div>
      )}

      {activeTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn primary" onClick={on.copy}>
            Copy to clipboard
          </button>
          <button type="button" className="btn" onClick={on.downloadTxt}>
            Download .txt
          </button>
          <button type="button" className="btn" onClick={on.downloadHtml}>
            Download .html
          </button>
          {isAnimated && on.downloadAnimatedHtml && (
            <button type="button" className="btn" onClick={on.downloadAnimatedHtml}>
              Download animated HTML
            </button>
          )}
        </div>
      )}
    </div>
  );
}
