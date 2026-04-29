/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { GAME_VERSION } from '../constants';

interface PatchNotesProps {
  onClose: () => void;
}

const PatchNotes: React.FC<PatchNotesProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl terminal-border bg-[#0c0c0c] font-mono overflow-hidden flex flex-col shadow-[0_0_50px_rgba(var(--terminal-color-rgb),0.2)]" style={{ color: 'var(--terminal-color)' }}>
        <div className="border-b-2 border-terminal py-2 px-4 flex justify-between items-center bg-terminal/10">
          <span className="font-bold tracking-widest">[ SYSTEM PATCH NOTES ]</span>
          <span className="text-xs opacity-60">CURRENT VERSION: {GAME_VERSION}</span>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold">&gt; [v1.5.0] - THE QUALITY CONTROL & PERSISTENCE UPDATE</h3>
            <ul className="list-none space-y-1 pl-4 opacity-90 text-sm">
              <li>- LOGIC: Implemented strict Burger Construction rules; Cheese/Kimchi MUST be added before Garnish for order completion.</li>
              <li>- SYSTEM: Persistent Daily Market; Market catalog is now cached at the system level, preventing reshuffling when re-entering on the same day.</li>
              <li>- GRAMMAR: Rebuilt Korean Number Engine; algorithms updated for perfect algorithmic Native (1-99) and Sino (1-999,999) conversions.</li>
              <li>- UI: Modernized Order Ticket UI; implemented nested "↳ GARNISH" indicators and improved visual hierarchy for complex tickets.</li>
              <li>- RESEARCH: Patched Research Center state-sync; equipment upgrades now actively listen for external state changes.</li>
              <li>- PERSISTENCE: Enhanced Auto-save cycle to include Menu Configuration changes.</li>
              <li>- STABILITY: Normalized package dependencies for improved server compatibility.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.4.0] - THE AUDIO & FRESHNESS UPDATE</h3>
            <ul className="list-none space-y-1 pl-4 opacity-90 text-sm">
              <li>- AUDIO: Implementation of the "Audio Engine" singleton for stable, multi-channel sound management.</li>
              <li>- SOUNDS: Added high-fidelity SFX for cooking (GRILLS/FRYERS), cash register, TRASHing items, and UI interactions.</li>
              <li>- MUSIC: Contextual BGM added; music now shifts dynamically between BOOT, MENU, SERVING, and ALBA states.</li>
              <li>- REFINEMENT: Volume Sliders in Settings now strictly synchronize with the global Audio Engine levels.</li>
              <li>- SPOILAGE LOCK: System now strictly prevents using spoiled food (DaysLeft: 0) for Cooking, Lab Synthesis, or Deployment.</li>
              <li>- UI: Inventory and Market displays now correctly filter "0-Day" items from active stock counts.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.3.0] - STATION OPTIMIZATION & LOGISTICS UPDATE</h3>
            <ul className="list-none space-y-1 pl-4 opacity-90 text-sm">
              <li>- MARKET: Added strict Tutorial Lock for initial meat purchase to prevent early-game fund depletion.</li>
              <li>- MARKET: Rebuilt Spoilage Warning system with dynamic severity levels (Fresh/Warning/Critical Pulse).</li>
              <li>- SERVING: Implemented Contextual Grammar Filtering; machine now hides irrelevant recipe components based on the active item.</li>
              <li>- SERVING: Enhanced Station Feedback with dynamic headers (Grill, Fry, Prep, Beverage) for clearer workflow visibility.</li>
              <li>- SERVING: Refined Beverage Station logic with separate Soda/Juice strictly enforced grammars.</li>
              <li>- UI: Decoupled Tutorial Overlays from Serving Station to keep the operator console clear during active shifts.</li>
              <li>- SERVING: Operator Panel and Inventory now remain visible during active cooking phases for better multi-tasking.</li>
              <li>- FIXES: Removed redundant "Cup" object to eliminate naming collisions with the Cup location.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.2.0] - SYSTEM REFINEMENT & STABILITY</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- MECHANICS: Patched "Double-Count" bug where multi-item orders over-calculated reputation and serving stats.</li>
              <li>- LOGIC: Implemented automated slot-clearing after successful intermediate synthesis steps.</li>
              <li>- VISUALS: Modernized Intro Cutscene layout with adjusted container constraints for cleaner presentation.</li>
              <li>- TUTORIAL: Enhanced Orientation Shift guidance with explicit button nomenclature and visual highlights.</li>
              <li>- FIXES: Resolved garnish logic inconsistencies; Onions and Spicy Sauce now correctly trigger order completion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.1.0] - TUTORIAL & ONBOARDING UPDATE</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- TUTORIAL: Implemented 4-part comprehensive onboarding system.</li>
              <li>- GUIDANCE: Added real-time SOV highlighting for tutorial orders.</li>
              <li>- RESEARCH: New guided protocol for first equipment purchase with tutorial refund.</li>
              <li>- KITCHEN: Step-by-step synthesis tutorial for Cheese Burger recipe.</li>
              <li>- MARKET: Guided restocking and delivery tutorial for new operators.</li>
              <li>- INVENTORY: Starting stock adjusted (12 Buns, 10 Meat, 5 Soda, 5 Cheese, 5 Onions).</li>
              <li>- MECHANICS: Onions are now a finite resource (removed from infinite items).</li>
              <li>- PERSISTENCE: Tutorial progress now saves to Firestore.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.0.44]</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- FIXED: Soft-lock bug in Order Ticket screen after incorrect orders.</li>
              <li>- STABILITY: Added 1.5s reset timeout and failsafe customer generation to Trash Clearance.</li>
              <li>- LOGIC: Storage capacity warning now correctly triggers only at full capacity.</li>
              <li>- UI: Added "Status Nominal" log for inventory checks within safe limits.</li>
              <li>- DATA: Implemented strict clamping for Reputation and Gas to prevent RangeErrors.</li>
              <li>- CLOUD: Patched Firestore permission errors by validating state bounds before saving.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.0.43]</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- RECONNECTED: Park Sector (공원) is now fully unlockable.</li>
              <li>- Added "PERMIT: PARK SECTOR" to Research Center (Requires 5-Star Reputation).</li>
              <li>- Dynamic Map: ASCII art now reflects real-time unlock status for the Park.</li>
              <li>- Content Gating: High-tier permits now hide until Day 3 or specific Rep milestones.</li>
              <li>- Integrated "System Override" unlock alerts into End-of-Day reports.</li>
              <li>- Fixed critical TypeError in Settings Menu when checking theme eligibility.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.0.42]</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- UI Update: Automation Engine slots are now 3x larger for readability.</li>
              <li>- Added visual Vibe Check icons to customers (O_O).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-yellow-500 font-bold opacity-60">&gt; [v1.0.40]</h3>
            <ul className="list-none space-y-1 pl-4 opacity-60 text-sm">
              <li>- Initial Startup Sequence verified.</li>
              <li>- Welcome to K-BITE EXPRESS.</li>
            </ul>
          </section>
        </div>

        <div className="border-t-2 border-terminal p-4 flex justify-center bg-terminal/5">
          <button
            onClick={onClose}
            className="px-8 py-2 border-2 border-terminal hover:bg-terminal hover:text-black transition-all font-bold uppercase tracking-widest text-sm"
          >
            [ CLOSE LOG ]
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PatchNotes;
