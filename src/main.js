import './styles.css';
import { makeGrid, resizeGrid } from './core/grid.js';
import { heuristics, heuristicOrder } from './core/heuristics.js';
import { algorithms, algorithmById } from './algorithms/index.js';
import { Board } from './ui/board.js';
import { Animator } from './ui/animator.js';
import { Stats } from './ui/stats.js';
import { InfoCard } from './ui/infoCard.js';
import { bindShortcuts } from './ui/shortcuts.js';

const el = {
  boardArea: document.getElementById('board'),
  grid: document.getElementById('grid'),
  algo: document.getElementById('algo'),
  heuristic: document.getElementById('heuristic'),
  heuristicWrap: document.getElementById('heuristicWrap'),
  tools: document.getElementById('tools'),
  speed: document.getElementById('speed'),
  speedLabel: document.getElementById('speedLabel'),
  diagonals: document.getElementById('diagonals'),
  visualize: document.getElementById('visualize'),
  pause: document.getElementById('pause'),
  step: document.getElementById('step'),
  clearPath: document.getElementById('clearPath'),
  clearAll: document.getElementById('clearAll'),
  generate: document.getElementById('generate'),
  status: document.getElementById('status'),
  statVisited: document.getElementById('statVisited'),
  statLen: document.getElementById('statLen'),
  statCost: document.getElementById('statCost'),
  statTime: document.getElementById('statTime'),
  statResult: document.getElementById('statResult'),
  algoName: document.getElementById('algoName'),
  algoDesc: document.getElementById('algoDesc'),
  algoBadges: document.getElementById('algoBadges'),
  algoTime: document.getElementById('algoTime'),
  algoSpace: document.getElementById('algoSpace'),
  algoNote: document.getElementById('algoNote'),
};

const GAP = 1; // must match the grid gap in styles.css
const PADDING = 26; // board padding + grid border

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** 'idle' | 'playing' | 'paused' | 'done' */
let phase = 'idle';
let lastRun = null;

// ---- layout ----

/** Smaller cells on phones, so a narrow screen still gets a usable grid. */
const cellSizeForViewport = () => (window.innerWidth < 640 ? 18 : 24);

/** Largest grid that fits the board area, and sets the cell size it assumed. */
function fitDimensions() {
  const cell = cellSizeForViewport();
  document.documentElement.style.setProperty('--cell', `${cell}px`);

  return {
    rows: clamp(Math.floor((el.boardArea.clientHeight - PADDING) / (cell + GAP)), 5, 80),
    cols: clamp(Math.floor((el.boardArea.clientWidth - PADDING) / (cell + GAP)), 5, 160),
  };
}

// ---- wiring ----

const initial = fitDimensions();
const board = new Board(el.grid, makeGrid(initial.rows, initial.cols), { onEdit: handleEdit });
board.mount();

const stats = new Stats({
  visited: el.statVisited,
  len: el.statLen,
  cost: el.statCost,
  time: el.statTime,
  result: el.statResult,
});

const infoCard = new InfoCard({
  name: el.algoName,
  desc: el.algoDesc,
  badges: el.algoBadges,
  time: el.algoTime,
  space: el.algoSpace,
  note: el.algoNote,
});

let visitedShown = 0;
let weightsPainted = false; // cached so a paint drag does not re-render the card per cell

const animator = new Animator({
  onStep: (step) => {
    if (step.kind === 'visit') {
      board.markVisited(step.i, step.side);
      visitedShown++;
    } else {
      board.markPath(step.i);
    }
  },
  onFrame: () => stats.setVisited(visitedShown),
  onDone: handleAnimationDone,
});

function option(value, label) {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = label;
  return opt;
}

function populateSelects() {
  el.algo.replaceChildren(...algorithms.map((a) => option(a.id, a.name)));
  el.heuristic.replaceChildren(...heuristicOrder.map((k) => option(k, heuristics[k].name)));
}

const currentAlgorithm = () => algorithmById.get(el.algo.value);
const runOptions = () => ({
  allowDiagonals: el.diagonals.checked,
  heuristic: el.heuristic.value,
});

// ---- run / animate ----

function buildSteps({ visitedOrder, visitedSide, path }) {
  const steps = [];
  for (const i of visitedOrder) {
    steps.push({ kind: 'visit', i, side: visitedSide ? visitedSide[i] : 0 });
  }
  for (const i of path) steps.push({ kind: 'path', i });
  return steps;
}

function run({ animate = true } = {}) {
  const algorithm = currentAlgorithm();
  if (!algorithm) return;

  animator.cancel();
  board.clearVisuals();

  const t0 = performance.now();
  const result = algorithm.run(board.grid, runOptions());
  const elapsedMs = performance.now() - t0;

  lastRun = { algorithm, result, elapsedMs };
  visitedShown = 0;
  stats.startRun(elapsedMs);
  animator.load(buildSteps(result));

  // Editing mid-animation would desync the drawing from the model.
  board.setInteractive(false);
  board.setAnimated(animate);

  if (animate) {
    setPhase('playing');
    animator.play();
  } else {
    animator.runRemaining();
  }
}

function handleAnimationDone() {
  board.setInteractive(true);
  board.setAnimated(true);
  if (lastRun) stats.finish(lastRun.algorithm, lastRun.result, board.grid);
  setPhase('done');
}

/** Drop back to an editable, un-animated grid. */
function reset() {
  animator.cancel();
  board.clearVisuals();
  board.setInteractive(true);
  board.setAnimated(true);
  lastRun = null;
  stats.reset();
  setPhase('idle');
}

// An edit invalidates whatever the last search drew.
function handleEdit() {
  // Painting the first (or last) weight changes the card's warning.
  const nowPainted = board.weightCount > 0;
  if (nowPainted !== weightsPainted) {
    weightsPainted = nowPainted;
    syncAlgorithmControls();
  }

  if (phase === 'idle') return;
  animator.cancel();
  board.clearVisuals();
  lastRun = null;
  stats.reset();
  setPhase('idle');
}

// ---- view state ----

function setPhase(next) {
  phase = next;
  const { pause, step, visualize, status } = el;

  pause.disabled = phase !== 'playing' && phase !== 'paused';
  pause.textContent = phase === 'paused' ? 'Resume' : 'Pause';
  visualize.disabled = phase === 'playing';
  step.disabled = phase === 'done';

  if (phase === 'idle') {
    status.textContent = `Grid ${board.grid.rows} \u00d7 ${board.grid.cols}`;
  } else if (phase === 'playing') {
    status.textContent = 'Searching\u2026';
  } else if (phase === 'paused') {
    const { done, total } = animator.progress;
    status.textContent = `Paused ${done} / ${total}`;
  } else if (lastRun) {
    const { result } = lastRun;
    status.textContent = result.found
      ? `Path found \u00b7 ${result.path.length} cells \u00b7 ${result.visitedOrder.length} visited`
      : `No path \u00b7 ${result.visitedOrder.length} visited`;
  }
}

function setTool(tool) {
  board.setTool(tool);
  for (const btn of el.tools.querySelectorAll('[data-tool]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.tool === tool));
  }
}

function syncAlgorithmControls() {
  const algorithm = currentAlgorithm();
  el.heuristicWrap.classList.toggle('hidden', !algorithm?.usesHeuristic);
  infoCard.render(algorithm, { ...runOptions(), hasWeights: weightsPainted });
}

function syncSpeed() {
  animator.setSpeed(Number(el.speed.value));
  el.speedLabel.textContent = el.speed.value;
}

// ---- events ----

el.visualize.addEventListener('click', () => run());

el.pause.addEventListener('click', () => {
  if (phase === 'playing') {
    animator.pause();
    setPhase('paused');
  } else if (phase === 'paused') {
    setPhase('playing');
    animator.play();
  }
});

el.step.addEventListener('click', () => {
  if (!animator.loaded || phase === 'idle') {
    run({ animate: true });
    animator.pause();
    setPhase('paused');
    return;
  }
  animator.stepOnce();
  if (phase !== 'done') setPhase('paused');
});

el.clearPath.addEventListener('click', reset);

el.clearAll.addEventListener('click', () => {
  reset();
  board.clearTerrain();
  weightsPainted = false;
  syncAlgorithmControls();
  setPhase('idle');
});

el.tools.addEventListener('click', (event) => {
  const tool = event.target.closest('[data-tool]')?.dataset.tool;
  if (tool) setTool(tool);
});

el.speed.addEventListener('input', syncSpeed);

el.algo.addEventListener('change', () => {
  syncAlgorithmControls();
  reset();
});

for (const input of [el.diagonals, el.heuristic]) {
  input.addEventListener('change', () => {
    syncAlgorithmControls(); // the admissibility warning depends on both
    reset();
  });
}

// Debounced so a drag-resize rebuilds the grid once, not once per frame.
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyResize, 180);
});

function applyResize() {
  const { rows, cols } = fitDimensions();
  if (rows === board.grid.rows && cols === board.grid.cols) return;

  reset();
  board.setGrid(resizeGrid(board.grid, rows, cols));
  weightsPainted = board.weightCount > 0;
  syncAlgorithmControls();
  setPhase('idle'); // refresh the status pill with the new dimensions
}

// Space picks the sensible action for the current phase; the rest just forward.
bindShortcuts({
  ' ': () => (phase === 'playing' || phase === 'paused' ? el.pause : el.visualize).click(),
  s: () => el.step.click(),
  r: () => el.clearPath.click(),
  c: () => el.clearAll.click(),
  m: () => el.generate.click(),
});

// ---- init ----

populateSelects();
setTool('wall');
syncAlgorithmControls();
syncSpeed();
stats.reset();
setPhase('idle');
