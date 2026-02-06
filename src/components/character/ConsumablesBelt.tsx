/**
 * ConsumablesBelt - Horizontal strip of owned consumable items.
 *
 * Shows consumables with emoji, quantity badge, and name tooltip.
 * Empty state shows a hint to visit the Store.
 */

import React from 'react';
import { InventoryItem, CONSUMABLES } from '../../models/Consumable';
import { Character } from '../../models/Character';

interface ConsumablesBeltProps {
    inventory: InventoryItem[];
    character: Character;
    onUseConsumable?: (itemId: string) => void;
    compact?: boolean;
}

export const ConsumablesBelt: React.FC<ConsumablesBeltProps> = ({
    inventory,
    character,
    onUseConsumable,
    compact = false,
}) => {
    // Filter to only owned consumables with known definitions
    const ownedConsumables = inventory.filter(
        (item) => item.quantity > 0 && CONSUMABLES[item.itemId]
    );

    return (
        <div className={`qb-consumables ${compact ? 'qb-consumables-compact' : ''}`}>
            <h3>Consumables</h3>
            {ownedConsumables.length === 0 ? (
                <p className="qb-consumables-empty">No consumables — visit the Store</p>
            ) : (
                <div className="qb-consumables-belt">
                    {ownedConsumables.map((item) => {
                        const def = CONSUMABLES[item.itemId];
                        if (!def) return null;
                        return (
                            <div
                                key={item.itemId}
                                className="qb-consumables-item"
                                title={`${def.name}\n${def.description}`}
                                onClick={() => onUseConsumable?.(item.itemId)}
                            >
                                <span className="qb-consumables-emoji">{def.emoji}</span>
                                <span className="qb-consumables-qty">{item.quantity}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
