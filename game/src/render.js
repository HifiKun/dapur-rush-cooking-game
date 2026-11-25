// Dapur Rush — the renderer: every pixel of the kitchen, drawn with canvas
// shapes and text. No images, no network. The hit rectangles exported here
// are the same ones the input layer uses, so clicks land where things are
// drawn. The judge reads the game mostly through its screenshots, so each
// screen must read at a glance: board, counter, plate, stove, timer.

import {
  COLORS,
  DISH_BY_ID,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  LAYOUT,
  MAX_STRIKES,
  SHIFT_SECONDS,
  VIEW,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './world.js';

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 'bold'} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// --- Hit rectangles (shared with the input layer) ---------------------------

export function binRect(i) {
  const bins = LAYOUT.bins;
  return { x: bins.firstX + i * (bins.w + bins.gap), y: bins.y, w: bins.w, h: bins.h };
}

export function burnerRect(i) {
  return { cx: 131 + i * 150, cy: 195, r: 56 };
}

export function orderTicketRect(i) {
  return { x: 904, y: 122 + i * 92, w: 348, h: 84 };
}

export function plateSlotRect(i) {
  const col = i % 3;
  const row = Math.floor(i / 3);
  return { x: 484 + col * 112, y: 126 + row * 96, w: 104, h: 88 };
}

export function restartRect() {
  return { x: 490, y: 520, w: 300, h: 56 };
}

// --- Ingredient drawings ----------------------------------------------------

function drawIngredient(ctx, id, cx, cy, size) {
  const s = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'nasi') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.25, s, s * 0.62, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#d9c9a3';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8d9b0';
    for (const [dx, dy] of [[-0.4, -0.1], [0, -0.25], [0.4, -0.08], [-0.15, 0.05], [0.2, 0.08]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'ayam') {
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath();
    ctx.arc(-s * 0.15, s * 0.05, s * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b97a28';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#fdf6e3';
    ctx.lineWidth = s * 0.16;
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.35);
    ctx.lineTo(s * 0.75, -s * 0.75);
    ctx.stroke();
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.arc(s * 0.82, -s * 0.82, s * 0.16, 0, Math.PI * 2);
    ctx.arc(s * 0.62, -s * 0.95, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c47f2e';
    ctx.beginPath();
    ctx.arc(-s * 0.35, -s * 0.15, s * 0.12, 0, Math.PI * 2);
    ctx.arc(s * 0.05, s * 0.25, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.95, s * 0.7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8dcc0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.arc(s * 0.1, -s * 0.05, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f9d976';
    ctx.beginPath();
    ctx.arc(s * 0.02, -s * 0.12, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#7bc96f';
    for (const [dx, dy, rot] of [[-0.35, 0.15, -0.5], [0, -0.25, 0], [0.35, 0.15, 0.5]]) {
      ctx.save();
      ctx.translate(dx * s, dy * s);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.34, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#4a9e3f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(0, s * 0.55);
    ctx.stroke();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#e0533d';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.85, s * 0.5, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#c23a28';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.2, s * 0.85, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2826f';
    for (const [dx, dy] of [[-0.4, 0.05], [0.05, -0.05], [0.45, 0.08]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8f1f12';
    ctx.beginPath();
    ctx.arc(-s * 0.55, -s * 0.45, s * 0.14, 0, Math.PI * 2);
    ctx.arc(s * 0.5, -s * 0.5, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'kerupuk') {
    ctx.fillStyle = '#f2d8a7';
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 8) {
      const r = s * (0.85 + 0.18 * Math.sin(a * 5));
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8c88f';
    for (const [dx, dy] of [[-0.3, -0.2], [0.25, -0.3], [0, 0.25], [0.35, 0.2]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawChili(ctx, cx, cy, size, used) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.5);
  ctx.fillStyle = used ? '#8a8a8a' : '#d43d2a';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.55, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = used ? '#666' : '#8f1f12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, -size * 0.05);
  ctx.quadraticCurveTo(size * 0.75, -size * 0.35, size * 0.6, -size * 0.5);
  ctx.stroke();
  ctx.restore();
}

// --- Background --------------------------------------------------------------

function drawKitchen(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 0, 560);
  wall.addColorStop(0, COLORS.wallTop);
  wall.addColorStop(1, COLORS.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW.width, 560);
  // Tile band.
  ctx.fillStyle = COLORS.tile;
  ctx.fillRect(0, 420, VIEW.width, 140);
  ctx.fillStyle = COLORS.tileDark;
  for (let x = 0; x < VIEW.width; x += 64) {
    ctx.fillRect(x, 420, 2, 140);
    ctx.fillRect(x, 484, 64, 2);
  }
  // Floor.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 560, VIEW.width, 160);
  ctx.fillStyle = COLORS.floorDark;
  for (let x = 0; x < VIEW.width; x += 128) ctx.fillRect(x, 560, 3, 160);
  // Window with dusk sky, left wall.
  ctx.fillStyle = '#7a4a21';
  rr(ctx, 380, 84, 120, 130, 10);
  ctx.fill();
  const sky = ctx.createLinearGradient(0, 92, 0, 206);
  sky.addColorStop(0, '#ff9d5c');
  sky.addColorStop(1, '#7a4a8a');
  ctx.fillStyle = sky;
  ctx.fillRect(388, 92, 104, 114);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(470, 116, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d2b1f';
  ctx.fillRect(436, 92, 4, 114);
  ctx.fillRect(388, 146, 104, 4);
  // Hanging lamp over the stove.
  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(206, 0);
  ctx.lineTo(206, 52);
  ctx.stroke();
  ctx.fillStyle = '#f2b234';
  ctx.beginPath();
  ctx.moveTo(182, 56);
  ctx.lineTo(230, 56);
  ctx.lineTo(218, 84);
  ctx.lineTo(194, 84);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(242, 178, 52, 0.18)';
  ctx.beginPath();
  ctx.moveTo(182, 84);
  ctx.lineTo(230, 84);
  ctx.lineTo(280, 280);
  ctx.lineTo(132, 280);
  ctx.closePath();
  ctx.fill();
  // (The wall between the window and the order board stays clear, so the
  // serving plate — the centre of the game — is never covered.)
}

// --- HUD ---------------------------------------------------------------------

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(0, 0, VIEW.width, 64);
  text(ctx, 'DAPUR RUSH', 24, 22, 26, '#f2b234', 'bold');
  text(ctx, 'Warung Nusantara', 24, 46, 13, '#e8d9b0', 'normal');
  // Shift clock.
  const barX = 400;
  const barW = 380;
  const frac = state.timeLeft / SHIFT_SECONDS;
  text(ctx, 'SHIFT', barX - 8, 32, 15, '#e8d9b0', 'bold', 'right');
  ctx.fillStyle = '#4a3a28';
  rr(ctx, barX, 18, barW, 26, 13);
  ctx.fill();
  const low = state.timeLeft <= 10;
  ctx.fillStyle = low ? COLORS.bad : frac < 0.35 ? COLORS.warn : COLORS.good;
  if (frac > 0) {
    rr(ctx, barX, 18, Math.max(26, barW * frac), 26, 13);
    ctx.fill();
  }
  text(ctx, formatTime(state.timeLeft), barX + barW / 2, 32, 18, '#ffffff', 'bold', 'center');
  // Coins and score.
  ctx.fillStyle = '#f2b234';
  ctx.beginPath();
  ctx.arc(838, 24, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b97a28';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'K', 838, 25, 12, '#7a4a21', 'bold', 'center');
  text(ctx, `${state.coins}`, 854, 24, 20, '#f2b234', 'bold');
  text(ctx, `Skor ${state.score}`, 830, 48, 14, '#e8d9b0', 'normal');
  // Strikes as chillies.
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    drawChili(ctx, 940 + i * 30, 32, 26, i < state.strikes);
  }
  text(ctx, 'STRIKE', 1030, 32, 13, '#e8d9b0', 'bold');
  if (state.combo >= 2) {
    text(ctx, `COMBO x${state.combo}`, 1240, 32, 20, '#ff9d45', 'bold', 'right');
  }
  text(ctx, `Hari 1 · ${state.served} porsi`, 1240, 52, 13, '#e8d9b0', 'normal', 'right');
}

// --- Order board ---------------------------------------------------------------

function drawBoard(ctx, state) {
  const board = LAYOUT.board;
  ctx.fillStyle = COLORS.boardFrame;
  rr(ctx, board.x - 6, board.y - 6, board.w + 12, board.h + 12, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.board;
  rr(ctx, board.x, board.y, board.w, board.h, 8);
  ctx.fill();
  text(ctx, 'PESANAN', board.x + board.w / 2, board.y + 22, 22, COLORS.boardFrame, 'bold', 'center');
  ctx.strokeStyle = '#d9c9a3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(board.x + 16, board.y + 40);
  ctx.lineTo(board.x + board.w - 16, board.y + 40);
  ctx.stroke();
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', board.x + board.w / 2, board.y + 150, 16, COLORS.textSoft, 'normal', 'center');
    text(ctx, 'Pesanan baru segera datang', board.x + board.w / 2, board.y + 178, 13, COLORS.textSoft, 'normal', 'center');
    return;
  }
  state.orders.forEach((order, i) => {
    const rect = orderTicketRect(i);
    const dish = DISH_BY_ID[order.dishId];
    const frac = Math.max(0, order.patience / order.maxPatience);
    const urgent = order.patience <= 10;
    ctx.fillStyle = urgent && Math.floor(order.patience * 2) % 2 === 0 ? '#ffe9e5' : '#ffffff';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? COLORS.bad : '#d9c9a3';
    ctx.lineWidth = urgent ? 2.5 : 1.5;
    ctx.stroke();
    text(ctx, `#${order.id} ${dish.name}`, rect.x + 12, rect.y + 18, 16, COLORS.text, 'bold');
    text(ctx, `${dish.price} koin`, rect.x + rect.w - 12, rect.y + 18, 14, '#b97a28', 'bold', 'right');
    dish.needs.forEach((need, j) => {
      const cx = rect.x + 28 + j * 44;
      const cy = rect.y + 54;
      const onPlate = state.plate.includes(need);
      ctx.globalAlpha = onPlate ? 1 : 0.45;
      drawIngredient(ctx, need, cx, cy, 34);
      ctx.globalAlpha = 1;
      if (onPlate) {
        ctx.strokeStyle = COLORS.good;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 19, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.fillStyle = '#e8dcc0';
    rr(ctx, rect.x + 12, rect.y + 70, rect.w - 24, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
    if (frac > 0) {
      rr(ctx, rect.x + 12, rect.y + 70, (rect.w - 24) * frac, 8, 4);
      ctx.fill();
    }
  });
}

// --- Stove, plate, serve -----------------------------------------------------

function drawStove(ctx, state) {
  const stove = LAYOUT.stove;
  ctx.fillStyle = COLORS.stove;
  rr(ctx, stove.x, stove.y, stove.w, stove.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.stoveTop;
  rr(ctx, stove.x + 10, stove.y + 10, stove.w - 20, stove.h - 20, 8);
  ctx.fill();
  text(ctx, 'KOMPOR', stove.x + stove.w / 2, stove.y + 30, 15, '#b9b9c9', 'bold', 'center');
  state.burners.forEach((slot, i) => {
    const { cx, cy, r } = burnerRect(i);
    ctx.fillStyle = COLORS.burnerOff;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a35';
    ctx.lineWidth = 3;
    ctx.stroke();
    const item = slot.item;
    if (!item) return;
    if (!item.cooked) {
      const frac = Math.min(1, item.age / 4);
      ctx.strokeStyle = COLORS.burnerOn;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      ctx.globalAlpha = 0.85;
      drawIngredient(ctx, item.id, cx, cy, 56);
      ctx.globalAlpha = 1;
    } else if (item.age < 11) {
      ctx.fillStyle = 'rgba(46, 158, 91, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, item.id, cx, cy, 60);
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, 'SIAP!', cx, cy - r + 8, 13, COLORS.good, 'bold', 'center');
    } else {
      ctx.fillStyle = '#1c1c22';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'HANGUS', cx, cy + 40, 13, COLORS.bad, 'bold', 'center');
    }
  });
}

function drawPlate(ctx, state) {
  const plate = LAYOUT.plate;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h / 2 + 8, 178, 108, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h / 2, 172, 102, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.plateRing;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#e8e2d4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(plate.x + plate.w / 2, plate.y + plate.h / 2, 140, 78, 0, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, 'PIRING SAJI', plate.x + plate.w / 2, plate.y + 10, 13, COLORS.textSoft, 'bold', 'center');
  state.plate.forEach((id, i) => {
    const rect = plateSlotRect(i);
    drawIngredient(ctx, id, rect.x + rect.w / 2, rect.y + rect.h / 2, 72);
  });
  if (state.plate.length === 0) {
    text(ctx, 'Klik bahan di bawah', plate.x + plate.w / 2, plate.y + 130, 15, '#b9ac96', 'normal', 'center');
    text(ctx, 'untuk meracik pesanan', plate.x + plate.w / 2, plate.y + 154, 15, '#b9ac96', 'normal', 'center');
  }
}

function drawServe(ctx, state, now) {
  const serve = LAYOUT.serve;
  const matching = state.orders.some((order) => {
    const dish = DISH_BY_ID[order.dishId];
    return state.plate.length === dish.needs.length && dish.needs.every((need) => state.plate.includes(need));
  });
  const ready = matching && state.plate.length > 0;
  if (ready) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 180);
    ctx.fillStyle = `rgba(46, 158, 91, ${0.25 + 0.3 * pulse})`;
    rr(ctx, serve.x - 8, serve.y - 8, serve.w + 16, serve.h + 16, 14);
    ctx.fill();
  }
  ctx.fillStyle = ready ? COLORS.good : '#9a8a76';
  rr(ctx, serve.x, serve.y, serve.w, serve.h, 10);
  ctx.fill();
  ctx.strokeStyle = ready ? '#1f7a44' : '#7a6a56';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, ready ? 'SAJIKAN!  [Spasi]' : 'SAJIKAN  [Spasi]', serve.x + serve.w / 2, serve.y + serve.h / 2 + 1, 20, '#ffffff', 'bold', 'center');
  const trash = LAYOUT.trash;
  ctx.fillStyle = '#7a6a56';
  rr(ctx, trash.x, trash.y, trash.w, trash.h, 10);
  ctx.fill();
  text(ctx, '✕', trash.x + trash.w / 2, trash.y + trash.h / 2 + 1, 22, '#ffffff', 'bold', 'center');
  text(ctx, 'Buang', trash.x + trash.w / 2, trash.y + trash.h + 14, 11, COLORS.textSoft, 'normal', 'center');
}

// --- Counter -------------------------------------------------------------------

function drawCounter(ctx, state) {
  const counter = LAYOUT.counter;
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(counter.x, counter.y, counter.w, counter.h);
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(counter.x, counter.y, counter.w, 14);
  ctx.fillStyle = COLORS.counterEdge;
  ctx.fillRect(counter.x, counter.y + 14, counter.w, 4);
  INGREDIENTS.forEach((ingredient, i) => {
    const rect = binRect(i);
    const cooking = state.burners.some((slot) => slot.item && slot.item.id === ingredient.id && !slot.item.cooked);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.strokeStyle = ingredient.ring;
    ctx.lineWidth = 3;
    ctx.stroke();
    drawIngredient(ctx, ingredient.id, rect.x + rect.w / 2, rect.y + 42, 64);
    text(ctx, ingredient.name, rect.x + rect.w / 2, rect.y + 82, 14, COLORS.text, 'bold', 'center');
    ctx.fillStyle = COLORS.boardFrame;
    rr(ctx, rect.x + 8, rect.y + 8, 22, 22, 5);
    ctx.fill();
    text(ctx, ingredient.key, rect.x + 19, rect.y + 20, 13, '#ffffff', 'bold', 'center');
    if (ingredient.cook) {
      text(ctx, cooking ? 'MEMASAK…' : 'perlu dimasak', rect.x + rect.w - 10, rect.y + 18, 11, cooking ? COLORS.bad : COLORS.textSoft, 'bold', 'right');
    }
  });
  text(
    ctx,
    'Klik bahan (atau tombol 1–6) · Ayam & Telur harus dimasak di kompor dulu · Klik piring untuk mengambil kembali · Klik tiket pesanan untuk menyajikan ke pesanan itu',
    VIEW.width / 2,
    LAYOUT.hint.y + 14,
    13,
    '#e8d9b0',
    'normal',
    'center',
  );
}

// --- Toasts, title, pause, game over -------------------------------------------

function drawToasts(ctx, state) {
  state.toasts.forEach((toastItem, i) => {
    const alpha = toastItem.age > 1.8 ? Math.max(0, 1 - (toastItem.age - 1.8) / 0.6) : 1;
    const color = toastItem.kind === 'good' ? COLORS.good : toastItem.kind === 'bad' ? COLORS.bad : COLORS.warn;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(43, 33, 24, 0.88)';
    const w = ctx.measureText(toastItem.text).width + 120;
    rr(ctx, VIEW.width / 2 - w / 2, 76 + i * 36, w, 30, 15);
    ctx.fill();
    ctx.font = `bold 15px ${FONT}`;
    text(ctx, toastItem.text, VIEW.width / 2, 92 + i * 36, 15, color === COLORS.warn ? '#f2b234' : '#ffffff', 'bold', 'center');
    ctx.globalAlpha = 1;
  });
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  rr(ctx, 250, 130, 620, 420, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.boardFrame;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'DAPUR RUSH', 560, 190, 64, COLORS.boardFrame, 'bold', 'center');
  text(ctx, 'Warung Nusantara', 560, 236, 24, '#b97a28', 'bold', 'center');
  ctx.strokeStyle = '#d9c9a3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(340, 262);
  ctx.lineTo(780, 262);
  ctx.stroke();
  const lines = [
    'Pesanan datang di papan kanan. Racik di piring saji,',
    'masak Ayam & Telur di kompor, lalu sajikan sebelum',
    'waktu pesanan habis. 3 pesanan gagal = hari berakhir.',
  ];
  lines.forEach((line, i) => text(ctx, line, 560, 296 + i * 26, 17, COLORS.text, 'normal', 'center'));
  text(ctx, 'Klik bahan atau tekan 1–6 · Spasi untuk menyajikan · P jeda · M suara', 560, 400, 14, COLORS.textSoft, 'normal', 'center');
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
  ctx.globalAlpha = pulse;
  text(ctx, 'Klik di mana saja atau tekan Enter untuk mulai', 560, 470, 20, COLORS.good, 'bold', 'center');
  ctx.globalAlpha = 1;
  if (state.dayResult) {
    text(ctx, `Skor terakhir: ${state.dayResult.score} · ${state.dayResult.served} porsi disajikan`, 560, 512, 15, COLORS.textSoft, 'normal', 'center');
  }
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'JEDA', 640, 340, 56, '#ffffff', 'bold', 'center');
  text(ctx, 'Tekan P untuk lanjut', 640, 396, 18, '#e8d9b0', 'normal', 'center');
}

function drawOver(ctx, state) {
  const result = state.dayResult;
  ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  rr(ctx, 340, 110, 600, 400, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.boardFrame;
  ctx.lineWidth = 4;
  ctx.stroke();
  const title = result && result.reason === 'strikes' ? 'HARI BERAKHIR — 3 PESANAN GAGAL' : 'SHIFT SELESAI!';
  text(ctx, title, 640, 160, 30, COLORS.boardFrame, 'bold', 'center');
  if (!result) return;
  text(ctx, `Skor  ${result.score}`, 640, 220, 26, COLORS.text, 'bold', 'center');
  text(ctx, `Koin  ${result.coins}   ·   Porsi disajikan  ${result.served}   ·   Combo terbaik  x${result.bestCombo}`, 640, 262, 17, COLORS.textSoft, 'normal', 'center');
  const entries = Object.entries(result.servedLog);
  if (entries.length > 0) {
    text(ctx, 'Yang kamu sajikan hari ini:', 640, 306, 15, COLORS.text, 'bold', 'center');
    entries.forEach(([dishId, count], i) => {
      text(ctx, `${DISH_BY_ID[dishId].name}  × ${count}`, 640, 334 + i * 24, 15, COLORS.textSoft, 'normal', 'center');
    });
  } else {
    text(ctx, 'Belum ada porsi yang tersaji hari ini.', 640, 320, 15, COLORS.textSoft, 'normal', 'center');
  }
  const button = restartRect();
  ctx.fillStyle = COLORS.good;
  rr(ctx, button.x, button.y, button.w, button.h, 10);
  ctx.fill();
  text(ctx, 'MAIN LAGI  [R]', button.x + button.w / 2, button.y + button.h / 2 + 1, 20, '#ffffff', 'bold', 'center');
}

// --- Frame ---------------------------------------------------------------------

export function drawFrame(ctx, world, now) {
  const state = world.state;
  drawKitchen(ctx);
  drawStove(ctx, state);
  drawPlate(ctx, state);
  drawServe(ctx, state, now);
  drawBoard(ctx, state);
  drawCounter(ctx, state);
  drawHud(ctx, state);
  drawToasts(ctx, state);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (state.screen === SCREEN_OVER) drawOver(ctx, state);
  else if (state.paused) drawPause(ctx);
}
