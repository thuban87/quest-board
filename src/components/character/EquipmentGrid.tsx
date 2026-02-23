/**
 * EquipmentGrid - Compact gear slot grid for sidebar display.
 *
 * Shared sub-component. Uses canonical slot definitions from Gear.ts.
 * Supports all 9 gear slots including accessories.
 * Uses rich DOM tooltips via attachGearTooltip.
 */

import React, { useRef, useEffect } from 'react';
import { GearSlot, GearItem, EquippedGearMap, TIER_INFO, GEAR_SLOT_NAMES, GEAR_SLOT_ICONS } from '../../models/Gear';
import { attachGearTooltip } from '../../utils/gearFormatters';

interface EquipmentGridProps {
    equippedGear: EquippedGearMap;
    /** Which slots to display */
    slots: GearSlot[];
    /** Called when a slot is clicked (e.g., to open inventory filtered to slot) */
    onSlotClick?: (slot: GearSlot) => void;
    compact?: boolean;
}

/** Single gear slot with rich tooltip */
const GearSlotCell: React.FC<{
    slot: GearSlot;
    equippedItem: GearItem | null | undefined;
    onClick?: () => void;
}> = ({ slot, equippedItem, onClick }) => {
    const ref = useRef<HTMLDivElement>(null);
    const label = GEAR_SLOT_NAMES[slot];
    const emoji = GEAR_SLOT_ICONS[slot];

    useEffect(() => {
        if (ref.current && equippedItem) {
            // Attach rich tooltip (single item, no comparison needed — this IS the equipped item)
            attachGearTooltip(ref.current, equippedItem, null);
        }
    }, [equippedItem]);

    return (
        <div
            ref={ref}
            className={`qb-gear-slot ${equippedItem ? `qb-tier-${equippedItem.tier}` : ''}`}
            title={equippedItem ? undefined : `${label} - Click to equip`}
            onClick={onClick}
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
};

export const EquipmentGrid: React.FC<EquipmentGridProps> = ({
    equippedGear,
    slots,
    onSlotClick,
    compact = false,
}) => {
    return (
        <div className="qb-gear-grid">
            {slots.map((slot) => (
                <GearSlotCell
                    key={slot}
                    slot={slot}
                    equippedItem={equippedGear?.[slot]}
                    onClick={() => onSlotClick?.(slot)}
                />
            ))}
        </div>
    );
};
