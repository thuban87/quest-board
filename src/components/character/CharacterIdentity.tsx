/**
 * CharacterIdentity - Name, class, level, sprite, and active buffs display.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 */

import React from 'react';
import { Character, ClassInfo, getTrainingLevelDisplay, ActivePowerUp, CLASS_INFO } from '../../models/Character';
import { getTimeRemaining, isExpiringSoon } from '../../services/PowerUpService';

interface CharacterIdentityProps {
    character: Character;
    classInfo: ClassInfo;
    spriteResourcePath?: string;
    /** Sprite display size in px (default 80 for sidebar) */
    spriteSize?: number;
    /** All active buffs including class perk */
    allBuffs: ActivePowerUp[];
}

export const CharacterIdentity: React.FC<CharacterIdentityProps> = ({
    character,
    classInfo,
    spriteResourcePath,
    spriteSize = 80,
    allBuffs,
}) => {
    const isTraining = character.isTrainingMode;
    const currentLevel = isTraining ? character.trainingLevel : character.level;

    return (
        <>
            <div className="qb-sheet-header">
                <div className="qb-sheet-sprite-container">
                    <div
                        className="qb-sheet-sprite"
                        style={{
                            width: spriteSize,
                            height: spriteSize,
                            borderColor: classInfo.primaryColor,
                            backgroundColor: classInfo.primaryColor + '33',
                        }}
                    >
                        {spriteResourcePath ? (
                            <img
                                src={spriteResourcePath}
                                alt={`${character.name} sprite`}
                                className="qb-sprite-image"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <span className={`qb-sprite-placeholder ${spriteResourcePath ? 'hidden' : ''}`}>
                            {classInfo.emoji}
                        </span>
                    </div>
                    <div className="qb-sprite-shadow" />
                </div>

                <div className="qb-sheet-info">
                    <h2 className="qb-sheet-name">{character.name}</h2>
                    <p className="qb-sheet-class">
                        {isTraining && 'Training '}
                        Level {isTraining ? getTrainingLevelDisplay(currentLevel) : currentLevel} {classInfo.name}
                    </p>
                    {character.secondaryClass && (
                        <p className="qb-sheet-secondary">
                            + {CLASS_INFO[character.secondaryClass].name}
                        </p>
                    )}
                </div>

                {/* Active Buffs Display */}
                <div className="qb-active-buffs">
                    {allBuffs.map((buff) => {
                        const timeLeft = getTimeRemaining(buff);
                        const expiring = isExpiringSoon(buff);
                        return (
                            <div
                                key={buff.id}
                                className={`qb-buff-icon ${expiring ? 'qb-buff-expiring' : ''} ${buff.expiresAt === null ? 'qb-buff-passive' : ''}`}
                                title={`${buff.name}\n${buff.description}${timeLeft ? `\n${timeLeft}` : ''}`}
                            >
                                <span className="qb-buff-emoji">{buff.icon}</span>
                                {buff.stacks && buff.stacks > 1 && (
                                    <span className="qb-buff-stack">{buff.stacks}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
