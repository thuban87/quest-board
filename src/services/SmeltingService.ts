/**
 * Smelting Service
 * 
 * Handles the blacksmith smelting system - combining 3 items
 * of the same tier into 1 item of the next tier up.
 * 
 * Uses transaction pattern for data integrity.
 */

import { GearItem, GearTier, GearSlot, getNextTier, GEAR_TIERS, calculateSellValue } from '../models/Gear';
import { useCharacterStore } from '../store/characterStore';
import { lootGenerationService } from './LootGenerationService';

// ============================================
// Constants
// ============================================

/** Cost in gold for legendary refinement (re-rolling 3 legendaries) */
export const LEGENDARY_REFINEMENT_COST = 4000;

/** Number of items required for smelting */
export const SMELT_ITEM_COUNT = 3;

// ============================================
// Types
// ============================================

export interface SmeltValidation {
    valid: boolean;
    error?: string;
    isLegendaryRefinement?: boolean;
}

export interface SmeltResult {
    success: boolean;
    outputItem?: GearItem;
    goldCost?: number;
    error?: string;
}

// ============================================
// Smelting Service
// ============================================

export class SmeltingService {
    /**
     * Validate if items can be smelted together.
     * @param items Array of gear items to check
     * @returns Validation result with error message if invalid
     */
    canSmelt(items: GearItem[]): SmeltValidation {
        // Must have exactly 3 items
        if (items.length !== SMELT_ITEM_COUNT) {
            return { valid: false, error: `Select exactly ${SMELT_ITEM_COUNT} items` };
        }

        // Check for pending smelt status (already in a transaction)
        if (items.some(item => item.status === 'pending_smelt')) {
            return { valid: false, error: 'One or more items are already being smelted' };
        }

        // Check for all-legendary (special refinement case)
        const allLegendary = items.every(item => item.tier === 'legendary');
        if (allLegendary) {
            const charStore = useCharacterStore.getState();
            const gold = charStore.character?.gold ?? 0;

            if (gold < LEGENDARY_REFINEMENT_COST) {
                return {
                    valid: false,
                    error: `Legendary refinement requires ${LEGENDARY_REFINEMENT_COST.toLocaleString()}g (you have ${gold.toLocaleString()}g)`
                };
            }

            return { valid: true, isLegendaryRefinement: true };
        }

        return { valid: true };
    }

    /**
     * Get the output tier based on input items.
     * - All same tier (non-legendary): upgrade to next tier
     * - All legendary: stays legendary (refinement)
     * - Mixed tiers: output = highest input tier (no upgrade)
     */
    getOutputTier(items: GearItem[]): GearTier {
        // Find the highest tier among inputs
        const tiers = items.map(item => GEAR_TIERS.indexOf(item.tier));
        const maxTierIndex = Math.max(...tiers);
        const highestTier = GEAR_TIERS[maxTierIndex];

        // Check if all items are the same tier
        const allSameTier = items.every(item => item.tier === items[0].tier);

        // All legendary = refinement (stays legendary)
        if (allSameTier && items[0].tier === 'legendary') {
            return 'legendary';
        }

        // All same tier (non-legendary) = upgrade to next tier
        if (allSameTier) {
            return getNextTier(highestTier) ?? highestTier;
        }

        // Mixed tiers = output is highest input tier (no upgrade)
        return highestTier;
    }

    /**
     * Determine output slot based on input items.
     * If all items are same slot, output is guaranteed that slot.
     * Otherwise, random slot from the inputs.
     */
    getOutputSlot(items: GearItem[]): GearSlot {
        const slots = items.map(item => item.slot);
        const allSameSlot = slots.every(s => s === slots[0]);

        if (allSameSlot) {
            return slots[0];
        }

        // Random slot from inputs
        return slots[Math.floor(Math.random() * slots.length)];
    }

    /**
     * Calculate output level (average of inputs, rounded up).
     */
    getOutputLevel(items: GearItem[]): number {
        const totalLevel = items.reduce((sum, item) => sum + item.level, 0);
        return Math.ceil(totalLevel / items.length);
    }

    /**
     * Check if all items are the same slot (for same-slot bonus).
     */
    hasSameSlotBonus(items: GearItem[]): boolean {
        if (items.length === 0) return false;
        const slot = items[0].slot;
        return items.every(item => item.slot === slot);
    }

    /**
     * Smelt 3 items into 1 higher tier item using transaction pattern.
     * 
     * Transaction Flow:
     * 1. Mark input items as 'pending_smelt'
     * 2. Generate output item
     * 3. Add output to inventory
     * 4. Remove input items
     * 5. Deduct gold (legendary only)
     * 6. On failure: rollback pending status
     * 
     * @param items Exactly 3 items of same tier to smelt
     * @returns Result with output item or error
     */
    async smelt(items: [GearItem, GearItem, GearItem]): Promise<SmeltResult> {
        // Validate first
        const validation = this.canSmelt(items);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const charStore = useCharacterStore.getState();
        const itemIds = items.map(i => i.id);
        const isLegendaryRefinement = validation.isLegendaryRefinement;

        try {
            // Step 1: Mark items as pending (prevents re-use)
            charStore.markGearPendingSmelt(itemIds);

            // Step 2: Calculate output parameters
            const outputTier = this.getOutputTier(items);
            const outputSlot = this.getOutputSlot(items);
            const outputLevel = this.getOutputLevel(items);

            // Get character class for appropriate gear generation
            const characterClass = charStore.character?.class;

            // Step 3: Generate new item
            const outputItem = lootGenerationService.generateGearItem(
                outputSlot,
                outputTier,
                outputLevel,
                'smelt',
                items.map(i => i.id).join('+'), // Source ID tracks input items
                characterClass
            );

            // Step 4: Remove input items (no gold - these are consumed, not sold)
            const newInventory = charStore.character!.gearInventory.filter(
                item => !itemIds.includes(item.id)
            );

            // Step 5: Add output item to inventory
            const finalInventory = [...newInventory, outputItem];

            // Step 6: Deduct gold for legendary refinement
            let goldCost = 0;
            if (isLegendaryRefinement) {
                goldCost = LEGENDARY_REFINEMENT_COST;
            }

            // Apply all changes atomically
            const character = charStore.character!;
            useCharacterStore.setState({
                character: {
                    ...character,
                    gearInventory: finalInventory,
                    gold: character.gold - goldCost,
                    lastModified: new Date().toISOString(),
                },
            });

            return {
                success: true,
                outputItem,
                goldCost,
            };

        } catch (error) {
            // Rollback: clear pending status
            console.error('[SmeltingService] Smelt failed, rolling back:', error);
            charStore.clearGearPendingSmelt(itemIds);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Smelting failed'
            };
        }
    }

    /**
     * Preview what a smelt would produce (without actually doing it).
     * Used for UI feedback.
     */
    previewSmelt(items: GearItem[]): {
        outputTier: GearTier;
        outputSlot: GearSlot | 'random';
        outputLevel: number;
        hasSameSlotBonus: boolean;
        isLegendaryRefinement: boolean;
        goldCost: number;
    } | null {
        if (items.length !== SMELT_ITEM_COUNT) return null;

        const validation = this.canSmelt(items);
        // Even if validation fails (e.g. not enough gold), still show preview

        const outputTier = this.getOutputTier(items);
        const sameSlotBonus = this.hasSameSlotBonus(items);
        const allLegendary = items.every(item => item.tier === 'legendary');

        return {
            outputTier,
            outputSlot: sameSlotBonus ? items[0].slot : 'random',
            outputLevel: this.getOutputLevel(items),
            hasSameSlotBonus: sameSlotBonus,
            isLegendaryRefinement: allLegendary,
            goldCost: allLegendary ? LEGENDARY_REFINEMENT_COST : 0,
        };
    }
}

// Export singleton instance
export const smeltingService = new SmeltingService();
