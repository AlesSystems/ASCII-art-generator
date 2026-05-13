"use client";

import type { JSX } from "react";

type SliderProps = {
  label: string;
  value: number;
  suffix?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
};

export function Slider({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onChange,
}: SliderProps): JSX.Element {
  return (
    <div className="slider-row">
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <input
        type="range"
        className="retro"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
