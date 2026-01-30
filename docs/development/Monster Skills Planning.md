# Quest Board - Monster Skills Planning

> ✅ **IMPLEMENTED** - 2026-01-30  
> See `src/data/monsterSkills.ts` for final implementation

**Comprehensive skill pools for all 19 monster templates.**

Design Philosophy: Pokemon Gen 1 style - simple, focused, one job per skill (mostly).

---

## Overview

**Monsters per Template:** 3-4 skills available, randomly picks 2-4 based on tier
**Skill Distribution:**
- General Physical Pool (18 skills) - Shared by all "none" affinity monsters
- Affinity-Specific Pools (3-5 skills each) - For dark/earth/fire/arcane monsters
- Category-Unique Skills - Special flavor moves for specific monster types

---

## General Physical Skills (18 Total)

**Shared pool for all monsters with "none" affinity (Beasts, Goblins, Trolls)**

### Basic Attacks (5)

| Skill ID | Name | Type | Damage | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| **gen_bite** | Bite | Physical | 1.3x | A quick, vicious bite. | 100 |
| **gen_claw** | Claw | Physical | 1.4x | Slash with sharp claws. | 100 |
| **gen_slam** | Slam | Physical | 1.5x | A powerful full-body slam. | 90 |
| **gen_strike** | Strike | Physical | 1.2x | A basic melee attack. | 100 |
| **gen_charge** | Charge | Physical | 1.8x | Rush forward with force. | 70 |

### Debuff Attacks (4)

| Skill ID | Name | Type | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| **gen_weaken** | Intimidate | Physical | Enemy ATK -1 stage | A fearsome display that weakens foes. | 50 |
| **gen_armor_break** | Armor Break | Physical | Enemy DEF -1 stage | Strike weak points to lower defense. | 50 |
| **gen_slow** | Hamstring | Physical | Enemy Speed -1 stage | Attack legs to slow movement. | 40 |
| **gen_snarl** | Snarl | Physical | Enemy ATK -1 stage | A threatening growl. | 50 |

### Buff Skills (3)

| Skill ID | Name | Type | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- |
| **gen_enrage** | Enrage | Buff | Self ATK +1 stage | Fly into a rage. | 40 |
| **gen_harden** | Harden | Buff | Self DEF +1 stage | Tense muscles for defense. | 40 |
| **gen_focus** | Focus | Buff | Self ATK +1 stage | Concentrate on the target. | 35 |

### Status/Hybrid Attacks (6)

| Skill ID | Name | Type | Damage | Status Effect | Priority | Condition |
| --- | --- | --- | --- | --- | --- | --- |
| **gen_rend** | Rend | HYBRID | 1.4x Physical | 40% Bleed | 70 | always |
| **gen_bash** | Bash | HYBRID | 1.6x Physical | 30% Stun | 65 | always |
| **gen_maul** | Maul | HYBRID | 2.0x Physical | 25% Stun | 60 | always |
| **gen_poison_fang** | Poison Fang | HYBRID | 1.2x Physical | 50% Poison | 60 | always |
| **gen_crushing_blow** | Crushing Blow | HYBRID | 1.8x Physical | Enemy DEF -1 stage | 55 | always |
| **gen_frenzy** | Frenzy | HYBRID | 1.5x Physical | Self ATK +1 stage after | 80 | low_hp |
| **gen_howl** | Howl | Buff | - | Dispel enemy buffs | 45 | always |

---

## Dark Skills (6 Total)

**For Undead (Skeleton, Zombie, Ghost) and Night Elves (Shadow Elf, Dark Ranger)**

| Skill ID | Name | Type | Damage | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **dark_shadow_strike** | Shadow Strike | Dark | 1.6x | - | Attack from the shadows. | 90 |
| **dark_life_drain** | Life Drain | HYBRID | 1.4x Dark | Lifesteal 30% | Drain life force from enemy. | 70 |
| **dark_curse** | Curse | Status | - | 100% Curse | Inflict a withering curse. | 50 |
| **dark_fear** | Fear | Debuff | - | Enemy ATK -2 stages | Inspire supernatural dread. | 45 |
| **dark_necrotic_touch** | Necrotic Touch | HYBRID | 1.3x Dark | 40% Curse | Touch infused with death magic. | 65 |
| **dark_shadow_bolt** | Shadow Bolt | Dark | 2.0x | - | Hurl a bolt of dark energy. | 75 |

---

## Earth Skills (5 Total)

**For Dwarves (Rogue Dwarf, Berserker)**

| Skill ID | Name | Type | Damage | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **earth_stone_throw** | Stone Throw | Earth | 1.5x | - | Hurl a heavy stone. | 85 |
| **earth_quake** | Tremor | HYBRID | 1.3x Earth | Enemy Speed -1 stage | Shake the ground beneath foes. | 60 |
| **earth_rock_shield** | Rock Shield | Buff | - | Self DEF +2 stages | Coat skin in protective stone. | 50 |
| **earth_boulder_slam** | Boulder Slam | Earth | 2.2x | - | Crush with a massive boulder. | 70 |
| **earth_seismic_strike** | Seismic Strike | HYBRID | 1.8x Earth | 30% Stun | Strike with earth-shaking force. | 65 |

---

## Fire Skills (5 Total)

**For Dragonkin (Drake, Wyvern)**

| Skill ID | Name | Type | Damage | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **fire_flame_burst** | Flame Burst | Fire | 1.6x | - | Breathe a gout of flame. | 90 |
| **fire_breath** | Fire Breath | HYBRID | 1.8x Fire | 40% Burn | Unleash a torrent of fire. | 80 |
| **fire_inferno** | Inferno | HYBRID | 2.0x Fire | 50% Burn | Create a blazing inferno. | 70 |
| **fire_heat_wave** | Heat Wave | Debuff | - | Enemy DEF -1 stage | Intense heat weakens armor. | 50 |
| **fire_burning_claw** | Burning Claw | HYBRID | 1.4x Fire | 35% Burn | Claws wreathed in flame. | 75 |

---

## Arcane Skills (6 Total)

**For Aberrations (Mimic, Eye Beast)**

| Skill ID | Name | Type | Damage | Effect | Description | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| **arcane_blast** | Arcane Blast | Arcane | 1.7x | - | Pure magical energy. | 85 |
| **arcane_mana_burn** | Mana Burn | HYBRID | 1.2x Arcane | Drain 20% enemy mana | Disrupt enemy's magic. | 70 |
| **arcane_mind_spike** | Mind Spike | HYBRID | 1.5x Arcane | 40% Confusion | Psychic assault. | 75 |
| **arcane_dispel** | Dispel | Utility | - | Remove all enemy buffs | Unravel magical effects. | 60 |
| **arcane_reality_warp** | Reality Warp | HYBRID | 1.9x Arcane | 30% Confusion | Twist reality itself. | 65 |
| **arcane_nullify** | Nullify | Utility | - | Remove all enemy buffs | Cancel all magical enhancements. | 55 |

---

## Monster Skill Pools

**Each monster template has 3-4 skills to choose from. Monster instances randomly pick 2-4 based on tier.**

### Beasts

**Wolf (none):**
```typescript
skillPool: [
    'gen_bite',           // Basic attack (weight 100)
    'gen_weaken',         // Intimidate (weight 50)
    'gen_rend',          // Bleed attack (weight 70)
    'gen_frenzy',        // Self-buff attack (weight 80, low_hp)
    'gen_howl',          // Dispel enemy buffs (weight 45)
]
```

**Bear (none):**
```typescript
skillPool: [
    'gen_claw',          // Basic attack (priority 100)
    'gen_maul',          // Stun attack (priority 60)
    'gen_enrage',        // ATK buff (priority 40)
    'gen_slam',          // Heavy attack (priority 90)
]
```

**Giant Rat (none):**
```typescript
skillPool: [
    'gen_bite',          // Basic attack (priority 100)
    'gen_poison_fang',   // Poison attack (priority 60)
    'gen_charge',        // Rush attack (priority 70)
]
```

---

### Undead

**Skeleton (dark):**
```typescript
skillPool: [
    'dark_shadow_strike',    // Basic dark attack (priority 90)
    'gen_strike',            // Fallback physical (priority 100)
    'dark_fear',             // Debuff (priority 45)
    'gen_bash',              // Stun option (priority 65)
]
```

**Zombie (dark):**
```typescript
skillPool: [
    'gen_slam',              // Physical tank attack (priority 90)
    'dark_necrotic_touch',   // Dark + curse (priority 65)
    'gen_harden',            // DEF buff (priority 40)
    'dark_life_drain',       // Lifesteal (priority 70)
]
```

**Ghost (dark):**
```typescript
skillPool: [
    'dark_shadow_bolt',      // High damage dark (priority 75)
    'dark_curse',            // Pure curse (priority 50)
    'dark_shadow_strike',    // Basic dark (priority 90)
    'dark_fear',             // ATK debuff (priority 45)
]
```

---

### Goblins

**Goblin (none):**
```typescript
skillPool: [
    'gen_strike',        // Basic attack (priority 100)
    'gen_armor_break',   // DEF debuff (priority 50)
    'gen_bash',          // Stun attack (priority 65)
]
```

**Hobgoblin (none):**
```typescript
skillPool: [
    'gen_slam',          // Heavy attack (priority 90)
    'gen_weaken',        // ATK debuff (priority 50)
    'gen_crushing_blow', // DEF debuff attack (priority 55)
    'gen_focus',         // ATK buff (priority 35)
]
```

**Bugbear (none):**
```typescript
skillPool: [
    'gen_maul',          // Heavy stun (priority 60)
    'gen_enrage',        // ATK buff (priority 40)
    'gen_rend',          // Bleed attack (priority 70)
    'gen_charge',        // Rush attack (priority 70)
]
```

---

### Trolls

**Cave Troll (none):**
```typescript
skillPool: [
    'gen_slam',          // Tank attack (priority 90)
    'gen_harden',        // DEF buff (priority 40)
    'gen_maul',          // Stun attack (priority 60)
    'gen_bash',          // Light stun (priority 65)
]
```

**River Troll (none):**
```typescript
skillPool: [
    'gen_claw',          // Basic attack (priority 100)
    'gen_slam',          // Heavy attack (priority 90)
    'gen_slow',          // Speed debuff (priority 40)
    'gen_rend',          // Bleed attack (priority 70)
]
```

---

### Night Elves

**Shadow Elf (dark):**
```typescript
skillPool: [
    'dark_shadow_strike',    // Basic dark (priority 90)
    'gen_charge',            // Speed attack (priority 70)
    'dark_shadow_bolt',      // Heavy dark (priority 75)
    'gen_slow',              // Debuff (priority 40)
]
```

**Dark Ranger (dark):**
```typescript
skillPool: [
    'dark_shadow_bolt',      // Ranged dark (priority 75)
    'dark_life_drain',       // Lifesteal (priority 70)
    'gen_armor_break',       // DEF debuff (priority 50)
    'dark_shadow_strike',    // Basic dark (priority 90)
]
```

---

### Dwarves

**Rogue Dwarf (earth):**
```typescript
skillPool: [
    'earth_stone_throw',     // Basic earth (priority 85)
    'gen_armor_break',       // DEF debuff (priority 50)
    'earth_quake',           // Speed debuff (priority 60)
    'gen_bash',              // Stun (priority 65)
]
```

**Berserker (earth):**
```typescript
skillPool: [
    'earth_boulder_slam',    // Heavy earth (priority 70)
    'gen_enrage',            // ATK buff (priority 40)
    'earth_seismic_strike',  // Stun earth (priority 65)
    'gen_maul',              // Stun physical (priority 60)
]
```

---

### Dragonkin

**Drake (fire):**
```typescript
skillPool: [
    'fire_flame_burst',      // Basic fire (priority 90)
    'fire_breath',           // Burn attack (priority 80)
    'gen_claw',              // Physical fallback (priority 100)
    'fire_heat_wave',        // DEF debuff (priority 50)
]
```

**Wyvern (fire):**
```typescript
skillPool: [
    'fire_breath',           // Primary fire (priority 80)
    'fire_inferno',          // Heavy burn (priority 70)
    'fire_burning_claw',     // Hybrid fire (priority 75)
    'gen_charge',            // Speed attack (priority 70)
]
```

---

### Aberrations

**Mimic (arcane):**
```typescript
skillPool: [
    'gen_bash',              // Surprise attack (weight 65)
    'arcane_blast',          // Arcane damage (weight 85)
    'gen_harden',            // DEF buff (shell) (weight 40)
    'arcane_dispel',         // Remove buffs (weight 60)
    'gen_howl',              // Dispel (weight 45)
]
```

**Eye Beast (arcane):**
```typescript
skillPool: [
    'arcane_mind_spike',     // Confusion attack (weight 75)
    'arcane_blast',          // Basic arcane (weight 85)
    'arcane_reality_warp',   // Heavy confusion (weight 65)
    'arcane_mana_burn',      // Mana drain (weight 70)
    'arcane_nullify',        // Remove buffs (weight 55)
]
```

---

## Implementation Details

### MonsterSkill Interface

> [!IMPORTANT]
> This interface is defined in `src/models/Skill.ts` and must match exactly.

```typescript
interface MonsterSkill {
    /** Skill ID (e.g., 'gen_bite') */
    id: string;

    /** Display name */
    name: string;

    /** Icon (emoji) */
    icon: string;

    /** Elemental type for damage/type chart */
    elementalType: ElementalType;

    /** Damage power (percentage of ATK, 100 = 1.0x) */
    power: number;

    /** Physical or magic damage */
    damageType: 'physical' | 'magic';

    /** Optional status effect to apply */
    statusEffect?: {
        type: StatusEffectType;
        chance: number;      // 0-100%
        duration: number;    // Turns (-1 = until cured)
        severity?: StatusSeverity;
    };

    /** Optional stage modification */
    stageEffect?: {
        stat: 'atk' | 'def' | 'speed';
        stages: number;     // -6 to +6
        target: 'self' | 'enemy';
    };

    /** AI weight for skill selection (higher = more likely) */
    weight: number;

    /** Optional: Use condition for AI (defaults to 'always') */
    useCondition?: 'always' | 'low_hp';
}
```

### Skill Selection Logic

**AI Turn Selection (Runtime):**
During battle, monster AI selects a skill using weighted random:
```
chance(skill) = skill.weight / sum(all_weights)
```

Condition-based modifiers:
- `useCondition: 'low_hp'` → skill weight ×3 when HP < 30%
- `useCondition: 'always'` → no modifier (default)

**Skill Pool Assignment (Monster Creation):**

**Normal Monsters (2 skills):**
1. Highest weight skill from pool (usually basic attack)
2. Random weighted selection from remaining

**Elite Monsters (3 skills):**
1. Highest weight skill
2. Second highest weight skill
3. Random from remaining

**Boss/Raid Monsters (4 skills):**
1. All 4 skills from pool

> [!NOTE]
> **Boss-specific ultimates** will be defined in a future phase after monster skills are implemented.
> Boss templates will have their own skill pools with once-per-battle abilities.

**Tier Scaling:**
- Elite: +10% damage on all skills
- Boss: +15% damage on all skills
- Raid: +20% damage on all skills

---

## Skill Definitions File Structure

```typescript
// src/data/monsterSkills.ts

export const GENERAL_PHYSICAL_SKILLS: Record<string, MonsterSkill> = {
    gen_bite: {
        skillId: 'gen_bite',
        name: 'Bite',
        description: 'A quick, vicious bite.',
        type: 'Physical',
        category: 'damage',
        damageMultiplier: 1.3,
        priority: 100,
        useCondition: 'always',
    },
    // ... rest of general skills
};

export const DARK_SKILLS: Record<string, MonsterSkill> = {
    dark_shadow_strike: {
        skillId: 'dark_shadow_strike',
        name: 'Shadow Strike',
        description: 'Attack from the shadows.',
        type: 'Dark',
        category: 'damage',
        damageMultiplier: 1.6,
        priority: 90,
        useCondition: 'always',
    },
    // ... rest of dark skills
};

// Similar for EARTH_SKILLS, FIRE_SKILLS, ARCANE_SKILLS

// Skill pool resolver
export function getSkillsForMonster(skillIds: string[]): MonsterSkill[] {
    const allSkills = {
        ...GENERAL_PHYSICAL_SKILLS,
        ...DARK_SKILLS,
        ...EARTH_SKILLS,
        ...FIRE_SKILLS,
        ...ARCANE_SKILLS,
    };

    return skillIds.map(id => allSkills[id]).filter(Boolean);
}
```

---

## Summary

**Total Skills:**
- General Physical: 19 skills (added gen_howl dispel)
- Dark: 6 skills
- Earth: 5 skills
- Fire: 5 skills
- Arcane: 6 skills (added arcane_nullify dispel)
- **Total: 41 monster skills**

**Coverage:**
- All 19 monster templates have 3-5 skills each
- Affinity monsters have 2+ skills matching their type
- "None" monsters use general physical pool
- Good variety: damage, buffs, debuffs, status effects, hybrids
- Dispel skills on multiple monsters for counterplay

**Next Steps:**
1. Implement in `src/data/monsterSkills.ts`
2. Update `MonsterService.ts` to assign skills from pools
3. Test skill selection (correct count, valid skills, tier scaling)
4. Balance testing (monster win rates, skill usage frequency)

**Future Phase: Boss Skills**
- Boss monsters will have dedicated skill pools
- Once-per-battle ultimates for memorable encounters
- Unique mechanics per dungeon boss

---

**Last Updated:** 2026-01-29
**Version:** 1.0 (Initial Planning)
