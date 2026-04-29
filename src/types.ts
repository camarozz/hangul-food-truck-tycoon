/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeColor = 'GREEN' | 'AMBER' | 'CYAN' | 'MONOCHROME' | 'CRIMSON' | 'NEON_PINK' | 'GOLD' | 'GLITCH';

export type GameState = 'BOOT' | 'MENU' | 'MAP' | 'SERVING' | 'KITCHEN' | 'RESEARCH' | 'CUSTOMIZE' | 'RESTOCK' | 'BAILOUT' | 'GAME_OVER' | 'CALENDAR' | 'ALBA';

export type LoanType = 'BANK' | 'SHARK';

export interface CalendarEvent {
  day: number;
  title: string;
  koTitle: string;
  description: string;
  type: 'WEATHER' | 'FESTIVAL' | 'RENT' | 'CUSTOM';
  impact: string;
  // === NEW: Flexible demand modifiers for future events ===
  demandModifiers?: Record<string, number>; // recipeId → multiplier (1.0 = normal)
}

export interface DayHistory {
  day: number;
  earnings: number;
  isAlba: boolean;
  clear: boolean;
}

export interface UnlockNotification {
  milestone: string;
  reward: string;
  theme: ThemeColor;
}

export interface Loan {
  id: string;
  type: LoanType;
  principal: number;
  interestRate: number;
  totalDue: number;
  daysRemaining: number; // Native Korean
  isPaid: boolean;
}

export type PolitenessLevel = 'CASUAL' | 'POLITE' | 'FORMAL';

export interface Location {
  id: string;
  name: string;
  koName: string;
  description: string;
  demographic: string;
  politeness: PolitenessLevel;
  focus: string;
  trending: string[];
  incomeLevel: 'Low' | 'Medium' | 'High';
  orderComplexity: 'Simple' | 'Medium' | 'Complex';
  distanceKm: number;
  fuelCost: number;
  openTime: number; // Minutes from 00:00
  closeTime: number; // Minutes from 00:00
  rushHours: { start: number, end: number, label: string }[];
}

export interface Word {
  id: string;
  text: string;
  meaning: string;
  icon?: string;
  type: 'subject' | 'object' | 'verb' | 'particle' | 'location';
  politeness?: PolitenessLevel;
}

export interface Customer {
  id: string;
  name: string;
  type: 'STUDENT' | 'STANDARD' | 'VIP';
  order: string;
  targetItems: { 
    type: string, 
    completed: boolean, 
    isCompleted?: boolean, 
    cookedResult?: string | null,
    visual?: string,
    icon?: string,
    instanceId?: string,
    recipe?: Record<string, number>,
    modifier?: string
  }[];
  count: number;
  picky: boolean;
  modifiers: string[];
  negatedModifiers: string[]; // e.g., "not spicy"
  rawOrder: string;
  politenessRequired: PolitenessLevel;
  ticketId: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  durationDays: number; // Native Korean
  profitBoostPercent: number; // Sino-Korean
  unlocked: boolean;
  tier: 1 | 2 | 3;
  category: 'EQUIPMENT' | 'GEAR' | 'AUTOMATION' | 'PERMIT';
}

export const SINO_NUMBERS: Record<number, string> = {
  0: '영', 1: '일', 2: '이', 3: '삼', 4: '사', 5: '오', 6: '육', 7: '칠', 8: '팔', 9: '구', 10: '십',
  20: '이십', 30: '삼십', 40: '사십', 50: '오십', 100: '백', 1000: '천', 10000: '만', 100000: '십만', 1000000: '백만'
};

export const NATIVE_NUMBERS: Record<number, string> = {
  0: '영', 1: '하나', 2: '둘', 3: '셋', 4: '넷', 5: '다섯', 6: '여섯', 7: '일곱', 8: '여덟', 9: '아홉', 10: '열',
  20: '스물', 30: '서른', 40: '마흔', 50: '쉰', 60: '예순', 70: '일흔', 80: '여든', 90: '아흔', 100: '백'
};

export const COUNTERS: Record<string, string> = {
  items: '개',
  people: '명',
  hours: '시',
  minutes: '분',
  money: '원',
  days: '일',
  percent: '퍼센트',
  bottles: '병',
  meat: '근',
  liters: '리터'
};

export interface TruckAdjective {
  id: string;
  text: string;
  meaning: string;
  attraction: Record<string, number>; // Location ID -> Bonus
}

export interface TruckColor {
  id: string;
  text: string;
  meaning: string;
  hex: string;
}

export interface TruckProp {
  id: string;
  text: string;
  meaning: string;
  ascii: string;
}

export interface TruckWindow {
  id: string;
  text: string;
  meaning: string;
  ascii: string;
}

export interface TruckWheel {
  id: string;
  text: string;
  meaning: string;
  ascii: string;
}

export interface TruckGrill {
  id: string;
  text: string;
  meaning: string;
  ascii: string;
}

export interface TruckUnderglow {
  id: string;
  text: string;
  meaning: string;
  ascii: string;
  hex: string;
}

export interface TruckConfig {
  adjective: TruckAdjective;
  color: TruckColor;
  signboard: string;
  prop: TruckProp;
  wheel: TruckWheel;
  grill: TruckGrill;
  underglow: TruckUnderglow;
  window: TruckWindow;
  hasDoubleTires: boolean;
}

export interface InventoryBatch {
  id: string;
  quantity: number;
  daysLeft: number; // -1 for non-perishable
}

export interface Inventory {
  batches: InventoryBatch[];
  maxStorage: number;
  shelfLifeModifier: number; // Extra days from fridge
}

export interface Recipe {
  id: string;
  name: string;
  koName: string;
  description: string;
  ingredients: { id: string, koName: string, qwertyHint: string }[];
  methods: { id: string, koName: string, qwertyHint: string }[];
  complexity: number;
  unlocked: boolean;
  profitBonus: number;
}

export function toSinoKorean(num: number): string {
  if (num === 0) return '영';

  let result = '';
  const man = Math.floor(num / 10000);
  let remainder = num % 10000;

  if (man > 0) {
    if (man > 1) result += toSinoKorean(man);
    result += '만';
  }

  const chun = Math.floor(remainder / 1000);
  remainder %= 1000;
  if (chun > 0) {
    if (chun > 1) result += SINO_NUMBERS[chun];
    result += '천';
  }

  const baek = Math.floor(remainder / 100);
  remainder %= 100;
  if (baek > 0) {
    if (baek > 1) result += SINO_NUMBERS[baek];
    result += '백';
  }

  const sip = Math.floor(remainder / 10);
  remainder %= 10;
  if (sip > 0) {
    if (sip > 1) result += SINO_NUMBERS[sip];
    result += '십';
  }

  if (remainder > 0) {
    result += SINO_NUMBERS[remainder];
  }

  return result;
}

export function toNativeKorean(num: number): string {
  if (num === 0) return NATIVE_NUMBERS[0];
  if (NATIVE_NUMBERS[num]) return NATIVE_NUMBERS[num];
  
  const tens = Math.floor(num / 10) * 10;
  const ones = num % 10;
  
  if (tens > 0 && ones > 0 && NATIVE_NUMBERS[tens]) {
    return NATIVE_NUMBERS[tens] + NATIVE_NUMBERS[ones];
  }
  
  return num.toString();
}

export function formatKoreanTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  
  const hourNative = toNativeKorean(h === 0 ? 12 : h > 12 ? h - 12 : h);
  const minuteSino = toSinoKorean(m);
  
  return `${hourNative} 시 ${minuteSino} 분`;
}

export function formatKoreanTimeWithHint(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  
  const hourNative = toNativeKorean(h === 0 ? 12 : h > 12 ? h - 12 : h);
  const minuteSino = toSinoKorean(m);
  
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const displayM = m.toString().padStart(2, '0');
  
  return `${displayH}:${displayM} (Native Hour: ${hourNative} 시 / Sino Minute: ${minuteSino} 분)`;
}
