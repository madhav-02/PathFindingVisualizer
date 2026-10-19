// Task 1 scaffold: proves the module graph, Tailwind build and grid CSS all
// line up. Interaction, algorithms and animation arrive in later tasks.

import './styles.css';
import { makeGrid, rowOf, colOf } from './core/grid.js';
import { heuristics, heuristicOrder } from './core/heuristics.js';

const CELL = 24; // keep in sync with --cell in styles.css

const boardEl = document.getElementById('board');
const gridEl = document.getElementById('grid');
const heuristicEl = document.getElementById('heuristic');
const statusEl = document.getElementById('status');

/** Largest grid that fits the board area at the current cell size. */
function fitDimensions() {
  const pad = 24;
  const rows = Math.max(5, Math.floor((boardEl.clientHeight - pad) / (CELL + 1)));
  const cols = Math.max(5, Math.floor((boardEl.clientWidth - pad) / (CELL + 1)));
  return { rows, cols };
}

function render(grid) {
  gridEl.style.setProperty('--cols', grid.cols);
  const frag = document.createDocumentFragment();

  for (let i = 0; i < grid.n; i++) {
    const cell = document.createElement('div');
    cell.className = 'pf-cell';
    if (i === grid.start) cell.classList.add('start');
    else if (i === grid.end) cell.classList.add('end');
    cell.dataset.i = i;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `row ${rowOf(grid, i) + 1}, column ${colOf(grid, i) + 1}`);
    frag.append(cell);
  }

  gridEl.replaceChildren(frag);
}

function populateHeuristics() {
  heuristicEl.replaceChildren(
    ...heuristicOrder.map((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = heuristics[key].name;
      return opt;
    }),
  );
}

const { rows, cols } = fitDimensions();
const grid = makeGrid(rows, cols);
render(grid);
populateHeuristics();
statusEl.textContent = `Grid ${rows} x ${cols}`;
