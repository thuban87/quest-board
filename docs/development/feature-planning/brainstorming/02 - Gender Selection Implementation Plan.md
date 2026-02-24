# Implementation Plan: Female Sprite System

**Status:** 🔲 TODO  
**Estimated Sessions:** 7–9 (including test phases)  
**Created:** 2026-02-23  
**Last Updated:** 2026-02-23  
**Companion Session Log:** [Gender Selection Session Log](../Gender%20Selection%20Session%20Log.md)

---

## Table of Contents

1. [Overview / Problem Statement](#overview--problem-statement)
2. [Goals and Non-Goals](#goals-and-non-goals)
3. [Key Design Decisions](#key-design-decisions)
4. [Architecture / Data Structures](#architecture--data-structures)
5. [Migration Strategy](#migration-strategy)
6. [Asset Naming Convention](#asset-naming-convention)
7. [Implementation Phases](#implementation-phases)
   - [Phase 0: Asset Preparation (Non-Code)](#phase-0-asset-preparation-non-code)
   - [Phase 1: Data Model & Schema Migration](#phase-1-data-model--schema-migration)
   - [Phase 1.5: Tests — Data Model & Migration](#phase-15-tests--data-model--migration)
   - [Phase 2: SpriteService & Hook Refactor](#phase-2-spriteservice--hook-refactor)
   - [Phase 2.5: Tests — SpriteService](#phase-25-tests--spriteservice)
   - [Phase 3: Sprite Consumer Updates](#phase-3-sprite-consumer-updates)
   - [Phase 3.5: Tests — Consumer Updates (Regression)](#phase-35-tests--consumer-updates-regression)
   - [Phase 4: Character Creation UI](#phase-4-character-creation-ui)
   - [Phase 4.5: Tests — Character Creation UI](#phase-45-tests--character-creation-ui)
   - [Phase 5: Polish & Manifest Script](#phase-5-polish--manifest-script)
8. [Plan Summary](#plan-summary)
9. [File Change Summary](#file-change-summary)
10. [Verification Plan / Checklist](#verification-plan--checklist)
11. [Security & Validation](#security--validation)
12. [Performance Considerations](#performance-considerations)
13. [Rollback Plan](#rollback-plan)
14. [Design Decision Log](#design-decision-log)
15. [Key References](#key-references)

---

## Overview / Problem Statement

The Quest Board plugin currently has 315 player sprite files (7 classes × 5 tiers × 9 files per tier) that depict male-presenting characters. There is no way for a user to select a female character appearance. This plan adds a **gender selection** at character creation that routes sprite resolution to a `male/` or `female/` subfolder, allowing distinct visual representation for each gender across all classes and tiers.

### Background

- The codebase is at **Schema v6** with a chained migration system (`v1→v2→v3→v4→v5→v6`).
- `CharacterAppearance` exists with `skinTone`, `hairStyle`, `hairColor`, `accessory`, `outfitPrimary`, and `outfitSecondary` — but **no gender field**.
- `SpriteService.ts` resolves paths using the pattern `{class}-tier-{n}.gif` / `{class}-tier-{n}_{direction}.png` and is **not gender-aware**.
- There are **two** CharacterCreationModals:
  - `src/modals/CharacterCreationModal.ts` — Obsidian Modal (class-based DOM), used for first-launch.
  - `src/components/CharacterCreationModal.tsx` — React component, used for editing existing characters.
- 9 source files consume sprite functions from `SpriteService.ts`.
- No `SpriteService` tests exist today.

---

## Goals and Non-Goals

### Goals

- Add a `gender` field to `CharacterAppearance` (`'male' | 'female'`).
- Update `SpriteService.ts` to resolve gender-specific sprite paths.
- Add gender selection to both CharacterCreationModals (`.ts` and `.tsx`).
- Migrate existing characters to default to `'male'` (since existing sprites are male-coded).
- Create female sprite assets for all 7 classes × 5 tiers.
- Reorganize asset folders with `male/` and `female/` subfolders.
- Ensure backwards compatibility — existing characters work seamlessly after migration.

### Non-Goals

- **Modular/layered sprites** — Sprites remain pre-rendered whole characters. No armor overlays.
- **Non-binary or custom gender options** — The selection strictly determines the visual sprite path (`male` | `female`). This limits required art assets to a manageable count.
- **"Change appearance" mirror/barber feature** — Gender is chosen only at character creation. Editing is possible through the existing React modal, but we are not building a dedicated gender-change flow.
- **Monster sprite changes** — Only player sprites are affected. Monster sprites are gender-neutral.

> [!NOTE]
> **Future consideration:** If a "Change Appearance" feature is added later, the `updateAppearance` action in `characterStore.ts` already supports partial updates and increments `spriteVersion` for cache invalidation — so gender changes would work automatically.

---

## Key Design Decisions

### 1. Gender Lives in `CharacterAppearance`, Not on `Character` Directly

**Decision:** Add `gender` as a field on the `CharacterAppearance` interface rather than as a top-level `Character` property.

**Why:** Gender determines a _visual_ sprite path, making it an appearance concern. The existing `updateAppearance` action already handles partial updates and bumps `spriteVersion` for cache invalidation. Keeping gender in `CharacterAppearance` means the existing edit flow in `CharacterCreationModal.tsx` picks it up automatically without store changes.

**Tradeoff:** `SpriteService` will need to accept a `gender` parameter extracted from `character.appearance.gender`, creating a slightly longer call chain. But this is preferred over scattering appearance data across multiple interfaces.

### 2. Subfolder-Based Asset Structure (Not Filename-Based)

**Decision:** Use `male/` and `female/` subfolders inside each tier directory rather than encoding gender in the filename.

**Why:**
- Clean separation: 9 files in `male/`, 9 files in `female/`. Easy to add/replace per-gender.
- File names stay the same across genders (`{class}-tier-{n}.gif`, etc.), reducing complexity in `SpriteService`.
- Makes the assets directory browsable — you can visually inspect all female Warrior sprites by opening `warrior/tier1/female/`.

**Alternative rejected:** A filename prefix approach (`male_{class}-tier-{n}.gif`) was considered but rejected because it requires filename manipulation rather than simple path construction, and makes the asset folders harder to navigate (male and female files interleaved).

### 3. Forward-Compatible Default: `'male'`

**Decision:** Existing characters missing the `gender` field get `gender: 'male'` as the migration default.

**Why:** Every existing sprite asset is male-coded. Defaulting to `'male'` ensures zero visual breakage for existing players. This is consistent with how previous migrations have handled new fields (e.g., `shieldUsedThisWeek` → `totalShieldsUsedThisWeek`).

### 4. Creation-Only Choice

**Decision:** Gender is selected at character creation. We do not add a separate "change gender" modal.

**Why:** Scope control. The existing `CharacterCreationModal.tsx` already supports `isEdit` mode and calls `updateAppearance`, so users _can_ change gender by editing their character, but we don't need a dedicated feature for it.

### 5. `SpriteService` Functions Get a `gender` Parameter with Fallback

**Decision:** All player sprite functions (`getPlayerGifPath`, `getPlayerSpritePath`, `getPlayerBattleSprite`, `getClassPreviewSprite`) gain an optional `gender` parameter defaulting to `'male'`.

**Why:** Making it optional with a default preserves backwards compatibility. Files that haven't been updated yet will still work. The fallback `'male'` matches the migration default.

---

## Architecture / Data Structures

### Updated `CharacterAppearance` Interface

```typescript
// src/models/Character.ts

export type CharacterGender = 'male' | 'female';

export interface CharacterAppearance {
    gender: CharacterGender;  // NEW — determines sprite subfolder
    skinTone: 'light' | 'medium' | 'tan' | 'dark';
    hairStyle: 'short' | 'medium' | 'long' | 'bald';
    hairColor: 'brown' | 'black' | 'blonde' | 'red';
    accessory: 'none' | 'glasses' | 'hat' | 'headphones';
    outfitPrimary: string;
    outfitSecondary: string;
}

export const DEFAULT_APPEARANCE: CharacterAppearance = {
    gender: 'male',  // NEW
    skinTone: 'light',
    hairStyle: 'short',
    hairColor: 'brown',
    accessory: 'none',
    outfitPrimary: '#6f42c1',
    outfitSecondary: '#ffc107',
};
```

### Updated SpriteService Path Resolution

```
// Before (current):
assets/sprites/player/{class}/tier{n}/{class}-tier-{n}.gif
assets/sprites/player/{class}/tier{n}/{class}-tier-{n}_{direction}.png

// After (new):
assets/sprites/player/{class}/tier{n}/{gender}/{class}-tier-{n}.gif
assets/sprites/player/{class}/tier{n}/{gender}/{class}-tier-{n}_{direction}.png
```

### Sprite Consumer Flow Diagram

```
Character.appearance.gender
       │
       ▼
┌──────────────────────┐
│ useCharacterSprite() │ ◄── SidebarQuests.tsx, CharacterPage.tsx
│  (React hook)        │
└──────┬───────────────┘
       │ Extracts gender from character
       ▼
┌──────────────────────┐
│ SpriteService.*()    │ ◄── BattleItemView.tsx, DungeonView.tsx,
│  getPlayerGifPath    │     BountyModal.ts, EliteEncounterModal.ts,
│  getPlayerSpritePath │     CharacterCreationModal.ts
│  getPlayerBattleSprite│
│  getClassPreviewSprite│
└──────┬───────────────┘
       │ Inserts /{gender}/ into path
       ▼
  assets/sprites/player/{class}/tier{n}/{gender}/{filename}
```

---

## Migration Strategy

### Schema Version Bump: v6 → v7

Add a new migration function `migrateCharacterV6toV7` to the existing chained migration system in `src/models/Character.ts`.

```typescript
export function migrateCharacterV6toV7(oldData: Record<string, unknown>): Character {
    // Already v7 or higher? Return as-is
    if ((oldData.schemaVersion as number) >= 7) {
        return oldData as unknown as Character;
    }

    // Add gender to appearance
    const appearance = (oldData.appearance as Record<string, unknown>) || {};
    if (!appearance.gender) {
        appearance.gender = 'male';
    }

    const migrated = {
        ...oldData,
        schemaVersion: 7,
        appearance,
    } as Record<string, unknown>;

    return migrated as unknown as Character;
}
```

**Chain update:** `migrateCharacterV5toV6` will chain to `migrateCharacterV6toV7` instead of returning.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Existing character, no `gender` field | Migration adds `gender: 'male'` |
| Existing character, has `appearance` but no `gender` | Migration adds `gender: 'male'` to appearance |
| Existing character, has no `appearance` at all | `validateCharacter` in `validator.ts` creates full default appearance (now includes `gender: 'male'`) |
| New character created after update | `CharacterCreationModal` provides gender selection; falls back to `'male'` |
| Invalid gender value | `SpriteService` fallback: `gender \|\| 'male'` |

### Reversibility

The migration is **forward-compatible but not destructive**. Rolling back to a pre-v7 version would simply ignore the `gender` field in `appearance`. The old `SpriteService` wouldn't look for it, and the old code would use the default (genderless) sprite paths. No data loss occurs in either direction.

---

## Asset Naming Convention

### Current Structure (315 files)

```
assets/sprites/player/
├── warrior/
│   ├── tier1/
│   │   ├── warrior-tier-1.gif
│   │   ├── warrior-tier-1_south.png
│   │   ├── warrior-tier-1_north.png
│   │   └── ... (9 files per tier)
│   ├── tier2/
│   └── ... (5 tiers)
├── paladin/
└── ... (7 classes)
```

### New Structure (630 files — existing 315 move to `male/`, 315 new in `female/`)

```
assets/sprites/player/
├── warrior/
│   ├── tier1/
│   │   ├── male/
│   │   │   ├── warrior-tier-1.gif
│   │   │   ├── warrior-tier-1_south.png
│   │   │   └── ... (9 files)
│   │   └── female/
│   │       ├── warrior-tier-1.gif
│   │       ├── warrior-tier-1_south.png
│   │       └── ... (9 files)
│   ├── tier2/
│   │   ├── male/
│   │   └── female/
│   └── ... (5 tiers)
├── paladin/
└── ... (7 classes)
```

> [!IMPORTANT]
> **File naming stays the same** — only the folder hierarchy changes. This means `SpriteService` only needs to insert `/{gender}/` into the existing path template.

### Asset Count Summary

| Type | Count |
|------|-------|
| Existing male sprites (to be moved) | 315 |
| New female sprites (to be created) | 315 |
| **Total after migration** | **630** |

---

## Implementation Phases

### Phase 0: Asset Preparation (Non-Code)

**Effort:** High (art generation, manual work)  
**Estimated Time:** 4–8 hours (dependent on AI sprite generation tooling)  
**Goal:** Create all female sprite assets and reorganize the folder structure.  
**Prerequisite:** None  
**Testable:** No — this is a documentation/non-code phase exempt from the 50/50 rule.

#### Tasks

1. **Create female sprites** for all 7 classes × 5 tiers × 9 files per tier (315 total files).
   - Use the existing sprite generation prompts in `docs/development/sprite-prompts.md` and `docs/development/Sprite Generation Prompts.md` as reference.
   - Match dimensions, palette style, and animation frame count of existing male sprites.

2. **Reorganize asset folders:**
   - For each class/tier directory, create `male/` and `female/` subdirectories.
   - Move all existing files into the corresponding `male/` subfolder.
   - Place all new female files into the `female/` subfolder.
   
   Example PowerShell script concept (Brad to execute):
   ```powershell
   $classes = @('warrior','paladin','technomancer','scholar','rogue','cleric','bard')
   foreach ($class in $classes) {
       for ($tier = 1; $tier -le 5; $tier++) {
           $dir = "assets/sprites/player/$class/tier$tier"
           New-Item -Path "$dir/male" -ItemType Directory -Force
           New-Item -Path "$dir/female" -ItemType Directory -Force
           Move-Item -Path "$dir/*-tier-*" -Destination "$dir/male/" -Force
       }
   }
   ```

3. **Update the asset manifest** once `SpriteService` changes are in place:
   ```powershell
   node scripts/generate-asset-manifest.js
   ```

#### Tech Debt

- None. This phase is foundational.

---

### Phase 1: Data Model & Schema Migration

**Effort:** Medium  
**Estimated Time:** 1–1.5 hours  
**Goal:** Add the `gender` field to `CharacterAppearance`, bump schema to v7, update the migration chain, and update the validator.  
**Prerequisite:** Phase 0 (assets in place). However, the code changes can be started before Phase 0 is complete.

#### Tasks

1. **`src/models/Character.ts`:**
   - Add `CharacterGender` type: `export type CharacterGender = 'male' | 'female';`
   - Add `gender: CharacterGender` to `CharacterAppearance` interface.
   - Update `DEFAULT_APPEARANCE` to include `gender: 'male'`.
   - Bump `CHARACTER_SCHEMA_VERSION` from `6` to `7`.
   - Add `migrateCharacterV6toV7` function that adds `gender: 'male'` to appearance.
   - Update `migrateCharacterV5toV6` to chain to `migrateCharacterV6toV7` instead of returning.

2. **`src/store/characterStore.ts`:**
   - Update `createCharacter` action to include `gender` from the `appearance` parameter:
     ```typescript
     appearance: {
         gender: appearance.gender || 'male',  // NEW
         skinTone: appearance.skinTone || 'light',
         // ... rest unchanged
     },
     ```

3. **`src/utils/validator.ts`:**
   - Update `validateCharacter` to include `gender: 'male'` in the default appearance fallback object.

4. **`src/models/Character.ts` (the standalone `createCharacter` function):**
   - Update the appearance spread to include `gender`:
     ```typescript
     appearance: {
         ...DEFAULT_APPEARANCE,
         outfitPrimary: classInfo.primaryColor,
         ...appearance,
     },
     ```
   - This already works as-is because `DEFAULT_APPEARANCE` now includes `gender: 'male'` and the spread `...appearance` will override if provided. **No code change needed** — just verify.

#### Tech Debt

- The `v2→v3` migration function has a minor bug at line 800: `if ((oldData.schemaVersion as number) >= 4)` returns `as Character` without chaining to v4/v5/v6/v7 migrations. This is pre-existing tech debt. Adding `v6→v7` to the end of the chain means it will be hit via the `v5→v6→v7` path. No action needed for this phase, but worth noting.

---

### Phase 1.5: Tests — Data Model & Migration

**Effort:** Medium  
**Estimated Time:** 1–1.5 hours  
**Goal:** Test the schema migration and character creation with gender.  
**Prerequisite:** Phase 1 must be complete.  
**Coverage Target:** ≥80% line coverage, ≥80% branch coverage.  
**Test File:** `test/gender-migration.test.ts`

#### Key Test Cases

- **Migration: v6 character without gender** → migrated to v7, `appearance.gender === 'male'`
- **Migration: v6 character without appearance** → migrated with full default appearance including `gender: 'male'`
- **Migration: v7 character (already current)** → returned as-is, no double-migration
- **Migration: v5 character** → chains through v5→v6→v7, gains `gender: 'male'`
- **createCharacter with gender: 'female'** → `character.appearance.gender === 'female'`
- **createCharacter with no appearance** → `character.appearance.gender === 'male'` (default)
- **createCharacter with partial appearance** → gender defaults correctly, other fields preserved
- **Validator: missing appearance** → creates default with `gender: 'male'`

#### Command to Run

```powershell
npx vitest run test/gender-migration.test.ts | Out-File -FilePath test-output.txt -Encoding utf8
```

#### Tech Debt

- None expected.

---

### Phase 2: SpriteService & Hook Refactor

**Effort:** Medium  
**Estimated Time:** 1.5–2 hours  
**Goal:** Update all player sprite functions to accept a `gender` parameter and construct gender-aware paths.  
**Prerequisite:** Phase 1 must be complete.

#### Tasks

1. **`src/services/SpriteService.ts`:**

   - Import `CharacterGender` from `'../models/Character'`.
   
   - Update `getPlayerGifPath`:
     ```typescript
     export function getPlayerGifPath(
         assetFolder: string,
         adapter: DataAdapter,
         className: string,
         tier: number,
         gender: CharacterGender = 'male'  // NEW
     ): string {
         const basePath = getBasePath(assetFolder);
         const classLower = className.toLowerCase();
         const safeGender = gender || 'male';
         const filePath = `${basePath}/player/${classLower}/tier${tier}/${safeGender}/${classLower}-tier-${tier}.gif`;
         return adapter.getResourcePath(filePath);
     }
     ```
   
   - Update `getPlayerSpritePath` similarly (add `gender` parameter before `direction`).
   
   - Update `getPlayerBattleSprite` to pass `gender` through.
   
   - Update `getClassPreviewSprite` to accept and pass `gender`.
   
   - Update the JSDoc path convention comment at the top of the file.

2. **`src/hooks/useCharacterSprite.ts`:**

   - Extract `gender` from `character.appearance.gender` (with `'male'` fallback for safety).
   - Pass `gender` to both `getPlayerGifPath` and `getPlayerSpritePath` calls.
   - Add `character?.appearance?.gender` to the `useMemo` dependency array.

#### Tech Debt

- The `gender || 'male'` fallback in `SpriteService` is defensive against corrupted data. This is intentional.

---

### Phase 2.5: Tests — SpriteService

**Effort:** Medium  
**Estimated Time:** 1.5 hours  
**Goal:** Create the first-ever SpriteService test file. Test gender-aware path resolution and fallback behavior.  
**Prerequisite:** Phase 2 must be complete.  
**Coverage Target:** ≥80% line coverage, ≥80% branch coverage.  
**Test File:** `test/services/SpriteService.test.ts`

#### Key Test Cases

- **getPlayerGifPath (male):** returns path with `/male/` subfolder
- **getPlayerGifPath (female):** returns path with `/female/` subfolder
- **getPlayerGifPath (no gender param):** defaults to `/male/`
- **getPlayerSpritePath (female, specific direction):** correct path with direction and gender
- **getPlayerBattleSprite (female):** delegates correctly
- **getClassPreviewSprite (female):** uses tier 4 with gender
- **Fallback on undefined gender:** returns `/male/` path
- **Monster sprite functions:** unaffected (no gender parameter)

#### Mock Strategy

Mock `DataAdapter.getResourcePath` to return the path unchanged (as the real implementation does in many contexts), allowing assertion on the constructed path string.

#### Command to Run

```powershell
npx vitest run test/services/SpriteService.test.ts | Out-File -FilePath test-output.txt -Encoding utf8
```

#### Tech Debt

- None expected.

---

### Phase 3: Sprite Consumer Updates

**Effort:** Medium  
**Estimated Time:** 1.5–2 hours  
**Goal:** Update all files that call `SpriteService` player functions to pass the `gender` parameter.  
**Prerequisite:** Phase 2 must be complete.

#### Files to Update

Each file must extract `gender` from the character's appearance and pass it to the sprite function:

1. **`src/views/BattleItemView.tsx`:**
   - Currently calls `getPlayerBattleSprite(assetFolder, adapter, className, tier)`.
   - Add `gender` parameter: `getPlayerBattleSprite(assetFolder, adapter, className, tier, character.appearance?.gender)`.

2. **`src/components/DungeonView.tsx`:**
   - Calls `getPlayerGifPath` and `getPlayerSpritePath` for dungeon exploration.
   - Pass `character.appearance?.gender` to both.

3. **`src/components/SidebarQuests.tsx`:**
   - Uses `useCharacterSprite` hook — **no changes needed** (hook handles gender internally after Phase 2).

4. **`src/components/CharacterPage.tsx`:**
   - Uses `useCharacterSprite` hook OR direct `SpriteService` calls.
   - If using hook: no changes needed.
   - If direct: add gender parameter.

5. **`src/modals/BountyModal.ts`:**
   - Calls `getPlayerGifPath` or `getPlayerBattleSprite` for player sprite display.
   - Pass character's gender.

6. **`src/modals/EliteEncounterModal.ts`:**
   - Same pattern as BountyModal — add gender parameter.

7. **`src/modals/CharacterCreationModal.ts`:**
   - Calls `getClassPreviewSprite` for class preview.
   - This is the first-launch modal — no character exists yet. Use the currently selected gender toggle state (default: `'male'`).

> [!TIP]
> Files using the `useCharacterSprite` hook (`SidebarQuests.tsx`, potentially `CharacterPage.tsx`) require **zero changes** after Phase 2, since the hook internally reads `character.appearance.gender`. This limits the true blast radius.

#### Detailed Approach

For each file, the pattern is:
1. Find the `getPlayer*` call.
2. Extract gender from the character object available in that scope.
3. Add it as the new parameter.

The `SpriteService` functions have `gender` as a trailing optional parameter defaulting to `'male'`, so any missed call site will still compile and work (just always showing male sprites).

#### Tech Debt

- Some of these files may have the character available through different paths (props, store selectors, function args). The exact extraction will be determined during implementation.

---

### Phase 3.5: Tests — Consumer Updates (Regression)

**Effort:** Small  
**Estimated Time:** 0.5–1 hour  
**Goal:** Run the full existing test suite to ensure no regressions. No new test file needed — this is a regression check.  
**Prerequisite:** Phase 3 must be complete.

#### Tasks

1. Run the full test suite:
   ```powershell
   npx vitest run | Out-File -FilePath test-output.txt -Encoding utf8
   ```

2. Fix any failures caused by the updated function signatures (e.g., mock mismatches in existing tests that call `getPlayerBattleSprite` or `getPlayerGifPath`).

3. Run `npm run build` to verify TypeScript compilation with no errors.

#### Tech Debt

- If existing tests mock `SpriteService` functions, their mock signatures may need to accept the new `gender` parameter.

---

### Phase 4: Character Creation UI

**Effort:** Medium  
**Estimated Time:** 1.5–2 hours  
**Goal:** Add gender selection UI to both CharacterCreationModals.  
**Prerequisite:** Phase 2 must be complete (SpriteService can resolve gender-aware paths).

#### Tasks

1. **`src/modals/CharacterCreationModal.ts`** (Obsidian Modal, first-launch):
   - Add a `selectedGender: CharacterGender` private field (default: `'male'`).
   - Add a gender toggle (radio buttons or segmented control) in the `onOpen` method.
   - Use Obsidian DOM API (`createEl`, `createDiv`) — **no innerHTML** per Obsidian plugin guidelines.
   - Wire the toggle to update `this.selectedGender` and re-render the class preview sprite.
   - Update `getClassGifPath` to pass `this.selectedGender` to `getClassPreviewSprite`.
   - Update the `createCharacter()` call to pass `{ gender: this.selectedGender }` in the appearance object.
   - **UI text:** Use sentence case per Obsidian guidelines ("Appearance" not "APPEARANCE").
   - **Touch targets:** Ensure radio buttons are at least 44×44px for mobile compatibility.

   **Layout Mockup:**
   ```
   ⚔️ Create Your Character
   
   Character Name: [_________________]
   
   Choose Your Class
   ┌──────┐ ┌──────┐ ┌──────┐ ...
   │ ⚔️   │ │ 🛡️   │ │ 💻   │
   │Warrior│ │Paladin│ │Techno │
   └──────┘ └──────┘ └──────┘
   
   Appearance
   (●) Male   ( ) Female        <-- NEW
   
   ┌─────────────────────────┐
   │                         │
   │   (Selected Class GIF)  │   <-- Updates on gender toggle
   │                         │
   └─────────────────────────┘
   
   [← Back]           [✨ Create Character]
   ```

2. **`src/components/CharacterCreationModal.tsx`** (React, editing):
   - Already has appearance customization rows (Skin Tone, Hair Style, etc.).
   - Add a `GENDERS` constant: `const GENDERS: CharacterAppearance['gender'][] = ['male', 'female'];`
   - Add a new appearance row for gender selection, following the exact pattern of the existing Skin Tone row.
   - This appears **before** Skin Tone since gender is the most visually impactful choice.
   - Wire it through the existing `handleAppearanceChange('gender', value)` — no new handler needed.
   - The existing submit handler already calls `updateAppearance(appearance)` in edit mode and `createCharacter(name, selectedClass, appearance)` in create mode, so gender is automatically persisted.

3. **CSS updates** (if needed):
   - Any new CSS classes must be prefixed with `quest-board-` or the existing project prefix `qb-`.
   - Use CSS variables for colors (`--text-normal`, `--interactive-accent`, etc.) per Obsidian guidelines.
   - Edit the appropriate CSS module file (likely `src/styles/modals.css`).

#### Tech Debt

- The `.ts` modal stores its create button reference as `(contentEl as any)._createBtn` (line 142). This is pre-existing tech debt. We won't make it worse.

---

### Phase 4.5: Tests — Character Creation UI

**Effort:** Small–Medium  
**Estimated Time:** 1–1.5 hours  
**Goal:** Test the gender selection UI behavior.  
**Prerequisite:** Phase 4 must be complete.  
**Coverage Target:** ≥80% line coverage, ≥80% branch coverage.  
**Test File:** `test/gender-ui.test.ts`

#### Key Test Cases

**React Component (`CharacterCreationModal.tsx`):**
- **Default state:** gender defaults to `'male'` for new character creation
- **Gender toggle:** selecting 'female' updates form state
- **Submit with female:** `createCharacter` called with `appearance.gender === 'female'`
- **Edit mode:** gender loads from existing character's appearance
- **Edit mode save:** `updateAppearance` called with updated gender

**Obsidian Modal (`CharacterCreationModal.ts`):**
- This is harder to unit test due to Obsidian Modal dependencies. Manual verification is more appropriate.
- Document this as a manual test in the Verification Checklist rather than an automated test.

> [!NOTE]
> The Obsidian Modal is DOM-based and tightly coupled to the Obsidian `Modal` class. Testing it requires mocking `App`, `Modal.open()`, and the DOM. This is feasible but low-ROI. Manual verification is preferred per the verification checklist.

#### Command to Run

```powershell
npx vitest run test/gender-ui.test.ts | Out-File -FilePath test-output.txt -Encoding utf8
```

#### Tech Debt

- None expected.

---

### Phase 5: Polish & Manifest Script

**Effort:** Small  
**Estimated Time:** 0.5–1 hour  
**Goal:** Regenerate asset manifest and handle any remaining loose ends.  
**Prerequisite:** Phase 0 (assets) and Phase 3 (code) must be complete.  
**Testable:** Partially — CSS-only polish changes are exempt from testing. The manifest script run is a manual verification.

#### Tasks

1. **Run the asset manifest generation script:**
   ```powershell
   node scripts/generate-asset-manifest.js
   ```
   Verify the output includes all `male/` and `female/` sprite paths.

2. **Review all CSS changes** for Obsidian guideline compliance:
   - No inline styles
   - All classes prefixed with `qb-`
   - CSS variables used for colors
   - No `!important`
   - Touch targets ≥ 44×44px for mobile

3. **Final build and deploy:**
   ```powershell
   npm run build
   npm run deploy:test
   ```

4. **Manual testing** per the Verification Checklist.

#### Tech Debt

- None expected.

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 0 | Asset Preparation (Non-Code) | High | — | 4–8h |
| 1 | Data Model & Schema Migration | Medium | Phase 0* | 1–1.5h |
| 1.5 | Tests: Data Model & Migration | Medium | Phase 1 | 1–1.5h |
| 2 | SpriteService & Hook Refactor | Medium | Phase 1 | 1.5–2h |
| 2.5 | Tests: SpriteService | Medium | Phase 2 | 1.5h |
| 3 | Sprite Consumer Updates | Medium | Phase 2 | 1.5–2h |
| 3.5 | Tests: Consumer Regression | Small | Phase 3 | 0.5–1h |
| 4 | Character Creation UI | Medium | Phase 2 | 1.5–2h |
| 4.5 | Tests: Character Creation UI | Small–Med | Phase 4 | 1–1.5h |
| 5 | Polish & Manifest Script | Small | Phase 0–4 | 0.5–1h |

*Phase 1 code can run in parallel with Phase 0 work — the code just won't have sprites to resolve until Phase 0 is done.

**Total Estimated Time:** 14–22 hours across 7–9 sessions

**Execution Order:** Phases 1–4 are strictly sequential. Phase 0 is independent and can proceed in parallel while code is written. Phase 5 requires all other phases.

---

## File Change Summary

| Phase | File | Action | Purpose |
|-------|------|--------|---------|
| 0 | `assets/sprites/player/*/tier*/male/` | [NEW] | Male sprite subfolders (existing files moved in) |
| 0 | `assets/sprites/player/*/tier*/female/` | [NEW] | Female sprite subfolders with new assets |
| 1 | `src/models/Character.ts` | [MODIFY] | Add `CharacterGender` type, `gender` to `CharacterAppearance`, bump schema to v7, add migration function |
| 1 | `src/store/characterStore.ts` | [MODIFY] | Add `gender` to `createCharacter` appearance defaults |
| 1 | `src/utils/validator.ts` | [MODIFY] | Add `gender: 'male'` to default appearance fallback |
| 1.5 | `test/gender-migration.test.ts` | [NEW] | Migration and character creation tests |
| 2 | `src/services/SpriteService.ts` | [MODIFY] | Add `gender` parameter to all player sprite functions |
| 2 | `src/hooks/useCharacterSprite.ts` | [MODIFY] | Extract gender from character, pass to SpriteService |
| 2.5 | `test/services/SpriteService.test.ts` | [NEW] | First-ever SpriteService tests |
| 3 | `src/views/BattleItemView.tsx` | [MODIFY] | Pass gender to `getPlayerBattleSprite` |
| 3 | `src/components/DungeonView.tsx` | [MODIFY] | Pass gender to player sprite calls |
| 3 | `src/components/CharacterPage.tsx` | [MODIFY] | Pass gender if using direct sprite calls |
| 3 | `src/modals/BountyModal.ts` | [MODIFY] | Pass gender to sprite calls |
| 3 | `src/modals/EliteEncounterModal.ts` | [MODIFY] | Pass gender to sprite calls |
| 4 | `src/modals/CharacterCreationModal.ts` | [MODIFY] | Add gender toggle, pass to `createCharacter` |
| 4 | `src/components/CharacterCreationModal.tsx` | [MODIFY] | Add gender row to appearance section |
| 4 | `src/styles/modals.css` | [MODIFY] | Gender toggle styling (if needed) |
| 4.5 | `test/gender-ui.test.ts` | [NEW] | React CharacterCreationModal gender tests |
| 5 | `assets/manifest.json` | [MODIFY] | Regenerated via manifest script |

---

## Verification Plan / Checklist

### Automated Tests

| Test | Command | Expected | Status |
|------|---------|----------|--------|
| Migration tests | `npx vitest run test/gender-migration.test.ts` | All pass, ≥80% coverage | |
| SpriteService tests | `npx vitest run test/services/SpriteService.test.ts` | All pass, ≥80% coverage | |
| UI tests | `npx vitest run test/gender-ui.test.ts` | All pass, ≥80% coverage | |
| Full regression | `npx vitest run` | All existing 168+ tests still pass | |
| Build | `npm run build` | Clean, zero errors | |

### Manual Verification

| Test | Expected | Status |
|------|----------|--------|
| **New Character (Male):** Create new character with male selected → male sprites show in all contexts | Male sprites render correctly | |
| **New Character (Female):** Create new character with female selected → female sprites show in all contexts | Female sprites render correctly | |
| **Character Sheet:** Female character → character sheet shows female GIF | Correct sprite | |
| **Battle View:** Female character enters battle → north-east facing female sprite | Correct sprite | |
| **Dungeon View:** Female character explores dungeon → all directional female sprites | Correct sprites for all directions | |
| **Bounty Modal:** Female character → female sprite shown in bounty preview | Correct sprite | |
| **Elite Encounter:** Female character → female sprite in encounter modal | Correct sprite | |
| **Class Preview (Creation):** Toggle gender in creation modal → preview GIF updates between male/female | Live preview updates | |
| **Existing Character (Migration):** Load plugin with existing character (no gender field) → defaults to male sprites without crashing | No broken images, no errors | |
| **Edit Character:** Open edit modal for existing character → gender field shows current value → change to female → save → sprites update | Gender persists and sprites update | |
| **Training Mode:** Female character in training mode → uses tier 1 female sprites | Correct tier | |
| **Sidebar Quests:** Female character → sidebar shows female sprite | Correct sprite | |
| **Mobile:** Gender toggle is tappable on mobile (≥44px targets) | Accessible touch target | |

### Manual Test Steps

1. Run `npm run build` — confirm clean build.
2. Run `npm run deploy:test` — deploy to test vault.
3. Open Obsidian test vault.
4. **If existing character:** Verify sprites still load (male default). Check console for no errors.
5. Create a **new female** character: select class, toggle gender to Female, name character, create.
6. Check: Character Sheet → battle sprite → sidebar → enter dungeon → start bounty.
7. Open character edit modal → verify gender shows "Female" → change to "Male" → save → verify sprites change.

---

## Security & Validation

| Concern | Mitigation |
|---------|-----------|
| **No innerHTML in UI** | Gender toggle uses Obsidian DOM API (`createEl`, `createDiv`) in the `.ts` modal and React JSX in the `.tsx` component. No raw HTML injection. |
| **Input validation** | `CharacterGender` is a union type (`'male' \| 'female'`). `SpriteService` defensively falls back to `'male'` on falsy values. |
| **Path traversal** | Gender value is constrained to `'male'` or `'female'` — no user-supplied path segments. |
| **No `any` type** | All new code uses proper TypeScript types. |
| **No `console.log`** | All new code uses `console.warn` or `console.error` only if needed. |

---

## Performance Considerations

| Aspect | Approach |
|--------|----------|
| **Sprite caching** | `useCharacterSprite` already memoizes via `useMemo`. Adding `character?.appearance?.gender` to the dependency array means the cache invalidates only when gender actually changes. |
| **Asset loading** | No additional network requests. Sprites are bundled locally as plugin assets. |
| **Bundle size** | No new runtime dependencies. The `CharacterGender` type adds zero bytes at runtime. |
| **Manifest file** | The manifest doubles in size (315 → 630 entries), but this is a static JSON file loaded once. Negligible impact. |

---

## Rollback Plan

**To revert:**

1. Revert all code changes (git revert or manual).
2. Move the files from `male/` subfolders back to the parent tier directories.
3. Delete the `female/` subfolders.
4. `CHARACTER_SCHEMA_VERSION` goes back to `6`.
5. Existing characters with `gender` field in their appearance will simply have it ignored by old code.
6. No data loss — the `gender` field is harmless to old versions.

**Reversibility:** Full. The migration is additive (adds a field with a default). It does not remove or rename any existing fields.

---

## Design Decision Log

### Explored and Rejected

1. **Gender as top-level `Character.gender` field:**
   - Rejected because gender is an appearance concern. Keeping it in `CharacterAppearance` means the existing `updateAppearance` action handles cache invalidation (`spriteVersion++`) automatically.

2. **Filename-based approach (`male_warrior-tier-1.gif`):**
   - Rejected because it requires filename string manipulation in `SpriteService` and makes the asset directory harder to browse (male and female files interleaved in the same folder).

3. **Renaming existing sprites (`warrior-tier-1_south.png` → `male_south.png`):**
   - Rejected because it would require changing the existing naming convention across 315 files AND updating every path reference output from `SpriteService`. The subfolder approach changes only the path template, not the filenames.

4. **Making `gender` required (not optional with default):**
   - Rejected because it would break the `getClassPreviewSprite` call in `CharacterCreationModal.ts` where no character exists yet. Using an optional parameter with a `'male'` default keeps existing call sites working.

### Known Limitations

- **Art quality:** Female sprite quality depends on AI generation tooling. If sprites don't match male sprite quality/style, that's an art concern, not a code concern.
- **No preview sprites for gender toggle in `.ts` modal:** The first-launch modal uses emojis as fallback if GIF fails. The same pattern applies for the preview during gender toggling.

---

## Key References

| Resource | Path | Purpose |
|----------|------|---------|
| Character model | `src/models/Character.ts` | `CharacterAppearance` interface, schema version, migration chain |
| Character store | `src/store/characterStore.ts` | `createCharacter`, `updateAppearance`, `setCharacter` (migration trigger) |
| SpriteService | `src/services/SpriteService.ts` | All player sprite path resolution functions |
| Sprite hook | `src/hooks/useCharacterSprite.ts` | React hook that bridges store → SpriteService |
| Validator | `src/utils/validator.ts` | `validateCharacter` with appearance defaults |
| Obsidian modal | `src/modals/CharacterCreationModal.ts` | First-launch character creation |
| React modal | `src/components/CharacterCreationModal.tsx` | Character creation/editing (React) |
| Asset manifest script | `scripts/generate-asset-manifest.js` | Generates `assets/manifest.json` |
| Sprite prompts | `docs/development/sprite-prompts.md` | Reference for sprite generation |
| Obsidian guidelines | `.agent/rules/obsidian-plugin-guidelines.md` | Plugin compliance rules |
| Existing sprites | `assets/sprites/player/` | Current 315-file asset structure |
| Existing tests | `test/store/characterStore.test.ts` | Existing character store tests (reference for mocking patterns) |