/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Moon, TrendingUp, AlertCircle, Save, CheckCircle2, XCircle } from 'lucide-react';
import { DayHistory, CalendarEvent, UnlockNotification } from '../types';

interface CalendarScreenProps {
  currentDay: number;
  history: DayHistory[];
  events: CalendarEvent[];
  onSleep: () => void;
  onGoToMarket: () => void;
  unlockNotification: UnlockNotification | null;
}

const DAYS_OF_WEEK = [
  { en: 'MON', ko: '월' },
  { en: 'TUE', ko: '화' },
  { en: 'WED', ko: '수' },
  { en: 'THU', ko: '목' },
  { en: 'FRI', ko: '금' },
  { en: 'SAT', ko: '토' },
  { en: 'SUN', ko: '일' }
];

export default function CalendarScreen({ currentDay, history, events, onSleep, onGoToMarket, unlockNotification }: CalendarScreenProps) {
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [saveProgress, setSaveProgress] = useState(0);

  useEffect(() => {
    // Trigger auto-save simulation
    const simulateSave = async () => {
      setSaveStatus('SAVING');
      for (let i = 0; i <= 100; i += 10) {
        setSaveProgress(i);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      setSaveStatus('SUCCESS');
    };

    simulateSave();
  }, []);

  // Generate 14 days for the calendar view
  const calendarDays = Array.from({ length: 14 }, (_, i) => i + 1);
  
  const getDayData = (day: number) => history.find(h => h.day === day);
  const getDayEvents = (day: number) => events.filter(e => e.day === day);

  return (
    <div className="flex flex-col h-full bg-black font-mono p-4 border-2 border-terminal shadow-[0_0_20px_rgba(var(--terminal-color-rgb),0.2)] overflow-hidden" style={{ color: 'var(--terminal-color)' }}>
      {/* Header */}
      <div className="border-b-2 border-terminal pb-2 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <CalendarIcon size={24} />
          <h1 className="text-xl font-bold tracking-tighter uppercase">[ END OF DAY REPORT ]</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onGoToMarket}
            className="border border-terminal text-terminal px-4 py-1 font-bold hover:bg-terminal hover:text-black transition-all flex items-center gap-2 text-xs"
          >
            <TrendingUp size={14} /> [ GO TO WHOLESALE MARKET ]
          </button>
          <button 
            onClick={onSleep}
            className="bg-terminal text-black px-6 py-1 font-bold hover:bg-white transition-all flex items-center gap-2 text-xs"
          >
            <Moon size={14} /> NEXT ACTION: SLEEP (수면)
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Left: Calendar Grid */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              [ CALENDAR ] MAY (5월 - O-wol)
            </h2>
            <span className="text-[10px] opacity-50">Sino-Korean Dates: [Number] + 일</span>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_OF_WEEK.map(d => (
              <div key={d.en} className="text-center py-1 bg-terminal/10 border border-terminal/20">
                <div className="text-[10px] font-bold">{d.en}</div>
                <div className="text-[12px]">{d.ko}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map(dayNum => {
              const data = getDayData(dayNum);
              const dayEvents = getDayEvents(dayNum);
              const isToday = dayNum === currentDay;
              const isPast = dayNum < currentDay;

              return (
                <div 
                  key={dayNum} 
                  className={`border p-1 flex flex-col min-h-[80px] transition-all ${
                    isToday ? 'border-terminal bg-terminal/10 ring-1 ring-terminal' : 
                    isPast ? 'border-terminal/30 bg-black/50' : 
                    'border-terminal/10 opacity-40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold">{dayNum}일</span>
                    {isToday && <span className="text-[8px] bg-terminal text-black px-1 font-bold">TODAY</span>}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    {data ? (
                      <>
                        <div className={`text-[10px] font-bold ${data.isAlba ? 'text-yellow-500' : 'text-terminal'}`}>
                          {data.isAlba ? '[ALBA]' : `+${(data.earnings / 10000).toFixed(1)}만₩`}
                        </div>
                        <div className="text-[8px] opacity-50">(Clear)</div>
                      </>
                    ) : isToday ? (
                      <div className="text-[8px] animate-pulse">======</div>
                    ) : null}

                    {dayEvents.map((e, i) => (
                      <div key={`${e.title}-${i}`} className="text-[8px] text-red-500 font-bold mt-1 animate-pulse">
                        *{e.koTitle}*
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Forecast & Events */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Unlock Notification */}
          <AnimatePresence>
            {unlockNotification && (
              <motion.section 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="border-2 border-white bg-white/10 p-4 relative overflow-hidden flex-shrink-0"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-white animate-pulse" />
                <h3 className="text-xs font-black text-white mb-2 flex items-center gap-2">
                  [ SYSTEM OVERRIDE: NEW PRIVILEGE ESCALATION ]
                </h3>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white">MILESTONE: {unlockNotification.milestone}</p>
                  <p className="text-[10px] text-white/80">REWARD: {unlockNotification.reward}</p>
                  <p className="text-[8px] mt-2 opacity-60 italic">Apply new phosphor color in SETTINGS menu.</p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10">
            <section className="border border-terminal p-4 bg-[#001a00] flex flex-col">
              <h3 className="text-xs font-bold mb-4 flex items-center gap-2 border-b border-terminal/30 pb-2">
                <TrendingUp size={16} /> [ FORECAST & EVENTS ]
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-white mb-1">TODAY (오늘):</div>
                  <p className="text-[10px] opacity-80 leading-relaxed">
                    {getDayData(currentDay)?.isAlba 
                      ? "Worked a part-time job to cover expenses. Meager earnings, but survival is key."
                      : "Shift completed. Market prices stable. Customer feedback being processed."}
                  </p>
                </div>

                {events.filter(e => e.day >= currentDay).map((e, i) => (
                  <div key={i} className={`p-2 border ${e.day === currentDay + 1 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-terminal/20'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-white uppercase">
                        {e.day === currentDay + 1 ? 'TOMORROW (내일)' : `${DAYS_OF_WEEK[(e.day - 1) % 7].en}, ${e.day}일`}
                      </span>
                      <span className={`text-[8px] px-1 border ${e.type === 'RENT' ? 'border-red-500 text-red-500' : 'border-blue-400 text-blue-400'}`}>
                        {e.type}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-terminal mb-1">{e.koTitle} ({e.title})</div>
                    <p className="text-[9px] opacity-70 leading-tight mb-2">{e.description}</p>
                    {e.impact && (
                      <div className="text-[8px] bg-terminal/10 p-1 border-l-2 border-terminal">
                        IMPACT: {e.impact}
                      </div>
                    )}
                  </div>
                ))}

                {events.filter(e => e.day >= currentDay).length === 0 && (
                  <div className="text-[10px] opacity-40 italic text-center py-8">
                    No upcoming events detected.
                  </div>
                )}
              </div>
            </section>

            {/* Auto-Save Effect */}
            <section className="border border-terminal p-3 bg-black">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold flex items-center gap-2">
                  <Save size={12} /> DISK WRITE
                </h3>
                <span className="text-[8px] opacity-50">LOCAL_STORAGE_V1.0</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-terminal/10 border border-terminal/20 overflow-hidden">
                  <motion.div 
                    className="h-full bg-terminal"
                    initial={{ width: 0 }}
                    animate={{ width: `${saveProgress}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[8px] animate-pulse">
                    {saveStatus === 'SAVING' && 'COMMITTING DATA...'}
                    {saveStatus === 'SUCCESS' && 'PROGRESS SECURED.'}
                    {saveStatus === 'ERROR' && '[ WRITE ERROR ]'}
                  </span>
                  {saveStatus === 'SUCCESS' && <CheckCircle2 size={10} className="text-terminal" />}
                  {saveStatus === 'ERROR' && <XCircle size={10} className="text-red-500" />}
                </div>
              </div>
            </section>

            <section className="border border-red-500/50 p-4 bg-red-900/10">
              <h3 className="text-xs font-bold text-red-500 mb-2 flex items-center gap-2">
                <AlertCircle size={14} /> FINANCIAL ADVISORY
              </h3>
              <div className="text-[10px] space-y-2">
                <p>Next Rent Due: <span className="text-white font-bold">9일</span></p>
                <p>Amount: <span className="text-red-400 font-bold">150,000₩ (십오만 원)</span></p>
                <div className="h-1 w-full bg-red-900/30 mt-2">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${Math.min(100, (currentDay / 9) * 100)}%` }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
