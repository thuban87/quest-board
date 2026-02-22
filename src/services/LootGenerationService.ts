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
    ALL_GEAR_SLOTS,
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
    getNextTier,
    EquippedGearMap,
} from '../models/Gear';
import { createUniqueItem } from '../data/uniqueItems';
import { setBonusService } from './SetBonusService';
import { getHpPotionForLevel, getMpPotionForLevel, CLEANSING_IDS, TACTICAL_IDS, STAT_ELIXIR_IDS, ENCHANTMENT_IDS } from '../models/Consumable';
import { MonsterTier } from '../config/combatConfig';
import { getGoldMultiplierFromPowerUps, expirePowerUps } from './PowerUpService';
import { getGoldMultiplier, getLootBonus, getUtilityBonus } from './AccessoryEffectService';
import {
    ACCESSORY_TIER_POOLS,
    AccessoryTier,
    AccessoryType,
    getAccessoryTemplate,
    getAccessoryTemplatesByTier,
    generateT1AccessoryName,
} from '../data/accessories';
import { getMonsterTemplate } from '../data/monsters';

// ============================================
// Configuration
// ============================================

/**
 * Quest type to gear slot mapping (default)
 * Users can override this in settings.
 */
const DEFAULT_QUEST_SLOT_MAPPING: Record<string, GearSlot[]> = {
    main: ['chest', 'weapon', 'head', 'accessory1', 'accessory2', 'accessory3'],
    side: ['legs', 'boots', 'shield', 'accessory1', 'accessory2', 'accessory3'],
    training: ['head', 'shield'],
    guild: ['chest', 'legs', 'accessory1', 'accessory2', 'accessory3'],
    recurring: ['boots', 'accessory1', 'accessory2', 'accessory3'],
    daily: [], // Daily quests give consumables, not gear
};

/**
 * Weighted slot selection for combat and chest loot.
 * Primary slots (head, chest, legs, boots, weapon, shield) have weight 1.0.
 * Accessory slots have weight 0.4 each.
 */
export const GEAR_SLOT_WEIGHTS: Record<GearSlot, number> = {
    head: 1.0,
    chest: 1.0,
    legs: 1.0,
    boots: 1.0,
    weapon: 1.0,
    shield: 1.0,
    accessory1: 0.4,
    accessory2: 0.4,
    accessory3: 0.4,
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

// ============================================
// Quest Loot Drop Rates
// ============================================

/**
 * Quest completion drop rates
 * Training mode always gets 100% drops for dopamine
 */
const QUEST_LOOT_RATES = {
    training: {
        gear: 1.0,        // 100% gear drop in training
        consumable: 1.0,  // 100% consumable in training
    },
    normal: {
        gear: 0.60,       // 60% gear drop
        consumable: 0.45, // 45% consumable drop
    },
};

/**
 * Consumable drop weights for quest completion
 * Normalized during selection (total = 135)
 * HP ~52%, MP ~30%, Revive ~7%, Cleansing ~7%, Tactical ~4%
 */
const QUEST_CONSUMABLE_WEIGHTS = {
    hp: 70,
    mp: 40,
    revive: 10,
    cleansing: 10,
    tactical: 5,
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
        const gear = character.equippedGear;

        // 1. Always give gold (based on priority/urgency), boosted by active power-ups + accessories
        const baseGoldAmount = this.calculateQuestGold(quest.priority);
        const activePowerUps = expirePowerUps(character.activePowerUps || []);
        const goldMultiplier = getGoldMultiplierFromPowerUps(activePowerUps);
        const questType = quest.questType?.toLowerCase() || 'main';
        // Phase 4a: Daily quests use 'daily' gold source, other quests use 'quest'
        const accGoldSource = questType === 'daily' ? 'daily' : 'quest';
        const accGoldMult = 1 + getGoldMultiplier(gear, accGoldSource as any);
        const goldAmount = Math.floor(baseGoldAmount * goldMultiplier * accGoldMult);
        rewards.push({ type: 'gold', amount: goldAmount });
        const isTraining = questType === 'training' || character.isTrainingMode;

        // Daily quests: guaranteed consumable + 25% chance for gear
        if (questType === 'daily') {
            // Pick appropriate potion tier based on character level (guaranteed)
            const potionId = Math.random() < 0.7
                ? getHpPotionForLevel(character.level)
                : getMpPotionForLevel(character.level);
            rewards.push({
                type: 'consumable',
                itemId: potionId,
                quantity: 1,
            });

            // 25% chance for bonus gear from dailies
            if (Math.random() < 0.25) {
                const possibleSlots = this.getSlotsForQuestType('daily');
                // Dailies can drop accessories or boots (smaller rewards)
                const dailySlots: GearSlot[] = possibleSlots.length > 0 ? possibleSlots : ['boots', 'accessory1'];
                const slot = this.pickRandom(dailySlots);
                const tier = this.rollTier('easy', false); // Lower tier gear from dailies
                const level = this.rollGearLevel(character.level);

                const gearItem = this.generateGearItem(slot, tier, level, 'quest', quest.questId, character.class, quest.path);
                rewards.push({ type: 'gear', item: gearItem });
            }

            return rewards;
        }

        // Get drop rates based on mode
        const dropRates = isTraining ? QUEST_LOOT_RATES.training : QUEST_LOOT_RATES.normal;

        // 3. Roll for gear (RNG gated) — boost with accessory loot bonuses
        const accGearDropBonus = getLootBonus(gear, 'gearDrop');
        const possibleSlots = this.getSlotsForQuestType(questType);
        if (possibleSlots.length > 0 && Math.random() < (dropRates.gear + accGearDropBonus)) {
            const slot = this.pickRandom(possibleSlots);

            // Accessory slot picked from quest mapping → apply tier gating
            if (slot.startsWith('accessory')) {
                const accessory = this.generateAccessoryForSlot(slot, character.level, 'quest', quest.questId);
                rewards.push({ type: 'gear', item: accessory });
            } else {
                // Use quest.difficulty for tier, defaulting to 'medium' for old quests without the field
                const difficulty = (quest as any).difficulty || 'medium';
                const tier = this.rollTier(difficulty, isTraining);
                const level = this.rollGearLevel(character.level);
                const gearItem = this.generateGearItem(slot, tier, level, 'quest', quest.questId, character.class, quest.path);
                rewards.push({ type: 'gear', item: gearItem });
            }
        }

        // 4. Roll for consumable (RNG gated, separate from gear)
        if (Math.random() < dropRates.consumable) {
            const consumable = this.rollQuestConsumable(character.level);
            rewards.push(consumable);
        }

        return rewards;
    }

    /**
     * Roll a consumable for quest completion using weighted table
     */
    private rollQuestConsumable(level: number): LootReward {
        const totalWeight = QUEST_CONSUMABLE_WEIGHTS.hp + QUEST_CONSUMABLE_WEIGHTS.mp
            + QUEST_CONSUMABLE_WEIGHTS.revive + QUEST_CONSUMABLE_WEIGHTS.cleansing
            + QUEST_CONSUMABLE_WEIGHTS.tactical;
        const roll = Math.random() * totalWeight;

        let itemId: string;
        let cumulative = 0;

        cumulative += QUEST_CONSUMABLE_WEIGHTS.hp;
        if (roll < cumulative) {
            itemId = getHpPotionForLevel(level);
        } else {
            cumulative += QUEST_CONSUMABLE_WEIGHTS.mp;
            if (roll < cumulative) {
                itemId = getMpPotionForLevel(level);
            } else {
                cumulative += QUEST_CONSUMABLE_WEIGHTS.revive;
                if (roll < cumulative) {
                    itemId = 'revive-potion';
                } else {
                    cumulative += QUEST_CONSUMABLE_WEIGHTS.cleansing;
                    if (roll < cumulative) {
                        itemId = this.pickRandom(CLEANSING_IDS);
                    } else {
                        // Tactical (rarest from quests)
                        itemId = this.pickRandom(TACTICAL_IDS);
                    }
                }
            }
        }

        return {
            type: 'consumable',
            itemId,
            quantity: 1,
        };
    }

    /**
     * Generate loot from combat victory.
     * Uses actual monster tier names from the combat system.
     * @param monsterTemplateId - Optional monster template ID for boss loot table lookup
     */
    generateCombatLoot(
        monsterTier: MonsterTier,
        monsterLevel: number,
        character: Character,
        uniqueDropId?: string,
        monsterTemplateId?: string
    ): LootDrop {
        const rewards: LootReward[] = [];
        const gear = character.equippedGear;

        // Gold based on monster tier, boosted by power-ups + accessories
        const goldMultiplier: Record<typeof monsterTier, number> = {
            overworld: 1.0,
            dungeon: 1.5,
            elite: 2.0,
            boss: 5.0,
            raid_boss: 8.0,
        };
        const baseGold = 10 + monsterLevel * 2;
        const combatActivePowerUps = expirePowerUps(character.activePowerUps || []);
        const combatGoldMultiplier = getGoldMultiplierFromPowerUps(combatActivePowerUps);
        const accCombatGoldMult = 1 + getGoldMultiplier(gear, 'combat');
        const goldAmount = Math.floor(baseGold * goldMultiplier[monsterTier] * combatGoldMultiplier * accCombatGoldMult);
        rewards.push({ type: 'gold', amount: goldAmount });

        // Gear drop chance based on tier
        const gearChance: Record<typeof monsterTier, number> = {
            overworld: 0.25,  // 25% - basic encounters
            dungeon: 0.35,    // 35% - dungeon trash mobs
            elite: 0.50,      // 50% - rare spawns
            boss: 1.0,        // 100% - guaranteed
            raid_boss: 1.0,   // 100% - guaranteed
        };

        if (Math.random() < gearChance[monsterTier]) {
            // Check for unique drop first (boss-specific item)
            if (uniqueDropId) {
                const uniqueItem = createUniqueItem(uniqueDropId, 'combat');
                if (uniqueItem) {
                    rewards.push({ type: 'gear', item: uniqueItem });
                    // Don't return early — boss loot table is a separate roll below
                }
            }

            // Normal procedural gear (only if no unique dropped)
            if (!uniqueDropId || !rewards.some(r => r.type === 'gear')) {
                const slot = this.pickWeightedSlot(character.isTrainingMode);
                if (slot.startsWith('accessory')) {
                    const accessory = this.generateAccessoryForSlot(slot as GearSlot, character.level, 'combat');
                    rewards.push({ type: 'gear', item: accessory });
                } else {
                    const difficulty = (monsterTier === 'boss' || monsterTier === 'raid_boss')
                        ? 'epic'
                        : monsterTier === 'elite'
                            ? 'hard'
                            : 'medium';
                    const tier = this.rollTier(difficulty, false);
                    const level = this.rollGearLevel(monsterLevel);
                    const gearItem = this.generateGearItem(slot as GearSlot, tier, level, 'combat', undefined, character.class);
                    rewards.push({ type: 'gear', item: gearItem });
                }
            }
        }

        // Boss loot table handling (separate from normal gear drop)
        if (monsterTemplateId) {
            const bossLoot = this.rollBossLootTable(monsterTemplateId, character);
            if (bossLoot) {
                rewards.push(bossLoot);
            }
        }

        // Consumable drop from combat
        const consumableDrop = this.rollCombatConsumable(monsterTier, monsterLevel);
        if (consumableDrop) {
            rewards.push(consumableDrop);
        }

        // Phase 4a: Boss consumable guarantee from accessories
        if ((monsterTier === 'boss' || monsterTier === 'raid_boss') && !consumableDrop) {
            const bossConsumableChance = getUtilityBonus(gear, 'bossConsumable');
            if (bossConsumableChance > 0) {
                const guaranteedConsumable = this.rollCombatConsumable(monsterTier, monsterLevel);
                if (guaranteedConsumable) {
                    rewards.push(guaranteedConsumable);
                }
            }
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
        const gear = character.equippedGear;

        // Gold amount by chest tier, boosted by accessories
        const goldRanges = {
            wooden: { min: 10, max: 30 },
            iron: { min: 25, max: 60 },
            golden: { min: 50, max: 150 },
        };
        const range = goldRanges[chestTier];
        const chestActivePowerUps = expirePowerUps(character.activePowerUps || []);
        const chestGoldMultiplier = getGoldMultiplierFromPowerUps(chestActivePowerUps);
        const accDungeonGoldMult = 1 + getGoldMultiplier(gear, 'dungeon');
        const goldAmount = Math.floor(this.randomRange(range.min, range.max) * chestGoldMultiplier * accDungeonGoldMult);
        rewards.push({ type: 'gold', amount: goldAmount });

        // Gear chance by tier
        const gearChance = {
            wooden: 0.3,
            iron: 0.6,
            golden: 1.0,
        };

        if (Math.random() < gearChance[chestTier]) {
            const slot = this.pickWeightedSlot(character.isTrainingMode);
            if (slot.startsWith('accessory')) {
                const accessory = this.generateAccessoryForSlot(slot as GearSlot, roomLevel, 'exploration');
                rewards.push({ type: 'gear', item: accessory });
            } else {
                const difficulty = chestTier === 'golden' ? 'hard' : chestTier === 'iron' ? 'medium' : 'easy';
                const tier = this.rollTier(difficulty, false);
                const level = this.rollGearLevel(roomLevel);
                const gearItem = this.generateGearItem(slot as GearSlot, tier, level, 'exploration', undefined, character.class);
                rewards.push({ type: 'gear', item: gearItem });
            }
        }

        // Golden chests always have a consumable too
        if (chestTier === 'golden') {
            // 30% chance for cleansing/tactical item, otherwise HP/MP potion
            if (Math.random() < 0.3) {
                const pool = [...CLEANSING_IDS, ...TACTICAL_IDS];
                const itemId = this.pickRandom(pool);
                rewards.push({
                    type: 'consumable',
                    itemId,
                    quantity: 1,
                });
            } else {
                const potionId = Math.random() < 0.5
                    ? getHpPotionForLevel(roomLevel)
                    : getMpPotionForLevel(roomLevel);
                rewards.push({
                    type: 'consumable',
                    itemId: potionId,
                    quantity: 2,
                });
            }
        }

        return rewards;
    }

    /**
     * Roll a consumable for combat encounters.
     * Drop chance and rarity scale with monster tier.
     */
    rollCombatConsumable(monsterTier: MonsterTier, monsterLevel: number): LootReward | null {
        // Base drop chance by tier
        const dropChance: Record<MonsterTier, number> = {
            overworld: 0.25,
            dungeon: 0.40,
            elite: 0.55,
            boss: 0.85,
            raid_boss: 0.95,
        };

        if (Math.random() >= dropChance[monsterTier]) {
            return null; // No consumable this time
        }

        // Higher tiers can drop rare consumables
        const isHighTier = monsterTier === 'boss' || monsterTier === 'raid_boss';

        // Phoenix Tear: 1% from bosses only
        if (isHighTier && Math.random() < 0.01) {
            return { type: 'consumable', itemId: 'phoenix-tear', quantity: 1 };
        }

        // Enchantment oils: chance scales by tier
        const oilChance: Record<MonsterTier, number> = {
            overworld: 0.04, dungeon: 0.06, elite: 0.08, boss: 0.08, raid_boss: 0.08,
        };
        if (Math.random() < oilChance[monsterTier]) {
            const oilId = this.pickRandom(ENCHANTMENT_IDS);
            return { type: 'consumable', itemId: oilId, quantity: 1 };
        }

        // Stat elixirs: chance scales by tier
        const elixirChance: Record<MonsterTier, number> = {
            overworld: 0.02, dungeon: 0.03, elite: 0.05, boss: 0.05, raid_boss: 0.05,
        };
        if (Math.random() < elixirChance[monsterTier]) {
            const elixirId = this.pickRandom(STAT_ELIXIR_IDS);
            return { type: 'consumable', itemId: elixirId, quantity: 1 };
        }

        // Default: HP or MP potion (60/40 split)
        const potionId = Math.random() < 0.6
            ? getHpPotionForLevel(monsterLevel)
            : getMpPotionForLevel(monsterLevel);

        return { type: 'consumable', itemId: potionId, quantity: 1 };
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
        characterClass?: CharacterClass,
        questPath?: string
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

        // Get set info if this is from a quest (~40% chance to be a set piece)
        let setId: string | undefined;
        let setName: string | undefined;
        if (questPath && Math.random() < 0.40) {
            const setInfo = setBonusService.getSetFromQuestPath(questPath);
            if (setInfo) {
                setId = setInfo.id;
                setName = setInfo.name;
            }
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
            setId,
            setName,
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

    // ============================================
    // Accessory Generation Methods
    // ============================================

    /**
     * Pick a weighted random gear slot.
     * Primary slots have weight 1.0, accessory slots 0.4.
     * When excludeAccessories is true (training mode), only primary slots are used.
     */
    pickWeightedSlot(excludeAccessories: boolean = false): GearSlot {
        const slots = excludeAccessories ? PRIMARY_GEAR_SLOTS : ALL_GEAR_SLOTS;
        const weights = slots.map(s => GEAR_SLOT_WEIGHTS[s]);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let roll = Math.random() * totalWeight;

        for (let i = 0; i < slots.length; i++) {
            roll -= weights[i];
            if (roll < 0) {
                return slots[i];
            }
        }

        return slots[slots.length - 1]; // Fallback
    }

    /**
     * Roll an accessory tier based on character level.
     * Uses ACCESSORY_TIER_POOLS for level-gated weights.
     */
    rollAccessoryTier(level: number): AccessoryTier {
        // Find the matching level bracket
        const pool = ACCESSORY_TIER_POOLS.find(p => level <= p.maxLevel)
            || ACCESSORY_TIER_POOLS[ACCESSORY_TIER_POOLS.length - 1];

        const tiers: AccessoryTier[] = ['T1', 'T2', 'T3', 'T4'];
        const totalWeight = tiers.reduce((sum, t) => sum + pool.weights[t], 0);
        let roll = Math.random() * totalWeight;

        for (const tier of tiers) {
            roll -= pool.weights[tier];
            if (roll < 0) {
                return tier;
            }
        }

        return 'T1'; // Fallback
    }

    /**
     * Generate an accessory item for a specific slot.
     * Handles both T1 (procedural) and T2+ (curated template) paths.
     */
    generateAccessoryForSlot(
        slot: GearSlot,
        level: number,
        source: 'quest' | 'combat' | 'exploration' | 'shop' | 'smelt' = 'quest',
        sourceId?: string
    ): GearItem {
        const accessoryTier = this.rollAccessoryTier(level);
        const gearLevel = this.rollGearLevel(level);

        if (accessoryTier === 'T1') {
            return this.generateT1Accessory(slot, gearLevel, source, sourceId);
        } else {
            return this.generateCuratedAccessory(slot, accessoryTier, gearLevel, source, sourceId);
        }
    }

    /**
     * Generate a procedural T1 accessory with no special abilities.
     * Stats are ~65% of normal gear stats.
     */
    private generateT1Accessory(
        slot: GearSlot,
        level: number,
        source: 'quest' | 'combat' | 'exploration' | 'shop' | 'smelt',
        sourceId?: string
    ): GearItem {
        // Pick a cosmetic accessory type based on slot
        const typeMap: Record<string, AccessoryType> = {
            accessory1: 'ring',
            accessory2: 'amulet',
            accessory3: 'charm',
        };
        const accessoryType = typeMap[slot] || this.pickRandom(['ring', 'amulet', 'charm'] as AccessoryType[]);
        const name = generateT1AccessoryName(accessoryType);

        // T1 stats are ~65% of normal
        const stats = this.generateGearStats(slot, 'common', level);
        stats.primaryValue = Math.floor(stats.primaryValue * 0.65);
        const sellValue = calculateSellValue(level, 'common');

        return {
            id: generateGearId(),
            name,
            description: 'A simple accessory with no special properties.',
            slot,
            tier: 'common',
            level,
            stats,
            sellValue,
            iconEmoji: GEAR_SLOT_ICONS[slot],
            source,
            sourceId,
            acquiredAt: new Date().toISOString(),
            // No templateId for T1 items
        };
    }

    /**
     * Generate a curated T2+ accessory from a template.
     * Resolves a random template for the given tier.
     */
    private generateCuratedAccessory(
        slot: GearSlot,
        accessoryTier: AccessoryTier,
        level: number,
        source: 'quest' | 'combat' | 'exploration' | 'shop' | 'smelt',
        sourceId?: string
    ): GearItem {
        // Get all non-boss templates for this tier
        const templates = getAccessoryTemplatesByTier(accessoryTier)
            .filter(t => !t.bossTemplateId);

        if (templates.length === 0) {
            // Fallback to T1 if no templates available for tier
            return this.generateT1Accessory(slot, level, source, sourceId);
        }

        const template = this.pickRandom(templates);

        // Map accessory tier to gear tier
        const tierMap: Record<AccessoryTier, GearTier> = {
            T1: 'common',
            T2: 'journeyman',
            T3: 'master',
            T4: 'legendary',
        };
        const gearTier = tierMap[accessoryTier];

        // Build stats from template
        const primaryStats = Object.entries(template.stats);
        const primaryStat: StatType = primaryStats.length > 0
            ? primaryStats[0][0] as StatType
            : 'wisdom';
        const primaryValue = primaryStats.length > 0
            ? primaryStats[0][1] as number
            : 0;

        const secondaryStats: Partial<Record<StatType, number>> = {};
        for (let i = 1; i < primaryStats.length; i++) {
            secondaryStats[primaryStats[i][0] as StatType] = primaryStats[i][1] as number;
        }

        const stats: GearStats = {
            primaryStat,
            primaryValue,
            ...(Object.keys(secondaryStats).length > 0 ? { secondaryStats } : {}),
        };

        const sellValue = calculateSellValue(level, gearTier);

        return {
            id: generateGearId(),
            name: template.name,
            description: `A ${accessoryTier} ${template.accessoryType} with special properties.`,
            slot,
            tier: gearTier,
            level,
            stats,
            sellValue,
            iconEmoji: GEAR_SLOT_ICONS[slot],
            source,
            sourceId,
            acquiredAt: new Date().toISOString(),
            templateId: template.templateId,
        };
    }

    /**
     * Roll against a boss's loot table for a unique accessory drop.
     * Performs uniqueness check — if the character already owns the item,
     * awards extra gold instead.
     */
    rollBossLootTable(
        monsterTemplateId: string,
        character: Character
    ): LootReward | null {
        const monster = getMonsterTemplate(monsterTemplateId);
        if (!monster?.bossLootTable) {
            return null;
        }

        const { dropChance, items } = monster.bossLootTable;

        // Roll against drop chance
        if (Math.random() >= dropChance) {
            return null;
        }

        if (items.length === 0) {
            return null;
        }

        // Select random item from loot table
        const templateId = this.pickRandom(items);

        // Uniqueness check: does character already own this item?
        const ownsInInventory = (character.gearInventory || []).some(
            (item: GearItem) => item.templateId === templateId
        );
        const ownsEquipped = character.equippedGear
            ? Object.values(character.equippedGear as EquippedGearMap).some(
                (item: GearItem | null) => item?.templateId === templateId
            )
            : false;

        if (ownsInInventory || ownsEquipped) {
            // Already owns — award extra gold instead
            const extraGold = 50 + (character.level * 3);
            return { type: 'gold', amount: extraGold };
        }

        // Resolve template — try accessory first, then unique items
        const accessoryTemplate = getAccessoryTemplate(templateId);
        if (accessoryTemplate) {
            // Map accessory tier to gear tier
            const tierMap: Record<AccessoryTier, GearTier> = {
                T1: 'common',
                T2: 'journeyman',
                T3: 'master',
                T4: 'legendary',
            };
            const gearTier = tierMap[accessoryTemplate.tier];
            const level = character.level;

            // Build stats from template
            const primaryStats = Object.entries(accessoryTemplate.stats);
            const primaryStat: StatType = primaryStats.length > 0
                ? primaryStats[0][0] as StatType
                : 'wisdom';
            const primaryValue = primaryStats.length > 0
                ? primaryStats[0][1] as number
                : 0;

            const secondaryStats: Partial<Record<StatType, number>> = {};
            for (let i = 1; i < primaryStats.length; i++) {
                secondaryStats[primaryStats[i][0] as StatType] = primaryStats[i][1] as number;
            }

            const stats: GearStats = {
                primaryStat,
                primaryValue,
                ...(Object.keys(secondaryStats).length > 0 ? { secondaryStats } : {}),
            };

            // Assign to a random accessory slot
            const slotOptions: GearSlot[] = ['accessory1', 'accessory2', 'accessory3'];
            const slot = this.pickRandom(slotOptions);
            const sellValue = calculateSellValue(level, gearTier);

            return {
                type: 'gear',
                item: {
                    id: generateGearId(),
                    name: accessoryTemplate.name,
                    description: `A boss-exclusive ${accessoryTemplate.tier} ${accessoryTemplate.accessoryType}.`,
                    slot,
                    tier: gearTier,
                    level,
                    stats,
                    sellValue,
                    iconEmoji: GEAR_SLOT_ICONS[slot],
                    source: 'combat',
                    acquiredAt: new Date().toISOString(),
                    templateId: accessoryTemplate.templateId,
                },
            };
        }

        // Try unique items as fallback
        const uniqueItem = createUniqueItem(templateId, 'combat');
        if (uniqueItem) {
            return { type: 'gear', item: uniqueItem };
        }

        return null;
    }

    /**
     * Pick a random element from an array
     */
    pickRandom<T>(arr: T[]): T {
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
