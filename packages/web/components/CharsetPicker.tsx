"use client";

import type { JSX, CSSProperties, ChangeEvent } from "react";

type RampName = "default" | "inverted" | "extended" | "custom";

type CharsetPickerProps = {
  value: RampName;
  customRamp: string;
  onValueChange: (v: RampName) => void;
  onCustomChange: (s: string) => void;
  previewChars: string;
};

const chipStyle: CSSProperties = {
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 13,
  border: "1px solid var(--ink)",
  width: 22,
  height: 22,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--surface)",
};

export function CharsetPicker({
  value,
  customRamp,
  onValueChange,
  onCustomChange,
  previewChars,
}: CharsetPickerProps): JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="select-wrap">
        <select
          className="retro-select"
          value={value}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(e.target.value as RampName)}
        >
          <option value="default">Default · .:-=+*#%@</option>
          <option value="inverted">Inverted</option>
          <option value="extended">Extended · 70 chars</option>
          <option value="custom">Custom…</option>
        </select>
      </div>
      {value === "custom" && (
        <input
          type="text"
          className="text-input"
          placeholder="@%#*+=- :."
          value={customRamp}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onCustomChange(e.target.value)}
        />
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {previewChars.split("").map((char, i) => (
          <span key={i} style={chipStyle}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
