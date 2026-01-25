/**
 * Gear Formatting Utilities
 * 
 * Shared functions for formatting gear display across modals.
 * Ensures consistent tooltips, stat displays, and set info.
 */

import {
    GearItem,
    TIER_INFO,
    GEAR_SLOT_NAMES,
    ARMOR_TYPE_NAMES,
    WEAPON_TYPE_NAMES,
} from '../models/Gear';
import { setBonusService } from '../services/SetBonusService';

// Local stat names lookup
const STAT_NAMES: Record<string, string> = {
    strength: 'Strength',
    intelligence: 'Intelligence',
    wisdom: 'Wisdom',
    constitution: 'Constitution',
    dexterity: 'Dexterity',
    charisma: 'Charisma',
};

/**
 * Format a gear item as a detailed tooltip string.
 * Used by LootModal, InventoryModal, CharacterSheet, and anywhere else gear is displayed.
 */
export function formatGearTooltip(item: GearItem, comparison?: GearItem | null): string {
    const tierInfo = TIER_INFO[item.tier];

    const lines: string[] = [];

    // Header
    lines.push(item.name);
    lines.push(`${tierInfo.name} • Level ${item.level} • ${GEAR_SLOT_NAMES[item.slot]}`);

    // Armor/Weapon type
    if (item.armorType) {
        lines.push(ARMOR_TYPE_NAMES[item.armorType]);
    }
    if (item.weaponType) {
        lines.push(WEAPON_TYPE_NAMES[item.weaponType]);
    }

    lines.push(''); // Blank line

    // Primary stat
    const primaryStatName = STAT_NAMES[item.stats.primaryStat] || item.stats.primaryStat;
    lines.push(`+${item.stats.primaryValue} ${primaryStatName}`);

    // Combat stats
    if (item.stats.attackPower) {
        lines.push(`+${item.stats.attackPower} Attack Power`);
    }
    if (item.stats.defense) {
        lines.push(`+${item.stats.defense} Defense`);
    }
    if (item.stats.magicDefense) {
        lines.push(`+${item.stats.magicDefense} Magic Defense`);
    }
    if (item.stats.critChance) {
        lines.push(`+${item.stats.critChance}% Crit Chance`);
    }
    if (item.stats.dodgeChance) {
        lines.push(`+${item.stats.dodgeChance}% Dodge`);
    }
    if (item.stats.blockChance) {
        lines.push(`+${item.stats.blockChance}% Block`);
    }

    // Secondary stats
    if (item.stats.secondaryStats) {
        for (const [stat, val] of Object.entries(item.stats.secondaryStats)) {
            const statName = STAT_NAMES[stat] || stat;
            lines.push(`+${val} ${statName}`);
        }
    }

    // Set info with bonuses (uses cached or triggers async generation)
    if (item.setName && item.setId) {
        lines.push('');
        lines.push(`⚔️ Set: ${item.setName}`);

        // Get cached bonuses (sync, may trigger async generation)
        const bonuses = setBonusService.getCachedBonuses(item.setId, item.setName);
        for (const bonus of bonuses) {
            const effectStr = setBonusService.formatBonusEffect(bonus.effect);
            lines.push(`  (${bonus.pieces}) ${effectStr}`);
        }
    } else if (item.setName) {
        lines.push('');
        lines.push(`⚔️ Set: ${item.setName}`);
    }

    // Comparison if provided
    if (comparison) {
        lines.push('');
        lines.push('--- Compared to Equipped ---');

        // Primary stat comparison
        const primaryDiff = item.stats.primaryValue - comparison.stats.primaryValue;
        if (primaryDiff !== 0) {
            const sign = primaryDiff > 0 ? '+' : '';
            lines.push(`${sign}${primaryDiff} ${primaryStatName}`);
        }

        // Attack comparison
        const atkDiff = (item.stats.attackPower || 0) - (comparison.stats.attackPower || 0);
        if (atkDiff !== 0) {
            const sign = atkDiff > 0 ? '+' : '';
            lines.push(`${sign}${atkDiff} Attack Power`);
        }

        // Defense comparison
        const defDiff = (item.stats.defense || 0) - (comparison.stats.defense || 0);
        if (defDiff !== 0) {
            const sign = defDiff > 0 ? '+' : '';
            lines.push(`${sign}${defDiff} Defense`);
        }
    }

    // Sell value
    lines.push('');
    lines.push(`💰 Sell: ${item.sellValue}g`);

    return lines.join('\n');
}

/**
 * Format a short one-line summary of gear stats.
 * Used for inline stat previews.
 */
export function formatGearStatsSummary(item: GearItem): string {
    const parts: string[] = [];

    const primaryStatName = item.stats.primaryStat.charAt(0).toUpperCase() + item.stats.primaryStat.slice(1);
    parts.push(`+${item.stats.primaryValue} ${primaryStatName}`);

    if (item.stats.attackPower) {
        parts.push(`+${item.stats.attackPower} ATK`);
    }
    if (item.stats.defense) {
        parts.push(`+${item.stats.defense} DEF`);
    }

    return parts.join(' • ');
}

/**
 * Check if an item is part of a set.
 */
export function isSetItem(item: GearItem): boolean {
    return !!item.setId && !!item.setName;
}
