/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Monitor, Languages, AlertTriangle, Play } from 'lucide-react';

import { ThemeColor } from '../types';

interface SettingsMenuProps {
  onClose: () => void;
  settings: {
    romanization: boolean;
    crtEffects: boolean;
    phosphorFlash: boolean;
    bgmVolume: number;
    sfxVolume: number;
    themeColor: ThemeColor;
    isColorSettingUnlocked: boolean;
    unlockedThemes: ThemeColor[];
  };
  onUpdate: (newSettings: any) => void;
  onResetData: () => void;
  onReplayIntro: () => void;
}

const ALL_THEME_OPTIONS: { id: ThemeColor, label: string }[] = [
  { id: 'GREEN', label: 'PHOSPHOR GREEN' },
  { id: 'AMBER', label: 'WARM AMBER' },
  { id: 'CYAN', label: 'SCI-FI CYAN' },
  { id: 'MONOCHROME', label: 'MONOCHROME' },
  { id: 'CRIMSON', label: 'CRIMSON RED' },
  { id: 'NEON_PINK', label: 'NEON PINK' },
  { id: 'GOLD', label: 'EXECUTIVE GOLD' },
  { id: 'GLITCH', label: 'GLITCH GREY' }
];

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose, settings, onUpdate, onResetData, onReplayIntro }) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [activeTab, setActiveTab] = useState<'DISPLAY' | 'AUDIO' | 'SYSTEM'>('DISPLAY');

  const isDeleteDisabled = confirmText !== 'DELETE';

  const unlockedOptions = ALL_THEME_OPTIONS.filter(opt => 
    opt.id === 'GREEN' || (settings.unlockedThemes || []).includes(opt.id)
  );

  const cycleTheme = (direction: number) => {
    if (unlockedOptions.length === 0) return;
    const currentIndex = unlockedOptions.findIndex(opt => opt.id === settings.themeColor);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = unlockedOptions.length - 1;
    if (nextIndex >= unlockedOptions.length) nextIndex = 0;
    
    const nextOption = unlockedOptions[nextIndex];
    if (nextOption) {
      onUpdate({ ...settings, themeColor: nextOption.id });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md terminal-border bg-[#0c0c0c] font-mono overflow-hidden flex flex-col shadow-[0_0_50px_rgba(var(--terminal-color-rgb),0.2)]" style={{ color: 'var(--terminal-color)' }}>
        
        {/* Header */}
        <div className="border-b border-terminal/30 py-2 px-4 flex justify-between items-center bg-terminal/10">
          <span className="font-bold tracking-widest">[ SYSTEM CONFIGURATION ]</span>
          <button onClick={onClose} className="hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-terminal/50 px-2 pt-2 bg-terminal/5">
          {['DISPLAY', 'AUDIO', 'SYSTEM'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-[10px] font-bold transition-all uppercase tracking-widest border-t border-x ${
                activeTab === tab
                  ? 'bg-[#0c0c0c] border-terminal/50 text-terminal translate-y-[2px]'
                  : 'border-transparent text-terminal/40 hover:text-terminal/80 hover:bg-terminal/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="p-6 overflow-y-auto min-h-[380px] max-h-[60vh] custom-scrollbar">
          
          {/* ================= DISPLAY TAB ================= */}
          {activeTab === 'DISPLAY' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* CRT Phosphor Color */}
              <section className={`space-y-3 ${!settings.isColorSettingUnlocked ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold uppercase">
                      CRT Phosphor Color {!settings.isColorSettingUnlocked && '🔒'}
                    </span>
                  </div>
                  {settings.isColorSettingUnlocked ? (
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => cycleTheme(-1)}
                        className="w-8 h-8 border border-terminal flex items-center justify-center hover:bg-terminal/20 transition-colors"
                      >
                        &lt;
                      </button>
                      <div className="text-[10px] font-bold w-40 text-center border-b border-terminal/30 pb-1">
                        {ALL_THEME_OPTIONS.find(opt => opt.id === settings.themeColor)?.label}
                      </div>
                      <button 
                        onClick={() => cycleTheme(1)}
                        className="w-8 h-8 border border-terminal flex items-center justify-center hover:bg-terminal/20 transition-colors"
                      >
                        &gt;
                      </button>
                    </div>
                  ) : (
                    <div className="text-[9px] font-bold text-yellow-500/80 tracking-tighter animate-pulse border border-yellow-500/30 px-2 py-1 bg-yellow-500/5">
                      [ LOCKED: FINISH ORIENTATION ]
                    </div>
                  )}
                </div>
                <p className="text-[10px] opacity-60 leading-tight">
                  {settings.isColorSettingUnlocked 
                    ? "Select your preferred terminal aesthetic. Classic Phosphor Green, Warm Amber, Sci-Fi Cyan, or High-Contrast Monochrome."
                    : "Advanced aesthetic overrides are currently restricted. Complete your initial training to gain administrative control."}
                </p>
              </section>

              {/* CRT Effects */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold uppercase">CRT Effects (Scanlines)</span>
                  </div>
                  <button
                    onClick={() => onUpdate({ ...settings, crtEffects: !settings.crtEffects })}
                    className={`w-12 h-6 border-2 border-terminal relative transition-colors ${settings.crtEffects ? 'bg-terminal/20' : 'bg-transparent'}`}
                  >
                    <motion.div
                      animate={{ x: settings.crtEffects ? 24 : 0 }}
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-terminal"
                    />
                  </button>
                </div>
                <p className="text-[10px] opacity-60 leading-tight">
                  Enable/Disable retro scanlines and screen glow. Disable if you experience eye strain.
                </p>
              </section>

              {/* Phosphor Flash */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold uppercase">Phosphor Flash (Transitions)</span>
                  </div>
                  <button
                    onClick={() => onUpdate({ ...settings, phosphorFlash: !settings.phosphorFlash })}
                    className={`w-12 h-6 border-2 border-terminal relative transition-colors ${settings.phosphorFlash ? 'bg-terminal/20' : 'bg-transparent'}`}
                  >
                    <motion.div
                      animate={{ x: settings.phosphorFlash ? 24 : 0 }}
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-terminal"
                    />
                  </button>
                </div>
                <p className="text-[10px] opacity-60 leading-tight">
                  Toggle the bright white flash when switching screens. Turn OFF if sensitive to flashing lights.
                </p>
              </section>
            </div>
          )}

          {/* ================= AUDIO TAB ================= */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <section className="space-y-8">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={18} className="text-yellow-500" />
                  <span className="text-sm font-bold uppercase">Master Audio Mix</span>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span>BGM (Background Synth)</span>
                      <span className="text-terminal">{settings.bgmVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.bgmVolume}
                      onChange={(e) => onUpdate({ ...settings, bgmVolume: parseInt(e.target.value) })}
                      className="w-full accent-terminal bg-terminal/20 h-1.5 appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold">
                      <span>SFX (Mechanical/Sizzle)</span>
                      <span className="text-terminal">{settings.sfxVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sfxVolume}
                      onChange={(e) => onUpdate({ ...settings, sfxVolume: parseInt(e.target.value) })}
                      className="w-full accent-terminal bg-terminal/20 h-1.5 appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ================= SYSTEM TAB ================= */}
          {activeTab === 'SYSTEM' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Romanization */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold uppercase">Romanization (로마자 표기)</span>
                  </div>
                  <button
                    onClick={() => onUpdate({ ...settings, romanization: !settings.romanization })}
                    className={`w-12 h-6 border-2 border-terminal relative transition-colors ${settings.romanization ? 'bg-terminal/20' : 'bg-transparent'}`}
                  >
                    <motion.div
                      animate={{ x: settings.romanization ? 24 : 0 }}
                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-terminal"
                    />
                  </button>
                </div>
                <p className="text-[10px] opacity-60 leading-tight">
                  Toggle English pronunciation hints. Turn OFF to challenge your Hangul reading skills.
                </p>
              </section>

              {/* Replay Intro */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play size={18} className="text-yellow-500" />
                    <span className="text-sm font-bold uppercase">Orientation Lore</span>
                  </div>
                  <button
                    onClick={() => {
                      onReplayIntro();
                      onClose();
                    }}
                    className="px-4 py-1.5 border border-terminal text-[10px] font-bold uppercase hover:bg-terminal/20 transition-all"
                  >
                    [ REPLAY INTRO ]
                  </button>
                </div>
                <p className="text-[10px] opacity-60 leading-tight">
                  Review the data logs regarding your transition from corporate drone to K-BITE operator.
                </p>
              </section>

              {/* Danger Zone */}
              <section className="pt-4 border-t border-terminal/20">
                <div className="flex items-center gap-2 mb-3 text-red-500">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-bold uppercase">Danger Zone</span>
                </div>
                
                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-2 border border-red-500 text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    [ FORMAT C: DRIVE (DELETE USER DATA) ]
                  </button>
                ) : (
                  <div className="space-y-4 p-4 border border-red-500 bg-red-500/5">
                    <div className="space-y-2">
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-tighter">
                        &gt; WARNING: CRITICAL DATA LOSS IMMINENT.
                      </p>
                      <p className="text-[10px] text-red-400 opacity-80 leading-tight">
                        Type "DELETE" below to authorize system wipe. This will erase all funds, unlocks, and progress.
                      </p>
                    </div>

                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                      placeholder="TYPE 'DELETE' HERE"
                      className="w-full bg-black border border-red-500 p-2 text-xs text-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-red-900"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowConfirmReset(false);
                          setConfirmText('');
                        }}
                        className="flex-1 py-2 border border-terminal text-terminal text-[10px] uppercase font-bold hover:bg-terminal/10"
                      >
                        ABORT
                      </button>
                      <button
                        disabled={isDeleteDisabled}
                        onClick={() => {
                          onResetData();
                          setShowConfirmReset(false);
                          onClose();
                        }}
                        className={`flex-1 py-2 text-white text-[10px] uppercase font-bold transition-all ${
                          isDeleteDisabled 
                            ? 'bg-red-900/50 cursor-not-allowed opacity-50' 
                            : 'bg-red-600 hover:bg-red-700 animate-pulse'
                        }`}
                      >
                        ERASE DATA
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-terminal/5 flex justify-center border-t border-terminal/30">
          <button
            onClick={onClose}
            className="text-[10px] opacity-40 hover:opacity-100 transition-opacity uppercase tracking-[0.3em]"
          >
            -- RETURN TO SYSTEM --
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsMenu;
