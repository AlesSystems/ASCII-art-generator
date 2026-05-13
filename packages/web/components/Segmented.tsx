"use client";

import type { JSX } from "react";

type SegmentedProps<T extends string = string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>): JSX.Element {
  return (
    <div className="segmented">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={opt.value === value ? "active" : ""}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
