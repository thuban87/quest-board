/**
 * CombatStatsGrid - Derived combat stats display.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 * Shows HP, Mana, attack, defense, crit, dodge, and block stats.
 */

import React from 'react';

interface CombatStatsData {
    maxHP: number;
    maxMana: number;
    physicalAttack: number;
    magicAttack: number;
    defense: number;
    magicDefense: number;
    critChance: number;
    dodgeChance: number;
    blockChance: number;
}

interface CombatStatsGridProps {
    combatStats: CombatStatsData;
    compact?: boolean;
}

export const CombatStatsGrid: React.FC<CombatStatsGridProps> = ({
    combatStats,
    compact = false,
}) => {
    return (
        <div className="qb-sheet-derived-stats">
            <h3>Combat Stats</h3>
            <div className="qb-derived-stats-grid">
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">❤️ Max HP</span>
                    <span className="qb-derived-value">{combatStats.maxHP}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">💧 Max Mana</span>
                    <span className="qb-derived-value">{combatStats.maxMana}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">⚔️ Physical Atk</span>
                    <span className="qb-derived-value">{combatStats.physicalAttack}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">✨ Magic Atk</span>
                    <span className="qb-derived-value">{combatStats.magicAttack}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">🛡️ Defense</span>
                    <span className="qb-derived-value">{combatStats.defense}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">🔮 Magic Def</span>
                    <span className="qb-derived-value">{combatStats.magicDefense}</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">🎯 Crit %</span>
                    <span className="qb-derived-value">{combatStats.critChance.toFixed(1)}%</span>
                </div>
                <div className="qb-derived-stat">
                    <span className="qb-derived-label">💨 Dodge %</span>
                    <span className="qb-derived-value">{combatStats.dodgeChance.toFixed(1)}%</span>
                </div>
                {combatStats.blockChance > 0 && (
                    <div className="qb-derived-stat">
                        <span className="qb-derived-label">🛡️ Block %</span>
                        <span className="qb-derived-value">{combatStats.blockChance.toFixed(1)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
};
