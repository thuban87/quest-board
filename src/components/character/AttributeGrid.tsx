/**
 * AttributeGrid - 6 D&D stats in a 3x2 grid with breakdown tooltips.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 * Highlights primary class stats and shows buff indicators.
 */

import React from 'react';
import { Character, CLASS_INFO, StatType } from '../../models/Character';
import { getTotalStats, STAT_ABBREVIATIONS, STAT_NAMES, getStatCap } from '../../services/StatsService';
import { aggregateGearStats } from '../../services/CombatService';

const STAT_ORDER: StatType[] = ['strength', 'intelligence', 'wisdom', 'constitution', 'dexterity', 'charisma'];

interface AttributeGridProps {
    character: Character;
    compact?: boolean;
}

export const AttributeGrid: React.FC<AttributeGridProps> = ({
    character,
    compact = false,
}) => {
    const totalStats = getTotalStats(character);
    const aggregatedGear = aggregateGearStats(character.equippedGear);
    const cap = getStatCap(character.level);
    const classInfo = CLASS_INFO[character.class];

    return (
        <div className="qb-sheet-primary-stats">
            <h3>Attributes</h3>
            <div className="qb-primary-stats-grid">
                {STAT_ORDER.map((stat) => {
                    const baseValue = character.baseStats?.[stat] || 10;
                    const questBonus = character.statBonuses?.[stat] || 0;
                    const totalValue = totalStats[stat];
                    const gearBonus = aggregatedGear.statBonuses[stat] || 0;
                    const powerUpBoost = totalValue - baseValue - questBonus - gearBonus;
                    const isPrimary = classInfo.primaryStats.includes(stat);
                    const hasBuff = powerUpBoost > 0 || gearBonus > 0;

                    return (
                        <div
                            key={stat}
                            className={`qb-primary-stat ${isPrimary ? 'primary' : ''} ${hasBuff ? 'buffed' : ''}`}
                            title={`${STAT_NAMES[stat]}\nBase from level: ${baseValue}\nQuest bonus: ${questBonus} (max ${cap} at Level ${character.level})${gearBonus > 0 ? `\nGear: +${gearBonus}` : ''}${powerUpBoost > 0 ? `\nPower-up: +${powerUpBoost}` : ''}`}
                        >
                            <span className="qb-stat-abbr">
                                {compact ? STAT_ABBREVIATIONS[stat] : STAT_NAMES[stat]}
                            </span>
                            <span className="qb-stat-total">{totalValue}</span>
                            {questBonus > 0 && (
                                <span className="qb-stat-bonus">+{questBonus}</span>
                            )}
                            {powerUpBoost > 0 && (
                                <span className="qb-stat-buff">⬆{powerUpBoost}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
