"use client";

import type { JSX, KeyboardEvent } from "react";

type ToggleProps = {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
};

export function Toggle({ on, onChange, label }: ToggleProps): JSX.Element {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(!on);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={"toggle" + (on ? " on" : "")}
      onClick={() => onChange(!on)}
      onKeyDown={handleKeyDown}
    >
      <span className="knob" />
    </button>
  );
}
