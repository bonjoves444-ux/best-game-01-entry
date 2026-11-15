// Mothlight — keyboard and mouse input in one place.
// The moth answers to the mouse (it steers toward the pointer) or to
// WASD / arrow keys, whichever the player is using right now. Space or
// a click dashes. Number keys pick a blessing. P pauses, M mutes,
// R restarts, Enter starts.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    mouseActive: false,
    dashQueued: false,
    pressed: new Set(),
  };

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 1280,
      y: ((clientY - rect.top) / rect.height) * 720,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    state.pressed.add(event.code);
    if (event.code === 'Space') {
      state.dashQueued = true;
      event.preventDefault();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event.clientX, event.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
    state.mouseActive = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPoint(event.clientX, event.clientY);
    state.mouseX = p.x;
    state.mouseY = p.y;
    state.mouseActive = true;
    state.mouseDown = true;
    state.dashQueued = true;
  });
  window.addEventListener('mouseup', () => {
    state.mouseDown = false;
  });

  return {
    state,
    // True while any movement key is held, and the held direction.
    keysHeld() {
      const left = keys.has('KeyA') || keys.has('ArrowLeft');
      const right = keys.has('KeyD') || keys.has('ArrowRight');
      const up = keys.has('KeyW') || keys.has('ArrowUp');
      const down = keys.has('KeyS') || keys.has('ArrowDown');
      return {
        active: left || right || up || down,
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0),
      };
    },
    // One-shot key presses since the last frame; the game loop drains it.
    takePressed() {
      const out = state.pressed;
      state.pressed = new Set();
      return out;
    },
    takeDash() {
      const queued = state.dashQueued;
      state.dashQueued = false;
      return queued;
    },
  };
}
