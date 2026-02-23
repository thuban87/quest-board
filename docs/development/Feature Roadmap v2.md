# Quest Board - Feature Roadmap v2

**Created:** 2026-01-27  
**Purpose:** Reconciled feature roadmap based on comprehensive codebase analysis  
**Previous Version:** [Feature Roadmap.md](./Feature%20Roadmap.md) (preserved for history)

---

## Overview

This document reflects the **actual state of implementation** based on a deep codebase analysis performed on 2026-01-27. All features are verified against the source code, not documentation claims.

> [!IMPORTANT]
> **Core Philosophy:** Productivity is the priority. Gaming elements enhance motivation but shouldn't overshadow the goal of getting real tasks done.

---

## Phase Summary

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Core Mechanics | ✅ Complete |
| Phase 2 | Polish & Training Mode | ✅ Complete |
| Phase 3A | Gear & Loot System | ✅ Complete |
| Phase 3B | Combat System | ✅ Complete |
| Phase 3C | Dungeon Exploration | ✅ Complete |
| Phase 4 | Skills, Bosses & AI | 🔄 In Progress |
| Phase 5 | Party System & Advanced | 📋 Future |

---

## ✅ Implemented Features (Verified in Code)

### Quest System
| Feature | Location | Notes |
|---------|----------|-------|
| Quest markdown files | `QuestService.ts` | YAML frontmatter with schemaVersion |
| Status workflow | `QuestStatus.ts` | Available → In Progress → Completed → Archived |
| Linked task files | `TaskFileService.ts` | Bidirectional sync, granular file watching |
| Task section parsing | `taskSectionsStore.ts` | `##`/`###` headers as mini objectives |
| Collapsible sections | `useCollapsedItems.ts` | Hide/show with task limits |
| Quest difficulty | `Quest.ts` | Easy/medium/hard affects loot |
| Recurring quests | `RecurringQuestService.ts` | Daily, weekdays, weekends, monthly, custom days |
| Quest templates | `TemplateService.ts` | User-defined templates in settings |
| Folder exclusion | Settings | Hide folders from Kanban |

### Kanban Board UI
| Feature | Location | Notes |
|---------|----------|-------|
| Full-page view | `FullKanban.tsx` | Primary interface |
| Sidebar view | `SidebarQuests.tsx` | Focused mode |
| Drag-and-drop | `DnDWrappers.tsx`, `useDndQuests.ts` | @dnd-kit |
| Filter/search | `FilterBar.tsx`, `filterStore.ts` | Category, priority, tags, type, date, text |
| Intra-column reorder | `useDndQuests.ts` | Drag within column |
| Quest cards | `QuestCard.tsx` | Progress, XP, tasks, dual file links |

### Character System
| Feature | Location | Notes |
|---------|----------|-------|
| 7 classes | `Character.ts` | Warrior, Paladin, Technomancer, Scholar, Rogue, Cleric, Bard |
| Class bonuses | `CLASS_INFO` | 15% XP for matching categories |
| Class perks | `CLASS_INFO` | Unique ability per class |
| Character creation | `CharacterCreationModal.ts/tsx` | Name, class, appearance |
| Training mode | `characterStore.ts` | Roman numerals I-X, 75 XP/level |
| Graduation | `characterStore.ts` | Transition to real mode at level X |
| Appearance | `CharacterAppearance` | Skin, hair, accessories |
| Sprite tiers | `SpriteService.ts` | 5 tiers based on level |

### XP & Leveling
| Feature | Location | Notes |
|---------|----------|---------|
| Level 1-40 | `XPSystem.ts` | 5-tier progressive thresholds aligned with `getLevelTier()` |
| XP per task | `useXPAward.ts` | Configurable per quest |
| Completion bonus | Quest frontmatter | Extra XP for finishing quest |
| Class XP bonus | `XPSystem.ts` | Applied in `calculateXPWithBonus` |
| Level-up modal | `LevelUpModal.ts` | Celebration with confetti (now triggers from battles too) |
| Category → stat | `CLASS_INFO.categoryStatMap` | XP growth feeds stats |

### Combat System
| Feature | Location | Notes |
|---------|----------|-------|
| Turn-based battles | `BattleService.ts` | Player vs monster |
| Combat stats | `CombatService.ts` | HP, mana, attack, defense, crit, dodge, block |
| Stamina system | `CombatService.ts` | Per-task stamina, caps at 50/day |
| HP/Mana tracking | `characterStore.ts` | Current and max values |
| Damage formulas | `CombatService.ts` | Physical/magic, variance, defense reduction |
| 19 base monsters | `monsters.ts` | 8 categories: beasts, undead, goblins, trolls, night elves, dwarves, dragonkin, aberrations |
| 20 boss monsters | `monsters.ts` | `isBoss: true`, signature skills, multi-hit/heal mechanics |
| Elite monsters | `combatConfig.ts` | 30% chance at L5+, name prefixes |
| Monster scaling | `MonsterService.ts` | Level-based with tier multipliers |
| Battle view | `BattleView.tsx` | Full combat UI, boss UI (pulsing border, shimmer HP) |
| Loot generation | `LootGenerationService.ts` | Post-victory rewards |
| Bounties | `BountyService.ts` | Combat encounters from quest completion |

### Dungeon Exploration
| Feature | Location | Notes |
|---------|----------|-------|
| Full dungeon UI | `DungeonView.tsx` | 1400+ lines |
| Room-based layout | `Dungeon.ts` | ASCII art with metadata |
| 4 tilesets | `TileRegistry.ts` | Cave, forest, dungeon, castle |
| Player movement | `DungeonView.tsx` | WASD, click-to-move (A*), D-pad |
| Tile interactions | `TileRegistry.ts` | Floor, wall, door, chest, portal, monster, trap, switch |
| Room persistence | `dungeonStore.ts` | Chests opened, monsters killed |
| Map modal | `DungeonMapModal.ts` | Exploration tracking |
| Built-in dungeons | `src/data/dungeons/` | 6 templates in individual files, registry in `index.ts` |
| User dungeons | `UserDungeonLoader.ts` | Markdown-based custom dungeons |
| Dungeon selection | `DungeonSelectionModal.ts` | Choose from available |
| Loot bias | `DungeonTemplate` | Slot-specific drops per dungeon |

### Gear & Loot
| Feature | Location | Notes |
|---------|----------|-------|
| 9 slots | `Gear.ts` | Head, chest, legs, boots, weapon, shield, accessory1-3 |
| 6 tiers | `Gear.ts` | Common → legendary |
| Armor types | `Gear.ts` | Cloth, leather, mail, plate |
| Weapon types | `Gear.ts` | Sword, axe, mace, dagger, bow, staff, wand, shield |
| Class restrictions | `Gear.ts` | Proficiency checks |
| Procedural names | `LootGenerationService.ts` | Tier prefix + base name |
| Gear stats | `GearStats` | Primary, secondary, combat bonuses |
| Equip/unequip | `characterStore.ts` | Inventory management |
| Set bonuses | `SetBonusService.ts` | AI-generated thematic per folder |
| Smelting | `SmeltingService.ts` | Combine 3 items → tier upgrade (same type = guaranteed same output) |
| Blacksmith | `BlacksmithModal.ts` | Smelting UI (currently free, gold cost needed) |
| Inventory | `InventoryModal.ts`, `InventoryManagementModal.ts` | Full gear management |

### Bounty System
| Feature | Location | Notes |
|---------|----------|-------|
| Bounty triggers | `BountyService.ts` | Chance on quest completion |
| 20+ templates | `BountyService.ts` | Keyword-matched to folders |
| AI descriptions | `BountyService.ts` | Gemini API cache |
| Monster matching | `HINT_TO_MONSTERS` | Themed encounters |
| Bounty modal | `BountyModal.ts` | Preview and accept |
| Bounty revive | `BountyReviveModal.ts` | Recovery option |

### Power-Up System
| Feature | Location | Notes |
|---------|----------|-------|
| Trigger system | `PowerUpService.ts` | 19 triggers with daily cooldowns |
| Effect types | `EFFECT_DEFINITIONS` | XP/stat multipliers, stat % boosts, gold multiplier, crit |
| Duration types | `PowerUpService.ts` | Hours, uses, permanent |
| Collision policies | `PowerUpService.ts` | Refresh, stack, ignore, extend, stack_refresh |
| Active power-ups | `Character.activePowerUps` | Array with expiry |
| Status bar | `StatusBarService.ts` | Shows active buffs |
| Tier pools | `TIER_POOLS` | T1 (7), T2 (3), T3 (1) — gated effects excluded |
| Stat % boosts | `StatsService.ts` | Applied after flat bonuses |
| Gold multiplier | `LootGenerationService.ts` | Applied to quest, combat, chest gold |

### Achievement System
| Feature | Location | Notes |
|---------|----------|-------|
| 32 defaults | `achievements.ts` | Level, streak, category, quest count |
| Progress tracking | `AchievementService.ts` | Auto-calculated |
| Unlock popups | `AchievementUnlockModal.ts` | With confetti |
| Hub modal | `AchievementHubModal.ts` | View all |
| Custom creation | `CreateAchievementModal.ts` | User-defined |
| Badge images | Settings | Custom badge folder |

### Streak System
| Feature | Location | Notes |
|---------|----------|-------|
| Daily tracking | `StreakService.ts` | Quest or task mode |
| Paladin shield | `StreakService.ts` | Protect streak once/week |
| On-load check | `checkStreakOnLoad` | Reset if days missed |
| UI display | `CharacterSheet.tsx` | Current streak |

### Recovery System
| Feature | Location | Notes |
|---------|----------|-------|
| Death penalty | `characterStore.ts` | Unconscious status |
| Recovery timer | `RecoveryTimerService.ts` | Timed recovery |
| Recovery options | `RecoveryOptionsModal.ts` | Short rest, long rest, revive |
| Revive potions | `characterStore.ts` | Instant recovery |

### Economy
| Feature | Location | Notes |
|---------|----------|-------|
| Gold currency | `Character.gold` | Earned from quests/combat |
| Store | `StoreModal.ts` | Buy consumables (5 sections, level-gating, smart tier display) |
| Consumables | `Consumable.ts` | 30 items: 6-tier HP/MP potions, stat elixirs, cleansing, enchantment oils, tactical, Phoenix Tear |

---

## ⚠️ Partially Implemented (Needs Verification/Completion)

| Feature | Current State | Needed |
|---------|---------------|--------|
| **Progressive Quest Reveal** | Task limits per section exist | Option to hide future sections |
| **Gemini API Integration** | Key setting exists, bounty/set/quest generation works | ✅ Complete |
| **Dual-Class Unlock** | Store action exists | No UI trigger at L25 |
| **Class Change** | Store action exists | No modal/UI |

---

## ❌ Features Confirmed NOT Implemented

For historical accuracy, these were listed in original roadmap Phase 3 but were never built:

| Feature | Disposition |
|---------|-------------|
| Tavern View (rest screen) | Future (Beyond Phase 5) |
| "Take Quest" Button | Nixed |
| Chronos Integration | Nixed |
| Switchboard Integration | Nixed |
| Gear Visual on Sprite | Replaced by Tier Sprite Choices |

> [!NOTE]
> All other "not implemented" features have been placed in Phase 4 or Phase 5.

---

## Phase 4: Power-Ups, AI Features & Game Systems

### Priority: Productivity-First Features

> [!TIP]
> Features that directly enhance task management should come before pure gaming features.

#### Tier 1: High Productivity Impact

| Feature | Description | Effort |
|---------|-------------|--------|
| **AI Quest Generation** | Convert task lists to quest files via Gemini | ✅ Complete |
| **Daily Note Integration** | Log completed quests to daily notes | ✅ Complete |
| ~~**Weekly Sprint View**~~ | ✅ **Progress Dashboard** - Activity history, stats, XP/gold tracking | ✅ Complete |
| **Quest Templates UI** | "The Scrivener's Desk" - Template gallery, builder, preview, create file, usage stats | ✅ Complete |
| **Daily Quest & Watched Folder** | Auto-create quests when files added to watched folders (Daily Notes, custom folders) | ✅ Complete |
| **Remote Asset Delivery** | CDN-hosted sprites/tiles via jsDelivr, download modal, first-install config, mobile sync | ✅ Complete |

#### Tier 2: Power-Ups & Testing (Early Phase 4)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Complete Power-Up Wiring** | Wire up remaining triggers: Hat Trick, Blitz, etc. | ✅ Complete |
| **Unit Testing (Achievements)** | Automated tests to verify achievement triggers | ✅ Complete |
| **Unit Testing (Power-Ups)** | Event-dependent testing framework for buffs | ✅ Complete |
| **Gear Click → Inventory Filter** | Click slot in CharacterSheet → open inventory filtered to slot | ✅ Complete |
| **Gear Comparison Tooltips** | WoW-style dual-panel tooltips showing item vs equipped stats | ✅ Complete |
| **Recent Acquisition Sort** | Sort inventory by "Recent" to find newly acquired items | ✅ Complete |
| **Balance Testing Infrastructure** | Battle logger + test character generator for systematic tuning | ✅ Complete |
| **Power-Up Rebalance** | Trigger cleanup, pool gating, new effects, % stat boosts, gold multiplier, daily cooldowns | ✅ Complete |

#### Tier 3: Game Systems (Enhance Motivation)

| Feature | Description | Effort |
|---------|-------------|--------|
| **AI Dungeon Generation** | Create dungeons from text prompts via Gemini | High | ✅ Complete
| **Accessory Special Abilities** | Unique effects: sneak past monsters, reset rest timer (cooldown), etc. | High | 🔄 Phase 1 Complete |
| **Character Titles** | Ecosystem of titles earned from various activities | Medium |
| **Dungeon Bosses** | Boss monsters at dungeon end | Medium | ✅ Complete
| **Skills/Abilities** | Class-specific moves using mana (Pokemon Gen 1 style) | ✅ Complete (Phase 9 Done, Deploy Pending) |
| **Tier Sprite Choices** | At tier-up, choose from 3 sprite looks | Medium |

#### Tier 4: Polish & UI

| Feature                    | Description                                                                                                             | Effort |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| **Class Change Modal**     | UI to change class (with XP cost)                                                                                       | Low    |
| **Dual-Class Unlock UI**   | Modal at L25 for secondary class                                                                                        | Low    |
| **Smelting Gold Cost**     | Charge gold based on tier of gear involved                                                                              | Low    |
| **Cross-Class Gear Drops** | Get gear types you can't wear (for smelting, dual-class prep)                                                           | Low    |
| **Gear Reward Planning**   | Define loot tables for raids and special quests                                                                         | Medium |
| **Enrage System**          | Penalty for stale quests                                                                                                | Low    |
| **Export Stats**           | Share progress                                                                                                          | Low    |
| **Character Edit Modal**   | Edit existing character (name, appearance) without resetting progress                                                   | Low    |
| **Create quest from file** | Allow for creating a quest from a file, via a context menu in the file tree, a command palette and editor context menu. | ✅ Complete |

---

## Phase 5+: Future Vision

### Party System
- Player party (2-4 characters fighting together)
- Monster party support (multiple enemies)
- Party member acquisition methods
- See: `docs/Party System - Early Planning.md`

### Raids
- Multi-boss dungeons
- Phase markers throughout
- Final boss with special mechanics

### Skill Trees (Productivity-Focused)
- Quest dependencies (complete X to unlock Y)
- Visual tree/graph
- Encourages long-term goal planning
- **This aligns with productivity goals**

### Analytics Dashboard
- Historical completion trends
- XP over time
- Category breakdown
- Streak history


### Multi-Device Sync
- Conflict resolution for concurrent edits
- Cloud backup options

### Import/Export Data
- Full data backup and restore
- Migrate between vaults

### Dual-Class Visual Blending
- Combine sprite elements from both classes
- Must implement Dual-Class first

---

## Future Vision (Beyond Phase 5)

### Daily Quest & Watched Folder v2 Enhancements
- **Active Watcher Indicator**: Badge in Scroll Library showing "🟢 Daily Quest Active" when watcher running
- **Vacation/Pause Mode**: Temporarily disable folder watchers without deleting templates
- **Multiple Daily Quest Templates**: Allow power users to set up multiple Daily Quest templates

### Progressive Quest Reveal
- Hide quest sections on Kanban until previous complete
- Hide future quest sections in linked task files
- "Fog of war" style reveal as tasks complete

### Tavern View
- Rest area UI for recovery and buffs
- Social/tavern atmosphere

## Testing Values to Revert Before Release

| Setting | Current | Production | Location |
|---------|---------|------------|----------|
| Daily Stamina Cap | 500 | 50 | `CombatService.ts` → `awardStamina()` |
| Bounty Slider Max | 100% | 20% | `settings.ts` → slider limits |
| Set Piece Drop Rate | 40% | 33% | `LootGenerationService.ts` |

---

## Documentation Ecosystem Proposal

### README.md Updates
Current README is outdated. Needs:
- Feature overview matching actual implementation
- Screenshots of key views
- Quick start guide
- Configuration options summary

### Proposed User Documentation

**Location:** `wiki/` folder in GitHub repo (accessible via BRAT)

```
wiki/
├── Getting Started.md        # Installation, first character, first quest
├── Quest System.md           # How quests work, frontmatter, linked files
├── Character Classes.md      # All 7 classes, bonuses, perks
├── Combat Guide.md           # Battle system, monsters, stamina
├── Dungeon Exploration.md    # How dungeons work, controls, loot
├── Gear & Equipment.md       # Slots, tiers, set bonuses, smelting
├── Power-Ups & Buffs.md      # Triggers, effects, duration
├── Achievements.md           # Default list, custom creation
├── Recurring Quests.md       # Templates, recurrence rules
├── Custom Dungeons.md        # Markdown dungeon format
└── settings/                 # Settings documentation collection
    ├── Settings Overview.md
    ├── General Settings.md
    ├── Combat Settings.md
    ├── Gear Settings.md
    └── API Settings.md
```

All docs should interlink appropriately for easy navigation.

### Settings Documentation
Settings are complex enough to warrant their own collection:
- Every setting explained with context
- Recommended values for different playstyles
- What each option affects in practice

---

## ✅ Obsidian Guidelines Alignment — Complete (2026-02-19)

Pre-BRAT release audit addressing all community plugin guideline requirements. Completed across 13 phases in a single day.

| Phase | Work | Impact |
|-------|------|--------|
| 1 | LICENSE, versions.json, manifest fixes, import cleanup | Release blockers resolved |
| 2 | Production values reset | ⏸️ Deferred until public release |
| 3 | `confirm()` → ConfirmModal (9 sites, 6 files) | No native browser dialogs |
| 4 | `vault.modify()` → `vault.process()` (7 sites); `fetch()` → `requestUrl()` (5 sites) | Atomic file I/O, proper network API |
| 5 | `innerHTML` → DOM API (13 sites, 5 files) | XSS surface eliminated |
| 6 | `vault.on()` → `registerEvent()` (9 registrations, 5 files) | Auto-cleanup on plugin unload |
| 7 | `createEl('h*')` → `setHeading()` (13 headings in settings) | Native Obsidian heading style |
| 8-12 | `base.css` audit + retirement (33 dead selectors removed) | CSS namespace clean |
| 13 | `@keyframes` renaming (12 keyframes, 3 CSS files) | Full `qb-` namespace compliance |

**Key deliverables:** ConfirmModal class, 142 net lines removed in Phase 4, base.css fully retired, zero unprefixed CSS selectors/keyframes remaining.

**Docs:** [Alignment Plan](launch-considerations/01%20-%20Obsidian%20guidelines%20alignment%20plan.md) | [Session Log](launch-considerations/Obsidian%20Alignment%20Session%20Log.md)

## ✅ Expanded Consumables — Complete (2026-02-19 → 2026-02-21)

Overhaul of the consumable system from 11 items to 30, adding stat elixirs, cleansing items, enchantment oils, tactical consumables, and Phoenix Tear. 291 new tests written across 5 sessions.

| Phase | Status | Notes |
|-------|--------|-------|
| 1: Potion Rework + Model Foundation | ✅ Complete | 30 items, 6-tier potions, store rewrite, revive_potion bugfix |
| 1.5: Tests — Potion Rework | ✅ Complete | 89 tests (62 model + 27 store) |
| 2: Simple Combat Consumables | ✅ Complete | ConsumableUsageService, BattleView integration, ConsumablePicker expansion |
| 2.5: Tests — Simple Combat | ✅ Complete | 24 tests, all passing |
| 3: Complex Combat Consumables | ✅ Complete | Buff system, enchantment procs, Phoenix Tear, stat elixirs, 2 bug fixes |
| 3.5: Tests — Complex Combat | ✅ Complete | 77 tests across 5 files, flaky monster test fix |
| 4: UI Polish & Loot Tables | ✅ Complete | Categorized picker, HP/MP bars in inventory, expanded loot tables with per-tier consumable drops |
| 4.5: Tests — UI Polish & Loot | ✅ Complete | 48 tests (30 LootGen + 13 ConsumablePicker + 5 StoreModal), 604 total suite |

**Docs:** [Implementation Guide](feature-planning/in-review/Expanded%20Consumables%20Implementation%20Guide.md) | [Session Log](Expanded%20Consumables%20Session%20Log.md)

## ✅ Accessories & Special Abilities — Complete (2026-02-21 → 2026-02-22)

Phase 4 expansion adding 52 curated accessories with passive abilities, boss-specific drops, tiered drop system, and rich tooltip comparisons. 8 sessions across 2 days.

| Phase | Status | Notes |
|-------|--------|-------|
| 1: Data Foundation & Models | ✅ Complete | 52 templates, schema v6 migration, model updates |
| 1.5: Tests — Data Foundation | ✅ Complete | 60 tests, 664 total suite (0 regressions) |
| 2: AccessoryEffectService | ✅ Complete | 9 grouped methods, pure function resolver |
| 2.5: Tests — AccessoryEffectService | ✅ Complete | 68 tests, 732 total suite (0 regressions) |
| 3: Drop Integration | ✅ Complete | Weighted slot selection, boss loot tables (20 bosses), smelting guard, quest tier gating, 3 feedback fixes |
| 3.5: Tests — Drop Integration | ✅ Complete | 64 tests (40 accessory-drops + 24 boss-loot-table), 796 total suite |
| 4a: Combat & Loot Integration | ✅ Complete | CombatService, BattleService, LootGen, StatsService, tooltips, smelting, consumable healing, inventory UX |
| 4b: Meta-Game Integration | ✅ Complete | XP multipliers, streak shields, HP/Mana clamping, stamina cap, sell multiplier, dungeon map reveal, settings number input |
| 4c: Tests — Consumer Integration | ✅ Complete | 33 integration tests, React testing infra (@testing-library/react + jsdom), 829 total suite |
| 5: Manual Testing & Fixes | ✅ Complete | Phoenix Feather revive, context-aware tooltips, rich character sheet tooltips, all 25 test matrix items passed |

**Docs:** [Implementation Plan](feature-planning/polished-and-ready/Accessories%20%26%20Special%20Abilities%20Brainstorm.md) | [Session Log](feature-planning/polished-and-ready/Accessories%20Session%20Log.md)

---

## Architecture Notes

### File Counts (for reference)
- **Services:** 25 files
- **Components:** 11 files  
- **Modals:** 24 files
- **Stores:** 8 files
- **Models:** 10 files
- **Data:** 6 files

### Key Architectural Decisions
- Quests stored as markdown (user-editable, human-readable)
- Character/settings via `loadData()`/`saveData()` (plugin data)
- Zustand for React state management
- Services handle business logic, components handle UI
- CSS modularized in `src/styles/` (bundled at build)

---

**Last Updated:** 2026-02-22 (Accessories Phase 5 complete — manual testing passed, Phoenix Feather revive, rich tooltips on character sheet, all debug logs cleaned)
