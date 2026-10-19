// Owns the grid DOM and all pointer interaction. Everything else talks to the
// board through this class rather than touching cell elements directly.
//
// Note: repaintCell() rebuilds a cell's class list from the model, which drops
// any visited/path marks on it. That is intentional -- editing a cell
// invalidates the previous search, and callers that re-run clear the visuals
// and re-mark anyway.

import { rowOf, colOf, HEAVY } from '../core/grid.js';

const TRAVERSAL_CLASSES = ['visited', 'visited-b', 'path'];

export class Board {
  /**
   * @param {HTMLElement} gridEl container for the cells
   * @param {object} grid grid model from makeGrid()
   * @param {{onEdit?: (reason: 'paint'|'endpoint') => void}} handlers
   */
  constructor(gridEl, grid, { onEdit } = {}) {
    this.gridEl = gridEl;
    this.grid = grid;
    this.onEdit = onEdit ?? (() => {});
    this.cells = [];
    this.tool = 'wall';
    this.interactive = true;
    this.hasVisuals = false; // lets callers skip a full-grid clear when idle

    // drag state
    this.drag = null; // 'start' | 'end' | 'paint'
    this.paintValue = null; // what the current paint drag writes
    this.lastIndex = -1;
  }

  mount() {
    this.#build();
    this.gridEl.addEventListener('pointerdown', this.#onPointerDown);
    window.addEventListener('pointermove', this.#onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.#onPointerUp);
    window.addEventListener('pointercancel', this.#onPointerUp);
  }

  destroy() {
    this.gridEl.removeEventListener('pointerdown', this.#onPointerDown);
    window.removeEventListener('pointermove', this.#onPointerMove);
    window.removeEventListener('pointerup', this.#onPointerUp);
    window.removeEventListener('pointercancel', this.#onPointerUp);
  }

  setTool(tool) {
    this.tool = tool;
  }

  setInteractive(on) {
    this.interactive = on;
    this.gridEl.style.cursor = on ? '' : 'default';
    if (!on) this.drag = null;
  }

  /** Disable keyframes for instant full-grid renders. */
  setAnimated(on) {
    this.gridEl.classList.toggle('no-anim', !on);
  }

  /** Swap in a new grid model (resize) and rebuild the DOM. */
  setGrid(grid) {
    this.grid = grid;
    this.#build();
  }

  // ---- rendering ----

  #build() {
    const { grid } = this;
    this.gridEl.style.setProperty('--cols', grid.cols);
    this.cells = new Array(grid.n);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < grid.n; i++) {
      const cell = document.createElement('div');
      cell.dataset.i = i;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `row ${rowOf(grid, i) + 1}, column ${colOf(grid, i) + 1}`);
      this.cells[i] = cell;
      frag.append(cell);
    }
    this.gridEl.replaceChildren(frag);

    for (let i = 0; i < grid.n; i++) this.repaintCell(i);
  }

  repaintCell(i) {
    const { grid } = this;
    let cls = 'pf-cell';
    if (grid.wall[i]) cls += ' wall';
    else if (grid.weight[i] > 1) cls += ' weight';
    if (i === grid.start) cls += ' start';
    else if (i === grid.end) cls += ' end';
    this.cells[i].className = cls;
  }

  repaintAll() {
    for (let i = 0; i < this.grid.n; i++) this.repaintCell(i);
  }

  markVisited(i, side = 0) {
    this.hasVisuals = true;
    if (i === this.grid.start || i === this.grid.end) return;
    this.cells[i].classList.add(side === 1 ? 'visited-b' : 'visited');
  }

  markPath(i) {
    this.hasVisuals = true;
    if (i === this.grid.start || i === this.grid.end) return;
    this.cells[i].classList.add('path');
  }

  clearVisuals() {
    if (!this.hasVisuals) return;
    for (const cell of this.cells) cell.classList.remove(...TRAVERSAL_CLASSES);
    this.hasVisuals = false;
  }

  // ---- model edits ----

  /** Reset terrain but leave the endpoints where they are. */
  clearTerrain() {
    this.grid.wall.fill(0);
    this.grid.weight.fill(1);
    this.clearVisuals();
    this.repaintAll();
  }

  #applyPaint(i, value) {
    const { grid } = this;
    if (i === grid.start || i === grid.end) return false;

    const wasWall = grid.wall[i];
    const wasWeight = grid.weight[i];

    if (value === 'wall') {
      grid.wall[i] = 1;
      grid.weight[i] = 1;
    } else if (value === 'weight') {
      grid.wall[i] = 0;
      grid.weight[i] = HEAVY;
    } else {
      grid.wall[i] = 0;
      grid.weight[i] = 1;
    }

    if (grid.wall[i] === wasWall && grid.weight[i] === wasWeight) return false;
    this.repaintCell(i);
    return true;
  }

  #moveEndpoint(which, i) {
    const { grid } = this;
    const other = which === 'start' ? grid.end : grid.start;
    if (i === other) return false;

    const previous = grid[which];
    if (previous === i) return false;

    grid.wall[i] = 0; // an endpoint never sits inside a wall
    grid[which] = i;
    this.repaintCell(previous);
    this.repaintCell(i);
    return true;
  }

  // ---- pointer handling ----
  // Declared as arrow-function fields so they are auto-bound and keep a stable
  // identity for removeEventListener.

  /** elementFromPoint covers mouse and touch with one code path. */
  #indexFromPoint(x, y) {
    const cell = document.elementFromPoint(x, y)?.closest?.('.pf-cell');
    if (!cell || !this.gridEl.contains(cell)) return -1;
    return Number(cell.dataset.i);
  }

  /** Dragging from an existing wall erases, so one tool both draws and clears. */
  #resolvePaintValue(i) {
    const { grid, tool } = this;
    if (tool === 'erase') return 'erase';
    if (tool === 'wall') return grid.wall[i] ? 'erase' : 'wall';
    return grid.weight[i] > 1 ? 'erase' : 'weight';
  }

  #onPointerDown = (event) => {
    if (!this.interactive || event.button !== 0) return;
    const i = this.#indexFromPoint(event.clientX, event.clientY);
    if (i < 0) return;

    event.preventDefault();
    this.lastIndex = i;

    if (i === this.grid.start) {
      this.drag = 'start';
    } else if (i === this.grid.end) {
      this.drag = 'end';
    } else {
      this.drag = 'paint';
      this.paintValue = this.#resolvePaintValue(i);
      if (this.#applyPaint(i, this.paintValue)) this.onEdit('paint');
    }
  };

  #onPointerMove = (event) => {
    if (!this.drag) return;
    const i = this.#indexFromPoint(event.clientX, event.clientY);
    if (i < 0 || i === this.lastIndex) return;
    this.lastIndex = i;
    event.preventDefault();

    if (this.drag === 'paint') {
      if (this.#applyPaint(i, this.paintValue)) this.onEdit('paint');
    } else if (this.#moveEndpoint(this.drag, i)) {
      this.onEdit('endpoint');
    }
  };

  #onPointerUp = () => {
    this.drag = null;
    this.paintValue = null;
    this.lastIndex = -1;
  };
}
