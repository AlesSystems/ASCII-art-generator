export const RAMPS = {
  default: " .:-=+*#%@",
  inverted: "@%#*+=-:. ",
  extended:
    " .'`^\",;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
} as const;

export type RampName = keyof typeof RAMPS;

export function resolveRamp(ramp: RampName | string): string {
  const resolved = ramp in RAMPS ? RAMPS[ramp as RampName] : ramp;
  if (resolved.length === 0) throw new Error("ramp must be non-empty");
  return resolved;
}

export function mapToRamp(gray: Uint8Array, ramp: string): string[] {
  const len = ramp.length;
  if (len === 0) throw new Error("ramp must be non-empty");
  const rows: string[] = [];
  for (let i = 0; i < gray.length; i++) {
    const brightness = Math.min(255, Math.max(0, gray[i]!));
    rows.push(ramp[Math.floor((brightness / 256) * len)]!);
  }
  return rows;
}
