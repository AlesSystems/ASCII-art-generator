import { describe, it, expect } from "vitest";
import { buildAnimatedHtml } from "../src/animated-html.js";

describe("buildAnimatedHtml", () => {
  it("2 frames produces output containing both frame strings", () => {
    const frames = ["frame-one-content", "frame-two-content"];
    const delays = [100, 200];
    const html = buildAnimatedHtml(frames, delays, "test");

    expect(html).toContain("frame-one-content");
    expect(html).toContain("frame-two-content");
  });

  it("output contains <pre>, <script>, and the delays array", () => {
    const frames = ["AAA", "BBB"];
    const delays = [150, 250];
    const html = buildAnimatedHtml(frames, delays, "my-gif");

    expect(html).toContain("<pre");
    expect(html).toContain("<script>");
    expect(html).toContain("[150,250]");
  });

  it("single frame produces a still page (no setTimeout)", () => {
    const frames = ["single-frame"];
    const delays = [0];
    const html = buildAnimatedHtml(frames, delays, "still");

    expect(html).toContain("single-frame");
    // A single frame should not use setTimeout for animation
    expect(html).not.toContain("setTimeout");
  });

  it("HTML-escapes the title", () => {
    const frames = ["a"];
    const html = buildAnimatedHtml(frames, [0], '<script>alert(1)</script>');

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("format:'html' uses innerHTML assignment", () => {
    const frames = ["<span>colored</span>"];
    const html = buildAnimatedHtml(frames, [100], "colored", "html");

    expect(html).toContain("innerHTML");
  });

  it("format:'text' (default) uses textContent assignment", () => {
    const frames = ["plain text"];
    const html = buildAnimatedHtml(frames, [100], "plain");

    expect(html).toContain("textContent");
    expect(html).not.toContain("innerHTML");
  });

  it("multi-frame output wraps around using modulo", () => {
    const frames = ["A", "B", "C"];
    const delays = [100, 100, 100];
    const html = buildAnimatedHtml(frames, delays, "anim");

    // Should contain the modulo loop logic
    expect(html).toContain("% frames.length");
  });

  it("neutralizes </script> inside frame content so the script tag cannot be broken out of", () => {
    const frames = ["alert('xss')</script><script>fetch('//evil')</script>", "second frame"];
    const html = buildAnimatedHtml(frames, [100, 100], "x");

    // The raw </script> sequence must not survive verbatim inside the inline <script> block.
    // Count occurrences: there is exactly one legitimate `</script>` (the closing tag of the
    // bundled script). Anything beyond that would be an injection.
    const matches = html.match(/<\/script>/gi) ?? [];
    expect(matches.length).toBe(1);
  });

  it("neutralizes <!-- inside frame content", () => {
    const frames = ["before<!--injected-->after"];
    const html = buildAnimatedHtml(frames, [0], "x");

    expect(html).not.toContain("<!--injected");
  });
});
