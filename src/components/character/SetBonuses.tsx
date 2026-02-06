/**
 * SetBonuses - Active gear set bonus display.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 * Only renders when the character has active set bonuses.
 */

import React from 'react';
import { ActiveSetBonus } from '../../models/Gear';
import { setBonusService } from '../../services/SetBonusService';

interface SetBonusesProps {
    activeSetBonuses: ActiveSetBonus[];
    compact?: boolean;
}

export const SetBonuses: React.FC<SetBonusesProps> = ({
    activeSetBonuses,
    compact = false,
}) => {
    if (activeSetBonuses.length === 0) return null;

    return (
        <div className="qb-sheet-sets">
            <h3>⚔️ Set Bonuses</h3>
            <div className="qb-sets-list">
                {activeSetBonuses.map((set) => (
                    <div key={set.setId} className="qb-set-item">
                        <div className="qb-set-header">
                            <span className="qb-set-name">{set.setName}</span>
                            <span className="qb-set-count">({set.equippedCount}/6)</span>
                        </div>
                        <div className="qb-set-bonuses">
                            {set.bonuses.map((bonus, idx) => {
                                const isActive = bonus.pieces <= set.equippedCount;
                                return (
                                    <div
                                        key={idx}
                                        className={`qb-set-bonus ${isActive ? 'active' : 'inactive'}`}
                                    >
                                        <span className="qb-set-pieces">({bonus.pieces})</span>
                                        <span className="qb-set-effect">
                                            {setBonusService.formatBonusEffect(bonus.effect)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
