/**
 * Elite Balance Simulation Test
 * Run with: npm test -- test/elite-balance.test.ts --reporter=verbose
 */

import { describe, it } from 'vitest';

// =====================
// CONFIGURATION (from combatConfig.ts)
// =====================

const BASE_MONSTER_POWER = 1.12;
const BASE_HP = 200;
const HP_PER_CON = 2;
const HP_PER_CON_TANK = 1;
const HP_PER_LEVEL = 10;
const DODGE_PER_DEX = 0.25;
const DODGE_CAP = 25;
const CRIT_PER_DEX = 0.5;
const CRIT_MULTIPLIER = 2.0;

const MONSTER_TIER_CONFIG = {
    overworld: { hp: 1.0, atk: 1.0, def: 1.0, crit: 5, prefix: '' },
    elite: { hp: 1.05, atk: 1.02, def: 1.0, crit: 6, prefix: 'Elite ' },  // V3 FINAL: slightly harder than overworld
    dungeon: { hp: 1.02, atk: 1.01, def: 1.0, crit: 5, prefix: 'Dungeon ' },
    boss: { hp: 1.06, atk: 1.04, def: 1.0, crit: 6, prefix: 'Boss: ' },
    raid_boss: { hp: 1.1, atk: 1.06, def: 1.0, crit: 6, prefix: 'RAID BOSS: ' },
};

type MonsterTier = keyof typeof MONSTER_TIER_CONFIG;

function getMonsterPowerMultiplier(level: number): number {
    if (level <= 3) return 0.92;
    if (level <= 5) return 0.89;
    if (level <= 12) return 0.91;
    if (level <= 19) return 0.95;
    if (level <= 29) return 0.98;
    if (level <= 32) return 0.91;
    if (level <= 35) return 0.93;
    return 0.94;
}

const TIER_MULTIPLIERS: Record<string, number> = {
    common: 0.5, adept: 1.0, journeyman: 1.5, master: 2.0, epic: 2.5, legendary: 3.0,
};

function getExpectedTierForLevel(level: number): string {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

type CharacterClass = 'warrior' | 'paladin' | 'technomancer' | 'scholar' | 'rogue' | 'cleric' | 'bard';
type AttackStyle = 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';
type StatType = 'strength' | 'intelligence' | 'wisdom' | 'constitution' | 'dexterity' | 'charisma';

interface ClassConfig {
    primaryStats: [StatType, StatType];
    attackStyle: AttackStyle;
    damageModifier: number;
    hpModifier: number;
}

const CLASS_CONFIG: Record<CharacterClass, ClassConfig> = {
    warrior: { primaryStats: ['strength', 'constitution'], attackStyle: 'physical', damageModifier: 1.0, hpModifier: 1.1 },
    paladin: { primaryStats: ['strength', 'wisdom'], attackStyle: 'hybrid_physical', damageModifier: 1.1, hpModifier: 1.05 },
    technomancer: { primaryStats: ['intelligence', 'dexterity'], attackStyle: 'magic', damageModifier: 1.15, hpModifier: 1.0 },
    scholar: { primaryStats: ['intelligence', 'wisdom'], attackStyle: 'magic', damageModifier: 1.1, hpModifier: 1.15 },
    rogue: { primaryStats: ['dexterity', 'charisma'], attackStyle: 'physical', damageModifier: 1.15, hpModifier: 1.0 },
    cleric: { primaryStats: ['wisdom', 'constitution'], attackStyle: 'magic', damageModifier: 1.0, hpModifier: 1.1 },
    bard: { primaryStats: ['charisma', 'dexterity'], attackStyle: 'hybrid_magic', damageModifier: 1.1, hpModifier: 1.05 },
};

function getLevelModifier(cls: CharacterClass, level: number): { damage: number; hp: number } {
    let damage = 1.0, hp = 1.0;
    if (cls === 'warrior') { hp = 1.1; if (level >= 18 && level <= 22) damage = 1.15; else if (level >= 15) damage = 0.85; }
    if (cls === 'cleric') { hp = 1.1; if (level >= 13 && level <= 17) damage = 1.2; else if (level >= 18 && level <= 22) damage = 1.15; else if (level >= 23) damage = 0.85; }
    if (cls === 'technomancer' || cls === 'rogue') { if (level >= 3 && level <= 7) { damage = 1.3; hp = 1.15; } else if (level >= 20) damage = 0.85; }
    if (cls === 'paladin') { if (level >= 3 && level <= 7) { damage = 1.4; hp = 1.2; } else if (level >= 8 && level <= 12) { damage = 1.35; hp = 1.15; } else if (level >= 18 && level <= 22) { damage = 1.25; hp = 1.1; } else if (level >= 23) damage = 0.9; }
    if (cls === 'bard') { if (level >= 3 && level <= 7) { damage = 1.4; hp = 1.2; } else if (level >= 20) damage = 0.9; }
    if (cls === 'scholar') { hp = 1.1; if (level >= 20) damage = 0.9; }
    return { damage, hp };
}

function getStatsAtLevel(characterClass: CharacterClass, level: number): Record<StatType, number> {
    const { primaryStats } = CLASS_CONFIG[characterClass];
    const [primary1, primary2] = primaryStats;
    const stats: Record<StatType, number> = { strength: 10, intelligence: 10, wisdom: 10, constitution: 10, dexterity: 10, charisma: 10 };
    stats[primary1] += 2; stats[primary2] += 2;
    for (let lvl = 2; lvl <= level; lvl++) {
        const primaryGain = Math.floor(2 + (lvl * 0.5));
        const secondaryGain = Math.floor(1 + (lvl * 0.25));
        stats[primary1] += primaryGain; stats[primary2] += primaryGain;
        for (const stat of Object.keys(stats) as StatType[]) { if (stat !== primary1 && stat !== primary2) stats[stat] += secondaryGain; }
    }
    return stats;
}

function getGearStats(level: number, attackStyle: AttackStyle) {
    const tier = getExpectedTierForLevel(level);
    const tierMult = TIER_MULTIPLIERS[tier];
    const baseStat = Math.floor((level * 3) + (tierMult * level));
    const isHybrid = attackStyle.startsWith('hybrid');
    const isPhysical = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const isMagic = attackStyle === 'magic' || attackStyle === 'hybrid_magic';
    return {
        physicalAttack: isHybrid || isPhysical ? baseStat : Math.floor(baseStat * 0.4),
        magicAttack: isHybrid || isMagic ? baseStat : Math.floor(baseStat * 0.4),
        defense: Math.floor(baseStat * 0.6),
        magicDefense: Math.floor(baseStat * 0.5),
        hpBonus: Math.floor(baseStat * 1.2),
    };
}

interface CombatStats {
    maxHP: number; currentHP: number; physicalAttack: number; magicAttack: number;
    defense: number; magicDefense: number; critChance: number; dodgeChance: number;
    attackStyle: AttackStyle; damageModifier: number;
}

function deriveCombatStats(cls: CharacterClass, stats: Record<StatType, number>, level: number, gear: ReturnType<typeof getGearStats>, damageMod: number, hpMod: number): CombatStats {
    const isTank = cls === 'warrior' || cls === 'cleric';
    const conMult = isTank ? HP_PER_CON_TANK : HP_PER_CON;
    const baseHP = BASE_HP + (stats.constitution * conMult) + (level * HP_PER_LEVEL) + gear.hpBonus;
    return {
        maxHP: Math.floor(baseHP * hpMod), currentHP: Math.floor(baseHP * hpMod),
        physicalAttack: Math.max(stats.strength, stats.dexterity) + gear.physicalAttack,
        magicAttack: Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack,
        defense: Math.floor(stats.constitution / 2) + gear.defense,
        magicDefense: Math.floor(stats.wisdom / 2) + gear.magicDefense,
        critChance: stats.dexterity * CRIT_PER_DEX,
        dodgeChance: Math.min(DODGE_CAP, stats.dexterity * DODGE_PER_DEX),
        attackStyle: CLASS_CONFIG[cls].attackStyle,
        damageModifier: damageMod,
    };
}

interface Monster { name: string; level: number; maxHP: number; currentHP: number; attack: number; defense: number; magicDefense: number; dodgeChance: number; critChance: number; }

const MONSTER_TEMPLATES = [
    { name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDef: 5 },
    { name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDef: 6 },
    { name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDef: 4 },
    { name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDef: 6 },
];

function createMonster(templateIndex: number, level: number, tier: MonsterTier): Monster {
    const template = MONSTER_TEMPLATES[templateIndex];
    let hp = template.baseHP, atk = template.baseAttack, def = template.baseDefense, mdef = template.baseMagicDef;
    for (let lvl = 2; lvl <= level; lvl++) {
        const mult = 1 + (lvl * 0.075);
        hp += Math.floor(24 * mult); atk += Math.floor(8 * mult); def += Math.floor(3.5 * mult); mdef += Math.floor(3.5 * mult);
    }
    const powerMult = getMonsterPowerMultiplier(level) * BASE_MONSTER_POWER;
    hp = Math.floor(hp * powerMult); atk = Math.floor(atk * powerMult);
    const tierConfig = MONSTER_TIER_CONFIG[tier];
    hp = Math.floor(hp * tierConfig.hp); atk = Math.floor(atk * tierConfig.atk); def = Math.floor(def * tierConfig.def); mdef = Math.floor(mdef * tierConfig.def);

    return { name: tierConfig.prefix + template.name, level, maxHP: hp, currentHP: hp, attack: atk, defense: def, magicDefense: mdef, dodgeChance: Math.min(15, 5 + level * 0.2), critChance: tierConfig.crit };
}

function calculateDamage(attack: number, defense: number): number {
    const reduction = Math.min(0.75, defense / (100 + defense));
    return Math.max(1, Math.floor(attack * (1 - reduction)));
}

function simulateBattle(player: CombatStats, monster: Monster): boolean {
    let playerHP = player.currentHP, monsterHP = monster.currentHP, turns = 0;
    while (playerHP > 0 && monsterHP > 0 && turns < 50) {
        turns++;
        let playerAtk: number, monsterDef: number;
        if (player.attackStyle === 'magic') { playerAtk = player.magicAttack; monsterDef = monster.magicDefense; }
        else if (player.attackStyle === 'hybrid_physical') { playerAtk = Math.floor(player.physicalAttack * 0.7 + player.magicAttack * 0.3); monsterDef = Math.floor(monster.defense * 0.7 + monster.magicDefense * 0.3); }
        else if (player.attackStyle === 'hybrid_magic') { playerAtk = Math.floor(player.physicalAttack * 0.3 + player.magicAttack * 0.7); monsterDef = Math.floor(monster.defense * 0.3 + monster.magicDefense * 0.7); }
        else { playerAtk = player.physicalAttack; monsterDef = monster.defense; }
        playerAtk = Math.floor(playerAtk * player.damageModifier);
        if (Math.random() * 100 >= monster.dodgeChance) {
            let damage = calculateDamage(playerAtk, monsterDef);
            if (Math.random() * 100 < player.critChance) damage = Math.floor(damage * CRIT_MULTIPLIER);
            damage = Math.floor(damage + (Math.random() * 2 - 1) * damage * 0.1);
            monsterHP -= Math.max(1, damage);
        }
        if (monsterHP <= 0) break;
        if (Math.random() * 100 >= player.dodgeChance) {
            let damage = calculateDamage(monster.attack, player.defense);
            if (Math.random() * 100 < monster.critChance) damage = Math.floor(damage * 1.5);
            damage = Math.floor(damage + (Math.random() * 2 - 1) * damage * 0.1);
            playerHP -= Math.max(1, damage);
        }
    }
    return playerHP > 0;
}

function runSimulation(cls: CharacterClass, level: number, tier: MonsterTier, battles = 300): number {
    const classConfig = CLASS_CONFIG[cls];
    const stats = getStatsAtLevel(cls, level);
    const gear = getGearStats(level, classConfig.attackStyle);
    const levelMod = getLevelModifier(cls, level);
    let damageMod = classConfig.damageModifier * levelMod.damage;
    if (tier === 'raid_boss' && (cls === 'warrior' || cls === 'cleric')) damageMod *= 0.85;
    const player = deriveCombatStats(cls, stats, level, gear, damageMod, classConfig.hpModifier * levelMod.hp);
    let wins = 0;
    for (let i = 0; i < battles; i++) {
        const monster = createMonster(Math.floor(Math.random() * MONSTER_TEMPLATES.length), level, tier);
        player.currentHP = player.maxHP;
        if (simulateBattle(player, monster)) wins++;
    }
    return Math.round((wins / battles) * 100);
}

// =====================
// TESTS
// =====================

const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];

describe('OVERWORLD Balance (Target: 40-80%)', () => {
    it.only('generates win rate table', () => {
        console.log('\n=== OVERWORLD (Target: 40-80%) ===');
        console.log('Class          L1    L5   L10   L15   L20   L25   L30   L35   L40');
        console.log('-------------------------------------------------------------------');
        for (const cls of classes) {
            const r = [1, 5, 10, 15, 20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'overworld'));
            console.log(cls.padEnd(12) + r.map(x => (x + '%').padStart(6)).join(''));
        }
    });
});

describe('ELITE Balance (Target: 35-70%)', () => {
    it.only('generates win rate table', () => {
        console.log('\n=== ELITE (Target: 35-70%) - Current: HPx1.3, ATKx1.2, DEFx1.1 ===');
        console.log('Class          L5   L10   L15   L20   L25   L30   L35   L40');
        console.log('--------------------------------------------------------------');
        for (const cls of classes) {
            const r = [5, 10, 15, 20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'elite'));
            console.log(cls.padEnd(12) + r.map(x => (x + '%').padStart(6)).join(''));
        }
    });
});

describe('DUNGEON Balance (Target: 35-65%)', () => {
    it.only('generates win rate table', () => {
        console.log('\n=== DUNGEON (Target: 35-65%) ===');
        console.log('Class         L15   L20   L25   L30   L35   L40');
        console.log('------------------------------------------------');
        for (const cls of classes) {
            const r = [15, 20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'dungeon'));
            console.log(cls.padEnd(12) + r.map(x => (x + '%').padStart(6)).join(''));
        }
    });
});

describe('BOSS Balance (Target: 30-55%)', () => {
    it.only('generates win rate table', () => {
        console.log('\n=== BOSS (Target: 30-55%) ===');
        console.log('Class         L15   L20   L25   L30   L35   L40');
        console.log('------------------------------------------------');
        for (const cls of classes) {
            const r = [15, 20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'boss'));
            console.log(cls.padEnd(12) + r.map(x => (x + '%').padStart(6)).join(''));
        }
    });
});

describe('RAID BOSS Balance (Target: 25-45%)', () => {
    it.only('generates win rate table', () => {
        console.log('\n=== RAID BOSS (Target: 25-45%) ===');
        console.log('Class         L30   L35   L40');
        console.log('------------------------------');
        for (const cls of classes) {
            const r = [30, 35, 40].map(l => runSimulation(cls, l, 'raid_boss'));
            console.log(cls.padEnd(12) + r.map(x => (x + '%').padStart(6)).join(''));
        }
    });
});
