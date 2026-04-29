/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Upgrade, toSinoKorean, toNativeKorean } from '../types';
import { AnimatePresence } from 'framer-motion';
import { audio } from '../audioManager';

const INITIAL_UPGRADES: Upgrade[] = [
  // TIER 1: STARTUP EQUIPMENT
  { id: '11', name: 'EQUIPMENT: DEEP FRYER', description: 'Unlocks the Fryer and Potato ingredients.', cost: 25000, durationDays: 1, profitBoostPercent: 0, unlocked: false, tier: 1, category: 'EQUIPMENT' },
  { id: '2', name: 'Neon Sign', description: 'Increases reputation gain', cost: 25000, durationDays: 1, profitBoostPercent: 10, unlocked: false, tier: 1, category: 'EQUIPMENT' },
  { id: '7', name: 'Campus Parking Permit', description: 'Unlocks University area. (Requires Day 3 & 3-Star Reputation)', cost: 30000, durationDays: 2, profitBoostPercent: 15, unlocked: false, tier: 1, category: 'PERMIT' },
  { id: '12', name: 'Park Permit (공원 영업 허가증)', description: 'Unlocks the Park area. High foot traffic, mixed demographics.', cost: 60000, durationDays: 1, profitBoostPercent: 0, unlocked: false, tier: 1, category: 'PERMIT' },
  { id: '8', name: 'Wide Prep Board (넓은 도마)', description: 'Adds +5 Inventory Slots for Dry Goods.', cost: 80000, durationDays: 2, profitBoostPercent: 0, unlocked: false, tier: 1, category: 'EQUIPMENT' },
  { id: '1', name: 'Turbo Fryer', description: 'Faster cooking for potatoes', cost: 95000, durationDays: 3, profitBoostPercent: 20, unlocked: false, tier: 1, category: 'EQUIPMENT' },
  { id: '13', name: 'BEVERAGE STATION', description: 'Unlocks Soda and Juice items. Essential for combos.', cost: 45000, durationDays: 1, profitBoostPercent: 10, unlocked: false, tier: 1, category: 'EQUIPMENT' },
  
  // TIER 2: PROFESSIONAL GEAR
  { id: '5', name: 'Mini-Fridge (미니 냉장고)', description: 'Fresh goods last 4 days instead of 2.', cost: 150000, durationDays: 4, profitBoostPercent: 0, unlocked: false, tier: 2, category: 'GEAR' },
  { id: '3', name: 'Advanced SOV Engine', description: 'Unlocks Location (에/에서) cogs', cost: 350000, durationDays: 5, profitBoostPercent: 30, unlocked: false, tier: 2, category: 'GEAR' },
  { id: '4', name: 'Truck Chassis Expansion', description: 'Increases dry good slots from 20 to 30', cost: 450000, durationDays: 7, profitBoostPercent: 0, unlocked: false, tier: 2, category: 'GEAR' },
  { id: '9', name: 'Auto-Fryer (로봇 튀김기)', description: 'Automatically attaches Object Particles [를/을] to fried items.', cost: 550000, durationDays: 8, profitBoostPercent: 25, unlocked: false, tier: 2, category: 'AUTOMATION' },
  { id: '6', name: 'Business District Permit', description: 'Deploy to high-income areas. (Requires 4-Star Reputation)', cost: 500000, durationDays: 10, profitBoostPercent: 50, unlocked: false, tier: 2, category: 'PERMIT' },
];

export default function ResearchCenter({ 
  currentMoney, 
  reputation, 
  day,
  unlockedIds,
  onPurchase, 
  onCancel,
  hasSeenTutorial,
  onCompleteTutorial
}: { 
  currentMoney: number, 
  reputation: number, 
  day: number,
  unlockedIds: string[],
  onPurchase: (upgrade: Upgrade) => void, 
  onCancel: () => void,
  hasSeenTutorial: boolean,
  onCompleteTutorial: () => void
}) {
  const [upgrades, setUpgrades] = useState<Upgrade[]>(() => 
    INITIAL_UPGRADES.map(u => ({ ...u, unlocked: unlockedIds.includes(u.id) }))
  );
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    setUpgrades(prev => prev.map(u => ({ ...u, unlocked: unlockedIds.includes(u.id) })));
  }, [unlockedIds]);
  
  // Failsafe: If they already own the Deep Fryer ('11'), completely skip the tutorial modal
  const [showTutorialModal, setShowTutorialModal] = useState(!hasSeenTutorial && !unlockedIds.includes('11'));
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tier1UnlockedCount = upgrades.filter(u => u.tier === 1 && u.unlocked).length;
  const isTier2Locked = tier1UnlockedCount < 2;

  const handleStartTutorial = () => {
    setShowTutorialModal(false);
    setIsTutorialActive(true);
    setTutorialStep(1);
  };

  const handleSkipTutorial = () => {
    setShowTutorialModal(false);
    onCompleteTutorial();
  };

  const handlePurchase = (upgrade: Upgrade) => {
    const showError = (msg: string) => {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: msg, type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
    };

    if (upgrade.tier === 2 && isTier2Locked) {
      showError("TIER 2 LOCKED: PURCHASE AT LEAST 2 UPGRADES FROM TIER 1.");
      return;
    }
    if (upgrade.id === '6' && reputation < 80) {
      showError("THE BUSINESS DISTRICT HASN'T NOTICED YOU YET. NEED 4 STARS (80 REP).");
      return;
    }
    if (upgrade.id === '7' && (reputation < 60 || day < 3)) {
      showError("NOT READY FOR CAMPUS. NEED DAY 3 AND 3-STAR REPUTATION (60).");
      return;
    }
    if (currentMoney < upgrade.cost) {
      showError(`NOT ENOUGH WON. YOU NEED ${upgrade.cost.toLocaleString()} (${toSinoKorean(upgrade.cost)} 원).`);
      return;
    }
    
    audio.playSFX('CASH_REGISTER');
    setFeedback({ message: `RESEARCH STARTED: ${upgrade.name}`, type: 'success' });
    onPurchase(upgrade);
    setUpgrades(upgrades.map(u => u.id === upgrade.id ? { ...u, unlocked: true } : u));

    if (isTutorialActive && upgrade.id === '11') {
      setTutorialStep(2);
    }

    // Auto-dismiss feedback after 3 seconds
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  const renderTier = (tier: number, title: string) => {
    // Hide Tier 2 completely during the tutorial
    if (isTutorialActive && tier === 2) return null;

    let tierUpgrades = upgrades.filter(u => u.tier === tier);
    
    // Filter to only show the target upgrade during the tutorial
    if (isTutorialActive && tier === 1) {
      if (tutorialStep === 1) {
        tierUpgrades = tierUpgrades.filter(u => u.id === '11');
      } else if (tutorialStep === 2) {
        // Hide the upgrade list entirely while waiting for acknowledgment
        tierUpgrades = [];
      }
    }

    const isLocked = tier === 2 && isTier2Locked;

    return (
      <div className="space-y-4">
        {isTutorialActive && tier === 1 && tutorialStep === 1 && (
          <div className="border-2 border-yellow-500 bg-yellow-500/10 p-4 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-start gap-3 mx-2">
            <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/30 pb-1">-- SYSTEM MESSAGE --</h3>
              <div className="text-[11px] text-yellow-500 leading-relaxed">
                {"> Buy the Deep Fryer to unlock Fries. It's essential for expanding your menu."}
              </div>
            </div>
          </div>
        )}
        {isTutorialActive && tier === 1 && tutorialStep === 2 && (
          <div className="border-2 border-yellow-500 bg-yellow-500/10 p-4 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-start gap-3 mx-2">
            <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/30 pb-1">-- SYSTEM MESSAGE --</h3>
              <div className="text-[11px] text-yellow-500 leading-relaxed mb-3">
                {"> Equipment acquired. Proceed to [ KITCHEN : R&D LAB ] to synthesize new recipes. Tutorial bonus: Cost refunded."}
              </div>
              <button 
                onClick={() => {
                  setIsTutorialActive(false);
                  onCompleteTutorial();
                  onCancel(); // Instantly returns to the main menu
                }}
                className="bg-yellow-500 text-black px-6 py-2 uppercase font-bold tracking-tighter hover:bg-white transition-all active:scale-95 text-xs"
              >
                [ ACKNOWLEDGED ]
              </button>
            </div>
          </div>
        )}

        <div className="border-y border-terminal/30 py-1 px-4 flex justify-between items-center bg-terminal/5">
          <span className="font-bold text-xs tracking-widest">[ {title} ]</span>
          <span className={`text-[10px] font-bold ${isLocked ? 'text-red-500' : 'text-terminal'}`}>
            STATUS: {isLocked ? 'LOCKED' : 'UNLOCKED'}
          </span>
        </div>
        
        {isLocked && !isTutorialActive && (
          <div className="px-4 py-2 text-[10px] text-red-400 italic">
            ( REQUIREMENT: Purchase at least 2 upgrades from Tier 1 )
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 px-2">
          {tierUpgrades.map((upgrade) => {
            const isTutorialHighlight = isTutorialActive && tutorialStep === 1 && upgrade.id === '11';
            
            return (
              <div 
                key={upgrade.id} 
                className={`terminal-border p-3 bg-[#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 relative transition-all ${
                  isLocked ? 'opacity-40' : ''
                } ${
                  isTutorialHighlight ? 'border-yellow-500 bg-yellow-500/20 scale-[1.02] shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10' : ''
                }`}
              >
                {isTutorialHighlight && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 font-bold animate-pulse z-20">
                    [ TUTORIAL TARGET ]
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="font-bold text-sm flex items-center tracking-wider">
                    [{upgrade.id}] {upgrade.name}
                    {upgrade.unlocked && <CheckCircle2 size={14} className="ml-2 text-terminal" />}
                  </h3>
                  <p className="text-[10px] opacity-70 italic">{upgrade.description}</p>
                  
                  {upgrade.id === '6' && !upgrade.unlocked && (
                    <div className={`text-[9px] font-bold mt-1 ${reputation >= 80 ? 'text-terminal' : 'text-red-500'}`}>
                      {reputation >= 80 ? '✓ REPUTATION ELIGIBLE' : '✗ REQUIRES 4-STAR REPUTATION (80)'}
                    </div>
                  )}
                  {upgrade.id === '7' && !upgrade.unlocked && (
                    <div className={`text-[9px] font-bold mt-1 ${reputation >= 60 && day >= 3 ? 'text-terminal' : 'text-red-500'}`}>
                      {reputation >= 60 && day >= 3 ? '✓ CAMPUS ELIGIBLE' : `✗ REQUIRES DAY 3 & 3-STARS`}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-2 w-full md:w-auto">
                  <div className="text-yellow-400 font-bold text-sm">
                    {upgrade.cost.toLocaleString()}₩ ({toSinoKorean(upgrade.cost)}원)
                  </div>
                  <button
                    disabled={upgrade.unlocked || isLocked}
                    onClick={() => handlePurchase(upgrade)}
                    className={`px-4 py-1 text-[10px] font-bold w-full md:w-auto tracking-widest transition-all ${
                      upgrade.unlocked 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : isTutorialHighlight
                          ? 'bg-yellow-500 text-black animate-pulse'
                          : 'bg-terminal text-[#0c0c0c] hover:bg-terminal/80'
                    }`}
                  >
                    {upgrade.unlocked ? '[ OWNED ]' : isLocked ? '[ LOCKED ]' : '[ BUY: PRESS ENTER ]'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2 relative" style={{ color: 'var(--terminal-color)' }}>
      {/* Tutorial Modals */}
      <AnimatePresence>
        {showTutorialModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm terminal-border bg-[#0c0c0c] p-6 space-y-6 text-center shadow-[0_0_50px_rgba(0,255,65,0.2)]"
            >
              <div className="space-y-2">
                <FlaskConical size={40} className="mx-auto text-terminal animate-pulse" />
                <h2 className="font-bold text-lg tracking-tighter">[ INITIATE RESEARCH PROTOCOL? ]</h2>
                <p className="text-xs opacity-60">System guidance recommended for new operators.</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleStartTutorial}
                  className="w-full py-2 bg-terminal text-black font-bold text-xs uppercase tracking-widest hover:bg-terminal/80 transition-all active:scale-95"
                >
                  [ YES, GUIDE ME ]
                </button>
                <button 
                  onClick={handleSkipTutorial}
                  className="w-full py-2 border border-terminal/30 text-terminal/60 font-bold text-xs uppercase tracking-widest hover:bg-terminal/10 transition-all active:scale-95"
                >
                  [ NO, I KNOW WHAT I'M DOING ]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-50 bg-[#0c0c0c] border-b border-terminal pb-4 mb-6 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FlaskConical size={24} />
            <h2 className="text-xl font-bold uppercase tracking-widest">RESEARCH & UPGRADES (연구)</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-[10px] opacity-60">FUNDS:</div>
              <div className="text-sm font-bold text-yellow-400">{currentMoney.toLocaleString()}₩ ({toSinoKorean(currentMoney)} 원)</div>
            </div>
            <button onClick={onCancel} className="text-[10px] font-bold border border-terminal/50 px-3 py-1 hover:bg-terminal hover:text-black transition-all uppercase tracking-tighter">
              [ RETURN TO TRUCK ]
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-20">
        {renderTier(1, "TIER 1: STARTUP EQUIPMENT")}
        {renderTier(2, "TIER 2: PROFESSIONAL GEAR")}
      </div>

      {feedback && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] p-4 flex items-center space-x-3 min-w-[300px] max-w-[90vw] shadow-[0_4px_15px_rgba(0,0,0,0.5)] ${
          feedback.type === 'error' 
            ? 'bg-red-900/90 text-red-100 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
            : 'bg-terminal/90 text-black border-2 border-terminal shadow-[0_0_20px_rgba(var(--terminal-color-rgb),0.4)]'
        }`}>
          {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span className="font-bold text-xs uppercase tracking-wider">{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
