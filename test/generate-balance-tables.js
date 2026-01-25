/**
 * Standalone Combat Balance Table Generator
 * Run with: node test/generate-balance-tables.js
 * 
 * This extracts the simulation logic from combat-simulator.test.ts
 * and outputs markdown-formatted tables.
 */

const fs = require('fs');

// =====================
// CHARACTER SYSTEM (from combat-simulator.test.ts)
// =====================

const CLASS_INFO = {
    warrior: {
        primaryStats: ['strength', 'constitution'],
        attackStyle: 'physical',
        damageModifier: 1.0,
        hpModifier: 1.1,
    },
    paladin: {
        primaryStats: ['strength', 'wisdom'],
        attackStyle: 'hybrid_physical',
        damageModifier: 1.1,
        hpModifier: 1.05,
    },
    technomancer: {
        primaryStats: ['intelligence', 'dexterity'],
        attackStyle: 'magic',
        damageModifier: 1.15,
        hpModifier: 1.0,
    },
    scholar: {
        primaryStats: ['intelligence', 'wisdom'],
        attackStyle: 'magic',
        damageModifier: 1.1,
        hpModifier: 1.15,
    },
    rogue: {
        primaryStats: ['dexterity', 'charisma'],
        attackStyle: 'physical',
        damageModifier: 1.15,
        hpModifier: 1.0,
    },
    cleric: {
        primaryStats: ['wisdom', 'constitution'],
        attackStyle: 'magic',
        damageModifier: 1.0,
        hpModifier: 1.1,
    },
    bard: {
        primaryStats: ['charisma', 'dexterity'],
        attackStyle: 'hybrid_magic',
        damageModifier: 1.1,
        hpModifier: 1.05,
    },
};

function getLevelModifier(cls, level) {
    let damage = 1.0;
    let hp = 1.0;

    if (cls === 'warrior') {
        hp = 1.1;
        if (level >= 18 && level <= 22) {
            damage = 1.15;
        } else if (level >= 15) {
            damage = 0.85;
        }
    }
    if (cls === 'cleric') {
        hp = 1.1;
        if (level >= 13 && level <= 17) {
            damage = 1.2;
        } else if (level >= 18 && level <= 22) {
            damage = 1.15;
        } else if (level >= 23) {
            damage = 0.85;
        }
    }
    if (cls === 'technomancer' || cls === 'rogue') {
        if (level >= 3 && level <= 7) {
            damage = 1.3;
            hp = 1.15;
        } else if (level >= 20) {
            damage = 0.85;
        }
    }
    if (cls === 'paladin') {
        if (level >= 3 && level <= 7) {
            damage = 1.4;
            hp = 1.2;
        } else if (level >= 8 && level <= 12) {
            damage = 1.35;
            hp = 1.15;
        } else if (level >= 18 && level <= 22) {
            damage = 1.25;
            hp = 1.1;
        } else if (level >= 23) {
            damage = 0.9;
        }
    }
    if (cls === 'bard') {
        if (level >= 3 && level <= 7) {
            damage = 1.4;
            hp = 1.2;
        } else if (level >= 20) {
            damage = 0.9;
        }
    }
    if (cls === 'scholar') {
        hp = 1.1;
        if (level >= 20) {
            damage = 0.9;
        }
    }

    return { damage, hp };
}

function getStatsAtLevel(characterClass, level) {
    const { primaryStats } = CLASS_INFO[characterClass];
    const [primary1, primary2] = primaryStats;

    const stats = {
        strength: 10,
        intelligence: 10,
        wisdom: 10,
        constitution: 10,
        dexterity: 10,
        charisma: 10,
    };
    stats[primary1] += 2;
    stats[primary2] += 2;

    for (let lvl = 2; lvl <= level; lvl++) {
        const primaryGain = Math.floor(2 + (lvl * 0.5));
        const secondaryGain = Math.floor(1 + (lvl * 0.25));

        stats[primary1] += primaryGain;
        stats[primary2] += primaryGain;

        const allStats = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];
        for (const stat of allStats) {
            if (stat !== primary1 && stat !== primary2) {
                stats[stat] += secondaryGain;
            }
        }
    }

    return stats;
}

// =====================
// GEAR SYSTEM
// =====================

const TIER_MULTIPLIERS = {
    common: 0.5,
    adept: 1.0,
    journeyman: 1.5,
    master: 2.0,
    epic: 2.5,
    legendary: 3.0,
};

function getExpectedTierForLevel(level) {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

function calculateGearStatValue(gearLevel, tier) {
    const tierMult = TIER_MULTIPLIERS[tier];
    return Math.floor((gearLevel * 3) + (tierMult * gearLevel));
}

function getFullGearStats(level, attackStyle) {
    const tier = getExpectedTierForLevel(level);
    const baseStat = calculateGearStatValue(level, tier);

    const isHybrid = attackStyle === 'hybrid_physical' || attackStyle === 'hybrid_magic';
    const isPhysicalFocused = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const isMagicFocused = attackStyle === 'magic' || attackStyle === 'hybrid_magic';

    return {
        physicalAttack: isHybrid || isPhysicalFocused ? baseStat : Math.floor(baseStat * 0.4),
        magicAttack: isHybrid || isMagicFocused ? baseStat : Math.floor(baseStat * 0.4),
        defense: Math.floor(baseStat * 0.6),
        magicDefense: Math.floor(baseStat * 0.5),
        hpBonus: Math.floor(baseStat * 1.2),
    };
}

// =====================
// COMBAT STATS
// =====================

function deriveCombatStats(stats, level, gear, attackStyle, damageModifier = 1.0, hpModifier = 1.0) {
    const baseHP = 50 + (stats.constitution * 5) + (level * 10) + gear.hpBonus;
    const maxHP = Math.floor(baseHP * hpModifier);

    const physicalAttack = Math.max(stats.strength, stats.dexterity) + gear.physicalAttack;
    const magicAttack = Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack;
    const defense = Math.floor(stats.constitution / 2) + gear.defense;
    const magicDefense = Math.floor(stats.wisdom / 2) + gear.magicDefense;
    const critChance = stats.dexterity * 0.5;
    const dodgeChance = Math.min(25, stats.dexterity * 0.5);

    return {
        maxHP,
        currentHP: maxHP,
        physicalAttack,
        magicAttack,
        defense,
        magicDefense,
        critChance,
        critMultiplier: 2.0,
        dodgeChance,
        attackStyle,
        damageModifier,
    };
}

// =====================
// MONSTER SYSTEM
// =====================

const MONSTER_TEMPLATES = [
    { id: 'goblin', name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDef: 5 },
    { id: 'skeleton', name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDef: 6 },
    { id: 'wolf', name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDef: 4 },
    { id: 'troll', name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDef: 6 },
];

function createMonster(template, level, tier = 'overworld') {
    let hp = template.baseHP;
    let atk = template.baseAttack;
    let def = template.baseDefense;
    let mdef = template.baseMagicDef;

    for (let lvl = 2; lvl <= level; lvl++) {
        const multiplier = 1 + (lvl * 0.075);
        hp += Math.floor(24 * multiplier);
        atk += Math.floor(8 * multiplier);
        def += Math.floor(3.5 * multiplier);
        mdef += Math.floor(3.5 * multiplier);
    }

    let critBonus = 5;

    switch (tier) {
        case 'elite':
            hp = Math.floor(hp * 1.3);
            atk = Math.floor(atk * 1.2);
            def = Math.floor(def * 1.1);
            mdef = Math.floor(mdef * 1.1);
            critBonus = 10;
            break;
        case 'dungeon':
            hp = Math.floor(hp * 1.05);
            critBonus = 5;
            break;
        case 'boss':
            hp = Math.floor(hp * 1.15);
            atk = Math.floor(atk * 1.05);
            critBonus = 6;
            break;
        case 'raid_boss':
            hp = Math.floor(hp * 1.2);
            atk = Math.floor(atk * 1.05);
            critBonus = 6;
            break;
    }

    return {
        id: template.id,
        name: template.name,
        level,
        maxHP: hp,
        currentHP: hp,
        attack: atk,
        defense: def,
        magicDefense: mdef,
        dodgeChance: Math.min(15, 5 + level * 0.2),
        critChance: critBonus,
    };
}

// =====================
// COMBAT SYSTEM
// =====================

function calculateDamage(attackPower, attackerCrit, attackerCritMult, defenderDefense, defenderDodge) {
    if (Math.random() * 100 < defenderDodge) {
        return { damage: 0, result: 'dodge' };
    }

    let damage = attackPower - defenderDefense;
    damage = Math.max(1, damage);

    if (Math.random() * 100 < attackerCrit) {
        damage = Math.floor(damage * attackerCritMult);
        return { damage, result: 'critical' };
    }

    const variance = damage * 0.1;
    damage = Math.floor(damage + (Math.random() * 2 - 1) * variance);
    return { damage: Math.max(1, damage), result: 'hit' };
}

function simulateBattle(player, monster) {
    let playerHP = player.currentHP;
    let monsterHP = monster.currentHP;
    let turns = 0;
    const maxTurns = 50;

    while (playerHP > 0 && monsterHP > 0 && turns < maxTurns) {
        turns++;

        let playerAtk;
        let monsterDef;

        if (player.attackStyle === 'magic') {
            playerAtk = player.magicAttack;
            monsterDef = monster.magicDefense;
        } else if (player.attackStyle === 'hybrid_physical') {
            const physDmg = player.physicalAttack - monster.defense;
            const magDmg = player.magicAttack - monster.magicDefense;
            playerAtk = Math.floor(physDmg * 0.7 + magDmg * 0.3) + monster.defense;
            monsterDef = monster.defense * 0.7 + monster.magicDefense * 0.3;
        } else if (player.attackStyle === 'hybrid_magic') {
            const physDmg = player.physicalAttack - monster.defense;
            const magDmg = player.magicAttack - monster.magicDefense;
            playerAtk = Math.floor(physDmg * 0.3 + magDmg * 0.7) + monster.magicDefense;
            monsterDef = monster.defense * 0.3 + monster.magicDefense * 0.7;
        } else {
            playerAtk = player.physicalAttack;
            monsterDef = monster.defense;
        }

        playerAtk = Math.floor(playerAtk * player.damageModifier);

        const pDmg = calculateDamage(playerAtk, player.critChance, player.critMultiplier, monsterDef, monster.dodgeChance);
        monsterHP -= pDmg.damage;

        if (monsterHP <= 0) break;

        const mDmg = calculateDamage(monster.attack, monster.critChance, 1.5, player.defense, player.dodgeChance);
        playerHP -= mDmg.damage;
    }

    return { playerWon: playerHP > 0, turns };
}

function runSimulation(characterClass, playerLevel, monsterLevel, battles = 500, tier = 'overworld') {
    const classInfo = CLASS_INFO[characterClass];
    const stats = getStatsAtLevel(characterClass, playerLevel);
    const gear = getFullGearStats(playerLevel, classInfo.attackStyle);

    const levelMod = getLevelModifier(characterClass, playerLevel);
    let totalDamageMod = classInfo.damageModifier * levelMod.damage;
    const totalHpMod = classInfo.hpModifier * levelMod.hp;

    if (tier === 'raid_boss' && (characterClass === 'warrior' || characterClass === 'cleric')) {
        totalDamageMod *= 0.85;
    }

    const playerCombat = deriveCombatStats(stats, playerLevel, gear, classInfo.attackStyle, totalDamageMod, totalHpMod);

    let wins = 0;
    let totalTurns = 0;

    for (let i = 0; i < battles; i++) {
        const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
        const monster = createMonster(template, monsterLevel, tier);
        playerCombat.currentHP = playerCombat.maxHP;

        const result = simulateBattle(playerCombat, monster);
        if (result.playerWon) wins++;
        totalTurns += result.turns;
    }

    return {
        winRate: (wins / battles) * 100,
        avgTurns: totalTurns / battles,
    };
}

// =====================
// GENERATE TABLES
// =====================

const classes = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];

let output = '# Combat Balance Tables (v25 Tuned)\n\n';
output += '> **Balance Target:** 50%+ floor win rate for casual, rewarding play\n\n';
output += '---\n\n';

// Overworld Table
console.log('Generating Overworld table...');
output += '## Overworld (Easy Mode)\n\n';
output += '| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |\n';
output += '|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|\n';

for (const cls of classes) {
    const l1 = runSimulation(cls, 1, 1, 500, 'overworld');
    const l5 = runSimulation(cls, 5, 5, 500, 'overworld');
    const l10 = runSimulation(cls, 10, 10, 500, 'overworld');
    const l15 = runSimulation(cls, 15, 15, 500, 'overworld');
    const l20 = runSimulation(cls, 20, 20, 500, 'overworld');
    const l30 = runSimulation(cls, 30, 30, 500, 'overworld');
    const l40 = runSimulation(cls, 40, 40, 500, 'overworld');

    const name = cls.charAt(0).toUpperCase() + cls.slice(1);
    output += `| ${name} | ${l1.winRate.toFixed(0)}% | ${l5.winRate.toFixed(0)}% | ${l10.winRate.toFixed(0)}% | ${l15.winRate.toFixed(0)}% | ${l20.winRate.toFixed(0)}% | ${l30.winRate.toFixed(0)}% | ${l40.winRate.toFixed(0)}% |\n`;
    console.log(`  ${cls} done`);
}

output += '\n---\n\n';

// Dungeon Table
console.log('Generating Dungeon table...');
output += '## Dungeon (Medium Mode)\n\n';
output += '| Class | L20 | L25 | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|:---:|:---:|\n';

for (const cls of classes) {
    const l20 = runSimulation(cls, 20, 20, 500, 'dungeon');
    const l25 = runSimulation(cls, 25, 25, 500, 'dungeon');
    const l30 = runSimulation(cls, 30, 30, 500, 'dungeon');
    const l35 = runSimulation(cls, 35, 35, 500, 'dungeon');
    const l40 = runSimulation(cls, 40, 40, 500, 'dungeon');

    const name = cls.charAt(0).toUpperCase() + cls.slice(1);
    output += `| ${name} | ${l20.winRate.toFixed(0)}% | ${l25.winRate.toFixed(0)}% | ${l30.winRate.toFixed(0)}% | ${l35.winRate.toFixed(0)}% | ${l40.winRate.toFixed(0)}% |\n`;
    console.log(`  ${cls} done`);
}

output += '\n---\n\n';

// Boss Table
console.log('Generating Boss table...');
output += '## Boss Encounters (Hard Mode)\n\n';
output += '| Class | L20 | L25 | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|:---:|:---:|\n';

for (const cls of classes) {
    const l20 = runSimulation(cls, 20, 20, 500, 'boss');
    const l25 = runSimulation(cls, 25, 25, 500, 'boss');
    const l30 = runSimulation(cls, 30, 30, 500, 'boss');
    const l35 = runSimulation(cls, 35, 35, 500, 'boss');
    const l40 = runSimulation(cls, 40, 40, 500, 'boss');

    const name = cls.charAt(0).toUpperCase() + cls.slice(1);
    output += `| ${name} | ${l20.winRate.toFixed(0)}% | ${l25.winRate.toFixed(0)}% | ${l30.winRate.toFixed(0)}% | ${l35.winRate.toFixed(0)}% | ${l40.winRate.toFixed(0)}% |\n`;
    console.log(`  ${cls} done`);
}

output += '\n---\n\n';

// Raid Boss Table
console.log('Generating Raid Boss table...');
output += '## Raid Boss (Brutal Mode)\n\n';
output += '> Tanks (Warrior, Cleric) receive a -15% damage penalty in raids\n\n';
output += '| Class | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|\n';

for (const cls of classes) {
    const l30 = runSimulation(cls, 30, 30, 500, 'raid_boss');
    const l35 = runSimulation(cls, 35, 35, 500, 'raid_boss');
    const l40 = runSimulation(cls, 40, 40, 500, 'raid_boss');

    const name = cls.charAt(0).toUpperCase() + cls.slice(1);
    output += `| ${name} | ${l30.winRate.toFixed(0)}% | ${l35.winRate.toFixed(0)}% | ${l40.winRate.toFixed(0)}% |\n`;
    console.log(`  ${cls} done`);
}

output += '\n---\n\n';
output += '*Generated from combat-simulator v25 balance | ' + new Date().toISOString().split('T')[0] + '*\n';

// Write to file
fs.writeFileSync('docs/rpg-dev-aspects/Combat Balance Tables.md', output);
console.log('\n✅ Written to docs/rpg-dev-aspects/Combat Balance Tables.md');
