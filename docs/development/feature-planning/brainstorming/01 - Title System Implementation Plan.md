# Implementation Plan: Character Title System

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & State Schema](https://www.google.com/search?q=%23phase-1-data-models--state-schema "null")
    
6. [Phase 2: Static Data & Migration Tests](https://www.google.com/search?q=%23phase-2-static-data--migration-tests "null")
    
7. [Phase 3: Achievement & Store Integration](https://www.google.com/search?q=%23phase-3-achievement--store-integration "null")
    
8. [Phase 4: Buff Engine Injection](https://www.google.com/search?q=%23phase-4-buff-engine-injection "null")
    
9. [Phase 5: Services & Integration Tests](https://www.google.com/search?q=%23phase-5-services--integration-tests "null")
    
10. [Phase 6: UI & Styling](https://www.google.com/search?q=%23phase-6-ui--styling "null")
    
11. [Phase 7: UI Tests & Verification](https://www.google.com/search?q=%23phase-7-ui-tests--verification "null")
    
12. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Implement an unlockable Title system that rewards players for in-game consistency. Titles offer visual prestige (colored gradients based on rarity) and specific numerical micro-buffs to gameplay mechanics (XP, combat, stamina).

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & State Schema|Low|None|N/A|🔲 TODO|
|2|Static Data & Migration Tests|Low|Phase 1|>90% lines|🔲 TODO|
|3|Achievement & Store Integration|Medium|Phase 1|N/A|🔲 TODO|
|4|Buff Engine Injection|High|Phase 3|N/A|🔲 TODO|
|5|Services & Integration Tests|High|Phase 4|>85% lines/branch|🔲 TODO|
|6|UI & Styling|Medium|Phase 3|N/A|🔲 TODO|
|7|UI Tests & Verification|Low|Phase 6|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Decoupled Progression:** Titles are inherently tied to `Achievements`. We will NOT build a separate progression loop for titles. If an achievement is completed, an event is fired. The `AchievementService` checks if `grantedTitleId` exists on that achievement, and if so, unlocks it. This maintains the Single Responsibility Principle and avoids redundant tick loops.
    
2. **Explicit Buff Enums:** Instead of using dynamic execution (which violates Obsidian's strict `eval()` rules), buffs are mapped via a strict enum (`TitleBuffType`). Systems like `XPSystem` and `CombatService` will explicitly switch on these enums.
    
3. **Data Resilience (Zustand):** Because `Character.ts` is persisted to disk, adding `unlockedTitles` and `activeTitleId` requires careful initialization so existing users (Schema v4) do not crash upon loading.
    
4. **CSS-Driven Rarity:** To adhere to standard Obsidian design, rarity gradients and shadows will use predefined CSS utility classes (`.qb-title-epic`, etc.) mapped to Obsidian's native CSS variables where possible.
    

## Non-Goals

- **No temporary or expiring titles.** Once unlocked, it is permanent.
    
- **No debuff titles.** All titles must provide a neutral or positive experience.
    
- **No stat-sheet clutter.** Micro-buffs from titles will apply _during calculation_ (e.g., adding 5% to the final XP payout toast) rather than dynamically altering base stat values on the Character Sheet, keeping character attributes clean.
    

## File Change Summary

**New Files:**

- `src/models/Title.ts` (Data structures and enums)
    
- `src/data/titles.ts` (Static registry of available titles)
    
- `src/modals/TitleSelectionModal.ts` (Obsidian Modal for choosing active title)
    
- `test/services/title.test.ts` (Business logic tests)
    

**Modified Files:**

- `src/models/Character.ts` (State definition updates)
    
- `src/models/Achievement.ts` (Add `grantedTitleId` property)
    
- `src/data/achievements.ts` (Map existing achievements to new titles)
    
- `src/store/characterStore.ts` (State mutators for titles)
    
- `src/services/AchievementService.ts` (Unlock logic intercept)
    
- `src/services/XPSystem.ts` (Calculate buff injection)
    
- `src/services/CombatService.ts` (Calculate buff injection)
    
- `src/components/CharacterSheet.tsx` (UI representation)
    
- `src/styles/character.css` (Typography styling)
    
- `src/styles/modals.css` (Modal layout)
    

## Phase 1: Data Models & State Schema

**Effort:** Low | **Testable:** No

1. **Create `src/models/Title.ts`:**
    
    ```
    export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary';
    
    export enum TitleBuffType {
        NONE = 'none',
        XP_MORNING = 'xp_morning',           // e.g., +5% XP before 10 AM
        STAMINA_REGEN = 'stamina_regen',     // e.g., +2 stamina on daily reset
        BOSS_DAMAGE = 'boss_damage',         // e.g., +10% damage to bosses
        FAST_COMPLETION = 'fast_completion'  // e.g., XP boost if task checked < 1hr of creation
    }
    
    export interface Title {
        id: string;
        name: string;
        description: string;
        rarity: TitleRarity;
        buffType: TitleBuffType;
        buffValue: number; // The numeric modifier (e.g., 0.05 for 5%, or 2 for flat values)
    }
    ```
    
2. **Update `src/models/Character.ts`:**
    
    - In the `Character` interface, append:
        
        ```
        unlockedTitles: string[]; // Array of Title IDs
        activeTitleId: string | null;
        ```
        
3. **Update `src/models/Achievement.ts`:**
    
    - Add optional property: `grantedTitleId?: string;`
        
4. **Create `src/data/titles.ts`:**
    
    - Export a `const TITLES: Record<string, Title>` object containing 5 baseline titles to start:
        
        - `the_early_bird`: Rare, `XP_MORNING`, 0.05 (+5%)
            
        - `the_relentless`: Epic, `STAMINA_REGEN`, 2 (+2 points)
            
        - `slayer_of_the_void`: Legendary, `BOSS_DAMAGE`, 0.10 (+10%)
            
        - `the_efficient`: Rare, `FAST_COMPLETION`, 0.05 (+5%)
            
        - `the_novice`: Common, `NONE`, 0 (Free starting title)
            
5. **Update `src/data/achievements.ts`:**
    
    - Map `grantedTitleId` to existing achievements (e.g., attach `the_early_bird` to an achievement for completing 50 total tasks).
        

## Phase 2: Static Data & Migration Tests

**Effort:** Low | **Coverage Target:** >90% lines

1. **Create/Update `test/models/Title.test.ts`:**
    
    - **Data Integrity Test:** Iterate `TITLES` and ensure `id` matches the dictionary key.
        
    - **Reference Integrity Test:** Iterate `ACHIEVEMENTS` and ensure any `grantedTitleId` exists in the `TITLES` registry.
        
2. **Update `test/store/characterStore.test.ts`:**
    
    - Create a test for backwards compatibility: initialize the store with a V4 schema payload (missing title arrays). Assert that the store normalizes the payload to include `unlockedTitles: []` and `activeTitleId: null` safely without throwing an error.
        

## Phase 3: Achievement & Store Integration

**Effort:** Medium | **Testable:** No

1. **Update `src/store/characterStore.ts`:**
    
    - Add to interface: `setActiveTitle: (titleId: string | null) => void`
        
    - Add to interface: `unlockTitle: (titleId: string) => void`
        
    - Implementation for `unlockTitle`:
        
        ```
        set((state) => ({
            character: {
                ...state.character,
                unlockedTitles: state.character.unlockedTitles.includes(titleId) 
                    ? state.character.unlockedTitles 
                    : [...state.character.unlockedTitles, titleId]
            }
        }))
        ```
        
2. **Update `src/services/AchievementService.ts`:**
    
    - Locate the method handling achievement unlocking (e.g., `checkAchievements` or `unlockAchievement`).
        
    - When an achievement is successfully unlocked, check: `if (achievement.grantedTitleId)`.
        
    - If true, dispatch `characterStore.getState().unlockTitle(achievement.grantedTitleId)`.
        
    - _(Optional/Polish)_: Trigger the UI toast: `Notice('Title Unlocked: ' + title.name)`.
        

## Phase 4: Buff Engine Injection

**Effort:** High | **Testable:** No

Inject logic into core game loops to read the active title.

1. **Update `src/services/XPSystem.ts` (or equivalent XP calculation method):**
    
    - Read `const { activeTitleId } = useCharacterStore.getState().character;`
        
    - Retrieve title from `TITLES` registry.
        
    - Apply logic:
        
        ```
        if (title?.buffType === TitleBuffType.XP_MORNING) {
            const currentHour = new Date().getHours();
            if (currentHour < 10) {
                baseXp = baseXp * (1 + title.buffValue);
            }
        }
        ```
        
2. **Update `src/services/CombatService.ts`:**
    
    - In the damage calculation method:
        
        ```
        if (title?.buffType === TitleBuffType.BOSS_DAMAGE && enemy.isBoss) {
            finalDamage = finalDamage * (1 + title.buffValue);
        }
        ```
        
3. **Update `src/services/RecoveryTimerService.ts` (or Stamina logic):**
    
    - When applying daily reset or interval ticks, check for `TitleBuffType.STAMINA_REGEN` and add `title.buffValue` to the regenerated amount.
        

## Phase 5: Services & Integration Tests

**Effort:** High | **Coverage Target:** >85% branch coverage

1. **Create `test/services/title.test.ts` (Integration suite):**
    
    - **Test 1: Store Mutators.** Call `setActiveTitle` and `unlockTitle`. Ensure state updates correctly and prevents duplicates.
        
    - **Test 2: Achievement Pipeline.** Manually trigger an achievement unlock via `AchievementService`. Assert the store now contains the mapped title.
        
    - **Test 3: XP Multiplier.** Mock date to 8:00 AM. Run XP calc with and without `XP_MORNING` title active. Assert exact 5% mathematical difference. Mock date to 11:00 AM. Assert no difference.
        
    - **Test 4: Combat Engine.** Mock a battle state against a Boss. Run damage calc with `BOSS_DAMAGE` title. Assert damage outputs match expected boosted values.
        

## Phase 6: UI & Styling

**Effort:** Medium | **Testable:** No

1. **Update `src/styles/character.css`:**
    
    ```
    .qb-title-container {
        margin-top: -4px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }
    .qb-title-container:hover { opacity: 0.8; }
    .qb-title-text {
        font-size: 0.85em;
        font-weight: 600;
        letter-spacing: 0.02em;
    }
    .qb-title-common { color: var(--text-muted); }
    .qb-title-rare { color: var(--color-blue); text-shadow: 0 0 4px rgba(var(--color-blue-rgb), 0.3); }
    .qb-title-epic { color: var(--color-purple); text-shadow: 0 0 4px rgba(var(--color-purple-rgb), 0.4); }
    .qb-title-legendary {
        background: linear-gradient(90deg, #ffd700, #ffaa00);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0px 2px 4px rgba(255, 215, 0, 0.2);
    }
    ```
    
2. **Update `src/components/CharacterSheet.tsx`:**
    
    - Locate the Character Name rendering block.
        
    - Add a `<div className="qb-title-container" onClick={openTitleModal}>` below the name.
        
    - If `activeTitleId` is null, render `&lt; No Title Equipped &gt;` with `qb-title-common`.
        
    - Otherwise, render the title name with the appropriate rarity class.
        
3. **Create `src/modals/TitleSelectionModal.ts`:**
    
    - Extend Obsidian's `Modal` class.
        
    - **Layout Mockup (ASCII):**
        
        ```
        =======================================
        Select Character Title
        =======================================
        [ ] None
        ---------------------------------------
        [X] The Early Bird           [ RARE ]
            Grants +5% XP for tasks completed
            before 10:00 AM.
        ---------------------------------------
        [ ] Slayer of the Void       [ LEGENDARY ]
            Grants +10% Damage against Boss
            enemies in combat.
        =======================================
        ```

		- On row click, trigger `characterStore.getState().setActiveTitle(id)`.
		    
		- Close the modal dynamically on selection.
		    

## Phase 7: UI Tests & Verification

**Effort:** Low | **Coverage Target:** >80% UI branch coverage

1. **Component Tests (`test/components/CharacterSheet.test.ts`):**
    
    - Render `CharacterSheet` with a mock state where `activeTitleId` is populated.
        
    - Query the DOM for `.qb-title-text` and assert it renders the correct text.
        
    - Assert the correct CSS rarity class (e.g., `.qb-title-legendary`) is applied.
        
2. **Manual End-to-End Walkthrough:**
    
    - (Developer Action): Build the plugin and load into Obsidian test vault.
        
    - (Verify): Unlocked titles default to empty.
        
    - (Verify): Use dev console to force-unlock an achievement. Check if title unlocks.
        
    - (Verify): Open Character Sheet, click title area, select title in modal.
        
    - (Verify): Check UI updates instantly.
        
    - (Verify): Test combat / XP to ensure buffs are triggering without errors.
        

---

## Verification Checklist

- [ ] Obsidian guidelines observed (Modal class used correctly, no `innerHTML`, CSS variables used).
    
- [ ] Safe Zustand migrations handled (defaults applied to existing saves).
    
- [ ] Titles map safely without crashing if an ID is missing or deprecated.
    
- [ ] Mathematical buff calculations do not result in `NaN` or unhandled exceptions.
    
- [ ] All 4 tests in `title.test.ts` pass successfully.
    
- [ ] Companion `Session Log` updated with commit message.