/**
 * EquipmentGrid - Compact gear slot grid for sidebar display.
 *
 * Shared sub-component. Uses canonical slot definitions from Gear.ts.
 * Supports all 9 gear slots including accessories.
 */

import React from 'react';
import { GearSlot, GearItem, EquippedGearMap, TIER_INFO, GEAR_SLOT_NAMES, GEAR_SLOT_ICONS } from '../../models/Gear';

interface EquipmentGridProps {
    equippedGear: EquippedGearMap;
    /** Which slots to display */
    slots: GearSlot[];
    /** Called when a slot is clicked (e.g., to open inventory filtered to slot) */
    onSlotClick?: (slot: GearSlot) => void;
    compact?: boolean;
}

/**
 * Generate a tooltip string for a gear item
 */
function getGearTooltip(item: GearItem): string {
    const tierInfo = TIER_INFO[item.tier];
    const lines = [
        `${item.name}`,
        `${tierInfo.emoji} ${tierInfo.name} • Level ${item.level}`,
        '',
        `+${item.stats.primaryValue} ${item.stats.primaryStat.charAt(0).toUpperCase() + item.stats.primaryStat.slice(1)}`,
    ];

    if (item.stats.secondaryStats) {
        for (const [stat, value] of Object.entries(item.stats.secondaryStats)) {
            if (value && value > 0) {
                lines.push(`+${value} ${stat.charAt(0).toUpperCase() + stat.slice(1)}`);
            }
        }
    }
    if (item.stats.attackPower) {
        lines.push(`+${item.stats.attackPower} Attack Power`);
    }
    if (item.stats.defense) {
        lines.push(`+${item.stats.defense} Defense`);
    }
    if (item.stats.critChance) {
        lines.push(`+${item.stats.critChance}% Crit Chance`);
    }
    if (item.stats.blockChance) {
        lines.push(`+${item.stats.blockChance}% Block Chance`);
    }

    return lines.join('\n');
}

export const EquipmentGrid: React.FC<EquipmentGridProps> = ({
    equippedGear,
    slots,
    onSlotClick,
    compact = false,
}) => {
    return (
        <div className="qb-gear-grid">
            {slots.map((slot) => {
                const equippedItem = equippedGear?.[slot];
                const label = GEAR_SLOT_NAMES[slot];
                const emoji = GEAR_SLOT_ICONS[slot];

                const handleClick = () => {
                    if (onSlotClick) {
                        onSlotClick(slot);
                    }
                };

                return (
                    <div
                        key={slot}
                        className={`qb-gear-slot ${equippedItem ? `qb-tier-${equippedItem.tier}` : ''}`}
                        title={equippedItem ? getGearTooltip(equippedItem) : `${label} - Click to equip`}
                        onClick={handleClick}
                    >
                        <div
                            className="qb-gear-slot-icon"
                            style={equippedItem ? { borderColor: TIER_INFO[equippedItem.tier].color } : {}}
                        >
                            {equippedItem?.iconEmoji || emoji}
                        </div>
                        <span className="qb-gear-slot-label">{label}</span>
                        {equippedItem ? (
                            <div
                                className="qb-gear-slot-name"
                                style={{ color: TIER_INFO[equippedItem.tier].color }}
                            >
                                {equippedItem.name}
                            </div>
                        ) : (
                            <div className="qb-gear-slot-empty">Empty</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
