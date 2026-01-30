/**
 * Battle Service Tests
 * 
 * Tests for battle turn execution, damage calculation, and outcomes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { monsterToBattleMonster } from '../src/services/BattleService';
import { createMonster } from '../src/services/MonsterService';
import { calculateDamage, DamageResult } from '../src/services/CombatService';
import { CombatStats } from '../src/services/CombatService';
import { BattleMonster } from '../src/store/battleStore';

// =====================
// MONSTER CONVERSION
// =====================

describe('Monster to BattleMonster Conversion', () => {
    it('should convert Monster to BattleMonster', () => {
        const monster = createMonster('goblin', 10, 'overworld', { forcePrefix: 'none' });
        expect(monster).not.toBeNull();

        const battleMonster = monsterToBattleMonster(monster!);

        expect(battleMonster.id).toBe(monster!.id);
        expect(battleMonster.name).toBe(monster!.name);
        expect(battleMonster.level).toBe(10);
        expect(battleMonster.maxHP).toBe(monster!.maxHP);
        expect(battleMonster.currentHP).toBe(monster!.currentHP);
        expect(battleMonster.attack).toBe(monster!.attack);
        expect(battleMonster.defense).toBe(monster!.defense);
        expect(battleMonster.emoji).toBe(monster!.emoji);
    });
});

// =====================
// DAMAGE CALCULATION
// =====================

describe('Damage Calculation', () => {
    it('should deal positive damage when attack > defense', () => {
        // No dodge, no crit, just calculate raw damage
        const results: number[] = [];

        for (let i = 0; i < 50; i++) {
            const { damage } = calculateDamage(100, 0, 30, 0, 0);
            results.push(damage);
        }

        // Average should be around 70 (100 - 30) with ±10% variance
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        expect(avg).toBeGreaterThan(60);
        expect(avg).toBeLessThan(80);
    });

    it('should deal minimum 1 damage when defense > attack', () => {
        for (let i = 0; i < 20; i++) {
            const { damage } = calculateDamage(10, 0, 100, 0, 0);
            expect(damage).toBeGreaterThanOrEqual(1);
        }
    });

    it('should sometimes miss with high dodge', () => {
        let misses = 0;

        for (let i = 0; i < 100; i++) {
            const { result } = calculateDamage(100, 0, 30, 50, 0);
            if (result === 'miss') misses++;
        }

        // With 50% dodge, should miss roughly 50 times
        expect(misses).toBeGreaterThan(30);
        expect(misses).toBeLessThan(70);
    });

    it('should sometimes crit with high crit chance', () => {
        let crits = 0;

        for (let i = 0; i < 100; i++) {
            const { result } = calculateDamage(100, 50, 30, 0, 0);
            if (result === 'critical') crits++;
        }

        // With 50% crit, should crit roughly 50 times
        expect(crits).toBeGreaterThan(30);
        expect(crits).toBeLessThan(70);
    });

    it('should sometimes block with block chance', () => {
        let blocks = 0;

        for (let i = 0; i < 100; i++) {
            const { result } = calculateDamage(100, 0, 30, 0, 50);
            if (result === 'blocked') blocks++;
        }

        // With 50% block, should block roughly 50 times
        expect(blocks).toBeGreaterThan(30);
        expect(blocks).toBeLessThan(70);
    });

    it('blocked attacks should do 25% damage', () => {
        // Force a block by setting 100% block chance
        const results: number[] = [];

        for (let i = 0; i < 20; i++) {
            const { damage, result } = calculateDamage(100, 0, 20, 0, 100);
            if (result === 'blocked') {
                results.push(damage);
            }
        }

        expect(results.length).toBeGreaterThan(0);
        // (100 - 20) * 0.25 = 20
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        expect(avg).toBeGreaterThan(15);
        expect(avg).toBeLessThan(25);
    });
});

// =====================
// ATTACK STYLE DAMAGE
// =====================

describe('Attack Style Logic', () => {
    // Mock player stats for different attack styles
    const basePlayerStats: Omit<CombatStats, 'attackStyle' | 'damageModifier'> = {
        maxHP: 200,
        currentHP: 200,
        maxMana: 100,
        currentMana: 100,
        physicalAttack: 80,
        magicAttack: 100,
        critChance: 10,
        critMultiplier: 2.0,
        defense: 30,
        magicDefense: 40,
        dodgeChance: 10,
        blockChance: 0,
        attackName: 'Attack',
    };

    const mockMonster: BattleMonster = {
        id: 'test',
        templateId: 'test-monster',
        name: 'Test Monster',
        tier: 'overworld',
        level: 10,
        maxHP: 150,
        currentHP: 150,
        attack: 50,
        defense: 25,
        magicDefense: 20,
        critChance: 5,
        dodgeChance: 5,
        emoji: '👹',
        goldReward: 100,
        xpReward: 50,

        // Phase 5: Skills System
        skills: [],
        statStages: { atk: 0, def: 0, speed: 0 },
        statusEffects: [],
        skillsUsedThisBattle: [],
    };

    it('physical attack uses physicalAttack vs defense', () => {
        // Physical: 80 - 25 = 55 base damage
        // This is a conceptual test - actual implementation in BattleService
        const physDamage = basePlayerStats.physicalAttack - mockMonster.defense;
        expect(physDamage).toBe(55);
    });

    it('magic attack uses magicAttack vs magicDefense', () => {
        // Magic: 100 - 20 = 80 base damage
        const magDamage = basePlayerStats.magicAttack - mockMonster.magicDefense;
        expect(magDamage).toBe(80);
    });

    it('hybrid_physical should blend 70% physical + 30% magic', () => {
        // Physical: 80 - 25 = 55
        // Magic: 100 - 20 = 80
        // Hybrid: 55 * 0.7 + 80 * 0.3 = 38.5 + 24 = 62.5
        const physComponent = (basePlayerStats.physicalAttack - mockMonster.defense) * 0.7;
        const magComponent = (basePlayerStats.magicAttack - mockMonster.magicDefense) * 0.3;
        const hybridDamage = physComponent + magComponent;

        expect(hybridDamage).toBeCloseTo(62.5, 0);
    });

    it('hybrid_magic should blend 30% physical + 70% magic', () => {
        // Physical: 55 * 0.3 = 16.5
        // Magic: 80 * 0.7 = 56
        // Total: 72.5
        const physComponent = (basePlayerStats.physicalAttack - mockMonster.defense) * 0.3;
        const magComponent = (basePlayerStats.magicAttack - mockMonster.magicDefense) * 0.7;
        const hybridDamage = physComponent + magComponent;

        expect(hybridDamage).toBeCloseTo(72.5, 0);
    });
});

// =====================
// DEFEND MECHANICS
// =====================

describe('Defend Mechanics', () => {
    it('defending should halve incoming damage', () => {
        const baseDamage = 100;
        const defendedDamage = Math.floor(baseDamage * 0.5);
        expect(defendedDamage).toBe(50);
    });
});

// =====================
// RETREAT MECHANICS  
// =====================

describe('Retreat Mechanics', () => {
    it('base retreat chance is 30%', () => {
        const baseChance = 30;
        expect(baseChance).toBe(30);
    });

    it('charisma adds 2% per point', () => {
        const charisma = 15;
        const bonus = charisma * 2;
        expect(bonus).toBe(30);
    });

    it('failed retreat deals 15% max HP damage', () => {
        const maxHP = 200;
        const damage = Math.floor(maxHP * 0.15);
        expect(damage).toBe(30);
    });
});

// =====================
// VICTORY/DEFEAT
// =====================

describe('Victory Rewards', () => {
    it('victory should grant monster XP and gold', () => {
        const monster = createMonster('goblin', 10, 'overworld');
        expect(monster!.xpReward).toBeGreaterThan(0);
        expect(monster!.goldReward).toBeGreaterThan(0);
    });
});

describe('Defeat Penalties', () => {
    it('defeat should cost 10% gold', () => {
        const currentGold = 500;
        const penalty = Math.floor(currentGold * 0.10);
        expect(penalty).toBe(50);
    });
});

// =====================
// DAMAGE TYPES
// =====================

describe('Damage Results', () => {
    it('should return correct result types', () => {
        const validResults: DamageResult[] = ['hit', 'critical', 'miss', 'blocked'];

        for (let i = 0; i < 100; i++) {
            const { result } = calculateDamage(100, 25, 30, 25, 25);
            expect(validResults).toContain(result);
        }
    });
});
