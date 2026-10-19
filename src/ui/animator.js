// Replays a flat list of steps against a callback, one requestAnimationFrame
// at a time. It knows nothing about pathfinding -- the caller decides what a
// step means, which is also how maze generation reuses it later.
//
// Pace comes from a per-frame budget rather than a step count, so each step can
// declare a cost. Path steps cost more than visit steps, which makes the final
// route draw itself at a readable speed even when the search itself blurs past.

const COST = { visit: 1, path: 5 };
const stepCost = (step) => COST[step.kind] ?? 1;

export class Animator {
  #steps = [];
  #i = 0;
  #raf = null;
  #budget = 0;
  #perFrame = 8;
  #onStep;
  #onDone;
  #onFrame;

  constructor({ onStep, onDone, onFrame }) {
    this.#onStep = onStep;
    this.#onDone = onDone ?? (() => {});
    // Fires once per frame rather than once per step, so readouts can track a
    // fast animation without a DOM write per cell.
    this.#onFrame = onFrame ?? (() => {});
  }

  /** Slider position 1..100 -> steps per frame, exponential so the slow end is usable. */
  setSpeed(slider) {
    this.#perFrame = 0.3 * 2 ** ((slider - 1) / 11);
  }

  load(steps) {
    this.cancel();
    this.#steps = steps;
    this.#i = 0;
    this.#budget = 0;
  }

  get playing() {
    return this.#raf !== null;
  }

  get loaded() {
    return this.#steps.length > 0;
  }

  get done() {
    return this.#i >= this.#steps.length;
  }

  get progress() {
    return { done: this.#i, total: this.#steps.length };
  }

  play() {
    if (this.playing) return;
    if (this.done) {
      this.#onDone();
      return;
    }
    this.#raf = requestAnimationFrame(this.#tick);
  }

  pause() {
    if (this.#raf === null) return;
    cancelAnimationFrame(this.#raf);
    this.#raf = null;
  }

  /** Apply exactly one step, ignoring the frame budget. */
  stepOnce() {
    this.pause();
    if (this.done) return false;
    this.#apply();
    this.#onFrame();
    if (this.done) this.#onDone();
    return true;
  }

  /** Apply everything left with no animation (used for instant re-runs). */
  runRemaining() {
    this.pause();
    while (!this.done) this.#apply();
    this.#onFrame();
    this.#onDone();
  }

  cancel() {
    this.pause();
    this.#steps = [];
    this.#i = 0;
    this.#budget = 0;
  }

  #apply() {
    this.#onStep(this.#steps[this.#i]);
    this.#i++;
  }

  #tick = () => {
    this.#raf = null;
    this.#budget += this.#perFrame;

    // Spend the frame's budget. A step whose cost exceeds the remaining budget
    // waits for the next frame, which is what makes sub-1-per-frame speeds work.
    while (!this.done) {
      const cost = stepCost(this.#steps[this.#i]);
      if (this.#budget < cost) break;
      this.#budget -= cost;
      this.#apply();
    }

    this.#onFrame();

    if (this.done) {
      this.#budget = 0;
      this.#onDone();
      return;
    }
    this.#raf = requestAnimationFrame(this.#tick);
  };
}
