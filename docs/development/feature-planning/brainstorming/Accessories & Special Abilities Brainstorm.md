# Accessories & Special Abilities Implementation Plan

**Status:** 🔲 TODO  
**Estimated Sessions:** 10–12 (Phases 1–5 + test phases + manual QA)  
**Created:** 2026-02-10  
**Last Updated:** 2026-02-21 (Post-Review v3 — All Decisions Locked)  
**Companion Session Log:** [Accessories Session Log](../Accessories%20Session%20Log.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Design Decisions](#key-design-decisions)
3. [Architecture & Data Structures](#architecture--data-structures)
4. [Accessory Data Reference](#accessory-data-reference)
5. [Phase 1: Data Foundation & Models](#phase-1-data-foundation--models)
6. [Phase 1.5: Tests — Data Foundation](#phase-15-tests--data-foundation)
7. [Phase 2: AccessoryEffectService](#phase-2-accessoryeffectservice)
8. [Phase 2.5: Tests — AccessoryEffectService](#phase-25-tests--accessoryeffectservice)
9. [Phase 3: Loot Integration](#phase-3-loot-integration)
10. [Phase 3.5: Tests — Loot Integration](#phase-35-tests--loot-integration)
11. [Phase 4a: Consumer Integration — Combat & Loot](#phase-4a-consumer-integration--combat--loot)
12. [Phase 4b: Consumer Integration — Meta-Game](#phase-4b-consumer-integration--meta-game)
13. [Phase 4c: Tests — Consumer Integration](#phase-4c-tests--consumer-integration)
14. [Phase 5: Manual Testing & Balance](#phase-5-manual-testing--balance)
15. [Plan Summary](#plan-summary)
16. [File Change Summary](#file-change-summary)
17. [Verification Checklist](#verification-checklist)
18. [Review Decisions Log](#review-decisions-log)

---

## Overview

### Problem Statement

Accessories currently occupy 3 gear slots (`accessory1/2/3`) but are procedurally generated stat sticks with no special abilities and limited drop avenues. They feel generic compared to primary gear and offer no meaningful build choices.

### Goals

- Introduce a **4-tier accessory system** (T1 auto-generated, T2–T4 curated with abilities)
- Add **50 curated accessories** (30 general + 20 boss-specific) with unique passive abilities
- Build a centralized **`AccessoryEffectService`** to resolve abilities across all game systems
- Implement a generalized **boss loot table system** for thematic boss drops
- Wire abilities into combat, XP, gold, loot, dungeons, smelting, and streaks

### Non-Goals

- ❌ Active/triggered abilities (only passive/conditional for now)
- ❌ Accessory crafting or upgrading
- ❌ Accessory set bonuses (future consideration)
- ❌ Public release polish (BRAT-only for now)

---

## Key Design Decisions

| Decision | Answer | Why |
|----------|--------|-----|
| Generation model | T1 auto-generated, T2–T4 curated | Procedural variety at low levels, memorable abilities at high levels |
| Service architecture | Pure function `AccessoryEffectService` — accepts `EquippedGearMap` as param | Testable, no store coupling, enables natural React `useMemo` caching |
| API style | Grouped/parameterized methods (7 methods cover ~38 effect types) | Keeps API surface small; adding variants requires zero new methods |
| Serialization | Template Reference Model — `templateId?: string` on `GearItem`, runtime lookup | Balance patches auto-update all player items, no data migration needed |
| Drop model | Accessories are **regular gear drops** in the same pool, with lower slot weight (0.4 vs 1.0) | Prevents inventory bloat, simplifies loot pipeline |
| Smelting | Accessories **cannot be smelted** (any tier) | Eliminates curated item destruction edge cases |
| Training mode | Accessories **completely disabled** | Keeps training mode simple and focused |
| Boss item uniqueness | One per character — check inventory + equipped before dropping | Prevents farming duplicates; selling lets you re-farm |
| Streak Shield + Paladin | Stacks additively (Paladin+Charm = 2 forgivenesses/week) | Non-Paladins get a weaker version of the perk; Paladins still benefit |
| Map reveal target | `DungeonMapModal` (full map), NOT dead `Minimap.tsx` | `Minimap.tsx` has zero imports — confirmed dead code |
| Unequip clamping | Required for HP/Mana/Stamina-boosting accessories | Prevents retaining buffed values without the item |
| Boss accessories location | Live in `accessories.ts` alongside general curated items | Centralized. Non-accessory uniques (weapons/armor) stay in `uniqueItems.ts` |

---

## Architecture & Data Structures

### Data Flow

```
accessories.ts (data) → AccessoryEffectService (pure resolver) → Game systems (consumers)
```

### AccessoryEffectService — Grouped API

All methods accept `EquippedGearMap` as first parameter (pure, not store-coupled):

```typescript
getGoldMultiplier(gear, source: 'quest' | 'combat' | 'dungeon' | 'daily' | 'sell' | 'all'): number
getXPMultiplier(gear, source: 'quest' | 'combat' | 'dungeon' | 'recurring' | 'first_daily' | 'all'): number
getCombatBonus(gear, type: 'crit' | 'dodge' | 'block' | 'physDef' | 'magDef' | 'maxHp' | 'maxMana' | 'critDamage'): number
getConditionalBonus(gear, type): number  // HP-threshold bonuses
getLootBonus(gear, type: 'gearTier' | 'gearDrop' | 'setChance' | 'smeltDouble'): number
getUtilityBonus(gear, type: 'staminaCap' | 'potionHealing' | 'streakShield' | 'bossConsumable'): number
getDungeonBonus(gear, type: 'mapReveal' | 'goldenChest' | 'autoRevive'): number | boolean
```

**Adding a new variant** of an existing category = data entry only, zero method changes.  
**Adding a new category** = one new method + one consumer call.

### GearItem Interface Changes

```typescript
// Add to existing GearItem interface in Gear.ts:
templateId?: string;  // Template ID for curated accessories (T2+). T1 auto-generated items omit this.
```

### BossLootTable Interface

```typescript
interface BossLootTable {
    dropChance: number;       // 0.0–1.0
    items: string[];          // Template IDs — any gear slot, not just accessories
}

// Added to MonsterTemplate:
bossLootTable?: BossLootTable;
```

### Accessory Drop Weights (In Existing Gear Pool)

> [!IMPORTANT]
> Accessories are **regular gear drops** — rolled in the same pool as primary gear. NO separate roll.

| Slot Category | Weight |
|--------------|--------|
| Primary (head, chest, legs, boots, weapon, shield) | 1.0 each |
| Accessory (accessory1, accessory2, accessory3) | 0.4 each |

### Level-Gated Tier Pool

| Player Level | T1 | T2 | T3 | T4 |
|-------------|----|----|----|----|
| 1–5 | 100% | 0% | 0% | 0% |
| 6–15 | 80% | 20% | 0% | 0% |
| 16–25 | 55% | 35% | 10% | 0% |
| 26–35 | 30% | 35% | 25% | 10% (boss only) |
| 36–40 | 15% | 30% | 30% | 25% |

### Stacking Rules

| Bonus Type | Rule | Example |
|-----------|------|---------|
| Gold bonuses | Additive | +10% + +25% = +35% |
| XP bonuses | Additive | +10% + +15% = +25% |
| Flat combat (crit, dodge, block) | Additive | +5% + +8% = +13% |
| % combat (defense, mana, HP) | Additive with each other, multiplicative with base | base 100 × 1.25 |
| Streak Shield | Additive with Paladin | Paladin+Charm = 2/week |
| Phoenix Feather | Non-stacking | 1 revive/dungeon (tracked in `dungeonStore`) |
| Map reveal | Non-stacking | One instance active |

### Boss Kill Loot Flow

1. Roll against `bossLootTable.dropChance` (80–90%)
2. **Uniqueness check:** Does character already own this item (inventory OR equipped)? → skip, give extra gold
3. Select random item from `items[]`
4. Resolve template from `accessories.ts` or `uniqueItems.ts`
5. Add to loot rewards

---

## Accessory Data Reference

> [!NOTE]
> This section is a **data reference** for building `accessories.ts`. It is not an implementation phase.

### Accessory Tier System

| Tier | Name | Generation | Stats | Ability | Availability |
|------|------|-----------|-------|---------|-------------|
| **T1** | Common Accessory | Auto-generated (procedural) | Reduced (~65% of normal) | ❌ None | Always |
| **T2** | Enchanted Accessory | Curated (data file) | Reduced stats + ability | Passive stat modifiers | Level 6+ |
| **T3** | Rare Accessory | Curated (data file) | Moderate stats + ability | Conditional bonuses | Level 16+ |
| **T4** | Legendary Accessory | Curated (data file) | Varies + ability | Powerful effects | Boss-only until level 26+ |

### The 30 Curated Accessories (T2–T4)

Distribution: 18 T2 / 8 T3 / 4 T4. Stats listed for mid-tier (~Level 15). Abilities **do not scale**.

#### 💰 Economy & Gold — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 1 | Merchant's Signet | Ring | +8 CHA, +4 WIS | +10% gold from quest completions |
| 2 | Coin Collector's Token | Charm | +6 CHA | +15% gold from monster kills |
| 3 | Miser's Pendant | Amulet | +10 WIS | +20% sell value on gear |
| 4 | Fortune Cookie Charm | Charm | +4 CHA, +4 WIS | +10% gold from dungeon chests |
| 5 | Taxman's Ring | Ring | +6 INT, +6 CHA | Doubles gold from daily quests |
| 6 | Alchemist's Purse | Charm | — | +25% gold from ALL sources |

#### ⚔️ Combat — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 7 | Berserker's Band | Ring | +12 STR | +5% crit chance |
| 8 | Guardian's Talisman | Amulet | +10 CON, +4 DEF | +8% block chance |
| 9 | Windrunner's Anklet | Charm | +10 DEX | +6% dodge chance |
| 10 | Vampire's Fang | Ring | +8 STR, +4 DEX | Heal 5% of damage dealt |
| 11 | Ironhide Brooch | Amulet | +8 CON | +10% physical defense |
| 12 | Spell Ward Pendant | Amulet | +8 WIS, +6 INT | +10% magic defense |

#### 📈 XP & Progression — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 13 | Scholar's Monocle | Charm | +8 INT, +6 WIS | +10% XP from quest completions |
| 14 | Battle Medallion | Amulet | +6 STR, +6 CON | +15% XP from combat victories |
| 15 | Explorer's Compass | Charm | +6 WIS | +15% XP from dungeon exploration |
| 16 | Apprentice's Loop | Ring | +10 INT | +5% bonus to stat point gains |
| 17 | Dedicated Worker's Pin | Charm | +4 CON, +4 WIS | +20% XP from recurring quests |
| 18 | Early Bird Brooch | Charm | +6 DEX | +10% XP for first quest each day |

#### 🎁 Loot & Drop Rate — T3 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 19 | Lucky Rabbit's Foot | Charm | +6 CHA, +4 DEX | +5% chance to roll Master+ tier gear |
| 20 | Treasure Hunter's Loop | Ring | +8 CHA | +10% gear drop chance from quests |
| 21 | Blacksmith's Favor | Ring | +6 STR | 15% chance smelting jumps TWO tiers |
| 22 | Collector's Monocle | Charm | — | +10% chance for set pieces |

#### 🛡️ Survival & Utility — T3 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 23 | Healer's Crystal | Amulet | +10 WIS | +20% potion healing |
| 24 | Stamina Sash | Charm | +6 DEX, +4 CON | +5 daily stamina cap |
| 25 | Mana Wellspring Ring | Ring | +10 INT | +15% maximum mana |
| 26 | Streak Shield Charm | Charm | +4 CHA, +4 WIS | Forgives 1 missed streak day/week |

#### 🔥 Legendary — T4 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 27 | Phoenix Feather | Charm | +6 CON | Auto-revive at 25% HP once per dungeon |
| 28 | Magpie's Brooch | Charm | +4 CHA | Guaranteed consumable from boss kills |
| 29 | Prospector's Pendant | Amulet | +6 WIS, +4 INT | +10% golden chest chance |
| 30 | Cartographer's Lens | Charm | +8 WIS | Reveals full dungeon map on entry |

### 20 Boss-Specific Accessories

Each boss gets one thematic accessory that can ONLY drop from that specific boss.

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Alpha Wolf | Fang of the Pack Leader | Ring | T3 | +8% crit when HP > 75% |
| Grizzled Ancient | Hibernation Stone | Amulet | T3 | +20% HP potion effectiveness |
| Rat King | Crown of the Swarm | Charm | T4 | +20% gold from ALL monster kills |
| Bone Collector | Scythe Fragment Pendant | Amulet | T3 | +10% physical defense |
| Lich | Phylactery Shard | Charm | T4 | +15% max mana, +10% magic defense |
| Wraith Lord | Spectral Oath Ring | Ring | T3 | +8% dodge chance |
| Goblin Warlord | Warlord's War Band | Ring | T2 | +5% physical defense, +5% attack |
| Bugbear Tyrant | Tyrant's Knuckle Ring | Ring | T3 | +10% crit damage |
| Mountain Troll | Stoneblood Amulet | Amulet | T3 | +15% max HP |
| Swamp Horror | Toxic Fang Charm | Charm | T3 | 10% chance to poison on attack |
| Shadow Assassin | Shade's Step Anklet | Charm | T4 | +12% dodge, +8% crit |
| Dark Matriarch | Matriarch's Dark Sigil | Ring | T4 | +15% magic defense, +10% combat XP |
| Ironforge Champion | Ironforge Seal | Ring | T3 | +15% physical defense, +5% block |
| Rune Berserker | Runestone Pendant | Amulet | T3 | +10% attack when HP < 50% |
| Elder Drake | Molten Scale Charm | Charm | T3 | +10% fire resist, +5% defense |
| Wyvern Matriarch | Venomtip Fang Ring | Ring | T3 | 8% chance to poison on attack |
| Ancient Dragon | Heart of the Wyrm | Amulet | T4 | +10% ALL stats (THE chase item) |
| The Devourer | Greedy Maw Token | Charm | T3 | +15% gear drop, +15% chest gold |
| Beholder | All-Seeing Eye | Charm | T4 | Reveal dungeon map, +10% magic def |
| Void Spawn | Void Shard | Amulet | T4 | +10% all XP, -5% max HP trade-off |

### T1 Auto-Generated Name Pool

T1 accessories have no abilities — just reduced stats generated procedurally.

**Rings 💍** — Prefixes: Copper, Iron, Silver, Gold, Bronze, Tin, Brass, Steel, Cobalt, Rusted, Tarnished, Polished, Rough-Cut, Scratched, Dull, Gleaming, Worn, Battered, Chipped, Simple. Base: Ring, Band, Loop, Signet, Circlet, Coil, Hoop, Spiral, Twist. Suffixes (~30%): of Fortitude, of Precision, of Endurance, of Cunning, of Focus, of Resilience, of Vigor, of Tenacity, of Grit, of Insight.

**Amulets 📿** — Prefixes: Wooden, Stone, Crystal, Jade, Obsidian, Amber, Bone, Coral, Glass, Quartz, Pewter, Ivory, Onyx, Opal, Turquoise, Weathered, Cracked, Faded, Dented, Plain. Base: Amulet, Pendant, Necklace, Talisman, Medallion, Locket, Torc, Gorget, Chain. Suffixes (~30%): of Protection, of Warding, of Shielding, of Vitality, of Calm, of Resolve, of Steadiness, of Balance, of Grounding, of Shelter.

**Charms 🔮** — Prefixes: Lucky, Old, Dusty, Faded, Cracked, Bent, Tiny, Strange, Curious, Odd, Worn, Battered, Forgotten, Found, Salvaged, Crude, Rough, Patchwork, Makeshift, Scavenged. Base: Charm, Trinket, Token, Bauble, Fetish, Talisman, Ornament, Keepsake, Relic. Suffixes (~30%): of Luck, of Chance, of Fortune, of Fate, of Whimsy, of Hope, of Perseverance, of Patience, of Curiosity, of Wonder.

Pattern: `[Prefix] [Base Name] [Suffix?]` → "Iron Band of Precision", "Cracked Pendant", "Lucky Trinket of Chance"

~5,940 total T1 name combinations.

---

## Phase 1: Data Foundation & Models

**Estimated Time:** 2–2.5 hours  
**Prerequisite:** None  
**Goal:** Define the complete type system, create the accessory data file, and update all models.

### Tasks

#### `src/models/Gear.ts` [MODIFY]
- Add `templateId?: string` to `GearItem` interface

#### `src/models/Monster.ts` [MODIFY]
- Add `BossLootTable` interface (`dropChance`, `items[]`)
- Add `bossLootTable?: BossLootTable` to `MonsterTemplate`

#### `src/models/Character.ts` [MODIFY]
- Add `totalShieldsUsedThisWeek?: number` field (generalizes existing Paladin `shieldUsedThisWeek` boolean)

#### `src/data/accessories.ts` [NEW]
- Define `AccessoryTemplate` interface with `templateId`, `name`, `slot`, `tier`, `stats`, `effectType`, `effectValue`
- All 30 curated general accessories
- All 20 boss-specific accessories
- Migrate Ring of the Completionist and Amulet of Dedication from `uniqueItems.ts`
- Export `ACCESSORY_TEMPLATES` registry, `getAccessoryTemplate()`, `getAccessoryTemplatesByTier()` helpers
- T1 name pools (prefixes, bases, suffixes per type)
- ~650 lines

#### `src/data/uniqueItems.ts` [MODIFY]
- Remove Ring of the Completionist and Amulet of Dedication definitions (moved to `accessories.ts`)
- Keep all non-accessory uniques (Goblin King's Crown, Aegis, etc.)

#### Tech Debt
- Existing `uniqueDropId` on `Monster.ts` is now superseded by `bossLootTable` but not yet removed. To be cleaned up after confirming all boss references are migrated.

---

## Phase 1.5: Tests — Data Foundation

**Estimated Time:** 1.5–2 hours  
**Prerequisite:** Phase 1  
**Coverage Target:** ≥80% line, ≥80% branch for `accessories.ts`

### Tasks

#### `test/accessories-data.test.ts` [NEW]

**Key test cases:**
- All 50+ templates have valid, non-empty `templateId`, `name`, `slot`, `tier`
- No duplicate `templateId` values across all templates
- All `effectType` values are valid (cross-reference against `AccessoryEffectService` handler registry)
- Stat values are within expected ranges (no negatives except intentional trade-offs like Void Shard's HP penalty)
- All boss accessories reference valid boss template IDs in `monsters.ts`
- T1 name pool arrays are non-empty and contain no duplicates
- `getAccessoryTemplate()` returns correct template by ID
- `getAccessoryTemplate()` returns `null` for unknown IDs
- `getAccessoryTemplatesByTier()` returns correct count per tier

**Command:** `npx vitest run test/accessories-data.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## Phase 2: AccessoryEffectService

**Estimated Time:** 2–2.5 hours  
**Prerequisite:** Phase 1  
**Goal:** Build the central resolver with grouped/parameterized API. Pure functions only.

### Tasks

#### `src/services/AccessoryEffectService.ts` [NEW]

- Extract equipped accessories from `EquippedGearMap` (filter `accessory1/2/3` slots)
- Look up `templateId` → resolve ability from `accessories.ts`
- Implement 7 grouped methods:
  - `getGoldMultiplier(gear, source)` — aggregates all gold-related effects, returns multiplier
  - `getXPMultiplier(gear, source)` — aggregates all XP-related effects, returns multiplier
  - `getCombatBonus(gear, type)` — aggregates combat stat bonuses (crit, dodge, block, def, HP, mana, crit damage)
  - `getConditionalBonus(gear, type, currentHP, maxHP)` — threshold-based bonuses (e.g., +8% crit when HP > 75%)
  - `getLootBonus(gear, type)` — gear tier upgrade, drop chance, set piece, smelt double
  - `getUtilityBonus(gear, type)` — stamina cap, potion healing, streak shield, boss consumable
  - `getDungeonBonus(gear, type)` — map reveal, golden chest, auto-revive
- Handle edge cases: T1 items with no `templateId` (return 0/false), empty gear map, null slots
- ~200 lines

#### Tech Debt
- No memoization yet. If performance becomes an issue, `useMemo` at the component level handles it since these are pure functions.

---

## Phase 2.5: Tests — AccessoryEffectService

**Estimated Time:** 2–2.5 hours  
**Prerequisite:** Phase 2  
**Coverage Target:** ≥80% line, ≥80% branch for `AccessoryEffectService.ts`

### Tasks

#### `test/accessory-effect-service.test.ts` [NEW]

**Key test cases:**
- **Gold multiplier:** single accessor returns correct value, multiple accessories stack additively, `source: 'all'` includes everything, no accessories returns 0
- **XP multiplier:** same stacking tests per source type, `'first_daily'` only applies once
- **Combat bonus:** each type (crit, dodge, block, etc.) returns correct aggregate, physical+magic defense sum correctly
- **Conditional bonus:** returns 0 when condition not met (e.g., HP < 75% for crit bonus), returns value when met
- **Loot bonus:** smelt double returns chance value, gear tier upgrade stacks
- **Utility bonus:** streak shield returns count (1 for Charm, stacks if multiple sources), stamina cap returns flat bonus
- **Dungeon bonus:** map reveal returns boolean, auto-revive returns boolean, golden chest returns percentage
- **Edge cases:** T1 item with no `templateId` contributes nothing, empty `EquippedGearMap`, slots with `null` items, invalid `templateId`

**Command:** `npx vitest run test/accessory-effect-service.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## Phase 3: Loot Integration

**Estimated Time:** 2.5–3 hours  
**Prerequisite:** Phase 2  
**Goal:** Wire accessories into the existing gear drop pool, implement boss loot tables, and add guards.

### Tasks

#### `src/services/LootGenerationService.ts` [MODIFY]
- Add accessory slots (`accessory1/2/3`) to the gear slot pool with weight 0.4 (vs 1.0 for primary)
- Add **training mode guard:** if `character.isTrainingMode`, exclude accessory slots from pool
- Level-gated tier selection when accessory slot is picked (T1/T2/T3/T4 weights by level)
- When T2+ tier rolls, select a random curated template from `accessories.ts` for that tier
- When T1 rolls, generate procedurally using T1 name pools
- Add `bossLootTable` handling in `generateCombatLoot()`:
  - Roll against `dropChance`
  - **Uniqueness check:** scan `character.inventory` and `character.equippedGear` for matching `templateId`
  - If already owned → fall back to extra gold
  - If not owned → resolve template from `accessories.ts` or `uniqueItems.ts`, create item
- ~100 lines changed

#### `src/data/monsters.ts` [MODIFY]
- Add `bossLootTable` to all 20 boss templates, referencing accessory template IDs
- Boss-specific accessories have 80–90% drop chance
- Each boss loot table contains 1–3 items (thematic to that boss)
- ~60 lines added

#### `src/services/SmeltingService.ts` [MODIFY]
- Add accessory smelting block in `canSmelt()`:
  ```typescript
  if (items.some(i => i.slot.startsWith('accessory')))
      return { valid: false, error: 'Accessories cannot be smelted' };
  ```
- Add optional `doubleTierChance?: number` parameter to `smelt()` for Blacksmith's Favor hook
- ~15 lines

#### `src/modals/GearSlotMappingModal.ts` [MODIFY]
- Consolidate `accessory1/2/3` checkboxes into single "Accessories" checkbox (UI-only toggle, internally sets all 3)
- ~20 lines

#### `src/settings.ts` [MODIFY]
- Update `DEFAULT_QUEST_SLOT_MAPPING` to include accessory slots with appropriate defaults
- ~10 lines

#### Tech Debt
- Old `uniqueDropId` field on `MonsterTemplate` still exists. Remove after confirming all boss references use `bossLootTable`.

---

## Phase 3.5: Tests — Loot Integration

**Estimated Time:** 2–2.5 hours  
**Prerequisite:** Phase 3  
**Coverage Target:** ≥80% line, ≥80% branch for new loot code

### Tasks

#### `test/accessory-drops.test.ts` [NEW]

**Key test cases:**
- Accessory slots appear in gear pool with weight 0.4
- Accessory slots excluded when `isTrainingMode === true`
- Tier gating respects level brackets (level 1 → T1 only, level 30 → T1–T4)
- T1 generates procedural name (prefix + base + optional suffix)
- T2+ resolves curated template from `accessories.ts`
- Generated T1 accessory has no `templateId`
- Generated T2+ accessory has correct `templateId`

#### `test/boss-loot-table.test.ts` [NEW]

**Key test cases:**
- All 20 boss templates have valid `bossLootTable` with `dropChance` in [0, 1]
- All item IDs in boss loot tables resolve to valid templates
- Boss loot drops when roll < `dropChance`
- Boss loot skipped when roll ≥ `dropChance`
- **Uniqueness enforcement:** item skipped if character already owns it (in inventory)
- **Uniqueness enforcement:** item skipped if character already has it equipped
- Extra gold awarded when boss item skipped due to ownership
- Smelting block rejects accessories with correct error message
- Blacksmith's Favor `doubleTierChance` triggers double tier jump at correct probability

**Command:** `npx vitest run test/accessory-drops.test.ts test/boss-loot-table.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## Phase 4a: Consumer Integration — Combat & Loot

**Estimated Time:** 2.5–3 hours  
**Prerequisite:** Phase 3  
**Goal:** Wire `AccessoryEffectService` into combat, damage, loot, and tooltip systems.

### Tasks

#### `src/services/CombatService.ts` [MODIFY]
- In `deriveCombatStats()` or `aggregateGearStats()`:
  - Add `getCombatBonus(gear, 'crit')` to crit chance
  - Add `getCombatBonus(gear, 'dodge')` to dodge chance
  - Add `getCombatBonus(gear, 'block')` to block chance
  - Add `getCombatBonus(gear, 'physDef')` to physical defense
  - Add `getCombatBonus(gear, 'magDef')` to magic defense
  - Add `getCombatBonus(gear, 'maxHp')` to max HP
  - Add `getCombatBonus(gear, 'maxMana')` to max mana
- ~30 lines

#### `src/services/BattleService.ts` [MODIFY]
- In `handleVictory()`: apply `getXPMultiplier(gear, 'combat')` to XP reward and `getGoldMultiplier(gear, 'combat')` to gold reward
- In damage calculation: implement lifesteal via `getCombatBonus(gear, 'lifesteal')` — heal player for % of damage dealt
- In `handleDefeat()`: check `getDungeonBonus(gear, 'autoRevive')` for Phoenix Feather — revive at 25% HP if `phoenixFeatherUsedThisDungeon === false` in `dungeonStore`
- Add `getCombatBonus(gear, 'critDamage')` to crit multiplier
- Check `getConditionalBonus()` for HP-threshold bonuses during damage calc
- ~40 lines

#### `src/services/LootGenerationService.ts` [MODIFY]
- In `generateQuestLoot()`: apply `getGoldMultiplier(gear, 'quest')` to gold, `getLootBonus(gear, 'gearDrop')` to gear drop chance, `getLootBonus(gear, 'gearTier')` to tier roll
- In `generateCombatLoot()`: apply `getGoldMultiplier(gear, 'combat')`, `getLootBonus(gear, 'setChance')` to set piece chance
- In `generateChestLoot()`: apply `getGoldMultiplier(gear, 'dungeon')`
- Boss kill consumable guarantee via `getUtilityBonus(gear, 'bossConsumable')`
- ~30 lines

#### `src/utils/gearFormatters.ts` [MODIFY]
- In `buildGearStats()`: display ability name and description for accessories with `templateId`
- In `formatGearTooltip()`: include ability text in string output
- In `createGearComparisonTooltip()`: 2×2 grid layout for accessory comparison (new item + 3 equipped accessories)
- On mobile: stack vertically (4×1) instead of 2×2
- ~40 lines

#### `src/modals/BlacksmithModal.ts` [MODIFY]
- Pass `getLootBonus(gear, 'smeltDouble')` as `doubleTierChance` param when calling `smeltingService.smelt()`
- ~5 lines

---

## Phase 4b: Consumer Integration — Meta-Game

**Estimated Time:** 2–2.5 hours  
**Prerequisite:** Phase 4a  
**Goal:** Wire `AccessoryEffectService` into XP hooks, streak, dungeon, and stat management systems.

### Tasks

#### `src/hooks/useXPAward.ts` [MODIFY]
- Apply `getXPMultiplier(gear, 'quest')` to XP awarded from quest/task completions
- Apply `getXPMultiplier(gear, 'recurring')` bonus for recurring quests
- Apply `getXPMultiplier(gear, 'first_daily')` bonus for first quest of the day
- ~15 lines

#### `src/services/StreakService.ts` [MODIFY]
- Generalize `shieldUsedThisWeek: boolean` → `totalShieldsUsedThisWeek: number` in `updateStreak()`
- Read accessory streak shield bonus via `getUtilityBonus(gear, 'streakShield')`
- Compute `maxShieldsPerWeek = (isPaladin ? 1 : 0) + accessoryShieldCount`
- Check `totalShieldsUsedThisWeek < maxShieldsPerWeek` before consuming a shield
- Update `checkStreakOnLoad()` for new count-based reset
- ~20 lines

#### `src/store/characterStore.ts` [MODIFY]
- **Unequip clamping:** after updating `equippedGear`, recalculate max HP/Mana/Stamina
  - If `currentHP > newMaxHP` → `currentHP = newMaxHP`
  - If `currentMana > newMaxMana` → `currentMana = newMaxMana`
  - Same for stamina cap
- ~20 lines

#### `src/store/dungeonStore.ts` [MODIFY]
- Add `phoenixFeatherUsedThisDungeon: boolean` (reset to `false` on dungeon start)
- On dungeon start: if `getDungeonBonus(gear, 'mapReveal')`, set all rooms to `visited: true`
- ~15 lines

#### `src/components/DungeonView.tsx` [MODIFY]
- Apply `getGoldMultiplier(gear, 'dungeon')` to chest gold
- Apply `getXPMultiplier(gear, 'dungeon')` to room exploration XP
- Apply `getDungeonBonus(gear, 'goldenChest')` to golden chest roll chance
- ~25 lines

#### `src/services/TestCharacterGenerator.ts` [MODIFY]
- Support equipping curated accessories on test characters for balance testing
- ~30 lines

#### `src/settings.ts` [MODIFY]
- Update test level selector from dropdown to number input (any level 1–40)
- ~15 lines

---

## Phase 4c: Tests — Consumer Integration

**Estimated Time:** 2.5–3 hours  
**Prerequisite:** Phase 4b  
**Coverage Target:** ≥80% line, ≥80% branch for integration points

### Tasks

#### `test/accessory-integration.test.ts` [NEW]

**Key test cases — Combat & Loot:**
- Gold multiplier correctly applied in `generateQuestLoot()` output
- XP multiplier correctly applied in `handleVictory()` XP reward
- Crit/dodge/block bonuses aggregate correctly in `deriveCombatStats()`
- Lifesteal heals player for correct % of damage dealt
- Phoenix Feather triggers revive at 25% HP once, then blocks second revive
- Gear tier upgrade bonus increases chance of higher tier rolls
- Set piece chance bonus increases set drop rate
- Blacksmith's Favor double-tier works through `BlacksmithModal` → `SmeltingService.smelt()` path
- Boss kill consumable guarantee drops consumable when equipped
- Tooltip displays ability text for curated accessories
- Tooltip omits ability section for T1 accessories

**Key test cases — Meta-Game:**
- Quest XP multiplier applied in `useXPAward` hook logic
- Recurring quest bonus stacks correctly
- First daily quest bonus applies only on first quest of day
- Streak Shield counts correctly (1 for Charm, 2 for Paladin+Charm)
- Streak Shield resets weekly count on new week
- Unequip clamping: HP clamped when HP accessory removed
- Unequip clamping: Mana clamped when mana accessory removed
- Unequip clamping: Stamina clamped when stamina accessory removed
- Map reveal sets all rooms visited on dungeon entry
- Golden chest chance bonus increases roll probability

**Command:** `npx vitest run test/accessory-integration.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## Phase 5: Manual Testing & Balance

**Estimated Time:** 1–2 sessions (depends on findings)  
**Prerequisite:** Phase 4c  
**Goal:** Brad tests in test vault, adjustments made based on findings.

> [!NOTE]
> This phase has no test partner — it IS the test phase (manual QA).

### Build & Deploy

```powershell
npm run build
npm run deploy:test
```

### Test Matrix

| # | Test | Expected |
|---|------|----------|
| 1 | Equip accessories | Stats on character sheet: emoji + name + ability text below |
| 2 | Equip multiple | Stacking bonuses add correctly |
| 3 | Unequip HP/Mana/Stamina accessories | Current values clamped to new max |
| 4 | Complete quests with gold/XP accessories | Bonuses reflected in rewards |
| 5 | Fight mobs with combat accessories | Crit/dodge/block bonuses active |
| 6 | Kill boss | Boss-specific accessory drops (80–90%) |
| 7 | Kill same boss again while owning item | No duplicate drop, extra gold instead |
| 8 | Sell boss item, kill boss again | Item drops again |
| 9 | Run dungeon with map reveal | Full map visible on entry via DungeonMapModal |
| 10 | Die with Phoenix Feather equipped | Revive at 25% HP |
| 11 | Die again in same dungeon | No second revive |
| 12 | Open chests with gold accessories | Bonus gold applied |
| 13 | Try smelting accessories | Blocked with error message |
| 14 | Training mode, complete quests | Zero accessory drops |
| 15 | Tooltips on accessories | Ability text, 2×2 comparison layout |
| 16 | Miss streak day with Charm | Streak protected (once/week) |
| 17 | Miss streak as Paladin + Charm | Protected twice/week |
| 18 | Blacksmith's Favor + smelt other gear | Occasional double-tier jump |
| 19 | Level 1–5, earn loot | Only T1 accessories possible |
| 20 | Level 36–40, earn loot | T4 accessories appear from all sources |

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 1 | Data Foundation & Models | Medium | — | 2–2.5h |
| 1.5 | Tests: Data Foundation | Medium | Phase 1 | 1.5–2h |
| 2 | AccessoryEffectService | Large | Phase 1 | 2–2.5h |
| 2.5 | Tests: AccessoryEffectService | Large | Phase 2 | 2–2.5h |
| 3 | Loot Integration | Large | Phase 2 | 2.5–3h |
| 3.5 | Tests: Loot Integration | Medium | Phase 3 | 2–2.5h |
| 4a | Consumer Integration — Combat & Loot | Large | Phase 3 | 2.5–3h |
| 4b | Consumer Integration — Meta-Game | Medium | Phase 4a | 2–2.5h |
| 4c | Tests: Consumer Integration | Large | Phase 4b | 2.5–3h |
| 5 | Manual Testing & Balance | Medium | Phase 4c | 1–2 sessions |

**Total Estimated:** 10–12 sessions (~21–25 hours)

---

## File Change Summary

| Phase | File | Action | Purpose |
|-------|------|--------|---------|
| 1 | `src/models/Gear.ts` | MODIFY | Add `templateId` to `GearItem` |
| 1 | `src/models/Monster.ts` | MODIFY | Add `BossLootTable` interface and field |
| 1 | `src/models/Character.ts` | MODIFY | Add `totalShieldsUsedThisWeek` field |
| 1 | `src/data/accessories.ts` | NEW | 50+ accessory templates + T1 name pools |
| 1 | `src/data/uniqueItems.ts` | MODIFY | Remove migrated Ring/Amulet |
| 1.5 | `test/accessories-data.test.ts` | NEW | Data integrity + handler cross-ref tests |
| 2 | `src/services/AccessoryEffectService.ts` | NEW | Central resolver with grouped API |
| 2.5 | `test/accessory-effect-service.test.ts` | NEW | Effect aggregation + edge case tests |
| 3 | `src/services/LootGenerationService.ts` | MODIFY | Accessory slots in pool, boss loot, training guard |
| 3 | `src/data/monsters.ts` | MODIFY | `bossLootTable` on all 20 bosses |
| 3 | `src/services/SmeltingService.ts` | MODIFY | Smelting block + `doubleTierChance` hook |
| 3 | `src/modals/GearSlotMappingModal.ts` | MODIFY | Consolidate accessory checkboxes |
| 3 | `src/settings.ts` | MODIFY | Update defaults |
| 3.5 | `test/accessory-drops.test.ts` | NEW | Drop pool + tier gating tests |
| 3.5 | `test/boss-loot-table.test.ts` | NEW | Boss loot + uniqueness tests |
| 4a | `src/services/CombatService.ts` | MODIFY | Combat bonus integration |
| 4a | `src/services/BattleService.ts` | MODIFY | XP/gold multipliers, lifesteal, Phoenix Feather |
| 4a | `src/services/LootGenerationService.ts` | MODIFY | Gold/loot bonus integration |
| 4a | `src/utils/gearFormatters.ts` | MODIFY | Ability tooltips, 2×2 comparison |
| 4a | `src/modals/BlacksmithModal.ts` | MODIFY | Pass `doubleTierChance` param |
| 4b | `src/hooks/useXPAward.ts` | MODIFY | Quest XP multiplier integration |
| 4b | `src/services/StreakService.ts` | MODIFY | Generalized shield count |
| 4b | `src/store/characterStore.ts` | MODIFY | Unequip clamping |
| 4b | `src/store/dungeonStore.ts` | MODIFY | Phoenix Feather flag, map reveal |
| 4b | `src/components/DungeonView.tsx` | MODIFY | Dungeon bonus integration |
| 4b | `src/services/TestCharacterGenerator.ts` | MODIFY | Test character with accessories |
| 4b | `src/settings.ts` | MODIFY | Test level selector enhancement |
| 4c | `test/accessory-integration.test.ts` | NEW | Integration + clamping + smelting tests |

---

## Verification Checklist

### Automated Tests

| Test | Expected | Status |
|------|----------|--------|
| `test/accessories-data.test.ts` — all templates valid | ✅ All pass | |
| `test/accessories-data.test.ts` — effectType cross-ref | ✅ All pass | |
| `test/accessory-effect-service.test.ts` — all grouped methods | ✅ All pass | |
| `test/accessory-drops.test.ts` — slot weights + tier gating | ✅ All pass | |
| `test/boss-loot-table.test.ts` — uniqueness enforcement | ✅ All pass | |
| `test/accessory-integration.test.ts` — combat + meta-game | ✅ All pass | |
| Full test suite (`npm run test`) — no regressions | ✅ All pass | |
| Coverage ≥80% line on all new files | ✅ Met | |
| Coverage ≥80% branch on all new files | ✅ Met | |

### Manual Testing

| Test | Expected | Status |
|------|----------|--------|
| Equip/unequip accessories | Stats update, clamping works | |
| Quest/combat gold bonuses | Correct multiplier applied | |
| Boss loot uniqueness | No duplicates, re-farm after sell | |
| Training mode block | Zero accessory drops | |
| Smelting block | Error message shown | |
| Tooltips + comparison | Ability text, 2×2 grid | |
| Streak Shield | 1/week (2/week with Paladin) | |
| Phoenix Feather | Revive once per dungeon | |
| Map reveal | Full map on entry | |
| `npm run build` clean | No errors/warnings | |

---

## Review Decisions Log

> Consolidated from 2026-02-21 codebase review. Both internal findings and external dev feedback.

### Internal Review (14 items)

| # | Category | Finding | Resolution |
|---|----------|---------|------------|
| 1 | Architecture | Service shouldn't read from store | Pure function pattern — accepts `EquippedGearMap` |
| 2 | Architecture | Phase 4 consumer list incomplete (4 vs 17+) | Split into 4a/4b/4c with full file lists |
| 3 | Architecture | `uniqueDropId` migration mischaracterized | Corrected to "wire up via bossLootTable" |
| 4 | Architecture | Curated items could be smelted | All accessories unsmelable |
| 5 | Architecture | Slot consolidation migration | UI-only; `accessory1/2/3` internal |
| 6 | Guidelines | `console.log` in 4 files | Using during dev; bulk-convert before BRAT |
| 7 | Security | Data file typos → silent failures | TDD + handler cross-reference test |
| 8 | Performance | Effect aggregation per-render | Pure functions enable `useMemo` caching |
| 9 | Performance | File size (~600 lines) | Fine for data file |
| 10 | Gap | Missing UI display spec | Emoji + name + ability; colored border; 2×2 tooltips |
| 11 | Gap | Missing serialization decision | Template Reference Model — `templateId` on `GearItem` |
| 12 | Gap | No Blacksmith's Favor path | Optional `doubleTierChance` parameter |
| 13 | Gap | ~38 effect types unformalized | Grouped API (7 methods) |
| 14 | Balance | Streak Shield = Paladin duplicate | Stacks additively (2/week with both) |

### External Dev Review (8 items)

| # | Finding | Resolution |
|---|---------|------------|
| 1 | Save data migration | Not needed — Template Reference resolves at runtime |
| 2 | Streak Shield exploit + Phoenix state | Count-based shield tracking; ephemeral dungeon flag |
| 3 | Unequip clamping | Clamp HP/Mana/Stamina on unequip |
| 4 | Boss loot farmability | One per character; sell = can re-farm |
| 5 | Training mode collision | Completely disabled |
| 6 | Separate drop rolls / bloat | Accessories are regular gear drops |
| 7 | Minimap targets dead code | Target `DungeonMapModal` instead |
| 8 | TDD data typo protection | Cross-reference effectTypes against handlers |
