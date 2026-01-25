/**
 * Combat Service
 * 
 * Core combat logic for deriving combat stats, calculating damage,
 * and managing stamina. Uses tuned constants from combatConfig.ts.
 */

import { Character, CharacterStats, CharacterClass } from '../models/Character';
import { GearItem, EquippedGearMap, ALL_GEAR_SLOTS, GearSlot } from '../models/Gear';
import {
    CLASS_COMBAT_CONFIG,
    getLevelModifier,
    AttackStyle,
    CRIT_MULTIPLIER,
    DODGE_CAP,
    CRIT_PER_DEX,
    DODGE_PER_DEX,
    DAMAGE_VARIANCE,
    MIN_DAMAGE,
    MAX_STAMINA,
    STAMINA_PER_TASK,
    MAX_DAILY_STAMINA,
    RAID_BOSS_TANK_PENALTY,
    MonsterTier,
    HP_BASE,
    HP_PER_CON,
    HP_PER_CON_TANK,
    HP_PER_LEVEL,
} from '../config/combatConfig';

// =====================
// COMBAT STATS INTERFACE
// =====================

/**
 * Derived combat stats calculated from character + gear
 */
export interface CombatStats {
    maxHP: number;
    currentHP: number;
    maxMana: number;
    currentMana: number;

    // Offense
    physicalAttack: number;
    magicAttack: number;
    critChance: number;
    critMultiplier: number;

    // Defense
    defense: number;
    magicDefense: number;
    dodgeChance: number;
    blockChance: number;

    // Metadata
    attackStyle: AttackStyle;
    damageModifier: number;
    attackName: string;
}

// =====================
// GEAR STAT AGGREGATION
// =====================

/**
 * Aggregate stats from all equipped gear
 */
export interface AggregatedGearStats {
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    hpBonus: number;
    manaBonus: number;
    critChance: number;
    dodgeChance: number;
    blockChance: number;
    statBonuses: Partial<CharacterStats>;
}

/**
 * Aggregate all stats from equipped gear
 */
export function aggregateGearStats(equippedGear: EquippedGearMap): AggregatedGearStats {
    const result: AggregatedGearStats = {
        physicalAttack: 0,
        magicAttack: 0,
        defense: 0,
        magicDefense: 0,
        hpBonus: 0,
        manaBonus: 0,
        critChance: 0,
        dodgeChance: 0,
        blockChance: 0,
        statBonuses: {},
    };

    for (const slot of ALL_GEAR_SLOTS) {
        const item = equippedGear[slot];
        if (!item) continue;

        const stats = item.stats;

        // Attack power (usually from weapons)
        if (stats.attackPower) {
            // Distribute to physical and magic based on weapon type
            if (item.slot === 'weapon') {
                // Magic weapons (staff, wand) add to magic attack
                if (item.weaponType === 'staff' || item.weaponType === 'wand') {
                    result.magicAttack += stats.attackPower;
                } else {
                    result.physicalAttack += stats.attackPower;
                }
            }
        }

        // Defense stats
        if (stats.defense) result.defense += stats.defense;
        if (stats.magicDefense) result.magicDefense += stats.magicDefense;
        if (stats.critChance) result.critChance += stats.critChance;
        if (stats.dodgeChance) result.dodgeChance += stats.dodgeChance;
        if (stats.blockChance) result.blockChance += stats.blockChance;

        // Primary stat contribution to HP/Mana (Constitution = HP, Intelligence = Mana)
        if (stats.primaryStat === 'constitution') {
            result.hpBonus += stats.primaryValue * 2; // 2 HP per CON from gear
        }
        if (stats.primaryStat === 'intelligence') {
            result.manaBonus += stats.primaryValue; // 1 Mana per INT from gear
        }

        // Aggregate secondary stat bonuses
        if (stats.secondaryStats) {
            for (const [stat, value] of Object.entries(stats.secondaryStats)) {
                const key = stat as keyof CharacterStats;
                result.statBonuses[key] = (result.statBonuses[key] || 0) + (value || 0);
            }
        }

        // Primary stat also counts as a bonus
        result.statBonuses[stats.primaryStat] =
            (result.statBonuses[stats.primaryStat] || 0) + stats.primaryValue;
    }

    return result;
}

// =====================
// DERIVE COMBAT STATS
// =====================

/**
 * Calculate full combat stats from a character including gear bonuses.
 * This is the main function for getting combat-ready stats.
 */
export function deriveCombatStats(character: Character): CombatStats {
    const cls = character.class;
    const level = character.level;
    const classConfig = CLASS_COMBAT_CONFIG[cls];
    const levelMod = getLevelModifier(cls, level);

    // Get total stats (base + bonuses + gear)
    const gearStats = aggregateGearStats(character.equippedGear);

    const totalStats: CharacterStats = {
        strength: character.baseStats.strength +
            (character.statBonuses?.strength || 0) +
            (gearStats.statBonuses.strength || 0),
        intelligence: character.baseStats.intelligence +
            (character.statBonuses?.intelligence || 0) +
            (gearStats.statBonuses.intelligence || 0),
        wisdom: character.baseStats.wisdom +
            (character.statBonuses?.wisdom || 0) +
            (gearStats.statBonuses.wisdom || 0),
        constitution: character.baseStats.constitution +
            (character.statBonuses?.constitution || 0) +
            (gearStats.statBonuses.constitution || 0),
        dexterity: character.baseStats.dexterity +
            (character.statBonuses?.dexterity || 0) +
            (gearStats.statBonuses.dexterity || 0),
        charisma: character.baseStats.charisma +
            (character.statBonuses?.charisma || 0) +
            (gearStats.statBonuses.charisma || 0),
    };

    // HP: BASE + (CON * multiplier) + (Level * 10) + gear bonus, * class modifier
    // Tanks (Warrior/Cleric) use reduced CON scaling to balance their high CON stats
    const isTank = cls === 'warrior' || cls === 'cleric';
    const conMultiplier = isTank ? HP_PER_CON_TANK : HP_PER_CON;
    const baseHP = HP_BASE + (totalStats.constitution * conMultiplier) + (level * HP_PER_LEVEL) + gearStats.hpBonus;
    const maxHP = Math.floor(baseHP * classConfig.hpModifier * levelMod.hp);

    // Mana: 20 + (INT * 3) + (Level * 5) + gear bonus
    const maxMana = 20 + (totalStats.intelligence * 3) + (level * 5) + gearStats.manaBonus;

    // Physical Attack: max(STR, DEX) + gear attack power
    const physicalAttack = Math.max(totalStats.strength, totalStats.dexterity) + gearStats.physicalAttack;

    // Magic Attack: max(INT, WIS, CHA) + gear magic attack
    const magicAttack = Math.max(totalStats.intelligence, totalStats.wisdom, totalStats.charisma) + gearStats.magicAttack;

    // Defense: CON/2 + gear defense * 1.5 (multiplier tuned from simulation v25)
    const defense = Math.floor(totalStats.constitution / 2) + Math.floor(gearStats.defense * 1.5);

    // Magic Defense: WIS/2 + gear magic defense * 1.5
    const magicDefense = Math.floor(totalStats.wisdom / 2) + Math.floor(gearStats.magicDefense * 1.5);

    // Crit Chance: DEX * 0.5% + gear bonus
    const critChance = (totalStats.dexterity * CRIT_PER_DEX) + gearStats.critChance;

    // Dodge Chance: DEX * 0.5% + gear bonus, capped at 25%
    const dodgeChance = Math.min(DODGE_CAP, (totalStats.dexterity * DODGE_PER_DEX) + gearStats.dodgeChance);

    // Block Chance: from shield only
    const blockChance = gearStats.blockChance;

    // Damage modifier: class base * level modifier
    const damageModifier = classConfig.damageModifier * levelMod.damage;

    // Clamp currentHP/Mana - but if character is at "full health" (currentHP >= stored maxHP),
    // they should be at derived full health (accounts for gear HP bonuses)
    const storedMaxHP = character.maxHP ?? 50; // fallback if not set
    const storedMaxMana = character.maxMana ?? 20;

    let clampedHP: number;
    if (character.currentHP == null || character.currentHP >= storedMaxHP) {
        // At or above full health (stored) → set to new derived maxHP
        clampedHP = maxHP;
    } else {
        // Below full health → preserve current HP but cap at derived max
        clampedHP = Math.min(character.currentHP, maxHP);
    }

    let clampedMana: number;
    if (character.currentMana == null || character.currentMana >= storedMaxMana) {
        clampedMana = maxMana;
    } else {
        clampedMana = Math.min(character.currentMana, maxMana);
    }

    return {
        maxHP,
        currentHP: clampedHP,
        maxMana,
        currentMana: clampedMana,
        physicalAttack,
        magicAttack,
        critChance,
        critMultiplier: CRIT_MULTIPLIER,
        defense,
        magicDefense,
        dodgeChance,
        blockChance,
        attackStyle: classConfig.attackStyle,
        damageModifier,
        attackName: classConfig.attackName,
    };
}

/**
 * Get combat stats with raid boss tank penalty applied (Warrior, Cleric)
 */
export function deriveCombatStatsForRaid(character: Character): CombatStats {
    const stats = deriveCombatStats(character);

    if (character.class === 'warrior' || character.class === 'cleric') {
        stats.damageModifier *= RAID_BOSS_TANK_PENALTY;
    }

    return stats;
}

// =====================
// DAMAGE CALCULATION
// =====================

export type DamageResult = 'hit' | 'critical' | 'miss' | 'blocked';

export interface DamageOutput {
    damage: number;
    result: DamageResult;
}

/**
 * Calculate damage from an attack.
 * Handles dodge, block, crit, and variance.
 * Uses capped percentage reduction formula for defense.
 */
export function calculateDamage(
    attackPower: number,
    attackerCrit: number,
    defenderDefense: number,
    defenderDodge: number,
    defenderBlock: number = 0
): DamageOutput {
    // 1. Check for dodge
    if (Math.random() * 100 < defenderDodge) {
        return { damage: 0, result: 'miss' };
    }

    // 2. Check for block (shields)
    if (defenderBlock > 0 && Math.random() * 100 < defenderBlock) {
        // Blocked attacks do 25% damage (after reduction)
        const reduction = Math.min(0.75, defenderDefense / (100 + defenderDefense));
        const reducedDamage = attackPower * (1 - reduction);
        const blockedDamage = Math.floor(reducedDamage * 0.25);
        return { damage: Math.max(MIN_DAMAGE, blockedDamage), result: 'blocked' };
    }

    // 3. Calculate base damage using capped percentage reduction
    // Formula: reduction = min(75%, defense / (100 + defense))
    // This prevents immunity at high defense while still rewarding it
    const reduction = Math.min(0.75, defenderDefense / (100 + defenderDefense));
    let damage = Math.max(MIN_DAMAGE, Math.floor(attackPower * (1 - reduction)));

    // 4. Check for crit (2.0x multiplier)
    if (Math.random() * 100 < attackerCrit) {
        damage = Math.floor(damage * CRIT_MULTIPLIER);
        return { damage, result: 'critical' };
    }

    // 5. Apply variance (±10%)
    const variance = damage * DAMAGE_VARIANCE;
    damage = Math.floor(damage + (Math.random() * 2 - 1) * variance);

    return { damage: Math.max(MIN_DAMAGE, damage), result: 'hit' };
}

// =====================
// STAMINA MANAGEMENT
// =====================

/**
 * Get today's date as YYYY-MM-DD string
 */
function getLocalDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Award stamina to a character (called on task completion).
 * Returns updated character fields.
 */
export function awardStamina(
    currentStamina: number,
    staminaGainedToday: number,
    lastStaminaResetDate: string | null,
    amount: number = STAMINA_PER_TASK
): { stamina: number; staminaGainedToday: number; lastStaminaResetDate: string } {
    const today = getLocalDateString();

    // Reset if new day
    let todayGained = staminaGainedToday;
    if (lastStaminaResetDate !== today) {
        todayGained = 0;
    }

    // Check daily cap (50 stamina/day = 25 fights)
    if (todayGained >= MAX_DAILY_STAMINA) {
        return {
            stamina: currentStamina,
            staminaGainedToday: todayGained,
            lastStaminaResetDate: today,
        };
    }

    // Grant stamina up to daily cap
    const granted = Math.min(amount, MAX_DAILY_STAMINA - todayGained);
    const newStamina = Math.min(currentStamina + granted, MAX_STAMINA);

    return {
        stamina: newStamina,
        staminaGainedToday: todayGained + granted,
        lastStaminaResetDate: today,
    };
}

/**
 * Check if player has enough stamina for a random fight
 */
export function hasStaminaForFight(stamina: number): boolean {
    return stamina >= 1;
}

/**
 * Consume stamina for a random fight.
 * Returns updated stamina value, or null if insufficient.
 */
export function consumeStaminaForFight(stamina: number): number | null {
    if (stamina < 1) return null;
    return stamina - 1;
}

// =====================
// HP/MANA UPDATES
// =====================

/**
 * Clamp HP to valid range [0, maxHP]
 */
export function clampHP(currentHP: number, maxHP: number): number {
    return Math.max(0, Math.min(currentHP, maxHP));
}

/**
 * Clamp Mana to valid range [0, maxMana]
 */
export function clampMana(currentMana: number, maxMana: number): number {
    return Math.max(0, Math.min(currentMana, maxMana));
}

/**
 * Apply HP change (damage or heal)
 */
export function applyHPChange(currentHP: number, delta: number, maxHP: number): number {
    return clampHP(currentHP + delta, maxHP);
}

/**
 * Apply Mana change (cost or restore)
 */
export function applyManaChange(currentMana: number, delta: number, maxMana: number): number {
    return clampMana(currentMana + delta, maxMana);
}

/**
 * Full restore (Long Rest) - sets HP and Mana to max
 */
export function fullRestore(character: Character): { currentHP: number; currentMana: number } {
    return {
        currentHP: character.maxHP,
        currentMana: character.maxMana,
    };
}
