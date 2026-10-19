# Pathfinding Visualizer

An interactive grid for watching pathfinding algorithms work. Draw walls, paint
expensive terrain, drag the endpoints around, and step through a search one cell
at a time.

**Live:** https://madhav-02.github.io/PathFindingVisualizer/

No backend — everything runs in your browser.

## Algorithms

| Algorithm | Finds the shortest path? | Respects cell costs? |
|---|---|---|
| Breadth-First Search | Yes, when every cell costs the same | No |
| Depth-First Search | No | No |

Dijkstra, A\*, Greedy Best-First and Bidirectional BFS are planned; the registry
is built so each is a single new file.

## Controls

**Mouse / touch**

| Action | Effect |
|---|---|
| Click or drag an empty cell | Draw walls |
| Drag starting from a wall | Erase instead of draw |
| Drag the green ▶ or red ◉ | Move the start or target |
| Weight tool | Paint cost-10 cells |

After a search finishes it stays live: drag an endpoint or redraw a wall and the
route recomputes instantly under your pointer.

**Keyboard**

| Key | Action |
|---|---|
| `space` | Visualize, or pause/resume a running search |
| `s` | Step one cell |
| `r` | Clear the path |
| `c` | Reset the grid |
| `m` | Generate a maze |

## Grid rules

These are deliberate choices, not defaults:

- A normal cell costs **1**; a weight cell costs **10**.
- With diagonals enabled, a diagonal step costs `cost × √2`, so diagonal routes
  aren't artificially cheap.
- **No corner cutting**: a diagonal move is blocked if either orthogonal cell it
  squeezes past is a wall.

BFS and DFS ignore costs entirely. The sidebar says so when you paint weights
while one of them is selected, rather than quietly returning a route that looks
wrong.

## Running locally

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Then open **http://localhost:5173/PathFindingVisualizer/**.

> The `/PathFindingVisualizer/` suffix is required. `vite.config.js` sets `base`
> to the repo name for GitHub Pages, and that applies to the dev server too, so
> bare `localhost:5173` returns a 404.

Other scripts:

```bash
npm run build     # static site into dist/
npm run preview   # serve dist/ exactly as it will be deployed
```

## Deployment

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `main`.

Two things it depends on:

1. **Settings → Pages → Source** must be **GitHub Actions**. On "Deploy from a
   branch", Pages serves the raw source instead — which renders as unstyled HTML,
   because the stylesheet only exists after a build.
2. **`base` in `vite.config.js` must match the repository name.** Rename the repo
   and every asset 404s.

Pushing changes under `.github/workflows/` needs a token with the `workflow`
scope, or an SSH remote.

## Code layout

```
src/
  core/
    grid.js         grid model, neighbours, step costs, resize
    heap.js         binary min-heap for the priority-queue algorithms
    heuristics.js   Manhattan, Octile, Euclidean, Chebyshev
  algorithms/
    index.js        registry — the only file that lists algorithms
    bfs.js, dfs.js
  ui/
    board.js        grid DOM + pointer interaction
    animator.js     frame-budgeted step replay
    stats.js        run stats card
    infoCard.js     algorithm description, badges, warnings
    shortcuts.js    keyboard bindings
  main.js           wiring
  styles.css        Tailwind import + cell states and keyframes
```

A grid node is a flat integer index, `i = row * cols + col`, with parallel typed
arrays for walls and weights. No per-cell objects, which is what makes the
instant re-run-while-dragging fast enough to feel live.

Cell appearance is hand-written CSS rather than Tailwind utilities: the animation
loop toggles classes on thousands of cells and the states need `@keyframes`.
Tailwind styles everything else.

## Adding an algorithm

Create a module that exports a definition, then add it to the array in
`src/algorithms/index.js`. Nothing else changes — the dropdown, info card,
stats, animation and step-through all read from this shape.

```js
export const myAlgorithm = {
  id: 'my-algorithm',
  name: 'My Algorithm',
  description: 'One or two sentences shown in the sidebar.',
  usesHeuristic: false,          // show the heuristic picker?
  weightAware: false,            // does it read grid.weight?
  shortestPath: 'unweighted',    // 'always' | 'unweighted' | 'never'
  complexity: { time: 'O(V + E)', space: 'O(V)' },

  run(grid, { allowDiagonals, heuristic }) {
    return {
      visitedOrder,   // node indices, in the order they were expanded
      visitedSide,    // Int8Array of 0/1 per node, or null
      path,           // start -> end node indices, [] if unreachable
      found,
    };
  },
};
```

`run` must be pure: take a grid, return a result, touch no DOM. That's what lets
the same function drive the animation, the single-step mode and the instant
re-run, and it's why the algorithms can be tested in plain Node.
