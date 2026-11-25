// Dapur Rush — screenshot scenes behind ?shot=start|mid|serve|end.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple chef autopilot (cook what the oldest
// order needs, take cooked food to the plate, serve when the plate matches),
// so every frame is what a short real game looks like, and the same seed
// always stages the same frame. Nothing here draws: the renderer draws the
// staged world exactly as it draws live play.

import { DISH_BY_ID, INGREDIENT_BY_ID } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const STEP = 1 / 60;

/** One chef decision: work toward the oldest order, one action at a time. */
function chef(world, serve) {
  const state = world.state;
  if (state.screen !== SCREEN_PLAY || state.paused) return;
  const target = state.orders[0];
  if (!target) return;
  const dish = DISH_BY_ID[target.dishId];

  // First, take any cooked ingredient the order needs off the burner.
  for (let i = 0; i < state.burners.length; i += 1) {
    const item = state.burners[i].item;
    if (item && item.cooked && dish.needs.includes(item.id) && !state.plate.includes(item.id)) {
      world.pressBurner(i);
      return;
    }
  }

  // Then, start whatever the plate is still missing.
  const missing = dish.needs.filter((need) => !state.plate.includes(need));
  for (const need of missing) {
    const ingredient = INGREDIENT_BY_ID[need];
    if (ingredient.cook) {
      const cooking = state.burners.some(
        (slot) => slot.item && slot.item.id === need && !slot.item.cooked,
      );
      if (cooking) return; // Wait for the burner.
      world.pressBin(need);
      return;
    }
    world.pressBin(need);
    return;
  }

  // The plate matches the order: serve it, unless this scene wants to hold
  // the finished plate for the camera.
  if (serve && world.matchingOrder()) world.serve(target.id);
}

function simulate(world, seconds, serve) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    chef(world, serve);
    world.step(STEP);
    if (world.state.screen !== SCREEN_PLAY) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: title over a kitchen with the first order already on the board.
 * mid: a dish mid-assembly — two items on the plate, one burner cooking.
 * serve: a finished plate matching the oldest order, Serve glowing.
 * end: the day summary after a full shift of real play.
 */
export function stageShot(name, world) {
  world.start();
  const state = world.state;
  if (name === 'mid') {
    // Warm up with real play, then wait until the board holds an order —
    // the chef serves fast, so one order is the honest busy state.
    simulate(world, 15, true);
    for (let t = 0; t < 15 && state.orders.length === 0; t += STEP) {
      chef(world, true);
      world.step(STEP);
      if (world.state.screen !== SCREEN_PLAY) break;
    }
    // Stage the mid-assembly by hand, through the real actions, and then
    // stop acting: two ready ingredients on the plate, one ingredient on
    // the burner, left to cook for two seconds so the burner ring reads
    // half done. No serving happens during the staging.
    if (state.orders.length > 0) {
      const dish = DISH_BY_ID[state.orders[0].dishId];
      const ready = dish.needs.filter((need) => !INGREDIENT_BY_ID[need].cook);
      const toCook = dish.needs.filter((need) => INGREDIENT_BY_ID[need].cook);
      world.clearPlate();
      for (const need of ready.slice(0, 2)) world.pressBin(need);
      const freeBurner = state.burners.some((slot) => slot.item === null);
      if (toCook.length > 0 && freeBurner) world.pressBin(toCook[0]);
      for (let i = 0; i < 2 / STEP; i += 1) world.step(STEP);
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'serve') {
    // Play until a plate is finished, then hold it for the camera.
    for (let t = 0; t < 120; t += STEP) {
      chef(world, false);
      world.step(STEP);
      if (world.state.screen !== SCREEN_PLAY) break;
      if (world.matchingOrder()) break;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    simulate(world, 400, true);
    return { screen: world.state.screen === SCREEN_OVER ? SCREEN_OVER : SCREEN_PLAY };
  }
  // start (and any unknown name): a few seconds in, title over the kitchen.
  simulate(world, 8, true);
  state.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
