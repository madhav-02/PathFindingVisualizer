import './styles.css';
import { makeGrid } from './core/grid.js';
import { heuristics, heuristicOrder } from './core/heuristics.js';
import { Board } from './ui/board.js';

const el = {
  boardArea: document.getElementById('board'),
  grid: document.getElementById('grid'),
  heuristic: document.getElementById('heuristic'),
  tools: document.getElementById('tools'),
  clearPath: document.getElementById('clearPath'),
  clearAll: document.getElementById('clearAll'),
  status: document.getElementById('status'),
};

const GAP = 1; // must match the grid gap in styles.css
const PADDING = 26; // board padding + grid border

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Smaller cells on phones, so a narrow screen still gets a usable grid. */
const cellSizeForViewport = () => (window.innerWidth < 640 ? 18 : 24);

/** Build the largest grid that fits the board area at the current cell size. */
function fitGrid() {
  const cell = cellSizeForViewport();
  document.documentElement.style.setProperty('--cell', `${cell}px`);

  const rows = clamp(Math.floor((el.boardArea.clientHeight - PADDING) / (cell + GAP)), 5, 80);
  const cols = clamp(Math.floor((el.boardArea.clientWidth - PADDING) / (cell + GAP)), 5, 160);
  return makeGrid(rows, cols);
}

function populateHeuristics() {
  el.heuristic.replaceChildren(
    ...heuristicOrder.map((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = heuristics[key].name;
      return opt;
    }),
  );
}

function setTool(tool) {
  board.setTool(tool);
  for (const btn of el.tools.querySelectorAll('[data-tool]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.tool === tool));
  }
}

function showGridSize() {
  el.status.textContent = `Grid ${board.grid.rows} \u00d7 ${board.grid.cols}`;
}

// An edit invalidates whatever the last search drew.
function handleEdit() {
  board.clearVisuals();
}

const board = new Board(el.grid, fitGrid(), { onEdit: handleEdit });
board.mount();

populateHeuristics();
setTool('wall');
showGridSize();

el.tools.addEventListener('click', (event) => {
  const tool = event.target.closest('[data-tool]')?.dataset.tool;
  if (tool) setTool(tool);
});

el.clearPath.addEventListener('click', () => board.clearVisuals());
el.clearAll.addEventListener('click', () => board.clearTerrain());
