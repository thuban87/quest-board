# Power-Ups System - Implementation Plan

> **Status:** In Progress (Foundation Complete)  
> **Priority:** P25  
> **Last Updated:** 2026-01-21

---

## Overview

A comprehensive power-up system with **triggers** (actions that fire) and **effects** (buffs applied). Triggers can be deterministic (always grant specific effect) or pooled (grant random effect from tier).

### Key Decisions

- **Instant application** (consumables deferred to later update)
- **Stacking allowed** (multiple effects can be active)
- **Status bar indicator** for active buffs (future)
- **Hardcoded thresholds** (not user-configurable initially)
- **Debuffs** will use same system later
- **Class perks as passive buffs** - Treated as `ActivePowerUp` with `expiresAt: null`

### Design Refinements

| Feature | Decision |
|---------|----------|
| **Collision Policy** | Each effect defines how to handle re-triggering: `refresh` (reset timer), `stack` (add stacks), `extend` (add duration), `ignore` |
| **Notification Type** | Minor buffs use `toast`, major events (Level Up, Tier Up) use `modal` |
| **Class Perks** | Injected as `ActivePowerUp` with `expiresAt: null` on character load - UI renders them identically |
| **Expiration Display** | Show relative time ("Expires in 2h 15m"), warning colors for < 1h |
| **usesRemaining** | Atomic: capture bonus → decrement → remove if 0 (prevents race conditions) |

---

## Part 1: Triggers

### Currently Implemented ✅

| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| First Blood | First task of day | Task completion | +5% XP (1h) |
| One-Shot | Quest: Available → Done | Quest completion | Momentum |
| Streak Keeper 3 | 3-day streak | Streak update | Streak Shield |
| Streak Keeper 7 | 7-day streak | Streak update | T1 pool |
| Level Up | New character level | XP award | Stat boost |
| Tier Up | New visual tier | XP award | Limit Break |

### Future Triggers (Not Yet Implemented)

#### Speed & Momentum
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Hat Trick | 3 tasks within 1h | Task completion | Pool (T1) |
| Speedrunner | Quest 24h+ before due | Quest completion | Flow State |
| Inbox Zero | Clear In Progress column | Quest completion | Flow State |
| Blitz | 10 tasks in a day | Task completion | Pool (T2) |
| Combo Breaker | 5+ same category | Task completion | Pool (T1) |

#### Consistency & Timing
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Early Riser | Task before 8 AM | Task completion | Pool (T1) |
| Night Owl | Task after 10 PM | Task completion | Pool (T1) |
| Weekend Warrior | Quest on Sat/Sun | Quest completion | Pool (T1) |
| Streak Keeper 14 | 14-day streak | Streak update | T2 pool |
| Streak Keeper 30 | 30-day streak | Streak update | Limit Break |
| Weekly Crusher | Goal before Friday | Quest completion (check date) | Flow State |
| Fresh Start | First quest on Monday | Quest completion | Pool (T1) |

#### Category Mastery
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Gym Rat | 3 Health/Fitness tasks | Task completion | Adrenaline Rush |
| Deep Work | 3 Dev/Study tasks | Task completion | Genius Mode |
| Social Butterfly | 3 Social tasks | Task completion | Charisma Nova |
| Admin Slayer | 5 Chore/Admin in a day | Task completion | Flow State |
| Multitasker | 3+ categories in a day | Task completion | Pool (T1) |

#### Difficulty & Milestones
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Boss Killer | Complete Epic quest | Quest completion | Pool (T2) |
| Big Fish | Task >50 XP | Task completion | Pool (T1) |
| Perfectionist | 100% quest completion | Quest completion | Flash Insight |
| Quest Chain | 3 quests in a row | Quest completion | Pool (T2) |

#### Recovery (Comeback)
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Phoenix | Task after >3 days inactive | Task completion | Catch-Up |
| Streak Breaker | First task after lost streak | Streak update | Catch-Up |
| Clutch | Quest on exact due date | Quest completion | Pool (T1) |

#### RNG
| Name | Description | Detection Point | Grants |
|------|-------------|-----------------|--------|
| Critical Success | 5% chance any task | Task completion | Pool (any tier) |

---

## Part 2: Power-Up Effects

### Currently Implemented ✅

| Name | Effect | Duration | Collision | Notification |
|------|--------|----------|-----------|--------------|
| First Blood | +5% XP | 1 hour | refresh | toast |
| Flow State | 2x XP | 4 hours | refresh | modal |
| Momentum | +10% XP (stacking) | Midnight | stack | toast |
| Catch-Up | 2x XP | 3 uses | extend | toast |
| Level Up Boost | +3 all stats | 24h | refresh | modal |
| Streak Shield | Prevents streak reset | Until used | stack | modal |
| Lucky Star | +10% crit chance | 1h | refresh | toast |
| Limit Break | +3 all stats above cap | 24h | refresh | modal |

### Future Effects (Not Yet Implemented)

#### XP Multipliers
| Name | Effect | Duration | Tier |
|------|--------|----------|------|
| Hyperfocus | +50% XP one category | 24h | T1 |
| Wisdom of Elders | +100% Review/Planning XP | 24h | T1 |

#### Stat Boosts
| Name | Effect | Duration | Tier |
|------|--------|----------|------|
| Adrenaline Rush | +5 STR & DEX | 24h | T1 |
| Genius Mode | +5 INT & WIS | 24h | T1 |
| Iron Skin | +10 CON | 48h | T2 |
| Charisma Nova | +5 CHA | Until Sunday | T1 |
| Stat Overflow | XP → 2 stats | 24h | T2 |
| Flash Insight | 2x stat XP next quest | 1 quest | T1 |

#### Utility
| Name | Effect | Duration | Tier |
|------|--------|----------|------|
| Task Nuke | Complete for 0 XP, keep streak | 1 use | Rare |
| Reroll | Shuffle Available column | 1 use | Rare |
| Deadline Extension | +24h to overdue quest | 1 use | Utility |
| Double Dip | Trigger 2 power-ups | Passive | T3 |
| Streak Freeze | Pause streak decay | User-set | Utility |

---

## Pool Composition

**Tier 1** (common): Hyperfocus, Momentum, Wisdom of Elders, Lucky Star  
**Tier 2** (uncommon): Flow State, Iron Skin, Stat Overflow, Streak Shield  
**Tier 3** (rare): Limit Break, Double Dip  
**Utility** (special): Task Nuke, Reroll, Deadline Extension, Streak Freeze  

---

## Detection Points

| Location | Code File | Triggers |
|----------|-----------|----------|
| Task Completion | `useXPAward.ts` | First Blood, Hat Trick, Blitz, Combo Breaker, Early Riser, Night Owl, etc. |
| Quest Completion | `QuestActionsService.ts` | Speedrunner, Inbox Zero, One-Shot, Weekend Warrior, etc. |
| Streak Update | `QuestActionsService.ts` | Streak Keeper (3/7/14/30), Streak Breaker |
| XP Award | `useXPAward.ts` | Level Up, Tier Up |

> **Note:** `plugin_interval` removed - time-based checks happen on view mount and before XP calculations instead.

---

## Data Model

```typescript
// Types in Character.ts
type PowerUpEffect =
    | { type: 'xp_multiplier'; value: number }
    | { type: 'xp_category_multiplier'; value: number; category: string }
    | { type: 'stat_boost'; stat: StatType; value: number }
    | { type: 'all_stats_boost'; value: number }
    | { type: 'crit_chance'; value: number }
    | { type: 'streak_shield' }
    | { type: 'class_perk'; description: string };

type PowerUpDuration =
    | { type: 'hours'; value: number }
    | { type: 'uses'; value: number }
    | { type: 'until_midnight' }
    | { type: 'until_used' }
    | { type: 'passive' };  // Never expires (class perks)

type CollisionPolicy = 'refresh' | 'stack' | 'extend' | 'ignore';

type PowerUpNotificationType = 'toast' | 'modal' | 'silent';

interface ActivePowerUp {
    id: string;              // "flow_state"
    name: string;            // "Flow State"
    icon: string;            // "🌊"
    description: string;     // "2x XP for all tasks"
    triggeredBy: string;     // "inbox_zero"
    startedAt: string;       // ISO timestamp
    expiresAt: string | null; // null = passive (class perks)
    effect: PowerUpEffect;
    stacks?: number;         // For Momentum
    usesRemaining?: number;  // For Catch-Up
}

// In Character interface
activePowerUps: ActivePowerUp[];
```

---

## Implementation Status

| Step | Description | Status |
|------|-------------|--------|
| 1 | Data model - Add types to Character.ts | ✅ Complete |
| 2 | PowerUpService - Core trigger evaluation + effect application | ✅ Complete |
| 3 | XP integration - Modify XP calculations for multipliers | 🔄 In Progress |
| 4 | Stat integration - Apply temporary stat boosts | ❌ Not started |
| 5 | UI: Character Sheet section - Display active buffs | ✅ Complete |
| 6 | UI: Status bar - Persistent indicator | ❌ Not started |
| 7 | Notifications - Toast/celebration per trigger | ✅ Partial (framework exists) |
| 8 | All triggers - Implement remaining detection logic | ❌ Future (proof of concept first) |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/models/Character.ts` | Power-up types and interfaces |
| `src/services/PowerUpService.ts` | Effect definitions, trigger definitions, grant/expire logic |
| `src/services/XPSystem.ts` | XP calculations (needs multiplier integration) |
| `src/hooks/useXPAward.ts` | Task completion and XP award triggers |
| `src/services/QuestActionsService.ts` | Streak triggers |
| `src/store/characterStore.ts` | `setPowerUps()` action |
| `src/components/CharacterSheet.tsx` | Buff display UI |
