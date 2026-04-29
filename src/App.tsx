/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Utensils, BookOpen, Settings, Play, DollarSign, Clock, FlaskConical, Palette, Terminal, Plus, Star, FastForward, Skull, Wrench } from 'lucide-react';
import { GameState, toSinoKorean, toNativeKorean, Upgrade, Location, Inventory, TruckConfig, TruckAdjective, TruckColor, TruckProp, TruckWheel, TruckGrill, TruckUnderglow, TruckWindow, Loan, LoanType, DayHistory, CalendarEvent, ThemeColor, UnlockNotification, Customer, PolitenessLevel } from './types';
import ServingStation from './components/ServingStation';
import KitchenLab from './components/KitchenLab';
import ResearchCenter from './components/ResearchCenter';
import TruckCustomizer from './components/TruckCustomizer';
import CityMap from './components/CityMap';
import RestockStation from './components/RestockStation';
import BailoutScreen from './components/BailoutScreen';
import CalendarScreen from './components/CalendarScreen';
import AlbaMiniGame from './components/AlbaMiniGame';
import SettingsMenu from './components/SettingsMenu';
import PatchNotes from './components/PatchNotes';
import PreFlightModal from './components/PreFlightModal';
import IntroCutscene from './components/IntroCutscene';
import SystemBootSequence from './components/SystemBootSequence';
import { GAME_VERSION, UI_STRINGS } from './constants';
import { audio } from './audioManager';

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const DEVELOPER_EMAIL = 'thuannguyen093@gmail.com';

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
  { 
    id: 'none', 
    text: '없음', 
    meaning: 'None', 
    ascii: `` 
  },
  { 
    id: 'burger', 
    text: '버거', 
    meaning: 'Burger Dome', 
    ascii: `       ___________
    .' *     *     '.
   (_____*________*__)
   {.-'_.-_.-'_.-_.-'}
   :MMMMMMMMMMM\\_/MMM:
    \\_______________/` 
  },
  { 
    id: 'fries', 
    text: '감자튀김', 
    meaning: 'French Fries', 
    ascii: `       \\\\ //||\\///   
     \\\\ \\||/||/|/ //
    |===============|
     \\             /
      \\   =====   /
       \\_________/` 
  },
  { 
    id: 'gimbap', 
    text: '김밥', 
    meaning: 'Gimbap', 
    ascii: `        __________
     .'.. : .:. '. '.
    / : /V\\ (o) : \\  \\
    | : [=] MMM . |  |
    \\  ' :.. : '  /  /
     '-._______.-'_-'` 
  },
  { 
    id: 'taco', 
    text: '타코', 
    meaning: 'Taco', 
    ascii: `        _________
      _/@_@@@_@~@@\\
     /     '    \\@@\\
    /   '     '  \\@@|
    | '    '   .  |@|
     \\_____________\\/` 
  }
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

// ASCII Art Constants
const LOGO_ASCII = `
  _  _   _   _  _  ___ _   _ _      
 | || | /_\\ | \\| |/ __| | | | |     
 | __ |/ _ \\| .  | (_ | |_| | |__   
 |_||_/_/ \\_\\_|\\_|\\___|\\___/|____|  
  ___ ___   ___  ___   _____ ___ _   _  ___ _  __
 | __/ _ \\ / _ \\|   \\ |_   _| _ \\ | | |/ __| |/ /
 | _| (_) | (_) | |) |  | | |   / |_| | (__| ' < 
 |_| \\___/ \\___/|___/   |_| |_|_\\\\___/ \\___|_|\\_\\
`;

export const getFrontViewAscii = (config: TruckConfig) => {
  // Safely grab cosmetic ASCII (fallback to defaults if undefined during migration)
  const propAscii = config.prop?.ascii || '';
  const w = config.wheel?.ascii || '(@)';
  const g = config.grill?.ascii || '==';
  const winChar = config.window?.ascii || '=';

  const wheels = config.hasDoubleTires 
    ? `    ${w}${w}             ${w}${w}` 
    : `      ${w}                ${w}`;

  return `
${propAscii}
   ______[=====]______
  |    K - B I T E    |
  |   /[${winChar.repeat(9)}]\\   |___
  |    |         |    |   \\
  |    [${winChar.repeat(9)}]    |___o|\\_
  |    _              |   _|  |
{{CHASSIS}}
${wheels}
  `;
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('BOOT');
  const [money, setMoney] = useState(100000);
  const [reputation, setReputation] = useState(0);
  const [day, setDay] = useState(0);
  const dayRef = useRef(day);
  useEffect(() => { dayRef.current = day; }, [day]);

  const [isBooting, setIsBooting] = useState(false);
  const [gas, setGas] = useState(100);
  const [dishesMastered, setDishesMastered] = useState(0);
  const [permits, setPermits] = useState<string[]>([]);
  const [unlockedUpgrades, setUnlockedUpgrades] = useState<string[]>([]);
  const [isExtendedBeltUnlocked, setIsExtendedBeltUnlocked] = useState(false);
  const [hasFryer, setHasFryer] = useState(false);
  const [hasBeverageStation, setHasBeverageStation] = useState(false);
  const [unlockedRecipes, setUnlockedRecipes] = useState<string[]>(['burger']);
  const [activeMenu, setActiveMenu] = useState<string[]>(['burger']);
  const [hasSeenResearchTutorial, setHasSeenResearchTutorial] = useState(false);
  const [hasSeenKitchenTutorial, setHasSeenKitchenTutorial] = useState(false);
  const [hasSeenMarketTutorial, setHasSeenMarketTutorial] = useState(false);
  const [hasSeenShopTutorial, setHasSeenShopTutorial] = useState(false);
  const [marketCache, setMarketCache] = useState<{ day: number, catalog: any[] }>({ day: -1, catalog: [] });
  const [inventory, setInventory] = useState<Inventory>({
    batches: [
      { id: 'bun', quantity: 12, daysLeft: -1 },
      { id: 'beef', quantity: 10, daysLeft: 3 },
      { id: 'soda', quantity: 5, daysLeft: -1 },
      { id: 'cheese', quantity: 5, daysLeft: 4 },
      { id: 'onion', quantity: 5, daysLeft: 6 }
    ],
    maxStorage: 10,
    shelfLifeModifier: 0
  });
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [truckConfig, setTruckConfig] = useState<TruckConfig>({
    adjective: TRUCK_ADJECTIVES[0], 
    color: TRUCK_COLORS[2], 
    signboard: '버거',
    prop: TRUCK_PROPS[0],
    window: TRUCK_WINDOWS[0],
    wheel: TRUCK_WHEELS[0],
    grill: TRUCK_GRILLS[0],
    underglow: TRUCK_UNDERGLOWS[0],
    hasDoubleTires: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '> SYSTEM INITIALIZED: Inherited Truck "K-BITE" detected.',
    '> STARTUP GRANT: 100,000₩ (십만 원) deposited by Small Business Bureau.',
    '> INVENTORY CHECK: Inherited stock found (12 Buns, 10 Beefs, 5 Cheese, 5 Onions).',
    '> MARKET ADVISORY: Premium Meats (Beef) restricted until Day 4 or 3-Star Rep.',
    '> LINGUISTICS: Particle Cogs [이/가] [을/를] unlocked.',
    '> TIPS: Native numbers are for items and hours. Sino are for money and minutes.'
  ]);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(() => localStorage.getItem('kbite_dev_mode') === 'true');
  const [devMode, setDevMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [showOpenShopModal, setShowOpenShopModal] = useState(false);
  const [showAlbaModal, setShowAlbaModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [skipTutorialFlag, setSkipTutorialFlag] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    romanization: true,
    crtEffects: true,
    phosphorFlash: true,
    bgmVolume: 50,
    sfxVolume: 70,
    themeColor: 'GREEN' as ThemeColor,
    isColorSettingUnlocked: false,
    unlockedThemes: ['GREEN', 'AMBER', 'CYAN', 'MONOCHROME'] as ThemeColor[]
  });

  const [stats, setStats] = useState({
    wrongParticles: 0,
    loanSharkPaid: false,
    maxDailyProfit: 0,
    universityPerfectStreak: 0,
    lifetimeRevenue: 0,
    daysPlayed: 0
  });

  const [lastUnlock, setLastUnlock] = useState<UnlockNotification | null>(null);
  const [currentServingCustomer, setCurrentServingCustomer] = useState<any>(null);
  
  // States lifted for Global Dev Control
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderQueue, setOrderQueue] = useState<any[]>([]);
  const [servingPhase, setServingPhase] = useState<'GREETING' | 'QUEUE' | 'COOKING'>('GREETING');
  const [activeQueueIndex, setActiveQueueIndex] = useState<number | null>(null);

  const THEME_PALETTES: Record<ThemeColor, { hex: string, rgb: string, scanlineOpacity?: number }> = {
    GREEN: { hex: '#00ff41', rgb: '0, 255, 65' },
    AMBER: { hex: '#ffb000', rgb: '255, 176, 0' },
    CYAN: { hex: '#00ffff', rgb: '0, 255, 255' },
    MONOCHROME: { hex: '#ffffff', rgb: '255, 255, 255' },
    CRIMSON: { hex: '#FF0000', rgb: '255, 0, 0' },
    NEON_PINK: { hex: '#FF00FF', rgb: '255, 0, 255' },
    GOLD: { hex: '#FFD700', rgb: '255, 215, 0' },
    GLITCH: { hex: '#A9A9A9', rgb: '169, 169, 169', scanlineOpacity: 0.4 }
  };

  useEffect(() => {
    const palette = THEME_PALETTES[gameSettings.themeColor] || THEME_PALETTES.GREEN;
    document.documentElement.style.setProperty('--terminal-color', palette.hex);
    document.documentElement.style.setProperty('--terminal-color-rgb', palette.rgb);
    document.documentElement.style.setProperty('--scanline-opacity', (palette.scanlineOpacity || 0.1).toString());
  }, [gameSettings.themeColor]);

  // === AUDIO ENGINE SYNC ===
  useEffect(() => {
    audio.setVolumes(gameSettings.sfxVolume, gameSettings.bgmVolume);
  }, [gameSettings.sfxVolume, gameSettings.bgmVolume]);

  useEffect(() => {
    if (gameState === 'MENU' || gameState === 'CUSTOMIZE' || gameState === 'RESEARCH') audio.playBGM('BGM_MAIN_MENU');
    else if (gameState === 'SERVING') audio.playBGM('BGM_SHIFT_NORMAL');
    else if (gameState === 'ALBA') audio.playBGM('BGM_ALBA_MINIGAME');
    else if (gameState === 'BOOT') audio.playBGM('BGM_BOOT');
    else audio.stopBGM();
  }, [gameState]);
  // =========================

  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [loanStrike, setLoanStrike] = useState(0); // 0: None, 1: Bank, 2: Shark

  const [history, setHistory] = useState<DayHistory[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([
    // Existing events
    { 
      day: 2, 
      title: 'Rain Expected', 
      koTitle: '비', 
      description: 'Rain expected tomorrow. Warm food demand +20%.', 
      type: 'WEATHER', 
      impact: 'Warm Food +20%' 
    },
    { 
      day: 7, 
      title: 'University Festival', 
      koTitle: '대학 축제', 
      description: 'Expect huge crowds and casual speech.', 
      type: 'FESTIVAL', 
      impact: 'Volume +50%' 
    },
    { 
      day: 9, 
      title: 'Monthly Rent', 
      koTitle: '월세', 
      description: 'Rent due for the truck parking space.', 
      type: 'RENT', 
      impact: '-150,000₩' 
    },

    // === CUSTOM EVENT PLACEHOLDERS (easy to replace later) ===
    {
      day: 4,
      title: 'Veggie Market Surge',
      koTitle: '채소 붐',
      description: 'Fresh vegetable trend is huge today. Customers want veggie-heavy dishes.',
      type: 'CUSTOM',
      impact: 'Veggie dishes +60% demand • Meat dishes -40%',
      demandModifiers: {
        'burger': 0.6,      // meat dishes get penalized
        'cheeseburger': 0.6,
        'kimchiburger': 0.6,
        'fries': 1.0,
        'soda': 1.0,
        'juice': 1.6        // veggie-friendly drink gets boost
      }
    },
    {
      day: 11,
      title: 'Spicy Challenge Day',
      koTitle: '매운 맛 챌린지',
      description: 'Students are craving extreme spice today.',
      type: 'CUSTOM',
      impact: 'Spicy dishes +80% demand',
      demandModifiers: {
        'kimchiburger': 1.8,
        'burger': 0.9,
        'cheeseburger': 0.9,
        'fries': 1.3
      }
    },
    {
      day: 15,
      title: 'Premium Meat Festival',
      koTitle: '프리미엄 고기 축제',
      description: 'High-end meat demand is through the roof.',
      type: 'CUSTOM',
      impact: 'Beef dishes +70% demand',
      demandModifiers: {
        'burger': 1.7,
        'cheeseburger': 1.7,
        'kimchiburger': 1.7,
        'fries': 0.8
      }
    }
  ]);

  useEffect(() => {
    loadProgress();
  }, []);

  // Shift 000 Inventory Safety Check
  useEffect(() => {
    if (day === 0 && !hasSeenShopTutorial) {
      const hasOnion = inventory.batches.some(b => b.id === 'onion');
      if (!hasOnion) {
        setInventory(prev => ({
          ...prev,
          batches: [...prev.batches, { id: 'onion', quantity: 10, daysLeft: 3 }]
        }));
        addLog('> AUTO-RESTORE: Tutorial Onion stock re-injected.');
      }
    }
  }, [day, hasSeenShopTutorial, inventory.batches.length]);

  // === PERFORMANCE POLISH: Cache expensive calculations ===
  const truckAscii = useMemo(() => {
    // replace(/^\n/, '') removes only the first empty newline without stripping the leading spaces of the burger!
    return getFrontViewAscii(truckConfig).replace(/^\n/, '').trimEnd().split('\n');
  }, [truckConfig]); // ← only re-calculate when truck actually changes

  const loadProgress = () => {
    try {
      const savedData = localStorage.getItem('kbite_save_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        setMoney(data.money || 100000);
        setReputation(data.reputation || 0);
        setDay(data.day || 0);
        setGas(data.gas ?? 100);
        setDishesMastered(data.dishesMastered || 0);
        
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
            hasDoubleTires: data.truckConfig.hasDoubleTires || false
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
          setGameSettings({
            ...gameSettings,
            ...data.gameSettings,
            isColorSettingUnlocked: data.gameSettings.isColorSettingUnlocked || false,
            unlockedThemes: data.gameSettings.unlockedThemes || ['GREEN', 'AMBER', 'CYAN', 'MONOCHROME']
          });
        }
        if (data.history) setHistory(data.history);
        if (data.inventory) {
          const migratedBatches = (data.inventory.batches || []).map((b: any) => {
            if (b.id === 'soda_stock') return { ...b, id: 'soda', daysLeft: -1 };
            return b;
          }).filter((b: any) => b.id !== 'cup');

          setInventory({
            batches: migratedBatches,
            maxStorage: data.inventory.maxStorage || 20,
            shelfLifeModifier: data.inventory.shelfLifeModifier || 0
          });
        }
        if (data.stats) {
          setStats({
            wrongParticles: data.stats.wrongParticles || 0,
            loanSharkPaid: data.stats.loanSharkPaid || false,
            maxDailyProfit: data.stats.maxDailyProfit || 0,
            universityPerfectStreak: data.stats.universityPerfectStreak || 0,
            lifetimeRevenue: data.stats.lifetimeRevenue || 0,
            daysPlayed: data.stats.daysPlayed || 0
          });
        }
        addLog('Progress loaded from local storage.');
      } else {
        addLog('No local save found. Starting fresh.');
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      addLog('Error reading local save data.');
    }
  };

  const saveProgress = () => {
    setIsSaving(true);
    try {
      const progressData = {
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
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('kbite_save_data', JSON.stringify(progressData));
      console.log("✅ Local save successful");
    } catch (error) {
      console.error("❌ Storage save failed:", error);
      addLog("⚠️ Local save failed — storage might be full");
    } finally {
      // Artificial delay so the user actually sees the saving indicator flash
      setTimeout(() => setIsSaving(false), 600); 
    }
  };

  // Auto-save on important changes (Removed user/isAuthReady dependencies)
  useEffect(() => {
    const timeout = setTimeout(() => saveProgress(), 800);
    return () => clearTimeout(timeout);
  }, [money, reputation, day, gas, dishesMastered, inventory, permits, unlockedUpgrades, truckConfig, unlockedRecipes, gameSettings, hasSeenResearchTutorial, hasSeenKitchenTutorial, hasSeenMarketTutorial, hasSeenShopTutorial]);

  // Market Unlock Notifications
  useEffect(() => {
    if (day === 4 || reputation === 60) {
      addLog('MARKET UPDATE: Wholesale Market now offering Premium Meats (Beef)!');
    }
  }, [day, reputation]);

  const isDeveloper = false;

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  const unlockTheme = (theme: ThemeColor) => {
    if (!gameSettings.unlockedThemes.includes(theme)) {
      setGameSettings(prev => ({
        ...prev,
        unlockedThemes: [...prev.unlockedThemes, theme]
      }));
      
      const milestoneMap: Record<ThemeColor, { milestone: string, reward: string }> = {
        GOLD: { milestone: 'Chaebol Executive', reward: 'CRT PHOSPHOR COLOR: GOLD / YELLOW' },
        GLITCH: { milestone: 'Syntax Error', reward: 'CRT PHOSPHOR COLOR: GLITCH GREY' },
        NEON_PINK: { milestone: 'Night Market', reward: 'CRT PHOSPHOR COLOR: NEON PINK' },
        CRIMSON: { milestone: 'Loan Shark', reward: 'CRT PHOSPHOR COLOR: CRIMSON RED' },
        GREEN: { milestone: '', reward: '' },
        AMBER: { milestone: '', reward: '' },
        CYAN: { milestone: '', reward: '' },
        MONOCHROME: { milestone: '', reward: '' }
      };

      if (milestoneMap[theme].milestone) {
        setLastUnlock({
          milestone: milestoneMap[theme].milestone,
          reward: milestoneMap[theme].reward,
          theme
        });
      }

      addLog(`SYSTEM: New Terminal Theme Unlocked: ${theme}!`);
    }
  };

  const handleServingComplete = (totalEarned: number, totalRepBonus: number, sessionStats?: { wrongParticles: number, perfectStreak: number }) => {
    if (!hasSeenShopTutorial) {
      setHasSeenShopTutorial(true);
      setGameSettings(prev => ({ ...prev, isColorSettingUnlocked: true }));
    }

    // === NEW: Apply custom event demand modifiers ===
    let demandMultiplier = 1.0;
    const todayEvent = events.find(e => e.day === day && e.demandModifiers);
    
    if (todayEvent?.demandModifiers) {
      // For simplicity we apply the highest modifier present in the current order
      // (you can make this more advanced later)
      demandMultiplier = Math.max(1.0, ...Object.values(todayEvent.demandModifiers) as number[]);
      addLog(`EVENT BOOST: ${todayEvent.title} → ×${demandMultiplier.toFixed(1)} earnings`);
    }

    // === ECONOMY IMPROVEMENT: Clear breakdown ===
    const baseEarnings = totalEarned;
    const tip = Math.floor(baseEarnings * (sessionStats?.perfectStreak && sessionStats.perfectStreak >= 3 ? 0.25 : 0.12));
    const locationBonus = currentLocation?.id === 'univ' ? Math.floor(baseEarnings * 0.15) : 0;
    const repMultiplierBonus = Math.floor(baseEarnings * (reputation / 200)); // max ~50% at 100 rep

    const finalEarned = Math.round((baseEarnings + tip + locationBonus + repMultiplierBonus) * demandMultiplier);

    // Apply the improved earnings
    setMoney(prev => prev + finalEarned);
    setReputation(prev => Math.max(0, Math.min(100, prev + totalRepBonus)));

    setCurrentServingCustomer(null);

    addLog(`Shift complete. Total Earned: ${finalEarned.toLocaleString()}₩`);

    // Add to history (your existing summary will now show the richer number)
    setHistory(prev => [...prev, { 
      day, 
      earnings: finalEarned, 
      isAlba: false, 
      clear: true 
    }]);

    // Theme unlocks
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
          : prev.universityPerfectStreak
      }));
    }

    // Advance day
    advanceDay();
    
    if (day === 0) {
      setGameState('MENU');
      addLog('> ORIENTATION COMPLETE. Full system access granted.');
    } else {
      setGameState('CALENDAR');
    }
  };

  const spawnTestCustomer = (type: string) => {
    const uniqueId = `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const testCustomer: Customer = {
      id: uniqueId,
      name: 'Test Customer',
      type: 'STANDARD',
      order: type,
      targetItems: [{ 
        type: type, 
        completed: false, 
        isCompleted: false,
        instanceId: uniqueId   // now truly unique
      }],
      count: 1,
      picky: false,
      modifiers: type === 'spicy' ? ['매운 소스'] : type === 'onion' ? ['양파'] : [],
      negatedModifiers: [],
      rawOrder: type === 'burger' ? "버거 하나 주세요" : 
                type === 'cheeseburger' ? "치즈버거 주세요" : 
                type === 'fries' ? "감자튀김 주세요" : 
                type === 'kimchiburger' ? "김치버거 주세요" : 
                type === 'spicy' ? "매운 소스 넣은 버거" : "양파 넣은 버거",
      politenessRequired: 'POLITE',
      ticketId: 999
    };

    setCustomer(testCustomer);
    setServingPhase('GREETING');
    setOrderQueue([testCustomer.targetItems[0]]);   // make sure it's an array with the unique item
    setActiveQueueIndex(0);
    addLog(`DEV: Spawned test customer - ${type}`);
  };

  const checkBankruptcy = (currentMoney: number, currentInventory: Inventory, currentGas: number): boolean => {
    const activeSlots = new Set(currentInventory.batches.map(b => b.id)).size;
    // Bankruptcy condition: No money to buy anything, no stock to sell, no gas to move
    if (currentMoney < 500 && activeSlots === 0 && currentGas < 10) {
      if (!activeLoan) {
        return true; // Triggers the Bailout Screen
      }
      addLog('CRITICAL: No funds or stock left. Consider taking an Alba (Part-time job).');
    }
    return false;
  };

  const advanceDay = () => {
    setDay(prevDay => {
      const nextDay = prevDay + 1;
      
      setStats(prevStats => {
        return {
          ...prevStats,
          daysPlayed: prevStats.daysPlayed + 1
        };
      });

      // === IMPROVED LOAN HANDLING ===
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
              if (prevLoan.type === 'BANK') {
                setGameState('BAILOUT');
              } else {
                setGameState('GAME_OVER');
              }
              return prevMoney;
            }
          });
          return null;
        } else {
          if (remaining === 1) {
            addLog(`URGENT: ${prevLoan.type} loan due TOMORROW (${prevLoan.totalDue.toLocaleString()}₩)`);
          } else {
            addLog(`LOAN REMINDER: ${prevLoan.totalDue.toLocaleString()}₩ due in ${remaining} days.`);
          }
          return { ...prevLoan, daysRemaining: remaining };
        }
      });

      // === IMPROVED RENT (scales with day) ===
      const baseRent = 80000 + (nextDay * 8000);
      const rentEvent = events.find(e => e.day === nextDay && e.type === 'RENT');
      
      if (rentEvent) {
        setMoney(prevMoney => {
          if (prevMoney >= baseRent) {
            addLog(`RENT PAID: ${baseRent.toLocaleString()}₩ deducted for parking space.`);
            return prevMoney - baseRent;
          } else {
            addLog(`RENT DEFAULT: Could not pay ${baseRent.toLocaleString()}₩ rent! Reputation -15.`);
            setReputation(prevRep => Math.max(0, prevRep - 15));
            return prevMoney;
          }
        });
      }

      // Spoilage + storage check
      setInventory(prevInv => {
        if (prevDay < 3) return prevInv;

        const processedBatches = prevInv.batches
          .map(b => ({
            ...b,
            daysLeft: b.daysLeft > 0 ? b.daysLeft - 1 : b.daysLeft
          }))
          .filter(b => b.quantity > 0);
        
        const spoiledCount = processedBatches.filter(b => b.daysLeft === 0).length;
        const finalBatches = processedBatches.filter(b => b.daysLeft !== 0); // BUG 3 FIX: ACTUALLY REMOVE SPOILED ITEMS
        
        if (spoiledCount > 0) {
          const penalty = Math.min(8, spoiledCount * 2);
          setReputation(r => Math.max(0, r - penalty));
          addLog(`SPOILAGE: ${spoiledCount} batches spoiled & discarded. Reputation -${penalty}`);
        }
        
        const activeSlots: number = (Object.values(finalBatches.reduce((acc, b) => {
          acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc;
        }, {} as Record<string, number>)) as number[]).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);
        if (activeSlots >= prevInv.maxStorage) {
          addLog(UI_STRINGS.LOG_MESSAGES.storageWarning(activeSlots, prevInv.maxStorage));
        } else {
          addLog(UI_STRINGS.LOG_MESSAGES.storageCheck(activeSlots, prevInv.maxStorage));
        }
        
        setMoney(prevMoney => {
          checkBankruptcy(prevMoney, { ...prevInv, batches: finalBatches }, gas);
          return prevMoney;
        });

        return { ...prevInv, batches: finalBatches };
      });

      addLog(UI_STRINGS.LOG_MESSAGES.dayStarted(nextDay));
      return nextDay;
    });
  };

  const handleAlbaComplete = (earned: number) => {
    setMoney(prev => prev + earned);
    setHistory(prev => [...prev, { day, earnings: earned, isAlba: true, clear: true }]);
    setGameState('MENU');
    addLog(`ALBA COMPLETE: Earned ${earned.toLocaleString()}₩. Funds updated.`);
  };

  const handleUnlockRecipe = (recipeId: string) => {
    if (!unlockedRecipes.includes(recipeId)) {
      setUnlockedRecipes(prev => [...prev, recipeId]);
      setDishesMastered(prev => prev + 1);
      addLog(`KITCHEN: Recipe "${recipeId}" synthesized. New menu item unlocked!`);
      setReputation(prev => Math.min(100, prev + 5));
    }
  };

  const handleResearchComplete = (upgrade: Upgrade) => {
    const isTutorialRefund = !hasSeenResearchTutorial && upgrade.id === '11';
    if (!isTutorialRefund) {
      setMoney(prev => prev - upgrade.cost);
    } else {
      addLog(`TUTORIAL BONUS: Research cost for ${upgrade.name} refunded!`);
    }
    setUnlockedUpgrades(prev => [...prev, upgrade.id]);
    
    if (upgrade.id === '3') {
      setIsExtendedBeltUnlocked(true);
      addLog('TRUCK UPGRADE: Advanced SOV Engine installed. Location slots unlocked.');
    }

    if (upgrade.id === '11') {
      setHasFryer(true);
      addLog('EQUIPMENT UNLOCKED: Deep Fryer installed. You can now cook fries!');
    }

    if (upgrade.id === '13') {
      setHasBeverageStation(true);
      addLog('EQUIPMENT UNLOCKED: Beverage Station installed. Soda and Juice unlocked!');
    }
    
    if (upgrade.id === '1') { // Assuming '1' is double tires for this example
      setTruckConfig(prev => ({ ...prev, hasDoubleTires: true }));
    }
    
    if (upgrade.id === '8') {
      setInventory(prev => ({ ...prev, maxStorage: prev.maxStorage + 5 }));
      addLog('TRUCK UPGRADE: Wide Prep Board installed. +5 Dry Slots.');
    } else if (upgrade.id === '4') {
      setInventory(prev => ({ ...prev, maxStorage: 30 }));
      addLog('TRUCK UPGRADE: Chassis expanded to 30 slots.');
    } else if (upgrade.id === '5') {
      setInventory(prev => ({ ...prev, shelfLifeModifier: 2 }));
      addLog('TRUCK UPGRADE: Mini-Fridge installed. Freshness extended.');
    } else if (upgrade.id === '6') {
      setPermits(prev => [...prev, 'business']);
      addLog('PERMIT ACQUIRED: Business District access granted.');
    } else if (upgrade.id === '7') {
      setPermits(prev => [...prev, 'univ']);
      addLog('PERMIT ACQUIRED: Campus Parking Permit granted.');
    } else if (upgrade.id === '12') {
      setPermits(prev => [...prev, 'park']);
      addLog('PERMIT ACQUIRED: Park Sector Permit granted.');
    } else if (upgrade.id === '9') {
      addLog('TRUCK UPGRADE: Auto-Fryer installed. Object particles automated.');
    }
    
    addLog(`Research started: ${upgrade.name}. Cost: ${upgrade.cost} KRW.`);
    // Stay in the Research menu so the user can see Tutorial Step 2 or buy more upgrades!
  };

  const handleCustomizeComplete = (newConfig: TruckConfig, cost: number) => {
    setTruckConfig(newConfig);
    setMoney(prev => prev - cost);
    addLog(`TUNING COMPLETE: Truck updated to [${newConfig.adjective.text} ${newConfig.color.text}]. Cost: ${cost.toLocaleString()}₩`);
    setGameState('MENU');
  };

  const handleBailoutAccept = () => {
    const type: LoanType = loanStrike === 0 ? 'BANK' : 'SHARK';
    const principal = 50000;
    const interest = type === 'BANK' ? 0.18 : 0.45;           // lowered slightly for better feel
    const totalDue = Math.round(principal * (1 + interest) / 100) * 100;
    const dueDate = type === 'BANK' ? 4 : 3;                 // one extra day of breathing room

    const newLoan: Loan = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      principal,
      interestRate: interest,
      totalDue,
      daysRemaining: dueDate,
      isPaid: false
    };

    setMoney(prev => prev + principal);
    setActiveLoan(newLoan);
    setLoanStrike(prev => prev + 1);
    setGameState('MENU');
    addLog(`LOAN ACCEPTED: Received ${principal.toLocaleString()}₩. Repay ${totalDue.toLocaleString()}₩ in ${dueDate} days.`);
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
  };

  const restartGame = async () => {
    const freshMoney = 100000;
    const freshRep = 0;
    const freshDay = 0;
    const freshGas = 100;
    const freshInventory: Inventory = {
      batches: [
        { id: 'bun', quantity: 12, daysLeft: -1 },
        { id: 'beef', quantity: 10, daysLeft: 3 },
        { id: 'soda', quantity: 5, daysLeft: -1 },
        { id: 'cheese', quantity: 5, daysLeft: 4 },
        { id: 'onion', quantity: 5, daysLeft: 6 }
      ],
      maxStorage: 5,
      shelfLifeModifier: 0
    };
    const freshTruck: TruckConfig = {
      adjective: TRUCK_ADJECTIVES[0], 
      color: TRUCK_COLORS[2], 
      signboard: '버거',
      prop: TRUCK_PROPS[0],
      window: TRUCK_WINDOWS[0],
      wheel: TRUCK_WHEELS[0],
      grill: TRUCK_GRILLS[0],
      underglow: TRUCK_UNDERGLOWS[0],
      hasDoubleTires: false
    };

    setMoney(freshMoney);
    setReputation(freshRep);
    setDay(freshDay);
    setGas(freshGas);
    setDishesMastered(0);
    setUnlockedRecipes(['burger']);
    setPermits([]);
    setUnlockedUpgrades([]);
    setIsExtendedBeltUnlocked(false);
    setHasFryer(false);
    setHasBeverageStation(false);
    setGameSettings(prev => ({ ...prev, isColorSettingUnlocked: false, themeColor: 'GREEN' }));
    setInventory(freshInventory);
    setTruckConfig(freshTruck);
    setActiveLoan(null);
    setLoanStrike(0);
    setHistory([]);
    setGameState('MENU');
    setLogs([
      '> SYSTEM REBOOT COMPLETE: Logistics initialized.',
      '> STARTUP GRANT: 100,000₩ (십만 원) redeployed.',
      '> INVENTORY CHECK: Inherited stock found (12 Buns, 10 Beefs, 5 Cheese, 5 Onions).',
      '> LINGUISTICS: Particle Cogs [이/가] [을/를] online.'
    ]);
  };

  const handleRestockComplete = (newMoney: number, newInventory: Inventory, newGas: number, repChange: number = 0) => {
    setMoney(newMoney);
    setInventory(newInventory);
    setGas(newGas);
    if (repChange !== 0) {
      setReputation(prev => Math.max(0, Math.min(100, prev + repChange)));
      addLog(`Inventory cleaned. Reputation: ${repChange > 0 ? '+' : ''}${repChange}`);
    }
    addLog('Restock complete. Inventory updated.');
    
    // Check bankruptcy after restock (in case they spent all money and have no stock)
    const needsBailout = checkBankruptcy(newMoney, newInventory, newGas);
    
    if (needsBailout) {
      addLog('CRITICAL: Bankruptcy imminent. Initiating Bailout Protocol...');
      setGameState('BAILOUT');
    } else {
      setGameState('MENU');
    }
  };

  const handleUpdateInventory = (newInventory: Inventory) => {
    setInventory(newInventory);
  };

  const handleLocationSelect = (location: Location) => {
    setGas(prev => Math.max(0, Math.min(100, prev - location.fuelCost)));
    setCurrentLocation(location);
    addLog(`Deployed to ${location.name}. Fuel: -${location.fuelCost}%`);
    setGameState('SERVING');
  };

  const handleIntroComplete = (skipTutorial: boolean = false) => {
    setSkipTutorialFlag(skipTutorial);
    setShowIntro(false);
    setIsBooting(true);
  };

  const startActualShift = () => {
    setIsBooting(false);
    localStorage.setItem('hasCompletedIntro', 'true');

    if (skipTutorialFlag) {
      setDay(1);
      setHasSeenShopTutorial(true);
      setHasSeenKitchenTutorial(true);
      setHasSeenResearchTutorial(true);
      setHasSeenMarketTutorial(true);
      setGameSettings(prev => ({ ...prev, isColorSettingUnlocked: true }));
      setGameState('MENU');
      addLog('> TUTORIAL SKIPPED. Advancing to Day 001...');
      return;
    }
    
    // Start Shop Operations Tutorial (Shift 000)
    const residenceLoc: Location = {
      id: 'residence',
      name: 'Residential Area',
      koName: '주택가',
      description: 'Neighbors, kids, and local elders. A quiet, forgiving starting zone.',
      demographic: 'Locals (동네 사람) & Families',
      politeness: 'POLITE',
      focus: 'Standard Polite (해요체 / ~요)',
      trending: ['Warm (따뜻한)', 'Home-cooked'],
      incomeLevel: 'Low',
      orderComplexity: 'Simple',
      distanceKm: 0,
      fuelCost: 0,
      openTime: 660,
      closeTime: 1140,
      rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }]
    };
    
    setCurrentLocation(residenceLoc);
    setGameState('SERVING');
    setDay(0);
    addLog('> ORIENTATION PROTOCOL: Initializing Shift 000...');
  };

  return (
    <div className={`h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0c0c0c] ${gameSettings.crtEffects ? 'crt-enabled' : ''}`}>
      {showIntro && <IntroCutscene onComplete={handleIntroComplete} />}
      {isBooting && <SystemBootSequence onComplete={startActualShift} isFastBoot={skipTutorialFlag} truckConfig={truckConfig} />}
      
      {/* === ULTIMATE DEV MODE PANEL === */}
      {isDeveloper && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
          <button 
            onClick={() => {
              setDevMode(!devMode);
              if (!devMode) localStorage.setItem('kbite_dev_mode', 'true');
              else localStorage.removeItem('kbite_dev_mode');
            }}
            className="px-3 py-1.5 bg-black border-2 border-yellow-400 text-yellow-400 font-bold text-xs hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2"
          >
            <Wrench size={14} />
            DEV MODE {devMode ? 'ON' : 'OFF'}
          </button>

          <AnimatePresence>
            {devMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="w-80 bg-black/95 border-2 border-yellow-400 p-4 font-mono text-xs shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                  <Terminal size={14} /> DEVELOPER CONSOLE
                </div>

                <div className="space-y-6">
                  {/* Quick Money & Rep */}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setMoney(m => m + 1000000); addLog("DEV: +1,000,000₩"); }}
                      className="bg-terminal/10 hover:bg-terminal/30 p-2 border border-terminal/30">+1M KRW</button>
                    <button onClick={() => { setReputation(r => Math.min(100, r + 50)); addLog("DEV: +50 REP"); }}
                      className="bg-terminal/10 hover:bg-terminal/30 p-2 border border-terminal/30">+50 REP</button>
                  </div>

                  {/* Spawn Specific Customer */}
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">SPAWN CUSTOMER</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => spawnTestCustomer('burger')} 
                        className="bg-green-900/30 hover:bg-green-900/50 p-2 border border-green-400 text-xs">Burger Only</button>
                      <button onClick={() => spawnTestCustomer('cheeseburger')} 
                        className="bg-green-900/30 hover:bg-green-900/50 p-2 border border-green-400 text-xs">Cheeseburger</button>
                      <button onClick={() => spawnTestCustomer('fries')} 
                        className="bg-green-900/30 hover:bg-green-900/50 p-2 border border-green-400 text-xs">Fries</button>
                      <button onClick={() => spawnTestCustomer('kimchiburger')} 
                        className="bg-green-900/30 hover:bg-green-900/50 p-2 border border-green-400 text-xs">Kimchi Burger</button>
                      <button onClick={() => spawnTestCustomer('spicy')} 
                        className="bg-red-900/30 hover:bg-red-900/50 p-2 border border-red-400 text-xs">Spicy Burger</button>
                      <button onClick={() => spawnTestCustomer('onion')} 
                        className="bg-red-900/30 hover:bg-red-900/50 p-2 border border-red-400 text-xs">Onion Burger</button>
                    </div>
                  </div>

                  {/* Skip to Day X - NOW properly triggers rent/loan/events */}
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">SKIP TO DAY</div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        id="dev-day-input"
                        defaultValue={day + 1}
                        className="bg-black border border-yellow-400 text-yellow-400 w-16 text-center"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('dev-day-input') as HTMLInputElement;
                          let target = parseInt(input.value);
                          if (target <= dayRef.current) return;

                          addLog(`DEV: Fast-forwarding ${target - dayRef.current} days...`);

                          // Properly simulate each day so rent, loans, spoilage, etc. all trigger
                          const skipDays = () => {
                            if (dayRef.current >= target) {
                              addLog(`DEV: Arrived at Day ${target}`);
                              return;
                            }
                            advanceDay();           // ← this runs ALL your economy logic
                            // Small delay so React can update state cleanly
                            setTimeout(skipDays, 10);
                          };

                          skipDays();
                        }}
                        className="flex-1 bg-yellow-400 text-black font-bold py-1 text-xs"
                      >
                        JUMP TO DAY
                      </button>
                    </div>
                  </div>

                  {/* End Shift with Custom Earnings */}
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">FORCE END SHIFT</div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        id="dev-earnings"
                        defaultValue="45000"
                        placeholder="Money"
                        className="bg-black border border-terminal text-terminal flex-1 text-center"
                      />
                      <input 
                        type="number" 
                        id="dev-rep"
                        defaultValue="25"
                        placeholder="Rep"
                        className="bg-black border border-terminal text-terminal w-16 text-center"
                      />
                      <button 
                        onClick={() => {
                          const earningsInput = document.getElementById('dev-earnings') as HTMLInputElement;
                          const repInput = document.getElementById('dev-rep') as HTMLInputElement;
                          const earnings = parseInt(earningsInput.value) || 0;
                          const rep = parseInt(repInput.value) || 0;
                          handleServingComplete(earnings, rep, { wrongParticles: 0, perfectStreak: 5 });
                          addLog(`DEV: Force ended shift (+${earnings}₩, +${rep} REP)`);
                        }}
                        className="bg-pink-600 text-white px-4 text-xs font-bold"
                      >
                        END
                      </button>
                    </div>
                  </div>

                  {/* Quick Full Unlock */}
                  <button onClick={() => {
                    setUnlockedRecipes(['burger','cheeseburger','fries','kimchiburger','soda','juice']);
                    setHasFryer(true);
                    setHasBeverageStation(true);
                    setHasSeenShopTutorial(true);
                    setHasSeenKitchenTutorial(true);
                    setHasSeenResearchTutorial(true);
                    setHasSeenMarketTutorial(true);
                    setGameSettings(prev => ({...prev, isColorSettingUnlocked: true}));
                    addLog("DEV: UNLOCKED EVERYTHING");
                  }} className="w-full bg-red-600 text-white py-2 text-xs font-bold mb-2">UNLOCK ALL CONTENT</button>

                  {/* Force Bankruptcy for testing Loans */}
                  <button onClick={() => {
                    setMoney(0);
                    setGas(0);
                    setInventory(prev => ({ ...prev, batches: [] }));
                    setGameState('BAILOUT');
                    addLog("DEV: FORCED BANKRUPTCY (BAILOUT TRIGGERED)");
                  }} className="w-full bg-orange-600 text-white py-2 text-xs font-bold mb-6">FORCE BANKRUPTCY (TEST LOAN)</button>

                  <button onClick={restartGame} className="w-full border border-red-500 text-red-400 py-2 text-xs">FULL GAME RESET</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* SAVING INDICATOR */}
      <AnimatePresence>
        {isSaving && (
          <motion.div 
            key="saving-indicator"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-black/80 border border-terminal text-terminal px-3 py-1 text-xs font-mono rounded-none shadow-[0_0_15px_rgba(0,255,65,0.2)]"
          >
            <span className="inline-block w-3 h-3 border-2 border-terminal border-r-transparent rounded-full animate-spin"></span>
            💾 SAVING…
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsMenu 
            key="settings-menu"
            onClose={() => setShowSettings(false)} 
            settings={gameSettings} 
            onUpdate={setGameSettings} 
            onResetData={restartGame} 
            onReplayIntro={() => setShowIntro(true)}
          />
        )}
        {showPatchNotes && (
          <PatchNotes key="patch-notes" onClose={() => setShowPatchNotes(false)} />
        )}
        {showOpenShopModal && (
          <PreFlightModal
            isOpen={showOpenShopModal}
            onClose={() => setShowOpenShopModal(false)}
            onDeploy={(loc) => {
              setShowOpenShopModal(false);
              handleLocationSelect(loc);
            }}
            inventory={inventory}
            unlockedRecipes={unlockedRecipes}
            activeMenu={activeMenu}
            onUpdateMenu={setActiveMenu}
            selectedLocation={currentLocation || {
              id: 'residence',
              name: 'Residential Area',
              koName: '주택가',
              description: 'Neighbors, kids, and local elders. A quiet, forgiving starting zone.',
              demographic: 'Locals (동네 사람) & Families',
              politeness: 'POLITE',
              focus: 'Standard Polite (해요체 / ~요)',
              trending: ['Warm (따뜻한)', 'Home-cooked'],
              incomeLevel: 'Low',
              orderComplexity: 'Simple',
              distanceKm: 0,
              fuelCost: 0,
              openTime: 660,
              closeTime: 1140,
              rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }],
            }}
            currentFuel={gas}
          />
        )}

        {showAlbaModal && (
          <div key="alba-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              key="alba-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md border-2 border-yellow-500 bg-[#0c0c0c] p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] space-y-6 font-mono"
            >
              <div className="text-center border-b border-yellow-500/30 pb-4">
                <h2 className="text-xl font-bold tracking-widest uppercase text-yellow-500">[ ALBA CONTRACT ]</h2>
                <p className="text-[10px] opacity-60 text-yellow-500/70">EMPLOYMENT TERMS & CONDITIONS</p>
              </div>

              <div className="space-y-4 text-yellow-500/90">
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-widest border-b border-yellow-500/20 pb-2">PAYMENT STRUCTURE:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>BASE WAGE:</span>
                      <span className="font-bold">0₩</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>PER DISH WASHED:</span>
                      <span className="font-bold">1,000₩</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] leading-relaxed opacity-80 italic">
                  WARNING: Performance is strictly monitored. Failure to wash any dishes will result in immediate termination without pay. 
                  This shift does not advance the calendar day.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowAlbaModal(false)}
                  className="py-3 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition-all text-xs font-bold"
                >
                  [ NEVERMIND ]
                </button>
                <button 
                  onClick={() => {
                    setShowAlbaModal(false);
                    setGameState('ALBA');
                  }}
                  className="py-3 bg-yellow-500 text-black font-bold text-xs hover:scale-105 transition-all"
                >
                  [ GRAB THE SPONGE ]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {gameState === 'BOOT' && (
          <motion.div
            key="boot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-8"
          >
            <pre className="ascii-art terminal-glow text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs" style={{ color: 'var(--terminal-color)' }}>
              {LOGO_ASCII}
            </pre>

            {/* TRUCK RENDER FIX */}
            <div className="flex flex-col items-center">
              <pre 
                className="ascii-art text-[6px] sm:text-[8px] md:text-[10px] leading-tight transition-colors duration-500 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)] z-10 opacity-70" 
                style={{ 
                  color: 'var(--terminal-color)',
                  whiteSpace: 'pre', /* Forces strict space rendering */
                  textAlign: 'left'  /* Prevents flexbox centering from crushing the lines */
                }}
              >
                {getFrontViewAscii(truckConfig).replace(/^\n/, '').split('\n').map((line, i) => (
                  <div key={`boot-truck-${i}`}>
                    {line.includes('{{CHASSIS}}') ? (
                      <React.Fragment>
                        {'  =|'}
                        <span style={(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? { color: truckConfig.underglow.hex, textShadow: `0 0 8px ${truckConfig.underglow.hex}` } : {}}>
                          {(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? '==' : '__'}
                        </span>
                        {'/ \\'}
                        <span style={(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? { color: truckConfig.underglow.hex, textShadow: `0 0 8px ${truckConfig.underglow.hex}` } : {}}>
                          {truckConfig.underglow?.ascii || '_____________'}
                        </span>
                        {'|__/ \\_'}
                        {truckConfig.grill?.ascii || '=='}
                      </React.Fragment>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </pre>
            </div>
            
            <div className="flex flex-col space-y-4 max-w-xs mx-auto">
              <MenuButton 
                icon={<Play size={20} />} 
                label="START SYSTEM" 
                onClick={() => {
                  const hasCompleted = localStorage.getItem('hasCompletedIntro') === 'true';
                  if (!hasCompleted) {
                    setShowIntro(true);
                  } else {
                    setGameState('MENU');
                  }
                }} 
              />
              <MenuButton icon={<Settings size={20} />} label="SETTINGS" onClick={() => setShowSettings(true)} />
              <MenuButton icon={<BookOpen size={20} />} label="PATCH NOTES" onClick={() => setShowPatchNotes(true)} />
            </div>

            <div className="text-xs opacity-50 mt-8">
              [SYSTEM READY] {GAME_VERSION}
            </div>
          </motion.div>
        )}

        {gameState === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-4xl font-mono space-y-0"
            style={{ color: 'var(--terminal-color)' }}
          >
            {/* Header */}
            <div className="border-y-2 border-terminal py-1 px-4 flex justify-between items-center bg-terminal/5">
              <span className="font-bold tracking-widest">[ K-BITE TYCOON ]  MAIN MENU</span>
              <div className="flex items-center space-x-4">
                {currentLocation && <span className="text-[10px] text-yellow-500 font-bold tracking-widest">LOC: {currentLocation.koName}</span>}
                <span className="font-bold">[ D A Y : {day.toString().padStart(3, '0')} ]</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="border-b-2 border-terminal py-2 px-4 grid grid-cols-2 gap-4 text-[10px] sm:text-xs">
              <div className="space-y-1">
                <div>FUNDS: {money.toLocaleString()}₩ ({toSinoKorean(money)} 원)</div>
                <div>REPUTATION: {'★'.repeat(Math.max(0, Math.min(5, Math.floor(reputation/20)))).padEnd(5, '☆')} ({reputation}/100)</div>
                {activeLoan && (
                  <div className="text-[10px] text-red-400 font-bold">
                    LOAN DUE IN {activeLoan.daysRemaining} DAYS
                  </div>
                )}
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <span>GAS: [{'|'.repeat(Math.max(0, Math.min(10, Math.floor(gas/10)))).padEnd(10, ' ')}] {gas}%</span>
                  <span className="text-yellow-500">({gas >= 100 ? 'Sino' : 'Native'}: {toNativeKorean(gas)})</span>
                </div>
                {(() => {
                  const currentSlots: number = (Object.values(inventory.batches.reduce((acc, b) => { acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc; }, {} as Record<string, number>)) as number[]).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);
                  return (
                    <div className="flex items-center justify-end space-x-2">
                      <span>STORAGE: {currentSlots} / {inventory.maxStorage} SLOTS</span>
                      <span className="text-yellow-500">(Native: {toNativeKorean(currentSlots)})</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Visual Section: Truck Schematic */}
            <div className="border-b-2 border-terminal px-6 pt-0 pb-4 flex flex-col md:flex-row items-end justify-between relative overflow-hidden bg-black/40 min-h-[200px] gap-8">
              
              {/* Left Side: Truck */}
              <div className="flex flex-col items-center justify-end h-full">
                <pre 
                  className="ascii-art text-[8px] sm:text-[10px] md:text-xs leading-tight transition-colors duration-500 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)] z-10 mt-2"
                  style={{ color: truckConfig.color?.hex || '#00ff41' }}
                >
                  {truckAscii.map((line, i) => (
                    <div key={`truck-ascii-${i}`}>
                      {line.includes('{{CHASSIS}}') ? (
                        <React.Fragment>
                          {'  =|'}
                          <span style={(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? { color: truckConfig.underglow.hex, textShadow: `0 0 8px ${truckConfig.underglow.hex}` } : {}}>
                            {(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? '==' : '__'}
                          </span>
                          {'/ \\'}
                          <span style={(truckConfig.underglow && truckConfig.underglow.id !== 'none') ? { color: truckConfig.underglow.hex, textShadow: `0 0 8px ${truckConfig.underglow.hex}` } : {}}>
                            {truckConfig.underglow?.ascii || '_____________'}
                          </span>
                          {'|__/ \\_'}
                          {truckConfig.grill?.ascii || '=='}
                        </React.Fragment>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </pre>
              </div>

              {/* Right Side: Dynamic Sliding Mini-Calendar */}
              <div className="flex-1 w-full h-full flex gap-1 min-h-[180px]">
                {Array.from({ length: 7 }).map((_, i) => {
                  // i=0 is Yesterday, i=1 is Today, i=2-6 are Future Days
                  const calDay = day - 1 + i;
                  
                  // Handle pre-game days (e.g., if day=0, Yesterday is -1)
                  if (calDay < 0) {
                    return (
                      <div key={`cal-empty-${i}`} className="flex-1 border border-terminal/10 flex flex-col bg-black/20 opacity-20">
                        <div className="text-center border-b border-terminal/10 py-1">
                          <div className="text-[10px] font-bold">---</div>
                          <div className="text-[10px]">-</div>
                        </div>
                      </div>
                    );
                  }

                  const enWeekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                  const koWeekDays = ['월', '화', '수', '목', '금', '토', '일'];
                  
                  // Day 1 is Monday. Safe modulo math to find the correct weekday index:
                  const dayIndex = (((calDay - 1) % 7) + 7) % 7;
                  const wdEn = enWeekDays[dayIndex];
                  const wdKo = koWeekDays[dayIndex];

                  const isToday = calDay === day;
                  const isPast = calDay < day;
                  const dayHistory = history.find(h => h.day === calDay);
                  const dayEvent = events.find(e => e.day === calDay);

                  return (
                    <div key={`cal-day-${calDay}`} className={`flex-1 border ${isToday ? 'border-terminal bg-terminal/5 shadow-[0_0_10px_rgba(0,255,65,0.05)]' : 'border-terminal/20'} flex flex-col bg-black/60 transition-all`}>
                      {/* Day Header */}
                      <div className={`text-center border-b ${isToday ? 'border-terminal bg-terminal/10' : 'border-terminal/20'} py-1`}>
                        <div className={`text-[10px] font-bold ${isToday ? 'text-terminal' : 'text-white'}`}>{wdEn}</div>
                        <div className="text-[10px] opacity-70">{wdKo}</div>
                      </div>
                      
                      {/* Day Body */}
                      <div className="p-1.5 flex flex-col flex-1 text-[9px] relative overflow-hidden">
                        <div className="w-full flex justify-between items-start mb-2">
                          <span className={isToday ? 'font-bold text-terminal text-[10px]' : 'opacity-70'}>{calDay}일</span>
                          {isToday && <span className="bg-terminal text-black px-1 font-bold tracking-tighter shadow-[0_0_5px_rgba(0,255,65,0.3)]">TODAY</span>}
                        </div>
                        
                        <div className="flex flex-col items-center justify-center flex-1 text-center space-y-1">
                          {isPast && dayHistory ? (
                            <>
                              <div className="text-terminal font-bold text-[10px]">
                                +{(dayHistory.earnings / 10000).toFixed(1)}만₩
                              </div>
                              <div className="opacity-50 tracking-widest text-[8px]">(Clear)</div>
                            </>
                          ) : dayEvent ? (
                            <>
                              <div className="opacity-30">-------</div>
                              <div className="text-red-500 font-bold max-w-full truncate px-1">
                                *{dayEvent.koTitle}*
                              </div>
                            </>
                          ) : (
                            <div className="opacity-20">-------</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Menu Options */}
            <div className="border-b-2 border-terminal bg-terminal/5">
              <div className="px-4 py-1 border-b border-terminal/30 text-[10px] font-bold uppercase tracking-widest">
                [ MENU OPTIONS - Select [1-8] or Use Arrow Keys ]
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                <MenuOption 
                  index={1} 
                  label={UI_STRINGS.MENU_OPTIONS.openShop.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.openShop.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.openShop.desc} 
                  onClick={() => {
                  if (!currentLocation) {
                    setCurrentLocation({
                      id: 'residence',
                      name: 'Residential Area',
                      koName: '주택가',
                      description: 'Neighbors, kids, and local elders. A quiet, forgiving starting zone.',
                      demographic: 'Locals (동네 사람) & Families',
                      politeness: 'POLITE',
                      focus: 'Standard Polite (해요체 / ~요)',
                      trending: ['Warm (따뜻한)', 'Home-cooked'],
                      incomeLevel: 'Low',
                      orderComplexity: 'Simple',
                      distanceKm: 0,
                      fuelCost: 0,
                      openTime: 660,
                      closeTime: 1140,
                      rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }],
                    });
                  }
                  setShowOpenShopModal(true);
                }} />
                <MenuOption 
                  index={2} 
                  label={UI_STRINGS.MENU_OPTIONS.viewMap.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.viewMap.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.viewMap.desc} 
                  onClick={() => setGameState('MAP')} 
                />
                <MenuOption 
                  index={3} 
                  label={UI_STRINGS.MENU_OPTIONS.kitchen.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.kitchen.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.kitchen.desc} 
                  onClick={() => setGameState('KITCHEN')} 
                />
                <MenuOption 
                  index={4} 
                  label={UI_STRINGS.MENU_OPTIONS.customize.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.customize.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.customize.desc} 
                  onClick={() => setGameState('CUSTOMIZE')} 
                />
                <MenuOption 
                  index={5} 
                  label={UI_STRINGS.MENU_OPTIONS.research.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.research.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.research.desc} 
                  onClick={() => setGameState('RESEARCH')} 
                />
                <MenuOption 
                  index={6} 
                  label={UI_STRINGS.MENU_OPTIONS.restock.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.restock.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.restock.desc} 
                  onClick={() => setGameState('RESTOCK')} 
                />
                <MenuOption 
                  index={7} 
                  label={UI_STRINGS.MENU_OPTIONS.alba.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.alba.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.alba.desc} 
                  onClick={() => setShowAlbaModal(true)} 
                />
                <MenuOption 
                  index={8} 
                  label={UI_STRINGS.MENU_OPTIONS.exit.label} 
                  koLabel={UI_STRINGS.MENU_OPTIONS.exit.koLabel} 
                  desc={UI_STRINGS.MENU_OPTIONS.exit.desc} 
                  onClick={() => setGameState('BOOT')} 
                />
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-[#000]">
              <div className="px-4 py-1 border-b border-terminal/30 text-[10px] font-bold uppercase tracking-widest text-center">
                [ * * SYSTEM LOGS - Previous Session Summary * * ]
              </div>
              <div className="p-4 h-40 overflow-y-auto space-y-1 text-[10px] opacity-80">
                <div className="flex space-x-2 text-yellow-500 font-bold">
                  <span>&gt;</span>
                  <span>[ PERSISTENCE CHECK ]: {stats.daysPlayed} Days in operation.</span>
                </div>
                <div className="flex space-x-2 text-yellow-500 font-bold">
                  <span>&gt;</span>
                  <span>[ FINANCIAL AUDIT ]: {stats.lifetimeRevenue.toLocaleString()}₩ Total Lifetime Revenue.</span>
                </div>
                <div className="flex space-x-2 text-yellow-500 font-bold">
                  <span>&gt;</span>
                  <span>[ LANGUAGE MASTERY ]: {dishesMastered} Recipes Synthesized.</span>
                </div>
                {(() => {
                  const currentSlots = new Set((inventory.batches || []).map(b => b.id)).size;
                  const maxSlots = inventory.maxStorage;
                  if (currentSlots >= maxSlots) {
                    return (
                      <div className="flex space-x-2 text-red-500 font-bold animate-pulse">
                        <span>&gt;</span>
                        <span>WARNING: Storage is {currentSlots}/{maxSlots}. Capacity exceeded.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex space-x-2 text-terminal font-bold">
                        <span>&gt;</span>
                        <span>[ STORAGE CHECK ]: {currentSlots}/{maxSlots} Slots active. Status Nominal.</span>
                      </div>
                    );
                  }
                })()}
                <div className="h-2" />
                {logs.map((log, i) => {
                  const safeLog = log || '';
                  return (
                    <div key={`log-${safeLog.substring(0, 10)}-${i}`} className="flex space-x-2">
                      <span className="text-terminal font-bold">&gt;</span>
                      <span>{safeLog.startsWith('>') ? safeLog.substring(2) : safeLog}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'MAP' && (
          <motion.div 
            key="map" 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl terminal-border p-6 bg-[#111]"
          >
            <CityMap 
              currentFuel={gas} 
              reputation={reputation}
              permits={permits}
              day={day}
              inventory={inventory}
              unlockedRecipes={unlockedRecipes}
              activeMenu={activeMenu}
              onUpdateMenu={setActiveMenu}
              onSelect={handleLocationSelect} 
              onCancel={() => setGameState('MENU')} 
            />
          </motion.div>
        )}

        {gameState === 'SERVING' && (
          <motion.div 
            key="serving" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -30 }} 
            transition={{ duration: 0.35 }}
            className="w-full max-w-4xl min-h-screen h-auto terminal-border p-4 pb-8 bg-[#111] flex flex-col"
          >
            <ServingStation 
              money={money} 
              day={day} 
              reputation={reputation} 
              location={currentLocation}
              inventory={inventory}
              truckConfig={truckConfig}
              hasFryer={hasFryer}
              unlockedRecipes={unlockedRecipes}
              activeMenu={activeMenu}
              romanizationEnabled={gameSettings.romanization}
              hasSeenShopTutorial={hasSeenShopTutorial}
              isColorSettingUnlocked={gameSettings.isColorSettingUnlocked}
              customer={customer}
              setCustomer={setCustomer}
              orderQueue={orderQueue}
              setOrderQueue={setOrderQueue}
              servingPhase={servingPhase}
              setServingPhase={setServingPhase}
              activeQueueIndex={activeQueueIndex}
              setActiveQueueIndex={setActiveQueueIndex}
              onUpdateInventory={handleUpdateInventory}
              onComplete={handleServingComplete} 
              onCustomerSpawn={setCurrentServingCustomer}
            />
          </motion.div>
        )}

        {gameState === 'KITCHEN' && (
          <motion.div 
            key="kitchen" 
            initial={{ opacity: 0, scale: 0.92 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl h-[600px]"
          >
            <KitchenLab 
              inventory={inventory} 
              unlockedRecipes={unlockedRecipes}
              romanizationEnabled={gameSettings.romanization}
              onUnlockRecipe={handleUnlockRecipe} 
              onCancel={() => setGameState('MENU')} 
              hasSeenTutorial={hasSeenKitchenTutorial}
              onCompleteTutorial={() => setHasSeenKitchenTutorial(true)}
            />
          </motion.div>
        )}

        {gameState === 'RESEARCH' && (
          <motion.div 
            key="research" 
            initial={{ opacity: 0, scale: 0.92 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl terminal-border p-6 bg-[#111]"
          >
            <ResearchCenter 
              currentMoney={money} 
              reputation={reputation}
              day={day}
              unlockedIds={unlockedUpgrades}
              onPurchase={handleResearchComplete} 
              onCancel={() => setGameState('MENU')} 
              hasSeenTutorial={hasSeenResearchTutorial}
              onCompleteTutorial={() => setHasSeenResearchTutorial(true)}
            />
          </motion.div>
        )}

        {gameState === 'CUSTOMIZE' && (
          <motion.div 
            key="customize" 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl terminal-border p-6 bg-[#111]"
          >
            <TruckCustomizer 
              money={money}
              config={truckConfig}
              onUpdate={handleCustomizeComplete} 
              onCancel={() => setGameState('MENU')} 
            />
          </motion.div>
        )}

        {gameState === 'RESTOCK' && (
          <motion.div 
            key="restock" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-4xl terminal-border p-6 bg-[#111]"
          >
            <RestockStation 
              money={money} 
              inventory={inventory} 
              gas={gas} 
              day={day}
              reputation={reputation}
              cachedCatalog={marketCache}
              onUpdateCache={setMarketCache}
              onComplete={handleRestockComplete} 
              onCancel={() => setGameState('MENU')} 
              hasSeenTutorial={hasSeenMarketTutorial}
              onCompleteTutorial={() => setHasSeenMarketTutorial(true)}
            />
          </motion.div>
        )}

        {gameState === 'BAILOUT' && (
          <motion.div 
            key="bailout" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl h-[600px]"
          >
            <BailoutScreen 
              money={money}
              loanType={loanStrike === 0 ? 'BANK' : 'SHARK'}
              romanizationEnabled={gameSettings.romanization}
              onAccept={handleBailoutAccept}
              onGameOver={handleGameOver}
            />
          </motion.div>
        )}

        {gameState === 'GAME_OVER' && (
          <motion.div 
            key="gameover" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl terminal-border p-12 bg-black text-center space-y-8"
          >
            <Skull size={80} className="mx-auto text-red-600 animate-pulse" />
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-red-600 uppercase tracking-tighter">Bankruptcy (파산)</h1>
              <p className="text-lg opacity-80">The K-Bite truck has been repossessed. Your culinary journey ends here.</p>
            </div>
            <div className="bg-red-900/20 p-4 border border-red-600/30 text-sm">
              <p>Lessons learned: Watch your margins, manage your stock, and never trust a loan shark.</p>
            </div>
            <button 
              onClick={restartGame}
              className="w-full bg-terminal text-black py-4 font-bold text-xl hover:bg-white transition-all uppercase"
            >
              [ RESTART FROM DAY 1 ]
            </button>
          </motion.div>
        )}

        {gameState === 'CALENDAR' && (
          <motion.div 
            key="calendar" 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-4xl h-[600px]"
          >
            <CalendarScreen 
              currentDay={day}
              history={history}
              events={events}
              unlockNotification={lastUnlock}
              onGoToMarket={() => {
                setGameState('RESTOCK');
                setLastUnlock(null);
              }}
              onSleep={() => {
                setGameState('MENU');
                setLastUnlock(null);
              }}
            />
          </motion.div>
        )}

        {gameState === 'ALBA' && (
          <motion.div 
            key="alba" 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-2xl h-[500px]"
          >
            <AlbaMiniGame onComplete={handleAlbaComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CRT state-change flicker */}
      <AnimatePresence>
        {gameSettings.phosphorFlash && gameState !== 'BOOT' && (
          <motion.div
            key={`flicker-${gameState}`}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none bg-white z-[9999]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuOption({ index, label, koLabel, desc, onClick }: { index: number, label: string, koLabel: string, desc: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start space-x-2 text-left group hover:bg-terminal hover:text-[#0c0c0c] p-1 transition-colors"
    >
      <span className="font-bold min-w-[20px]">{index}.</span>
      <div className="flex-1">
        <div className="font-bold flex items-center space-x-2">
          <span>{label}</span>
          <span className="opacity-70 text-[10px]">({koLabel})</span>
        </div>
        {desc && <div className="text-[9px] opacity-60 group-hover:opacity-100 italic">- {desc}</div>}
      </div>
    </button>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center space-x-3 p-4 terminal-border hover:bg-terminal hover:text-[#0c0c0c] transition-all group"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-bold tracking-[0.2em] text-sm">{label}</span>
    </button>
  );
}

function ActionButton({ icon, label, onClick }: { icon?: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center space-x-2 p-3 bg-[#1a1a1a] border border-terminal/20 hover:border-terminal hover:bg-terminal/5 transition-all text-xs font-bold tracking-wider"
    >
      {icon && <span className="opacity-70">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function DevToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 p-2 border border-terminal/30 hover:bg-terminal/10 text-[10px] font-mono transition-all"
    >
      <span style={{ color: 'var(--terminal-color)' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
