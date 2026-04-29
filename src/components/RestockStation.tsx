/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Package, Truck, AlertTriangle, CheckCircle2, XCircle, Info, Trash2, AlertCircle, Clock } from 'lucide-react';
import { toSinoKorean, toNativeKorean, Inventory, InventoryBatch, NATIVE_NUMBERS, SINO_NUMBERS } from '../types';
import { UI_STRINGS } from '../constants';
import { audio } from '../audioManager';

interface MarketItem {
  id: string;
  name: string;
  koName: string;
  unit: string;
  counter: string;
  basePrice: number;
  currentPrice: number;
  type: 'DRY' | 'FRESH';
  shelfLife: number; // in days
}

const MARKET_CATALOG = UI_STRINGS.MARKET_CATALOG;

const NATIVE_TO_VAL: Record<string, number> = Object.entries(NATIVE_NUMBERS).reduce((acc, [k, v]) => ({ ...acc, [v]: parseInt(k) }), {});
const SINO_TO_VAL: Record<string, number> = Object.entries(SINO_NUMBERS).reduce((acc, [k, v]) => ({ ...acc, [v]: parseInt(k) }), {});

const NATIVE_COUNTER_FORMS: Record<string, number> = {
  '한': 1, '두': 2, '세': 3, '네': 4, '다섯': 5, '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10, '스무': 20
};

interface CartItem {
  item: MarketItem;
  quantity: number;
  cost: number;
}

export default function RestockStation({
  money,
  inventory,
  gas,
  day,
  reputation,
  onComplete,
  onCancel,
  hasSeenTutorial,
  onCompleteTutorial,
  cachedCatalog,
  onUpdateCache
}: {
  money: number,
  inventory: Inventory,
  gas: number,
  day: number,
  reputation: number,
  onComplete: (newMoney: number, newInventory: Inventory, newGas: number, repChange?: number) => void,
  onCancel: () => void,
  hasSeenTutorial: boolean,
  onCompleteTutorial: () => void,
  cachedCatalog: { day: number, catalog: any[] },
  onUpdateCache: (cache: { day: number, catalog: any[] }) => void
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [deliveryType, setDeliveryType] = useState<'STANDARD' | 'BAEDAL'>('STANDARD');
  const [catalog, setCatalog] = useState<MarketItem[]>(
    (MARKET_CATALOG as any).map((item: any) => ({ ...item, currentPrice: item.basePrice }))
  );
  const [showTutorialModal, setShowTutorialModal] = useState(!hasSeenTutorial);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const getSpoilageWarning = (batch: InventoryBatch) => {
    if (batch.daysLeft === 0) return { text: 'SPOILED', color: 'text-red-500 font-bold animate-pulse' };
    if (batch.daysLeft === 1) return { text: 'Expires tomorrow', color: 'text-yellow-500 font-bold' };
    if (batch.daysLeft === 2) return { text: 'Expires in 2 days', color: 'text-yellow-400' };
    return { text: `Fresh (${batch.daysLeft} days left)`, color: 'text-terminal/70' };
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

  useEffect(() => {
    // If we already generated the catalog for today, use the hoisted cache to prevent reshuffling
    if (cachedCatalog.day === day && cachedCatalog.catalog.length > 0) {
      setCatalog(cachedCatalog.catalog);
      return;
    }

    const guaranteedIds = ['beef', 'bun', 'gas'];
    const otherItems = MARKET_CATALOG.filter(item => !guaranteedIds.includes(item.id));
    const shuffledOthers = [...otherItems].sort(() => 0.5 - Math.random());
    const selectedOthers = shuffledOthers.slice(0, 2);

    const marketPool = MARKET_CATALOG.filter(item => 
      guaranteedIds.includes(item.id) || selectedOthers.some(so => so.id === item.id)
    );

    const newCatalog = marketPool.map(item => {
      let multiplier = 1.0;

      // Base daily fluctuation
      if (day <= 7) {
        multiplier = 0.92 + (Math.random() * 0.16);
      } else {
        multiplier = 0.75 + (Math.random() * 0.50);
      }

      // Reputation discount (max 25% off at 100 rep)
      const repDiscount = Math.max(0, (reputation / 100) * 0.25);
      multiplier = multiplier * (1 - repDiscount);

      // Gentle inflation over time
      const inflation = 1 + (day * 0.008);

      let price = Math.round(item.basePrice * multiplier * inflation / 100) * 100;

      return { ...item, currentPrice: price };
    });

    onUpdateCache({ day, catalog: newCatalog });
    setCatalog(newCatalog);
  }, [day, reputation, cachedCatalog.day]);

  const parseOrder = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (parts.length < 3) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: 'INCOMPLETE ORDER. FORMAT: [ITEM] [QUANTITY] [COUNTER]', type: 'error' });
      return;
    }

    const [itemName, qtyStr, counterStr] = parts;
    const item = catalog.find(i => i.koName === itemName);

    if (!item) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: `UNKNOWN ITEM: "${itemName}". CHECK CATALOG.`, type: 'error' });
      return;
    }

    let quantity = 0;
    if (item.id === 'gas') {
      quantity = SINO_TO_VAL[qtyStr] || parseInt(qtyStr);
    } else {
      quantity = NATIVE_COUNTER_FORMS[qtyStr] || NATIVE_TO_VAL[qtyStr] || parseInt(qtyStr);
    }

    if (!quantity || isNaN(quantity)) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: `INVALID QUANTITY: "${qtyStr}". USE ${item.id === 'gas' ? 'SINO' : 'NATIVE'} NUMBERS.`, type: 'error' });
      return;
    }

    if (counterStr !== item.counter) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: `WRONG COUNTER! WE DON'T SELL ${item.koName} BY "${counterStr}". DID YOU MEAN "${item.counter}"?`, type: 'error' });
      return;
    }

    const totals: Record<string, number> = {};
    (inventory.batches || []).forEach(b => {
      if (b.id !== 'gas' && b.quantity > 0) totals[b.id] = (totals[b.id] || 0) + b.quantity;
    });
    cart.forEach(c => {
      if (c.item.id !== 'gas') totals[c.item.id] = (totals[c.item.id] || 0) + c.quantity;
    });
    if (item.id !== 'gas') {
      totals[item.id] = (totals[item.id] || 0) + quantity;
    }
    
    const projectedSlots = Object.values(totals).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);

    if (item.id !== 'gas' && projectedSlots > inventory.maxStorage) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: 'STORAGE FULL! CANNOT ADD MORE ITEMS.', type: 'error' });
      return;
    }

    // --- TUTORIAL LOCK ---
    if (isTutorialActive && tutorialStep === 1) {
      if (item.id !== 'beef' || quantity !== 10) {
        audio.playSFX('UI_ERROR');
        setFeedback({ message: "TUTORIAL OVERRIDE: Please type exactly '고기 열 개' (10 Meat).", type: 'error' });
        return; // Blocks the item from being added to the cart
      }
    }

    audio.playSFX('UI_CLICK');
    const cost = quantity * item.currentPrice;
    setCart([...cart, { item, quantity, cost }]);
    setInput('');
    setFeedback({ message: `ADDED: ${item.koName} ${qtyStr} ${counterStr} (${cost.toLocaleString()}₩)`, type: 'success' });

    if (isTutorialActive && item.id === 'beef' && quantity === 10) {
      setTutorialStep(2);
    }
  };

  const totalCost = cart.reduce((a, b) => a + b.cost, 0) + (deliveryType === 'BAEDAL' ? 5000 : 0);

  const handleCheckout = () => {
    if (totalCost > money) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: 'INSUFFICIENT FUNDS!', type: 'error' });
      return;
    }
    audio.playSFX('CASH_REGISTER');

    // Spoilage replacement discount
    const spoiledBatches = inventory.batches.filter(b => b.daysLeft === 0).length;
    const discount = spoiledBatches * 300; // 300₩ off per spoiled batch
    // Note: totalCost is how much we PAY, so we subtract discount from totalCost if we were applying it there, 
    // but the request says: finalMoneyAfterDiscount = Math.max(0, money - totalCost + discount)
    // Which means we effectively pay (totalCost - discount).

    const newBatches = [...(inventory.batches || [])];
    let newGas = gas;

    cart.forEach(c => {
      if (c.item.id === 'gas') {
        newGas = Math.min(100, newGas + c.quantity);
      } else {
        const shelfLife = c.item.type === 'FRESH' ? c.item.shelfLife + inventory.shelfLifeModifier : -1;
        newBatches.push({ id: c.item.id, quantity: c.quantity, daysLeft: shelfLife });
      }
    });

    onComplete(Math.max(0, money - totalCost + discount), { ...inventory, batches: newBatches }, newGas);
  };

  const handleTrash = () => {
    const batches = inventory.batches || [];
    const spoiledBatches = batches.filter(b => b.daysLeft === 0);
    if (spoiledBatches.length === 0) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: 'NO SPOILED ITEMS TO TRASH.', type: 'error' });
      return;
    }

    audio.playSFX('TRASH_CRUMPLE');
    const newBatches = batches.filter(b => b.daysLeft !== 0);
    setFeedback({ message: `TRASHED ${spoiledBatches.length} BATCHES. REPUTATION -2`, type: 'success' });
    onComplete(money, { ...inventory, batches: newBatches }, gas, -2);
  };

  const currentTotalSlots = Object.values((inventory.batches || []).filter(b => b.id !== 'gas' && b.quantity > 0).reduce((acc, b) => {
    acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc;
  }, {} as Record<string, number>)).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);

  return (
    <div className="flex flex-col h-full bg-black font-mono p-4 border-2 border-terminal shadow-[0_0_20px_rgba(var(--terminal-color-rgb),0.2)] overflow-hidden relative" style={{ color: 'var(--terminal-color)' }}>
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
                <ShoppingCart size={40} className="mx-auto text-terminal animate-pulse" />
                <h2 className="font-bold text-lg tracking-tighter uppercase">[ Initiate Logistics Protocol? ]</h2>
                <p className="text-xs opacity-60">Market guidance recommended for new operators.</p>
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

        {isTutorialActive && (
          <div />
        )}
      </AnimatePresence>

      <div className="border-y-2 border-terminal py-1 px-4 flex justify-between items-center bg-terminal/5 mb-4">
        <span className="font-bold tracking-widest">[ WHOLESALE MARKET ]</span>
        <div className="flex gap-6 text-xs">
          <div>FUNDS: <span className="text-white">{money.toLocaleString()}₩</span> ({toSinoKorean(money)} 원)</div>
          <div>GAS: <span className="text-white">{gas}%</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        {/* Left Column: Inventory */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <section className="border border-terminal p-3 bg-[#001a00] flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold mb-2 flex justify-between items-center border-b border-terminal/30 pb-1">
              <span className="flex items-center gap-2">[ CURRENT INVENTORY: {currentTotalSlots}/{inventory.maxStorage} SLOTS ]</span>
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {/* DRY GOODS */}
              <div>
                <div className="text-[10px] opacity-60 mb-1">-- DRY GOODS (No Expiration) --</div>
                <div className="space-y-1">
                  {(inventory.batches || []).filter(b => b.daysLeft === -1 && b.id !== 'gas').length === 0 ? (
                    <div className="text-[10px] opacity-30 italic pl-4">None</div>
                  ) : (
                    (inventory.batches || []).filter(b => b.daysLeft === -1 && b.id !== 'gas').map((b, i) => {
                      const item = MARKET_CATALOG.find(cat => cat.id === b.id);
                      return (
                        <div key={`dry-${b.id}-${i}`} className="text-[10px] flex justify-between">
                          <span>{item?.koName || b.id}: {b.quantity}{item?.counter || '개'}</span>
                          <span className="text-terminal">STABLE</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* FRESH GOODS with warning */}
              <div>
                <div className="text-[10px] opacity-60 mb-1">-- FRESH GOODS (Spoilage Risk) --</div>
                <div className="space-y-1">
                  {(inventory.batches || []).filter(b => b.daysLeft !== -1).length === 0 ? (
                    <div className="text-[10px] opacity-30 italic pl-4">None</div>
                  ) : (
                    (inventory.batches || []).filter(b => b.daysLeft !== -1).map((b, i) => {
                      const item = MARKET_CATALOG.find(cat => cat.id === b.id);
                      const status = getSpoilageWarning(b);
                      const isSpoiled = b.daysLeft === 0;
                      return (
                        <div key={`fresh-${b.id}-${i}`} className={`text-[10px] flex justify-between ${isSpoiled ? 'text-red-400' : ''}`}>
                          <span>{item?.koName || b.id}: {b.quantity}{item?.counter || '개'}</span>
                          <span className={`text-[9px] ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleTrash}
              className="mt-4 border border-red-500 text-red-500 py-1 text-[10px] hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={12} /> TRASH SPOILED
            </button>
          </section>

          <section className={`border p-3 ${isTutorialActive && tutorialStep === 2 ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-terminal bg-[#001a00]'}`}>
            <h3 className="text-xs font-bold mb-2 flex items-center gap-2"><Truck size={14} /> DELIVERY OPTIONS</h3>
            {isTutorialActive && tutorialStep === 2 && (
              <div className="mb-3 text-[10px] text-yellow-500 bg-black p-2 border border-yellow-500/30">
                {"> Standard delivery is free but arrives tomorrow. 'Baedal' is instant but costs extra. Click one to proceed."}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeliveryType('STANDARD');
                  if (isTutorialActive && tutorialStep === 2) setTutorialStep(3);
                }}
                className={`flex-1 p-2 border text-[10px] flex flex-col items-center gap-1 transition-colors ${
                  deliveryType === 'STANDARD' 
                    ? 'bg-terminal text-black' 
                    : isTutorialActive && tutorialStep === 2
                      ? 'border-yellow-500 bg-yellow-500/10 animate-pulse'
                      : 'border-terminal hover:bg-terminal/10'
                }`}
              >
                <span className="font-bold">STANDARD</span>
                <span>Next Morning (FREE)</span>
              </button>
              <button
                onClick={() => {
                  setDeliveryType('BAEDAL');
                  if (isTutorialActive && tutorialStep === 2) setTutorialStep(3);
                }}
                className={`flex-1 p-2 border text-[10px] flex flex-col items-center gap-1 transition-colors ${
                  deliveryType === 'BAEDAL' 
                    ? 'bg-terminal text-black' 
                    : isTutorialActive && tutorialStep === 2
                      ? 'border-yellow-500 bg-yellow-500/10 animate-pulse'
                      : 'border-terminal hover:bg-terminal/10'
                }`}
              >
                <span className="font-bold">QUICK "BAEDAL"</span>
                <span>Instant (+5,000₩)</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Catalog & Order */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <section className="border border-terminal p-3 flex-1 flex flex-col overflow-hidden">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-2 border-b border-terminal/30 pb-1">
              <Info size={14} /> [ DAILY CATALOG - MARKET PRICES ] 
              <span className="text-[9px] text-terminal/60 ml-auto">
                {reputation >= 60 ? `★ REP DISCOUNT ACTIVE (-${Math.round((reputation/100)*25)}%)` : 'REP DISCOUNT AVAILABLE AT 60+'}
              </span>
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {catalog.map((item, i) => (
                <div key={item.id} className="flex justify-between items-center text-[10px] py-1 border-b border-terminal/10">
                  <span>[{i + 1}] {item.koName} ({item.name})</span>
                  <span className="text-white">{item.currentPrice.toLocaleString()}₩ / 1{item.counter} ({item.id === 'gas' ? 'Sino' : item.counter})</span>
                </div>
              ))}
            </div>
          </section>

          {isTutorialActive && tutorialStep === 1 ? (
            <section className="border-2 border-yellow-500 bg-yellow-500/10 p-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <div className="flex items-start gap-2 text-yellow-500">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="space-y-2 w-full">
                  <h3 className="text-xs font-bold uppercase tracking-widest border-b border-yellow-500/30 pb-1">-- SYSTEM MESSAGE --</h3>
                  <div className="text-[10px] leading-relaxed">
                    {"> Let's restock Meat. Enter the Korean phrase for '10 Meat' in the Order Input box below."}
                    <div className="mt-2 bg-black text-yellow-500 px-2 py-1 font-mono text-center font-bold border border-yellow-500/50">고기 열 개</div>
                    <div className="mt-2 text-center text-[9px] font-bold animate-pulse">PRESS [ENTER] AFTER TYPING</div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="border border-terminal p-3 bg-[#001a00]">
              <h3 className="text-xs font-bold mb-2 flex items-center gap-2">
                <ShoppingCart size={14} /> SHOPPING CART
              </h3>
              <div className="max-h-[100px] overflow-y-auto space-y-1 mb-2">
                {cart.length === 0 ? (
                  <div className="text-[10px] opacity-40 italic text-center py-2">Cart is empty.</div>
                ) : (
                  cart.map((c, i) => (
                    <div key={`${c.item.id}-${i}`} className="flex justify-between text-[10px] border-b border-terminal/5 py-0.5">
                      <span>{c.item.koName} x {c.quantity}{c.item.counter}</span>
                      <span className="text-white">{c.cost.toLocaleString()}₩</span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-terminal/30 pt-1 flex justify-between text-xs font-bold">
                <span>TOTAL:</span>
                <span className="text-white">{totalCost.toLocaleString()}₩</span>
              </div>
            </section>
          )}

          <section className="border border-terminal p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-tighter">ORDER INPUT</h3>
              <div className="text-[8px] opacity-60 italic">Ex: "음료수 세 병"</div>
            </div>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && parseOrder(input)}
                placeholder="[ITEM] [QTY] [COUNTER]"
                className={`w-full bg-black border p-2 text-xs focus:outline-none transition-all ${
                  isTutorialActive && tutorialStep === 1
                    ? 'border-yellow-500 ring-2 ring-yellow-500/50'
                    : 'border-terminal focus:ring-1 focus:ring-terminal'
                }`}
              />
            </div>
            {feedback && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`mt-2 text-[9px] flex items-center gap-2 ${feedback.type === 'error' ? 'text-red-400' : 'text-terminal'}`}>
                {feedback.type === 'error' ? <XCircle size={10} /> : <CheckCircle2 size={10} />}
                {feedback.message}
              </motion.div>
            )}
          </section>

          <div className="flex flex-col gap-2">
            {isTutorialActive && tutorialStep === 3 && (
              <div className="text-[10px] text-yellow-500 bg-black p-2 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                {"> Logistics complete. Proceed to [ CHECKOUT SYSTEM ] to finalize your order and end the tutorial."}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 border border-terminal py-2 text-xs hover:bg-red-900/20 transition-colors">CANCEL</button>
              <button 
                onClick={() => {
                  if (isTutorialActive) {
                    setIsTutorialActive(false);
                    onCompleteTutorial();
                  }
                  handleCheckout();
                }} 
                disabled={cart.length === 0} 
                className={`flex-[2] py-2 text-xs font-bold transition-colors disabled:opacity-50 ${isTutorialActive && tutorialStep === 3 ? 'bg-yellow-500 text-black animate-pulse hover:bg-white' : 'bg-terminal text-black hover:bg-white'}`}
              >
                CHECKOUT SYSTEM
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
