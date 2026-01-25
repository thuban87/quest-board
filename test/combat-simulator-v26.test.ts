/**
 * Combat Simulator Tests - v26 (Real-World Aligned)
 * 
 * This version uses the EXACT formulas from the production code:
 * - Gear stats from Gear.ts + LootGenerationService.ts
 * - Monster stats from MonsterService.ts + monsters.ts  
 * - Combat calculations from CombatService.ts
 * 
 * Run with: npm run test:balance
 */

import { describe, it, expect } from 'vitest';

// =====================
// MIRROR PRODUCTION CODE
// =====================

// From Gear.ts
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

// =====================
// CHARACTER SYSTEM
// =====================

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
    attackName: string;
    damageModifier: number;
    hpModifier: number;
}

// From combatConfig.ts
const CLASS_INFO: Record<CharacterClass, ClassDefinition> = {
    warrior: {
        primaryStats: ['strength', 'constitution'],
        attackStyle: 'physical',
        attackName: 'Slash',
        damageModifier: 1.0,
        hpModifier: 1.1,
    },
    paladin: {
        primaryStats: ['strength', 'wisdom'],
        attackStyle: 'hybrid_physical',
        attackName: 'Holy Strike',
        damageModifier: 1.1,
        hpModifier: 1.05,
    },
    technomancer: {
        primaryStats: ['intelligence', 'dexterity'],
        attackStyle: 'magic',
        attackName: 'Arcane Bolt',
        damageModifier: 1.15,
        hpModifier: 1.0,
    },
    scholar: {
        primaryStats: ['intelligence', 'wisdom'],
        attackStyle: 'magic',
        attackName: 'Mind Blast',
        damageModifier: 1.1,
        hpModifier: 1.15,
    },
    rogue: {
        primaryStats: ['dexterity', 'charisma'],
        attackStyle: 'physical',
        attackName: 'Backstab',
        damageModifier: 1.15,
        hpModifier: 1.0,
    },
    cleric: {
        primaryStats: ['wisdom', 'constitution'],
        attackStyle: 'magic',
        attackName: 'Smite',
        damageModifier: 1.0,
        hpModifier: 1.1,
    },
    bard: {
        primaryStats: ['charisma', 'dexterity'],
        attackStyle: 'hybrid_magic',
        attackName: 'Dissonance',
        damageModifier: 1.1,
        hpModifier: 1.05,
    },
};

// From combatConfig.ts
function getLevelModifier(cls: CharacterClass, level: number): { damage: number; hp: number } {
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

/**
 * Calculate character stats at level using cumulative growth
 */
function getStatsAtLevel(characterClass: CharacterClass, level: number): CharacterStats {
    const { primaryStats } = CLASS_INFO[characterClass];
    const [primary1, primary2] = primaryStats;

    const stats: CharacterStats = {
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

        const allStats: StatType[] = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];
        for (const stat of allStats) {
            if (stat !== primary1 && stat !== primary2) {
                stats[stat] += secondaryGain;
            }
        }
    }

    return stats;
}

// =====================
// GEAR SYSTEM - PRODUCTION FORMULAS
// =====================

interface GearStats {
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    hpBonus: number;
}

/**
 * Generate gear stats using EXACT production formulas from LootGenerationService.ts
 * 
 * Slots and their multipliers:
 * - weapon: attackPower = primaryValue * 1.5
 * - shield: defense = primaryValue * 0.8, blockChance = 10 + tierMult * 5
 * - chest/legs: defense = primaryValue * 0.6, magicDefense = primaryValue * 0.3
 * - head: defense = primaryValue * 0.4, magicDefense = primaryValue * 0.5
 * - boots: defense = primaryValue * 0.3
 */
function getFullGearStats(level: number, attackStyle: AttackStyle): GearStats {
    const tier = getExpectedTierForLevel(level);
    const primaryValue = calculateBaseStatValue(level, tier);

    // Calculate gear from each slot exactly like production
    // Weapon
    const weaponAttack = Math.floor(primaryValue * 1.5);

    // Shield (if physical or paladin - they use shields)
    const shieldDefense = attackStyle === 'physical' || attackStyle === 'hybrid_physical'
        ? Math.floor(primaryValue * 0.8)
        : 0;

    // Head
    const headDefense = Math.floor(primaryValue * 0.4);
    const headMagicDef = Math.floor(primaryValue * 0.5);

    // Chest
    const chestDefense = Math.floor(primaryValue * 0.6);
    const chestMagicDef = Math.floor(primaryValue * 0.3);

    // Legs
    const legsDefense = Math.floor(primaryValue * 0.6);
    const legsMagicDef = Math.floor(primaryValue * 0.3);

    // Boots
    const bootsDefense = Math.floor(primaryValue * 0.3);

    // Total defense from all armor pieces
    const totalDefense = headDefense + chestDefense + legsDefense + bootsDefense + shieldDefense;
    const totalMagicDef = headMagicDef + chestMagicDef + legsMagicDef;

    // HP bonus from Constitution gear (chest/legs typically grant CON)
    // Assuming CON primary on chest (2 HP per CON from gear per CombatService.ts line 123)
    const hpFromGear = Math.floor(primaryValue * 2 * 2); // 2 pieces with CON, 2 HP per point

    // Attack power distribution based on style
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

// =====================
// COMBAT STATS
// =====================

interface CombatStats {
    maxHP: number;
    currentHP: number;
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    critChance: number;
    critMultiplier: number;
    dodgeChance: number;
    blockChance: number;
    attackStyle: AttackStyle;
    damageModifier: number;
}

/**
 * Derive combat stats using production formula from CombatService.ts
 */
function deriveCombatStats(
    stats: CharacterStats,
    level: number,
    gear: GearStats,
    attackStyle: AttackStyle,
    damageModifier: number = 1.0,
    hpModifier: number = 1.0
): CombatStats {
    // HP: (50 + (CON * 5) + (level * 10) + gearHP) * classModifier * levelMod
    const baseHP = 50 + (stats.constitution * 5) + (level * 10) + gear.hpBonus;
    const maxHP = Math.floor(baseHP * hpModifier);

    // Physical Attack: max(STR, DEX) + gear
    const physicalAttack = Math.max(stats.strength, stats.dexterity) + gear.physicalAttack;

    // Magic Attack: max(INT, WIS, CHA) + gear
    const magicAttack = Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gear.magicAttack;

    // Defense: CON/2 + gear
    const defense = Math.floor(stats.constitution / 2) + gear.defense;

    // Magic Defense: WIS/2 + gear
    const magicDefense = Math.floor(stats.wisdom / 2) + gear.magicDefense;

    // Crit: DEX * 0.5%
    const critChance = stats.dexterity * 0.5;

    // Dodge: DEX * 0.5%, capped at 25%
    const dodgeChance = Math.min(25, stats.dexterity * 0.5);

    // Block: Shield equipped = base 10% + tier bonus
    const hasShield = attackStyle === 'physical' || attackStyle === 'hybrid_physical';
    const blockChance = hasShield ? 10 : 0;

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
        blockChance,
        attackStyle,
        damageModifier,
    };
}

// =====================
// MONSTER SYSTEM - PRODUCTION FORMULAS
// =====================

interface MonsterTemplate {
    id: string;
    name: string;
    baseHP: number;
    baseAttack: number;
    baseDefense: number;
    baseMagicDefense: number;
    hpGrowth: number;
    attackGrowth: number;
    defenseGrowth: number;
    magicDefGrowth: number;
}

// Subset of monsters.ts templates
const MONSTER_TEMPLATES: MonsterTemplate[] = [
    {
        id: 'goblin', name: 'Goblin', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDefense: 5,
        hpGrowth: 1.0, attackGrowth: 1.0, defenseGrowth: 1.0, magicDefGrowth: 1.0
    },
    {
        id: 'wolf', name: 'Wolf', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDefense: 4,
        hpGrowth: 1.0, attackGrowth: 1.1, defenseGrowth: 0.9, magicDefGrowth: 0.8
    },
    {
        id: 'skeleton', name: 'Skeleton', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDefense: 6,
        hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.9, magicDefGrowth: 1.0
    },
    {
        id: 'cave_troll', name: 'Cave Troll', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDefense: 6,
        hpGrowth: 1.3, attackGrowth: 0.9, defenseGrowth: 1.2, magicDefGrowth: 1.0
    },
    {
        id: 'bugbear', name: 'Bugbear', baseHP: 95, baseAttack: 18, baseDefense: 7, baseMagicDefense: 5,
        hpGrowth: 1.15, attackGrowth: 1.2, defenseGrowth: 1.0, magicDefGrowth: 0.9
    },
    {
        id: 'berserker', name: 'Berserker', baseHP: 85, baseAttack: 19, baseDefense: 6, baseMagicDefense: 5,
        hpGrowth: 1.1, attackGrowth: 1.3, defenseGrowth: 0.8, magicDefGrowth: 0.9
    },
];

// From MonsterService.ts
const BASE_HP_GROWTH = 24;
const BASE_ATTACK_GROWTH = 8;
const BASE_DEFENSE_GROWTH = 3.5;
const BASE_MAGIC_DEF_GROWTH = 3.5;
const BASE_DODGE_CHANCE = 5;
const DODGE_PER_LEVEL = 0.2;

type MonsterTier = 'overworld' | 'elite' | 'dungeon' | 'boss' | 'raid_boss';

interface MonsterTierConfig {
    hpMultiplier: number;
    attackMultiplier: number;
    defenseMultiplier: number;
    critBonus: number;
}

// From combatConfig.ts
const MONSTER_TIER_CONFIG: Record<MonsterTier, MonsterTierConfig> = {
    overworld: { hpMultiplier: 1.0, attackMultiplier: 1.0, defenseMultiplier: 1.0, critBonus: 5 },
    elite: { hpMultiplier: 1.3, attackMultiplier: 1.2, defenseMultiplier: 1.1, critBonus: 10 },
    dungeon: { hpMultiplier: 1.05, attackMultiplier: 1.0, defenseMultiplier: 1.0, critBonus: 5 },
    boss: { hpMultiplier: 1.15, attackMultiplier: 1.05, defenseMultiplier: 1.0, critBonus: 6 },
    raid_boss: { hpMultiplier: 1.2, attackMultiplier: 1.05, defenseMultiplier: 1.0, critBonus: 6 },
};

interface Monster {
    id: string;
    name: string;
    level: number;
    maxHP: number;
    currentHP: number;
    attack: number;
    defense: number;
    magicDefense: number;
    dodgeChance: number;
    critChance: number;
}

/**
 * Create monster using EXACT formula from MonsterService.ts (lines 129-151)
 */
function createMonster(template: MonsterTemplate, level: number, tier: MonsterTier = 'overworld'): Monster {
    let hp = template.baseHP;
    let attack = template.baseAttack;
    let defense = template.baseDefense;
    let magicDefense = template.baseMagicDefense;

    // Exponential growth per level (from MonsterService.ts line 139-148)
    for (let lvl = 2; lvl <= level; lvl++) {
        const multiplier = 1 + (lvl * 0.075);

        hp += Math.floor(BASE_HP_GROWTH * multiplier * template.hpGrowth);
        attack += Math.floor(BASE_ATTACK_GROWTH * multiplier * template.attackGrowth);
        defense += Math.floor(BASE_DEFENSE_GROWTH * multiplier * template.defenseGrowth);
        magicDefense += Math.floor(BASE_MAGIC_DEF_GROWTH * multiplier * template.magicDefGrowth);
    }

    // Apply tier multipliers
    const tierConfig = MONSTER_TIER_CONFIG[tier];
    hp = Math.floor(hp * tierConfig.hpMultiplier);
    attack = Math.floor(attack * tierConfig.attackMultiplier);
    defense = Math.floor(defense * tierConfig.defenseMultiplier);
    magicDefense = Math.floor(magicDefense * tierConfig.defenseMultiplier);

    const dodgeChance = Math.min(15, BASE_DODGE_CHANCE + level * DODGE_PER_LEVEL);
    const critChance = tierConfig.critBonus;

    return {
        id: template.id,
        name: template.name,
        level,
        maxHP: hp,
        currentHP: hp,
        attack,
        defense,
        magicDefense,
        dodgeChance,
        critChance,
    };
}

function getRandomMonsterTemplate(): MonsterTemplate {
    return MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
}

// =====================
// COMBAT SYSTEM - PRODUCTION FORMULAS
// =====================

const MIN_DAMAGE = 1;
const DAMAGE_VARIANCE = 0.1;

function calculateDamage(
    attackPower: number,
    attackerCrit: number,
    attackerCritMult: number,
    defenderDefense: number,
    defenderDodge: number,
    defenderBlock: number = 0
): { damage: number; result: string } {
    // 1. Dodge check
    if (Math.random() * 100 < defenderDodge) {
        return { damage: 0, result: 'miss' };
    }

    // 2. Block check
    if (defenderBlock > 0 && Math.random() * 100 < defenderBlock) {
        const blockedDamage = Math.floor((attackPower - defenderDefense) * 0.25);
        return { damage: Math.max(MIN_DAMAGE, blockedDamage), result: 'blocked' };
    }

    // 3. Base damage
    let damage = attackPower - defenderDefense;
    damage = Math.max(MIN_DAMAGE, damage);

    // 4. Crit check
    if (Math.random() * 100 < attackerCrit) {
        damage = Math.floor(damage * attackerCritMult);
        return { damage, result: 'critical' };
    }

    // 5. Variance
    const variance = damage * DAMAGE_VARIANCE;
    damage = Math.floor(damage + (Math.random() * 2 - 1) * variance);

    return { damage: Math.max(MIN_DAMAGE, damage), result: 'hit' };
}

function simulateBattle(player: CombatStats, monster: Monster): { playerWon: boolean; turns: number } {
    let playerHP = player.currentHP;
    let monsterHP = monster.currentHP;
    let turns = 0;
    const maxTurns = 100;

    while (playerHP > 0 && monsterHP > 0 && turns < maxTurns) {
        turns++;

        // Player attacks
        let playerAtk: number;
        let monsterDef: number;

        if (player.attackStyle === 'magic') {
            playerAtk = player.magicAttack;
            monsterDef = monster.magicDefense;
        } else if (player.attackStyle === 'hybrid_physical') {
            const physDmg = Math.max(1, player.physicalAttack - monster.defense);
            const magDmg = Math.max(1, player.magicAttack - monster.magicDefense);
            playerAtk = Math.floor(physDmg * 0.7 + magDmg * 0.3) + monster.defense;
            monsterDef = 0; // Already factored
        } else if (player.attackStyle === 'hybrid_magic') {
            const physDmg = Math.max(1, player.physicalAttack - monster.defense);
            const magDmg = Math.max(1, player.magicAttack - monster.magicDefense);
            playerAtk = Math.floor(physDmg * 0.3 + magDmg * 0.7) + monster.magicDefense;
            monsterDef = 0; // Already factored
        } else {
            playerAtk = player.physicalAttack;
            monsterDef = monster.defense;
        }

        // Apply class damage modifier
        playerAtk = Math.floor(playerAtk * player.damageModifier);

        const pDmg = calculateDamage(playerAtk, player.critChance, player.critMultiplier, monsterDef, monster.dodgeChance);
        monsterHP -= pDmg.damage;

        if (monsterHP <= 0) break;

        // Monster attacks - physical vs player's defense
        const mDmg = calculateDamage(
            monster.attack,
            monster.critChance,
            1.5,
            player.defense,
            player.dodgeChance,
            player.blockChance
        );
        playerHP -= mDmg.damage;
    }

    return { playerWon: playerHP > 0, turns };
}

function runSimulation(
    characterClass: CharacterClass,
    playerLevel: number,
    monsterLevel: number,
    battles: number = 500,
    tier: MonsterTier = 'overworld'
): { winRate: number; avgTurns: number } {
    const classInfo = CLASS_INFO[characterClass];
    const stats = getStatsAtLevel(characterClass, playerLevel);
    const gear = getFullGearStats(playerLevel, classInfo.attackStyle);

    const levelMod = getLevelModifier(characterClass, playerLevel);
    let totalDamageMod = classInfo.damageModifier * levelMod.damage;
    const totalHpMod = classInfo.hpModifier * levelMod.hp;

    // Raid boss tank penalty
    if (tier === 'raid_boss' && (characterClass === 'warrior' || characterClass === 'cleric')) {
        totalDamageMod *= 0.85;
    }

    const playerCombat = deriveCombatStats(stats, playerLevel, gear, classInfo.attackStyle, totalDamageMod, totalHpMod);

    let wins = 0;
    let totalTurns = 0;

    for (let i = 0; i < battles; i++) {
        const template = getRandomMonsterTemplate();
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
// DIAGNOSTIC TESTS
// =====================

describe('v26 Diagnostic: Gear Stats at Level 1', () => {
    it('shows real gear defense values', () => {
        const levels = [1, 5, 10, 20, 40];
        console.log('\n=== GEAR STATS BY LEVEL (Production Formulas) ===');
        console.log('Level'.padEnd(8) + 'Tier'.padEnd(14) + 'PrimaryVal'.padStart(12) + 'TotalDef'.padStart(10) + 'TotalMDef'.padStart(10));
        console.log('-'.repeat(54));

        for (const level of levels) {
            const tier = getExpectedTierForLevel(level);
            const primaryValue = calculateBaseStatValue(level, tier);
            const gear = getFullGearStats(level, 'physical');

            console.log(
                `L${level}`.padEnd(8) +
                tier.padEnd(14) +
                `${primaryValue}`.padStart(12) +
                `${gear.defense}`.padStart(10) +
                `${gear.magicDefense}`.padStart(10)
            );
        }
    });

    it('shows monster attack values at level 1', () => {
        console.log('\n=== MONSTER ATTACK AT LEVEL 1 ===');
        for (const template of MONSTER_TEMPLATES) {
            const monster = createMonster(template, 1);
            console.log(`${template.name}: ${monster.attack} attack vs ${monster.defense} def`);
        }
    });

    it('shows level 1 damage calculation', () => {
        const stats = getStatsAtLevel('warrior', 1);
        const gear = getFullGearStats(1, 'physical');
        const player = deriveCombatStats(stats, 1, gear, 'physical', 1.0, 1.1);

        const goblin = createMonster(MONSTER_TEMPLATES[0], 1);

        console.log('\n=== LEVEL 1 WARRIOR vs GOBLIN ===');
        console.log('Player Defense:', player.defense);
        console.log('Goblin Attack:', goblin.attack);
        console.log('Damage = max(1, attack - defense) =', Math.max(1, goblin.attack - player.defense));
        console.log('');
        console.log('Player PhysAtk:', player.physicalAttack);
        console.log('Goblin Defense:', goblin.defense);
        console.log('Player Damage =', Math.max(1, player.physicalAttack - goblin.defense));
    });
});

describe('v26 Balance Matrix', () => {
    it.only('shows full balance breakdown', () => {
        const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];

        console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
        console.log('║              v26 OVERWORLD (Production Formulas)                       ║');
        console.log('╚════════════════════════════════════════════════════════════════════════╝');
        console.log('Class'.padEnd(15) + 'L1'.padStart(8) + 'L5'.padStart(8) + 'L10'.padStart(8) + 'L15'.padStart(8) + 'L20'.padStart(8) + 'L30'.padStart(8) + 'L40'.padStart(8));
        console.log('-'.repeat(71));

        for (const cls of classes) {
            const l1 = runSimulation(cls, 1, 1, 200, 'overworld');
            const l5 = runSimulation(cls, 5, 5, 200, 'overworld');
            const l10 = runSimulation(cls, 10, 10, 200, 'overworld');
            const l15 = runSimulation(cls, 15, 15, 200, 'overworld');
            const l20 = runSimulation(cls, 20, 20, 200, 'overworld');
            const l30 = runSimulation(cls, 30, 30, 200, 'overworld');
            const l40 = runSimulation(cls, 40, 40, 200, 'overworld');

            console.log(
                cls.padEnd(15) +
                `${l1.winRate.toFixed(0)}%`.padStart(8) +
                `${l5.winRate.toFixed(0)}%`.padStart(8) +
                `${l10.winRate.toFixed(0)}%`.padStart(8) +
                `${l15.winRate.toFixed(0)}%`.padStart(8) +
                `${l20.winRate.toFixed(0)}%`.padStart(8) +
                `${l30.winRate.toFixed(0)}%`.padStart(8) +
                `${l40.winRate.toFixed(0)}%`.padStart(8)
            );
        }

        console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
        console.log('║              v26 DUNGEON (L20+)                                         ║');
        console.log('╚════════════════════════════════════════════════════════════════════════╝');
        console.log('Class'.padEnd(15) + 'L20'.padStart(10) + 'L25'.padStart(10) + 'L30'.padStart(10) + 'L35'.padStart(10) + 'L40'.padStart(10));
        console.log('-'.repeat(65));

        for (const cls of classes) {
            const l20 = runSimulation(cls, 20, 20, 200, 'dungeon');
            const l25 = runSimulation(cls, 25, 25, 200, 'dungeon');
            const l30 = runSimulation(cls, 30, 30, 200, 'dungeon');
            const l35 = runSimulation(cls, 35, 35, 200, 'dungeon');
            const l40 = runSimulation(cls, 40, 40, 200, 'dungeon');

            console.log(
                cls.padEnd(15) +
                `${l20.winRate.toFixed(0)}%`.padStart(10) +
                `${l25.winRate.toFixed(0)}%`.padStart(10) +
                `${l30.winRate.toFixed(0)}%`.padStart(10) +
                `${l35.winRate.toFixed(0)}%`.padStart(10) +
                `${l40.winRate.toFixed(0)}%`.padStart(10)
            );
        }

        console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
        console.log('║              v26 BOSS (L20+)                                            ║');
        console.log('╚════════════════════════════════════════════════════════════════════════╝');
        console.log('Class'.padEnd(15) + 'L20'.padStart(10) + 'L25'.padStart(10) + 'L30'.padStart(10) + 'L35'.padStart(10) + 'L40'.padStart(10));
        console.log('-'.repeat(65));

        for (const cls of classes) {
            const l20 = runSimulation(cls, 20, 20, 200, 'boss');
            const l25 = runSimulation(cls, 25, 25, 200, 'boss');
            const l30 = runSimulation(cls, 30, 30, 200, 'boss');
            const l35 = runSimulation(cls, 35, 35, 200, 'boss');
            const l40 = runSimulation(cls, 40, 40, 200, 'boss');

            console.log(
                cls.padEnd(15) +
                `${l20.winRate.toFixed(0)}%`.padStart(10) +
                `${l25.winRate.toFixed(0)}%`.padStart(10) +
                `${l30.winRate.toFixed(0)}%`.padStart(10) +
                `${l35.winRate.toFixed(0)}%`.padStart(10) +
                `${l40.winRate.toFixed(0)}%`.padStart(10)
            );
        }

        console.log('\n╔════════════════════════════════════════════════════════════════════════╗');
        console.log('║              v26 RAID BOSS (L30+)                                       ║');
        console.log('╚════════════════════════════════════════════════════════════════════════╝');
        console.log('Class'.padEnd(15) + 'L30'.padStart(10) + 'L35'.padStart(10) + 'L40'.padStart(10));
        console.log('-'.repeat(45));

        for (const cls of classes) {
            const l30 = runSimulation(cls, 30, 30, 200, 'raid_boss');
            const l35 = runSimulation(cls, 35, 35, 200, 'raid_boss');
            const l40 = runSimulation(cls, 40, 40, 200, 'raid_boss');

            console.log(
                cls.padEnd(15) +
                `${l30.winRate.toFixed(0)}%`.padStart(10) +
                `${l35.winRate.toFixed(0)}%`.padStart(10) +
                `${l40.winRate.toFixed(0)}%`.padStart(10)
            );
        }

        console.log('\n');
        expect(true).toBe(true);
    });
});
