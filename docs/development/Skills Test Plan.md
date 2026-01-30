# Quest Board - Skills System Test Plan

Comprehensive test plan for the Pokemon Gen 1-inspired skills system.

**Created:** 2026-01-29  
**Related:** [[Skills Implementation Guide]], [[Skills planning]]

---

## Table of Contents

1. [Unit Tests](#unit-tests)
2. [Integration Tests](#integration-tests)
3. [Balance Testing](#balance-testing)
4. [Edge Cases](#edge-cases)
5. [Manual Testing Checklist](#manual-testing-checklist)

---

## Unit Tests

### Stage System (`test/stage-system.test.ts`)

```typescript
describe('Stage System', () => {
    // Stage Multiplier Calculation
    describe('getStageMultiplier', () => {
        it('returns 1.0 at stage 0');
        it('returns 1.5 at stage +1');
        it('returns 2.25 at stage +2 (1.5^2)');
        it('returns 11.39 at stage +6 (max)');
        it('returns 0.67 at stage -1');
        it('returns 0.088 at stage -6 (min)');
        it('clamps values above +6 to +6');
        it('clamps values below -6 to -6');
    });

    // Stage Application
    describe('applyStageChange', () => {
        it('increases ATK stage by specified amount');
        it('increases DEF stage by specified amount');
        it('increases Speed stage by specified amount');
        it('returns unchanged stage when at +6 cap');
        it('returns unchanged stage when at -6 cap');
        it('stacks ATK and DEF stages independently');
    });

    // Stage Reset
    describe('resetStages', () => {
        it('resets all stages to 0 after battle ends (victory)');
        it('resets all stages to 0 after battle ends (defeat)');
        it('resets all stages to 0 after retreat');
        it('does NOT reset stages between turns');
    });

    // Stage Cap Enforcement
    describe('stageCap', () => {
        it('shows "Won't go higher!" message at +6');
        it('shows "Won't go lower!" message at -6');
        it('does NOT consume mana when capped');
        it('does NOT consume turn when capped');
    });
});
```

### Status Effect System (`test/status-effects.test.ts`)

```typescript
describe('Status Effects', () => {
    // DoT Damage Calculation
    describe('calculateStatusDamage', () => {
        it('Burn deals 6% max HP per turn');
        it('Poison deals 8% max HP per turn');
        it('Bleed deals 5% max HP per turn');
        it('Curse deals 10% max HP per turn');
        it('minimum damage is 1 HP');
    });

    // Status Tick Timing
    describe('tickStatusEffects', () => {
        it('ticks at END of turn (after both actions)');
        it('does NOT wake sleeping target from DoT damage');
        it('DOES wake sleeping target from direct attack damage');
        it('removes expired duration-based effects');
    });

    // Status Duration
    describe('statusDuration', () => {
        it('Sleep lasts 1-7 turns (random)');
        it('Freeze lasts 1-3 turns (random)');
        it('Confusion lasts 1-4 turns (random)');
        it('Burn/Poison/Bleed have no duration (sticky)');
        it('Stun lasts exactly 1 turn then auto-clears');
    });

    // Status Stacking
    describe('statusStacking', () => {
        it('allows multiple different statuses simultaneously');
        it('replaces same status with new application (refreshes duration)');
        it('example: Burn + Poison + Confusion all active');
        it('example: Second Burn replaces first Burn');
    });

    // Hard CC Restrictions
    describe('hardCC', () => {
        it('Sleep cannot be self-cured');
        it('Paralyze cannot be self-cured');
        it('Freeze cannot be self-cured');
        it('Stun cannot be self-cured');
        it('Sleep/Paralyze/Freeze/Stun block all skill use');
    });

    // Soft Status Cures
    describe('softStatusCures', () => {
        it('Burn can be self-cured with cure skill');
        it('Poison can be self-cured with cure skill');
        it('Bleed can be self-cured with cure skill');
        it('Confusion can be self-cured with cure skill');
        it('Curse can be self-cured with cure skill');
    });

    // Status Persistence
    describe('statusPersistence', () => {
        it('status effects persist between battles (victory)');
        it('status effects cleared on Long Rest');
        it('status effects cleared on death recovery (all options)');
        it('status effects saved to character.persistentStatusEffects');
    });

    // Fire Breaks Freeze
    describe('fireBreaksFreeze', () => {
        it('Fire-type attack removes Freeze status');
        it('Non-Fire attacks do NOT break Freeze');
    });
});
```

### Type Effectiveness (`test/type-effectiveness.test.ts`)

```typescript
describe('Type Effectiveness', () => {
    // Super Effective (2x)
    describe('superEffective', () => {
        it('Physical vs Arcane = 2x');
        it('Fire vs Nature = 2x');
        it('Fire vs Ice = 2x');
        it('Water vs Fire = 2x');
        it('Water vs Earth = 2x');
        it('Ice vs Nature = 2x');
        it('Ice vs Earth = 2x');
        it('Lightning vs Water = 2x');
        it('Lightning vs Physical = 2x');
        it('Earth vs Fire = 2x');
        it('Earth vs Lightning = 2x');
        it('Earth vs Poison = 2x');
        it('Nature vs Water = 2x');
        it('Nature vs Earth = 2x');
        it('Poison vs Nature = 2x');
        it('Poison vs Physical = 2x');
        it('Light vs Dark = 2x');
        it('Dark vs Light = 2x');
        it('Dark vs Physical = 2x');
        it('Arcane vs Physical = 2x');
    });

    // Not Very Effective (0.5x)
    describe('notVeryEffective', () => {
        it('Physical vs Earth = 0.5x');
        it('Physical vs Dark = 0.5x');
        it('Fire vs Water = 0.5x');
        it('Fire vs Earth = 0.5x');
        // ... (complete type chart coverage)
    });

    // Neutral (1x)
    describe('neutral', () => {
        it('same type vs same type = 1x (no immunity)');
        it('unlisted matchups = 1x');
    });

    // Healing Bypass
    describe('healingBypass', () => {
        it('healing skills ignore type effectiveness entirely');
        it('healing always applies at full value');
    });

    // Inherent Type Resistance
    describe('inherentResistance', () => {
        it('Warrior (Physical) takes 90% from Physical');
        it('Paladin (Light) takes 90% from Light');
        it('Technomancer (Lightning) takes 90% from Lightning');
        it('Scholar (Arcane) takes 90% from Arcane');
        it('Rogue (Physical) takes 90% from Physical');
        it('Cleric (Light) takes 90% from Light');
        it('Bard (Arcane) takes 90% from Arcane');
    });
});
```

### Skill Execution (`test/skill-execution.test.ts`)

```typescript
describe('Skill Execution', () => {
    // Mana Cost
    describe('manaCost', () => {
        it('deducts mana cost on successful use');
        it('blocks skill use when insufficient mana');
        it('Meditate costs 0 mana');
        it('Meditate usable at 0 current mana');
    });

    // Once-Per-Battle Skills
    describe('oncePerBattle', () => {
        it('can use once-per-battle skill first time');
        it('blocks once-per-battle skill second time');
        it('resets usedThisBattle on victory');
        it('resets usedThisBattle on defeat');
        it('resets usedThisBattle on retreat');
    });

    // Skill Effects
    describe('skillEffects', () => {
        it('damage skills apply damageMultiplier correctly');
        it('heal skills restore healPercent of maxHP');
        it('Meditate restores 33% maxMana');
        it('buff skills apply stat stage changes');
        it('debuff skills apply stat stage changes to enemy');
        it('lifesteal heals for specified % of damage dealt');
        it('hybrid skills apply both damage AND secondary effect');
    });

    // Secondary Effects
    describe('secondaryEffects', () => {
        it('status effect only rolls if primary attack hits');
        it('missed attack = no status effect roll');
        it('status chance is percentage (30% = 30/100)');
    });

    // Ignores Stages Mechanic
    describe('ignoresStages', () => {
        it('ignores enemy DEF stages (treats as 0)');
        it('attacker ATK stages still apply');
        it('critical hits also ignore DEF stages');
    });
});
```

### Skill Unlocking (`test/skill-unlocking.test.ts`)

```typescript
describe('Skill Unlocking', () => {
    describe('levelMilestones', () => {
        it('unlocks L5 skill at level 5');
        it('unlocks L8 skill at level 8');
        it('unlocks L13 skill at level 13');
        it('unlocks L18 skill at level 18');
        it('unlocks L23 skill at level 23');
        it('unlocks L28 skill at level 28');
        it('unlocks L33 skill at level 33');
        it('unlocks L38 skill at level 38');
    });

    describe('universalSkills', () => {
        it('all classes get Meditate at level 1');
        it('Meditate is auto-equipped at character creation');
    });

    describe('classRestrictions', () => {
        it('Warrior cannot learn Paladin skills');
        it('skill requires matching class in requiredClass array');
    });

    describe('autoEquip', () => {
        it('newly unlocked skill auto-equips if < 5 equipped');
        it('does not auto-equip if 5 already equipped');
    });
});
```

### Turn Order (`test/turn-order.test.ts`)

```typescript
describe('Turn Order', () => {
    describe('speedComparison', () => {
        it('higher speed goes first');
        it('equal speed: 50/50 random');
        it('speed stages apply to comparison');
        it('+6 speed stage = 11.39x effective speed');
    });

    describe('oneActionPerRound', () => {
        it('each combatant gets exactly 1 action per round');
        it('no multiple attacks from high speed');
    });
});
```

---

## Integration Tests

### Battle Flow (`test/battle-flow.test.ts`)

```typescript
describe('Battle Flow Integration', () => {
    it('starts battle with stages at 0');
    it('starts battle with status effects from previous battle');
    it('ends battle with correct state (victory/defeat/retreat)');
    it('persists HP/Mana after victory');
    it('persists status effects after victory');
    it('resets stages after battle end');
    it('skill button opens skill picker');
    it('skill usage triggers correct effects');
    it('monster AI selects from skill pool');
});
```

### Migration (`test/migration.test.ts`)

```typescript
describe('Migration', () => {
    describe('characterMigration', () => {
        it('adds skills field to existing character');
        it('unlocks correct skills for current level');
        it('equips up to 5 skills by default');
        it('level 40 character has all 5 slots filled');
        it('preserves all existing character data');
        it('bumps schemaVersion correctly');
    });

    describe('monsterMigration', () => {
        it('adds skills array to monster');
        it('adds battleState to monster');
    });
});
```

---

## Balance Testing

### Win Rate Targets

| Encounter Type | Target Win Rate |
|----------------|-----------------|
| Overworld (same level) | 60-75% |
| Elite (same level) | 45-55% |
| Boss (same level) | 35-50% |
| Overworld (-3 levels) | 85-95% |
| Overworld (+3 levels) | 25-40% |

### Per-Class Metrics

For each of the 7 classes, measure:
- Win rate vs each of 19 monster templates
- Average turns to victory
- Average HP remaining after victory
- Average Mana remaining after victory
- Most used skills (should be varied, not >80% single skill)
- Skill usage variety (how many different skills used)

### Balance Red Flags

- ❌ Any class with <45% win rate at same level
- ❌ Any class with >80% win rate at same level
- ❌ Any skill used in >80% of turns
- ❌ Any skill never used
- ❌ Average battle length <3 turns or >10 turns

---

## Edge Cases

### Critical Edge Cases to Test

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-01 | Use buff at +6 stage | "Won't go higher!", no mana consumed |
| EC-02 | Use debuff at -6 stage | "Won't go lower!", no mana consumed |
| EC-03 | Heal while Cursed | Healing blocked, message shown |
| EC-04 | Self-cure Sleep | Blocked (hard CC) |
| EC-05 | Self-cure Burn | Allowed (soft status) |
| EC-06 | DoT kills target | Normal death flow, winner declared |
| EC-07 | Fire attack + Frozen target | Freeze removed before damage |
| EC-08 | 0 mana + Meditate | Allowed (0 cost) |
| EC-09 | Once-per-battle after retreat | Reset, can use again next battle |
| EC-10 | Status persist through multiple fights | Status stays, Long Rest clears |
| EC-11 | Battle crash/recovery | Skills state restored from localStorage |
| EC-12 | Level up 4→5 unlocks first skill | Skill unlocked, notification shown |
| EC-13 | Rapid level-up (4→10) | All milestone skills unlocked |
| EC-14 | Confusion self-hit | 25% chance, damages self |
| EC-15 | Paralyze skip turn | 25% chance per turn |
| EC-16 | Same status refreshes duration | Duration reset, not stacked |

---

## Manual Testing Checklist

### Battle UI

- [ ] Skills button visible in action bar
- [ ] Skill picker opens when clicked
- [ ] Equipped skills shown with icons
- [ ] Mana costs displayed on each skill
- [ ] Disabled skills are grayed with reason
- [ ] Once-per-battle shows "Used" after use
- [ ] Stage badges appear when stages change (+2 ATK, -1 DEF)
- [ ] Status icons appear on combatant portraits
- [ ] Type effectiveness messages show ("SUPER EFFECTIVE!")

### Character Sheet

- [ ] Skills tab appears in character sheet
- [ ] All unlocked skills listed
- [ ] Equipped skills marked with badge
- [ ] "Edit Loadout" button works
- [ ] Loadout modal shows 5 slots
- [ ] Can drag/click to equip/unequip
- [ ] Changes save correctly
- [ ] Next skill preview shows correct level

### Skill Execution

- [ ] Damage skills deal correct damage
- [ ] Heal skills restore correct HP
- [ ] Meditate restores 33% mana
- [ ] Buff/debuff apply stage changes
- [ ] Status effects appear on target
- [ ] Log messages describe skill effects
- [ ] Animation plays on skill use

### Monster Skills

- [ ] Monsters use skills (not just basic attack)
- [ ] Elite/Boss have stronger skills
- [ ] AI makes reasonable choices
- [ ] Monster skills logged correctly

### Persistence

- [ ] HP persists after battle
- [ ] Mana persists after battle
- [ ] Status persists after battle
- [ ] Stages reset after battle
- [ ] Long Rest clears status
- [ ] Long Rest restores mana to full
- [ ] Once-per-battle resets after any battle end

---

## Test Execution Commands

```bash
# Run all skills-related tests
npm test -- --grep "Stage|Status|Type|Skill|Turn"

# Run balance simulation (when implemented)
npm run test:balance

# Run specific test file
npm test test/stage-system.test.ts
```

---

**Last Updated:** 2026-01-29
