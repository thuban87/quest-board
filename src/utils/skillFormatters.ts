/**
 * Skill Formatting Utilities
 * 
 * Generates human-readable mechanics descriptions from skill effect data.
 * Used for tooltips in BattleView and SkillLoadoutModal.
 */

import { Skill, SkillEffect, SkillDamageEffect, SkillHealEffect, SkillStageEffect, SkillStatusEffect, SkillCureEffect, SkillManaEffect } from '../models/Skill';

// =====================
// MECHANICS TEXT GENERATION
// =====================

/**
 * Get human-readable mechanics lines from a skill's effects array.
 * Each line describes one effect in plain language.
 */
export function getSkillMechanicsLines(skill: Skill): string[] {
    const lines: string[] = [];

    for (const effect of skill.effects) {
        const line = formatEffect(effect, skill);
        if (line) {
            lines.push(line);
        }
    }

    return lines;
}

/**
 * Format a single effect into a readable string
 */
function formatEffect(effect: SkillEffect, skill: Skill): string | null {
    switch (effect.type) {
        case 'damage':
            return formatDamageEffect(effect, skill);
        case 'heal':
            return formatHealEffect(effect);
        case 'stage':
            return formatStageEffect(effect);
        case 'status':
            return formatStatusEffect(effect);
        case 'cure':
            return formatCureEffect(effect);
        case 'mana':
            return formatManaEffect(effect);
        default:
            return null;
    }
}

/**
 * Format damage effect
 * Example: "150% Physical damage" or "300% Physical damage, 20% lifesteal"
 */
function formatDamageEffect(effect: SkillDamageEffect, skill: Skill): string {
    const parts: string[] = [];

    // Base damage
    const damageTypeLabel = effect.damageType === 'physical' ? 'Physical' : 'Magic';
    parts.push(`${effect.power}% ${skill.elementalType} ${damageTypeLabel} damage`);

    // Extra modifiers
    const modifiers: string[] = [];

    if (effect.ignoresStages) {
        modifiers.push('ignores DEF');
    }

    if (effect.critBonus && effect.critBonus > 0) {
        modifiers.push(`+${effect.critBonus}% crit`);
    }

    if (effect.lifesteal && effect.lifesteal > 0) {
        modifiers.push(`${Math.round(effect.lifesteal * 100)}% lifesteal`);
    }

    if (modifiers.length > 0) {
        return `${parts[0]} (${modifiers.join(', ')})`;
    }

    return parts[0];
}

/**
 * Format heal effect
 * Example: "Restores 40% max HP"
 */
function formatHealEffect(effect: SkillHealEffect): string {
    return `Restores ${effect.power}% max HP`;
}

/**
 * Format stage effect
 * Example: "+1 ATK" or "-2 DEF (enemy)"
 */
function formatStageEffect(effect: SkillStageEffect): string {
    const sign = effect.stages > 0 ? '+' : '';
    const statName = effect.stat.toUpperCase();
    const target = effect.target === 'enemy' ? ' (enemy)' : '';

    return `${sign}${effect.stages} ${statName}${target}`;
}

/**
 * Format status effect
 * Example: "40% chance to inflict Burn"
 */
function formatStatusEffect(effect: SkillStatusEffect): string {
    const statusName = capitalizeFirst(effect.type);
    const target = effect.target === 'self' ? 'self' : 'enemy';

    if (effect.chance >= 100) {
        return `Inflicts ${statusName} on ${target}`;
    }

    return `${effect.chance}% chance: ${statusName}`;
}

/**
 * Format cure effect
 * Example: "Cures all status effects" or "Cures Burn, Poison"
 */
function formatCureEffect(effect: SkillCureEffect): string {
    if (effect.cures === 'all') {
        return 'Cures all status effects';
    }

    if (effect.cures.length === 0) {
        // Special case: Battle Hardened removes debuff stages
        return 'Clears ATK/DEF debuffs';
    }

    const cureNames = effect.cures.map(c => capitalizeFirst(c)).join(', ');
    return `Cures ${cureNames}`;
}

/**
 * Format mana restoration effect
 * Example: "Restores 33% max Mana"
 */
function formatManaEffect(effect: SkillManaEffect): string {
    return `Restores ${effect.power}% max Mana`;
}

// =====================
// TOOLTIP FORMATTERS
// =====================

/**
 * Format skill tooltip for BattleView (compact, no flavor text)
 * 
 * Format:
 * {name} ({cost} MP)
 * {mechanics line 1}
 * {mechanics line 2}
 * ⚠️ Once per battle (if applicable)
 */
export function formatSkillTooltipBattle(skill: Skill): string {
    const lines: string[] = [];

    // Header: Name and cost
    lines.push(`${skill.icon} ${skill.name} (${skill.manaCost} MP)`);
    lines.push(`Type: ${skill.elementalType}`);
    lines.push('');

    // Mechanics
    const mechanics = getSkillMechanicsLines(skill);
    lines.push(...mechanics);

    // Once per battle warning
    if (skill.usesPerBattle) {
        lines.push('');
        lines.push('⚠️ Once per battle');
    }

    return lines.join('\n');
}

/**
 * Format skill tooltip for SkillLoadoutModal (full, includes flavor text)
 * 
 * Format:
 * {icon} {name}
 * Lv {level} | {cost} MP | {type}
 * ⚠️ Once per battle (if applicable)
 * 
 * {mechanics line 1}
 * {mechanics line 2}
 * 
 * "{flavor text}"
 */
export function formatSkillTooltipFull(skill: Skill): string {
    const lines: string[] = [];

    // Header
    lines.push(`${skill.icon} ${skill.name}`);
    lines.push(`Lv ${skill.learnLevel} | ${skill.manaCost} MP | ${skill.elementalType}`);

    // Once per battle warning
    if (skill.usesPerBattle) {
        lines.push('⚠️ Once per battle');
    }

    lines.push('');

    // Mechanics
    const mechanics = getSkillMechanicsLines(skill);
    lines.push(...mechanics);

    // Flavor text (in quotes)
    lines.push('');
    lines.push(`"${skill.description}"`);

    return lines.join('\n');
}

// =====================
// HELPERS
// =====================

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
