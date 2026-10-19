// Heuristics for A* and Greedy Best-First. Each takes absolute row/col deltas.
// Admissibility depends on the move set: Manhattan is admissible for 4-way
// movement only, so Octile is the right pick once diagonals are enabled.

const SQRT2 = Math.SQRT2;

export const heuristics = {
  manhattan: {
    name: 'Manhattan',
    fn: (dr, dc) => dr + dc,
    diagonalSafe: false,
  },
  octile: {
    name: 'Octile',
    fn: (dr, dc) => (dr > dc ? dr - dc + SQRT2 * dc : dc - dr + SQRT2 * dr),
    diagonalSafe: true,
  },
  euclidean: {
    name: 'Euclidean',
    fn: (dr, dc) => Math.sqrt(dr * dr + dc * dc),
    diagonalSafe: true,
  },
  chebyshev: {
    name: 'Chebyshev',
    fn: (dr, dc) => Math.max(dr, dc),
    diagonalSafe: true,
  },
};

export const heuristicOrder = ['manhattan', 'octile', 'euclidean', 'chebyshev'];

/** Bind a heuristic to a grid and goal. Returns fn(nodeIndex) -> estimate. */
export function makeHeuristic(grid, goal, name) {
  const { fn } = heuristics[name] ?? heuristics.manhattan;
  const { cols } = grid;
  const gr = Math.floor(goal / cols);
  const gc = goal % cols;
  return (i) => fn(Math.abs(Math.floor(i / cols) - gr), Math.abs((i % cols) - gc));
}
