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
    skillPool: ['gen_bite', 'gen_weaken', 'gen_rend', 'gen_frenzy', 'gen_howl'],
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
    skillPool: ['gen_claw', 'gen_maul', 'gen_enrage', 'gen_slam'],
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
    skillPool: ['gen_bite', 'gen_poison_fang', 'gen_charge'],
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
    skillPool: ['dark_shadow_strike', 'gen_strike', 'dark_fear', 'gen_bash'],
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
    skillPool: ['gen_slam', 'dark_necrotic_touch', 'gen_harden', 'dark_life_drain'],
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
    skillPool: ['dark_shadow_bolt', 'dark_curse', 'dark_shadow_strike', 'dark_fear'],
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
    skillPool: ['gen_strike', 'gen_armor_break', 'gen_bash'],
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
    skillPool: ['gen_slam', 'gen_weaken', 'gen_crushing_blow', 'gen_focus'],
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
    skillPool: ['gen_maul', 'gen_enrage', 'gen_rend', 'gen_charge'],
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
    skillPool: ['gen_slam', 'gen_harden', 'gen_maul', 'gen_bash'],
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
    skillPool: ['gen_claw', 'gen_slam', 'gen_slow', 'gen_rend'],
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
    skillPool: ['dark_shadow_strike', 'gen_charge', 'dark_shadow_bolt', 'gen_slow'],
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
    skillPool: ['dark_shadow_bolt', 'dark_life_drain', 'gen_armor_break', 'dark_shadow_strike'],
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
    skillPool: ['earth_stone_throw', 'gen_armor_break', 'earth_quake', 'gen_bash'],
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
    skillPool: ['earth_boulder_slam', 'gen_enrage', 'earth_seismic_strike', 'gen_maul'],
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
    skillPool: ['fire_flame_burst', 'fire_breath', 'gen_claw', 'fire_heat_wave'],
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
    skillPool: ['fire_breath', 'fire_inferno', 'fire_burning_claw', 'gen_charge'],
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
    skillPool: ['gen_bash', 'arcane_blast', 'gen_harden', 'arcane_dispel', 'gen_howl'],
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
    skillPool: ['arcane_mind_spike', 'arcane_blast', 'arcane_reality_warp', 'arcane_mana_burn', 'arcane_nullify'],
};

// =====================
// BOSS TEMPLATES (20 Total)
// Dungeon end bosses and raid encounters
// =====================

// === BEASTS BOSSES ===
const alphaWolf: MonsterTemplate = {
    id: 'boss-alpha-wolf',
    name: 'Alpha Wolf',
    description: 'The pack leader, a massive dire wolf with silver fur and commanding presence.',
    category: 'beasts',
    affinity: 'none',
    isBoss: true,
    baseHP: 110,
    baseAttack: 20,
    baseDefense: 7,
    baseMagicDefense: 5,
    baseSpeed: 14,
    hpGrowth: 1.3,
    attackGrowth: 1.2,
    defenseGrowth: 1.0,
    magicDefGrowth: 0.9,
    statVariance: 0.10,
    baseGold: [10, 25],
    baseXP: 25,
    emoji: '🐺👑',
    skillPool: ['gen_bite', 'gen_rend', 'gen_howl', 'boss_alpha_howl'],
};

const grizzledAncient: MonsterTemplate = {
    id: 'boss-grizzled-ancient',
    name: 'Grizzled Ancient',
    description: 'A massive ancient bear, scarred from countless battles, covered in frost.',
    category: 'beasts',
    affinity: 'none',
    isBoss: true,
    baseHP: 130,
    baseAttack: 18,
    baseDefense: 12,
    baseMagicDefense: 7,
    baseSpeed: 6,
    hpGrowth: 1.5,
    attackGrowth: 1.0,
    defenseGrowth: 1.3,
    magicDefGrowth: 1.0,
    statVariance: 0.10,
    baseGold: [12, 28],
    baseXP: 28,
    emoji: '🐻‍❄️',
    skillPool: ['gen_maul', 'gen_harden', 'gen_enrage', 'boss_hibernate'],
};

const ratKing: MonsterTemplate = {
    id: 'boss-rat-king',
    name: 'Rat King',
    description: 'A grotesque fusion of dozens of rats, their tails knotted together in an unholy crown.',
    category: 'beasts',
    affinity: 'none',
    isBoss: true,
    baseHP: 85,
    baseAttack: 22,
    baseDefense: 5,
    baseMagicDefense: 4,
    baseSpeed: 16,
    hpGrowth: 0.9,
    attackGrowth: 1.4,
    defenseGrowth: 0.8,
    magicDefGrowth: 0.7,
    statVariance: 0.15,
    baseGold: [20, 45],
    baseXP: 40,
    emoji: '👑🐀',
    lootTierBonus: 2,
    skillPool: ['gen_bite', 'gen_poison_fang', 'gen_frenzy', 'boss_swarm'],
};

// === UNDEAD BOSSES ===
const boneCollector: MonsterTemplate = {
    id: 'boss-bone-collector',
    name: 'Bone Collector',
    description: 'A towering skeletal construct made from hundreds of bones, wielding a massive scythe.',
    category: 'undead',
    affinity: 'dark',
    isBoss: true,
    baseHP: 95,
    baseAttack: 20,
    baseDefense: 8,
    baseMagicDefense: 10,
    baseSpeed: 12,
    hpGrowth: 1.0,
    attackGrowth: 1.2,
    defenseGrowth: 1.0,
    magicDefGrowth: 1.2,
    statVariance: 0.10,
    baseGold: [15, 30],
    baseXP: 30,
    emoji: '☠💀',
    skillPool: ['dark_shadow_strike', 'gen_bash', 'gen_armor_break', 'boss_reaper_strike'],
};

const lich: MonsterTemplate = {
    id: 'boss-lich',
    name: 'Lich',
    description: 'An ancient undead sorcerer, radiating dark power and dripping with necrotic energy.',
    category: 'undead',
    affinity: 'dark',
    isBoss: true,
    baseHP: 80,
    baseAttack: 24,
    baseDefense: 6,
    baseMagicDefense: 14,
    baseSpeed: 10,
    hpGrowth: 0.8,
    attackGrowth: 1.4,
    defenseGrowth: 0.8,
    magicDefGrowth: 1.5,
    statVariance: 0.10,
    baseGold: [25, 50],
    baseXP: 45,
    emoji: '🧙‍♂️💀',
    lootTierBonus: 2,
    skillPool: ['dark_shadow_bolt', 'dark_life_drain', 'dark_curse', 'boss_death_grasp'],
};

const wraithLord: MonsterTemplate = {
    id: 'boss-wraith-lord',
    name: 'Wraith Lord',
    description: 'A vengeful spectral knight, bound to this realm by an ancient oath unfulfilled.',
    category: 'undead',
    affinity: 'dark',
    isBoss: true,
    baseHP: 70,
    baseAttack: 21,
    baseDefense: 4,
    baseMagicDefense: 13,
    baseSpeed: 15,
    hpGrowth: 0.8,
    attackGrowth: 1.3,
    defenseGrowth: 0.7,
    magicDefGrowth: 1.4,
    statVariance: 0.12,
    baseGold: [14, 32],
    baseXP: 32,
    emoji: '👻⚔️',
    skillPool: ['dark_shadow_strike', 'dark_fear', 'gen_charge', 'boss_spectral_slash'],
};

// === GOBLIN BOSSES ===
const goblinWarlord: MonsterTemplate = {
    id: 'boss-goblin-warlord',
    name: 'Goblin Warlord',
    description: 'A battle-hardened goblin chieftain in spiked armor, commanding respect through fear.',
    category: 'goblins',
    affinity: 'none',
    isBoss: true,
    baseHP: 105,
    baseAttack: 19,
    baseDefense: 10,
    baseMagicDefense: 7,
    baseSpeed: 11,
    hpGrowth: 1.2,
    attackGrowth: 1.1,
    defenseGrowth: 1.2,
    magicDefGrowth: 1.0,
    statVariance: 0.10,
    baseGold: [18, 35],
    baseXP: 28,
    emoji: '👺⚔️',
    skillPool: ['gen_slam', 'gen_armor_break', 'gen_weaken', 'boss_war_cry'],
};

const bugbearTyrant: MonsterTemplate = {
    id: 'boss-bugbear-tyrant',
    name: 'Bugbear Tyrant',
    description: 'A colossal bugbear wielding a tree trunk as a club, towering over all goblinkin.',
    category: 'goblins',
    affinity: 'none',
    isBoss: true,
    baseHP: 125,
    baseAttack: 23,
    baseDefense: 9,
    baseMagicDefense: 6,
    baseSpeed: 9,
    hpGrowth: 1.4,
    attackGrowth: 1.3,
    defenseGrowth: 1.1,
    magicDefGrowth: 0.9,
    statVariance: 0.10,
    baseGold: [22, 48],
    baseXP: 42,
    emoji: '🦍👑',
    lootTierBonus: 1,
    skillPool: ['gen_maul', 'gen_crushing_blow', 'gen_enrage', 'boss_earthquake_slam'],
};

// === TROLL BOSSES ===
const mountainTroll: MonsterTemplate = {
    id: 'boss-mountain-troll',
    name: 'Mountain Troll',
    description: 'A massive stone-skinned troll covered in moss and lichens, nearly indestructible.',
    category: 'trolls',
    affinity: 'earth',
    isBoss: true,
    baseHP: 140,
    baseAttack: 16,
    baseDefense: 12,
    baseMagicDefense: 8,
    baseSpeed: 5,
    hpGrowth: 1.5,
    attackGrowth: 0.9,
    defenseGrowth: 1.3,
    magicDefGrowth: 1.0,
    statVariance: 0.10,
    baseGold: [16, 38],
    baseXP: 32,
    emoji: '🧌⛰️',
    skillPool: ['gen_slam', 'gen_harden', 'gen_bash', 'boss_regenerate'],
};

const swampHorror: MonsterTemplate = {
    id: 'boss-swamp-horror',
    name: 'Swamp Horror',
    description: 'A mutated troll-thing from the deepest swamps, oozing toxic sludge.',
    category: 'trolls',
    affinity: 'earth',
    isBoss: true,
    baseHP: 130,
    baseAttack: 19,
    baseDefense: 11,
    baseMagicDefense: 10,
    baseSpeed: 7,
    hpGrowth: 1.4,
    attackGrowth: 1.1,
    defenseGrowth: 1.2,
    magicDefGrowth: 1.2,
    statVariance: 0.10,
    baseGold: [24, 52],
    baseXP: 44,
    emoji: '🧌🌿',
    lootTierBonus: 1,
    skillPool: ['gen_poison_fang', 'gen_slam', 'gen_rend', 'boss_toxic_cloud'],
};

// === NIGHT ELF BOSSES ===
const shadowAssassin: MonsterTemplate = {
    id: 'boss-shadow-assassin',
    name: 'Shadow Assassin',
    description: 'An elite dark elf assassin, moving like liquid shadow, twin daggers dripping venom.',
    category: 'night_elves',
    affinity: 'dark',
    isBoss: true,
    baseHP: 75,
    baseAttack: 24,
    baseDefense: 6,
    baseMagicDefense: 11,
    baseSpeed: 17,
    hpGrowth: 0.85,
    attackGrowth: 1.4,
    defenseGrowth: 0.8,
    magicDefGrowth: 1.2,
    statVariance: 0.10,
    baseGold: [20, 40],
    baseXP: 35,
    emoji: '🗡️🌑',
    lootTierBonus: 1,
    skillPool: ['dark_shadow_strike', 'gen_poison_fang', 'gen_slow', 'boss_vanish_strike'],
};

const darkMatriarch: MonsterTemplate = {
    id: 'boss-dark-matriarch',
    name: 'Dark Matriarch',
    description: 'The ancient queen of the shadow elves, wielding forbidden dark magic.',
    category: 'night_elves',
    affinity: 'dark',
    isBoss: true,
    baseHP: 90,
    baseAttack: 22,
    baseDefense: 7,
    baseMagicDefense: 13,
    baseSpeed: 14,
    hpGrowth: 0.9,
    attackGrowth: 1.3,
    defenseGrowth: 0.9,
    magicDefGrowth: 1.3,
    statVariance: 0.10,
    baseGold: [26, 54],
    baseXP: 46,
    emoji: '👸🌑',
    lootTierBonus: 2,
    skillPool: ['dark_shadow_bolt', 'dark_curse', 'dark_life_drain', 'boss_void_rift'],
};

// === DWARF BOSSES ===
const ironforgeChampion: MonsterTemplate = {
    id: 'boss-ironforge-champion',
    name: 'Ironforge Champion',
    description: 'A legendary dwarf warrior in full plate, hammer crackling with earth magic.',
    category: 'dwarves',
    affinity: 'earth',
    isBoss: true,
    baseHP: 115,
    baseAttack: 18,
    baseDefense: 13,
    baseMagicDefense: 9,
    baseSpeed: 8,
    hpGrowth: 1.2,
    attackGrowth: 1.1,
    defenseGrowth: 1.4,
    magicDefGrowth: 1.1,
    statVariance: 0.10,
    baseGold: [19, 42],
    baseXP: 34,
    emoji: '⚒️🛡️',
    skillPool: ['earth_boulder_slam', 'earth_rock_shield', 'gen_bash', 'boss_hammer_fall'],
};

const runeBerserker: MonsterTemplate = {
    id: 'boss-rune-berserker',
    name: 'Rune Berserker',
    description: 'A frenzied dwarf covered in glowing runes, channeling raw elemental fury.',
    category: 'dwarves',
    affinity: 'earth',
    isBoss: true,
    baseHP: 105,
    baseAttack: 25,
    baseDefense: 7,
    baseMagicDefense: 8,
    baseSpeed: 11,
    hpGrowth: 1.1,
    attackGrowth: 1.5,
    defenseGrowth: 0.9,
    magicDefGrowth: 1.0,
    statVariance: 0.12,
    baseGold: [28, 58],
    baseXP: 48,
    emoji: '🪓⚡',
    lootTierBonus: 1,
    skillPool: ['earth_seismic_strike', 'earth_boulder_slam', 'gen_enrage', 'boss_rune_rage'],
};

// === DRAGONKIN BOSSES ===
const elderDrake: MonsterTemplate = {
    id: 'boss-elder-drake',
    name: 'Elder Drake',
    description: 'An ancient dragon that has survived countless battles, scales like molten metal.',
    category: 'dragonkin',
    affinity: 'fire',
    isBoss: true,
    baseHP: 110,
    baseAttack: 21,
    baseDefense: 10,
    baseMagicDefense: 11,
    baseSpeed: 12,
    hpGrowth: 1.2,
    attackGrowth: 1.2,
    defenseGrowth: 1.2,
    magicDefGrowth: 1.2,
    statVariance: 0.10,
    baseGold: [22, 46],
    baseXP: 38,
    emoji: '🐲',
    lootTierBonus: 1,
    skillPool: ['fire_breath', 'fire_flame_burst', 'gen_claw', 'boss_dragon_roar'],
};

const wyvernMatriarch: MonsterTemplate = {
    id: 'boss-wyvern-matriarch',
    name: 'Wyvern Matriarch',
    description: 'The queen of wyverns, larger and deadlier than her brood, tail dripping venom.',
    category: 'dragonkin',
    affinity: 'fire',
    isBoss: true,
    baseHP: 105,
    baseAttack: 23,
    baseDefense: 9,
    baseMagicDefense: 10,
    baseSpeed: 14,
    hpGrowth: 1.15,
    attackGrowth: 1.25,
    defenseGrowth: 1.1,
    magicDefGrowth: 1.15,
    statVariance: 0.10,
    baseGold: [20, 44],
    baseXP: 36,
    emoji: '🐉👑',
    lootTierBonus: 1,
    skillPool: ['fire_inferno', 'gen_poison_fang', 'fire_burning_claw', 'boss_tail_whip'],
};

const ancientDragon: MonsterTemplate = {
    id: 'boss-ancient-dragon',
    name: 'Ancient Dragon',
    description: 'A legendary wyrm, scales shimmering with arcane power, breath of pure destruction.',
    category: 'dragonkin',
    affinity: 'fire',
    isBoss: true,
    baseHP: 120,
    baseAttack: 24,
    baseDefense: 11,
    baseMagicDefense: 12,
    baseSpeed: 13,
    hpGrowth: 1.3,
    attackGrowth: 1.3,
    defenseGrowth: 1.2,
    magicDefGrowth: 1.3,
    statVariance: 0.08,
    baseGold: [30, 65],
    baseXP: 50,
    emoji: '🐉💎',
    lootTierBonus: 2,
    skillPool: ['fire_inferno', 'fire_breath', 'gen_enrage', 'boss_apocalypse_flame'],
};

// === ABERRATION BOSSES ===
const theDevourer: MonsterTemplate = {
    id: 'boss-the-devourer',
    name: 'The Devourer',
    description: 'A nightmarish mimic that has consumed hundreds of adventurers, now a shifting mass of teeth and treasure.',
    category: 'aberrations',
    affinity: 'arcane',
    isBoss: true,
    baseHP: 95,
    baseAttack: 20,
    baseDefense: 14,
    baseMagicDefense: 8,
    baseSpeed: 6,
    hpGrowth: 1.1,
    attackGrowth: 1.2,
    defenseGrowth: 1.4,
    magicDefGrowth: 0.9,
    statVariance: 0.15,
    baseGold: [25, 55],
    baseXP: 36,
    emoji: '🎁👁️',
    lootTierBonus: 2,
    skillPool: ['gen_bash', 'arcane_blast', 'gen_harden', 'boss_consume'],
};

const beholder: MonsterTemplate = {
    id: 'boss-beholder',
    name: 'Beholder',
    description: 'A massive floating orb covered in writhing eyestalks, each emanating reality-warping power.',
    category: 'aberrations',
    affinity: 'arcane',
    isBoss: true,
    baseHP: 88,
    baseAttack: 23,
    baseDefense: 6,
    baseMagicDefense: 15,
    baseSpeed: 10,
    hpGrowth: 0.9,
    attackGrowth: 1.3,
    defenseGrowth: 0.8,
    magicDefGrowth: 1.6,
    statVariance: 0.10,
    baseGold: [28, 60],
    baseXP: 48,
    emoji: '👁️👁️👁️',
    lootTierBonus: 2,
    skillPool: ['arcane_mind_spike', 'arcane_reality_warp', 'arcane_nullify', 'boss_disintegration_ray'],
};

const voidSpawn: MonsterTemplate = {
    id: 'boss-void-spawn',
    name: 'Void Spawn',
    description: 'An incomprehensible entity from beyond reality, tentacles writhing with cosmic horror.',
    category: 'aberrations',
    affinity: 'arcane',
    isBoss: true,
    baseHP: 100,
    baseAttack: 22,
    baseDefense: 7,
    baseMagicDefense: 12,
    baseSpeed: 11,
    hpGrowth: 1.0,
    attackGrowth: 1.3,
    defenseGrowth: 0.9,
    magicDefGrowth: 1.3,
    statVariance: 0.12,
    baseGold: [21, 48],
    baseXP: 40,
    emoji: '🌌',
    lootTierBonus: 1,
    skillPool: ['arcane_blast', 'arcane_mind_spike', 'dark_curse', 'boss_void_grasp'],
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
    // ====== BOSSES ======
    // Beast bosses
    alphaWolf,
    grizzledAncient,
    ratKing,
    // Undead bosses
    boneCollector,
    lich,
    wraithLord,
    // Goblin bosses
    goblinWarlord,
    bugbearTyrant,
    // Troll bosses
    mountainTroll,
    swampHorror,
    // Night Elf bosses
    shadowAssassin,
    darkMatriarch,
    // Dwarf bosses
    ironforgeChampion,
    runeBerserker,
    // Dragonkin bosses
    elderDrake,
    wyvernMatriarch,
    ancientDragon,
    // Aberration bosses
    theDevourer,
    beholder,
    voidSpawn,
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

/**
 * Get all boss templates
 */
export function getBossTemplates(): MonsterTemplate[] {
    return MONSTER_TEMPLATES.filter(t => t.isBoss === true);
}

/**
 * Get boss templates by category
 */
export function getBossByCategory(category: string): MonsterTemplate[] {
    return MONSTER_TEMPLATES.filter(t => t.isBoss === true && t.category === category);
}
