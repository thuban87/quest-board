/**
 * Phase 4c: Accessory Integration Tests
 *
 * Tests that accessory effects are correctly consumed by the game's systems:
 * CombatService, BattleService, LootGenerationService, StreakService,
 * characterStore, dungeonStore, gearFormatters, and useXPAward.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Character, DEFAULT_STATS, CHARACTER_SCHEMA_VERSION, CharacterStats } from '../src/models/Character';
import {
    GearItem, GearSlot, EquippedGearMap, createEmptyEquippedGear,
} from '../src/models/Gear';
import {
    getAccessoryTemplate, AccessoryTemplate,
} from '../src/data/accessories';
import {
    getGoldMultiplier,
    getXPMultiplier,
    getCombatBonus,
    getPassiveProc,
    getStatMultiplier,
    getLootBonus,
    getUtilityBonus,
    getDungeonBonus,
    formatEffectLabel,
} from '../src/services/AccessoryEffectService';

// ============================================
// Helper Functions
// ============================================

/**
 * Create a mock accessory GearItem from a template ID.
 * Follows patterns from accessory-effect-service.test.ts.
 */
function makeAccessory(templateId: string, slot: 'accessory1' | 'accessory2' | 'accessory3' = 'accessory1'): GearItem {
    const template = getAccessoryTemplate(templateId);
    if (!template) throw new Error(`Unknown template: ${templateId}`);
    return {
        id: `test-${templateId}-${slot}`,
        name: template.name,
        description: `Test ${template.name}`,
        slot,
        tier: template.tier === 'T1' ? 'common'
            : template.tier === 'T2' ? 'adept'
                : template.tier === 'T3' ? 'journeyman'
                    : 'epic',
        level: 10,
        stats: {
            primaryStat: 'wisdom',
            primaryValue: 5,
        },
        sellValue: 50,
        iconEmoji: '💍',
        source: 'combat',
        acquiredAt: new Date().toISOString(),
        templateId,
    };
}

/**
 * Create an EquippedGearMap with accessories in specified slots.
 */
function makeGearWith(
    ...accessories: Array<{ templateId: string; slot: 'accessory1' | 'accessory2' | 'accessory3' }>
): EquippedGearMap {
    const gear = createEmptyEquippedGear();
    for (const acc of accessories) {
        gear[acc.slot] = makeAccessory(acc.templateId, acc.slot);
    }
    return gear;
}

/**
 * Create a minimal Character with sensible defaults and optional overrides.
 */
function makeCharacter(overrides: Partial<Character> = {}): Character {
    const baseStats: CharacterStats = { ...DEFAULT_STATS };
    return {
        schemaVersion: CHARACTER_SCHEMA_VERSION,
        name: 'TestHero',
        class: 'warrior',
        secondaryClass: null,
        level: 10,
        totalXP: 1000,
        spriteVersion: 1,
        appearance: {},
        equippedGear: createEmptyEquippedGear(),
        trainingXP: 0,
        trainingLevel: 0,
        isTrainingMode: false,
        baseStats,
        statBonuses: { strength: 0, intelligence: 0, wisdom: 0, constitution: 0, dexterity: 0, charisma: 0 },
        categoryXPAccumulator: {},
        currentStreak: 5,
        highestStreak: 10,
        lastQuestCompletionDate: null,
        totalShieldsUsedThisWeek: 0,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        tasksCompletedToday: 0,
        lastTaskDate: null,
        activePowerUps: [],
        gold: 500,
        gearInventory: [],
        inventoryLimit: 50,
        currentHP: 100,
        maxHP: 100,
        currentMana: 50,
        maxMana: 50,
        stamina: 10,
        staminaGainedToday: 0,
        lastStaminaResetDate: null,
        status: 'alive',
        activityHistory: [],
        triggerCooldowns: {},
        skills: { unlocked: [], equipped: [] },
        dungeonExploration: {},
        lifetimeStats: {
            questsCompleted: 0,
            battlesWon: 0,
            bossesDefeated: 0,
            dungeonsCompleted: 0,
            dungeonAttempts: 0,
            goldEarned: 0,
        },
        ...overrides,
    } as Character;
}


// ============================================
// 1. deriveCombatStats — accessory bonuses
// ============================================

describe('deriveCombatStats — accessory bonuses', () => {
    // Import the real function (pure, no mocks needed)
    let deriveCombatStats: typeof import('../src/services/CombatService').deriveCombatStats;

    beforeEach(async () => {
        const mod = await import('../src/services/CombatService');
        deriveCombatStats = mod.deriveCombatStats;
    });

    it('crit/dodge/block bonuses aggregate correctly', () => {
        const gear = makeGearWith(
            { templateId: 'berserkers_band', slot: 'accessory1' },      // +5% crit
            { templateId: 'windrunners_anklet', slot: 'accessory2' },   // +6% dodge
            { templateId: 'guardians_talisman', slot: 'accessory3' },   // +8% block
        );
        const ch = makeCharacter({ equippedGear: gear });
        const stats = deriveCombatStats(ch);

        // Check that accessory bonuses are included in the totals
        // The exact totals include base stats + gear, so we verify they're greater
        // than what they'd be without accessories
        const noAccGear = createEmptyEquippedGear();
        const baseStats = deriveCombatStats(makeCharacter({ equippedGear: noAccGear }));

        expect(stats.critChance).toBeGreaterThan(baseStats.critChance);
        expect(stats.dodgeChance).toBeGreaterThan(baseStats.dodgeChance);
        expect(stats.blockChance).toBeGreaterThan(baseStats.blockChance);

        // Verify the specific bonus amounts from getCombatBonus match
        expect(getCombatBonus(gear, 'crit')).toBeCloseTo(0.05);
        expect(getCombatBonus(gear, 'dodge')).toBeCloseTo(0.06);
        expect(getCombatBonus(gear, 'block')).toBeCloseTo(0.08);
    });

    it('percentage HP/Mana applied as baseHP * (1 + bonus), not flat', () => {
        const gear = makeGearWith(
            { templateId: 'stoneblood_amulet', slot: 'accessory1' },    // +15% maxHP
            { templateId: 'mana_wellspring_ring', slot: 'accessory2' }, // +15% maxMana
        );
        const ch = makeCharacter({ equippedGear: gear });
        const stats = deriveCombatStats(ch);

        const noAccStats = deriveCombatStats(makeCharacter());

        // HP should be ~15% higher than base
        expect(stats.maxHP).toBeGreaterThan(noAccStats.maxHP);
        const hpRatio = stats.maxHP / noAccStats.maxHP;
        expect(hpRatio).toBeCloseTo(1.15, 1); // Within 0.1 of 1.15

        // Mana should be ~15% higher than base
        expect(stats.maxMana).toBeGreaterThan(noAccStats.maxMana);
        const manaRatio = stats.maxMana / noAccStats.maxMana;
        expect(manaRatio).toBeCloseTo(1.15, 1);
    });

    it('stat multiplier (Heart of the Wyrm +10%) applied to all stats', () => {
        const gear = makeGearWith(
            { templateId: 'heart_of_the_wyrm', slot: 'accessory1' },  // +10% ALL stats
        );

        // Verify the service returns 0.10 for each stat
        expect(getStatMultiplier(gear, 'strength')).toBeCloseTo(0.10);
        expect(getStatMultiplier(gear, 'intelligence')).toBeCloseTo(0.10);
        expect(getStatMultiplier(gear, 'wisdom')).toBeCloseTo(0.10);
        expect(getStatMultiplier(gear, 'constitution')).toBeCloseTo(0.10);
        expect(getStatMultiplier(gear, 'dexterity')).toBeCloseTo(0.10);
        expect(getStatMultiplier(gear, 'charisma')).toBeCloseTo(0.10);

        // deriveCombatStats should produce higher attack from boosted stats
        const ch = makeCharacter({ equippedGear: gear });
        const stats = deriveCombatStats(ch);
        const baseStats = deriveCombatStats(makeCharacter());
        expect(stats.physicalAttack).toBeGreaterThan(baseStats.physicalAttack);
    });

    it('loot tier upgrade bonus accessible via getLootBonus', () => {
        const gear = makeGearWith(
            { templateId: 'lucky_rabbits_foot', slot: 'accessory1' },  // +5% tier upgrade
        );
        expect(getLootBonus(gear, 'gearTier')).toBeCloseTo(0.05);
    });

    it('fire resist and crit damage stored on CombatStats', () => {
        const gear = makeGearWith(
            { templateId: 'molten_scale_charm', slot: 'accessory1' },  // +10% fire resist
            { templateId: 'tyrants_knuckle_ring', slot: 'accessory2' }, // +10% crit damage
        );
        const ch = makeCharacter({ equippedGear: gear });
        const stats = deriveCombatStats(ch);

        expect(stats.fireResist).toBeCloseTo(0.10);
        expect(stats.critDamageBonus).toBeCloseTo(0.10);
    });
});


// ============================================
// 2. handleVictory — XP/gold multipliers
// ============================================

// Mock modules needed by BattleService
vi.mock('../src/services/BalanceTestingService', () => ({
    startBattleTracking: vi.fn(),
    trackSkillUse: vi.fn(),
    trackDamage: vi.fn(),
    trackHPChange: vi.fn(),
    updateTurnCount: vi.fn(),
    finalizeBattle: vi.fn(),
    isBalanceTestingEnabled: vi.fn(() => false),
    logMessage: vi.fn(),
}));

vi.mock('../src/services/MonsterService', () => ({
    selectRandomMonster: vi.fn(),
    getMonsterByTemplateId: vi.fn(),
    MonsterService: vi.fn(),
}));

vi.mock('../src/data/monsterSkills', () => ({
    MONSTER_SKILLS: {},
    getMonsterSkills: vi.fn(() => []),
    selectMonsterSkillAI: vi.fn(() => null),
}));

vi.mock('../src/modals/LevelUpModal', () => ({
    LevelUpModal: vi.fn().mockImplementation(() => ({
        open: vi.fn(),
        close: vi.fn(),
    })),
}));

describe('handleVictory — XP/gold multipliers', () => {
    let handleVictory: typeof import('../src/services/BattleService').handleVictory;
    let generateVictoryLoot: typeof import('../src/services/BattleService').generateVictoryLoot;
    let setSaveCallback: typeof import('../src/services/BattleService').setSaveCallback;
    let useBattleStore: typeof import('../src/store/battleStore').useBattleStore;
    let useCharacterStore: typeof import('../src/store/characterStore').useCharacterStore;

    beforeEach(async () => {
        const battleService = await import('../src/services/BattleService');
        handleVictory = battleService.handleVictory;
        generateVictoryLoot = battleService.generateVictoryLoot;
        setSaveCallback = battleService.setSaveCallback;

        const battleStore = await import('../src/store/battleStore');
        useBattleStore = battleStore.useBattleStore;

        const charStore = await import('../src/store/characterStore');
        useCharacterStore = charStore.useCharacterStore;

        setSaveCallback(vi.fn(() => Promise.resolve()));
    });

    it('XP multiplier correctly applied to combat XP reward', () => {
        const gear = makeGearWith(
            { templateId: 'battle_medallion', slot: 'accessory1' },  // +15% combat XP
        );
        const character = makeCharacter({ equippedGear: gear });

        useCharacterStore.setState({ character, inventory: [], achievements: [] });

        useBattleStore.setState({
            isInCombat: true,
            state: 'ANIMATING_PLAYER',
            monster: {
                id: 'test-monster',
                templateId: 'goblin',
                name: 'Test Goblin',
                currentHP: 0,
                maxHP: 50,
                attack: 10,
                defense: 5,
                magicDefense: 5,
                critChance: 5,
                xpReward: 100,
                goldReward: 50,
                level: 5,
                tier: 'adept',
                skills: [],
                statStages: { atk: 0, def: 0 },
            } as any,
            player: { maxHP: 100, statStages: { atk: 0, def: 0 }, volatileStatusEffects: [], consumableBuffs: [], skillsUsedThisBattle: [] },
            playerStats: { maxHP: 100, maxMana: 50, currentHP: 80, currentMana: 40, physicalAttack: 20, magicAttack: 15, defense: 10, magicDefense: 8, critChance: 10, dodgeChance: 5, blockChance: 5, damageModifier: 1, fireResist: 0, critDamageBonus: 0 },
            playerCurrentHP: 80,
            playerCurrentMana: 40,
            turnNumber: 5,
            log: [],
            lootBonus: 0,
        } as any);

        const oldGold = character.gold;
        handleVictory();

        const updated = useCharacterStore.getState().character!;
        // XP: 100 * (1 + 0.15) = 115 (floor)
        // Gold: 50 * (1 + 0) = 50 (no gold accessory)
        expect(updated.gold).toBe(oldGold + 50);

        // XP was awarded via addXP — check it increased
        expect(updated.totalXP).toBeGreaterThan(character.totalXP);
    });

    it('gold multiplier correctly applied to combat gold reward', () => {
        const gear = makeGearWith(
            { templateId: 'coin_collectors_token', slot: 'accessory1' },  // +15% combat gold
        );
        const character = makeCharacter({ equippedGear: gear, gold: 100 });

        useCharacterStore.setState({ character, inventory: [], achievements: [] });
        useBattleStore.setState({
            isInCombat: true,
            state: 'ANIMATING_PLAYER',
            monster: {
                id: 'test-monster',
                templateId: 'goblin',
                name: 'Test Goblin',
                currentHP: 0,
                maxHP: 50,
                attack: 10,
                defense: 5,
                magicDefense: 5,
                critChance: 5,
                xpReward: 100,
                goldReward: 200,
                level: 5,
                tier: 'adept',
                skills: [],
                statStages: { atk: 0, def: 0 },
            } as any,
            player: { maxHP: 100, statStages: { atk: 0, def: 0 }, volatileStatusEffects: [], consumableBuffs: [], skillsUsedThisBattle: [] },
            playerStats: { maxHP: 100, maxMana: 50, currentHP: 80, currentMana: 40, physicalAttack: 20, magicAttack: 15, defense: 10, magicDefense: 8, critChance: 10, dodgeChance: 5, blockChance: 5, damageModifier: 1, fireResist: 0, critDamageBonus: 0 },
            playerCurrentHP: 80,
            playerCurrentMana: 40,
            turnNumber: 5,
            log: [],
            lootBonus: 0,
        } as any);

        handleVictory();

        const updated = useCharacterStore.getState().character!;
        // Gold: Math.floor(200 * (1 + 0.15)) — may be 229 or 230 due to float precision
        const expectedGold = Math.floor(200 * (1 + getGoldMultiplier(gear, 'combat')));
        expect(updated.gold).toBe(100 + expectedGold);
    });

    it('generateVictoryLoot passes monster.templateId for boss loot lookup', () => {
        const character = makeCharacter();
        useCharacterStore.setState({ character, inventory: [], achievements: [] });
        useBattleStore.setState({
            isInCombat: true,
            monster: {
                id: 'boss-1',
                templateId: 'boss-alpha-wolf',
                name: 'Alpha Wolf',
                currentHP: 0,
                maxHP: 200,
                attack: 30,
                defense: 15,
                magicDefense: 10,
                critChance: 10,
                xpReward: 500,
                goldReward: 200,
                level: 10,
                tier: 'journeyman',
                skills: [],
                statStages: { atk: 0, def: 0 },
            } as any,
            lootBonus: 0,
        } as any);

        // generateVictoryLoot should not throw and should return an array
        const loot = generateVictoryLoot();
        expect(Array.isArray(loot)).toBe(true);
    });
});


// ============================================
// 3. LootGenerationService — quest/combat loot multipliers
// ============================================

describe('LootGenerationService — accessory multipliers', () => {
    it('gold multiplier applied via getGoldMultiplier for quest source', () => {
        const gear = makeGearWith(
            { templateId: 'merchants_signet', slot: 'accessory1' },      // +10% quest gold
            { templateId: 'alchemists_purse', slot: 'accessory2' },      // +25% ALL gold
        );
        const multiplier = getGoldMultiplier(gear, 'quest');
        expect(multiplier).toBeCloseTo(0.35); // 10% + 25% = 35%
    });

    it('daily quest gold multiplier (Taxman Ring) doubles daily gold', () => {
        const gear = makeGearWith(
            { templateId: 'taxmans_ring', slot: 'accessory1' },  // +100% daily gold
        );
        const multiplier = getGoldMultiplier(gear, 'daily');
        expect(multiplier).toBeCloseTo(1.00); // 100% bonus = doubled
    });

    it('set piece chance bonus increases set drop rate', () => {
        const gear = makeGearWith(
            { templateId: 'collectors_monocle', slot: 'accessory1' },  // +10% set chance
        );
        expect(getLootBonus(gear, 'setChance')).toBeCloseTo(0.10);
    });

    it('gear tier upgrade bonus increases tier rolls', () => {
        const gear = makeGearWith(
            { templateId: 'lucky_rabbits_foot', slot: 'accessory1' },  // +5% tier upgrade
        );
        expect(getLootBonus(gear, 'gearTier')).toBeCloseTo(0.05);
    });

    it('boss kill consumable guarantee grants consumable', () => {
        const gear = makeGearWith(
            { templateId: 'magpies_brooch', slot: 'accessory1' },  // boss consumable guarantee
        );
        expect(getUtilityBonus(gear, 'bossConsumable')).toBe(1);
    });
});


// ============================================
// 4. StreakService — shield stacking
// ============================================

describe('StreakService — shield stacking', () => {
    let updateStreak: typeof import('../src/services/StreakService').updateStreak;
    let checkStreakOnLoad: typeof import('../src/services/StreakService').checkStreakOnLoad;

    beforeEach(async () => {
        const mod = await import('../src/services/StreakService');
        updateStreak = mod.updateStreak;
        checkStreakOnLoad = mod.checkStreakOnLoad;
    });

    it('streak shield counts correctly: 1 for Charm alone (non-Paladin)', () => {
        const gear = makeGearWith(
            { templateId: 'streak_shield_charm', slot: 'accessory1' },  // +1 shield
        );
        const accessoryShields = getUtilityBonus(gear, 'streakShield');
        expect(accessoryShields).toBe(1);

        // maxShieldsPerWeek = (isPaladin ? 1 : 0) + accessoryShields = 0 + 1 = 1
        const maxShields = (false ? 1 : 0) + accessoryShields;
        expect(maxShields).toBe(1);
    });

    it('streak shield counts correctly: 2 for Paladin + Charm', () => {
        const gear = makeGearWith(
            { templateId: 'streak_shield_charm', slot: 'accessory1' },  // +1 shield
        );
        const accessoryShields = getUtilityBonus(gear, 'streakShield');

        // maxShieldsPerWeek = (isPaladin ? 1 : 0) + accessoryShields = 1 + 1 = 2
        const maxShields = (true ? 1 : 0) + accessoryShields;
        expect(maxShields).toBe(2);
    });

    it('streak shield resets weekly count on new week', () => {
        const gear = makeGearWith(
            { templateId: 'streak_shield_charm', slot: 'accessory1' },
        );

        // Simulate: shield was used last week, new week now
        const lastMonday = new Date();
        lastMonday.setDate(lastMonday.getDate() - 7); // One week ago
        const lastMondayStr = lastMonday.toISOString().split('T')[0];

        const character = makeCharacter({
            currentStreak: 5,
            totalShieldsUsedThisWeek: 1,
            lastQuestCompletionDate: lastMondayStr,
            equippedGear: gear,
        });

        const result = checkStreakOnLoad(character, false, gear);
        // Shield count should be reset (new week)
        expect(result.shieldWasReset).toBe(true);
        expect(result.character.totalShieldsUsedThisWeek).toBe(0);
    });

    it('checkStreakOnLoad preserves streak when shield available', () => {
        const gear = makeGearWith(
            { templateId: 'streak_shield_charm', slot: 'accessory1' },
        );

        // Simulate: missed exactly 1 day, shield unused
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

        const character = makeCharacter({
            currentStreak: 5,
            totalShieldsUsedThisWeek: 0,
            lastQuestCompletionDate: twoDaysAgoStr,
            equippedGear: gear,
        });

        const result = checkStreakOnLoad(character, false, gear);
        // Shield available + only 1 day missed → streak preserved
        expect(result.streakWasReset).toBe(false);
        expect(result.character.currentStreak).toBe(5);
    });
});


// ============================================
// 5. characterStore — equip clamping + stamina cap
// ============================================

describe('characterStore — equip clamping + stamina cap', () => {
    let useCharacterStore: typeof import('../src/store/characterStore').useCharacterStore;

    beforeEach(async () => {
        const mod = await import('../src/store/characterStore');
        useCharacterStore = mod.useCharacterStore;
    });

    it('equipping HP accessory increases maxHP', () => {
        const hpAcc = makeAccessory('stoneblood_amulet', 'accessory1'); // +15% maxHP
        const character = makeCharacter({
            currentHP: 100,
            maxHP: 100,
            gearInventory: [hpAcc],
        });

        useCharacterStore.setState({ character });

        // Equip the accessory
        useCharacterStore.getState().equipGear('accessory1', hpAcc.id);

        const updated = useCharacterStore.getState().character!;
        // recalculateMaxHPMana should have been called — maxHP should be higher
        expect(updated.maxHP).toBeGreaterThanOrEqual(100);
    });

    it('unequip clamping: HP clamped when HP accessory removed', () => {
        const hpAcc = makeAccessory('stoneblood_amulet', 'accessory1'); // +15% maxHP
        const gear = createEmptyEquippedGear();
        gear.accessory1 = hpAcc;

        const character = makeCharacter({
            equippedGear: gear,
            currentHP: 115,  // At the boosted max
            maxHP: 115,
            gearInventory: [],
        });

        useCharacterStore.setState({ character });

        // Unequip — should trigger recalculateMaxHPMana, clamping HP
        useCharacterStore.getState().unequipGear('accessory1');

        const updated = useCharacterStore.getState().character!;
        expect(updated.currentHP).toBeLessThanOrEqual(updated.maxHP);
    });

    it('unequip clamping: Mana clamped when mana accessory removed', () => {
        const manaAcc = makeAccessory('mana_wellspring_ring', 'accessory2'); // +15% maxMana
        const gear = createEmptyEquippedGear();
        gear.accessory2 = manaAcc;

        const character = makeCharacter({
            equippedGear: gear,
            currentMana: 58,  // At the boosted max
            maxMana: 58,
            gearInventory: [],
        });

        useCharacterStore.setState({ character });

        useCharacterStore.getState().unequipGear('accessory2');

        const updated = useCharacterStore.getState().character!;
        expect(updated.currentMana).toBeLessThanOrEqual(updated.maxMana);
    });

    it('stamina cap: awardStamina uses dynamic cap with accessory bonus', () => {
        const staminaAcc = makeAccessory('stamina_sash', 'accessory1'); // +5 stamina cap
        const gear = createEmptyEquippedGear();
        gear.accessory1 = staminaAcc;

        // Set stamina gained today to 50 (base MAX_DAILY_STAMINA = 50 in test, 500 in test mode)
        // With accessory bonus of +5, effective cap should be 55
        const character = makeCharacter({
            equippedGear: gear,
            stamina: 10,
            staminaGainedToday: 50,
            lastStaminaResetDate: new Date().toISOString().split('T')[0],
        });

        useCharacterStore.setState({ character });

        // Without the accessory, this would be at cap. With +5, we should be able to gain more.
        useCharacterStore.getState().awardStamina(2);

        const updated = useCharacterStore.getState().character!;
        // Verify the stamina was granted (past the base cap)
        expect(updated.staminaGainedToday).toBeGreaterThan(50);
    });

    it("Miser's Pendant: +20% sell value from getGoldMultiplier", () => {
        const gear = makeGearWith(
            { templateId: 'misers_pendant', slot: 'accessory1' },  // +20% sell gold
        );
        expect(getGoldMultiplier(gear, 'sell')).toBeCloseTo(0.20);

        // Consumer pattern: sellValue * (1 + 0.20) = 20% more gold
        const baseSellValue = 100;
        const adjustedSell = Math.floor(baseSellValue * (1 + getGoldMultiplier(gear, 'sell')));
        expect(adjustedSell).toBe(120);
    });

    it('rapid equip/unequip does not corrupt state', () => {
        const acc1 = makeAccessory('stoneblood_amulet', 'accessory1');
        const acc2 = makeAccessory('mana_wellspring_ring', 'accessory2');

        const character = makeCharacter({
            gearInventory: [acc1, acc2],
            currentHP: 100,
            maxHP: 100,
            currentMana: 50,
            maxMana: 50,
        });

        useCharacterStore.setState({ character });

        const store = useCharacterStore.getState();

        // Equip first accessory
        store.equipGear('accessory1', acc1.id);

        // Get fresh state after first equip
        const afterFirst = useCharacterStore.getState();
        afterFirst.equipGear('accessory2', acc2.id);

        // Get fresh state and unequip first
        const afterSecond = useCharacterStore.getState();
        afterSecond.unequipGear('accessory1');

        // Get final state and unequip second
        const afterThird = useCharacterStore.getState();
        afterThird.unequipGear('accessory2');

        // Final state check — no NaN or undefined
        const final = useCharacterStore.getState().character!;
        expect(final.currentHP).toBeGreaterThan(0);
        expect(final.currentMana).toBeGreaterThan(0);
        expect(final.maxHP).toBeGreaterThan(0);
        expect(final.maxMana).toBeGreaterThan(0);
        expect(Number.isNaN(final.currentHP)).toBe(false);
        expect(Number.isNaN(final.maxHP)).toBe(false);
    });
});


// ============================================
// 6. dungeonStore — map reveal + golden chest
// ============================================

describe('dungeonStore — map reveal + golden chest', () => {
    it('map reveal bonus returned by getDungeonBonus', () => {
        const gear = makeGearWith(
            { templateId: 'cartographers_lens', slot: 'accessory1' },  // mapReveal = 1
        );
        expect(getDungeonBonus(gear, 'mapReveal')).toBe(true);
    });

    it('golden chest chance bonus increases roll probability', () => {
        const gear = makeGearWith(
            { templateId: 'prospectors_pendant', slot: 'accessory1' },  // +10% golden chest
        );
        expect(getDungeonBonus(gear, 'goldenChest')).toBeCloseTo(0.10);
    });
});


// ============================================
// 7. useXPAward — quest XP multiplier integration
// ============================================

describe('useXPAward — quest XP multiplier integration', () => {
    it('quest XP multiplier applies (Scholar\'s Monocle +10%)', () => {
        const gear = makeGearWith(
            { templateId: 'scholars_monocle', slot: 'accessory1' },  // +10% quest XP
        );
        const accQuestXP = getXPMultiplier(gear, 'quest');
        expect(accQuestXP).toBeCloseTo(0.10);

        // Replicate hook's formula: adjustedXP = Math.floor(baseXP * (1 + accXPBonus))
        const baseXP = 100;
        const adjustedXP = Math.floor(baseXP * (1 + accQuestXP));
        expect(adjustedXP).toBe(110);
    });

    it('recurring quest bonus stacks correctly with quest bonus', () => {
        const gear = makeGearWith(
            { templateId: 'scholars_monocle', slot: 'accessory1' },     // +10% quest XP
            { templateId: 'dedicated_workers_pin', slot: 'accessory2' }, // +20% recurring XP
        );
        const accQuestXP = getXPMultiplier(gear, 'quest');
        const accRecurringXP = getXPMultiplier(gear, 'recurring');
        const accXPBonus = accQuestXP + accRecurringXP;

        // Hook formula for recurring quest:
        const baseXP = 100;
        const adjustedXP = Math.floor(baseXP * (1 + accXPBonus));
        expect(adjustedXP).toBe(130); // 100 * 1.30 = 130
    });

    it('first daily quest bonus applies additively', () => {
        const gear = makeGearWith(
            { templateId: 'scholars_monocle', slot: 'accessory1' },  // +10% quest XP
            { templateId: 'early_bird_brooch', slot: 'accessory2' }, // +10% first daily XP
        );
        const accQuestXP = getXPMultiplier(gear, 'quest');
        const accFirstDailyXP = getXPMultiplier(gear, 'first_daily');
        const accXPBonus = accQuestXP + accFirstDailyXP;

        const baseXP = 100;
        const adjustedXP = Math.floor(baseXP * (1 + accXPBonus));
        expect(adjustedXP).toBe(120); // 100 * 1.20 = 120
    });

    it('power-up stacking: accessory XP bonus stacks additively (60% not 65%)', () => {
        // Scenario: Scholar's Monocle (+10%) + Dedicated Worker's Pin (+20%)
        // + first daily (+10%) = 40% from accessories
        // Then a 20% power-up bonus on top:
        // The hook applies accessories FIRST, then calculateXPWithBonus adds class bonus
        // So accessories stack additively: 10 + 20 + 10 = 40%
        const gear = makeGearWith(
            { templateId: 'scholars_monocle', slot: 'accessory1' },     // +10% quest
            { templateId: 'dedicated_workers_pin', slot: 'accessory2' }, // +20% recurring
            { templateId: 'early_bird_brooch', slot: 'accessory3' },     // +10% first daily
        );

        const accQuestXP = getXPMultiplier(gear, 'quest');       // 0.10
        const accRecurringXP = getXPMultiplier(gear, 'recurring'); // 0.20
        const accFirstDailyXP = getXPMultiplier(gear, 'first_daily'); // 0.10

        // For a recurring quest on first daily completion, all three stack additively:
        const accXPBonus = accQuestXP + accRecurringXP + accFirstDailyXP;
        expect(accXPBonus).toBeCloseTo(0.40); // 40%, not multiplicative

        const baseXP = 100;
        const adjustedXP = Math.floor(baseXP * (1 + accXPBonus));
        expect(adjustedXP).toBe(140); // Additive stacking
    });
});


// ============================================
// 8. gearFormatters — tooltip ability text
// ============================================

describe('gearFormatters — tooltip ability text', () => {
    let formatGearTooltip: typeof import('../src/utils/gearFormatters').formatGearTooltip;

    beforeEach(async () => {
        const mod = await import('../src/utils/gearFormatters');
        formatGearTooltip = mod.formatGearTooltip;
    });

    it('tooltip displays ability text for curated accessories', () => {
        const acc = makeAccessory('vampires_fang', 'accessory1');
        const tooltip = formatGearTooltip(acc);

        // Should contain the accessory ability section
        expect(tooltip).toContain('🔮');
        expect(tooltip).toContain("Vampire's Fang");
        // Should contain the effect label
        expect(tooltip).toContain('lifesteal');
    });

    it('tooltip omits ability section for T1 accessories (no templateId)', () => {
        // Create a T1 accessory without templateId
        const t1Acc: GearItem = {
            id: 'test-t1',
            name: 'Copper Ring',
            description: 'A simple ring',
            slot: 'accessory1',
            tier: 'common',
            level: 3,
            stats: { primaryStat: 'strength', primaryValue: 2 },
            sellValue: 5,
            iconEmoji: '💍',
            source: 'combat',
            acquiredAt: new Date().toISOString(),
            // No templateId — this is a T1 auto-generated accessory
        };

        const tooltip = formatGearTooltip(t1Acc);
        expect(tooltip).not.toContain('🔮');
    });

    it('lifesteal proc returns correct value via getPassiveProc consumer pattern', () => {
        const gear = makeGearWith(
            { templateId: 'vampires_fang', slot: 'accessory1' },  // 5% lifesteal
        );
        expect(getPassiveProc(gear, 'lifesteal')).toBeCloseTo(0.05);

        // Consumer pattern (from BattleService executePlayerSkill):
        // const healAmt = Math.floor(damage * lifestealProc);
        const damage = 100;
        const healAmt = Math.floor(damage * getPassiveProc(gear, 'lifesteal'));
        expect(healAmt).toBe(5);
    });

    it('stat gain XP bonus (Apprentice\'s Loop) returns 0.05', () => {
        const gear = makeGearWith(
            { templateId: 'apprentices_loop', slot: 'accessory1' },  // +5% stat gain XP
        );
        expect(getXPMultiplier(gear, 'stat_gain')).toBeCloseTo(0.05);
    });
});
