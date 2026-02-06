/**
 * ResourceBars - HP, Mana, and Stamina bar display.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 */

import React from 'react';
import { Character } from '../../models/Character';

interface CombatStatsData {
    maxHP: number;
    maxMana: number;
}

interface ResourceBarsProps {
    character: Character;
    combatStats: CombatStatsData;
    compact?: boolean;
}

export const ResourceBars: React.FC<ResourceBarsProps> = ({
    character,
    combatStats,
    compact = false,
}) => {
    const currentHP = character.currentHP ?? combatStats.maxHP;
    const currentMana = character.currentMana ?? combatStats.maxMana;
    const stamina = character.stamina ?? 10;
    const staminaGainedToday = character.staminaGainedToday ?? 0;

    return (
        <div className="qb-sheet-resources">
            <h3>⚡ Resources</h3>
            <div className="qb-resources-grid">
                {/* HP Bar */}
                <div className="qb-resource-item">
                    <div className="qb-resource-header">
                        <span className="qb-resource-label">❤️ HP</span>
                        <span className="qb-resource-values">
                            {currentHP} / {combatStats.maxHP}
                        </span>
                    </div>
                    <div className="qb-resource-bar qb-bar-hp">
                        <div
                            className="qb-resource-fill"
                            style={{ width: `${(currentHP / combatStats.maxHP) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Mana Bar */}
                <div className="qb-resource-item">
                    <div className="qb-resource-header">
                        <span className="qb-resource-label">💧 Mana</span>
                        <span className="qb-resource-values">
                            {currentMana} / {combatStats.maxMana}
                        </span>
                    </div>
                    <div className="qb-resource-bar qb-bar-mana">
                        <div
                            className="qb-resource-fill"
                            style={{ width: `${(currentMana / combatStats.maxMana) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Stamina Bar */}
                <div className="qb-resource-item">
                    <div className="qb-resource-header">
                        <span className="qb-resource-label">⚡ Stamina</span>
                        <span className="qb-resource-values">
                            {stamina} / 10
                        </span>
                    </div>
                    <div className="qb-resource-bar qb-bar-stamina">
                        <div
                            className="qb-resource-fill"
                            style={{ width: `${(stamina / 10) * 100}%` }}
                        />
                    </div>
                    <div className="qb-stamina-hint">
                        {staminaGainedToday >= 500
                            ? "You've hit your daily stamina cap. Try again tomorrow!"
                            : 'Complete quests to earn stamina for combat'}
                    </div>
                </div>
            </div>
        </div>
    );
};
