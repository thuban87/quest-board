# Expanded Consumables Implementation Guide

**Status:** Not Started
**Estimated Sessions:** 4
**Created:** 2026-02-06

---

## Table of Contents

- [Overview](#overview)
- [Design Decisions](#design-decisions)
- [HP/Mana Potion Rework](#hpmana-potion-rework)
- [New Consumable Catalog](#new-consumable-catalog)
- [Session 1: Potion Rework + Model Foundation](#session-1-potion-rework--model-foundation)
- [Session 2: Simple Combat Consumables](#session-2-simple-combat-consumables)
- [Session 3: Complex Combat Consumables](#session-3-complex-combat-consumables)
- [Session 4: UI Polish & Loot Tables](#session-4-ui-polish--loot-tables)
- [File Change Summary](#file-change-summary)
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

## Session 1: Potion Rework + Model Foundation

**Goal:** Rework HP/MP potions to 6 tiers, expand the ConsumableEffect enum with all new types, define every new consumable item, and update the store + loot generation to use the new tiers.

### Phase 1A: Expand Consumable Model

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

**File: `src/services/LootGenerationService.ts`**

1. The existing `getHpPotionForLevel()` and `getMpPotionForLevel()` calls automatically use the updated functions from 1A. No changes needed to the call sites, just verify the imports still work.

2. Verify `rollQuestConsumable()` still works. The `revive_potion` ID has a typo (underscore vs hyphen: `revive_potion` vs `revive-potion`). Check and fix if needed -- this is a pre-existing bug.

### Phase 1D: Inventory Migration

Players with old potion IDs in their inventory need migration. The old `hp-potion-minor`, `hp-potion-lesser`, `hp-potion-greater`, `hp-potion-superior` IDs are being reused with new values, so existing inventory items automatically get the buffed values. No migration needed for potions.

The new `hp-potion-major` and `hp-potion-supreme` (and MP equivalents) are new IDs that simply didn't exist before.

### Session 1 Testing

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

## Session 2: Simple Combat Consumables

**Goal:** Wire up the 5 straightforward combat consumables that don't need new battle state: cleansing items, Firebomb, Smoke Bomb, and Ironbark Ward.

### Phase 2A: Refactor Item Handler in BattleView

**File: `src/components/BattleView.tsx`**

The current item handler (around line 760-795) only handles `HP_RESTORE` and `MANA_RESTORE`. Refactor into a switch statement:

```typescript
const handleUseItem = (itemId: string) => {
    const def = CONSUMABLES[itemId];
    if (!def) return;

    switch (def.effect) {
        case ConsumableEffect.HP_RESTORE:
            // existing logic
            break;
        case ConsumableEffect.MANA_RESTORE:
            // existing logic
            break;
        case ConsumableEffect.CLEANSE_DOT:
            handleCleanseDot();
            break;
        case ConsumableEffect.CLEANSE_CURSE_CC:
            handleCleanseCurseCC();
            break;
        case ConsumableEffect.DIRECT_DAMAGE:
            handleDirectDamage(def);
            break;
        case ConsumableEffect.GUARANTEED_RETREAT:
            handleGuaranteedRetreat();
            break;
        case ConsumableEffect.DEF_STAGE_BOOST:
            handleDefStageBoost(def);
            break;
        // Phase 3 effects handled later
        default:
            return;
    }

    // Common: remove from inventory, close picker
    removeInventoryItem(itemId, 1);
    setShowItemPicker(false);
};
```

### Phase 2B: Implement Cleansing Items

**In `handleUseItem` (BattleView.tsx):**

For **Purifying Salve** (`CLEANSE_DOT`):
- Get `player.volatileStatusEffects` from battle store
- Filter out all DoT effects: `burn`, `poison`, `bleed`
- Update player via `updatePlayer({ volatileStatusEffects: filtered })`
- Log: "Used Purifying Salve: Removed all afflictions!"
- Advance to enemy turn (costs your turn)

For **Sacred Water** (`CLEANSE_CURSE_CC`):
- Filter out `curse`, `paralyze`, `sleep`, `freeze`, `stun`
- Same pattern as above
- Log: "Used Sacred Water: Cleansed curse and bindings!"
- Advance to enemy turn (costs your turn)

**Helper references:**
- `isDoTEffect()` from `src/models/StatusEffect.ts` to identify DoT types
- `isHardCC()` from `src/models/StatusEffect.ts` to identify CC types
- Player status effects live on `player.volatileStatusEffects` in the battle store

### Phase 2C: Implement Firebomb

**In `handleUseItem` (BattleView.tsx):**

For **Firebomb** (`DIRECT_DAMAGE`):
- Calculate damage: `def.damageFormula.base + def.damageFormula.perLevel * characterLevel`
- Apply to monster: `updateMonsterHP(Math.max(0, monsterHP - damage))`
- Log: "Hurled a Firebomb: X fire damage!"
- Check if monster died (HP <= 0) -- if so, trigger victory
- Otherwise advance to enemy turn (costs your turn)

Note: Firebomb bypasses defense/dodge -- it's guaranteed flat damage. This is intentional to make it feel impactful as a consumable resource.

### Phase 2D: Implement Smoke Bomb

**In `handleUseItem` (BattleView.tsx):**

For **Smoke Bomb** (`GUARANTEED_RETREAT`):
- This does NOT consume your turn -- it's an instant escape
- Log: "Used Smoke Bomb: Vanished in a puff of smoke!"
- Call `copyVolatileStatusToPersistent()` (import from BattleService or inline the logic)
- Finalize balance testing if enabled
- Call `endBattle('retreat')` on the battle store
- Do NOT advance to enemy turn

**Important:** This needs to bypass the normal retreat flow entirely. The existing retreat logic in `executePlayerRetreat()` rolls RNG and takes damage on failure. Smoke Bomb skips all of that.

The simplest approach: handle it directly in `handleUseItem` before the "advance to enemy turn" logic. After consuming the item and logging, call `endBattle('retreat')` and return early.

### Phase 2E: Implement Ironbark Ward

**In `handleUseItem` (BattleView.tsx):**

For **Ironbark Ward** (`DEF_STAGE_BOOST`):
- Get player from battle store
- Apply stage change: `player.statStages.def += def.stageChange.stages` (clamped to ±6)
- Update player via `updatePlayer({ statStages: newStages })`
- Log: "Used Ironbark Ward: Defense sharply rose!"
- Advance to enemy turn (costs your turn)

Note: The `turnDuration` field on Ironbark Ward (4 turns) describes how long stat stages last in a "natural" sense, but the existing stat stage system doesn't auto-decay. For V1, Ironbark Ward simply adds +2 DEF stages permanently for the battle (same as any skill that modifies stages). If we want auto-decay later, that's a separate system. Keep it simple for now.

### Phase 2F: Update ConsumablePicker

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
        ConsumableEffect.DEF_STAGE_BOOST,
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

### Session 2 Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] Buy Purifying Salve, get burned in combat, use salve -- burn icon disappears
- [ ] Buy Sacred Water, get cursed/paralyzed, use water -- effects removed
- [ ] Buy Firebomb, use in combat -- damage applied, monster HP drops, turn passes to enemy
- [ ] Firebomb kills monster -- victory triggers correctly
- [ ] Buy Smoke Bomb, use in combat -- instant retreat, no damage taken, no RNG roll
- [ ] Buy Ironbark Ward, use in combat -- DEF stage increases, enemy hits for less damage
- [ ] All new items appear in consumable picker with correct descriptions
- [ ] HP/MP potions still work as before (regression check)

---

## Session 3: Complex Combat Consumables

**Goal:** Wire up the three systems that need new battle state: enchantment oils (attack proc system), Phoenix Tear (death intercept), and stat elixirs (real-time buff integration).

### Phase 3A: Add ConsumableBuff to Battle State

**File: `src/store/battleStore.ts`**

1. Add a new type for consumable-granted buffs:

```typescript
export interface ConsumableBuff {
    /** Which enchantment type ('enchant_burn' | 'enchant_poison' | 'enchant_freeze') */
    type: ConsumableEffect;
    /** Turns remaining in this battle */
    turnsRemaining: number;
    /** Proc chance per attack (0-100) */
    chance: number;
    /** What status effect to apply on proc */
    statusType: StatusEffectType;
}
```

2. Add `consumableBuffs: ConsumableBuff[]` to the `BattlePlayer` interface. Initialize as empty array `[]` in `hydrateBattlePlayer`.

3. Add store actions:
   - `addConsumableBuff(buff: ConsumableBuff)` -- adds buff, replacing any existing enchantment (only one at a time)
   - `tickConsumableBuffs()` -- decrements `turnsRemaining` on all buffs, removes expired ones

### Phase 3B: Implement Enchantment Oil Usage

**File: `src/components/BattleView.tsx`**

Add to the `handleUseItem` switch:

```typescript
case ConsumableEffect.ENCHANT_BURN:
case ConsumableEffect.ENCHANT_POISON:
case ConsumableEffect.ENCHANT_FREEZE:
    handleEnchantmentOil(def);
    break;
```

Handler:
```typescript
const handleEnchantmentOil = (def: ConsumableDefinition) => {
    // Remove any existing enchantment (one at a time)
    const buff: ConsumableBuff = {
        type: def.effect,
        turnsRemaining: def.turnDuration ?? 5,
        chance: def.statusChance ?? 20,
        statusType: def.statusType!,
    };
    addConsumableBuff(buff);
    addLogEntry({
        turn: turnNumber,
        actor: 'player',
        action: `Applied ${def.name}: attacks may inflict ${getStatusDisplayName(def.statusType!)}!`,
        result: 'heal',
    });
    // Costs your turn
    advanceState('ENEMY_TURN');
    battleService.executeMonsterTurn();
};
```

### Phase 3C: Enchantment Proc System

**File: `src/services/BattleService.ts`**

After damage is dealt in `executePlayerAttack()` and after the damage section in `executePlayerSkill()`, add a proc check:

```typescript
// Check consumable buff procs
const player = useBattleStore.getState().player;
if (player?.consumableBuffs?.length > 0 && damage > 0) {
    for (const buff of player.consumableBuffs) {
        if (Math.random() * 100 < buff.chance) {
            // Apply status to monster
            applyStatus(
                monster as any,
                buff.statusType,
                3, // 3 turns duration for consumable-applied effects
                'player',
                'minor',
                'consumable'
            );
            store.updateMonster({ statusEffects: [...(monster.statusEffects ?? [])] });
            store.addLogEntry({
                turn: store.turnNumber,
                actor: 'player',
                action: `${getStatusDisplayName(buff.statusType)} proc'd from enchantment!`,
                result: 'hit',
            });
            break; // Only one proc per attack
        }
    }
}
```

**Tick consumable buffs at end of player turn.** Add to `checkBattleOutcome()` and `checkBattleOutcomeWithStatusTick()`:

```typescript
// Tick consumable buffs
useBattleStore.getState().tickConsumableBuffs();
```

### Phase 3D: Implement Phoenix Tear

**File: `src/services/BattleService.ts`**

Modify `handleDefeat()` to check for Phoenix Tear *before* setting unconscious:

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
        // Consume the tear
        characterStore.removeInventoryItem('phoenix-tear', 1);

        // Calculate revival HP: 30% of max
        const maxHP = store.playerStats?.maxHP ?? character.maxHP;
        const reviveHP = Math.floor(maxHP * 0.30);

        // Calculate revival mana: restore to pre-death value, 30% floor
        const maxMana = store.playerStats?.maxMana ?? character.maxMana;
        const preDealthMana = store.playerCurrentMana;
        const manaFloor = Math.floor(maxMana * 0.30);
        const reviveMana = Math.max(manaFloor, preDealthMana);

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

        // Save the inventory change
        if (saveCallback) {
            saveCallback().catch(err =>
                console.error('[BattleService] Save failed:', err)
            );
        }

        return; // Don't proceed with normal defeat
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

**File: `src/components/BattleView.tsx`** (for the switch case)
**File: `src/store/characterStore.ts`** (for activePowerUps integration)

Stat elixirs are NOT combat-only -- they're used from inventory (character page or store) and last 1 real-time hour. They integrate with the existing `activePowerUps` system.

1. **Add to ConsumablePicker filter:** Stat elixirs should NOT appear in the battle consumable picker. Set `combatUsable: false` on their definitions.

2. **Add a `useStatElixir` action to characterStore:**

```typescript
useStatElixir: (itemId: string) => {
    const { character, inventory } = get();
    if (!character) return false;

    const def = CONSUMABLES[itemId];
    if (!def || def.effect !== ConsumableEffect.STAT_BOOST) return false;

    // Check inventory
    const has = inventory.find(i => i.itemId === itemId && i.quantity > 0);
    if (!has) return false;

    // Consume
    get().removeInventoryItem(itemId, 1);

    // Add to activePowerUps with expiration
    const expiresAt = new Date(
        Date.now() + (def.realTimeDurationMinutes ?? 60) * 60 * 1000
    ).toISOString();

    const newPowerUp = {
        id: `elixir_${def.statTarget}_${Date.now()}`,
        name: def.name,
        type: 'stat_boost' as const,
        stat: def.statTarget!,
        value: Math.floor(character.baseStats[def.statTarget!] * 0.10),
        expiresAt,
        source: 'consumable',
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

> **Note:** The exact shape of the `activePowerUps` entry may need adjusting to match the existing PowerUp interface. Check `src/services/PowerUpService.ts` for the expected shape and adapt accordingly.

### Session 3 Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] **Enchantment Oils:**
  - [ ] Buy Oil of Immolation, use in combat -- "attacks may inflict Burning" log appears
  - [ ] Attack monster -- 20% chance to see "Burning proc'd!" and burn icon on monster
  - [ ] After 5 turns, enchantment expires silently (no more procs)
  - [ ] Using a second oil replaces the first (only one active)
- [ ] **Phoenix Tear:**
  - [ ] Buy Phoenix Tear, die in combat -- "Phoenix Tear activates!" instead of defeat screen
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

## Session 4: UI Polish & Loot Tables

**Goal:** Polish the consumable picker UI with categories, expand the store with proper sections, update all loot tables, and do a final balance pass.

### Phase 4A: Categorized Consumable Picker

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

**File: `src/styles/combat.css`** (or `inventory.css`)

Add styles for:
- `.qb-consumable-section` -- category header in the picker
- `.qb-consumable-section-title` -- section label
- Enchantment oil items should have a subtle glow/border to indicate they're buff-type
- Phoenix Tear should have epic rarity border color
- Tactical items could have a distinct background tint

### Phase 4E: Balance Verification Pass

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

### Session 4 Testing

- [ ] `npm run build` passes
- [ ] `npm run deploy:test`
- [ ] Consumable picker shows grouped categories
- [ ] Empty categories don't show in picker
- [ ] Store shows organized sections with level-gating
- [ ] Potion tier filtering works (only shows relevant tiers)
- [ ] Kill overworld monsters -- consumables occasionally drop
- [ ] Kill bosses -- rare items (oils, elixirs, phoenix tear) can drop
- [ ] Golden chests can drop cleansing/tactical items
- [ ] Full regression: all existing functionality still works
  - [ ] Quest completion loot
  - [ ] Combat victory/defeat
  - [ ] Revive potion from unconscious
  - [ ] Dungeon exploration chests

---

## File Change Summary

| File | Session | Changes |
|------|---------|---------|
| `src/models/Consumable.ts` | 1 | Rewrite: 6 potion tiers, expanded enum, ~25 item definitions, new fields |
| `src/modals/StoreModal.ts` | 1, 4 | S1: new prices/items. S4: category sections, level-gating, smart tier display |
| `src/services/LootGenerationService.ts` | 1, 4 | S1: verify imports. S4: combat consumable drops, expanded weights |
| `src/components/BattleView.tsx` | 2, 4 | S2: refactored item handler, 5 new consumable handlers. S4: categorized picker |
| `src/store/battleStore.ts` | 3 | ConsumableBuff type, consumableBuffs on BattlePlayer, add/tick actions |
| `src/services/BattleService.ts` | 3 | Phoenix Tear check in handleDefeat, enchantment proc in attack/skill |
| `src/store/characterStore.ts` | 3 | useStatElixir action |
| `src/styles/combat.css` | 4 | Category picker styles, enchantment glow, rarity borders |

### Files NOT Changed

- `main.ts` -- no new commands or lifecycle changes needed
- `src/config/combatConfig.ts` -- no balance constant changes
- `src/services/StatusEffectService.ts` -- existing applyStatus/tickStatusEffects used as-is
- `src/models/StatusEffect.ts` -- existing types sufficient

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

- **Ironbark Ward duration:** The +2 DEF stages don't auto-expire after 4 turns in V1. The stat stage system doesn't have turn-based expiry. Acceptable for now since battles are short. Could add a "ward" buff tracker later if needed.
- **Enchantment oils are battle-scoped only:** Simpler than cross-battle real-time buffs. Can expand later if there's demand.
- **Stat elixirs use activePowerUps:** The PowerUp system may need minor adaptation to support consumable-sourced buffs. Check the PowerUp interface shape during implementation.
- **No consumable crafting:** Intentionally out of scope. Store + loot drops are the only acquisition paths for now.

### Price Economy Sanity Check

At L30 (overworld fight yields ~70g):
- Level-appropriate HP potion (Superior, 550g) = ~8 fights of gold
- Firebomb (200g) = ~3 fights
- Phoenix Tear (2000g) = ~29 fights (should feel expensive and precious)
- Stat Elixir (400g) = ~6 fights

These feel right for a casual RPG economy -- potions are a regular expense, tactical items are affordable treats, and Phoenix Tears are saved for important fights.
