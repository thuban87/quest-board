# Fight System - Brainstorming Document

> **Status:** 🟡 Brainstorming  
> **Priority:** Phase 3B (After Gear System)  
> **Dependencies:** Gear & Loot System (for combat bonuses)

---

## Overview

Turn-based combat system where players fight monsters using their character's stats, gear, and (eventually) skills. Designed to feel like classic RPG battles with a Zelda/Final Fantasy vibe.

### Design Philosophy
- **Turn-based simplicity** - No real-time mechanics
- **Stats matter** - All 6 D&D stats contribute to combat
- **Old-school feel** - Gameboy-era aesthetics, simple actions
- **RNG with guardrails** - Luck matters, but skill floors exist
- **AI-optional** - Works with basic RNG, AI enhances it

---

## Combat Stats (Using Existing D&D Stats)

Current character stats and their combat roles:

| Stat | Combat Role |
|------|-------------|
| **Strength** | Physical attack power, heavy weapon effectiveness |
| **Intelligence** | Magic attack power, spell effectiveness (future) |
| **Wisdom** | Magic defense, healing effectiveness (future) |
| **Constitution** | Max HP, damage reduction, poison resistance |
| **Dexterity** | Hit chance, dodge chance, crit chance, turn order |
| **Charisma** | Run success chance, intimidation, persuasion (future) |

> [!NOTE]
> We're NOT adding Agility or Luck as new stats. 
> Dexterity covers speed/evasion, Wisdom can influence "lucky breaks" narratively.

---

## Derived Combat Stats

Calculated from base stats + gear:

```typescript
interface CombatStats {
  // Health
  maxHP: number;           // 50 + (Constitution * 5) + (Level * 10)
  currentHP: number;
  
  // Offense
  attackPower: number;     // Strength + WeaponPower
  magicPower: number;      // Intelligence + WeaponMagic (future)
  critChance: number;      // 5% + (Dexterity * 0.5%) + GearCritBonus
  critMultiplier: number;  // Default 1.5x, can be enhanced
  
  // Defense
  defense: number;         // (Constitution / 2) + ArmorValue
  magicDefense: number;    // (Wisdom / 2) + ArmorMagicDef
  dodgeChance: number;     // (Dexterity * 1%) + GearDodgeBonus, cap at 25%
  blockChance: number;     // ShieldBlockChance (from gear), 0 if no shield
  
  // Utility
  initiative: number;      // Dexterity + Random(1, 10) - determines turn order
  runChance: number;       // 30% + (Charisma * 2%) + (LevelDiff * 5%)
}
```

---

## Combat Flow

### Pre-Combat
1. Player initiates fight (random encounter or exploration)
2. Select monster from pool based on player level
3. Roll monster stats with variance
4. Calculate initiative for turn order

### Combat Loop
```
while (player.HP > 0 && monster.HP > 0) {
  1. Determine turn order (compare initiative)
  2. Active combatant chooses action
  3. Execute action, calculate outcome
  4. Apply damage/effects
  5. Check for death/victory
  6. Switch to next combatant
}
```

### Post-Combat
1. Victory: Award XP, roll loot
2. Defeat: Penalty? (TBD - probably just minor XP loss or respawn)
3. Run: No XP, no loot, possible damage if failed

---

## Player Actions

### Phase 1 (MVP)
| Action | Description | Formula |
|--------|-------------|---------|
| ⚔️ **Attack** | Basic physical attack | `Damage = AttackPower - EnemyDefense` |
| 🛡️ **Defend** | Reduce incoming damage by 50% | Next attack against you halved |
| 🏃 **Run** | Attempt to flee combat | `Success = RunChance + Random` |

### Phase 2 (Enhancement)
| Action | Description |
|--------|-------------|
| 🧪 **Item** | Use consumable (health potion, buff) |
| ✨ **Skill** | Class-specific ability (future) |

---

## Damage Calculation

### Physical Attack
```typescript
function calculatePhysicalDamage(attacker: CombatStats, defender: CombatStats): DamageResult {
  // 1. Check for miss (based on attacker accuracy vs defender dodge)
  const missRoll = Random(0, 100);
  if (missRoll < defender.dodgeChance) {
    return { damage: 0, result: 'miss' };
  }
  
  // 2. Check for block (if defender has shield)
  const blockRoll = Random(0, 100);
  if (blockRoll < defender.blockChance) {
    // Blocked attacks do 25% damage
    const blockedDamage = Math.floor((attacker.attackPower - defender.defense) * 0.25);
    return { damage: Math.max(1, blockedDamage), result: 'blocked' };
  }
  
  // 3. Check for crit
  const critRoll = Random(0, 100);
  const isCrit = critRoll < attacker.critChance;
  
  // 4. Calculate base damage
  let damage = attacker.attackPower - defender.defense;
  damage = Math.max(1, damage); // Minimum 1 damage
  
  // 5. Apply crit multiplier
  if (isCrit) {
    damage = Math.floor(damage * attacker.critMultiplier);
    return { damage, result: 'critical' };
  }
  
  // 6. Apply variance (±10%)
  const variance = damage * 0.1;
  damage = Math.floor(damage + Random(-variance, variance));
  
  return { damage: Math.max(1, damage), result: 'hit' };
}
```

### Damage Result Types
```typescript
type DamageResultType = 'miss' | 'blocked' | 'hit' | 'critical';

interface DamageResult {
  damage: number;
  result: DamageResultType;
}
```

---

## Monster System

### Monster Lexicon Concept

Monsters are defined in a "lexicon" - a collection of templates that get instantiated with level-appropriate stats.

### Storage Strategy (Hybrid Approach)

```
📁 Plugin Files (TypeScript, shipped with plugin)
├── Default monster definitions
├── Base stat progression tables
├── Loot tables
└── NOT user-editable

📁 User Vault (Optional, YAML/MD override)
├── Custom monsters user creates
├── Stat tweaks for existing monsters
└── User-managed, optional
```

> [!IMPORTANT]
> **Plugin ships fully functional.** User files are *optional* overrides for power users.

### Monster Categories

| Category | Examples | Elemental Affinity |
|----------|----------|-------------------|
| 🐺 **Beasts** | Wolf, Bear, Giant Rat | None |
| 💀 **Undead** | Skeleton, Zombie, Ghost | Dark |
| 👺 **Goblins** | Goblin, Hobgoblin, Bugbear | None |
| 🧌 **Trolls** | Cave Troll, River Troll | Earth |
| 🧛 **Night Elves** | Shadow Elf, Dark Ranger | Dark |
| ⛏️ **Dwarves** | Rogue Dwarf, Berserker | Earth |
| 🐉 **Dragonkin** | Drake, Wyvern | Fire |
| 👁️ **Aberrations** | Mimic, Eye Beast | Arcane |

### Monster Definition

```typescript
interface MonsterTemplate {
  id: string;                    // "goblin", "cave_troll"
  name: string;                  // "Goblin"
  description: string;           // Flavor text
  category: MonsterCategory;     // For filtering, theming
  
  // Base stats (level 1 values, scale with formulas)
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;              // For initiative
  };
  
  // How stats scale per level
  statGrowth: {
    hp: number;                 // +X HP per level
    attack: number;
    defense: number;
    speed: number;
  };
  
  // Variance allowed on final stats (±percentage)
  statVariance: number;         // Default 15%
  
  // Loot configuration
  lootTable: LootTableEntry[];
  goldRange: [number, number];  // [min, max] gold per level
  xpValue: number;              // Base XP, multiplied by level
  
  // Visual
  spriteId: string;
  portraitId?: string;
  
  // Behavior (future)
  aiType?: 'aggressive' | 'defensive' | 'random';
  specialAbilities?: string[];
}
```

### Monster Stat Scaling Example

```typescript
// Goblin - weak, fast, common enemy
const goblinTemplate: MonsterTemplate = {
  id: 'goblin',
  name: 'Goblin',
  description: 'A small, cunning creature. Weak alone, dangerous in packs.',
  category: 'goblins',
  
  baseStats: { hp: 15, attack: 5, defense: 2, speed: 12 },
  statGrowth: { hp: 8, attack: 3, defense: 1, speed: 1 },
  statVariance: 0.15,
  
  lootTable: [
    { slot: 'weapon', chance: 20, tierBonus: -1 },
    { slot: 'gold', chance: 80 }
  ],
  goldRange: [5, 15],
  xpValue: 10,
  
  spriteId: 'monster_goblin',
};

// Cave Troll - tanky, slow, mid-tier enemy
const caveTrollTemplate: MonsterTemplate = {
  id: 'cave_troll',
  name: 'Cave Troll',
  description: 'A massive brute that lurks in dark places. Hits hard, moves slow.',
  category: 'trolls',
  
  baseStats: { hp: 50, attack: 12, defense: 8, speed: 4 },
  statGrowth: { hp: 20, attack: 5, defense: 3, speed: 0 },
  statVariance: 0.10,
  
  lootTable: [
    { slot: 'chest', chance: 30, tierBonus: 0 },
    { slot: 'weapon', chance: 25, tierBonus: 1 },
    { slot: 'gold', chance: 100 }
  ],
  goldRange: [20, 50],
  xpValue: 35,
  
  spriteId: 'monster_troll',
};
```

### Monster Instantiation

```typescript
function spawnMonster(template: MonsterTemplate, level: number): Monster {
  // Calculate stats for this level
  const stats = {
    hp: template.baseStats.hp + (template.statGrowth.hp * (level - 1)),
    attack: template.baseStats.attack + (template.statGrowth.attack * (level - 1)),
    defense: template.baseStats.defense + (template.statGrowth.defense * (level - 1)),
    speed: template.baseStats.speed + (template.statGrowth.speed * (level - 1)),
  };
  
  // Apply variance
  for (const stat of Object.keys(stats)) {
    const variance = stats[stat] * template.statVariance;
    stats[stat] = Math.floor(stats[stat] + Random(-variance, variance));
  }
  
  return {
    ...template,
    level,
    currentHP: stats.hp,
    maxHP: stats.hp,
    combatStats: stats,
  };
}
```

---

## Level Matching

When selecting enemies for combat:

```typescript
function selectMonsterLevel(playerLevel: number): number {
  // Enemies within ±3 levels of player
  const minLevel = Math.max(1, playerLevel - 3);
  const maxLevel = Math.min(43, playerLevel + 3);
  
  // Weighted toward player level (bell curve)
  const roll = Random(0, 100);
  if (roll < 50) {
    return playerLevel; // 50% chance of same level
  } else if (roll < 75) {
    return playerLevel + Random(-1, 1); // 25% chance ±1
  } else if (roll < 90) {
    return playerLevel + Random(-2, 2); // 15% chance ±2
  } else {
    return Random(minLevel, maxLevel); // 10% chance full range
  }
}
```

---

## Boss Mechanics

Bosses are special monsters with:

| Feature | Regular Monster | Boss |
|---------|-----------------|------|
| Stats | Normal scaling | +50% all stats |
| HP | Normal | +100% HP |
| Abilities | None (Phase 1) | Special moves |
| Loot | Standard table | Guaranteed Epic+ |
| Source | Random encounters | Exploration only |

### Boss Definition Extension

```typescript
interface BossTemplate extends MonsterTemplate {
  isBoss: true;
  phaseThresholds?: number[];     // HP% triggers for phase changes
  specialMoves?: BossAbility[];   // Unique attacks
  guaranteedLoot?: GearSlot[];    // Always drops these slots
  minTier: GearTier;              // Minimum tier for drops
}
```

---

## Combat UI

### Visual Layout (CSS + DOM)

```
┌─────────────────────────────────────────┐
│  Monster Name      ████████░░░░ HP      │
│  ┌─────────────┐                        │
│  │             │   Level 12             │
│  │   Monster   │   Cave Troll           │
│  │   Sprite    │                        │
│  │             │                        │
│  └─────────────┘                        │
├─────────────────────────────────────────┤
│                                         │
│       💥 "You dealt 24 damage!"         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────┐                        │
│  │   Player    │   Player Name          │
│  │   Sprite    │   Level 10 Warrior     │
│  └─────────────┘   ████████████░ HP     │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ ⚔️ Attack │  │ 🛡️ Defend │  │ 🏃 Run   │  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
```

### Animation Ideas (CSS-based)
- **Idle:** Subtle breathing/floating effect (CSS transform)
- **Attack:** Quick shake + move toward enemy
- **Damage:** Flash red + shake
- **Miss:** Flash with "MISS" text
- **Critical:** Screen shake + flash + big numbers
- **Victory:** Character sprite bounces, confetti

---

## Random Encounter System

```typescript
class RandomEncounterService {
  /**
   * Start a random fight
   */
  startRandomFight(character: Character): BattleContext {
    // 1. Select monster pool based on character level
    const eligibleMonsters = this.getEligibleMonsters(character.level);
    
    // 2. Pick a random monster
    const template = Random.choice(eligibleMonsters);
    
    // 3. Determine monster level
    const monsterLevel = selectMonsterLevel(character.level);
    
    // 4. Spawn the monster
    const monster = spawnMonster(template, monsterLevel);
    
    // 5. Create battle context
    return {
      player: this.getPlayerCombatStats(character),
      monster,
      turnOrder: this.determineInitiative(character, monster),
      log: [],
    };
  }
}
```

---

## AI Integration (Stretch Goal)

Instead of complex RNG, AI can:

1. **Generate encounter descriptions** - Flavor text for each fight
2. **Create unique monster variants** - "A battle-scarred goblin veteran"
3. **Narrate combat** - Dynamic battle log text
4. **Generate dungeon encounters** - See Exploration system

```typescript
// Example AI prompt for encounter generation
const prompt = `
You are generating a random combat encounter for an RPG game.
Player: Level ${playerLevel} ${playerClass}
Generate a ${difficulty} encounter with:
- Monster type (from: goblin, troll, skeleton, wolf, etc.)
- Flavor text (2 sentences)
- Combat motivation ("The ${monster} attacks because...")
Response in JSON format.
`;
```

---

## Open Questions

1. **Death Penalty?**
   - HP reset only?
   - Lose some gold?
   - Streak loss would be too punishing (this is task gamification!)

2. **Combat Frequency?**
   - Command to start fight anytime?
   - Tied to quest completion? (Complete quest → optional fight?)
   - Exploration encounters only?

3. **Retreat Cost?**
   - Failed run = take damage?
   - Always succeed but lose potential XP?

4. **Party System?** (Future)
   - Companions/pets that fight with you?
   - Different character classes in party?

5. **Status Effects?** (Future)
   - Poison, stun, bleed, etc.?
   - Would add complexity but also depth

---

## Implementation Order

1. **Combat stat interface** - Derive from character stats + gear
2. **Monster templates** - Create base lexicon (5-10 monsters)
3. **Monster spawning** - Level selection, stat variance
4. **Battle service** - Turn loop, damage calculation
5. **Combat UI** - Basic layout with sprites
6. **Actions: Attack/Defend/Run** - Core gameplay
7. **Victory/defeat handling** - XP + loot integration
8. **Random encounter command** - Entry point for fights
9. **Combat animations** - CSS effects
10. **Boss templates** - Enhanced monsters for exploration

---

## Related Documents

- [[Gear and Loot System]] - Combat uses gear stats
- [[Exploration System]] - Where fights happen

---

*Last Updated: 2026-01-22*
