/**
 * Skill Definitions
 * 
 * Lazy-loaded skill data for the Phase 5 Skills System.
 * Skills are loaded on first access (battle start, character sheet, skill loadout modal).
 * 
 * Pattern: Lazy initialization with frozen array for immutability.
 */

import { Skill } from '../models/Skill';
import { CharacterClass } from '../models/Character';

// =====================
// LAZY LOADING PATTERN
// =====================

let _skillDefinitions: readonly Skill[] | null = null;

/**
 * Get all skill definitions (lazy-loaded).
 * First call initializes the frozen array; subsequent calls return cached reference.
 */
export function getSkillDefinitions(): readonly Skill[] {
    if (!_skillDefinitions) {
        _skillDefinitions = Object.freeze([...createSkillDefinitions()]);
    }
    return _skillDefinitions;
}

/**
 * Get a skill by ID.
 * @returns The skill or undefined if not found.
 */
export function getSkillById(skillId: string): Skill | undefined {
    return getSkillDefinitions().find(s => s.id === skillId);
}

/**
 * Get all skills available to a class (including universal skills).
 * Universal skills have an empty requiredClass array.
 * @param characterClass - The character's class
 * @returns Skills where requiredClass includes the class or is empty (universal)
 */
export function getSkillsForClass(characterClass: CharacterClass): readonly Skill[] {
    return getSkillDefinitions().filter(s =>
        s.requiredClass.length === 0 || s.requiredClass.includes(characterClass)
    );
}

/**
 * Get skills unlocked at or below a given level for a class.
 * @param characterClass - The character's class
 * @param level - Current character level
 * @returns Skills available at this level
 */
export function getUnlockedSkills(characterClass: CharacterClass, level: number): readonly Skill[] {
    return getSkillsForClass(characterClass).filter(s => s.learnLevel <= level);
}

// =====================
// SKILL DATA CREATION
// (Phase 1: Populate with actual skill definitions)
// =====================

/**
 * Create all skill definitions.
 * Called once on first access, then cached.
 */
function createSkillDefinitions(): Skill[] {
    return [
        // =====================
        // UNIVERSAL SKILLS
        // =====================
        {
            id: 'universal_meditate',
            name: 'Meditate',
            description: 'Clear your mind and restore your magical energy.',
            icon: '🧘',
            elementalType: 'Arcane',
            category: 'heal',
            manaCost: 0,
            effects: [
                { type: 'mana', power: 33 },  // 33% max mana restored
            ],
            requiredClass: [],  // Universal - available to all classes
            learnLevel: 1,
        },

        // =====================
        // WARRIOR SKILLS
        // =====================
        {
            id: 'warrior_slash',
            name: 'Slash',
            description: 'A basic but reliable sword strike.',
            icon: '⚔️',
            elementalType: 'Physical',
            category: 'damage',
            manaCost: 12,
            effects: [
                { type: 'damage', power: 150, damageType: 'physical' },  // 1.5x ATK
            ],
            requiredClass: ['warrior'],
            learnLevel: 5,
        },
        {
            id: 'warrior_sharpen',
            name: 'Sharpen',
            description: 'Hone your blade and focus your strikes.',
            icon: '🗡️',
            elementalType: 'Physical',
            category: 'buff',
            manaCost: 14,
            effects: [
                { type: 'stage', stat: 'atk', stages: 1, target: 'self' },
            ],
            requiredClass: ['warrior'],
            learnLevel: 8,
        },
        {
            id: 'warrior_fortify',
            name: 'Fortify',
            description: 'Brace yourself for incoming attacks.',
            icon: '🛡️',
            elementalType: 'Physical',
            category: 'buff',
            manaCost: 14,
            effects: [
                { type: 'stage', stat: 'def', stages: 1, target: 'self' },
            ],
            requiredClass: ['warrior'],
            learnLevel: 13,
        },
        {
            id: 'warrior_battle_hardened',
            name: 'Battle Hardened',
            description: 'Shrug off debilitating effects through sheer willpower.',
            icon: '💪',
            elementalType: 'Physical',
            category: 'cure',
            manaCost: 12,
            effects: [
                // Special: Removes ATK/DEF stage debuffs (handled in SkillService)
                { type: 'cure', cures: [], target: 'self' },
            ],
            requiredClass: ['warrior'],
            learnLevel: 18,
        },
        {
            id: 'warrior_cleave',
            name: 'Cleave',
            description: 'A powerful sweeping attack.',
            icon: '🪓',
            elementalType: 'Physical',
            category: 'damage',
            manaCost: 20,
            effects: [
                { type: 'damage', power: 220, damageType: 'physical' },  // 2.2x ATK
            ],
            requiredClass: ['warrior'],
            learnLevel: 23,
        },
        {
            id: 'warrior_enrage',
            name: 'Enrage',
            description: 'Fly into a fury, sacrificing defense for raw power.',
            icon: '😤',
            elementalType: 'Physical',
            category: 'buff',
            manaCost: 22,
            effects: [
                { type: 'stage', stat: 'atk', stages: 2, target: 'self' },
                { type: 'stage', stat: 'def', stages: -1, target: 'self' },
            ],
            requiredClass: ['warrior'],
            learnLevel: 28,
        },
        {
            id: 'warrior_reckless_strike',
            name: 'Reckless Strike',
            description: 'A devastating blow that can stagger foes.',
            icon: '💥',
            elementalType: 'Physical',
            category: 'hybrid',
            manaCost: 28,
            effects: [
                { type: 'damage', power: 250, damageType: 'physical' },  // 2.5x ATK
                { type: 'status', statusType: 'stun', duration: 1, chance: 40, target: 'enemy' },
            ],
            requiredClass: ['warrior'],
            learnLevel: 33,
        },
        {
            id: 'warrior_bloodthirst',
            name: 'Bloodthirst',
            description: 'A savage strike that drains the life from your enemy.',
            icon: '🩸',
            elementalType: 'Physical',
            category: 'hybrid',
            manaCost: 32,
            effects: [
                { type: 'damage', power: 300, damageType: 'physical', critBonus: 0 },  // 3x ATK
                // Lifesteal 20% handled via special logic in SkillService
            ],
            requiredClass: ['warrior'],
            learnLevel: 38,
            usesPerBattle: 1,  // Once per battle
        },

        // =====================
        // PALADIN SKILLS
        // =====================
        {
            id: 'paladin_holy_strike',
            name: 'Holy Strike',
            description: 'Strike with radiant holy energy.',
            icon: '✨',
            elementalType: 'Light',
            category: 'damage',
            manaCost: 16,
            effects: [
                { type: 'damage', power: 150, damageType: 'magic' },  // 1.5x ATK
            ],
            requiredClass: ['paladin'],
            learnLevel: 5,
        },
        {
            id: 'paladin_heal',
            name: 'Heal',
            description: 'Channel divine power to mend wounds.',
            icon: '💚',
            elementalType: 'Light',
            category: 'heal',
            manaCost: 20,
            effects: [
                { type: 'heal', power: 40, target: 'self' },  // 40% max HP
            ],
            requiredClass: ['paladin'],
            learnLevel: 8,
        },
        {
            id: 'paladin_shield_of_faith',
            name: 'Shield of Faith',
            description: 'Invoke divine protection.',
            icon: '🛡️',
            elementalType: 'Light',
            category: 'buff',
            manaCost: 20,
            effects: [
                { type: 'stage', stat: 'def', stages: 2, target: 'self' },
            ],
            requiredClass: ['paladin'],
            learnLevel: 13,
        },
        {
            id: 'paladin_divine_cleanse',
            name: 'Divine Cleanse',
            description: 'Purge all ailments with holy light.',
            icon: '🌟',
            elementalType: 'Light',
            category: 'cure',
            manaCost: 24,
            effects: [
                { type: 'cure', cures: 'all', target: 'self' },
            ],
            requiredClass: ['paladin'],
            learnLevel: 18,
        },
        {
            id: 'paladin_smite',
            name: 'Smite',
            description: 'A devastating holy strike especially potent against darkness.',
            icon: '⚡',
            elementalType: 'Light',
            category: 'hybrid',
            manaCost: 28,
            effects: [
                { type: 'damage', power: 200, damageType: 'magic' },  // 2x ATK, 2.5x vs Dark (service logic)
                { type: 'status', statusType: 'burn', duration: -1, chance: 30, target: 'enemy' },
            ],
            requiredClass: ['paladin'],
            learnLevel: 23,
        },
        {
            id: 'paladin_blessing',
            name: 'Blessing',
            description: 'Invoke a holy blessing that strengthens body and spirit.',
            icon: '🙏',
            elementalType: 'Light',
            category: 'buff',
            manaCost: 24,
            effects: [
                { type: 'stage', stat: 'atk', stages: 1, target: 'self' },
                { type: 'stage', stat: 'def', stages: 1, target: 'self' },
            ],
            requiredClass: ['paladin'],
            learnLevel: 28,
        },
        {
            id: 'paladin_judgment',
            name: 'Judgment',
            description: 'Call down divine wrath upon your enemy.',
            icon: '⚖️',
            elementalType: 'Light',
            category: 'damage',
            manaCost: 32,
            effects: [
                { type: 'damage', power: 280, damageType: 'magic' },  // 2.8x ATK
            ],
            requiredClass: ['paladin'],
            learnLevel: 33,
        },
        {
            id: 'paladin_divine_shield',
            name: 'Divine Shield',
            description: 'Surround yourself with impenetrable holy light.',
            icon: '🔰',
            elementalType: 'Light',
            category: 'hybrid',
            manaCost: 36,
            effects: [
                { type: 'stage', stat: 'def', stages: 2, target: 'self' },
                { type: 'heal', power: 30, target: 'self' },  // 30% max HP
            ],
            requiredClass: ['paladin'],
            learnLevel: 38,
            usesPerBattle: 1,
        },

        // =====================
        // TECHNOMANCER SKILLS
        // =====================
        {
            id: 'technomancer_spark',
            name: 'Spark',
            description: 'Release a bolt of crackling electricity.',
            icon: '⚡',
            elementalType: 'Lightning',
            category: 'damage',
            manaCost: 18,
            effects: [
                { type: 'damage', power: 140, damageType: 'magic' },  // 1.4x ATK
            ],
            requiredClass: ['technomancer'],
            learnLevel: 5,
        },
        {
            id: 'technomancer_weaken_defenses',
            name: 'Weaken Defenses',
            description: 'Analyze enemy defenses and find weak points.',
            icon: '🔍',
            elementalType: 'Lightning',
            category: 'debuff',
            manaCost: 16,
            effects: [
                { type: 'stage', stat: 'def', stages: -1, target: 'enemy' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 8,
        },
        {
            id: 'technomancer_flame_burst',
            name: 'Flame Burst',
            description: 'Launch a ball of fire at your enemy.',
            icon: '🔥',
            elementalType: 'Fire',
            category: 'hybrid',
            manaCost: 24,
            effects: [
                { type: 'damage', power: 180, damageType: 'magic' },  // 1.8x ATK
                { type: 'status', statusType: 'burn', duration: -1, chance: 40, target: 'enemy' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 13,
        },
        {
            id: 'technomancer_reboot',
            name: 'Reboot',
            description: 'Clear system errors and malfunctions.',
            icon: '🔄',
            elementalType: 'Lightning',
            category: 'cure',
            manaCost: 14,
            effects: [
                { type: 'cure', cures: ['burn', 'poison', 'confusion'], target: 'self' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 18,
        },
        {
            id: 'technomancer_frost_bolt',
            name: 'Frost Bolt',
            description: 'Blast enemy with freezing energy.',
            icon: '❄️',
            elementalType: 'Ice',
            category: 'hybrid',
            manaCost: 28,
            effects: [
                { type: 'damage', power: 200, damageType: 'magic' },  // 2x ATK
                { type: 'status', statusType: 'freeze', duration: 2, chance: 35, target: 'enemy' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 23,
        },
        {
            id: 'technomancer_overcharge',
            name: 'Overcharge',
            description: 'Supercharge your systems for maximum output.',
            icon: '🔋',
            elementalType: 'Lightning',
            category: 'buff',
            manaCost: 22,
            effects: [
                { type: 'stage', stat: 'atk', stages: 2, target: 'self' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 28,
        },
        {
            id: 'technomancer_chain_lightning',
            name: 'Chain Lightning',
            description: 'A devastating bolt that arcs through enemies.',
            icon: '⛈️',
            elementalType: 'Lightning',
            category: 'damage',
            manaCost: 32,
            effects: [
                { type: 'damage', power: 250, damageType: 'magic' },  // 2.5x ATK
            ],
            requiredClass: ['technomancer'],
            learnLevel: 33,
        },
        {
            id: 'technomancer_meteor',
            name: 'Meteor',
            description: 'Call down a flaming meteor from the sky.',
            icon: '☄️',
            elementalType: 'Fire',
            category: 'hybrid',
            manaCost: 38,
            effects: [
                { type: 'damage', power: 300, damageType: 'magic' },  // 3x ATK
                { type: 'status', statusType: 'burn', duration: -1, chance: 50, target: 'enemy' },
            ],
            requiredClass: ['technomancer'],
            learnLevel: 38,
            usesPerBattle: 1,
        },

        // =====================
        // SCHOLAR SKILLS
        // =====================
        {
            id: 'scholar_arcane_missile',
            name: 'Arcane Missile',
            description: 'Launch a precise bolt of pure magical energy.',
            icon: '💫',
            elementalType: 'Arcane',
            category: 'damage',
            manaCost: 18,
            effects: [
                { type: 'damage', power: 160, damageType: 'magic' },  // 1.6x ATK
            ],
            requiredClass: ['scholar'],
            learnLevel: 5,
        },
        {
            id: 'scholar_analyze',
            name: 'Analyze',
            description: 'Study your opponent to reveal vulnerabilities.',
            icon: '🔬',
            elementalType: 'Arcane',
            category: 'debuff',
            manaCost: 16,
            effects: [
                { type: 'stage', stat: 'def', stages: -1, target: 'enemy' },
            ],
            requiredClass: ['scholar'],
            learnLevel: 8,
        },
        {
            id: 'scholar_mana_shield',
            name: 'Mana Shield',
            description: 'Convert mana into a protective barrier.',
            icon: '🔮',
            elementalType: 'Arcane',
            category: 'buff',
            manaCost: 18,
            effects: [
                { type: 'stage', stat: 'def', stages: 1, target: 'self' },
            ],
            requiredClass: ['scholar'],
            learnLevel: 13,
        },
        {
            id: 'scholar_clarity',
            name: 'Clarity',
            description: 'Clear the mind and restore focus.',
            icon: '🧠',
            elementalType: 'Arcane',
            category: 'cure',
            manaCost: 14,
            effects: [
                { type: 'cure', cures: ['burn', 'poison', 'confusion'], target: 'self' },
            ],
            requiredClass: ['scholar'],
            learnLevel: 18,
        },
        {
            id: 'scholar_mind_spike',
            name: 'Mind Spike',
            description: 'Assault the enemy\'s mind with psychic energy.',
            icon: '🌀',
            elementalType: 'Arcane',
            category: 'hybrid',
            manaCost: 26,
            effects: [
                { type: 'damage', power: 200, damageType: 'magic' },  // 2x ATK
                { type: 'status', statusType: 'confusion', duration: 3, chance: 35, target: 'enemy' },
            ],
            requiredClass: ['scholar'],
            learnLevel: 23,
        },
        {
            id: 'scholar_exploit_weakness',
            name: 'Exploit Weakness',
            description: 'Expose critical weaknesses in enemy defenses.',
            icon: '🎯',
            elementalType: 'Arcane',
            category: 'debuff',
            manaCost: 22,
            effects: [
                { type: 'stage', stat: 'def', stages: -2, target: 'enemy' },
            ],
            requiredClass: ['scholar'],
            learnLevel: 28,
        },
        {
            id: 'scholar_meteor_strike',
            name: 'Meteor Strike',
            description: 'Call down a flaming meteor with arcane power.',
            icon: '🌠',
            elementalType: 'Arcane',
            category: 'damage',
            manaCost: 34,
            effects: [
                { type: 'damage', power: 280, damageType: 'magic' },  // 2.8x ATK
            ],
            requiredClass: ['scholar'],
            learnLevel: 33,
        },
        {
            id: 'scholar_singularity',
            name: 'Singularity',
            description: 'Create a collapsing vortex of pure magical energy.',
            icon: '🕳️',
            elementalType: 'Arcane',
            category: 'damage',
            manaCost: 38,
            effects: [
                { type: 'damage', power: 350, damageType: 'magic', ignoresStages: true },  // 3.5x ATK, ignores DEF stages
            ],
            requiredClass: ['scholar'],
            learnLevel: 38,
            usesPerBattle: 1,
        },

        // =====================
        // ROGUE SKILLS
        // =====================
        {
            id: 'rogue_backstab',
            name: 'Backstab',
            description: 'Strike from the shadows for massive damage.',
            icon: '🗡️',
            elementalType: 'Physical',
            category: 'damage',
            manaCost: 14,
            effects: [
                { type: 'damage', power: 200, damageType: 'physical', critBonus: 30 },  // 2x ATK, +30% crit
            ],
            requiredClass: ['rogue'],
            learnLevel: 5,
        },
        {
            id: 'rogue_agility',
            name: 'Agility',
            description: 'Move with increased speed and precision.',
            icon: '💨',
            elementalType: 'Physical',
            category: 'buff',
            manaCost: 12,
            effects: [
                { type: 'stage', stat: 'speed', stages: 1, target: 'self' },
            ],
            requiredClass: ['rogue'],
            learnLevel: 8,
        },
        {
            id: 'rogue_poison_blade',
            name: 'Poison Blade',
            description: 'Coat your weapon with deadly toxin.',
            icon: '🧪',
            elementalType: 'Poison',
            category: 'hybrid',
            manaCost: 18,
            effects: [
                { type: 'damage', power: 130, damageType: 'physical' },  // 1.3x ATK
                { type: 'status', statusType: 'poison', duration: -1, chance: 40, target: 'enemy', severity: 'moderate' },
            ],
            requiredClass: ['rogue'],
            learnLevel: 13,
        },
        {
            id: 'rogue_nimble_recovery',
            name: 'Nimble Recovery',
            description: 'Shake off toxins and clear your head with quick reflexes.',
            icon: '🏃',
            elementalType: 'Physical',
            category: 'cure',
            manaCost: 12,
            effects: [
                { type: 'cure', cures: ['poison', 'bleed', 'confusion'], target: 'self' },
            ],
            requiredClass: ['rogue'],
            learnLevel: 18,
        },
        {
            id: 'rogue_shadow_strike',
            name: 'Shadow Strike',
            description: 'A precise strike that exploits openings.',
            icon: '🌑',
            elementalType: 'Dark',
            category: 'damage',
            manaCost: 22,
            effects: [
                { type: 'damage', power: 250, damageType: 'physical', ignoresStages: true },  // 2.5x ATK, ignores DEF stages
            ],
            requiredClass: ['rogue'],
            learnLevel: 23,
        },
        {
            id: 'rogue_focus',
            name: 'Focus',
            description: 'Concentrate on your target for a lethal strike.',
            icon: '🎯',
            elementalType: 'Physical',
            category: 'buff',
            manaCost: 18,
            effects: [
                { type: 'stage', stat: 'atk', stages: 2, target: 'self' },
            ],
            requiredClass: ['rogue'],
            learnLevel: 28,
        },
        {
            id: 'rogue_fan_of_knives',
            name: 'Fan of Knives',
            description: 'Hurl a flurry of poisoned blades.',
            icon: '🔪',
            elementalType: 'Physical',
            category: 'hybrid',
            manaCost: 26,
            effects: [
                { type: 'damage', power: 220, damageType: 'physical' },  // 2.2x ATK
                { type: 'status', statusType: 'bleed', duration: -1, chance: 40, target: 'enemy', severity: 'moderate' },
            ],
            requiredClass: ['rogue'],
            learnLevel: 33,
        },
        {
            id: 'rogue_assassinate',
            name: 'Assassinate',
            description: 'A lethal strike that ends battles instantly.',
            icon: '💀',
            elementalType: 'Physical',
            category: 'damage',
            manaCost: 30,
            effects: [
                { type: 'damage', power: 400, damageType: 'physical', critBonus: 50 },  // 4x ATK, +50% crit
            ],
            requiredClass: ['rogue'],
            learnLevel: 38,
            usesPerBattle: 1,
        },

        // =====================
        // CLERIC SKILLS
        // =====================
        {
            id: 'cleric_holy_light',
            name: 'Holy Light',
            description: 'Channel divine energy to mend wounds.',
            icon: '✨',
            elementalType: 'Light',
            category: 'heal',
            manaCost: 18,
            effects: [
                { type: 'heal', power: 35, target: 'self' },  // 35% max HP
            ],
            requiredClass: ['cleric'],
            learnLevel: 5,
        },
        {
            id: 'cleric_bless',
            name: 'Bless',
            description: 'Invoke a blessing that protects from harm.',
            icon: '🙏',
            elementalType: 'Light',
            category: 'buff',
            manaCost: 16,
            effects: [
                { type: 'stage', stat: 'def', stages: 1, target: 'self' },
            ],
            requiredClass: ['cleric'],
            learnLevel: 8,
        },
        {
            id: 'cleric_smite_evil',
            name: 'Smite Evil',
            description: 'Strike down the wicked with holy wrath.',
            icon: '⚡',
            elementalType: 'Light',
            category: 'hybrid',
            manaCost: 22,
            effects: [
                { type: 'damage', power: 160, damageType: 'magic' },  // 1.6x ATK (2x vs Dark in service)
                { type: 'heal', power: 15, target: 'self' },  // 15% max HP on hit
            ],
            requiredClass: ['cleric'],
            learnLevel: 13,
        },
        {
            id: 'cleric_full_heal',
            name: 'Full Heal',
            description: 'Channel powerful restorative magic.',
            icon: '💖',
            elementalType: 'Light',
            category: 'hybrid',
            manaCost: 26,
            effects: [
                { type: 'heal', power: 50, target: 'self' },  // 50% max HP
                { type: 'cure', cures: 'all', target: 'self' },
            ],
            requiredClass: ['cleric'],
            learnLevel: 18,
        },
        {
            id: 'cleric_prayer',
            name: 'Prayer',
            description: 'Speak a prayer of healing.',
            icon: '🕯️',
            elementalType: 'Light',
            category: 'heal',
            manaCost: 24,
            effects: [
                { type: 'heal', power: 45, target: 'self' },  // 45% max HP
            ],
            requiredClass: ['cleric'],
            learnLevel: 23,
        },
        {
            id: 'cleric_divine_protection',
            name: 'Divine Protection',
            description: 'Surround yourself with divine light.',
            icon: '🛡️',
            elementalType: 'Light',
            category: 'buff',
            manaCost: 24,
            effects: [
                { type: 'stage', stat: 'def', stages: 2, target: 'self' },
            ],
            requiredClass: ['cleric'],
            learnLevel: 28,
        },
        {
            id: 'cleric_holy_nova',
            name: 'Holy Nova',
            description: 'Release a burst of holy energy.',
            icon: '💥',
            elementalType: 'Light',
            category: 'damage',
            manaCost: 32,
            effects: [
                { type: 'damage', power: 250, damageType: 'magic' },  // 2.5x ATK
            ],
            requiredClass: ['cleric'],
            learnLevel: 33,
        },
        {
            id: 'cleric_resurrection',
            name: 'Resurrection',
            description: 'Call upon divine power to defy death.',
            icon: '👼',
            elementalType: 'Light',
            category: 'hybrid',
            manaCost: 40,
            effects: [
                { type: 'heal', power: 100, target: 'self' },  // Full HP
                { type: 'cure', cures: 'all', target: 'self' },
            ],
            requiredClass: ['cleric'],
            learnLevel: 38,
            usesPerBattle: 1,
        },

        // =====================
        // BARD SKILLS
        // =====================
        {
            id: 'bard_power_chord',
            name: 'Power Chord',
            description: 'Strike a powerful chord that damages and inspires.',
            icon: '🎸',
            elementalType: 'Physical',
            category: 'damage',
            manaCost: 14,
            effects: [
                { type: 'damage', power: 140, damageType: 'physical' },  // 1.4x ATK
            ],
            requiredClass: ['bard'],
            learnLevel: 5,
        },
        {
            id: 'bard_inspiring_ballad',
            name: 'Inspiring Ballad',
            description: 'Play an uplifting melody that bolsters courage.',
            icon: '🎵',
            elementalType: 'Arcane',
            category: 'buff',
            manaCost: 16,
            effects: [
                { type: 'stage', stat: 'atk', stages: 1, target: 'self' },
            ],
            requiredClass: ['bard'],
            learnLevel: 8,
        },
        {
            id: 'bard_song_of_rest',
            name: 'Song of Rest',
            description: 'Play a soothing tune that mends wounds.',
            icon: '🎼',
            elementalType: 'Arcane',
            category: 'heal',
            manaCost: 18,
            effects: [
                { type: 'heal', power: 30, target: 'self' },  // 30% max HP
            ],
            requiredClass: ['bard'],
            learnLevel: 13,
        },
        {
            id: 'bard_inspiring_song',
            name: 'Inspiring Song',
            description: 'Play an inspiring melody that clears the mind.',
            icon: '🎤',
            elementalType: 'Arcane',
            category: 'cure',
            manaCost: 14,
            effects: [
                { type: 'cure', cures: ['confusion'], target: 'self' },
                // Also removes ATK debuffs (handled in SkillService)
            ],
            requiredClass: ['bard'],
            learnLevel: 18,
        },
        {
            id: 'bard_vicious_mockery',
            name: 'Vicious Mockery',
            description: 'Hurl devastating insults at your enemy.',
            icon: '😈',
            elementalType: 'Arcane',
            category: 'hybrid',
            manaCost: 22,
            effects: [
                { type: 'damage', power: 160, damageType: 'magic' },  // 1.6x ATK
                { type: 'stage', stat: 'atk', stages: -1, target: 'enemy' },
            ],
            requiredClass: ['bard'],
            learnLevel: 23,
        },
        {
            id: 'bard_war_chant',
            name: 'War Chant',
            description: 'Beat a thunderous rhythm that empowers strikes.',
            icon: '🥁',
            elementalType: 'Arcane',
            category: 'buff',
            manaCost: 24,
            effects: [
                { type: 'stage', stat: 'atk', stages: 2, target: 'self' },
            ],
            requiredClass: ['bard'],
            learnLevel: 28,
        },
        {
            id: 'bard_lullaby',
            name: 'Lullaby',
            description: 'Play a haunting melody that induces sleep.',
            icon: '😴',
            elementalType: 'Arcane',
            category: 'status',
            manaCost: 26,
            effects: [
                { type: 'status', statusType: 'sleep', duration: 4, chance: 60, target: 'enemy' },
            ],
            requiredClass: ['bard'],
            learnLevel: 33,
        },
        {
            id: 'bard_symphony',
            name: 'Symphony',
            description: 'Conduct a devastating orchestral assault.',
            icon: '🎻',
            elementalType: 'Arcane',
            category: 'hybrid',
            manaCost: 32,
            effects: [
                { type: 'damage', power: 300, damageType: 'magic' },  // 3x ATK
                { type: 'stage', stat: 'atk', stages: 1, target: 'self' },
            ],
            requiredClass: ['bard'],
            learnLevel: 38,
            usesPerBattle: 1,
        },
    ];
}

