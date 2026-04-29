/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const RECIPE_REQUIREMENTS: Record<string, Record<string, number>> = {
  burger: { beef: 1, bun: 1 },
  cheeseburger: { beef: 1, bun: 1, cheese: 1 },
  fries: { potato: 1 },
  kimchiburger: { beef: 1, bun: 1, kimchi: 1 },
  soda: { soda: 1 },
  juice: { juice: 1 },
};

export const RECIPE_LABELS: Record<string, string> = {
  burger: 'Burger (버거)',
  cheeseburger: 'Cheese Burger (치즈버거)',
  fries: 'French Fries (감자튀김)',
  kimchiburger: 'Kimchi Burger (김치버거)',
  soda: 'Cold Soda (음료수)',
  juice: 'Organic Juice (주스)',
};

export const INGREDIENT_ICONS: Record<string, string> = {
  beef: '🥩',
  bun: '🍞',
  cheese: '🧀',
  potato: '🥔',
  kimchi: '🥬',
  soda: '🥤',
  juice: '🧃',
  onion: '🧅',
};

export const INGREDIENT_NAMES: Record<string, string> = {
  beef: 'Meat',
  bun: 'Buns',
  cheese: 'Cheese',
  potato: 'Potatoes',
  kimchi: 'Kimchi',
  soda: 'Soda',
  juice: 'Juice',
  onion: 'Onion',
};

export const GAME_VERSION = "v1.5.0";

// ====================== CENTRALIZED UI STRINGS ======================
export const UI_STRINGS = {
  MENU_OPTIONS: {
    openShop: { label: 'OPEN SHOP', koLabel: '장사 시작', desc: 'Just start! Low Attract/Random Cust.' },
    viewMap: { label: 'VIEW MAP', koLabel: '지도', desc: 'Target locations/Neighborhood analysis.' },
    kitchen: { label: 'KITCHEN', koLabel: '주방', desc: 'Research & Compose new dishes (Hangul practice).' },
    customize: { label: 'CUSTOMIZE', koLabel: '차량 튜닝', desc: 'Alter truck visual (Colors/Adjectives).' },
    research: { label: 'RESEARCH', koLabel: '연구', desc: 'Buy truck mechanical upgrades (Fast grill/Better engine).' },
    restock: { label: 'RESTOCK', koLabel: '비품 구매', desc: 'Buy ingredients, gasoline, and supplies.' },
    alba: { label: 'ALBA (PART-TIME)', koLabel: '아르바이트', desc: 'Work a part-time job to earn emergency capital (Performance-based).' },
    exit: { label: 'EXIT GAME', koLabel: '게임 종료', desc: 'Return to boot screen.' },
  },

  MARKET_CATALOG: [
    { id: 'beef', name: 'Meat', koName: '고기', unit: '1개', counter: '개', basePrice: 1500, type: 'FRESH' as const, shelfLife: 3 },
    { id: 'potato', name: 'Potato', koName: '감자', unit: '1개', counter: '개', basePrice: 800, type: 'FRESH' as const, shelfLife: 4 },
    { id: 'soda', name: 'Soda', koName: '음료수', unit: '1병', counter: '병', basePrice: 1200, type: 'DRY' as const, shelfLife: -1 },
    { id: 'juice', name: 'Juice', koName: '주스', unit: '1병', counter: '병', basePrice: 1800, type: 'DRY' as const, shelfLife: -1 },
    { id: 'gas', name: 'Gas', koName: '가솔린', unit: '1L', counter: '리터', basePrice: 1500, type: 'DRY' as const, shelfLife: -1 },
    { id: 'bun', name: 'Bun', koName: '빵', unit: '1개', counter: '개', basePrice: 800, type: 'DRY' as const, shelfLife: -1 },
    { id: 'cheese', name: 'Cheese', koName: '치즈', unit: '1개', counter: '개', basePrice: 2000, type: 'FRESH' as const, shelfLife: 4 },
    { id: 'kimchi', name: 'Kimchi', koName: '김치', unit: '1근', counter: '근', basePrice: 3000, type: 'FRESH' as const, shelfLife: 5 },
    { id: 'onion', name: 'Onion', koName: '양파', unit: '1개', counter: '개', basePrice: 500, type: 'FRESH' as const, shelfLife: 6 },
  ] as const,

  PRE_FLIGHT_ADVISORY: 'Different neighborhoods have unique trends and politeness requirements. Check the "VIEW MAP" analysis for optimal service.',

  LOG_MESSAGES: {
    orientationComplete: '> ORIENTATION COMPLETE. Full system access granted.',
    dayStarted: (day: number) => `Day ${day} started. Market prices updated.`,
    spoiled: (count: number) => `WARNING: ${count} ingredient batches have spoiled!`,
    storageCheck: (slots: number, max: number) => `> [ STORAGE CHECK ]: ${slots}/${max} Slots active. Status Nominal.`,
    storageWarning: (slots: number, max: number) => `> WARNING: Storage is ${slots}/${max}. Capacity exceeded.`,
  },
} as const;
