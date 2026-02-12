/**
 * Skills Combat Simulator Tests
 * 
 * Comprehensive combat simulation including:
 * - Skill usage (damage, buffs, debuffs, heals, status effects)
 * - Type effectiveness (2x super effective, 0.5x not very effective)
 * - Status effects (DoT, stat modifiers)
 * - Consumables (HP/MP potions)
 * - AI skill selection for monsters
 * 
 * Run with: npx vitest run test/skills-combat-simulator.test.ts
 */

import { describe, it, expect } from 'vitest';

// =====================
// TYPE DEFINITIONS
// =====================

type CharacterClass = 'warrior' | 'paladin' | 'technomancer' | 'scholar' | 'rogue' | 'cleric' | 'bard';
type ElementalType = 'Physical' | 'Fire' | 'Ice' | 'Lightning' | 'Earth' | 'Arcane' | 'Dark' | 'Light' | 'Poison' | 'Nature' | 'Psychic';
type MonsterAffinity = 'none' | 'fire' | 'dark' | 'earth' | 'arcane';
type StatType = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

interface Skill {
    id: string;
    name: string;
    manaCost: number;
    power: number;  // 100 = 1x base attack
    elementalType: ElementalType;
    damageType: 'physical' | 'magic' | 'none';
    critBonus: number;
    healPercent: number;  // % of max HP
    statusEffect?: { type: string; chance: number; duration: number };
    buffSelf?: { stat: 'atk' | 'def'; stages: number };
    debuffEnemy?: { stat: 'atk' | 'def'; stages: number };
    ignoresDefStages?: boolean;
    usesPerBattle?: number;
}

interface StatStages {
    atk: number;
    def: number;
}

interface StatusEffect {
    type: 'burn' | 'poison' | 'bleed' | 'stun' | 'confusion' | 'freeze';
    turnsRemaining: number;
}

interface Combatant {
    name: string;
    maxHP: number;
    currentHP: number;
    maxMana: number;
    currentMana: number;
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    critChance: number;
    inherentType: ElementalType;
    statStages: StatStages;
    statusEffects: StatusEffect[];
    skills: Skill[];
    skillUsesThisBattle: Record<string, number>;
}

// =====================
// TYPE EFFECTIVENESS CHART
// =====================

const TYPE_CHART: Record<ElementalType, { strong: ElementalType[]; weak: ElementalType[] }> = {
    Physical: { strong: ['Arcane'], weak: ['Earth', 'Dark'] },
    Fire: { strong: ['Ice', 'Nature'], weak: ['Fire', 'Earth'] },
    Ice: { strong: ['Nature', 'Lightning'], weak: ['Fire', 'Ice'] },
    Lightning: { strong: ['Fire', 'Psychic'], weak: ['Earth', 'Lightning'] },
    Earth: { strong: ['Lightning', 'Physical'], weak: ['Nature', 'Ice'] },
    Arcane: { strong: ['Dark', 'Psychic'], weak: ['Physical', 'Light'] },
    Dark: { strong: ['Light', 'Psychic'], weak: ['Arcane', 'Dark'] },
    Light: { strong: ['Dark', 'Poison'], weak: ['Arcane', 'Light'] },
    Poison: { strong: ['Nature', 'Physical'], weak: ['Light', 'Earth'] },
    Nature: { strong: ['Earth', 'Psychic'], weak: ['Fire', 'Poison'] },
    Psychic: { strong: ['Poison', 'Physical'], weak: ['Dark', 'Arcane'] },
};

function getTypeEffectiveness(attackType: ElementalType, defenderType: ElementalType): number {
    const chart = TYPE_CHART[attackType];
    if (chart.strong.includes(defenderType)) return 2.0;
    if (chart.weak.includes(defenderType)) return 0.5;
    return 1.0;
}

// =====================
// CLASS CONFIGURATIONS
// =====================

interface ClassConfig {
    primaryStats: [StatType, StatType];
    inherentType: ElementalType;
    attackStyle: 'physical' | 'magic' | 'hybrid_physical' | 'hybrid_magic';
    hpModifier: number;
    damageModifier: number;
}

const CLASS_CONFIG: Record<CharacterClass, ClassConfig> = {
    warrior: { primaryStats: ['strength', 'constitution'], inherentType: 'Physical', attackStyle: 'physical', hpModifier: 1.1, damageModifier: 1.0 },
    paladin: { primaryStats: ['strength', 'wisdom'], inherentType: 'Light', attackStyle: 'hybrid_physical', hpModifier: 1.05, damageModifier: 1.1 },
    technomancer: { primaryStats: ['intelligence', 'dexterity'], inherentType: 'Lightning', attackStyle: 'magic', hpModifier: 1.0, damageModifier: 1.15 },
    scholar: { primaryStats: ['intelligence', 'wisdom'], inherentType: 'Arcane', attackStyle: 'magic', hpModifier: 1.15, damageModifier: 1.1 },
    rogue: { primaryStats: ['dexterity', 'charisma'], inherentType: 'Dark', attackStyle: 'physical', hpModifier: 1.0, damageModifier: 1.15 },
    cleric: { primaryStats: ['wisdom', 'constitution'], inherentType: 'Light', attackStyle: 'magic', hpModifier: 1.1, damageModifier: 1.0 },
    bard: { primaryStats: ['charisma', 'dexterity'], inherentType: 'Arcane', attackStyle: 'hybrid_magic', hpModifier: 1.05, damageModifier: 1.1 },
};

// =====================
// SKILL DEFINITIONS (Simplified for simulation)
// =====================

function getClassSkills(cls: CharacterClass, level: number): Skill[] {
    const skills: Skill[] = [];

    // Universal - Meditate (always available)
    skills.push({
        id: 'meditate',
        name: 'Meditate',
        manaCost: 0,
        power: 0,
        elementalType: 'Arcane',
        damageType: 'none',
        critBonus: 0,
        healPercent: 0,
    });

    // Class-specific skills based on level
    switch (cls) {
        case 'warrior':
            if (level >= 5) skills.push({ id: 'slash', name: 'Slash', manaCost: 12, power: 150, elementalType: 'Physical', damageType: 'physical', critBonus: 0, healPercent: 0 });
            if (level >= 8) skills.push({ id: 'sharpen', name: 'Sharpen', manaCost: 14, power: 0, elementalType: 'Physical', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 1 } });
            if (level >= 13) skills.push({ id: 'fortify', name: 'Fortify', manaCost: 14, power: 0, elementalType: 'Physical', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'def', stages: 1 } });
            if (level >= 23) skills.push({ id: 'cleave', name: 'Cleave', manaCost: 20, power: 220, elementalType: 'Physical', damageType: 'physical', critBonus: 0, healPercent: 0 });
            if (level >= 28) skills.push({ id: 'enrage', name: 'Enrage', manaCost: 22, power: 0, elementalType: 'Physical', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 2 } });
            if (level >= 33) skills.push({ id: 'reckless_strike', name: 'Reckless Strike', manaCost: 28, power: 250, elementalType: 'Physical', damageType: 'physical', critBonus: 0, healPercent: 0, statusEffect: { type: 'stun', chance: 40, duration: 1 } });
            if (level >= 38) skills.push({ id: 'bloodthirst', name: 'Bloodthirst', manaCost: 32, power: 300, elementalType: 'Physical', damageType: 'physical', critBonus: 0, healPercent: 0, usesPerBattle: 1 });
            break;

        case 'paladin':
            if (level >= 5) skills.push({ id: 'holy_strike', name: 'Holy Strike', manaCost: 16, power: 150, elementalType: 'Light', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 8) skills.push({ id: 'heal', name: 'Heal', manaCost: 20, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 40 });
            if (level >= 13) skills.push({ id: 'shield_of_faith', name: 'Shield of Faith', manaCost: 20, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'def', stages: 2 } });
            if (level >= 23) skills.push({ id: 'smite', name: 'Smite', manaCost: 28, power: 200, elementalType: 'Light', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'burn', chance: 30, duration: 3 } });
            if (level >= 28) skills.push({ id: 'blessing', name: 'Blessing', manaCost: 24, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 1 } });
            if (level >= 33) skills.push({ id: 'judgment', name: 'Judgment', manaCost: 32, power: 280, elementalType: 'Light', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 38) skills.push({ id: 'divine_shield', name: 'Divine Shield', manaCost: 36, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 30, buffSelf: { stat: 'def', stages: 2 }, usesPerBattle: 1 });
            break;

        case 'technomancer':
            if (level >= 5) skills.push({ id: 'spark', name: 'Spark', manaCost: 18, power: 140, elementalType: 'Lightning', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 8) skills.push({ id: 'weaken_defenses', name: 'Weaken Defenses', manaCost: 16, power: 0, elementalType: 'Lightning', damageType: 'none', critBonus: 0, healPercent: 0, debuffEnemy: { stat: 'def', stages: -1 } });
            if (level >= 13) skills.push({ id: 'flame_burst', name: 'Flame Burst', manaCost: 24, power: 180, elementalType: 'Fire', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'burn', chance: 40, duration: 3 } });
            if (level >= 23) skills.push({ id: 'frost_bolt', name: 'Frost Bolt', manaCost: 28, power: 200, elementalType: 'Ice', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'freeze', chance: 35, duration: 2 } });
            if (level >= 28) skills.push({ id: 'overcharge', name: 'Overcharge', manaCost: 22, power: 0, elementalType: 'Lightning', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 2 } });
            if (level >= 33) skills.push({ id: 'chain_lightning', name: 'Chain Lightning', manaCost: 32, power: 250, elementalType: 'Lightning', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 38) skills.push({ id: 'meteor', name: 'Meteor', manaCost: 38, power: 300, elementalType: 'Fire', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'burn', chance: 50, duration: 3 }, usesPerBattle: 1 });
            break;

        case 'scholar':
            if (level >= 5) skills.push({ id: 'arcane_missile', name: 'Arcane Missile', manaCost: 18, power: 160, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 8) skills.push({ id: 'analyze', name: 'Analyze', manaCost: 16, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 0, debuffEnemy: { stat: 'def', stages: -1 } });
            if (level >= 13) skills.push({ id: 'mana_shield', name: 'Mana Shield', manaCost: 18, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'def', stages: 1 } });
            if (level >= 23) skills.push({ id: 'mind_spike', name: 'Mind Spike', manaCost: 26, power: 200, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'confusion', chance: 35, duration: 3 } });
            if (level >= 28) skills.push({ id: 'exploit_weakness', name: 'Exploit Weakness', manaCost: 22, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 0, debuffEnemy: { stat: 'def', stages: -2 } });
            if (level >= 33) skills.push({ id: 'meteor_strike', name: 'Meteor Strike', manaCost: 34, power: 280, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 38) skills.push({ id: 'singularity', name: 'Singularity', manaCost: 38, power: 350, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0, ignoresDefStages: true, usesPerBattle: 1 });
            break;

        case 'rogue':
            if (level >= 5) skills.push({ id: 'backstab', name: 'Backstab', manaCost: 14, power: 200, elementalType: 'Physical', damageType: 'physical', critBonus: 30, healPercent: 0 });
            if (level >= 8) skills.push({ id: 'agility', name: 'Agility', manaCost: 12, power: 0, elementalType: 'Physical', damageType: 'none', critBonus: 0, healPercent: 0 }); // Speed buff (simplified)
            if (level >= 13) skills.push({ id: 'poison_blade', name: 'Poison Blade', manaCost: 18, power: 130, elementalType: 'Poison', damageType: 'physical', critBonus: 0, healPercent: 0, statusEffect: { type: 'poison', chance: 40, duration: 5 } });
            if (level >= 23) skills.push({ id: 'shadow_strike', name: 'Shadow Strike', manaCost: 22, power: 250, elementalType: 'Dark', damageType: 'physical', critBonus: 0, healPercent: 0, ignoresDefStages: true });
            if (level >= 28) skills.push({ id: 'focus', name: 'Focus', manaCost: 18, power: 0, elementalType: 'Physical', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 2 } });
            if (level >= 33) skills.push({ id: 'fan_of_knives', name: 'Fan of Knives', manaCost: 26, power: 220, elementalType: 'Physical', damageType: 'physical', critBonus: 0, healPercent: 0, statusEffect: { type: 'bleed', chance: 40, duration: 3 } });
            if (level >= 38) skills.push({ id: 'assassinate', name: 'Assassinate', manaCost: 30, power: 400, elementalType: 'Physical', damageType: 'physical', critBonus: 50, healPercent: 0, usesPerBattle: 1 });
            break;

        case 'cleric':
            if (level >= 5) skills.push({ id: 'holy_light', name: 'Holy Light', manaCost: 18, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 35 });
            if (level >= 8) skills.push({ id: 'bless', name: 'Bless', manaCost: 16, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'def', stages: 1 } });
            if (level >= 13) skills.push({ id: 'smite_evil', name: 'Smite Evil', manaCost: 22, power: 160, elementalType: 'Light', damageType: 'magic', critBonus: 0, healPercent: 15 });
            if (level >= 18) skills.push({ id: 'full_heal', name: 'Full Heal', manaCost: 26, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 50 });
            if (level >= 23) skills.push({ id: 'prayer', name: 'Prayer', manaCost: 24, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 45 });
            if (level >= 28) skills.push({ id: 'divine_protection', name: 'Divine Protection', manaCost: 24, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'def', stages: 2 } });
            if (level >= 33) skills.push({ id: 'holy_nova', name: 'Holy Nova', manaCost: 32, power: 250, elementalType: 'Light', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 38) skills.push({ id: 'resurrection', name: 'Resurrection', manaCost: 40, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 100, usesPerBattle: 1 });
            break;

        case 'bard':
            if (level >= 5) skills.push({ id: 'discord', name: 'Discord', manaCost: 16, power: 140, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0, statusEffect: { type: 'confusion', chance: 30, duration: 2 } });
            if (level >= 8) skills.push({ id: 'inspire', name: 'Inspire', manaCost: 14, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 1 } });
            if (level >= 13) skills.push({ id: 'serenade', name: 'Serenade', manaCost: 22, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 25 });
            if (level >= 18) skills.push({ id: 'dissonance', name: 'Dissonance', manaCost: 24, power: 180, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 23) skills.push({ id: 'crescendo', name: 'Crescendo', manaCost: 28, power: 220, elementalType: 'Arcane', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 28) skills.push({ id: 'hymn_of_valor', name: 'Hymn of Valor', manaCost: 26, power: 0, elementalType: 'Light', damageType: 'none', critBonus: 0, healPercent: 0, buffSelf: { stat: 'atk', stages: 1 } });
            if (level >= 33) skills.push({ id: 'requiem', name: 'Requiem', manaCost: 34, power: 280, elementalType: 'Dark', damageType: 'magic', critBonus: 0, healPercent: 0 });
            if (level >= 38) skills.push({ id: 'encore', name: 'Encore', manaCost: 36, power: 0, elementalType: 'Arcane', damageType: 'none', critBonus: 0, healPercent: 40, buffSelf: { stat: 'atk', stages: 2 }, usesPerBattle: 1 });
            break;
    }

    return skills;
}

// =====================
// MONSTER GENERATION
// =====================

const AFFINITY_TO_TYPE: Record<MonsterAffinity, ElementalType> = {
    none: 'Physical',
    fire: 'Fire',
    dark: 'Dark',
    earth: 'Earth',
    arcane: 'Arcane',
};

interface MonsterTemplate {
    id: string;
    name: string;
    affinity: MonsterAffinity;
    baseHP: number;
    baseAttack: number;
    baseDefense: number;
    baseMagicDefense: number;
    hpGrowth: number;
    attackGrowth: number;
    defenseGrowth: number;
    magicDefGrowth: number;
}

const MONSTER_TEMPLATES: MonsterTemplate[] = [
    { id: 'wolf', name: 'Wolf', affinity: 'none', baseHP: 75, baseAttack: 17, baseDefense: 5, baseMagicDefense: 4, hpGrowth: 1.0, attackGrowth: 1.1, defenseGrowth: 0.9, magicDefGrowth: 0.8 },
    { id: 'skeleton', name: 'Skeleton', affinity: 'dark', baseHP: 60, baseAttack: 16, baseDefense: 5, baseMagicDefense: 6, hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.9, magicDefGrowth: 1.0 },
    { id: 'goblin', name: 'Goblin', affinity: 'none', baseHP: 70, baseAttack: 14, baseDefense: 6, baseMagicDefense: 5, hpGrowth: 1.0, attackGrowth: 1.0, defenseGrowth: 1.0, magicDefGrowth: 1.0 },
    { id: 'cave-troll', name: 'Cave Troll', affinity: 'earth', baseHP: 90, baseAttack: 13, baseDefense: 9, baseMagicDefense: 6, hpGrowth: 1.3, attackGrowth: 0.9, defenseGrowth: 1.2, magicDefGrowth: 1.0 },
    { id: 'ghost', name: 'Ghost', affinity: 'dark', baseHP: 50, baseAttack: 14, baseDefense: 3, baseMagicDefense: 10, hpGrowth: 0.7, attackGrowth: 1.0, defenseGrowth: 0.6, magicDefGrowth: 1.3 },
    { id: 'drake', name: 'Drake', affinity: 'fire', baseHP: 80, baseAttack: 16, baseDefense: 8, baseMagicDefense: 8, hpGrowth: 1.1, attackGrowth: 1.1, defenseGrowth: 1.1, magicDefGrowth: 1.1 },
    { id: 'eye-beast', name: 'Eye Beast', affinity: 'arcane', baseHP: 70, baseAttack: 14, baseDefense: 5, baseMagicDefense: 12, hpGrowth: 0.9, attackGrowth: 1.0, defenseGrowth: 0.8, magicDefGrowth: 1.4 },
];

function createMonster(template: MonsterTemplate, level: number): Combatant {
    let hp = template.baseHP;
    let atk = template.baseAttack;
    let def = template.baseDefense;
    let mdef = template.baseMagicDefense;

    for (let lvl = 2; lvl <= level; lvl++) {
        const multiplier = 1 + (lvl * 0.075);
        hp += Math.floor(24 * multiplier * template.hpGrowth);
        atk += Math.floor(8 * multiplier * template.attackGrowth);
        def += Math.floor(3.5 * multiplier * template.defenseGrowth);
        mdef += Math.floor(3.5 * multiplier * template.magicDefGrowth);
    }

    // Simple monster skill: basic attack
    const monsterSkill: Skill = {
        id: 'monster_attack',
        name: 'Attack',
        manaCost: 0,
        power: 100,
        elementalType: AFFINITY_TO_TYPE[template.affinity],
        damageType: 'physical',
        critBonus: 0,
        healPercent: 0,
    };

    return {
        name: template.name,
        maxHP: hp,
        currentHP: hp,
        maxMana: 100,
        currentMana: 100,
        physicalAttack: atk,
        magicAttack: Math.floor(atk * 0.8),
        defense: def,
        magicDefense: mdef,
        critChance: 5,
        inherentType: AFFINITY_TO_TYPE[template.affinity],
        statStages: { atk: 0, def: 0 },
        statusEffects: [],
        skills: [monsterSkill],
        skillUsesThisBattle: {},
    };
}

// =====================
// PLAYER GENERATION
// =====================

function createPlayer(cls: CharacterClass, level: number): Combatant {
    const config = CLASS_CONFIG[cls];
    const [primary1, primary2] = config.primaryStats;

    // Base stats
    const stats: Record<StatType, number> = {
        strength: 10, dexterity: 10, constitution: 10,
        intelligence: 10, wisdom: 10, charisma: 10,
    };
    stats[primary1] += 2;
    stats[primary2] += 2;

    // Level up stats
    for (let lvl = 2; lvl <= level; lvl++) {
        const primaryGain = Math.floor(2 + (lvl * 0.5));
        const secondaryGain = Math.floor(1 + (lvl * 0.25));
        stats[primary1] += primaryGain;
        stats[primary2] += primaryGain;
        for (const stat of Object.keys(stats) as StatType[]) {
            if (stat !== primary1 && stat !== primary2) {
                stats[stat] += secondaryGain;
            }
        }
    }

    // Derive combat stats
    const baseHP = 200 + (stats.constitution * 2) + (level * 10);
    const maxHP = Math.floor(baseHP * config.hpModifier);
    const maxMana = 20 + (stats.intelligence * 3) + (level * 5);

    // Gear bonus (simplified: level * 3)
    const gearBonus = level * 3;

    const physicalAttack = Math.max(stats.strength, stats.dexterity) + gearBonus;
    const magicAttack = Math.max(stats.intelligence, stats.wisdom, stats.charisma) + gearBonus;
    const defense = Math.floor(stats.constitution / 2) + Math.floor(gearBonus * 0.6);
    const magicDefense = Math.floor(stats.wisdom / 2) + Math.floor(gearBonus * 0.5);
    const critChance = stats.dexterity * 0.5;

    return {
        name: `${cls} L${level}`,
        maxHP,
        currentHP: maxHP,
        maxMana,
        currentMana: maxMana,
        physicalAttack,
        magicAttack,
        defense,
        magicDefense,
        critChance,
        inherentType: config.inherentType,
        statStages: { atk: 0, def: 0 },
        statusEffects: [],
        skills: getClassSkills(cls, level),
        skillUsesThisBattle: {},
    };
}

// =====================
// COMBAT SIMULATION
// =====================

const STAGE_MULTIPLIER = 1.5;
const DOT_DAMAGE_PERCENT = 0.05;  // 5% max HP per turn
const CONFUSION_SELF_HIT = 0.33;

function getStageMultiplier(stage: number): number {
    return Math.pow(STAGE_MULTIPLIER, Math.max(-6, Math.min(6, stage)));
}

function executeSkill(user: Combatant, target: Combatant, skill: Skill): { damage: number; healing: number; log: string[] } {
    const log: string[] = [];
    let totalDamage = 0;
    let totalHealing = 0;

    // Pay mana cost
    user.currentMana -= skill.manaCost;

    // Track uses per battle
    if (skill.usesPerBattle) {
        user.skillUsesThisBattle[skill.id] = (user.skillUsesThisBattle[skill.id] || 0) + 1;
    }

    // Apply buffs/debuffs
    if (skill.buffSelf) {
        user.statStages[skill.buffSelf.stat] = Math.min(6, user.statStages[skill.buffSelf.stat] + skill.buffSelf.stages);
        log.push(`${user.name}'s ${skill.buffSelf.stat.toUpperCase()} rose!`);
    }
    if (skill.debuffEnemy) {
        target.statStages[skill.debuffEnemy.stat] = Math.max(-6, target.statStages[skill.debuffEnemy.stat] + skill.debuffEnemy.stages);
        log.push(`${target.name}'s ${skill.debuffEnemy.stat.toUpperCase()} fell!`);
    }

    // Healing
    if (skill.healPercent > 0) {
        const healing = Math.floor(user.maxHP * (skill.healPercent / 100));
        user.currentHP = Math.min(user.maxHP, user.currentHP + healing);
        totalHealing = healing;
        log.push(`${user.name} healed ${healing} HP!`);
    }

    // Damage
    if (skill.power > 0 && skill.damageType !== 'none') {
        const baseAttack = skill.damageType === 'physical' ? user.physicalAttack : user.magicAttack;
        let effectiveAttack = baseAttack * getStageMultiplier(user.statStages.atk);
        effectiveAttack *= (skill.power / 100);

        const baseDefense = skill.damageType === 'physical' ? target.defense : target.magicDefense;
        const defStage = skill.ignoresDefStages ? 0 : target.statStages.def;
        const effectiveDefense = baseDefense * getStageMultiplier(defStage);

        const reduction = Math.min(0.75, effectiveDefense / (100 + effectiveDefense));
        let damage = effectiveAttack * (1 - reduction);

        // Crit check
        const isCrit = Math.random() * 100 < (user.critChance + skill.critBonus);
        if (isCrit) {
            damage *= 2;
            log.push('Critical hit!');
        }

        // Type effectiveness
        const effectiveness = getTypeEffectiveness(skill.elementalType, target.inherentType);
        if (effectiveness > 1) {
            log.push("It's super effective!");
        } else if (effectiveness < 1) {
            log.push("It's not very effective...");
        }
        damage *= effectiveness;

        // Variance
        damage = Math.floor(damage * (1 + (Math.random() * 0.2 - 0.1)));
        damage = Math.max(1, damage);

        target.currentHP -= damage;
        totalDamage = damage;
        log.push(`${user.name} dealt ${damage} damage!`);
    }

    // Status effects
    if (skill.statusEffect && Math.random() * 100 < skill.statusEffect.chance) {
        target.statusEffects.push({
            type: skill.statusEffect.type as StatusEffect['type'],
            turnsRemaining: skill.statusEffect.duration,
        });
        log.push(`${target.name} is now ${skill.statusEffect.type}!`);
    }

    return { damage: totalDamage, healing: totalHealing, log };
}

function processStatusEffects(combatant: Combatant): { damage: number; skipTurn: boolean; log: string[] } {
    const log: string[] = [];
    let totalDamage = 0;
    let skipTurn = false;

    const remainingEffects: StatusEffect[] = [];

    for (const effect of combatant.statusEffects) {
        switch (effect.type) {
            case 'burn':
            case 'poison':
            case 'bleed': {
                const dotDamage = Math.floor(combatant.maxHP * DOT_DAMAGE_PERCENT);
                combatant.currentHP -= dotDamage;
                totalDamage += dotDamage;
                log.push(`${combatant.name} takes ${dotDamage} ${effect.type} damage!`);
                break;
            }
            case 'stun':
            case 'freeze':
                skipTurn = true;
                log.push(`${combatant.name} is ${effect.type === 'stun' ? 'stunned' : 'frozen'} and can't move!`);
                break;
            case 'confusion':
                if (Math.random() < CONFUSION_SELF_HIT) {
                    const selfDamage = Math.floor(combatant.maxHP * 0.05);
                    combatant.currentHP -= selfDamage;
                    totalDamage += selfDamage;
                    skipTurn = true;
                    log.push(`${combatant.name} hurt itself in confusion!`);
                }
                break;
        }

        // Reduce duration
        effect.turnsRemaining--;
        if (effect.turnsRemaining > 0) {
            remainingEffects.push(effect);
        } else {
            log.push(`${combatant.name}'s ${effect.type} wore off!`);
        }
    }

    combatant.statusEffects = remainingEffects;
    return { damage: totalDamage, skipTurn, log };
}

function selectPlayerSkill(player: Combatant, monster: Combatant): Skill {
    const usableSkills = player.skills.filter(s => {
        if (s.manaCost > player.currentMana) return false;
        if (s.usesPerBattle && (player.skillUsesThisBattle[s.id] || 0) >= s.usesPerBattle) return false;
        return true;
    });

    if (usableSkills.length === 0) {
        // Return basic attack as fallback
        return { id: 'basic_attack', name: 'Attack', manaCost: 0, power: 100, elementalType: player.inherentType, damageType: 'physical', critBonus: 0, healPercent: 0 };
    }

    // AI: Prioritize based on situation
    const hpPercent = player.currentHP / player.maxHP;

    // Low HP: prefer heals
    if (hpPercent < 0.3) {
        const healSkill = usableSkills.find(s => s.healPercent >= 30);
        if (healSkill) return healSkill;
    }

    // Check if we should buff first (first few turns, no buff active)
    if (player.statStages.atk < 2 && usableSkills.some(s => s.buffSelf?.stat === 'atk')) {
        const buffSkill = usableSkills.find(s => s.buffSelf?.stat === 'atk');
        if (buffSkill && Math.random() < 0.4) return buffSkill; // 40% chance to buff
    }

    // Use ultimate if available and monster is hurt
    const monsterHpPercent = monster.currentHP / monster.maxHP;
    if (monsterHpPercent < 0.5) {
        const ultimate = usableSkills.find(s => s.usesPerBattle === 1);
        if (ultimate) return ultimate;
    }

    // Otherwise, prefer high-power damage skills
    const damageSkills = usableSkills.filter(s => s.power > 0).sort((a, b) => b.power - a.power);
    if (damageSkills.length > 0) {
        // Pick from top 2 randomly to add variety
        const topSkills = damageSkills.slice(0, Math.min(2, damageSkills.length));
        return topSkills[Math.floor(Math.random() * topSkills.length)];
    }

    // Fallback to first usable skill
    return usableSkills[0];
}

interface BattleResult {
    playerWon: boolean;
    turns: number;
    playerHpRemaining: number;
    skillsUsed: string[];
    typeEffectivenessTriggered: boolean;
    statusesApplied: string[];
}

function simulateBattle(player: Combatant, monster: Combatant, useConsumables: boolean = false): BattleResult {
    // Reset battle state
    player.currentHP = player.maxHP;
    player.currentMana = player.maxMana;
    player.statStages = { atk: 0, def: 0 };
    player.statusEffects = [];
    player.skillUsesThisBattle = {};

    monster.currentHP = monster.maxHP;
    monster.statStages = { atk: 0, def: 0 };
    monster.statusEffects = [];

    let turns = 0;
    const MAX_TURNS = 50;
    const skillsUsed: string[] = [];
    let typeEffectivenessTriggered = false;
    const statusesApplied: string[] = [];

    // Consumables (simplified: 2 HP potions, 1 mana potion)
    let hpPotions = useConsumables ? 2 : 0;
    let manaPotions = useConsumables ? 1 : 0;

    while (player.currentHP > 0 && monster.currentHP > 0 && turns < MAX_TURNS) {
        turns++;

        // Process status effects
        const playerStatus = processStatusEffects(player);
        if (player.currentHP <= 0) break;

        // Player turn
        if (!playerStatus.skipTurn) {
            // Use consumable if needed
            if (useConsumables && player.currentHP < player.maxHP * 0.25 && hpPotions > 0) {
                const heal = Math.floor(player.maxHP * 0.3);
                player.currentHP = Math.min(player.maxHP, player.currentHP + heal);
                hpPotions--;
            } else if (useConsumables && player.currentMana < 20 && manaPotions > 0) {
                player.currentMana = Math.min(player.maxMana, player.currentMana + Math.floor(player.maxMana * 0.5));
                manaPotions--;
            } else {
                const skill = selectPlayerSkill(player, monster);
                skillsUsed.push(skill.name);
                const result = executeSkill(player, monster, skill);

                // Check for type effectiveness
                if (result.log.some(l => l.includes('super effective') || l.includes('not very effective'))) {
                    typeEffectivenessTriggered = true;
                }

                // Track status effects
                if (result.log.some(l => l.includes('is now'))) {
                    const statusMatch = result.log.find(l => l.includes('is now'));
                    if (statusMatch) {
                        const status = statusMatch.split('is now ')[1]?.replace('!', '');
                        if (status) statusesApplied.push(status);
                    }
                }
            }
        }

        if (monster.currentHP <= 0) break;

        // Process monster status effects
        const monsterStatus = processStatusEffects(monster);
        if (monster.currentHP <= 0) break;

        // Monster turn
        if (!monsterStatus.skipTurn) {
            const monsterSkill = monster.skills[0];
            executeSkill(monster, player, monsterSkill);
        }
    }

    return {
        playerWon: player.currentHP > 0 && monster.currentHP <= 0,
        turns,
        playerHpRemaining: Math.max(0, player.currentHP),
        skillsUsed: [...new Set(skillsUsed)],
        typeEffectivenessTriggered,
        statusesApplied: [...new Set(statusesApplied)],
    };
}

// =====================
// SIMULATION RUNNERS
// =====================

interface SimulationResult {
    winRate: number;
    avgTurns: number;
    avgHpRemaining: number;
    avgSkillVariety: number;
    typeEffectivenessRate: number;
    statusApplyRate: number;
}

function runSimulation(
    cls: CharacterClass,
    level: number,
    monsterLevel: number = level,
    battles: number = 200,
    useConsumables: boolean = false
): SimulationResult {
    let wins = 0;
    let totalTurns = 0;
    let totalHpRemaining = 0;
    let totalSkillVariety = 0;
    let typeEffectivenessCount = 0;
    let statusApplyCount = 0;

    for (let i = 0; i < battles; i++) {
        const player = createPlayer(cls, level);
        const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
        const monster = createMonster(template, monsterLevel);

        const result = simulateBattle(player, monster, useConsumables);

        if (result.playerWon) wins++;
        totalTurns += result.turns;
        totalHpRemaining += result.playerHpRemaining;
        totalSkillVariety += result.skillsUsed.length;
        if (result.typeEffectivenessTriggered) typeEffectivenessCount++;
        if (result.statusesApplied.length > 0) statusApplyCount++;
    }

    return {
        winRate: (wins / battles) * 100,
        avgTurns: totalTurns / battles,
        avgHpRemaining: totalHpRemaining / battles,
        avgSkillVariety: totalSkillVariety / battles,
        typeEffectivenessRate: (typeEffectivenessCount / battles) * 100,
        statusApplyRate: (statusApplyCount / battles) * 100,
    };
}

// =====================
// TESTS
// =====================

describe('Skills Combat Simulator', () => {
    describe('Basic Skill Usage', () => {
        it('all classes should have skills at level 20', () => {
            const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
            for (const cls of classes) {
                const skills = getClassSkills(cls, 20);
                expect(skills.length).toBeGreaterThan(1); // More than just Meditate
                console.log(`${cls}: ${skills.length} skills at L20`);
            }
        });

        it('skills at level 38 should include ultimate', () => {
            const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
            for (const cls of classes) {
                const skills = getClassSkills(cls, 38);
                const ultimate = skills.find(s => s.usesPerBattle === 1);
                expect(ultimate).toBeDefined();
                console.log(`${cls} ultimate: ${ultimate?.name}`);
            }
        });
    });

    describe('Type Effectiveness', () => {
        it('Light should be super effective vs Dark', () => {
            expect(getTypeEffectiveness('Light', 'Dark')).toBe(2.0);
        });

        it('Fire should be super effective vs Ice', () => {
            expect(getTypeEffectiveness('Fire', 'Ice')).toBe(2.0);
        });

        it('Arcane should be weak vs Physical', () => {
            expect(getTypeEffectiveness('Arcane', 'Physical')).toBe(0.5);
        });

        it('Physical should be weak vs Dark', () => {
            expect(getTypeEffectiveness('Physical', 'Dark')).toBe(0.5);
        });
    });

    describe('Balance - Same Level Combat', () => {
        it.only('shows complete skills balance matrix', () => {
            const classes: CharacterClass[] = ['warrior', 'paladin', 'technomancer', 'scholar', 'rogue', 'cleric', 'bard'];
            const levels = [10, 20, 35];

            console.log('\n╔════════════════════════════════════════════════════════════════════════════════════════════════╗');
            console.log('║                           SKILLS COMBAT BALANCE (200 battles each)                               ║');
            console.log('╚════════════════════════════════════════════════════════════════════════════════════════════════╝');
            console.log('Class'.padEnd(15) + 'L10 Win'.padStart(10) + 'L20 Win'.padStart(10) + 'L35 Win'.padStart(10) +
                'L20 Type%'.padStart(12) + 'L20 Status%'.padStart(12) + 'L20 Skills'.padStart(12));
            console.log('-'.repeat(81));

            const allResults: { cls: string; level: number; result: SimulationResult }[] = [];

            for (const cls of classes) {
                const l10 = runSimulation(cls, 10, 10, 200);
                const l20 = runSimulation(cls, 20, 20, 200);
                const l35 = runSimulation(cls, 35, 35, 200);

                allResults.push({ cls, level: 10, result: l10 });
                allResults.push({ cls, level: 20, result: l20 });
                allResults.push({ cls, level: 35, result: l35 });

                console.log(
                    cls.padEnd(15) +
                    `${l10.winRate.toFixed(0)}%`.padStart(10) +
                    `${l20.winRate.toFixed(0)}%`.padStart(10) +
                    `${l35.winRate.toFixed(0)}%`.padStart(10) +
                    `${l20.typeEffectivenessRate.toFixed(0)}%`.padStart(12) +
                    `${l20.statusApplyRate.toFixed(0)}%`.padStart(12) +
                    `${l20.avgSkillVariety.toFixed(1)}`.padStart(12)
                );
            }

            // Summary stats
            console.log('-'.repeat(81));
            const l20Results = allResults.filter(r => r.level === 20);
            const avgWinRate = l20Results.reduce((sum, r) => sum + r.result.winRate, 0) / l20Results.length;
            const minWin = Math.min(...l20Results.map(r => r.result.winRate));
            const maxWin = Math.max(...l20Results.map(r => r.result.winRate));
            console.log(`L20 Average: ${avgWinRate.toFixed(1)}% | Range: ${minWin.toFixed(0)}% - ${maxWin.toFixed(0)}%`);

            // Check balance
            expect(minWin).toBeGreaterThanOrEqual(40);
            expect(maxWin).toBeLessThanOrEqual(95);
        });
    });

    describe('Balance - With Consumables', () => {
        it('consumables should improve win rate', () => {
            const classes: CharacterClass[] = ['warrior', 'technomancer', 'rogue'];

            console.log('\n=== CONSUMABLE IMPACT (L20) ===');
            console.log('Class'.padEnd(15) + 'No Potions'.padStart(12) + 'With Potions'.padStart(14) + 'Diff'.padStart(8));
            console.log('-'.repeat(49));

            for (const cls of classes) {
                const withoutPotions = runSimulation(cls, 20, 20, 200, false);
                const withPotions = runSimulation(cls, 20, 20, 200, true);
                const diff = withPotions.winRate - withoutPotions.winRate;

                console.log(
                    cls.padEnd(15) +
                    `${withoutPotions.winRate.toFixed(0)}%`.padStart(12) +
                    `${withPotions.winRate.toFixed(0)}%`.padStart(14) +
                    `+${diff.toFixed(0)}%`.padStart(8)
                );

                // Potions should help
                expect(withPotions.winRate).toBeGreaterThanOrEqual(withoutPotions.winRate - 5);
            }
        });
    });

    describe('Type Effectiveness Impact', () => {
        it('Paladin (Light) should perform better vs Dark enemies', () => {
            // Create a custom simulation where we only fight Dark enemies
            const player = createPlayer('paladin', 20);
            const skeleton = MONSTER_TEMPLATES.find(m => m.id === 'skeleton')!;

            let wins = 0;
            for (let i = 0; i < 100; i++) {
                const p = createPlayer('paladin', 20);
                const m = createMonster(skeleton, 20);
                if (simulateBattle(p, m).playerWon) wins++;
            }

            console.log(`\nPaladin vs Dark (Skeleton): ${wins}% win rate`);
            expect(wins).toBeGreaterThan(50); // Should have advantage
        });

        it('Physical classes should struggle vs Dark enemies', () => {
            const skeleton = MONSTER_TEMPLATES.find(m => m.id === 'skeleton')!;

            let wins = 0;
            for (let i = 0; i < 100; i++) {
                const p = createPlayer('warrior', 20);
                const m = createMonster(skeleton, 20);
                if (simulateBattle(p, m).playerWon) wins++;
            }

            console.log(`Warrior vs Dark (Skeleton): ${wins}% win rate`);
            // Physical is weak vs Dark, so should be harder
        });
    });

    describe('Skill Variety Analysis', () => {
        it('should use multiple skills per battle', () => {
            const classes: CharacterClass[] = ['warrior', 'technomancer', 'scholar', 'cleric'];

            console.log('\n=== SKILL USAGE VARIETY (L20) ===');

            for (const cls of classes) {
                let totalSkills = 0;
                for (let i = 0; i < 50; i++) {
                    const player = createPlayer(cls, 20);
                    const monster = createMonster(MONSTER_TEMPLATES[0], 20);
                    const result = simulateBattle(player, monster);
                    totalSkills += result.skillsUsed.length;
                }
                console.log(`${cls}: avg ${(totalSkills / 50).toFixed(1)} unique skills used per battle`);
            }
        });
    });
});
