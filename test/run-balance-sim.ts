/**
 * Combat Simulator v26 - File Output Version
 * Run this to generate balance-results.md
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================
// MIRROR PRODUCTION CODE
// =====================

type GearTier = 'common' | 'adept' | 'journeyman' | 'master' | 'epic' | 'legendary';

const TIER_INFO: Record<GearTier, { statMultiplier: number }> = {
    common: { statMultiplier: 0.5 },
    adept: { statMultiplier: 1.0 },
    journeyman: { statMultiplier: 1.5 },
    master: { statMultiplier: 2.0 },
    epic: { statMultiplier: 2.5 },
    legendary: { statMultiplier: 3.0 },
};

function calculateBaseStatValue(gearLevel: number, tier: GearTier): number {
    const tierMultiplier = TIER_INFO[tier].statMultiplier;
    const baseValue = (gearLevel * 3) + (tierMultiplier * gearLevel);
    return Math.floor(baseValue);
}

function getExpectedTierForLevel(level: number): GearTier {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

interface CharacterStats {
    strength: number;
    intelligence: number;
    wisdom: number;
    constitution: number;
    dexterity: number;
    charisma: number;
}

type CharacterClass = 'warrior' | 'paladin' | 'technomancer' | 'scholar' | 'rogue' | 'cleric' | 'bard';
type StatType = keyof CharacterStats;
type AttackStyle = 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';

interface ClassDefinition {
    primaryStats: [StatType, StatType];
    attackStyle: AttackStyle;
    damageModifier: number;
    hpModifier: number;
}

const CLASS_INFO: Record<CharacterClass, ClassDefinition> = {
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

function getStatsAtLevel(characterClass: CharacterClass, level: number): CharacterStats {
    const { primaryStats } = CLASS_INFO[characterClass];
    const [primary1, primary2] = primaryStats;
    const stats: CharacterStats = { strength: 10, intelligence: 10, wisdom: 10, constitution: 10, dexterity: 10, charisma: 10 };
    stats[primary1] += 2;
    stats[primary2] += 2;
    for (let lvl = 2; lvl <= level; lvl++) {
        const primaryGain = Math.floor(2 + (lvl * 0.5));
        const secondaryGain = Math.floor(1 + (lvl * 0.25));
        stats[primary1] += primaryGain;
        stats[primary2] += primaryGain;
        const allStats: StatType[] = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];
        for (const stat of allStats) { if (stat !== primary1 && stat !== primary2) stats[stat] += secondaryGain; }
    }
    return stats;
}

interface GearStats { physicalAttack: number; magicAttack: number; defense: number; magicDefense: number; hpBonus: number; }

function getFullGearStats(level: number, attackStyle: AttackStyle): GearStats {
    const tier = getExpectedTierForLevel(level);
    const primaryValue = calculateBaseStatValue(level, tier);
    const weaponAttack = Math.floor(primaryValue * 1.5);
    const shieldDefense = attackStyle === 'physical' || attackStyle === 'hybrid_physical' ? Math.floor(primaryValue * 0.8) : 0;
    const headDefense = Math.floor(primaryValue * 0.4);
    const headMagicDef = Math.floor(primaryValue * 0.5);
    const chestDefense = Math.floor(primaryValue * 0.6);
    const chestMagicDef = Math.floor(primaryValue * 0.3);
    const legsDefense = Math.floor(primaryValue * 0.6);
    const legsMagicDef = Math.floor(primaryValue * 0.3);
    const bootsDefense = Math.floor(primaryValue * 0.3);
    const totalDefense = headDefense + chestDefense + legsDefense + bootsDefense + shieldDefense;
    const totalMagicDef = headMagicDef + chestMagicDef + legsMagicDef;
    const hpFromGear = Math.floor(primaryValue * 2 * 2);
    const isPhysical = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const isMagic = attackStyle === 'magic' || attackStyle === 'hybrid_magic';
    return {
        physicalAttack: isPhysical ? weaponAttack : Math.floor(weaponAttack * 0.3),
        magicAttack: isMagic ? weaponAttack : Math.floor(weaponAttack * 0.3),
        defense: totalDefense,
        magicDefense: totalMagicDef,
        hpBonus: hpFromGear,
    };
}

interface CombatStats { maxHP: number; currentHP: number; physicalAttack: number; magicAttack: number; defense: number; magicDefense: number; critChance: number; critMultiplier: number; dodgeChance: number; blockChance: number; attackStyle: AttackStyle; damageModifier: number; }

function deriveCombatStats(stats: CharacterStats, level: number, gear: GearStats, attackStyle: AttackStyle, damageModifier: number = 1.0, hpModifier: number = 1.0): CombatStats {
    const baseHP = 50 + (stats.constitution * 5) + (level * 10) + gear.hpBonus;
    const maxHP = Math.floor(baseHP * hpModifier);
    const physicalAttack = Math.max(stats.strength, stats.dexterity) + gear.physicalAttack;
    const magicAttack = Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack;
    const defense = Math.floor(stats.constitution / 2) + gear.defense;
    const magicDefense = Math.floor(stats.wisdom / 2) + gear.magicDefense;
    const critChance = stats.dexterity * 0.5;
    const dodgeChance = Math.min(25, stats.dexterity * 0.5);
    const hasShield = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const blockChance = hasShield ? 10 : 0;
    return { maxHP, currentHP: maxHP, physicalAttack, magicAttack, defense, magicDefense, critChance, critMultiplier: 2.0, dodgeChance, blockChance, attackStyle, damageModifier };
}

interface MonsterTemplate { id: string; name: string; baseHP: number; baseAttack: number; baseDefense: number; baseMagicDefense: number; hpGrowth: number; attackGrowth: number; defenseGrowth: number; magicDefGrowth: number; }

const MONSTER_TEMPLATES: MonsterTemplate[] = [
    { id: 'goblin', name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.0, attackGrowth: 1.0, defenseGrowth: 1.0, magicDefGrowth: 1.0 },
    { id: 'wolf', name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDefense: 4, hpGrowth: 1.0, attackGrowth: 1.1, defenseGrowth: 0.9, magicDefGrowth: 0.8 },
    { id: 'skeleton', name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDefense: 6, hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.9, magicDefGrowth: 1.0 },
    { id: 'cave_troll', name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDefense: 6, hpGrowth: 1.3, attackGrowth: 0.9, defenseGrowth: 1.2, magicDefGrowth: 1.0 },
    { id: 'bugbear', name: 'Bugbear', baseHP: 95, baseAttack: 18, baseDefense: 7, baseMagicDefense: 5, hpGrowth: 1.15, attackGrowth: 1.2, defenseGrowth: 1.0, magicDefGrowth: 0.9 },
    { id: 'berserker', name: 'Berserker', baseHP: 85, baseAttack: 19, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.1, attackGrowth: 1.3, defenseGrowth: 0.8, magicDefGrowth: 0.9 },
];

const BASE_HP_GROWTH = 24, BASE_ATTACK_GROWTH = 8, BASE_DEFENSE_GROWTH = 3.5, BASE_MAGIC_DEF_GROWTH = 3.5, BASE_DODGE_CHANCE = 5, DODGE_PER_LEVEL = 0.2;

type MonsterTier = 'overworld' | 'elite' | 'dungeon' | 'boss' | 'raid_boss';

interface MonsterTierConfig { hpMultiplier: number; attackMultiplier: number; defenseMultiplier: number; critBonus: number; }

const MONSTER_TIER_CONFIG: Record<MonsterTier, MonsterTierConfig> = {
    overworld: { hpMultiplier: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, critBonus: 5 },
    elite: { hpMultiplier: 1.3, attackMultiplier: 1.2, defenseMultiplier: 1.1, critBonus: 10 },
    dungeon: { hpMultiplier: 1.05, attackMultiplier: 1.0, defenseMultiplier: 1.0, critBonus: 5 },
    boss: { hpMultiplier: 1.15, attackMultiplier: 1.05, defenseMultiplier: 1.0, critBonus: 6 },
    raid_boss: { hpMultiplier: 1.2, attackMultiplier: 1.05, defenseMultiplier: 1.0, critBonus: 6 },
};

interface Monster { id: string; name: string; level: number; maxHP: number; currentHP: number; attack: number; defense: number; magicDefense: number; dodgeChance: number; critChance: number; }

function createMonster(template: MonsterTemplate, level: number, tier: MonsterTier = 'overworld'): Monster {
    let hp = template.baseHP, attack = template.baseAttack, defense = template.baseDefense, magicDefense = template.baseMagicDefense;
    for (let lvl = 2; lvl <= level; lvl++) {
        const multiplier = 1 + (lvl * 0.075);
        hp += Math.floor(BASE_HP_GROWTH * multiplier * template.hpGrowth);
        attack += Math.floor(BASE_ATTACK_GROWTH * multiplier * template.attackGrowth);
        defense += Math.floor(BASE_DEFENSE_GROWTH * multiplier * template.defenseGrowth);
        magicDefense += Math.floor(BASE_MAGIC_DEF_GROWTH * multiplier * template.magicDefGrowth);
    }
    const tierConfig = MONSTER_TIER_CONFIG[tier];
    hp = Math.floor(hp * tierConfig.hpMultiplier);
    attack = Math.floor(attack * tierConfig.attackMultiplier);
    defense = Math.floor(defense * tierConfig.defenseMultiplier);
    magicDefense = Math.floor(magicDefense * tierConfig.defenseMultiplier);
    const dodgeChance = Math.min(15, BASE_DODGE_CHANCE + level * DODGE_PER_LEVEL);
    return { id: template.id, name: template.name, level, maxHP: hp, currentHP: hp, attack, defense, magicDefense, dodgeChance, critChance: tierConfig.critBonus };
}

function getRandomMonsterTemplate(): MonsterTemplate { return MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)]; }

const MIN_DAMAGE = 1, DAMAGE_VARIANCE = 0.1;

function calculateDamage(attackPower: number, attackerCrit: number, attackerCritMult: number, defenderDefense: number, defenderDodge: number, defenderBlock: number = 0): { damage: number; result: string } {
    if (Math.random() * 100 < defenderDodge) return { damage: 0, result: 'miss' };
    if (defenderBlock > 0 && Math.random() * 100 < defenderBlock) return { damage: Math.max(MIN_DAMAGE, Math.floor((attackPower - defenderDefense) * 0.25)), result: 'blocked' };
    let damage = Math.max(MIN_DAMAGE, attackPower - defenderDefense);
    if (Math.random() * 100 < attackerCrit) return { damage: Math.floor(damage * attackerCritMult), result: 'critical' };
    const variance = damage * DAMAGE_VARIANCE;
    damage = Math.floor(damage + (Math.random() * 2 - 1) * variance);
    return { damage: Math.max(MIN_DAMAGE, damage), result: 'hit' };
}

function simulateBattle(player: CombatStats, monster: Monster): { playerWon: boolean; turns: number } {
    let playerHP = player.currentHP, monsterHP = monster.currentHP, turns = 0;
    while (playerHP > 0 && monsterHP > 0 && turns < 100) {
        turns++;
        let playerAtk: number, monsterDef: number;
        if (player.attackStyle === 'magic') { playerAtk = player.magicAttack; monsterDef = monster.magicDefense; }
        else if (player.attackStyle === 'hybrid_physical') { const p = Math.max(1, player.physicalAttack - monster.defense); const m = Math.max(1, player.magicAttack - monster.magicDefense); playerAtk = Math.floor(p * 0.7 + m * 0.3) + monster.defense; monsterDef = 0; }
        else if (player.attackStyle === 'hybrid_magic') { const p = Math.max(1, player.physicalAttack - monster.defense); const m = Math.max(1, player.magicAttack - monster.magicDefense); playerAtk = Math.floor(p * 0.3 + m * 0.7) + monster.magicDefense; monsterDef = 0; }
        else { playerAtk = player.physicalAttack; monsterDef = monster.defense; }
        playerAtk = Math.floor(playerAtk * player.damageModifier);
        const pDmg = calculateDamage(playerAtk, player.critChance, player.critMultiplier, monsterDef, monster.dodgeChance);
        monsterHP -= pDmg.damage;
        if (monsterHP <= 0) break;
        const mDmg = calculateDamage(monster.attack, monster.critChance, 1.5, player.defense, player.dodgeChance, player.blockChance);
        playerHP -= mDmg.damage;
    }
    return { playerWon: playerHP > 0, turns };
}

function runSimulation(characterClass: CharacterClass, playerLevel: number, monsterLevel: number, battles: number = 500, tier: MonsterTier = 'overworld'): { winRate: number; avgTurns: number } {
    const classInfo = CLASS_INFO[characterClass];
    const stats = getStatsAtLevel(characterClass, playerLevel);
    const gear = getFullGearStats(playerLevel, classInfo.attackStyle);
    const levelMod = getLevelModifier(characterClass, playerLevel);
    let totalDamageMod = classInfo.damageModifier * levelMod.damage;
    const totalHpMod = classInfo.hpModifier * levelMod.hp;
    if (tier === 'raid_boss' && (characterClass === 'warrior' || characterClass === 'cleric')) totalDamageMod *= 0.85;
    const playerCombat = deriveCombatStats(stats, playerLevel, gear, classInfo.attackStyle, totalDamageMod, totalHpMod);
    let wins = 0, totalTurns = 0;
    for (let i = 0; i < battles; i++) {
        const template = getRandomMonsterTemplate();
        const monster = createMonster(template, monsterLevel, tier);
        playerCombat.currentHP = playerCombat.maxHP;
        const result = simulateBattle(playerCombat, monster);
        if (result.playerWon) wins++;
        totalTurns += result.turns;
    }
    return { winRate: (wins / battles) * 100, avgTurns: totalTurns / battles };
}

// =====================
// MAIN - GENERATE REPORT
// =====================

const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
let output = '# Combat Balance Results v26 (Production Formulas)\n\n';
output += `Generated: ${new Date().toISOString()}\n\n`;

// Diagnostic info
output += '## Diagnostic: Gear Stats by Level\n\n';
output += '| Level | Tier | PrimaryVal | TotalDef | TotalMDef |\n';
output += '|-------|------|------------|----------|----------|\n';
for (const level of [1, 5, 10, 20, 40]) {
    const tier = getExpectedTierForLevel(level);
    const primaryValue = calculateBaseStatValue(level, tier);
    const gear = getFullGearStats(level, 'physical');
    output += `| L${level} | ${tier} | ${primaryValue} | ${gear.defense} | ${gear.magicDefense} |\n`;
}

output += '\n## Diagnostic: Level 1 Combat Analysis\n\n';
const stats1 = getStatsAtLevel('warrior', 1);
const gear1 = getFullGearStats(1, 'physical');
const player1 = deriveCombatStats(stats1, 1, gear1, 'physical', 1.0, 1.1);
const goblin1 = createMonster(MONSTER_TEMPLATES[0], 1);
output += `**Level 1 Warrior vs Level 1 Goblin:**\n`;
output += `- Player Defense: ${player1.defense}\n`;
output += `- Goblin Attack: ${goblin1.attack}\n`;
output += `- Monster Damage = max(1, ${goblin1.attack} - ${player1.defense}) = **${Math.max(1, goblin1.attack - player1.defense)}**\n`;
output += `- Player Physical Attack: ${player1.physicalAttack}\n`;
output += `- Goblin Defense: ${goblin1.defense}\n`;
output += `- Player Damage = max(1, ${player1.physicalAttack} - ${goblin1.defense}) = **${Math.max(1, player1.physicalAttack - goblin1.defense)}**\n\n`;

// Overworld
output += '## Overworld (Easy Mode)\n\n';
output += '| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |\n';
output += '|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|\n';
for (const cls of classes) {
    const results = [1, 5, 10, 15, 20, 30, 40].map(l => runSimulation(cls, l, l, 200, 'overworld'));
    output += `| ${cls} | ${results.map(r => `${r.winRate.toFixed(0)}%`).join(' | ')} |\n`;
}

// Dungeon
output += '\n## Dungeon (Medium Mode)\n\n';
output += '| Class | L20 | L25 | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|:---:|:---:|\n';
for (const cls of classes) {
    const results = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, l, 200, 'dungeon'));
    output += `| ${cls} | ${results.map(r => `${r.winRate.toFixed(0)}%`).join(' | ')} |\n`;
}

// Boss
output += '\n## Boss Encounters (Hard Mode)\n\n';
output += '| Class | L20 | L25 | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|:---:|:---:|\n';
for (const cls of classes) {
    const results = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, l, 200, 'boss'));
    output += `| ${cls} | ${results.map(r => `${r.winRate.toFixed(0)}%`).join(' | ')} |\n`;
}

// Raid Boss
output += '\n## Raid Boss (Brutal Mode)\n\n';
output += '> Tanks (Warrior, Cleric) receive a -15% damage penalty in raids\n\n';
output += '| Class | L30 | L35 | L40 |\n';
output += '|-------|:---:|:---:|:---:|\n';
for (const cls of classes) {
    const results = [30, 35, 40].map(l => runSimulation(cls, l, l, 200, 'raid_boss'));
    output += `| ${cls} | ${results.map(r => `${r.winRate.toFixed(0)}%`).join(' | ')} |\n`;
}

output += '\n---\n*Generated from combat-simulator v26 (production formulas)*\n';

// Write to file
const outputPath = path.join(__dirname, 'balance-results-v26.md');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`\nResults written to: ${outputPath}\n`);
console.log(output);
