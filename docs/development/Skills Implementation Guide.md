# Quest Board - Skills System Implementation Guide

**Master reference document for implementing the complete skills system.**

This guide provides a comprehensive, step-by-step plan for adding the Pokemon Gen 1-inspired skills system to Quest Board. It is designed to be picked up by any development session at any point and immediately understood.

---

## Table of Contents

1. [Overview & Goals](#overview--goals)
2. [Pre-Implementation Checklist](#pre-implementation-checklist) <!-- NEW -->
3. [Design Decisions Reference](#design-decisions-reference)
4. [Current System Audit](#current-system-audit)
5. [Schema Changes & Migrations](#schema-changes--migrations)
6. [Service Layer Changes](#service-layer-changes)
7. [UI Component Changes](#ui-component-changes)
8. [Data Creation](#data-creation)
9. [Testing & Balance](#testing--balance)
10. [Implementation Phases](#implementation-phases)
11. [Progress Tracking](#progress-tracking)

---

## Pre-Implementation Checklist

> [!CAUTION]
> Complete ALL items in this checklist before beginning Phase 1.
> Missing items will cause cascading problems later.

### Interface Updates Required

| File | Change | Notes |
|------|--------|-------|
| `src/models/Character.ts` | Add `skills` field | `{ unlocked: string[], equipped: string[] }` - NO `usedThisBattle` here! |
| `src/models/Character.ts` | Add `persistentStatusEffects` field | Status effects that persist between battles |
| `src/models/Character.ts` | Bump `CHARACTER_SCHEMA_VERSION` | 4 → 5 |
| `src/models/Monster.ts` | Add `skills: MonsterSkill[]` field | Currently missing from interface |
| `src/models/Monster.ts` | Add `battleState` field | For stages/status during combat (monsters only) |
| `src/models/Monster.ts` | Add `skillPool` to `MonsterTemplate` | Array of possible skills |
| `src/store/battleStore.ts` | Add `BattlePlayer` interface | Mirrors `BattleMonster`, holds volatile player state |
| `src/store/battleStore.ts` | Expand `BattleMonster` interface | Add `statStages`, `statusEffects`, `skills` for display |
| `CLASS_INFO` in Character.ts | Add `inherentType: ElementalType` field | Per-class elemental type |

### Already Completed (Phase 4 Session 2026-01-29)

> [!TIP]
> The following UI scaffolding is already implemented and just needs wiring to the skill system.

| Item | Status | Location |
|------|--------|----------|
| Skills button in battle action grid | ✅ Done | `BattleView.tsx` |
| 5-slot skill submenu (placeholders) | ✅ Done | `ActionButtons` component |
| Back button (returns to main menu) | ✅ Done | `ActionButtons` component |
| Meditate button (placeholder) | ✅ Done | Needs mana restore logic |
| Desktop 3x2 / Mobile 2x3 layouts | ✅ Done | `combat.css` |

**See:** [[Phase 4 Implementation Session Log#2026-01-29 (Afternoon) - Battle Actions Expansion]]

### Testing Strategy

> [!IMPORTANT]
> **Confirmed approach:** Unit tests written **alongside** each service, followed by manual testing.
> This follows the TDD pattern established in Phase 4 (power-up triggers, achievements).

**Test file structure:**
- `test/skill-service.test.ts` - Skill execution, validation, mana costs
- `test/status-effects.test.ts` - Apply/tick/cure logic
- `test/combat-stages.test.ts` - Stage multipliers, type effectiveness

### Implementation Approach

> [!IMPORTANT]
> **Confirmed:** Implement **character skills first** to find pain points.
> Monster skills will be added after core player mechanics are working.

This approach:
- Reduces initial complexity
- Allows testing the full player flow end-to-end
- Identifies integration issues before duplicating work for monsters
- Monster skills can reuse the validated SkillService logic

### Status Persistence Architecture

> [!IMPORTANT]
> **Key Design Decision:** Volatile battle state lives in `BattleStore`, NOT on `Character`.
> This prevents ephemeral data (stat stages, volatile statuses) from being persisted to `data.json`.

**Problem:** Status effects should persist between battles, but stat stages are ephemeral.

**Solution:** Split state between persisted Character fields and volatile BattleStore state.

```typescript
// In src/models/Character.ts - Character interface:

// PERSISTED: Survives app restart, cleared by Long Rest or death recovery
persistentStatusEffects: StatusEffect[];

// Skills loadout (persisted)
skills: {
    unlocked: string[];   // All learned skill IDs
    equipped: string[];   // Currently equipped (max 5)
};
// NOTE: usedThisBattle is tracked in BattleStore, NOT here!
```

```typescript
// In src/store/battleStore.ts - NEW BattlePlayer interface:

interface BattlePlayer {
    // Combat stats (derived from Character + gear)
    maxHP: number;
    currentHP: number;
    maxMana: number;
    currentMana: number;
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    speed: number;
    critChance: number;
    dodgeChance: number;

    // VOLATILE: Battle-specific state (not persisted!)
    statStages: { atk: number; def: number; speed: number };
    volatileStatusEffects: StatusEffect[];  // Working copy from persistentStatusEffects
    skillsUsedThisBattle: string[];
    turnsInBattle: number;
}

// Add to BattleStore state:
interface BattleState {
    // ... existing fields ...
    player: BattlePlayer | null;  // NEW
}
```

**Battle Start Flow:**
```typescript
// In BattleService.startBattle():
const character = useCharacterStore.getState().character;

// Hydrate BattlePlayer from Character
const player: BattlePlayer = {
    ...deriveCombatStats(character),  // Existing function
    statStages: { atk: 0, def: 0, speed: 0 },
    volatileStatusEffects: [...character.persistentStatusEffects],  // Copy in
    skillsUsedThisBattle: [],
    turnsInBattle: 0,
};

useBattleStore.getState().setPlayer(player);
```

**Battle End Flow (Victory/Defeat/Retreat):**
```typescript
// Copy volatile → persistent (statuses survive battles)
const player = useBattleStore.getState().player;
useCharacterStore.getState().updateCharacter({
    persistentStatusEffects: [...player.volatileStatusEffects],
});

// Stages are NOT copied back - they reset each battle
```

**Long Rest / Death Recovery:**
```typescript
useCharacterStore.getState().updateCharacter({
    persistentStatusEffects: [],  // Clear all statuses
});
```



### ATK/DEF Stages in Damage Formula

**Current formula in CombatService.calculateDamage():**
```typescript
attackPower × (1 - defenseReduction)
```

**Problem:** ATK/DEF stages not integrated.

**Updated formula:**
```typescript
// Apply ATK stage to attacker
const atkMultiplier = getStageMultiplier(attacker.battleState?.statStages.atk || 0);
const effectiveAttack = attackPower * atkMultiplier;

// Apply DEF stage to defender (unless crit or ignoresStages)
const defMultiplier = isCrit ? 1.0 : getStageMultiplier(defender.battleState?.statStages.def || 0);
const effectiveDefense = defenderDefense * defMultiplier;

// Then apply normal formula
const defenseReduction = Math.min(0.75, effectiveDefense / (100 + effectiveDefense));
const damage = effectiveAttack * (1 - defenseReduction);
```

**Where to inject:**
1. `CombatService.calculateDamage()` - Add optional `attackerStages` and `defenderStages` params
2. `BattleService.calculatePlayerDamage()` - Pass stages from character.battleState
3. `BattleService.executeMonsterTurn()` - Pass stages from monster.battleState
4. `SkillService.calculateSkillDamage()` - Use stages from battleState

**Basic attacks use stages:** ✅ Yes, same as skills.

### Migration Strategy (Character v4 → v5)

```typescript
export function migrateCharacterV4toV5(oldData: Record<string, unknown>): Character {
    if ((oldData.schemaVersion as number) >= 5) {
        return oldData as unknown as Character;
    }

    // Get skills based on current level
    const classSkills = SKILL_DEFINITIONS.filter(s =>
        s.requiredClass.includes(oldData.class as string) &&
        s.learnLevel <= (oldData.level as number)
    );
    const unlockedIds = classSkills.map(s => s.id);

    // Use smart loadout helper (see below)
    const equippedIds = getDefaultLoadout(classSkills, 5);

    return {
        ...(oldData as object),
        schemaVersion: 5,

        // NEW: Skills system
        skills: {
            unlocked: unlockedIds,
            equipped: equippedIds,
            // NOTE: usedThisBattle is in BattleStore, not here!
        },

        // NEW: Persistent status effects (empty for fresh migration)
        persistentStatusEffects: [],
    } as Character;
}

/**
 * Build a smart default loadout that prioritizes skill variety:
 * 1. Include highest-level heal (if available)
 * 2. Include highest-level buff (if available)
 * 3. Include ultimate skill (if available)
 * 4. Fill remaining slots with highest-level damage skills
 */
function getDefaultLoadout(skills: Skill[], slots: number): string[] {
    const result: string[] = [];
    const used = new Set<string>();

    // Helper to pick best skill matching criteria
    const pickBest = (filter: (s: Skill) => boolean): Skill | null => {
        const candidates = skills.filter(s => !used.has(s.id) && filter(s));
        if (candidates.length === 0) return null;
        // Sort by learn level descending (highest = strongest)
        candidates.sort((a, b) => b.learnLevel - a.learnLevel);
        return candidates[0];
    };

    // Priority 1: One heal skill
    const heal = pickBest(s => s.category === 'heal');
    if (heal) { result.push(heal.id); used.add(heal.id); }

    // Priority 2: One buff skill
    const buff = pickBest(s => s.category === 'buff');
    if (buff) { result.push(buff.id); used.add(buff.id); }

    // Priority 3: Ultimate (learn level 30+)
    const ultimate = pickBest(s => s.learnLevel >= 30);
    if (ultimate) { result.push(ultimate.id); used.add(ultimate.id); }

    // Priority 4: Fill remaining with highest-level damage skills
    while (result.length < slots) {
        const damage = pickBest(s => s.category === 'damage' || s.category === 'attack');
        if (!damage) break;
        result.push(damage.id);
        used.add(damage.id);
    }

    // If still not full, add any remaining skills
    while (result.length < slots) {
        const any = pickBest(() => true);
        if (!any) break;
        result.push(any.id);
        used.add(any.id);
    }

    return result;
}
```

**Chain migration:** Update `migrateCharacterV3toV4()` to call `migrateCharacterV4toV5()`.



### Orchestrator Pattern for SkillService

**Architecture:** SkillService is a thin orchestrator, not a monolith.

```typescript
// SkillService orchestrates, delegates heavy lifting:
export class SkillService {
    constructor(
        private combatService: typeof CombatService,
        private statusService: StatusEffectService
    ) {}

    executeSkill(skill: Skill, user: Combatant, target: Combatant): SkillResult {
        // 1. Validate (own logic)
        // 2. Deduct mana (own logic)
        // 3. Calculate damage → delegate to CombatService
        // 4. Apply status → delegate to StatusEffectService
        // 5. Return result
    }
}
```

**Why orchestrator > merge:**
- Keeps services small and testable
- Single responsibility per file (your preference)
- Easy to mock dependencies for testing
- Learning opportunity for composition pattern

### SkillResult Interface

**SkillService.executeSkill() returns a result object** that describes what happened, rather than directly pushing logs or updating state.

```typescript
interface SkillResult {
    success: boolean;
    skillId: string;
    skillName: string;
    
    // What happened
    damage?: number;
    healing?: number;
    stageChanges?: { stat: 'atk' | 'def' | 'speed'; delta: number; target: 'self' | 'enemy' }[];
    statusApplied?: { type: StatusEffectType; target: 'self' | 'enemy' };
    statusCured?: StatusEffectType[];
    
    // For combat log
    logEntries: string[];  // e.g., ["You used Power Strike!", "Dealt 45 damage!", "Enemy is now Burning!"]
    
    // V2 FUTURE: Animation support (deferred for now)
    // animationId?: string;
    // visualEffect?: 'projectile' | 'aoe' | 'buff' | 'heal';
}
```

**BattleService then uses this result to:**
1. Update BattleStore state (HP, stages, statuses)
2. Push log entries to combat log
3. Trigger UI animations (V2: based on animationId)

> [!NOTE]
> **V1 Scope:** Skill name/icon is sufficient for UI feedback.
> **V2 Enhancement:** Add `animationId` and `visualEffect` for richer animations.



### Array Filter vs Splice

**Current (splice in reverse):**
```typescript
effectsToRemove.reverse().forEach(index => {
    combatant.battleState!.statusEffects.splice(index, 1);
});
```

**Recommended (filter):**
```typescript
combatant.battleState.statusEffects = 
    combatant.battleState.statusEffects.filter((_, i) => !effectsToRemove.includes(i));
```

**Why filter is better:**
- Creates new array (immutable, safer)
- No index tracking bugs
- Cleaner code
- Works with any order

### Lazy Loading Skill Definitions

**All platforms benefit** (not just mobile):
- Faster initial load (skills only loaded when needed)
- Lower memory footprint on startup
- Skills loaded on first battle or character sheet access

**Implementation:**
```typescript
// Instead of:
export const SKILL_DEFINITIONS: Skill[] = [...];

// Use:
let _skillDefinitions: Skill[] | null = null;

export function getSkillDefinitions(): Skill[] {
    if (!_skillDefinitions) {
        _skillDefinitions = Object.freeze([...createSkillDefinitions()]);
    }
    return _skillDefinitions;
}
```

### Once-Per-Battle Reset on Retreat

**Add to BattleService.executePlayerRetreat():**
```typescript
if (roll < runChance) {
    // Successful retreat - copy volatile status back to persistent
    const player = useBattleStore.getState().player;
    useCharacterStore.getState().updateCharacter({
        persistentStatusEffects: [...player.volatileStatusEffects],
    });
    
    store.endBattle('retreat');
    // skillsUsedThisBattle is in BattleStore and will be cleared on next battle start
}
```

**Note:** Battle initialization already resets `skillsUsedThisBattle` in BattleStore, but retreat explicitly copies volatile status effects back to persistent storage.

### Configuration Centralization

> [!IMPORTANT]
> **All "magic numbers" for combat must live in `combatConfig.ts`.**
> This ensures consistency and makes balancing easier.

**Add to `src/config/combatConfig.ts`:**

```typescript
// =====================
// TYPE EFFECTIVENESS
// =====================

export type ElementalType = 
    | 'Physical' | 'Fire' | 'Ice' | 'Lightning' 
    | 'Earth' | 'Arcane' | 'Dark' | 'Light'
    | 'Poison' | 'Nature' | 'Psychic';

/**
 * Type effectiveness chart (Pokemon-style)
 * - strong: 2x damage dealt
 * - weak: 0.5x damage dealt
 * - immune: never (all types can damage all types)
 */
export const TYPE_CHART: Record<ElementalType, { strong: ElementalType[]; weak: ElementalType[] }> = {
    Physical: { strong: ['Arcane'], weak: ['Earth', 'Dark'] },
    Fire:     { strong: ['Ice', 'Nature'], weak: ['Fire', 'Earth'] },
    Ice:      { strong: ['Nature', 'Lightning'], weak: ['Fire', 'Ice'] },
    Lightning:{ strong: ['Fire', 'Psychic'], weak: ['Earth', 'Lightning'] },
    Earth:    { strong: ['Lightning', 'Physical'], weak: ['Nature', 'Ice'] },
    Arcane:   { strong: ['Dark', 'Psychic'], weak: ['Physical', 'Light'] },
    Dark:     { strong: ['Light', 'Psychic'], weak: ['Arcane', 'Dark'] },
    Light:    { strong: ['Dark', 'Poison'], weak: ['Arcane', 'Light'] },
    Poison:   { strong: ['Nature', 'Physical'], weak: ['Light', 'Earth'] },
    Nature:   { strong: ['Earth', 'Psychic'], weak: ['Fire', 'Poison'] },
    Psychic:  { strong: ['Poison', 'Physical'], weak: ['Dark', 'Arcane'] },
};

// =====================
// STAT STAGES
// =====================

/** Minimum and maximum stat stages (Pokemon-style ±6) */
export const MIN_STAGE = -6;
export const MAX_STAGE = 6;

/** Multiplier per stage (50% per stage = 1.5x at +1, 2.0x at +2, etc.) */
export const STAGE_MULTIPLIER_PERCENT = 0.50;

/**
 * Get the multiplier for a given stat stage.
 * Stage 0 = 1.0, +1 = 1.5, +2 = 2.0, -1 = 0.67, -2 = 0.5
 */
export function getStageMultiplier(stage: number): number {
    const clampedStage = Math.max(MIN_STAGE, Math.min(MAX_STAGE, stage));
    if (clampedStage >= 0) {
        return 1 + (clampedStage * STAGE_MULTIPLIER_PERCENT);
    } else {
        // Negative stages: 1 / (1 + |stage| * 0.5)
        return 1 / (1 + Math.abs(clampedStage) * STAGE_MULTIPLIER_PERCENT);
    }
}

// =====================
// STATUS EFFECT DAMAGE
// =====================

/** DoT damage as percentage of max HP per turn */
export const STATUS_DOT_PERCENT: Record<string, { minor: number; moderate: number; severe: number }> = {
    burn:   { minor: 0.04, moderate: 0.06, severe: 0.08 },
    poison: { minor: 0.03, moderate: 0.05, severe: 0.08 }, // Per stack
    bleed:  { minor: 0.04, moderate: 0.06, severe: 0.10 },
    curse:  { minor: 0.02, moderate: 0.04, severe: 0.06 },
};

/** Paralysis skip chance (25% chance to lose turn) */
export const PARALYZE_SKIP_CHANCE = 0.25;

/** Confusion self-hit chance (33% chance to hit self) */
export const CONFUSION_SELF_HIT_CHANCE = 0.33;

/** Burn physical damage reduction (25% less physical damage dealt) */
export const BURN_DAMAGE_REDUCTION = 0.25;
```

### Task Completion Resource Regeneration

> [!NOTE]
> Task completion grants 7% HP and Mana regeneration.
> This follows the existing hook pattern (like `useXPAward.ts`), NOT direct service coupling.

**Implementation: Create `src/hooks/useResourceRegen.ts`**

```typescript
import { useEffect } from 'react';
import { useQuestStore } from '../store/questStore';
import { useCharacterStore } from '../store/characterStore';
import { Notice } from 'obsidian';

/**
 * Hook that watches for task completions and restores HP/Mana.
 * Should be mounted in a top-level component (e.g., QuestBoardView).
 */
export function useResourceRegen(): void {
    const character = useCharacterStore(s => s.character);
    const restoreResources = useCharacterStore(s => s.restoreResources);

    // Track previous task completion count to detect new completions
    const tasksCompletedToday = character?.tasksCompletedToday ?? 0;

    useEffect(() => {
        // Skip on initial mount and if no character
        if (!character || tasksCompletedToday === 0) return;

        // This effect runs when tasksCompletedToday changes
        // The incrementing is done elsewhere (useXPAward or QuestActionsService)
        // We just respond to it here

        const regenPercent = 0.07; // 7% of max HP/Mana
        const { restoredHP, restoredMana } = restoreResources(regenPercent);

        if (restoredHP > 0 || restoredMana > 0) {
            new Notice(`⚡ Task power! +${restoredHP} HP, +${restoredMana} Mana`);
        }
    }, [tasksCompletedToday]);
}
```

**Add to CharacterStore:**
```typescript
interface CharacterStoreActions {
    // ... existing actions ...
    
    /**
     * Restore HP and Mana by a percentage of max values.
     * @param percent - Fraction of max to restore (0.07 = 7%)
     * @returns The actual amounts restored (capped at max)
     */
    restoreResources: (percent: number) => { restoredHP: number; restoredMana: number };
}
```

**Why hook pattern instead of service coupling:**
- Keeps `QuestActionsService` focused on file I/O
- Follows existing patterns (`useXPAward.ts`)
- Easier to test (mock the store)
- Centralized side-effect handling in React components

### Skills Modal UI Specification

> [!NOTE]
> **Two modals needed:**
> - `SkillLoadoutModal.ts` - Manage equipped skills (out of battle)
> - `SkillPickerModal.tsx` - Select skill to use (during battle)

#### SkillLoadoutModal (Phase 6)

**Purpose:** View all skills, see unlock requirements, and customize which 5 are equipped for battle.

**Access Points:**
- Character Sheet → "Skills" button/tab
- Command palette → "Quest Board: Manage Skills"
- Optional: Battle View → "Loadout" gear icon (for mid-dungeon changes)

**Layout Mockup:**

```
┌─────────────────────────────────────────────────────────────┐
│ ⚔️ Skill Loadout                                 [X Close] │
├─────────────────────────────────────────────────────────────┤
│ EQUIPPED (3/5)                    [Clear All] [Auto-Fill]  │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 🗡️      │ │ ⚔️      │ │ 🧘      │ │  Empty  │ │  Empty  ││
│ │  Slash  │ │Power    │ │Meditate │ │   ---   │ │   ---   ││
│ │  Lv 1   │ │Strike   │ │ Univ.   │ │         │ │         ││
│ │   [−]   │ │   [−]   │ │   [−]   │ │         │ │         ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                             │
│ CLASS SKILLS (Warrior)                          Level: 12   │
│ ─────────────────────────────────────────────────────────── │
│ │ ✅ Slash           Lv 1   │ 10 Mana │ 100% ATK physical  ││
│ │ ✅ Power Strike    Lv 5   │ 20 Mana │ 150% ATK, +crit    ││
│ │ ✅ Rage            Lv 10  │ 25 Mana │ +2 ATK, -1 DEF     ││
│ │ 🔒 Cleave          Lv 15  │ 🔓 Unlocks at Level 15       ││
│ │ 🔒 Iron Wall       Lv 20  │ 🔓 Unlocks at Level 20       ││
│ │ 🔒 War Cry         Lv 25  │ 🔓 Unlocks at Level 25       ││
│ │ 🔒 Berserker Rage  Lv 30  │ 🔓 Unlocks at Level 30       ││
│ │ 🔒 Last Stand      Lv 40  │ 🔓 Unlocks at Level 40       ││
│ ─────────────────────────────────────────────────────────── │
│ UNIVERSAL SKILLS                                            │
│ ─────────────────────────────────────────────────────────── │
│ │ ✅ Meditate        Lv 1   │ 0 Mana  │ Restore 33% Mana   ││
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│                               [Save Loadout] [Cancel]       │
└─────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Action | Result |
|--------|--------|
| Click ✅ unlocked skill | Toggle equipped/unequipped (if slots available) |
| Click 🔒 locked skill | Show "Unlocks at Level X" tooltip |
| Hover any skill | Show detailed tooltip (mana cost, effects, type, cooldown) |
| Click [−] on equipped | Remove from loadout |
| Click [Auto-Fill] | Fill empty slots with highest-level unlocked skills |
| Click [Clear All] | Remove all equipped skills |
| Click [Save Loadout] | Persist to character.skills.equipped, close modal |
| Already at 5 equipped | Cannot add more (show "Loadout full" message) |

**Skill Card States:**

```css
/* Unlocked + Equipped */
.qb-skill-card.equipped { 
    border: 2px solid var(--color-accent);
    background: var(--background-modifier-success);
}

/* Unlocked + Not Equipped */
.qb-skill-card.available { 
    border: 1px solid var(--background-modifier-border);
    cursor: pointer;
}

/* Locked */
.qb-skill-card.locked { 
    opacity: 0.5;
    filter: grayscale(50%);
    cursor: not-allowed;
}
```

**Skill Tooltip Content:**

```
┌─────────────────────────────────────┐
│ ⚔️ Power Strike                    │
│ Level 5 • Physical                 │
│ ─────────────────────────────────── │
│ Mana Cost: 20                      │
│ ─────────────────────────────────── │
│ Deal 150% physical damage.         │
│ +15% critical hit chance.          │
│ ─────────────────────────────────── │
│ 💡 "Strike with overwhelming      │
│     force!"                        │
└─────────────────────────────────────┘
```

#### SkillPickerModal (Phase 5 - Battle UI)

**Purpose:** During battle, select which equipped skill to use this turn.

**Trigger:** Click "Skills" button in BattleView (replaces basic Attack for that turn)

**Layout (Compact):**

```
┌─────────────────────────────────────────────┐
│ Choose a Skill                              │
├─────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐             │
│ │ 🗡️ Slash    │ │ ⚔️ Power    │            │
│ │ 10 Mana     │ │ Strike 20   │            │
│ └─────────────┘ └─────────────┘             │
│ ┌─────────────┐ ┌─────────────┐             │
│ │ 😤 Rage     │ │ 🧘 Meditate │            │
│ │ 25 Mana     │ │ FREE        │            │
│ └─────────────┘ └─────────────┘             │
│ ┌─────────────┐                             │
│ │ 💀 Berserk  │ (Once per battle)          │
│ │ 50 Mana    │                             │
│ └─────────────┘                             │
│                                  [Cancel]   │
└─────────────────────────────────────────────┘
```

**Skill Button States:**

| State | Appearance | Clickable |
|-------|------------|-----------|
| Available | Normal colors | ✅ Yes |
| Not enough mana | Grayed, red mana text | ❌ No |
| Already used (once-per-battle) | Grayed, "Used" badge | ❌ No |
| Blocked by Hard CC | All grayed, "Stunned!" overlay | ❌ No |

**On Skill Select:**
1. Close modal
2. Execute skill via `SkillService.executeSkill()`
3. BattleService updates store with SkillResult
4. BattleView shows skill animation/effects
5. Combat log updates

---

## Overview & Goals



### What We're Building

A **Pokemon Red/Blue Gen 1-inspired skills system** that adds:
- ✅ **8 skills per class** (56 total) unlocked by leveling
- ✅ **Equippable loadouts** (4-5 skills active at once)
- ✅ **Mana-based resource system** (skills cost mana)
- ✅ **Stat stage system** (±6 stages, 50% per stage)
- ✅ **Status effects** (Burn, Poison, Paralyze, Sleep, Freeze, Confusion, Bleed, Curse)
- ✅ **Type effectiveness** (11 types, 2x/0.5x damage)
- ✅ **Speed-based turn order** (Pokemon Gen 1 style - determines who goes first)
- ✅ **Monster skills** (2+ skills per monster)

### Design Philosophy

**Keep it simple, strategic, and Pokemon-like:**
- Most skills do ONE thing (damage OR buff OR status)
- No turn tracking for buffs (stages last until battle ends)
- Sticky status effects (last until cured or battle ends)
- Mana is THE strategic resource (no auto-regen in battle)
- Once-per-battle ultimates create "trump card" moments

### Success Criteria

1. **Strategic depth** without overwhelming complexity
2. **Class identity** reinforced through unique skill sets
3. **Balanced gameplay** (50%+ win rate floor maintained)
4. **Smooth UX** (skill selection is fast, <30 seconds)
5. **Backward compatible** (existing characters auto-migrate)

---

## Design Decisions Reference

All critical design questions and answers from planning sessions.

### Resource Management

| Question | Decision | Rationale |
| --- | --- | --- |
| **Mana regen in battle?** | ❌ No auto-regen | Creates resource tension, strategic Meditate usage |
| **Mana regen outside battle?** | 7% per task + full on Long Rest | Ties to productivity, creates rest rhythm |
| **Long Rest mechanics?** | Free every 30 min OR paid (100g + level×35) | Maintains current system, adds emergency option |
| **HP regen outside battle?** | 7% per task + full on Long Rest | Matches mana system, consistent design |
| **Stamina system?** | ✅ Keep current (1 per fight, 50/day cap) | Already working well |

### Skill System

| Question | Decision | Rationale |
| --- | --- | --- |
| **Skill unlock method?** | Auto-unlock at level-up | Simple, no skill points to track |
| **Skills per class?** | 8 skills (levels 5, 8, 13, 18, 23, 28, 33, 38) | Even progression, 40 levels = 8 milestones |
| **Equipped skills limit?** | 4-5 skills active at once | Loadout strategy, not overwhelming |
| **Skill cooldowns?** | ❌ Avoid cooldowns | Use once-per-battle + high mana instead |
| **Skill tiers?** | Low (unlimited) / Mid (unlimited) / Ultimate (once-per-battle) | Clear progression, strategic depth |
| **Universal skills?** | ✅ Meditate (all classes, level 1) | 33% mana restore, costs a turn |

### Monster Skills

| Question | Decision | Rationale |
| --- | --- | --- |
| **Skills per monster?** | 2 skills (1 basic + 1 special) | Simple AI, strategic variety |
| **Elite/Boss skills?** | 3-4 skills + stronger versions | Increased difficulty, memorable fights |
| **Skill assignment?** | Random pool per template (3-4 options → pick 2) | Variety within same monster type |
| **Monster AI complexity?** | Simple (weighted random) | V1 simplicity, can enhance later |

### Combat Mechanics

| Question | Decision | Rationale |
| --- | --- | --- |
| **Stage system?** | ✅ Yes, -6 to +6, 50% per stage | Pokemon Gen 1 model |
| **Stage caps?** | -6 to +6, show error if exceeded | No turn/mana waste on useless buffs |
| **Stage reset?** | After every battle ends | Clean slate, no persistence complexity |
| **Status effects?** | ✅ 9 types (Burn, Poison, Bleed, Paralyze, Sleep, Freeze, Confusion, Stun, Curse) | Full RPG coverage |
| **Status stacking?** | Multiple different OK, same type = replace | Strategic depth without broken combos |
| **Status persistence?** | ✅ Persist between battles | Resource management matters |
| **Status cure restrictions?** | Can't self-cure hard CC (Sleep/Paralyze/Freeze/Stun) | Prevents trivializing status |
| **Type effectiveness?** | ✅ 11 types, 2x/0.5x damage | Rock-paper-scissors strategy |
| **Character type?** | Inherent type for 10% resistance | Defensive identity |
| **Skill type override?** | ✅ Skill type used for damage | Offensive flexibility |
| **Speed-based turns?** | ✅ Yes, Pokemon Gen 1 style | Speed determines turn order (who goes first), NOT frequency |
| **Crits ignore DEF?** | ✅ Yes, ignore DEF stages | Makes crits valuable |
| **Once-per-battle reset?** | After any battle end (win/loss/retreat) | Consistent, clean |

### Type System

**11 Types with Effectiveness:**

| Type | Strong Against (2x) | Weak Against (0.5x) |
| --- | --- | --- |
| Physical | Arcane | Earth, Dark |
| Fire | Nature, Ice | Water, Earth |
| Water | Fire, Earth | Nature, Lightning |
| Ice | Nature, Earth | Fire, Water |
| Lightning | Water, Physical | Earth, Nature |
| Earth | Fire, Lightning, Poison | Nature, Ice |
| Nature | Water, Earth | Fire, Ice, Poison |
| Poison | Nature, Physical | Earth, Dark |
| Light | Dark | Nature |
| Dark | Light, Physical | Light |
| Arcane | Physical | Dark |

**Character Class → Type Mapping:**

| Class | Inherent Type | Resistance Bonus |
| --- | --- | --- |
| Warrior | Physical | 10% vs Physical |
| Paladin | Light | 10% vs Light |
| Technomancer | Lightning | 10% vs Lightning |
| Scholar | Arcane | 10% vs Arcane |
| Rogue | Physical | 10% vs Physical |
| Cleric | Light | 10% vs Light |
| Bard | Arcane | 10% vs Arcane |

### Combat Rules Detailed

**Turn Order (Pokemon Gen 1 Style):**
- Speed determines **WHO GOES FIRST each round**, NOT how many times you attack
- Each round consists of: Player action → Monster action (or vice versa)
- Speed comparison: `(Combatant Speed) × StageMultiplier(speed_stage)`
- Higher speed attacks first
- **NOT CTB/ATB:** No multiple turns per round, no action gauges
- **Speed stages impact:** +6 speed stage = 11.39x speed (always first), -6 = 0.09x speed (always last)

**Critical Hits:**
- Chance based on: `(DEX × 0.5%) + gear bonus + skill crit bonus`
- Multiplier: 2.0x damage
- **Crits ignore DEF stages** (treats enemy DEF as stage 0)
- ATK stages still apply to crits
- Makes Rogue crits extremely valuable

**Secondary Effects (Hybrid Skills):**
- Format: `Damage + X% chance to inflict status`
- **Secondary effects ONLY roll if primary attack hits**
- Missing the attack = no status roll
- Example: Reckless Strike misses → no Stun chance

**"Ignores Stages" Mechanic:**
- Means: Enemy DEF stages don't apply (treated as stage 0)
- Attacker's ATK stages still apply
- Example: Rogue Shadow Strike at +2 ATK vs Enemy at +6 DEF
  - Normal: 2.25x ATK vs 11.39x DEF (bad for attacker)
  - Ignores stages: 2.25x ATK vs 1.0x DEF (good for attacker)

**Type Effectiveness:**
- 2.0x damage for super effective
- 0.5x damage for not very effective
- 1.0x damage for neutral
- **No immunities** (all are resistances for V1)
- **Healing bypasses type chart** (no type effectiveness on heals)
- **Character inherent type:** 10% resistance to own type (0.9x incoming damage)

**Status Effects:**

*Damage-over-Time (DoT):*
- **Tick timing:** End of turn (after both combatants act)
- **Wake from sleep:** Only direct attack damage wakes, NOT DoT damage
- Burn: 6% max HP per turn
- Poison: 8% max HP per turn
- Bleed: 5% max HP per turn
- Curse: 10% max HP per turn + blocks healing

*Hard CC (Cannot self-cure):*
- Sleep: Skip turns for 1-7 turns (random), wake if hit by direct damage
- Freeze: Skip turn, breaks after 1-3 turns OR if hit by Fire-type attack
- Paralyze: 25% chance to skip turn each round
- Stun: Skip next turn only (then auto-clears, not sticky)

*Soft Status (Can self-cure):*
- Confusion: 25% chance to hit self, lasts 1-4 turns
- Burn, Poison, Bleed, Curse: Can be cured with appropriate skills

*Status Stacking Rules:*
- **Multiple different statuses:** ✅ Can have Burn + Poison + Confusion simultaneously
- **Same status twice:** ❌ Second application REPLACES first (refreshes duration)
- Example: Burned for 1 turn remaining → get hit by Burn again → now Burned for full duration

**Stat Stages:**
- Range: -6 to +6
- Formula: `1.5^stage` (50% per stage)
- **Cap enforcement:** Attempting to exceed ±6 shows "Won't go higher/lower!" message
  - Does NOT waste turn or mana
  - Player can choose different action
- **Stage reset:** All stages reset to 0 after battle ends (win/loss/retreat)
- **Persistence:** Stages do NOT persist between battles

---

## Current System Audit

### What Exists (No Changes Needed)

✅ **Combat Core:**
- Damage calculation: `attackPower × (1 - defReduction)` with variance
- Defense reduction: `min(75%, def / (100 + def))`
- Critical hits: 2x multiplier, DEX-based chance
- Dodge/Block: 100% avoid / 25% damage
- Defend action: 50% damage reduction for 1 turn
- Attack types: Physical (STR/DEX) vs Magic (INT/WIS/CHA)
- Class modifiers: Damage multipliers, tank penalties

✅ **Character Stats:**
- 6 base stats: STR, INT, WIS, CON, DEX, CHA
- HP/Mana pools with current values
- Stamina system (0-10, consumes per fight)
- Gear system (equippedGear, gearInventory)
- Power-ups system (activePowerUps array)
- Death system (status, recoveryTimerEnd)

✅ **Monster System:**
- 19 templates across 8 categories
- Level-based scaling (7.5% exponential)
- Prefix system (fierce/sturdy/ancient)
- Tier system (overworld/elite/dungeon/boss/raid)
- Affinity field (currently unused in combat)
- Speed field (currently unused for turn order)

✅ **Battle UI:**
- Pokemon-style 2x2 grid layout
- 4 actions: Attack, Defend, Run, Use Item
- HP/Mana bars with gradient fills
- Combat log with color coding
- Sprite animations
- Mobile responsive
- Crash recovery via localStorage

✅ **Battle Sources:**
- Bounties (quest completion rewards)
- Dungeons (room encounters + bosses)
- Elite encounters (rare spawns)

### What's Missing (Needs Implementation)

❌ **Character Schema:**
- `skills` field (unlocked, equipped, cooldowns)
- `battleState` field (statStages, statusEffects)
- `type` field on CharacterClass definition

❌ **Monster Schema:**
- `skills` array (2+ skills per monster)
- `battleState` field (statStages, statusEffects)

❌ **New Models:**
- `Skill.ts` model
- `StatusEffect.ts` types
- Skill data definitions (56 skills total)
- Monster skill pools (19 templates × 3-4 skills each)

❌ **Combat Services:**
- Stage system logic
- Type effectiveness calculator
- Status effect system (apply, tick, cure)
- Speed-based turn order
- Skill execution logic
- Monster AI skill selection

❌ **UI Components:**
- Skills button in BattleView
- Skill picker modal (in-battle)
- Skill loadout screen (character sheet)
- Stage indicators
- Status effect icons
- Type effectiveness messages

---

## Schema Changes & Migrations

### 1. Character Model Changes

**File:** `src/models/Character.ts`

**Add New Fields:**

```typescript
interface Character {
    // EXISTING FIELDS (no changes)
    // ...

    // NEW: Skills system
    skills: {
        unlocked: string[];          // SkillIds unlocked by leveling
        equipped: string[];          // 4-5 SkillIds equipped for battle (loadout)
        usedThisBattle: string[];    // Track once-per-battle skills
    };

    // NEW: In-battle state (ephemeral, not persisted to disk)
    // This gets reset at start of each battle
    battleState?: {
        statStages: {
            atk: number;      // -6 to +6
            def: number;      // -6 to +6
            speed: number;    // -6 to +6
        };
        statusEffects: StatusEffect[];
        turnsInBattle: number;
    };
}
```

**Add Type to CharacterClass:**

```typescript
interface CharacterClass {
    id: string;
    name: string;
    description: string;

    // NEW: Inherent type for resistance
    type: ElementalType;  // 'Physical', 'Light', 'Lightning', 'Arcane'

    // EXISTING combat config
    damageType: 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';
    // ... rest of class config
}
```

**Update CharacterClass Definitions:**

```typescript
// In CHARACTER_CLASSES array, add type field:
{
    id: 'warrior',
    name: 'Warrior',
    type: 'Physical',  // NEW
    // ... rest
},
{
    id: 'paladin',
    name: 'Paladin',
    type: 'Light',  // NEW
    // ... rest
},
// ... etc for all 7 classes
```

### 2. Monster Model Changes

**File:** `src/models/Monster.ts`

**Add New Fields:**

```typescript
interface Monster {
    // EXISTING FIELDS (no changes)
    // ...

    // NEW: Monster skills
    skills: MonsterSkill[];

    // NEW: In-battle state (ephemeral)
    battleState?: {
        statStages: {
            atk: number;
            def: number;
            speed: number;
        };
        statusEffects: StatusEffect[];
    };
}

interface MonsterSkill {
    skillId: string;
    name: string;
    description: string;

    // Type & Category
    type: ElementalType;
    category: 'damage' | 'buff' | 'debuff' | 'status';

    // Costs
    manaCost: number;  // For display only, monsters don't track mana

    // Damage skills
    damageMultiplier?: number;  // 1.5x, 2x, etc.
    ignoresDefenseStages?: boolean;

    // Stat changes
    statChanges?: {
        target: 'self' | 'enemy';
        atk?: number;   // Stage change
        def?: number;
        speed?: number;
    };

    // Status effects
    statusEffect?: {
        type: StatusEffectType;
        chance: number;  // 0-100%
    };

    // AI hints
    useCondition?: 'always' | 'low_hp' | 'high_hp' | 'once_per_battle';
    priority: number;  // Higher = more likely to use
}
```

**Add Skills Pool to MonsterTemplate:**

```typescript
interface MonsterTemplate {
    // EXISTING FIELDS (no changes)
    // ...

    // NEW: Skill pool (monster randomly picks 2-4 from this list)
    skillPool: MonsterSkill[];

    // NEW: How many skills to assign
    skillCount: number;  // 2 for normal, 3-4 for elite/boss
}
```

### 3. New Skill Model

**File:** `src/models/Skill.ts` (NEW FILE)

```typescript
/**
 * Skill System Models
 *
 * Defines player skills, effects, and usage rules.
 */

export type ElementalType =
    | 'Physical'
    | 'Fire'
    | 'Water'
    | 'Ice'
    | 'Lightning'
    | 'Earth'
    | 'Nature'
    | 'Poison'
    | 'Light'
    | 'Dark'
    | 'Arcane';

export type SkillCategory =
    | 'Damage'     // Pure damage skill
    | 'Heal'       // Restore HP
    | 'Buff'       // Raise own stats
    | 'Debuff'     // Lower enemy stats
    | 'Cure'       // Remove status effects
    | 'Status'     // Inflict status effect
    | 'HYBRID';    // Multiple effects

export type StatusEffectType =
    | 'burn'       // 6% max HP per turn
    | 'poison'     // 8% max HP per turn
    | 'bleed'      // 5% max HP per turn
    | 'paralyze'   // 25% chance skip turn (hard CC)
    | 'sleep'      // Skip turns 1-7 (hard CC)
    | 'freeze'     // Skip turn, breaks after 1-3 turns (hard CC)
    | 'confusion'  // 25% chance hit self, 1-4 turns
    | 'stun'       // Skip next turn only (not sticky)
    | 'curse';     // 10% max HP per turn, cannot heal

export interface StatusEffect {
    type: StatusEffectType;
    appliedTurn: number;
    magnitude?: number;      // % damage per turn
    duration?: number;       // Turns remaining (for timed effects)
    source: 'skill' | 'monster_ability' | 'item';
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    icon: string;  // Emoji or icon identifier

    // Learning
    learnLevel: number;                    // Character level required
    requiredClass: string[];               // Class IDs that can use

    // Cost & Usage
    manaCost: number;
    usageLimit?: 'once-per-battle' | 'unlimited';  // Defaults to unlimited

    // Type & Category
    type: ElementalType;
    category: SkillCategory;

    // Effects
    effect: SkillEffect;
}

export interface SkillEffect {
    // Damage skills
    damageMultiplier?: number;       // 1.5x, 2x, 3x, 4x ATK
    ignoresDefenseStages?: boolean;  // True for moves like Shadow Strike

    // Healing skills
    healPercent?: number;  // % of max HP to restore

    // Mana restoration (Meditate skill)
    restoreManaPercent?: number;  // % of max Mana to restore

    // Stat stage changes (Pokemon-style)
    statChanges?: {
        target: 'self' | 'enemy';
        atk?: number;      // Stage change: +1, -2, etc.
        def?: number;
        speed?: number;
    };

    // Status effects
    statusEffect?: {
        type: StatusEffectType;
        chance: number;  // 30%, 40%, 60% etc. (0-100)
    };

    // Cure effects
    cures?: StatusEffectType[];  // Which statuses this removes

    // Special mechanics
    lifesteal?: number;  // % of damage dealt restored as HP
    critBonus?: number;  // Additional crit chance (30%, 50%)
}

/**
 * Helper to check if status is "hard CC" (cannot self-cure)
 */
export function isHardCC(type: StatusEffectType): boolean {
    return ['paralyze', 'sleep', 'freeze', 'stun'].includes(type);
}

/**
 * Helper to check if status is "soft" (can self-cure)
 */
export function isSoftStatus(type: StatusEffectType): boolean {
    return ['burn', 'poison', 'bleed', 'confusion', 'curse'].includes(type);
}
```

### 4. Migration Scripts

**File:** `src/migrations/001-add-skills-system.ts` (NEW FILE)

```typescript
/**
 * Migration 001: Add Skills System
 *
 * Adds skills field to all existing characters.
 * Auto-unlocks skills based on current level.
 * Sets default loadout (first 4 unlocked skills).
 */

import { Character } from '../models/Character';
import { SKILL_DEFINITIONS } from '../data/skills';

export function migrateCharacterForSkills(character: Character): Character {
    // Skip if already migrated
    if (character.skills) {
        console.log(`Character ${character.name} already has skills, skipping`);
        return character;
    }

    console.log(`Migrating character ${character.name} (level ${character.level})`);

    // Get all skills for this character's class up to their level
    const unlockedSkills = SKILL_DEFINITIONS
        .filter(skill =>
            skill.requiredClass.includes(character.class) &&
            skill.learnLevel <= character.level
        )
        .map(skill => skill.id);

    console.log(`  Unlocked ${unlockedSkills.length} skills`);

    // Auto-equip first 4 skills as default loadout
    const equippedSkills = unlockedSkills.slice(0, 4);

    // Add skills field
    character.skills = {
        unlocked: unlockedSkills,
        equipped: equippedSkills,
        usedThisBattle: [],
    };

    console.log(`  Equipped ${equippedSkills.length} skills by default`);

    return character;
}

/**
 * Batch migration for all characters
 */
export async function migrateAllCharacters(plugin: QuestBoardPlugin): Promise<void> {
    const data = await plugin.loadData();

    if (!data.character) {
        console.log('No character found, skipping migration');
        return;
    }

    console.log('=== Starting Skills System Migration ===');

    // Migrate main character
    data.character = migrateCharacterForSkills(data.character);

    // Save updated data
    await plugin.saveData(data);

    console.log('=== Migration Complete ===');
}
```

**File:** `src/migrations/002-add-class-types.ts` (NEW FILE)

```typescript
/**
 * Migration 002: Add Inherent Types to Classes
 *
 * Updates CharacterClass definitions with type field.
 * No character data migration needed (just config change).
 */

import { CHARACTER_CLASSES } from '../config/characterClasses';

export function addClassTypes(): void {
    // This is a code-only migration
    // Just update the CHARACTER_CLASSES array in characterClasses.ts

    console.log('Class types added to config');
    console.log('Warrior → Physical');
    console.log('Paladin → Light');
    console.log('Technomancer → Lightning');
    console.log('Scholar → Arcane');
    console.log('Rogue → Physical');
    console.log('Cleric → Light');
    console.log('Bard → Arcane');
}
```

### 5. Long Rest Changes

**File:** `src/services/CharacterService.ts` (or wherever Long Rest is implemented)

**Current Long Rest Logic:**
```typescript
// BEFORE:
- Free once every 30 minutes
- Restores HP to full
- No mana impact
- Cooldown tracked via lastLongRestTime
```

**New Long Rest Logic:**
```typescript
interface LongRestOptions {
    forced?: boolean;  // Bypass cooldown by paying
}

async function performLongRest(character: Character, options: LongRestOptions = {}): Promise<LongRestResult> {
    const now = Date.now();
    const lastRest = character.lastLongRestTime || 0;
    const cooldownMs = 30 * 60 * 1000;  // 30 minutes
    const timeSinceRest = now - lastRest;
    const onCooldown = timeSinceRest < cooldownMs;

    // Calculate cost if forced
    let cost = 0;
    if (options.forced && onCooldown) {
        cost = 100 + (character.level * 35);  // Same as dungeon rescue

        // Check if player can afford
        if (character.gold < cost) {
            return {
                success: false,
                reason: 'insufficient_gold',
                cost,
            };
        }
    }

    // Check if rest is allowed
    if (onCooldown && !options.forced) {
        return {
            success: false,
            reason: 'on_cooldown',
            timeRemaining: cooldownMs - timeSinceRest,
        };
    }

    // Perform rest
    if (cost > 0) {
        character.gold -= cost;
    }

    // Restore HP and Mana to full
    character.currentHP = character.maxHP;
    character.currentMana = character.maxMana;

    // Clear all status effects
    if (character.battleState?.statusEffects) {
        character.battleState.statusEffects = [];
    }

    // Update last rest time (only if free rest)
    if (!options.forced) {
        character.lastLongRestTime = now;
    }

    return {
        success: true,
        hpRestored: character.maxHP,
        manaRestored: character.maxMana,
        cost,
        isFree: cost === 0,
    };
}

interface LongRestResult {
    success: boolean;
    reason?: 'on_cooldown' | 'insufficient_gold';
    timeRemaining?: number;  // ms until free rest available
    hpRestored?: number;
    manaRestored?: number;
    cost?: number;
    isFree?: boolean;
}
```

**UI Changes for Long Rest:**
- Show "Long Rest (Free)" if off cooldown
- Show "Long Rest (X gold)" if on cooldown with cost
- Show countdown timer if on cooldown and can't afford
- Confirm dialog if forcing rest with payment

### 6. Task Completion HP/Mana Regen

**File:** `src/services/QuestActionsService.ts` (or equivalent)

**Add to Task Completion Logic:**

```typescript
function onTaskCompleted(character: Character, task: Task): void {
    // EXISTING LOGIC (XP, achievements, etc.)
    // ...

    // NEW: 7% HP/Mana restore per task
    const hpRegen = Math.floor(character.maxHP * 0.07);
    const manaRegen = Math.floor(character.maxMana * 0.07);

    character.currentHP = Math.min(character.maxHP, character.currentHP + hpRegen);
    character.currentMana = Math.min(character.maxMana, character.currentMana + manaRegen);

    // Notify user
    new Notice(`Task complete! +${hpRegen} HP, +${manaRegen} Mana`);

    // Save character
    saveCharacter(character);
}
```

---

## Service Layer Changes

### 1. New: SkillService.ts

**File:** `src/services/SkillService.ts` (NEW FILE)

**Purpose:** Handle all skill-related logic (load, validate, execute).

**Dependencies:**
- `SKILL_DEFINITIONS` from `src/data/skills.ts`
- `CombatService` from `src/services/CombatService.ts` (for type effectiveness)
- `StatusEffect`, `Skill` models

**Core Methods:**

```typescript
import { CombatService } from './CombatService';

export class SkillService {
    /**
     * Load skill definition by ID
     */
    getSkill(skillId: string): Skill | undefined {
        return SKILL_DEFINITIONS.find(s => s.id === skillId);
    }

    /**
     * Get all skills for a character class
     */
    getSkillsForClass(className: string): Skill[] {
        return SKILL_DEFINITIONS.filter(s =>
            s.requiredClass.includes(className)
        );
    }

    /**
     * Check if character can unlock skill
     */
    canUnlockSkill(character: Character, skillId: string): boolean {
        const skill = this.getSkill(skillId);
        if (!skill) return false;

        // Check class requirement
        if (!skill.requiredClass.includes(character.class)) {
            return false;
        }

        // Check level requirement
        if (character.level < skill.learnLevel) {
            return false;
        }

        // Check if already unlocked
        if (character.skills.unlocked.includes(skillId)) {
            return false;
        }

        return true;
    }

    /**
     * Unlock skill for character
     */
    unlockSkill(character: Character, skillId: string): boolean {
        if (!this.canUnlockSkill(character, skillId)) {
            return false;
        }

        character.skills.unlocked.push(skillId);
        return true;
    }

    /**
     * Auto-unlock skills on level up
     */
    checkAndUnlockSkills(character: Character): string[] {
        const newSkills: string[] = [];
        const classSkills = this.getSkillsForClass(character.class);

        for (const skill of classSkills) {
            if (this.canUnlockSkill(character, skill.id)) {
                if (this.unlockSkill(character, skill.id)) {
                    newSkills.push(skill.id);
                }
            }
        }

        return newSkills;
    }

    /**
     * Validate skill use in battle
     */
    canUseSkill(
        character: Character,
        skillId: string,
        battleState: BattleState
    ): { canUse: boolean; reason?: string } {
        const skill = this.getSkill(skillId);
        if (!skill) {
            return { canUse: false, reason: 'Skill not found' };
        }

        // Check if equipped
        if (!character.skills.equipped.includes(skillId)) {
            return { canUse: false, reason: 'Skill not equipped' };
        }

        // Check mana cost
        if (character.currentMana < skill.manaCost) {
            return { canUse: false, reason: 'Not enough mana' };
        }

        // Check once-per-battle usage
        if (skill.usageLimit === 'once-per-battle') {
            if (character.skills.usedThisBattle.includes(skillId)) {
                return { canUse: false, reason: 'Already used this battle' };
            }
        }

        // Check hard CC prevention (can't use skills while asleep/paralyzed/frozen/stunned)
        if (this.isHardCCActive(character.battleState?.statusEffects || [])) {
            return { canUse: false, reason: 'Incapacitated' };
        }

        return { canUse: true };
    }

    /**
     * Check if character is hard CC'd
     */
    private isHardCCActive(statusEffects: StatusEffect[]): boolean {
        return statusEffects.some(effect => isHardCC(effect.type));
    }

    /**
     * Execute skill effect
     */
    executeSkill(
        skill: Skill,
        user: Combatant,
        target: Combatant,
        battleState: BattleState
    ): SkillResult {
        // SANITY CHECKS (defense in depth - should have been caught by canUseSkill)
        if (user.currentMana < skill.manaCost) {
            throw new Error(`Insufficient mana (${user.currentMana}/${skill.manaCost})`);
        }

        if (skill.usageLimit === 'once-per-battle' && user.skills.usedThisBattle.includes(skill.id)) {
            throw new Error(`Skill ${skill.id} already used this battle`);
        }

        // Check hard CC prevention
        if (this.isHardCCActive(user.battleState?.statusEffects || [])) {
            throw new Error(`Cannot use skills while incapacitated`);
        }

        // Proceed with execution
        const result: SkillResult = {
            skillId: skill.id,
            skillName: skill.name,
            user: user.name,
            target: target.name,
            effects: [],
        };

        // Apply damage
        if (skill.effect.damageMultiplier) {
            const damage = this.calculateSkillDamage(
                skill,
                user,
                target,
                battleState
            );
            result.damage = damage;
            result.effects.push(`Dealt ${damage} damage`);
        }

        // Apply healing
        if (skill.effect.healPercent) {
            const healing = Math.floor(user.maxHP * (skill.effect.healPercent / 100));
            user.currentHP = Math.min(user.maxHP, user.currentHP + healing);
            result.healing = healing;
            result.effects.push(`Restored ${healing} HP`);
        }

        // Apply mana restoration (Meditate skill)
        if (skill.effect.restoreManaPercent) {
            const manaRestored = Math.floor(user.maxMana * (skill.effect.restoreManaPercent / 100));
            user.currentMana = Math.min(user.maxMana, user.currentMana + manaRestored);
            result.manaRestored = manaRestored;
            result.effects.push(`Restored ${manaRestored} Mana`);
        }

        // Apply stat changes
        if (skill.effect.statChanges) {
            this.applyStatChanges(skill.effect.statChanges, user, target, result);
        }

        // Apply status effects
        if (skill.effect.statusEffect) {
            this.tryApplyStatus(skill.effect.statusEffect, target, result);
        }

        // Apply cures
        if (skill.effect.cures) {
            this.applyCures(skill.effect.cures, user, result);
        }

        // Apply lifesteal
        if (skill.effect.lifesteal && result.damage) {
            const lifesteal = Math.floor(result.damage * (skill.effect.lifesteal / 100));
            user.currentHP = Math.min(user.maxHP, user.currentHP + lifesteal);
            result.lifesteal = lifesteal;
            result.effects.push(`Drained ${lifesteal} HP`);
        }

        // Consume mana
        user.currentMana -= skill.manaCost;

        // Mark as used if once-per-battle
        if (skill.usageLimit === 'once-per-battle') {
            user.skills.usedThisBattle.push(skill.id);
        }

        return result;
    }

    /**
     * Calculate skill damage with type effectiveness and stages
     */
    private calculateSkillDamage(
        skill: Skill,
        attacker: Combatant,
        defender: Combatant,
        battleState: BattleState
    ): number {
        // Get base attack power (from CombatService)
        let attackPower = attacker.attack;

        // Apply ATK stages (unless skill ignores stages)
        if (!skill.effect.ignoresDefenseStages) {
            const atkStage = attacker.battleState?.statStages.atk || 0;
            const atkMultiplier = this.getStageMultiplier(atkStage);
            attackPower *= atkMultiplier;
        }

        // Apply skill damage multiplier
        attackPower *= skill.effect.damageMultiplier || 1;

        // Get defense
        let defense = defender.defense;

        // Apply DEF stages (unless skill ignores stages OR crit)
        const isCrit = battleState.lastActionWasCrit || false;
        if (!skill.effect.ignoresDefenseStages && !isCrit) {
            const defStage = defender.battleState?.statStages.def || 0;
            const defMultiplier = this.getStageMultiplier(defStage);
            defense *= defMultiplier;
        }

        // Calculate base damage
        const defenseReduction = Math.min(0.75, defense / (100 + defense));
        let damage = attackPower * (1 - defenseReduction);

        // Apply type effectiveness
        const effectiveness = this.getTypeEffectiveness(skill.type, defender.type);
        damage *= effectiveness;

        // Apply crit bonus if applicable
        if (skill.effect.critBonus) {
            // Roll for crit
            const critChance = attacker.critChance + skill.effect.critBonus;
            if (Math.random() * 100 < critChance) {
                damage *= 2;
                battleState.lastActionWasCrit = true;
            }
        }

        // Apply damage variance (±10%)
        const variance = 0.9 + (Math.random() * 0.2);
        damage *= variance;

        // Minimum 1 damage
        return Math.max(1, Math.floor(damage));
    }

    /**
     * Get stage multiplier (50% per stage)
     */
    private getStageMultiplier(stage: number): number {
        // Clamp to -6 to +6
        stage = Math.max(-6, Math.min(6, stage));

        // 1.5^stage formula
        return Math.pow(1.5, stage);
    }

    /**
     * Get type effectiveness multiplier
     */
    private getTypeEffectiveness(attackType: ElementalType, defenderType: ElementalType): number {
        // Use shared type chart from CombatService (no duplication)
        return CombatService.getTypeEffectiveness(attackType, defenderType);
    }

    /**
     * Apply stat stage changes
     */
    private applyStatChanges(
        changes: SkillEffect['statChanges'],
        user: Combatant,
        target: Combatant,
        result: SkillResult
    ): void {
        const targetCombatant = changes!.target === 'self' ? user : target;

        if (!targetCombatant.battleState) {
            targetCombatant.battleState = {
                statStages: { atk: 0, def: 0, speed: 0 },
                statusEffects: [],
                turnsInBattle: 0,
            };
        }

        // Apply ATK change
        if (changes!.atk) {
            const newStage = this.applyStageChange(
                targetCombatant.battleState.statStages.atk,
                changes!.atk
            );

            if (newStage !== targetCombatant.battleState.statStages.atk) {
                targetCombatant.battleState.statStages.atk = newStage;
                result.effects.push(
                    `${targetCombatant.name}'s ATK ${changes!.atk > 0 ? 'rose' : 'fell'}!`
                );
            } else {
                result.effects.push(`${targetCombatant.name}'s ATK won't go ${changes!.atk > 0 ? 'higher' : 'lower'}!`);
            }
        }

        // Apply DEF change (same logic)
        if (changes!.def) {
            // ... similar to ATK
        }

        // Apply Speed change (same logic)
        if (changes!.speed) {
            // ... similar to ATK
        }
    }

    /**
     * Apply stage change with cap check
     */
    private applyStageChange(currentStage: number, change: number): number {
        const newStage = currentStage + change;
        return Math.max(-6, Math.min(6, newStage));  // Clamp to -6 to +6
    }

    /**
     * Try to apply status effect with chance roll
     */
    private tryApplyStatus(
        statusConfig: { type: StatusEffectType; chance: number },
        target: Combatant,
        result: SkillResult
    ): void {
        // Roll chance
        if (Math.random() * 100 >= statusConfig.chance) {
            result.effects.push(`Status failed to apply`);
            return;
        }

        // Check if target already has this status
        const existingIndex = target.battleState?.statusEffects.findIndex(
            e => e.type === statusConfig.type
        );

        if (existingIndex !== undefined && existingIndex >= 0) {
            // Replace existing status (refreshes duration)
            target.battleState!.statusEffects[existingIndex] = {
                type: statusConfig.type,
                appliedTurn: 0,  // Will be set by BattleService
                source: 'skill',
            };
            result.effects.push(`${target.name}'s ${statusConfig.type} was refreshed!`);
        } else {
            // Add new status
            if (!target.battleState) {
                target.battleState = {
                    statStages: { atk: 0, def: 0, speed: 0 },
                    statusEffects: [],
                    turnsInBattle: 0,
                };
            }

            target.battleState.statusEffects.push({
                type: statusConfig.type,
                appliedTurn: 0,  // Will be set by BattleService
                source: 'skill',
            });
            result.effects.push(`${target.name} was ${statusConfig.type}ed!`);
        }
    }

    /**
     * Apply status cures
     */
    private applyCures(
        cures: StatusEffectType[],
        user: Combatant,
        result: SkillResult
    ): void {
        if (!user.battleState?.statusEffects) {
            result.effects.push(`No status to cure`);
            return;
        }

        const removedEffects: StatusEffectType[] = [];

        user.battleState.statusEffects = user.battleState.statusEffects.filter(effect => {
            if (cures.includes(effect.type)) {
                removedEffects.push(effect.type);
                return false;  // Remove
            }
            return true;  // Keep
        });

        if (removedEffects.length > 0) {
            result.effects.push(`Cured: ${removedEffects.join(', ')}`);
        } else {
            result.effects.push(`No matching status to cure`);
        }
    }
}

interface SkillResult {
    skillId: string;
    skillName: string;
    user: string;
    target: string;
    damage?: number;
    healing?: number;
    manaRestored?: number;  // For Meditate skill
    lifesteal?: number;
    effects: string[];  // Text descriptions of what happened
}

type Combatant = Character | Monster;
```

**Dependencies:**
- `SKILL_DEFINITIONS` from `src/data/skills.ts`
- Type effectiveness chart (see Data Creation section)

---

### 2. New: StatusEffectService.ts

**File:** `src/services/StatusEffectService.ts` (NEW FILE)

**Purpose:** Handle status effect application, ticking, and cleanup.

**Core Methods:**

```typescript
export class StatusEffectService {
    /**
     * Tick all status effects at end of turn
     */
    tickStatusEffects(combatant: Combatant, turnNumber: number): StatusTickResult {
        const result: StatusTickResult = {
            damageTaken: 0,
            effectsExpired: [],
            effectsTriggered: [],
        };

        if (!combatant.battleState?.statusEffects) {
            return result;
        }

        // STEP 1: Initialize durations for status effects that need them
        // (Do this BEFORE ticking/removing to avoid array mutation issues)
        combatant.battleState.statusEffects.forEach(effect => {
            if (!effect.duration) {
                switch (effect.type) {
                    case 'sleep':
                        effect.duration = 1 + Math.floor(Math.random() * 7);  // 1-7 turns
                        break;
                    case 'freeze':
                        effect.duration = 1 + Math.floor(Math.random() * 3);  // 1-3 turns
                        break;
                    case 'confusion':
                        effect.duration = 1 + Math.floor(Math.random() * 4);  // 1-4 turns
                        break;
                    // Other effects (burn, poison, bleed, curse, paralyze) have no duration
                }
            }
        });

        // STEP 2: Tick damage and decrement durations
        const effectsToRemove: number[] = [];

        combatant.battleState.statusEffects.forEach((effect, index) => {
            // Tick damage-over-time effects
            if (['burn', 'poison', 'bleed', 'curse'].includes(effect.type)) {
                const damage = this.calculateStatusDamage(effect, combatant);
                combatant.currentHP = Math.max(0, combatant.currentHP - damage);
                result.damageTaken += damage;
                result.effectsTriggered.push({
                    type: effect.type,
                    damage,
                });
            }

            // Check duration-based expiration
            if (effect.duration !== undefined) {
                effect.duration--;
                if (effect.duration <= 0) {
                    effectsToRemove.push(index);
                    result.effectsExpired.push(effect.type);
                }
            }
        });

        // STEP 3: Remove expired effects (reverse to maintain indices)
        effectsToRemove.reverse().forEach(index => {
            combatant.battleState!.statusEffects.splice(index, 1);
        });

        return result;
    }

    /**
     * Calculate damage from status effect
     */
    private calculateStatusDamage(effect: StatusEffect, combatant: Combatant): number {
        const percentages: Record<string, number> = {
            burn: 0.06,    // 6% max HP
            poison: 0.08,  // 8% max HP
            bleed: 0.05,   // 5% max HP
            curse: 0.10,   // 10% max HP
        };

        const percent = percentages[effect.type] || 0;
        return Math.max(1, Math.floor(combatant.maxHP * percent));
    }

    /**
     * Check if combatant should skip turn due to status
     */
    shouldSkipTurn(combatant: Combatant): { skip: boolean; reason?: string } {
        if (!combatant.battleState?.statusEffects) {
            return { skip: false };
        }

        for (const effect of combatant.battleState.statusEffects) {
            // Sleep/Freeze = always skip
            if (effect.type === 'sleep' || effect.type === 'freeze') {
                return { skip: true, reason: effect.type };
            }

            // Stun = skip (then remove)
            if (effect.type === 'stun') {
                this.removeStatus(combatant, 'stun');
                return { skip: true, reason: 'stun' };
            }

            // Paralyze = 25% chance
            if (effect.type === 'paralyze') {
                if (Math.random() < 0.25) {
                    return { skip: true, reason: 'paralyze' };
                }
            }

            // Confusion = 25% chance to hit self
            if (effect.type === 'confusion') {
                if (Math.random() < 0.25) {
                    return { skip: true, reason: 'confusion_self_hit' };
                }
            }
        }

        return { skip: false };
    }

    /**
     * Remove specific status from combatant
     */
    removeStatus(combatant: Combatant, type: StatusEffectType): boolean {
        if (!combatant.battleState?.statusEffects) {
            return false;
        }

        const index = combatant.battleState.statusEffects.findIndex(e => e.type === type);
        if (index >= 0) {
            combatant.battleState.statusEffects.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Clear all status effects (for Long Rest, death recovery, etc.)
     */
    clearAllStatus(combatant: Combatant): void {
        if (combatant.battleState) {
            combatant.battleState.statusEffects = [];
        }
    }

    /**
     * Wake from sleep if hit by damage
     */
    wakeFromSleep(combatant: Combatant): boolean {
        return this.removeStatus(combatant, 'sleep');
    }

    /**
     * Break freeze if hit by Fire-type move
     */
    breakFreeze(combatant: Combatant, attackType: ElementalType): boolean {
        if (attackType === 'Fire') {
            return this.removeStatus(combatant, 'freeze');
        }
        return false;
    }
}

interface StatusTickResult {
    damageTaken: number;
    effectsExpired: StatusEffectType[];
    effectsTriggered: Array<{
        type: StatusEffectType;
        damage: number;
    }>;
}

type Combatant = Character | Monster;
```

---

### 3. Update: BattleService.ts

**File:** `src/services/BattleService.ts`

**Major Changes Needed:**

```typescript
// ADD: Import new services
import { SkillService } from './SkillService';
import { StatusEffectService } from './StatusEffectService';

export class BattleService {
    private skillService: SkillService;
    private statusService: StatusEffectService;

    constructor(/* ... */) {
        // ... existing
        this.skillService = new SkillService();
        this.statusService = new StatusEffectService();
    }

    // NEW METHOD: Handle skill action
    async handleSkillAction(skillId: string): Promise<void> {
        const character = this.battleState.player;
        const monster = this.battleState.monster;

        // Validate skill use
        const validation = this.skillService.canUseSkill(
            character,
            skillId,
            this.battleState
        );

        if (!validation.canUse) {
            this.addLog(`Cannot use skill: ${validation.reason}`);
            return;
        }

        // Get skill definition
        const skill = this.skillService.getSkill(skillId);
        if (!skill) {
            this.addLog('Skill not found');
            return;
        }

        // Execute skill
        this.battleState.state = 'PROCESSING_TURN';
        const result = this.skillService.executeSkill(
            skill,
            character,
            monster,
            this.battleState
        );

        // Log results
        this.addLog(`${character.name} used ${skill.name}!`, 'player');
        result.effects.forEach(effect => this.addLog(effect));

        // Apply damage to monster
        if (result.damage) {
            monster.currentHP = Math.max(0, monster.currentHP - result.damage);

            // Wake from sleep if hit by DIRECT ATTACK (not DoT)
            // DoT damage (burn/poison/bleed) is handled in tickStatusEffects and does NOT wake
            if (result.damage > 0) {
                this.statusService.wakeFromSleep(monster);
            }

            // Break freeze if hit by Fire-type attack
            this.statusService.breakFreeze(monster, skill.type);
        }

        // Check if monster died
        if (monster.currentHP <= 0) {
            await this.handleVictory();
            return;
        }

        // Advance to enemy turn
        this.battleState.state = 'ENEMY_TURN';
        await this.handleEnemyTurn();
    }

    // UPDATED METHOD: Enemy turn with skill AI
    async handleEnemyTurn(): Promise<void> {
        const monster = this.battleState.monster;
        const character = this.battleState.player;

        // Check if monster should skip turn
        const skipCheck = this.statusService.shouldSkipTurn(monster);
        if (skipCheck.skip) {
            this.addLog(`${monster.name} is ${skipCheck.reason}! Can't move!`, 'enemy');

            // Tick status effects
            const tickResult = this.statusService.tickStatusEffects(
                monster,
                this.battleState.turnNumber
            );
            if (tickResult.damageTaken > 0) {
                this.addLog(`${monster.name} took ${tickResult.damageTaken} damage from status!`, 'enemy');
            }

            // Back to player turn
            this.battleState.state = 'PLAYER_INPUT';
            return;
        }

        // Monster AI: Choose skill or basic attack
        const chosenSkill = this.chooseMonsterSkill(monster, character);

        if (chosenSkill) {
            // Use skill
            const result = this.skillService.executeSkill(
                chosenSkill,
                monster,
                character,
                this.battleState
            );

            this.addLog(`${monster.name} used ${chosenSkill.name}!`, 'enemy');
            result.effects.forEach(effect => this.addLog(effect, 'enemy'));

            // Apply damage to player
            if (result.damage) {
                character.currentHP = Math.max(0, character.currentHP - result.damage);

                // Wake from sleep if hit
                this.statusService.wakeFromSleep(character);

                // Break freeze if Fire-type
                this.statusService.breakFreeze(character, chosenSkill.type);
            }
        } else {
            // Basic attack (existing logic)
            await this.executeMonsterAttack();
        }

        // Tick status effects for both
        await this.tickAllStatusEffects();

        // Check if player died
        if (character.currentHP <= 0) {
            await this.handleDefeat();
            return;
        }

        // Back to player turn
        this.battleState.turnNumber++;
        this.battleState.state = 'PLAYER_INPUT';
    }

    // NEW METHOD: Monster AI skill selection
    private chooseMonsterSkill(monster: Monster, player: Character): Skill | null {
        // Simple weighted random for V1
        const usableSkills = monster.skills.filter(skill => {
            // Check once-per-battle usage
            if (skill.useCondition === 'once_per_battle') {
                if (monster.battleState?.skillsUsed?.includes(skill.skillId)) {
                    return false;
                }
            }

            // Check HP-based conditions
            const hpPercent = (monster.currentHP / monster.maxHP) * 100;
            if (skill.useCondition === 'low_hp' && hpPercent > 30) {
                return false;
            }
            if (skill.useCondition === 'high_hp' && hpPercent < 70) {
                return false;
            }

            return true;
        });

        if (usableSkills.length === 0) {
            return null;  // Use basic attack
        }

        // Weight by priority
        const totalPriority = usableSkills.reduce((sum, s) => sum + s.priority, 0);
        let roll = Math.random() * totalPriority;

        for (const skill of usableSkills) {
            roll -= skill.priority;
            if (roll <= 0) {
                // Convert MonsterSkill to Skill for execution
                return this.convertMonsterSkillToSkill(skill);
            }
        }

        return null;
    }

    // NEW METHOD: Tick status effects for both combatants
    private async tickAllStatusEffects(): Promise<void> {
        const player = this.battleState.player;
        const monster = this.battleState.monster;

        // Tick player status
        const playerTick = this.statusService.tickStatusEffects(
            player,
            this.battleState.turnNumber
        );
        if (playerTick.damageTaken > 0) {
            this.addLog(`You took ${playerTick.damageTaken} damage from status!`, 'player');
        }
        playerTick.effectsExpired.forEach(type => {
            this.addLog(`Your ${type} wore off!`, 'player');
        });

        // Tick monster status
        const monsterTick = this.statusService.tickStatusEffects(
            monster,
            this.battleState.turnNumber
        );
        if (monsterTick.damageTaken > 0) {
            this.addLog(`${monster.name} took ${monsterTick.damageTaken} damage from status!`, 'enemy');
        }
        monsterTick.effectsExpired.forEach(type => {
            this.addLog(`${monster.name}'s ${type} wore off!`, 'enemy');
        });
    }

    // UPDATED METHOD: Initialize battle with stage/status reset
    initializeBattle(monster: Monster, character: Character): void {
        // EXISTING LOGIC
        // ...

        // NEW: Reset battle state for both combatants
        character.battleState = {
            statStages: { atk: 0, def: 0, speed: 0 },
            statusEffects: [...(character.battleState?.statusEffects || [])],  // Persist status
            turnsInBattle: 0,
        };

        character.skills.usedThisBattle = [];  // Reset once-per-battle skills

        monster.battleState = {
            statStages: { atk: 0, def: 0, speed: 0 },
            statusEffects: [],  // Monsters always start fresh
        };

        this.battleState.turnNumber = 0;
    }

    // UPDATED METHOD: Victory cleans up but persists status
    async handleVictory(): Promise<void> {
        // EXISTING LOGIC (XP, gold, loot)
        // ...

        // NEW: Status effects persist (don't clear character.battleState.statusEffects)
        // NEW: Stat stages reset (already handled by next battle init)

        // Persist character state
        await this.saveCharacter(character);
    }

    // UPDATED METHOD: Defeat clears all status
    async handleDefeat(): Promise<void> {
        // EXISTING LOGIC
        // ...

        // NEW: Death recovery options clear all status
        // (Handled in death recovery modal logic)
    }
}
```

---

### 4. Update: CombatService.ts

**File:** `src/services/CombatService.ts`

**Add Type Effectiveness:**

```typescript
export class CombatService {
    // ADD: Type effectiveness chart
    private static TYPE_CHART: Record<ElementalType, TypeMatchup> = {
        Physical: { strong: ['Arcane'], weak: ['Earth', 'Dark'] },
        Fire: { strong: ['Nature', 'Ice'], weak: ['Water', 'Earth'] },
        Water: { strong: ['Fire', 'Earth'], weak: ['Nature', 'Lightning'] },
        Ice: { strong: ['Nature', 'Earth'], weak: ['Fire', 'Water'] },
        Lightning: { strong: ['Water', 'Physical'], weak: ['Earth', 'Nature'] },
        Earth: { strong: ['Fire', 'Lightning', 'Poison'], weak: ['Nature', 'Ice'] },
        Nature: { strong: ['Water', 'Earth'], weak: ['Fire', 'Ice', 'Poison'] },
        Poison: { strong: ['Nature', 'Physical'], weak: ['Earth', 'Dark'] },
        Light: { strong: ['Dark'], weak: ['Nature'] },
        Dark: { strong: ['Light', 'Physical'], weak: ['Light'] },
        Arcane: { strong: ['Physical'], weak: ['Dark'] },
    };

    /**
     * Get type effectiveness multiplier
     */
    static getTypeEffectiveness(attackType: ElementalType, defenderType: ElementalType): number {
        const matchup = this.TYPE_CHART[attackType];
        if (!matchup) return 1.0;

        // Check if super effective
        if (matchup.strong.includes(defenderType)) {
            return 2.0;
        }

        // Check if not very effective
        if (matchup.weak.includes(defenderType)) {
            return 0.5;
        }

        // Neutral
        return 1.0;
    }

    /**
     * Get character inherent type resistance
     */
    static getInherentResistance(character: Character, incomingType: ElementalType): number {
        const classConfig = CHARACTER_CLASSES.find(c => c.id === character.class);
        if (!classConfig) return 1.0;

        // 10% resistance to own type
        if (classConfig.type === incomingType) {
            return 0.9;  // Take 90% damage
        }

        return 1.0;
    }
}

interface TypeMatchup {
    strong: ElementalType[];  // This type deals 2x to these
    weak: ElementalType[];    // This type deals 0.5x to these
}
```

**Add Stage Multiplier:**

```typescript
export class CombatService {
    /**
     * Get stat multiplier from stage
     */
    static getStageMultiplier(stage: number): number {
        // Clamp to -6 to +6
        stage = Math.max(-6, Math.min(6, stage));

        // 1.5^stage formula
        // Stage +1 = 1.5x, +2 = 2.25x, +3 = 3.375x, +6 = 11.39x
        // Stage -1 = 0.67x, -2 = 0.44x, -3 = 0.30x, -6 = 0.088x
        return Math.pow(1.5, stage);
    }
}
```

---

### 5. Update: MonsterService.ts

**File:** `src/services/MonsterService.ts`

**Add Skill Assignment:**

```typescript
export class MonsterService {
    /**
     * Create monster with skills assigned
     */
    createMonster(
        templateId: string,
        level: number,
        tier: MonsterTier,
        prefix: MonsterPrefix = 'none'
    ): Monster {
        // EXISTING LOGIC (stats, rewards, etc.)
        const monster = /* ... existing creation logic ... */;

        // NEW: Assign skills based on tier
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        const skillCount = this.getSkillCountForTier(tier);
        monster.skills = this.assignMonsterSkills(template, skillCount, tier);

        return monster;
    }

    /**
     * Get how many skills monster should have based on tier
     */
    private getSkillCountForTier(tier: MonsterTier): number {
        switch (tier) {
            case 'overworld':
            case 'dungeon':
                return 2;  // 1 basic + 1 special
            case 'elite':
                return 3;
            case 'boss':
            case 'raid_boss':
                return 4;
            default:
                return 2;
        }
    }

    /**
     * Assign random skills from template pool
     */
    private assignMonsterSkills(
        template: MonsterTemplate,
        count: number,
        tier: MonsterTier
    ): MonsterSkill[] {
        const pool = [...template.skillPool];
        const assigned: MonsterSkill[] = [];

        // Always include basic attack if available
        const basicAttackIndex = pool.findIndex(s => s.category === 'damage' && s.priority >= 100);
        if (basicAttackIndex >= 0) {
            const basicAttack = pool.splice(basicAttackIndex, 1)[0];
            assigned.push(this.scaleMonsterSkill(basicAttack, tier));
            count--;
        }

        // Randomly pick remaining skills
        while (assigned.length < count && pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const skill = pool.splice(randomIndex, 1)[0];
            assigned.push(this.scaleMonsterSkill(skill, tier));
        }

        return assigned;
    }

    /**
     * Scale monster skill power based on tier
     */
    private scaleMonsterSkill(skill: MonsterSkill, tier: MonsterTier): MonsterSkill {
        const scaled = { ...skill };

        // Elite/Boss get stronger versions
        const tierMultipliers: Record<MonsterTier, number> = {
            overworld: 1.0,
            dungeon: 1.0,
            elite: 1.1,     // +10% damage
            boss: 1.15,     // +15% damage
            raid_boss: 1.2, // +20% damage
        };

        const multiplier = tierMultipliers[tier] || 1.0;

        if (scaled.damageMultiplier) {
            scaled.damageMultiplier *= multiplier;
        }

        // Elite/Boss have higher status effect chances
        if (scaled.statusEffect && (tier === 'elite' || tier === 'boss' || tier === 'raid_boss')) {
            scaled.statusEffect.chance = Math.min(100, scaled.statusEffect.chance * 1.2);
        }

        return scaled;
    }
}
```

---

## UI Component Changes

### 1. Update: BattleView.tsx

**File:** `src/components/BattleView.tsx`

**Add Skills Button:**

```typescript
// In action buttons section (currently Attack/Defend/Run/Item):

<div className="battle-actions">
    <button onClick={handleAttack}>⚔️ Attack</button>
    <button onClick={handleDefend}>🛡️ Defend</button>
    <button onClick={handleSkills}>✨ Skills</button>  {/* NEW */}
    <button onClick={handleItem}>🧪 Item</button>
    <button onClick={handleRun}>🏃 Run</button>
</div>
```

**Add Stage Indicators:**

```typescript
// In player/monster display sections:

<div className="battle-stats">
    <div className="hp-bar">...</div>
    <div className="mana-bar">...</div>

    {/* NEW: Stage indicators */}
    {character.battleState?.statStages && (
        <div className="stage-indicators">
            {character.battleState.statStages.atk !== 0 && (
                <span className={`stage-badge ${character.battleState.statStages.atk > 0 ? 'positive' : 'negative'}`}>
                    ATK {character.battleState.statStages.atk > 0 ? '+' : ''}{character.battleState.statStages.atk}
                </span>
            )}
            {character.battleState.statStages.def !== 0 && (
                <span className={`stage-badge ${character.battleState.statStages.def > 0 ? 'positive' : 'negative'}`}>
                    DEF {character.battleState.statStages.def > 0 ? '+' : ''}{character.battleState.statStages.def}
                </span>
            )}
            {character.battleState.statStages.speed !== 0 && (
                <span className={`stage-badge ${character.battleState.statStages.speed > 0 ? 'positive' : 'negative'}`}>
                    SPD {character.battleState.statStages.speed > 0 ? '+' : ''}{character.battleState.statStages.speed}
                </span>
            )}
        </div>
    )}

    {/* NEW: Status effect icons */}
    {character.battleState?.statusEffects && character.battleState.statusEffects.length > 0 && (
        <div className="status-effects">
            {character.battleState.statusEffects.map((effect, i) => (
                <span key={i} className={`status-icon ${effect.type}`} title={effect.type}>
                    {getStatusIcon(effect.type)}
                </span>
            ))}
        </div>
    )}
</div>
```

**Helper Function for Status Icons:**

```typescript
function getStatusIcon(type: StatusEffectType): string {
    const icons: Record<StatusEffectType, string> = {
        burn: '🔥',
        poison: '☠️',
        bleed: '🩸',
        paralyze: '⚡',
        sleep: '😴',
        freeze: '❄️',
        confusion: '😵',
        stun: '💫',
        curse: '👿',
    };
    return icons[type] || '❓';
}
```

---

### 2. New: SkillPickerModal.tsx

**File:** `src/components/SkillPickerModal.tsx` (NEW FILE)

**Purpose:** In-battle skill selection modal

```typescript
import React from 'react';
import { Character } from '../models/Character';
import { Skill } from '../models/Skill';
import { SkillService } from '../services/SkillService';

interface SkillPickerModalProps {
    character: Character;
    onSkillSelect: (skillId: string) => void;
    onClose: () => void;
}

export const SkillPickerModal: React.FC<SkillPickerModalProps> = ({
    character,
    onSkillSelect,
    onClose,
}) => {
    const skillService = new SkillService();

    // Get equipped skills
    const equippedSkills = character.skills.equipped
        .map(id => skillService.getSkill(id))
        .filter(Boolean) as Skill[];

    return (
        <div className="skill-picker-modal">
            <div className="modal-header">
                <h2>Choose a Skill</h2>
                <button onClick={onClose}>✕</button>
            </div>

            <div className="skill-list">
                {equippedSkills.map(skill => {
                    const canUse = skillService.canUseSkill(character, skill.id, {} as any);
                    const isUsed = character.skills.usedThisBattle.includes(skill.id);

                    return (
                        <div
                            key={skill.id}
                            className={`skill-card ${!canUse.canUse ? 'disabled' : ''}`}
                            onClick={() => canUse.canUse && onSkillSelect(skill.id)}
                        >
                            <div className="skill-header">
                                <span className="skill-icon">{skill.icon}</span>
                                <span className="skill-name">{skill.name}</span>
                                <span className={`skill-type type-${skill.type.toLowerCase()}`}>
                                    {skill.type}
                                </span>
                            </div>

                            <div className="skill-description">{skill.description}</div>

                            <div className="skill-footer">
                                <span className="skill-mana">
                                    💧 {skill.manaCost} Mana
                                </span>
                                {skill.usageLimit === 'once-per-battle' && (
                                    <span className={`skill-usage ${isUsed ? 'used' : 'available'}`}>
                                        {isUsed ? '✓ Used' : '⚡ Ultimate'}
                                    </span>
                                )}
                            </div>

                            {!canUse.canUse && (
                                <div className="skill-error">{canUse.reason}</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="modal-footer">
                <div className="current-mana">
                    Current Mana: {character.currentMana} / {character.maxMana}
                </div>
            </div>
        </div>
    );
};
```

---

### 3. New: SkillLoadoutModal.tsx

**File:** `src/components/SkillLoadoutModal.tsx` (NEW FILE)

**Purpose:** Character sheet skill selection (choose 4-5 to equip)

```typescript
import React, { useState } from 'react';
import { Character } from '../models/Character';
import { Skill } from '../models/Skill';
import { SkillService } from '../services/SkillService';

interface SkillLoadoutModalProps {
    character: Character;
    onSave: (equipped: string[]) => void;
    onClose: () => void;
}

export const SkillLoadoutModal: React.FC<SkillLoadoutModalProps> = ({
    character,
    onSave,
    onClose,
}) => {
    const skillService = new SkillService();
    const [equipped, setEquipped] = useState<string[]>([...character.skills.equipped]);

    // Get all unlocked skills
    const unlockedSkills = character.skills.unlocked
        .map(id => skillService.getSkill(id))
        .filter(Boolean) as Skill[];

    const toggleEquip = (skillId: string) => {
        if (equipped.includes(skillId)) {
            // Unequip
            setEquipped(equipped.filter(id => id !== skillId));
        } else {
            // Equip (max 5)
            if (equipped.length < 5) {
                setEquipped([...equipped, skillId]);
            }
        }
    };

    const handleSave = () => {
        onSave(equipped);
        onClose();
    };

    return (
        <div className="skill-loadout-modal">
            <div className="modal-header">
                <h2>Skill Loadout</h2>
                <p>Choose up to 5 skills to use in battle</p>
                <button onClick={onClose}>✕</button>
            </div>

            <div className="loadout-slots">
                <h3>Equipped ({equipped.length}/5)</h3>
                <div className="equipped-skills">
                    {equipped.map((id, index) => {
                        const skill = skillService.getSkill(id);
                        if (!skill) return null;

                        return (
                            <div key={id} className="equipped-skill-slot">
                                <span className="slot-number">{index + 1}</span>
                                <span className="skill-icon">{skill.icon}</span>
                                <span className="skill-name">{skill.name}</span>
                                <button onClick={() => toggleEquip(id)}>✕</button>
                            </div>
                        );
                    })}
                    {[...Array(5 - equipped.length)].map((_, i) => (
                        <div key={`empty-${i}`} className="equipped-skill-slot empty">
                            <span className="slot-number">{equipped.length + i + 1}</span>
                            <span>Empty Slot</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="available-skills">
                <h3>Available Skills</h3>
                <div className="skill-grid">
                    {unlockedSkills.map(skill => {
                        const isEquipped = equipped.includes(skill.id);

                        return (
                            <div
                                key={skill.id}
                                className={`skill-card ${isEquipped ? 'equipped' : ''}`}
                                onClick={() => toggleEquip(skill.id)}
                            >
                                <div className="skill-header">
                                    <span className="skill-icon">{skill.icon}</span>
                                    <span className="skill-name">{skill.name}</span>
                                    {isEquipped && <span className="equipped-badge">✓</span>}
                                </div>

                                <div className="skill-type">{skill.type}</div>
                                <div className="skill-description">{skill.description}</div>

                                <div className="skill-stats">
                                    <span>💧 {skill.manaCost}</span>
                                    {skill.usageLimit === 'once-per-battle' && <span>⚡ Ultimate</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="modal-footer">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="primary">
                    Save Loadout
                </button>
            </div>
        </div>
    );
};
```

---

### 4. Update: CharacterSheet.tsx

**File:** `src/components/CharacterSheet.tsx`

**Add Skills Tab:**

```typescript
// Add new tab option
const tabs = ['Stats', 'Skills', 'Gear', 'Achievements'];

// In tab content rendering:
{activeTab === 'Skills' && (
    <div className="skills-tab">
        <div className="skills-header">
            <h3>Unlocked Skills ({character.skills.unlocked.length})</h3>
            <button onClick={() => setShowLoadoutModal(true)}>
                Edit Loadout
            </button>
        </div>

        <div className="skill-list">
            {character.skills.unlocked.map(skillId => {
                const skill = skillService.getSkill(skillId);
                if (!skill) return null;

                const isEquipped = character.skills.equipped.includes(skillId);

                return (
                    <div key={skillId} className={`skill-item ${isEquipped ? 'equipped' : ''}`}>
                        <span className="skill-icon">{skill.icon}</span>
                        <div className="skill-info">
                            <div className="skill-name">{skill.name}</div>
                            <div className="skill-description">{skill.description}</div>
                        </div>
                        {isEquipped && <span className="equipped-badge">Equipped</span>}
                    </div>
                );
            })}
        </div>

        <div className="next-skill-preview">
            <h4>Next Skill</h4>
            {/* Show next skill to unlock at level X */}
        </div>
    </div>
)}

{/* Modal */}
{showLoadoutModal && (
    <SkillLoadoutModal
        character={character}
        onSave={(equipped) => {
            character.skills.equipped = equipped;
            saveCharacter(character);
        }}
        onClose={() => setShowLoadoutModal(false)}
    />
)}
```

---

## Data Creation

### 1. Skill Definitions

**File:** `src/data/skills.ts` (NEW FILE)

**Purpose:** Define all 56 skills (8 per class × 7 classes)

```typescript
import { Skill } from '../models/Skill';

/**
 * All skill definitions for Quest Board
 *
 * Based on: docs/development/Skills planning.md
 */

export const SKILL_DEFINITIONS: Skill[] = [
    // ==================
    // WARRIOR SKILLS
    // ==================
    {
        id: 'warrior_slash',
        name: 'Slash',
        description: 'A basic but reliable sword strike.',
        icon: '⚔️',
        learnLevel: 5,
        requiredClass: ['warrior'],
        manaCost: 12,
        type: 'Physical',
        category: 'Damage',
        effect: {
            damageMultiplier: 1.5,
        },
    },
    {
        id: 'warrior_sharpen',
        name: 'Sharpen',
        description: 'Hone your blade and focus your strikes.',
        icon: '🗡️',
        learnLevel: 8,
        requiredClass: ['warrior'],
        manaCost: 14,
        type: 'Physical',
        category: 'Buff',
        effect: {
            statChanges: {
                target: 'self',
                atk: 1,
            },
        },
    },
    {
        id: 'warrior_fortify',
        name: 'Fortify',
        description: 'Brace yourself for incoming attacks.',
        icon: '🛡️',
        learnLevel: 13,
        requiredClass: ['warrior'],
        manaCost: 14,
        type: 'Physical',
        category: 'Buff',
        effect: {
            statChanges: {
                target: 'self',
                def: 1,
            },
        },
    },
    {
        id: 'warrior_battle_hardened',
        name: 'Battle Hardened',
        description: 'Shrug off debilitating effects through sheer willpower.',
        icon: '💪',
        learnLevel: 18,
        requiredClass: ['warrior'],
        manaCost: 12,
        type: 'Physical',
        category: 'Cure',
        effect: {
            cures: [],  // Special: Only removes ATK/DEF stage debuffs (handled in service)
        },
    },
    {
        id: 'warrior_cleave',
        name: 'Cleave',
        description: 'A powerful sweeping attack.',
        icon: '🪓',
        learnLevel: 23,
        requiredClass: ['warrior'],
        manaCost: 20,
        type: 'Physical',
        category: 'Damage',
        effect: {
            damageMultiplier: 2.2,
        },
    },
    {
        id: 'warrior_enrage',
        name: 'Enrage',
        description: 'Fly into a fury, sacrificing defense for raw power.',
        icon: '😤',
        learnLevel: 28,
        requiredClass: ['warrior'],
        manaCost: 22,
        type: 'Physical',
        category: 'Buff',
        effect: {
            statChanges: {
                target: 'self',
                atk: 2,
                def: -1,
            },
        },
    },
    {
        id: 'warrior_reckless_strike',
        name: 'Reckless Strike',
        description: 'A devastating blow that can stagger foes.',
        icon: '💥',
        learnLevel: 33,
        requiredClass: ['warrior'],
        manaCost: 28,
        type: 'Physical',
        category: 'HYBRID',
        effect: {
            damageMultiplier: 2.5,
            statusEffect: {
                type: 'stun',
                chance: 40,
            },
        },
    },
    {
        id: 'warrior_bloodthirst',
        name: 'Bloodthirst',
        description: 'A savage strike that drains the life from your enemy.',
        icon: '🩸',
        learnLevel: 38,
        requiredClass: ['warrior'],
        manaCost: 32,
        usageLimit: 'once-per-battle',
        type: 'Physical',
        category: 'HYBRID',
        effect: {
            damageMultiplier: 3.0,
            lifesteal: 20,
        },
    },

    // ==================
    // PALADIN SKILLS
    // ==================
    {
        id: 'paladin_holy_strike',
        name: 'Holy Strike',
        description: 'Strike with radiant holy energy.',
        icon: '✨',
        learnLevel: 5,
        requiredClass: ['paladin'],
        manaCost: 16,
        type: 'Light',
        category: 'Damage',
        effect: {
            damageMultiplier: 1.5,
        },
    },
    {
        id: 'paladin_heal',
        name: 'Heal',
        description: 'Channel divine power to mend wounds.',
        icon: '💚',
        learnLevel: 8,
        requiredClass: ['paladin'],
        manaCost: 20,
        type: 'Light',
        category: 'Heal',
        effect: {
            healPercent: 40,
        },
    },
    {
        id: 'paladin_shield_of_faith',
        name: 'Shield of Faith',
        description: 'Invoke divine protection.',
        icon: '🛡️',
        learnLevel: 13,
        requiredClass: ['paladin'],
        manaCost: 20,
        type: 'Light',
        category: 'Buff',
        effect: {
            statChanges: {
                target: 'self',
                def: 2,
            },
        },
    },
    {
        id: 'paladin_divine_cleanse',
        name: 'Divine Cleanse',
        description: 'Purge all ailments with holy light.',
        icon: '🌟',
        learnLevel: 18,
        requiredClass: ['paladin'],
        manaCost: 24,
        type: 'Light',
        category: 'Cure',
        effect: {
            cures: ['burn', 'poison', 'bleed', 'paralyze', 'sleep', 'freeze', 'confusion', 'curse'],
        },
    },
    {
        id: 'paladin_smite',
        name: 'Smite',
        description: 'A devastating holy strike especially potent against darkness.',
        icon: '⚡',
        learnLevel: 23,
        requiredClass: ['paladin'],
        manaCost: 28,
        type: 'Light',
        category: 'HYBRID',
        effect: {
            damageMultiplier: 2.0,  // 2.5x vs Dark (handled in service)
            statusEffect: {
                type: 'burn',
                chance: 30,
            },
        },
    },
    {
        id: 'paladin_blessing',
        name: 'Blessing',
        description: 'Invoke a holy blessing that strengthens body and spirit.',
        icon: '🙏',
        learnLevel: 28,
        requiredClass: ['paladin'],
        manaCost: 24,
        type: 'Light',
        category: 'Buff',
        effect: {
            statChanges: {
                target: 'self',
                atk: 1,
                def: 1,
            },
        },
    },
    {
        id: 'paladin_judgment',
        name: 'Judgment',
        description: 'Call down divine wrath upon your enemy.',
        icon: '⚖️',
        learnLevel: 33,
        requiredClass: ['paladin'],
        manaCost: 32,
        type: 'Light',
        category: 'Damage',
        effect: {
            damageMultiplier: 2.8,
        },
    },
    {
        id: 'paladin_divine_shield',
        name: 'Divine Shield',
        description: 'Surround yourself with impenetrable holy light.',
        icon: '🔰',
        learnLevel: 38,
        requiredClass: ['paladin'],
        manaCost: 36,
        usageLimit: 'once-per-battle',
        type: 'Light',
        category: 'HYBRID',
        effect: {
            statChanges: {
                target: 'self',
                def: 2,
            },
            healPercent: 30,
        },
    },

    // ==================
    // TECHNOMANCER SKILLS
    // ==================
    // ... (Continue with all remaining classes)
    // See Skills planning.md for full definitions

    // ==================
    // UNIVERSAL SKILLS
    // ==================
    // ==================
    // UNIVERSAL SKILL (ALL CLASSES)
    // ==================
    {
        id: 'universal_meditate',
        name: 'Meditate',
        description: 'Clear your mind and restore your magical energy.',
        icon: '🧘',
        learnLevel: 1,
        requiredClass: ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'],
        manaCost: 0,  // FREE to use
        usageLimit: 'unlimited',  // Can use every turn if needed
        type: 'Arcane',
        category: 'Heal',
        effect: {
            // Special mechanic: Restores mana instead of HP
            // Implemented as custom logic in SkillService.executeSkill()
            restoreManaPercent: 33,  // 33% of max mana
        },
    },
];

/**
 * Get skill by ID
 */
export function getSkillById(id: string): Skill | undefined {
    return SKILL_DEFINITIONS.find(s => s.id === id);
}

/**
 * Get all skills for a class
 */
export function getSkillsForClass(className: string): Skill[] {
    return SKILL_DEFINITIONS.filter(s => s.requiredClass.includes(className));
}
```

**NOTE:** This file will contain all 56 skills. See `docs/development/Skills planning.md` for complete skill definitions to transcribe.

---

### 2. Monster Skill Pools

**File:** `src/data/monsterSkills.ts` (NEW FILE)

**Purpose:** Define skill pools for each monster template

```typescript
import { MonsterSkill } from '../models/Monster';

/**
 * Monster skill pools
 *
 * Each monster template has 3-4 possible skills.
 * Monster instances randomly pick 2-4 based on tier.
 */

// ==================
// BEASTS
// ==================

export const WOLF_SKILLS: MonsterSkill[] = [
    {
        skillId: 'wolf_bite',
        name: 'Bite',
        description: 'A quick, vicious bite.',
        type: 'Physical',
        category: 'damage',
        manaCost: 0,
        damageMultiplier: 1.3,
        priority: 100,  // Basic attack (high priority)
        useCondition: 'always',
    },
    {
        skillId: 'wolf_howl',
        name: 'Howl',
        description: 'A chilling howl that weakens enemies.',
        type: 'Physical',
        category: 'debuff',
        manaCost: 0,
        statChanges: {
            target: 'enemy',
            atk: -1,
        },
        priority: 40,
        useCondition: 'always',
    },
    {
        skillId: 'wolf_pack_tactics',
        name: 'Pack Tactics',
        description: 'Call upon the pack\'s strength.',
        type: 'Physical',
        category: 'buff',
        manaCost: 0,
        statChanges: {
            target: 'self',
            atk: 1,
        },
        priority: 30,
        useCondition: 'once_per_battle',
    },
];

export const BEAR_SKILLS: MonsterSkill[] = [
    {
        skillId: 'bear_claw',
        name: 'Claw Swipe',
        description: 'A powerful swipe with massive claws.',
        type: 'Physical',
        category: 'damage',
        manaCost: 0,
        damageMultiplier: 1.5,
        priority: 100,
    },
    {
        skillId: 'bear_roar',
        name: 'Roar',
        description: 'A deafening roar that intimidates foes.',
        type: 'Physical',
        category: 'debuff',
        manaCost: 0,
        statChanges: {
            target: 'enemy',
            def: -1,
        },
        priority: 35,
    },
    {
        skillId: 'bear_maul',
        name: 'Maul',
        description: 'A crushing attack with a chance to stun.',
        type: 'Physical',
        category: 'damage',
        manaCost: 0,
        damageMultiplier: 2.0,
        statusEffect: {
            type: 'stun',
            chance: 25,
        },
        priority: 60,
        useCondition: 'high_hp',
    },
];

// ... Continue for all 19 monster templates

// ==================
// UNDEAD
// ==================

export const SKELETON_SKILLS: MonsterSkill[] = [
    {
        skillId: 'skeleton_bone_strike',
        name: 'Bone Strike',
        description: 'Strike with a brittle bone weapon.',
        type: 'Dark',
        category: 'damage',
        manaCost: 0,
        damageMultiplier: 1.4,
        priority: 100,
    },
    {
        skillId: 'skeleton_rattle',
        name: 'Bone Rattle',
        description: 'Rattling bones confuse the enemy.',
        type: 'Dark',
        category: 'status',
        manaCost: 0,
        statusEffect: {
            type: 'confusion',
            chance: 40,
        },
        priority: 50,
    },
    // ...
];

// ... (Define for all templates)

/**
 * Skill pool registry
 */
export const MONSTER_SKILL_POOLS: Record<string, MonsterSkill[]> = {
    'wolf': WOLF_SKILLS,
    'bear': BEAR_SKILLS,
    'giant-rat': GIANT_RAT_SKILLS,
    'skeleton': SKELETON_SKILLS,
    'zombie': ZOMBIE_SKILLS,
    'ghost': GHOST_SKILLS,
    // ... all 19 templates
};
```

**NOTE:** This requires defining 2-4 skills for each of the 19 monster templates (38-76 skills total).

---

## Testing & Balance

### 1. Battle Simulation Framework

**File:** `src/testing/battleSimulator.ts` (NEW FILE)

**Purpose:** Run automated battles to test balance

```typescript
/**
 * Battle Simulator
 *
 * Runs automated battles to test:
 * - Win rate at different levels
 * - Average battle length
 * - Skill usage frequency
 * - Status effect impact
 * - Type effectiveness impact
 */

import { BattleService } from '../services/BattleService';
import { Character } from '../models/Character';
import { Monster } from '../models/Monster';

export interface SimulationConfig {
    characterLevel: number;
    characterClass: string;
    monsterTemplateId: string;
    monsterTier: 'overworld' | 'elite' | 'boss';
    skillLoadout: string[];  // Skill IDs to equip
    iterations: number;      // How many battles to run
}

export interface SimulationResult {
    wins: number;
    losses: number;
    winRate: number;
    avgTurnsToVictory: number;
    avgTurnsToDefeat: number;
    avgHPRemaining: number;
    avgManaRemaining: number;
    skillUsageStats: Record<string, number>;
    statusInflicted: Record<string, number>;
    statusReceived: Record<string, number>;
}

export class BattleSimulator {
    async runSimulation(config: SimulationConfig): Promise<SimulationResult> {
        const results: SimulationResult = {
            wins: 0,
            losses: 0,
            winRate: 0,
            avgTurnsToVictory: 0,
            avgTurnsToDefeat: 0,
            avgHPRemaining: 0,
            avgManaRemaining: 0,
            skillUsageStats: {},
            statusInflicted: {},
            statusReceived: {},
        };

        for (let i = 0; i < config.iterations; i++) {
            const battleResult = await this.runSingleBattle(config);

            if (battleResult.victory) {
                results.wins++;
                results.avgTurnsToVictory += battleResult.turns;
                results.avgHPRemaining += battleResult.playerHPRemaining;
                results.avgManaRemaining += battleResult.playerManaRemaining;
            } else {
                results.losses++;
                results.avgTurnsToDefeat += battleResult.turns;
            }

            // Track skill usage
            Object.entries(battleResult.skillsUsed).forEach(([skillId, count]) => {
                results.skillUsageStats[skillId] = (results.skillUsageStats[skillId] || 0) + count;
            });

            // Track status effects
            // ...
        }

        // Calculate averages
        results.winRate = results.wins / config.iterations;
        results.avgTurnsToVictory /= results.wins || 1;
        results.avgTurnsToDefeat /= results.losses || 1;
        results.avgHPRemaining /= results.wins || 1;
        results.avgManaRemaining /= results.wins || 1;

        return results;
    }

    private async runSingleBattle(config: SimulationConfig): Promise<BattleResult> {
        // Create character
        const character = this.createTestCharacter(config);

        // Create monster
        const monster = this.createTestMonster(config);

        // Run battle with AI for both sides
        const battleService = new BattleService(/* ... */);
        // ... battle logic

        return {
            victory: false,  // Placeholder
            turns: 0,
            playerHPRemaining: 0,
            playerManaRemaining: 0,
            skillsUsed: {},
        };
    }
}

interface BattleResult {
    victory: boolean;
    turns: number;
    playerHPRemaining: number;
    playerManaRemaining: number;
    skillsUsed: Record<string, number>;
}
```

### 2. Balance Testing Script

**File:** `scripts/testBalance.ts` (NEW FILE)

**Usage:** `npm run test:balance`

```typescript
import { BattleSimulator } from '../src/testing/battleSimulator';

async function main() {
    const simulator = new BattleSimulator();

    console.log('=== Battle Balance Testing ===\n');

    // Test all classes at level 10 vs overworld monsters
    const classes = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
    const monsters = ['wolf', 'goblin', 'skeleton'];

    for (const className of classes) {
        console.log(`\n## ${className.toUpperCase()} (Level 10)`);

        for (const monsterId of monsters) {
            const result = await simulator.runSimulation({
                characterLevel: 10,
                characterClass: className,
                monsterTemplateId: monsterId,
                monsterTier: 'overworld',
                skillLoadout: [],  // Use default loadout
                iterations: 100,
            });

            console.log(`\n  vs ${monsterId}:`);
            console.log(`    Win Rate: ${(result.winRate * 100).toFixed(1)}%`);
            console.log(`    Avg Turns (Victory): ${result.avgTurnsToVictory.toFixed(1)}`);
            console.log(`    Avg HP Remaining: ${result.avgHPRemaining.toFixed(0)}`);
            console.log(`    Avg Mana Remaining: ${result.avgManaRemaining.toFixed(0)}`);

            // Flag if win rate is outside 45-75% range
            if (result.winRate < 0.45) {
                console.log(`    ⚠️  WARNING: Win rate too low!`);
            } else if (result.winRate > 0.75) {
                console.log(`    ⚠️  WARNING: Win rate too high!`);
            }
        }
    }

    console.log('\n=== Testing Complete ===');
}

main();
```

---

## Implementation Phases

Ordered by dependencies. Each phase builds on the previous.

### Phase 1: Foundation (Data Models & Migrations)

**Goal:** Add new fields to Character/Monster, create Skill model

**Tasks:**
1. ✅ Create `src/models/Skill.ts`
2. ✅ Add `skills` field to Character model
3. ✅ Add `type` field to CharacterClass definitions
4. ✅ Add `skills` field to Monster model
5. ✅ Add `skillPool` to MonsterTemplate
6. ✅ Create migration script `001-add-skills-system.ts`
7. ✅ Test migration on sample character data
8. ✅ Document schema changes

**Files Changed:**
- `src/models/Character.ts`
- `src/models/Monster.ts`
- `src/models/Skill.ts` (NEW)
- `src/migrations/001-add-skills-system.ts` (NEW)

**Success Criteria:**
- Existing characters load without errors
- Migration adds `skills` field with correct defaults
- No data loss

---

### Phase 2: Resource Management Updates

**Goal:** Update Long Rest and task completion to restore mana

**Tasks:**
1. ✅ Update Long Rest logic to restore mana
2. ✅ Add paid Long Rest option (100g + level×35)
3. ✅ Update task completion to grant 7% HP/Mana
4. ✅ Update Long Rest UI to show mana restoration
5. ✅ Test Long Rest cooldown + paid bypass

**Files Changed:**
- `src/services/CharacterService.ts` (or equivalent)
- `src/services/QuestActionsService.ts`
- UI components for Long Rest modal

**Success Criteria:**
- Long Rest restores both HP and Mana
- Paid Long Rest works when on cooldown
- Task completion grants 7% HP/Mana
- UI shows correct costs and cooldowns

---

### Phase 3: Core Combat Logic (Services)

**Goal:** Implement stage system, status effects, type effectiveness

**Tasks (ORDERED BY DEPENDENCY):**
1. ✅ Create `StatusEffectService.ts` **FIRST** (SkillService depends on this)
2. ✅ Update `CombatService.ts` with:
   - Stage multiplier calculation
   - Type effectiveness chart
   - Inherent resistance calculation
3. ✅ Create `SkillService.ts` (depends on CombatService for type chart)
4. ✅ Update `BattleService.ts` with:
   - Stage tracking and reset
   - Status effect ticking
   - Skill execution flow
5. ✅ **UPDATE Long Rest to clear status effects** (moved from Phase 2)
6. ✅ Write unit tests for stage/status logic

**Files Changed:**
- `src/services/StatusEffectService.ts` (NEW) - **Do this first!**
- `src/services/CombatService.ts`
- `src/services/SkillService.ts` (NEW) - **Do this after StatusEffect + Combat**
- `src/services/BattleService.ts`

**Why This Order:**
- Skills depend heavily on status effects (applying, checking, preventing)
- Can't properly test skills without working status system
- SkillService uses CombatService for type effectiveness (no duplication)

**Success Criteria:**
- Stages apply correctly (1.5^stage formula)
- Status effects tick at end of turn
- Type effectiveness calculates correctly
- Hard CC prevents self-cure

---

### Phase 4A: Meditate + Warrior Skills (End-to-End Testing)

**Goal:** Implement Meditate and one class's skills to validate full skill pipeline

**Why Start with Meditate + Warrior:**
- ✅ Meditate = Universal skill (all classes, level 1)
- ✅ Warrior = Familiar class, straightforward skills
- ✅ Tests complete flow: skill definition → unlock → equip → battle use
- ✅ Validates skill service, UI, and persistence
- ✅ One class gives real feedback before transcribing 56 more skills

**Tasks:**
1. [ ] Create `src/data/skills.ts` with `universal_meditate` skill
2. [ ] Add `restoreManaPercent` to `SkillEffect` interface
3. [ ] Add mana restoration logic to `SkillService.executeSkill()`
4. [ ] Test Meditate in battle (all 7 classes)
5. [ ] Add all 8 Warrior skills to `skills.ts`
6. [ ] Test Warrior skills end-to-end (damage, buffs, status)
7. [ ] Validate skill unlock on level-up

**Success Criteria:**
- ✅ Meditate restores 33% mana, costs 0, works every turn
- ✅ Warrior damage skills deal correct multiplied damage
- ✅ Warrior buffs apply stat stages correctly
- ✅ Warrior Bloodthirst (once-per-battle) works and resets

---

### Phase 4B: Remaining Class Skills

**Goal:** Transcribe remaining 48 skills (6 classes × 8 skills)

**Tasks:**
1. [ ] Add Paladin skills (8) to `skills.ts`
2. [ ] Add Technomancer skills (8) to `skills.ts`
3. [ ] Add Scholar skills (8) to `skills.ts`
4. [ ] Add Rogue skills (8) to `skills.ts`
5. [ ] Add Cleric skills (8) to `skills.ts`
6. [ ] Add Bard skills (8) to `skills.ts`
7. [ ] Test each class's ultimate (once-per-battle) skill
8. [ ] Verify type effectiveness for each class's skill types

**Files Changed:**
- `src/data/skills.ts`

**Success Criteria:**
- All 57 skills defined (56 class + Meditate)
- Each class has correct skills at correct levels
- Type chart interactions work for all elemental skills

---

### Phase 4C: Monster Skill Pools

**Goal:** Create skill pools for all 19 monster templates

**Tasks:**
1. [ ] Create `src/data/monsterSkills.ts`
2. [ ] Define 3-4 skills per monster template (19 templates)
3. [ ] Update `MonsterService.ts` to assign skills on creation
4. [ ] Update `MonsterService.ts` to scale skills for Elite/Boss tiers
5. [ ] Test monster skill assignment (variety, correct count)
6. [ ] Test monster AI skill selection (weighted random)

**Files Changed:**
- `src/data/monsterSkills.ts` (NEW)
- `src/services/MonsterService.ts`

**Success Criteria:**
- All 19 monster templates have skill pools
- Monsters spawn with 2 skills (normal), 3-4 skills (elite/boss)
- Elite/Boss get stronger skill versions (+10-20% damage)

---

### Phase 5: Battle UI Integration

**Goal:** Add skill selection to battle UI, show stages/status

**Tasks:**
1. ✅ Add "Skills" button to `BattleView.tsx`
2. ✅ Create `SkillPickerModal.tsx`
3. ✅ Add stage indicators to battle UI
4. ✅ Add status effect icons to battle UI
5. ✅ Add type effectiveness messages
6. ✅ Style all new UI elements

**Files Changed:**
- `src/components/BattleView.tsx`
- `src/components/SkillPickerModal.tsx` (NEW)
- `src/styles/combat.css`

**Success Criteria:**
- Skills button opens picker modal
- Modal shows equipped skills with mana costs
- Disabled skills show error reason
- Stages display as +2 ATK, -1 DEF badges
- Status icons appear on combatants
- "SUPER EFFECTIVE!" message shows on 2x hits

---

### Phase 6: Character Sheet Integration

**Goal:** Add skill management to character sheet

**Tasks:**
1. ✅ Add "Skills" tab to `CharacterSheet.tsx`
2. ✅ Create `SkillLoadoutModal.tsx`
3. ✅ Show unlocked skills with descriptions
4. ✅ Show next skill preview (unlock at level X)
5. ✅ Allow skill loadout editing (drag-drop or click)
6. ✅ Save loadout to character data

**Files Changed:**
- `src/components/CharacterSheet.tsx`
- `src/components/SkillLoadoutModal.tsx` (NEW)
- `src/styles/character.css`

**Success Criteria:**
- Skills tab shows all unlocked skills
- Loadout editor allows equipping up to 5 skills
- Changes save correctly
- Next skill preview accurate

---

### Phase 7: Skill Unlocking & Notifications

**Goal:** Auto-unlock skills on level up, notify user

**Tasks:**
1. ✅ Hook into level-up logic in `XPSystem.ts`
2. ✅ Call `SkillService.checkAndUnlockSkills()`
3. ✅ Show notification for new skills unlocked
4. ✅ Auto-equip first skill if < 4 equipped
5. ✅ Test level-up from 4→5, 12→13, 37→38

**Files Changed:**
- `src/services/XPSystem.ts`
- `src/services/SkillService.ts`

**Success Criteria:**
- Skills unlock at correct levels
- Notification shows skill name + level
- Auto-equip works for first 4 skills
- No skills missed on rapid level-ups

---

### Phase 8: Balance Testing & Tuning

**Goal:** Test combat balance with skills system

**Tasks:**
1. ✅ Create battle simulator framework
2. ✅ Run simulations for all classes vs all monster types
3. ✅ Identify balance issues (win rates, skill usage)
4. ✅ Tune skill mana costs and damage multipliers
5. ✅ Tune monster skill power and frequency
6. ✅ Re-run simulations until balanced

**Files Changed:**
- `src/testing/battleSimulator.ts` (NEW)
- `scripts/testBalance.ts` (NEW)
- `src/data/skills.ts` (tuning)
- `src/data/monsterSkills.ts` (tuning)

**Success Criteria:**
- All classes have 45-75% win rate at each level
- No skill dominates (>80% usage)
- Average battle length: 3-7 turns
- Mana management feels strategic

---

### Phase 9: Polish & Edge Cases

**Goal:** Handle edge cases, add polish

**Tasks:**
1. ✅ Test status persistence between battles
2. ✅ Test once-per-battle skill reset on retreat
3. ✅ Test stage cap enforcement (±6)
4. ✅ Test hard CC self-cure prevention
5. ✅ Add skill animations/effects
6. ✅ Add sound effects (optional)
7. ✅ Update tutorial/help text
8. ✅ QA all edge cases

**Files Changed:**
- Various (bug fixes)
- `src/styles/animations.css`
- Help documentation

**Success Criteria:**
- No crashes or soft-locks
- All edge cases handled gracefully
- UI feels polished
- Tutorial updated

---

### Phase 10: Deployment & Migration

**Goal:** Deploy to production, migrate existing players

**Tasks:**
1. ✅ Run migration on Brad's production character
2. ✅ Deploy to production vault
3. ✅ Test in production environment
4. ✅ Monitor for issues
5. ✅ Create backup of pre-migration data
6. ✅ Document rollback plan

**Files Changed:**
- None (deployment only)

**Success Criteria:**
- Production character migrates successfully
- Skills unlock and equip correctly
- Battles work in production
- No data loss
- Performance acceptable

---

## Progress Tracking

Use this checklist to track implementation progress across sessions.

### Phase 1: Foundation ❌

- [ ] Create Skill.ts model
- [ ] Update Character.ts with skills field
- [ ] Update Character.ts with persistentStatusEffects field
- [ ] Update CharacterClass (CLASS_INFO) with type field
- [ ] Update Monster.ts with skills field + battleState
- [ ] Update MonsterTemplate with skillPool
- [ ] Expand BattleMonster interface (stages, status, skills)
- [ ] Write migration script (v4 → v5)
- [ ] Test migration script
- [ ] Document schema changes

### Phase 2: Resource Management ❌

- [ ] Update Long Rest to restore mana
- [ ] Add paid Long Rest option
- [ ] Update task completion HP/Mana regen
- [ ] Update Long Rest UI
- [ ] Test cooldown + paid bypass

### Phase 3: Core Combat Logic ❌

- [ ] Create StatusEffectService.ts **FIRST**
- [ ] Update CombatService with stage multipliers
- [ ] Update CombatService with type chart
- [ ] Integrate ATK/DEF stages into damage formula
- [ ] Create SkillService.ts (thin orchestrator)
- [ ] Update BattleService with skill execution
- [ ] Update BattleService with status ticking
- [ ] Update BattleService with once-per-battle reset on retreat
- [ ] Update Long Rest to clear persistentStatusEffects
- [ ] Write unit tests

### Phase 4A: Meditate + Warrior Skills ❌

- [ ] Create skills.ts with universal_meditate
- [ ] Add restoreManaPercent to SkillEffect interface
- [ ] Implement mana restore in SkillService
- [ ] Test Meditate in battle (all classes)
- [ ] Add all 8 Warrior skills
- [ ] Test Warrior skills end-to-end
- [ ] Validate skill unlock on level-up

### Phase 4B: Remaining Class Skills ❌

- [ ] Add Paladin skills (8)
- [ ] Add Technomancer skills (8)
- [ ] Add Scholar skills (8)
- [ ] Add Rogue skills (8)
- [ ] Add Cleric skills (8)
- [ ] Add Bard skills (8)
- [ ] Test each class's ultimate skill

### Phase 4C: Monster Skill Pools ❌

- [ ] Create monsterSkills.ts
- [ ] Define skills for 19 monster templates
- [ ] Update MonsterService skill assignment
- [ ] Update MonsterService for Elite/Boss scaling
- [ ] Test monster skill spawning

### Phase 5: Battle UI ❌

- [ ] Add "Skills" button to BattleView action bar
- [ ] Create SkillPickerModal.tsx (React component)
  - [ ] Show only equipped skills (max 5)
  - [ ] Show mana cost per skill
  - [ ] Gray out skills with insufficient mana
  - [ ] Gray out once-per-battle skills already used
  - [ ] "Stunned!" overlay when blocked by hard CC
  - [ ] Cancel button to return to action selection
- [ ] On skill select → call BattleService.executePlayerSkill()
- [ ] Add stage indicators (ATK/DEF/SPD arrows) to player/monster panels
- [ ] Add status effect icons row under HP bars
- [ ] Add type effectiveness messages to combat log ("It's super effective!")
- [ ] Style skill buttons and new status indicators



### Phase 6: Character Sheet / Skills Management ❌

- [ ] Add "Skills" button to CharacterSheet component
- [ ] Create SkillLoadoutModal.ts (Obsidian Modal)
  - [ ] Show equipped skills section (5 slots)
  - [ ] Show all class skills (8 total)
  - [ ] Show universal skills (Meditate)
  - [ ] Locked skills with "Unlocks at Level X" label
  - [ ] Toggle equipped/unequipped on click
  - [ ] [Auto-Fill] button - fills with highest-level skills
  - [ ] [Clear All] button
  - [ ] Skill tooltips with full details
- [ ] Add CSS for skill card states (equipped, available, locked)
- [ ] Add command: "Quest Board: Manage Skills"
- [ ] Save loadout to character.skills.equipped
- [ ] Test equipping/unequipping flow
- [ ] Test locked skill display



### Phase 7: Skill Unlocking ❌

- [ ] Hook into level-up
- [ ] Auto-unlock skills
- [ ] Show notification
- [ ] Auto-equip logic
- [ ] Test level-up scenarios

### Phase 8: Balance Testing ❌

- [ ] Create battle simulator
- [ ] Run initial simulations
- [ ] Identify balance issues
- [ ] Tune skill values
- [ ] Tune monster skills
- [ ] Re-run simulations

### Phase 9: Polish ❌

- [ ] Test status persistence
- [ ] Test once-per-battle reset
- [ ] Test stage caps
- [ ] Test hard CC prevention
- [ ] Add animations
- [ ] Add sound (optional)
- [ ] Update tutorial
- [ ] QA edge cases

### Phase 10: Deployment ❌

- [ ] Backup production data
- [ ] Run migration on prod
- [ ] Deploy to production
- [ ] Test in production
- [ ] Monitor for issues
- [ ] Document rollback plan

---

## Notes & Decisions Log

**Use this section to track important decisions made during implementation.**

### 2026-01-29 - Initial Planning

- Decided on Pokemon Gen 1 design philosophy
- 11-type system finalized
- Stage system: ±6, 50% per stage
- Status persistence confirmed
- Once-per-battle mechanics chosen over cooldowns
- Mana regen: Long Rest only + 7% per task

### 2026-01-29 - Design Review & Critical Fixes

**Received comprehensive design critique. Score: 95% perfect. Key issues addressed:**

**Security & Data Integrity:**
1. ✅ Added sanity checks to `SkillService.executeSkill()` (defense in depth)
   - Validate mana cost, usage limits, hard CC status
   - Prevents bypassing `canUseSkill()` checks
2. ✅ Long Rest UI confirmation required before paid rest

**Architecture & Scalability:**
3. ✅ Fixed array mutation in `StatusEffectService.tickStatusEffects()`
   - Initialize durations FIRST (separate pass)
   - Then tick/remove (prevents index skipping)
4. ✅ Removed type chart duplication
   - `SkillService` now calls `CombatService.getTypeEffectiveness()`
   - Shared constant, no TODO placeholders

**Game Logic - CRITICAL DECISION:**
5. ✅ **Speed Mechanic Clarified:** Pokemon Gen 1 style (ORDER, not FREQUENCY)
   - Speed determines WHO GOES FIRST each round
   - NO multiple attacks per round (that's FFX CTB, not Gen 1)
   - Each round = 1 player action + 1 monster action
   - Speed stages affect priority, not action count
   - Status effects tick once per round (simpler implementation)

**Game Logic - Edge Cases:**
6. ✅ Wake from sleep: Only direct attack damage wakes, NOT DoT
   - Skill damage → wakes from sleep
   - Burn/Poison/Bleed damage → does NOT wake
7. ✅ Status stacking: Same status replaces (refreshes duration) - documented

**Implementation Order:**
8. ✅ Swapped Phase 3 order: StatusEffectService BEFORE SkillService
   - Skills depend heavily on status system
   - Can't test skills without working status effects

**Rationale for Speed = Order:**
- Simpler implementation (no ATB gauge, no action points)
- Pokemon-accurate (Gen 1 = priority, not frequency)
- Cleaner turn tracking (1 round = 2 actions total)
- Status effects tick cleanly (once per round)
- Can add frequency mechanics later if desired (V2 feature)

### [Date] - [Decision/Change]

- [Description]

---

## Open Questions

**Track unresolved questions here. Answer them before implementing related phases.**

1. ❓ **Crits ignore DEF stages** - Need to verify current crit system behavior
2. ✅ **Speed turn order** - RESOLVED: Pokemon Gen 1 style (order only, no multiple attacks)
3. ✅ **Meditate mana restore** - RESOLVED: Exactly 33% max mana, no scaling (simplicity)

---

## Dependencies Graph

```
Phase 1 (Foundation)
  ↓
Phase 2 (Resource Mgmt) ← Independent
  ↓
Phase 3 (Combat Logic) ← Depends on Phase 1
  ↓
Phase 4 (Data Creation) ← Depends on Phase 1
  ↓
Phase 5 (Battle UI) ← Depends on Phase 3, 4
  ↓
Phase 6 (Character Sheet) ← Depends on Phase 4
  ↓
Phase 7 (Unlocking) ← Depends on Phase 4, 6
  ↓
Phase 8 (Balance) ← Depends on Phase 3, 4, 5
  ↓
Phase 9 (Polish) ← Depends on all previous
  ↓
Phase 10 (Deploy) ← Depends on all previous
```

**Parallelizable:**
- Phase 2 can be done independently
- Phase 5 and Phase 6 can be done in parallel (both depend on Phase 4)

---

## Appendix: Quick Reference

### Type Chart (Quick Lookup)

```
Fire  → Nature, Ice
Water → Fire, Earth
Ice   → Nature, Earth
Lightning → Water, Physical
Earth → Fire, Lightning, Poison
Nature → Water, Earth
Poison → Nature, Physical
Light → Dark
Dark  → Light, Physical
Physical → Arcane
Arcane → Physical
```

### Stage Multipliers

```
+6: 11.39x
+5: 7.59x
+4: 5.06x
+3: 3.38x
+2: 2.25x
+1: 1.5x
 0: 1.0x
-1: 0.67x
-2: 0.44x
-3: 0.30x
-4: 0.20x
-5: 0.13x
-6: 0.09x
```

### Status Effect DoT Rates

```
Burn:   6% max HP per turn
Poison: 8% max HP per turn
Bleed:  5% max HP per turn
Curse: 10% max HP per turn (blocks healing)
```

---

**Last Updated:** 2026-01-29
**Version:** 1.2 (Pre-Implementation Review Updates)

**Status:** ✅ Ready for Implementation
- All design critiques addressed (95% → 100%)
- Security checks added
- Architecture issues fixed
- Speed mechanic clarified (Pokemon Gen 1 style)
- Implementation order optimized
- **NEW:** Already-completed UI scaffolding documented
- **NEW:** Testing strategy confirmed (unit tests alongside services)
- **NEW:** Implementation approach confirmed (character skills first)

