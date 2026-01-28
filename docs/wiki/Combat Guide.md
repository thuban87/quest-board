# Combat Guide

Quest Board features a **turn-based combat system** where you battle monsters to earn gold, XP, and gear. This guide covers battle mechanics, stamina, monsters, and death/recovery.

---

## Quick Reference

| System | How It Works |
|--------|--------------|
| **Stamina** | 2 per task, costs 1 per fight, max 10 pool, 50/day cap |
| **Bounty Fights** | Free (no stamina cost), triggered by quest completion |
| **Victory** | Earn gold, XP, and chance for gear drops |
| **Defeat** | Lose 10% gold, become unconscious, need recovery |

---

## Battle System

Combat is turn-based: **you act first**, then the monster attacks.

### Combat Flow

```
Start Battle → Player Turn → Monster Turn → Repeat until someone reaches 0 HP
```

### Your Options

| Action | Effect |
|--------|--------|
| ⚔️ **Attack** | Deal damage based on your class's attack style |
| 🛡️ **Defend** | Take 50% reduced damage this turn |
| 🏃 **Retreat** | 30% + (CHA × 2)% chance to escape; fail = 15% HP damage |

### Attack Styles by Class

| Style | Classes | How Damage Works |
|-------|---------|------------------|
| **Physical** | Warrior, Rogue | Uses Strength/DEX vs Defense |
| **Magic** | Technomancer, Scholar, Cleric | Uses INT/WIS/CHA vs Magic Defense |
| **Hybrid Physical** | Paladin | 70% physical + 30% magic |
| **Hybrid Magic** | Bard | 30% physical + 70% magic |

---

## Combat Stats

Your combat stats are derived from your base stats, gear, and class modifiers.

### Offensive Stats

| Stat | Calculation |
|------|-------------|
| **Physical Attack** | max(STR, DEX) + weapon attack power |
| **Magic Attack** | max(INT, WIS, CHA) + wand/staff attack power |
| **Crit Chance** | DEX × 0.5% + gear bonuses |
| **Crit Multiplier** | 2.0× damage on critical hits |

### Defensive Stats

| Stat | Calculation |
|------|-------------|
| **Max HP** | 200 + (CON × 2) + (Level × 10) + gear |
| **Defense** | CON ÷ 2 + (gear defense × 1.5) |
| **Magic Defense** | WIS ÷ 2 + (gear magic defense × 1.5) |
| **Dodge Chance** | DEX × 0.25%, capped at 25% |
| **Block Chance** | Shield-only, reduces damage by 75% |

### Damage Formula

```
Reduction = min(75%, defense ÷ (100 + defense))
Damage = Attack Power × (1 - Reduction) ± 10% variance
Minimum = 1 damage per hit
```

---

## Stamina System

Stamina fuels **optional random fights** (separate from quest bounties).

### How Stamina Works

| Event | Stamina Effect |
|-------|----------------|
| Complete a task | **+2 stamina** |
| Start a random fight | **-1 stamina** |
| Bounty fight (from quest) | **Free** (no cost) |

### Stamina Limits

| Limit | Value |
|-------|-------|
| **Pool Maximum** | 10 stamina |
| **Daily Cap** | 50 stamina earned per day |
| **Approx Fights/Day** | 25 random battles maximum |

> [!NOTE]
> Bounty fights (triggered by quest completion) are always free and don't consume stamina.

---

## Monsters

Quest Board features **19 monster templates** across 8 categories.

### Monster Categories

| Category | Type | Notable Traits |
|----------|------|----------------|
| 🐺 **Beasts** | Physical | Low magic defense |
| 💀 **Undead** | Dark | Vulnerable to light, mixed defenses |
| 👺 **Goblins** | Balanced | Pack tactics themed |
| 🧌 **Trolls** | Tanks | High HP, regeneration potential |
| 🧝 **Night Elves** | Magic | High speed, glass cannon |
| ⛏️ **Dwarves** | Physical | High defense |
| 🐉 **Dragonkin** | Fire | High all-around stats |
| 👁️ **Aberrations** | Arcane | Weird stat distributions |

### Monster Tiers

| Tier | When You'll See Them | Stat Multiplier |
|------|----------------------|-----------------|
| **Overworld** | Random fights | 1.0× (baseline) |
| **Elite** | 15% chance after L5 | 1.02-1.05× |
| **Dungeon** | Dungeon encounters | 1.01-1.02× |
| **Boss** | End of dungeons | 1.04-1.06× |
| **Raid Boss** | Future content | 1.06-1.10× |

### Elite Spawns

At **Level 5+**, random fights have a **15% chance** to spawn an Elite monster:
- Higher stats than normal
- Random title prefix (Elite, Champion, Veteran, Alpha, Savage, Enraged)
- Better loot drops

---

## Bounty System

Completing quests can trigger **bounty encounters** – themed monster fights.

### How Bounties Work

1. Complete a quest
2. Roll against your **bounty chance** (default 10%, configurable)
3. If triggered, a themed monster appears based on your quest's folder
4. Fight is **free** (no stamina cost)
5. Victory grants **2× loot bonus**

### Bounty Themes

| Folder Keywords | Monster Types |
|-----------------|---------------|
| Kitchen, Cooking | Goblins, Beasts |
| Coding, Dev | Night Elves, Aberrations |
| Fitness, Exercise | Wolves, Beasts |
| Study, Academic | Undead, Ghosts |
| Finance, Money | Goblins, Drakes |
| Health, Wellness | Bears, Spirits |

> [!TIP]
> AI-generated bounty descriptions add flavor when enabled in settings!

---

## Victory Rewards

Winning a battle grants:

| Reward | Source |
|--------|--------|
| **Gold** | Monster-specific (2-30 base, scaled by level) |
| **XP** | Monster-specific (6-22 base, scaled by level) |
| **Gear** | Chance based on monster tier |

### Gear Drop Rates by Tier

| Monster Tier | Drop Chance |
|--------------|-------------|
| Overworld | Standard |
| Elite | Increased |
| Dungeon | Increased + dungeon bias |
| Boss | High chance |

---

## Defeat & Recovery

When your HP reaches 0, you're **defeated**.

### Defeat Penalties

| Penalty | Amount |
|---------|--------|
| **Gold Lost** | 10% of current gold |
| **Status** | Becomes "Unconscious" |
| **Combat** | Cannot fight until recovered |

### Recovery Options

When unconscious, you have several options:

| Option | Effect | Cost |
|--------|--------|------|
| 🧪 **Use Revive Potion** | Instant revival, full HP | 1 potion from inventory |
| 💰 **Buy & Use Potion** | Buy then use immediately | 200 gold |
| ☕ **Short Rest** | Start 30-minute timer | Free |
| 🛏️ **Long Rest** | Full HP + Mana restoration | Must wait for timer |

### Recovery Timer

- **Duration:** 30 minutes
- **Auto-revival:** 25% HP when timer expires
- **Check interval:** Every 60 seconds

> [!IMPORTANT]
> While unconscious, you **cannot enter combat**. Complete the recovery to resume fighting!

---

## Combat Tips

### For New Players

1. **Complete tasks to build stamina** before hunting monsters
2. **Use Defend** when low on HP to survive an extra turn
3. **Keep a Revive Potion** in inventory for emergencies
4. **Match your gear** to your class's attack style (physical vs magic)

### Class-Specific Tips

| Class | Combat Strategy |
|-------|-----------------|
| **Warrior** | High HP lets you trade blows |
| **Rogue** | High crit chance – go all-in on offense |
| **Technomancer** | Magic damage bypasses physical defense |
| **Cleric** | Sustainable – you can outlast most fights |
| **Paladin** | Hybrid damage hits both defenses |

### Advanced Tips

- **Retreat** success scales with Charisma – Bards are best at running
- **Block** only works if you have a shield equipped
- **Dodge** caps at 25% – don't over-invest in DEX for dodge alone
- **Bounty fights** give 2× loot – prioritize quest completion!

---

## Related Topics

- [[Character Classes]] – See how your class affects combat
- [[Gear & Equipment]] – Optimize your equipment for battle
- [[Dungeon Exploration]] – Face dungeon and boss-tier monsters
- [[Power-Ups & Buffs]] – Active bonuses that enhance combat
