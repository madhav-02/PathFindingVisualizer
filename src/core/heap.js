// Binary min-heap over node indices. Insertion order breaks priority ties, so
// runs are deterministic and the animation expands cells in a tidy order.

export class MinHeap {
  #items = [];
  #prio = [];
  #seq = [];
  #size = 0;
  #counter = 0;

  get size() {
    return this.#size;
  }

  push(item, priority) {
    const i = this.#size++;
    this.#items[i] = item;
    this.#prio[i] = priority;
    this.#seq[i] = this.#counter++;
    this.#siftUp(i);
  }

  /** Returns -1 when empty (node indices are always >= 0). */
  pop() {
    if (this.#size === 0) return -1;
    const top = this.#items[0];
    this.#size--;
    if (this.#size > 0) {
      this.#items[0] = this.#items[this.#size];
      this.#prio[0] = this.#prio[this.#size];
      this.#seq[0] = this.#seq[this.#size];
      this.#siftDown(0);
    }
    return top;
  }

  #less(a, b) {
    if (this.#prio[a] !== this.#prio[b]) return this.#prio[a] < this.#prio[b];
    return this.#seq[a] < this.#seq[b];
  }

  #swap(a, b) {
    [this.#items[a], this.#items[b]] = [this.#items[b], this.#items[a]];
    [this.#prio[a], this.#prio[b]] = [this.#prio[b], this.#prio[a]];
    [this.#seq[a], this.#seq[b]] = [this.#seq[b], this.#seq[a]];
  }

  #siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.#less(i, parent)) break;
      this.#swap(i, parent);
      i = parent;
    }
  }

  #siftDown(i) {
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let best = i;
      if (l < this.#size && this.#less(l, best)) best = l;
      if (r < this.#size && this.#less(r, best)) best = r;
      if (best === i) break;
      this.#swap(i, best);
      i = best;
    }
  }
}
