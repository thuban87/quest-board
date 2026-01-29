# Quest Board - Skills System Planning

Planning document for the character skills system. Skills are special moves used during battles that cost mana and provide strategic options beyond basic attack/defend.

**Design Philosophy:** Inspired by Pokemon Red/Blue Gen 1 mechanics - simple, strategic, and focused.

---

## System Overview

- **Unlock Cadence:** One skill every 5-8 levels
- **Level Range:** 1-40 (8 skills per class)
- **Equipped Limit:** Players can equip 4-5 skills at a time
- **Resource:** All skills cost mana (balanced per class archetype)
- **Design:** Most skills do ONE thing (damage, buff, debuff, heal, or status). 2-3 hybrids per class.

---

## Core Mechanics

### Stat Modifiers (Stage System)

- Stats can be raised/lowered by **stages** (-6 to +6)
- Each stage = **+50% change** (Stage +1 = 1.5x stat, Stage +2 = 2x stat, etc.)
- **Stage Cap:** Attempting to go beyond ±6 shows "Won't go higher/lower!" - does NOT waste turn or mana
- **Stage Stacking:** Multi-effect moves stack independently (Enrage 3x = +6 ATK, -3 stages DEF)
- **Stage Types:**
  - **ATK Stages:** Affect damage dealt
  - **DEF Stages:** Affect damage taken
  - **Speed Stages:** Affect turn order (high speed advantage = multiple attacks per enemy turn)
- **Stage Reset:** All stages reset to 0 after battle ends
- **Stage Duration:** Last until battle ends (no turn tracking)

### Status Effects (Sticky)

Status effects last **until cured** or battle ends. **Multiple status effects can stack.**

Status damage ticks at **END of turn** (after all actions).

| Status | Effect | Category | Self-Curable? |
| --- | --- | --- | --- |
| **Burn** | Takes 6% max HP damage per turn | Major | ✅ Yes (soft) |
| **Poison** | Takes 8% max HP damage per turn | Major | ✅ Yes (soft) |
| **Bleed** | Takes 5% max HP damage per turn | Major | ✅ Yes (soft) |
| **Confusion** | 25% chance to hit self, lasts 1-4 turns | Minor | ✅ Yes (soft) |
| **Paralyze** | 25% chance to skip turn each round | Major | ❌ No (hard CC) |
| **Sleep** | Skip turns for 1-7 turns (random), wake if hit | Major | ❌ No (hard CC) |
| **Freeze** | Skip turn, breaks after 1-3 turns or if hit by Fire | Major | ❌ No (hard CC) |
| **Stun** | Skip next turn only (NOT sticky) | Minor | ❌ No (hard CC) |
| **Curse** | Takes 10% max HP per turn, cannot be healed | Major | ✅ Yes (soft) |

**Hard CC (Sleep/Paralyze/Freeze/Stun):** Cannot be self-cured with skills. Must use items or wait for effect to expire.

### Type Effectiveness (2x / 0.5x damage)

| Type | Strong Against (2x) | Weak Against (0.5x) |
| --- | --- | --- |
| **Physical** | Arcane | Earth, Dark |
| **Fire** | Nature, Ice | Water, Earth |
| **Water** | Fire, Earth | Nature, Lightning |
| **Ice** | Nature, Earth | Fire, Water |
| **Lightning** | Water, Physical | Earth, Nature |
| **Earth** | Fire, Lightning, Poison | Nature, Ice |
| **Nature** | Water, Earth | Fire, Ice, Poison |
| **Poison** | Nature, Physical | Earth, Dark |
| **Light** | Dark | Nature |
| **Dark** | Light, Physical | Light |
| **Arcane** | Physical | Dark |

**Important:**
- All type matchups are **resistances (0.5x)**, no immunities (0x) for V1
- **Healing skills bypass type effectiveness entirely** (no type chart applies)

### Combat Rules

**Critical Hits:**
- Some skills have increased crit chance (+30%, +50%, etc.)
- **Crits ignore DEF stages** (treats enemy DEF as stage 0)
- Makes Rogue crits extremely valuable

**Secondary Effects:**
- Hybrid skills have damage + secondary effect (Burn chance, Stun chance, etc.)
- **Secondary effects only roll if primary attack hits**
- Missing the attack = no status effect applied

**Ignores Stages:**
- Some skills "ignore stages" (Singularity, Shadow Strike)
- **Means:** Enemy DEF stages don't apply (treated as stage 0)
- Attacker's ATK stages still apply

**Turn Order:**
- Determined by Speed stat + Speed stages
- High speed advantage = multiple attacks per enemy turn (like Pokemon)

---

## Post-Battle Mechanics

### After Winning a Battle

| Resource | Behavior |
| --- | --- |
| **Status Effects** | **Persist** into next battle |
| **HP** | **Persist** at current value |
| **Mana** | **Persist** at current value |
| **Stat Stages** | **Reset** to 0 |

**Strategic Implication:** Resource management matters! Going into next fight Poisoned at 40% HP = tough choices.

### After Losing a Battle (Death)

Player is presented with options (all clear status effects):

| Option | Effect | Cost |
| --- | --- | --- |
| **Use Revive** | 25% HP restored | 1 Revive item |
| **Buy & Use Revive** | 25% HP restored | Gold (if no revive in inventory) |
| **Take a Break** | 50% HP restored | 30 minute wait |
| **Long Rest** | 100% HP + Mana restored | Free (or paid if on cooldown) |

### Long Rest (Between Battles)

- **Effect:** Restore HP/Mana to full + clear all status effects
- **Cost:**
  - **First use:** Free (30 minute cooldown)
  - **Additional uses:** 100g + (level × 35)
  - Same formula as dungeon rescue
- **Availability:** Only usable outside of battle

**Strategic Implication:** Can always rest if you have gold, creates tension in dungeons.

---

## Skill Design Rules

1. **One Job:** Most skills do ONE thing (damage OR buff OR status)
2. **Hybrids:** 2-3 per class max (e.g., "damage + 30% burn chance")
3. **Hybrid Cost:** Hybrids cost +5-10 more mana
4. **Status Removal:** Every class has 1 cure skill
   - **Soft cures:** Remove soft status (Burn/Poison/Bleed/Confusion) - can self-cast
   - **Hard cures:** Remove all status including hard CC - healers only (Paladin/Cleric)
5. **No Turn Tracking:** Buffs/debuffs last until battle ends (except status durations)
6. **Simple Math:** Clear multipliers (1.5x, 2x, 2.5x)

---

## Warrior

**Identity:** Tank, physical damage dealer, stat manipulation
**Mana Pool:** Low (physical class)
**Type:** Physical
**Status Removal:** Battle Hardened (removes ATK/DEF debuffs)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Slash** | Physical | 12 | A basic but reliable sword strike. | Damage: **1.5x ATK** (Physical) |
| **8** | **Sharpen** | Buff | 14 | Hone your blade and focus your strikes. | Self: **ATK +1 stage** |
| **13** | **Fortify** | Buff | 14 | Brace yourself for incoming attacks. | Self: **DEF +1 stage** |
| **18** | **Battle Hardened** | Cure | 12 | Shrug off debilitating effects through sheer willpower. | **Remove** all ATK/DEF stage debuffs from self |
| **23** | **Cleave** | Physical | 20 | A powerful sweeping attack. | Damage: **2.2x ATK** (Physical) |
| **28** | **Enrage** | Buff | 22 | Fly into a fury, sacrificing defense for raw power. | Self: **ATK +2 stages**, **DEF -1 stage** |
| **33** | **Reckless Strike** | HYBRID | 28 | A devastating blow that can stagger foes. | Damage: **2.5x ATK** (Physical)<br>**Stun:** 40% chance |
| **38** | **Bloodthirst** | HYBRID | 32 | A savage strike that drains the life from your enemy. | Damage: **3x ATK** (Physical)<br>**Lifesteal:** Heal for 20% of damage dealt |

---

## Paladin

**Identity:** Holy warrior, tank/healer hybrid, protective support
**Mana Pool:** Medium (hybrid class)
**Type:** Light
**Status Removal:** Divine Cleanse (removes all status effects)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Holy Strike** | Light | 16 | Strike with radiant holy energy. | Damage: **1.5x ATK** (Light) |
| **8** | **Heal** | Heal | 20 | Channel divine power to mend wounds. | Heal: **40% max HP** |
| **13** | **Shield of Faith** | Buff | 20 | Invoke divine protection. | Self: **DEF +2 stages** |
| **18** | **Divine Cleanse** | Cure | 24 | Purge all ailments with holy light. | **Remove** all status effects (Burn, Poison, Paralyze, etc.) |
| **23** | **Smite** | HYBRID | 28 | A devastating holy strike especially potent against darkness. | Damage: **2x ATK** (Light), **2.5x vs Dark**<br>**Burn:** 30% chance |
| **28** | **Blessing** | Buff | 24 | Invoke a holy blessing that strengthens body and spirit. | Self: **ATK +1 stage**, **DEF +1 stage** |
| **33** | **Judgment** | Light | 32 | Call down divine wrath upon your enemy. | Damage: **2.8x ATK** (Light) |
| **38** | **Divine Shield** | HYBRID | 36 | Surround yourself with impenetrable holy light. | Self: **DEF +2 stages**<br>Heal: **30% max HP** |

---

## Technomancer

**Identity:** Tech/elemental mage, status effects, debuffs
**Mana Pool:** High (pure caster)
**Type:** Lightning / Fire / Ice (varied elemental)
**Status Removal:** Reboot (removes Burn/Poison/Confusion)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Spark** | Lightning | 18 | Release a bolt of crackling electricity. | Damage: **1.4x ATK** (Lightning) |
| **8** | **Weaken Defenses** | Debuff | 16 | Analyze enemy defenses and find weak points. | Enemy: **DEF -1 stage** |
| **13** | **Flame Burst** | HYBRID | 24 | Launch a ball of fire at your enemy. | Damage: **1.8x ATK** (Fire)<br>**Burn:** 40% chance |
| **18** | **Reboot** | Cure | 14 | Clear system errors and malfunctions. | **Remove** Burn, Poison, and Confusion from self |
| **23** | **Frost Bolt** | HYBRID | 28 | Blast enemy with freezing energy. | Damage: **2x ATK** (Ice)<br>**Freeze:** 35% chance |
| **28** | **Overcharge** | Buff | 22 | Supercharge your systems for maximum output. | Self: **ATK +2 stages** |
| **33** | **Chain Lightning** | Lightning | 32 | A devastating bolt that arcs through enemies. | Damage: **2.5x ATK** (Lightning) |
| **38** | **Meteor** | HYBRID | 38 | Call down a flaming meteor from the sky. | Damage: **3x ATK** (Fire)<br>**Burn:** 50% chance |

---

## Scholar

**Identity:** Strategic mage, knowledge-based, debuffs
**Mana Pool:** High (pure caster)
**Type:** Arcane
**Status Removal:** Clarity (removes Burn/Poison/Confusion)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Arcane Missile** | Arcane | 18 | Launch a precise bolt of pure magical energy. | Damage: **1.6x ATK** (Arcane) |
| **8** | **Analyze** | Debuff | 16 | Study your opponent to reveal vulnerabilities. | Enemy: **DEF -1 stage** |
| **13** | **Mana Shield** | Buff | 18 | Convert mana into a protective barrier. | Self: **DEF +1 stage** |
| **18** | **Clarity** | Cure | 14 | Clear the mind and restore focus. | **Remove** Burn, Poison, and Confusion from self |
| **23** | **Mind Spike** | HYBRID | 26 | Assault the enemy's mind with psychic energy. | Damage: **2x ATK** (Arcane)<br>**Confusion:** 35% chance |
| **28** | **Exploit Weakness** | Debuff | 22 | Expose critical weaknesses in enemy defenses. | Enemy: **DEF -2 stages** |
| **33** | **Meteor Strike** | Arcane | 34 | Call down a flaming meteor with arcane power. | Damage: **2.8x ATK** (Arcane) |
| **38** | **Singularity** | Arcane | 38 | Create a collapsing vortex of pure magical energy. | Damage: **3.5x ATK** (Arcane, ignores stages) |

---

## Rogue

**Identity:** High damage, critical hits, speed and evasion
**Mana Pool:** Low (physical class)
**Type:** Physical / Poison
**Status Removal:** Nimble Recovery (removes Poison/Bleed/Confusion)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Backstab** | Physical | 14 | Strike from the shadows for massive damage. | Damage: **2x ATK** (Physical)<br>**Crit:** +30% crit chance |
| **8** | **Agility** | Buff | 12 | Move with increased speed and precision. | Self: **Speed +1 stage** (evasion +10%) |
| **13** | **Poison Blade** | HYBRID | 18 | Coat your weapon with deadly toxin. | Damage: **1.3x ATK** (Physical)<br>**Poison:** 40% chance |
| **18** | **Nimble Recovery** | Cure | 12 | Shake off toxins and clear your head with quick reflexes. | **Remove** Poison, Bleed, and Confusion from self |
| **23** | **Shadow Strike** | Physical | 22 | A precise strike that exploits openings. | Damage: **2.5x ATK** (Physical, ignores DEF stages) |
| **28** | **Focus** | Buff | 18 | Concentrate on your target for a lethal strike. | Self: **ATK +2 stages** |
| **33** | **Fan of Knives** | HYBRID | 26 | Hurl a flurry of poisoned blades. | Damage: **2.2x ATK** (Physical)<br>**Bleed:** 40% chance |
| **38** | **Assassinate** | Physical | 30 | A lethal strike that ends battles instantly. | Damage: **4x ATK** (Physical)<br>**Crit:** +50% crit chance |

---

## Cleric

**Identity:** Pure healer/support, buffs, cleansing
**Mana Pool:** High (pure caster)
**Type:** Light
**Status Removal:** Full Heal (removes all status + heals)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Holy Light** | Heal | 18 | Channel divine energy to mend wounds. | Heal: **35% max HP** |
| **8** | **Bless** | Buff | 16 | Invoke a blessing that protects from harm. | Self: **DEF +1 stage** |
| **13** | **Smite Evil** | HYBRID | 22 | Strike down the wicked with holy wrath. | Damage: **1.6x ATK** (Light, **2x vs Dark**)<br>Heal: **15% max HP** on hit |
| **18** | **Full Heal** | Cure | 26 | Channel powerful restorative magic. | Heal: **50% max HP**<br>**Remove** all status effects |
| **23** | **Prayer** | Heal | 24 | Speak a prayer of healing. | Heal: **45% max HP** |
| **28** | **Divine Protection** | Buff | 24 | Surround yourself with divine light. | Self: **DEF +2 stages** |
| **33** | **Holy Nova** | Light | 32 | Release a burst of holy energy. | Damage: **2.5x ATK** (Light) |
| **38** | **Resurrection** | HYBRID | 40 | Call upon divine power to defy death. | Heal: **Full HP**<br>**Remove** all debuffs and status effects |

---

## Bard

**Identity:** Support buffer, debuffer, performance-based
**Mana Pool:** Medium (hybrid class)
**Type:** Varies (Physical/Arcane hybrid)
**Status Removal:** Inspiring Song (removes Confusion/morale debuffs)

| Level | Skill Name | Type | Mana | Description | Effects |
| --- | --- | --- | --- | --- | --- |
| **5** | **Power Chord** | Physical | 14 | Strike a powerful chord that damages and inspires. | Damage: **1.4x ATK** (Physical) |
| **8** | **Inspiring Ballad** | Buff | 16 | Play an uplifting melody that bolsters courage. | Self: **ATK +1 stage** |
| **13** | **Song of Rest** | Heal | 18 | Play a soothing tune that mends wounds. | Heal: **30% max HP** |
| **18** | **Inspiring Song** | Cure | 14 | Play an inspiring melody that clears the mind. | **Remove** Confusion and ATK debuffs from self |
| **23** | **Vicious Mockery** | HYBRID | 22 | Hurl devastating insults at your enemy. | Damage: **1.6x ATK** (Arcane)<br>Enemy: **ATK -1 stage** |
| **28** | **War Chant** | Buff | 24 | Beat a thunderous rhythm that empowers strikes. | Self: **ATK +2 stages** |
| **33** | **Lullaby** | Status | 26 | Play a haunting melody that induces sleep. | **Sleep:** 60% chance (1-7 turns) |
| **38** | **Symphony** | HYBRID | 32 | Conduct a devastating orchestral assault. | Damage: **3x ATK** (Arcane)<br>Self: **ATK +1 stage** after |

---

## Implementation Notes

### Mana Cost Tiers by Class

- **Low (12-32):** Warrior, Rogue (physical)
- **Medium (14-36):** Paladin, Bard (hybrid)
- **High (14-40):** Technomancer, Scholar, Cleric (caster)

### Skill Categories

- **Pure Damage:** 1.4x - 4x ATK multipliers
- **Buffs/Debuffs:** +/- 1-2 stages (50% - 100% change)
- **Healing:** 30% - 100% max HP
- **Hybrids:** Damage + status/buff/heal (cost +5-10 mana)
- **Status Removal:** Specific (12-14 mana) or Broad (24-26 mana)

### Balance Philosophy

1. **Simplicity:** Each skill does one thing well
2. **Strategic Depth:** Stage system creates meaningful choices
3. **No Tracking:** Minimal turn counting (only status durations)
4. **Type Advantage:** 2x/0.5x creates rock-paper-scissors gameplay
5. **Class Identity:** Each class feels unique in playstyle

---

## Implementation Gotchas

Critical edge cases and rules to implement correctly:

### Stage System
- ✅ **Stage Cap:** -6 to +6 max
- ✅ **Over-cap Behavior:** Show "Won't go higher/lower!" message, don't consume mana or turn
- ✅ **Independent Stacking:** ATK and DEF stages stack separately (Enrage 3x = +6 ATK, -3 DEF)
- ✅ **Battle Reset:** All stages reset to 0 after battle ends
- ✅ **Persist Through Status:** Stages don't clear when hit with status effects
- ❓ **Crits Ignore DEF:** Need to verify current system, but crits should ignore enemy DEF stages

### Status Effects
- ✅ **Multiple Status:** Can have multiple status effects simultaneously (Burned + Poisoned)
- ✅ **Status Timing:** Status damage ticks at END of turn (after all actions)
- ✅ **Self-Cure Restrictions:** Cannot self-cure hard CC (Sleep/Paralyze/Freeze/Stun)
- ✅ **Soft Status:** Can self-cure Burn/Poison/Bleed/Confusion with cure skills
- ✅ **Post-Battle Persistence:** Status effects persist between battles
- ✅ **Death Clears All:** Any death recovery option clears all status effects
- ✅ **Long Rest Clears All:** Long rest clears all status effects

### Combat Rules
- ✅ **Secondary Effects:** Only apply if primary attack hits
- ✅ **Miss = No Status:** Missing an attack = no status effect roll
- ✅ **Healing Bypasses Types:** Healing skills ignore type effectiveness chart entirely
- ✅ **Ignores Stages:** Means enemy DEF stages treated as 0 (attacker ATK stages still apply)
- ✅ **Speed Affects Turn Order:** High speed advantage = multiple attacks per enemy turn
- ✅ **Type Resistances Only:** All type matchups are 0.5x (resist), no 0x (immune) for V1

### Monster AI (V1)
- ✅ **Simple Moveset:** 1 basic attack + 1 special move per monster
- ✅ **No Self-Buffing:** Monsters don't spam stat buffs (boring for player)
- ✅ **Type-Appropriate:** Moves match monster's affinity/category

### Post-Battle
- ✅ **HP/Mana Persist:** Stay at current values after winning
- ✅ **Status Persists:** All status effects carry over to next battle
- ✅ **Stages Reset:** All stat stages reset to 0
- ✅ **Long Rest Cost:** First = free (30 min cooldown), additional = 100g + (level × 35)

---

## Next Steps

1. **Data Structure:** Define `Skill` model with type, damage, stage changes, status effects
2. **Battle Integration:**
   - Implement stage system (-6 to +6, with cap checks)
   - Add type effectiveness calculation (2x/0.5x)
   - Implement status effect persistence between battles
   - Add speed-based turn order system
   - Add crit system (ignores DEF stages)
3. **UI Components:**
   - Skill selection screen (pick 4-5 to equip)
   - Skill bar in battle view
   - Stage indicators (+2 ATK, -1 DEF visual display)
   - Status effect icons with persistence warning
4. **Unlock System:** Track unlocked skills per character level
5. **Loadout System:** Save/load equipped skills configuration (4-5 slots)
6. **Monster Skills:** Add 2 skills per monster template (1 basic, 1 special)
7. **Animation/Feedback:** Visual effects for skill activation, type effectiveness, crits
8. **Long Rest Integration:** Add paid long rest option (100g + level×35) when on cooldown

---

**Last Updated:** 2026-01-29
