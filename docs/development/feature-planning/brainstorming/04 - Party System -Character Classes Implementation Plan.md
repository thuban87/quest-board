# Implementation Plan: Party System Phase 1 (Roster & Acquisition)

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & Hub Registry](https://www.google.com/search?q=%23phase-1-data-models--hub-registry "null")
    
6. [Phase 2: State Schema & Store Migrations](https://www.google.com/search?q=%23phase-2-state-schema--store-migrations "null")
    
7. [Phase 3: The Unlock Engine (PartyService)](https://www.google.com/search?q=%23phase-3-the-unlock-engine-partyservice "null")
    
8. [Phase 4: Engine Tests](https://www.google.com/search?q=%23phase-4-engine-tests "null")
    
9. [Phase 5: Roster UI & Notifications](https://www.google.com/search?q=%23phase-5-roster-ui--notifications "null")
    
10. [Phase 6: UI Tests & Verification](https://www.google.com/search?q=%23phase-6-ui-tests--verification "null")
    
11. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Lay the foundational "Hub and Spoke" infrastructure for the Party System. Define the 6 "other" character classes as named NPCs, build an extensible unlocking engine to acquire them, and save them to the player's character state. Provide a UI to view the current roster.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & Hub Registry|Low|None|N/A|🔲 TODO|
|2|State Schema & Store Migrations|Low|Phase 1|>90% lines|🔲 TODO|
|3|The Unlock Engine (Service)|High|Phase 2|N/A|🔲 TODO|
|4|Engine Tests|Medium|Phase 3|>85% lines/branch|🔲 TODO|
|5|Roster UI & Notifications|Medium|Phase 3|N/A|🔲 TODO|
|6|UI Tests & Verification|Low|Phase 5|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Hub and Spoke Data Model:** All party members and their acquisition requirements will be statically defined in a single "Hub" file (`src/data/partyMembers.ts`). The UI, Save Store, and Combat Engine (in Phase 2) will all spoke out from this single source of truth. No hardcoded logic in the components.
    
2. **Extensible Unlock Engine:** To make acquiring them flexible (achievements, levels, or quest counts), we will define an `UnlockCondition` type. A new `PartyService` will evaluate these conditions whenever relevant game events happen (e.g., leveling up, checking off a quest).
    
3. **Mutual Exclusion:** A player who is a Paladin cannot unlock the Paladin party member. The `PartyService` will automatically filter out the definition whose `baseClass` matches the player's `characterClass`.
    
4. **State Cohesion:** Party members belong to the specific character playthrough, so they will be saved directly in `Character.ts` as an array of unlocked IDs, rather than creating a separate data file.
    

## Non-Goals

- **No Combat Assist integration yet.** This phase strictly handles acquiring and viewing them. (Phase 2 handles combat).
    
- **No Party Member leveling or gear.** For Phase 1-2, party members scale automatically based on the Player's level/tier, keeping the UI and state management fast and minimal.
    
- **No active/bench swapping yet.** All unlocked members will just be "in the roster" until we implement combat selection.
    

## File Change Summary

**New Files:**

- `src/models/PartyMember.ts` (Interfaces for static definitions and conditions)
    
- `src/data/partyMembers.ts` (The central static registry of all members)
    
- `src/services/PartyService.ts` (The unlock evaluation engine)
    
- `src/modals/PartyRosterModal.ts` (UI to view unlocked friends)
    
- `test/services/PartyService.test.ts`
    

**Modified Files:**

- `src/models/Character.ts` (Add `unlockedParty: string[]`)
    
- `src/store/characterStore.ts` (Add unlock mutators and safety migrations)
    
- `src/services/QuestActionsService.ts` (Trigger `PartyService.evaluateUnlocks` on task completion)
    
- `src/modals/LevelUpModal.ts` (Trigger `PartyService.evaluateUnlocks` on level up)
    
- `src/components/character/ActionMenu.tsx` (Add "View Party" button)
    

## Phase 1: Data Models & Hub Registry

**Effort:** Low | **Testable:** No

1. **Create `src/models/PartyMember.ts`:**
    
    ```
    export type UnlockConditionType = 'level' | 'achievement' | 'quest_count_category';
    
    export interface UnlockCondition {
        type: UnlockConditionType;
        targetId?: string;       // e.g., 'fitness_achieve_1'
        targetCategory?: string; // e.g., 'Wellness'
        targetValue: number;     // e.g., Level 15, or 50 quests
    }
    
    export interface PartyMemberDefinition {
        id: string;               // e.g., 'ally_rogue_lyra'
        name: string;             // e.g., 'Lyra the Swift'
        baseClass: string;        // e.g., 'rogue' (must match CharacterClass types)
        description: string;      // Lore/flavor text
        unlockCondition: UnlockCondition;
        spriteConfig: {
            // We will reuse existing player sprites based on the baseClass!
            // e.g., fetch rogue/tier[playerTier]/[gender]_south.png
            gender: 'male' | 'female';
        };
    }
    ```
    
2. **Create `src/data/partyMembers.ts`:**
    
    - Define the 7 original classes as NPCs.
        
    - _Example:_
        
        ```
        export const PARTY_MEMBERS: Record<string, PartyMemberDefinition> = {
            'ally_paladin_galahad': {
                id: 'ally_paladin_galahad',
                name: 'Sir Galahad',
                baseClass: 'paladin',
                description: 'A steadfast defender drawn to acts of physical endurance.',
                unlockCondition: { type: 'quest_count_category', targetCategory: 'Fitness', targetValue: 30 },
                spriteConfig: { gender: 'male' }
            },
            'ally_rogue_lyra': {
                id: 'ally_rogue_lyra',
                name: 'Lyra',
                baseClass: 'rogue',
                description: 'An opportunist who respects efficiency and speed.',
                unlockCondition: { type: 'level', targetValue: 15 },
                spriteConfig: { gender: 'female' }
            }
            // ... Define the other 5 classes
        };
        ```
        

## Phase 2: State Schema & Store Migrations

**Effort:** Low | **Coverage Target:** >90% lines

1. **Update `src/models/Character.ts`:**
    
    - Append `unlockedParty: string[];` to the `Character` interface.
        
2. **Update `src/store/characterStore.ts`:**
    
    - Add action: `unlockPartyMember: (memberId: string) => void`.
        
    - Add safety migration: When parsing legacy save data, if `unlockedParty` is undefined, default it to `[]`.
        
3. **Write Migration Test (`test/store/characterStore.test.ts`):**
    
    - Load a V4 dummy payload. Assert `unlockedParty` initializes as an empty array safely.
        

## Phase 3: The Unlock Engine (PartyService)

**Effort:** High | **Testable:** No

1. **Create `src/services/PartyService.ts`:**
    
    - This service is responsible for checking if conditions are met to recruit an ally.
        
    - **Method `evaluateUnlocks(character: Character, stats: ProgressStats): void`**:
        
        - Loop through all definitions in `PARTY_MEMBERS`.
            
        - **Filter 1:** If `member.baseClass === character.class`, skip (can't unlock yourself).
            
        - **Filter 2:** If `character.unlockedParty.includes(member.id)`, skip (already unlocked).
            
        - **Evaluate Condition:**
            
            - `level`: check if `character.level >= condition.targetValue`.
                
            - `quest_count_category`: look at `StatsService` or `ProgressStatsService` to see if quests completed in `condition.targetCategory` >= `targetValue`.
                
            - `achievement`: check if `character.unlockedAchievements` includes `condition.targetId`.
                
        - **If met:** Call `characterStore.getState().unlockPartyMember(member.id)`.
            
        - **Trigger UI Notice:** `new Notice(\`Party Member Unlocked: ${member.name} has joined your cause!`)`.
            
2. **Inject the Engine:**
    
    - In `QuestActionsService.ts` (inside `completeQuest`): Call `PartyService.evaluateUnlocks()`.
        
    - In `LevelUpModal.ts` (on level up): Call `PartyService.evaluateUnlocks()`.
        

## Phase 4: Engine Tests

**Effort:** Medium | **Coverage Target:** >85% branch coverage

1. **Create `test/services/PartyService.test.ts`:**
    
    - **Test Mutual Exclusion:** Mock a Paladin character meeting Galahad's unlock requirements. Run engine. Assert Galahad is NOT added to `unlockedParty`.
        
    - **Test Level Unlock:** Mock a Level 14 Warrior. Run engine, assert Lyra (requires lvl 15) is locked. Mock level to 15, run engine, assert Lyra is unlocked.
        
    - **Test Category Unlock:** Mock stats showing 29 Fitness quests. Assert locked. Mock to 30. Run engine. Assert Paladin is unlocked.
        
    - **Test Duplicate Prevention:** Run engine twice on a qualifying character. Assert `unlockedParty` array length stays 1, not 2.
        

## Phase 5: Roster UI & Notifications

**Effort:** Medium | **Testable:** No

1. **Create `src/modals/PartyRosterModal.ts`:**
    
    - Extend Obsidian's standard `Modal`.
        
    - **Layout Mockup (ASCII):**
        
        ```
        =================================================
        The Campfire (Party Roster)
        =================================================
        
        [ Sprite ]  Lyra (Rogue)
                    "An opportunist who respects efficiency..."
                    Status: Ready for combat.
        -------------------------------------------------
        [ Sprite ]  Sir Galahad (Paladin)
                    "A steadfast defender..."
                    Status: Ready for combat.
        -------------------------------------------------
        [ ? ? ? ]   Unknown Ally
                    Hint: Seek strength through physical Fitness.
        =================================================
        ```
        
    - _Sprite Rendering:_ Use `SpriteService.getPlayerSpritePath` passing the ally's `baseClass`, the player's current `tier` (so allies scale visually with the player!), and the ally's `gender`.
        
    - If a member is NOT unlocked, show a silhouette/question mark and a cryptic hint based on their `unlockCondition`.
        
2. **Update `src/components/character/ActionMenu.tsx` (or CharacterSidebar):**
    
    - Add a generic UI button: `🏕️ View Party Roster`.
        
    - Clicking opens the `PartyRosterModal`.
        

## Phase 6: UI Tests & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Manual End-to-End Walkthrough:**
    
    - (Verify) Create a new character (e.g., Technomancer).
        
    - (Verify) Open "View Party Roster". See exactly 6 locked slots with hints. (The 7th slot, Technomancer, should be hidden entirely).
        
    - (Verify) Use a debug command or manually alter `data.json` to push your level to 15. Complete one quest to trigger the `evaluateUnlocks` engine.
        
    - (Verify) Ensure the toast notification "Party Member Unlocked: Lyra" appears.
        
    - (Verify) Open the Roster Modal. Verify Lyra is visible, and her sprite accurately reflects her class and your current tier.
        

## Verification Checklist

- [ ] Central "Hub" registry is purely static and well-typed. No duplicated logic.
    
- [ ] Safe Zustand migrations handled (defaults applied to existing saves).
    
- [ ] `PartyService` evaluates cleanly without performance hits (ensure it doesn't run infinitely in `useEffect` loops, only on discrete trigger events).
    
- [ ] Obsidian plugin guidelines observed (Modal class used, DOM creation secure).
    
- [ ] Companion `Session Log` updated with commit message.