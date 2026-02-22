# Implementation Plan: Character Gender Selection & Sprites

## Table of Contents

1. [Plan Summary](https://www.google.com/search?q=%23plan-summary "null")
    
2. [Design Decisions](https://www.google.com/search?q=%23design-decisions "null")
    
3. [Non-Goals](https://www.google.com/search?q=%23non-goals "null")
    
4. [File Change Summary](https://www.google.com/search?q=%23file-change-summary "null")
    
5. [Phase 0: Asset Preparation (Non-Code)](https://www.google.com/search?q=%23phase-0-asset-preparation-non-code "null")
    
6. [Phase 1: Data Models & Schema Migration](https://www.google.com/search?q=%23phase-1-data-models--schema-migration "null")
    
7. [Phase 2: Sprite Service & Hooks Refactor](https://www.google.com/search?q=%23phase-2-sprite-service--hooks-refactor "null")
    
8. [Phase 3: Core Logic Tests](https://www.google.com/search?q=%23phase-3-core-logic-tests "null")
    
9. [Phase 4: Character Creation UI](https://www.google.com/search?q=%23phase-4-character-creation-ui "null")
    
10. [Phase 5: UI Tests & Verification](https://www.google.com/search?q=%23phase-5-ui-tests--verification "null")
    
11. [Verification Checklist](https://www.google.com/search?q=%23verification-checklist "null")
    

## Plan Summary

**Objective:** Implement male/female gender selection at character creation, linking the choice to a distinct set of sprites for all 5 tiers of the 7 character classes. Refactor asset paths for clarity and manage backwards compatibility for existing saves.

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|**Phase**|**Description**|**Effort**|**Dependencies**|**Test Coverage Target**|**Status**|
|0|Asset Preparation|High|None|N/A|🔲 TODO|
|1|Data Models & Schema Migration|Low|Phase 0|N/A|🔲 TODO|
|2|Sprite Service & Hooks Refactor|Medium|Phase 1|N/A|🔲 TODO|
|3|Core Logic Tests|Medium|Phase 2|>90% lines|🔲 TODO|
|4|Character Creation UI|Medium|Phase 2|N/A|🔲 TODO|
|5|UI Tests & Verification|Low|Phase 4|Manual + >80% UI|🔲 TODO|

## Design Decisions

1. **Clean Asset Naming Convention:** Current sprite naming is repetitive (e.g., `warrior/tier1/warrior-tier-1_south.png`). We will enforce a standardized nomenclature: `[class]/tier[tier]/[gender]_[direction].png` (e.g., `warrior/tier1/male_south.png`). This massively simplifies the path generation logic in `SpriteService.ts`.
    
2. **Safe Migration Default:** Existing characters (Schema v4) do not have a gender property. Upon load, the Zustand store will detect the missing property and safely default it to `'male'` (as the existing art is predominantly male-coded). This prevents a catastrophic crash on `SpriteService` path resolution.
    
3. **Creation-Only Choice:** To keep scope manageable, gender is chosen _only_ at character creation. We will not add a "Change Appearance" mirror/barber feature in this PR.
    

## Non-Goals

- Custom color palettes or modular layered sprites (armor overlaid on base bodies). Sprites remain pre-rendered whole characters.
    
- Adding non-binary or custom gender tags. The selection strictly determines the visual sprite path (`male` | `female`) to limit the required art assets to ~70 base frames.
    

## File Change Summary

**Modified Files:**

- `src/models/Character.ts` (Add `gender` property)
    
- `src/store/characterStore.ts` (Add `gender` to `createCharacter` payload, handle legacy saves)
    
- `src/services/SpriteService.ts` (Refactor `getPlayerSpritePath` logic)
    
- `src/hooks/useCharacterSprite.ts` (Pass gender from character state to service)
    
- `src/components/CharacterCreationModal.tsx` (Add selection UI)
    
- `scripts/generate-asset-manifest.js` (Run to capture new file names)
    
- `test/store/characterStore.test.ts` (Add migration test)
    

## Phase 0: Asset Preparation (Non-Code)

**Effort:** High | **Testable:** No

_(Developer Task - Art Generation)_

1. **Generate Sprites:** Create male and female variants for all 7 classes across all 5 tiers.
    
2. **Standardize File Names:** Rename all player sprite assets.
    
    - **Old:** `assets/sprites/player/paladin/tier1/paladin-tier-1_south.png`
        
    - **New:** `assets/sprites/player/paladin/tier1/male_south.png` and `assets/sprites/player/paladin/tier1/female_south.png`
        
3. **Generate Manifest:** Run `node scripts/generate-asset-manifest.js` to update `assets/manifest.json`.
    

## Phase 1: Data Models & Schema Migration

**Effort:** Low | **Testable:** No

1. **Update `src/models/Character.ts`:**
    
    ```
    export type CharacterGender = 'male' | 'female';
    
    export interface Character {
        // ... existing properties
        gender: CharacterGender;
    }
    ```
    
2. **Update `src/store/characterStore.ts`:**
    
    - Modify the `createCharacter` action signature:
        
        ```
        createCharacter: (name: string, characterClass: CharacterClass, gender: CharacterGender) => void;
        ```
        
    - **Migration Logic:** Inside the initialization or the `persist` configuration (depending on how persistence is currently structured), ensure that any loaded character lacking the `gender` property receives a safe fallback:
        
        ```
        // Example safety patch on load
        const safeCharacter = {
            ...loadedCharacter,
            gender: loadedCharacter.gender || 'male'
        };
        ```
        

## Phase 2: Sprite Service & Hooks Refactor

**Effort:** Medium | **Testable:** No

1. **Update `src/services/SpriteService.ts`:**
    
    - Modify `getPlayerSpritePath` (or equivalent method) to accept `gender: CharacterGender`.
        
    - Rewrite the string interpolation to match the new Phase 0 naming convention:
        
        ```
        public static getPlayerSpritePath(charClass: string, tier: number, direction: string, gender: CharacterGender): string {
            // Fallback safety
            const safeGender = gender || 'male'; 
            return `assets/sprites/player/${charClass.toLowerCase()}/tier${tier}/${safeGender}_${direction}.png`;
        }
        ```
        
    - Update the animation GIF resolution method in the same way (e.g., `male.gif` / `female.gif`).
        
2. **Update `src/hooks/useCharacterSprite.ts`:**
    
    - Retrieve `character.gender` from the store.
        
    - Pass it into the `SpriteService` calls within the hook.
        

## Phase 3: Core Logic Tests

**Effort:** Medium | **Coverage Target:** >90% lines

1. **Update `test/store/characterStore.test.ts`:**
    
    - **Migration Test:** Mock loading a legacy `data.json` profile representing a Level 12 Warrior missing the `gender` field. Assert that after store initialization, `useCharacterStore.getState().character.gender === 'male'`.
        
    - **Creation Test:** Call `createCharacter('Lyra', 'rogue', 'female')` and assert the state reflects the choices accurately.
        
2. **Update `test/services/SpriteService.test.ts`:**
    
    - Test path resolution for both genders:
        
        - `getPlayerSpritePath('cleric', 2, 'east', 'female')` -> `assets/sprites/player/cleric/tier2/female_east.png`.
            
    - Test error fallback (if an invalid gender is somehow passed, does it gracefully default?).
        

## Phase 4: Character Creation UI

**Effort:** Medium | **Testable:** No

1. **Update `src/components/CharacterCreationModal.tsx`:**
    
    - Introduce a state variable: `const [gender, setGender] = useState<CharacterGender>('male');`
        
    - **Layout Mockup (ASCII):**
        
        ```
        [ Select Class: <Cleric> ]
        
        Appearance:
        [o] Male   [ ] Female
        
        +--------------------------------+
        |                                |
        |      (Female Cleric Sprite)    |
        |        (Idle Animation)        |
        |                                |
        +--------------------------------+
        
        [ Create Character ]
        ```
        
    - Update the live preview box to pass the actively selected `gender` to the sprite rendering component/hook so the user immediately sees the visual change.
        
    - Update the submit button to pass the `gender` to `characterStore.createCharacter()`.
        

## Phase 5: UI Tests & Verification

**Effort:** Low | **Coverage Target:** Manual Verification

1. **Component Walkthrough (Manual):**
    
    - (Verify) Launch the app with an entirely blank profile (first time setup).
        
    - (Verify) Toggle between Male/Female and ensure the preview sprite updates instantaneously.
        
    - (Verify) Create a female character.
        
    - (Verify) Check the `CharacterSheet.tsx` view and ensure the female sprite is rendered.
        
    - (Verify) Enter a battle and walk around a dungeon; ensure all directional sprites correctly load the female variants.
        
2. **Backwards Compatibility Walkthrough (Manual):**
    
    - (Verify) Take an existing test vault that has an active character.
        
    - (Verify) Load the updated plugin.
        
    - (Verify) Ensure the UI does not show broken images, and the character defaults to the male sprite without crashing.
        

## Verification Checklist

- [ ] Obsidian guidelines observed (React components clean, no dangerous DOM injection).
    
- [ ] New asset naming convention fully documented and applied across all 7 classes / 5 tiers.
    
- [ ] Old character saves migrate successfully without generating React rendering errors.
    
- [ ] Asset manifest script detects new files correctly.
    
- [ ] Companion `Session Log` updated with commit message.