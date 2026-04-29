/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, FileText, PenTool, Skull } from 'lucide-react';
import { toSinoKorean, toNativeKorean, LoanType, Word } from '../types';
import { audio } from '../audioManager';

interface BailoutScreenProps {
  money: number;
  loanType: LoanType;
  romanizationEnabled: boolean;
  onAccept: () => void;
  onGameOver: () => void;
}

export default function BailoutScreen({ money, loanType, romanizationEnabled, onAccept, onGameOver }: BailoutScreenProps) {
  const [signature, setSignature] = useState('');
  const [error, setError] = useState(false);
  
  // Loan Shark specific state
  const [contractSlots, setContractSlots] = useState<(Word | null)[]>([null, null, null]);
  const [isSharkSuccess, setIsSharkSuccess] = useState(false);

  useEffect(() => {
    audio.playSFX('ALARM_BEEP');
  }, []);

  const principal = 50000;
  const interest = loanType === 'BANK' ? 0.2 : 0.5;
  const totalDue = principal * (1 + interest);
  const dueDate = loanType === 'BANK' ? 3 : 2; // Days

  const handleSign = () => {
    if (loanType === 'BANK') {
      if (signature.trim() === '동의') {
        audio.playSFX('CASH_REGISTER');
        onAccept();
      } else {
        audio.playSFX('UI_ERROR');
        setError(true);
        setTimeout(() => setError(false), 1000);
      }
    } else {
      // Loan Shark logic
      if (isSharkSuccess) {
        audio.playSFX('CASH_REGISTER');
        onAccept();
      } else {
        audio.playSFX('UI_ERROR');
        setError(true);
        setTimeout(() => setError(false), 1000);
      }
    }
  };

  const SHARK_WORDS: Word[] = [
    { id: 'shark_subj', text: '내가', meaning: 'I (Formal)', type: 'subject', politeness: 'FORMAL' },
    { id: 'shark_obj', text: '돈을', meaning: 'Money', type: 'object' },
    { id: 'shark_verb', text: '갚겠습니다', meaning: 'Will Repay (Formal)', type: 'verb', politeness: 'FORMAL' }
  ];

  const handleSharkAssign = (word: Word) => {
    const newSlots = [...contractSlots];
    if (word.type === 'subject') newSlots[0] = word;
    if (word.type === 'object') newSlots[1] = word;
    if (word.type === 'verb') newSlots[2] = word;
    setContractSlots(newSlots);

    // Check if all slots filled correctly
    if (newSlots[0]?.id === 'shark_subj' && newSlots[1]?.id === 'shark_obj' && newSlots[2]?.id === 'shark_verb') {
      setIsSharkSuccess(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black font-mono p-4 border-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.3)] overflow-hidden" style={{ color: 'var(--terminal-color)' }}>
      <div className="bg-red-600 text-white px-4 py-2 font-bold flex items-center justify-between mb-4">
        <span className="flex items-center gap-2">
          <AlertTriangle size={20} />
          [ ! ] SYSTEM ERROR: INSUFFICIENT FUNDS & STOCK
        </span>
        <span className="text-xs">CRITICAL STATUS</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 px-4 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-red-600/30 pb-4 gap-4">
          <div className="space-y-1 flex-1">
            <h2 className="text-xl font-bold text-red-500 underline uppercase tracking-widest">Business Status: Critical</h2>
            <p className="text-xs opacity-70">Repossession protocols initialized. Awaiting financial injection.</p>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-red-900/20 p-3 border border-red-600/30">
            <div className="text-[10px] opacity-70 uppercase tracking-widest mb-1">Account Balance</div>
            <div className="text-xl font-bold">{money.toLocaleString()}₩ ({toSinoKorean(money)}원)</div>
          </div>
        </div>

        <div className="bg-red-900/10 p-4 border border-red-600/20 rounded">
          <p className="text-sm leading-relaxed">
            You cannot open the shop. You have no inventory and no money to restock. 
            {loanType === 'BANK' ? (
              " The K-Bite Corporate Bank is offering an Emergency Bailout Loan (대출)."
            ) : (
              " A shady figure approaches your truck. He offers a high-risk private loan (사채)."
            )}
          </p>
        </div>

        <div className="terminal-border p-6 bg-[#0c0c0c] relative">
          <div className="absolute -top-3 left-4 bg-[#0c0c0c] px-2 text-xs font-bold flex items-center gap-2">
            <FileText size={14} /> [ {loanType === 'BANK' ? 'BAILOUT CONTRACT (계약서)' : 'PRIVATE CONTRACT (사채 계약)'} ]
          </div>

          <div className="space-y-4 py-2">
            <div className="flex flex-col space-y-3 text-sm bg-black/50 p-4 border border-terminal/20">
              <div className="flex justify-between items-center border-b border-terminal/20 pb-2">
                <span className="opacity-60 tracking-widest text-xs">PRINCIPAL (원금):</span>
                <span className="font-bold text-white text-right">{principal.toLocaleString()}₩ ({toSinoKorean(principal)}원)</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal/20 pb-2">
                <span className="opacity-60 tracking-widest text-xs">INTEREST (이자):</span>
                <span className="font-bold text-red-400 text-right">{interest * 100}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-terminal/20 pb-2">
                <span className="opacity-60 tracking-widest text-xs">DUE DATE (기한):</span>
                <span className="font-bold text-yellow-500 text-right">{dueDate} Days ({toNativeKorean(dueDate)}일)</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="opacity-80 tracking-widest text-xs font-bold text-terminal">TOTAL DUE (총액):</span>
                <span className="font-bold text-terminal text-lg text-right tracking-widest">{totalDue.toLocaleString()}₩ ({toSinoKorean(totalDue)}원)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-terminal/20">
              <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
                <PenTool size={14} /> [ REQUIRED ACTION ]
              </h3>
              
              {loanType === 'BANK' ? (
                <div className="space-y-4">
                  <p className="text-xs leading-relaxed opacity-80">
                    To accept these terms and avoid immediate bankruptcy, type "동의" (Agree) 
                    on the signature line below to sign the contract.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold tracking-widest">
                      {romanizationEnabled ? 'SIGNATURE:' : '서명:'}
                    </span>
                    <input 
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className={`bg-black border-b-2 ${error ? 'border-red-500 animate-shake' : 'border-terminal'} outline-none px-2 py-1 w-32 text-center font-bold tracking-widest`}
                      placeholder="[ 동의 ]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-xs leading-relaxed opacity-80">
                    The Loan Shark demands a formal verbal contract. Assemble the correct SOV sentence 
                    on the conveyor belt below to confirm your commitment: 
                    <span className="text-yellow-500 font-bold ml-1">"I will repay the money." (Formal)</span>
                  </p>
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <span className="text-[8px] opacity-40 uppercase">{['Subj', 'Obj', 'Verb'][i]}</span>
                          <div className="w-24 h-12 border-2 border-terminal/30 bg-black flex items-center justify-center">
                            {contractSlots[i] ? (
                              <span className="font-bold text-terminal">{contractSlots[i]?.text}</span>
                            ) : (
                              <span className="text-[10px] opacity-20 italic">Empty</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      {SHARK_WORDS.map(word => (
                        <button
                          key={word.id}
                          onClick={() => handleSharkAssign(word)}
                          className="px-3 py-1 border border-terminal/30 hover:bg-terminal/10 text-xs"
                        >
                          [{word.text}]
                        </button>
                      ))}
                      <button 
                        onClick={() => setContractSlots([null, null, null])}
                        className="px-3 py-1 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                      >
                        CLEAR
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-4">
        <button 
          onClick={onGameOver}
          className="flex-1 border-2 border-red-600 py-3 px-2 font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
        >
          <Skull size={16} /> DECLINE & REPOSSESS
        </button>
        <button 
          onClick={handleSign}
          className={`flex-[2] py-3 px-2 font-bold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap tracking-widest ${loanType === 'BANK' ? 'bg-terminal text-black hover:bg-white' : (isSharkSuccess ? 'bg-yellow-500 text-black hover:bg-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed')}`}
        >
          {loanType === 'BANK' ? '[ SIGN CONTRACT ]' : '[ SEAL DEAL ]'}
        </button>
      </div>
    </div>
  );
}
