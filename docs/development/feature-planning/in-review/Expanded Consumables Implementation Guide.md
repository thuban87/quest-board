# Expanded Consumables Implementation Guide

**Status:** Not Started
**Estimated Sessions:** 8 (4 build + 4 test)
**Created:** 2026-02-06
**Last Updated:** 2026-02-19
**Companion Session Log:** [Expanded Consumables Session Log](../development/Expanded%20Consumables%20Session%20Log.md)

> [!NOTE]
> Obsidian plugin guidelines (`.agent/rules/obsidian-plugin-guidelines.md`) reviewed 2026-02-19. Plan avoids innerHTML, uses CSS-variable-based styling with `qb-` prefixed classes, and limits console output to `console.warn`/`console.error` (gated behind debug setting where possible).

---

## Table of Contents

- [Overview](#overview)
- [Design Decisions](#design-decisions)
- [HP/Mana Potion Rework](#hpmana-potion-rework)
- [New Consumable Catalog](#new-consumable-catalog)
- [Plan Summary](#plan-summary)
- [Phase 1: Potion Rework + Model Foundation](#phase-1-potion-rework--model-foundation)
- [Phase 1.5: Tests — Potion Rework + Model Foundation](#phase-15-tests--potion-rework--model-foundation)
- [Phase 2: Simple Combat Consumables](#phase-2-simple-combat-consumables)
- [Phase 2.5: Tests — Simple Combat Consumables](#phase-25-tests--simple-combat-consumables)
- [Phase 3: Complex Combat Consumables](#phase-3-complex-combat-consumables)
- [Phase 3.5: Tests — Complex Combat Consumables](#phase-35-tests--complex-combat-consumables)
- [Phase 4: UI Polish & Loot Tables](#phase-4-ui-polish--loot-tables)
- [Phase 4.5: Tests — UI Polish & Loot Tables](#phase-45-tests--ui-polish--loot-tables)
- [Verification Checklist](#verification-checklist)
- [File Change Summary](#file-change-summary)
- [Security & Validation](#security--validation)
- [Performance Considerations](#performance-considerations)
- [Rollback Plan](#rollback-plan)
- [Key References](#key-references)
- [Tuning Notes](#tuning-notes)

---

## Overview

Overhaul the consumable system from 8 basic potions + 3 utility items into a full 25-item catalog spanning 6 potion tiers, stat elixirs, cleansing items, enchantment oils, tactical consumables, and a Phoenix Tear in-combat revive.

### Goals

- **Fix potions:** Current HP/Mana potions restore 10-15% at higher levels, requiring 5-7 per use. Rework to 6 tiers (every 8 levels) restoring ~50-55% at introduction level, decaying to ~25-30% by next tier.
- **Meaningful choices:** Players should think about *which* consumable to bring, not just *how many* HP potions to spam.
- **Battle variety:** Enchantment oils, tactical items, and cleansing consumables add strategic depth to combat without overwhelming complexity.
- **Flat amounts, not percentages:** Potions heal fixed HP/MP. More complex to calibrate but better gameplay feel.

### Non-Goals

- No consumable crafting system (future feature)
- No consumables that affect quests/XP directly (Elixir of Experience stays as-is)
- No more than ~25 total consumables
- No consumable stacking for enchantment oils (one active at a time)

---

## Design Decisions

### Flat vs. Percentage Healing

**Decision: Flat amounts.** Percentage-based would be simpler to implement and auto-scale, but flat amounts feel better to play with. They give a concrete number ("this heals 450 HP") rather than an abstract percentage, and they naturally create the upgrade incentive as the player outgrows each tier.

### Potion Tier Cadence

**Decision: Every 8 levels (matching the 5-tier system).**

| Tier | Unlock Level | Name Prefix | Level Range |
|------|-------------|-------------|-------------|
| 1 | 1 | Minor | 1-7 |
| 2 | 8 | Lesser | 8-15 |
| 3 | 16 | Major | 16-23 |
| 4 | 24 | Greater | 24-31 |
| 5 | 32 | Superior | 32-39 |
| 6 | 40 | Supreme | 40 |

### Enchantment Scope

**Decision: Current battle only (turn-based, not real-time).** Enchantment oils last N turns within the active battle. This avoids needing a global attack-modifier system that persists across battles. If we want cross-battle enchantments later, it's easier to expand than simplify.

### Phoenix Tear vs. Revive Potion

These are different items:
- **Revive Potion** (existing): Used out-of-combat to recover from unconscious state. 25% HP.
- **Phoenix Tear** (new): Auto-triggers on death *during combat*. Prevents the defeat outcome. 30% HP floor, mana restored to pre-death value (30% floor if pre-death mana was lower).

---

## HP/Mana Potion Rework

### The Problem

Current potions use base-formula HP estimates that ignore gear bonuses entirely. A L30 Warrior has ~1655 HP with gear, but the original system assumed ~400 HP at that level. Result: potions heal a pathetic fraction of actual HP pools.

### Calibration Methodology

HP values are estimated for a **median-geared character** (not naked, not BiS) at each tier introduction level. These use a real L30 Warrior (1655 HP) as anchor, with Warriors being ~15-20% above median due to tank modifiers.

**IMPORTANT: These are TUNING VALUES.** During implementation, log actual HP/MP for multiple classes at key levels to validate. Adjust values before finalizing.

### Estimated Median HP Pools (With Typical Gear)

| Level | Est. Median HP | Tank HP (War/Cle) | Glass Cannon HP (Rog/Tech) |
|-------|---------------|-------------------|---------------------------|
| 1 | ~240 | ~265 | ~230 |
| 8 | ~480 | ~550 | ~430 |
| 16 | ~820 | ~960 | ~720 |
| 24 | ~1200 | ~1400 | ~1050 |
| 30 | ~1420 | ~1655 | ~1250 |
| 32 | ~1600 | ~1870 | ~1400 |
| 40 | ~2200 | ~2550 | ~1950 |

### New HP Potion Values

Targeting ~50-55% of median HP at introduction level:

| ID | Name | HP Restored | Intro Level | % at Intro | % at Next Tier | Store Price |
|----|------|-------------|-------------|-----------|----------------|-------------|
| `hp-potion-minor` | Minor Health Potion | 130 | 1 | 54% | 27% at L8 | 40g |
| `hp-potion-lesser` | Lesser Health Potion | 265 | 8 | 55% | 32% at L16 | 100g |
| `hp-potion-major` | Major Health Potion | 450 | 16 | 55% | 38% at L24 | 200g |
| `hp-potion-greater` | Greater Health Potion | 660 | 24 | 55% | 41% at L32 | 350g |
| `hp-potion-superior` | Superior Health Potion | 880 | 32 | 55% | 40% at L40 | 550g |
| `hp-potion-supreme` | Supreme Health Potion | 1200 | 40 | 55% | n/a | 850g |

> **Note on decay:** The 25-40% at next tier is higher than the original "15-20%" estimate because HP doesn't quite triple between tiers. This is still a strong upgrade incentive -- at 30% you need 3+ potions vs 2 at the current tier. If testing shows this isn't motivating enough, bump intro targets to 60% which will push decay lower.

### New Mana Potion Values

Mana pools are smaller and more class-dependent. Targeting ~50% of median mana at intro:

| ID | Name | MP Restored | Intro Level | Store Price |
|----|------|-------------|-------------|-------------|
| `mp-potion-minor` | Minor Mana Potion | 35 | 1 | 30g |
| `mp-potion-lesser` | Lesser Mana Potion | 60 | 8 | 80g |
| `mp-potion-major` | Major Mana Potion | 100 | 16 | 160g |
| `mp-potion-greater` | Greater Mana Potion | 150 | 24 | 280g |
| `mp-potion-superior` | Superior Mana Potion | 200 | 32 | 440g |
| `mp-potion-supreme` | Supreme Mana Potion | 270 | 40 | 680g |

---

## New Consumable Catalog

### Stat Elixirs (6 items)

Timed buffs (1 hour real-time) that boost a single stat by 10%. Integrate with existing `activePowerUps` system. Available at L10+.

| ID | Name | Stat | Rarity | Store Price | Drop Rate |
|----|------|------|--------|-------------|-----------|
| `elixir-bull` | Elixir of the Bull | STR +10% | MASTER | 400g | ~3% |
| `elixir-fox` | Elixir of the Fox | DEX +10% | MASTER | 400g | ~3% |
| `elixir-bear` | Elixir of the Bear | CON +10% | MASTER | 400g | ~3% |
| `elixir-owl` | Elixir of the Owl | INT +10% | MASTER | 400g | ~3% |
| `elixir-sage` | Elixir of the Sage | WIS +10% | MASTER | 400g | ~3% |
| `elixir-serpent` | Elixir of the Serpent | CHA +10% | MASTER | 400g | ~3% |

### Cleansing Items (2 items)

| ID | Name | Effect | Rarity | Store Price |
|----|------|--------|--------|-------------|
| `purifying-salve` | Purifying Salve | Remove all DoT (burn, poison, bleed) | ADEPT | 150g |
| `sacred-water` | Sacred Water | Remove curse + all hard CC (paralyze, sleep, freeze, stun) | MASTER | 350g |

### Enchantment Oils (3 items)

Battle-scoped buffs. Last 5 turns in current battle. One active at a time. Available at L8+.

| ID | Name | Effect | Proc Chance | Rarity | Store Price |
|----|------|--------|-------------|--------|-------------|
| `oil-immolation` | Oil of Immolation | Attacks inflict Burn | 20% | MASTER | 300g |
| `venom-coating` | Venom Coating | Attacks inflict Poison | 25% | MASTER | 300g |
| `frostbite-tincture` | Frostbite Tincture | Attacks inflict Freeze | 15% | MASTER | 350g |

### Tactical Consumables (3 items)

| ID | Name | Effect | Costs Turn? | Rarity | Store Price |
|----|------|--------|-------------|--------|-------------|
| `firebomb` | Firebomb | Deal `40 + level * 8` fire damage | Yes | ADEPT | 200g |
| `smoke-bomb` | Smoke Bomb | Guaranteed retreat (bypass RNG) | No (instant escape) | ADEPT | 150g |
| `ironbark-ward` | Ironbark Ward | +2 DEF stages for 4 turns | Yes | MASTER | 300g |

### Phoenix Tear (1 item)

| ID | Name | Effect | Rarity | Store Price | Drop Source |
|----|------|--------|--------|-------------|-------------|
| `phoenix-tear` | Phoenix Tear | Auto-revive on combat death: 30% HP floor, mana restored to pre-death value (30% floor if lower) | EPIC | 2000g | Boss/Raid ~1% |

---

## Plan Summary

| Phase | Title | Effort | Depends On | Est. Time |
|-------|-------|--------|------------|-----------|
| 1 | Potion Rework + Model Foundation | Large | — | 2-2.5h |
| 1.5 | Tests: Potion Rework + Model | Medium | Phase 1 | 1.5-2h |
| 2 | Simple Combat Consumables | Large | Phase 1 | 2-2.5h |
| 2.5 | Tests: Simple Combat Consumables | Large | Phase 2 | 2-2.5h |
| 3 | Complex Combat Consumables | Large | Phase 2 | 2.5-3h |
| 3.5 | Tests: Complex Combat Consumables | Large | Phase 3 | 2-2.5h |
| 4 | UI Polish & Loot Tables | Medium | Phase 3 | 2-2.5h |
| 4.5 | Tests: UI Polish & Loot Tables | Medium | Phase 4 | 1.5-2h |

**Total estimated:** ~8 sessions across 16-20 hours.

**Execution order:** Strictly sequential (each phase depends on the prior). No parallelization possible.

> [!IMPORTANT]
> Phase 2 has a cross-dependency with Phase 3A: the `handleDefStageBoost` handler needs the `ConsumableBuff` type and `addConsumableBuff` store action from Phase 3A. The Ironbark Ward handler is therefore **deferred to Phase 3A** to avoid cross-phase build errors.

---

## 🔲 Phase 1: Potion Rework + Model Foundation

**Estimated Time:** 2-2.5 hours
**Prerequisite:** —
**Goal:** Rework HP/MP potions to 6 tiers, expand the ConsumableEffect enum with all new types, define every new consumable item, and update the store + loot generation to use the new tiers.

### Phase 1A: Expand Consumable Model

**Goal:** Define all new ConsumableEffect types, expand the ConsumableDefinition interface, and rewrite the CONSUMABLES record with 25 items.

**File: `src/models/Consumable.ts`**

1. **Add new ConsumableEffect types:**

```typescript
export enum ConsumableEffect {
    // Existing
    HP_RESTORE = 'hp_restore',
    MANA_RESTORE = 'mana_restore',
    REVIVE = 'revive',
    STREAK_RESTORE = 'streak',
    XP_BOOST = 'xp_boost',

    // New - Phase 2
    CLEANSE_DOT = 'cleanse_dot',
    CLEANSE_CURSE_CC = 'cleanse_curse_cc',
    DIRECT_DAMAGE = 'direct_damage',
    GUARANTEED_RETREAT = 'guaranteed_retreat',
    DEF_STAGE_BOOST = 'def_stage_boost',

    // New - Phase 3
    STAT_BOOST = 'stat_boost',
    PHOENIX_REVIVE = 'phoenix_revive',
    ENCHANT_BURN = 'enchant_burn',
    ENCHANT_POISON = 'enchant_poison',
    ENCHANT_FREEZE = 'enchant_freeze',
}
```

2. **Add optional fields to ConsumableDefinition:**

```typescript
export interface ConsumableDefinition {
    id: string;
    name: string;
    description: string;
    effect: ConsumableEffect;
    rarity: ConsumableRarity;
    effectValue: number;
    emoji: string;
    levelRange: [number, number];

    // New optional fields
    /** Duration in battle turns (for enchantments, wards) */
    turnDuration?: number;
    /** Duration in minutes (for stat elixirs) */
    realTimeDurationMinutes?: number;
    /** Target stat for stat elixirs */
    statTarget?: StatType;
    /** Status effect type inflicted by enchantment oils */
    statusType?: StatusEffectType;
    /** Proc chance for enchantment oils (0-100) */
    statusChance?: number;
    /** Stat stage change (for Ironbark Ward) */
    stageChange?: { stat: 'atk' | 'def' | 'speed'; stages: number };
    /** Damage formula for direct damage items: base + perLevel * level */
    damageFormula?: { base: number; perLevel: number };
    /** Minimum level to purchase/use */
    minLevel?: number;
    /** Whether this item is usable in combat */
    combatUsable?: boolean;
}
```

3. **Rewrite the CONSUMABLES record** with all 6 HP tiers, all 6 MP tiers, and all new items. Remove the old 4-tier potions. Use the values from the tables above.

4. **Update helper functions:**

```typescript
export function getHpPotionForLevel(level: number): string {
    if (level <= 7) return 'hp-potion-minor';
    if (level <= 15) return 'hp-potion-lesser';
    if (level <= 23) return 'hp-potion-major';
    if (level <= 31) return 'hp-potion-greater';
    if (level <= 39) return 'hp-potion-superior';
    return 'hp-potion-supreme';
}

export function getMpPotionForLevel(level: number): string {
    if (level <= 7) return 'mp-potion-minor';
    if (level <= 15) return 'mp-potion-lesser';
    if (level <= 23) return 'mp-potion-major';
    if (level <= 31) return 'mp-potion-greater';
    if (level <= 39) return 'mp-potion-superior';
    return 'mp-potion-supreme';
}
```

5. **Update HP_POTION_IDS and MP_POTION_IDS** to include the two new tiers each (major, supreme).

6. **Add new helper arrays:**

```typescript
export const STAT_ELIXIR_IDS = [
    'elixir-bull', 'elixir-fox', 'elixir-bear',
    'elixir-owl', 'elixir-sage', 'elixir-serpent',
];

export const CLEANSING_IDS = ['purifying-salve', 'sacred-water'];
export const ENCHANTMENT_IDS = ['oil-immolation', 'venom-coating', 'frostbite-tincture'];
export const TACTICAL_IDS = ['firebomb', 'smoke-bomb', 'ironbark-ward'];
```

### Phase 1B: Update Store Modal

**Goal:** Reorganize the store with all new items, level-gating, and smart tier display.

**File: `src/modals/StoreModal.ts`**

1. **Update STORE_ITEMS array** with all 6 HP potion tiers, all 6 MP potion tiers, and all new consumable items with their prices from the catalog tables.

2. **Add level-gating to the buy button.** If a consumable has `minLevel` and the character is below it, show the item greyed out with "Requires Level X" instead of the price.

3. **Add new store sections** in `renderStore()`:
   - "Health Potions" (6 tiers)
   - "Mana Potions" (6 tiers)
   - "Stat Elixirs" (6 items, L10+)
   - "Battle Supplies" (cleansing + tactical + enchantment oils)
   - "Rare Items" (Phoenix Tear, Scroll of Pardon, Revive Potion, Elixir of Experience)

4. **Only show potions the player has unlocked or is close to.** Don't overwhelm L1 players with 6 potion tiers. Show: current tier, one tier below, one tier above (greyed if locked).

### Phase 1C: Update Loot Generation

**Goal:** Verify loot generation works with new potion tier functions. Fix `revive_potion` ID typo if present.

**File: `src/services/LootGenerationService.ts`**

1. The existing `getHpPotionForLevel()` and `getMpPotionForLevel()` calls automatically use the updated functions from 1A. No changes needed to the call sites, just verify the imports still work.

2. **Fix `revive_potion` ID typo** (confirmed blocker): `rollQuestConsumable()` references `revive_potion` (underscore) but the CONSUMABLES record uses `revive-potion` (hyphen). This means revive potions have **never dropped from quest loot** — only purchasable from the store. Fix the ID in `rollQuestConsumable` to `revive-potion`. This is a pre-existing bug that must be fixed in Phase 1, not deferred.

### Phase 1D: Inventory Migration

Players with old potion IDs in their inventory need migration. The old `hp-potion-minor`, `hp-potion-lesser`, `hp-potion-greater`, `hp-potion-superior` IDs are being reused with new values, so existing inventory items automatically get the buffed values. No migration needed for potions.

> [!NOTE]
> **ID reuse means implicit buffs.** Players who already have `hp-potion-greater` in inventory will see its heal value jump from 250 HP → 660 HP (a 2.6× increase) because the ID is reused with the new tier values. This is an intentional rebalance — existing stock becomes more valuable. No migration code needed, but worth noting if a player reports "my potions heal way more now."

The new `hp-potion-major` and `hp-potion-supreme` (and MP equivalents) are new IDs that simply didn't exist before.

#### Tech Debt:
- ~~Verify `revive_potion` vs `revive-potion` ID typo~~ → **Confirmed blocker, fixed in Phase 1C**
- Old 4-tier potion IDs reused with new values — existing inventory items get buffed automatically (see note above)

### Phase 1 Manual Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] Open store, verify all 6 HP and 6 MP tiers appear with correct prices
- [ ] Buy a potion at each tier, verify gold deduction and inventory addition
- [ ] Level-gated items show "Requires Level X" when too low
- [ ] Complete a quest, verify loot drops use new potion tiers appropriate to level
- [ ] Use a potion in combat, verify the new HP values feel right
- [ ] Check the existing Revive Potion still works from recovery modal
- [ ] Check Scroll of Pardon and Elixir of Experience still appear in store

---

## 🔲 Phase 1.5: Tests — Potion Rework + Model Foundation

**Estimated Time:** 1.5-2 hours
**Prerequisite:** Phase 1 manually verified
**Goal:** Unit test the new consumable model, helper functions, and store modal level-gating. Target ≥80% line/branch coverage on modified files.

### Test Files

| Test File | Covers | Key Cases |
|-----------|--------|-----------|
| `test/models/Consumable.test.ts` | Model + helpers | All 25 definitions valid, `getHpPotionForLevel` returns correct tier at each breakpoint, `getMpPotionForLevel` edge cases (L1, L7, L8, L40), all helper arrays contain correct IDs |
| `test/modals/StoreModal.test.ts` | Store UI | Level-gating shows/hides items correctly, smart tier display shows ±1 tier, prices match definitions |

**Coverage target:** ≥80% line, ≥80% branch on `Consumable.ts`

**Command:** `npx vitest run test/models/Consumable.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## 🔲 Phase 2: Simple Combat Consumables

**Estimated Time:** 2-2.5 hours
**Prerequisite:** Phase 1
**Goal:** Create a service to handle consumable business logic (keeping BattleView focused on UI), then wire up the 4 straightforward combat consumables: cleansing items, Firebomb, and Smoke Bomb.

> [!NOTE]
> Ironbark Ward (`DEF_STAGE_BOOST`) is **deferred to Phase 3A** because it depends on the `ConsumableBuff` type and `addConsumableBuff` store action that don't exist until Phase 3A.

### Phase 2A: Create ConsumableUsageService

**File: `src/services/ConsumableUsageService.ts`** [NEW]

Create a new service to handle all consumable usage logic. This keeps business logic out of BattleView and makes it unit-testable.

```typescript
/**
 * Consumable Usage Service
 * 
 * Handles the effects of using consumable items in combat.
 * BattleView calls this service and reacts to results.
 */

import { ConsumableDefinition, ConsumableEffect, CONSUMABLES } from '../models/Consumable';
import { isDoTEffect, isHardCC, StatusEffectType } from '../models/StatusEffect';
import { useBattleStore, BattlePlayer, BattleMonster } from '../store/battleStore';
import { useCharacterStore } from '../store/characterStore';
import { copyVolatileStatusToPersistent } from './BattleService';

export interface ConsumableResult {
    success: boolean;
    logMessage: string;
    endsTurn: boolean;
    endsBattle?: 'retreat' | 'victory';
    error?: string;
}

/**
 * Execute a consumable item in combat.
 * Returns a result object describing what happened.
 * 
 * NOTE: Named `executeConsumable` (not `useConsumable`) to avoid
 * triggering React's Rules of Hooks — `use*` prefix is reserved.
 */
export function executeConsumable(
    itemId: string,
    characterLevel: number
): ConsumableResult {
    const def = CONSUMABLES[itemId];
    if (!def) {
        return { success: false, logMessage: '', endsTurn: false, error: 'Unknown item' };
    }

    switch (def.effect) {
        case ConsumableEffect.HP_RESTORE:
            return handleHpRestore(def);
        case ConsumableEffect.MANA_RESTORE:
            return handleManaRestore(def);
        case ConsumableEffect.CLEANSE_DOT:
            return handleCleanseDot();
        case ConsumableEffect.CLEANSE_CURSE_CC:
            return handleCleanseCurseCC();
        case ConsumableEffect.DIRECT_DAMAGE:
            return handleDirectDamage(def, characterLevel);
        case ConsumableEffect.GUARANTEED_RETREAT:
            return handleGuaranteedRetreat();
        // DEF_STAGE_BOOST deferred to Phase 3A (needs ConsumableBuff from battleStore)
        default:
            return { success: false, logMessage: '', endsTurn: false, error: 'Effect not implemented' };
    }
}

function handleHpRestore(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    const maxHP = store.playerStats?.maxHP ?? 0;
    const currentHP = store.playerCurrentHP;
    const newHP = Math.min(maxHP, currentHP + def.effectValue);
    store.updatePlayerHP(newHP);
    return {
        success: true,
        logMessage: `Used ${def.name}: +${def.effectValue} HP!`,
        endsTurn: true,
    };
}

function handleManaRestore(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    const maxMana = store.playerStats?.maxMana ?? 0;
    const currentMana = store.playerCurrentMana;
    const newMana = Math.min(maxMana, currentMana + def.effectValue);
    store.updatePlayerMana(newMana);
    return {
        success: true,
        logMessage: `Used ${def.name}: +${def.effectValue} MP!`,
        endsTurn: true,
    };
}

function handleCleanseDot(): ConsumableResult {
    const store = useBattleStore.getState();
    const player = store.player;
    if (!player) return { success: false, logMessage: '', endsTurn: false, error: 'No player' };

    const filtered = player.volatileStatusEffects.filter(e => !isDoTEffect(e.type));
    store.updatePlayer({ volatileStatusEffects: filtered });
    return {
        success: true,
        logMessage: 'Used Purifying Salve: Removed all afflictions!',
        endsTurn: true,
    };
}

function handleCleanseCurseCC(): ConsumableResult {
    const store = useBattleStore.getState();
    const player = store.player;
    if (!player) return { success: false, logMessage: '', endsTurn: false, error: 'No player' };

    // Remove curse + all hard CC
    const filtered = player.volatileStatusEffects.filter(
        e => e.type !== 'curse' && !isHardCC(e.type)
    );
    store.updatePlayer({ volatileStatusEffects: filtered });
    return {
        success: true,
        logMessage: 'Used Sacred Water: Cleansed curse and bindings!',
        endsTurn: true,
    };
}

function handleDirectDamage(def: ConsumableDefinition, level: number): ConsumableResult {
    // Defensive validation — use != null for both undefined and null safety
    if (!def.damageFormula?.base || def.damageFormula?.perLevel == null) {
        // Data integrity warning (not debug output) — route through debugLog if available
        console.warn('[ConsumableUsageService] Invalid damage formula for:', def.id);
        return { success: false, logMessage: '', endsTurn: false, error: 'Invalid damage formula' };
    }

    const store = useBattleStore.getState();
    const monster = store.monster;
    if (!monster) return { success: false, logMessage: '', endsTurn: false, error: 'No monster' };

    const damage = def.damageFormula.base + def.damageFormula.perLevel * level;
    const newHP = Math.max(0, monster.currentHP - damage);
    store.updateMonster({ currentHP: newHP });

    if (newHP <= 0) {
        return {
            success: true,
            logMessage: `Hurled a Firebomb: ${damage} fire damage! ${monster.name} falls!`,
            endsTurn: false,
            endsBattle: 'victory',
        };
    }

    return {
        success: true,
        logMessage: `Hurled a Firebomb: ${damage} fire damage!`,
        endsTurn: true,
    };
}

function handleGuaranteedRetreat(): ConsumableResult {
    copyVolatileStatusToPersistent();
    return {
        success: true,
        logMessage: 'Used Smoke Bomb: Vanished in a puff of smoke!',
        endsTurn: false,
        endsBattle: 'retreat',
    };
}

// handleDefStageBoost is implemented in Phase 3A alongside ConsumableBuff
// (see Phase 3A section for full implementation)
```

### Phase 2B: Update BattleView to Use Service

**File: `src/components/BattleView.tsx`**

Replace the inline item handler with a call to the service:

```typescript
import { executeConsumable } from '../services/ConsumableUsageService';

const handleUseItem = (itemId: string) => {
    const result = executeConsumable(itemId, character?.level ?? 1);

    if (!result.success) {
        console.error('[BattleView] Consumable failed:', result.error);
        return;
    }

    // Log the action
    addLogEntry({
        turn: turnNumber,
        actor: 'player',
        action: result.logMessage,
        result: 'heal',
    });

    // Remove from inventory
    removeInventoryItem(itemId, 1);
    setShowItemPicker(false);

    // Handle battle-ending effects
    if (result.endsBattle === 'retreat') {
        finalizeBattle(); // Balance testing if enabled
        endBattle('retreat');
        return;
    }
    if (result.endsBattle === 'victory') {
        handleVictory(); // Trigger victory handling
        return;
    }

    // Advance to enemy turn if this consumes the turn
    if (result.endsTurn) {
        advanceState('ENEMY_TURN');
        executeMonsterTurn();
    }
};
```

This keeps BattleView as a thin UI layer that reacts to service results.

### Phase 2C: Update ConsumablePicker

**File: `src/components/BattleView.tsx`**

Expand the filter in `ConsumablePicker` to include new combat-usable types:

```typescript
const availableConsumables = inventory.filter(item => {
    const def = CONSUMABLES[item.itemId];
    if (!def) return false;
    // Show all combat-usable consumables
    return def.combatUsable !== false && [
        ConsumableEffect.HP_RESTORE,
        ConsumableEffect.MANA_RESTORE,
        ConsumableEffect.CLEANSE_DOT,
        ConsumableEffect.CLEANSE_CURSE_CC,
        ConsumableEffect.DIRECT_DAMAGE,
        ConsumableEffect.GUARANTEED_RETREAT,
        // DEF_STAGE_BOOST deferred to Phase 3A — uncomment when handler exists
        // ConsumableEffect.DEF_STAGE_BOOST,
    ].includes(def.effect);
});
```

Update the `effectText` display to handle new types:
```typescript
const getEffectText = (def: ConsumableDefinition): string => {
    switch (def.effect) {
        case ConsumableEffect.HP_RESTORE: return `+${def.effectValue} HP`;
        case ConsumableEffect.MANA_RESTORE: return `+${def.effectValue} MP`;
        case ConsumableEffect.CLEANSE_DOT: return 'Cure Burns/Poison/Bleed';
        case ConsumableEffect.CLEANSE_CURSE_CC: return 'Cure Curse & CC';
        case ConsumableEffect.DIRECT_DAMAGE: return `~${def.damageFormula!.base + def.damageFormula!.perLevel * (character?.level ?? 1)} dmg`;
        case ConsumableEffect.GUARANTEED_RETREAT: return 'Instant Escape';
        case ConsumableEffect.DEF_STAGE_BOOST: return `+${def.stageChange!.stages} DEF`;
        default: return def.description;
    }
};
```

#### Tech Debt:
- `handleDirectDamage` damage formula doesn't account for monster resistances/weaknesses — acceptable for V1
- `handleGuaranteedRetreat` calls `copyVolatileStatusToPersistent` directly — verify this function is exported from BattleService

### Phase 2 Manual Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] Buy Purifying Salve, get burned in combat, use salve — burn icon disappears
- [ ] Buy Sacred Water, get cursed/paralyzed, use water — effects removed
- [ ] Buy Firebomb, use in combat — damage applied, monster HP drops, turn passes to enemy
- [ ] Firebomb kills monster — victory triggers correctly
- [ ] Buy Smoke Bomb, use in combat — instant retreat, no damage taken, no RNG roll
- [ ] All new items appear in consumable picker with correct descriptions
- [ ] HP/MP potions still work as before (regression check)

---

## 🔲 Phase 2.5: Tests — Simple Combat Consumables

**Estimated Time:** 2-2.5 hours
**Prerequisite:** Phase 2 manually verified
**Goal:** Unit test ConsumableUsageService and the updated ConsumablePicker. Target ≥80% coverage.

### Test Files

| Test File | Covers | Key Cases |
|-----------|--------|-----------|
| `test/services/ConsumableUsageService.test.ts` [NEW] | All handlers | HP/MP restore clamping, cleanse DoT removes only DoTs, cleanse CC removes curse+CC but not DoTs, Firebomb damage formula at multiple levels, Firebomb killing blow triggers victory, Smoke Bomb calls copyVolatileStatusToPersistent, unknown item returns error |
| `test/components/ConsumablePicker.test.ts` [NEW] | Picker UI | Filters out non-combat items, shows correct effect text per type, empty state when no items, quantity display |

**Coverage target:** ≥80% line, ≥80% branch on `ConsumableUsageService.ts`

**Store Mocking:** `ConsumableUsageService` calls `useBattleStore.getState()` directly. In tests, use the pattern established in `test/store/battleStore.test.ts`:
```typescript
import { useBattleStore } from '../../src/store/battleStore';

beforeEach(() => {
    // Reset store to initial state
    useBattleStore.setState({
        playerCurrentHP: 100,
        playerStats: { maxHP: 200, maxMana: 100 },
        monster: { currentHP: 500, statusEffects: [] },
        player: { volatileStatusEffects: [] },
        // ... other fields as needed
    });
});
```
No `vi.mock()` needed — Zustand stores work directly in tests.

**Command:** `npx vitest run test/services/ConsumableUsageService.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## 🔲 Phase 3: Complex Combat Consumables

**Estimated Time:** 2.5-3 hours
**Prerequisite:** Phase 2
**Goal:** Wire up the four systems that need new battle state: Ironbark Ward (deferred from Phase 2), enchantment oils (attack proc system), Phoenix Tear (death intercept), and stat elixirs (real-time buff integration).

### Phase 3A: Add ConsumableBuff to Battle State + Ironbark Ward

**Goal:** Add the `ConsumableBuff` type and store actions to `battleStore`, then implement the deferred Ironbark Ward handler in `ConsumableUsageService`.

**File: `src/store/battleStore.ts`**

1. Add a new type for consumable-granted buffs:

```typescript
export interface ConsumableBuff {
    /** Buff type (enchantment or stage boost) */
    type: ConsumableEffect;
    /** Turns remaining in this battle */
    turnsRemaining: number;
    /** Proc chance per attack (0-100), 0 for non-proc effects */
    chance: number;
    /** What status effect to apply on proc (null for stage boosts) */
    statusType: StatusEffectType | null;
    /** For DEF_STAGE_BOOST: how many stages to reverse on expiry */
    stageChange?: number;
}
```

2. Add `consumableBuffs: ConsumableBuff[]` to the `BattlePlayer` interface. Initialize as empty array `[]` in `hydrateBattlePlayer`.

> [!NOTE]
> **Battle reset is safe.** `hydrateBattlePlayer` creates a fresh `BattlePlayer` on every `startBattleWithMonster` call — no risk of buffs leaking between battles. Verified in `BattleService.ts`.

3. Add store actions:
   - `addConsumableBuff(buff: ConsumableBuff)` -- adds buff, replacing any existing buff of the same type (only one enchantment at a time)
   - `tickConsumableBuffs()` -- decrements `turnsRemaining` on all buffs, handles expiry:
     - For enchantment oils: simply remove when expired
     - For `DEF_STAGE_BOOST`: reverse the stage change (apply negative `stageChange`) before removal

**Expiry handling for Ironbark Ward:**
```typescript
tickConsumableBuffs: () => {
    const { player } = get();
    if (!player) return;

    // Collect side effects from expired buffs BEFORE filtering
    let defAdjustment = 0;
    for (const buff of player.consumableBuffs) {
        if (buff.turnsRemaining - 1 <= 0) {
            // This buff is expiring — collect side effects
            if (buff.type === ConsumableEffect.DEF_STAGE_BOOST && buff.stageChange) {
                defAdjustment -= buff.stageChange; // Reverse the stage boost
            }
        }
    }

    // Decrement and filter in a single pass
    const updated = player.consumableBuffs
        .map(buff => ({ ...buff, turnsRemaining: buff.turnsRemaining - 1 }))
        .filter(buff => buff.turnsRemaining > 0);

    // Apply everything in a single set() call
    const newDef = defAdjustment !== 0
        ? Math.max(-6, player.statStages.def + defAdjustment)
        : player.statStages.def;

    set({
        player: {
            ...player,
            consumableBuffs: updated,
            ...(defAdjustment !== 0 ? {
                statStages: { ...player.statStages, def: newDef },
            } : {}),
        },
    });
},

```

**File: `src/services/ConsumableUsageService.ts`**

Now that `ConsumableBuff` and `addConsumableBuff` exist, add the deferred Ironbark Ward handler:

```typescript
// Add to switch in useConsumableInCombat:
case ConsumableEffect.DEF_STAGE_BOOST:
    return handleDefStageBoost(def);

// Handler:
function handleDefStageBoost(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    const player = store.player;
    if (!player || !def.stageChange) {
        return { success: false, logMessage: '', endsTurn: false, error: 'Invalid stage change' };
    }

    const newDef = Math.min(6, Math.max(-6, player.statStages.def + def.stageChange.stages));
    store.updatePlayer({ statStages: { ...player.statStages, def: newDef } });

    store.addConsumableBuff({
        type: ConsumableEffect.DEF_STAGE_BOOST,
        turnsRemaining: def.turnDuration ?? 4,
        chance: 0,
        statusType: null,
        stageChange: def.stageChange.stages,
    });

    return { success: true, logMessage: 'Used Ironbark Ward: Defense rose!', endsTurn: true };
}
```

### Phase 3B: Implement Enchantment Oil Usage

**Goal:** Add enchantment oil handlers that return `ConsumableResult` (maintaining the service's stateless pattern).

**File: `src/services/ConsumableUsageService.ts`**

Add enchantment oil handling to the service (not BattleView):

```typescript
case ConsumableEffect.ENCHANT_BURN:
case ConsumableEffect.ENCHANT_POISON:
case ConsumableEffect.ENCHANT_FREEZE:
    return handleEnchantmentOil(def);
```

Handler (returns `ConsumableResult` — BattleView handles state transitions):
```typescript
function handleEnchantmentOil(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    
    const buff: ConsumableBuff = {
        type: def.effect,
        turnsRemaining: def.turnDuration ?? 5,
        chance: def.statusChance ?? 20,
        statusType: def.statusType!,
    };
    store.addConsumableBuff(buff);

    return {
        success: true,
        logMessage: `Applied ${def.name}: attacks may inflict ${getStatusDisplayName(def.statusType!)}!`,
        endsTurn: true,
    };
}
```

### Phase 3C: Enchantment Proc System

**Goal:** Add `processConsumableBuffProcs()` to StatusEffectService and wire it into both attack paths in BattleService.

**File: `src/services/StatusEffectService.ts`**

Add a new function to handle consumable buff procs. This keeps `BattleService` focused on turn execution while `StatusEffectService` owns all status-related logic:

```typescript
import { BattleMonster } from '../store/battleStore';
import { ConsumableBuff } from '../store/battleStore';
import { getStatusDisplayName } from '../models/StatusEffect';

/**
 * Process consumable buff procs after player deals damage.
 * Called from BattleService after damage is dealt in attacks/skills.
 * 
 * This is a PURE function — it takes data in and returns data out.
 * BattleService owns the store writes, keeping StatusEffectService
 * free of store dependencies (easier to test, no circular imports).
 * 
 * BattleMonster structurally satisfies StatusCombatant (has name, maxHP,
 * currentHP, statusEffects), so no `as any` cast is needed.
 * 
 * @param damage Damage dealt (no procs if 0)
 * @param monster The target monster (read from store by caller)
 * @param consumableBuffs The player's active consumable buffs
 * @returns Object with procOccurred flag, updated monster (if proc'd), and log message
 */
export function processConsumableBuffProcs(
    damage: number,
    monster: BattleMonster,
    consumableBuffs: ConsumableBuff[]
): { procOccurred: boolean; updatedMonster?: Partial<BattleMonster>; logMessage?: string } {
    if (damage <= 0 || !consumableBuffs?.length) {
        return { procOccurred: false };
    }

    // Only check enchantment-type buffs (not stage boosts)
    const enchantmentBuffs = consumableBuffs.filter(
        b => b.statusType !== null && b.chance > 0
    );

    for (const buff of enchantmentBuffs) {
        if (Math.random() * 100 < buff.chance) {
            // Deep-copy monster with fresh statusEffects to avoid mutating caller's reference
            const monsterCopy: BattleMonster = {
                ...monster,
                statusEffects: [...(monster.statusEffects ?? [])],
            };

            // Apply status to the copy (applyStatus mutates in-place)
            applyStatus(
                monsterCopy,
                buff.statusType!,
                3, // 3 turns duration for consumable-applied effects
                'player',
                'minor',
                'enchant_oil' // sourceSkillId — identifies the source for debugging
            );

            return {
                procOccurred: true,
                updatedMonster: { statusEffects: monsterCopy.statusEffects },
                logMessage: `${getStatusDisplayName(buff.statusType!)} proc'd from enchantment!`,
            };
        }
    }
    return { procOccurred: false };
}
```

**File: `src/services/BattleService.ts`**

After damage is dealt in `executePlayerAttack()` and `executePlayerSkill()`, call the proc handler.

**Exact insertion point for `executePlayerAttack()`** (currently at line ~424-457):
Insert **after** `store.updateMonsterHP(newMonsterHP)` but **before** `store.advanceState('ANIMATING_PLAYER')`:

```typescript
import { processConsumableBuffProcs } from './StatusEffectService';

// After damage calculation and HP update...
store.updateMonsterHP(newMonsterHP);

// Check for enchantment oil procs — pure function, caller handles state write
const procResult = processConsumableBuffProcs(
    damage,
    store.monster!,
    store.player?.consumableBuffs ?? []
);
if (procResult.procOccurred) {
    store.updateMonster(procResult.updatedMonster!);
    store.addLogEntry({
        turn: store.turnNumber,
        actor: 'player',
        action: procResult.logMessage!,
        result: 'hit',
    });
}

store.advanceState('ANIMATING_PLAYER');
```

**Same pattern for `executePlayerSkill()`** — find the damage application point and insert the proc call after HP update.

**Tick consumable buffs at end of player turn:**

> [!IMPORTANT]
> **Spike item:** The exact insertion point requires tracing the battle state machine flow during implementation. The goal is to guarantee `tickConsumableBuffs()` runs **exactly once per player turn**, after both attack/skill execution and status tick. There are at least 4 defeat paths through `handleDefeat`, and `checkBattleOutcomeWithStatusTick` already ticks status effects — placing the buff tick in the wrong location could cause double-ticking (halving buff durations) or missed ticks.
>
> **During implementation:** Read the full turn flow in `BattleService.ts`, trace where control returns after `executePlayerAttack`/`executePlayerSkill`, and find the single point that runs once before `ENEMY_TURN`. Likely candidates: end of `executePlayerTurn()`, or the success path of `checkBattleOutcomeWithStatusTick()` (after status tick, before advancing to enemy turn).

### Phase 3D: Implement Phoenix Tear

**Goal:** Add Phoenix Tear death intercept in `handleDefeat()` and change `removeInventoryItem` to return `boolean`.

> [!IMPORTANT]
> **Critical prerequisite:** `removeInventoryItem` in `characterStore.ts` currently returns `void`. It **must** be changed to return `boolean` first, otherwise the Phoenix Tear guard (`const consumed = characterStore.removeInventoryItem(...)`) will always be `undefined` (falsy) and the tear will silently never activate.

**Step 1: Update `characterStore.removeInventoryItem` to return boolean**

This is a small but critical change:

```typescript
// In characterStore.ts, modify removeInventoryItem:
removeInventoryItem: (itemId: string, quantity: number = 1): boolean => {
    const { inventory } = get();
    const existing = inventory.find((i) => i.itemId === itemId);

    if (!existing || existing.quantity < quantity) return false; // Not found or insufficient

    if (existing.quantity <= quantity) {
        set({ inventory: inventory.filter((i) => i.itemId !== itemId) });
    } else {
        set({
            inventory: inventory.map((i) =>
                i.itemId === itemId
                    ? { ...i, quantity: i.quantity - quantity }
                    : i
            ),
        });
    }
    return true;
},
```

**Step 2: Add Phoenix Tear check in `handleDefeat()`**

**File: `src/services/BattleService.ts`**

Modify `handleDefeat()` to check for Phoenix Tear *before* setting unconscious. Use the boolean return to guard against edge cases like double-defeat:

```typescript
function handleDefeat(): void {
    const store = useBattleStore.getState();
    const characterStore = useCharacterStore.getState();
    const character = characterStore.character;

    if (!character) return;

    // === PHOENIX TEAR CHECK ===
    const inventory = characterStore.inventory;
    const hasPhoenixTear = inventory.find(
        i => i.itemId === 'phoenix-tear' && i.quantity > 0
    );

    if (hasPhoenixTear) {
        // Try to consume the tear - use boolean return to guard against double-defeat
        const consumed = characterStore.removeInventoryItem('phoenix-tear', 1);
        if (!consumed) {
            // Inventory changed between check and removal (edge case)
            // Proceed with normal defeat
        } else {
            // Calculate revival HP: 30% of max
            const maxHP = store.playerStats?.maxHP ?? character.maxHP;
            const reviveHP = Math.floor(maxHP * 0.30);

            // Calculate revival mana: restore to pre-death value, 30% floor
            const maxMana = store.playerStats?.maxMana ?? character.maxMana;
            const preDeathMana = store.playerCurrentMana;
            const manaFloor = Math.floor(maxMana * 0.30);
            const reviveMana = Math.max(manaFloor, preDeathMana);

            // Revive the player
            store.updatePlayerHP(reviveHP);
            store.updatePlayerMana(reviveMana);

            // Log the revival
            store.addLogEntry({
                turn: store.turnNumber,
                actor: 'player',
                action: '🔥 Phoenix Tear activates! You rise from the ashes!',
                result: 'heal',
            });

            // Continue battle - back to player input
            store.incrementTurn();
            store.advanceState('PLAYER_INPUT');

            // Save the inventory change.
            // saveCallback is a module-level variable in BattleService.ts
            // (set via setSaveCallback() during plugin init in main.ts).
            // Use `void` to explicitly signal intentional non-awaiting,
            // since handleDefeat is synchronous (per Obsidian guideline §5).
            if (saveCallback) {
                void saveCallback().catch(err =>
                    console.error('[BattleService] Save failed:', err)
                );
            }

            return; // Don't proceed with normal defeat
        }
    }

    // ... existing defeat logic continues unchanged ...
}
```

**IMPORTANT:** The Phoenix Tear check must happen in ALL places that trigger defeat:
1. `handleDefeat()` -- main path (already covered above)
2. DoT death check in `executePlayerTurn()` (line ~364) -- calls `handleDefeat()`, so it's covered
3. Failed retreat death (line ~590) -- calls `handleDefeat()`, covered
4. DoT death in `checkBattleOutcomeWithStatusTick()` (line ~1407) -- calls `handleDefeat()`, covered

All death paths go through `handleDefeat()`, so a single check there covers everything.

### Phase 3E: Implement Stat Elixirs

**Goal:** Add stat elixir usage from character page via `activePowerUps` integration.

**File: `src/store/characterStore.ts`** (for activePowerUps integration)

Stat elixirs are NOT combat-only -- they're used from inventory (character page) and last 1 real-time hour. They integrate with the existing `activePowerUps` system.

1. **Add to ConsumablePicker filter:** Stat elixirs should NOT appear in the battle consumable picker. Set `combatUsable: false` on their definitions in `Consumable.ts`.

2. **Add a `useStatElixir` action to characterStore:**

The `ActivePowerUp` interface already exists in the codebase. Use it exactly:

```typescript
import { ActivePowerUp } from '../services/PowerUpService';
import { CONSUMABLES, ConsumableEffect } from '../models/Consumable';

useStatElixir: (itemId: string): boolean => {
    const { character, inventory } = get();
    if (!character) return false;

    const def = CONSUMABLES[itemId];
    if (!def || def.effect !== ConsumableEffect.STAT_BOOST) return false;
    if (!def.statTarget) return false;

    // Check inventory
    const has = inventory.find(i => i.itemId === itemId && i.quantity > 0);
    if (!has) return false;

    // Consume - use boolean return for safety
    const consumed = get().removeInventoryItem(itemId, 1);
    if (!consumed) return false;

    // Calculate the stat boost — use stat_percent_boost (same as Iron Grip)
    // This applies +10% AFTER all flat bonuses, matching the plan's description.
    // Using stat_boost would only add 10% of base (before gear), which is wrong.

    // Create ActivePowerUp using stat_percent_boost (NOT stat_boost)
    const newPowerUp: ActivePowerUp = {
        id: `elixir_${def.statTarget}_${Date.now()}`,
        name: def.name,
        icon: def.emoji,
        description: def.description,
        triggeredBy: 'consumable',  // Metadata field, not validated
        startedAt: new Date().toISOString(),
        expiresAt: new Date(
            Date.now() + (def.realTimeDurationMinutes ?? 60) * 60 * 1000
        ).toISOString(),
        effect: {
            type: 'stat_percent_boost',
            stat: def.statTarget,
            value: 0.10,  // +10% of calculated stat (applied after gear bonuses)
        },
    };

    set({
        character: {
            ...character,
            activePowerUps: [...(character.activePowerUps || []), newPowerUp],
            lastModified: new Date().toISOString(),
        },
    });

    return true;
},
```

3. **Usage location:** The stat elixirs will be usable from the Character Page consumable belt (already has the infrastructure from the Character Page feature). The `ConsumablesBelt.tsx` component should show stat elixirs and call `useStatElixir()` on click.

#### Tech Debt:
- Phoenix Tear mana restoration uses `store.playerCurrentMana` which may already be at 0 when `handleDefeat` fires — need to verify pre-death mana is captured before HP drops to 0
- ~~`tickConsumableBuffs` mutates state during filter~~ → **Fixed: now uses collect-then-apply pattern (see Phase 3A)**
- Stat elixirs use `activePowerUps` with `stat_percent_boost` type (same as Iron Grip) — collision policy is `refresh` by default, which is correct for elixirs (re-drinking resets the timer)

### Phase 3 Manual Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] **Ironbark Ward:**
  - [ ] Buy Ironbark Ward, use in combat — DEF stage increases, enemy hits for less damage
  - [ ] After 4 turns, DEF boost reverses back to pre-ward value
- [ ] **Enchantment Oils:**
  - [ ] Buy Oil of Immolation, use in combat — "attacks may inflict Burning" log appears
  - [ ] Attack monster — 20% chance to see "Burning proc'd!" and burn icon on monster
  - [ ] After 5 turns, enchantment expires silently (no more procs)
  - [ ] Using a second oil replaces the first (only one active)
- [ ] **Phoenix Tear:**
  - [ ] Buy Phoenix Tear, die in combat — "Phoenix Tear activates!" instead of defeat screen
  - [ ] HP is 30% of max after revival
  - [ ] Mana is at pre-death value (or 30% if pre-death was lower)
  - [ ] Battle continues from player input after revival
  - [ ] Tear is consumed from inventory (check store/inventory count)
  - [ ] Without a tear, defeat works normally (regression check)
- [ ] **Stat Elixirs:**
  - [ ] Buy Elixir of the Bull, use from character page
  - [ ] STR increases by 10% in character stats display
  - [ ] Buff appears in active buffs display
  - [ ] After 1 hour (or by manually adjusting the clock), buff expires
  - [ ] Elixir does NOT appear in battle consumable picker

---

## 🔲 Phase 3.5: Tests — Complex Combat Consumables

**Estimated Time:** 2-2.5 hours
**Prerequisite:** Phase 3 manually verified
**Goal:** Unit test enchantment proc system, Phoenix Tear intercept, Ironbark Ward expiry, and stat elixir integration. Target ≥80% coverage.

### Test Files

| Test File | Covers | Key Cases |
|-----------|--------|-----------|
| `test/services/ConsumableUsageService.test.ts` | Add Phase 3 handlers | Ironbark Ward applies +2 DEF stages, enchantment oil adds buff to store, enchantment oil replaces existing buff |
| `test/store/battleStore.test.ts` | ConsumableBuff actions | `addConsumableBuff` adds/replaces, `tickConsumableBuffs` decrements, DEF_STAGE_BOOST reversal on expiry, enchantment removal on expiry |
| `test/services/StatusEffectService.test.ts` | Proc system | `processConsumableBuffProcs` rolls correctly, applies status to monster, only one proc per attack, no proc on 0 damage |
| `test/services/BattleService.test.ts` | Phoenix Tear | Tear consumed on death, HP restored to 30%, mana restored with floor, battle continues after revival, no tear = normal defeat |
| `test/store/characterStore.test.ts` | Updated actions | `removeInventoryItem` returns false when item not found, returns true on success, `useStatElixir` creates correct `ActivePowerUp` |

**Coverage target:** ≥80% line, ≥80% branch on `ConsumableUsageService.ts`, `battleStore.ts`

**Store Mocking:** Same pattern as Phase 2.5 — use `useBattleStore.setState()` and `useCharacterStore.setState()` to seed state before each test. For `processConsumableBuffProcs`, seed `monster` and `player.consumableBuffs` in the store. For `removeInventoryItem` boolean return, seed `inventory` in `characterStore`. See Phase 2.5 for full pattern.

**Command:** `npx vitest run test/services/ConsumableUsageService.test.ts test/store/battleStore.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## 🔲 Phase 4: UI Polish & Loot Tables

**Estimated Time:** 2-2.5 hours
**Prerequisite:** Phase 3
**Goal:** Polish the consumable picker UI with categories, expand the store with proper sections, update all loot tables, and do a final balance pass.

### Phase 4A: Categorized Consumable Picker

**Goal:** Replace the flat item list with grouped sections (Potions, Cleansing, Enchantments, Tactical).

**File: `src/components/BattleView.tsx`**

Replace the flat list in `ConsumablePicker` with grouped sections:

```
┌─────────────────────────────┐
│ 🧪 Use Item            [✕] │
├─────────────────────────────┤
│ ❤️ Potions                  │
│ [Minor HP +130 x3] [Major MP +100 x1] │
├─────────────────────────────┤
│ 🧹 Cleansing                │
│ [Purifying Salve x2]        │
├─────────────────────────────┤
│ ✨ Enchantments              │
│ [Oil of Immolation x1]      │
├─────────────────────────────┤
│ 💣 Tactical                  │
│ [Firebomb x2] [Smoke Bomb x1] │
└─────────────────────────────┘
```

Group consumables by category using the helper arrays from Phase 1A:

```typescript
const potions = available.filter(i => HP_POTION_IDS.includes(i.itemId) || MP_POTION_IDS.includes(i.itemId));
const cleansing = available.filter(i => CLEANSING_IDS.includes(i.itemId));
const enchantments = available.filter(i => ENCHANTMENT_IDS.includes(i.itemId));
const tactical = available.filter(i => TACTICAL_IDS.includes(i.itemId));
```

Only render sections that have items. Empty categories are hidden.

### Phase 4B: Store Modal Category Overhaul

**File: `src/modals/StoreModal.ts`**

Reorganize the store into 5 tabs or collapsible sections:

1. **Potions** -- HP and MP potions side by side, only showing relevant tiers (current ± 1)
2. **Elixirs** -- Stat elixirs (L10+ gate)
3. **Battle Supplies** -- Cleansing items, enchantment oils (L8+), tactical items
4. **Rare Items** -- Phoenix Tear (L15+), Scroll of Pardon, Elixir of Experience
5. **Recovery** -- Revive Potion (existing)

**Smart tier display for potions:** Don't show all 6 tiers at once. Show:
- The tier matching the character's level
- One tier below (cheaper option)
- One tier above (if unlocked, for players who want to stock up early)

This keeps the store clean at any level.

### Phase 4C: Expanded Loot Tables

**File: `src/services/LootGenerationService.ts`**

1. **Update `QUEST_CONSUMABLE_WEIGHTS`** to include new items:

```typescript
const QUEST_CONSUMABLE_WEIGHTS = {
    hp: 60,           // HP potion (most common)
    mp: 35,           // MP potion
    revive: 8,        // Revive potion
    cleansing: 10,    // Purifying Salve or Sacred Water
    tactical: 5,      // Firebomb, Smoke Bomb, or Ironbark Ward
    // Stat elixirs and enchantments NOT in quest loot
    // Phoenix Tear NOT in quest loot
};
```

2. **Add combat-specific consumable drops.** Create a new method:

```typescript
/**
 * Roll a consumable from combat loot tables.
 * Rarer items available from higher-tier monsters.
 */
private rollCombatConsumable(
    level: number,
    monsterTier: MonsterTier
): LootReward | null {
    // Base consumable drop chance by tier
    const consumableChance: Record<MonsterTier, number> = {
        overworld: 0.15,
        dungeon: 0.25,
        elite: 0.35,
        boss: 0.60,
        raid_boss: 0.80,
    };

    if (Math.random() > consumableChance[monsterTier]) return null;

    // Boss/raid can drop rare items
    if ((monsterTier === 'boss' || monsterTier === 'raid_boss')
        && Math.random() < 0.01) {
        return { type: 'consumable', itemId: 'phoenix-tear', quantity: 1 };
    }

    // Elite+ can drop enchantment oils
    if (monsterTier !== 'overworld' && Math.random() < 0.08) {
        const oils = ['oil-immolation', 'venom-coating', 'frostbite-tincture'];
        return {
            type: 'consumable',
            itemId: this.pickRandom(oils),
            quantity: 1,
        };
    }

    // Elite+ can drop stat elixirs
    if (monsterTier !== 'overworld' && Math.random() < 0.05) {
        return {
            type: 'consumable',
            itemId: this.pickRandom(STAT_ELIXIR_IDS),
            quantity: 1,
        };
    }

    // Default: HP or MP potion
    const itemId = Math.random() < 0.6
        ? getHpPotionForLevel(level)
        : getMpPotionForLevel(level);

    return { type: 'consumable', itemId, quantity: 1 };
}
```

3. **Call `rollCombatConsumable()`** in `generateCombatLoot()` after the gear roll. This gives combat a chance to drop consumables independent of gear.

4. **Update chest loot** in `generateChestLoot()`: Golden chests should have a small chance to drop cleansing items or tactical consumables instead of just potions.

### Phase 4D: CSS for New Consumable Categories

**Goal:** Add CSS styling for category sections, rarity borders, and enchantment glow effects.

**File: `src/styles/combat.css`** (or `inventory.css`)

Add styles for:
- `.qb-consumable-section` -- category header in the picker
- `.qb-consumable-section-title` -- section label
- Enchantment oil items should have a subtle glow/border to indicate they're buff-type
- Phoenix Tear should have epic rarity border color
- Tactical items could have a distinct background tint

> [!IMPORTANT]
> **All visual differentiation must be via CSS class assignment only.** No `element.style.*` or inline styles — the codebase was just scrubbed of all `innerHTML` and inline styles for Obsidian guideline compliance. Use CSS classes from `combat.css` or `inventory.css` with CSS variables for theme compatibility.

### Phase 4E: Balance Verification Pass

**Goal:** Log actual HP/MP values for multiple classes and validate potion healing percentages against the tuning tables.

Before finalizing, log these values for a real character and compare against the tuning tables:

```
For your L30 Warrior:
- Max HP: ____  (expected ~1655)
- Superior HP Potion heals: 880 (should be ~53%)
- Greater HP Potion heals: 660 (should be ~40%)
- Max Mana: ____
- Superior MP Potion heals: 200

For a fresh L1 character:
- Max HP: ____  (expected ~240)
- Minor HP Potion heals: 130 (should be ~54%)
```

Adjust the flat values in `Consumable.ts` if the percentages are off. Target range: 45-60% at introduction level.

#### Tech Debt:
- `rollCombatConsumable` uses `MonsterTier` type which may need importing (verify against existing type usage in `LootGenerationService`)
- Potion tier smart display (±1 tier) may need edge-case handling at L1 (no tier below) and L40 (no tier above)

### Phase 4 Manual Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] Consumable picker shows grouped categories
- [ ] Empty categories don't show in picker
- [ ] Store shows organized sections with level-gating
- [ ] Potion tier filtering works (only shows relevant tiers)
- [ ] Kill overworld monsters — consumables occasionally drop
- [ ] Kill bosses — rare items (oils, elixirs, phoenix tear) can drop
- [ ] Golden chests can drop cleansing/tactical items
- [ ] Full regression: all existing functionality still works
  - [ ] Quest completion loot
  - [ ] Combat victory/defeat
  - [ ] Revive potion from unconscious
  - [ ] Dungeon exploration chests

---

## 🔲 Phase 4.5: Tests — UI Polish & Loot Tables

**Estimated Time:** 1.5-2 hours
**Prerequisite:** Phase 4 manually verified
**Goal:** Unit test categorized picker grouping, store level-gating, and combat loot drops. Target ≥80% coverage.

### Test Files

| Test File | Covers | Key Cases |
|-----------|--------|-----------|
| `test/components/ConsumablePicker.test.ts` | Categorized picker | Items grouped correctly, empty categories hidden, enchantment items show glow styling |
| `test/modals/StoreModal.test.ts` | Store categories | Level-gating at L1/L10/L15, smart tier display shows ±1, category sections render |
| `test/services/LootGenerationService.test.ts` | Combat drops | `rollCombatConsumable` respects tier chances, boss-only items don't drop from overworld, HP/MP defaults to level-appropriate tier |

**Coverage target:** ≥80% line, ≥80% branch on modified sections of `LootGenerationService.ts`

**Command:** `npx vitest run test/services/LootGenerationService.test.ts | Out-File -FilePath test-output.txt -Encoding utf8`

---

## Verification Checklist

| Test | Expected | Status |
|------|----------|--------|
| L1 Minor HP Potion heals ~54% | 130 / ~240 HP | 🔲 |
| L8 Lesser HP Potion heals ~55% | 265 / ~480 HP | 🔲 |
| L30 Superior HP Potion heals ~53% | 880 / ~1655 HP | 🔲 |
| Firebomb at L30 deals ~280 dmg | 40 + 30*8 = 280 | 🔲 |
| Ironbark Ward expires after 4 turns | DEF reverts | 🔲 |
| Phoenix Tear revives at 30% HP | 30% of maxHP | 🔲 |
| Stat Elixir lasts 1 real hour | Expires via activePowerUps | 🔲 |
| `removeInventoryItem` returns boolean | `false` when not found | 🔲 |
| Enchantment oil procs 20-25% of attacks | Over 20+ attacks | 🔲 |
| Using second oil replaces first | Only one buff active | 🔲 |
| All 168+ existing tests pass | `npx vitest run` | 🔲 |

---

## File Change Summary

| File | Phase | Changes |
|------|---------|---------|
| `src/models/Consumable.ts` | 1 | Rewrite: 6 potion tiers, expanded enum, ~25 item definitions, new fields |
| `src/modals/StoreModal.ts` | 1, 4 | P1: new prices/items. P4: category sections, level-gating, smart tier display |
| `src/services/LootGenerationService.ts` | 1, 4 | P1: verify imports. P4: combat consumable drops, expanded weights |
| `src/services/ConsumableUsageService.ts` | 2, 3 | [NEW] P2: HP/MP, cleanse, firebomb, smoke bomb handlers. P3: enchantment oil + Ironbark Ward |
| `src/components/BattleView.tsx` | 2, 4 | P2: Thin wrapper calling ConsumableUsageService. P4: Categorized picker UI |
| `src/store/battleStore.ts` | 3 | ConsumableBuff type (enchantments + stage boosts), add/tick actions with expiry |
| `src/services/StatusEffectService.ts` | 3 | [MODIFY] Add `processConsumableBuffProcs()` for enchantment procs |
| `src/services/BattleService.ts` | 3 | Phoenix Tear check in `handleDefeat`, call `processConsumableBuffProcs()` |
| `src/store/characterStore.ts` | 3 | [MODIFY] `removeInventoryItem` returns boolean, add `useStatElixir` action |
| `src/styles/combat.css` | 4 | Category picker styles, enchantment glow, rarity borders |

### New Test Files

| File | Phase | Covers |
|------|-------|--------|
| `test/models/Consumable.test.ts` | 1.5 | Model definitions, helper functions |
| `test/services/ConsumableUsageService.test.ts` | 2.5, 3.5 | All consumable handlers |
| `test/components/ConsumablePicker.test.ts` | 2.5, 4.5 | Picker UI, categories |
| `test/modals/StoreModal.test.ts` | 1.5, 4.5 | Store level-gating, categories |
| `test/store/battleStore.test.ts` | 3.5 | ConsumableBuff actions/expiry |
| `test/services/StatusEffectService.test.ts` | 3.5 | Enchantment proc system |
| `test/services/BattleService.test.ts` | 3.5 | Phoenix Tear intercept |
| `test/store/characterStore.test.ts` | 3.5 | `removeInventoryItem` boolean, `useStatElixir` |
| `test/services/LootGenerationService.test.ts` | 4.5 | Combat consumable drops |

### Files NOT Changed

- `main.ts` — no new commands or lifecycle changes needed
- `src/config/combatConfig.ts` — no balance constant changes
- `src/models/StatusEffect.ts` — existing `isDoTEffect`, `isHardCC` types sufficient

---

## Security & Validation

All consumable usage flows must guard against invalid input, since item IDs come from user-facing inventory state:

| Check | Location | Behavior on Failure |
|-------|----------|--------------------|
| Unknown `itemId` | `executeConsumable` | Return `{ success: false, error: 'Unknown item' }` |
| Missing `statTarget` | `useStatElixir` | Return `false` (no-op) |
| Null `damageFormula.perLevel` | `handleDirectDamage` | `console.warn` + return failure |
| Missing `stageChange` | `handleDefStageBoost` | Return `{ success: false, error: 'Invalid stage change' }` |
| Invalid `statusType` on enchantment | `handleEnchantmentOil` | Non-null assertion (`!`) — safe because only called for enum-matched defs |
| Insufficient inventory | `removeInventoryItem` | Returns `false` — caller must check |
| Double-defeat race | `handleDefeat` Phoenix Tear | `removeInventoryItem` boolean guard prevents double-consumption |

**No user-generated strings** are rendered via `innerHTML` — all log messages use string interpolation into React JSX or Obsidian DOM API calls.

---

## Performance Considerations

| Concern | Impact | Mitigation |
|---------|--------|------------|
| `processConsumableBuffProcs` runs every attack | **Low** — filters 0-3 buffs, single RNG roll, early-exit on no procs | No optimization needed |
| `tickConsumableBuffs` runs every turn | **Low** — map + filter over 0-3 buffs, single `set()` call | No optimization needed |
| Deep-copy monster for proc handler | **Negligible** — shallow spread + array spread of ~0-5 status effects | Avoids Zustand mutation bug, worth the copy |
| Store modal renders 25+ items | **Low** — smart tier display limits visible items to ~8-12 at any level | Already mitigated by design |
| Stat elixir expiry check | **None** — handled by existing `activePowerUps` expiry system which already iterates power-ups periodically | No new timer needed |

---

## Rollback Plan

If the potion rebalance feels wrong after testing:

1. **Potion values only:** Revert just the `effectValue` numbers in `Consumable.ts` CONSUMABLES record. All other changes (new types, store categories, UI) are independent and can stay.
2. **Individual consumable types:** Each consumable handler in `ConsumableUsageService` is self-contained. Remove any single type (e.g., enchantment oils) by removing the switch case and the store definition, without affecting other types.
3. **Full rollback:** Revert from git. The feature is entirely additive — no destructive changes to existing data structures except `removeInventoryItem` return type (which is backward-compatible since `void` is falsy anyway).

---

## Key References

| Concept | File | Notes |
|---------|------|-------|
| Current consumable model | `src/models/Consumable.ts` | Starting point for rewrite |
| Battle item usage | `src/components/BattleView.tsx:760-795` | Current HP/MP handler |
| Defeat handling | `src/services/BattleService.ts:handleDefeat()` | Phoenix Tear intercept point |
| Player attack | `src/services/BattleService.ts:executePlayerAttack()` | Enchantment proc point |
| Player skill | `src/services/BattleService.ts:executePlayerSkill()` | Enchantment proc point |
| Status effect application | `src/services/StatusEffectService.ts:applyStatus()` | Used by enchantment procs |
| Active power-ups | `src/services/PowerUpService.ts` | Stat elixir integration model |
| Combat HP formula | `src/config/combatConfig.ts:HP_BASE etc.` | For validating potion values |
| Loot generation | `src/services/LootGenerationService.ts` | Quest + combat drop tables |
| Store modal | `src/modals/StoreModal.ts` | Purchasing UI |
| Character store inventory | `src/store/characterStore.ts` | addInventoryItem, removeInventoryItem |

---

## Tuning Notes

### Values That Need Real-World Validation

All HP/MP potion values are estimates based on one data point (L30 Warrior = 1655 HP). Before finalizing Session 1:

1. Log actual HP/MP for at least 3 classes at levels 1, 8, 16, 24, 32 (use BalanceTestingService or manual check)
2. Compare against the "Estimated Median HP Pools" table
3. Adjust potion values to hit the 50-55% target at each tier's intro level

### Known Compromises

- **Ironbark Ward duration:** The +2 DEF stages auto-expire after 4 turns via the `ConsumableBuff` system added in Phase 3A. The `tickConsumableBuffs` action reverses the stage change on expiry.
- **Enchantment oils are battle-scoped only:** Simpler than cross-battle real-time buffs. Can expand later if there's demand.
- **Stat elixirs use activePowerUps:** The `ActivePowerUp` interface in `Character.ts` already supports `{ type: 'stat_boost', stat: StatType, value: number }` via the `PowerUpEffect` union. The `triggeredBy: 'consumable'` field is a metadata string and not validated, so no interface changes needed.
- **No consumable crafting:** Intentionally out of scope. Store + loot drops are the only acquisition paths for now.

### Price Economy Sanity Check

At L30 (overworld fight yields ~70g):
- Level-appropriate HP potion (Superior, 550g) = ~8 fights of gold
- Firebomb (200g) = ~3 fights
- Phoenix Tear (2000g) = ~29 fights (should feel expensive and precious)
- Stat Elixir (400g) = ~6 fights

These feel right for a casual RPG economy -- potions are a regular expense, tactical items are affordable treats, and Phoenix Tears are saved for important fights.
