# Kebab Case Migration Scope

> **Purpose:** Standardize all monster/character identifiers to kebab-case format  
> **Estimated Time:** 1-2 hours  
> **Priority:** Technical debt cleanup

---

## Current Mixed Convention Problem

The codebase currently mixes underscore and hyphen conventions:

| Asset Type | Current Convention | Example |
|------------|-------------------|---------|
| Monster IDs | Underscores | `giant_rat`, `cave_troll`, `shadow_elf` |
| Monster Sprite Folders | Hyphens | `giant-rat/`, `cave-troll/`, `shadow-elf/` |
| Monster Sprite Files | Underscores | `giant_rat.gif`, `cave_troll_south.png` |
| Environment Tiles | Hyphens | `wall-stone.png`, `floor-cave.png` |

### Why This Is a Problem

1. **Dungeon creation** requires remembering which convention to use for monster pools
2. **`SpriteService.toFolderName()`** exists solely to bridge this mismatch
3. **Inconsistency** between character/monster files and environment tiles
4. **Error-prone** - causes sprite loading failures (shows emoji fallback)

---

## Target Convention

**All identifiers, folders, and filenames will use kebab-case:**

| Asset Type | New Convention | Example |
|------------|---------------|---------|
| Monster IDs | Hyphens | `giant-rat`, `cave-troll`, `shadow-elf` |
| Monster Sprite Folders | Hyphens (no change) | `giant-rat/`, `cave-troll/` |
| Monster Sprite Files | Hyphens | `giant-rat.gif`, `cave-troll_south.png` |

---

## Files Requiring Code Changes

### 1. `src/data/monsters.ts` (~8 changes)

Change monster template `id` fields:

```diff
- id: 'giant_rat',
+ id: 'giant-rat',

- id: 'cave_troll',
+ id: 'cave-troll',
```

**Monsters to update:**
- `giant_rat` → `giant-rat`
- `cave_troll` → `cave-troll`
- `river_troll` → `river-troll`
- `shadow_elf` → `shadow-elf`
- `dark_ranger` → `dark-ranger`
- `rogue_dwarf` → `rogue-dwarf`
- `eye_beast` → `eye-beast`
- (Single-word monsters like `wolf`, `bear`, `goblin` stay unchanged)

---

### 2. `src/data/dungeonTemplates.ts` (~60 changes)

Update all `pool` references in monster definitions:

```diff
- { position: [3, 2], pool: ['rogue_dwarf'] },
+ { position: [3, 2], pool: ['rogue-dwarf'] },
```

**Tip:** Use find-and-replace with regex: `'(giant_rat|cave_troll|river_troll|shadow_elf|dark_ranger|rogue_dwarf|eye_beast)'`

---

### 3. `src/services/BountyService.ts` (~35 changes)

Update all hardcoded monster pools and hints:

```diff
const MONSTER_POOLS: Record<string, string[]> = {
    beasts: ['wolf', 'bear', 'giant_rat'],
+   beasts: ['wolf', 'bear', 'giant-rat'],
    ...
-   trolls: ['cave_troll', 'river_troll'],
+   trolls: ['cave-troll', 'river-troll'],
```

---

### 4. `src/services/SpriteService.ts` (simplify)

**Remove** the `toFolderName()` utility function since IDs will match folder names directly:

```diff
- function toFolderName(id: string): string {
-     return id.replace(/_/g, '-');
- }

// In getMonsterGifPath:
- const folderName = toFolderName(monsterId);
+ const folderName = monsterId;  // IDs now match folder names
```

---

### 5. `src/services/UserDungeonLoader.ts` (documentation)

Update the help text that lists valid monster IDs:

```diff
- - \`wolf\`, \`bear\`, \`giant_rat\`
+ - \`wolf\`, \`bear\`, \`giant-rat\`
```

---

## Sprite Assets to Rename

### Monster Sprite Files

Rename files inside each monster folder:

```powershell
# Example for rogue-dwarf folder
cd assets/sprites/monsters/rogue-dwarf
Rename-Item "rogue_dwarf.gif" "rogue-dwarf.gif"
Rename-Item "rogue_dwarf_south.png" "rogue-dwarf_south.png"
# etc.
```

**PowerShell batch script:**

```powershell
$monstersPath = "assets/sprites/monsters"
$replacements = @{
    "giant_rat" = "giant-rat"
    "cave_troll" = "cave-troll"
    "river_troll" = "river-troll"
    "shadow_elf" = "shadow-elf"
    "dark_ranger" = "dark-ranger"
    "rogue_dwarf" = "rogue-dwarf"
    "eye_beast" = "eye-beast"
}

foreach ($old in $replacements.Keys) {
    $new = $replacements[$old]
    $folder = "$monstersPath/$new"
    if (Test-Path $folder) {
        Get-ChildItem $folder | ForEach-Object {
            $newName = $_.Name -replace $old, $new
            if ($_.Name -ne $newName) {
                Rename-Item $_.FullName $newName
            }
        }
    }
}
```

---

## Implementation Order

1. **Phase 1: Rename sprite files** (no code impact yet)
   - Run PowerShell script to rename files
   - Verify files renamed correctly

2. **Phase 2: Update SpriteService.ts**
   - Remove `toFolderName()` utility
   - Update path building to use ID directly for folder AND filename

3. **Phase 3: Update monsters.ts**
   - Change all underscore IDs to kebab-case

4. **Phase 4: Update dungeonTemplates.ts**
   - Find-and-replace all monster pool references

5. **Phase 5: Update BountyService.ts**
   - Update all monster pools and hints

6. **Phase 6: Update UserDungeonLoader.ts**
   - Update documentation strings

7. **Phase 7: Build and test**
   - `npm run build`
   - `npm run deploy:test`
   - Test all dungeons and bounty encounters

---

## Verification Checklist

- [ ] All monster sprites load (no emoji fallbacks)
- [ ] Castle Crypt works (all 10 rooms)
- [ ] Bandit Stronghold works (all 20 rooms)
- [ ] Forest Ruins works
- [ ] Goblin Cave works
- [ ] Bounty fights work
- [ ] Overworld fights work
- [ ] BattleView shows monster sprites

---

## Rollback Plan

If issues occur:
1. Revert code changes via git
2. Rename files back using inverse PowerShell script
3. The `toFolderName()` function still exists as documentation if needed

---

*Created: 2026-01-27*
