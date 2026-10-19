// Grid model + traversal helpers. Nodes are flat indices: i = row * cols + col.

export const HEAVY = 10; // cost of a "weight" cell
export const SQRT2 = Math.SQRT2;

const ORTHO = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

export function makeGrid(rows, cols) {
  const n = rows * cols;
  const grid = {
    rows,
    cols,
    n,
    wall: new Uint8Array(n),
    weight: new Uint16Array(n).fill(1),
    start: 0,
    end: n - 1,
  };
  const midRow = Math.floor(rows / 2);
  grid.start = idx(grid, midRow, Math.max(1, Math.floor(cols * 0.15)));
  grid.end = idx(grid, midRow, Math.min(cols - 2, Math.floor(cols * 0.85)));
  return grid;
}

export const idx = (grid, r, c) => r * grid.cols + c;
export const rowOf = (grid, i) => Math.floor(i / grid.cols);
export const colOf = (grid, i) => i % grid.cols;

export const inBounds = (grid, r, c) => r >= 0 && c >= 0 && r < grid.rows && c < grid.cols;

/**
 * Walkable neighbours of node i. Diagonal steps never cut the corner of an
 * obstacle: a diagonal is blocked if either shared orthogonal cell is a wall.
 */
export function neighbors(grid, i, allowDiagonals) {
  const { rows, cols, wall } = grid;
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out = [];

  for (const [dr, dc] of ORTHO) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
    const j = nr * cols + nc;
    if (!wall[j]) out.push(j);
  }

  if (allowDiagonals) {
    for (const [dr, dc] of DIAG) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      const j = nr * cols + nc;
      if (wall[j]) continue;
      if (wall[r * cols + nc] || wall[nr * cols + c]) continue; // no corner cutting
      out.push(j);
    }
  }

  return out;
}

export const isDiagonalStep = (grid, from, to) =>
  rowOf(grid, from) !== rowOf(grid, to) && colOf(grid, from) !== colOf(grid, to);

/** Cost of entering `to` from `from`. Diagonals pay the sqrt(2) premium. */
export function stepCost(grid, from, to) {
  const w = grid.weight[to];
  return isDiagonalStep(grid, from, to) ? w * SQRT2 : w;
}

/** Walk a parent array back to its root. Returns root -> node order. */
export function reconstruct(cameFrom, node) {
  const path = [];
  let cur = node;
  while (cur !== -1) {
    path.push(cur);
    cur = cameFrom[cur];
  }
  return path.reverse();
}

export function pathCost(grid, path) {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += stepCost(grid, path[i - 1], path[i]);
  return total;
}

/** Parent array seeded with -1 (= no parent). */
export function newParents(n) {
  return new Int32Array(n).fill(-1);
}
