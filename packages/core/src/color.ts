export const ANSI_RESET = "\x1b[0m";

export function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    r.toString(16).padStart(2, "0").toUpperCase() +
    g.toString(16).padStart(2, "0").toUpperCase() +
    b.toString(16).padStart(2, "0").toUpperCase()
  );
}

export function htmlEscape(ch: string): string {
  return ch.replace(/[&<>]/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    return "&gt;";
  });
}

export function wrapHtmlSpan(ch: string, r: number, g: number, b: number): string {
  return `<span style="color:${toHex(r, g, b)}">${htmlEscape(ch)}</span>`;
}

/**
 * Wraps a character with an ANSI truecolor foreground escape.
 * Does NOT append a reset — callers should append ANSI_RESET before newlines
 * to keep the output compact (one reset per line instead of one per char).
 */
export function wrapAnsi(ch: string, r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m${ch}`;
}
