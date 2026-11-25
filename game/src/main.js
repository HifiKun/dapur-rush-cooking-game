// Dapur Rush — shell: boot the canvas, run the loop, wire events to sounds.
// With ?shot=start|mid|serve|end the scene is staged synchronously from a
// fixed seed and drawn once, so a headless browser captures exactly that
// frame; without it, the game plays live.

import { VIEW } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawFrame } from './render.js';
import { stageShot } from './shots.js';
import { createWorld } from './world.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const world = createWorld(seed);
const audio = createAudio();

function handleEvents(events) {
  let cooking = false;
  for (const event of events) {
    if (event.type === 'add') audio.add();
    else if (event.type === 'cook-start') audio.click();
    else if (event.type === 'cooked') audio.ding();
    else if (event.type === 'serve-ok') audio.coin();
    else if (event.type === 'serve-bad' || event.type === 'error') audio.error();
    else if (event.type === 'burnt') audio.burn();
    else if (event.type === 'expired') audio.error();
    else if (event.type === 'tick') audio.tick();
    else if (event.type === 'start') audio.click();
  }
  cooking = world.state.burners.some((slot) => slot.item && !slot.item.cooked);
  if (cooking) audio.sizzleStart();
  else audio.stopSizzle();
}

const input = createInput(canvas, world, (events) => {
  audio.unlock();
  handleEvents(events);
});

document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') {
    const muted = audio.toggleMute();
    document.getElementById('mute').textContent = muted ? 'Suara: mati (M)' : 'Suara: hidup (M)';
  }
});

if (shot) {
  // Staged frame: play the real rules forward, draw once, stop. The
  // screenshot is a render of the game's own code in a real browser.
  const staged = stageShot(shot, world);
  drawFrame(ctx, world, 0);
  document.title = `Dapur Rush — shot ${shot}`;
  window.__dapurShot = staged.screen;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    handleEvents(world.step(dt));
    drawFrame(ctx, world, now);
    requestAnimationFrame(frame);
  }
  drawFrame(ctx, world, 0);
  requestAnimationFrame(frame);
}

// Keep the references alive for debugging from the console.
window.__dapur = { world, input, audio };
