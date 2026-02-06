/**
 * ClassPerkCard - Class perk display with XP bonus info.
 *
 * Shared sub-component used by both CharacterSidebar and CharacterPage.
 */

import React from 'react';
import { ClassInfo } from '../../models/Character';

interface ClassPerkCardProps {
    classInfo: ClassInfo;
}

export const ClassPerkCard: React.FC<ClassPerkCardProps> = ({ classInfo }) => {
    return (
        <div className="qb-sheet-perk">
            <h3>{classInfo.perkName}</h3>
            <p>{classInfo.perkDescription}</p>
            <p className="qb-perk-bonus">
                +{classInfo.bonusPercent}% XP on {classInfo.bonusCategories.slice(0, 3).join(', ')} quests
            </p>
        </div>
    );
};
