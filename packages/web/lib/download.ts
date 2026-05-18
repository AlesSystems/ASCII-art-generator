'use client';

/**
 * Strips the `<span style="color:#RRGGBB">X</span>` wrappers emitted by the
 * core's HTML color output, returning the underlying ASCII. Also decodes the
 * three entities the core escapes (`&amp;`, `&lt;`, `&gt;`).
 */
export function htmlToPlainAscii(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Copies text to the system clipboard.
 * Uses the modern Clipboard API when available; falls back to a
 * temporary textarea + execCommand for older/restricted contexts.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Legacy fallback (e.g. non-secure origins, older browsers).
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  // execCommand is deprecated but broadly available as a fallback.
  document.execCommand('copy');
  document.body.removeChild(ta);
}

/**
 * Copies HTML content to the clipboard with a plain-text fallback.
 * Writes both text/html and text/plain so HTML-aware editors keep colors
 * while plain editors receive the underlying ASCII characters.
 */
export async function copyRichToClipboard(html: string, plain: string): Promise<void> {
  if (
    typeof navigator !== 'undefined' &&
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard?.write
  ) {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
    return;
  }
  // Fall back to plain text when ClipboardItem / clipboard.write is unavailable.
  await copyToClipboard(plain);
}

/**
 * Triggers a browser download of text content as a file.
 *
 * @param filename  Suggested filename (e.g. "ascii-art.txt")
 * @param text      The text content to download
 * @param mime      MIME type (defaults to "text/plain")
 */
export function downloadText(
  filename: string,
  text: string,
  mime = 'text/plain'
): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke the object URL after the download has had time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
