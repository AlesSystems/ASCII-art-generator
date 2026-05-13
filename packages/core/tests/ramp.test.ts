import { describe, it, expect } from "vitest";
import { mapToRamp, RAMPS, resolveRamp } from "../src/ramp.js";

describe("mapToRamp", () => {
  const ramp = RAMPS.default; // " .:-=+*#%@"

  it("brightness 0 → first char of ramp", () => {
    const result = mapToRamp(new Uint8Array([0]), ramp);
    expect(result[0]).toBe(ramp[0]);
  });

  it("brightness 255 → last char of ramp (NOT out of bounds)", () => {
    const result = mapToRamp(new Uint8Array([255]), ramp);
    expect(result[0]).toBe(ramp[ramp.length - 1]);
    expect(result[0]).not.toBeUndefined();
  });

  it("midpoint (~128) → middle char", () => {
    const result = mapToRamp(new Uint8Array([128]), ramp);
    const expectedIdx = Math.floor((128 / 256) * ramp.length);
    expect(result[0]).toBe(ramp[expectedIdx]);
  });

  it("inverted ramp swaps: brightness 0 → ramp.inverted[0] = '@'", () => {
    const result = mapToRamp(new Uint8Array([0]), RAMPS.inverted);
    expect(result[0]).toBe("@");
  });

  it("inverted ramp: brightness 255 → last char = ' '", () => {
    const result = mapToRamp(new Uint8Array([255]), RAMPS.inverted);
    expect(result[0]).toBe(" ");
  });

  it("multi-pixel produces correct length", () => {
    const result = mapToRamp(new Uint8Array([0, 128, 255]), ramp);
    expect(result.length).toBe(3);
  });
});

describe("resolveRamp", () => {
  it("resolves named ramp", () => {
    expect(resolveRamp("default")).toBe(RAMPS.default);
  });

  it("returns raw string if not a known preset", () => {
    expect(resolveRamp("@#.")).toBe("@#.");
  });
});
