// Edges at theta and theta+π are the same edge, so we fold the gradient
// direction into [0, π) and snap to the nearest π/4 sector. Characters point
// along the edge (perpendicular to the gradient):
//   gradient horizontal (≈ 0)    → vertical edge   → |
//   gradient ≈ π/4               → diagonal edge   → /
//   gradient vertical (≈ π/2)    → horizontal edge → -
//   gradient ≈ 3π/4              → diagonal edge   → \
export function directionToChar(
  theta: number,
  magnitude: number,
  threshold: number
): string {
  if (magnitude < threshold) return ' ';

  const folded = ((theta % Math.PI) + Math.PI) % Math.PI;
  const sector = Math.floor((folded + Math.PI / 8) / (Math.PI / 4)) % 4;

  switch (sector) {
    case 0: return '|';
    case 1: return '/';
    case 2: return '-';
    case 3: return '\\';
    default: return '|';
  }
}
