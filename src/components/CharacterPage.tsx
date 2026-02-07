/**
 * CharacterPage - Full-page character view component.
 *
 * Two-panel layout composing shared sub-components from character/.
 * Left panel: hero identity, resources, buffs, consumables, action menu.
 * Right panel: attributes, combat stats, paperdoll, set bonuses, character stats.
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { App } from 'obsidian';
import { useCharacterStore, selectActiveSetBonuses, selectInventory } from '../store/characterStore';
import { AchievementService } from '../services/AchievementService';
import { useQuestStore } from '../store/questStore';
import { CLASS_INFO } from '../models/Character';
import { GearSlot } from '../models/Gear';
import { getXPProgress, getXPForNextLevel, XP_THRESHOLDS, TRAINING_XP_THRESHOLDS } from '../services/XPSystem';
import { getClassPerkAsPowerUp, expirePowerUps } from '../services/PowerUpService';
import { deriveCombatStats } from '../services/CombatService';
import { useCharacterSprite } from '../hooks/useCharacterSprite';
import { useSaveCharacter } from '../hooks/useSaveCharacter';
import { showInventoryModal } from '../modals/InventoryModal';
import { showBlacksmithModal } from '../modals/BlacksmithModal';
import { showSkillLoadoutModal } from '../modals/SkillLoadoutModal';
import { openStoreModal } from '../modals/StoreModal';
import { AchievementHubModal } from '../modals/AchievementHubModal';
import { showProgressDashboardModal } from '../modals/ProgressDashboardModal';
import {
    CharacterIdentity,
    ResourceBars,
    StreakDisplay,
    SetBonuses,
    AttributeGrid,
    CombatStatsGrid,
    ClassPerkCard,
    CharacterStats,
} from './character';
import { EquipmentPaperdoll } from './character/EquipmentPaperdoll';
import { ActionMenu } from './character/ActionMenu';
import { ConsumablesBelt } from './character/ConsumablesBelt';
import type QuestBoardPlugin from '../../main';

interface CharacterPageProps {
    plugin: QuestBoardPlugin;
    app: App;
}

export const CharacterPage: React.FC<CharacterPageProps> = ({ plugin, app }) => {
    const character = useCharacterStore((state) => state.character);
    const setCharacter = useCharacterStore((state) => state.setCharacter);
    const setInventoryAndAchievements = useCharacterStore((state) => state.setInventoryAndAchievements);
    const achievements = useCharacterStore((state) => state.achievements);
    const activeSetBonuses = useCharacterStore(selectActiveSetBonuses);
    const inventory = useCharacterStore(selectInventory);
    const quests = useQuestStore((state) => state.quests);

    const saveCharacter = useSaveCharacter(plugin);

    // Load character on mount — handles race condition when Obsidian restores
    // this tab before plugin.onload() has populated the store
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (plugin.settings.character) {
            const oldVersion = plugin.settings.character.schemaVersion;
            setCharacter(plugin.settings.character);
            const newCharacter = useCharacterStore.getState().character;
            if (newCharacter && newCharacter.schemaVersion !== oldVersion) {
                saveCharacter();
            }
        }
        const achievementService = new AchievementService(app.vault);
        const savedAchievements = plugin.settings.achievements || [];
        const initializedAchievements = achievementService.initializeAchievements(savedAchievements);
        setInventoryAndAchievements(
            plugin.settings.inventory || [],
            initializedAchievements
        );
    }, []);

    const spriteUrl = useCharacterSprite({
        character,
        assetFolder: plugin.settings.assetFolder,
        adapter: app.vault.adapter,
        animated: true,
    });

    // These hooks MUST be above the early return to satisfy Rules of Hooks
    const allBuffs = useMemo(() => {
        if (!character) return [];
        const classPerk = getClassPerkAsPowerUp(character);
        const activePowerUps = expirePowerUps(character.activePowerUps || []);
        return [classPerk, ...activePowerUps];
    }, [character]);

    const combatStats = useMemo(
        () => character ? deriveCombatStats(character) : null,
        [character]
    );

    if (!character || !combatStats) {
        return (
            <div className="qb-charpage">
                <p style={{ padding: 'var(--qb-spacing-lg)', color: 'var(--text-muted)' }}>
                    No character found. Create one first!
                </p>
            </div>
        );
    }

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

    // Save callback for modals
    const onSave = async () => {
        plugin.settings.character = useCharacterStore.getState().character;
        plugin.settings.inventory = useCharacterStore.getState().inventory;
        plugin.settings.achievements = useCharacterStore.getState().achievements;
        await plugin.saveSettings();
    };

    // Gear slot click -> inventory modal filtered to slot
    const handleSlotClick = (slot: GearSlot) => {
        showInventoryModal(app, { initialSlotFilter: slot, onSave });
    };

    // Action menu handlers
    const handleOpenInventory = () => showInventoryModal(app, { onSave });
    const handleOpenBlacksmith = () => showBlacksmithModal(app);
    const handleOpenStore = () => openStoreModal(app, { onSave });
    const handleOpenSkillLoadout = () => showSkillLoadoutModal(app, { onSave });
    const handleOpenAchievements = () => {
        new AchievementHubModal({
            app,
            onSave,
        }).open();
    };
    const handleOpenProgressDashboard = () => showProgressDashboardModal(app, onSave);

    // Back to board
    const handleBack = () => {
        const leaf = app.workspace.getLeaf(false);
        if (leaf) {
            leaf.setViewState({ type: 'quest-board-view', active: true });
        }
    };

    return (
        <div className="qb-charpage">
            {/* Top bar */}
            <div className="qb-charpage-topbar">
                <button className="qb-back-btn" onClick={handleBack}>
                    ← Back to Board
                </button>
                <div className="qb-charpage-xp">
                    <span className="qb-charpage-xp-label">
                        {isTraining ? 'Training ' : ''}Lv {isTraining ? character.trainingLevel : character.level}
                    </span>
                    <div className="qb-charpage-xp-bar">
                        <div
                            className="qb-charpage-xp-fill"
                            style={{
                                width: `${xpProgress * 100}%`,
                                backgroundColor: classInfo.primaryColor,
                            }}
                        />
                    </div>
                    <span className="qb-charpage-xp-text">
                        {xpInLevel} / {xpNeeded} XP
                    </span>
                </div>
            </div>

            {/* Action bar — single row below XP bar */}
            <ActionMenu
                onOpenInventory={handleOpenInventory}
                onOpenBlacksmith={handleOpenBlacksmith}
                onOpenStore={handleOpenStore}
                onOpenSkillLoadout={handleOpenSkillLoadout}
                onOpenAchievements={handleOpenAchievements}
                onOpenProgressDashboard={handleOpenProgressDashboard}
            />

            {/* Two-panel content */}
            <div className="qb-charpage-content">
                {/* Left panel: Hero */}
                <div className="qb-charpage-left">
                    <CharacterIdentity
                        character={character}
                        classInfo={classInfo}
                        spriteResourcePath={spriteUrl}
                        spriteSize={200}
                        allBuffs={allBuffs}
                    />

                    <ResourceBars character={character} combatStats={combatStats} />

                    <ClassPerkCard classInfo={classInfo} />

                    <ConsumablesBelt
                        inventory={inventory}
                        character={character}
                    />

                    <CharacterStats
                        character={character}
                        completedQuests={completedQuests}
                        activeQuests={totalQuests - completedQuests}
                        achievementCount={achievements.filter(a => a.unlockedAt).length}
                        onViewAchievements={handleOpenAchievements}
                    />

                    <StreakDisplay
                        currentStreak={character.currentStreak || 0}
                        highestStreak={character.highestStreak || 0}
                    />

                    {isTraining && (
                        <div className="qb-training-notice">
                            <p>🎓 You are in <strong>Training Mode</strong></p>
                            <p>Complete quests to reach Training Level X, then graduate to the real game!</p>
                        </div>
                    )}
                </div>

                {/* Right panel: Stats & Gear */}
                <div className="qb-charpage-right">
                    <AttributeGrid character={character} />

                    <CombatStatsGrid combatStats={combatStats} />

                    <EquipmentPaperdoll
                        equippedGear={character.equippedGear}
                        onSlotClick={handleSlotClick}
                        spriteUrl={spriteUrl}
                        classColor={classInfo.primaryColor}
                        classEmoji={classInfo.emoji}
                    />

                    <SetBonuses activeSetBonuses={activeSetBonuses} />
                </div>
            </div>
        </div>
    );
};
