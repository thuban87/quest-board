# Implementation Plan: Party System Phase 3 (Custom NPCs & Habit Loyalty)

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & Schema (Loyalty & NPCs)](https://www.google.com/search?q=%23phase-1-data-models--schema-loyalty--npcs "null")
    
6. [Phase 2: Static Data & Migration Tests](https://www.google.com/search?q=%23phase-2-static-data--migration-tests "null")
    
7. [Phase 3: Loyalty Engine & Services](https://www.google.com/search?q=%23phase-3-loyalty-engine--services "null")
    
8. [Phase 4: Service Integration Tests](https://www.google.com/search?q=%23phase-4-service-integration-tests "null")
    
9. [Phase 5: UI - Habit Sponsorship Selection](https://www.google.com/search?q=%23phase-5-ui---habit-sponsorship-selection "null")
    
10. [Phase 6: UI - Roster Progress Tracking](https://www.google.com/search?q=%23phase-6-ui---roster-progress-tracking "null")
    
11. [Phase 7: UI Tests & Verification](https://www.google.com/search?q=%23phase-7-ui-tests--verification "null")
    
12. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Expand the Party System to support completely custom NPCs (beyond the base 7 classes) and implement the "Habit Former" gameplay loop. Users will be able to designate locked NPCs as "Sponsors" for their custom recurring habits. Completing these habits builds Loyalty, eventually unlocking the NPC as a permanent combat assist.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & Schema (Loyalty & NPCs)|Low|Party Phase 2|N/A|🔲 TODO|
|2|Static Data & Migration Tests|Low|Phase 1|>90% lines|🔲 TODO|
|3|Loyalty Engine & Services|Medium|Phase 1|N/A|🔲 TODO|
|4|Service Integration Tests|Medium|Phase 3|>85% lines/branch|🔲 TODO|
|5|UI - Habit Sponsorship Selection|High|Phase 3|N/A|🔲 TODO|
|6|UI - Roster Progress Tracking|Medium|Phase 5|N/A|🔲 TODO|
|7|UI Tests & Verification|Low|Phase 6|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Player-Defined Habits, System-Defined Rewards:** Instead of hardcoding what a habit must be (e.g., "Read 30 mins"), the system provides the _wrapper_. The player creates a recurring quest and assigns an "NPC Sponsor" to it. This respects the user's agency over their productivity while still gamifying the consistency.
    
2. **The Loyalty Metric:** We will introduce a global `npcLoyalty: Record<string, number>` object to the Character state. Completing a sponsored task increments that specific NPC's loyalty integer by 1.
    
3. **Hub and Spoke Registry:** The `PARTY_MEMBERS` registry from Phase 1 will be extended. New NPCs will have an `isCustomNpc` flag, custom sprite pathing (since they don't have tiers like player classes), and a `canSponsorHabits` boolean to determine if they show up in the sponsorship dropdown.
    
4. **Abstract Lore Readiness:** Because the exact lore isn't written yet, the data structure is built to accept _any_ string for names, descriptions, and custom sprite names. We will use 2-3 placeholder characters (e.g., "The Blacksmith", "The Archivist") to build and test the infrastructure.
    

## Non-Goals

- **No Dialog Trees/Visual Novel Mechanics:** Interaction with the NPCs is limited to task sponsorship and combat assists. We are not building a dialogue engine in this phase.
    
- **No Negative Loyalty:** Missing a habit might break a standard streak, but it won't subtract NPC loyalty (to avoid punishing ADHD players too harshly).
    
- **No NPC Equipment:** Custom NPCs, like base-class allies, are fixed entities that scale their assist math based on the player's level.
    

## File Change Summary

**Modified Files:**

- `src/models/PartyMember.ts` (Add `isCustomNpc`, `canSponsorHabits`, custom sprite types)
    
- `src/models/Character.ts` (Add `npcLoyalty: Record<string, number>`)
    
- `src/models/Quest.ts` (Add `sponsorNpcId?: string`)
    
- `src/data/partyMembers.ts` (Add placeholder custom NPCs)
    
- `src/services/SpriteService.ts` (Handle custom NPC sprite resolution)
    
- `src/store/characterStore.ts` (Add loyalty increment mutator)
    
- `src/services/QuestActionsService.ts` (Inject loyalty increment logic)
    
- `src/services/PartyService.ts` (Evaluate `loyalty` unlock conditions)
    
- `src/modals/RecurringQuestsDashboardModal.ts` (Add Sponsor selection to UI)
    
- `src/components/QuestCard.tsx` (Show sponsor icon/text if applicable)
    
- `src/modals/PartyRosterModal.ts` (Render loyalty progress bars)
    

## Phase 1: Data Models & Schema (Loyalty & NPCs)

**Effort:** Low | **Testable:** No

1. **Update `src/models/PartyMember.ts`:**
    
    - Add `'loyalty'` to `UnlockConditionType`.
        
    - Extend `PartyMemberDefinition`:
        
        ```
        export interface PartyMemberDefinition {
            // ... existing fields
            isCustomNpc?: boolean;
            canSponsorHabits?: boolean;
            customSpriteId?: string; // If true, bypass tier/class logic and look for assets/sprites/npc/{customSpriteId}_south.png
        }
        ```
        
2. **Update `src/models/Character.ts` & `src/models/Quest.ts`:**
    
    - `Character.ts`: Add `npcLoyalty: Record<string, number>;` (Key is NPC ID, value is loyalty points).
        
    - `Quest.ts` / `Template`: Add `sponsorNpcId?: string;`
        
3. **Update `src/data/partyMembers.ts`:**
    
    - Add placeholder lore NPCs.
        
    - _Example:_
        
        ```
        'npc_blacksmith_bran': {
            id: 'npc_blacksmith_bran',
            name: 'Bran the Forgemaster',
            baseClass: 'npc',
            isCustomNpc: true,
            canSponsorHabits: true,
            customSpriteId: 'npc_blacksmith',
            description: 'A gruff artisan who values relentless consistency.',
            unlockCondition: { type: 'loyalty', targetValue: 21 }, // 21 completions to unlock
            assistAbility: { name: 'Armor Patch', type: 'buff', baseValue: 0.2, scaling: 'percentage', description: 'Increases DEF by 20% for 3 turns.' }
        }
        ```
        

## Phase 2: Static Data & Migration Tests

**Effort:** Low | **Coverage Target:** >90% lines

1. **Update `test/store/characterStore.test.ts`:**
    
    - Add a migration test ensuring legacy profiles load with `npcLoyalty: {}` safely initialized.
        
2. **Update `test/models/PartyMember.test.ts`:**
    
    - Assert that any definition with `isCustomNpc: true` has a valid `customSpriteId`.
        
    - Assert that any condition of type `loyalty` targets a definition where `canSponsorHabits === true`.
        

## Phase 3: Loyalty Engine & Services

**Effort:** Medium | **Testable:** No

1. **Update `src/store/characterStore.ts`:**
    
    - Add `incrementNpcLoyalty: (npcId: string, amount: number = 1) => void`.
        
        ```
        // Implementation safely increments the record
        const currentLoyalty = state.character.npcLoyalty[npcId] || 0;
        // update state...
        ```
        
2. **Update `src/services/QuestActionsService.ts`:**
    
    - In `completeQuest(questId)`:
        
        - Check if the completed quest has a `sponsorNpcId`.
            
        - If true, call `characterStore.getState().incrementNpcLoyalty(quest.sponsorNpcId, 1)`.
            
        - Immediately call `PartyService.evaluateUnlocks()` to see if this completion pushed them over the threshold.
            
3. **Update `src/services/PartyService.ts`:**
    
    - In `evaluateUnlocks`:
        
        - Add evaluation logic for `loyalty`:
            
            ```
            if (condition.type === 'loyalty') {
                const currentLoyalty = character.npcLoyalty[member.id] || 0;
                if (currentLoyalty >= condition.targetValue) {
                    // Unlock!
                }
            }
            ```
            
4. **Update `src/services/SpriteService.ts`:**
    
    - Add/Refactor `getNpcSpritePath(memberId: string, direction: string)` to handle `isCustomNpc` definitions cleanly without failing on missing tier folders.
        

## Phase 4: Service Integration Tests

**Effort:** Medium | **Coverage Target:** >85% branch coverage

1. **Create/Update `test/services/PartyService.test.ts`:**
    
    - **Loyalty Progression Test:** Mock a quest completion with `sponsorNpcId: 'npc_blacksmith_bran'`. Assert `npcLoyalty` goes from undefined -> 1.
        
    - **Unlock Threshold Test:** Mock `npcLoyalty['npc_blacksmith_bran'] = 20`. Complete one more sponsored quest. Assert the NPC is added to `unlockedParty`.
        

## Phase 5: UI - Habit Sponsorship Selection

**Effort:** High | **Testable:** No

1. **Update Recurring Quest / Template Modals (`RecurringQuestsDashboardModal.ts` & `ScrivenersQuillModal.ts`):**
    
    - Add a "Sponsorship (Optional)" dropdown section to the form.
        
    - **Options Population:** * Filter `PARTY_MEMBERS` where `canSponsorHabits === true` AND `!character.unlockedParty.includes(id)`. (Once unlocked, they don't need to sponsor habits anymore).
        
        - Add a "None" option.
            
    - When saving the recurring task template, persist the `sponsorNpcId` frontmatter.
        
2. **Update `src/components/QuestCard.tsx`:**
    
    - If `quest.sponsorNpcId` exists, add a small visual indicator to the quest card.
        
    - Example: A small handshake icon `🤝 Bran` in the bottom corner of the card, so the user remembers _why_ they are doing this task.
        

## Phase 6: UI - Roster Progress Tracking

**Effort:** Medium | **Testable:** No

1. **Update `src/modals/PartyRosterModal.ts`:**
    
    - For locked characters that have a `loyalty` unlock condition, reveal them slightly (no longer a complete "???").
        
    - Display a progress bar showing their current loyalty.
        
    - **Layout Mockup (ASCII):**
        
        ```
        [ Silhouette ] Bran the Forgemaster
                       "Prove your consistency to earn my hammer."
                       Loyalty: [||||||||      ] 12/21
        ```
        

## Phase 7: UI Tests & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Manual End-to-End Walkthrough:**
    
    - (Verify) Open Recurring Quests Dashboard. Create a new habit: "Drink Water".
        
    - (Verify) Open the "Sponsor" dropdown. Assert that placeholder NPCs with `canSponsorHabits` appear. Select one.
        
    - (Verify) Create the quest. Look at it on the Kanban board. Ensure the `🤝 Sponsor Name` tag is visible.
        
    - (Verify) Complete the quest.
        
    - (Verify) Open the Party Roster Modal. Find the sponsored NPC and verify their Loyalty bar displays `1/21`.
        
    - (Verify) Use a debug console command to set the loyalty to 20. Generate the quest again and check it off.
        
    - (Verify) Ensure the "Party Member Unlocked" notice fires, and they move from locked to "Equippable Assist" in the Roster Modal.
        

## Verification Checklist

- [ ] No hardcoded NPC logic in components; UI dynamically generates dropdowns from `partyMembers.ts`.
    
- [ ] Legacy saves parse safely without throwing errors on missing `npcLoyalty` objects.
    
- [ ] Obsidian plugin guidelines observed (No DOM manipulation vulnerabilities in the generic lore strings).
    
- [ ] `SpriteService` successfully bifurcates between tiered player-class logic and flat custom NPC asset paths.
    
- [ ] Companion `Session Log` updated with commit message.