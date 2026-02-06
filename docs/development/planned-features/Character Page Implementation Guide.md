# Character Page Implementation Guide

**Status:** Session 1 Complete
**Estimated Sessions:** 2-3
**Created:** 2026-02-05
**Last Updated:** 2026-02-06

---

## Table of Contents

- [Overview](#overview)
- [Architecture Philosophy](#architecture-philosophy)
- [Session 1: Extract Sub-Components & Refactor](#session-1-extract-sub-components--refactor)
  - [Phase 1A: Create Shared Sub-Components](#phase-1a-create-shared-sub-components)
  - [Phase 1B: Refactor CharacterSheet into CharacterSidebar](#phase-1b-refactor-charactersheet-into-charactersidebar)
  - [Phase 1C: Add Accessory Slots to Sidebar Gear Grid](#phase-1c-add-accessory-slots-to-sidebar-gear-grid)
  - [Session 1 Testing](#session-1-testing)
- [Session 2: Build Full-Page Character View](#session-2-build-full-page-character-view)
  - [Phase 2A: View Registration & Wiring](#phase-2a-view-registration--wiring)
  - [Phase 2B: CharacterPage Component (Two-Panel Layout)](#phase-2b-characterpage-component-two-panel-layout)
  - [Phase 2C: Equipment Paperdoll](#phase-2c-equipment-paperdoll)
  - [Phase 2D: Action Menu (RPG-Styled)](#phase-2d-action-menu-rpg-styled)
  - [Phase 2E: Consumables Belt](#phase-2e-consumables-belt)
  - [Session 2 Testing](#session-2-testing)
- [Session 3: CSS Polish & Mobile](#session-3-css-polish--mobile)
  - [Phase 3A: Full-Page Layout CSS](#phase-3a-full-page-layout-css)
  - [Phase 3B: RPG Button Theming](#phase-3b-rpg-button-theming)
  - [Phase 3C: Mobile Responsiveness](#phase-3c-mobile-responsiveness)
  - [Session 3 Testing](#session-3-testing)
- [File Change Summary](#file-change-summary)
- [Key References](#key-references)

---

## Overview

Create a dedicated full-page character view, similar in concept to a WoW character screen or D&D character sheet. The sidebar character view (`CharacterSheet.tsx`) will be refactored into shared sub-components that both the sidebar and full-page views compose differently.

### Goals
- Full-page, two-panel layout with big character sprite, paperdoll equipment, and RPG-styled action menu
- **Shared architecture:** Extract sub-components so both sidebar and full-page views use the same building blocks (update once, both views reflect changes)
- Add accessory slot rendering (data model already supports `accessory1/2/3`)
- Add consumables belt for quick-use potions

### Non-Goals (For Now)
- Embedded progress charts (button to existing dashboard modal instead)
- Skill loadout preview on page (button to existing modal instead)
- Party member display (future feature)

---

## Architecture Philosophy

> **The Kanban/Sidebar lesson:** FullKanban and SidebarQuests were built independently with separate logic. Updates required changing both components. We will NOT repeat this.

### Shared Sub-Component Pattern

Both views compose the same building blocks in different layouts:

```
src/components/character/           # Shared sub-components
├── CharacterIdentity.tsx           # Name, class, level, sprite
├── ResourceBars.tsx                # HP / Mana / Stamina bars
├── AttributeGrid.tsx              # 6 D&D stats (3x2 grid)
├── CombatStatsGrid.tsx            # Derived combat stats
├── EquipmentGrid.tsx              # Compact gear grid (sidebar)
├── EquipmentPaperdoll.tsx         # Paperdoll layout (full page) [NEW]
├── ActiveBuffs.tsx                # Active buff icons
├── StreakDisplay.tsx               # Current/best streak
├── ClassPerkCard.tsx              # Class perk display
├── SetBonuses.tsx                 # Active set bonuses
├── CharacterStats.tsx             # Gold, quests, XP, achievements
├── ConsumablesBelt.tsx            # Quick-use consumables [NEW]
└── ActionMenu.tsx                 # RPG-styled menu buttons [NEW]
```

```
CharacterSidebar.tsx (sidebar)      CharacterPage.tsx (full page)
┌──────────────────┐               ┌──────────────┬──────────────┐
│ CharacterIdentity│               │ Identity     │ AttributeGrid│
│ ResourceBars     │               │ (big sprite) │ CombatStats  │
│ StreakDisplay     │               │ ResourceBars │ Paperdoll    │
│ EquipmentGrid    │               │ Streak       │ SetBonuses   │
│ SetBonuses       │               │ ActiveBuffs  │ CharStats    │
│ AttributeGrid    │               │ ClassPerk    │              │
│ CombatStatsGrid  │               │ Consumables  │              │
│ ClassPerkCard    │               │ ActionMenu   │              │
│ CharacterStats   │               └──────────────┴──────────────┘
└──────────────────┘
   Same sub-components, different arrangement
```

### Rules
1. **All character display logic lives in sub-components.** Neither `CharacterSidebar` nor `CharacterPage` should contain inline rendering of stats, gear, etc.
2. **Sub-components receive data via props.** They do NOT import stores directly. The parent passes precomputed data down.
3. **Sub-components accept a `compact` prop** where layout differs between sidebar/full-page (e.g., `AttributeGrid compact` shows abbreviations, full shows full names).
4. **Use existing constants from models.** `ALL_GEAR_SLOTS`, `GEAR_SLOT_NAMES`, `GEAR_SLOT_ICONS` from `Gear.ts` - never hardcode slot lists.
5. **Use existing modal openers.** `showInventoryModal`, `showBlacksmithModal`, `showSkillLoadoutModal` are already exported as functions.

---

## Session 1: Extract Sub-Components & Refactor

**Goal:** Decompose `CharacterSheet.tsx` into shared sub-components, rename to `CharacterSidebar`, add accessory slots. **Zero visual changes** to the sidebar when done.

---

### Phase 1A: Create Shared Sub-Components

Create `src/components/character/` folder with the following extracted components.

#### 1. `CharacterIdentity.tsx`

Extract from `CharacterSheet.tsx` lines 119-178 (the header section).

**Props:**
```ts
interface CharacterIdentityProps {
    character: Character;
    classInfo: ClassInfo;
    spriteResourcePath?: string;
    /** Sprite display size in px */
    spriteSize?: number;           // default 80 (sidebar), 200 (full page)
    /** Show active buffs inline */
    showBuffs?: boolean;           // default true
    allBuffs: ActivePowerUp[];
}
```

**Renders:** Sprite container, name, class/level text, secondary class, active buffs row.

#### 2. `ResourceBars.tsx`

Extract from `CharacterSheet.tsx` lines 201-264 (HP/Mana/Stamina section).

**Props:**
```ts
interface ResourceBarsProps {
    character: Character;
    combatStats: ReturnType<typeof deriveCombatStats>;
    compact?: boolean;             // sidebar = true, full page = false
}
```

**Renders:** HP bar, Mana bar, Stamina bar with values and daily cap hint.

#### 3. `StreakDisplay.tsx`

Extract from `CharacterSheet.tsx` lines 266-280.

**Props:**
```ts
interface StreakDisplayProps {
    currentStreak: number;
    highestStreak: number;
    compact?: boolean;
}
```

**Renders:** Current/best streak values + motivational message.

#### 4. `EquipmentGrid.tsx`

Extract from `CharacterSheet.tsx` lines 282-347 (gear grid + buttons).

**Props:**
```ts
interface EquipmentGridProps {
    equippedGear: EquippedGearMap;
    /** Which slots to display */
    slots: GearSlot[];
    onSlotClick?: (slot: GearSlot) => void;
    compact?: boolean;
}
```

**Key change:** Use `ALL_GEAR_SLOTS`, `GEAR_SLOT_NAMES`, `GEAR_SLOT_ICONS` from `Gear.ts` instead of the hardcoded `GEAR_SLOTS_CONFIG` array. The `slots` prop controls which slots to render (sidebar passes `ALL_GEAR_SLOTS`, paperdoll uses its own layout).

**Renders:** Grid of gear slots with tier coloring and tooltips. Uses existing `getGearTooltip()` function (move to `src/utils/gearFormatters.ts` if not already there, or keep as local util in this file).

> **Note:** The `getGearTooltip()` function at line 44-75 of `CharacterSheet.tsx` should be checked against `src/utils/gearFormatters.ts`. If `gearFormatters.ts` already has equivalent tooltip logic, use that. If not, move this function there so it's shared.

#### 5. `SetBonuses.tsx`

Extract from `CharacterSheet.tsx` lines 349-380.

**Props:**
```ts
interface SetBonusesProps {
    activeSetBonuses: ActiveSetBonus[];
    compact?: boolean;
}
```

**Renders:** Set bonus list with piece counts and active/inactive styling.

#### 6. `AttributeGrid.tsx`

Extract from `CharacterSheet.tsx` lines 382-420.

**Props:**
```ts
interface AttributeGridProps {
    character: Character;
    compact?: boolean;             // compact shows abbreviations, full shows names
}
```

**Key detail:** This component calls `getTotalStats()`, `aggregateGearStats()`, `getStatCap()`, and `CLASS_INFO` internally. These are pure functions from services, not store access - this is fine.

**Renders:** 3x2 grid of stats with base/quest/gear/buff breakdown in tooltips.

#### 7. `CombatStatsGrid.tsx`

Extract from `CharacterSheet.tsx` lines 422-465.

**Props:**
```ts
interface CombatStatsGridProps {
    combatStats: ReturnType<typeof deriveCombatStats>;
    compact?: boolean;
}
```

**Renders:** Derived combat stats (HP, Mana, Phys Atk, Magic Atk, Defense, Magic Def, Crit%, Dodge%, Block%).

#### 8. `ClassPerkCard.tsx`

Extract from `CharacterSheet.tsx` lines 467-473.

**Props:**
```ts
interface ClassPerkCardProps {
    classInfo: ClassInfo;
}
```

**Renders:** Perk name, description, and XP bonus categories.

#### 9. `CharacterStats.tsx`

Extract from `CharacterSheet.tsx` lines 475-503.

**Props:**
```ts
interface CharacterStatsProps {
    character: Character;
    completedQuests: number;
    activeQuests: number;
    achievementCount: number;
    onViewAchievements?: () => void;
}
```

**Renders:** Gold, quests completed, active quests, achievements, total XP.

#### 10. `index.ts` (barrel export)

```ts
export { CharacterIdentity } from './CharacterIdentity';
export { ResourceBars } from './ResourceBars';
export { StreakDisplay } from './StreakDisplay';
export { EquipmentGrid } from './EquipmentGrid';
export { SetBonuses } from './SetBonuses';
export { AttributeGrid } from './AttributeGrid';
export { CombatStatsGrid } from './CombatStatsGrid';
export { ClassPerkCard } from './ClassPerkCard';
export { CharacterStats } from './CharacterStats';
```

---

### Phase 1B: Refactor CharacterSheet into CharacterSidebar

1. **Rename file:** `src/components/CharacterSheet.tsx` → `src/components/CharacterSidebar.tsx`
2. **Rename export:** `CharacterSheet` → `CharacterSidebar`
3. **Update import in `SidebarQuests.tsx`** (line 27): `import { CharacterSidebar } from './CharacterSidebar';`
4. **Update usage in `SidebarQuests.tsx`** (line 420): `<CharacterSidebar ... />`
5. **Rewrite CharacterSidebar** to compose extracted sub-components instead of inline rendering.

The rewritten `CharacterSidebar.tsx` should be ~80-100 lines: imports, props, hooks for computed data, and JSX composing the sub-components in sidebar order. All the inline rendering logic is now in the sub-components.

**Props interface stays the same** - no API change for `SidebarQuests.tsx`.

---

### Phase 1C: Add Accessory Slots to Sidebar Gear Grid

Currently `CharacterSheet.tsx` hardcodes 6 gear slots:
```ts
const GEAR_SLOTS_CONFIG = [
    { slot: 'head', ... }, { slot: 'chest', ... },
    { slot: 'legs', ... }, { slot: 'boots', ... },
    { slot: 'weapon', ... }, { slot: 'shield', ... },
];
```

The extracted `EquipmentGrid.tsx` will use `ALL_GEAR_SLOTS` from `Gear.ts` which includes all 9 slots. The sidebar now passes:

```ts
<EquipmentGrid
    equippedGear={character.equippedGear}
    slots={ALL_GEAR_SLOTS}
    onSlotClick={handleSlotClick}
    compact
/>
```

The CSS grid in `character.css` (`.qb-gear-grid`) needs updating from `grid-template-columns: repeat(3, 1fr)` (2 rows of 3) to accommodate 9 slots. Options:
- 3x3 grid: `repeat(3, 1fr)` works, just adds a 3rd row
- This naturally fits since 9 / 3 = 3 rows

---

### Session 1 Testing

After completing Session 1, verify the following:

| Test | Expected | Status |
|------|----------|--------|
| `npm run build` passes | No TypeScript errors | |
| Open sidebar → Character tab | Sidebar character view renders identically to before | |
| All 9 gear slots visible | Head, Chest, Legs, Boots, Weapon, Shield, Accessory 1/2/3 shown | |
| Click empty gear slot | Opens inventory modal filtered to that slot | |
| Equipped gear shows tier coloring | Tier border colors and names display correctly | |
| Hover gear slot | Tooltip shows gear stats (from existing tooltip logic) | |
| Active buffs display | Buff icons render with tooltips and expiry info | |
| Resource bars animate | HP/Mana/Stamina bars show correct values and fill width | |
| Streak display | Current and best streak show, message displays | |
| Set bonuses section | Shows only when sets are active, correct piece counts | |
| Attributes show buff indicators | Green arrows for gear/power-up boosted stats | |
| Combat stats display | All derived stats (phys atk, magic atk, def, etc.) show | |
| Gold display | Gold amount shows with coin emoji | |
| Training mode notice | Shows when character is in training mode | |
| Back button works | Returns to quest list view | |
| `npm run deploy:test` | Plugin loads in test vault without errors | |

**Key verification:** Compare sidebar before/after side-by-side. There should be ZERO visual differences (except the 3 new accessory slots appearing).

---

## Session 2: Build Full-Page Character View

**Goal:** Create the full-page character view, paperdoll, RPG action menu, and consumables belt.

**Prerequisite:** Session 1 must be complete. Sub-components must exist in `src/components/character/`.

---

### Phase 2A: View Registration & Wiring

Follow the exact pattern of `QuestBoardView.tsx`.

#### 1. Add view constant

**File:** `src/views/constants.ts`
```ts
export const CHARACTER_VIEW_TYPE = 'quest-board-character-view';
```

#### 2. Create `CharacterView.tsx`

**File:** `src/views/CharacterView.tsx`

Thin wrapper (same pattern as `QuestBoardView`):
- Extends `ItemView`
- `getViewType()` returns `CHARACTER_VIEW_TYPE`
- `getDisplayText()` returns `'Character'`
- `getIcon()` returns `'user'` (Obsidian's built-in user icon)
- `onOpen()` creates React root, renders `<CharacterPage plugin={this.plugin} app={this.app} />`
- `onClose()` unmounts React root

#### 3. Update barrel export

**File:** `src/views/index.ts`

Add: `export { CHARACTER_VIEW_TYPE } from './constants';`
Add: `export { CharacterView } from './CharacterView';`

#### 4. Register in `main.ts`

Add to `onload()`:
- `registerView(CHARACTER_VIEW_TYPE, ...)` - same pattern as other views
- Add command: `open-character-page` with name "Open Character Page"
- Add `activateCharacterView()` method (same pattern as `activateBattleView()`)

---

### Phase 2B: CharacterPage Component (Two-Panel Layout)

**File:** `src/components/CharacterPage.tsx`

This is the main full-page React component. It composes the shared sub-components in a two-panel layout.

**Props:**
```ts
interface CharacterPageProps {
    plugin: QuestBoardPlugin;
    app: App;
}
```

**Hooks to use (all pre-existing):**
- `useCharacterStore` - character data, achievements, set bonuses
- `useQuestStore` - quest counts
- `useCharacterSprite` - sprite resource path (with `animated: true`)
- `useSaveCharacter` - save callback for modal handlers

**Layout structure:**
```html
<div class="qb-charpage">
    <!-- Top bar -->
    <div class="qb-charpage-topbar">
        <button>← Back to Board</button>
        <XP bar (full width)>
    </div>

    <!-- Two-panel content -->
    <div class="qb-charpage-content">
        <!-- Left panel: Hero -->
        <div class="qb-charpage-left">
            <CharacterIdentity spriteSize={200} />
            <ResourceBars />
            <StreakDisplay />
            <ActiveBuffs />
            <ClassPerkCard />
            <ConsumablesBelt />
            <ActionMenu />
        </div>

        <!-- Right panel: Stats & Gear -->
        <div class="qb-charpage-right">
            <AttributeGrid />
            <CombatStatsGrid />
            <EquipmentPaperdoll />
            <SetBonuses />
            <CharacterStats />
        </div>
    </div>
</div>
```

**Back button behavior:** Opens the Quest Board main view (same as sidebar back button pattern).

**Modal handlers:** Wire up the same `showInventoryModal`, `showBlacksmithModal`, `showSkillLoadoutModal`, `showStoreModal`, achievement hub modal, and progress dashboard modal. These are all existing exported functions - just call them with appropriate options.

---

### Phase 2C: Equipment Paperdoll

**File:** `src/components/character/EquipmentPaperdoll.tsx`

Gear slots arranged around the character sprite silhouette:

```
              [Head]
    [Shield]  (silhouette)  [Weapon]
              [Chest]
    [Acc 1]   [Legs]        [Acc 2]
              [Boots]
              [Acc 3]
```

**Props:**
```ts
interface EquipmentPaperdollProps {
    equippedGear: EquippedGearMap;
    onSlotClick?: (slot: GearSlot) => void;
}
```

**Implementation details:**
- Use CSS Grid or absolute positioning within a relative container
- Each slot reuses the same rendering as `EquipmentGrid` slot items (tier border color, emoji/icon, name, tooltip)
- Extract a shared `GearSlotItem` sub-component if both `EquipmentGrid` and `EquipmentPaperdoll` render individual slots the same way
- Slots use `GEAR_SLOT_NAMES` and `GEAR_SLOT_ICONS` from `Gear.ts`
- Empty slots show the default emoji + "Empty" text + "Click to equip" hint
- Click calls `onSlotClick(slot)` which parent wires to `showInventoryModal` with `initialSlotFilter`
- Use existing gear tooltip logic from `gearFormatters.ts` or the extracted tooltip function

**CSS prefix:** `qb-paperdoll-`

---

### Phase 2D: Action Menu (RPG-Styled)

**File:** `src/components/character/ActionMenu.tsx`

RPG-themed menu buttons styled like JRPG menu items (dark panels, icon + text label).

**Props:**
```ts
interface ActionMenuProps {
    onOpenInventory: () => void;
    onOpenBlacksmith: () => void;
    onOpenStore: () => void;
    onOpenSkillLoadout: () => void;
    onOpenAchievements: () => void;
    onOpenProgressDashboard: () => void;
}
```

**Menu items (2x3 grid):**

| Button | Emoji | Label | Opens |
|--------|-------|-------|-------|
| Inventory | 🎒 | Inventory | `showInventoryModal()` |
| Blacksmith | 🔨 | Blacksmith | `showBlacksmithModal()` |
| Store | 🏪 | Store | `StoreModal` |
| Skills | ⚔️ | Skills | `showSkillLoadoutModal()` |
| Achievements | 🏆 | Achievements | `AchievementHubModal` |
| Progress | 📊 | Progress | `ProgressDashboardModal` |

**Styling direction:** Dark background panels with subtle border, icon on top or left, text label below or right. On hover: slight glow/lift effect using class color. Think RPG menu aesthetic - not flat modern buttons.

**CSS prefix:** `qb-action-menu-`

---

### Phase 2E: Consumables Belt

**File:** `src/components/character/ConsumablesBelt.tsx`

A horizontal strip showing owned consumables with quantities and quick-use capability.

**Props:**
```ts
interface ConsumablesBeltProps {
    inventory: InventoryItem[];
    character: Character;
    onUseConsumable?: (itemId: string) => void;
    compact?: boolean;
}
```

**Data source:** `inventory` from `characterStore` (the `InventoryItem[]` for consumables, not `gearInventory`). Cross-reference with `CONSUMABLES` from `src/models/Consumable.ts` for display info.

**Renders:**
- Horizontal row of consumable slots
- Each slot shows: emoji, quantity badge, name on hover (tooltip)
- Only shows consumables the player owns (quantity > 0)
- Click/use behavior: for now, just show a tooltip with the item info. Active use during combat is already handled by `BattleView`. Out-of-combat use of HP/Mana potions could be wired later.
- If inventory is empty: show a subtle "No consumables - visit the Store" hint

**CSS prefix:** `qb-consumables-`

---

### Session 2 Testing

| Test | Expected | Status |
|------|----------|--------|
| `npm run build` passes | No TypeScript errors | |
| Command palette → "Open Character Page" | Full-page character view opens in a new tab | |
| Two-panel layout renders | Left panel (hero) and right panel (stats/gear) side by side | |
| Big sprite displays | 200x200+ character sprite with class-colored border | |
| XP bar spans top | Full-width XP bar in top bar section | |
| Paperdoll shows all 9 slots | Slots arranged around silhouette area | |
| Click paperdoll slot | Opens inventory modal filtered to that slot | |
| Equipped gear in paperdoll | Shows tier-colored borders, names, tooltips | |
| Action menu renders | 6 RPG-styled buttons in grid | |
| Click each action button | Each opens the correct existing modal | |
| Consumables belt shows items | Owned potions/items display with quantities | |
| Empty consumable belt | Shows "visit store" hint when no consumables | |
| All sub-components render | Same data shown as sidebar (stats, buffs, streaks, etc.) | |
| Sidebar still works | Sidebar character view unchanged and functional | |
| Multiple views open | Both sidebar character tab and full page can be open simultaneously | |
| `npm run deploy:test` | Plugin loads in test vault, character page accessible | |

---

## Session 3: CSS Polish & Mobile

**Goal:** Polish the full-page layout, style the RPG buttons, and ensure mobile responsiveness.

**Prerequisite:** Session 2 must be complete. CharacterPage renders and functions correctly.

---

### Phase 3A: Full-Page Layout CSS

**File:** `src/styles/character.css` (extend existing file)

All new classes prefixed with `qb-charpage-` to avoid conflicts with existing sidebar styles.

**Key layout rules:**
```
.qb-charpage               - Full page container, flex column
.qb-charpage-topbar         - Back button + XP bar row
.qb-charpage-content        - Two-panel flex row (left/right)
.qb-charpage-left           - Left panel, flex column, ~40% width
.qb-charpage-right          - Right panel, flex column, ~60% width
```

**Design tokens to use:** All existing CSS variables from `variables.css` (`--qb-spacing-*`, `--qb-radius-*`, `--qb-transition-*`, `--background-secondary`, etc.).

**Sprite area:** The `CharacterIdentity` component with `spriteSize={200}` needs a larger sprite container. Add a `qb-charpage-sprite` modifier class that overrides the `80px` sidebar size to `200px`, with a more prominent class-colored glow/shadow.

---

### Phase 3B: RPG Button Theming

**File:** `src/styles/character.css` (same file, new section)

Style the action menu buttons with RPG aesthetic:
- Dark semi-transparent background (`rgba(0,0,0,0.3)` or `var(--background-secondary-alt)`)
- Subtle 1px border with slight inset shadow
- Icon centered above text label
- Hover state: slight scale transform (`1.03`), border glow using character class color
- Active/pressed state: inset shadow deepens
- Should look good in both light and dark Obsidian themes

---

### Phase 3C: Mobile Responsiveness

**File:** `src/styles/mobile.css` (extend existing file)

At mobile breakpoints (matching existing mobile.css patterns):
- Two-panel layout collapses to single column (left panel on top, right below)
- Paperdoll simplifies to compact grid (same as sidebar `EquipmentGrid`)
- Action menu becomes 3x2 or 2x3 compact grid
- Sprite size reduces to ~120px on mobile
- Consumables belt scrolls horizontally if needed

---

### Session 3 Testing

| Test | Expected | Status |
|------|----------|--------|
| `npm run build` passes | No TypeScript errors | |
| `npm run css:build` passes | CSS compiles without errors | |
| Light theme appearance | All elements visible, proper contrast | |
| Dark theme appearance | All elements visible, no white-on-white | |
| Action menu hover effects | Buttons glow/lift on hover | |
| Paperdoll slot styling | Tier colors, borders, empty state all styled | |
| Sprite glow effect | Class-colored glow around large sprite | |
| Consumables belt styling | Clean horizontal strip, quantity badges visible | |
| Mobile layout (resize window) | Single column, smaller sprite, compact grid | |
| Obsidian window resize | Layout adapts smoothly, no overflow/scroll issues | |
| `npm run deploy:test` | Final visual check in test vault | |

---

## File Change Summary

### New Files

| File | Purpose | Session |
|------|---------|---------|
| `src/components/character/CharacterIdentity.tsx` | Name, class, sprite, buffs | 1 |
| `src/components/character/ResourceBars.tsx` | HP/Mana/Stamina bars | 1 |
| `src/components/character/StreakDisplay.tsx` | Streak info | 1 |
| `src/components/character/EquipmentGrid.tsx` | Compact gear grid (sidebar) | 1 |
| `src/components/character/SetBonuses.tsx` | Set bonus display | 1 |
| `src/components/character/AttributeGrid.tsx` | 6 stats grid | 1 |
| `src/components/character/CombatStatsGrid.tsx` | Derived combat stats | 1 |
| `src/components/character/ClassPerkCard.tsx` | Class perk display | 1 |
| `src/components/character/CharacterStats.tsx` | Gold, quests, XP, achievements | 1 |
| `src/components/character/index.ts` | Barrel export | 1 |
| `src/components/character/EquipmentPaperdoll.tsx` | Paperdoll gear layout | 2 |
| `src/components/character/ActionMenu.tsx` | RPG action buttons | 2 |
| `src/components/character/ConsumablesBelt.tsx` | Quick-use consumables | 2 |
| `src/components/CharacterPage.tsx` | Full-page composition component | 2 |
| `src/views/CharacterView.tsx` | Obsidian ItemView wrapper | 2 |

### Modified Files

| File | Change | Session |
|------|--------|---------|
| `src/components/CharacterSheet.tsx` | Renamed to `CharacterSidebar.tsx`, rewritten to compose sub-components | 1 |
| `src/components/SidebarQuests.tsx` | Update import from `CharacterSheet` to `CharacterSidebar` | 1 |
| `src/views/constants.ts` | Add `CHARACTER_VIEW_TYPE` | 2 |
| `src/views/index.ts` | Export new view + constant | 2 |
| `main.ts` | Register view, add command, add `activateCharacterView()` | 2 |
| `src/styles/character.css` | Full-page layout, paperdoll, action menu styles | 3 |
| `src/styles/mobile.css` | Mobile responsiveness for full page | 3 |
| `src/styles/index.css` | No changes needed if character.css is already imported | 3 |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/CharacterSheet.tsx` | Renamed to `CharacterSidebar.tsx` |

---

## Key References

| Reference | Location | Why |
|-----------|----------|-----|
| Gear slot definitions | `src/models/Gear.ts` lines 17-58 | `ALL_GEAR_SLOTS`, `GEAR_SLOT_NAMES`, `GEAR_SLOT_ICONS` |
| Character model | `src/models/Character.ts` | Full character interface, `CLASS_INFO`, stat types |
| Consumable definitions | `src/models/Consumable.ts` | `CONSUMABLES`, `InventoryItem`, potion IDs |
| Combat stat derivation | `src/services/CombatService.ts` | `deriveCombatStats()` |
| Total stats calculation | `src/services/StatsService.ts` | `getTotalStats()`, `aggregateGearStats()`, `getStatCap()` |
| Gear tooltips | `src/utils/gearFormatters.ts` | Shared gear tooltip formatting |
| XP progress utility | `src/services/XPSystem.ts` | `getXPProgressForCharacter()` |
| Streak utilities | `src/services/StreakService.ts` | `getStreakDisplay()`, `getStreakMessage()` |
| Power-up utilities | `src/services/PowerUpService.ts` | `getClassPerkAsPowerUp()`, `getTimeRemaining()`, `isExpiringSoon()` |
| Character store | `src/store/characterStore.ts` | `selectActiveSetBonuses`, `selectInventory` |
| Set bonus formatting | `src/services/SetBonusService.ts` | `setBonusService.formatBonusEffect()` |
| Existing view pattern | `src/views/QuestBoardView.tsx` | Template for `CharacterView.tsx` |
| View constants | `src/views/constants.ts` | Where to add `CHARACTER_VIEW_TYPE` |
| Modal openers | `src/modals/InventoryModal.ts` | `showInventoryModal()` |
| Modal openers | `src/modals/BlacksmithModal.ts` | `showBlacksmithModal()` |
| Modal openers | `src/modals/SkillLoadoutModal.ts` | `showSkillLoadoutModal()` |
| Store modal | `src/modals/StoreModal.ts` | `StoreModal` class |
| Achievement hub | `src/modals/AchievementHubModal.ts` | Achievement hub modal |
| Progress dashboard | `src/modals/ProgressDashboardModal.ts` | Progress dashboard modal |
| Sprite hook | `src/hooks/useCharacterSprite.ts` | `useCharacterSprite()` |
| Save hook | `src/hooks/useSaveCharacter.ts` | `useSaveCharacter()` |
| Existing sidebar CSS | `src/styles/character.css` | Current sidebar styles to preserve |
| Fullpage CSS patterns | `src/styles/fullpage.css` | Reference for full-page layout patterns |
| Mobile CSS patterns | `src/styles/mobile.css` | Reference for mobile breakpoints |
| CSS variables | `src/styles/variables.css` | All design tokens |
