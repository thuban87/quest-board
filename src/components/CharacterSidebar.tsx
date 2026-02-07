/**
 * CharacterSidebar Component
 *
 * Sidebar character view composing shared sub-components.
 * Displays character sprite, stats, XP progress, and gear slots.
 */

import React, { useMemo } from 'react';
import { useCharacterStore, selectActiveSetBonuses } from '../store/characterStore';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO } from '../models/Character';
import { GearSlot, ALL_GEAR_SLOTS } from '../models/Gear';
import { getXPProgress, getXPForNextLevel, XP_THRESHOLDS, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { getClassPerkAsPowerUp, expirePowerUps } from '../services/PowerUpService';
import { deriveCombatStats } from '../services/CombatService';
import {
    CharacterIdentity,
    ResourceBars,
    StreakDisplay,
    EquipmentGrid,
    SetBonuses,
    AttributeGrid,
    CombatStatsGrid,
    ClassPerkCard,
    CharacterStats,
} from './character';

interface CharacterSidebarProps {
    onBack: () => void;
    onViewAchievements?: () => void;
    onOpenInventory?: () => void;
    /** Open inventory filtered to a specific gear slot */
    onOpenInventoryForSlot?: (slot: GearSlot) => void;
    onOpenBlacksmith?: () => void;
    /** Open skill loadout modal */
    onOpenSkillLoadout?: () => void;

    spriteResourcePath?: string;
}

export const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
    onBack,
    onViewAchievements,
    onOpenInventory,
    onOpenInventoryForSlot,
    onOpenBlacksmith,
    onOpenSkillLoadout,

    spriteResourcePath,
}) => {
    const character = useCharacterStore((state) => state.character);
    const achievements = useCharacterStore((state) => state.achievements);
    const activeSetBonuses = useCharacterStore(selectActiveSetBonuses);
    const quests = useQuestStore((state) => state.quests);

    if (!character) return null;

    const classInfo = CLASS_INFO[character.class];
    const isTraining = character.isTrainingMode;

    // XP calculations
    const currentXP = isTraining ? character.trainingXP : character.totalXP;
    const currentThreshold = isTraining
        ? (TRAINING_XP_THRESHOLDS[character.trainingLevel - 1] || 0)
        : (XP_THRESHOLDS[character.level - 1] || 0);
    const nextLevelXP = isTraining
        ? (TRAINING_XP_THRESHOLDS[character.trainingLevel] || TRAINING_XP_THRESHOLDS[9])
        : getXPForNextLevel(character.level);
    const xpInLevel = currentXP - currentThreshold;
    const xpNeeded = nextLevelXP - currentThreshold;
    const xpProgress = xpNeeded > 0 ? Math.min(1, xpInLevel / xpNeeded) : 1;

    // Quest counts
    const completedQuests = quests
        ? Array.from(quests.values()).filter(q => q.completedDate).length
        : 0;
    const totalQuests = quests ? quests.size : 0;

    // Active buffs
    const allBuffs = useMemo(() => {
        const classPerk = getClassPerkAsPowerUp(character);
        const activePowerUps = expirePowerUps(character.activePowerUps || []);
        return [classPerk, ...activePowerUps];
    }, [character]);

    // Combat stats
    const combatStats = useMemo(() => deriveCombatStats(character), [character]);

    // Gear slot click handler
    const handleSlotClick = (slot: GearSlot) => {
        if (onOpenInventoryForSlot) {
            onOpenInventoryForSlot(slot);
        } else if (onOpenInventory) {
            onOpenInventory();
        }
    };

    return (
        <div className="qb-character-sheet">
            <button className="qb-back-btn" onClick={onBack}>
                ← Back to Board
            </button>

            <CharacterIdentity
                character={character}
                classInfo={classInfo}
                spriteResourcePath={spriteResourcePath}
                allBuffs={allBuffs}
            />

            <div className="qb-sheet-xp-section">
                <div className="qb-sheet-xp-header">
                    <span>Experience</span>
                    <span>{xpInLevel} / {xpNeeded} XP</span>
                </div>
                <div className="qb-sheet-xp-bar">
                    <div
                        className="qb-sheet-xp-fill"
                        style={{
                            width: `${xpProgress * 100}%`,
                            backgroundColor: classInfo.primaryColor,
                        }}
                    />
                </div>
                <p className="qb-sheet-xp-total">
                    Total XP: {character.totalXP}
                    {isTraining && ` (Training: ${character.trainingXP})`}
                </p>
            </div>

            <ResourceBars character={character} combatStats={combatStats} compact />

            <StreakDisplay
                currentStreak={character.currentStreak || 0}
                highestStreak={character.highestStreak || 0}
                compact
            />

            <div className="qb-sheet-gear">
                <h3>Equipment</h3>
                <EquipmentGrid
                    equippedGear={character.equippedGear}
                    slots={ALL_GEAR_SLOTS}
                    onSlotClick={handleSlotClick}
                    compact
                />
                {onOpenInventory && (
                    <button className="qb-inventory-btn-main" onClick={onOpenInventory}>
                        🎒 Open Inventory
                    </button>
                )}
                {onOpenBlacksmith && (
                    <button className="qb-blacksmith-btn-main" onClick={onOpenBlacksmith}>
                        🔨 Blacksmith
                    </button>
                )}
                {onOpenSkillLoadout && (
                    <button className="qb-skills-btn-main" onClick={onOpenSkillLoadout}>
                        ⚔️ Manage Skills
                    </button>
                )}
            </div>

            <SetBonuses activeSetBonuses={activeSetBonuses} compact />

            <AttributeGrid character={character} compact />

            <CombatStatsGrid combatStats={combatStats} compact />

            <ClassPerkCard classInfo={classInfo} />

            <CharacterStats
                character={character}
                completedQuests={completedQuests}
                activeQuests={totalQuests - completedQuests}
                achievementCount={achievements.filter(a => a.unlockedAt).length}
                onViewAchievements={onViewAchievements}
            />

            {isTraining && (
                <div className="qb-training-notice">
                    <p>🎓 You are in <strong>Training Mode</strong></p>
                    <p>Complete quests to reach Training Level X, then graduate to the real game!</p>
                </div>
            )}
        </div>
    );
};
