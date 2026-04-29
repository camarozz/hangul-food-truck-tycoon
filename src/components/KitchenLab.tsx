/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, FlaskConical, Zap, CheckCircle2, AlertCircle, Keyboard, ChevronRight, BookOpen } from 'lucide-react';
import { Recipe, Inventory } from '../types';

interface KitchenLabProps {
  inventory: Inventory;
  unlockedRecipes: string[];
  romanizationEnabled: boolean;
  onUnlockRecipe: (recipeId: string) => void;
  onCancel: () => void;
  hasSeenTutorial: boolean;
  onCompleteTutorial: () => void;
}

const RECIPE_DATABASE: Recipe[] = [
  {
    id: 'burger',
    name: 'Standard Burger',
    koName: '버거',
    description: 'The foundation of your empire. Simple and effective.',
    ingredients: [
      { id: 'beef', koName: '고기', qwertyHint: 'r h r l' },
      { id: 'bun', koName: '빵', qwertyHint: 'Q k d' }
    ],
    methods: [
      { id: 'grill', koName: '굽다', qwertyHint: 'r n b e k' }
    ],
    complexity: 1,
    unlocked: true,
    profitBonus: 0
  },
  {
    id: 'cheeseburger',
    name: 'Cheese Burger',
    koName: '치즈버거',
    description: 'A creamy upgrade that customers love.',
    ingredients: [
      { id: 'beef', koName: '고기', qwertyHint: 'r h r l' },
      { id: 'bun', koName: '빵', qwertyHint: 'Q k d' },
      { id: 'cheese', koName: '치즈', qwertyHint: 'c l w m' }
    ],
    methods: [
      { id: 'grill', koName: '굽다', qwertyHint: 'r n b e k' }
    ],
    complexity: 2,
    unlocked: false,
    profitBonus: 1500
  },
  {
    id: 'fries',
    name: 'French Fries',
    koName: '감자튀김',
    description: 'The perfect side dish. Requires a fryer.',
    ingredients: [
      { id: 'potato', koName: '감자', qwertyHint: 'r a w k' }
    ],
    methods: [
      { id: 'fry', koName: '튀기다', qwertyHint: 'x n r l e k' }
    ],
    complexity: 2,
    unlocked: false,
    profitBonus: 1000
  },
  {
    id: 'kimchiburger',
    name: 'Kimchi Burger',
    koName: '김치버거',
    description: 'A spicy fusion that defines K-BITE.',
    ingredients: [
      { id: 'beef', koName: '고기', qwertyHint: 'r h r l' },
      { id: 'bun', koName: '빵', qwertyHint: 'Q k d' },
      { id: 'kimchi', koName: '김치', qwertyHint: 'r l a w l' }
    ],
    methods: [
      { id: 'grill', koName: '굽다', qwertyHint: 'r n b e k' }
    ],
    complexity: 3,
    unlocked: false,
    profitBonus: 2500
  },
  {
    id: 'soda',
    name: 'Cold Soda',
    koName: '음료수',
    description: 'Refreshing carbonated beverage. High profit margin.',
    ingredients: [
      { id: 'soda', koName: '음료수', qwertyHint: 'd m f f y t n' }
    ],
    methods: [
      { id: 'pour', koName: '따르다', qwertyHint: 'E k f m e k' }
    ],
    complexity: 1,
    unlocked: false,
    profitBonus: 1200
  },
  {
    id: 'juice',
    name: 'Organic Juice',
    koName: '주스',
    description: 'Premium fruit juice for health-conscious customers.',
    ingredients: [
      { id: 'juice', koName: '주스', qwertyHint: 'w n t m' }
    ],
    methods: [
      { id: 'pour', koName: '따르다', qwertyHint: 'E k f m e k' }
    ],
    complexity: 1,
    unlocked: false,
    profitBonus: 1800
  }
];

export default function KitchenLab({ 
  inventory, 
  unlockedRecipes, 
  romanizationEnabled, 
  onUnlockRecipe, 
  onCancel,
  hasSeenTutorial,
  onCompleteTutorial
}: KitchenLabProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [step, setStep] = useState<'SELECT' | 'SYNTHESIZE'>('SELECT');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(!hasSeenTutorial);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Automatically focus the input box if the user clicks anywhere in the panel
  const handleContainerClick = () => {
    if (step === 'SYNTHESIZE' && !isSynthesizing) {
      inputRef.current?.focus();
    }
  };

  const handleStartTutorial = () => {
    setShowTutorialModal(false);
    setIsTutorialActive(true);
    setTutorialStep(1);
  };

  const handleSkipTutorial = () => {
    setShowTutorialModal(false);
    onCompleteTutorial();
  };

  const allSteps = selectedRecipe ? [...selectedRecipe.ingredients, ...selectedRecipe.methods] : [];
  const currentTarget = allSteps[currentStepIndex];

  const handleType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val === currentTarget.koName) {
      setFeedback({ message: 'CORRECT! COMPONENT SYNTHESIZED.', type: 'success' });
      setTimeout(() => {
        if (currentStepIndex < allSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setInputValue('');
          setFeedback(null);
        } else {
          completeSynthesis();
        }
      }, 800);
    }
  };

  const completeSynthesis = () => {
    setIsSynthesizing(true);
    setFeedback({ message: 'ALL COMPONENTS STABILIZED. FINALIZING RECIPE...', type: 'success' });
    
    setTimeout(() => {
      const recipeId = selectedRecipe!.id;
      onUnlockRecipe(recipeId);
      setIsSynthesizing(false);
      setStep('SELECT');
      setSelectedRecipe(null);
      setCurrentStepIndex(0);
      setInputValue('');
      setFeedback(null);

      if (isTutorialActive && recipeId === 'cheeseburger') {
        setTutorialStep(2);
      }
    }, 2000);
  };

  const startSynthesis = (recipe: Recipe) => {
    // Check if player has at least 1 of each FRESH ingredient
    const hasAllIngredients = recipe.ingredients.every(ing => {
      const quantity = inventory.batches.filter(b => b.id === ing.id && b.daysLeft !== 0).reduce((acc, b) => acc + b.quantity, 0);
      return quantity > 0;
    });

    if (!hasAllIngredients) {
      setFeedback({ message: 'MISSING RAW MATERIALS. BUY THEM AT THE MARKET FIRST.', type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setSelectedRecipe(recipe);
    setStep('SYNTHESIZE');
    setCurrentStepIndex(0);
    setInputValue('');
    setFeedback(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c0c] font-mono terminal-border overflow-hidden relative" style={{ color: 'var(--terminal-color)' }}>
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
                <Beaker size={40} className="mx-auto text-terminal animate-pulse" />
                <h2 className="font-bold text-lg tracking-tighter uppercase">[ Initiate R&D Protocol? ]</h2>
                <p className="text-xs opacity-60">Synthesis guidance recommended for new operators.</p>
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

      {/* Header */}
      <div className="border-b-2 border-terminal py-2 px-4 flex justify-between items-center bg-terminal/10">
        <div className="flex items-center gap-3">
          <Beaker size={20} className="animate-pulse" />
          <span className="font-bold tracking-widest uppercase">[ KITCHEN (주방) : R&D LAB ]</span>
        </div>
        <div className="text-[10px] opacity-60 flex items-center gap-4">
          <span>STATUS: OFFLINE (NO TIME LIMIT)</span>
          <button onClick={onCancel} className="hover:text-white transition-colors">[ EXIT ]</button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {step === 'SELECT' ? (
          <div className="flex-1 flex flex-col p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-6 border-b border-terminal/30 pb-2">
              <BookOpen size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Recipe Database</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
              
              {/* Embedded Tutorial Messages */}
              {isTutorialActive && tutorialStep === 1 && (
                <div className="col-span-1 md:col-span-2 border-2 border-yellow-500 bg-yellow-500/10 p-4 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/30 pb-1">-- SYSTEM MESSAGE --</h3>
                    <div className="text-[11px] text-yellow-500 leading-relaxed">
                      {"> Synthesis requires specific ingredients. Click the Cheese Burger project below to begin."}
                    </div>
                  </div>
                </div>
              )}
              {isTutorialActive && tutorialStep === 2 && (
                <div className="col-span-1 md:col-span-2 border-2 border-yellow-500 bg-yellow-500/10 p-4 shadow-[0_0_15px_rgba(234,179,8,0.2)] flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/30 pb-1">-- SYSTEM MESSAGE --</h3>
                    <div className="text-[11px] text-yellow-500 leading-relaxed mb-3">
                      {"> Recipe unlocked. Ensure you have ingredients by visiting [ WHOLESALE MARKET ]."}
                    </div>
                    <button 
                      onClick={() => {
                        setIsTutorialActive(false);
                        onCompleteTutorial();
                        onCancel(); // Automatically return to the Main Menu
                      }}
                      className="bg-yellow-500 text-black px-6 py-2 uppercase font-bold tracking-tighter hover:bg-white transition-all active:scale-95 text-xs"
                    >
                      [ ACKNOWLEDGED ]
                    </button>
                  </div>
                </div>
              )}

              {/* Recipe Grid (Filtered during tutorial) */}
              {RECIPE_DATABASE.filter(recipe => {
                // Hide other projects during Step 1 to prevent misclicks
                if (isTutorialActive && tutorialStep === 1) {
                  return recipe.id === 'burger' || recipe.id === 'cheeseburger';
                }
                // Hide all projects during Step 2 to force the player to click Acknowledge
                if (isTutorialActive && tutorialStep === 2) {
                  return false;
                }
                return true;
              }).map(recipe => {
                const isUnlocked = unlockedRecipes.includes(recipe.id);
                const isTutorialHighlight = isTutorialActive && tutorialStep === 1 && recipe.id === 'cheeseburger';

                return (
                  <button
                    key={recipe.id}
                    onClick={() => !isUnlocked && startSynthesis(recipe)}
                    disabled={isUnlocked}
                    className={`text-left p-4 border transition-all relative group ${
                      isUnlocked 
                        ? 'border-terminal/20 opacity-50 cursor-default' 
                        : isTutorialHighlight
                          ? 'border-yellow-500 bg-yellow-500/20 scale-[1.02] shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10'
                          : 'border-terminal/40 hover:border-terminal hover:bg-terminal/5'
                    }`}
                  >
                    {isTutorialHighlight && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[8px] px-1 font-bold animate-pulse z-20">
                        [ TUTORIAL TARGET ]
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold uppercase tracking-tighter">
                        {isUnlocked ? recipe.name : `Project #${recipe.id.slice(0, 3).toUpperCase()}`}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-1.5 h-1.5 ${i < recipe.complexity ? 'bg-terminal' : 'bg-terminal/10'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">
                      {isUnlocked ? recipe.koName : '????????'}
                    </h3>
                    <p className="text-[10px] opacity-60 leading-tight h-8 overflow-hidden">
                      {isUnlocked ? recipe.description : 'Recipe silhouette detected. Synthesis required to unlock details.'}
                    </p>

                    {isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 size={14} style={{ color: 'var(--terminal-color)' }} />
                      </div>
                    )}

                    {!isUnlocked && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-yellow-500 uppercase">Ready for Synthesis</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-6 overflow-hidden" onClick={handleContainerClick}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
              {/* Left Column: Raw Materials */}
              <div className="flex flex-col h-full gap-4 overflow-hidden">
                <section className="border border-terminal/30 p-4 bg-terminal/5 shrink-0">
                  <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-terminal/20 pb-1">
                    [ Raw Materials Available ]
                  </h3>
                  <div className="space-y-2">
                    {selectedRecipe?.ingredients.map(ing => (
                      <div key={ing.id} className="flex items-center gap-2 text-xs">
                        <span className="opacity-40">&gt;</span>
                        <span>{ing.koName}</span>
                        <span className="text-[10px] opacity-40">({ing.id})</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-terminal/30 p-4 bg-terminal/5 shrink-0">
                  <h3 className="text-[10px] font-bold mb-4 flex items-center gap-2 uppercase tracking-widest border-b border-terminal/20 pb-1">
                    [ Available Methods ]
                  </h3>
                  <div className="space-y-2">
                    {selectedRecipe?.methods.map(met => (
                      <div key={met.id} className="flex items-center gap-2 text-xs">
                        <span className="opacity-40">&gt;</span>
                        <span>{met.koName}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="border border-terminal/30 p-4 bg-terminal/5 flex-grow overflow-y-auto break-words">
                  <h3 className="text-[10px] font-bold mb-2 uppercase tracking-widest border-b border-terminal/20 pb-1">
                    [ Discovery Log ]
                  </h3>
                  <div className="text-[10px] space-y-1 opacity-60">
                    <div>&gt; Base "Burger" recipe already known.</div>
                    <div>&gt; Synthesizing "{selectedRecipe?.koName}" will create a higher profit margin item.</div>
                    <div>&gt; Complexity Level: {selectedRecipe?.complexity}/5</div>
                    <div className="mt-2 opacity-40 italic">-- END OF LOG --</div>
                  </div>
                </section>
              </div>

              {/* Center Column: Synthesis Terminal */}
              <div className="lg:col-span-2 flex flex-col space-y-6 overflow-hidden">
                <div className="terminal-border p-6 bg-[#0c0c0c] flex-1 flex flex-col relative">
                  <div className="absolute top-2 right-4 text-[8px] opacity-40 uppercase tracking-widest">
                    Project #{selectedRecipe?.id.toUpperCase()}
                  </div>

                  <div className="flex-1 space-y-8">
                    <div className="space-y-2">
                      <div className="text-xs opacity-60 uppercase tracking-widest">Target Dish:</div>
                      <div className="text-3xl font-bold border-b-2 border-terminal pb-2">
                        [ {selectedRecipe?.koName} ({selectedRecipe?.name}) ]
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase text-yellow-500">
                        <Zap size={14} /> [ Step {currentStepIndex + 1}: Input Component ]
                      </div>
                      <p className="text-xs opacity-70">Type the Hangul to stabilize the component:</p>
                      
                      <div className="space-y-4">
                        {allSteps.map((s, i) => (
                          <div key={`${s.id}-${i}`} className={`flex items-center gap-4 text-lg ${i < currentStepIndex ? 'opacity-40' : i === currentStepIndex ? 'opacity-100' : 'opacity-20'}`}>
                            <span className="text-xs font-bold w-4">{i + 1}.</span>
                            <div className={`px-4 py-2 ${i === currentStepIndex ? 'bg-terminal/5 border-l-4 border-yellow-500' : 'border-l-4 border-transparent'}`}>
                              {i < currentStepIndex ? s.koName : i === currentStepIndex ? (
                                <span className="flex items-center font-bold tracking-widest">
                                  {inputValue.split('').map((char, charIdx) => (
                                    <span key={`${char}-${charIdx}`} className={char === s.koName[charIdx] ? 'text-terminal' : 'text-red-500'}>
                                      {char}
                                    </span>
                                  ))}
                                  <span className="opacity-30">{s.koName.slice(inputValue.length)}</span>
                                </span>
                              ) : '????'}
                            </div>
                            <span className="text-xs opacity-40">({s.koName === '굽다' ? 'Grill' : s.koName === '튀기다' ? 'Fry' : s.id})</span>
                            {i < currentStepIndex && <CheckCircle2 size={16} style={{ color: 'var(--terminal-color)' }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="mt-auto pt-4 border-t border-terminal/20 space-y-2 relative">
                    
                    <div className="h-6">
                      <AnimatePresence>
                        {feedback && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`text-xs flex items-center gap-2 font-bold ${feedback.type === 'error' ? 'text-red-400' : 'text-terminal'}`}
                          >
                            {feedback.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                            {feedback.message}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                          <Keyboard size={12} /> Keyboard Input
                        </div>
                        {romanizationEnabled && (
                          <div className={`text-[10px] font-bold transition-all ${isTutorialActive && tutorialStep === 1 ? 'text-yellow-500 bg-yellow-500/20 px-2 py-1 border border-yellow-500/50 animate-pulse' : 'text-yellow-500'}`}>
                            QWERTY HINT: type {currentTarget.qwertyHint}
                          </div>
                        )}
                      </div>
                      <input
                        ref={inputRef}
                        autoFocus
                        type="text"
                        value={inputValue}
                        onChange={handleType}
                        disabled={isSynthesizing}
                        className={`w-full bg-black border-2 p-3 text-xl focus:outline-none tracking-widest text-yellow-500 transition-all ${
                          isTutorialActive && tutorialStep === 1
                            ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)] focus:ring-2 focus:ring-yellow-500/50 placeholder:text-yellow-500/50'
                            : 'border-terminal focus:ring-2 focus:ring-terminal/50'
                        }`}
                        placeholder="[ TYPE HANGUL HERE ]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-terminal py-1 px-4 flex justify-between items-center text-[8px] opacity-40 uppercase tracking-[0.2em] bg-terminal/5">
        <span>R&D Lab Terminal v4.0</span>
        <span>No Time Limit - Focus on Accuracy</span>
      </div>

      {/* Synthesis Overlay */}
      <AnimatePresence>
        {isSynthesizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative">
              <FlaskConical size={80} className="animate-bounce" style={{ color: 'var(--terminal-color)' }} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute -inset-4 border-2 border-dashed border-terminal rounded-full"
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-widest uppercase animate-pulse">Stabilizing Recipe</h2>
              <p className="text-xs opacity-60">Molecular structure of {selectedRecipe?.koName} confirmed...</p>
            </div>
            <div className="w-64 h-2 bg-terminal/10 border border-terminal/30 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
                className="h-full bg-terminal"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
