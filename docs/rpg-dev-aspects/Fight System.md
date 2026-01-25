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
- **Productivity-tied** - Completing tasks directly improves combat outcomes

---

## Combat Stats (Using Existing D&D Stats)

Current character stats and their combat roles:

| Stat | Combat Role |
|------|-------------|
| **Strength** | Physical attack power, heavy weapon effectiveness |
| **Intelligence** | Magic attack power, spell effectiveness (future) |
| **Wisdom** | Magic defense, healing effectiveness (future) |
| **Constitution** | Max HP, defense (1:1 scaling) |
| **Dexterity** | Hit chance, dodge chance, crit chance, initiative |
| **Charisma** | Run success chance, intimidation, persuasion (future) |

> [!NOTE]
> We're NOT adding Agility or Luck as new stats. 
> Dexterity covers speed/evasion, Wisdom can influence "lucky breaks" narratively.

---

## Derived Combat Stats

Calculated from base stats + gear:

```typescript
interface CombatStats {
  // Health & Mana
  maxHP: number;           // 50 + (Constitution * 5) + (Level * 10)
  currentHP: number;
  maxMana: number;         // 20 + (Intelligence * 3) + (Level * 5)
  currentMana: number;
  
  // Offense
  attackPower: number;     // Strength + WeaponPower
  magicPower: number;      // Intelligence + WeaponMagic (future)
  critChance: number;      // 5% + (Dexterity * 0.5%) + GearCritBonus
  critMultiplier: number;  // Default 2.0x (big numbers are fun!)
  
  // Defense (1:1 stat scaling - stats should matter!)
  defense: number;         // Constitution + ArmorValue
  magicDefense: number;    // Wisdom + ArmorMagicDef
  dodgeChance: number;     // (Dexterity * 1%) + GearDodgeBonus, cap at 25%
  blockChance: number;     // ShieldBlockChance (from gear), 0 if no shield
  
  // Utility (stats are primary factor, RNG is tiebreaker)
  initiative: number;      // (Dexterity * 2) + Random(0, 5)
  runChance: number;       // 30% + (Charisma * 2%) + (LevelDiff * 5%)
}
```

> [!IMPORTANT]
> **Formula Changes from Review:**
> - **Crit Multiplier:** 2.0x (was 1.5x - bigger crits feel better!)
> - **Defense:** `Constitution + ArmorValue` (was `/2` - stats should matter at high levels)
> - **Initiative:** `(Dex * 2) + Random(0,5)` (was `Dex + Random(1,10)` - stats primary, RNG tiebreaker)

---

## HP Persistence & Recovery

> [!TIP]
> HP persists between fights. This makes potions valuable and ties combat to productivity.

### Recovery Options

| Method | Effect | Source |
|--------|--------|--------|
| **Health Potion** | +50 HP | Store, loot drops |
| **Greater Health Potion** | +100 HP | Store, rare drops |
| **Mana Potion** | +30 Mana | Store, loot drops |
| **Long Rest** | Full HP/Mana restore | Complete daily routine |
| **Revive Potion** | Recover from Unconscious | Store only |

### The "Long Rest" Mechanic

> [!TIP]
> **Productivity Tie-in:** Completing your daily routine = free full heal.
> Forces players to engage with daily habits to keep adventuring.

```typescript
interface LongRestConfig {
  // Trigger: Complete all tasks in a specific file
  dailyRoutineFile: string;  // e.g., "Daily Routine.md"
  
  // Or trigger: Complete X daily quests
  dailyQuestsRequired?: number;  // e.g., 3
}

function checkLongRest(character: Character): boolean {
  // If daily routine file is complete, grant full heal
  const routineComplete = checkDailyRoutineComplete();
  if (routineComplete) {
    character.currentHP = character.maxHP;
    character.currentMana = character.maxMana;
    showNotification("Long Rest complete! HP and Mana fully restored.");
    return true;
  }
  return false;
}
```

---

## Store System

> [!IMPORTANT]
> **The Store is Core, Not Scope Creep**
> If you lose gold on death, and need HP to fight, gold must buy HP.

### Simple Store (MVP)

No complex shop UI needed. Just slash commands:

```
/buy health_potion     - 50g → +50 HP
/buy greater_potion    - 150g → +100 HP
/buy mana_potion       - 40g → +30 Mana
/buy revive_potion     - 200g → Recover from Unconscious
```

### The Economy Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Do Tasks ──► Get Loot ──► Sell Junk ──► Get Gold     │
│       ▲                                      │          │
│       │                                      ▼          │
│   Win Fights ◄── Survive ◄── Buy Potions ◄──┘          │
│       │                                                 │
│       └──► Get Better Loot ──► (repeat)                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Store Implementation

```typescript
interface StoreItem {
  id: string;
  name: string;
  cost: number;
  effect: ConsumableEffect;
}

const STORE_ITEMS: StoreItem[] = [
  { id: 'health_potion', name: 'Health Potion', cost: 50, 
    effect: { type: 'heal_hp', value: 50 } },
  { id: 'greater_health_potion', name: 'Greater Health Potion', cost: 150, 
    effect: { type: 'heal_hp', value: 100 } },
  { id: 'mana_potion', name: 'Mana Potion', cost: 40, 
    effect: { type: 'heal_mana', value: 30 } },
  { id: 'revive_potion', name: 'Revive Potion', cost: 200, 
    effect: { type: 'revive' } },
];

class StoreService {
  buyItem(character: Character, itemId: string): boolean {
    const item = STORE_ITEMS.find(i => i.id === itemId);
    if (!item || character.gold < item.cost) return false;
    
    character.gold -= item.cost;
    addToInventory(character, item.id, 1);
    return true;
  }
}
```

---

## Stamina System (Anti-Grind Protection)

> [!CAUTION]
> **Anti-Productivity Risk:** If players can spam "/fight" 100 times, they're procrastinating, not working!
> Combat must be tied to real task completion.

### The Mechanic

| Resource | Source | Usage |
|----------|--------|-------|
| **Stamina** | +2 per task completed | -1 per random fight |

**Rule:** You can only start a random fight if you have Stamina.

### Stamina Details

```typescript
interface StaminaConfig {
  maxStamina: number;          // Cap at 10 current stamina
  staminaPerTask: number;      // +2 per task
  staminaPerFight: number;     // -1 per random fight
  questBountyFree: boolean;    // true - Quest bounties don't cost stamina
  maxDailyStamina: number;     // NEW - 50/day cap to prevent infinite grinding
}

const DEFAULT_STAMINA_CONFIG: StaminaConfig = {
  maxStamina: 10,
  staminaPerTask: 2,
  staminaPerFight: 1,
  questBountyFree: true,
  maxDailyStamina: 50,         // 25 fights max per day
};

// Character fields for stamina tracking
interface Character {
  // ... existing fields ...
  stamina: number;              // Current stamina (0-10)
  staminaGainedToday: number;   // Resets at midnight
  lastStaminaResetDate: string; // ISO date for reset detection
}
```

### Daily Stamina Cap

> [!IMPORTANT]
> Prevents infinite "1 task = 2 fights" grinding. Max 50 stamina earned per day = 25 fights.

```typescript
function awardStamina(character: Character, amount: number): Character {
  const today = getLocalDateString();
  
  // Reset if new day
  if (character.lastStaminaResetDate !== today) {
    character.staminaGainedToday = 0;
    character.lastStaminaResetDate = today;
  }
  
  // Check daily cap (50 stamina/day = 25 fights)
  const MAX_DAILY_STAMINA = 50;
  if (character.staminaGainedToday >= MAX_DAILY_STAMINA) {
    return character; // No more stamina today
  }
  
  const granted = Math.min(amount, MAX_DAILY_STAMINA - character.staminaGainedToday);
  character.stamina = Math.min(character.stamina + granted, 10);
  character.staminaGainedToday += granted;
  
  return character;
}
```

### Why 2:1 Ratio + Daily Cap?

- Every task completed = 2 fights available
- Allows some gameplay flexibility without infinite grinding
- Quest Bounty fights are FREE (bonus for completing quests!)
- Current cap of 10 prevents hoarding
- **Daily cap of 50 prevents "task spam → fight spam" loop**

---

## Combat Flow

### Pre-Combat
1. Check stamina (or quest bounty = free)
2. Player initiates fight (random encounter OR quest bounty)
3. Select monster from pool based on player level
4. Apply monster prefix (Fierce/Sturdy/Ancient)
5. Roll monster stats with variance
6. Calculate initiative for turn order

### Combat State Machine

> [!IMPORTANT]
> **Not a While Loop!** In React/event-driven apps, you can't use a while loop (browser freezes).
> Combat is a **State Machine** with explicit states.

```typescript
type CombatState =
  | 'INITIALIZING'       // Setting up battle, calculating initiative
  | 'PLAYER_INPUT'       // Waiting for player to click Attack/Defend/Run
  | 'PROCESSING_TURN'    // Calculating damage, applying effects
  | 'ANIMATING_PLAYER'   // Playing player attack animation
  | 'ENEMY_TURN'         // Monster's turn (auto-executed)
  | 'ANIMATING_ENEMY'    // Playing monster attack animation
  | 'CHECKING_OUTCOME'   // Did someone die?
  | 'VICTORY'            // Player won
  | 'DEFEAT'             // Player lost
  | 'RETREATED';         // Player fled

interface BattleContext {
  state: CombatState;
  playerStats: CombatStats;
  monster: Monster;
  turnNumber: number;
  currentTurn: 'player' | 'monster';
  isAnimating: boolean;  // Block input during animations
  log: CombatLogEntry[];
}
```

### State Transitions

```
INITIALIZING → PLAYER_INPUT (if player goes first)
             → ENEMY_TURN (if monster goes first)

PLAYER_INPUT → PROCESSING_TURN (player clicks action)

PROCESSING_TURN → ANIMATING_PLAYER (play animation)

ANIMATING_PLAYER → CHECKING_OUTCOME (animation done)

CHECKING_OUTCOME → VICTORY (monster HP ≤ 0)
                 → DEFEAT (player HP ≤ 0)
                 → ENEMY_TURN (both alive, monster's turn)
                 → PLAYER_INPUT (both alive, player's turn)

ENEMY_TURN → ANIMATING_ENEMY (auto-execute monster action)

ANIMATING_ENEMY → CHECKING_OUTCOME (animation done)
```

### Post-Combat Outcomes

| Outcome | Result |
|---------|--------|
| **Victory** | Award XP, roll loot, gain gold |
| **Defeat** | "Unconscious" status, lose 10% gold, must recover |
| **Retreat (Success)** | No XP, no loot, escape safely |
| **Retreat (Failed)** | Take 15% HP damage, try again next turn |

---

## Death Penalty & Recovery

> [!IMPORTANT]
> No XP loss - that's backwards for a productivity tool!
> Losing progress on life stats feels bad.

### When HP Reaches 0

```typescript
function handleDefeat(character: Character): void {
  // 1. Set status to Unconscious
  character.status = 'unconscious';
  
  // 2. Apply gold penalty (10% "hospital bill")
  const goldLost = Math.floor(character.gold * 0.10);
  character.gold -= goldLost;
  
  // 3. Show defeat modal with recovery options
  showDefeatModal({
    goldLost,
    recoveryOptions: [
      { type: 'potion', label: 'Use Revive Potion', available: hasRevivePotion() },
      { type: 'task', label: 'Complete Recovery Task', description: 'Take a 15 min break' },
      { type: 'store', label: 'Buy Revive Potion (200g)', available: character.gold >= 200 },
    ],
  });
}
```

### Recovery Options

| Option | Requirement |
|--------|-------------|
| **Revive Potion** | Have one in inventory |
| **Buy Revive Potion** | 200 gold |
| **Recovery Task** | Complete a real-world task (e.g., "Take a 15 min break") |
| **Long Rest** | Complete daily routine (free, but requires productivity) |

---

## Combat Entry Points

### 1. Random Encounter Command

Available anytime via slash command:

```
/fight         - Start random encounter at player level
/fight easy    - Fight monster 2-3 levels below
/fight hard    - Fight monster 2-3 levels above
```

### 2. Quest Bounty System ✨

> [!TIP]
> **"Quest as a Key"** - Completing real tasks gives you the *opportunity* to win better gear.

When you complete a **Main Quest**, you get a "Bounty" notification:

```
🎯 BOUNTY AVAILABLE!
"A Fierce Troll has been spotted near your completed task!"

[Accept Bounty] [Decline]
```

**The Bonus:** Quest bounty fights have **+200% Luck** on the loot table.
- Fight a "Medium" difficulty monster
- If you win, roll on the "Hard" loot table
- Ties productivity directly to combat rewards!

```typescript
interface QuestBounty {
  questId: string;
  questTitle: string;
  monster: Monster;
  lootBonus: number;       // 2.0 = +200% luck (rolls on next tier table)
  expiresAt: string;       // ISO date - bounty expires after 24 hours
}

function onQuestComplete(quest: Quest): void {
  if (quest.type === 'main' || quest.difficulty === 'hard') {
    const bounty = generateBounty(quest);
    showBountyNotification(bounty);
  }
}
```

---

## Player Actions

### Phase 1 (MVP)
| Action | Description | Formula |
|--------|-------------|---------|
| ⚔️ **Attack** | Basic physical attack | `Damage = AttackPower - EnemyDefense` |
| 🛡️ **Defend** | Reduce incoming damage by 50% | Next attack against you halved |
| 🏃 **Run** | Attempt to flee combat | `Success = RunChance`, Fail = 15% HP damage |

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
  
  // 3. Check for crit (2.0x multiplier!)
  const critRoll = Random(0, 100);
  const isCrit = critRoll < attacker.critChance;
  
  // 4. Calculate base damage
  let damage = attacker.attackPower - defender.defense;
  damage = Math.max(1, damage); // Minimum 1 damage
  
  // 5. Apply crit multiplier (2.0x for satisfying big numbers)
  if (isCrit) {
    damage = Math.floor(damage * attacker.critMultiplier); // 2.0x default
    return { damage, result: 'critical' };
  }
  
  // 6. Apply variance (±10%)
  const variance = damage * 0.1;
  damage = Math.floor(damage + Random(-variance, variance));
  
  return { damage: Math.max(1, damage), result: 'hit' };
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

### Monster Prefix System

> [!TIP]
> **Efficiency Hack:** Write 1 monster template, get 4 variants!
> Makes the world feel 4x bigger with 0 extra manual work.

| Prefix | Effect | Visual |
|--------|--------|--------|
| *(none)* | Base stats | Normal |
| **Fierce** | +10% Attack | Red tint |
| **Sturdy** | +10% HP | Green tint |
| **Ancient** | +20% All Stats | Purple tint (Rare!) |

```typescript
type MonsterPrefix = 'none' | 'fierce' | 'sturdy' | 'ancient';

function applyPrefix(monster: Monster, prefix: MonsterPrefix): Monster {
  switch (prefix) {
    case 'fierce':
      monster.name = `Fierce ${monster.name}`;
      monster.combatStats.attack *= 1.10;
      monster.tint = 'red';
      break;
    case 'sturdy':
      monster.name = `Sturdy ${monster.name}`;
      monster.maxHP *= 1.10;
      monster.currentHP = monster.maxHP;
      monster.tint = 'green';
      break;
    case 'ancient':
      monster.name = `Ancient ${monster.name}`;
      monster.combatStats.attack *= 1.20;
      monster.combatStats.defense *= 1.20;
      monster.maxHP *= 1.20;
      monster.currentHP = monster.maxHP;
      monster.tint = 'purple';
      monster.xpValue *= 1.5;  // More XP for rare variant
      break;
  }
  return monster;
}

function rollPrefix(): MonsterPrefix {
  const roll = Random(0, 100);
  if (roll < 60) return 'none';      // 60% normal
  if (roll < 80) return 'fierce';    // 20% fierce
  if (roll < 95) return 'sturdy';    // 15% sturdy
  return 'ancient';                   // 5% ancient (rare!)
}
```

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
  
  // Visual (icon is emoji fallback if sprite fails to load)
  spriteId: string;
  icon: string;                 // Emoji fallback (e.g., "👺")
  portraitId?: string;
  
  // Behavior (future)
  aiType?: 'aggressive' | 'defensive' | 'random';
  specialAbilities?: string[];
}

// Loot table supports both random slots AND specific unique items
interface LootTableEntry {
  slot?: GearSlot;        // For random generation
  itemId?: string;        // For specific unique items (overrides slot)
  chance: number;         // 0-100 percentage
  tierBonus?: number;     // +/- tier adjustment
}
```

---

## Battle State Persistence

> [!CAUTION]
> **Critical:** Combat state MUST persist if user switches notes!
> Can't lose a dragon fight because you clicked a link.

### Zustand Battle Store with Dual Persistence

> [!IMPORTANT]
> **Multi-Device Support:** localStorage is per-window. Plugin data syncs via Obsidian Sync.
> Write to BOTH for resilience.

```typescript
interface BattleState {
  // Is a battle currently active?
  isInCombat: boolean;
  
  // Combat participants
  playerStats: CombatStats | null;
  monster: Monster | null;
  
  // Turn state
  currentTurn: 'player' | 'monster';
  turnNumber: number;
  
  // Combat log
  log: CombatLogEntry[];
  
  // Bounty bonus (if quest-triggered)
  lootBonus: number;          // 1.0 = normal, 2.0 = +200% luck
  
  // Actions
  startBattle: (monster: Monster, lootBonus?: number) => void;
  endBattle: (outcome: 'victory' | 'defeat' | 'retreat') => void;
  executeTurn: (action: PlayerAction) => void;
}

// Custom storage that writes to BOTH localStorage AND plugin data
function createBattleStorage(): StateStorage {
  return {
    getItem: async (name) => {
      // Try localStorage first (fast, same-device recovery)
      const local = localStorage.getItem(name);
      if (local) return local;
      
      // Fallback to plugin data (synced across devices)
      const plugin = app.plugins.getPlugin('quest-board');
      return plugin?.settings?.battleState || null;
    },
    
    setItem: async (name, value) => {
      // Write to localStorage (fast)
      localStorage.setItem(name, value);
      
      // Also write to plugin data (synced)
      const plugin = app.plugins.getPlugin('quest-board');
      if (plugin) {
        plugin.settings.battleState = value;
        await plugin.saveSettings();
      }
    },
    
    removeItem: async (name) => {
      localStorage.removeItem(name);
      const plugin = app.plugins.getPlugin('quest-board');
      if (plugin) {
        delete plugin.settings.battleState;
        await plugin.saveSettings();
      }
    },
  };
}

const useBattleStore = create<BattleState>()(
  persist(
    (set, get) => ({
      isInCombat: false,
      playerStats: null,
      monster: null,
      currentTurn: 'player',
      turnNumber: 1,
      log: [],
      lootBonus: 1.0,
      
      startBattle: (monster, lootBonus = 1.0) => {
        const character = useCharacterStore.getState().character;
        set({
          isInCombat: true,
          playerStats: deriveCombatStats(character),
          monster,
          currentTurn: determineFirstTurn(character, monster),
          turnNumber: 1,
          log: [],
          lootBonus,
        });
      },
      
      // ... other actions
    }),
    { 
      name: 'quest-board-battle',
      storage: createBattleStorage(),  // Dual persistence!
    }
  )
);
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

---

## Combat Balance (Tuned v25)

> [!IMPORTANT]
> **Finalized Balance Values** - These constants were tuned via `test/combat-simulator.test.ts`.
> Target: Casual-friendly 50%+ win rate floor across all classes and encounter tiers.

### Target Win Rates

| Tier | Target Range | Notes |
|------|--------------|-------|
| **Overworld** | 50-80% | Varied but manageable |
| **Dungeon** | 50-80% | Challenging but winnable |
| **Boss** | 50-80% | Significant challenge |
| **Raid Boss** | 40-60% | Brutal, requires preparation |

### Class Base Modifiers

```typescript
// Located in: src/config/classConfig.ts
const CLASS_INFO: Record<CharacterClass, ClassConfig> = {
    warrior:      { damageModifier: 1.0,  hpModifier: 1.1  }, // Tank: +10% HP
    paladin:      { damageModifier: 1.1,  hpModifier: 1.05 }, // Hybrid
    technomancer: { damageModifier: 1.15, hpModifier: 1.0  }, // Glass cannon
    scholar:      { damageModifier: 1.1,  hpModifier: 1.15 }, // Survivability fix
    rogue:        { damageModifier: 1.15, hpModifier: 1.0  }, // Glass cannon
    cleric:       { damageModifier: 1.0,  hpModifier: 1.1  }, // Tank: +10% HP
    bard:         { damageModifier: 1.1,  hpModifier: 1.05 }, // Hybrid
};
```

### Level-Specific Modifiers

```typescript
// Located in: src/services/CombatService.ts
function getLevelModifier(cls: CharacterClass, level: number): { damage: number; hp: number } {
    let damage = 1.0;
    let hp = 1.0;

    // ===== TANKS: Boost HP, penalty late-game damage =====
    if (cls === 'warrior') {
        hp = 1.1;  // +10% HP always
        if (level >= 18 && level <= 22) damage = 1.15;      // Fix L18-22 dip
        else if (level >= 15) damage = 0.85;                // -15% damage late
    }
    if (cls === 'cleric') {
        hp = 1.1;  // +10% HP always
        if (level >= 13 && level <= 17) damage = 1.2;       // +20% at L13-17
        else if (level >= 18 && level <= 22) damage = 1.15; // Fix L18-22 dip
        else if (level >= 23) damage = 0.85;                // -15% damage late
    }

    // ===== GLASS CANNONS: Boost early, nerf late =====
    if (cls === 'technomancer' || cls === 'rogue') {
        if (level >= 3 && level <= 7) { damage = 1.3; hp = 1.15; }  // L3-7 survival
        else if (level >= 20) damage = 0.85;                        // -15% late
    }

    // ===== HYBRIDS: Boost multiple level ranges =====
    if (cls === 'paladin') {
        if (level >= 3 && level <= 7) { damage = 1.4; hp = 1.2; }
        else if (level >= 8 && level <= 12) { damage = 1.35; hp = 1.15; }
        else if (level >= 18 && level <= 22) { damage = 1.25; hp = 1.1; }
        else if (level >= 23) damage = 0.9;
    }
    if (cls === 'bard') {
        if (level >= 3 && level <= 7) { damage = 1.4; hp = 1.2; }
        else if (level >= 20) damage = 0.9;
    }

    // ===== SCHOLAR: HP bonus + late nerf =====
    if (cls === 'scholar') {
        hp = 1.1;  // +10% HP
        if (level >= 20) damage = 0.9;
    }

    return { damage, hp };
}
```

### Monster Base Templates

```typescript
// Located in: src/data/monsters.ts
const MONSTER_TEMPLATES: MonsterTemplate[] = [
    { id: 'goblin',   name: 'Goblin',     baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDef: 5 },
    { id: 'skeleton', name: 'Skeleton',   baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDef: 6 },
    { id: 'wolf',     name: 'Wolf',       baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDef: 4 },
    { id: 'troll',    name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDef: 6 },
];
```

### Monster Stat Scaling

```typescript
// Per-level growth formula (7.5% exponential)
for (let lvl = 2; lvl <= level; lvl++) {
    const multiplier = 1 + (lvl * 0.075);  // 7.5% per level
    
    hp  += Math.floor(24 * multiplier);    // Moderate HP growth
    atk += Math.floor(8 * multiplier);     // Moderate attack growth
    def += Math.floor(3.5 * multiplier);
    mdef += Math.floor(3.5 * multiplier);
}
```

### Tier Multipliers

```typescript
// Located in: src/config/combatConfig.ts
// Updated from simulation v25 implementation
const TIER_MULTIPLIERS = {
    overworld: { hp: 1.0,  atk: 1.0,  def: 1.0, mdef: 1.0  },
    elite:     { hp: 1.3,  atk: 1.2,  def: 1.1, mdef: 1.1  },  // Rare dangerous
    dungeon:   { hp: 1.02, atk: 1.01, def: 1.0, mdef: 1.0  },  // Tuned from simulation
    boss:      { hp: 1.06, atk: 1.04, def: 1.0, mdef: 1.0  },  // Tuned from simulation
    raid_boss: { hp: 1.1,  atk: 1.06, def: 1.0, mdef: 1.0  },  // Tuned from simulation
};
```

### Raid Boss Tank Penalty

```typescript
// Applied in runSimulation / CombatService when tier === 'raid_boss'
if (tier === 'raid_boss' && (characterClass === 'warrior' || characterClass === 'cleric')) {
    totalDamageMod *= 0.85;  // -15% damage penalty for tanks vs raid bosses
}
```

> [!NOTE]
> This penalty prevents tanks from trivializing raid bosses (was 99-100% win rate).
> Now targets 75-90% for tanks, matching other classes at 40-85%.

---

## Combat UI

### Visual Layout (CSS + DOM)

```
┌─────────────────────────────────────────┐
│  Monster Name      ████████░░░░ HP      │
│  ┌─────────────┐                        │
│  │             │   Level 12             │
│  │   Monster   │   Fierce Cave Troll    │
│  │   Sprite    │                        │
│  │  (red tint) │                        │
│  └─────────────┘                        │
├─────────────────────────────────────────┤
│                                         │
│       💥 "CRITICAL! 48 damage!"         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────┐                        │
│  │   Player    │   Player Name          │
│  │   Sprite    │   Level 10 Warrior     │
│  └─────────────┘   ████████████░ HP     │
│                    ██████░░░░░░░ Mana   │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ ⚔️ Attack │  │ 🛡️ Defend │  │ 🏃 Run   │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│              ┌─────────┐                │
│              │ 🧪 Item  │                │
│              └─────────┘                │
└─────────────────────────────────────────┘
```

### Animation Ideas (CSS-based)
- **Idle:** Subtle breathing/floating effect (CSS transform)
- **Attack:** Quick shake + move toward enemy
- **Damage:** Flash red + shake
- **Miss:** Flash with "MISS" text
- **Critical:** Screen shake + flash + big numbers (2x damage!)
- **Victory:** Character sprite bounces, confetti

### Mobile Combat Controls

> [!TIP]
> Mobile is a priority. Combat buttons must be touch-friendly.

```typescript
// Detect mobile via Obsidian API
import { Platform } from 'obsidian';

function BattleView() {
  const isMobile = Platform.isMobile;
  
  return (
    <div className={cn('battle-view', isMobile && 'mobile')}>
      {/* Monster at top (mobile: smaller sprite) */}
      <MonsterSprite size={isMobile ? 'small' : 'large'} />
      
      {/* Combat log (mobile: shorter, scrollable) */}
      <CombatLog maxHeight={isMobile ? 100 : 200} />
      
      {/* Action buttons (mobile: larger, full width stacked) */}
      <div className={cn('action-buttons', isMobile && 'stacked')}>
        <button className="action-btn">⚔️ Attack</button>
        <button className="action-btn">🛡️ Defend</button>
        <button className="action-btn">🏃 Run</button>
        <button className="action-btn">🧪 Item</button>
      </div>
    </div>
  );
}
```

```css
/* Mobile-specific combat styles */
.battle-view.mobile .action-buttons.stacked {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battle-view.mobile .action-btn {
  width: 100%;
  min-height: 60px;      /* Large touch target */
  font-size: 18px;
  touch-action: manipulation;  /* Disable double-tap zoom */
}

.action-btn:active {
  transform: scale(0.95);  /* Touch feedback */
  opacity: 0.9;
}
```

---

## AI Integration (Stretch Goal)

Instead of complex RNG, AI can:

1. **Generate encounter descriptions** - Flavor text for each fight
2. **Create unique monster variants** - "A battle-scarred goblin veteran"
3. **Narrate combat** - Dynamic battle log text
4. **Generate dungeon encounters** - See Exploration system

---

## Open Questions

1. ~~**Death Penalty?**~~ ✅ DECIDED
   - **Answer:** "Unconscious" status + 10% gold loss + recovery options (potion, task, or long rest)

2. ~~**Combat Frequency?**~~ ✅ DECIDED
   - **Answer:** Command anytime (`/fight`) + Quest Bounty system for better loot rewards

3. ~~**Retreat Cost?**~~ ✅ DECIDED
   - **Answer:** Failed run = 15% HP damage, no XP loss

4. **Party System?** (Future)
   - Companions/pets that fight with you?
   - Different character classes in party?

5. **Status Effects?** (Future)
   - Poison, stun, bleed, etc.?
   - Would add complexity but also depth

---

## Architectural Considerations

> [!CAUTION]
> Key architectural issues to address during implementation.

| Issue | Problem | Solution |
|-------|---------|----------|
| **State Sync** | Battle uses items, but character store owns inventory | Battle store reads from character store, writes back on battle end |
| **Crash Recovery** | App crash mid-fight = lost battle state | Use Zustand `persist` middleware to save battle state to disk |
| **Animation Timing** | State transitions before animations complete | Use `isAnimating` flag, await animation completion before state change |
| **Turn Timeout** | User closes Obsidian mid-battle, returns later | Persist turn state. Resume on player's turn, auto-execute if monster's turn |
| **Combat Log Performance** | Log could grow very long in extended fights | Cap at last 20 entries or virtualize the list |
| **Effect Ordering** | Unclear sequence: damage → death check → effects? | Define explicit order in state machine transitions |
| **Mobile Touch** | Obsidian mobile exists, need touch-friendly combat | Larger tap targets (44x44px min), consider swipe gestures |
| **Multi-Monster** | Current design is 1v1 only | Defer for now. Could use combined HP bar for "3 Goblins" |
| **Resource Caps** | Infinite stamina/potions? | Max stamina: 10, inventory limit: 50 items |

### Visual Fallback Pattern

```typescript
// Always try sprite first, fall back to emoji icon
function MonsterSprite({ monster }: { monster: Monster }) {
  const [spriteError, setSpriteError] = useState(false);
  
  if (spriteError || !monster.spriteId) {
    return <span className="monster-icon">{monster.icon}</span>;
  }
  
  return (
    <img 
      src={getSpritePath(monster.spriteId)}
      onError={() => setSpriteError(true)}
      alt={monster.name}
    />
  );
}
```

---

## Implementation Order

1. **Combat stat interface** - Derive from character stats + gear (updated formulas)
2. **Stamina system** - Track stamina, +2 per task, -1 per fight
3. **Store system** - Simple `/buy` command for potions
4. **HP/Mana persistence** - Track between sessions
5. **Long Rest mechanic** - Daily routine = full heal
6. **Battle store (Zustand)** - Persistent combat state with state machine
7. **Combat state machine** - Explicit states: PLAYER_INPUT, PROCESSING, ANIMATING, etc.
8. **Monster templates** - Create base lexicon (5-10 monsters with icon fallbacks)
9. **Monster prefix system** - Fierce/Sturdy/Ancient variants
10. **Specific loot drops** - Support `itemId` for unique drops from bosses
11. **Monster spawning** - Level selection, stat variance
12. **Battle service** - State transitions, damage calculation
13. **Combat UI** - Basic layout with sprites + emoji fallbacks
14. **Actions: Attack/Defend/Run** - Core gameplay
15. **Victory/defeat handling** - XP + loot + death penalty
16. **Random encounter command** - `/fight` entry point (requires stamina)
17. **Quest Bounty system** - +200% loot luck on quest completion (free!)
18. **Combat animations** - CSS effects with proper timing
19. **Boss templates** - Enhanced monsters with unique drops

---

## Related Documents

- [[Gear and Loot System]] - Combat uses gear stats, store sells potions
- [[Exploration System]] - Where dungeon fights happen

---

*Last Updated: 2026-01-23*
