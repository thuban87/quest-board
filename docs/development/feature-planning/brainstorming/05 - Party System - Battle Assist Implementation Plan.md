# Implementation Plan: Party System Phase 2 (Combat Assist)

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & Hub Expansion](https://www.google.com/search?q=%23phase-1-data-models--hub-expansion "null")
    
6. [Phase 2: Data & Migration Tests](https://www.google.com/search?q=%23phase-2-data--migration-tests "null")
    
7. [Phase 3: State & Battle Engine](https://www.google.com/search?q=%23phase-3-state--battle-engine "null")
    
8. [Phase 4: Battle Engine Tests](https://www.google.com/search?q=%23phase-4-battle-engine-tests "null")
    
9. [Phase 5: UI - Equipping Assists](https://www.google.com/search?q=%23phase-5-ui---equipping-assists "null")
    
10. [Phase 6: UI - Battle View Integration](https://www.google.com/search?q=%23phase-6-ui---battle-view-integration "null")
    
11. [Phase 7: UI Tests & Verification](https://www.google.com/search?q=%23phase-7-ui-tests--verification "null")
    
12. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Build upon the Phase 1 Roster to allow players to equip one unlocked Party Member as their "Active Assist." Integrate an "Assist" action into the combat system that can be used exactly once per battle, executing a unique, pre-defined signature ability based on the ally.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & Hub Expansion|Low|Party Phase 1|N/A|🔲 TODO|
|2|Data & Migration Tests|Low|Phase 1|>90% lines|🔲 TODO|
|3|State & Battle Engine|High|Phase 1|N/A|🔲 TODO|
|4|Battle Engine Tests|High|Phase 3|>85% lines/branch|🔲 TODO|
|5|UI - Equipping Assists|Medium|Phase 3|N/A|🔲 TODO|
|6|UI - Battle View Integration|Medium|Phase 3|N/A|🔲 TODO|
|7|UI Tests & Verification|Low|Phase 5, 6|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Strict "Once Per Battle" Rule:** To keep normal task-battles quick and prevent the assist from becoming a spammable crutch, the assist ability is limited to exactly 1 use per encounter. This state (`assistUsed`) lives entirely within `battleStore.ts` and resets automatically when a new combat instance initializes.
    
2. **Hub and Spoke Continuation:** The definition of _what_ the assist actually does (e.g., Heal 30 HP, Deal 50 Damage) is appended to the `PartyMemberDefinition` in `src/data/partyMembers.ts`. The `BattleService` dynamically reads this config and applies the effect, avoiding hardcoded logic for specific characters.
    
3. **Equip Mechanic:** A character can only have one active assist at a time. This selection is saved in `Character.ts` as `equippedAssistId`.
    
4. **Visual "Striker" Effect:** When summoned, the UI won't just output text. We will briefly flash the ally's sprite onto the battle screen using CSS animations, maintaining the "dopamine-driven design" principle.
    

## Non-Goals

- **No Assist Health/Mana:** The assist character cannot be attacked or killed in Phase 2. They jump in, do their move, and jump out. (Full 3v3 comes in Phase 4).
    
- **No Assist Skill Trees:** The assist ability is a fixed, signature move that scales purely based on the player's current tier/level.
    
- **No Multi-Assist:** Only one character can be summoned per normal battle.
    

## File Change Summary

**Modified Files:**

- `src/models/PartyMember.ts` (Add `AssistAbility` interface)
    
- `src/data/partyMembers.ts` (Append assist abilities to existing NPC definitions)
    
- `src/models/Character.ts` (Add `equippedAssistId: string | null`)
    
- `src/store/characterStore.ts` (Add `equipAssist` mutator)
    
- `src/store/battleStore.ts` (Add `assistUsed: boolean` state)
    
- `src/services/BattleService.ts` (Implement `executeAssist` logic)
    
- `src/modals/PartyRosterModal.ts` (Add "Equip" button)
    
- `src/components/BattleView.tsx` (Add Assist button and rendering logic)
    
- `src/components/CharacterSheet.tsx` (Display currently equipped assist)
    
- `src/styles/combat.css` (Add animations for the striker flash)
    
- `test/services/BattleService.test.ts` (Add test coverage for assist actions)
    

## Phase 1: Data Models & Hub Expansion

**Effort:** Low | **Testable:** No

1. **Update `src/models/PartyMember.ts`:**
    
    ```
    export type AssistAbilityType = 'damage' | 'heal' | 'buff';
    
    export interface AssistAbility {
        name: string;             // e.g., 'Holy Light'
        description: string;      // e.g., 'Heals the player for 30% of Max HP'
        type: AssistAbilityType;
        baseValue: number;        // Flat value or scaling percentage depending on type
        scaling: 'flat' | 'percentage'; // How baseValue is applied
        buffId?: string;          // Optional: ID from StatusEffect registry if type is 'buff'
    }
    
    export interface PartyMemberDefinition {
        // ... existing Phase 1 properties
        assistAbility: AssistAbility;
    }
    ```
    
2. **Update `src/data/partyMembers.ts`:**
    
    - Append the `assistAbility` to all 7 definitions.
        
    - _Example (Paladin - Galahad):_
        
        ```
        assistAbility: { name: 'Lay on Hands', description: 'Heals you for 30% of your Max HP.', type: 'heal', baseValue: 0.3, scaling: 'percentage' }
        ```
        
    - _Example (Rogue - Lyra):_
        
        ```
        assistAbility: { name: 'Ambush', description: 'Strikes the enemy for 40 base damage.', type: 'damage', baseValue: 40, scaling: 'flat' }
        ```
        

## Phase 2: Data & Migration Tests

**Effort:** Low | **Coverage Target:** >90% lines

1. **Update `test/store/characterStore.test.ts`:**
    
    - Ensure legacy saves missing `equippedAssistId` safely default to `null` on load.
        
2. **Create `test/models/PartyMember.test.ts` (if not exists):**
    
    - Validate that every entry in `PARTY_MEMBERS` has a fully formed `assistAbility`.
        
    - Assert that if an ability is type `buff`, it has a valid `buffId` that resolves in your `StatusEffect` registry.
        

## Phase 3: State & Battle Engine

**Effort:** High | **Testable:** No

1. **Update `src/models/Character.ts` & `src/store/characterStore.ts`:**
    
    - Add `equippedAssistId: string | null` to `Character`.
        
    - Add action `equipAssist: (memberId: string | null) => void`.
        
2. **Update `src/store/battleStore.ts`:**
    
    - Add `assistUsed: boolean` (default `false`).
        
    - Add action `setAssistUsed: (used: boolean) => void`.
        
    - In `initializeBattle()`, ensure `assistUsed` is forced to `false`.
        
3. **Update `src/services/BattleService.ts`:**
    
    - Add method `executeAssist(memberId: string): BattleLogMessage[]`.
        
    - **Logic Flow:**
        
        - Verify `battleStore.assistUsed` is false. If true, return error.
            
        - Look up `memberId` in `PARTY_MEMBERS`.
            
        - Based on `assistAbility.type`:
            
            - `damage`: Calculate damage (apply scaling rules based on player level/tier so the assist doesn't become obsolete at level 40), subtract from `battleStore.enemyHp`.
                
            - `heal`: Calculate HP restored, cap at `maxHp`, update `battleStore.playerHp`.
                
            - `buff`: Apply the associated `StatusEffect` via `StatusEffectService`.
                
        - Dispatch `battleStore.getState().setAssistUsed(true)`.
            
        - Return formatted battle logs (e.g., `"Lyra leaped from the shadows, using Ambush for 45 damage!"`).
            

## Phase 4: Battle Engine Tests

**Effort:** High | **Coverage Target:** >85% branch coverage

1. **Update `test/services/BattleService.test.ts`:**
    
    - **Test 1: One-Use Lockout:** Execute an assist successfully. Attempt to execute it again. Assert the second attempt fails and returns a failure log/error.
        
    - **Test 2: Assist Damage:** Mock a battle. Execute Lyra's 'damage' assist. Assert enemy HP decreases by the expected calculated amount.
        
    - **Test 3: Assist Heal:** Mock a battle where player has 10/100 HP. Execute Galahad's 'heal' assist (30%). Assert player HP becomes 40/100.
        
    - **Test 4: State Reset:** Initialize a battle, use the assist, kill the monster, initialize a _new_ battle. Assert `assistUsed` is reset to `false`.
        

## Phase 5: UI - Equipping Assists

**Effort:** Medium | **Testable:** No

1. **Update `src/modals/PartyRosterModal.ts`:**
    
    - For unlocked members, add an `[ Equip Assist ]` button next to their name.
        
    - If the member is already equipped, style it as `[ Active Assist ]` and disable it (or change to an `[ Unequip ]` toggle).
        
    - Clicking calls `characterStore.getState().equipAssist(id)`.
        
2. **Update `src/components/CharacterSheet.tsx` (or CharacterSidebar):**
    
    - Below the title/stats, add a small display:
        
        `🏕️ Campfire Ally: Lyra the Swift` (or `None` if `null`).
        
    - Clicking it can quickly open the Roster Modal.
        

## Phase 6: UI - Battle View Integration

**Effort:** Medium | **Testable:** No

1. **Update `src/styles/combat.css`:**
    
    - Create an animation for the striker:
        
        ```
        @keyframes striker-flash {
            0% { transform: translateX(-100px); opacity: 0; }
            20% { transform: translateX(20px); opacity: 1; }
            80% { transform: translateX(20px); opacity: 1; }
            100% { transform: translateX(100px); opacity: 0; }
        }
        .qb-striker-summon {
            position: absolute;
            z-index: 50;
            animation: striker-flash 1.5s forwards ease-in-out;
        }
        ```
        
2. **Update `src/components/BattleView.tsx`:**
    
    - Check `character.equippedAssistId` and `battleState.assistUsed`.
        
    - Create a distinct action button (e.g., below skills or alongside items): `⚔️ Call Ally: [Name] (1/1)`.
        
    - Disable the button if `assistUsed === true`.
        
    - **On Click Handler:**
        
        1. Fire a local state `setSummoningAlly(equippedAssistId)` to trigger the CSS animation layer.
            
        2. Wait ~500ms (timeout) for visual sync.
            
        3. Call `BattleService.executeAssist(equippedAssistId)`.
            
        4. Clear the local summoning state.
            
    - **Visual Rendering:** Add a conditional render block that draws an `<img>` of the ally (resolved via `SpriteService` using the player's current tier and the ally's defined gender) applying the `.qb-striker-summon` class.
        

## Phase 7: UI Tests & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Manual End-to-End Walkthrough:**
    
    - (Verify) Open Roster Modal, click "Equip" on Lyra.
        
    - (Verify) Character Sheet updates to show Lyra is the active assist.
        
    - (Verify) Enter a dungeon combat encounter.
        
    - (Verify) See the "Call Ally: Lyra (1/1)" button.
        
    - (Verify) Click the button. Ensure the sprite flashes across the screen.
        
    - (Verify) Read the battle log; ensure Lyra's damage was calculated and applied to the enemy HP bar.
        
    - (Verify) Button immediately becomes disabled/grayed out (0/1).
        
    - (Verify) Win the battle, enter the next room. Verify the button is active (1/1) again for the new monster.
        

## Verification Checklist

- [ ] Obsidian guidelines observed (DOM safe, animations use standard CSS).
    
- [ ] Backward compatibility migrations successfully load `equippedAssistId` as `null` for old saves.
    
- [ ] `battleStore` perfectly isolates the `assistUsed` state so it cannot leak across different combat encounters.
    
- [ ] Ally base stats scale correctly (e.g., they read the player's `character.level` or `tier` to calculate their impact, rather than doing 10 flat damage at Level 40).
    
- [ ] Companion `Session Log` updated with commit message.