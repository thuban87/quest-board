/**
 * EquipmentPaperdoll - Full-page gear layout arranged around a silhouette.
 *
 * Slots positioned in a paperdoll pattern:
 *              [Head]
 *    [Shield]  (silhouette)  [Weapon]
 *              [Chest]
 *    [Acc 1]   [Legs]        [Acc 2]
 *              [Boots]
 *              [Acc 3]
 */

import React from 'react';
import { GearSlot, GearItem, EquippedGearMap, TIER_INFO, GEAR_SLOT_NAMES, GEAR_SLOT_ICONS } from '../../models/Gear';

interface EquipmentPaperdollProps {
    equippedGear: EquippedGearMap;
    onSlotClick?: (slot: GearSlot) => void;
}

/** Generate a tooltip string for a gear item */
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
    if (item.stats.attackPower) lines.push(`+${item.stats.attackPower} Attack Power`);
    if (item.stats.defense) lines.push(`+${item.stats.defense} Defense`);
    if (item.stats.critChance) lines.push(`+${item.stats.critChance}% Crit Chance`);
    if (item.stats.blockChance) lines.push(`+${item.stats.blockChance}% Block Chance`);

    return lines.join('\n');
}

/** Shared slot rendering for a single paperdoll gear slot */
const PaperdollSlot: React.FC<{
    slot: GearSlot;
    item: GearItem | null;
    onClick?: () => void;
}> = ({ slot, item, onClick }) => {
    const label = GEAR_SLOT_NAMES[slot];
    const emoji = GEAR_SLOT_ICONS[slot];

    return (
        <div
            className={`qb-paperdoll-slot qb-paperdoll-slot-${slot} ${item ? `qb-tier-${item.tier}` : ''}`}
            title={item ? getGearTooltip(item) : `${label} - Click to equip`}
            onClick={onClick}
        >
            <div
                className="qb-paperdoll-slot-icon"
                style={item ? { borderColor: TIER_INFO[item.tier].color } : {}}
            >
                {item?.iconEmoji || emoji}
            </div>
            <span className="qb-paperdoll-slot-label">{label}</span>
            {item ? (
                <div
                    className="qb-paperdoll-slot-name"
                    style={{ color: TIER_INFO[item.tier].color }}
                >
                    {item.name}
                </div>
            ) : (
                <div className="qb-paperdoll-slot-empty">Empty</div>
            )}
        </div>
    );
};

/** Paperdoll slot layout order (for CSS grid areas) */
const PAPERDOLL_LAYOUT: GearSlot[] = [
    'head',
    'shield', 'weapon',
    'chest',
    'accessory1', 'legs', 'accessory2',
    'boots',
    'accessory3',
];

export const EquipmentPaperdoll: React.FC<EquipmentPaperdollProps> = ({
    equippedGear,
    onSlotClick,
}) => {
    return (
        <div className="qb-paperdoll">
            <h3>Equipment</h3>
            <div className="qb-paperdoll-grid">
                {PAPERDOLL_LAYOUT.map((slot) => (
                    <PaperdollSlot
                        key={slot}
                        slot={slot}
                        item={equippedGear?.[slot] ?? null}
                        onClick={() => onSlotClick?.(slot)}
                    />
                ))}
            </div>
        </div>
    );
};
