# Power-Ups System

> [!tip] Last Updated: 2026-01-29 | All triggers wired ✅

---

## Triggers

### Speed & Momentum
- **First Blood** → First task of day → `First Blood` (+5% XP/1h)
- **Hat Trick** → 3 tasks in 1 hour → Random T1
- **Blitz** → 10 tasks in a day → Random T2
- **One-Shot** → Quest: Available → Done → `Momentum` (+10% XP)

### Timing
- **Early Riser** → Task before 8 AM → Random T1
- **Night Owl** → Task after 10 PM → Random T1
- **Weekend Warrior** → Quest on Sat/Sun → Random T1
- **Fresh Start** → First quest on Monday → Random T1

### Category Mastery
- **Gym Rat** → 3 Health/Fitness tasks → `Adrenaline Rush`
- **Deep Work** → 3 Dev/Study tasks → `Genius Mode`
- **Social Butterfly** → 3 Social tasks → Random T1
- **Admin Slayer** → 5 Admin/Chores tasks → `Flow State`
- **Combo Breaker** → 5+ same category → Random T1
- **Multitasker** → 3+ different categories → Random T1

### Streaks
- **Streak Keeper 3** → 3-day streak → `Streak Shield`
- **Streak Keeper 7** → 7-day streak → Random T1
- **Streak Keeper 14** → 14-day streak → Random T2
- **Streak Keeper 30** → 30-day streak → `Limit Break`

### Progression
- **Level Up** → Gain a level → `Level Up Boost` (+3 all stats/24h)
- **Tier Up** → Reach tier 10/20/30/40 → `Limit Break`

### Special
- **Phoenix** → First task after 3+ days inactive → `Catch-Up` (2x XP/3 uses)
- **Big Fish** → Task worth >50 XP → Random T1
- **Clutch** → Recurring quest on due date → Random T1
- **Speedrunner** → Recurring quest 24h+ early → `Flow State`
- **Inbox Zero** → Clear In Progress column → `Flow State`
- **Critical Success** → 5% random → Random T2

---

## Effects

### XP Multipliers
- 🩸 **First Blood** — +5% XP (1h, refresh)
- 🌊 **Flow State** — 2x XP (4h, refresh)
- 🚀 **Momentum** — +10% XP stacking (until midnight, stack)
- 🔥 **Catch-Up** — 2x XP (3 uses, extend)

### Stat Boosts
- ⬆️ **Level Up Boost** — +3 all stats (24h, refresh)
- 💪 **Adrenaline Rush** — +5 STR & DEX (24h, refresh)
- 🧠 **Genius Mode** — +5 INT & WIS (24h, refresh)
- 💥 **Limit Break** — +3 all stats above cap (24h, refresh)

### Utility
- 🛡️ **Streak Shield** — Prevents next streak reset (until used, ignore)
- ⭐ **Lucky Star** — +10% crit chance (1h, refresh)

---

## Tier Pools

> When a trigger grants "Random T1/T2/T3", it picks from:

- **T1**: First Blood, Momentum, Catch-Up, Lucky Star, Adrenaline Rush, Genius Mode
- **T2**: Flow State, Streak Shield, Level Up Boost
- **T3**: Limit Break

---

## Collision Policies

- **refresh** — Reset timer, stays at 1 stack
- **stack** — Add stacks (Momentum)
- **extend** — Add uses (Catch-Up)
- **ignore** — Do nothing if active (Streak Shield)

---

## Testing Checklist

### ⏰ Time-Based
- [ ] Early Riser (before 8 AM)
- [ ] Night Owl (after 10 PM)
- [ ] Weekend Warrior (Sat/Sun)
- [ ] Fresh Start (Monday)

### 🏷️ Category Mastery
- [ ] Gym Rat (3 Health/Fitness)
- [ ] Deep Work (3 Dev/Study)
- [ ] Social Butterfly (3 Social)
- [ ] Admin Slayer (5 Admin/Chores)
- [ ] Combo Breaker (5 same category)
- [ ] Multitasker (3+ categories)

### ⚡ Speed
- [ ] Hat Trick (3 in 1h)
- [ ] Blitz (10 in a day)
- [ ] Inbox Zero (clear In Progress)

### 🎯 Misc
- [ ] Phoenix (3+ days inactive)
- [ ] Big Fish (>50 XP task)
- [ ] Critical Success (5% random)
