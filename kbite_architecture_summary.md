# K-Bite Tycoon Project Architecture Summary

This document provides a comprehensive summary of the codebase architecture, state management, and individual `.tsx` components in the K-Bite Tycoon project. This will serve as excellent context for NotebookLM to understand the game logic and structure.

## 1. Core Architecture & State Management

### `src/App.tsx` & `src/main.tsx`
*   **Role:** The entry point (`main.tsx`) renders `App.tsx`, which acts as the main UI shell and orchestrator.
*   **Functionality:** Manages the high-level screen routing (main menu, map, serving station, etc.). It wraps the application in the `GameProvider` and `ErrorBoundary` components. Handles the `DEV MODE` toggle and applies global CSS variables for CRT effects and color themes based on settings.

### `src/context/GameContext.tsx`
*   **Role:** The single source of truth for persistent game state.
*   **State Managed:** Economy (money), player reputation, inventory (batches, spoilage tracking, storage capacity), unlocked recipes, active menu configuration, truck customization, research upgrades, day counter, and current location.
*   **Persistence:** Automatically synchronizes state with `localStorage` (`kbite_save_data`).
*   **Key Hooks:** Exposes the `useGame` hook, heavily preventing prop drilling across the app. It centralizes core business logic functions like `handleServingComplete`, `handleRestockComplete`, and `advanceDay`.

### `src/types.ts` & `src/constants.ts`
*   **Role:** Type definitions and static configuration.
*   **Functionality:** Contains types for Inventory, Customers, SOV Words, and TruckConfig. Includes static configs such as market prices, recipe ingredient requirements, upgrade tiers, translation dictionaries, and ASCII art pieces.

### `src/components/ErrorBoundary.tsx`
*   **Role:** Stability infrastructure. Provides three tiers of recovery:
    *   `GameBoundary`: Catches full app crashes, offering a hard reset.
    *   `ScreenBoundary`: Isolation for individual menu screens.
    *   `ServingBoundary`: Specifically wraps the `ServingStation`, preventing session loss or corrupted saves if a crash occurs mid-shift.

## 2. Core Game Loop Components

### `src/components/CityMap.tsx`
*   **Role:** Location selection screen before starting a shift.
*   **Functionality:** Checks fuel costs and player reputation/permit unlocks before allowing deployment to locations like the Residence, University, Business District, and Park.

### `src/components/PreFlightModal.tsx`
*   **Role:** The final configuration check before a shift begins.
*   **Functionality:** Allows players to configure their active menu (what they will sell today). It cross-references the menu with `RECIPE_REQUIREMENTS` and validates that the player has enough raw ingredients in their inventory to fulfill orders.

### `src/components/SystemBootSequence.tsx`
*   **Role:** A thematic loading screen transitioning into the shift.
*   **Functionality:** Renders the player's customized truck ASCII art and simulates a terminal boot-up sequence before the player takes control of the Serving Station.

### `src/components/ServingStation.tsx` (The Heart of the Game)
*   **Role:** The main active gameplay screen where players fulfill orders.
*   **Complexity:** Very High (2300+ lines).
*   **Core Mechanics:** 
    *   **Customer Queue:** Spawns customers with specific demographic traits (Student, Citizen, VIP) who order items with potential picky modifiers (e.g., "+ Onion", "- Spicy Sauce").
    *   **Vibe Check (Greeting Phase):** Players must match the politeness level of their greeting (Casual, Polite, Formal) to the customer's demographic. Wrong choices heavily penalize patience.
    *   **SOV Engine (Cooking Phase):** Players assemble Korean Subject-Object-Verb (SOV) sentences using vocabulary and particles (e.g., `[고기] [를] [그릴] [에서] [굽다]`). It strictly validates grammar and cooking method combinations to produce food, garnish it, or fail (resulting in a ruined dish/fire).
    *   **Patience & Time Management:** Tracks customer patience bars and the shift's time of day. Handles shift completion, calculating profits, tips, and reputation changes in a `ShiftSummaryPopup`.

### `src/components/CalendarScreen.tsx`
*   **Role:** End-of-day summary and transition screen.
*   **Functionality:** Advances the game day, calculates daily operational costs (like rent or loan interest), degrades ingredient freshness (spoilage system), updates market catalogs, and triggers the `kbite_save_data` persistent save.

## 3. Management & Economy Components

### `src/components/RestockStation.tsx`
*   **Role:** Wholesale market for purchasing ingredients.
*   **Mechanics:** Dynamic pricing that fluctuates daily and scales with inflation. Offers reputation-based discounts. Players type Hangul phrases (e.g., "고기 열 개") using correct Native or Sino numbers and counters to purchase stock. Handles inventory slot limits and delivery timing (standard vs. "Baedal"/instant).

### `src/components/KitchenLab.tsx`
*   **Role:** R&D facility for unlocking new recipes.
*   **Mechanics:** Players type Hangul words to synthesize new menu items (e.g., typing '고기', '빵', '치즈' to unlock a Cheeseburger). Validates that the player has the required raw materials in stock before unlocking.

### `src/components/ResearchCenter.tsx`
*   **Role:** Upgrade tree interface.
*   **Functionality:** Players spend money to unlock permanent equipment (Fryer, Beverage Station), truck expansions (more storage slots), and permits for new map areas. Upgrades are gated by tiers, the current day, and reputation thresholds.

### `src/components/TruckCustomizer.tsx`
*   **Role:** Visual customization shop.
*   **Functionality:** Allows players to purchase aesthetic changes for their food truck (paint jobs, roof props, wheels, neon underglow). The `App.tsx` and `SystemBootSequence` dynamically render these modular ASCII changes globally.

### `src/components/AlbaMiniGame.tsx`
*   **Role:** Part-time job mini-game for emergency funds.
*   **Mechanics:** Players "wash dishes" by correctly matching Native Korean numbers (orders) with Sino-Korean numbers (prices) under a strict time limit.

### `src/components/BailoutScreen.tsx`
*   **Role:** Bankruptcy recovery protocol.
*   **Functionality:** If funds drop significantly below zero, players must take out a loan to survive. They assemble a contractual sentence to accept terms from either the Bank (fair terms) or a Loan Shark (harsh terms).

## 4. Utility & Lore Components

### `src/components/IntroCutscene.tsx`
*   **Role:** Narrative opening sequence.
*   **Functionality:** Explains the player's transition from an overworked corporate drone to a remote K-Bite food truck operator using stylized text logs and CRT scanlines.

### `src/components/SettingsMenu.tsx`
*   **Role:** Options configuration.
*   **Functionality:** Allows toggling CRT effects, audio volume levels (hooked into the global `AudioManager` singleton), UI themes (locked behind tutorials), and a Romanization assist toggle. Also provides a Danger Zone for wiping save data.

### `src/components/PatchNotes.tsx`
*   **Role:** In-game changelog.
*   **Functionality:** Displays previous game updates, bug fixes, and feature additions in a stylized terminal modal.
