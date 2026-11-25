// Dapur Rush — configuration: canvas size, timings, menu, dishes, palette.
// Everything the world and the renderer agree on lives here, so tuning the game
// means editing this file, not hunting numbers through the logic.

export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 150;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 3;
export const ORDER_SPAWN_EVERY = 11;
export const ORDER_FIRST_AFTER = 4;
export const PATIENCE_SECONDS = 48;
export const COOK_SECONDS = 4;
export const BURN_AFTER_SECONDS = 7;
export const BURNERS = 2;
export const PLATE_SLOTS = 6;

// Coins and score: a served dish pays its price, plus a patience bonus for
// serving early, plus a combo bonus for serving dishes back to back.
export const COMBO_WINDOW_SECONDS = 12;
export const PATIENCE_BONUS_MAX = 15;

// Ingredients. `cook` means the ingredient must spend time on a burner before
// it can go on the plate; the rest go straight from the counter to the plate.
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', short: 'NASI', key: '1', cook: false, color: '#fdf6e3', ring: '#d9c9a3' },
  { id: 'ayam', name: 'Ayam Goreng', short: 'AYAM', key: '2', cook: true, color: '#e8a34c', ring: '#b97a28' },
  { id: 'telur', name: 'Telur Dadar', short: 'TELUR', key: '3', cook: true, color: '#f7d774', ring: '#d9a92f' },
  { id: 'sayur', name: 'Sayur', short: 'SAYUR', key: '4', cook: false, color: '#7bc96f', ring: '#4a9e3f' },
  { id: 'sambal', name: 'Sambal', short: 'SAMBAL', key: '5', cook: false, color: '#e0533d', ring: '#a92c1c' },
  { id: 'kerupuk', name: 'Kerupuk', short: 'KRUPUK', key: '6', cook: false, color: '#f2d8a7', ring: '#c9a86a' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

// The menu: every dish is a set of ingredients, in any order on the plate.
export const DISHES = [
  { id: 'nasi-ayam', name: 'Nasi Ayam Geprek', needs: ['nasi', 'ayam', 'sambal'], price: 18 },
  { id: 'nasi-telur', name: 'Nasi Telur Sayur', needs: ['nasi', 'telur', 'sayur'], price: 15 },
  { id: 'nasi-goreng', name: 'Nasi Goreng Spesial', needs: ['nasi', 'telur', 'sambal', 'kerupuk'], price: 22 },
  { id: 'paket-komplit', name: 'Paket Komplit', needs: ['nasi', 'ayam', 'sayur', 'sambal', 'kerupuk'], price: 28 },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]));

// Palette: a warm warung at dusk — terracotta walls, teal tiles, wooden counter.
export const COLORS = {
  wallTop: '#f7e8d0',
  wallBottom: '#eecfa8',
  tile: '#2e7f7a',
  tileDark: '#256b67',
  floor: '#b98a5a',
  floorDark: '#a1764a',
  counter: '#8a5a33',
  counterTop: '#a9713f',
  counterEdge: '#6e4525',
  board: '#fff8e7',
  boardFrame: '#7a4a21',
  plate: '#ffffff',
  plateRing: '#d8d3c8',
  stove: '#3d3d4d',
  stoveTop: '#23232e',
  burnerOff: '#55556a',
  burnerOn: '#ff9d45',
  text: '#2b2118',
  textSoft: '#6b5844',
  good: '#2e9e5b',
  warn: '#e8a13c',
  bad: '#d43d2a',
  gold: '#f2b234',
  panel: 'rgba(43, 33, 24, 0.82)',
};

// Layout rectangles, in canvas pixels. The renderer and the input layer share
// these, so a click on a drawn thing always lands on the same rectangle.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 892, y: 76, w: 372, h: 300 },
  stove: { x: 56, y: 92, w: 300, h: 190 },
  plate: { x: 470, y: 96, w: 360, h: 240 },
  serve: { x: 530, y: 348, w: 240, h: 52 },
  trash: { x: 760, y: 348, w: 60, h: 52 },
  counter: { x: 0, y: 560, w: 1280, h: 160 },
  bins: { y: 596, w: 168, h: 104, gap: 16, firstX: 56 },
  hint: { x: 0, y: 692, w: 1280, h: 28 },
};
