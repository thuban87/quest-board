/**
 * Loot Generation Service
 * 
 * Generates procedural gear, gold, and consumable rewards.
 * Used by quest completion, combat victory, and exploration chests.
 */

import { Quest } from '../models/Quest';
import { Character, StatType, CharacterClass } from '../models/Character';
import {
    GearItem,
    GearSlot,
    GearTier,
    GearStats,
    LootReward,
    LootDrop,
    PRIMARY_GEAR_SLOTS,
    GEAR_SLOT_ICONS,
    TIER_INFO,
    GEAR_TIERS,
    ArmorType,
    WeaponType,
    CLASS_ARMOR_PROFICIENCY,
    CLASS_WEAPON_PROFICIENCY,
    calculateBaseStatValue,
    calculateSellValue,
    generateGearId,
} from '../models/Gear';
import { createUniqueItem, UniqueItemTemplate } from '../data/uniqueItems';

// ============================================
// Configuration
// ============================================

/**
 * Quest type to gear slot mapping (default)
 * Users can override this in settings.
 */
const DEFAULT_QUEST_SLOT_MAPPING: Record<string, GearSlot[]> = {
    main: ['chest', 'weapon', 'head'],
    side: ['legs', 'boots', 'shield'],
    training: ['head', 'shield'],
    guild: ['chest', 'legs'],
    recurring: ['boots', 'accessory1'],
    daily: [], // Daily quests give consumables, not gear
};

/**
 * Tier drop rates by difficulty (0-100 scale)
 * Row total should equal 100
 */
const TIER_DROP_RATES: Record<string, Record<GearTier, number>> = {
    trivial: { common: 0, adept: 80, journeyman: 20, master: 0, epic: 0, legendary: 0 },
    easy: { common: 0, adept: 60, journeyman: 35, master: 5, epic: 0, legendary: 0 },
    medium: { common: 0, adept: 40, journeyman: 40, master: 18, epic: 2, legendary: 0 },
    hard: { common: 0, adept: 20, journeyman: 35, master: 35, epic: 9, legendary: 1 },
    epic: { common: 0, adept: 10, journeyman: 25, master: 40, epic: 20, legendary: 5 },
};

/**
 * Training mode tier drop rates (only common/adept)
 */
const TRAINING_TIER_DROP_RATES: Record<GearTier, number> = {
    common: 70,
    adept: 30,
    journeyman: 0,
    master: 0,
    epic: 0,
    legendary: 0,
};

/**
 * Gold rewards by quest priority
 */
const GOLD_BY_PRIORITY: Record<string, { min: number; max: number }> = {
    low: { min: 5, max: 15 },
    medium: { min: 15, max: 35 },
    high: { min: 35, max: 60 },
    critical: { min: 60, max: 100 },
};

/**
 * Gear name templates by slot
 */
const GEAR_NAME_TEMPLATES: Record<GearSlot, string[]> = {
    head: ['Helm', 'Hood', 'Cap', 'Crown', 'Circlet', 'Headband'],
    chest: ['Chestplate', 'Vest', 'Tunic', 'Breastplate', 'Robe', 'Jerkin'],
    legs: ['Leggings', 'Greaves', 'Trousers', 'Cuisses', 'Pants'],
    boots: ['Boots', 'Shoes', 'Greaves', 'Sandals', 'Treads'],
    weapon: ['Sword', 'Blade', 'Axe', 'Mace', 'Dagger', 'Staff', 'Spear'],
    shield: ['Shield', 'Buckler', 'Aegis', 'Ward', 'Barrier'],
    accessory1: ['Ring', 'Band', 'Loop'],
    accessory2: ['Amulet', 'Pendant', 'Medallion'],
    accessory3: ['Charm', 'Trinket', 'Token'],
};

/**
 * Tier prefixes for gear names
 */
const TIER_PREFIXES: Record<GearTier, string[]> = {
    common: ['Worn', 'Simple', 'Basic', 'Plain'],
    adept: ['Sturdy', 'Reliable', 'Solid', 'Quality'],
    journeyman: ['Fine', 'Crafted', 'Tempered', 'Refined'],
    master: ['Masterwork', 'Superior', 'Exceptional', 'Elite'],
    epic: ['Magnificent', 'Glorious', 'Heroic', 'Mystic'],
    legendary: ['Divine', 'Ancient', 'Mythic', 'Eternal'],
};

/**
 * Primary stats by slot
 */
const SLOT_PRIMARY_STATS: Record<GearSlot, StatType[]> = {
    head: ['intelligence', 'wisdom'],
    chest: ['constitution', 'strength'],
    legs: ['constitution', 'dexterity'],
    boots: ['dexterity', 'constitution'],
    weapon: ['strength', 'dexterity'],
    shield: ['constitution', 'strength'],
    accessory1: ['charisma', 'wisdom'],
    accessory2: ['intelligence', 'charisma'],
    accessory3: ['wisdom', 'intelligence'],
};

// ============================================
// Loot Generation Service
// ============================================

export class LootGenerationService {
    private customSlotMapping: Record<string, GearSlot[]> | null = null;

    /**
     * Set custom quest type to slot mapping (from user settings)
     */
    setCustomSlotMapping(mapping: Record<string, GearSlot[]>): void {
        this.customSlotMapping = mapping;
    }

    /**
     * Generate loot for a completed quest
     */
    generateQuestLoot(quest: Quest, character: Character): LootDrop {
        const rewards: LootReward[] = [];

        // 1. Always give gold (based on priority/urgency)
        const goldAmount = this.calculateQuestGold(quest.priority);
        rewards.push({ type: 'gold', amount: goldAmount });

        // 2. Check if this quest type rewards gear
        const questType = quest.questType?.toLowerCase() || 'main';
        const isTraining = questType === 'training' || character.isTrainingMode;

        // Daily quests give consumables instead of gear
        if (questType === 'daily') {
            rewards.push({
                type: 'consumable',
                itemId: 'health_potion',
                quantity: 1,
            });
            return rewards;
        }

        // 3. Roll for gear (based on difficulty)
        const possibleSlots = this.getSlotsForQuestType(questType);
        if (possibleSlots.length > 0) {
            const slot = this.pickRandom(possibleSlots);
            // Use quest.difficulty for tier, defaulting to 'medium' for old quests without the field
            const difficulty = (quest as any).difficulty || 'medium';
            const tier = this.rollTier(difficulty, isTraining);
            const level = this.rollGearLevel(character.level);

            const gearItem = this.generateGearItem(slot, tier, level, 'quest', quest.questId, character.class);
            rewards.push({ type: 'gear', item: gearItem });
        }

        return rewards;
    }

    /**
     * Generate loot from combat victory
     */
    generateCombatLoot(
        monsterTier: 'minion' | 'normal' | 'elite' | 'boss',
        monsterLevel: number,
        character: Character,
        uniqueDropId?: string
    ): LootDrop {
        const rewards: LootReward[] = [];

        // Gold based on monster tier
        const goldMultiplier = {
            minion: 0.5,
            normal: 1.0,
            elite: 2.0,
            boss: 5.0,
        };
        const baseGold = 10 + monsterLevel * 2;
        const goldAmount = Math.floor(baseGold * goldMultiplier[monsterTier]);
        rewards.push({ type: 'gold', amount: goldAmount });

        // Gear drop chance based on tier
        const gearChance = {
            minion: 0.1,
            normal: 0.25,
            elite: 0.5,
            boss: 1.0,
        };

        if (Math.random() < gearChance[monsterTier]) {
            // Check for unique drop first (boss-specific item)
            if (uniqueDropId) {
                const uniqueItem = createUniqueItem(uniqueDropId, 'combat');
                if (uniqueItem) {
                    rewards.push({ type: 'gear', item: uniqueItem });
                    return rewards; // Unique replaces normal drop
                }
            }

            // Normal procedural gear
            const slot = this.pickRandom(PRIMARY_GEAR_SLOTS);
            const difficulty = monsterTier === 'boss' ? 'epic' : monsterTier === 'elite' ? 'hard' : 'medium';
            const tier = this.rollTier(difficulty, false);
            const level = this.rollGearLevel(monsterLevel);

            const gearItem = this.generateGearItem(slot, tier, level, 'combat', undefined, character.class);
            rewards.push({ type: 'gear', item: gearItem });
        }

        return rewards;
    }

    /**
     * Generate loot from exploration chest
     */
    generateChestLoot(
        chestTier: 'wooden' | 'iron' | 'golden',
        roomLevel: number,
        character: Character
    ): LootDrop {
        const rewards: LootReward[] = [];

        // Gold amount by chest tier
        const goldRanges = {
            wooden: { min: 10, max: 30 },
            iron: { min: 25, max: 60 },
            golden: { min: 50, max: 150 },
        };
        const range = goldRanges[chestTier];
        const goldAmount = this.randomRange(range.min, range.max);
        rewards.push({ type: 'gold', amount: goldAmount });

        // Gear chance by tier
        const gearChance = {
            wooden: 0.3,
            iron: 0.6,
            golden: 1.0,
        };

        if (Math.random() < gearChance[chestTier]) {
            const slot = this.pickRandom(PRIMARY_GEAR_SLOTS);
            const difficulty = chestTier === 'golden' ? 'hard' : chestTier === 'iron' ? 'medium' : 'easy';
            const tier = this.rollTier(difficulty, false);
            const level = this.rollGearLevel(roomLevel);

            const gearItem = this.generateGearItem(slot, tier, level, 'exploration', undefined, character.class);
            rewards.push({ type: 'gear', item: gearItem });
        }

        // Golden chests always have a consumable too
        if (chestTier === 'golden') {
            rewards.push({
                type: 'consumable',
                itemId: Math.random() < 0.5 ? 'health_potion' : 'mana_potion',
                quantity: 2,
            });
        }

        return rewards;
    }

    /**
     * Generate a procedural gear item with random stats
     * If characterClass is provided, generates class-appropriate armor/weapon types
     */
    generateGearItem(
        slot: GearSlot,
        tier: GearTier,
        level: number,
        source: 'quest' | 'combat' | 'exploration' | 'shop' | 'smelt' = 'quest',
        sourceId?: string,
        characterClass?: CharacterClass
    ): GearItem {
        const name = this.generateGearName(slot, tier);
        const stats = this.generateGearStats(slot, tier, level);
        const sellValue = calculateSellValue(level, tier);

        // Determine armor/weapon type based on slot and character class
        let armorType: ArmorType | undefined;
        let weaponType: WeaponType | undefined;

        if (slot === 'weapon') {
            weaponType = this.pickWeaponType(characterClass);
        } else if (slot === 'shield') {
            weaponType = 'shield';
        } else if (!slot.startsWith('accessory')) {
            // Armor slot
            armorType = this.pickArmorType(characterClass);
        }

        return {
            id: generateGearId(),
            name,
            description: this.generateDescription(tier, slot),
            slot,
            armorType,
            weaponType,
            tier,
            level,
            stats,
            sellValue,
            iconEmoji: GEAR_SLOT_ICONS[slot],
            source,
            sourceId,
            acquiredAt: new Date().toISOString(),
        };
    }

    /**
     * Pick an armor type appropriate for the character class
     * If no class provided, picks randomly
     */
    private pickArmorType(characterClass?: CharacterClass): ArmorType {
        if (characterClass) {
            const proficiency = CLASS_ARMOR_PROFICIENCY[characterClass];
            // Prefer the heaviest armor the class can wear
            return proficiency[proficiency.length - 1];
        }
        // Random for unknown class
        const types: ArmorType[] = ['cloth', 'leather', 'mail', 'plate'];
        return this.pickRandom(types);
    }

    /**
     * Pick a weapon type appropriate for the character class
     * If no class provided, picks randomly
     */
    private pickWeaponType(characterClass?: CharacterClass): WeaponType {
        if (characterClass) {
            const proficiency = CLASS_WEAPON_PROFICIENCY[characterClass].filter(w => w !== 'shield');
            return this.pickRandom(proficiency);
        }
        // Random for unknown class
        const types: WeaponType[] = ['sword', 'axe', 'mace', 'dagger', 'staff', 'wand', 'bow'];
        return this.pickRandom(types);
    }

    /**
     * Calculate gold reward for a quest
     */
    private calculateQuestGold(priority: string): number {
        const range = GOLD_BY_PRIORITY[priority.toLowerCase()] || GOLD_BY_PRIORITY.medium;
        return this.randomRange(range.min, range.max);
    }

    /**
     * Get possible gear slots for a quest type
     */
    private getSlotsForQuestType(questType: string): GearSlot[] {
        const type = questType.toLowerCase();

        // Check custom mapping first
        if (this.customSlotMapping && type in this.customSlotMapping) {
            return this.customSlotMapping[type];
        }

        // Fall back to defaults
        return DEFAULT_QUEST_SLOT_MAPPING[type] || ['weapon', 'chest'];
    }

    /**
     * Roll a gear tier based on difficulty
     */
    private rollTier(difficulty: string, isTraining: boolean): GearTier {
        const rates = isTraining
            ? TRAINING_TIER_DROP_RATES
            : (TIER_DROP_RATES[difficulty.toLowerCase()] || TIER_DROP_RATES.easy);

        const roll = Math.random() * 100;
        let cumulative = 0;

        for (const tier of GEAR_TIERS) {
            cumulative += rates[tier];
            if (roll < cumulative) {
                return tier;
            }
        }

        return 'adept'; // Fallback
    }

    /**
     * Roll gear level with variance around character level
     */
    private rollGearLevel(characterLevel: number): number {
        // GearLevel = CharacterLevel + Random(-2, +3)
        const variance = this.randomRange(-2, 3);
        const level = characterLevel + variance;
        return Math.max(1, Math.min(40, level));
    }

    /**
     * Generate a gear name
     */
    private generateGearName(slot: GearSlot, tier: GearTier): string {
        const prefix = this.pickRandom(TIER_PREFIXES[tier]);
        const base = this.pickRandom(GEAR_NAME_TEMPLATES[slot]);
        return `${prefix} ${base}`;
    }

    /**
     * Generate gear stats
     */
    private generateGearStats(slot: GearSlot, tier: GearTier, level: number): GearStats {
        const primaryStat = this.pickRandom(SLOT_PRIMARY_STATS[slot]);
        const primaryValue = calculateBaseStatValue(level, tier);

        const stats: GearStats = {
            primaryStat,
            primaryValue,
        };

        // Add combat bonuses based on slot
        switch (slot) {
            case 'weapon':
                stats.attackPower = Math.floor(primaryValue * 1.5);
                if (Math.random() < 0.3 + TIER_INFO[tier].statMultiplier * 0.1) {
                    stats.critChance = Math.floor(5 + TIER_INFO[tier].statMultiplier * 3);
                }
                break;

            case 'shield':
                stats.defense = Math.floor(primaryValue * 0.8);
                stats.blockChance = Math.floor(10 + TIER_INFO[tier].statMultiplier * 5);
                break;

            case 'chest':
            case 'legs':
                stats.defense = Math.floor(primaryValue * 0.6);
                stats.magicDefense = Math.floor(primaryValue * 0.3);
                break;

            case 'head':
                stats.defense = Math.floor(primaryValue * 0.4);
                stats.magicDefense = Math.floor(primaryValue * 0.5);
                break;

            case 'boots':
                stats.defense = Math.floor(primaryValue * 0.3);
                if (Math.random() < 0.4) {
                    stats.dodgeChance = Math.floor(3 + TIER_INFO[tier].statMultiplier * 2);
                }
                break;

            case 'accessory1':
            case 'accessory2':
            case 'accessory3':
                // Accessories have varied bonuses
                if (Math.random() < 0.5) {
                    stats.critChance = Math.floor(2 + TIER_INFO[tier].statMultiplier * 2);
                } else {
                    stats.dodgeChance = Math.floor(2 + TIER_INFO[tier].statMultiplier * 1.5);
                }
                break;
        }

        // Higher tiers get secondary stats
        if (GEAR_TIERS.indexOf(tier) >= 2) { // Journeyman+
            const allStats: StatType[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            const secondaryStat = this.pickRandom(allStats.filter(s => s !== primaryStat));
            stats.secondaryStats = {
                [secondaryStat]: Math.floor(primaryValue * 0.3),
            };
        }

        return stats;
    }

    /**
     * Generate a description based on tier
     */
    private generateDescription(tier: GearTier, slot: GearSlot): string {
        const descriptions: Record<GearTier, string[]> = {
            common: [
                'A basic piece of equipment.',
                'Simple but functional.',
                'Gets the job done.',
            ],
            adept: [
                'Well-crafted by a skilled artisan.',
                'Reliable equipment for any adventure.',
                'A step above the ordinary.',
            ],
            journeyman: [
                'Forged with care and expertise.',
                'A fine example of craftsmanship.',
                'Built to last through many battles.',
            ],
            master: [
                'A masterpiece of the forge.',
                'Created by hands touched by genius.',
                'Exceptional in every way.',
            ],
            epic: [
                'Imbued with traces of magic.',
                'A treasure worthy of heroes.',
                'Its power resonates with destiny.',
            ],
            legendary: [
                'An artifact of immense power.',
                'Legends whisper of its origins.',
                'Few have wielded such magnificence.',
            ],
        };

        return this.pickRandom(descriptions[tier]);
    }

    /**
     * Pick a random element from an array
     */
    private pickRandom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Generate random integer in range (inclusive)
     */
    private randomRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Export singleton instance
export const lootGenerationService = new LootGenerationService();
