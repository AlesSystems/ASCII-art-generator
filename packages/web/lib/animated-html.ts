/**
 * Builds a self-contained animated HTML document from a sequence of ASCII frames.
 *
 * The output file:
 * - Embeds all frames and delays as JSON inside a <script> block.
 * - Uses setTimeout to cycle through frames, looping forever.
 * - Renders frames in a <pre> with monospace font, no external dependencies.
 *
 * @param frames    Array of ASCII strings (one per frame).
 * @param delaysMs  Per-frame delays in milliseconds (parallel to frames).
 * @param title     Page title — HTML-escaped internally.
 * @param format    'text' uses textContent (plain ASCII); 'html' uses innerHTML
 *                  (for color-mode output that contains <span> elements).
 */
export function buildAnimatedHtml(
  frames: string[],
  delaysMs: number[],
  title: string,
  format: 'text' | 'html' = 'text'
): string {
  const safeTitle = escapeHtmlAttr(title);
  const framesJson = neutralizeScriptCloseTags(JSON.stringify(frames));
  const delaysJson = neutralizeScriptCloseTags(JSON.stringify(delaysMs));
  const assignProp = format === 'html' ? 'innerHTML' : 'textContent';

  // For a single static frame, no animation loop is needed.
  const scriptBody =
    frames.length <= 1
      ? `
  var pre = document.getElementById('a');
  var frames = ${framesJson};
  pre.${assignProp} = frames[0] || '';
`
      : `
  var pre = document.getElementById('a');
  var frames = ${framesJson};
  var delays = ${delaysJson};
  var i = 0;
  function next() {
    pre.${assignProp} = frames[i];
    var d = delays[i] != null ? delays[i] : 100;
    i = (i + 1) % frames.length;
    setTimeout(next, d);
  }
  next();
`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#ccc;display:flex;justify-content:center;align-items:flex-start;padding:16px}
pre{font-family:"JetBrains Mono","Fira Mono","Courier New",monospace;font-size:10px;line-height:1;letter-spacing:-0.02em;white-space:pre}
</style>
</head>
<body>
<pre id="a"></pre>
<script>
${scriptBody.trim()}
</script>
</body>
</html>`;
}

/** Escape HTML special characters for use inside an HTML attribute or title element. */
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// JSON.stringify does not escape sequences like `</script>` or `<!--` which would
// break out of an inline <script> block. Neutralize them so JSON parsers still
// accept the result (`<\/` and the comment sequences remain valid JSON strings).
function neutralizeScriptCloseTags(s: string): string {
  return s
    .replace(/<\/(script|style|!)/gi, '<\\/$1')
    .replace(/<!--/g, '<\\!--');
}
