import { neighbors, reconstruct, newParents } from '../core/grid.js';

/**
 * Depth-First Search. Included as a counterexample: it commits to one
 * direction until it dead-ends, so the path it returns is usually far from
 * optimal even though it often reaches the target quickly.
 *
 * The parent is recorded when a node is popped, not when it is discovered, so
 * the reconstructed route is the real DFS tree path rather than a shortcut
 * stitched from whichever neighbour happened to push it last.
 */
export const dfs = {
  id: 'dfs',
  name: 'Depth-First Search',
  description:
    'Follows one branch as deep as it goes before backtracking. Fast to stumble onto a target, but the route it returns is usually long and winding. Shown here mainly to make the contrast with BFS obvious.',
  usesHeuristic: false,
  weightAware: false,
  shortestPath: 'never',
  complexity: { time: 'O(V + E)', space: 'O(V)' },

  run(grid, { allowDiagonals = false } = {}) {
    const { n, start, end } = grid;
    const cameFrom = newParents(n);
    const seen = new Uint8Array(n);
    const visitedOrder = [];

    // A node can be stacked once per incident edge, so these grow past n.
    const nodeStack = [start];
    const parentStack = [-1];
    let found = false;

    while (nodeStack.length > 0) {
      const cur = nodeStack.pop();
      const parent = parentStack.pop();
      if (seen[cur]) continue;

      seen[cur] = 1;
      cameFrom[cur] = parent;
      visitedOrder.push(cur);

      if (cur === end) {
        found = true;
        break;
      }

      // Reversed so the first neighbour is explored first.
      const nbs = neighbors(grid, cur, allowDiagonals);
      for (let k = nbs.length - 1; k >= 0; k--) {
        if (!seen[nbs[k]]) {
          nodeStack.push(nbs[k]);
          parentStack.push(cur);
        }
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
