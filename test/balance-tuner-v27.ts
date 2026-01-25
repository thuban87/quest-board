/**
 * Combat Balance Tuner v27
 * 
 * This simulator assumes REALISTIC gear:
 * - Players may have gear 1-2 tiers above expected for their level
 * - Players may have gear from higher-level content
 * 
 * It tests different monster attack multipliers to find balanced values.
 * 
 * Run: npx tsx test/balance-tuner-v27.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================
// CONFIGURATION
// =====================

// Target win rates
const TARGET_MIN = 50;
const TARGET_MAX = 80;

// Gear assumptions - players often have better gear than expected
// At L1, they might have L4-5 Adept/Master gear from quests
const GEAR_LEVEL_BONUS = 3;  // Gear is X levels higher than character
const GEAR_TIER_BONUS = 1;   // Gear is X tiers better than expected

// =====================
// PRODUCTION CODE MIRRORS
// =====================

type GearTier = 'common' | 'adept' | 'journeyman' | 'master' | 'epic' | 'legendary';
const GEAR_TIERS: GearTier[] = ['common', 'adept', 'journeyman', 'master', 'epic', 'legendary'];

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
    return Math.floor((gearLevel * 3) + (tierMultiplier * gearLevel));
}

function getExpectedTierForLevel(level: number): GearTier {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

// Get REALISTIC tier (boosted by X tiers from expected)
function getRealisticTierForLevel(level: number, tierBonus: number): GearTier {
    const expectedTier = getExpectedTierForLevel(level);
    const expectedIndex = GEAR_TIERS.indexOf(expectedTier);
    const boostedIndex = Math.min(GEAR_TIERS.length - 1, expectedIndex + tierBonus);
    return GEAR_TIERS[boostedIndex];
}

interface CharacterStats {
    strength: number; intelligence: number; wisdom: number;
    constitution: number; dexterity: number; charisma: number;
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
    const [p1, p2] = primaryStats;
    const stats: CharacterStats = { strength: 10, intelligence: 10, wisdom: 10, constitution: 10, dexterity: 10, charisma: 10 };
    stats[p1] += 2; stats[p2] += 2;
    for (let lvl = 2; lvl <= level; lvl++) {
        const pg = Math.floor(2 + (lvl * 0.5)), sg = Math.floor(1 + (lvl * 0.25));
        stats[p1] += pg; stats[p2] += pg;
        for (const s of ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'] as StatType[]) {
            if (s !== p1 && s !== p2) stats[s] += sg;
        }
    }
    return stats;
}

interface GearStats { physicalAttack: number; magicAttack: number; defense: number; magicDefense: number; hpBonus: number; }

// REALISTIC gear stats - accounts for gear level/tier bonus
function getRealisticGearStats(charLevel: number, attackStyle: AttackStyle): GearStats {
    const gearLevel = Math.max(1, charLevel + GEAR_LEVEL_BONUS);
    const tier = getRealisticTierForLevel(charLevel, GEAR_TIER_BONUS);
    const primaryValue = calculateBaseStatValue(gearLevel, tier);

    const weaponAttack = Math.floor(primaryValue * 1.5);
    const shieldDefense = (attackStyle === 'physical' || attackStyle === 'hybrid_physical') ? Math.floor(primaryValue * 0.8) : 0;
    const totalDefense = Math.floor(primaryValue * 0.4) + Math.floor(primaryValue * 0.6) + Math.floor(primaryValue * 0.6) + Math.floor(primaryValue * 0.3) + shieldDefense;
    const totalMagicDef = Math.floor(primaryValue * 0.5) + Math.floor(primaryValue * 0.3) + Math.floor(primaryValue * 0.3);
    const hpFromGear = Math.floor(primaryValue * 4);

    const isPhys = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const isMag = attackStyle === 'magic' || attackStyle === 'hybrid_magic';
    return {
        physicalAttack: isPhys ? weaponAttack : Math.floor(weaponAttack * 0.3),
        magicAttack: isMag ? weaponAttack : Math.floor(weaponAttack * 0.3),
        defense: totalDefense,
        magicDefense: totalMagicDef,
        hpBonus: hpFromGear,
    };
}

interface CombatStats { maxHP: number; currentHP: number; physicalAttack: number; magicAttack: number; defense: number; magicDefense: number; critChance: number; critMultiplier: number; dodgeChance: number; blockChance: number; attackStyle: AttackStyle; damageModifier: number; }

function deriveCombatStats(stats: CharacterStats, level: number, gear: GearStats, attackStyle: AttackStyle, damageMod: number, hpMod: number): CombatStats {
    const maxHP = Math.floor((50 + (stats.constitution * 5) + (level * 10) + gear.hpBonus) * hpMod);
    return {
        maxHP, currentHP: maxHP,
        physicalAttack: Math.max(stats.strength, stats.dexterity) + gear.physicalAttack,
        magicAttack: Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack,
        defense: Math.floor(stats.constitution / 2) + gear.defense,
        magicDefense: Math.floor(stats.wisdom / 2) + gear.magicDefense,
        critChance: stats.dexterity * 0.5,
        critMultiplier: 2.0,
        dodgeChance: Math.min(25, stats.dexterity * 0.5),
        blockChance: (attackStyle === 'physical' || attackStyle === 'hybrid_physical') ? 10 : 0,
        attackStyle, damageModifier: damageMod,
    };
}

// =====================
// MONSTER SYSTEM WITH TUNABLE ATTACK
// =====================

interface MonsterTemplate {
    id: string; name: string;
    baseHP: number; baseAttack: number; baseDefense: number; baseMagicDefense: number;
    hpGrowth: number; attackGrowth: number; defenseGrowth: number; magicDefGrowth: number;
}

const MONSTER_TEMPLATES: MonsterTemplate[] = [
    { id: 'goblin', name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.0, attackGrowth: 1.0, defenseGrowth: 1.0, magicDefGrowth: 1.0 },
    { id: 'wolf', name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDefense: 4, hpGrowth: 1.0, attackGrowth: 1.1, defenseGrowth: 0.9, magicDefGrowth: 0.8 },
    { id: 'skeleton', name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDefense: 6, hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.9, magicDefGrowth: 1.0 },
    { id: 'cave_troll', name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDefense: 6, hpGrowth: 1.3, attackGrowth: 0.9, defenseGrowth: 1.2, magicDefGrowth: 1.0 },
    { id: 'bugbear', name: 'Bugbear', baseHP: 95, baseAttack: 18, baseDefense: 7, baseMagicDefense: 5, hpGrowth: 1.15, attackGrowth: 1.2, defenseGrowth: 1.0, magicDefGrowth: 0.9 },
    { id: 'berserker', name: 'Berserker', baseHP: 85, baseAttack: 19, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.1, attackGrowth: 1.3, defenseGrowth: 0.8, magicDefGrowth: 0.9 },
];

// TUNABLE CONSTANTS - We'll iterate on these
let BASE_ATTACK_MULTIPLIER = 1.0;       // Multiplier on base attack
let ATTACK_GROWTH_MULTIPLIER = 1.0;     // Multiplier on attack growth

const BASE_HP_GROWTH = 24, BASE_ATTACK_GROWTH = 8, BASE_DEFENSE_GROWTH = 3.5, BASE_MAGIC_DEF_GROWTH = 3.5;

type MonsterTier = 'overworld' | 'dungeon' | 'boss' | 'raid_boss';

const MONSTER_TIER_CONFIG: Record<MonsterTier, { hpMult: number; atkMult: number; defMult: number; crit: number }> = {
    overworld: { hpMult: 1.0, atkMult: 1.0, defMult: 1.0, crit: 5 },
    dungeon: { hpMult: 1.05, atkMult: 1.0, defMult: 1.0, crit: 5 },
    boss: { hpMult: 1.15, atkMult: 1.05, defMult: 1.0, crit: 6 },
    raid_boss: { hpMult: 1.2, atkMult: 1.05, defMult: 1.0, crit: 6 },
};

interface Monster { id: string; name: string; level: number; maxHP: number; currentHP: number; attack: number; defense: number; magicDefense: number; dodgeChance: number; critChance: number; }

function createMonster(template: MonsterTemplate, level: number, tier: MonsterTier = 'overworld'): Monster {
    let hp = template.baseHP;
    let attack = Math.floor(template.baseAttack * BASE_ATTACK_MULTIPLIER);  // Apply base multiplier
    let defense = template.baseDefense;
    let magicDefense = template.baseMagicDefense;

    for (let lvl = 2; lvl <= level; lvl++) {
        const mult = 1 + (lvl * 0.075);
        hp += Math.floor(BASE_HP_GROWTH * mult * template.hpGrowth);
        attack += Math.floor(BASE_ATTACK_GROWTH * mult * template.attackGrowth * ATTACK_GROWTH_MULTIPLIER);
        defense += Math.floor(BASE_DEFENSE_GROWTH * mult * template.defenseGrowth);
        magicDefense += Math.floor(BASE_MAGIC_DEF_GROWTH * mult * template.magicDefGrowth);
    }

    const tc = MONSTER_TIER_CONFIG[tier];
    return {
        id: template.id, name: template.name, level,
        maxHP: Math.floor(hp * tc.hpMult), currentHP: Math.floor(hp * tc.hpMult),
        attack: Math.floor(attack * tc.atkMult),
        defense: Math.floor(defense * tc.defMult),
        magicDefense: Math.floor(magicDefense * tc.defMult),
        dodgeChance: Math.min(15, 5 + level * 0.2),
        critChance: tc.crit,
    };
}

// =====================
// COMBAT SIMULATION
// =====================

function calculateDamage(atk: number, crit: number, critMult: number, def: number, dodge: number, block: number = 0): number {
    if (Math.random() * 100 < dodge) return 0;
    if (block > 0 && Math.random() * 100 < block) return Math.max(1, Math.floor((atk - def) * 0.25));
    let dmg = Math.max(1, atk - def);
    if (Math.random() * 100 < crit) return Math.floor(dmg * critMult);
    return Math.max(1, Math.floor(dmg + (Math.random() * 2 - 1) * dmg * 0.1));
}

function simulateBattle(player: CombatStats, monster: Monster): boolean {
    let pHP = player.currentHP, mHP = monster.currentHP;
    for (let t = 0; t < 100 && pHP > 0 && mHP > 0; t++) {
        // Player attacks
        let pAtk: number, mDef: number;
        if (player.attackStyle === 'magic') { pAtk = player.magicAttack; mDef = monster.magicDefense; }
        else if (player.attackStyle === 'hybrid_physical') {
            const p = Math.max(1, player.physicalAttack - monster.defense);
            const m = Math.max(1, player.magicAttack - monster.magicDefense);
            pAtk = Math.floor(p * 0.7 + m * 0.3) + monster.defense; mDef = 0;
        } else if (player.attackStyle === 'hybrid_magic') {
            const p = Math.max(1, player.physicalAttack - monster.defense);
            const m = Math.max(1, player.magicAttack - monster.magicDefense);
            pAtk = Math.floor(p * 0.3 + m * 0.7) + monster.magicDefense; mDef = 0;
        } else { pAtk = player.physicalAttack; mDef = monster.defense; }

        pAtk = Math.floor(pAtk * player.damageModifier);
        mHP -= calculateDamage(pAtk, player.critChance, player.critMultiplier, mDef, monster.dodgeChance);
        if (mHP <= 0) break;

        // Monster attacks
        pHP -= calculateDamage(monster.attack, monster.critChance, 1.5, player.defense, player.dodgeChance, player.blockChance);
    }
    return pHP > 0;
}

function runSimulation(cls: CharacterClass, level: number, tier: MonsterTier = 'overworld', battles: number = 200): number {
    const classInfo = CLASS_INFO[cls];
    const stats = getStatsAtLevel(cls, level);
    const gear = getRealisticGearStats(level, classInfo.attackStyle);
    const levelMod = getLevelModifier(cls, level);
    let damageMod = classInfo.damageModifier * levelMod.damage;
    const hpMod = classInfo.hpModifier * levelMod.hp;
    if (tier === 'raid_boss' && (cls === 'warrior' || cls === 'cleric')) damageMod *= 0.85;
    const player = deriveCombatStats(stats, level, gear, classInfo.attackStyle, damageMod, hpMod);

    let wins = 0;
    for (let i = 0; i < battles; i++) {
        const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
        const monster = createMonster(template, level, tier);
        player.currentHP = player.maxHP;
        if (simulateBattle(player, monster)) wins++;
    }
    return (wins / battles) * 100;
}

// =====================
// TUNING ALGORITHM
// =====================

function findOptimalMultipliers(): { baseMultiplier: number; growthMultiplier: number } {
    console.log('Finding optimal monster attack multipliers...\n');
    console.log('Gear assumptions:');
    console.log(`  - Gear level bonus: +${GEAR_LEVEL_BONUS} levels`);
    console.log(`  - Gear tier bonus: +${GEAR_TIER_BONUS} tiers\n`);

    // Test different multiplier combinations
    const results: Array<{ base: number; growth: number; avgWinRate: number; minWinRate: number; maxWinRate: number }> = [];

    for (let baseMult = 1.0; baseMult <= 4.0; baseMult += 0.5) {
        for (let growthMult = 1.0; growthMult <= 3.0; growthMult += 0.25) {
            BASE_ATTACK_MULTIPLIER = baseMult;
            ATTACK_GROWTH_MULTIPLIER = growthMult;

            // Test key levels with warrior (representative tank class)
            const levels = [1, 5, 10, 20, 40];
            const winRates = levels.map(l => runSimulation('warrior', l, 'overworld', 100));

            const avg = winRates.reduce((a, b) => a + b, 0) / winRates.length;
            const min = Math.min(...winRates);
            const max = Math.max(...winRates);

            results.push({ base: baseMult, growth: growthMult, avgWinRate: avg, minWinRate: min, maxWinRate: max });
        }
    }

    // Find result closest to target range
    const optimal = results.reduce((best, curr) => {
        const currInRange = curr.minWinRate >= TARGET_MIN && curr.maxWinRate <= TARGET_MAX;
        const bestInRange = best.minWinRate >= TARGET_MIN && best.maxWinRate <= TARGET_MAX;

        if (currInRange && !bestInRange) return curr;
        if (!currInRange && bestInRange) return best;

        // Both in range or both out - prefer closer to 65% average
        const currDist = Math.abs(curr.avgWinRate - 65);
        const bestDist = Math.abs(best.avgWinRate - 65);
        return currDist < bestDist ? curr : best;
    }, results[0]);

    console.log('Top candidates:');
    results
        .filter(r => r.minWinRate >= 40 && r.maxWinRate <= 90)
        .sort((a, b) => Math.abs(a.avgWinRate - 65) - Math.abs(b.avgWinRate - 65))
        .slice(0, 10)
        .forEach(r => {
            console.log(`  Base: ${r.base.toFixed(1)}x, Growth: ${r.growth.toFixed(2)}x -> Win: ${r.minWinRate.toFixed(0)}-${r.maxWinRate.toFixed(0)}% (avg ${r.avgWinRate.toFixed(0)}%)`);
        });

    console.log(`\n✓ OPTIMAL: Base=${optimal.base.toFixed(1)}x, Growth=${optimal.growth.toFixed(2)}x`);
    console.log(`  Win rates: ${optimal.minWinRate.toFixed(0)}-${optimal.maxWinRate.toFixed(0)}% (avg ${optimal.avgWinRate.toFixed(0)}%)\n`);

    return { baseMultiplier: optimal.base, growthMultiplier: optimal.growth };
}

// =====================
// MAIN
// =====================

const optimal = findOptimalMultipliers();

// Apply optimal values and run full simulation
BASE_ATTACK_MULTIPLIER = optimal.baseMultiplier;
ATTACK_GROWTH_MULTIPLIER = optimal.growthMultiplier;

const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
let output = `# Combat Balance Results v27 (Realistic Gear)\n\n`;
output += `Generated: ${new Date().toISOString()}\n\n`;
output += `## Tuning Parameters\n\n`;
output += `- **Gear Level Bonus:** +${GEAR_LEVEL_BONUS} levels above character\n`;
output += `- **Gear Tier Bonus:** +${GEAR_TIER_BONUS} tiers above expected\n`;
output += `- **Base Attack Multiplier:** ${optimal.baseMultiplier.toFixed(1)}x (apply to monster baseAttack)\n`;
output += `- **Attack Growth Multiplier:** ${optimal.growthMultiplier.toFixed(2)}x (apply to BASE_ATTACK_GROWTH)\n\n`;

output += `## Recommended Code Changes\n\n`;
output += "```typescript\n";
output += `// In monsters.ts - multiply all baseAttack values by ${optimal.baseMultiplier.toFixed(1)}\n`;
output += `// Example: goblin.baseAttack = ${Math.floor(14 * optimal.baseMultiplier)} (was 14)\n\n`;
output += `// In MonsterService.ts - update BASE_ATTACK_GROWTH\n`;
output += `const BASE_ATTACK_GROWTH = ${Math.floor(8 * optimal.growthMultiplier)}; // was 8\n`;
output += "```\n\n";

// Run full simulation with optimal values
output += `## Overworld (Easy Mode)\n\n`;
output += `| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |\n`;
output += `|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [1, 5, 10, 15, 20, 30, 40].map(l => runSimulation(cls, l, 'overworld', 300));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Dungeon (Medium Mode)\n\n`;
output += `| Class | L20 | L25 | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'dungeon', 300));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Boss Encounters (Hard Mode)\n\n`;
output += `| Class | L20 | L25 | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'boss', 300));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Raid Boss (Brutal Mode)\n\n`;
output += `> Tanks (Warrior, Cleric) receive a -15% damage penalty in raids\n\n`;
output += `| Class | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [30, 35, 40].map(l => runSimulation(cls, l, 'raid_boss', 300));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n---\n*Generated from balance-tuner v27*\n`;

const outputPath = path.join(__dirname, 'balance-results-v27.md');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`Results written to: ${outputPath}`);
console.log('\n' + output);
