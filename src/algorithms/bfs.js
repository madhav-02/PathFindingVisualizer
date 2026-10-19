import { neighbors, reconstruct, newParents } from '../core/grid.js';

/**
 * Breadth-First Search. Expands in rings of equal step count, so the first
 * time it reaches the target it has used the fewest possible steps -- but it
 * counts steps, not cost, so weighted cells do not influence it at all.
 */
export const bfs = {
  id: 'bfs',
  name: 'Breadth-First Search',
  description:
    'Explores every cell one step away, then two steps away, and so on. Finds the path with the fewest steps, but treats a cost-10 cell exactly like a cost-1 cell.',
  usesHeuristic: false,
  weightAware: false,
  shortestPath: 'unweighted',
  complexity: { time: 'O(V + E)', space: 'O(V)' },

  run(grid, { allowDiagonals = false } = {}) {
    const { n, start, end } = grid;
    const cameFrom = newParents(n);
    const seen = new Uint8Array(n);
    const visitedOrder = [];

    // Each node is enqueued at most once, so n slots always suffice.
    const queue = new Int32Array(n);
    let head = 0;
    let tail = 0;

    queue[tail++] = start;
    seen[start] = 1;
    let found = false;

    while (head < tail) {
      const cur = queue[head++];
      visitedOrder.push(cur);

      if (cur === end) {
        found = true;
        break;
      }

      for (const nb of neighbors(grid, cur, allowDiagonals)) {
        if (seen[nb]) continue;
        seen[nb] = 1;
        cameFrom[nb] = cur;
        queue[tail++] = nb;
      }
    }

    return {
      visitedOrder,
      visitedSide: null,
      path: found ? reconstruct(cameFrom, end) : [],
      found,
    };
  },
};
