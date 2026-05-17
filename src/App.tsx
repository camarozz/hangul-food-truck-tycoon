/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * App.tsx — UI shell only.
 * All game state lives in GameProvider (src/context/GameContext.tsx).
 * Local state here is strictly UI toggles (modals, boot sequence, dev panel).
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Utensils, BookOpen, Settings, Play, DollarSign,
  Clock, FlaskConical, Palette, Terminal, Plus, Star,
  FastForward, Skull, Wrench,
} from 'lucide-react';
import { toSinoKorean, toNativeKorean } from './types';
import { GameProvider, useGame } from './context/GameContext';
import { GameBoundary, ScreenBoundary, ServingBoundary } from './components/ErrorBoundary';
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

// Re-export truck data so existing component imports (TruckCustomizer etc.) keep working
export {
  TRUCK_ADJECTIVES, TRUCK_COLORS, TRUCK_PROPS, TRUCK_WINDOWS,
  TRUCK_WHEELS, TRUCK_GRILLS, TRUCK_UNDERGLOWS,
} from './constants';

// ASCII helpers
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

export const getFrontViewAscii = (config: import('./types').TruckConfig) => {
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

// ─── Local sub-components ─────────────────────────────────────────────────────

function MenuOption({ index, label, koLabel, desc, onClick }: {
  index: number; label: string; koLabel: string; desc: string; onClick: () => void;
}) {
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

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
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

// ─── Inner shell (uses context) ───────────────────────────────────────────────

function AppShell() {
  const {
    gameScreen, setGameScreen,
    money, reputation, day, gas,
    inventory, truckConfig, currentLocation, setCurrentLocation,
    permits, unlockedRecipes, activeMenu, setActiveMenu,
    hasFryer, hasBeverageStation, dishesMastered,
    gameSettings, setGameSettings,
    activeLoan, loanStrike,
    history, events, stats, logs,
    lastUnlock,
    marketCache, setMarketCache,
    isSaving,
    customer, setCustomer, orderQueue, setOrderQueue,
    servingPhase, setServingPhase, activeQueueIndex, setActiveQueueIndex,
    hasSeenShopTutorial, hasSeenKitchenTutorial, hasSeenResearchTutorial, hasSeenMarketTutorial,
    setHasSeenResearchTutorial, setHasSeenKitchenTutorial, setHasSeenMarketTutorial,
    handleServingComplete, handleResearchComplete, handleCustomizeComplete,
    handleBailoutAccept, handleAlbaComplete, handleRestockComplete, handleLocationSelect,
    setInventory, spawnTestCustomer, restartGame, advanceDay, addLog, setMoney, setReputation,
    setUnlockedRecipes,
    setHasSeenShopTutorial,
    isInitialized,
  } = useGame();

  // ── Local UI-only state ────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [showOpenShopModal, setShowOpenShopModal] = useState(false);
  const [showAlbaModal, setShowAlbaModal] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [skipTutorialFlag, setSkipTutorialFlag] = useState(false);
  const [isDeveloper] = useState(() => localStorage.getItem('kbite_dev_mode') === 'true');
  const [devMode, setDevMode] = useState(false);

  const truckAscii = useMemo(() => {
    return getFrontViewAscii(truckConfig).split('\n');
  }, [truckConfig]);

  const SCREEN_NAMES: Record<string, string> = {
    BOOT:      'Boot Screen',
    MENU:      'Main Menu',
    MAP:       'City Map',
    SERVING:   'Serving Station',
    KITCHEN:   'Kitchen Lab',
    RESEARCH:  'Research Center',
    CUSTOMIZE: 'Truck Customizer',
    RESTOCK:   'Restock Station',
    BAILOUT:   'Bailout Screen',
    GAME_OVER: 'Game Over',
    CALENDAR:  'Calendar',
    ALBA:      'Alba Minigame',
  };

  // ── Boot / intro flow ──────────────────────────────────────────────────────
  const handleIntroComplete = (skipTutorial = false) => {
    setSkipTutorialFlag(skipTutorial);
    setShowIntro(false);
    setIsBooting(true);
  };

  const startActualShift = () => {
    setIsBooting(false);
    localStorage.setItem('hasCompletedIntro', 'true');
    if (skipTutorialFlag) {
      setHasSeenShopTutorial(true);
      setHasSeenKitchenTutorial(true);
      setHasSeenResearchTutorial(true);
      setHasSeenMarketTutorial(true);
      setGameSettings((prev: any) => ({ ...prev, isColorSettingUnlocked: true }));
      setGameScreen('MENU');
      addLog('> TUTORIAL SKIPPED. Advancing to Day 001...');
      return;
    }
    const residenceLoc = {
      id: 'residence', name: 'Residential Area', koName: '주택가',
      description: 'Neighbors, kids, and local elders. A quiet, forgiving starting zone.',
      demographic: 'Locals (동네 사람) & Families', politeness: 'POLITE' as const,
      focus: 'Standard Polite (해요체 / ~요)', trending: ['Warm (따뜻한)', 'Home-cooked'],
      incomeLevel: 'Low' as const, orderComplexity: 'Simple' as const, distanceKm: 0, fuelCost: 0,
      openTime: 660, closeTime: 1140, rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }],
    };
    setCurrentLocation(residenceLoc);
    setGameScreen('SERVING');
    addLog('> ORIENTATION PROTOCOL: Initializing Shift 000...');
  };

  // ── ChassisLine helper ────────────────────────────────────────────────────
  const renderTruckLine = (line: string, key: string) => {
    if (!line.includes('{{CHASSIS}}')) return <div key={key}>{line}</div>;
    return (
      <React.Fragment key={key}>
        {'  =|'}
        <span style={truckConfig.underglow?.id !== 'none' ? { color: truckConfig.underglow!.hex, textShadow: `0 0 8px ${truckConfig.underglow!.hex}` } : {}}>
          {truckConfig.underglow?.id !== 'none' ? '==' : '__'}
        </span>
        {'/ \\'}
        <span style={truckConfig.underglow?.id !== 'none' ? { color: truckConfig.underglow!.hex, textShadow: `0 0 8px ${truckConfig.underglow!.hex}` } : {}}>
          {truckConfig.underglow?.ascii || '_____________'}
        </span>
        {'|__/ \\_'}
        {truckConfig.grill?.ascii || '=='}
      </React.Fragment>
    );
  };

  // ── Default location for OPEN SHOP ────────────────────────────────────────
  const defaultLocation = currentLocation ?? {
    id: 'residence', name: 'Residential Area', koName: '주택가',
    description: 'Neighbors, kids, and local elders.',
    demographic: 'Locals & Families', politeness: 'POLITE' as const,
    focus: 'Standard Polite', trending: ['Warm', 'Home-cooked'],
    incomeLevel: 'Low', orderComplexity: 'Simple', distanceKm: 0, fuelCost: 0,
    openTime: 660, closeTime: 1140,
    rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }],
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#0c0c0c] ${gameSettings.crtEffects ? 'crt-enabled' : ''}`}>
      <AnimatePresence>
        {!isInitialized && (
          <motion.div
            key="initial-load"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] bg-[#0c0c0c] flex flex-col items-center justify-center font-mono text-terminal"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg tracking-[0.5em] font-black"
            >
              [ INITIALIZING SYSTEM ]
            </motion.div>
            <div className="mt-4 text-[10px] opacity-40 animate-pulse">
              READING DATA SECTORS...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showIntro && <IntroCutscene onComplete={handleIntroComplete} />}
      {isBooting && <SystemBootSequence onComplete={startActualShift} isFastBoot={skipTutorialFlag} />}

      {/* ── Dev panel ─────────────────────────────────────────────────────── */}
      {isDeveloper && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2">
          <button
            onClick={() => {
              setDevMode((d: boolean) => !d);
              if (!devMode) localStorage.setItem('kbite_dev_mode', 'true');
              else localStorage.removeItem('kbite_dev_mode');
            }}
            className="px-3 py-1.5 bg-black border-2 border-yellow-400 text-yellow-400 font-bold text-xs hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2"
          >
            <Wrench size={14} /> DEV MODE {devMode ? 'ON' : 'OFF'}
          </button>
          <AnimatePresence>
            {devMode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="w-80 bg-black/95 border-2 border-yellow-400 p-4 font-mono text-xs shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                  <Terminal size={14} /> DEVELOPER CONSOLE
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setMoney((m: number) => m + 1000000); addLog('DEV: +1,000,000₩'); }} className="bg-terminal/10 hover:bg-terminal/30 p-2 border border-terminal/30">+1M KRW</button>
                    <button onClick={() => { setReputation((r: number) => Math.min(100, r + 50)); addLog('DEV: +50 REP'); }} className="bg-terminal/10 hover:bg-terminal/30 p-2 border border-terminal/30">+50 REP</button>
                  </div>
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">SPAWN CUSTOMER</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['burger', 'cheeseburger', 'fries', 'kimchiburger', 'spicy', 'onion'].map(t => (
                        <button key={t} onClick={() => spawnTestCustomer(t)}
                          className={`p-2 border text-xs ${['spicy', 'onion'].includes(t) ? 'bg-red-900/30 border-red-400 hover:bg-red-900/50' : 'bg-green-900/30 border-green-400 hover:bg-green-900/50'}`}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">SKIP TO DAY</div>
                    <div className="flex gap-2">
                      <input type="number" id="dev-day-input" defaultValue={day + 1}
                        className="bg-black border border-yellow-400 text-yellow-400 w-16 text-center" />
                      <button
                        onClick={() => {
                          const input = document.getElementById('dev-day-input') as HTMLInputElement;
                          const target = parseInt(input.value);
                          if (target <= day) return;
                          addLog(`DEV: Fast-forwarding ${target - day} days...`);
                          let current = day;
                          const skip = () => { if (current >= target) { addLog(`DEV: Arrived at Day ${target}`); return; } advanceDay(); current++; setTimeout(skip, 10); };
                          skip();
                        }}
                        className="flex-1 bg-yellow-400 text-black font-bold py-1 text-xs"
                      >JUMP TO DAY</button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-yellow-400 mb-1">FORCE END SHIFT</div>
                    <div className="flex gap-2">
                      <input type="number" id="dev-earnings" defaultValue="45000" className="bg-black border border-terminal text-terminal flex-1 text-center" />
                      <input type="number" id="dev-rep" defaultValue="25" className="bg-black border border-terminal text-terminal w-16 text-center" />
                      <button
                        onClick={() => {
                          const e = parseInt((document.getElementById('dev-earnings') as HTMLInputElement).value) || 0;
                          const r = parseInt((document.getElementById('dev-rep') as HTMLInputElement).value) || 0;
                          handleServingComplete(e, r, { wrongParticles: 0, perfectStreak: 5 });
                          addLog(`DEV: Force ended shift (+${e}₩, +${r} REP)`);
                        }}
                        className="bg-pink-600 text-white px-4 text-xs font-bold"
                      >END</button>
                    </div>
                  </div>
                  <button onClick={() => {
                    setUnlockedRecipes(['burger', 'cheeseburger', 'fries', 'kimchiburger', 'soda', 'juice']);
                    setHasSeenShopTutorial(true); setHasSeenKitchenTutorial(true);
                    setHasSeenResearchTutorial(true); setHasSeenMarketTutorial(true);
                    setGameSettings((prev: any) => ({ ...prev, isColorSettingUnlocked: true }));
                    addLog('DEV: UNLOCKED EVERYTHING');
                  }} className="w-full bg-red-600 text-white py-2 text-xs font-bold mb-2">UNLOCK ALL CONTENT</button>
                  <button onClick={restartGame} className="w-full border border-red-500 text-red-400 py-2 text-xs">FULL GAME RESET</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Saving indicator ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSaving && (
          <motion.div key="saving" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-black/80 border border-terminal text-terminal px-3 py-1 text-xs font-mono shadow-[0_0_15px_rgba(0,255,65,0.2)]">
            <span className="inline-block w-3 h-3 border-2 border-terminal border-r-transparent rounded-full animate-spin" />
            💾 SAVING…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <SettingsMenu key="settings" onClose={() => setShowSettings(false)}
            onReplayIntro={() => setShowIntro(true)} />
        )}
        {showPatchNotes && <PatchNotes key="patch" onClose={() => setShowPatchNotes(false)} />}
        {showOpenShopModal && (
          <PreFlightModal key="preflight" isOpen onClose={() => setShowOpenShopModal(false)}
            onDeploy={loc => { setShowOpenShopModal(false); handleLocationSelect(loc); }} />
        )}
        {showAlbaModal && (
          <div key="alba-overlay" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md border-2 border-yellow-500 bg-[#0c0c0c] p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] space-y-6 font-mono">
              <div className="text-center border-b border-yellow-500/30 pb-4">
                <h2 className="text-xl font-bold tracking-widest uppercase text-yellow-500">[ ALBA CONTRACT ]</h2>
                <p className="text-[10px] opacity-60 text-yellow-500/70">EMPLOYMENT TERMS & CONDITIONS</p>
              </div>
              <div className="space-y-4 text-yellow-500/90">
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-widest border-b border-yellow-500/20 pb-2">PAYMENT STRUCTURE:</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>BASE WAGE:</span><span className="font-bold">0₩</span></div>
                    <div className="flex justify-between text-white"><span>PER DISH WASHED:</span><span className="font-bold">1,000₩</span></div>
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed opacity-80 italic">
                  WARNING: Performance is strictly monitored. Failure to wash any dishes will result in immediate termination without pay. This shift does not advance the calendar day.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setShowAlbaModal(false)} className="py-3 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 text-xs font-bold">[ NEVERMIND ]</button>
                <button onClick={() => { setShowAlbaModal(false); setGameScreen('ALBA'); }} className="py-3 bg-yellow-500 text-black font-bold text-xs hover:scale-105 transition-all">[ GRAB THE SPONGE ]</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Screens ───────────────────────────────────────────────────────── */}
      <ScreenBoundary
        resetKey={gameScreen}
        onReturnToMenu={() => setGameScreen('MENU')}
        screenName={SCREEN_NAMES[gameScreen]}
      >
        <AnimatePresence mode="wait">

          {/* BOOT */}
          {gameScreen === 'BOOT' && (
            <motion.div key="boot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="text-center space-y-8">
              <pre className="ascii-art terminal-glow text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs" style={{ color: 'var(--terminal-color)' }}>{LOGO_ASCII}</pre>
              <div className="flex flex-col items-center">
                <pre className="ascii-art text-[6px] sm:text-[8px] md:text-[10px] leading-tight opacity-70" style={{ color: 'var(--terminal-color)', whiteSpace: 'pre', textAlign: 'left' }}>
                  {getFrontViewAscii(truckConfig).replace(/^\n/, '').split('\n').map((line, i) => (
                    <div key={`boot-truck-${i}`}>{renderTruckLine(line, `boot-${i}`)}</div>
                  ))}
                </pre>
              </div>
              <div className="flex flex-col space-y-4 max-w-xs mx-auto">
                <MenuButton icon={<Play size={20} />} label="START SYSTEM" onClick={() => {
                  const hasCompleted = localStorage.getItem('hasCompletedIntro') === 'true';
                  if (!hasCompleted) setShowIntro(true); else setGameScreen('MENU');
                }} />
                <MenuButton icon={<Settings size={20} />} label="SETTINGS" onClick={() => setShowSettings(true)} />
                <MenuButton icon={<BookOpen size={20} />} label="PATCH NOTES" onClick={() => setShowPatchNotes(true)} />
              </div>
              <div className="text-xs opacity-50 mt-8">[SYSTEM READY] {GAME_VERSION}</div>
            </motion.div>
          )}

          {/* MAIN MENU */}
          {gameScreen === 'MENU' && (
            <motion.div key="menu" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }}
              className="w-full max-w-4xl font-mono space-y-0" style={{ color: 'var(--terminal-color)' }}>
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
                  <div>REPUTATION: {'★'.repeat(Math.max(0, Math.min(5, Math.floor(reputation / 20)))).padEnd(5, '☆')} ({reputation}/100)</div>
                  {activeLoan && <div className="text-[10px] text-red-400 font-bold">LOAN DUE IN {activeLoan.daysRemaining} DAYS</div>}
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <span>GAS: [{'|'.repeat(Math.max(0, Math.min(10, Math.floor(gas / 10)))).padEnd(10, ' ')}] {gas}%</span>
                    <span className="text-yellow-500">({gas >= 100 ? 'Sino' : 'Native'}: {toNativeKorean(gas)})</span>
                  </div>
                  {(() => {
                    const slots = (Object.values(inventory.batches.reduce((acc, b) => { acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc; }, {} as Record<string, number>)) as number[]).reduce((s, qty) => s + Math.ceil(qty / 20), 0);
                    return (
                      <div className="flex items-center justify-end space-x-2">
                        <span>STORAGE: {slots} / {inventory.maxStorage} SLOTS</span>
                        <span className="text-yellow-500">(Native: {toNativeKorean(slots)})</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Truck + mini-calendar */}
              <div className="border-b-2 border-terminal px-6 pt-0 pb-4 flex flex-col md:flex-row items-end justify-between relative overflow-hidden bg-black/40 min-h-[200px] gap-8">
                <div className="flex flex-col items-center justify-end h-full">
                  <pre className="ascii-art text-[8px] sm:text-[10px] md:text-xs leading-tight transition-colors duration-500 z-10 mt-2"
                    style={{ color: truckConfig.color?.hex || '#00ff41' }}>
                    {truckAscii?.map((line: string, i: number) => <div key={`truck-${i}`}>{renderTruckLine(line, `menu-${i}`)}</div>)}
                  </pre>
                </div>
                <div className="flex-1 w-full h-full flex gap-1 min-h-[180px]">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const calDay = day - 1 + i;
                    if (calDay < 0) return <div key={`cal-empty-${i}`} className="flex-1 border border-terminal/10 flex flex-col bg-black/20 opacity-20"><div className="text-center border-b border-terminal/10 py-1"><div className="text-[10px] font-bold">---</div></div></div>;
                    const enWD = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                    const koWD = ['월', '화', '수', '목', '금', '토', '일'];
                    const idx = (((calDay - 1) % 7) + 7) % 7;
                    const isToday = calDay === day;
                    const isPast = calDay < day;
                    const dayHistory = history.find(h => h.day === calDay);
                    const dayEvent = events.find(e => e.day === calDay);
                    return (
                      <div key={`cal-${calDay}`} className={`flex-1 border ${isToday ? 'border-terminal bg-terminal/5' : 'border-terminal/20'} flex flex-col bg-black/60 transition-all`}>
                        <div className={`text-center border-b ${isToday ? 'border-terminal bg-terminal/10' : 'border-terminal/20'} py-1`}>
                          <div className={`text-[10px] font-bold ${isToday ? 'text-terminal' : 'text-white'}`}>{enWD[idx]}</div>
                          <div className="text-[10px] opacity-70">{koWD[idx]}</div>
                        </div>
                        <div className="p-1.5 flex flex-col flex-1 text-[9px] relative overflow-hidden">
                          <div className="w-full flex justify-between items-start mb-2">
                            <span className={isToday ? 'font-bold text-terminal text-[10px]' : 'opacity-70'}>{calDay}일</span>
                            {isToday && <span className="bg-terminal text-black px-1 font-bold tracking-tighter">TODAY</span>}
                          </div>
                          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-1">
                            {isPast && dayHistory ? (
                              <><div className="text-terminal font-bold text-[10px]">+{(dayHistory.earnings / 10000).toFixed(1)}만₩</div><div className="opacity-50 tracking-widest text-[8px]">(Clear)</div></>
                            ) : dayEvent ? (
                              <><div className="opacity-30">-------</div><div className="text-red-500 font-bold max-w-full truncate px-1">*{dayEvent.koTitle}*</div></>
                            ) : <div className="opacity-20">-------</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Menu options */}
              <div className="border-b-2 border-terminal bg-terminal/5">
                <div className="px-4 py-1 border-b border-terminal/30 text-[10px] font-bold uppercase tracking-widest">[ MENU OPTIONS - Select [1-8] or Use Arrow Keys ]</div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  <MenuOption index={1} label={UI_STRINGS.MENU_OPTIONS.openShop.label} koLabel={UI_STRINGS.MENU_OPTIONS.openShop.koLabel} desc={UI_STRINGS.MENU_OPTIONS.openShop.desc}
                    onClick={() => { if (!currentLocation) setCurrentLocation(defaultLocation); setShowOpenShopModal(true); }} />
                  <MenuOption index={2} label={UI_STRINGS.MENU_OPTIONS.viewMap.label} koLabel={UI_STRINGS.MENU_OPTIONS.viewMap.koLabel} desc={UI_STRINGS.MENU_OPTIONS.viewMap.desc} onClick={() => setGameScreen('MAP')} />
                  <MenuOption index={3} label={UI_STRINGS.MENU_OPTIONS.kitchen.label} koLabel={UI_STRINGS.MENU_OPTIONS.kitchen.koLabel} desc={UI_STRINGS.MENU_OPTIONS.kitchen.desc} onClick={() => setGameScreen('KITCHEN')} />
                  <MenuOption index={4} label={UI_STRINGS.MENU_OPTIONS.customize.label} koLabel={UI_STRINGS.MENU_OPTIONS.customize.koLabel} desc={UI_STRINGS.MENU_OPTIONS.customize.desc} onClick={() => setGameScreen('CUSTOMIZE')} />
                  <MenuOption index={5} label={UI_STRINGS.MENU_OPTIONS.research.label} koLabel={UI_STRINGS.MENU_OPTIONS.research.koLabel} desc={UI_STRINGS.MENU_OPTIONS.research.desc} onClick={() => setGameScreen('RESEARCH')} />
                  <MenuOption index={6} label={UI_STRINGS.MENU_OPTIONS.restock.label} koLabel={UI_STRINGS.MENU_OPTIONS.restock.koLabel} desc={UI_STRINGS.MENU_OPTIONS.restock.desc} onClick={() => setGameScreen('RESTOCK')} />
                  <MenuOption index={7} label={UI_STRINGS.MENU_OPTIONS.alba.label} koLabel={UI_STRINGS.MENU_OPTIONS.alba.koLabel} desc={UI_STRINGS.MENU_OPTIONS.alba.desc} onClick={() => setShowAlbaModal(true)} />
                  <MenuOption index={8} label={UI_STRINGS.MENU_OPTIONS.exit.label} koLabel={UI_STRINGS.MENU_OPTIONS.exit.koLabel} desc={UI_STRINGS.MENU_OPTIONS.exit.desc} onClick={() => setGameScreen('BOOT')} />
                </div>
              </div>
              {/* System logs */}
              <div className="bg-[#000]">
                <div className="px-4 py-1 border-b border-terminal/30 text-[10px] font-bold uppercase tracking-widest text-center">[ * * SYSTEM LOGS - Previous Session Summary * * ]</div>
                <div className="p-4 h-40 overflow-y-auto space-y-1 text-[10px] opacity-80">
                  <div className="flex space-x-2 text-yellow-500 font-bold"><span>&gt;</span><span>[ PERSISTENCE CHECK ]: {stats.daysPlayed} Days in operation.</span></div>
                  <div className="flex space-x-2 text-yellow-500 font-bold"><span>&gt;</span><span>[ FINANCIAL AUDIT ]: {stats.lifetimeRevenue.toLocaleString()}₩ Total Lifetime Revenue.</span></div>
                  <div className="flex space-x-2 text-yellow-500 font-bold"><span>&gt;</span><span>[ LANGUAGE MASTERY ]: {dishesMastered} Recipes Synthesized.</span></div>
                  {(() => {
                    const used = new Set((inventory.batches || []).map(b => b.id)).size;
                    return used >= inventory.maxStorage
                      ? <div className="flex space-x-2 text-red-500 font-bold animate-pulse"><span>&gt;</span><span>WARNING: Storage is {used}/{inventory.maxStorage}. Capacity exceeded.</span></div>
                      : <div className="flex space-x-2 text-terminal font-bold"><span>&gt;</span><span>[ STORAGE CHECK ]: {used}/{inventory.maxStorage} Slots active. Status Nominal.</span></div>;
                  })()}
                  <div className="h-2" />
                  {logs.map((log, i) => (
                    <div key={`log-${i}`} className="flex space-x-2">
                      <span className="text-terminal font-bold">&gt;</span>
                      <span>{log.startsWith('>') ? log.substring(2) : log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MAP */}
          {gameScreen === 'MAP' && (
            <motion.div key="map" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }} className="w-full max-w-4xl terminal-border p-6 bg-[#111]">
              <CityMap onCancel={() => setGameScreen('MENU')} />
            </motion.div>
          )}

          {/* SERVING */}
          {gameScreen === 'SERVING' && (
            <motion.div key="serving" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.35 }}
              className="w-full max-w-4xl min-h-screen h-auto terminal-border p-4 pb-8 bg-[#111] flex flex-col">
              <ServingBoundary onAbortShift={() => setGameScreen('CALENDAR')}>
                <ServingStation />
              </ServingBoundary>
            </motion.div>
          )}

          {/* KITCHEN */}
          {gameScreen === 'KITCHEN' && (
            <motion.div key="kitchen" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3 }} className="w-full max-w-4xl h-[600px]">
              <KitchenLab onCancel={() => setGameScreen('MENU')} />
            </motion.div>
          )}

          {/* RESEARCH */}
          {gameScreen === 'RESEARCH' && (
            <motion.div key="research" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3 }} className="w-full max-w-4xl terminal-border p-6 bg-[#111]">
              <ResearchCenter onCancel={() => setGameScreen('MENU')} />
            </motion.div>
          )}

          {/* CUSTOMIZE */}
          {gameScreen === 'CUSTOMIZE' && (
            <motion.div key="customize" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.3 }} className="w-full max-w-4xl terminal-border p-6 bg-[#111]">
              <TruckCustomizer onCancel={() => setGameScreen('MENU')} />
            </motion.div>
          )}

          {/* RESTOCK */}
          {gameScreen === 'RESTOCK' && (
            <motion.div key="restock" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.35 }} className="w-full max-w-4xl terminal-border p-6 bg-[#111]">
              <RestockStation onCancel={() => setGameScreen('MENU')} />
            </motion.div>
          )}

          {/* BAILOUT */}
          {gameScreen === 'BAILOUT' && (
            <motion.div key="bailout" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }} className="w-full max-w-2xl h-[600px]">
              <BailoutScreen />
            </motion.div>
          )}

          {/* GAME OVER */}
          {gameScreen === 'GAME_OVER' && (
            <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              className="w-full max-w-xl terminal-border p-12 bg-black text-center space-y-8">
              <Skull size={80} className="mx-auto text-red-600 animate-pulse" />
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-red-600 uppercase tracking-tighter">Bankruptcy (파산)</h1>
                <p className="text-lg opacity-80">The K-Bite truck has been repossessed. Your culinary journey ends here.</p>
              </div>
              <div className="bg-red-900/20 p-4 border border-red-600/30 text-sm">
                <p>Lessons learned: Watch your margins, manage your stock, and never trust a loan shark.</p>
              </div>
              <button onClick={restartGame} className="w-full bg-terminal text-black py-4 font-bold text-xl hover:bg-white transition-all uppercase">
                [ RESTART FROM DAY 1 ]
              </button>
            </motion.div>
          )}

          {/* CALENDAR */}
          {gameScreen === 'CALENDAR' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-4xl h-[600px]">
              <CalendarScreen
                onGoToMarket={() => setGameScreen('RESTOCK')}
                onSleep={() => setGameScreen('MENU')}
              />
            </motion.div>
          )}

          {/* ALBA */}
          {gameScreen === 'ALBA' && (
            <motion.div key="alba" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.35 }} className="w-full max-w-2xl h-[500px]">
              <AlbaMiniGame />
            </motion.div>
          )}

        </AnimatePresence>
      </ScreenBoundary>

      {/* CRT flicker */}
      <AnimatePresence>
        {gameSettings.phosphorFlash && gameScreen !== 'BOOT' && (
          <motion.div key={`flicker-${gameScreen}`} initial={{ opacity: 0.3 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none bg-white z-[9999]" />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GameBoundary>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </GameBoundary>
  );
}
