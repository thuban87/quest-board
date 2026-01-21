# Power-Ups System - Implementation Plan

> **Status:** Draft - Pending Review  
> **Priority:** P25 (after Streak Tracker)  
> **Estimated Effort:** Major feature (multiple sessions)

---

## Overview

A comprehensive power-up system with **triggers** (actions that fire) and **effects** (buffs applied). Triggers can be deterministic (always grant specific effect) or pooled (grant random effect from tier).

### Key Decisions

- **Instant application** (consumables deferred to later update)
- **Stacking allowed** (multiple effects can be active)
- **Status bar indicator** for active buffs
- **Hardcoded thresholds** (not user-configurable initially)
- **Debuffs** will use same system later

---

## Part 1: Triggers

### Speed & Momentum

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 1 | Hat Trick | 3 tasks within 1h | Task completion | Pool (T1) | - |
| 2 | Speedrunner | Quest 24h+ before due | Quest completion | Deterministic | Flow State |
| 3 | Inbox Zero | Clear In Progress column | Quest completion | Deterministic | Flow State |
| 4 | Blitz | 10 tasks in a day | Task completion | Pool (T2) | - |
| 5 | One-Shot | Quest: Available → Done | Quest completion | Deterministic | Momentum |
| 6 | First Blood | First task of day | Task completion | Deterministic | +5% XP |
| 7 | Combo Breaker | 5+ same category | Task completion | Pool (T1) | - |

### Consistency & Timing

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 8 | Early Riser | Task before 8 AM | Task completion | Pool (T1) | - |
| 9 | Night Owl | Task after 10 PM | Task completion | Pool (T1) | - |
| 10 | Weekend Warrior | Quest on Sat/Sun | Quest completion | Pool (T1) | - |
| 11a | Streak Keeper 3 | 3-day streak | Streak update | Deterministic | Streak Shield |
| 11b | Streak Keeper 7 | 7-day streak | Streak update | Deterministic | T1 buff |
| 11c | Streak Keeper 14 | 14-day streak | Streak update | Deterministic | T2 pool |
| 11d | Streak Keeper 30 | 30-day streak | Streak update | Deterministic | Limit Break |
| 12 | Weekly Crusher | Goal before Friday | Plugin interval | Deterministic | Flow State |
| 13 | Fresh Start | First quest on Monday | Quest completion | Pool (T1) | - |

### Category Mastery

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 14 | Gym Rat | 3 Health/Fitness tasks | Task completion | Deterministic | Adrenaline Rush |
| 15 | Deep Work | 3 Dev/Study tasks | Task completion | Deterministic | Genius Mode |
| 16 | Social Butterfly | 3 Social tasks | Task completion | Deterministic | Charisma Nova |
| 17 | Admin Slayer | 5 Chore/Admin in a day | Task completion | Deterministic | Flow State |
| 18 | Multitasker | 3+ categories in a day | Task completion | Pool (T1) | - |

### Difficulty & Milestones

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 19 | Boss Killer | Complete Epic quest | Quest completion | Pool (T2) | - |
| 20 | Level Up | New character level | XP award | Deterministic | Stat boost |
| 21 | Tier Up | New visual tier | XP award | Deterministic | Limit Break |
| 22 | Big Fish | Task >50 XP | Task completion | Pool (T1) | - |
| 23 | Perfectionist | 100% quest completion | Quest completion | Deterministic | Flash Insight |
| 24 | Quest Chain | 3 quests in a row | Quest completion | Pool (T2) | - |

### Recovery (Comeback)

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 25 | Phoenix | Task after >3 days inactive | Task completion | Deterministic | Catch-Up |
| 26 | Streak Breaker | First task after lost streak | Streak update | Deterministic | Catch-Up |
| 27 | Clutch | Quest on exact due date | Quest completion | Pool (T1) | - |

### RNG

| # | Name | Description | Detection Point | Type | Grants |
|---|------|-------------|-----------------|------|--------|
| 28 | Critical Success | 5% chance any task | Task completion | Pool (any tier) | - |

---

## Part 2: Power-Up Effects

### XP Multipliers

| # | Name | Effect | Duration | Tier |
|---|------|--------|----------|------|
| 1 | Flow State | 2x XP all tasks | 4 hours | T2 |
| 2 | Hyperfocus | +50% XP one category | 24h | T1 |
| 3 | Momentum | +10% per task today | Midnight | T1 |
| 4 | Catch-Up | 2x XP first 3 tasks | 3 uses | T1 |
| 5 | Wisdom of Elders | +100% Review/Planning XP | 24h | T1 |
| 6 | Lucky Star | Crit chance 10% (up from 5%) | 1h | T1 |

### Stat Boosts

| # | Name | Effect | Duration | Tier |
|---|------|--------|----------|------|
| 7 | Adrenaline Rush | +5 STR & DEX | 24h | T1 |
| 8 | Genius Mode | +5 INT & WIS | 24h | T1 |
| 9 | Iron Skin | +10 CON | 48h | T2 |
| 10 | Charisma Nova | +5 CHA | Until Sunday | T1 |
| 11 | Limit Break | All stats +3 above cap | 24h | T3 |

### Progression

| # | Name | Effect | Duration | Tier |
|---|------|--------|----------|------|
| 12 | Streak Shield | Prevent 1 streak reset | Until used | T2 |
| 13 | Streak Freeze | Pause streak decay | User-set | Utility |
| 14 | Stat Overflow | XP → 2 stats | 24h | T2 |
| 15 | Flash Insight | 2x stat XP next quest | 1 quest | T1 |

### Utility

| # | Name | Effect | Duration | Tier |
|---|------|--------|----------|------|
| 16 | Task Nuke | Complete for 0 XP, keep streak | 1 use | Rare |
| 17 | Reroll | Shuffle Available column | 1 use | Rare |
| 18 | Deadline Extension | +24h to overdue quest | 1 use | Utility |
| 19 | Double Dip | Trigger 2 power-ups | Passive | T3 |

---

## Pool Composition

**Tier 1** (common): Hyperfocus, Momentum, Wisdom of Elders, Lucky Star  
**Tier 2** (uncommon): Flow State, Iron Skin, Stat Overflow, Streak Shield  
**Tier 3** (rare): Limit Break, Double Dip  
**Utility** (special): Task Nuke, Reroll, Deadline Extension, Streak Freeze  

---

## Detection Points

| Location | Triggers |
|----------|----------|
| Task Completion | Hat Trick, Blitz, First Blood, Combo Breaker, Early Riser, Night Owl, Gym Rat, Deep Work, Social Butterfly, Admin Slayer, Multitasker, Big Fish, Phoenix, Critical Success |
| Quest Completion | Speedrunner, Inbox Zero, One-Shot, Weekend Warrior, Fresh Start, Boss Killer, Perfectionist, Quest Chain, Clutch |
| Streak Update | Streak Keeper (3/7/14/30), Streak Breaker |
| XP Award | Level Up, Tier Up |
| Plugin Interval | Weekly Crusher |

---

## Data Model

```typescript
interface ActivePowerUp {
  id: string;              // "flow_state"
  triggeredBy: string;     // "inbox_zero"
  startedAt: string;       // ISO timestamp
  expiresAt: string | null; // null = until consumed
  stacks?: number;         // For Momentum
  category?: string;       // For Hyperfocus
  usesRemaining?: number;  // For Catch-Up
}

// Add to Character interface
activePowerUps: ActivePowerUp[];
```

---

## Implementation Order

1. **Data model** - Add `activePowerUps` to Character
2. **PowerUpService** - Core trigger evaluation + effect application
3. **XP integration** - Modify XP calculations for multipliers
4. **Stat integration** - Apply temporary stat boosts
5. **UI: Character Sheet section** - Display active buffs
6. **UI: Status bar** - Persistent indicator
7. **Notifications** - Toast/celebration per trigger
8. **All triggers** - Implement detection logic
