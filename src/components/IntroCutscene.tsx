/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, AlertTriangle, ChevronRight, Play } from 'lucide-react';

interface IntroCutsceneProps {
  onComplete: (skipTutorial?: boolean) => void;
}

const SCENES = [
  {
    title: "THE CORPORATE GRIND",
    content: [
      `[ TRADING TERMINAL v9.4 ] // CONNECTION: SECURE // UPTIME: 18h 42m
----------------------------------------------------------------------------------------
    _ ___ ___     
   | |   |   |            [ INTERNAL MEMO ]: Q3 targets missed. Weekend shifts are mandatory.
   | | 📉| 📈|    
   | |___|___|            [ BANK ALERT ]   : Rent auto-draft in 3 days. Balance insufficient.
     [___]        
      /|\\        
     / | \\        
========================================================================================`,
      `[ TRADING TERMINAL v9.4 ] // CONNECTION: SECURE // UPTIME: 18h 42m
----------------------------------------------------------------------------------------
    _ ___ ___     
   | |   |   |            [ INTERNAL MEMO ]: Q3 targets missed. Weekend shifts are mandatory.
   | | --| --|    
   | |___|___|            [ BANK ALERT ]   : Rent auto-draft in 3 days. Balance insufficient.
     [___]        
      /|\\        
     / | \\        
========================================================================================`
    ],
    thoughts: [
      "2:14 AM. The market closed 8 hours ago, but the boss's demands didn't.",
      "My stomach is literally eating itself. I haven't eaten a hot meal in days.",
      "Is this it? Staring at red and green lines until my heart gives out?"
    ]
  },
  {
    title: "THE WAY OUT",
    content: [
      `[ ADVERTISEMENT OVERRIDE ] // SPAM FILTER: BYPASSED
----------------------------------------------------------------------------------------
   _  __     ___ ___ _____ ___ 
  | |/ / ___| _ )_ _|_   _| __|
  | ' < |___| _ \\| |  | | | _| 
  |_|\\_\\    |___/___| |_| |___|
                               
[!] K-BITE EXPRESS IS HIRING REMOTE OPERATORS
> Control automated food trucks globally.
> Zero commute. Work via neural-net terminal.
> DAILY PAYOUTS. BE YOUR OWN BOSS.
========================================================================================`,
      `[ ADVERTISEMENT OVERRIDE ] // SPAM FILTER: BYPASSED
----------------------------------------------------------------------------------------
   _  __     ___ ___ _____ ___ 
  | |/ / ___| _ )_ _|_   _| __|
  | ' < |___| _ \\| |  | | | _| 
  |_|\\_\\    |___/___| |_| |___|
                               
>>> K-BITE EXPRESS IS HIRING REMOTE OPERATORS
> Control automated food trucks globally.
> Zero commute. Work via neural-net terminal.
> DAILY PAYOUTS. BE YOUR OWN BOSS. █
========================================================================================`
    ],
    thoughts: [
      "A remote robotics operator? I play enough video games, how hard could it be?",
      "Daily payouts... that would actually cover rent by Friday.",
      "Zero physical human interaction. No boss hovering over my cubicle.",
      "I'm sending the application. I have nothing left to lose."
    ]
  },
  {
    title: "THE CALL TO ACTION",
    content: [
      `[ INBOX: 1 NEW SECURE MESSAGE ]
----------------------------------------------------------------------------------------
    ___  _  _  _  _  _  _  _  _  _ 
   / _ \\| || || || || || || || || |
  | (_) | || || || || || || || || |
   \\___/|_||_||_||_||_||_||_||_||_|
                                   
[ LOADING ASSETS... 100% ]
[ ESTABLISHING CONNECTION TO UNIT #404... OK ]
[ SYNCING LOCAL UI... OK ]
========================================================================================`,
      `[ INBOX: 1 NEW SECURE MESSAGE ]
----------------------------------------------------------------------------------------
    ___  _  _  _  _  _  _  _  _  _ 
   / _ \\|#||#||#||#||#||#||#||#||#|
  | (O) |#||#||#||#||#||#||#||#||#|
   \\___/|_||_||_||_||_||_||_||_||_|
                                   
[ LOADING ASSETS... 100% ]
[ ESTABLISHING CONNECTION TO UNIT #404... OK ]
[ SYNCING LOCAL UI... OK ] █
========================================================================================`
    ],
    thoughts: [
      "Day 4. No response. I was about to give up and accept my fate.",
      "Then... the terminal client downloaded itself.",
      "I just submitted my two-week notice. Actually, make that a two-minute notice.",
      "Let's see what this K-BITE system can do."
    ]
  }
];

const IntroCutscene: React.FC<IntroCutsceneProps> = ({ onComplete }) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [isConfirmingSkipTutorial, setIsConfirmingSkipTutorial] = useState(false);
  const [frame, setFrame] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setFrame(prev => prev + 1);
    }, 800); // Swaps frame every 800ms
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    if (currentScene < SCENES.length - 1) {
      setCurrentScene(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#0c0c0c] flex items-center justify-center p-4 font-mono overflow-hidden">
      {/* CRT Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10" />
      
      <div className="w-full max-w-4xl terminal-border bg-black/40 p-6 sm:p-8 relative z-20 shadow-[0_0_50px_rgba(var(--terminal-color-rgb),0.1)]">
        {/* Skip Button */}
        <button 
          onClick={() => setShowSkipConfirm(true)}
          className="absolute top-2 right-2 text-[8px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
          style={{ color: 'var(--terminal-color)' }}
        >
          [ SKIP INTRO ]
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="text-[10px] font-bold opacity-50 flex items-center gap-2">
                <Terminal size={12} />
                <span>SCENE {currentScene.toString().padStart(2, '0')} // {SCENES[currentScene].title}</span>
              </div>
              <pre className="text-[10px] sm:text-xs leading-tight whitespace-pre-wrap" style={{ color: 'var(--terminal-color)' }}>
                {Array.isArray(SCENES[currentScene].content) 
                  ? SCENES[currentScene].content[frame % SCENES[currentScene].content.length] 
                  : SCENES[currentScene].content}
              </pre>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold opacity-50">[ THOUGHT LOG ]:</div>
              <div className="space-y-2">
                {SCENES[currentScene].thoughts.map((thought, i) => {
                  const safeThought = thought || '';
                  return (
                    <motion.div 
                      key={`${currentScene}-${i}-${safeThought.substring(0, 5)}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.5 }}
                      className="text-xs sm:text-sm italic opacity-80 whitespace-nowrap"
                      style={{ color: 'var(--terminal-color)' }}
                    >
                      &gt; "{safeThought}"
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              {currentScene === SCENES.length - 1 ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                  {isConfirmingSkipTutorial ? (
                    <button 
                      onClick={() => onComplete(true)}
                      className="px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black font-bold flex items-center space-x-2 transition-colors animate-pulse text-xs tracking-widest"
                    >
                      <span>[ CONFIRM SKIP ALL TUTORIALS? ]</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsConfirmingSkipTutorial(true)}
                      className="px-4 py-2 border-2 border-terminal/30 text-terminal/60 hover:bg-terminal/20 hover:text-terminal font-bold flex items-center space-x-2 transition-colors text-xs tracking-widest"
                    >
                      <span>SKIP ONBOARDING</span>
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 border-2 border-terminal/50 hover:bg-terminal hover:text-black transition-all font-bold text-xs tracking-widest group text-terminal"
                  >
                    <Play size={14} />
                    <span>START SHIFT 000 (ORIENTATION)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 border-2 border-terminal/50 hover:bg-terminal hover:text-black transition-all font-bold text-xs tracking-widest group text-terminal"
                >
                  <span>NEXT</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip Confirmation Modal */}
      <AnimatePresence>
        {showSkipConfirm && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs terminal-border bg-[#0c0c0c] p-6 text-center space-y-6 border-red-500/50"
            >
              <div className="flex justify-center">
                <AlertTriangle size={48} className="text-red-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-red-500 font-bold tracking-widest uppercase">WARNING: SKIP ORIENTATION LORE?</h3>
                <p className="text-[10px] opacity-60" style={{ color: 'var(--terminal-color)' }}>
                  You will miss the backstory of your transition from corporate drone to K-BITE operator.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowSkipConfirm(false)}
                  className="py-2 border border-terminal/30 text-[10px] font-bold hover:bg-terminal/10 transition-all"
                  style={{ color: 'var(--terminal-color)' }}
                >
                  [ CANCEL ]
                </button>
                <button 
                  onClick={handleSkip}
                  className="py-2 bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 transition-all"
                >
                  [ YES, SKIP ]
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IntroCutscene;
