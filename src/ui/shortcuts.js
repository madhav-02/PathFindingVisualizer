// Keyboard shortcuts. Each one forwards to the real button, so the keyboard
// and the mouse can never drift apart -- and a disabled button ignores both.

const EDITABLE = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']);

/**
 * @param {Record<string, () => void>} map lowercase key -> action (' ' for space)
 * @returns {() => void} unbind
 */
export function bindShortcuts(map, { target = window } = {}) {
  const handler = (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;

    // Let form controls keep their own key handling (arrows on the slider, etc).
    // Buttons are excluded only for space, which would otherwise double-fire.
    const tag = event.target?.tagName;
    if (event.target?.isContentEditable) return;
    if (EDITABLE.has(tag) && !(tag === 'BUTTON' && event.key !== ' ')) return;

    const action = map[event.key === ' ' ? ' ' : event.key.toLowerCase()];
    if (!action) return;

    event.preventDefault();
    action();
  };

  target.addEventListener('keydown', handler);
  return () => target.removeEventListener('keydown', handler);
}
