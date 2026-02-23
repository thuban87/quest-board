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
 *
 * Uses rich DOM tooltips via attachGearTooltip.
 */

import React, { useRef, useEffect } from 'react';
import { GearSlot, GearItem, EquippedGearMap, TIER_INFO, GEAR_SLOT_NAMES, GEAR_SLOT_ICONS } from '../../models/Gear';
import { attachGearTooltip } from '../../utils/gearFormatters';

interface EquipmentPaperdollProps {
    equippedGear: EquippedGearMap;
    onSlotClick?: (slot: GearSlot) => void;
    /** Sprite URL for the center silhouette */
    spriteUrl?: string;
    /** Class color for sprite border/glow */
    classColor?: string;
    /** Class emoji fallback */
    classEmoji?: string;
}

/** Shared slot rendering for a single paperdoll gear slot with rich tooltip */
const PaperdollSlot: React.FC<{
    slot: GearSlot;
    item: GearItem | null | undefined;
    onClick?: () => void;
}> = ({ slot, item, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const label = GEAR_SLOT_NAMES[slot];
    const emoji = GEAR_SLOT_ICONS[slot];

    useEffect(() => {
        if (ref.current && item) {
            // Attach rich tooltip (single item, no comparison — this IS the equipped item)
            attachGearTooltip(ref.current, item, null);
        }
    }, [item]);

    return (
        <div
            ref={ref}
            className={`qb-paperdoll-slot qb-paperdoll-slot-${slot} ${item ? `qb-tier-${item.tier}` : ''}`}
            title={item ? undefined : `${label} - Click to equip`}
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
    spriteUrl,
    classColor,
    classEmoji,
}) => {
    return (
        <div className="qb-paperdoll">
            <h3>Equipment</h3>
            <div className="qb-paperdoll-grid">
                {PAPERDOLL_LAYOUT.map((slot) => {
                    // Insert the sprite silhouette after shield (center of row 2)
                    if (slot === 'shield') {
                        return (
                            <React.Fragment key={slot}>
                                <PaperdollSlot
                                    slot={slot}
                                    item={equippedGear?.[slot]}
                                    onClick={() => onSlotClick?.(slot)}
                                />
                                <div
                                    className="qb-paperdoll-sprite"
                                    style={{
                                        borderColor: classColor,
                                        backgroundColor: classColor ? classColor + '15' : undefined,
                                    }}
                                >
                                    {spriteUrl ? (
                                        <img
                                            src={spriteUrl}
                                            alt="Character"
                                            className="qb-paperdoll-sprite-img"
                                        />
                                    ) : (
                                        <span className="qb-paperdoll-sprite-emoji">
                                            {classEmoji || '🧙'}
                                        </span>
                                    )}
                                </div>
                            </React.Fragment>
                        );
                    }
                    return (
                        <PaperdollSlot
                            key={slot}
                            slot={slot}
                            item={equippedGear?.[slot]}
                            onClick={() => onSlotClick?.(slot)}
                        />
                    );
                })}
            </div>
        </div>
    );
};
