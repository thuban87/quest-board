# Implementation Plan: Party System Phase 4 (3v3 Boss Encounters)

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & Store Schema Refactor](https://www.google.com/search?q=%23phase-1-data-models--store-schema-refactor "null")
    
6. [Phase 2: Ally AI & Combat Calculation Engine](https://www.google.com/search?q=%23phase-2-ally-ai--combat-calculation-engine "null")
    
7. [Phase 3: The Turn Queue System](https://www.google.com/search?q=%23phase-3-the-turn-queue-system "null")
    
8. [Phase 4: Combat Engine Tests](https://www.google.com/search?q=%23phase-4-combat-engine-tests "null")
    
9. [Phase 5: UI - Pre-Battle Party Selection](https://www.google.com/search?q=%23phase-5-ui---pre-battle-party-selection "null")
    
10. [Phase 6: UI - Party Battle View](https://www.google.com/search?q=%23phase-6-ui---party-battle-view "null")
    
11. [Phase 7: UI Tests & Verification](https://www.google.com/search?q=%23phase-7-ui-tests--verification "null")
    
12. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Introduce an advanced 3v3 combat mode specifically for major milestones (Raid Bosses, specific Dungeon Bosses, Storyline Encounters). The player selects up to 2 unlocked allies to form a party. In combat, the player controls their own character, while allies and enemies operate via a lightweight Auto-Battler AI.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & Store Schema Refactor|Medium|Party Phase 3|N/A|🔲 TODO|
|2|Ally AI & Combat Calculation Engine|High|Phase 1|N/A|🔲 TODO|
|3|The Turn Queue System|High|Phase 2|N/A|🔲 TODO|
|4|Combat Engine Tests|High|Phase 3|>85% lines/branch|🔲 TODO|
|5|UI - Pre-Battle Party Selection|Medium|Phase 3|N/A|🔲 TODO|
|6|UI - Party Battle View|High|Phase 5|N/A|🔲 TODO|
|7|UI Tests & Verification|Low|Phase 6|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Auto-Battler Allies:** To maintain the snappy, high-dopamine feel of the app, players will _only_ input commands for their main character. Once the player acts, the turn queue automatically resolves Ally AI and Enemy AI turns in rapid succession with CSS animations and scrolling battle logs.
    
2. **Abstracted Encounter Triggers:** Monsters and Bosses will receive an `encounterType: 'solo' | 'party'` flag. This prevents breaking the existing, fast 1v1 combat used for daily tasks. When a 'party' encounter triggers, the game routes to the new Party Selection flow.
    
3. **Turn Queue Architecture:** The current `BattleService` assumes a strict back-and-forth ping-pong. We will introduce a robust `TurnQueue` where each combatant (Player, Ally 1, Ally 2, Boss, Minion 1, Minion 2) has a speed-derived initiative.
    
4. **Isolated View Component:** Instead of injecting a massive amount of `if (isPartyMode)` ternary operators into `BattleView.tsx`, we will build a dedicated `PartyBattleView.tsx` to handle the complex 3-on-3 grid layout and turn queue visualizer.
    

## Non-Goals

- **No Ally Gear/Inventory Management:** Allies scale dynamically based on the player's level/tier. We are not building 6 separate inventories.
    
- **No Friendly Fire:** AoE abilities will cleanly target either the Player Party or Enemy Party array.
    
- **No Complex Pathing/Grid Combat:** Combat remains static (JRPG style: your team on the left, enemies on the right).
    

## File Change Summary

**New Files:**

- `src/models/Combatant.ts` (Unified interface for players, allies, and enemies in a battle context)
    
- `src/services/PartyBattleService.ts` (Handles turn queues, multi-targeting, and AI execution)
    
- `src/modals/PartyFormationModal.ts` (Pre-boss screen to pick your 2 allies)
    
- `src/components/PartyBattleView.tsx` (3v3 combat interface)
    
- `test/services/PartyBattleService.test.ts`
    

**Modified Files:**

- `src/store/battleStore.ts` (Massive schema upgrade to hold arrays of `Combatant`s and turn order)
    
- `src/models/Monster.ts` (Add `encounterType` and `minions` arrays)
    
- `src/data/partyMembers.ts` (Append basic AI logic scripts to definitions)
    
- `src/styles/combat.css` (Add JRPG-style 3v3 layout grid and staggered attack animations)
    

## Phase 1: Data Models & Store Schema Refactor

**Effort:** Medium | **Testable:** No

1. **Create `src/models/Combatant.ts`:**
    
    ```
    export type CombatantTeam = 'player' | 'enemy';
    
    export interface Combatant {
        instanceId: string;       // Unique UUID for the battle instance
        definitionId: string;     // Ref to player, party member, or monster ID
        name: string;
        team: CombatantTeam;
        isMainPlayer: boolean;
        isDead: boolean;
    
        // Current state
        hp: number;
        maxHp: number;
        mana: number;
        maxMana: number;
    
        // Derived Combat Stats
        attack: number;
        defense: number;
        speed: number;            // Determines turn order
    
        activeBuffs: StatusEffect[];
    }
    ```
    
2. **Update `src/models/Monster.ts`:**
    
    - Add `encounterType?: 'solo' | 'party';` (Default 'solo')
        
    - Add `minions?: string[];` (Array of standard monster IDs that spawn alongside the boss).
        
3. **Update `src/store/battleStore.ts`:**
    
    - Extend state to support Party mechanics without breaking Solo mode:
        
        ```
        battleType: 'solo' | 'party' | null;
        turnQueue: string[]; // Array of Combatant instanceIds ordered by speed
        currentTurnIndex: number;
        playerParty: Combatant[];
        enemyParty: Combatant[];
        ```
        

## Phase 2: Ally AI & Combat Calculation Engine

**Effort:** High | **Testable:** No

1. **Update `src/data/partyMembers.ts`:**
    
    - Add a lightweight `combatAiRole: 'healer' | 'striker' | 'tank' | 'debuffer'` to the definitions.
        
2. **Create `src/services/PartyBattleService.ts` (AI Methods):**
    
    - Build `executeAiTurn(combatantId: string)`:
        
        - **If Enemy:** Target a random non-dead player party member. If Boss, use AoE logic if available.
            
        - **If Ally (Healer):** Check if any player party member is < 40% HP. If so, cast highest heal spell. Else, basic attack lowest HP enemy.
            
        - **If Ally (Striker):** Use highest damage skill on the enemy with the lowest current HP (execute priority).
            
        - **If Ally (Tank/Buffer):** Cast defense buff on party if missing. Else, attack.
            

## Phase 3: The Turn Queue System

**Effort:** High | **Testable:** No

1. **Update `src/services/PartyBattleService.ts` (Queue Methods):**
    
    - **`initializePartyBattle(bossId: string, selectedAllyIds: string[])`**:
        
        - Generate `Combatant` objects for the main player and the 2 selected allies. Scale ally stats to match player level.
            
        - Generate `Combatant` objects for the Boss and any defined `minions`.
            
        - Sort all instances by `speed` descending to build the initial `turnQueue`.
            
    - **`advanceTurn()`**:
        
        - Increment `currentTurnIndex`. If it exceeds queue length, reset to 0 (New Round).
            
        - Check the active `Combatant`.
            
        - **If dead:** skip to next.
            
        - **If AI (Enemy or Ally):** Trigger `executeAiTurn()` async, wait 1000ms (for UX readability), then recursive call `advanceTurn()`.
            
        - **If Main Player:** Pause and wait for user UI input.
            

## Phase 4: Combat Engine Tests

**Effort:** High | **Coverage Target:** >85% branch coverage

1. **Create `test/services/PartyBattleService.test.ts`:**
    
    - **Test Queue Sorting:** Initialize a battle with diverse speeds. Assert `turnQueue` array is perfectly sorted highest to lowest.
        
    - **Test AI Healer Logic:** Mock a state where Main Player is at 10% HP. Trigger Cleric Ally's AI turn. Assert Main Player's HP increases and mana decreases for the Cleric.
        
    - **Test Win/Loss Conditions:** Assert that the battle ends immediately when all `enemyParty` members are dead, or all `playerParty` members are dead.
        

## Phase 5: UI - Pre-Battle Party Selection

**Effort:** Medium | **Testable:** No

1. **Create `src/modals/PartyFormationModal.ts`:**
    
    - When a player triggers an encounter flagged as `party`, intercept it before opening `BattleView`.
        
    - **Layout Mockup (ASCII):**
        
        ```
        =================================================
        RAID ENCOUNTER: THE VOID SPAWN
        =================================================
        A massive threat approaches. Gather your forces.
        
        Your Roster (Select up to 2):
        [x] Sir Galahad (Tank)
        [ ] Lyra the Swift (Striker)
        [x] Bran the Forgemaster (Buffer)
        [ ] <Locked>
        
        Selected: [ Player ] [ Galahad ] [ Bran ]
        
        < ENTER BATTLE >
        =================================================
        ```
        
    - Clicking 'Enter Battle' calls `PartyBattleService.initializePartyBattle` and opens the new view.
        

## Phase 6: UI - Party Battle View

**Effort:** High | **Testable:** No

1. **Update `src/styles/combat.css`:**
    
    - Build the 3v3 Flexbox/Grid architecture.
        
    - `qb-party-arena`: Flex container. Left side `qb-hero-team`, right side `qb-enemy-team`.
        
    - Staggered positioning: Frontline, midline, backline based on index or role.
        
    - Target highlighting: Add a subtle pulsing CSS class to the combatant whose turn it currently is.
        
2. **Create `src/components/PartyBattleView.tsx`:**
    
    - Subscribe to `useBattleStore`.
        
    - **Turn Indicator:** Render a small timeline strip at the top showing the upcoming turn order (using character icons).
        
    - **Left Panel:** Render 3 columns/cards showing HP/Mana bars and sprites for the Player and 2 Allies.
        
    - **Right Panel:** Render Boss and Minions.
        
    - **Action Bar:** Only enabled when `turnQueue[currentTurnIndex]` is the Main Player's ID.
        
    - **Targeting:** When player clicks an Attack/Skill, if there are multiple enemies alive, prompt the player to click a specific enemy sprite to designate the target.
        
    - **Event Log:** Implement a scrolling box in the center or bottom to quickly log the rapid-fire auto-battle actions (e.g., "Galahad strikes Goblin for 45!", "Boss uses Cleave!").
        

## Phase 7: UI Tests & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Manual End-to-End Walkthrough:**
    
    - (Verify) Create a dummy quest linked to a `party` encounter type boss. Check it off.
        
    - (Verify) The `PartyFormationModal` successfully pops up instead of standard combat.
        
    - (Verify) Selecting more than 2 allies is prevented.
        
    - (Verify) Hitting "Enter" opens `PartyBattleView.tsx`.
        
    - (Verify) The turn timeline shows the fastest character (e.g., the Rogue ally or Minion) going first.
        
    - (Verify) Hands-off: Watch the AI take its turn. Ensure text logs correctly and HP bars animate.
        
    - (Verify) When it's the Player's turn, ensure the UI unblocks and allows skill selection and enemy targeting.
        
    - (Verify) Ensure AoE skills hit all 3 enemies and process damage correctly.
        
    - (Verify) Win the battle, ensure standard XP and Loot flow resolves and transitions back to the Kanban board cleanly.
        

## Verification Checklist

- [ ] Logic explicitly segregates `solo` battles from `party` battles to ensure daily task grinding remains instantaneous.
    
- [ ] No `eval()` used in AI logic parsing; rigid switch/case structures used to satisfy Obsidian security rules.
    
- [ ] Animations handle rapid consecutive turns gracefully (e.g., awaiting promises in `advanceTurn` rather than overlapping renders).
    
- [ ] Dead combatants are strictly bypassed in the turn queue to prevent undefined reference crashes.
    
- [ ] Companion `Session Log` updated with commit message.