// Dapur Rush — the game world: orders, burners, plate, score, strikes.
// Pure logic: no canvas, no DOM, no audio here. The renderer draws this state,
// the input layer calls its actions, and the screenshot scenes drive it with
// the same actions a player would use, so every staged frame is real play.

import {
  BURNERS,
  BURN_AFTER_SECONDS,
  COMBO_WINDOW_SECONDS,
  COOK_SECONDS,
  DISHES,
  DISH_BY_ID,
  INGREDIENT_BY_ID,
  MAX_ORDERS,
  MAX_STRIKES,
  ORDER_FIRST_AFTER,
  ORDER_SPAWN_EVERY,
  PATIENCE_BONUS_MAX,
  PATIENCE_SECONDS,
  PLATE_SLOTS,
  SHIFT_SECONDS,
} from './config.js';
import { makeRng } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  return a.every((item) => {
    const at = rest.indexOf(item);
    if (at === -1) return false;
    rest.splice(at, 1);
    return true;
  });
}

export function createWorld(seed) {
  const rng = makeRng(seed);
  const state = {
    screen: SCREEN_TITLE,
    paused: false,
    seed,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    orders: [],
    orderSeq: 0,
    nextOrderIn: ORDER_FIRST_AFTER,
    burners: Array.from({ length: BURNERS }, () => ({ item: null })),
    plate: [],
    score: 0,
    coins: 0,
    served: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    comboLeft: 0,
    servedLog: {},
    toasts: [],
    dayResult: null,
  };

  function toast(text, kind) {
    state.toasts.push({ text, kind: kind || 'info', age: 0 });
    if (state.toasts.length > 4) state.toasts.shift();
  }

  function spawnOrder(events) {
    if (state.orders.length >= MAX_ORDERS) return;
    const dish = rng.pick(DISHES);
    state.orderSeq += 1;
    state.orders.push({
      id: state.orderSeq,
      dishId: dish.id,
      patience: PATIENCE_SECONDS,
      maxPatience: PATIENCE_SECONDS,
    });
    events.push({ type: 'order' });
  }

  function endDay(reason, events) {
    state.screen = SCREEN_OVER;
    state.dayResult = {
      reason,
      score: state.score,
      coins: state.coins,
      served: state.served,
      bestCombo: state.bestCombo,
      servedLog: { ...state.servedLog },
    };
    events.push({ type: 'day-over', reason });
  }

  const world = {
    state,
    rng,

    start() {
      state.screen = SCREEN_PLAY;
      state.paused = false;
      state.timeLeft = SHIFT_SECONDS;
      state.elapsed = 0;
      state.orders = [];
      state.orderSeq = 0;
      state.nextOrderIn = ORDER_FIRST_AFTER;
      state.burners = Array.from({ length: BURNERS }, () => ({ item: null }));
      state.plate = [];
      state.score = 0;
      state.coins = 0;
      state.served = 0;
      state.strikes = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.comboLeft = 0;
      state.servedLog = {};
      state.toasts = [];
      state.dayResult = null;
      return [{ type: 'start' }];
    },

    togglePause() {
      if (state.screen !== SCREEN_PLAY) return [];
      state.paused = !state.paused;
      return [{ type: state.paused ? 'pause' : 'resume' }];
    },

    // One fixed step of the simulation. Returns the events of this step so
    // the shell can play sounds and the renderer can flash feedback.
    step(dt) {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      state.elapsed += dt;
      state.timeLeft = Math.max(0, state.timeLeft - dt);
      if (state.comboLeft > 0) {
        state.comboLeft -= dt;
        if (state.comboLeft <= 0) state.combo = 0;
      }
      for (const toastItem of state.toasts) toastItem.age += dt;
      state.toasts = state.toasts.filter((item) => item.age < 2.4);

      // Cooking: raw items progress, cooked items wait, then they burn.
      for (let i = 0; i < state.burners.length; i += 1) {
        const slot = state.burners[i];
        if (!slot.item) continue;
        slot.item.age += dt;
        if (!slot.item.cooked && slot.item.age >= COOK_SECONDS) {
          slot.item.cooked = true;
          events.push({ type: 'cooked', burner: i });
        } else if (slot.item.cooked && slot.item.age >= COOK_SECONDS + BURN_AFTER_SECONDS) {
          const name = INGREDIENT_BY_ID[slot.item.id].name;
          slot.item = null;
          toast(`${name} hangus!`, 'bad');
          events.push({ type: 'burnt', burner: i });
        }
      }

      // Orders: patience drains; an expired order costs a strike.
      for (const order of [...state.orders]) {
        order.patience -= dt;
        if (order.patience <= 0) {
          state.orders = state.orders.filter((item) => item !== order);
          state.strikes += 1;
          state.combo = 0;
          state.comboLeft = 0;
          toast(`Pesanan #${order.id} kedaluwarsa!`, 'bad');
          events.push({ type: 'expired', orderId: order.id });
          if (state.strikes >= MAX_STRIKES) {
            endDay('strikes', events);
            return events;
          }
        }
      }

      // New orders arrive on a timer, up to the board's capacity.
      state.nextOrderIn -= dt;
      if (state.nextOrderIn <= 0) {
        spawnOrder(events);
        state.nextOrderIn = ORDER_SPAWN_EVERY;
      }

      // The shift ends when the clock runs out.
      if (state.timeLeft <= 0) {
        endDay('time', events);
        return events;
      }
      const whole = Math.ceil(state.timeLeft);
      if (whole !== Math.ceil(state.timeLeft + dt) && whole <= 5 && whole > 0) {
        events.push({ type: 'tick' });
      }
      return events;
    },

    pressBin(ingredientId) {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      const ingredient = INGREDIENT_BY_ID[ingredientId];
      if (!ingredient) return events;
      if (ingredient.cook) {
        const free = state.burners.findIndex((slot) => slot.item === null);
        if (free === -1) {
          toast('Kompor penuh!', 'warn');
          events.push({ type: 'error', reason: 'burners-full' });
          return events;
        }
        state.burners[free].item = { id: ingredientId, age: 0, cooked: false };
        events.push({ type: 'cook-start', burner: free });
        return events;
      }
      if (state.plate.length >= PLATE_SLOTS) {
        toast('Piring penuh!', 'warn');
        events.push({ type: 'error', reason: 'plate-full' });
        return events;
      }
      state.plate.push(ingredientId);
      events.push({ type: 'add', ingredient: ingredientId });
      return events;
    },

    pressBurner(index) {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      const slot = state.burners[index];
      if (!slot || !slot.item) return events;
      if (!slot.item.cooked) {
        toast('Belum matang!', 'warn');
        events.push({ type: 'error', reason: 'not-cooked' });
        return events;
      }
      if (state.plate.length >= PLATE_SLOTS) {
        toast('Piring penuh!', 'warn');
        events.push({ type: 'error', reason: 'plate-full' });
        return events;
      }
      const id = slot.item.id;
      slot.item = null;
      state.plate.push(id);
      events.push({ type: 'add', ingredient: id });
      return events;
    },

    removePlate(index) {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      if (index < 0 || index >= state.plate.length) return events;
      state.plate.splice(index, 1);
      events.push({ type: 'remove' });
      return events;
    },

    clearPlate() {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      if (state.plate.length === 0) return events;
      state.plate = [];
      events.push({ type: 'remove' });
      return events;
    },

    // Serve the plate to one order (its ticket), or to the oldest order when
    // no ticket is named. An exact match pays; anything else is refused with
    // a buzz and the plate stays, so a misclick never ruins a dish.
    serve(orderId) {
      const events = [];
      if (state.screen !== SCREEN_PLAY || state.paused) return events;
      const order = orderId == null
        ? state.orders[0]
        : state.orders.find((item) => item.id === orderId);
      if (!order) {
        events.push({ type: 'error', reason: 'no-order' });
        return events;
      }
      const dish = DISH_BY_ID[order.dishId];
      if (!sameSet(state.plate, dish.needs)) {
        toast(`Belum cocok: ${dish.name}`, 'warn');
        state.combo = 0;
        state.comboLeft = 0;
        events.push({ type: 'serve-bad', orderId: order.id });
        return events;
      }
      state.orders = state.orders.filter((item) => item !== order);
      state.plate = [];
      const patienceBonus = Math.round((order.patience / order.maxPatience) * PATIENCE_BONUS_MAX);
      const comboBonus = state.combo * 2;
      const earned = dish.price + patienceBonus + comboBonus;
      state.coins += earned;
      state.score += earned;
      state.served += 1;
      state.servedLog[dish.id] = (state.servedLog[dish.id] || 0) + 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.comboLeft = COMBO_WINDOW_SECONDS;
      toast(`+${earned} koin · ${dish.name}`, 'good');
      events.push({ type: 'serve-ok', orderId: order.id, earned, combo: state.combo });
      return events;
    },

    // The oldest order whose dish the plate already matches, if any.
    matchingOrder() {
      return state.orders.find((order) => sameSet(state.plate, DISH_BY_ID[order.dishId].needs)) || null;
    },
  };

  return world;
}
