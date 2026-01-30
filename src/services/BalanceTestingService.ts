/**
 * Balance Testing Service
 * 
 * Tracks battle data and logs it to a note for balance testing and tuning.
 * Enabled/disabled via settings.enableBalanceTesting.
 */

import { App, TFile, TFolder } from 'obsidian';
import type { QuestBoardSettings } from '../settings';
import type { CombatLogEntry, BattleMonster, BattlePlayer } from '../store/battleStore';
import type { Character } from '../models/Character';
import type { StatusEffect } from '../models/StatusEffect';

// =====================
// CONTEXT (set from main.ts)
// =====================

let balanceTestApp: App | null = null;
let getBalanceTestSettings: (() => QuestBoardSettings) | null = null;

/**
 * Initialize balance testing context.
 * Called from main.ts during plugin initialization.
 */
export function setBalanceTestingContext(
    app: App,
    settingsGetter: () => QuestBoardSettings
): void {
    balanceTestApp = app;
    getBalanceTestSettings = settingsGetter;
}

/**
 * Check if balance testing is enabled and properly configured.
 */
export function isBalanceTestingEnabled(): boolean {
    if (!getBalanceTestSettings) return false;
    const settings = getBalanceTestSettings();
    return settings.enableBalanceTesting && !!settings.balanceTestingNoteName;
}

// =====================
// BATTLE DATA ACCUMULATOR
// =====================

interface SkillUsageData {
    skillId: string;
    skillName: string;
    skillIcon: string;
    uses: number;
    totalDamage: number;
    totalHealing: number;
    effectivenessNotes: string[];
}

interface StageChangeData {
    target: 'player' | 'monster';
    stat: string;
    delta: number;
    source: string;
}

interface StatusEffectData {
    target: 'player' | 'monster';
    effectType: string;
    duration: number;
    dotDamage: number;
}

interface BattleTestData {
    // Character info at battle start
    characterClass: string;
    characterLevel: number;

    // Monster info
    monsterName: string;
    monsterTier: string;
    monsterLevel: number;

    // Combat summary
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    startingHP: number;
    startingMana: number;
    maxHP: number;
    maxMana: number;

    // Skills tracking
    skillsUsed: Map<string, SkillUsageData>;

    // Stage changes
    stageChanges: StageChangeData[];

    // Status effects
    statusEffects: StatusEffectData[];

    // Turn tracking
    turnCount: number;
}

let currentBattleData: BattleTestData | null = null;

// =====================
// TRACKING FUNCTIONS
// =====================

/**
 * Start tracking a new battle.
 * Called from BattleService.startBattleWithMonster.
 */
export function startBattleTracking(
    character: Character,
    monster: BattleMonster,
    playerHP: number,
    playerMana: number,
    playerMaxHP: number,
    playerMaxMana: number
): void {
    if (!isBalanceTestingEnabled()) return;

    currentBattleData = {
        characterClass: character.class,
        characterLevel: character.isTrainingMode ? character.trainingLevel : character.level,
        monsterName: monster.name,
        monsterTier: monster.tier,
        monsterLevel: monster.level,
        damageDealt: 0,
        damageTaken: 0,
        healingDone: 0,
        startingHP: playerHP,
        startingMana: playerMana,
        maxHP: playerMaxHP,
        maxMana: playerMaxMana,
        skillsUsed: new Map(),
        stageChanges: [],
        statusEffects: [],
        turnCount: 0,
    };
}

/**
 * Track a skill use.
 * Called from BattleService after skill execution.
 */
export function trackSkillUse(
    skillId: string,
    skillName: string,
    skillIcon: string,
    damage: number,
    healing: number,
    effectivenessNote?: string
): void {
    if (!currentBattleData) return;

    const existing = currentBattleData.skillsUsed.get(skillId);
    if (existing) {
        existing.uses++;
        existing.totalDamage += damage;
        existing.totalHealing += healing;
        if (effectivenessNote) {
            existing.effectivenessNotes.push(effectivenessNote);
        }
    } else {
        currentBattleData.skillsUsed.set(skillId, {
            skillId,
            skillName,
            skillIcon,
            uses: 1,
            totalDamage: damage,
            totalHealing: healing,
            effectivenessNotes: effectivenessNote ? [effectivenessNote] : [],
        });
    }

    // Update totals
    currentBattleData.damageDealt += damage;
    currentBattleData.healingDone += healing;
}

/**
 * Track damage taken by player.
 */
export function trackDamageTaken(damage: number): void {
    if (!currentBattleData) return;
    currentBattleData.damageTaken += damage;
}

/**
 * Track a stage change.
 */
export function trackStageChange(
    target: 'player' | 'monster',
    stat: string,
    delta: number,
    source: string
): void {
    if (!currentBattleData) return;
    currentBattleData.stageChanges.push({ target, stat, delta, source });
}

/**
 * Track a status effect application.
 */
export function trackStatusEffect(
    target: 'player' | 'monster',
    effectType: string,
    duration: number
): void {
    if (!currentBattleData) return;
    currentBattleData.statusEffects.push({
        target,
        effectType,
        duration,
        dotDamage: 0,
    });
}

/**
 * Track DoT damage for status effects.
 */
export function trackDotDamage(effectType: string, damage: number): void {
    if (!currentBattleData) return;

    // Find the most recent status effect of this type and add damage
    for (let i = currentBattleData.statusEffects.length - 1; i >= 0; i--) {
        if (currentBattleData.statusEffects[i].effectType === effectType) {
            currentBattleData.statusEffects[i].dotDamage += damage;
            break;
        }
    }
}

/**
 * Update turn count.
 */
export function updateTurnCount(turnNumber: number): void {
    if (!currentBattleData) return;
    currentBattleData.turnCount = turnNumber;
}

// =====================
// BATTLE FINALIZATION
// =====================

/**
 * Finalize battle and write report to note.
 * Called from BattleService on victory/defeat/retreat.
 */
export async function finalizeBattle(
    outcome: 'victory' | 'defeat' | 'retreat',
    battleLog: CombatLogEntry[],
    finalHP: number,
    finalMana: number
): Promise<void> {
    if (!currentBattleData || !balanceTestApp || !getBalanceTestSettings) {
        currentBattleData = null;
        return;
    }

    const settings = getBalanceTestSettings();
    if (!settings.enableBalanceTesting || !settings.balanceTestingNoteName) {
        currentBattleData = null;
        return;
    }

    try {
        await appendBattleReport(
            outcome,
            battleLog,
            finalHP,
            finalMana,
            settings
        );
    } catch (err) {
        console.error('[BalanceTestingService] Failed to write battle report:', err);
    }

    currentBattleData = null;
}

/**
 * Append battle report to the configured note.
 */
async function appendBattleReport(
    outcome: 'victory' | 'defeat' | 'retreat',
    battleLog: CombatLogEntry[],
    finalHP: number,
    finalMana: number,
    settings: QuestBoardSettings
): Promise<void> {
    if (!currentBattleData || !balanceTestApp) return;

    const vault = balanceTestApp.vault;
    const folderPath = settings.balanceTestingFolder;
    const noteName = settings.balanceTestingNoteName;
    const notePath = `${folderPath}/${noteName}.md`;

    // Ensure folder exists
    const folder = vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        await vault.createFolder(folderPath);
    }

    // Get or create note
    let file = vault.getAbstractFileByPath(notePath);
    let existingContent = '';
    let battleNumber = 1;

    if (file instanceof TFile) {
        existingContent = await vault.read(file);
        // Count existing battles to continue numbering
        const battleMatches = existingContent.match(/## Battle #(\d+)/g);
        if (battleMatches && battleMatches.length > 0) {
            const lastMatch = battleMatches[battleMatches.length - 1];
            const lastNumber = parseInt(lastMatch.replace('## Battle #', ''), 10);
            if (!isNaN(lastNumber)) {
                battleNumber = lastNumber + 1;
            }
        }
    } else {
        // Create new note with header
        existingContent = `# ${noteName}\n\nBalance testing log for ${currentBattleData.characterClass} class.\n\n---\n\n`;
    }

    // Format report
    const report = formatBattleReport(
        battleNumber,
        outcome,
        battleLog,
        finalHP,
        finalMana
    );

    // Append report
    const newContent = existingContent + report;

    if (file instanceof TFile) {
        await vault.modify(file, newContent);
    } else {
        await vault.create(notePath, newContent);
    }
}

/**
 * Format battle data as markdown report.
 */
function formatBattleReport(
    battleNumber: number,
    outcome: 'victory' | 'defeat' | 'retreat',
    battleLog: CombatLogEntry[],
    finalHP: number,
    finalMana: number
): string {
    if (!currentBattleData) return '';

    const data = currentBattleData;
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const outcomeEmoji = outcome === 'victory' ? '✅' : outcome === 'defeat' ? '❌' : '🏃';
    const outcomeText = outcome === 'victory' ? 'Victory' : outcome === 'defeat' ? 'Defeat' : 'Retreat';

    const hpPercent = Math.round((finalHP / data.maxHP) * 100);
    const manaPercent = Math.round((finalMana / data.maxMana) * 100);

    let report = `## Battle #${battleNumber} - ${timestamp}\n\n`;
    report += `**Character:** ${data.characterClass} Level ${data.characterLevel}\n`;
    report += `**Monster:** ${data.monsterName} (${data.monsterTier}, L${data.monsterLevel})\n`;
    report += `**Outcome:** ${outcomeEmoji} ${outcomeText} in ${data.turnCount} turns\n\n`;

    // Combat Summary
    report += `### Combat Summary\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Damage Dealt | ${data.damageDealt} |\n`;
    report += `| Damage Taken | ${data.damageTaken} |\n`;
    report += `| Healing Done | ${data.healingDone} |\n`;
    report += `| Final HP | ${finalHP}/${data.maxHP} (${hpPercent}%) |\n`;
    report += `| Final Mana | ${finalMana}/${data.maxMana} (${manaPercent}%) |\n\n`;

    // Skills Used
    if (data.skillsUsed.size > 0) {
        report += `### Skills Used\n`;
        report += `| Skill | Uses | Damage/Healing | Notes |\n`;
        report += `|-------|------|----------------|-------|\n`;

        data.skillsUsed.forEach(skill => {
            const dmgHeal = skill.totalDamage > 0
                ? `${skill.totalDamage} dmg`
                : skill.totalHealing > 0
                    ? `${skill.totalHealing} healed`
                    : '-';
            const notes = skill.effectivenessNotes.length > 0
                ? skill.effectivenessNotes.join(', ')
                : '-';
            report += `| ${skill.skillIcon} ${skill.skillName} | ${skill.uses} | ${dmgHeal} | ${notes} |\n`;
        });
        report += '\n';
    }

    // Stage Changes
    if (data.stageChanges.length > 0) {
        report += `### Stage Changes\n`;
        data.stageChanges.forEach(change => {
            const sign = change.delta > 0 ? '+' : '';
            const target = change.target === 'player' ? 'Player' : 'Monster';
            report += `- ${target}: ${sign}${change.delta} ${change.stat.toUpperCase()} (${change.source})\n`;
        });
        report += '\n';
    }

    // Status Effects
    if (data.statusEffects.length > 0) {
        report += `### Status Effects Applied\n`;
        report += `| Target | Effect | Duration | DoT Damage |\n`;
        report += `|--------|--------|----------|------------|\n`;

        data.statusEffects.forEach(effect => {
            const target = effect.target === 'player' ? 'Player' : 'Monster';
            const dot = effect.dotDamage > 0 ? `${effect.dotDamage}` : '-';
            report += `| ${target} | ${effect.effectType} | ${effect.duration} turns | ${dot} |\n`;
        });
        report += '\n';
    }

    // Combat Log
    report += `### Combat Log\n`;
    battleLog.forEach(entry => {
        const actor = entry.actor === 'player' ? 'You' : 'Enemy';
        const dmgStr = entry.damage ? ` → ${entry.damage} damage` : '';
        const resultStr = entry.result === 'critical' ? ' (crit!)' : '';
        report += `> Turn ${entry.turn}: ${actor} used ${entry.action}${dmgStr}${resultStr}\n`;
    });
    report += '\n';

    // Pain Points section
    report += `### Pain Points\n`;
    report += `_(Fill in observations after battle)_\n\n`;

    report += `---\n\n`;

    return report;
}

// =====================
// EXPORTS
// =====================

export const balanceTestingService = {
    setBalanceTestingContext,
    isBalanceTestingEnabled,
    startBattleTracking,
    trackSkillUse,
    trackDamageTaken,
    trackStageChange,
    trackStatusEffect,
    trackDotDamage,
    updateTurnCount,
    finalizeBattle,
};
