import { neighbors, stepCost, reconstruct, newParents } from '../core/grid.js';
import { MinHeap } from '../core/heap.js';

/**
 * Dijkstra's algorithm. Expands whichever reachable cell is cheapest to get to
 * so far, which makes it the weighted counterpart to BFS: identical behaviour
 * when every cell costs 1, but it will detour around expensive terrain.
 *
 * Uses lazy deletion -- a cell whose distance improves is pushed again rather
 * than decrease-keyed, and stale entries are skipped on pop. Simpler than a
 * heap that supports decrease-key, with the same asymptotic cost.
 */
export const dijkstra = {
  id: 'dijkstra',
  name: "Dijkstra's Algorithm",
  description:
    'Always expands the cheapest-so-far cell. Guaranteed to find the lowest-cost route, and it is the only reason painting weighted cells changes anything. Explores broadly, because it has no idea where the target is.',
  usesHeuristic: false,
  weightAware: true,
  shortestPath: 'always',
  complexity: { time: 'O((V + E) log V)', space: 'O(V)' },

  run(grid, { allowDiagonals = false } = {}) {
    const { n, start, end } = grid;
    const dist = new Float64Array(n).fill(Infinity);
    const cameFrom = newParents(n);
    const settled = new Uint8Array(n);
    const visitedOrder = [];
    const heap = new MinHeap();

    dist[start] = 0;
    heap.push(start, 0);
    let found = false;

    while (heap.size > 0) {
      const cur = heap.pop();
      if (settled[cur]) continue; // stale entry from a since-improved distance
      settled[cur] = 1;
      visitedOrder.push(cur);

      if (cur === end) {
        found = true;
        break;
      }

      for (const nb of neighbors(grid, cur, allowDiagonals)) {
        if (settled[nb]) continue;
        const alt = dist[cur] + stepCost(grid, cur, nb);
        if (alt < dist[nb]) {
          dist[nb] = alt;
          cameFrom[nb] = cur;
          heap.push(nb, alt);
        }
      }
    }

    return {
      visitedOrder,
      visitedSide: null,
      path: found ? reconstruct(cameFrom, end) : [],
      found,
      cost: found ? dist[end] : Infinity,
    };
  },
};
