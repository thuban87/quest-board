# Combat Balance v29 - PERCENTAGE DEFENSE FORMULA

Generated: 2026-01-25T16:30:05.685Z

## Formula Change

**Before:** `damage = attack - defense` (flat subtraction)

**After:** `damage = attack * (100 / (100 + defense))` (percentage reduction)

### How Percentage Defense Works

| Defense | Damage Reduction |
|---------|------------------|
| 0 | 0% (full damage) |
| 50 | 33% |
| 100 | 50% |
| 200 | 67% |
| 300 | 75% |

## Overworld (Target: 60-80%)

| Class | L1 | L5 | L10 | L15 | L20 | L30 | L40 |
|-------|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| warrior | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| paladin | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| technomancer | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| scholar | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| rogue | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| cleric | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| bard | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

## Dungeon (Target: 50-70%)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 100% | 100% | 100% | 100% | 100% |
| paladin | 100% | 100% | 100% | 100% | 100% |
| technomancer | 100% | 100% | 100% | 100% | 100% |
| scholar | 100% | 100% | 100% | 100% | 100% |
| rogue | 100% | 100% | 100% | 100% | 100% |
| cleric | 100% | 100% | 100% | 100% | 100% |
| bard | 100% | 100% | 100% | 100% | 100% |

## Boss (Target: 40-60%)

| Class | L20 | L25 | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|:---:|:---:|
| warrior | 100% | 100% | 100% | 100% | 100% |
| paladin | 100% | 100% | 100% | 100% | 100% |
| technomancer | 100% | 100% | 100% | 100% | 100% |
| scholar | 100% | 100% | 100% | 100% | 100% |
| rogue | 100% | 100% | 100% | 100% | 100% |
| cleric | 100% | 100% | 100% | 100% | 100% |
| bard | 100% | 100% | 100% | 100% | 100% |

## Raid Boss (Target: 30-50%)

| Class | L30 | L35 | L40 |
|-------|:---:|:---:|:---:|
| warrior | 100% | 100% | 100% |
| paladin | 100% | 100% | 100% |
| technomancer | 100% | 100% | 100% |
| scholar | 100% | 100% | 100% |
| rogue | 100% | 100% | 100% |
| cleric | 100% | 100% | 100% |
| bard | 100% | 100% | 100% |

---
*Percentage defense formula test*
