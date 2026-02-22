# Implementation Plan: Subclass System

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 1: Data Models & State Schema](https://www.google.com/search?q=%23phase-1-data-models--state-schema "null")
    
6. [Phase 2: Static Data Updates](https://www.google.com/search?q=%23phase-2-static-data-updates "null")
    
7. [Phase 3: Data Integrity Tests](https://www.google.com/search?q=%23phase-3-data-integrity-tests "null")
    
8. [Phase 4: Level Up Intercept & UI](https://www.google.com/search?q=%23phase-4-level-up-intercept--ui "null")
    
9. [Phase 5: Core Service Integrations](https://www.google.com/search?q=%23phase-5-core-service-integrations "null")
    
10. [Phase 6: Service Integration Tests](https://www.google.com/search?q=%23phase-6-service-integration-tests "null")
    
11. [Phase 7: UI Refinements & Verification](https://www.google.com/search?q=%23phase-7-ui-refinements--verification "null")
    
12. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Implement a "Subclass/Specialization" system triggered when a character reaches Level 25. Players choose from a neutral path (retaining the base class mechanics) or two specialized paths, unlocking new tier 4/5 sprites, new combat skills, and overridden gear restrictions.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|1|Data Models & State Schema|Low|None|N/A|🔲 TODO|
|2|Static Data Updates|Medium|Phase 1|N/A|🔲 TODO|
|3|Data Integrity Tests|Low|Phase 2|>90% lines|🔲 TODO|
|4|Level Up Intercept & UI|High|Phase 1|N/A|🔲 TODO|
|5|Core Service Integrations|High|Phase 4|N/A|🔲 TODO|
|6|Service Integration Tests|Medium|Phase 5|>85% lines/branch|🔲 TODO|
|7|UI Refinements & Verification|Low|Phase 5|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Subclass over Dual-Class:** True dual-classing creates combinatorial explosions (e.g., 42 class combinations x 5 tiers x 2 genders = 420 sprites). Subclasses limit the scope to specific, curated fantasies (e.g., Cleric -> Battle Priest) and keep skill loadout constraints (4 skills max) intact.
    
2. **Level 25 Trigger Point:** Level 25 aligns with Tier 4 visually. Sprites for Tier 1-3 will ignore subclasses entirely. At Tier 4 and 5, `SpriteService` will look for subclass-specific assets.
    
3. **The "Neutral" Path:** We will always offer a "Core" or "Neutral" path (e.g., `pure_cleric`) that uses the default Tier 4/5 sprites and unlocks standard advanced skills, for players who just want the classic fantasy.
    
4. **Gear Override Architecture:** Instead of hardcoding "Battle Priest can use Swords", subclasses will define an array of `permittedWeaponTypes` and `permittedArmorTypes` that are merged with the base class permissions in `StatsService.ts` during validation.
    

## Non-Goals

- **No subclass switching:** Once a path is chosen at level 25, it is permanent. (A "respec" item could be a later feature, but is out of scope here).
    
- **No AI generation for subclasses:** Subclass identities, stats, and gear overrides are strictly hand-crafted to maintain game balance.
    
- **No subclass UI bloat:** The Character Sheet will simply append the subclass to the class string (e.g., "Level 25 Cleric (Battle Priest)"), keeping UI modifications minimal.
    

## File Change Summary

**New Files:**

- `src/models/Subclass.ts` (Subclass interfaces and types)
    
- `src/data/subclasses.ts` (Static registry of all base class specializations)
    
- `src/modals/SubclassSelectionModal.ts` (Obsidian Modal for the Level 25 choice)
    
- `src/styles/subclass.css` (Styles for the selection UI)
    

**Modified Files:**

- `src/models/Character.ts` (Add `subclassId: string | null`)
    
- `src/models/Skill.ts` (Add `requiredSubclassId?: string`)
    
- `src/data/skills.ts` (Append new subclass-specific skills)
    
- `src/store/characterStore.ts` (State mutator for setting subclass)
    
- `src/services/SpriteService.ts` (Refactor to inject subclass pathing for Tiers 4/5)
    
- `src/services/SkillService.ts` (Filter available skills by subclass)
    
- `src/components/character/CharacterIdentity.tsx` (Display subclass name)
    
- `src/modals/LevelUpModal.ts` (Intercept Level 25 logic)
    
- `src/utils/gearFormatters.ts` (Update gear usage checks)
    
- `test/services/SpriteService.test.ts` (Add subclass resolution tests)
    

## Phase 1: Data Models & State Schema

**Effort:** Low | **Testable:** No

1. **Create `src/models/Subclass.ts`:**
    
    ```
    export interface SubclassDefinition {
        id: string;                 // e.g., 'battle_priest'
        parentClass: string;        // e.g., 'cleric'
        name: string;               // e.g., 'Battle Priest'
        description: string;
        perkDescription: string;    // E.g., "Can equip Swords. Base ATK +10%."
        bonusStats?: {
            attackMultiplier?: number;
            defenseMultiplier?: number;
            speedMultiplier?: number;
            maxManaBonus?: number;
        };
        overrideGear?: {
            weapons?: string[];     // e.g., ['sword', 'mace']
            armor?: string[];       // e.g., ['heavy']
        };
        isNeutralPath: boolean;     // True for the core class continuation
    }
    ```
    
2. **Update `src/models/Character.ts`:**
    
    - Append `subclassId: string | null;` (Default to `null` for new characters and migrated saves).
        
3. **Update `src/models/Skill.ts`:**
    
    - Add `requiredSubclassId?: string;` to restrict powerful skills to specific specializations.
        

## Phase 2: Static Data Updates

**Effort:** Medium | **Testable:** No

1. **Create `src/data/subclasses.ts`:**
    
    - Define exactly 3 options per class (1 neutral, 2 specialized).
        
    - _Example (Cleric):_
        
        - `pure_cleric` (Neutral, +10% Max Mana)
            
        - `battle_priest` (+10% ATK, Can equip 'sword', 'heavy')
            
        - `shadow_weaver` (+10% Speed, Can equip 'dagger')
            
    - _Example (Warrior):_
        
        - `pure_warrior` (Neutral, +10% HP)
            
        - `berserker` (+15% ATK, -5% DEF, Can equip 'dual_wield')
            
        - `sentinel` (+15% DEF, Can equip 'tower_shield')
            
2. **Update `src/data/skills.ts`:**
    
    - Add at least 1-2 new skills per specialized subclass.
        
    - Ex: `smite` (Requires `battle_priest`), `shadow_mend` (Requires `shadow_weaver`).
        

## Phase 3: Data Integrity Tests

**Effort:** Low | **Coverage Target:** >90% lines

1. **Create `test/models/Subclass.test.ts`:**
    
    - **Integrity Validation:** Iterate through all base classes defined in the game and assert that exactly 3 subclasses exist for each (1 neutral, 2 spec).
        
    - **Skill Linkage Test:** Iterate through `skills.ts`. If a skill has `requiredSubclassId`, verify that ID exists in the subclass registry.
        
    - **Character Store Migration:** Verify that loading a V4 profile initializes `subclassId` as `null` without blowing up state.
        

## Phase 4: Level Up Intercept & UI

**Effort:** High | **Testable:** No

1. **Update `src/modals/LevelUpModal.ts`:**
    
    - In the rendering flow, check: `if (newLevel === 25 && !character.subclassId)`.
        
    - If true, alter the primary button from "Continue" to "Choose Your Path...".
        
    - Clicking this button closes the `LevelUpModal` and spawns `SubclassSelectionModal`.
        
2. **Create `src/modals/SubclassSelectionModal.ts`:**
    
    - Queries `subclasses.ts` for entries matching `character.class`.
        
    - **Layout Mockup (ASCII):**
        
        ```
        =================================================
        Level 25 Reached: A Diverging Path
        =================================================
        Your mastery of the Cleric arts has peaked. 
        Choose your specialization. This choice is permanent.
        
        [ The Core Path: High Cleric ] (Neutral)
          - Retain traditional vestments
          - +10% Maximum Mana
        
        [ Specialization: Battle Priest ]
          - Unlocks Heavy Armor & Swords
          - Base Attack +10%
        
        [ Specialization: Shadow Weaver ]
          - Unlocks Daggers & Speed
          - Base Speed +10%
        
        < CONFIRM CHOICE >
        =================================================
        ```
        
    - Updates `characterStore.getState().setSubclass(selectedId)`.
        

## Phase 5: Core Service Integrations

**Effort:** High | **Testable:** No

1. **Update `src/services/SpriteService.ts`:**
    
    - Refactor `getPlayerSpritePath`.
        
    - If `tier >= 4` and `character.subclassId` is not null/neutral:
        
        ```
        // e.g., assets/sprites/player/cleric/battle_priest/tier4/male_south.png
        return `assets/sprites/player/${baseClass}/${subclassId}/tier${tier}/${gender}_${direction}.png`;
        ```
        
    - Otherwise, use the standard path.
        
2. **Update `src/services/SkillService.ts`:**
    
    - In `getAvailableSkills(character)`:
        
        - Filter out skills where `requiredSubclassId` exists BUT does not match the character's current `subclassId`.
            
3. **Update `src/utils/gearFormatters.ts` & `StatsService.ts` (Gear Permissions):**
    
    - When checking `canEquip(character, item)`:
        
        - First check base class permissions.
            
        - If false, look up the active subclass definition. If `overrideGear.weapons.includes(item.type)`, return true.
            
4. **Update `src/services/CombatService.ts` (Stat Bonuses):**
    
    - When calculating base character stats (ATK, DEF, SPD, MANA), retrieve the subclass definition and multiply by any defined `bonusStats`.
        

## Phase 6: Service Integration Tests

**Effort:** Medium | **Coverage Target:** >85% branch coverage

1. **Update `test/services/SpriteService.test.ts`:**
    
    - Add tests asserting the correct path is returned for Tier 3 (ignores subclass), Tier 4 Neutral (ignores subclass), and Tier 4 Specialized (injects subclass folder).
        
2. **Update `test/services/SkillService.test.ts`:**
    
    - Create a Level 30 Cleric mock with `subclassId: 'battle_priest'`. Assert `smite` is available.
        
    - Change subclass to `shadow_weaver`. Assert `smite` is absent and `shadow_mend` is available.
        
3. **Update `test/services/StatsService.test.ts`:**
    
    - Mock a Battle Priest. Attempt to equip a Sword. Assert `canEquip` returns `true`.
        
    - Attempt to equip a Sword on a Pure Cleric. Assert `canEquip` returns `false`.
        
    - Assert stat multipliers (ATK +10%) are correctly applied to the final calculated combat stats.
        

## Phase 7: UI Refinements & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Update `src/components/character/CharacterIdentity.tsx`:**
    
    - If `subclassId` exists and is not neutral, append it to the subtitle: `Level 26 Cleric - Battle Priest`.
        
2. **Manual End-to-End Walkthrough:**
    
    - (Verify) Create a Level 24 character. Complete a quest to hit Level 25.
        
    - (Verify) Level Up modal correctly prompts for the subclass choice.
        
    - (Verify) Subclass Modal renders the 3 appropriate choices.
        
    - (Verify) Selecting a specialized path immediately updates the Character Sheet text and the active sprite on the screen.
        
    - (Verify) Open Inventory; verify previously red/restricted gear is now equippable if permitted by the subclass.
        
    - (Verify) Open Skills Loadout; verify subclass-specific skills are now available to equip.
        

## Verification Checklist

- [ ] Obsidian guidelines observed (React/DOM safe, no raw HTML injection in subclass descriptions).
    
- [ ] Subclass defaults to `null` safely for all pre-existing V4 saves.
    
- [ ] Sprite paths correctly default to neutral if a tier 4/5 specialized sprite is missing, avoiding hard crash rendering errors.
    
- [ ] Combat balance explicitly checked (e.g., ensuring +10% ATK multipliers do not stack infinitely).
    
- [ ] All >604 tests continue to pass alongside the new ones.
    
- [ ] Companion `Session Log` updated with commit message.