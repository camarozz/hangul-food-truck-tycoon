import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Location, Inventory } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import PreFlightModal from './PreFlightModal';

const LOCATIONS: Location[] = [
  {
    id: 'residence',
    name: 'Residential Area',
    koName: '주택가',
    description: 'Neighbors, kids, and local elders. A quiet, forgiving starting zone.',
    demographic: 'Locals (동네 사람) & Families',
    politeness: 'POLITE',
    focus: 'Standard Polite (해요체 / ~요)',
    trending: ['Warm (따뜻한)', 'Home-cooked'],
    incomeLevel: 'Low',
    orderComplexity: 'Simple',
    distanceKm: 0,
    fuelCost: 0,
    openTime: 660, // 11:00 AM
    closeTime: 1140, // 07:00 PM
    rushHours: [{ start: 900, end: 960, label: 'Afterschool Rush' }],
  },
  {
    id: 'univ',
    name: 'University',
    koName: '대학가',
    description: 'College students in a rush. High volume, fast-paced.',
    demographic: 'Students (학생)',
    politeness: 'CASUAL',
    focus: 'Students / Nightlife',
    trending: ['Spicy (매운)', 'Quick Snacks'],
    incomeLevel: 'Medium',
    orderComplexity: 'Medium',
    distanceKm: 2,
    fuelCost: 8,
    openTime: 960, // 04:00 PM
    closeTime: 120, // 02:00 AM (Next day)
    rushHours: [{ start: 1320, end: 1440, label: 'Midnight Snack Rush' }],
  },
  {
    id: 'park',
    name: 'Park',
    koName: '공원',
    description: 'Families and joggers enjoying the outdoors.',
    demographic: 'Families (가족) & Citizens',
    politeness: 'POLITE',
    focus: 'Native Numbers & Counters',
    trending: ['Healthy', 'Refreshing'],
    incomeLevel: 'Medium',
    orderComplexity: 'Medium',
    distanceKm: 3,
    fuelCost: 12,
    openTime: 540, // 09:00 AM
    closeTime: 1080, // 06:00 PM
    rushHours: [],
  },
  {
    id: 'business',
    name: 'Business District',
    koName: '상업지구',
    description: 'High-rise offices with busy professionals. High stakes, high reward.',
    demographic: 'Office Workers (회사원) & Executives',
    politeness: 'FORMAL',
    focus: 'Formal Verbs & Modifiers',
    trending: ['Premium', 'Cold Drinks'],
    incomeLevel: 'High',
    orderComplexity: 'Complex',
    distanceKm: 5,
    fuelCost: 20,
    openTime: 600, // 10:00 AM
    closeTime: 1200, // 08:00 PM
    rushHours: [{ start: 690, end: 780, label: 'Lunch Squeeze' }],
  }
];

export default function CityMap({ 
  currentFuel, 
  reputation,
  permits,
  day,
  inventory,
  unlockedRecipes,
  activeMenu,
  onUpdateMenu,
  onSelect, 
  onCancel 
}: { 
  currentFuel: number, 
  reputation: number,
  permits: string[],
  day: number,
  inventory: Inventory,
  unlockedRecipes: string[],
  activeMenu: string[],
  onUpdateMenu: (menu: string[]) => void,
  onSelect: (location: Location) => void, 
  onCancel: () => void 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showPreFlight, setShowPreFlight] = useState(false);
  const selected = LOCATIONS[selectedIndex];
  
  const isLocked = (selected?.id === 'univ' && !permits.includes('univ')) || 
                   (selected?.id === 'park' && !permits.includes('park')) ||
                   (selected?.id === 'business' && !permits.includes('business'));

  const canUnlockUniv = day >= 3 && reputation >= 60; // 3 days + 3 stars
  const canUnlockPark = reputation >= 100; // 5 stars
  const canUnlockBusiness = reputation >= 80; // 4 stars

  const handleDeploy = () => {
    if (isLocked) {
      if (selected.id === 'univ') {
        if (canUnlockUniv) {
          alert("UNIVERSITY ELIGIBLE! PURCHASE THE 'CAMPUS PARKING PERMIT' IN RESEARCH FOR 30,000₩.");
        } else {
          alert("NOT READY FOR CAMPUS. NEED 3 DAYS AND 3-STAR REPUTATION (60) IN RESIDENTIAL AREA.");
        }
      } else if (selected.id === 'business') {
        if (canUnlockBusiness) {
          alert("BUSINESS DISTRICT ELIGIBLE! PURCHASE THE PERMIT IN RESEARCH FOR 500,000₩.");
        } else {
          alert("REPUTATION TOO LOW. NEED 4 STARS (80) TO BE NOTICED BY THE BUSINESS DISTRICT.");
        }
      } else if (selected.id === 'park') {
        if (canUnlockPark) {
          alert("PARK SECTOR ELIGIBLE! PURCHASE THE 'PARK SECTOR PERMIT' IN RESEARCH FOR 15,000₩.");
        } else {
          alert("THE PARK IS FOR ELITE VENDORS. NEED 5-STAR REPUTATION (100).");
        }
      } else {
        alert("THIS AREA IS CURRENTLY LOCKED.");
      }
      return;
    }
    if (currentFuel < selected.fuelCost) {
      alert("NOT ENOUGH FUEL!");
      return;
    }
    setShowPreFlight(true);
  };

  const toggleMenuItem = (recipeId: string) => {
    if (activeMenu.includes(recipeId)) {
      onUpdateMenu(activeMenu.filter(id => id !== recipeId));
    } else {
      onUpdateMenu([...activeMenu, recipeId]);
    }
  };

  return (
    <div className="font-mono space-y-4" style={{ color: 'var(--terminal-color)' }}>
      <PreFlightModal
        isOpen={showPreFlight}
        onClose={() => setShowPreFlight(false)}
        onDeploy={onSelect}
        inventory={inventory}
        unlockedRecipes={unlockedRecipes}
        activeMenu={activeMenu}
        onUpdateMenu={onUpdateMenu}
        selectedLocation={selected}
        currentFuel={currentFuel}
      />

      <div className="border-y-2 border-terminal py-1 px-4 flex justify-between items-center bg-terminal/5">
        <span className="font-bold tracking-widest">[ CITY MAP ]  SELECT DEPLOYMENT ZONE FOR DAY {day.toString().padStart(3, '0')}</span>
        <span className="font-bold">[ FUEL: {currentFuel}% ]</span>
      </div>

      {/* ASCII Map */}
      <div className="border-b-2 border-terminal py-4 flex flex-col items-center justify-center relative min-h-[200px]">
        <div className="grid grid-cols-2 gap-4 w-full px-8 mb-4">
          {LOCATIONS.slice(0, 2).map((loc, i) => {
            const locLocked = (loc.id === 'univ' && !permits.includes('univ')) || 
                             (loc.id === 'park' && !permits.includes('park')) ||
                             (loc.id === 'business' && !permits.includes('business'));
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedIndex(i)}
                className={`text-left p-2 border transition-all ${
                  selectedIndex === i 
                    ? 'border-terminal bg-terminal/20 scale-[1.02]' 
                    : 'border-terminal/30 hover:border-terminal/60'
                } ${locLocked ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="text-xs font-bold">[{i + 1}] {loc.koName} ({loc.name}) {locLocked ? '- [ LOCKED ]' : ''}</div>
              </button>
            );
          })}
        </div>

        <pre className="ascii-art text-[8px] sm:text-[10px] leading-tight opacity-40 select-none pointer-events-none">
{`      _____   _____                          _  _  _   _  _  _ 
     |  _  | |  _  |                        | || || | | || || |
     | |_| | | |_| |                        | || || | | || || |
     |_____| |_____|                        |_||_||_| |_||_||_|
           \\\\ \\\\                                   / /
            \\\\ \\\\________   / / / / / / / /  _____/ /
             \\\\________ \\\\    / / / / / / / /    / _____/
                      \\\\ \\\\   / \\\\/ \\\\/ \\\\    / /
                       \\\\ \\\\  |       |   / /
                        \\\\_\\\\ |_______|  /_/`}
        </pre>

        <div className="grid grid-cols-2 gap-4 w-full px-8 mt-4">
          {LOCATIONS.slice(2).map((loc, i) => {
            const idx = i + 2;
            const locLocked = (loc.id === 'univ' && !permits.includes('univ')) || 
                             (loc.id === 'park' && !permits.includes('park')) ||
                             (loc.id === 'business' && !permits.includes('business'));
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedIndex(idx)}
                className={`text-left p-2 border transition-all ${
                  selectedIndex === idx 
                    ? 'border-terminal bg-terminal/20 scale-[1.02]' 
                    : 'border-terminal/30 hover:border-terminal/60'
                } ${locLocked ? 'opacity-40 grayscale' : ''}`}
              >
                <div className="text-xs font-bold">[{idx + 1}] {loc.koName} ({loc.name}) {locLocked ? '- [ LOCKED ]' : ''}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="border-b-2 border-terminal bg-terminal/5 p-4 space-y-3">
        <div className="font-bold border-b border-terminal/30 pb-1 uppercase tracking-widest text-xs">
          [ TARGET ANALYSIS ] : [{selectedIndex + 1}] {selected.koName} ({selected.name.toUpperCase()})
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[10px] sm:text-xs">
          <div className="space-y-1">
            <div><span className="opacity-60">&gt; DEMOGRAPHIC :</span> {selected.demographic}</div>
            <div><span className="opacity-60">&gt; POLITENESS  :</span> {selected.politeness} - {selected.focus}</div>
            <div><span className="opacity-60">&gt; EST. INCOME  :</span> {selected.incomeLevel}</div>
          </div>
          <div className="space-y-1">
            <div><span className="opacity-60">&gt; TRENDING     :</span> {selected.trending.join(', ')}</div>
            <div><span className="opacity-60">&gt; ORDER TYPE   :</span> {selected.orderComplexity}. Slow patience timers.</div>
            <div><span className="opacity-60">&gt; DISTANCE     :</span> {selected.distanceKm}km</div>
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex space-x-6 text-[10px] sm:text-xs">
          <span className="text-red-500 font-bold uppercase tracking-tighter">
            {isLocked ? '[ UNAUTHORIZED ZONE ]' : `FUEL COST: -${selected.fuelCost}%`}
          </span>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={onCancel}
            className="px-4 py-1 border border-terminal/30 hover:bg-red-500/20 hover:border-red-500 transition-all text-xs"
          >
            CANCEL
          </button>
          <button 
            onClick={handleDeploy}
            className={`px-6 py-1 font-bold transition-all text-xs ${isLocked ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-terminal text-[#0c0c0c] animate-pulse'}`}
          >
            {isLocked ? 'LOCKED' : 'DEPLOY (ENTER)'}
          </button>
        </div>
      </div>
    </div>
  );
}
