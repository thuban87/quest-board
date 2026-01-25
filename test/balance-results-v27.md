# Combat Balance Results v27 (Realistic Gear)

Generated: 2026-01-25T16:04:57.261Z

## Tuning Parameters

- **Gear Level Bonus:** +3 levels above character
- **Gear Tier Bonus:** +1 tiers above expected
- **Base Attack Multiplier:** 4.0x (apply to monster baseAttack)
- **Attack Growth Multiplier:** 3.00x (apply to BASE_ATTACK_GROWTH)

## Recommended Code Changes

```typescript
// In monsters.ts - multiply all baseAttack values by 4.0
// Example: goblin.baseAttack = 56 (was 14)

// In MonsterService.ts - update BASE_ATTACK_GROWTH
const BASE_ATTACK_GROWTH = 24; // was 8
```

## Overworld (Easy Mode)

| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |
|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| warrior | 100% | 89% | 75% | 52% | 88% | 70% | 71% |
| paladin | 100% | 99% | 95% | 73% | 86% | 78% | 84% |
| technomancer | 100% | 95% | 52% | 55% | 32% | 48% | 24% |
| scholar | 100% | 64% | 47% | 49% | 33% | 57% | 31% |
| rogue | 100% | 97% | 67% | 77% | 51% | 52% | 45% |
| cleric | 100% | 71% | 54% | 86% | 74% | 68% | 58% |
| bard | 100% | 96% | 73% | 71% | 71% | 83% | 76% |

## Dungeon (Medium Mode)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 89% | 59% | 71% | 71% | 67% |
| paladin | 83% | 63% | 75% | 83% | 84% |
| technomancer | 23% | 30% | 35% | 27% | 21% |
| scholar | 31% | 39% | 45% | 36% | 34% |
| rogue | 49% | 58% | 56% | 43% | 39% |
| cleric | 77% | 38% | 58% | 58% | 51% |
| bard | 68% | 84% | 86% | 77% | 70% |

## Boss Encounters (Hard Mode)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 72% | 41% | 57% | 54% | 43% |
| paladin | 75% | 49% | 69% | 69% | 62% |
| technomancer | 28% | 28% | 29% | 26% | 21% |
| scholar | 19% | 19% | 31% | 30% | 31% |
| rogue | 31% | 41% | 46% | 36% | 32% |
| cleric | 61% | 27% | 39% | 38% | 40% |
| bard | 52% | 70% | 73% | 69% | 61% |

## Raid Boss (Brutal Mode)

> Tanks (Warrior, Cleric) receive a -15% damage penalty in raids

| Class | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|
| warrior | 28% | 25% | 15% |
| paladin | 60% | 67% | 61% |
| technomancer | 34% | 27% | 22% |
| scholar | 36% | 31% | 25% |
| rogue | 38% | 27% | 30% |
| cleric | 13% | 15% | 8% |
| bard | 68% | 57% | 54% |

---
*Generated from balance-tuner v27*
