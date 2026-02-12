# Accessories & Special Abilities Brainstorm

**Date:** 2026-02-10  
**Status:** Draft v2 — Reviewed, Decisions Made

---

## Table of Contents
1. [System Analysis](#system-analysis-current-state-of-accessories)
2. [Design Decisions (Confirmed)](#design-decisions-confirmed)
3. [Accessory Tier System](#accessory-tier-system)
4. [The 30 Curated Accessories (T2–T4)](#the-30-curated-accessories-t2t4)
5. [20 Boss-Specific Accessories](#20-boss-specific-accessories)
6. [T1 Auto-Generated Name Pool](#t1-auto-generated-name-pool)
7. [Drop Rates & Progression Gating](#drop-rates--progression-gating)
8. [Generalized Boss Loot Table](#generalized-boss-loot-table)
9. [Stacking Rules](#stacking-rules)
10. [Implementation Architecture](#implementation-architecture)
11. [Test Strategy (TDD)](#test-strategy-tdd)
12. [Phasing Plan](#phasing-plan)
13. [Manual Testing Notes](#manual-testing-notes)

---

## System Analysis: Current State of Accessories

### How Accessories Work Today

Accessories occupy 3 gear slots (`accessory1`, `accessory2`, `accessory3`). Currently they are:

- **Procedurally generated** by `LootGenerationService.generateGearItem()` — same system as armor/weapons
- **Lower stats than primary gear** — crit chance ~2+tier×2 or dodge chance ~2+tier×1.5
- **No class restrictions** — all classes can equip any accessory
- **No special abilities** — the `GearItem` interface has no field for special effects

### Drop Availability Gaps

| Source | Can Drop Accessories? | Notes |
|--------|----------------------|-------|
| Quest completion | ⚠️ Barely | Only `recurring` maps to `accessory1` |
| Combat victory | ❌ No | Uses `PRIMARY_GEAR_SLOTS` only |
| Dungeon chests | ❌ No | Uses `PRIMARY_GEAR_SLOTS` only |
| Unique drops | ✅ Yes | Ring of the Completionist, Amulet of Dedication |

### GearSlotMappingModal Issue

Currently lists Accessory 1/2/3 as separate checkboxes. Will be consolidated into a single "Accessory" checkbox.

---

## Design Decisions (Confirmed)

| Decision | Answer |
|----------|--------|
| Dual generation? | ✅ Yes — T1 auto-generated, T2-T4 curated |
| Ability architecture? | ✅ Central `AccessoryEffectService` resolver — no ability logic scattered in game methods |
| Stacking? | ✅ Additive for everything (may fine-tune later) |
| Class perk overlap? | ✅ Allowed — accessory = weaker version of class perk |
| Triggered abilities (battle/dungeon actions)? | ❌ Not now — only passive/conditional abilities |
| Slot mapping consolidation? | ✅ Merge accessory1/2/3 into single "Accessory" checkbox |
| `uniqueDropId` migration? | ✅ Migrate 2 existing items, remove old field, use `bossLootTable` |
| Drop sources? | ✅ All sources (quests, combat, chests) with bosses having higher rates |
| Boss loot tables scope? | ✅ Generalized: any gear slot, per-boss, not just accessories |

---

## Accessory Tier System

| Tier | Name | Generation | Stats | Ability | Availability |
|------|------|-----------|-------|---------|-------------|
| **T1** | Common Accessory | **Auto-generated** (procedural) | Reduced (~65% of normal gear) | ❌ None | Always available |
| **T2** | Enchanted Accessory | **Curated** (data file) | Reduced stats + ability | Passive stat modifiers | Unlocks at player tier 2 (level 6+) |
| **T3** | Rare Accessory | **Curated** (data file) | Moderate stats + ability | Conditional bonuses | Unlocks at player tier 3 (level 16+) |
| **T4** | Legendary Accessory | **Curated** (data file) | Varies + ability | Powerful effects | Boss-only until tier 4-5 (level 26+) |

### Player Tier → Gear Tier Mapping (from `TIER_INFO.levelRange`)

| Player Level | Gear Tiers Available | Accessory Tiers Available |
|-------------|---------------------|--------------------------|
| 1–5 | Common | T1 only |
| 6–15 | Common, Adept | T1, T2 (small chance) |
| 16–25 | Adept, Journeyman | T1, T2 (increased), T3 (small chance) |
| 26–35 | Journeyman, Master, Epic | T1, T2, T3 (increased), T4 (boss-only) |
| 36–40 | Master, Epic, Legendary | T1, T2, T3, T4 (expanded sources) |

---

## The 30 Curated Accessories (T2–T4)

### Distribution: 18 T2 / 8 T3 / 4 T4

Stats listed are for **mid-tier (Journeyman, ~Level 15)**. Stats scale by `TIER_INFO.statMultiplier`; abilities **do not scale**.

---

### 💰 Economy & Gold — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 1 | Merchant's Signet | Ring | +8 CHA, +4 WIS | +10% gold from quest completions |
| 2 | Coin Collector's Token | Charm | +6 CHA | +15% gold from monster kills |
| 3 | Miser's Pendant | Amulet | +10 WIS | +20% sell value on gear |
| 4 | Fortune Cookie Charm | Charm | +4 CHA, +4 WIS | +10% gold from dungeon chests |
| 5 | Taxman's Ring | Ring | +6 INT, +6 CHA | Doubles gold from daily quests |
| 6 | Alchemist's Purse | Charm | — (no stats) | +25% gold from ALL sources |

### ⚔️ Combat — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 7 | Berserker's Band | Ring | +12 STR | +5% crit chance |
| 8 | Guardian's Talisman | Amulet | +10 CON, +4 DEF | +8% block chance |
| 9 | Windrunner's Anklet | Charm | +10 DEX | +6% dodge chance |
| 10 | Vampire's Fang | Ring | +8 STR, +4 DEX | Heal 5% of damage dealt |
| 11 | Ironhide Brooch | Amulet | +8 CON | +10% physical defense |
| 12 | Spell Ward Pendant | Amulet | +8 WIS, +6 INT | +10% magic defense |

### 📈 XP & Progression — T2 (6 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 13 | Scholar's Monocle | Charm | +8 INT, +6 WIS | +10% XP from quest completions |
| 14 | Battle Medallion | Amulet | +6 STR, +6 CON | +15% XP from combat victories |
| 15 | Explorer's Compass | Charm | +6 WIS | +15% XP from dungeon exploration |
| 16 | Apprentice's Loop | Ring | +10 INT | +5% bonus to stat point gains |
| 17 | Dedicated Worker's Pin | Charm | +4 CON, +4 WIS | +20% XP from recurring quests |
| 18 | Early Bird Brooch | Charm | +6 DEX | +10% XP for first quest each day |

### 🎁 Loot & Drop Rate — T3 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 19 | Lucky Rabbit's Foot | Charm | +6 CHA, +4 DEX | +5% chance to roll Master+ tier gear |
| 20 | Treasure Hunter's Loop | Ring | +8 CHA | +10% gear drop chance from quests |
| 21 | Blacksmith's Favor | Ring | +6 STR | 15% chance smelting jumps TWO tiers |
| 22 | Collector's Monocle | Charm | — (no stats) | +10% chance for set pieces |

### 🛡️ Survival & Utility — T3 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 23 | Healer's Crystal | Amulet | +10 WIS | +20% potion healing |
| 24 | Stamina Sash | Charm | +6 DEX, +4 CON | +5 daily stamina cap |
| 25 | Mana Wellspring Ring | Ring | +10 INT | +15% maximum mana |
| 26 | Streak Shield Charm | Charm | +4 CHA, +4 WIS | Streak protection: forgives 1 missed day/week |

### 🔥 Legendary — T4 (4 items)

| # | Name | Type | Stats | Ability |
|---|------|------|-------|---------|
| 27 | Phoenix Feather | Charm | +6 CON | Auto-revive at 25% HP once per dungeon |
| 28 | Magpie's Brooch | Charm | +4 CHA | Guaranteed consumable from boss kills |
| 29 | Prospector's Pendant | Amulet | +6 WIS, +4 INT | +10% golden chest chance in dungeons |
| 30 | Cartographer's Lens | Charm | +8 WIS | Reveals full dungeon minimap on entry |

---

## 20 Boss-Specific Accessories

These are **additional** to the 30 above. Each boss gets one thematic accessory that can ONLY drop from that specific boss.

### 🐾 Beast Bosses (3)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Alpha Wolf | Fang of the Pack Leader | Ring | T3 | +8% crit when HP > 75% |
| Grizzled Ancient | Hibernation Stone | Amulet | T3 | +20% HP potion effectiveness |
| Rat King | Crown of the Swarm | Charm | T4 | +20% gold from ALL monster kills |

### 💀 Undead Bosses (3)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Bone Collector | Scythe Fragment Pendant | Amulet | T3 | +10% physical defense |
| Lich | Phylactery Shard | Charm | T4 | +15% max mana, +10% magic defense |
| Wraith Lord | Spectral Oath Ring | Ring | T3 | +8% dodge chance |

### 👺 Goblin Bosses (2)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Goblin Warlord | Warlord's War Band | Ring | T2 | +5% physical defense, +5% attack |
| Bugbear Tyrant | Tyrant's Knuckle Ring | Ring | T3 | +10% crit damage |

### 🧌 Troll Bosses (2)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Mountain Troll | Stoneblood Amulet | Amulet | T3 | +15% max HP |
| Swamp Horror | Toxic Fang Charm | Charm | T3 | 10% chance to poison on attack |

### 🧝 Night Elf Bosses (2)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Shadow Assassin | Shade's Step Anklet | Charm | T4 | +12% dodge, +8% crit |
| Dark Matriarch | Matriarch's Dark Sigil | Ring | T4 | +15% magic defense, +10% combat XP |

### ⛏️ Dwarf Bosses (2)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Ironforge Champion | Ironforge Seal | Ring | T3 | +15% physical defense, +5% block |
| Rune Berserker | Runestone Pendant | Amulet | T3 | +10% attack when HP < 50% |

### 🐉 Dragonkin Bosses (3)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| Elder Drake | Molten Scale Charm | Charm | T3 | +10% fire resist, +5% defense |
| Wyvern Matriarch | Venomtip Fang Ring | Ring | T3 | 8% chance to poison on attack |
| Ancient Dragon | Heart of the Wyrm | Amulet | T4 | +10% ALL stats (THE chase item) |

### 👁️ Aberration Bosses (3)

| Boss | Accessory | Type | Tier | Ability |
|------|-----------|------|------|---------|
| The Devourer | Greedy Maw Token | Charm | T3 | +15% gear drop, +15% chest gold |
| Beholder | All-Seeing Eye | Charm | T4 | Reveal dungeon minimap, +10% magic def |
| Void Spawn | Void Shard | Amulet | T4 | +10% all XP, -5% max HP trade-off |

---

## T1 Auto-Generated Name Pool

T1 accessories have no abilities — just reduced stats generated procedurally. These name pools give variety to what players see.

### Rings 💍

**Prefixes:** Copper, Iron, Silver, Gold, Bronze, Tin, Brass, Steel, Cobalt, Rusted, Tarnished, Polished, Rough-Cut, Scratched, Dull, Gleaming, Worn, Battered, Chipped, Simple

**Base names:** Ring, Band, Loop, Signet, Circlet, Coil, Hoop, Spiral, Twist

**Suffixes (optional, ~30% chance):** of Fortitude, of Precision, of Endurance, of Cunning, of Focus, of Resilience, of Vigor, of Tenacity, of Grit, of Insight

### Amulets 📿

**Prefixes:** Wooden, Stone, Crystal, Jade, Obsidian, Amber, Bone, Coral, Glass, Quartz, Pewter, Ivory, Onyx, Opal, Turquoise, Weathered, Cracked, Faded, Dented, Plain

**Base names:** Amulet, Pendant, Necklace, Talisman, Medallion, Locket, Torc, Gorget, Chain

**Suffixes (optional, ~30% chance):** of Protection, of Warding, of Shielding, of Vitality, of Calm, of Resolve, of Steadiness, of Balance, of Grounding, of Shelter

### Charms/Trinkets 🔮

**Prefixes:** Lucky, Old, Dusty, Faded, Cracked, Bent, Tiny, Strange, Curious, Odd, Worn, Battered, Forgotten, Found, Salvaged, Crude, Rough, Patchwork, Makeshift, Scavenged

**Base names:** Charm, Trinket, Token, Bauble, Fetish, Talisman, Ornament, Keepsake, Relic

**Suffixes (optional, ~30% chance):** of Luck, of Chance, of Fortune, of Fate, of Whimsy, of Hope, of Perseverance, of Patience, of Curiosity, of Wonder

### Generation Pattern
```
[Prefix] [Base Name] [Suffix?]
→ "Iron Band of Precision"
→ "Cracked Pendant"
→ "Lucky Trinket of Chance"
→ "Cobalt Ring"
```

**~ 20 × 9 × 11 = ~1,980 possible combinations per category, ~5,940 total T1 names.**

---

## Drop Rates & Progression Gating

### Accessory Drop Chances (Separate Roll from Normal Gear)

| Source | Accessory Drop Chance | Notes |
|--------|----------------------|-------|
| Quest completion | 15-20% | Rolled separately from normal gear drop |
| Overworld combat | 10-15% | T1 only at low levels |
| Elite combat | 20-25% | Can include T2+ |
| Boss kill | 80-90% from `bossLootTable` | Separate from the accessory pool chance |
| Iron chest | ~20% | Separate roll |
| Golden chest | ~40% | Higher quality tier bias |

### Level-Gated Tier Pool

When an accessory drops, the tier is determined by player level:

| Player Level | T1 Weight | T2 Weight | T3 Weight | T4 Weight |
|-------------|-----------|-----------|-----------|-----------|
| 1–5 | 100% | 0% | 0% | 0% |
| 6–15 | 80% | 20% | 0% | 0% |
| 16–25 | 55% | 35% | 10% | 0% |
| 26–35 | 30% | 35% | 25% | 10% (boss only) |
| 36–40 | 15% | 30% | 30% | 25% (expanded) |

---

## Generalized Boss Loot Table

### Per-Boss Design (NOT Shared)

Each boss has its own unique loot table. Items in a boss's table can ONLY drop from that boss (for boss-specific items). This makes farming purposeful — "I need the Heart of the Wyrm, so I'm running Ancient Dragon."

### Interface

```typescript
interface BossLootTable {
    /** Chance (0.0–1.0) to roll on this table on kill */
    dropChance: number;
    /** Array of item template IDs — any gear slot, not just accessories */
    items: string[];
}

// On MonsterTemplate:
bossLootTable?: BossLootTable;
```

### Flow on Boss Kill

1. Roll against `bossLootTable.dropChance` (80-90%)
2. If pass → randomly select one item from `items[]`
3. Create item from template and add to loot
4. If fail → no special drop (normal loot still applies)

### Example Usage

```typescript
const ancientDragon: MonsterTemplate = {
    id: 'boss-ancient-dragon',
    // ...existing fields...
    bossLootTable: {
        dropChance: 0.85,
        items: [
            'heart_of_the_wyrm',      // T4 accessory
            'dragonscale_breastplate', // Custom chest armor (future)
            'wyrmfire_blade',         // Custom weapon (future)
        ],
    },
};
```

---

## Stacking Rules

| Bonus Type | Stacking | Example |
|-----------|---------|---------|
| Gold bonuses | Additive | +10% + +25% = +35% |
| XP bonuses | Additive | +10% + +15% = +25% |
| Flat combat (crit, dodge, block) | Additive | +5% + +8% = +13% |
| % combat (defense, mana, HP) | Additive with each other, multiplicative with base | base 100 + (10% + 15%) = base × 1.25 |
| Unique effects (Phoenix, Streak Shield) | Non-stacking | Only one instance active |

---

## Implementation Architecture

### AccessoryEffectService Pattern (Central Resolver)

```
accessories.ts (data) → AccessoryEffectService (resolver) → Game systems (consumers)
```

- **Data file** defines each accessory with `{ effectType, value }` pairs
- **Service** reads equipped accessories, aggregates effects by type
- **Game systems** call one method each: `effectService.getGoldMultiplier()`, `effectService.getCritBonus()`, etc.
- **Adding an accessory** = add data entry. If effectType exists, zero code changes elsewhere
- **New effect type** = add one method to service + one line in consumer

### New/Modified Files

| File | Change | Lines |
|------|--------|-------|
| `src/data/accessories.ts` | **[NEW]** 50 accessory templates (30 general + 20 boss) | ~600 |
| `src/services/AccessoryEffectService.ts` | **[NEW]** Central resolver | ~150 |
| `src/models/Gear.ts` | Add `specialAbility` field, `AccessoryAbility` interface | ~20 |
| `src/models/Monster.ts` | Add `BossLootTable` interface, `bossLootTable` field | ~15 |
| `src/services/LootGenerationService.ts` | `rollAccessory()`, add to combat/chest drops | ~80 |
| `src/data/monsters.ts` | Add `bossLootTable` to 20 bosses, migrate `uniqueDropId` | ~60 |
| `src/modals/GearSlotMappingModal.ts` | Consolidate accessory checkboxes | ~20 |
| `src/settings.ts` | Update defaults, test level selector to all levels | ~15 |
| `src/utils/gearFormatters.ts` | Show ability text in tooltips | ~15 |
| `src/services/TestCharacterGenerator.ts` | Support equipping curated accessories for test chars | ~30 |

---

## Test Strategy (TDD)

### Testing Philosophy
- Write tests FIRST for each new service/function (TDD)
- Target **high code coverage** across all new code
- v8 coverage via existing `vitest.config.ts` infrastructure
- Run with `npx vitest run --coverage` to verify

### Test Files

| Test File | What It Covers | Est. Tests |
|-----------|---------------|------------|
| `test/accessories-data.test.ts` | Data integrity: all 50 templates valid, no duplicate IDs, required fields present, stat values in range, ability types valid | ~15 |
| `test/accessory-effect-service.test.ts` | Effect aggregation: single accessory, multiple stacking, no accessories, non-stacking uniques, each effect type returns correct value, edge cases (empty inventory, null abilities) | ~25 |
| `test/accessory-drops.test.ts` | Drop logic: `rollAccessory()` respects tier gating by level, drop chance percentages, T1 vs curated selection, slot auto-fill logic | ~15 |
| `test/boss-loot-table.test.ts` | Boss loot: drop chance respects `bossLootTable.dropChance`, random item selection from pool, graceful handling of missing templates, the 20 boss tables are valid | ~12 |
| `test/accessory-integration.test.ts` | Integration: gold multiplier applies in loot generation, XP multiplier applies, combat stat bonuses aggregate correctly, tooltip displays ability text | ~10 |

**Estimated total: ~77 new tests**

### What NOT to Test (Existing Coverage)
- `calculateDamage()` — already tested in `battle.test.ts`
- Monster creation — already tested in `monster.test.ts`
- Power-up stacking — already tested in `power-up-effects.test.ts`

---

## Phasing Plan

Each phase is a **medium-length agent session** — completable in one sitting with room for troubleshooting.

### Phase 1: Data Foundation & Models
**Scope:** Define type system, create data files, write data integrity tests
- Add `AccessoryAbility` interface and `specialAbility` field to `Gear.ts`
- Add `BossLootTable` interface and field to `Monster.ts`
- Create `src/data/accessories.ts` with all 50 templates
- Create `test/accessories-data.test.ts` (TDD — tests first)
- Add T1 name generation pools to `LootGenerationService`
- All tests passing, build clean

### Phase 2: AccessoryEffectService
**Scope:** Build the central resolver service, comprehensive tests
- Create `src/services/AccessoryEffectService.ts`
- Create `test/accessory-effect-service.test.ts` (TDD — tests first)
- All effect type methods: gold, XP, combat stats, drop rates, survival, utility
- Stacking logic, edge cases, non-stacking uniques
- All tests passing, build clean

### Phase 3: Loot Integration
**Scope:** Wire accessories into drop tables, boss loot tables, gear slot mapping
- Add `rollAccessory()` to `LootGenerationService`
- Update `generateCombatLoot()` and `generateChestLoot()` to include accessories
- Add `bossLootTable` to all 20 boss templates in `monsters.ts`
- Migrate 2 existing `uniqueDropId` items to new system
- Consolidate accessory slots in `GearSlotMappingModal`
- Update default `questSlotMapping` in settings
- Create `test/accessory-drops.test.ts` and `test/boss-loot-table.test.ts` (TDD)
- All tests passing, build clean

### Phase 4: Consumer Integration & UI
**Scope:** Connect effect service to game systems, update tooltips, testing tools
- Add `effectService.getXXX()` calls to `LootGenerationService`, `BattleService`, `StatsService`, `CombatService`
- Update `gearFormatters.ts` to display ability text in tooltips
- Update `TestCharacterGenerator` to equip curated accessories for balance testing
- Update settings test level selector from dropdown to number input (any level 1-40)
- Create `test/accessory-integration.test.ts` (TDD)
- All tests passing, build clean
- Deploy to test vault

### Phase 5: Manual Testing & Balance
**Scope:** Brad tests in test vault, adjustments made based on findings
- Verify accessory drops at various levels
- Test boss loot tables with dungeon runs
- Verify effect stacking with multiple accessories
- Tooltip display check
- Balance adjustments as needed

---

## Manual Testing Notes

### Test Level Selector Enhancement
Current: Dropdown with `[1, 5, 10, 15, 20, 25, 30, 35, 40]`  
Proposed: Number input field (1-40), any level choosable

**Key levels to test at:**
- Level 1, 5 (T1-only zone, tier transition at 5)
- Level 6, 10, 15 (T2 introduction, tier transition at 15)
- Level 16, 20, 25 (T3 introduction, tier transition at 25)
- Level 26, 30, 35 (T4 boss-only zone, tier transitions at 30, 35)
- Level 36, 40 (T4 expanded zone)

### What to Verify During Manual Testing
1. **Equip accessories** → stats appear correctly on character sheet
2. **Equip multiple** → stacking works as expected
3. **Complete quests** → gold/XP bonuses apply
4. **Fight mobs/bosses** → combat bonuses apply, boss drops work
5. **Run dungeons** → chest bonuses, minimap reveal, Phoenix Feather
6. **Smelt gear** → Blacksmith's Favor bonus applies
7. **Tooltips** → ability description shows clearly
