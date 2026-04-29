/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, CheckCircle2, XCircle, UtensilsCrossed } from 'lucide-react';
import { NATIVE_NUMBERS, SINO_NUMBERS, toSinoKorean, toNativeKorean } from '../types';
import { audio } from '../audioManager';

interface AlbaMiniGameProps {
  onComplete: (earned: number) => void;
}

const GAME_DURATION = 30; // seconds
const TARGET_SCORE = 10;

export default function AlbaMiniGame({ onComplete }: AlbaMiniGameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [currentOrder, setCurrentOrder] = useState<{ native: string, value: number } | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const generateRound = useCallback(() => {
    // Ensure strictly 1-19
    const val = Math.floor(Math.random() * 19) + 1;
    
    // Use helper function instead of direct array access to handle 11-19
    // Add fallback to "하나" if somehow undefined
    const native = toNativeKorean(val) || "하나";
    
    // Generate 4 options
    const opts = [val];
    while (opts.length < 4) {
      const o = Math.floor(Math.random() * 19) + 1;
      if (!opts.includes(o)) opts.push(o);
    }
    
    setCurrentOrder({ native, value: val });
    setOptions(opts.sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsGameOver(true);
    }
  }, [timeLeft, isGameOver]);

  const handleChoice = (val: number) => {
    if (feedback || isGameOver) return;

    if (val === currentOrder?.value) {
      audio.playSFX('SUCCESS_CHIME');
      setScore(s => s + 1);
      setFeedback('CORRECT');
    } else {
      audio.playSFX('UI_ERROR');
      setFeedback('WRONG');
    }

    setTimeout(() => {
      setFeedback(null);
      generateRound();
    }, 600);
  };

  const handleFinish = () => {
    if (score > 0) audio.playSFX('CASH_REGISTER');
    else audio.playSFX('UI_ERROR');
    
    const payout = score * 1000;
    onComplete(payout);
  };

  return (
    <div className="flex flex-col h-full bg-black font-mono p-4 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] overflow-hidden" style={{ color: 'var(--terminal-color)' }}>
      <div className="bg-yellow-500 text-black px-4 py-2 font-bold flex items-center justify-between mb-6">
        <span className="flex items-center gap-2">
          <UtensilsCrossed size={20} />
          [ ALBA: DISH WASHING GRIND (설거지 알바) ]
        </span>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1"><Timer size={14} /> {timeLeft}s</div>
          <div className="bg-black text-yellow-500 px-2">SCORE: {score}/{TARGET_SCORE}</div>
        </div>
      </div>

      {!isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-xs opacity-60 uppercase tracking-widest">Customer Order (Native Korean)</h2>
            <motion.div 
              key={currentOrder?.native}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-bold text-white border-y-2 border-yellow-500/30 py-4 px-12"
            >
              {currentOrder?.native || "하나"}
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {options.map((val) => (
              <button
                key={val}
                onClick={() => handleChoice(val)}
                className="p-6 border-2 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all group relative overflow-hidden"
              >
                <div className="text-2xl font-bold text-white mb-1">
                  {toSinoKorean(val * 1000)}₩
                </div>
                <div className="text-[10px] opacity-40 uppercase">
                  {toSinoKorean(val * 1000)} 원
                </div>
                
                <AnimatePresence>
                  {feedback && val === currentOrder?.value && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 size={32} className="text-green-500" />
                    </motion.div>
                  )}
                  {feedback === 'WRONG' && val !== currentOrder?.value && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
                    >
                      <XCircle size={32} className="text-red-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>

          <div className="text-[10px] opacity-40 italic">
            Match the Native Korean order count to the correct Sino-Korean receipt price (1,000₩ per item).
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
          {score === 0 ? (
            <div className="space-y-6">
              <div className="text-red-500 text-6xl font-bold animate-bounce">!!!</div>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white uppercase">GET OUT!</h2>
                <p className="text-xl text-red-500 font-bold">Boss: "You didn't wash a single dish! Get out!"</p>
              </div>
              <div className="border-2 border-red-500 p-8 bg-red-500/10">
                <div className="text-xs opacity-50 uppercase text-red-500">Earnings</div>
                <div className="text-5xl font-bold text-white">0₩</div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white uppercase">Shift Complete!</h2>
                <p className="text-xl text-yellow-500">Shift over. Dishes washed: {score}.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border border-yellow-500/30 p-8 bg-yellow-500/5">
                <div>
                  <div className="text-xs opacity-50 uppercase">Orders Processed</div>
                  <div className="text-3xl font-bold text-white">{score}</div>
                </div>
                <div>
                  <div className="text-xs opacity-50 uppercase">Total Earned</div>
                  <div className="text-3xl font-bold text-terminal">{(score * 1000).toLocaleString()}₩</div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleFinish}
            className={`w-full max-w-sm py-4 font-bold text-xl transition-all uppercase ${score === 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-500 text-black hover:bg-white'}`}
          >
            {score === 0 ? '[ LEAVE IN SHAME ]' : '[ COLLECT WAGE ]'}
          </button>
        </div>
      )}
    </div>
  );
}
