# Dungeon Templates Modularization Guide

**Status:** ✅ Complete (2026-02-06)
**Priority:** Low (quality-of-life refactor, not blocking anything)
**Risk:** Low (pure data restructuring, zero behavior change)
**Estimated Scope:** ~30 minutes

---

## Goal

Split the monolithic `src/data/dungeonTemplates.ts` (1,854 lines) into individual files per dungeon under `src/data/dungeons/`. This makes dungeons easier to find, edit, and add without scrolling through a massive file.

---

## Current State

**Single file:** `src/data/dungeonTemplates.ts` contains:
- 6 dungeon template definitions (~1,790 lines of data)
- Registry object + 5 helper functions (~60 lines of logic)

**Dungeons in the file:**
| Const Name | ID | Approx Lines | Difficulty | Rooms |
|---|---|---|---|---|
| `TEST_CAVE` | `test_cave` | 90 | easy | 3 |
| `GOBLIN_CAVE` | `goblin_cave` | 125 | easy | 5 |
| `FOREST_RUINS` | `forest_ruins` | 210 | medium | 8 |
| `CASTLE_CRYPT` | `castle_crypt` | 265 | medium | 10 |
| `BANDIT_STRONGHOLD` | `bandit_stronghold` | 520 | hard | 20 |
| `THORNWOOD_LABYRINTH` | `thornwood_labyrinth` | 490 | hard | 20 |

---

## Target Structure

```
src/data/dungeons/
├── index.ts                 # Registry + helper functions + re-exports
├── testCave.ts              # TEST_CAVE
├── goblinCave.ts            # GOBLIN_CAVE
├── forestRuins.ts           # FOREST_RUINS
├── castleCrypt.ts           # CASTLE_CRYPT
├── banditStronghold.ts      # BANDIT_STRONGHOLD
└── thornwoodLabyrinth.ts    # THORNWOOD_LABYRINTH
```

---

## Import Audit (Completed)

These are ALL the files that import from `dungeonTemplates.ts`. No other files reference it.

### Source Files (4 files to update)

| File | Current Import | Functions Used |
|---|---|---|
| `main.ts:23` | `'./src/data/dungeonTemplates'` | `getAllDungeonTemplates`, `registerUserDungeons`, `clearUserDungeons`, `getRandomDungeon` |
| `src/components/DungeonView.tsx:13` | `'../data/dungeonTemplates'` | `getDungeonTemplate` |
| `src/store/dungeonStore.ts:17` | `'../data/dungeonTemplates'` | `getDungeonTemplate` |
| `src/modals/DungeonSelectionModal.ts:10` | `'../data/dungeonTemplates'` | `getAllDungeonTemplates`, `getRandomDungeon` |

### Individual Dungeon Consts (NOT imported externally)

`TEST_CAVE`, `GOBLIN_CAVE`, `FOREST_RUINS`, `CASTLE_CRYPT`, `BANDIT_STRONGHOLD`, and `THORNWOOD_LABYRINTH` are only referenced inside `dungeonTemplates.ts` itself (in the `BUILTIN_TEMPLATES` registry). No external file imports these consts directly.

### `DUNGEON_TEMPLATES` const (NOT imported externally)

The exported `DUNGEON_TEMPLATES` record is defined but never imported by any other file. Everything goes through the helper functions.

---

## Implementation Steps

### Step 1: Create the `src/data/dungeons/` directory

### Step 2: Create individual dungeon files

For each dungeon, create a file that exports just the single template const. Each file follows this pattern:

```typescript
// src/data/dungeons/goblinCave.ts

import type { DungeonTemplate } from '../../models/Dungeon';

/**
 * Goblin Cave - The first proper dungeon.
 * 5 rooms with increasing difficulty.
 * All rooms sized 11x7 for consistent display.
 */
export const GOBLIN_CAVE: DungeonTemplate = {
    // ... exact same data, cut/pasted from dungeonTemplates.ts ...
};
```

Files to create (copy each dungeon's JSDoc comment + const definition):
1. `testCave.ts` - lines 19-117 from current file
2. `goblinCave.ts` - lines 123-252
3. `forestRuins.ts` - lines 258-481
4. `castleCrypt.ts` - lines 487-756
5. `banditStronghold.ts` - lines 762-1288
6. `thornwoodLabyrinth.ts` - lines 1292-1790

Each file needs:
- `import type { DungeonTemplate } from '../../models/Dungeon';` at the top
- The JSDoc comment block for that dungeon
- The exported const

### Step 3: Create `src/data/dungeons/index.ts`

This file replaces the registry section (lines 1793-1854) of the old file and re-exports everything:

```typescript
/**
 * Dungeon Template Registry
 *
 * Manages built-in and user-created dungeon templates.
 * Individual dungeons are defined in separate files for easy editing.
 */

import type { DungeonTemplate } from '../../models/Dungeon';

// Import all built-in dungeons
import { TEST_CAVE } from './testCave';
import { GOBLIN_CAVE } from './goblinCave';
import { FOREST_RUINS } from './forestRuins';
import { CASTLE_CRYPT } from './castleCrypt';
import { BANDIT_STRONGHOLD } from './banditStronghold';
import { THORNWOOD_LABYRINTH } from './thornwoodLabyrinth';

// Re-export individual dungeons (for direct access if ever needed)
export { TEST_CAVE, GOBLIN_CAVE, FOREST_RUINS, CASTLE_CRYPT, BANDIT_STRONGHOLD, THORNWOOD_LABYRINTH };

/** Built-in dungeon templates */
const BUILTIN_TEMPLATES: Record<string, DungeonTemplate> = {
    test_cave: TEST_CAVE,
    goblin_cave: GOBLIN_CAVE,
    forest_ruins: FOREST_RUINS,
    castle_crypt: CASTLE_CRYPT,
    bandit_stronghold: BANDIT_STRONGHOLD,
    thornwood_labyrinth: THORNWOOD_LABYRINTH,
};

/** User-loaded dungeon templates (cleared on reload) */
let userTemplates: Record<string, DungeonTemplate> = {};

/** All available dungeon templates (built-in + user) */
export const DUNGEON_TEMPLATES: Record<string, DungeonTemplate> = BUILTIN_TEMPLATES;

/**
 * Get a dungeon template by ID.
 */
export function getDungeonTemplate(id: string): DungeonTemplate | null {
    return userTemplates[id] ?? BUILTIN_TEMPLATES[id] ?? null;
}

/**
 * Get all dungeon templates as an array (built-in + user).
 */
export function getAllDungeonTemplates(): DungeonTemplate[] {
    return [...Object.values(BUILTIN_TEMPLATES), ...Object.values(userTemplates)];
}

/**
 * Register user-created dungeons loaded from markdown files.
 * Called on plugin load after parsing user dungeon folder.
 */
export function registerUserDungeons(templates: DungeonTemplate[]): void {
    userTemplates = {};
    for (const template of templates) {
        userTemplates[template.id] = template;
    }
}

/**
 * Clear all user dungeons (called before reload).
 */
export function clearUserDungeons(): void {
    userTemplates = {};
}

/**
 * Get a random dungeon template from all available.
 */
export function getRandomDungeon(): DungeonTemplate {
    const all = getAllDungeonTemplates();
    // Exclude test_cave from random selection
    const selectable = all.filter(t => t.id !== 'test_cave');
    return selectable[Math.floor(Math.random() * selectable.length)];
}
```

### Step 4: Update imports in 4 consuming files

Each import path changes from `dungeonTemplates` to `dungeons` (or `dungeons/index`). The imported names stay exactly the same.

| File | Old Import Path | New Import Path |
|---|---|---|
| `main.ts:21` | `'./src/data/dungeonTemplates'` | `'./src/data/dungeons'` |
| `src/components/DungeonView.tsx:13` | `'../data/dungeonTemplates'` | `'../data/dungeons'` |
| `src/store/dungeonStore.ts:17` | `'../data/dungeonTemplates'` | `'../data/dungeons'` |
| `src/modals/DungeonSelectionModal.ts:10` | `'../data/dungeonTemplates'` | `'../data/dungeons'` |

**Only the path changes. The `import { ... }` names are identical.**

### Step 5: Delete the old file

Delete `src/data/dungeonTemplates.ts` after all imports are updated.

### Step 6: Build and verify

```bash
npm run build
```

This must compile with zero errors. Since this is a pure data move with no logic changes, any build error means an import path is wrong.

### Step 7: Deploy and test

```bash
npm run deploy:test
```

Brad tests in the test vault:
- Open dungeon selection modal - all 5 selectable dungeons should appear (test_cave is filtered from random)
- Enter a dungeon and verify rooms/monsters/chests load correctly
- Verify user-defined dungeons still load if any exist

### Step 8: Add Monster ID Validation to UserDungeonLoader

Export `VALID_MONSTER_IDS` from `AIDungeonService.ts` and add validation in `UserDungeonLoader.ts`:

**In `src/services/AIDungeonService.ts`** - Add export to the existing Set:
```typescript
export const VALID_MONSTER_IDS = new Set([...]);
```

**In `src/services/UserDungeonLoader.ts`** - Add import and validation in `parseRoomSection()`:
```typescript
import { VALID_MONSTER_IDS } from './AIDungeonService';

// Inside parseRoomSection, after parsing monsters array (around line 370):
for (const monster of monsters) {
    for (const monsterId of monster.pool) {
        if (!VALID_MONSTER_IDS.has(monsterId)) {
            warnings.push(`${filename} room ${roomId}: Unknown monster ID '${monsterId}'`);
        }
    }
}
```

This produces warnings (not errors) for unknown monster IDs, so user dungeons still load but users get feedback about typos.

### Step 9: Run Unit Tests

Unit tests were written TDD-style in `test/dungeon-registry.test.ts` before the refactor. They import from `../src/data/dungeons` (the new path) and will now pass:

```bash
npm run test -- test/dungeon-registry.test.ts
```

All 19 tests should pass, covering:
- Built-in template count and exports
- `getDungeonTemplate()` lookup
- `registerUserDungeons()` / `clearUserDungeons()` management
- `getRandomDungeon()` excluding test_cave
- Data integrity for each dungeon

---

## Docs That Reference the Old File

These docs mention `dungeonTemplates.ts` by name. Update them to reference the new structure:

### 1. `CLAUDE.md` (line 227)
Change the data files section from:
```
│   │   ├── dungeonTemplates.ts     # Built-in dungeons
```
To:
```
│   ├── dungeons/               # Dungeon templates (7 files)
│   │   ├── index.ts                # Registry + helper functions
│   │   ├── testCave.ts             # Test Cave (dev testing)
│   │   ├── goblinCave.ts           # Goblin Cave (easy, 5 rooms)
│   │   ├── forestRuins.ts          # Forest Ruins (medium, 8 rooms)
│   │   ├── castleCrypt.ts          # Castle Crypt (medium, 10 rooms)
│   │   ├── banditStronghold.ts     # Bandit Stronghold (hard, 20 rooms)
│   │   └── thornwoodLabyrinth.ts   # Thornwood Labyrinth (hard, 20 rooms)
```

### 2. `docs/development/dungeons/GENERATION_PROMPT.md` (lines 9 and 255)
- Line 9: Change "pasted directly into `dungeonTemplates.ts`" to "saved as a new file in `src/data/dungeons/`"
- Lines 255-261: Update the "NOTES FOR BRAD" section. Instead of adding to `BUILTIN_TEMPLATES` in the monolith file, the instructions should say:
  1. Save the new dungeon as `src/data/dungeons/yourDungeonName.ts`
  2. Add an import in `src/data/dungeons/index.ts`
  3. Add the entry to the `BUILTIN_TEMPLATES` record in `index.ts`

### 3. `docs/development/Feature Roadmap v2.md` (line 105)
Update the reference from `dungeonTemplates.ts` to `src/data/dungeons/`.

### 4. Archive docs (no changes needed)
The following are historical session logs and should NOT be modified:
- `docs/archive/Phase 3 Implementation Session Log.md`
- `docs/development/Phase 4 Implementation Session Log.md`
- `docs/archive/Kebab Case Migration Scope.md`

---

## What NOT to Change

- **No logic changes.** Every function body stays identical.
- **No renames.** All const names (`TEST_CAVE`, etc.) and function names stay the same.
- **No type changes.** `DungeonTemplate` import comes from the same model.
- **No archive docs.** Historical session logs reference the old file name - that's fine, they're historical records.
- **No build config.** esbuild and tsconfig have no dungeon-specific paths.

---

## Adding New Dungeons After This Refactor

After this refactor, adding a new built-in dungeon is:

1. Create `src/data/dungeons/yourNewDungeon.ts` with the template
2. Add `import { YOUR_NEW_DUNGEON } from './yourNewDungeon';` to `index.ts`
3. Add `your_new_dungeon: YOUR_NEW_DUNGEON,` to the `BUILTIN_TEMPLATES` record in `index.ts`
4. Build and test

---

## Verification Checklist

- [x] All 6 individual dungeon files created and export correctly
- [x] `index.ts` imports all 6 and registry functions work
- [x] All 4 consuming files updated to new import path
- [x] Old `dungeonTemplates.ts` archived as `.bak` (pending deletion after confidence)
- [x] `npm run build` passes with zero errors
- [x] `npm run deploy:test` succeeds
- [x] Dungeon selection modal shows all dungeons
- [x] Can enter and play through dungeons (2 tested)
- [x] User-defined dungeons still load
- [ ] CLAUDE.md file tree updated (pending)
- [ ] GENERATION_PROMPT.md instructions updated (pending)
- [x] Feature Roadmap reference updated
- [x] Monster ID validation added to UserDungeonLoader
- [x] All 20 unit tests in `dungeon-registry.test.ts` pass (was 19 in plan, added 20th room to Thornwood)

---

## Future Improvements

These are not blocking the modularization but could be added as follow-up enhancements:

### User Dungeon Input Validation

**1. File Size Limit** - Add a max size check in `loadUserDungeons()` to prevent maliciously large files:

```typescript
// In loadUserDungeons, before parsing
if (content.length > 500_000) {
    errors.push(`${file.path}: File too large (max 500KB)`);
    continue;
}
```

### Unit Tests

✅ **Already written** - See `test/dungeon-registry.test.ts` (19 tests, written TDD-style before the refactor).
