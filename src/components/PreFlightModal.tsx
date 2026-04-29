import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Inventory, Location } from '../types';
import { RECIPE_REQUIREMENTS, RECIPE_LABELS, INGREDIENT_ICONS, INGREDIENT_NAMES, UI_STRINGS } from '../constants';
import { audio } from '../audioManager';

export default function PreFlightModal({
  isOpen,
  onClose,
  onDeploy,
  inventory,
  unlockedRecipes,
  activeMenu,
  onUpdateMenu,
  selectedLocation,
  currentFuel
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (location: Location) => void;
  inventory: Inventory;
  unlockedRecipes: string[];
  activeMenu: string[];
  onUpdateMenu: (menu: string[]) => void;
  selectedLocation: Location | null;
  currentFuel: number;
}) {
  const [hoveredRecipe, setHoveredRecipe] = useState<string | null>(null);

  if (!isOpen || !selectedLocation) return null;

  const getStockCount = (id: string) => {
    return inventory.batches
      // Exclude spoiled items (daysLeft === 0)
      .filter(b => b.id === id && b.daysLeft !== 0)
      .reduce((sum, b) => sum + b.quantity, 0);
  };

  const canCraft = (recipeId: string) => {
    const reqs = RECIPE_REQUIREMENTS[recipeId];
    if (!reqs) return true;
    return Object.entries(reqs).every(([id, qty]) => getStockCount(id) >= qty);
  };

  const toggleMenuItem = (recipeId: string) => {
    if (!canCraft(recipeId)) return;
    if (activeMenu.includes(recipeId)) {
      onUpdateMenu(activeMenu.filter(id => id !== recipeId));
    } else {
      onUpdateMenu([...activeMenu, recipeId]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg terminal-border bg-[#0c0c0c] p-6 space-y-6 shadow-[0_0_50px_rgba(0,255,65,0.2)]"
        style={{ color: 'var(--terminal-color)' }}
      >
        <div className="text-center space-y-2">
          <h2 className="text-terminal font-bold text-xl tracking-tighter animate-pulse">
            [ PRE-FLIGHT CHECK: {selectedLocation.name.toUpperCase()} ]
          </h2>
          <div className="h-px bg-terminal/30 w-full" />
        </div>

        <div className="space-y-4">
          <div className="bg-terminal/5 p-4 border border-terminal/20 space-y-3 relative">
            <div className="text-xs font-bold text-terminal/60 uppercase tracking-widest">[ MENU CONFIGURATION ]</div>
            
            <div className="grid grid-cols-2 gap-2">
              {unlockedRecipes.map((recipeId, index) => {
                const isActive = activeMenu.includes(recipeId);
                const available = canCraft(recipeId);
                const label = RECIPE_LABELS[recipeId] || recipeId;
                
                return (
                  <div 
                    key={`${recipeId}-${index}`}
                    className="relative"
                    onMouseEnter={() => setHoveredRecipe(recipeId)}
                    onMouseLeave={() => setHoveredRecipe(null)}
                  >
                    <button
                      onClick={() => toggleMenuItem(recipeId)}
                      disabled={!available}
                      className={`w-full flex items-center justify-between px-3 py-2 border text-[10px] font-bold transition-all ${
                        !available
                          ? 'border-red-900/30 bg-red-900/10 text-red-500/50 cursor-not-allowed'
                          : isActive 
                            ? 'border-terminal bg-terminal/20 text-terminal' 
                            : 'border-terminal/20 text-terminal/40 hover:border-terminal/50'
                      }`}
                    >
                      <span className="truncate mr-1">{label} {!available && '(OUT OF STOCK)'}</span>
                      {isActive ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 border border-terminal/30" />}
                    </button>

                    <AnimatePresence>
                      {hoveredRecipe === recipeId && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-[110] left-0 top-full mt-1 w-full bg-[#1a1a1a] border border-terminal/40 p-2 shadow-2xl pointer-events-none"
                        >
                          <div className="text-[8px] font-bold text-terminal/60 mb-1 uppercase tracking-tighter">&gt; REQUIRED LOGISTICS:</div>
                          <div className="space-y-1">
                            {Object.entries(RECIPE_REQUIREMENTS[recipeId] || {}).map(([ingId, qty], i) => {
                              const stock = getStockCount(ingId);
                              const isShort = stock < qty;
                              return (
                                <div key={`preflight-req-${recipeId}-${ingId}-${i}`} className={`text-[9px] flex justify-between ${isShort ? 'text-red-500' : 'text-terminal/80'}`}>
                                  <span>[{INGREDIENT_ICONS[ingId] || '?'}] {INGREDIENT_NAMES[ingId] || ingId}:</span>
                                  <span>{stock} in stock</span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {activeMenu.length === 0 && (
              <div className="flex items-center space-x-2 text-red-500 text-[10px] animate-pulse">
                <AlertCircle size={12} />
                <span>AT LEAST 1 MENU ITEM MUST BE ACTIVE TO DEPLOY.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-[10px] opacity-80 italic">
            <div className="flex items-center space-x-2">
              <span className="text-terminal/40">&gt; FUEL RESERVES:</span>
              <span className={currentFuel < selectedLocation.fuelCost ? 'text-red-500 font-bold' : ''}>{currentFuel}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-terminal/40">&gt; EST. TRAVEL:</span>
              <span>-{selectedLocation.fuelCost}%</span>
            </div>
          </div>

          <div className="text-[10px] italic opacity-70 leading-relaxed border-l-2 border-yellow-500 pl-3 py-1">
            {UI_STRINGS.PRE_FLIGHT_ADVISORY}
          </div>
        </div>

        <div className="flex space-x-4 pt-4 border-t border-terminal/20">
          <button 
            onClick={onClose}
            className="flex-1 py-2 border border-terminal/30 hover:bg-red-500/10 hover:border-red-500 transition-all text-xs uppercase font-bold"
          >
            [ ABORT ]
          </button>
          <button 
            disabled={activeMenu.length === 0 || currentFuel < selectedLocation.fuelCost}
            onClick={() => {
              audio.playSFX('TRUCK_START');
              onDeploy(selectedLocation);
            }}
            className={`flex-1 py-2 font-bold text-xs uppercase transition-all ${
              activeMenu.length === 0 || currentFuel < selectedLocation.fuelCost
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-terminal text-[#0c0c0c] hover:bg-white'
            }`}
          >
            [ COMMENCE DEPLOYMENT ]
          </button>
        </div>
      </motion.div>
    </div>
  );
}
