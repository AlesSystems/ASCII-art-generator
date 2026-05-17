"use client";

import type { JSX } from "react";
import { Dropzone } from "@/components/Dropzone";
import { FileRow } from "@/components/FileRow";
import { Slider } from "@/components/Slider";
import { CharsetPicker } from "@/components/CharsetPicker";
import { ToggleRow } from "@/components/ToggleRow";
import { Segmented } from "@/components/Segmented";
import { ActionButtons } from "@/components/ActionButtons";

type RampName = "default" | "inverted" | "extended" | "custom";
type OutputMode = "plain" | "color" | "edges" | "hybrid";

type ControlsPaneProps = {
  state: {
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
  on: {
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
  isAnimated?: boolean;
};

const RAMP_PREVIEWS: Record<RampName, string> = {
  default: " .:-=+*#%@",
  inverted: "@%#*+=-:. ",
  extended: " .'`^\",;Il!",
  custom: "",
};

const OUTPUT_MODE_OPTIONS: { value: OutputMode; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "color", label: "Color" },
  { value: "edges", label: "Edges" },
  { value: "hybrid", label: "Hybrid" },
];

export function ControlsPane({ state, on, isAnimated = false }: ControlsPaneProps): JSX.Element {
  const previewChars =
    state.ramp === "custom"
      ? state.customRamp
      : RAMP_PREVIEWS[state.ramp] ?? "";

  return (
    <aside className="controls">
      {/* Source */}
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

      <hr className="hr" />

      {/* Geometry */}
      <div className="group">
        <div className="section-label">Geometry</div>
        <Slider label="Width" value={state.width} suffix=" ch" min={40} max={200} onChange={on.width} />
        <Slider label="Brightness" value={state.brightness} suffix="" min={-100} max={100} onChange={on.brightness} />
      </div>

      <hr className="hr" />

      {/* Charset */}
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

      <hr className="hr" />

      {/* Adjustments */}
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

      <hr className="hr" />

      {/* Output mode */}
      <div className="group">
        <div className="section-label">Output mode</div>
        <Segmented<OutputMode>
          options={OUTPUT_MODE_OPTIONS}
          value={state.outputMode}
          onChange={on.outputMode}
        />
      </div>

      <hr className="hr" />

      {/* Action buttons */}
      <ActionButtons
        onCopy={on.copy}
        onDownloadTxt={on.downloadTxt}
        onDownloadHtml={on.downloadHtml}
        renderMs={state.renderMs}
        isAnimated={isAnimated}
        onDownloadAnimatedHtml={on.downloadAnimatedHtml}
      />
    </aside>
  );
}
