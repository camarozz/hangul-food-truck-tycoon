import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFrontViewAscii } from '../App';
import { TruckConfig } from '../types';

interface SystemBootSequenceProps {
  onComplete: () => void;
  isFastBoot?: boolean;
  truckConfig: TruckConfig;
}

const BOOT_MESSAGES = [
  "> INITIATING SECURE HANDSHAKE...",
  "> CONNECTING TO K-BITE MAINFRAME [NODE 7]... OK",
  "> DOWNLOADING OPERATOR CLIENT v1.1.0...",
  "> INSTALLING NEURAL-LINK PROXY DRIVERS... OK",
  "> SYNCING ROBOTICS ARM (UNIT #404)... OK",
  "> OVERRIDING LOCAL DISPLAY... OK",
  "> SYSTEM READY. HANDING OVER CONTROL."
];

export default function SystemBootSequence({ onComplete, isFastBoot = false, truckConfig }: SystemBootSequenceProps) {
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  // Generate the Truck using the player's actual customized config!
  const bootTruckAscii = getFrontViewAscii(truckConfig).replace(/^\n/, '').trimEnd().split('\n');

  useEffect(() => {
    let currentLogIndex = 0;
    const totalSteps = BOOT_MESSAGES.length;
    const totalDuration = isFastBoot ? 800 : 4500; // Fast boot completes in 0.8s
    const stepInterval = totalDuration / totalSteps;

    const interval = setInterval(() => {
      if (currentLogIndex < totalSteps) {
        setBootLog(prev => [...prev, BOOT_MESSAGES[currentLogIndex]]);
        currentLogIndex++;
        
        // Update progress based on index
        const newProgress = Math.round((currentLogIndex / totalSteps) * 100);
        setProgress(newProgress);
      } else {
        clearInterval(interval);
        setTimeout(onComplete, isFastBoot ? 200 : 1000);
      }
    }, stepInterval);

    return () => clearInterval(interval);
  }, [onComplete, isFastBoot]);

  const renderProgressBar = () => {
    const barWidth = 20;
    const completedBlocks = Math.round((progress / 100) * barWidth);
    const remainingBlocks = barWidth - completedBlocks;
    const bar = '█'.repeat(completedBlocks) + '-'.repeat(remainingBlocks);
    
    return (
      <div className="font-mono text-[10px] sm:text-xs tracking-widest space-y-2 mt-8">
        <div className="flex justify-between items-center opacity-70">
          <span>[ INSTALLING OPERATOR CLIENT ]</span>
          <span>{progress}%</span>
        </div>
        <div className="flex space-x-2">
          <span>[</span>
          <span className="text-terminal">{bar}</span>
          <span>]</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-[#0c0c0c] flex items-center justify-center p-4 overflow-hidden font-mono">
      {/* CRT Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-xl p-8 terminal-border bg-black/40 relative z-20 shadow-[0_0_50px_rgba(0,255,65,0.1)]"
        style={{ color: 'var(--terminal-color)' }}
      >
        <div className="space-y-1 mb-6">
          <div className="text-[10px] opacity-40 uppercase tracking-[0.3em] font-bold">
            [ SECURE SYSTEM INITIALIZATION ]
          </div>
          <div className="h-px bg-terminal/30 w-full" />
        </div>

        {/* The correctly formatted Boot Truck */}
        <div className="flex justify-center mb-8 opacity-80">
          <pre 
            className="ascii-art text-[8px] sm:text-[10px] m-0" 
            style={{ 
              color: 'var(--terminal-color)',
              lineHeight: '1.2',
              fontFamily: "monospace, 'Courier New', Courier"
            }}
          >
            {bootTruckAscii.map((line, i) => (
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

        <div className="space-y-2 min-h-[160px]">
          <AnimatePresence>
            {bootLog.map((log, i) => {
              const safeLog = log || '';
              return (
                <motion.p
                  key={`bootlog-${safeLog.substring(0, 10)}-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] sm:text-xs leading-relaxed"
                >
                  {safeLog}
                </motion.p>
              );
            })}
          </AnimatePresence>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-terminal align-middle"
          />
        </div>

        {renderProgressBar()}

        <div className="mt-8 flex justify-between items-center text-[9px] opacity-30 uppercase tracking-widest border-t border-terminal/10 pt-4">
          <span>BOOT_CRC: OK</span>
          <span>MEM_ALLOC: 4096KB</span>
          <span>HANDSHAKE: ENCRYPTED</span>
        </div>
      </motion.div>
    </div>
  );
}
