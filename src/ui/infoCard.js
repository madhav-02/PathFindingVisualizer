// Renders the algorithm info card: description, guarantee badges, complexity,
// and a warning when the current settings undermine the algorithm.

import { heuristics } from '../core/heuristics.js';

const BADGE_BASE = 'rounded px-1.5 py-0.5 text-[10px] font-medium';

const OPTIMALITY = {
  always: { label: 'Optimal', tone: 'bg-emerald-950 text-emerald-300' },
  unweighted: { label: 'Optimal if unweighted', tone: 'bg-sky-950 text-sky-300' },
  never: { label: 'Not optimal', tone: 'bg-rose-950 text-rose-300' },
};

function badge(label, tone) {
  const span = document.createElement('span');
  span.className = `${BADGE_BASE} ${tone}`;
  span.textContent = label;
  return span;
}

/** Correctness caveats worth surfacing before the user trusts a result. */
function noteFor(algorithm, { allowDiagonals, heuristic, hasWeights }) {
  if (algorithm.usesHeuristic && allowDiagonals && !heuristics[heuristic]?.diagonalSafe) {
    return `${heuristics[heuristic].name} overestimates distance once diagonal moves are allowed, so ${algorithm.name} can settle for a path that is not the cheapest. Octile is the matching heuristic for 8-way movement.`;
  }
  if (hasWeights && !algorithm.weightAware) {
    return `${algorithm.name} treats every open cell as cost 1, so the weighted cells you painted will not change its route. Dijkstra and A* respect them.`;
  }
  return null;
}

export class InfoCard {
  constructor(els) {
    this.els = els;
  }

  render(algorithm, context) {
    const { name, desc, badges, time, space, note } = this.els;
    if (!algorithm) return;

    name.textContent = algorithm.name;
    desc.textContent = algorithm.description;
    time.textContent = algorithm.complexity.time;
    space.textContent = algorithm.complexity.space;

    const optimality = OPTIMALITY[algorithm.shortestPath];
    const list = [badge(optimality.label, optimality.tone)];
    list.push(
      algorithm.weightAware
        ? badge('Weight-aware', 'bg-amber-950 text-amber-300')
        : badge('Ignores weights', 'bg-slate-800 text-slate-400'),
    );
    if (algorithm.usesHeuristic) {
      list.push(badge('Heuristic-guided', 'bg-violet-950 text-violet-300'));
    }
    badges.replaceChildren(...list);

    const text = noteFor(algorithm, context);
    note.textContent = text ?? '';
    note.classList.toggle('hidden', text === null);
  }
}
