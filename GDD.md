🍔 K-BITE Tycoon: Game Design Document (GDD)
1. Project Overview
Game Title: K-BITE Tycoon

Genre: Time-Management / Business Simulation

Platform: Web Browser (Desktop focused due to keyboard shortcuts)

Tech Stack: React, TypeScript, Vite

Core Loop: Restock Inventory ➔ Survive the Shift (Serve) ➔ Pay Bills/Upgrade ➔ Repeat.

2. Core Mechanics & Pacing
The "Constant Clock"
The game runs on an unrelenting, fast-paced timer. Time never slows down or pauses while customers are at the window.

Tick Rate: 1 in-game minute = 300 real-world milliseconds.

Shift Length: A standard 8-hour shift takes exactly ~2.4 minutes of real-world time.

Objective: Serve as many customers as physically possible before the location closes.

The Reputation (REP) System
Reputation is the engine that drives the game's difficulty and profit potential.

High REP: Rapid customer spawn rates. Requires high inventory capacity and perfect execution to keep up with the rush.

Low REP: Slow customer spawns, leading to dead shifts and low profit.

REP Gains: Serving perfect orders, high-tier customers.

REP Penalties: * Customer leaves angry: -5 REP

Missing Rent: -15 REP

Food Spoilage: -2 to -8 REP (depending on amount)

3. Serving & Customer Interaction
The Greeting Phase
Before taking an order, players must execute a "Vibe Check" greeting using keyboard shortcuts. Customers require specific politeness levels.

1 - FORMAL

2 - POLITE

3 - CASUAL

Outcomes: * Perfect Match: +25% Patience

Good Enough (Polite fallback): +10% Patience

Wrong Tone: -30% Patience

The Order Queue
After greeting, the player fulfills orders using specific station appliances (Grill, Fryer, Beverage Station). If the player ruins a dish, they must clear it and restart while the customer's patience drains.

4. Inventory & Economy
The 20-Item Stack Rule (Inventory Tetris)
Inventory is strictly capped by physical truck space, making restock highly strategic.

Slot System: The truck has a maximum number of storage slots (starts at 10, upgrades up to 30).

Stack Limit: 1 Slot holds exactly 20 units of a single item.

Example: Buying 45 Buns consumes 3 Slots (20 + 20 + 5). Players must balance bulk-buying for rushes against having a diverse menu.

Spoilage
Perishable ingredients have a shelf life (daysLeft). At the end of every day, daysLeft decreases by 1.

Items that hit 0 days left are legally spoiled.

Spoiled items are automatically discarded, triggering a Reputation penalty and wasting the player's invested money.

The Market & Financials
Dynamic Pricing: Ingredient prices fluctuate daily. Market data is cached per day to prevent players from refreshing the app to get better prices.

Rent: Daily parking rent scales up as the game progresses: 80000 + (day * 8000).

Loans: Players can take out Bank or Shark loans. Missing a Bank loan triggers a bailout; missing a Shark loan triggers Game Over (or unlocking the Crimson theme if paid off).

5. Progression & Unlocks (Research Center)
Players reinvest profits into their business via the Research Center.

Permits (Location Unlocks)
Higher-tier locations have wealthier customers but higher rent and harsher REP requirements.

Residential Area (Starter)

Business District

Park Sector (Requires Upgrade ID 12)

Truck Upgrades
Capacity: Wide Prep Board (+5 Slots), Chassis Expansions.

Appliances: Deep Fryer (ID 11), Beverage Station (ID 13).

Cosmetics
Visual customization applies to the ASCII-rendered truck and persists in the player's save file.

Adjectives & Paint Colors

Roof Props (Burger, Taco, Ramen)

Underglow LEDs, Grills, and Wheels.

6. Technical Architecture & Save State
Firebase Persistence
The game state is heavily tied to Firebase Firestore. The following crucial data must always be saved and loaded:

inventory (Active batches and days left)

stats (Lifetime revenue, max daily profit, days played)

activeMenu (The specific items the player chose to sell that day)

truckConfig (All active cosmetics)

permits & unlockedUpgrades

Math & Formatting
Currency Display: Uses a custom algorithmic toSinoKorean function to recursively format large Won (₩) amounts (e.g., 350,000 becomes 삼십오만).

Native Counters: Uses toNativeKorean for smaller unit counting (e.g., inventory slots).