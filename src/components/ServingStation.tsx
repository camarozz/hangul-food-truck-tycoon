/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Word, Customer, toNativeKorean, toSinoKorean, PolitenessLevel, Location, Inventory, TruckConfig, InventoryBatch, formatKoreanTimeWithHint, DayHistory, CalendarEvent } from '../types';
import { AlertCircle, CheckCircle2, User, Clock, Trash2, Cog, Play, RotateCcw, Plus, Zap, Brain, Coffee, ShoppingCart, Info, Volume2, Maximize2, Minimize2, ArrowRightCircle } from 'lucide-react';
import { getFrontViewAscii } from '../App';
import { RECIPE_REQUIREMENTS } from '../constants';
import { audio } from '../audioManager';

const ENGINE_WORDS: Word[] = [
  { id: 'o1', text: '고기', meaning: 'Meat', type: 'object', icon: '🥩' },
  { id: 'o2', text: '감자', meaning: 'Potato', type: 'object', icon: '🥔' },
  { id: 'o3', text: '치즈', meaning: 'Cheese', type: 'object', icon: '🧀' },
  { id: 'o4', text: '김치', meaning: 'Kimchi', type: 'object', icon: '🥬' },
  { id: 'l1', text: '튀김기', meaning: 'Fryer', type: 'location', icon: '🍟' },
  { id: 'l2', text: '그릴', meaning: 'Grill', type: 'location', icon: '♨️' },
  { id: 'v1', text: '굽다', meaning: 'To Grill', type: 'verb', icon: '🔥' },
  { id: 'v2', text: '튀기다', meaning: 'To Fry', type: 'verb', icon: '⚡' },
  { id: 'p2', text: '를', meaning: 'Object Cog', type: 'particle' },
  { id: 'p3', text: '에서', meaning: 'Location Cog', type: 'particle' },
  { id: 'p4', text: '요', meaning: 'Polite Cog', type: 'particle' },
  { id: 'p5', text: '습니다', meaning: 'Formal Cog', type: 'particle' },
  { id: 'p6', text: '에', meaning: 'In/To Cog', type: 'particle' },
  { id: 'o5', text: '양파', meaning: 'Onion', type: 'object', icon: '🧅' },
  { id: 'o6', text: '매운 소스', meaning: 'Spicy Sauce', type: 'object', icon: '🌶️' },
  { id: 'v3', text: '넣다', meaning: 'To Add', type: 'verb', icon: '➕' },
  { id: 'o8', text: '탄산음료', meaning: 'Soda', type: 'object', icon: '🧪' },
  { id: 'o9', text: '주스', meaning: 'Juice', type: 'object', icon: '🧃' },
  { id: 'v4', text: '따르다', meaning: 'Pour', type: 'verb', icon: '💧' },
  { id: 'l3', text: '컵', meaning: 'Cup', type: 'location', icon: '🥛' },
];

const MENU_CATALOG: Record<string, { name: string, icon: string }> = {
  burger: { name: '버거', icon: '🍔' },
  cheeseburger: { name: '치즈버거', icon: '🧀' },
  fries: { name: '감자튀김', icon: '🍟' },
  kimchiburger: { name: '김치버거', icon: '🥬' },
  soda: { name: '음료수', icon: '🥤' },
  juice: { name: '주스', icon: '🧃' }
};

const RUINED_DISH_ASCII = `
   ( )   (
    )  (  )
  | #### |
  | #### |
  |______|
 [ RUINED ]
`;

const TAG_TRANSLATION: Record<string, string> = {
  "Negative": "NEG_REQ",
  "Native Cntr": "NATIVE_QTY",
  "Positive": "POS_REQ",
  "Sino Cntr": "SINO_QTY"
};

const IDLE_THOUGHTS = [
  "> It's quiet... too quiet.",
  "> I hope the rent doesn't go up again next week.",
  "> The weather is terrible today. Bad for business.",
  "> Did I leave the fryer on? No, I'm just paranoid.",
  "> If I get a 5-star rating, maybe I can finally upgrade this rust bucket.",
  "> I wonder if the cat is okay at home.",
  "> That last customer looked like someone I knew from school.",
  "> My feet are killing me. I need new boots.",
];

const FIRE_ASCII = `
     (  )   (  )
    (  ) (  ) ( )
   (  ) (  ) (  )
  (  ) (  ) (  )
`;

const LOCATION_BACKGROUNDS: Record<string, { bg: string, ground: string }> = {
  residence: {
    bg: `
   [^^^]     [^^^]                 [^^^]     [^^^]
   |___|     |___|                 |___|     |___|
 -------------------------------------------------
    `,
    ground: "============================================================="
  },
  univ: {
    bg: `
    [ CAMPUS ]
     |  |  |
     |  |  |
     |__|__|
    `,
    ground: "============================================================="
  },
  business: {
    bg: `
   _||_  _||_  _||_  _||_  _||_
   |  |  |  |  |  |  |  |  |  |
    `,
    ground: "============================================================="
  },
  park: {
    bg: `
      _  _  _
     ( )( )( )
      |  |  |
    `,
    ground: "..................................................."
  }
};

export default function ServingStation({ 
  money, 
  day, 
  reputation, 
  location,
  inventory,
  truckConfig,
  hasFryer,
  unlockedRecipes,
  activeMenu,
  romanizationEnabled,
  hasSeenShopTutorial,
  isColorSettingUnlocked,
  customer,
  setCustomer,
  orderQueue,
  setOrderQueue,
  servingPhase,
  setServingPhase,
  activeQueueIndex,
  setActiveQueueIndex,
  onUpdateInventory,
  onComplete,
  onCustomerSpawn
}: { 
  money: number, 
  day: number, 
  reputation: number, 
  location: Location | null,
  inventory: Inventory,
  truckConfig: TruckConfig,
  hasFryer: boolean,
  unlockedRecipes: string[],
  activeMenu: string[],
  romanizationEnabled: boolean,
  hasSeenShopTutorial: boolean,
  isColorSettingUnlocked: boolean,
  customer: Customer | null,
  setCustomer: React.Dispatch<React.SetStateAction<Customer | null>>,
  orderQueue: any[],
  setOrderQueue: React.Dispatch<React.SetStateAction<any[]>>,
  servingPhase: 'GREETING' | 'QUEUE' | 'COOKING',
  setServingPhase: React.Dispatch<React.SetStateAction<'GREETING' | 'QUEUE' | 'COOKING'>>,
  activeQueueIndex: number | null,
  setActiveQueueIndex: React.Dispatch<React.SetStateAction<number | null>>,
  onUpdateInventory: (inv: Inventory) => void,
  onComplete: (reward: number, repBonus: number, sessionStats: { wrongParticles: number, perfectStreak: number }) => void,
  onCustomerSpawn?: (customer: Customer | null) => void
}) {
  const [slots, setSlots] = useState<(Word | null)[]>([null, null, null, null]);
  const [cogs, setCogs] = useState<(Word | null)[]>([null, null, null, null]);
  const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [feedback, setFeedback] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [vibeCheck, setVibeCheck] = useState<{ stars: number, dialogue: string, ascii: string, tip: number, speed: 'SLOW' | 'FAST' } | null>(null);
  const [gameTime, setGameTime] = useState(location?.openTime || 660);
  const [patience, setPatience] = useState(100);
  const [patienceMultiplier, setPatienceMultiplier] = useState(1.0);
  const [greetingFeedback, setGreetingFeedback] = useState<string | null>(null);
  const [currentGreetings, setCurrentGreetings] = useState<{
    formal: { ko: string, en: string },
    polite: { ko: string, en: string },
    casual: { ko: string, en: string }
  }>({
    formal: FORMAL_GREETINGS[0],
    polite: POLITE_GREETINGS[0],
    casual: CASUAL_GREETINGS[0]
  });
  const [isConfirmingAbort, setIsConfirmingAbort] = useState(false);
  const abortTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetEngine = useCallback(() => {
    setSlots([null, null, null, null]);
    setCogs([null, null, null, null]);
    setStatus('IDLE');
    setFeedback(null);
    setRuinedDish(false);
    setIsMachineOnFire(false);
    setDynamicWords([]);
    setCurrentProduct(null);
    setCurrentModifiers([]);
    setOutputVisual('');
    setServingPhase('GREETING');
    setPatienceMultiplier(1.0);
    setLastGreetingWasPerfect(false);
    // Do NOT clear orderQueue here — handled in handleTransmitData
  }, []);

  const handleCustomerLeave = useCallback(() => {
    audio.playSFX('CUSTOMER_ANGRY');
    setFeedback({ message: 'CUSTOMER LEFT ANGRY! Reputation -5', type: 'error' });
    totalRep.current -= 5;
    setShiftStats(prev => ({ ...prev, repEarned: prev.repEarned - 5 }));
    setCustomer(null);
    setOrderQueue([]);
    resetEngine();
    setIsProcessingServe(false);
    setTimeout(() => setFeedback(null), 2000);
  }, [resetEngine]);

  const handleGreeting = useCallback((level: PolitenessLevel) => {
    if (!customer) return;

    const isPerfect = level === customer.politenessRequired;
    const isGoodEnough = !isPerfect && level === 'POLITE';

    setLastGreetingWasPerfect(isPerfect); // for stats

    if (isPerfect) {
      setPatience(prev => Math.min(100, prev + 25));
      setGreetingFeedback('PERFECT GREETING! +25% PATIENCE');
    } else if (isGoodEnough) {
      setPatience(prev => Math.min(100, prev + 10));
      setGreetingFeedback('GOOD ENOUGH. +10% PATIENCE');
    } else {
      setPatience(prev => Math.max(10, prev - 30));
      setGreetingFeedback('TOO CASUAL / TOO FORMAL. PATIENCE -30%');
    }

    // Transition to queue after a short delay
    setTimeout(() => {
      setGreetingFeedback(null);
      setServingPhase('QUEUE');
      
      // Initialize queue if not already done using functional update
      setOrderQueue(prevQueue => {
        if (prevQueue.length === 0) {
          setActiveQueueIndex(0);
          return customer.targetItems.map(item => ({
            ...item,
            isCompleted: false,
            completed: false
          }));
        }
        return prevQueue;
      });
    }, 1200);
  }, [customer]);

  useEffect(() => {
    const handleAutoCook = () => {
      try {
        if (!customer) return;
        
        // Determine the final visual based on order and modifiers
        let finalVisual = '[🍔]';
        setCurrentProduct('burger');
        setCurrentModifiers([]);
        
        if (customer.order === 'cheeseburger') finalVisual = '[🍔 (Cheese)]';
        if (customer.order === 'fries') setCurrentProduct('fries');
        
        if (customer.modifiers.some(m => m.includes('매운 소스'))) {
          finalVisual = '[🍔 (Spicy)]';
          setCurrentModifiers(['spicy']);
        } else if (customer.modifiers.some(m => m.includes('양파'))) {
          finalVisual = '[🍔 (Onion)]';
          setCurrentModifiers(['onion']);
        }

        setOutputVisual(finalVisual);
        setStatus('SUCCESS');
        setFeedback({ message: 'DEV: AUTO-COOK SUCCESS!', type: 'success' });

        // Part 1: Timeout & State Reset
        setTimeout(() => {
          setFeedback(null);
          // Part 2: UI Hand-off - Ensure buttons are active
          setStatus('IDLE');
        }, 1000);
      } catch (error) {
        console.error("DEV: Auto-cook failed", error);
        setFeedback({ message: 'DEV: AUTO-COOK FAILED!', type: 'error' });
        setTimeout(() => {
          setFeedback(null);
          setStatus('IDLE');
        }, 1000);
      }
    };

    const handleEndShift = () => {
      setGameTime(location?.closeTime || 1320);
    };

    window.addEventListener('dev-auto-cook', handleAutoCook);
    window.addEventListener('dev-end-shift', handleEndShift);
    return () => {
      window.removeEventListener('dev-auto-cook', handleAutoCook);
      window.removeEventListener('dev-end-shift', handleEndShift);
    };
  }, [customer, location]);

  const getIngredientId = (text: string): string | null => {
    switch (text) {
      case '고기': return 'beef';
      case '감자': return 'potato';
      case '치즈': return 'cheese';
      case '김치': return 'kimchi';
      case '번': return 'bun';
      case '양파': return 'onion';
      case '탄산음료': return 'soda';
      case '주스': return 'juice';
      default: return null;
    }
  };

  const getStockCount = (word: any): number => {
    if (!word) return 0;

    // Spicy sauce is infinite but hidden from inventory
    if (word.id === 'o6' || word.text === '매운 소스') return Infinity;

    const ingredientMap: Record<string, string> = {
      'o1': 'beef',
      'o2': 'potato',
      'o3': 'cheese',
      'o4': 'kimchi',
      'o5': 'onion',
      'o8': 'soda',
      'o9': 'juice'
    };

    const ingredientId = ingredientMap[word.id] || word.id;
    if (!ingredientId) return 0;

    return inventory.batches
      .filter(batch => batch.id === ingredientId && batch.daysLeft !== 0) // Exclude spoiled items
      .reduce((total, batch) => total + batch.quantity, 0);
  };

  const deductIngredients = (requirements: Record<string, number>) => {
    if (!requirements) return;

    const newBatches = [...inventory.batches].map(b => ({ ...b }));

    Object.entries(requirements).forEach(([id, qty]) => {
      let remaining = qty;

      for (let i = newBatches.length - 1; i >= 0 && remaining > 0; i--) {
        // Only deduct from fresh batches!
        if (newBatches[i].id === id && newBatches[i].daysLeft !== 0) {
          const deductAmount = Math.min(remaining, newBatches[i].quantity);
          newBatches[i].quantity -= deductAmount;
          remaining -= deductAmount;

          if (newBatches[i].quantity <= 0) {
            newBatches.splice(i, 1);
          }
        }
      }
    });

    onUpdateInventory({ ...inventory, batches: newBatches });
  };

  const isStockDepletedForOrder = (item: any): boolean => {
    if (!hasSeenShopTutorial && day === 0) return false;
    if (!item) return true;
    
    const req = RECIPE_REQUIREMENTS[item.type || item.itemId] || {};
    for (const [ingredientId, requiredQty] of Object.entries(req)) {
      const available = inventory.batches
        .filter(batch => batch.id === ingredientId && batch.daysLeft !== 0) // Exclude spoiled items
        .reduce((total, batch) => total + batch.quantity, 0);
      
      if (available < requiredQty) {
        return true;
      }
    }
    return false;
  };

  const isAnyItemDepleted = orderQueue.some(item => !item.isCompleted && isStockDepletedForOrder(item));

  // === CENTRALIZED SUCCESS HANDLER (Fix #7) ===
  const triggerSuccess = (earned: number, rep: number, message: string, isIntermediate = false) => {
    audio.playSFX('SUCCESS_CHIME');
    const tip = Math.floor(earned * (patience > 70 ? 0.25 : 0.1));

    totalEarned.current += earned + tip;
    totalRep.current += rep;

    setShiftStats(prev => ({
      ...prev,
      // Removed 'served' and 'perfect' increments to prevent double-counting
      moneyEarned: prev.moneyEarned + earned,
      repEarned: prev.repEarned + rep,
      tips: prev.tips + tip
    }));

    setFeedback({ message, type: 'success' });

    // === QUEUE LOGIC (Preserved from Fix #7 Refactor) ===
    setOrderQueue(prev => {
      const updated = [...prev];
      if (!isIntermediate && activeQueueIndex >= 0 && updated[activeQueueIndex]) {
        updated[activeQueueIndex].isCompleted = true;
        updated[activeQueueIndex].completed = true; 
      }
      return updated;
    });

    if (isIntermediate) {
      setActiveQueueIndex(prev => {
        let nextIndex = prev + 1;
        while (nextIndex < orderQueue.length && orderQueue[nextIndex]?.isCompleted) {
          nextIndex++;
        }
        return nextIndex < orderQueue.length ? nextIndex : prev;
      });
    } else {
      setServingPhase('QUEUE');
    }
  };

  const requiredIngredientIds = useMemo(() => {
    const ids = new Set<string>();
    activeMenu.forEach(dishId => {
      if (dishId === 'fries') {
        ids.add('potato');
      } else {
        ids.add('bun');
        if (dishId === 'burger' || dishId === 'cheeseburger' || dishId === 'kimchiburger') {
          ids.add('beef');
        }
        if (dishId === 'cheeseburger') ids.add('cheese');
        if (dishId === 'kimchiburger') ids.add('kimchi');
      }
    });
    return ids;
  }, [activeMenu]);

  const [ruinedDish, setRuinedDish] = useState(false);
  const [isMachineOnFire, setIsMachineOnFire] = useState(false);
  
  const [sessionWrongParticles, setSessionWrongParticles] = useState(0);
  const [sessionPerfectStreak, setSessionPerfectStreak] = useState(0);
  const [currentPerfectStreak, setCurrentPerfectStreak] = useState(0);
  const [dynamicWords, setDynamicWords] = useState<Word[]>([]);
  const [shiftTutorialStep, setShiftTutorialStep] = useState(0);
  const [currentProduct, setCurrentProduct] = useState<string | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<string[]>([]);
  const [outputVisual, setOutputVisual] = useState<string>('[🍔]');
  const [isProcessingServe, setIsProcessingServe] = useState(false);
  const [shiftStats, setShiftStats] = useState({ 
    served: 0, 
    perfect: 0, 
    trashed: 0, 
    moneyEarned: 0, 
    repEarned: 0, 
    tips: 0 
  });
  const [isShiftSummaryOpen, setIsShiftSummaryOpen] = useState(false);
  const [lastGreetingWasPerfect, setLastGreetingWasPerfect] = useState(false);
  const [idleThought, setIdleThought] = useState("");
  const [isTutorialSpawnPaused, setIsTutorialSpawnPaused] = useState(!hasSeenShopTutorial);

  const totalEarned = useRef(0);
  const totalRep = useRef(0);
  const truckAscii = useMemo(() => {
    // replace(/^\n/, '') safely removes the first blank line without stripping the burger's leading spaces
    return getFrontViewAscii(truckConfig).replace(/^\n/, '').trimEnd().split('\n');
  }, [truckConfig]);

  const dynamicOutputWords = useMemo(() => {
    if (ruinedDish) return ['[', '🗑️', ']'];
    if (!currentProduct && status !== 'SUCCESS') return ['[', ' ', ']'];
    
    // Default fallback to outputVisual if explicitly set by dev shortcuts
    if (outputVisual && outputVisual !== '[🍔]' && !currentProduct) {
      return outputVisual.split(' ').filter(Boolean);
    }

    let icon = "🍔";
    if (currentProduct === 'fries') icon = "🍟";
    else if (currentProduct === 'soda') icon = "🥤";
    else if (currentProduct === 'juice') icon = "🧃";
    else if (currentProduct === 'cheeseburger') icon = "🧀🍔";
    else if (currentProduct === 'kimchiburger') icon = "🥬🍔";
    
    if (currentModifiers.includes('onion')) icon += "🧅";
    if (currentModifiers.includes('spicy')) icon += "🌶️";
    
    return [`[`, icon, `]`];
  }, [ruinedDish, currentProduct, status, currentModifiers, outputVisual]);

  // Keyboard Shortcuts for Greeting Phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (servingPhase !== 'GREETING' || !customer || greetingFeedback) return;
      
      if (e.key === '1') handleGreeting('FORMAL');
      if (e.key === '2') handleGreeting('POLITE');
      if (e.key === '3') handleGreeting('CASUAL');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [servingPhase, customer, greetingFeedback, currentGreetings, handleGreeting]);

  const calculateSpawnDelay = (day: number, reputation: number) => {
    if (day <= 1) {
      return 2000 + Math.random() * 1000;
    }
    const stars = Math.max(0, Math.min(5, Math.floor(reputation / 20)));
    const baseDelay = 8000;
    const repReduction = stars * 1000;
    const variance = (Math.random() * 2000) - 1000;
    return Math.max(2000, baseDelay - repReduction + variance);
  };

  // Time Flow Logic
  useEffect(() => {
    if (isShiftSummaryOpen) return;
    if (!hasSeenShopTutorial && day === 0) return;

    const timer = setInterval(() => {
      let isClosing = false;
      setGameTime(prev => {
        const next = (prev + 1) % 1440;
        if (location && next === location.closeTime) {
          isClosing = true;
        }
        return next;
      });

      if (isClosing) {
        clearInterval(timer);
        setIsShiftSummaryOpen(true);
      }
    }, 300); // Constant 300ms = ~2.4 real-world minutes for a standard 8-hour shift!

    return () => clearInterval(timer);
  }, [location, isShiftSummaryOpen, hasSeenShopTutorial, day]);

  // Sync customer state to parent safely
  useEffect(() => {
    onCustomerSpawn?.(customer);
  }, [customer, onCustomerSpawn]);

  // Customer Spawner
  useEffect(() => {
    if (!customer && !vibeCheck && !ruinedDish && !isMachineOnFire && !isTutorialSpawnPaused) {
      // Pick a random idle thought
      const thought = IDLE_THOUGHTS[Math.floor(Math.random() * IDLE_THOUGHTS.length)];
      setIdleThought(thought);

      const delay = calculateSpawnDelay(day, reputation);
      const timer = setTimeout(() => {
        spawnCustomer();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [customer, vibeCheck, ruinedDish, isMachineOnFire, day, reputation, isTutorialSpawnPaused]);

  useEffect(() => {
    if (activeQueueIndex >= orderQueue.length) {
      setActiveQueueIndex(0);
    }
  }, [orderQueue.length, activeQueueIndex]);

  // Patience Timer
  useEffect(() => {
    if (customer && !vibeCheck) {
      const timer = setInterval(() => {
        let isPatienceOut = false;
        setPatience(prev => {
          if (prev <= 0) {
            isPatienceOut = true;
            return 0;
          }
          return prev - 1;
        });

        if (isPatienceOut) {
          clearInterval(timer);
          handleCustomerLeave();
        }
      }, 1000 / patienceMultiplier);
      return () => clearInterval(timer);
    }
  }, [customer, vibeCheck, patienceMultiplier, handleCustomerLeave]);

  const spawnCustomer = () => {
    if (!location) return;

    // Shift 000 Tutorial Hardcoding
    if (!hasSeenShopTutorial && shiftStats.served < 3) {
      const tutorialStages = [
        { 
          id: 'burger', 
          type: CUSTOMER_TYPES[0], // STUDENT
          rawOrder: "버거 하나 주세요", 
          modifiers: [], 
          modifierLabel: '' 
        },
        { 
          id: 'burger', 
          type: CUSTOMER_TYPES[1], // STANDARD 
          rawOrder: "양파 추가해주세요. 버거 하나 주세요", 
          modifiers: ['+ 양파'], 
          modifierLabel: '양파 추가' 
        },
        { 
          id: 'burger', 
          type: CUSTOMER_TYPES[2], // VIP
          rawOrder: "매운 소스 추가해주세요. 버거 하나 주세요", 
          modifiers: ['+ 매운 소스'], 
          modifierLabel: '매운 소스 추가' 
        }
      ];
      
      const stage = tutorialStages[shiftStats.served];
      const typeInfo = stage.type;
      
      const targetItems = [{
        type: stage.id,
        name: '버거',
        icon: '🍔',
        visual: '[🍔]',
        recipe: RECIPE_REQUIREMENTS[stage.id],
        completed: false,
        isCompleted: false,
        cookedResult: null,
        modifier: stage.modifierLabel
      }];

      const freshQueue = targetItems.map((item, index) => ({
        ...item,
        instanceId: `${item.type}-${Date.now()}-${index}`,
        isCompleted: false,
        cookedResult: null
      }));

      const newCustomer: Customer = {
        id: `tutorial-${shiftStats.served}`,
        name: typeInfo.label,
        type: typeInfo.type,
        order: stage.id,
        targetItems: freshQueue,
        count: 1,
        picky: stage.modifiers.length > 0,
        modifiers: stage.modifiers,
        negatedModifiers: [],
        rawOrder: stage.rawOrder,
        politenessRequired: typeInfo.politeness,
        ticketId: 100 + shiftStats.served
      };

      setCustomer(newCustomer);
      setOrderQueue(freshQueue);
      setServingPhase('GREETING');
      setPatienceMultiplier(0.5); // Slower patience for tutorial
      setPatience(100);
      setShiftTutorialStep(shiftStats.served + 1);
      return;
    }

    const possibleTypes = CUSTOMER_TYPES.filter(t => {
      if (location?.id === 'univ') return t.type === 'STUDENT';
      if (location?.id === 'business') return t.type === 'VIP' || t.type === 'STANDARD';
      return true;
    });
    
    const typeInfo = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    
    // Get available menu items based on activeMenu
    const menuItems = activeMenu.map(id => {
      if (id === 'burger') return { id: 'burger', name: '버거', en: 'Burger' };
      if (id === 'cheeseburger') return { id: 'cheeseburger', name: '치즈버거', en: 'Cheese Burger' };
      if (id === 'fries') return { id: 'fries', name: '감자튀김', en: 'French Fries' };
      if (id === 'kimchiburger') return { id: 'kimchiburger', name: '김치버거', en: 'Kimchi Burger' };
      if (id === 'soda') return { id: 'soda', name: '음료수', en: 'Soda' };
      if (id === 'juice') return { id: 'juice', name: '주스', en: 'Juice' };
      return { id, name: id, en: id };
    });

    // Pick 1-2 unique items
    const numItems = Math.min(menuItems.length, Math.random() > 0.7 ? 2 : 1);
    const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffled.slice(0, numItems);

    const targetItems = selectedItems.map(item => ({
      type: item.id,
      name: item.name,
      icon: item.id === 'fries' ? '🍟' : item.id === 'soda' ? '🥤' : item.id === 'juice' ? '🧃' : '🍔',
      visual: item.id === 'fries' ? '[🍟]' : item.id === 'soda' ? '[🥤]' : item.id === 'juice' ? '[🧃]' : '[🍔]',
      recipe: RECIPE_REQUIREMENTS[item.id],
      completed: false,
      isCompleted: false, // FORCE reset
      cookedResult: null,  // FORCE clear previous food data
      modifier: ''
    }));

    let isPicky = Math.random() > 0.4;
    if (location?.id === 'business') isPicky = true;
    
    let rawOrder = selectedItems.map(item => `${item.name} 하나`).join(', ') + ' 주세요';
    let negatedModifiers: string[] = [];
    let modifiers: string[] = [];

    if (isPicky) {
      const r = Math.random();
      // Apply picky logic to the first item if it's a burger
      if (selectedItems[0].id.includes('burger')) {
        // Removed the "no onion" and "no spicy" logic. 
        // Picky customers will now only ask for additions.
        if (r > 0.5) {
          rawOrder = `양파 추가해주세요. ${rawOrder}`;
          targetItems[0].modifier = '양파 추가';
        } else {
          rawOrder = `매운 소스 추가해주세요. ${rawOrder}`;
          targetItems[0].modifier = '매운 소스 추가';
        }
      }
    }

    // Part 3: Robust Modifier Parsing
    const parseModifiers = (str: string) => {
      const mods: string[] = [];
      const negs: string[] = [];
      
      if (str.includes('양파')) {
        if (str.includes('없이') || str.includes('빼주세요')) negs.push('- 양파');
        else if (str.includes('추가')) mods.push('+ 양파');
      }
      if (str.includes('매운 소스') || str.includes('맵게') || str.includes('맵지 않게')) {
        if (str.includes('맵지 않게') || str.includes('없이') || str.includes('빼주세요')) negs.push('- 매운 소스');
        else if (str.includes('추가') || str.includes('맵게')) mods.push('+ 매운 소스');
      }
      return { mods, negs };
    };

    const { mods, negs } = parseModifiers(rawOrder);
    
    // Strict Spawner Override: Build a 100% fresh array
    const freshQueue = targetItems.map((item, index) => ({
      ...item,
      instanceId: `${item.type}-${Date.now()}-${index}`,
      isCompleted: false,
      cookedResult: null
    }));

    const newCustomer: Customer = {
      id: Math.random().toString(),
      name: typeInfo.label,
      type: typeInfo.type,
      order: selectedItems[0].id,
      targetItems: freshQueue,
      count: numItems,
      picky: isPicky,
      modifiers: mods,
      negatedModifiers: negs,
      rawOrder,
      politenessRequired: typeInfo.politeness,
      ticketId: Math.floor(Math.random() * 100)
    };
    
    // Randomize greetings for this customer
    const selectedFormal = FORMAL_GREETINGS[Math.floor(Math.random() * FORMAL_GREETINGS.length)];
    const selectedPolite = POLITE_GREETINGS[Math.floor(Math.random() * POLITE_GREETINGS.length)];
    const selectedCasual = CASUAL_GREETINGS[Math.floor(Math.random() * CASUAL_GREETINGS.length)];
    setCurrentGreetings({ formal: selectedFormal, polite: selectedPolite, casual: selectedCasual });

    setCustomer(newCustomer);
    setOrderQueue(freshQueue);
    setServingPhase('GREETING');
    setPatienceMultiplier(1.0);
    setPatience(100);
    audio.playSFX('CUSTOMER_BELL');
  };

  const handleApologize = () => {
    setFeedback({ message: '죄송합니다, 재료가 없습니다 (Sorry, out of stock)', type: 'error' });
    totalRep.current -= 1; // Minor penalty
    setShiftStats(prev => ({ ...prev, repEarned: prev.repEarned - 1 }));
    setCustomer(null);
    setOrderQueue([]);
    resetEngine();
    setIsProcessingServe(false);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleWordAssign = (word: Word, index: number) => {
    if (index === 1) return;
    const newSlots = [...slots];
    newSlots[index] = word;
    setSlots(newSlots);
  };

  const handleCogAssign = (cog: Word, index: number) => {
    if (index === 1) return;
    if (!slots[index]) {
      setFeedback({ message: 'ERROR: CANNOT ATTACH COG TO EMPTY SLOT!', type: 'error' });
      return;
    }
    const newCogs = [...cogs];
    newCogs[index] = cog;
    setCogs(newCogs);
  };

  const clearSlot = (index: number) => {
    const newSlots = [...slots];
    const newCogs = [...cogs];
    newSlots[index] = null;
    newCogs[index] = null;
    setSlots(newSlots);
    setCogs(newCogs);
  };

  const handleSuccess = (earned: number, rep: number, message: string, isIntermediate = false) => {
    triggerSuccess(earned, rep, message, isIntermediate);
    setIsProcessingServe(false);
    setStatus('IDLE');
    
    // ALWAYS clear slots on success so the next item starts fresh
    setSlots([null, null, null, null]);
    setCogs([null, null, null, null]);

    // Clear the success overlay so the player can see the ticket and patience bar again
    setTimeout(() => {
      setFeedback(null);
    }, 1500);
  };

  const handleFinalServe = () => {
    if (!customer) return;
    if (!orderQueue.every(item => item.isCompleted)) {
      audio.playSFX('UI_ERROR');
      setFeedback({ message: 'ERROR: FINISH ALL ITEMS IN QUEUE FIRST!', type: 'error' });
      return;
    }

    audio.playSFX('CASH_REGISTER');
    setIsProcessingServe(true);

    // Final tip based on overall patience
    const finalTip = Math.floor(totalEarned.current * (patience > 60 ? 0.2 : 0.08));

    totalEarned.current += finalTip;
    setShiftStats(prev => ({
      ...prev,
      tips: prev.tips + finalTip,
      served: prev.served + 1,
      perfect: lastGreetingWasPerfect ? prev.perfect + 1 : prev.perfect
    }));

    setTimeout(() => {
      const newServedCount = shiftStats.served + 1;
      if (!hasSeenShopTutorial && newServedCount >= 3) {
        // End tutorial shift exactly after 3rd serve
        setIsShiftSummaryOpen(true);
        setIsProcessingServe(false);
      } else if (!hasSeenShopTutorial) {
        // Tutorial: instantly spawn next scripted customer
        setCustomer(null);
        setOrderQueue([]);
        resetEngine();
        setIsProcessingServe(false);
      } else {
        // Normal gameplay loop
        setCustomer(null);
        setOrderQueue([]);
        resetEngine();
        setIsProcessingServe(false);
      }
    }, 800);
  };

  const checkAutomation = () => {
    if (isProcessingServe) return;
    if (ruinedDish) {
      setFeedback({ message: 'ERROR: CLEAR THE TRASH FIRST!', type: 'error' });
      return;
    }

    const activeItem = orderQueue[activeQueueIndex];
    if (!activeItem) return;

    if (isStockDepletedForOrder(activeItem)) {
      setFeedback({ message: 'ERROR: INSUFFICIENT STOCK FOR TOTAL ORDER!', type: 'error' });
      return;
    }

    setIsProcessingServe(true);
    setStatus('RUNNING');
    setFeedback(null);

    const processingTime = 1800;

    setTimeout(() => {
      const isAnyBurgerPhase2 = currentProduct === 'burger' || currentProduct === 'cheeseburger' || currentProduct === 'kimchiburger';
      const locationSlot = slots[0];
      const object = slots[2];
      const verb = slots[3];
      const lCog = cogs[0];
      const oCog = cogs[2];

      if (verb) {
        if (verb.id === 'v1') audio.playSFX('GRILL_HISS');
        else if (verb.id === 'v2') audio.playSFX('FRYER_BUBBLE');
        else if (verb.id === 'v4') audio.playSFX('POUR_DRINK');
      }

      // Deduct ingredients only after validation starts
      const isTutorialMode = !hasSeenShopTutorial && day === 0;
      if (object && !isTutorialMode) {
        if (object.id === 'o1') deductIngredients(RECIPE_REQUIREMENTS['burger']); // 1 Bun, 1 Beef
        else if (object.id === 'o2') deductIngredients(RECIPE_REQUIREMENTS['fries']); // 1 Potato
        else if (object.id === 'o3') deductIngredients({ cheese: 1 }); // Just Cheese
        else if (object.id === 'o4') deductIngredients({ kimchi: 1 }); // Just Kimchi
        else if (object.id === 'o5') deductIngredients({ onion: 1 });
        else if (object.id === 'o6') deductIngredients({ spicy_sauce: 1 });
        else if (object.id === 'o8') deductIngredients({ soda: 1 });
        else if (object.id === 'o9') deductIngredients({ juice: 1 });
      }

      // ====================== PHASE 2 FIX ======================
      // In Phase 2 (garnish stage), location particle is OPTIONAL
      if (isAnyBurgerPhase2 && lCog?.id === 'p3') { // '에서'
        setStatus('FAILURE');
        setRuinedDish(true);
        setFeedback({ message: 'ERR: [에서] not allowed in garnish stage. Use [에] or nothing.', type: 'error' });
        setIsProcessingServe(false);
        return;
      }

      // Basic validation (location particle is optional in Phase 2)
      if (!locationSlot || (!lCog && !isAnyBurgerPhase2) || !object || !verb || !oCog) {
        setStatus('FAILURE');
        setRuinedDish(true);
        setFeedback({ message: 'ERR: RECIPE INVALID OR MISMATCHED PARTICLES', type: 'error' });
        setIsProcessingServe(false);
        return;
      }

      const isGarnishAction = verb.id === 'v3' && (isAnyBurgerPhase2 || lCog?.id === 'p6'); // 넣다 + 에
      const isCookingAction = (verb.id === 'v1' || verb.id === 'v2') && lCog?.id === 'p3'; // 굽다/튀기다 + 에서
      const isPouringAction = verb.id === 'v4' && lCog?.id === 'p6'; // 따르다 + 에

      if (!isGarnishAction && !isCookingAction && !isPouringAction) {
        setStatus('FAILURE');
        setRuinedDish(true);
        setFeedback({ message: 'ERR: RECIPE INVALID OR MISMATCHED PARTICLES', type: 'error' });
        setIsProcessingServe(false);
        return;
      }

      if (isCookingAction) {
        const isGrillCombo = locationSlot.id === 'l2' && verb.id === 'v1';
        const isFryerCombo = locationSlot.id === 'l1' && verb.id === 'v2';
        if (!isGrillCombo && !isFryerCombo) {
          setStatus('FAILURE');
          setRuinedDish(true);
          setFeedback({ message: 'CATASTROPHIC FAILURE: COOKING METHOD MISMATCH!', type: 'error' });
          setIsProcessingServe(false);
          return;
        }
      }

      // ====================== CLEAN SUCCESS LOGIC ======================
      const itemType = activeItem.type || activeItem.itemId;

      // Base cooking actions (Phase 1 for ALL Burgers)
      if ((itemType === 'burger' || itemType === 'cheeseburger' || itemType === 'kimchiburger') && object.id === 'o1' && verb.id === 'v1') {
        const needsPhase2 = itemType !== 'burger' || (activeItem.modifier && activeItem.modifier.length > 0);
        
        if (needsPhase2) {
          setCurrentProduct('burger');
          setCurrentModifiers([]);
          setDynamicWords([{ id: 'intermediate_burger', text: '버거', meaning: 'Burger', type: 'location', icon: '🍔' }]);
          setOutputVisual('[🍔]');
          handleSuccess(1000, 5, 'SUCCESS: BASE BURGER READY. ADD INGREDIENTS!', true);
        } else {
          setCurrentProduct('burger');
          setCurrentModifiers([]);
          setOutputVisual('[🍔]');
          handleSuccess(1500, 10, 'SUCCESS: PLAIN BURGER COMPLETED!', false);
        }
        return;
      }

      // Fries
      if (itemType === 'fries' && object.id === 'o2' && verb.id === 'v2') {
        setCurrentProduct('fries');
        setCurrentModifiers([]);
        handleSuccess(1200, 6, 'SUCCESS: FRENCH FRIES PRODUCED!', false);
        return;
      }

      // Beverages
      if ((itemType === 'soda' || itemType === 'juice') && locationSlot?.id === 'l3' && verb.id === 'v4') {
        const correctObjectId = itemType === 'soda' ? 'o8' : 'o9';
        
        if (object.id !== correctObjectId) {
          setStatus('FAILURE');
          setRuinedDish(true);
          setFeedback({ message: `ERR: INCORRECT INGREDIENT. EXPECTED ${itemType.toUpperCase()}.`, type: 'error' });
          setIsProcessingServe(false);
          return;
        }

        const isSoda = itemType === 'soda';
        setCurrentProduct(itemType);
        setCurrentModifiers([]);
        setOutputVisual(isSoda ? '[🥤]' : '[🧃]');
        handleSuccess(isSoda ? 1200 : 1800, isSoda ? 5 : 8, `SUCCESS: ${itemType.toUpperCase()} PRODUCED!`, false);
        return;
      }

      // Phase 2: Add core ingredients or modifiers
      if (isAnyBurgerPhase2 && verb.id === 'v3' && oCog?.id === 'p2') { // 넣다 + 를
        const hasModifiers = activeItem.modifier && activeItem.modifier.length > 0;
        const isCoreIngredientMissing = (itemType === 'cheeseburger' || itemType === 'kimchiburger') && currentProduct === 'burger';
        
        // Core Ingredients (Cheese / Kimchi)
        if (object.id === 'o3' && itemType === 'cheeseburger' && currentProduct === 'burger') {
          setCurrentProduct('cheeseburger');
          setOutputVisual('[🧀🍔]');
          if (hasModifiers) {
            handleSuccess(2500, 8, 'SUCCESS: CHEESE ADDED. ADD GARNISH!', true);
          } else {
            handleSuccess(2500, 8, 'SUCCESS: CHEESEBURGER COMPLETED!', false);
          }
          return;
        }
        
        if (object.id === 'o4' && itemType === 'kimchiburger' && currentProduct === 'burger') {
          setCurrentProduct('kimchiburger');
          setOutputVisual('[🥬🍔]');
          if (hasModifiers) {
            handleSuccess(3500, 10, 'SUCCESS: KIMCHI ADDED. ADD GARNISH!', true);
          } else {
            handleSuccess(3500, 10, 'SUCCESS: KIMCHIBURGER COMPLETED!', false);
          }
          return;
        }

        // Modifiers (Block them if the core ingredient is missing)
        if (object.id === 'o5' || object.id === 'o6') {
          if (isCoreIngredientMissing) {
             setStatus('FAILURE');
             setRuinedDish(true);
             setFeedback({ message: `ERR: MUST ADD ${itemType === 'cheeseburger' ? 'CHEESE' : 'KIMCHI'} BEFORE GARNISH!`, type: 'error' });
             setIsProcessingServe(false);
             return;
          }

          if (object.id === 'o5' && activeItem.modifier?.includes('양파')) {
            setCurrentModifiers(prev => [...prev, 'onion']);
            setOutputVisual(currentProduct === 'cheeseburger' ? '[🧀🍔🧅]' : currentProduct === 'kimchiburger' ? '[🥬🍔🧅]' : '[🍔🧅]');
            handleSuccess(1500, 7, 'SUCCESS: ONION GARNISH ADDED!', false);
            return;
          }
          
          if (object.id === 'o6' && activeItem.modifier?.includes('매운 소스')) {
            setCurrentModifiers(prev => [...prev, 'spicy']);
            setOutputVisual(currentProduct === 'cheeseburger' ? '[🧀🍔🌶️]' : currentProduct === 'kimchiburger' ? '[🥬🍔🌶️]' : '[🍔🌶️]');
            handleSuccess(1500, 7, 'SUCCESS: SPICY GARNISH ADDED!', false);
            return;
          }
        }
      }

      // Catch-all failure
      setStatus('FAILURE');
      setRuinedDish(true);
      setFeedback({ message: 'ENGINE GRIND: INVALID GRAMMAR COG SEQUENCE.', type: 'error' });
      setIsProcessingServe(false);
    }, processingTime);
  };

  const clearTrash = () => {
    audio.playSFX('TRASH_CRUMPLE');
    setFeedback({ message: 'TRASH CLEARED. RESTARTING ENGINE...', type: 'success' });
    setShiftStats(prev => ({ ...prev, trashed: prev.trashed + 1 }));
    
    setTimeout(() => {
      try {
        setRuinedDish(false);
        setIsMachineOnFire(false);
        setStatus('IDLE');
        setFeedback(null);
        resetEngine();
        spawnCustomer();
      } catch (error) {
        console.error("Failsafe triggered: Error during trash clearance reset.", error);
        // Ensure UI is usable even if spawn fails
        setRuinedDish(false);
        setIsMachineOnFire(false);
        setStatus('IDLE');
        setFeedback(null);
      }
    }, 1500);
  };

  const handleAbortClick = () => {
    if (!isConfirmingAbort) {
      setIsConfirmingAbort(true);
      abortTimeoutRef.current = setTimeout(() => {
        setIsConfirmingAbort(false);
      }, 3000);
    } else {
      if (abortTimeoutRef.current) clearTimeout(abortTimeoutRef.current);
      
      // Force clean shutdown
      setIsShiftSummaryOpen(true);
      setIsConfirmingAbort(false);
      setCustomer(null);
      setOrderQueue([]);
    }
  };

  const rushHour = location?.rushHours?.find(rh => gameTime >= rh.start && gameTime <= rh.end);

  const handleTransmitData = () => {
    setIsShiftSummaryOpen(false);

    // Final save to parent / Firebase
    onComplete(
      totalEarned.current,
      totalRep.current,
      {
        wrongParticles: sessionWrongParticles,
        perfectStreak: sessionPerfectStreak
      }
    );

    // Clean reset for next shift
    totalEarned.current = 0;
    totalRep.current = 0;
    setShiftStats({ served: 0, perfect: 0, trashed: 0, moneyEarned: 0, repEarned: 0, tips: 0 });
    setSessionWrongParticles(0);
    setSessionPerfectStreak(0);

    resetEngine();
    setCustomer(null);
    setOrderQueue([]);
    setActiveQueueIndex(0);
  };

  const getInstructorContent = () => {
    const isCooked = currentProduct === 'burger';
    if (shiftTutorialStep === 1) {
      return {
        title: "PHASE 1: BASIC SOV",
        message: "고기를 그릴에 굽다",
        description: "Follow the highlighted words exactly. The machine requires specific particles to function."
      };
    }
    if (shiftTutorialStep === 2) {
      if (!isCooked) {
        return {
          title: "PHASE 1: BASE ASSEMBLY",
          message: "Multi-step orders require a base first. Grill the meat.",
          description: "Assemble the foundation: [고기를] [그릴에서] [굽다]"
        };
      }
      return {
        title: "PHASE 2: FINITE GARNISH",
        message: "Place the [버거] in the first slot. Then add Onion using the particle [를] and the verb 'To Add' [넣다].",
        description: "Build the sentence: [버거] [양파를] [넣다]"
      };
    }
    if (shiftTutorialStep === 3) {
      if (!isCooked) {
        return {
          title: "PHASE 1: BASE ASSEMBLY",
          message: "Start by grilling the base meat.",
          description: "Foundation first: [고기를] [그릴에서] [굽다]"
        };
      }
      return {
        title: "PHASE 2: INFINITE GARNISH",
        message: "Place the [버거], then add Spicy Sauce (∞) using [를] and [넣다].",
        description: "Build the sentence: [버거] [매운 소스를] [넣다]"
      };
    }
    return { title: "SYSTEM_IDLE", message: "Awaiting next operator input...", description: "" };
  };

  const usedSlots = Object.values(inventory.batches.reduce((acc, b) => {
    acc[b.id] = (acc[b.id] || 0) + b.quantity; return acc;
  }, {} as Record<string, number>)).reduce((slots: number, qty: number) => slots + Math.ceil(qty / 20), 0);

  return (
    <div className="space-y-2 font-mono text-sm min-h-screen h-auto flex flex-col pb-8 relative">
      <AnimatePresence>
        {isShiftSummaryOpen && (
          <ShiftSummaryPopup 
            stats={shiftStats} 
            onNext={handleTransmitData} 
            day={day} 
            isColorSettingUnlocked={isColorSettingUnlocked} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-y-2 border-terminal py-1 flex justify-between items-center px-4 bg-[#0c0c0c] shrink-0" style={{ color: 'var(--terminal-color)' }}>
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-widest text-xs">[ K-BITE EXPRESS ] (Open for Business)</span>
          <span className="text-[10px] opacity-60">DAY: {day.toString().padStart(3, '0')} | FUNDS: {money.toLocaleString()}₩ ({toSinoKorean(money)}) | REP: {'★'.repeat(Math.max(0, Math.min(5, Math.floor(reputation / 20))))}{'☆'.repeat(Math.max(0, 5 - Math.floor(reputation / 20)))}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2">
            <Clock size={14} className={rushHour ? 'text-red-500 animate-pulse' : ''} />
            <span className={`font-bold ${rushHour ? 'text-red-500' : ''}`}>{formatKoreanTimeWithHint(gameTime)}</span>
          </div>
          <div className="text-[9px] opacity-50 uppercase">
            {rushHour ? `[ ${rushHour.label} ]` : location ? `[ STATUS: ${location.koName} LULL ]` : ''}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Stage */}
        <div className="terminal-border p-0 bg-[#0c0c0c] relative min-h-[160px] flex flex-col">
          <div className="bg-terminal/10 px-2 py-0.5 text-[10px] font-bold border-b border-terminal/30 flex items-center">
            <span>[ LOCATION: {location?.name.toUpperCase()} ({location?.koName}) ]</span>
          </div>
          
          <div className="flex-1 relative flex flex-col items-center justify-end pb-4 overflow-hidden">
            {/* Background Layer */}
            <pre className="ascii-art text-[8px] sm:text-[10px] leading-tight absolute top-4 select-none pointer-events-none opacity-20" style={{ color: 'var(--terminal-color)' }}>
              {location ? LOCATION_BACKGROUNDS[location.id]?.bg : LOCATION_BACKGROUNDS.residence.bg}
            </pre>
            
            {/* Street Scene Container - Grounded Baseline */}
            <div className="flex items-end justify-center gap-8 relative z-20 w-full px-4">
              
              {/* Menu Board */}
              <div 
                className="ascii-menu-board shrink-0" 
                style={{ 
                  width: '19ch', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignSelf: 'flex-end', 
                  fontFamily: "monospace, 'Courier New', Courier", 
                  whiteSpace: 'pre',
                  lineHeight: '1.2',
                  fontSize: '9px',
                  color: 'inherit'
                }}
              >
                {/* Header */}
                <div>|=================|</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>|</span><span> K-BITE 메뉴 </span><span>|</span>
                </div>
                <div>|-----------------|</div>

                {/* Dynamic Menu Loop */}
                {activeMenu.map((id, idx) => {
                  const item = MENU_CATALOG[id] || { name: id, icon: '?' };
                  return (
                    <div key={`${id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>| &gt; [{item.icon}] {item.name}</span>
                      <span>|</span>
                    </div>
                  );
                })}

                {/* Footer & Legs */}
                <div>|=================|</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>||</span>
                  <span>||</span>
                </div>
              </div>

              {/* Truck Layer */}
              <div className="mb-0 flex flex-col items-center" style={{ alignSelf: 'flex-end' }}>
                <pre 
                  className="ascii-art text-[10px] m-0" 
                  style={{ 
                    color: truckConfig.color.hex,
                    lineHeight: '1.2',
                    fontFamily: "monospace, 'Courier New', Courier"
                  }}
                >
                  {truckAscii.map((line, i) => (
                    <div key={`truck-line-${i}`}>
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

              {/* Characters Container */}
              <div className="flex items-end gap-4 relative">
                {customer && servingPhase !== 'GREETING' && (
                  <div className="flex flex-col items-center relative">
                    {/* Vibe Check Thought Bubble */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-max z-30">
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white text-black text-[8px] px-2 py-1 rounded-full mb-1 relative font-bold shadow-lg"
                      >
                        {customer.politenessRequired === 'CASUAL' ? 'AWKWARD. (Dropping "요")?' : 'HMM...'}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                      </motion.div>
                    </div>
                    
                    <pre 
                      className="text-[10px] select-none text-center w-full font-mono m-0" 
                      style={{ 
                        color: 'var(--terminal-color)',
                        lineHeight: '1.2'
                      }}
                    >
{`(O_O)
|[=]|
 | | `}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Ground Layer */}
            <div className="w-full relative z-10 -mt-1">
              <pre className="ascii-art text-[8px] sm:text-[10px] opacity-40 leading-none w-full text-center select-none pointer-events-none" style={{ color: 'var(--terminal-color)' }}>
                {location ? LOCATION_BACKGROUNDS[location.id]?.ground : LOCATION_BACKGROUNDS.residence.ground}
              </pre>
            </div>
          </div>
        </div>
        
        {/* Order Ticket */}
        <div className="terminal-border p-4 bg-[#0c0c0c] space-y-3 relative overflow-hidden">
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm ${feedback.type === 'error' ? 'bg-red-900/90 text-red-100' : 'bg-green-900/90 text-green-100'}`}
              >
                {feedback.type === 'error' ? <AlertCircle size={32} className="mb-2 animate-bounce" /> : <CheckCircle2 size={32} className="mb-2 animate-pulse" />}
                <span className="font-bold text-xs uppercase tracking-widest leading-tight">{feedback.message}</span>
                <div className="mt-4 text-[8px] opacity-70 animate-pulse">-- PROCESSING --</div>
              </motion.div>
            )}
          </AnimatePresence>
          {customer ? (
            <>
              <div className="flex justify-between items-center border-b border-terminal/30 pb-1 w-full pr-2">
                <div className="font-bold text-xs whitespace-nowrap shrink-0">[ ORDER TICKET #{customer.ticketId} ]</div>
                <div className="text-[7px] opacity-20 uppercase tracking-widest font-bold truncate ml-4">
                  SYS.LOG // ORDER_METADATA :: FLAGS: 
                  {["Native Cntr", customer.negatedModifiers.length > 0 ? "Negative" : null, customer.modifiers.length > 0 ? "Positive" : null]
                    .filter(Boolean)
                    .map((tag, i) => <span key={`${tag}-${i}`}> [ {TAG_TRANSLATION[tag!] || tag} ]</span>)}
                </div>
              </div>
              {isAnyItemDepleted && (
                <div className="bg-red-900/40 border border-red-500 p-1 mb-2 text-center animate-pulse">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">
                    [ WARNING: REQUIRED STOCK DEPLETED FOR 1 OR MORE ITEMS ]
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {servingPhase === 'GREETING' ? (
                  <div className="flex flex-row items-center gap-4 py-2 border-y border-terminal/10 w-full mb-1">
                    <div className="opacity-60 min-w-[60px] flex justify-center">
                      <pre className="font-mono" style={{ fontSize: '0.85rem', lineHeight: '1' }}>
{customer.type === 'VIP' ? `   ___
  /   \\
 | - - |
  \\ = /
  --V--` : customer.type === 'STUDENT' ? `   _^_
  /   \\
 d o o b
  \\ - /
  --|--` : `   ___
  /   \\
 | o o |
  \\ _ /
  --|--`}
                      </pre>
                    </div>
                    <div className="text-[10px] space-y-0.5 font-bold text-terminal/80 bg-terminal/5 p-1.5 border border-terminal/10 flex-grow">
                      <div>&gt; DEMOGRAPHIC: {customer.type === 'STUDENT' ? 'UNIVERSITY' : customer.type === 'VIP' ? 'BUSINESS' : 'CITIZEN'}</div>
                      <div>&gt; MOOD: {patience > 70 ? 'CALM' : 'IMPATIENT'}</div>
                      <div>&gt; STATUS: AWAITING GREETING...</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-bold leading-tight">"{customer.rawOrder}"</div>
                    
                    <div className="order-items-list border-y border-terminal/10 py-2 flex flex-col gap-1.5" style={{ lineHeight: '1.4' }}>
                      {customer.targetItems.map((item, index) => {
                        const catalogItem = MENU_CATALOG[item.type];
                        const itemName = catalogItem ? catalogItem.name : item.type;
                        
                        return (
                          <div key={item.instanceId || `${item.type}-${index}-${customer.id}`} className="flex flex-col">
                            {/* CORE ITEM (Base + Core Upgrade) */}
                            <div className="text-[11px] font-bold flex items-center gap-2" style={{ color: 'var(--terminal-color)' }}>
                              <span>[{item.icon || '🍔'}]</span>
                              <span>{itemName} x1</span>
                            </div>
                            
                            {/* GARNISH (Secondary Step) */}
                            {item.modifier && (
                              <div className="text-[9px] font-bold text-yellow-500 pl-6 mt-0.5 flex items-center gap-1 opacity-90">
                                <span className="opacity-50">↳</span>
                                <span className="bg-yellow-500/10 px-1.5 py-0.5 border border-yellow-500/30 uppercase tracking-widest">
                                  GARNISH: {item.modifier}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] uppercase font-bold">
                    {servingPhase === 'COOKING' && <span>[ VIBE CHECK ] : {customer.politenessRequired}</span>}
                    <span className={servingPhase === 'GREETING' ? 'w-full text-right' : ''}>PATIENCE: {patience}%</span>
                  </div>
                  <div className="h-2 border border-terminal/30 bg-[#0c0c0c] overflow-hidden">
                    <motion.div 
                      initial={{ width: '100%' }}
                      animate={{ width: `${patience}%` }}
                      className={`h-full ${patience < 30 ? 'bg-red-500' : 'bg-terminal'}`}
                    />
                  </div>

                  {shiftTutorialStep === 3 && servingPhase === 'COOKING' && (
                    <div className="mt-4 p-2 border border-terminal/20 bg-terminal/5 text-[9px] font-mono space-y-1">
                      <div className="text-yellow-500 font-bold animate-pulse">
                        &gt; SYS.NOTE: RESOURCE DETECTED (∞)
                      </div>
                      <div className="opacity-80 leading-relaxed text-terminal">
                        '매운 소스' (Spicy Sauce) is an infinite liquid garnish. It does not deplete your active inventory stock upon execution.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
              <div className="text-center space-y-3">
                <div className="font-bold uppercase tracking-widest text-[10px] animate-pulse">[ SIGNAL LOST ]</div>
                <div className="text-[9px] font-mono border border-terminal/20 p-2 bg-terminal/5">
                  {`> WAITING FOR TICKET...
  [ . . . . . . ]`}
                </div>
                <div className="flex justify-center">
                  <Clock size={20} className="opacity-20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automation Engine */}
      <div className="terminal-border p-3 bg-[#0c0c0c] space-y-2 h-auto flex flex-col shrink-0">
        <div className="font-bold border-b border-terminal/30 pb-1 uppercase tracking-widest text-[10px] flex justify-between shrink-0">
              <span>
                {!customer 
                  ? '[ SYSTEM IDLE ] (AWAITING NEXT TARGET)'
                  : servingPhase === 'GREETING' 
                    ? '[ CUSTOMER INTERACTION ] (GREETING REQUIRED)' 
                    : servingPhase === 'QUEUE'
                      ? '[ ORDER QUEUE ] (SELECT ITEM TO PREPARE)'
                      : orderQueue[activeQueueIndex]?.type === 'soda' || orderQueue[activeQueueIndex]?.type === 'juice'
                      ? '[ BEVERAGE STATION - SOV ]'
                      : orderQueue[activeQueueIndex]?.type === 'fries'
                      ? '[ FRY STATION - SOV ]'
                      : currentProduct === 'burger'
                      ? '[ PREP STATION - SOV ]'
                      : '[ GRILL STATION - SOV ]'}
              </span>
              {isMachineOnFire && <span className="text-red-500 animate-bounce">🔥 MACHINE ON FIRE! 🔥</span>}
            </div>

        {/* SELECT COMPONENT Section */}
        <div className="space-y-1 shrink-0">
          {!customer ?
            <div className="flex flex-col items-center justify-center h-32 border border-terminal/10 bg-terminal/5">
              <div className="text-[10px] opacity-40 uppercase tracking-widest animate-pulse">Scanning for incoming signals...</div>
              <div className="text-[9px] font-mono text-terminal/60 mt-4 max-w-[250px] text-center italic">
                {idleThought}
              </div>
            </div>
          : servingPhase === 'GREETING' ?
            <div className="space-y-2">
              <div className="text-[9px] opacity-50 uppercase">[ GREETING PHRASEBOOK ] :</div>
              
              {greetingFeedback ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-12 border border-terminal/20 bg-terminal/5 flex items-center justify-center font-bold text-xs"
                >
                  {greetingFeedback}
                </motion.div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleGreeting('FORMAL')} 
                    className={`px-4 py-2 border text-sm font-bold transition-all text-left flex items-center gap-3 ${
                      !hasSeenShopTutorial && customer?.type === 'VIP'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10'
                        : 'border-terminal/50 hover:bg-terminal/20'
                    }`}
                  >
                    <span className={`px-2 py-0.5 border text-[10px] ${!hasSeenShopTutorial && customer?.type === 'VIP' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-terminal/20 border-terminal/30'}`}>[ 1 ]</span>
                    <span>[ {currentGreetings.formal.ko} ]{romanizationEnabled ? ` (${currentGreetings.formal.en})` : ''}</span>
                  </button>
                  <button 
                    onClick={() => handleGreeting('POLITE')} 
                    className={`px-4 py-2 border text-sm font-bold transition-all text-left flex items-center gap-3 ${
                      !hasSeenShopTutorial && (customer?.type === 'STUDENT' || customer?.type === 'STANDARD')
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10'
                        : 'border-terminal/50 hover:bg-terminal/20'
                    }`}
                  >
                    <span className={`px-2 py-0.5 border text-[10px] ${!hasSeenShopTutorial && (customer?.type === 'STUDENT' || customer?.type === 'STANDARD') ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-terminal/20 border-terminal/30'}`}>[ 2 ]</span>
                    <span>[ {currentGreetings.polite.ko} ]{romanizationEnabled ? ` (${currentGreetings.polite.en})` : ''}</span>
                  </button>
                  <button 
                    onClick={() => handleGreeting('CASUAL')} 
                    className={`px-4 py-2 border text-sm font-bold transition-all text-left flex items-center gap-3 ${
                      !hasSeenShopTutorial && customer?.type === 'STUDENT'
                        ? 'border-yellow-500 bg-yellow-500/20 text-yellow-500 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10'
                        : 'border-terminal/50 hover:bg-terminal/20'
                    }`}
                  >
                    <span className={`px-2 py-0.5 border text-[10px] ${!hasSeenShopTutorial && customer?.type === 'STUDENT' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 'bg-terminal/20 border-terminal/30'}`}>[ 3 ]</span>
                    <span>[ {currentGreetings.casual.ko} ]{romanizationEnabled ? ` (${currentGreetings.casual.en})` : ''}</span>
                  </button>
                </div>
              )}
            </div>
          : servingPhase === 'QUEUE' ?
            <div className="space-y-3 py-2">
              <div className="text-[9px] opacity-50 uppercase">[ ACTIVE ORDERS ] :</div>
              <div className="flex gap-4">
                {orderQueue.map((item, idx) => (
                  <button
                    key={item.instanceId || `queue-item-${idx}-${item.type}`}
                    onClick={() => {
                      const itemDepleted = isStockDepletedForOrder(item);
                      if (itemDepleted && !item.isCompleted) {
                        setFeedback({ message: 'ERR: INSUFFICIENT INGREDIENTS FOR THIS ITEM.', type: 'error' });
                        setTimeout(() => setFeedback(null), 2000);
                      } else if (!item.isCompleted) {
                        setActiveQueueIndex(idx);
                        setServingPhase('COOKING');
                      }
                    }}
                    className={`w-24 h-24 border-2 flex flex-col items-center justify-center space-y-2 transition-all relative ${
                      item.isCompleted
                        ? 'border-terminal bg-terminal/20 cursor-default' 
                        : (!item.isCompleted && isStockDepletedForOrder(item))
                          ? 'border-red-500/80 bg-red-900/20 text-red-500'
                          : (shiftTutorialStep === 1 || shiftTutorialStep === 2)
                            ? 'border-yellow-500 bg-yellow-500/20 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10'
                            : 'border-terminal/30 hover:border-terminal hover:bg-terminal/10'
                    }`}
                  >
                    {item.isCompleted ? (
                      <>
                        <CheckCircle2 className="text-terminal" size={32} />
                        <div className="flex justify-center items-center gap-[0.2rem] text-xl">
                          <span className="text-terminal">[</span>
                          <span>{(item.cookedResult || item.icon || '').replace(/[\[\]]/g, '').trim()}</span>
                          <span className="text-terminal">]</span>
                        </div>
                        <span className="text-[10px] font-bold">[ READY ]</span>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-center items-center gap-[0.2rem] text-2xl" style={{ marginBottom: '-13px' }}>
                          <span className="text-terminal">[</span>
                          <span style={{ filter: 'opacity(0.35) grayscale(0.8)' }}>
                            {item.icon || '🍔'}
                          </span>
                          <span className="text-terminal">]</span>
                        </div>
                        <span className="text-center font-bold px-1 my-2" style={{ fontSize: '1.4rem', letterSpacing: '2px', marginBottom: '-2px' }}>
                          {item.name ? item.name.split(' ')[0] : item.itemId}
                        </span>
                        <span className="text-[8px] opacity-40">[ PENDING ]</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          : 
            <>
              <div className="text-[9px] opacity-50 uppercase">[ SELECT COMPONENT ] {"->"} [ ASSIGN TO SLOT ]:</div>
              <div className="flex flex-wrap gap-1">
                {[...ENGINE_WORDS, ...dynamicWords].filter(w => {
                  if (w.type === 'particle') return false;
                  
                  // Rule A: Only render if unlocked
                  if ((w.text === '튀김기' || w.text === '감자' || w.text === '튀기다') && !hasFryer) return false;
                  if (w.text === '치즈' && !unlockedRecipes.includes('cheeseburger')) return false;
                  if (w.text === '김치' && !unlockedRecipes.includes('kimchiburger')) return false;
                  
                  // Phase Filtering
                  const activeItem = orderQueue[activeQueueIndex];
                  const itemType = activeItem?.type || activeItem?.itemId;
                  const isAnyBurgerPhase2 = currentProduct === 'burger' || currentProduct === 'cheeseburger' || currentProduct === 'kimchiburger';
                  
                  let allowedWords: string[] = [];

                  if (itemType === 'soda') {
                    allowedWords = ['컵', '탄산음료', '따르다'];
                  } else if (itemType === 'juice') {
                    allowedWords = ['컵', '주스', '따르다'];
                  } else if (itemType === 'fries') {
                    allowedWords = ['감자', '튀김기', '튀기다'];
                  } else if (isAnyBurgerPhase2) {
                    allowedWords = ['버거', '양파', '매운 소스', '넣다'];
                    if (itemType === 'cheeseburger' && currentProduct === 'burger') allowedWords.push('치즈');
                    if (itemType === 'kimchiburger' && currentProduct === 'burger') allowedWords.push('김치');
                  } else {
                    // Phase 1 for ALL burgers
                    allowedWords = ['고기', '그릴', '굽다'];
                  }

                  return allowedWords.includes(w.text);
                }).map(word => {
                  const stock = word.type === 'object' ? getStockCount(word) : Infinity;
                  const isEmpty = stock === 0;
                  
                  const isTutorialHighlight = shiftTutorialStep > 0 && (
                    (shiftTutorialStep === 1 && (word.text === '고기' || word.text === '그릴' || word.text === '굽다')) ||
                    (shiftTutorialStep === 2 && currentProduct === 'burger' && (word.text === '버거' || word.text === '양파' || word.text === '넣다'))
                  );
                  
                  return (
                    <button
                      key={`word-${word.id}`}
                      disabled={isEmpty}
                      onClick={() => {
                        let targetIdx = -1;
                        if (word.type === 'location') targetIdx = 0;
                        if (word.type === 'object') targetIdx = 2;
                        if (word.type === 'verb') targetIdx = 3;
                        
                        if (targetIdx !== -1) handleWordAssign(word, targetIdx);
                      }}
                      className={`px-3 py-2 border text-base flex items-center space-x-2 transition-colors ${
                        isEmpty 
                          ? 'border-red-900 text-red-700 cursor-not-allowed pointer-events-none' 
                          : isTutorialHighlight
                            ? 'border-yellow-500 bg-yellow-500/20 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.3)] z-10'
                            : 'border-terminal/30 hover:bg-terminal/10'
                      }`}
                    >
                      <span className="font-bold">
                        {word.icon && <span className="mr-1">[{word.icon}]</span>}
                        {word.text}
                      </span>
                      {romanizationEnabled && <span className="opacity-60 text-xs">({word.meaning})</span>}
                    </button>
                  );
                })}
              </div>
            </>
          }
        </div>

        {servingPhase === 'COOKING' &&
          <>
            <div className="flex-1 flex items-center justify-center py-2 bg-[#1a1a1a]/50 rounded border border-terminal/10 min-h-0">
              {ruinedDish ? (
                <div className="flex flex-col items-center space-y-2">
                  <pre className="text-red-500 text-[10px] leading-tight animate-pulse">
                    {isMachineOnFire ? FIRE_ASCII : RUINED_DISH_ASCII}
                  </pre>
                  <button 
                    onClick={clearTrash}
                    className="flex items-center space-x-3 px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-all text-xs"
                  >
                    <Trash2 size={14} />
                    <span>CLICK TO CLEAR TRASH</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-center gap-2 sm:gap-4 flex-wrap md:flex-nowrap w-full px-2">
                  {[0, 2, 3].map((i) => (
                    <div key={`slot-${i}`} className="flex-1 min-w-[100px] max-w-[180px]">
                      <div className="flex flex-col items-center w-full">
                        <div 
                          className="w-full h-20 border-[3px] border-terminal/30 bg-[#0c0c0c] flex flex-col items-center justify-center relative transition-all hover:border-terminal/60 cursor-pointer shadow-[0_0_15px_rgba(var(--terminal-color-rgb),0.05)]"
                          onClick={() => clearSlot(i)}
                        >
                          {slots[i] ? (
                            <div className="flex flex-col items-center justify-center">
                              {slots[i]?.icon && <span className="text-xl sm:text-3xl mb-1">[{slots[i]?.icon}]</span>}
                              <span className="font-bold text-lg sm:text-2xl tracking-tight" style={{ color: 'var(--terminal-color)' }}>{slots[i]?.text}</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center opacity-40">
                              <span className="text-[8px] sm:text-[10px] font-bold animate-pulse text-center px-1" style={{ color: 'var(--terminal-color)' }}>
                                {i === 3 ? '[ SELECT VERB ]' : i === 1 ? '[ SELECT LOC ]' : '[ SELECT NOUN ]'}
                              </span>
                            </div>
                          )}
                          
                          {/* Snap Point for Cog - 3-State Logic */}
                          {slots[i] && (
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                              <div className="h-3 w-0.5 bg-terminal/40" />
                              <div 
                                className="w-12 h-6 border-2 border-yellow-500/40 bg-[#0c0c0c] rounded-sm flex items-center justify-center hover:border-yellow-500 cursor-pointer shadow-lg"
                                onClick={(e) => { e.stopPropagation(); const n = [...cogs]; n[i] = null; setCogs(n); }}
                              >
                                {cogs[i] ? (
                                  <span className="text-[9px] font-bold text-yellow-500">{cogs[i]?.text}</span>
                                ) : (
                                  <span className="text-[14px] text-yellow-500/30">+</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Output Section - Fixed Width to prevent crushing */}
                  <div className="flex-shrink-0 flex items-center justify-center min-w-[100px] self-center">
                    <div className="font-bold text-xl sm:text-2xl animate-pulse flex gap-1" style={{ color: 'var(--terminal-color)' }}>
                      <span>{"->"}</span>
                      {dynamicOutputWords.map((word, i) => (
                        <span key={i}>{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center py-2 space-y-2">
              <button
                onClick={checkAutomation}
                disabled={status === 'RUNNING' || ruinedDish || isProcessingServe}
                className={`px-6 py-2 border-2 font-bold text-xs tracking-widest transition-all ${
                  status === 'RUNNING' || ruinedDish || isProcessingServe
                    ? 'border-gray-800 text-gray-500 cursor-not-allowed'
                    : 'border-terminal bg-terminal/10 text-terminal hover:bg-terminal hover:text-black shadow-[0_0_15px_rgba(var(--terminal-color-rgb),0.2)]'
                }`}
              >
                {status === 'RUNNING' ? '[ PROCESSING... ]' : '[ EXECUTE RECIPE (조리) ]'}
              </button>
            </div>

            <div className="flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <div className="text-[8px] opacity-50 uppercase">SYSTEM INPUT (CLICK TO ASSIGN):</div>
                <div className="flex flex-wrap gap-2">
                  {ENGINE_WORDS.filter(w => {
                    if (w.type !== 'particle') return false;
                    if (w.text === '요' || w.text === '습니다') return false;
                    
                    const activeItem = orderQueue[activeQueueIndex];
                    const isSoda = activeItem?.type === 'soda' || activeItem?.type === 'juice';
                    
                    if (isSoda) return w.text === '에' || w.text === '를';
                    return w.text === '에서' || w.text === '를' || w.text === '에';
                  }).map(cog => {
                    const isTutorialHighlight = shiftTutorialStep > 0 && (
                      (shiftTutorialStep === 1 && (cog.text === '를' || cog.text === '에서')) ||
                      (shiftTutorialStep === 2 && currentProduct === 'burger' && cog.text === '를')
                    );
                    
                    return (
                    <button
                      key={`cog-${cog.id}`}
                      onClick={() => {
                        let idx = -1;
                        if (cog.text === '에서') idx = 0;
                        if (cog.text === '를') idx = 2;
                        if (cog.text === '에') idx = 0;
                        if (idx !== -1) handleCogAssign(cog, idx);
                      }}
                      className={`px-3 py-1.5 border text-base font-bold transition-all ${
                        isTutorialHighlight
                          ? 'border-yellow-500 bg-yellow-500 text-black animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)] z-10'
                          : 'border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10'
                      }`}
                    >
                      [{cog.text}]
                    </button>
                  )})}
                </div>
              </div>
            </div>
          </>
        }
      </div>

      {/* Bottom Panels */}
      <div className="relative min-h-[160px]">
        <AnimatePresence mode="wait">
          {isTutorialSpawnPaused && !customer ? (
            <motion.div 
              key="tutorial-phase-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-3 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={32} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    PHASE 0: AWAITING CUSTOMERS
                  </div>
                  <div className="space-y-3 text-[11px] leading-relaxed">
                    <p>
                      The truck is deployed. Customers approach based on your <span className="underline decoration-2 font-black">REPUTATION (REP)</span> and Location popularity.
                    </p>
                    <p>
                      REP is earned by providing <span className="font-black">Perfect Serves</span> and matching greetings. High REP unlocks faster spawns and better tips.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/10 p-4 border-l-4 border-black space-y-2">
                    <div className="text-[10px] font-mono opacity-60 uppercase mb-2">// CURRENT_ENVIRONMENT_SCAN</div>
                    <p className="font-mono text-[10px]">
                      {">"} LOCATION: {location?.name.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} POPULARITY: {location?.id === 'business' ? 'HIGH' : 'MODERATE'}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} STATUS: {location?.koName} LULL
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsTutorialSpawnPaused(false);
                      spawnCustomer();
                    }}
                    className="w-full py-4 bg-black text-yellow-500 hover:bg-black/90 transition-all font-mono text-xs tracking-[0.3em] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] uppercase"
                  >
                    [ OK, INITIALIZE SCAN ]
                  </button>
                </div>
              </div>
            </motion.div>
          ) : !hasSeenShopTutorial && shiftStats.served === 0 && customer && servingPhase === 'GREETING' ? (
            <motion.div 
              key="tutorial-vibe-check"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-3 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={32} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    TEACHING VIBE CHECK:
                  </div>
                  <div className="space-y-3 text-[11px] leading-relaxed">
                    <p>
                      Match greeting formality to the Customer's <span className="underline decoration-2 font-black">Demographic</span>. 
                    </p>
                    <p>
                      Using <span className="font-black">Casual</span> greetings with elders or <span className="font-black">Formal</span> greetings with friends will offend them, causing immediate patience loss.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/10 p-4 border-l-4 border-black space-y-2">
                    <div className="text-[10px] font-mono opacity-60 uppercase mb-2">// TARGET_INTEL_SCAN</div>
                    <p className="font-mono text-[10px]">
                      {">"} TARGET: {customer?.name.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} DEMOGRAPHIC: {customer?.type}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} RULE: University Students = Casual or Polite
                    </p>
                  </div>
                  <div className="text-center text-[10px] animate-pulse opacity-60 font-mono py-4 border border-black/20">
                    [ SELECT A GREETING IN THE ORDER TICKET TO CONTINUE ]
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !hasSeenShopTutorial && shiftStats.served === 1 && customer && servingPhase === 'GREETING' ? (
            <motion.div 
              key="tutorial-vibe-check-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-4 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={24} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    NEW DEMOGRAPHIC DETECTED
                  </div>
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <p>
                      You have a new customer type: <span className="underline decoration-2 font-black">CITIZEN (Standard)</span>.
                    </p>
                    <p>
                      Citizens represent the general public. They expect standard <span className="font-black">Polite (해요체)</span> greetings. Using Casual speech will be considered rude.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/10 p-3 border-l-4 border-black space-y-2">
                    <div className="text-[10px] font-mono opacity-60 uppercase mb-1">// TARGET_INTEL_SCAN</div>
                    <p className="font-mono text-[10px]">
                      {">"} TARGET: {customer?.name.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} DEMOGRAPHIC: CITIZEN
                    </p>
                    <p className="font-mono text-[10px] font-black">
                      {">"} RULE: Citizen = Polite [ Option 2 ]
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !hasSeenShopTutorial && shiftStats.served === 2 && customer && servingPhase === 'GREETING' ? (
            <motion.div 
              key="tutorial-vibe-check-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-4 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={24} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    FINAL DEMOGRAPHIC DETECTED
                  </div>
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <p>
                      You have encountered a <span className="underline decoration-2 font-black">VIP (Business)</span> customer.
                    </p>
                    <p>
                      Executives, officials, and VIPs demand the highest level of respect. You must use <span className="font-black">Formal (하십시오체)</span> speech. Using anything lower will severely damage your reputation.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/10 p-3 border-l-4 border-black space-y-2">
                    <div className="text-[10px] font-mono opacity-60 uppercase mb-1">// TARGET_INTEL_SCAN</div>
                    <p className="font-mono text-[10px]">
                      {">"} TARGET: {customer?.name.toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} DEMOGRAPHIC: VIP / BUSINESS
                    </p>
                    <p className="font-mono text-[10px] font-black">
                      {">"} RULE: VIP = Formal [ Option 1 ]
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !hasSeenShopTutorial && shiftStats.served === 0 && customer && servingPhase === 'QUEUE' && !orderQueue.every(i => i.isCompleted) ? (
            <motion.div 
              key="tutorial-queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-3 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={24} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    TEACHING ORDER QUEUE:
                  </div>
                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <p>
                      These are your <span className="underline decoration-2 font-black">Active Orders</span>. Customers can order multiple items at once, ranging from plain to highly modified.
                    </p>
                    <p>
                      For now, this is just a standard, plain Burger. 
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-black text-yellow-500 p-3 border border-black space-y-2 shadow-lg">
                    <div className="text-[10px] font-mono opacity-60 uppercase mb-1">// CRITICAL_WARNING</div>
                    <p className="font-mono text-[10px] text-red-400 animate-pulse">
                      {">"} PAY ATTENTION TO THE PATIENCE BAR.
                    </p>
                    <p className="font-mono text-[10px]">
                      {">"} If it hits 0%, the customer will leave, heavily damaging your Reputation (REP).
                    </p>
                  </div>
                  <div className="text-center text-[10px] animate-pulse opacity-80 font-mono py-2 border border-black/20 bg-black/5">
                    [ CLICK THE PENDING BURGER IN THE QUEUE TO PREPARE IT ]
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !hasSeenShopTutorial && (shiftTutorialStep === 1 || shiftTutorialStep === 2) && servingPhase === 'COOKING' && !orderQueue.every(i => i.isCompleted) ? (
            <motion.div 
              key="tutorial-cooking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-yellow-500 text-black p-4 border-2 border-black font-bold text-xs shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full space-y-3 bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b-2 border-black/20 pb-2">
                    <AlertCircle size={32} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-base">[ INSTRUCTOR PROTOCOL ]</div>
                  </div>
                  <div className="text-xs tracking-widest opacity-80 underline decoration-black/30 underline-offset-4 uppercase">
                    {shiftTutorialStep === 1 ? "PHASE 1: BASIC SOV" : currentProduct !== 'burger' ? "PHASE 1: BASE ASSEMBLY" : "PHASE 2: FINITE GARNISH"}
                  </div>
                  <div className="space-y-3 text-[11px] leading-relaxed">
                    <p>
                      {shiftTutorialStep === 1 
                        ? "The machine follows SOV (Subject-Object-Verb) logic." 
                        : currentProduct !== 'burger' 
                          ? "Multi-step orders require a base first. Grill the meat from memory."
                          : "Onion is a finite ingredient. Add it using the correct object particle (를) and the verb 'To Add' (넣다)."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black text-yellow-500 p-4 text-center font-mono text-xs border-2 border-black shadow-lg">
                    <div className="opacity-60 text-[9px] mb-2 uppercase tracking-widest">// ACTIVE_RECIPE_TARGET</div>
                    {getInstructorContent().message}
                  </div>
                  <div className="text-[10px] leading-relaxed opacity-90 italic p-2 border-l-2 border-black">
                    {getInstructorContent().description}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="bottom-panels"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Inventory / Prep */}
              {shiftTutorialStep > 0 && orderQueue.length > 0 && orderQueue.every(i => i.isCompleted) ? (
                <div className="bg-yellow-500 text-black p-3 border-2 border-black font-bold shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center bg-[linear-gradient(rgba(0,0,0,0.05)_50%,transparent_50%)] bg-[length:100%_2px]">
                  <div className="flex items-center gap-2 border-b-2 border-black/20 pb-1 mb-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <div className="uppercase tracking-[0.2em] text-xs">[ VERIFICATION ]</div>
                  </div>
                  <div className="text-[10px] leading-tight space-y-1">
                    <p>Items <span className="text-green-800 font-black">[ READY ]</span>.</p>
                    <p>Click <span className="font-black animate-pulse">[ SERVE (제공) ]</span> to complete transaction.</p>
                    <p className="opacity-70 text-[8px] italic mt-1">*Missing items? Use APOLOGIZE.*</p>
                  </div>
                </div>
              ) : (
                <div className="terminal-border p-3 bg-[#0c0c0c] space-y-1 shrink-0">
                  <div className="border-b border-terminal/30 pb-1 flex flex-col space-y-1">
                    <div className="font-bold uppercase tracking-widest text-[10px]">
                      [ INVENTORY / STACKS ] (Native)
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <div className="flex items-center space-x-2 flex-1">
                        <span>SLOTS USED:</span>
                        <div className="flex-1 h-1.5 border border-terminal/30 bg-[#0c0c0c] max-w-[100px]">
                          <div 
                            className="h-full bg-terminal" 
                            style={{ width: `${Math.min(100, (usedSlots / inventory.maxStorage) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold ml-2">
                        {usedSlots}/{inventory.maxStorage} SLOTS
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-[10px]">
                    {/* Unique ingredients from recipes relevant to active menu + onion if burgers are present */}
                    {Array.from(new Set([
                      ...activeMenu.flatMap(dishId => Object.keys(RECIPE_REQUIREMENTS[dishId] || {})),
                      ...(activeMenu.some(id => id.includes('burger')) ? ['onion'] : [])
                    ])).map(ingredientId => {
                      const quantity = inventory.batches
                        .filter(b => b.id === ingredientId)
                        .reduce((acc, b) => acc + b.quantity, 0);

                      const displayName = ingredientId === 'beef' ? '고기' 
                                       : ingredientId === 'potato' ? '감자'
                                       : ingredientId === 'cheese' ? '치즈'
                                       : ingredientId === 'kimchi' ? '김치'
                                       : ingredientId === 'onion' ? '양파'
                                       : ingredientId === 'bun' ? '번'
                                       : ingredientId === 'soda' ? '탄산음료'
                                       : ingredientId === 'juice' ? '주스' : ingredientId;

                      const isZero = quantity === 0;

                      return (
                        <div key={ingredientId} className={`flex justify-between ${isZero ? 'text-red-500 line-through opacity-70' : ''}`}>
                          <span>&gt; {displayName}: {quantity}개</span>
                          {isZero && <span className="font-bold text-[8px]">[OUT OF STOCK]</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Operator Panel */}
              <div className="terminal-border p-3 bg-[#0c0c0c] space-y-1 shrink-0">
                <div className="font-bold border-b border-terminal/30 pb-1 uppercase tracking-widest text-[10px]">
                  [ OPERATOR PANEL ]
                </div>
                <div className="space-y-4 py-2">
                  <div className="flex justify-center space-x-4 pt-2">
                    {(!hasSeenShopTutorial && day === 0) ? (
                      <button 
                        disabled
                        className="px-4 py-1 border text-[10px] uppercase font-bold border-gray-800 text-gray-600 cursor-not-allowed"
                      >
                        [ ABORT LOCKED ]
                      </button>
                    ) : (
                      <button 
                        onClick={handleAbortClick}
                        className={`px-4 py-1 border text-[10px] uppercase font-bold transition-all ${
                          isConfirmingAbort 
                            ? 'border-red-500 bg-red-600 text-white animate-pulse scale-110 shadow-[0_0_15px_rgba(255,0,0,0.5)]' 
                            : isAnyItemDepleted 
                              ? 'border-red-500 bg-red-900/40 text-red-400 animate-pulse' 
                              : 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                        }`}
                      >
                        {isConfirmingAbort ? '[ CONFIRM ABORT? ]' : '[ ABORT SHIFT ]'}
                      </button>
                    )}
                    {isAnyItemDepleted ? (
                      <button 
                        onClick={handleApologize}
                        className="px-8 py-1 font-bold text-[10px] tracking-widest bg-yellow-600 text-black hover:bg-yellow-500 transition-all uppercase"
                      >
                        [ APOLOGIZE (죄송합니다) ]
                      </button>
                    ) : (
                      <button 
                        onClick={handleFinalServe}
                        disabled={!customer || isProcessingServe || !orderQueue.every(i => i.isCompleted === true)}
                        className={`px-8 py-1 font-bold text-[10px] tracking-widest transition-all ${!customer || isProcessingServe || !orderQueue.every(i => i.isCompleted === true) ? 'bg-gray-800 text-gray-500' : 'bg-terminal text-[#0c0c0c] hover:scale-105 animate-pulse'}`}
                      >
                        {isProcessingServe ? '[ PROCESSING... ]' : '[ SERVE (제공) ]'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* No feedback here anymore, moved to Order Ticket overlay */}
    </div>
  );
}

function ShiftSummaryPopup({ stats, onNext, day, isColorSettingUnlocked }: { stats: any, onNext: () => void, day: number, isColorSettingUnlocked: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md terminal-border bg-[#0c0c0c] p-6 space-y-6 shadow-[0_0_50px_rgba(0,255,65,0.2)]"
      >
        <div className="text-center space-y-2">
          <h2 className="text-terminal font-bold text-lg tracking-tighter animate-pulse">
            [ SHIFT TERMINATED: DAILY SUMMARY ]
          </h2>
          <div className="h-px bg-terminal/30 w-full" />
        </div>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-terminal/60">CUSTOMERS SERVED:</span>
            <span className="text-terminal font-bold">{stats.served}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal/60">FLAWLESS INTERACTIONS:</span>
            <span className="text-terminal font-bold">{stats.perfect}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal/60">WASTED INGREDIENTS:</span>
            <span className="text-red-500 font-bold">{stats.trashed}</span>
          </div>
          <div className="pt-2 border-t border-terminal/10">
            <div className="flex justify-between">
              <span className="text-terminal/60">BASE REVENUE:</span>
              <span className="text-terminal font-bold">+{stats.moneyEarned}₩</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal/60">TIP BONUS:</span>
              <span className="text-terminal font-bold">+{stats.tips}₩</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal/60">REPUTATION SHIFT:</span>
              <span className={`${stats.repEarned >= 0 ? 'text-terminal' : 'text-red-500'} font-bold`}>
                {stats.repEarned >= 0 ? '+' : ''}{stats.repEarned}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-terminal/30">
          <div className="flex justify-between items-center">
            <span className="text-terminal font-bold text-base">NET PROFIT:</span>
            <span className="text-terminal font-bold text-xl tracking-widest">
              {(stats.moneyEarned + stats.tips).toLocaleString()}₩
            </span>
          </div>
        </div>

        {day <= 1 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 text-[10px] text-yellow-500 font-bold space-y-1">
            <div>{"> SYS.MSG: Shift complete."}</div>
            <div>{"> To expand operations, explore [ RESEARCH & UPGRADES ] in the main menu."}</div>
          </div>
        )}

        {/* Reward Block for completing Orientation */}
        {day === 0 && isColorSettingUnlocked && (
          <div className="mt-4 p-3 border border-terminal text-terminal animate-pulse bg-terminal/5 space-y-1">
            <p className="text-[10px] font-bold tracking-tight">&gt; SYS.MSG: ORIENTATION COMPLETE.</p>
            <p className="text-[10px] font-bold tracking-tight">&gt; ADMIN PRIVILEGES ELEVATED.</p>
            <p className="font-bold text-yellow-500 text-[11px] mt-2 tracking-tighter">&gt; REWARD UNLOCKED: CRT PHOSPHOR COLOR CUSTOMIZATION</p>
          </div>
        )}

        <button 
          onClick={onNext}
          className="w-full py-3 bg-terminal text-[#0c0c0c] font-black text-sm tracking-[0.2em] hover:bg-terminal/80 transition-all active:scale-95 uppercase"
        >
          [ TRANSMIT DATA (NEXT) ]
        </button>
      </motion.div>
    </div>
  );
}

const FORMAL_GREETINGS = [
  { ko: "안녕하십니까", en: "Hello" },
  { ko: "어서 오십시오", en: "Welcome" },
  { ko: "무엇을 준비해 드릴까요?", en: "What shall I prepare?" },
  { ko: "주문하시겠습니까?", en: "Would you like to order?" }
];

const POLITE_GREETINGS = [
  { ko: "어서오세요", en: "Welcome" },
  { ko: "안녕하세요, 뭐 드릴까요?", en: "Hello, what can I get you?" },
  { ko: "주문 도와드릴까요?", en: "Can I help with your order?" },
  { ko: "반갑습니다!", en: "Nice to see you!" }
];

const CASUAL_GREETINGS = [
  { ko: "안녕! 뭐 줄까?", en: "Hi! What should I give you?" },
  { ko: "왔어? 뭐 먹을래?", en: "You're here? What do you wanna eat?" },
  { ko: "배고프지? 주문해!", en: "Hungry, right? Order up!" },
  { ko: "빨리 만들어 줄게!", en: "I'll make it fast!" }
];

const CUSTOMER_TYPES: { type: 'STUDENT' | 'STANDARD' | 'VIP', politeness: PolitenessLevel, label: string }[] = [
  { type: 'STUDENT', politeness: 'CASUAL', label: 'Student (Casual)' },
  { type: 'STANDARD', politeness: 'POLITE', label: 'Citizen (Polite)' },
  { type: 'VIP', politeness: 'FORMAL', label: 'Inspector (Formal)' },
];
