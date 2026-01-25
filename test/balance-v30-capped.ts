/**
 * Combat Balance v30 - CAPPED PERCENTAGE FORMULA
 * 
 * Formula: damage = attack * (1 - min(0.75, defense / (100 + defense)))
 * 
 * Defense provides percentage reduction that caps at 75%
 * Combined with 1.5x monster HP/ATK buff
 * 
 * Run: npx tsx test/balance-v30-capped.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================
// DAMAGE FORMULA
// =====================

function calculateDamage(atk: number, def: number, crit: number, critMult: number, dodge: number, block: number = 0): number {
    if (Math.random() * 100 < dodge) return 0;

    // CAPPED PERCENTAGE: max 75% reduction
    const reduction = Math.min(0.75, def / (100 + def));
    let damage = atk * (1 - reduction);

    if (block > 0 && Math.random() * 100 < block) {
        return Math.max(1, Math.floor(damage * 0.25));
    }

    if (Math.random() * 100 < crit) {
        damage = damage * critMult;
    }

    damage = damage * (0.9 + Math.random() * 0.2);
    return Math.max(1, Math.floor(damage));
}

// =====================
// GEAR SYSTEM
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
    return Math.floor((gearLevel * 3) + (TIER_INFO[tier].statMultiplier * gearLevel));
}

function getExpectedTierForLevel(level: number): GearTier {
    if (level <= 5) return 'common';
    if (level <= 12) return 'adept';
    if (level <= 20) return 'journeyman';
    if (level <= 28) return 'master';
    if (level <= 35) return 'epic';
    return 'legendary';
}

// =====================
// CHARACTER SYSTEM
// =====================

interface CharacterStats { strength: number; intelligence: number; wisdom: number; constitution: number; dexterity: number; charisma: number; }
type CharacterClass = 'warrior' | 'paladin' | 'technomancer' | 'scholar' | 'rogue' | 'cleric' | 'bard';
type StatType = keyof CharacterStats;
type AttackStyle = 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';

interface ClassDefinition { primaryStats: [StatType, StatType]; attackStyle: AttackStyle; damageModifier: number; hpModifier: number; }

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

function getFullGearStats(level: number, attackStyle: AttackStyle): GearStats {
    const tier = getExpectedTierForLevel(level);
    const pv = calculateBaseStatValue(level, tier);
    const weaponAttack = Math.floor(pv * 1.5);
    const shieldDef = (attackStyle === 'physical' || attackStyle === 'hybrid_physical') ? Math.floor(pv * 0.8) : 0;
    const totalDef = Math.floor(pv * 0.4) + Math.floor(pv * 0.6) + Math.floor(pv * 0.6) + Math.floor(pv * 0.3) + shieldDef;
    const totalMDef = Math.floor(pv * 0.5) + Math.floor(pv * 0.3) + Math.floor(pv * 0.3);
    const isPhys = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const isMag = attackStyle === 'magic' || attackStyle === 'hybrid_magic';
    return {
        physicalAttack: isPhys ? weaponAttack : Math.floor(weaponAttack * 0.3),
        magicAttack: isMag ? weaponAttack : Math.floor(weaponAttack * 0.3),
        defense: totalDef, magicDefense: totalMDef, hpBonus: Math.floor(pv * 4),
    };
}

interface CombatStats { maxHP: number; currentHP: number; physicalAttack: number; magicAttack: number; defense: number; magicDefense: number; critChance: number; critMultiplier: number; dodgeChance: number; blockChance: number; attackStyle: AttackStyle; damageModifier: number; }

function deriveCombatStats(stats: CharacterStats, level: number, gear: GearStats, attackStyle: AttackStyle, damageMod: number, hpMod: number): CombatStats {
    return {
        maxHP: Math.floor((50 + (stats.constitution * 5) + (level * 10) + gear.hpBonus) * hpMod),
        currentHP: 0,
        physicalAttack: Math.max(stats.strength, stats.dexterity) + gear.physicalAttack,
        magicAttack: Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack,
        defense: Math.floor(stats.constitution / 2) + gear.defense,
        magicDefense: Math.floor(stats.wisdom / 2) + gear.magicDefense,
        critChance: stats.dexterity * 0.5, critMultiplier: 2.0,
        dodgeChance: Math.min(25, stats.dexterity * 0.5),
        blockChance: (attackStyle === 'physical' || attackStyle === 'hybrid_physical') ? 10 : 0,
        attackStyle, damageModifier: damageMod,
    };
}

// =====================
// MONSTER SYSTEM
// =====================

interface MonsterTemplate { id: string; name: string; baseHP: number; baseAttack: number; baseDefense: number; baseMagicDefense: number; hpGrowth: number; attackGrowth: number; defenseGrowth: number; magicDefGrowth: number; }

const MONSTER_TEMPLATES: MonsterTemplate[] = [
    { id: 'goblin', name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.0, attackGrowth: 1.0, defenseGrowth: 1.0, magicDefGrowth: 1.0 },
    { id: 'wolf', name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDefense: 4, hpGrowth: 1.0, attackGrowth: 1.1, defenseGrowth: 0.9, magicDefGrowth: 0.8 },
    { id: 'skeleton', name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDefense: 6, hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.9, magicDefGrowth: 1.0 },
    { id: 'cave_troll', name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDefense: 6, hpGrowth: 1.3, attackGrowth: 0.9, defenseGrowth: 1.2, magicDefGrowth: 1.0 },
    { id: 'bugbear', name: 'Bugbear', baseHP: 95, baseAttack: 18, baseDefense: 7, baseMagicDefense: 5, hpGrowth: 1.15, attackGrowth: 1.2, defenseGrowth: 1.0, magicDefGrowth: 0.9 },
    { id: 'berserker', name: 'Berserker', baseHP: 85, baseAttack: 19, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.1, attackGrowth: 1.3, defenseGrowth: 0.8, magicDefGrowth: 0.9 },
];

const BASE_HP_GROWTH = 24, BASE_ATTACK_GROWTH = 8, BASE_DEFENSE_GROWTH = 3.5, BASE_MAGIC_DEF_GROWTH = 3.5;

// MONSTER BUFF MULTIPLIERS
const MONSTER_HP_MULT = 1.5;
const MONSTER_ATK_MULT = 1.5;

type MonsterTier = 'overworld' | 'dungeon' | 'boss' | 'raid_boss';
const MONSTER_TIER_CONFIG: Record<MonsterTier, { hpMult: number; atkMult: number; defMult: number; crit: number }> = {
    overworld: { hpMult: 1.0, atkMult: 1.0, defMult: 1.0, crit: 5 },
    dungeon: { hpMult: 1.1, atkMult: 1.05, defMult: 1.0, crit: 6 },
    boss: { hpMult: 1.3, atkMult: 1.15, defMult: 1.1, crit: 8 },
    raid_boss: { hpMult: 1.5, atkMult: 1.25, defMult: 1.2, crit: 10 },
};

interface Monster { id: string; name: string; level: number; maxHP: number; currentHP: number; attack: number; defense: number; magicDefense: number; dodgeChance: number; critChance: number; }

function createMonster(template: MonsterTemplate, level: number, tier: MonsterTier = 'overworld'): Monster {
    let hp = template.baseHP, attack = template.baseAttack, defense = template.baseDefense, magicDefense = template.baseMagicDefense;
    for (let lvl = 2; lvl <= level; lvl++) {
        const mult = 1 + (lvl * 0.075);
        hp += Math.floor(BASE_HP_GROWTH * mult * template.hpGrowth);
        attack += Math.floor(BASE_ATTACK_GROWTH * mult * template.attackGrowth);
        defense += Math.floor(BASE_DEFENSE_GROWTH * mult * template.defenseGrowth);
        magicDefense += Math.floor(BASE_MAGIC_DEF_GROWTH * mult * template.magicDefGrowth);
    }
    const tc = MONSTER_TIER_CONFIG[tier];
    return {
        id: template.id, name: template.name, level,
        maxHP: Math.floor(hp * MONSTER_HP_MULT * tc.hpMult),
        currentHP: Math.floor(hp * MONSTER_HP_MULT * tc.hpMult),
        attack: Math.floor(attack * MONSTER_ATK_MULT * tc.atkMult),
        defense: Math.floor(defense * tc.defMult),
        magicDefense: Math.floor(magicDefense * tc.defMult),
        dodgeChance: Math.min(15, 5 + level * 0.2),
        critChance: tc.crit,
    };
}

// =====================
// COMBAT SIMULATION
// =====================

function simulateBattle(player: CombatStats, monster: Monster): boolean {
    let pHP = player.maxHP, mHP = monster.currentHP;
    for (let t = 0; t < 100 && pHP > 0 && mHP > 0; t++) {
        // Player attacks
        let pAtk: number, mDef: number;
        if (player.attackStyle === 'magic') { pAtk = player.magicAttack; mDef = monster.magicDefense; }
        else if (player.attackStyle === 'hybrid_physical' || player.attackStyle === 'hybrid_magic') {
            const physDmg = calculateDamage(player.physicalAttack, monster.defense, 0, 1, 0);
            const magDmg = calculateDamage(player.magicAttack, monster.magicDefense, 0, 1, 0);
            const ratio = player.attackStyle === 'hybrid_physical' ? 0.7 : 0.3;
            let totalDmg = Math.floor(physDmg * ratio + magDmg * (1 - ratio));
            if (Math.random() * 100 < player.critChance) totalDmg = Math.floor(totalDmg * player.critMultiplier);
            mHP -= Math.max(1, Math.floor(totalDmg * player.damageModifier));
            if (mHP <= 0) break;
            pHP -= calculateDamage(monster.attack, player.defense, monster.critChance, 1.5, player.dodgeChance, player.blockChance);
            continue;
        } else { pAtk = player.physicalAttack; mDef = monster.defense; }

        let pDmg = calculateDamage(pAtk, mDef, player.critChance, player.critMultiplier, monster.dodgeChance);
        mHP -= Math.floor(pDmg * player.damageModifier);
        if (mHP <= 0) break;
        pHP -= calculateDamage(monster.attack, player.defense, monster.critChance, 1.5, player.dodgeChance, player.blockChance);
    }
    return pHP > 0;
}

function runSimulation(cls: CharacterClass, level: number, tier: MonsterTier = 'overworld', battles: number = 300): number {
    const classInfo = CLASS_INFO[cls];
    const stats = getStatsAtLevel(cls, level);
    const gear = getFullGearStats(level, classInfo.attackStyle);
    const levelMod = getLevelModifier(cls, level);
    let damageMod = classInfo.damageModifier * levelMod.damage;
    const hpMod = classInfo.hpModifier * levelMod.hp;
    if (tier === 'raid_boss' && (cls === 'warrior' || cls === 'cleric')) damageMod *= 0.85;
    const player = deriveCombatStats(stats, level, gear, classInfo.attackStyle, damageMod, hpMod);

    let wins = 0;
    for (let i = 0; i < battles; i++) {
        const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
        const monster = createMonster(template, level, tier);
        if (simulateBattle(player, monster)) wins++;
    }
    return (wins / battles) * 100;
}

// =====================
// MAIN
// =====================

const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
let output = `# Combat Balance v30 - CAPPED PERCENTAGE FORMULA\n\n`;
output += `Generated: ${new Date().toISOString()}\n\n`;
output += `## Changes\n\n`;
output += `1. **Damage formula:** \`damage = attack * (1 - min(0.75, defense / (100 + defense)))\`\n`;
output += `2. **Monster buff:** HP x${MONSTER_HP_MULT}, ATK x${MONSTER_ATK_MULT}\n\n`;
output += `### Defense Reduction Scale\n\n`;
output += `| Defense | Reduction |\n|---------|----------|\n`;
output += `| 50 | 33% |\n| 100 | 50% |\n| 200 | 67% |\n| 300+ | 75% (cap) |\n\n`;

output += `## Overworld (Target: 60-80%)\n\n`;
output += `| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |\n`;
output += `|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [1, 5, 10, 15, 20, 30, 40].map(l => runSimulation(cls, l, 'overworld'));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Dungeon (Target: 50-70%)\n\n`;
output += `| Class | L20 | L25 | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'dungeon'));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Boss (Target: 40-60%)\n\n`;
output += `| Class | L20 | L25 | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [20, 25, 30, 35, 40].map(l => runSimulation(cls, l, 'boss'));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n## Raid Boss (Target: 30-50%)\n\n`;
output += `| Class | L30 | L35 | L40 |\n`;
output += `|-------|:---:|:---:|:---:|\n`;
for (const cls of classes) {
    const rates = [30, 35, 40].map(l => runSimulation(cls, l, 'raid_boss'));
    output += `| ${cls} | ${rates.map(r => `${r.toFixed(0)}%`).join(' | ')} |\n`;
}

output += `\n---\n*v30 - Capped percentage defense + monster buff*\n`;

const outputPath = path.join(__dirname, 'balance-results-v30-capped.md');
fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`Results written to: ${outputPath}`);
console.log('\n' + output);
