/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Palette, Truck, CheckCircle2, Terminal, PenTool } from 'lucide-react';
import { TruckConfig, TruckProp, TruckColor, TruckWheel, TruckGrill, TruckUnderglow, TruckWindow, toSinoKorean } from '../types';
import { TRUCK_PROPS, TRUCK_COLORS, TRUCK_WHEELS, TRUCK_GRILLS, TRUCK_UNDERGLOWS, TRUCK_WINDOWS, getFrontViewAscii } from '../App';

export default function TruckCustomizer({ 
  money, 
  config, 
  onUpdate, 
  onCancel 
}: { 
  money: number, 
  config: TruckConfig, 
  onUpdate: (newConfig: TruckConfig, cost: number) => void, 
  onCancel: () => void 
}) {
  const [selectedColor, setSelectedColor] = useState<TruckColor>(config.color);
  const [selectedProp, setSelectedProp] = useState<TruckProp>(config.prop || TRUCK_PROPS[0]);
  const [selectedWheel, setSelectedWheel] = useState<TruckWheel>(config.wheel || TRUCK_WHEELS[0]);
  const [selectedGrill, setSelectedGrill] = useState<TruckGrill>(config.grill || TRUCK_GRILLS[0]);
  const [selectedUnderglow, setSelectedUnderglow] = useState<TruckUnderglow>(config.underglow || TRUCK_UNDERGLOWS[0]);
  const [selectedWindow, setSelectedWindow] = useState<TruckWindow>(config.window || TRUCK_WINDOWS[0]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    let cost = 0;
    if (selectedColor?.id !== config.color?.id) cost += 50000;
    if (selectedProp?.id !== config.prop?.id) cost += 150000;
    if (selectedWheel?.id !== config.wheel?.id) cost += 60000;
    if (selectedGrill?.id !== config.grill?.id) cost += 40000;
    if (selectedUnderglow?.id !== config.underglow?.id) cost += 120000;
    if (selectedWindow?.id !== config.window?.id) cost += 70000;
    setTotalCost(cost);
  }, [selectedColor, selectedProp, selectedWheel, selectedGrill, selectedUnderglow, selectedWindow, config]);

  const handleApply = () => {
    if (money < totalCost) return;
    onUpdate({
      ...config,
      color: selectedColor,
      prop: selectedProp,
      wheel: selectedWheel,
      grill: selectedGrill,
      underglow: selectedUnderglow,
      window: selectedWindow,
      signboard: config.signboard // Keep existing signboard so it doesn't break types
    }, totalCost);
  };

  return (
    <div className="space-y-6 font-mono" style={{ color: 'var(--terminal-color)' }}>
      <div className="border-y-2 border-terminal py-2 flex justify-between items-center px-4 bg-terminal/5">
        <div className="flex items-center space-x-3">
          <PenTool size={20} />
          <span className="font-bold tracking-widest uppercase">[ CUSTOMIZE & TUNING (튜닝샵) ]</span>
        </div>
        <div className="text-xs font-bold">
          FUNDS: {money.toLocaleString()}₩ ({toSinoKorean(money)} 원)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Current Visual & Workbench */}
        <div className="space-y-6">
          <div className="terminal-border p-4 bg-[#0c0c0c] flex flex-col items-center min-h-[250px] justify-center">
            <pre 
              className="ascii-art text-[10px] sm:text-xs leading-tight transition-colors duration-500 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]"
              style={{ color: selectedColor?.hex || 'var(--terminal-color)' }}
            >
              {getFrontViewAscii({ 
                ...config, 
                color: selectedColor, 
                prop: selectedProp, 
                wheel: selectedWheel,
                grill: selectedGrill,
                underglow: selectedUnderglow,
                window: selectedWindow,
                signboard: config.signboard 
              }).split('\n').map((line, i) => (
                <div key={`preview-line-${i}`}>
                   {line.includes('{{CHASSIS}}') ? (
                    <React.Fragment>
                      {'  =|'}
                      <span style={(selectedUnderglow && selectedUnderglow.id !== 'none') ? { color: selectedUnderglow.hex, textShadow: `0 0 8px ${selectedUnderglow.hex}` } : {}}>
                        {(selectedUnderglow && selectedUnderglow.id !== 'none') ? '==' : '__'}
                      </span>
                      {'/ \\'}
                      <span style={(selectedUnderglow && selectedUnderglow.id !== 'none') ? { color: selectedUnderglow.hex, textShadow: `0 0 8px ${selectedUnderglow.hex}` } : {}}>
                        {selectedUnderglow?.ascii || '_____________'}
                      </span>
                      {'|__/ \\_'}
                      {selectedGrill?.ascii || '=='}
                    </React.Fragment>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </pre>
          </div>

          <div className="terminal-border p-4 bg-terminal/5 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-terminal">[ WORKBENCH ]</div>
            <div className="flex items-center justify-center space-y-2 flex-col">
              <div className="text-sm">Construct your upgrade:</div>
              <div className="flex items-center space-x-2 text-lg font-bold flex-wrap justify-center">
                <span className="px-2 py-1 border border-terminal bg-terminal/20">[ {selectedColor?.text || '???'} ]</span>
                <span>+</span>
                <span className="px-2 py-1 border border-terminal bg-terminal/20">[ {selectedProp?.text || '???'} ]</span>
                <span>+</span>
                <span className="px-2 py-1 border border-terminal bg-terminal/20">[ {selectedWindow?.text || '???'} ]</span>
              </div>
              <div className="text-[10px] opacity-50">
                ({selectedColor?.meaning || 'Color'}) + ({selectedProp?.meaning || 'Prop'}) + ({selectedWindow?.meaning || 'Window'})
              </div>
            </div>
          </div>
        </div>

        {/* Right: Options */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {/* 1. Paint Job */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 1. PAINT JOB (색상) ]</span>
              <span className="text-yellow-500">50,000₩</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRUCK_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color)}
                  className={`p-2 border text-xs flex items-center space-x-2 transition-all ${selectedColor?.id === color.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <div className="w-3 h-3 border border-black/20" style={{ backgroundColor: color.hex }} />
                  <span>[{color.text}] ({color.meaning})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Roof Decoration */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 2. ROOF DECORATION (장식) ]</span>
              <span className="text-yellow-500">150,000₩</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TRUCK_PROPS.map(prop => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProp(prop)}
                  className={`p-2 border text-xs flex justify-between items-center transition-all ${selectedProp.id === prop.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <span>[{prop.text}] ({prop.meaning})</span>
                  {selectedProp.id === prop.id && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Wheel Hubcaps */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 3. WHEEL HUBCAPS (휠) ]</span>
              <span className="text-yellow-500">60,000₩</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRUCK_WHEELS.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWheel(w)}
                  className={`p-2 border text-xs flex justify-between items-center transition-all ${selectedWheel.id === w.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <span>{w.ascii} {w.meaning}</span>
                  {selectedWheel.id === w.id && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Grill Decals */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 4. GRILL DECALS (범퍼) ]</span>
              <span className="text-yellow-500">40,000₩</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TRUCK_GRILLS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGrill(g)}
                  className={`p-2 border text-xs flex justify-between items-center transition-all ${selectedGrill.id === g.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <span>{g.ascii} {g.meaning}</span>
                  {selectedGrill.id === g.id && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* 5. LED Underglow */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 5. LED UNDERGLOW (네온) ]</span>
              <span className="text-yellow-500">120,000₩</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {TRUCK_UNDERGLOWS.map(ug => (
                <button
                  key={ug.id}
                  onClick={() => setSelectedUnderglow(ug)}
                  className={`p-2 border text-xs flex justify-between items-center transition-all ${selectedUnderglow.id === ug.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <span>[{ug.text}] ({ug.meaning})</span>
                  {selectedUnderglow.id === ug.id && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Window Tints */}
          <div className="space-y-2">
            <div className="text-xs font-bold flex justify-between">
              <span>[ 6. WINDOW TINTS (창문 코팅) ]</span>
              <span className="text-yellow-500">70,000₩</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRUCK_WINDOWS.map(w => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWindow(w)}
                  className={`p-2 border text-xs flex justify-between items-center transition-all ${selectedWindow.id === w.id ? 'bg-terminal text-[#0c0c0c] border-terminal' : 'bg-[#1a1a1a] border-terminal/30 hover:border-terminal'}`}
                >
                  <span className="font-bold">{w.ascii.repeat(5)}</span>
                  {selectedWindow.id === w.id && <CheckCircle2 size={10} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Apply */}
      <div className="border-t-2 border-terminal/30 pt-4 flex flex-col items-center space-y-4">
        <div className="text-sm font-bold">
          TOTAL COST: <span className="text-yellow-500">{totalCost.toLocaleString()}₩ ({toSinoKorean(totalCost)} 원)</span>
        </div>
        
        <div className="flex space-x-4 w-full max-w-md">
          <button 
            onClick={onCancel}
            className="flex-1 p-3 border border-terminal/30 hover:bg-terminal/10 transition-all text-xs font-bold"
          >
            CANCEL
          </button>
          <button 
            onClick={handleApply}
            disabled={money < totalCost || totalCost === 0}
            className={`flex-1 p-3 font-bold text-xs transition-all ${
              money < totalCost || totalCost === 0
                ? 'bg-[#1a1a1a] text-terminal/30 border border-terminal/10 cursor-not-allowed'
                : 'bg-terminal text-[#0c0c0c] hover:scale-105 active:scale-95'
            }`}
          >
            APPLY CHANGES (ENTER)
          </button>
        </div>
        
        {money < totalCost && (
          <div className="text-red-500 text-[10px] font-bold animate-pulse">
            ERROR: INSUFFICIENT FUNDS
          </div>
        )}
      </div>
    </div>
  );
}
