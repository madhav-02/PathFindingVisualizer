// Renders the "Run stats" card. Holds no search state of its own -- main.js
// calls these as a run progresses.

import { pathCost } from '../core/grid.js';

const DASH = '\u2014';
const number = new Intl.NumberFormat();

const formatMs = (ms) => {
  if (ms < 1) return '<1 ms';
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${Math.round(ms)} ms`;
};

const formatCost = (cost) =>
  Number.isInteger(cost) ? number.format(cost) : cost.toFixed(1);

const hasWeights = (grid) => grid.weight.some((w) => w > 1);

/** Plain-language verdict, so the panel teaches rather than just counts. */
function verdict(algorithm, result, grid) {
  if (!result.found) return 'No path exists \u2014 the target is walled off.';

  switch (algorithm.shortestPath) {
    case 'always':
      return 'Cheapest path found \u2014 this algorithm is optimal.';
    case 'unweighted':
      return hasWeights(grid)
        ? 'Fewest steps \u2014 but this algorithm ignores cell costs, so a cheaper route may exist.'
        : 'Shortest path found \u2014 optimal with uniform costs.';
    default:
      return 'Path found \u2014 this algorithm does not aim for the shortest one.';
  }
}

export class Stats {
  constructor(els) {
    this.els = els;
  }

  reset() {
    const { visited, len, cost, time, result } = this.els;
    visited.textContent = DASH;
    len.textContent = DASH;
    cost.textContent = DASH;
    time.textContent = DASH;
    result.textContent = 'No run yet.';
  }

  /** Path figures stay hidden until the animation reveals them. */
  startRun(elapsedMs) {
    const { visited, len, cost, time, result } = this.els;
    visited.textContent = '0';
    len.textContent = DASH;
    cost.textContent = DASH;
    time.textContent = formatMs(elapsedMs);
    result.textContent = 'Searching\u2026';
  }

  setVisited(count) {
    this.els.visited.textContent = number.format(count);
  }

  finish(algorithm, result, grid) {
    const { visited, len, cost, result: resultEl } = this.els;
    visited.textContent = number.format(result.visitedOrder.length);

    if (result.found) {
      len.textContent = number.format(result.path.length);
      cost.textContent = formatCost(pathCost(grid, result.path));
    } else {
      len.textContent = DASH;
      cost.textContent = DASH;
    }

    resultEl.textContent = verdict(algorithm, result, grid);
  }
}
