/**
 * Gear Formatting Utilities
 * 
 * Shared functions for formatting gear display across modals.
 * Ensures consistent tooltips, stat displays, and set info.
 */

import { Platform } from 'obsidian';
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

/**
 * Format a stat value with color class based on comparison.
 * Returns the HTML class name for styling.
 */
function getStatDiffClass(diff: number): string {
    if (diff > 0) return 'qb-stat-upgrade';   // Green
    if (diff < 0) return 'qb-stat-downgrade'; // Red
    return 'qb-stat-neutral';                  // Neutral
}

/**
 * Format a stat difference with sign and styling.
 */
function formatStatDiff(diff: number, label: string): string {
    if (diff === 0) return '';
    const sign = diff > 0 ? '+' : '';
    const cls = getStatDiffClass(diff);
    return `<div class="${cls}">${sign}${diff} ${label}</div>`;
}

/**
 * Create a detailed stat section for a single gear item.
 */
function buildGearStatsHtml(item: GearItem): string {
    const tierInfo = TIER_INFO[item.tier];
    const lines: string[] = [];

    // Header with name colored by tier
    lines.push(`<div class="qb-tt-name" style="color: ${tierInfo.color}">${item.name}</div>`);

    // Tier, Level, Slot
    lines.push(`<div class="qb-tt-tier">${tierInfo.emoji} ${tierInfo.name}</div>`);
    lines.push(`<div class="qb-tt-meta">Level ${item.level} • ${GEAR_SLOT_NAMES[item.slot]}</div>`);

    // Armor/Weapon type
    if (item.armorType) {
        lines.push(`<div class="qb-tt-type">${ARMOR_TYPE_NAMES[item.armorType]}</div>`);
    }
    if (item.weaponType) {
        lines.push(`<div class="qb-tt-type">${WEAPON_TYPE_NAMES[item.weaponType]}</div>`);
    }

    lines.push('<div class="qb-tt-divider"></div>');

    // Primary stat
    const primaryStatName = STAT_NAMES[item.stats.primaryStat] || item.stats.primaryStat;
    lines.push(`<div class="qb-tt-stat">+${item.stats.primaryValue} ${primaryStatName}</div>`);

    // Combat stats
    if (item.stats.attackPower) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.attackPower} Attack Power</div>`);
    }
    if (item.stats.defense) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.defense} Defense</div>`);
    }
    if (item.stats.magicDefense) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.magicDefense} Magic Defense</div>`);
    }
    if (item.stats.critChance) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.critChance}% Crit Chance</div>`);
    }
    if (item.stats.dodgeChance) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.dodgeChance}% Dodge</div>`);
    }
    if (item.stats.blockChance) {
        lines.push(`<div class="qb-tt-stat">+${item.stats.blockChance}% Block</div>`);
    }

    // Secondary stats
    if (item.stats.secondaryStats) {
        for (const [stat, val] of Object.entries(item.stats.secondaryStats)) {
            if (val && val > 0) {
                const statName = STAT_NAMES[stat] || stat;
                lines.push(`<div class="qb-tt-stat">+${val} ${statName}</div>`);
            }
        }
    }

    // Set info
    if (item.setName) {
        lines.push('<div class="qb-tt-divider"></div>');
        lines.push(`<div class="qb-tt-set">⚔️ ${item.setName} Set</div>`);
    }

    // Sell value
    lines.push('<div class="qb-tt-divider"></div>');
    lines.push(`<div class="qb-tt-sell">💰 Sell: ${item.sellValue || 0}g</div>`);

    return lines.join('');
}

/**
 * Build the stat difference summary section.
 */
function buildComparisonSummaryHtml(newItem: GearItem, equipped: GearItem): string {
    const lines: string[] = [];
    lines.push('<div class="qb-tt-comparison-header">If you equip this:</div>');

    // Primary stat
    const primaryDiff = newItem.stats.primaryValue - equipped.stats.primaryValue;
    const primaryStatName = STAT_NAMES[newItem.stats.primaryStat] || newItem.stats.primaryStat;
    const primaryStr = formatStatDiff(primaryDiff, primaryStatName);
    if (primaryStr) lines.push(primaryStr);

    // Attack Power
    const atkDiff = (newItem.stats.attackPower || 0) - (equipped.stats.attackPower || 0);
    const atkStr = formatStatDiff(atkDiff, 'Attack Power');
    if (atkStr) lines.push(atkStr);

    // Defense
    const defDiff = (newItem.stats.defense || 0) - (equipped.stats.defense || 0);
    const defStr = formatStatDiff(defDiff, 'Defense');
    if (defStr) lines.push(defStr);

    // Magic Defense
    const mdefDiff = (newItem.stats.magicDefense || 0) - (equipped.stats.magicDefense || 0);
    const mdefStr = formatStatDiff(mdefDiff, 'Magic Defense');
    if (mdefStr) lines.push(mdefStr);

    // Crit
    const critDiff = (newItem.stats.critChance || 0) - (equipped.stats.critChance || 0);
    const critStr = formatStatDiff(critDiff, '% Crit');
    if (critStr) lines.push(critStr);

    // Dodge
    const dodgeDiff = (newItem.stats.dodgeChance || 0) - (equipped.stats.dodgeChance || 0);
    const dodgeStr = formatStatDiff(dodgeDiff, '% Dodge');
    if (dodgeStr) lines.push(dodgeStr);

    // Block
    const blockDiff = (newItem.stats.blockChance || 0) - (equipped.stats.blockChance || 0);
    const blockStr = formatStatDiff(blockDiff, '% Block');
    if (blockStr) lines.push(blockStr);

    // Secondary stats comparison
    const allSecondaryStats = new Set([
        ...Object.keys(newItem.stats.secondaryStats || {}),
        ...Object.keys(equipped.stats.secondaryStats || {})
    ]);
    for (const stat of allSecondaryStats) {
        const newVal = newItem.stats.secondaryStats?.[stat as keyof typeof newItem.stats.secondaryStats] || 0;
        const oldVal = equipped.stats.secondaryStats?.[stat as keyof typeof equipped.stats.secondaryStats] || 0;
        const diff = (newVal as number) - (oldVal as number);
        const statName = STAT_NAMES[stat] || stat;
        const str = formatStatDiff(diff, statName);
        if (str) lines.push(str);
    }

    if (lines.length === 1) {
        // No differences - just the header
        lines.push('<div class="qb-stat-neutral">No stat changes</div>');
    }

    return lines.join('');
}

/**
 * Create a rich HTML tooltip for gear comparison.
 * Shows side-by-side panels: new item (left), equipped item (right).
 * If no equipped item, shows just the single item details.
 */
export function createGearComparisonTooltip(
    container: HTMLElement,
    item: GearItem,
    equipped: GearItem | null | undefined
): HTMLElement {
    const tooltip = container.createEl('div', { cls: 'qb-gear-tooltip' });

    // Single item (no comparison)
    if (!equipped) {
        const panel = tooltip.createEl('div', { cls: 'qb-tt-panel qb-tt-single' });
        panel.innerHTML = buildGearStatsHtml(item);
        return tooltip;
    }

    // Two-panel comparison layout
    tooltip.addClass('qb-tt-comparison');

    // Left panel: New item
    const leftPanel = tooltip.createEl('div', { cls: 'qb-tt-panel qb-tt-new' });
    leftPanel.createEl('div', { cls: 'qb-tt-panel-header', text: '📦 In Inventory' });
    const leftContent = leftPanel.createEl('div', { cls: 'qb-tt-panel-content' });
    leftContent.innerHTML = buildGearStatsHtml(item);

    // Right panel: Equipped item
    const rightPanel = tooltip.createEl('div', { cls: 'qb-tt-panel qb-tt-equipped' });
    rightPanel.createEl('div', { cls: 'qb-tt-panel-header', text: '⚔️ Currently Equipped' });
    const rightContent = rightPanel.createEl('div', { cls: 'qb-tt-panel-content' });
    rightContent.innerHTML = buildGearStatsHtml(equipped);

    // Bottom: Comparison summary
    const summaryPanel = tooltip.createEl('div', { cls: 'qb-tt-summary' });
    summaryPanel.innerHTML = buildComparisonSummaryHtml(item, equipped);

    return tooltip;
}

/**
 * Attach a rich comparison tooltip to an element.
 * Replaces the default title attribute with a custom floating tooltip.
 * On mobile, adds a close button since there's no mouseleave event.
 */
export function attachGearTooltip(
    element: HTMLElement,
    item: GearItem,
    equipped: GearItem | null | undefined
): void {
    let tooltip: HTMLElement | null = null;

    const showTooltip = () => {
        // GLOBAL CLEANUP: Remove any existing tooltips (prevents stickiness when moving between items)
        document.querySelectorAll('.qb-gear-tooltip-wrapper').forEach(el => el.remove());

        // Remove local reference if exists
        if (tooltip) {
            tooltip.remove();
        }

        // Create tooltip in body for proper positioning
        tooltip = document.body.createEl('div', { cls: 'qb-gear-tooltip-wrapper' });

        // On mobile, add close button
        if (Platform.isMobile) {
            tooltip.addClass('qb-gear-tooltip-mobile');
            const closeBtn = tooltip.createEl('button', {
                cls: 'qb-tooltip-close-btn',
                text: '✕'
            });
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (tooltip) {
                    tooltip.remove();
                    tooltip = null;
                }
            });
        }

        createGearComparisonTooltip(tooltip, item, equipped);

        // Position near element
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '10000';

        // Try to position above the element, fall back to below if not enough space
        const tooltipHeight = 300; // Approximate
        if (rect.top > tooltipHeight + 20) {
            tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            tooltip.style.top = 'auto';
        } else {
            tooltip.style.top = `${rect.bottom + 8}px`;
            tooltip.style.bottom = 'auto';
        }

        // Center horizontally with element, but keep in viewport
        const left = Math.max(10, Math.min(
            rect.left + rect.width / 2 - 200, // 200 = half tooltip width estimate
            window.innerWidth - 420
        ));
        tooltip.style.left = `${left}px`;
    };

    const hideTooltip = () => {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    };

    // Desktop: mouse events
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);

    // Mobile: tap to show (tap elsewhere to close via the close button)
    if (Platform.isMobile) {
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (tooltip) {
                hideTooltip();
            } else {
                showTooltip();
            }
        });
    }

    // Also remove on scroll to prevent orphaned tooltips
    element.addEventListener('scroll', hideTooltip, { capture: true });
}
