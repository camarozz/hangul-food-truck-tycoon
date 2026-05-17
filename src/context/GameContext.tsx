/**
 * GameContext.tsx
 *
 * Single source of truth for all persistent game state.
 * UI-only state (modals, boot sequence) stays local in App.tsx.
 * Components call useGame() instead of receiving 10–20 props.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

import {
  GameState,
  Upgrade,
  Location,
  Inventory,
  TruckConfig,
  Loan,
  LoanType,
  DayHistory,
  CalendarEvent,
  UnlockNotification,
  Customer,
  OrderQueueItem,
  MarketItem,
  SaveData,
} from '../types';

import {
  DEFAULT_TRUCK_CONFIG,
  DEFAULT_INVENTORY,
  INITIAL_CALENDAR_EVENTS,
  TRUCK_ADJECTIVES,
  TRUCK_COLORS,
  TRUCK_PROPS,
  TRUCK_WINDOWS,
  TRUCK_WHEELS,
  TRUCK_GRILLS,
  TRUCK_UNDERGLOWS,
} from '../constants';

import { audio } from '../audioManager';

// ─── Settings shape ──────────────────────────────────────────────────────────
export interface GameSettings {
  romanization: boolean;
  crtEffects: boolean;
  phosphorFlash: boolean;
  bgmVolume: number;
  sfxVolume: number;
  themeColor: ThemeColor;
  isColorSettingUnlocked: boolean;
  unlockedThemes: ThemeColor[];
  autoSOV: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  romanization: true,
  crtEffects: true,
  phosphorFlash: true,
  bgmVolume: 50,
  sfxVolume: 70,
  themeColor: 'GREEN',
  isColorSettingUnlocked: false,
  unlockedThemes: ['GREEN', 'AMBER', 'CYAN', 'MONOCHROME'],
  autoSOV: true,
};

// ─── Stats shape ─────────────────────────────────────────────────────────────
export interface GameStats {
  wrongParticles: number;
  loanSharkPaid: boolean;
  maxDailyProfit: number;
  universityPerfectStreak: number;
  lifetimeRevenue: number;
  daysPlayed: number;
}

const DEFAULT_STATS: GameStats = {
  wrongParticles: 0,
  loanSharkPaid: false,
  maxDailyProfit: 0,
  universityPerfectStreak: 0,
  lifetimeRevenue: 0,
  daysPlayed: 0,
};

// ─── Full context type ────────────────────────────────────────────────────────
interface GameContextType {
  // ── Game screen ────────────────────────────────────────────────────────────
  gameScreen: GameState;
  setGameScreen: (s: GameState) => void;

  // ── Economy ────────────────────────────────────────────────────────────────
  money: number;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
  reputation: number;
  setReputation: React.Dispatch<React.SetStateAction<number>>;
  day: number;
  gas: number;
  setGas: React.Dispatch<React.SetStateAction<number>>;

  // ── Inventory ──────────────────────────────────────────────────────────────
  inventory: Inventory;
  setInventory: React.Dispatch<React.SetStateAction<Inventory>>;

  // ── Truck ──────────────────────────────────────────────────────────────────
  truckConfig: TruckConfig;
  setTruckConfig: React.Dispatch<React.SetStateAction<TruckConfig>>;

  // ── Location ───────────────────────────────────────────────────────────────
  currentLocation: Location | null;
  setCurrentLocation: React.Dispatch<React.SetStateAction<Location | null>>;

  // ── Upgrades & unlocks ─────────────────────────────────────────────────────
  permits: string[];
  unlockedUpgrades: string[];
  hasFryer: boolean;
  hasBeverageStation: boolean;
  isExtendedBeltUnlocked: boolean;
  unlockedRecipes: string[];
  setUnlockedRecipes: React.Dispatch<React.SetStateAction<string[]>>;
  activeMenu: string[];
  setActiveMenu: React.Dispatch<React.SetStateAction<string[]>>;
  dishesMastered: number;

  // ── Settings ───────────────────────────────────────────────────────────────
  gameSettings: GameSettings;
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>;

  // ── Loans ──────────────────────────────────────────────────────────────────
  activeLoan: Loan | null;
  loanStrike: number;

  // ── History / events / stats ───────────────────────────────────────────────
  history: DayHistory[];
  events: CalendarEvent[];
  stats: GameStats;

  // ── Serving session (lifted for dev panel) ─────────────────────────────────
  customer: Customer | null;
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  orderQueue: OrderQueueItem[];
  setOrderQueue: React.Dispatch<React.SetStateAction<OrderQueueItem[]>>;
  servingPhase: 'GREETING' | 'QUEUE' | 'COOKING';
  setServingPhase: React.Dispatch<React.SetStateAction<'GREETING' | 'QUEUE' | 'COOKING'>>;
  activeQueueIndex: number | null;
  setActiveQueueIndex: React.Dispatch<React.SetStateAction<number | null>>;

  // ── Tutorial flags ─────────────────────────────────────────────────────────
  hasSeenResearchTutorial: boolean;
  setHasSeenResearchTutorial: (v: boolean) => void;
  hasSeenKitchenTutorial: boolean;
  setHasSeenKitchenTutorial: (v: boolean) => void;
  hasSeenMarketTutorial: boolean;
  setHasSeenMarketTutorial: (v: boolean) => void;
  hasSeenShopTutorial: boolean;
  setHasSeenShopTutorial: (v: boolean) => void;

  // ── Misc ───────────────────────────────────────────────────────────────────
  logs: string[];
  lastUnlock: UnlockNotification | null;
  marketCache: { day: number; catalog: MarketItem[] };
  setMarketCache: React.Dispatch<React.SetStateAction<{ day: number; catalog: MarketItem[] }>>;
  isSaving: boolean;
  isInitialized: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  addLog: (message: string) => void;
  unlockTheme: (theme: ThemeColor) => void;
  advanceDay: () => void;
  saveProgress: () => void;
  restartGame: () => void;
  spawnTestCustomer: (type: string) => void;

  // ── Business handlers ──────────────────────────────────────────────────────
  handleServingComplete: (
    earned: number,
    repBonus: number,
    sessionStats?: { wrongParticles: number; perfectStreak: number }
  ) => void;
  handleResearchComplete: (upgrade: Upgrade) => void;
  handleUnlockRecipe: (recipeId: string) => void;
  handleCustomizeComplete: (newConfig: TruckConfig, cost: number) => void;
  handleBailoutAccept: () => void;
  handleAlbaComplete: (earned: number) => void;
  handleRestockComplete: (
    newMoney: number,
    newInventory: Inventory,
    newGas: number,
    repChange?: number
  ) => void;
  handleLocationSelect: (location: Location) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext<GameContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GameProvider({ children }: { children: ReactNode }) {
  // Economy
  const [gameScreen, setGameScreen] = useState<GameState>('BOOT');
  const [money, setMoney] = useState(100000);
  const [reputation, setReputation] = useState(0);
  const [day, setDay] = useState(0);
  const dayRef = useRef(day);
  useEffect(() => { dayRef.current = day; }, [day]);
  const [gas, setGas] = useState(100);

  // Inventory
  const [inventory, setInventory] = useState<Inventory>(DEFAULT_INVENTORY);

  // Truck
  const [truckConfig, setTruckConfig] = useState<TruckConfig>(DEFAULT_TRUCK_CONFIG);

  // Location
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  // Upgrades & unlocks
  const [permits, setPermits] = useState<string[]>([]);
  const [unlockedUpgrades, setUnlockedUpgrades] = useState<string[]>([]);
  const [hasFryer, setHasFryer] = useState(false);
  const [hasBeverageStation, setHasBeverageStation] = useState(false);
  const [isExtendedBeltUnlocked, setIsExtendedBeltUnlocked] = useState(false);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>(['burger']);
  const [activeMenu, setActiveMenu] = useState<string[]>(['burger']);
  const [dishesMastered, setDishesMastered] = useState(0);

  // Settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // Loans
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [loanStrike, setLoanStrike] = useState(0);

  // History & events
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [events] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);

  // Serving session (lifted for dev panel access)
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderQueue, setOrderQueue] = useState<OrderQueueItem[]>([]);
  const [servingPhase, setServingPhase] = useState<'GREETING' | 'QUEUE' | 'COOKING'>('GREETING');
  const [activeQueueIndex, setActiveQueueIndex] = useState<number | null>(null);

  // Tutorials
  const [hasSeenResearchTutorial, setHasSeenResearchTutorial] = useState(false);
  const [hasSeenKitchenTutorial, setHasSeenKitchenTutorial] = useState(false);
  const [hasSeenMarketTutorial, setHasSeenMarketTutorial] = useState(false);
  const [hasSeenShopTutorial, setHasSeenShopTutorial] = useState(false);

  // Misc
  const [logs, setLogs] = useState<string[]>([
    '> SYSTEM INITIALIZED: Inherited Truck "K-BITE" detected.',
    '> STARTUP GRANT: 100,000₩ (십만 원) deposited by Small Business Bureau.',
    '> INVENTORY CHECK: Inherited stock found (12 Buns, 10 Beefs, 5 Cheese, 5 Onions).',
    '> MARKET ADVISORY: Premium Meats (Beef) restricted until Day 4 or 3-Star Rep.',
    '> LINGUISTICS: Particle Cogs [이/가] [을/를] unlocked.',
    '> TIPS: Native numbers are for items and hours. Sino are for money and minutes.'
  ]);
  const [lastUnlock, setLastUnlock] = useState<UnlockNotification | null>(null);
  const [marketCache, setMarketCache] = useState<{ day: number; catalog: MarketItem[] }>({ day: -1, catalog: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // ── Theme palette sync ──────────────────────────────────────────────────────
  const THEME_PALETTES: Record<ThemeColor, { hex: string; rgb: string; scanlineOpacity?: number }> = {
    GREEN: { hex: '#00ff41', rgb: '0, 255, 65' },
    AMBER: { hex: '#ffb000', rgb: '255, 176, 0' },
    CYAN: { hex: '#00ffff', rgb: '0, 255, 255' },
    MONOCHROME: { hex: '#ffffff', rgb: '255, 255, 255' },
    CRIMSON: { hex: '#FF0000', rgb: '255, 0, 0' },
    NEON_PINK: { hex: '#FF00FF', rgb: '255, 0, 255' },
    GOLD: { hex: '#FFD700', rgb: '255, 215, 0' },
    GLITCH: { hex: '#A9A9A9', rgb: '169, 169, 169', scanlineOpacity: 0.4 },
  };

  useEffect(() => {
    const palette = THEME_PALETTES[gameSettings.themeColor] || THEME_PALETTES.GREEN;
    document.documentElement.style.setProperty('--terminal-color', palette.hex);
    document.documentElement.style.setProperty('--terminal-color-rgb', palette.rgb);
    document.documentElement.style.setProperty('--scanline-opacity', (palette.scanlineOpacity || 0.1).toString());
  }, [gameSettings.themeColor]);

  // ── Audio sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    audio.setVolumes(gameSettings.sfxVolume, gameSettings.bgmVolume);
  }, [gameSettings.sfxVolume, gameSettings.bgmVolume]);

  useEffect(() => {
    if (gameScreen === 'MENU' || gameScreen === 'CUSTOMIZE' || gameScreen === 'RESEARCH') audio.playBGM('BGM_MAIN_MENU');
    else if (gameScreen === 'SERVING') audio.playBGM('BGM_SHIFT_NORMAL');
    else if (gameScreen === 'ALBA') audio.playBGM('BGM_ALBA_MINIGAME');
    else if (gameScreen === 'BOOT') audio.playBGM('BGM_BOOT');
    else audio.stopBGM();
  }, [gameScreen]);

  // ── addLog ─────────────────────────────────────────────────────────────────
  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  }, []);

  // ── unlockTheme ────────────────────────────────────────────────────────────
  const unlockTheme = useCallback((theme: ThemeColor) => {
    setGameSettings(prev => {
      if (prev.unlockedThemes.includes(theme)) return prev;
      const milestoneMap: Record<ThemeColor, { milestone: string; reward: string }> = {
        GOLD: { milestone: 'Chaebol Executive', reward: 'CRT PHOSPHOR COLOR: GOLD / YELLOW' },
        GLITCH: { milestone: 'Syntax Error', reward: 'CRT PHOSPHOR COLOR: GLITCH GREY' },
        NEON_PINK: { milestone: 'Night Market', reward: 'CRT PHOSPHOR COLOR: NEON PINK' },
        CRIMSON: { milestone: 'Loan Shark', reward: 'CRT PHOSPHOR COLOR: CRIMSON RED' },
        GREEN: { milestone: '', reward: '' },
        AMBER: { milestone: '', reward: '' },
        CYAN: { milestone: '', reward: '' },
        MONOCHROME: { milestone: '', reward: '' },
      };
      if (milestoneMap[theme].milestone) {
        setLastUnlock({ milestone: milestoneMap[theme].milestone, reward: milestoneMap[theme].reward, theme });
      }
      addLog(`SYSTEM: New Terminal Theme Unlocked: ${theme}!`);
      return { ...prev, unlockedThemes: [...prev.unlockedThemes, theme] };
    });
  }, [addLog]);

  // ── checkBankruptcy ────────────────────────────────────────────────────────
  const checkBankruptcy = useCallback((
    currentMoney: number,
    currentInventory: Inventory,
    currentGas: number,
    currentLoan: Loan | null
  ): boolean => {
    const activeSlots = new Set(currentInventory.batches.map(b => b.id)).size;
    if (currentMoney < 500 && activeSlots === 0 && currentGas < 10) {
      if (!currentLoan) return true;
      addLog('CRITICAL: No funds or stock left. Consider taking an Alba (Part-time job).');
    }
    return false;
  }, [addLog]);

  // ── advanceDay ─────────────────────────────────────────────────────────────
  const advanceDay = useCallback(() => {
    setDay(prevDay => {
      const nextDay = prevDay + 1;

      setStats(prev => ({ ...prev, daysPlayed: prev.daysPlayed + 1 }));

      // Loan handling
      setActiveLoan(prevLoan => {
        if (!prevLoan) return null;
        const remaining = prevLoan.daysRemaining - 1;
        if (remaining <= 0) {
          setMoney(prevMoney => {
            if (prevMoney >= prevLoan.totalDue) {
              if (prevLoan.type === 'SHARK') {
                unlockTheme('CRIMSON');
                setStats(ps => ({ ...ps, loanSharkPaid: true }));
              }
              addLog(`LOAN PAID: ${prevLoan.totalDue.toLocaleString()}₩ deducted. Debt cleared.`);
              return prevMoney - prevLoan.totalDue;
            } else {
              addLog(`LOAN DEFAULT: Could not repay ${prevLoan.type} loan.`);
              setGameScreen(prevLoan.type === 'BANK' ? 'BAILOUT' : 'GAME_OVER');
              return prevMoney;
            }
          });
          return null;
        } else {
          if (remaining === 1) addLog(`URGENT: ${prevLoan.type} loan due TOMORROW (${prevLoan.totalDue.toLocaleString()}₩)`);
          else addLog(`LOAN REMINDER: ${prevLoan.totalDue.toLocaleString()}₩ due in ${remaining} days.`);
          return { ...prevLoan, daysRemaining: remaining };
        }
      });

      // Rent
      const baseRent = 80000 + (nextDay * 8000);
      const rentEvent = events.find(e => e.day === nextDay && e.type === 'RENT');
      if (rentEvent) {
        setMoney(prevMoney => {
          if (prevMoney >= baseRent) {
            addLog(`RENT PAID: ${baseRent.toLocaleString()}₩ deducted for parking space.`);
            return prevMoney - baseRent;
          } else {
            addLog(`RENT DEFAULT: Could not pay ${baseRent.toLocaleString()}₩ rent! Reputation -15.`);
            setReputation(r => Math.max(0, r - 15));
            return prevMoney;
          }
        });
      }

      // Spoilage
      setInventory(prevInv => {
        if (prevDay < 3) return prevInv;
        const processed = prevInv.batches
          .map(b => ({ ...b, daysLeft: b.daysLeft > 0 ? b.daysLeft - 1 : b.daysLeft }))
          .filter(b => b.quantity > 0);
        const spoiledCount = processed.filter(b => b.daysLeft === 0).length;
        const finalBatches = processed.filter(b => b.daysLeft !== 0);
        if (spoiledCount > 0) {
          const penalty = Math.min(8, spoiledCount * 2);
          setReputation(r => Math.max(0, r - penalty));
          addLog(`SPOILAGE: ${spoiledCount} batches spoiled & discarded. Reputation -${penalty}`);
        }
        const activeSlots: number = (Object.values(
          finalBatches.reduce((acc, b) => { acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc; }, {} as Record<string, number>)
        ) as number[]).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);

        if (activeSlots >= prevInv.maxStorage) {
          addLog(`> WARNING: Storage is ${activeSlots}/${prevInv.maxStorage}. Capacity exceeded.`);
        } else {
          addLog(`> [ STORAGE CHECK ]: ${activeSlots}/${prevInv.maxStorage} Slots active. Status Nominal.`);
        }

        setMoney(prevMoney => {
          setActiveLoan(loan => {
            checkBankruptcy(prevMoney, { ...prevInv, batches: finalBatches }, gas, loan);
            return loan;
          });
          return prevMoney;
        });

        return { ...prevInv, batches: finalBatches };
      });

      addLog(`Day ${nextDay} started. Market prices updated.`);
      return nextDay;
    });
  }, [events, gas, addLog, unlockTheme, checkBankruptcy]);

  // ── saveProgress ───────────────────────────────────────────────────────────
  const saveProgress = useCallback(() => {
    setIsSaving(true);
    try {
      const data = {
        money: Math.max(0, money),
        reputation: Math.max(0, Math.min(100, reputation)),
        day: Math.max(0, day),
        gas: Math.max(0, Math.min(100, gas)),
        dishesMastered: Math.max(0, dishesMastered),
        permits,
        unlockedUpgrades,
        inventory,
        truckConfig,
        activeLoan,
        loanStrike,
        history,
        unlockedRecipes,
        activeMenu,
        gameSettings,
        stats,
        hasSeenResearchTutorial,
        hasSeenKitchenTutorial,
        hasSeenMarketTutorial,
        hasSeenShopTutorial,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem('kbite_save_data', JSON.stringify(data));
      console.log('✅ Local save successful');
    } catch (err) {
      console.error('❌ Storage save failed:', err);
      addLog('⚠️ Local save failed — storage might be full');
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  }, [
    money, reputation, day, gas, dishesMastered, permits, unlockedUpgrades,
    inventory, truckConfig, activeLoan, loanStrike, history, unlockedRecipes,
    activeMenu, gameSettings, stats, hasSeenResearchTutorial,
    hasSeenKitchenTutorial, hasSeenMarketTutorial, hasSeenShopTutorial, addLog,
  ]);

  // ── loadProgress ───────────────────────────────────────────────────────────
  const loadProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem('kbite_save_data');
      if (!saved) { addLog('No local save found. Starting fresh.'); return; }
      const data = JSON.parse(saved) as SaveData;

      if (data.money !== undefined) setMoney(data.money);
      if (data.reputation !== undefined) setReputation(data.reputation);
      if (data.day !== undefined) setDay(data.day);
      if (data.gas !== undefined) setGas(data.gas);
      if (data.dishesMastered !== undefined) setDishesMastered(data.dishesMastered);

      if (data.truckConfig) {
        setTruckConfig({
          adjective: data.truckConfig.adjective || TRUCK_ADJECTIVES[0],
          color: data.truckConfig.color || TRUCK_COLORS[2],
          signboard: data.truckConfig.signboard || '버거',
          prop: data.truckConfig.prop || TRUCK_PROPS[0],
          window: data.truckConfig.window || TRUCK_WINDOWS[0],
          wheel: data.truckConfig.wheel || TRUCK_WHEELS[0],
          grill: data.truckConfig.grill || TRUCK_GRILLS[0],
          underglow: data.truckConfig.underglow || TRUCK_UNDERGLOWS[0],
          hasDoubleTires: data.truckConfig.hasDoubleTires || false,
        });
      }
      if (data.permits) setPermits(data.permits);
      if (data.unlockedUpgrades) {
        setUnlockedUpgrades(data.unlockedUpgrades);
        if (data.unlockedUpgrades.includes('11')) setHasFryer(true);
        if (data.unlockedUpgrades.includes('13')) setHasBeverageStation(true);
      }
      if (data.hasSeenResearchTutorial !== undefined) setHasSeenResearchTutorial(data.hasSeenResearchTutorial);
      if (data.hasSeenKitchenTutorial !== undefined) setHasSeenKitchenTutorial(data.hasSeenKitchenTutorial);
      if (data.hasSeenMarketTutorial !== undefined) setHasSeenMarketTutorial(data.hasSeenMarketTutorial);
      if (data.hasSeenShopTutorial !== undefined) setHasSeenShopTutorial(data.hasSeenShopTutorial);
      if (data.activeLoan) setActiveLoan(data.activeLoan);
      if (data.loanStrike) setLoanStrike(data.loanStrike);
      if (data.unlockedRecipes) setUnlockedRecipes(data.unlockedRecipes);
      if (data.activeMenu) setActiveMenu(data.activeMenu);
      if (data.gameSettings) {
        setGameSettings(prev => ({
          ...prev,
          ...data.gameSettings,
          isColorSettingUnlocked: data.gameSettings?.isColorSettingUnlocked || false,
          unlockedThemes: data.gameSettings?.unlockedThemes || ['GREEN', 'AMBER', 'CYAN', 'MONOCHROME'],
        }));
      }
      if (data.history) setHistory(data.history);
      if (data.inventory) {
        const migratedBatches = (data.inventory.batches || [])
          .map(b => b.id === 'soda_stock' ? { ...b, id: 'soda', daysLeft: -1 } : b)
          .filter(b => b.id !== 'cup');
        setInventory({
          batches: migratedBatches,
          maxStorage: data.inventory.maxStorage || 20,
          shelfLifeModifier: data.inventory.shelfLifeModifier || 0
        });
      }
      if (data.stats) setStats({ ...DEFAULT_STATS, ...data.stats });
      addLog('Progress loaded from local storage.');
    } catch (err) {
      console.error('Error loading progress:', err);
      addLog('Error reading local save data.');
    } finally {
      setIsInitialized(true);
    }
  }, [addLog]);

  // Load on mount
  useEffect(() => { loadProgress(); }, []);

  // Auto-save on key state changes
  useEffect(() => {
    const t = setTimeout(() => saveProgress(), 800);
    return () => clearTimeout(t);
  }, [
    money, reputation, day, gas, dishesMastered, inventory, permits,
    unlockedUpgrades, truckConfig, unlockedRecipes, gameSettings,
    hasSeenResearchTutorial, hasSeenKitchenTutorial,
    hasSeenMarketTutorial, hasSeenShopTutorial,
  ]);

  // Shift 000 inventory safety check
  useEffect(() => {
    if (day === 0 && !hasSeenShopTutorial) {
      const hasOnion = inventory.batches.some(b => b.id === 'onion');
      if (!hasOnion) {
        setInventory(prev => ({ ...prev, batches: [...prev.batches, { id: 'onion', quantity: 10, daysLeft: 3 }] }));
        addLog('> AUTO-RESTORE: Tutorial Onion stock re-injected.');
      }
    }
  }, [day, hasSeenShopTutorial, inventory.batches.length]);

  // Market unlock notification
  useEffect(() => {
    if (day === 4 || reputation === 60) addLog('MARKET UPDATE: Wholesale Market now offering Premium Meats (Beef)!');
  }, [day, reputation]);

  // ── Business handlers ──────────────────────────────────────────────────────

  const handleServingComplete = useCallback((
    totalEarned: number,
    totalRepBonus: number,
    sessionStats?: { wrongParticles: number; perfectStreak: number }
  ) => {
    if (!hasSeenShopTutorial) {
      setHasSeenShopTutorial(true);
      setGameSettings(prev => ({ ...prev, isColorSettingUnlocked: true }));
    }

    let demandMultiplier = 1.0;
    const todayEvent = events.find(e => e.day === day && e.demandModifiers);
    if (todayEvent?.demandModifiers) {
      demandMultiplier = Math.max(1.0, ...Object.values(todayEvent.demandModifiers) as number[]);
      addLog(`EVENT BOOST: ${todayEvent.title} → ×${demandMultiplier.toFixed(1)} earnings`);
    }

    const tip = Math.floor(totalEarned * (sessionStats?.perfectStreak && sessionStats.perfectStreak >= 3 ? 0.25 : 0.12));
    const locationBonus = currentLocation?.id === 'univ' ? Math.floor(totalEarned * 0.15) : 0;
    const repMultiplierBonus = Math.floor(totalEarned * (reputation / 200));
    const finalEarned = Math.round((totalEarned + tip + locationBonus + repMultiplierBonus) * demandMultiplier);

    setMoney(prev => prev + finalEarned);
    setReputation(prev => Math.max(0, Math.min(100, prev + totalRepBonus)));
    addLog(`Shift complete. Total Earned: ${finalEarned.toLocaleString()}₩`);
    setHistory(prev => [...prev, { day, earnings: finalEarned, isAlba: false, clear: true }]);

    if (finalEarned >= 1000000) unlockTheme('GOLD');
    if (sessionStats) {
      if (sessionStats.wrongParticles >= 50) unlockTheme('GLITCH');
      if (currentLocation?.id === 'univ' && sessionStats.perfectStreak >= 30) unlockTheme('NEON_PINK');
      setStats(prev => ({
        ...prev,
        wrongParticles: prev.wrongParticles + sessionStats.wrongParticles,
        maxDailyProfit: Math.max(prev.maxDailyProfit, finalEarned),
        lifetimeRevenue: prev.lifetimeRevenue + finalEarned,
        universityPerfectStreak: currentLocation?.id === 'univ'
          ? Math.max(prev.universityPerfectStreak, sessionStats.perfectStreak)
          : prev.universityPerfectStreak,
      }));
    }

    advanceDay();

    if (day === 0) {
      setGameScreen('MENU');
      addLog('> ORIENTATION COMPLETE. Full system access granted.');
    } else {
      setGameScreen('CALENDAR');
    }
  }, [hasSeenShopTutorial, events, day, currentLocation, reputation, addLog, unlockTheme, advanceDay]);

  const handleUnlockRecipe = useCallback((recipeId: string) => {
    setUnlockedRecipes(prev => {
      if (prev.includes(recipeId)) return prev;
      setDishesMastered(d => d + 1);
      setReputation(r => Math.min(100, r + 5));
      addLog(`KITCHEN: Recipe "${recipeId}" synthesized. New menu item unlocked!`);
      return [...prev, recipeId];
    });
  }, [addLog]);

  const handleResearchComplete = useCallback((upgrade: Upgrade) => {
    const isTutorialRefund = !hasSeenResearchTutorial && upgrade.id === '11';
    if (!isTutorialRefund) setMoney(prev => prev - upgrade.cost);
    else addLog(`TUTORIAL BONUS: Research cost for ${upgrade.name} refunded!`);

    setUnlockedUpgrades(prev => [...prev, upgrade.id]);

    if (upgrade.id === '3') { setIsExtendedBeltUnlocked(true); addLog('TRUCK UPGRADE: Advanced SOV Engine installed.'); }
    if (upgrade.id === '11') { setHasFryer(true); addLog('EQUIPMENT UNLOCKED: Deep Fryer installed. You can now cook fries!'); }
    if (upgrade.id === '13') { setHasBeverageStation(true); addLog('EQUIPMENT UNLOCKED: Beverage Station installed. Soda and Juice unlocked!'); }
    if (upgrade.id === '1') setTruckConfig(prev => ({ ...prev, hasDoubleTires: true }));
    if (upgrade.id === '8') { setInventory(prev => ({ ...prev, maxStorage: prev.maxStorage + 5 })); addLog('TRUCK UPGRADE: Wide Prep Board installed. +5 Dry Slots.'); }
    if (upgrade.id === '4') { setInventory(prev => ({ ...prev, maxStorage: 30 })); addLog('TRUCK UPGRADE: Chassis expanded to 30 slots.'); }
    if (upgrade.id === '5') { setInventory(prev => ({ ...prev, shelfLifeModifier: 2 })); addLog('TRUCK UPGRADE: Mini-Fridge installed. Freshness extended.'); }
    if (upgrade.id === '6') { setPermits(prev => [...prev, 'business']); addLog('PERMIT ACQUIRED: Business District access granted.'); }
    if (upgrade.id === '7') { setPermits(prev => [...prev, 'univ']); addLog('PERMIT ACQUIRED: Campus Parking Permit granted.'); }
    if (upgrade.id === '12') { setPermits(prev => [...prev, 'park']); addLog('PERMIT ACQUIRED: Park Sector Permit granted.'); }
    if (upgrade.id === '9') addLog('TRUCK UPGRADE: Auto-Fryer installed. Object particles automated.');

    addLog(`Research started: ${upgrade.name}. Cost: ${upgrade.cost} KRW.`);
  }, [hasSeenResearchTutorial, addLog]);

  const handleCustomizeComplete = useCallback((newConfig: TruckConfig, cost: number) => {
    setTruckConfig(newConfig);
    setMoney(prev => prev - cost);
    addLog(`TUNING COMPLETE: Truck updated to [${newConfig.adjective.text} ${newConfig.color.text}]. Cost: ${cost.toLocaleString()}₩`);
    setGameScreen('MENU');
  }, [addLog]);

  const handleBailoutAccept = useCallback(() => {
    const type: LoanType = loanStrike === 0 ? 'BANK' : 'SHARK';
    const principal = 50000;
    const interest = type === 'BANK' ? 0.18 : 0.45;
    const totalDue = Math.round(principal * (1 + interest) / 100) * 100;
    const dueDate = type === 'BANK' ? 4 : 3;
    const newLoan: Loan = {
      id: Math.random().toString(36).substr(2, 9),
      type, principal, interestRate: interest, totalDue, daysRemaining: dueDate, isPaid: false,
    };
    setMoney(prev => prev + principal);
    setActiveLoan(newLoan);
    setLoanStrike(prev => prev + 1);
    setGameScreen('MENU');
    addLog(`LOAN ACCEPTED: Received ${principal.toLocaleString()}₩. Repay ${totalDue.toLocaleString()}₩ in ${dueDate} days.`);
  }, [loanStrike, addLog]);

  const handleAlbaComplete = useCallback((earned: number) => {
    setMoney(prev => prev + earned);
    setHistory(prev => [...prev, { day, earnings: earned, isAlba: true, clear: true }]);
    setGameScreen('MENU');
    addLog(`ALBA COMPLETE: Earned ${earned.toLocaleString()}₩. Funds updated.`);
  }, [day, addLog]);

  const handleRestockComplete = useCallback((
    newMoney: number,
    newInventory: Inventory,
    newGas: number,
    repChange: number = 0
  ) => {
    setMoney(newMoney);
    setInventory(newInventory);
    setGas(newGas);
    if (repChange !== 0) {
      setReputation(prev => Math.max(0, Math.min(100, prev + repChange)));
      addLog(`Inventory cleaned. Reputation: ${repChange > 0 ? '+' : ''}${repChange}`);
    }
    addLog('Restock complete. Inventory updated.');
    setActiveLoan(loan => {
      const needsBailout = checkBankruptcy(newMoney, newInventory, newGas, loan);
      if (needsBailout) {
        addLog('CRITICAL: Bankruptcy imminent. Initiating Bailout Protocol...');
        setGameScreen('BAILOUT');
      } else {
        setGameScreen('MENU');
      }
      return loan;
    });
  }, [addLog, checkBankruptcy]);

  const handleLocationSelect = useCallback((location: Location) => {
    setGas(prev => Math.max(0, Math.min(100, prev - location.fuelCost)));
    setCurrentLocation(location);
    addLog(`Deployed to ${location.name}. Fuel: -${location.fuelCost}%`);
    setGameScreen('SERVING');
  }, [addLog]);

  const spawnTestCustomer = useCallback((type: string) => {
    const uniqueId = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: OrderQueueItem = {
      type,
      name: type,
      icon: type === 'fries' ? '🍟' : type === 'soda' ? '🥤' : type === 'juice' ? '🧃' : '🍔',
      visual: type === 'fries' ? '[🍟]' : type === 'soda' ? '[🥤]' : type === 'juice' ? '[🧃]' : '[🍔]',
      recipe: {},
      completed: false,
      isCompleted: false,
      cookedResult: null,
      modifier: '',
      instanceId: uniqueId,
    };
    const testCustomer: Customer = {
      id: uniqueId, name: 'Test Customer', type: 'STANDARD', order: type,
      targetItems: [queueItem],
      count: 1, picky: false,
      modifiers: type === 'spicy' ? ['매운 소스'] : type === 'onion' ? ['양파'] : [],
      negatedModifiers: [],
      rawOrder: type === 'burger' ? '버거 하나 주세요' : type === 'cheeseburger' ? '치즈버거 주세요'
        : type === 'fries' ? '감자튀김 주세요' : type === 'kimchiburger' ? '김치버거 주세요'
          : type === 'spicy' ? '매운 소스 넣은 버거' : '양파 넣은 버거',
      politenessRequired: 'POLITE',
      ticketId: 999,
    };
    setCustomer(testCustomer);
    setServingPhase('GREETING');
    setOrderQueue([queueItem]);
    setActiveQueueIndex(0);
    addLog(`DEV: Spawned test customer - ${type}`);
  }, [addLog]);

  const restartGame = useCallback(async () => {
    setMoney(100000);
    setReputation(0);
    setDay(0);
    setGas(100);
    setDishesMastered(0);
    setUnlockedRecipes(['burger']);
    setPermits([]);
    setUnlockedUpgrades([]);
    setIsExtendedBeltUnlocked(false);
    setHasFryer(false);
    setHasBeverageStation(false);
    setGameSettings(prev => ({ ...prev, isColorSettingUnlocked: false, themeColor: 'GREEN' }));
    setInventory({ ...DEFAULT_INVENTORY, maxStorage: 5 });
    setTruckConfig(DEFAULT_TRUCK_CONFIG);
    setActiveLoan(null);
    setLoanStrike(0);
    setHistory([]);
    setActiveMenu(['burger']);
    setGameScreen('MENU');
    setLogs([
      '> SYSTEM REBOOT COMPLETE: Logistics initialized.',
      '> STARTUP GRANT: 100,000₩ (십만 원) redeployed.',
      '> INVENTORY CHECK: Inherited stock found (12 Buns, 10 Beefs, 5 Cheese, 5 Onions).',
      '> LINGUISTICS: Particle Cogs [이/가] [을/를] online.',
    ]);
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const value: GameContextType = {
    gameScreen, setGameScreen,
    money, setMoney,
    reputation, setReputation,
    day, gas, setGas,
    inventory, setInventory,
    truckConfig, setTruckConfig,
    currentLocation, setCurrentLocation,
    permits, unlockedUpgrades, hasFryer, hasBeverageStation, isExtendedBeltUnlocked,
    unlockedRecipes, setUnlockedRecipes,
    activeMenu, setActiveMenu,
    dishesMastered,
    gameSettings, setGameSettings,
    activeLoan, loanStrike,
    history, events, stats,
    customer, setCustomer,
    orderQueue, setOrderQueue,
    servingPhase, setServingPhase,
    activeQueueIndex, setActiveQueueIndex,
    hasSeenResearchTutorial, setHasSeenResearchTutorial,
    hasSeenKitchenTutorial, setHasSeenKitchenTutorial,
    hasSeenMarketTutorial, setHasSeenMarketTutorial,
    hasSeenShopTutorial, setHasSeenShopTutorial,
    logs, lastUnlock,
    marketCache, setMarketCache,
    isSaving,
    isInitialized,
    addLog, unlockTheme, advanceDay, saveProgress, restartGame, spawnTestCustomer,
    handleServingComplete, handleResearchComplete, handleUnlockRecipe, handleCustomizeComplete,
    handleBailoutAccept, handleAlbaComplete, handleRestockComplete, handleLocationSelect,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame() must be called inside <GameProvider>');
  return ctx;
}
