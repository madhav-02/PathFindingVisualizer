import { neighbors, stepCost, reconstruct, newParents } from '../core/grid.js';
import { makeHeuristic } from '../core/heuristics.js';
import { MinHeap } from '../core/heap.js';

/**
 * A*. Dijkstra plus a guess at the remaining distance, so the frontier leans
 * toward the target instead of spreading evenly. Ordered by f = g + h, where g
 * is the known cost so far and h the heuristic estimate.
 *
 * Optimality depends entirely on h never overestimating. Manhattan is exact for
 * 4-way movement but too large for 8-way, which is why enabling diagonals with
 * Manhattan selected raises a warning in the sidebar instead of silently
 * returning a slightly-too-expensive route.
 */
export const astar = {
  id: 'astar',
  name: 'A* Search',
  description:
    'Dijkstra guided by an estimate of the distance remaining, so it searches toward the target rather than in all directions. Same optimal route, usually a fraction of the cells explored.',
  usesHeuristic: true,
  weightAware: true,
  shortestPath: 'always',
  complexity: { time: 'O((V + E) log V)', space: 'O(V)' },

  run(grid, { allowDiagonals = false, heuristic = 'manhattan' } = {}) {
    const { n, start, end } = grid;
    const h = makeHeuristic(grid, end, heuristic);

    const gScore = new Float64Array(n).fill(Infinity);
    const cameFrom = newParents(n);
    const closed = new Uint8Array(n);
    const visitedOrder = [];
    const heap = new MinHeap();

    gScore[start] = 0;
    heap.push(start, h(start));
    let found = false;

    while (heap.size > 0) {
      const cur = heap.pop();
      if (closed[cur]) continue; // stale entry from a since-improved g
      closed[cur] = 1;
      visitedOrder.push(cur);

      if (cur === end) {
        found = true;
        break;
      }

      for (const nb of neighbors(grid, cur, allowDiagonals)) {
        if (closed[nb]) continue;
        const alt = gScore[cur] + stepCost(grid, cur, nb);
        if (alt < gScore[nb]) {
          gScore[nb] = alt;
          cameFrom[nb] = cur;
          heap.push(nb, alt + h(nb));
        }
      }
    }

    return {
      visitedOrder,
      visitedSide: null,
      path: found ? reconstruct(cameFrom, end) : [],
      found,
      cost: found ? gScore[end] : Infinity,
    };
  },
};
