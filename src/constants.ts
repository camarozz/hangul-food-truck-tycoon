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

// ====================== TRUCK CONFIG DATA ======================
// Centralized here so both App.tsx and GameContext.tsx can import without circular deps

import type { TruckAdjective, TruckColor, TruckProp, TruckWindow, TruckWheel, TruckGrill, TruckUnderglow, TruckConfig, Inventory, CalendarEvent } from './types';

export const TRUCK_ADJECTIVES: TruckAdjective[] = [
  { id: 'standard', text: '기본', meaning: 'Standard', attraction: { residence: 1.0, park: 1.0 } }
];

export const TRUCK_COLORS: TruckColor[] = [
  { id: 'red', text: '빨간', meaning: 'Red', hex: '#ff4444' },
  { id: 'blue', text: '파란', meaning: 'Blue', hex: '#4444ff' },
  { id: 'yellow', text: '노란', meaning: 'Yellow', hex: '#ffff00' },
  { id: 'black', text: '까만', meaning: 'Black', hex: '#666666' },
];

export const TRUCK_PROPS: TruckProp[] = [
  { id: 'none', text: '없음', meaning: 'None', ascii: `` },
  { id: 'burger', text: '버거', meaning: 'Burger Dome', ascii: `       ___________\n    .' *     *     '.\n   (_____*________*__)\n   {.-'_.-_.-'_.-_.-'}\n   :MMMMMMMMMMM\\_/MMM:\n    \\_______________/` },
  { id: 'fries', text: '감자튀김', meaning: 'French Fries', ascii: `       \\\\ //||\\\\ ///   \n     \\\\ \\\\||/||/|/ //\n    |===============|\n     \\             /\n      \\   =====   /\n       \\_________/` },
  { id: 'gimbap', text: '김밥', meaning: 'Gimbap', ascii: `        __________\n     .'.. : .:. '. '.\n    / : /V\\ (o) : \\  \\\n    | : [=] MMM . |  |\n    \\  ' :.. : '  /  /\n     '-._______.-'_-'` },
  { id: 'taco', text: '타코', meaning: 'Taco', ascii: `        _________\n      _/@_@@@_@~@@\\\n     /     '    \\@@\\\n    /   '     '  \\@@|\n    | '    '   .  |@|\n     \\_____________\\/` }
];

export const TRUCK_WINDOWS: TruckWindow[] = [
  { id: 'standard', text: '기본', meaning: 'Clear', ascii: '=' },
  { id: 'tinted', text: '코팅', meaning: 'Tinted', ascii: '#' },
  { id: 'slatted', text: '슬랫', meaning: 'Slatted', ascii: '/' }
];

export const TRUCK_WHEELS: TruckWheel[] = [
  { id: 'standard', text: '기본', meaning: 'Standard', ascii: '(@)' },
  { id: 'offroad', text: '오프로드', meaning: 'Off-Road', ascii: '[#]' },
  { id: 'spinner', text: '스피너', meaning: 'Spinner', ascii: '(*)' },
  { id: 'retro', text: '클래식', meaning: 'Retro', ascii: '(O)' }
];

export const TRUCK_GRILLS: TruckGrill[] = [
  { id: 'standard', text: '기본', meaning: 'Standard', ascii: '==' },
  { id: 'aggressive', text: '공격적인', meaning: 'Aggressive', ascii: '//' },
  { id: 'heavy', text: '무거운', meaning: 'Heavy Duty', ascii: '||' }
];

export const TRUCK_UNDERGLOWS: TruckUnderglow[] = [
  { id: 'none', text: '없음', meaning: 'None', ascii: '_____________', hex: 'transparent' },
  { id: 'cyan', text: '싸이언', meaning: 'Neon Cyan', ascii: '=============', hex: '#00ffff' },
  { id: 'pink', text: '핑크', meaning: 'Neon Pink', ascii: '=============', hex: '#ff00ff' }
];

export const DEFAULT_TRUCK_CONFIG: TruckConfig = {
  adjective: TRUCK_ADJECTIVES[0]!,
  color: TRUCK_COLORS[2]!,
  signboard: '버거',
  prop: TRUCK_PROPS[0]!,
  window: TRUCK_WINDOWS[0]!,
  wheel: TRUCK_WHEELS[0]!,
  grill: TRUCK_GRILLS[0]!,
  underglow: TRUCK_UNDERGLOWS[0]!,
  hasDoubleTires: false
};

export const DEFAULT_INVENTORY: Inventory = {
  batches: [
    { id: 'bun', quantity: 12, daysLeft: -1 },
    { id: 'beef', quantity: 10, daysLeft: 3 },
    { id: 'soda', quantity: 5, daysLeft: -1 },
    { id: 'cheese', quantity: 5, daysLeft: 4 },
    { id: 'onion', quantity: 5, daysLeft: 6 }
  ],
  maxStorage: 10,
  shelfLifeModifier: 0
};

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    day: 2, title: 'Rain Expected', koTitle: '비',
    description: 'Rain expected tomorrow. Warm food demand +20%.',
    type: 'WEATHER', impact: 'Warm Food +20%'
  },
  {
    day: 7, title: 'University Festival', koTitle: '대학 축제',
    description: 'Expect huge crowds and casual speech.',
    type: 'FESTIVAL', impact: 'Volume +50%'
  },
  {
    day: 9, title: 'Monthly Rent', koTitle: '월세',
    description: 'Rent due for the truck parking space.',
    type: 'RENT', impact: '-150,000₩'
  },
  {
    day: 4, title: 'Veggie Market Surge', koTitle: '채소 붐',
    description: 'Fresh vegetable trend is huge today.',
    type: 'CUSTOM', impact: 'Veggie dishes +60% demand • Meat dishes -40%',
    demandModifiers: { burger: 0.6, cheeseburger: 0.6, kimchiburger: 0.6, fries: 1.0, soda: 1.0, juice: 1.6 }
  },
  {
    day: 11, title: 'Spicy Challenge Day', koTitle: '매운 맛 챌린지',
    description: 'Students are craving extreme spice today.',
    type: 'CUSTOM', impact: 'Spicy dishes +80% demand',
    demandModifiers: { kimchiburger: 1.8, burger: 0.9, cheeseburger: 0.9, fries: 1.3 }
  },
  {
    day: 15, title: 'Premium Meat Festival', koTitle: '프리미엄 고기 축제',
    description: 'High-end meat demand is through the roof.',
    type: 'CUSTOM', impact: 'Beef dishes +70% demand',
    demandModifiers: { burger: 1.7, cheeseburger: 1.7, kimchiburger: 1.7, fries: 0.8 }
  }
];
