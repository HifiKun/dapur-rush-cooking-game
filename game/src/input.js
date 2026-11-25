// Dapur Rush — input: mouse clicks and keyboard, mapped onto the same
// rectangles the renderer draws, so a click always lands where the eye sees
// the thing. Every action goes through the world, and the events it returns
// are handed to the shell (for sounds and flashes).

import { INGREDIENTS, LAYOUT } from './config.js';
import { binRect, burnerRect, orderTicketRect, plateSlotRect, restartRect } from './render.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

function inside(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

export function createInput(canvas, world, onEvents) {
  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function clickAt(x, y) {
    const state = world.state;
    if (state.screen === SCREEN_TITLE) {
      onEvents(world.start());
      return;
    }
    if (state.screen === SCREEN_OVER) {
      if (inside(x, y, restartRect())) onEvents(world.start());
      return;
    }
    if (state.screen !== SCREEN_PLAY) return;

    // Order tickets: serve the plate to the ticket clicked.
    for (let i = 0; i < state.orders.length; i += 1) {
      if (inside(x, y, orderTicketRect(i))) {
        onEvents(world.serve(state.orders[i].id));
        return;
      }
    }
    // Burners: take a cooked item onto the plate.
    for (let i = 0; i < state.burners.length; i += 1) {
      const circle = burnerRect(i);
      if (insideCircle(x, y, circle.cx, circle.cy, circle.r)) {
        onEvents(world.pressBurner(i));
        return;
      }
    }
    // Plate: click an item to take it back off.
    for (let i = 0; i < state.plate.length; i += 1) {
      if (inside(x, y, plateSlotRect(i))) {
        onEvents(world.removePlate(i));
        return;
      }
    }
    // Serve button and trash button.
    if (inside(x, y, LAYOUT.serve)) {
      onEvents(world.serve(null));
      return;
    }
    if (inside(x, y, LAYOUT.trash)) {
      onEvents(world.clearPlate());
      return;
    }
    // Ingredient bins along the counter.
    for (let i = 0; i < INGREDIENTS.length; i += 1) {
      if (inside(x, y, binRect(i))) {
        onEvents(world.pressBin(INGREDIENTS[i].id));
        return;
      }
    }
  }

  function keyDown(event) {
    const state = world.state;
    const key = event.key.toLowerCase();
    if (state.screen === SCREEN_TITLE && (key === 'enter' || key === ' ')) {
      event.preventDefault();
      onEvents(world.start());
      return;
    }
    if (state.screen === SCREEN_OVER && (key === 'enter' || key === 'r' || key === ' ')) {
      event.preventDefault();
      onEvents(world.start());
      return;
    }
    if (state.screen !== SCREEN_PLAY) return;
    if (key === 'p' || key === 'escape') {
      onEvents(world.togglePause());
      return;
    }
    if (state.paused) return;
    if (key === ' ') {
      event.preventDefault();
      onEvents(world.serve(null));
      return;
    }
    if (key === 'backspace' || key === 'delete') {
      onEvents(world.clearPlate());
      return;
    }
    const bin = INGREDIENTS.find((item) => item.key === key);
    if (bin) onEvents(world.pressBin(bin.id));
  }

  function hover(event) {
    const { x, y } = canvasPoint(event);
    const state = world.state;
    let pointer = false;
    if (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER) {
      pointer = true;
    } else if (state.screen === SCREEN_PLAY) {
      pointer =
        state.orders.some((_, i) => inside(x, y, orderTicketRect(i))) ||
        state.burners.some((_, i) => {
          const c = burnerRect(i);
          return insideCircle(x, y, c.cx, c.cy, c.r);
        }) ||
        state.plate.some((_, i) => inside(x, y, plateSlotRect(i))) ||
        inside(x, y, LAYOUT.serve) ||
        inside(x, y, LAYOUT.trash) ||
        INGREDIENTS.some((_, i) => inside(x, y, binRect(i)));
    }
    canvas.style.cursor = pointer ? 'pointer' : 'default';
  }

  function onMouseDown(event) {
    const { x, y } = canvasPoint(event);
    clickAt(x, y);
  }

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', hover);
  window.addEventListener('keydown', keyDown);

  return {
    detach() {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', hover);
      window.removeEventListener('keydown', keyDown);
    },
    // Exposed for the screenshot scenes, which drive the same clicks.
    clickAt,
    keyDown,
  };
}
