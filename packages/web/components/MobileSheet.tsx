"use client";

import type { JSX } from "react";
import { Dropzone } from "@/components/Dropzone";
import { FileRow } from "@/components/FileRow";
import { Slider } from "@/components/Slider";
import { CharsetPicker } from "@/components/CharsetPicker";
import { ToggleRow } from "@/components/ToggleRow";
import { Segmented } from "@/components/Segmented";

type RampName = "default" | "inverted" | "extended" | "custom";
type OutputMode = "plain" | "color" | "edges" | "hybrid";
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
  brightness: number;
  autoContrast: boolean;
  dither: boolean;
  gamma: boolean;
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
  brightness: (v: number) => void;
  autoContrast: (v: boolean) => void;
  dither: (v: boolean) => void;
  gamma: (v: boolean) => void;
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

const OUTPUT_MODE_OPTIONS: { value: OutputMode; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "color", label: "Color" },
  { value: "edges", label: "Edges" },
  { value: "hybrid", label: "Hybrid" },
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div className="section-label">Source</div>
            <Dropzone hasFile={state.file !== null} onFiles={on.files}>
              {state.file !== null && (
                <FileRow
                  name={state.file.name}
                  size={state.file.size}
                  width={state.file.width}
                  height={state.file.height}
                  thumbnailUrl={state.file.thumbnailUrl}
                  onRemove={on.removeFile}
                />
              )}
            </Dropzone>
          </div>

          <div className="group">
            <div className="section-label">Geometry</div>
            <Slider
              label="Width"
              value={state.width}
              suffix=" ch"
              min={40}
              max={200}
              onChange={on.width}
            />
            <Slider
              label="Brightness"
              value={state.brightness}
              suffix=""
              min={-100}
              max={100}
              onChange={on.brightness}
            />
          </div>
        </div>
      )}

      {activeTab === "advanced" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="group">
            <div className="section-label">Character set</div>
            <CharsetPicker
              value={state.ramp}
              customRamp={state.customRamp}
              onValueChange={on.ramp}
              onCustomChange={on.customRamp}
              previewChars={previewChars}
            />
          </div>

          <div className="group">
            <div className="section-label">Adjustments</div>
            <ToggleRow
              label="Auto contrast"
              sub="stretches histogram for full ramp coverage"
              on={state.autoContrast}
              onChange={on.autoContrast}
            />
            <ToggleRow
              label="Dither"
              sub="Floyd–Steinberg; best for smooth gradients"
              on={state.dither}
              onChange={on.dither}
            />
            <ToggleRow
              label="Gamma correct"
              sub="perceptually accurate luminance"
              on={state.gamma}
              onChange={on.gamma}
            />
            <ToggleRow
              label="Invert colors"
              sub="dark pixels become light chars"
              on={state.invert}
              onChange={on.invert}
            />
          </div>

          <div className="group">
            <div className="section-label">Output mode</div>
            <Segmented<OutputMode>
              options={OUTPUT_MODE_OPTIONS}
              value={state.outputMode}
              onChange={on.outputMode}
            />
          </div>
        </div>
      )}

      {activeTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="section-label">Export</div>
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
