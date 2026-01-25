# Combat Balance v30 - CAPPED PERCENTAGE FORMULA

Generated: 2026-01-25T16:42:08.937Z

## Changes

1. **Damage formula:** `damage = attack * (1 - min(0.75, defense / (100 + defense)))`
2. **Monster buff:** HP x1.5, ATK x1.5

### Defense Reduction Scale

| Defense | Reduction |
|---------|----------|
| 50 | 33% |
| 100 | 50% |
| 200 | 67% |
| 300+ | 75% (cap) |

## Overworld (Target: 60-80%)

| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |
|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| warrior | 66% | 64% | 94% | 100% | 100% | 99% | 99% |
| paladin | 40% | 87% | 97% | 87% | 100% | 89% | 80% |
| technomancer | 41% | 73% | 68% | 86% | 84% | 88% | 53% |
| scholar | 63% | 29% | 62% | 83% | 87% | 95% | 80% |
| rogue | 54% | 85% | 84% | 96% | 96% | 91% | 61% |
| cleric | 56% | 52% | 84% | 100% | 100% | 100% | 96% |
| bard | 27% | 83% | 61% | 87% | 91% | 97% | 64% |

## Dungeon (Target: 50-70%)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 100% | 97% | 98% | 96% | 92% |
| paladin | 99% | 74% | 76% | 62% | 59% |
| technomancer | 69% | 89% | 75% | 48% | 36% |
| scholar | 64% | 88% | 86% | 77% | 66% |
| rogue | 93% | 92% | 79% | 56% | 46% |
| cleric | 100% | 97% | 95% | 93% | 87% |
| bard | 73% | 96% | 87% | 54% | 48% |

## Boss (Target: 40-60%)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 97% | 70% | 74% | 64% | 65% |
| paladin | 84% | 31% | 28% | 18% | 20% |
| technomancer | 28% | 54% | 30% | 6% | 7% |
| scholar | 27% | 46% | 43% | 30% | 26% |
| rogue | 62% | 58% | 36% | 14% | 15% |
| cleric | 93% | 73% | 61% | 51% | 51% |
| bard | 28% | 57% | 38% | 14% | 12% |

## Raid Boss (Target: 30-50%)

| Class | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|
| warrior | 11% | 7% | 12% |
| paladin | 6% | 3% | 5% |
| technomancer | 4% | 1% | 1% |
| scholar | 8% | 6% | 4% |
| rogue | 13% | 4% | 3% |
| cleric | 5% | 5% | 6% |
| bard | 8% | 0% | 0% |

---
*v30 - Capped percentage defense + monster buff*
