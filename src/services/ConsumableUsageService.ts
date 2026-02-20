/**
 * Consumable Usage Service
 * 
 * Handles the effects of using consumable items in combat.
 * BattleView calls this service and reacts to results.
 */

import { ConsumableDefinition, ConsumableEffect, CONSUMABLES } from '../models/Consumable';
import { isDoTEffect, isHardCC } from '../models/StatusEffect';
import { useBattleStore } from '../store/battleStore';
import { copyVolatileStatusToPersistent } from './BattleService';

export interface ConsumableResult {
    success: boolean;
    logMessage: string;
    endsTurn: boolean;
    endsBattle?: 'retreat' | 'victory';
    error?: string;
}

/**
 * Execute a consumable item in combat.
 * Returns a result object describing what happened.
 * 
 * NOTE: Named `executeConsumable` (not `useConsumable`) to avoid
 * triggering React's Rules of Hooks — `use*` prefix is reserved.
 */
export function executeConsumable(
    itemId: string,
    characterLevel: number
): ConsumableResult {
    const def = CONSUMABLES[itemId];
    if (!def) {
        return { success: false, logMessage: '', endsTurn: false, error: 'Unknown item' };
    }

    switch (def.effect) {
        case ConsumableEffect.HP_RESTORE:
            return handleHpRestore(def);
        case ConsumableEffect.MANA_RESTORE:
            return handleManaRestore(def);
        case ConsumableEffect.CLEANSE_DOT:
            return handleCleanseDot();
        case ConsumableEffect.CLEANSE_CURSE_CC:
            return handleCleanseCurseCC();
        case ConsumableEffect.DIRECT_DAMAGE:
            return handleDirectDamage(def, characterLevel);
        case ConsumableEffect.GUARANTEED_RETREAT:
            return handleGuaranteedRetreat();
        // DEF_STAGE_BOOST deferred to Phase 3A (needs ConsumableBuff from battleStore)
        default:
            return { success: false, logMessage: '', endsTurn: false, error: 'Effect not implemented' };
    }
}

/** Handle HP restoration consumables */
function handleHpRestore(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    const maxHP = store.playerStats?.maxHP ?? 0;
    const currentHP = store.playerCurrentHP;
    const newHP = Math.min(maxHP, currentHP + def.effectValue);
    store.updatePlayerHP(newHP);
    return {
        success: true,
        logMessage: `Used ${def.name}: +${def.effectValue} HP!`,
        endsTurn: true,
    };
}

/** Handle mana restoration consumables */
function handleManaRestore(def: ConsumableDefinition): ConsumableResult {
    const store = useBattleStore.getState();
    const maxMana = store.playerStats?.maxMana ?? 0;
    const currentMana = store.playerCurrentMana;
    const newMana = Math.min(maxMana, currentMana + def.effectValue);
    store.updatePlayerMana(newMana);
    return {
        success: true,
        logMessage: `Used ${def.name}: +${def.effectValue} MP!`,
        endsTurn: true,
    };
}

/** Handle Purifying Salve — remove all DoT effects (burn, poison, bleed) */
function handleCleanseDot(): ConsumableResult {
    const store = useBattleStore.getState();
    const player = store.player;
    if (!player) return { success: false, logMessage: '', endsTurn: false, error: 'No player' };

    const filtered = player.volatileStatusEffects.filter(e => !isDoTEffect(e.type));
    store.updatePlayer({ volatileStatusEffects: filtered });
    return {
        success: true,
        logMessage: 'Used Purifying Salve: Removed all afflictions!',
        endsTurn: true,
    };
}

/** Handle Sacred Water — remove curse + all hard CC (paralyze, sleep, freeze, stun) */
function handleCleanseCurseCC(): ConsumableResult {
    const store = useBattleStore.getState();
    const player = store.player;
    if (!player) return { success: false, logMessage: '', endsTurn: false, error: 'No player' };

    // Remove curse + all hard CC
    const filtered = player.volatileStatusEffects.filter(
        e => e.type !== 'curse' && !isHardCC(e.type)
    );
    store.updatePlayer({ volatileStatusEffects: filtered });
    return {
        success: true,
        logMessage: 'Used Sacred Water: Cleansed curse and bindings!',
        endsTurn: true,
    };
}

/** Handle Firebomb — deal base + perLevel * level fire damage to monster */
function handleDirectDamage(def: ConsumableDefinition, level: number): ConsumableResult {
    // Defensive validation — use != null for both undefined and null safety
    if (!def.damageFormula?.base || def.damageFormula?.perLevel == null) {
        // Data integrity warning (not debug output)
        console.warn('[ConsumableUsageService] Invalid damage formula for:', def.id);
        return { success: false, logMessage: '', endsTurn: false, error: 'Invalid damage formula' };
    }

    const store = useBattleStore.getState();
    const monster = store.monster;
    if (!monster) return { success: false, logMessage: '', endsTurn: false, error: 'No monster' };

    const damage = def.damageFormula.base + def.damageFormula.perLevel * level;
    const newHP = Math.max(0, monster.currentHP - damage);
    store.updateMonster({ currentHP: newHP });

    if (newHP <= 0) {
        return {
            success: true,
            logMessage: `Hurled a Firebomb: ${damage} fire damage! ${monster.name} falls!`,
            endsTurn: false,
            endsBattle: 'victory',
        };
    }

    return {
        success: true,
        logMessage: `Hurled a Firebomb: ${damage} fire damage!`,
        endsTurn: true,
    };
}

/** Handle Smoke Bomb — guaranteed retreat bypassing RNG */
function handleGuaranteedRetreat(): ConsumableResult {
    copyVolatileStatusToPersistent();
    return {
        success: true,
        logMessage: 'Used Smoke Bomb: Vanished in a puff of smoke!',
        endsTurn: false,
        endsBattle: 'retreat',
    };
}

// handleDefStageBoost is implemented in Phase 3A alongside ConsumableBuff
// (see Phase 3A section for full implementation)
