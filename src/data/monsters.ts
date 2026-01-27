/**
 * Monster Templates
 * 
 * 19 base monster templates across 8 categories.
 * Stats follow v25 combat balance formulas.
 * 
 * Base stats are level 1 values. Scaling uses 7.5% exponential formula:
 *   multiplier = 1 + (level * 0.075)
 *   hp += 24 * multiplier * hpGrowth
 *   attack += 8 * multiplier * attackGrowth
 *   defense += 3.5 * multiplier * defenseGrowth
 */

import { MonsterTemplate } from '../models/Monster';

// =====================
// BEASTS (Physical focused, low magic defense)
// =====================

const wolf: MonsterTemplate = {
    id: 'wolf',
    name: 'Wolf',
    description: 'A hungry predator stalking its prey.',
    category: 'beasts',
    affinity: 'none',
    baseHP: 75,
    baseAttack: 17,
    baseDefense: 5,
    baseMagicDefense: 4,
    baseSpeed: 12,
    hpGrowth: 1.0,
    attackGrowth: 1.1, // Fast attacker
    defenseGrowth: 0.9,
    magicDefGrowth: 0.8,
    statVariance: 0.15,
    baseGold: [2, 5],
    baseXP: 10,
    emoji: '🐺',
};

const bear: MonsterTemplate = {
    id: 'bear',
    name: 'Bear',
    description: 'A massive beast with crushing strength.',
    category: 'beasts',
    affinity: 'none',
    baseHP: 90,
    baseAttack: 15,
    baseDefense: 8,
    baseMagicDefense: 5,
    baseSpeed: 8,
    hpGrowth: 1.2, // Tank
    attackGrowth: 1.0,
    defenseGrowth: 1.1,
    magicDefGrowth: 0.9,
    statVariance: 0.15,
    baseGold: [3, 7],
    baseXP: 14,
    emoji: '🐻',
};

const giantRat: MonsterTemplate = {
    id: 'giant-rat',
    name: 'Giant Rat',
    description: 'A disease-ridden rodent of unusual size.',
    category: 'beasts',
    affinity: 'none',
    baseHP: 55,
    baseAttack: 12,
    baseDefense: 4,
    baseMagicDefense: 3,
    baseSpeed: 14,
    hpGrowth: 0.8, // Squishy
    attackGrowth: 0.9,
    defenseGrowth: 0.8,
    magicDefGrowth: 0.7,
    statVariance: 0.20,
    baseGold: [1, 3],
    baseXP: 6,
    emoji: '🐀',
};

// =====================
// UNDEAD (Mixed physical/magic, vulnerable to light)
// =====================

const skeleton: MonsterTemplate = {
    id: 'skeleton',
    name: 'Skeleton',
    description: 'Bones animated by dark magic.',
    category: 'undead',
    affinity: 'dark',
    baseHP: 60,
    baseAttack: 16,
    baseDefense: 5,
    baseMagicDefense: 6,
    baseSpeed: 10,
    hpGrowth: 0.9,
    attackGrowth: 1.0,
    defenseGrowth: 0.9, // Brittle bones
    magicDefGrowth: 1.0,
    statVariance: 0.15,
    baseGold: [2, 5],
    baseXP: 9,
    emoji: '💀',
};

const zombie: MonsterTemplate = {
    id: 'zombie',
    name: 'Zombie',
    description: 'A shambling corpse that refuses to stay dead.',
    category: 'undead',
    affinity: 'dark',
    baseHP: 80,
    baseAttack: 13,
    baseDefense: 6,
    baseMagicDefense: 4,
    baseSpeed: 5, // Very slow
    hpGrowth: 1.2, // Tanky
    attackGrowth: 0.9,
    defenseGrowth: 1.0,
    magicDefGrowth: 0.8,
    statVariance: 0.15,
    baseGold: [2, 4],
    baseXP: 8,
    emoji: '🧟',
};

const ghost: MonsterTemplate = {
    id: 'ghost',
    name: 'Ghost',
    description: 'A vengeful spirit from beyond the grave.',
    category: 'undead',
    affinity: 'dark',
    baseHP: 50,
    baseAttack: 14,
    baseDefense: 3,
    baseMagicDefense: 10,
    baseSpeed: 13,
    hpGrowth: 0.7, // Very fragile
    attackGrowth: 1.0,
    defenseGrowth: 0.6, // Ethereal, low phys def
    magicDefGrowth: 1.3, // High magic resist
    statVariance: 0.20,
    baseGold: [3, 6],
    baseXP: 11,
    emoji: '👻',
};

// =====================
// GOBLINS (Balanced, pack tactics)
// =====================

const goblin: MonsterTemplate = {
    id: 'goblin',
    name: 'Goblin',
    description: 'A sneaky green-skinned creature.',
    category: 'goblins',
    affinity: 'none',
    baseHP: 70,
    baseAttack: 14,
    baseDefense: 6,
    baseMagicDefense: 5,
    baseSpeed: 11,
    hpGrowth: 1.0,
    attackGrowth: 1.0,
    defenseGrowth: 1.0,
    magicDefGrowth: 1.0,
    statVariance: 0.15,
    baseGold: [2, 6],
    baseXP: 10,
    emoji: '👺',
};

const hobgoblin: MonsterTemplate = {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    description: 'A larger, more disciplined goblin warrior.',
    category: 'goblins',
    affinity: 'none',
    baseHP: 85,
    baseAttack: 16,
    baseDefense: 8,
    baseMagicDefense: 6,
    baseSpeed: 9,
    hpGrowth: 1.1,
    attackGrowth: 1.1,
    defenseGrowth: 1.1,
    magicDefGrowth: 1.0,
    statVariance: 0.12,
    baseGold: [4, 8],
    baseXP: 14,
    emoji: '👹',
};

const bugbear: MonsterTemplate = {
    id: 'bugbear',
    name: 'Bugbear',
    description: 'A hulking goblinoid that strikes from the shadows.',
    category: 'goblins',
    affinity: 'none',
    baseHP: 95,
    baseAttack: 18,
    baseDefense: 7,
    baseMagicDefense: 5,
    baseSpeed: 8,
    hpGrowth: 1.15,
    attackGrowth: 1.2, // Heavy hitter
    defenseGrowth: 1.0,
    magicDefGrowth: 0.9,
    statVariance: 0.15,
    baseGold: [5, 10],
    baseXP: 16,
    emoji: '🦍',
};

// =====================
// TROLLS (HP tanks, regeneration potential)
// =====================

const caveTroll: MonsterTemplate = {
    id: 'cave-troll',
    name: 'Cave Troll',
    description: 'A massive troll lurking in dark caverns.',
    category: 'trolls',
    affinity: 'earth',
    baseHP: 90,
    baseAttack: 13,
    baseDefense: 9,
    baseMagicDefense: 6,
    baseSpeed: 6,
    hpGrowth: 1.3, // Extreme tank
    attackGrowth: 0.9,
    defenseGrowth: 1.2,
    magicDefGrowth: 1.0,
    statVariance: 0.15,
    baseGold: [5, 12],
    baseXP: 15,
    emoji: '🧌',
};

const riverTroll: MonsterTemplate = {
    id: 'river-troll',
    name: 'River Troll',
    description: 'A swamp-dwelling troll with slippery skin.',
    category: 'trolls',
    affinity: 'earth',
    baseHP: 85,
    baseAttack: 14,
    baseDefense: 8,
    baseMagicDefense: 7,
    baseSpeed: 7,
    hpGrowth: 1.2,
    attackGrowth: 1.0,
    defenseGrowth: 1.1,
    magicDefGrowth: 1.1,
    statVariance: 0.15,
    baseGold: [4, 10],
    baseXP: 14,
    emoji: '🧌',
};

// =====================
// NIGHT ELVES (Magic focused, high speed)
// =====================

const shadowElf: MonsterTemplate = {
    id: 'shadow-elf',
    name: 'Shadow Elf',
    description: 'A dark elf warrior cloaked in shadow.',
    category: 'night_elves',
    affinity: 'dark',
    baseHP: 55,
    baseAttack: 15,
    baseDefense: 5,
    baseMagicDefense: 9,
    baseSpeed: 14,
    hpGrowth: 0.8, // Glass cannon
    attackGrowth: 1.1,
    defenseGrowth: 0.8,
    magicDefGrowth: 1.2,
    statVariance: 0.15,
    baseGold: [5, 12],
    baseXP: 13,
    emoji: '🧝‍♂️',
};

const darkRanger: MonsterTemplate = {
    id: 'dark-ranger',
    name: 'Dark Ranger',
    description: 'An undead archer serving the shadows.',
    category: 'night_elves',
    affinity: 'dark',
    baseHP: 60,
    baseAttack: 17,
    baseDefense: 4,
    baseMagicDefense: 8,
    baseSpeed: 15,
    hpGrowth: 0.85,
    attackGrowth: 1.2, // High damage dealer
    defenseGrowth: 0.7,
    magicDefGrowth: 1.1,
    statVariance: 0.15,
    baseGold: [6, 14],
    baseXP: 15,
    emoji: '🏹',
};

// =====================
// DWARVES (High defense, earth affinity)
// =====================

const rogueDwarf: MonsterTemplate = {
    id: 'rogue-dwarf',
    name: 'Rogue Dwarf',
    description: 'A bandit dwarf exiled from his clan.',
    category: 'dwarves',
    affinity: 'earth',
    baseHP: 75,
    baseAttack: 14,
    baseDefense: 10,
    baseMagicDefense: 7,
    baseSpeed: 8,
    hpGrowth: 1.0,
    attackGrowth: 1.0,
    defenseGrowth: 1.2, // Heavy armor
    magicDefGrowth: 1.0,
    statVariance: 0.12,
    baseGold: [6, 15],
    baseXP: 12,
    emoji: '⛏️',
};

const berserker: MonsterTemplate = {
    id: 'berserker',
    name: 'Berserker',
    description: 'A frenzied dwarf warrior consumed by rage.',
    category: 'dwarves',
    affinity: 'earth',
    baseHP: 85,
    baseAttack: 19,
    baseDefense: 6,
    baseMagicDefense: 5,
    baseSpeed: 10,
    hpGrowth: 1.1,
    attackGrowth: 1.3, // Extreme damage
    defenseGrowth: 0.8, // Offense over defense
    magicDefGrowth: 0.9,
    statVariance: 0.20,
    baseGold: [7, 16],
    baseXP: 16,
    emoji: '🪓',
};

// =====================
// DRAGONKIN (High all stats, fire affinity)
// =====================

const drake: MonsterTemplate = {
    id: 'drake',
    name: 'Drake',
    description: 'A lesser dragon with fiery breath.',
    category: 'dragonkin',
    affinity: 'fire',
    baseHP: 80,
    baseAttack: 16,
    baseDefense: 8,
    baseMagicDefense: 8,
    baseSpeed: 11,
    hpGrowth: 1.1,
    attackGrowth: 1.1,
    defenseGrowth: 1.1,
    magicDefGrowth: 1.1,
    statVariance: 0.12,
    baseGold: [8, 18],
    baseXP: 18,
    emoji: '🦎',
};

const wyvern: MonsterTemplate = {
    id: 'wyvern',
    name: 'Wyvern',
    description: 'A winged serpent with a venomous tail.',
    category: 'dragonkin',
    affinity: 'fire',
    baseHP: 95,
    baseAttack: 18,
    baseDefense: 9,
    baseMagicDefense: 9,
    baseSpeed: 13,
    hpGrowth: 1.15,
    attackGrowth: 1.15,
    defenseGrowth: 1.1,
    magicDefGrowth: 1.15,
    statVariance: 0.10,
    baseGold: [10, 22],
    baseXP: 22,
    emoji: '🐉',
};

// =====================
// ABERRATIONS (Weird stats, arcane affinity)
// =====================

const mimic: MonsterTemplate = {
    id: 'mimic',
    name: 'Mimic',
    description: 'A shapeshifter disguised as a treasure chest.',
    category: 'aberrations',
    affinity: 'arcane',
    baseHP: 65,
    baseAttack: 16,
    baseDefense: 12, // Hard shell
    baseMagicDefense: 6,
    baseSpeed: 4, // Very slow until it attacks
    hpGrowth: 0.9,
    attackGrowth: 1.1,
    defenseGrowth: 1.3, // Armored exterior
    magicDefGrowth: 0.9,
    statVariance: 0.25,
    baseGold: [15, 30], // Extra gold - it's a treasure chest!
    baseXP: 14,
    emoji: '📦',
    lootTierBonus: 1, // Better loot drops
};

const eyeBeast: MonsterTemplate = {
    id: 'eye-beast',
    name: 'Eye Beast',
    description: 'A floating orb of eyes and madness.',
    category: 'aberrations',
    affinity: 'arcane',
    baseHP: 70,
    baseAttack: 14,
    baseDefense: 5,
    baseMagicDefense: 12, // Magic resistant
    baseSpeed: 9,
    hpGrowth: 0.9,
    attackGrowth: 1.0,
    defenseGrowth: 0.8,
    magicDefGrowth: 1.4, // Extremely magic resistant
    statVariance: 0.20,
    baseGold: [8, 18],
    baseXP: 16,
    emoji: '👁️',
};

// =====================
// EXPORT ALL TEMPLATES
// =====================

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
    // Beasts
    wolf,
    bear,
    giantRat,
    // Undead
    skeleton,
    zombie,
    ghost,
    // Goblins
    goblin,
    hobgoblin,
    bugbear,
    // Trolls
    caveTroll,
    riverTroll,
    // Night Elves
    shadowElf,
    darkRanger,
    // Dwarves
    rogueDwarf,
    berserker,
    // Dragonkin
    drake,
    wyvern,
    // Aberrations
    mimic,
    eyeBeast,
];

/**
 * Get a monster template by ID
 */
export function getMonsterTemplate(id: string): MonsterTemplate | undefined {
    return MONSTER_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all templates in a category
 */
export function getMonstersByCategory(category: string): MonsterTemplate[] {
    return MONSTER_TEMPLATES.filter(t => t.category === category);
}
