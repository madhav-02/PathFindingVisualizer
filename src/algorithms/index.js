// Algorithm registry. Adding an algorithm means writing one module that
// exports a definition and listing it here -- nothing else changes.
//
// A definition is:
//   id, name, description
//   usesHeuristic  -- show the heuristic picker for it
//   weightAware    -- does it read grid.weight
//   shortestPath   -- 'always' | 'unweighted' | 'never'
//   complexity     -- { time, space }
//   run(grid, { allowDiagonals, heuristic }) -> {
//     visitedOrder,  node indices in expansion order
//     visitedSide,   Int8Array of 0/1 per node, or null (bidirectional only)
//     path,          start -> end node indices, [] when unreachable
//     found,
//   }

import { bfs } from './bfs.js';
import { dfs } from './dfs.js';

export const algorithms = [bfs, dfs];

export const algorithmById = new Map(algorithms.map((a) => [a.id, a]));
