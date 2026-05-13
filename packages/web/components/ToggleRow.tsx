"use client";

import type { JSX } from "react";
import { Toggle } from "@/components/Toggle";

type ToggleRowProps = {
  label: string;
  sub?: string;
  on: boolean;
  onChange: (next: boolean) => void;
};

export function ToggleRow({ label, sub, on, onChange }: ToggleRowProps): JSX.Element {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {sub && <div className="toggle-sub">{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>
  );
}
