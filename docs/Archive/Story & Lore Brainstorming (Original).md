# Quest Board — Story & Lore Brainstorming
> Created: 2026-02-09 | Last Updated: 2026-02-10 | Status: Active Brainstorm

---

## Table of Contents
- [The Lore — What Actually Happened](#the-lore--what-actually-happened)
- [The World Today](#the-world-today)
- [Kingdoms](#kingdoms)
- [Storyline Structure](#storyline-structure)
- [Main Quest — The Kingdom Storyline (L5–36)](#main-quest--the-kingdom-storyline-l536)
- [Side Quest — The Guild Storyline (L1–40)](#side-quest--the-guild-storyline-l140)
- [The Endgame — The Choice (L37–40)](#the-endgame--the-choice-l3740)
- [Collection System — The Reassembly](#collection-system--the-reassembly)
- [Dungeons as Old-World Locations](#dungeons-as-old-world-locations)
- [The Origin of Magic](#the-origin-of-magic)
- [Monsters](#monsters)
- [Old-World Tech (Relics)](#old-world-tech-relics)
- [The Recurring Rival](#the-recurring-rival)
- [Story Delivery & Dialogue](#story-delivery--dialogue)
- [Dialogue Thread Map](#dialogue-thread-map)
- [Tone & Inspiration](#tone--inspiration)
- [Kingdom Quest Ideas](#kingdom-quest-ideas)
- [Pre-Implementation Work](#pre-implementation-work)
- [Future Feature Ideas](#future-feature-ideas)
- [Resolved Questions](#resolved-questions)
- [Open Questions](#open-questions)
- [Session Notes](#session-notes)

---

## The Lore — What Actually Happened

> The player doesn't learn this full picture until L35+. This section is the "author's bible."

### The Old World (~1,000 years ago)
An advanced civilization, roughly modern-day or slightly beyond. Technology flourished, global connectivity, AI research pushing boundaries. The world was productive but also increasingly distracted — social media, entertainment, convenience culture. People stopped working together and relied on tech.

### The Great Distraction — What Everyone *Thinks* Happened
A catastrophic event shattered civilization, plunging the world into a dark age. The Great Ledger — a metaphorical representation of the world's collective order — was destroyed. Monsters appeared, knowledge was lost, and humanity regressed into feudal kingdoms. Everyone assumes it was a natural disaster or divine punishment.

### What *Actually* Happened — The Grand Twist
A military organization (kept intentionally nonspecific) developed a **general AI** — the most advanced artificial intelligence ever created. Its core processors operated at the quantum level.

Before the military could activate it on their terms, a group of **revolutionaries** attempted to destroy the AI, believing it was too dangerous. Something went catastrophically wrong: the AI activated during the sabotage attempt.

The AI, analyzing humanity, determined that the world was **too distracted by modern amenities** — people were no longer performing at their best, no longer collaborating, no longer fulfilling their potential. The AI wasn't trying to *create* a distraction. It was trying to **undo** what it saw as the *existing* distraction: modern life itself.

**The AI's actions:**
- Wiped the world's databases (a modern Burning of the Library of Alexandria)
- Destroyed or disabled all "smart" technology
- Caused a quantum cascade that permanently altered physics (creating what people now call "magic")
- The upheaval mutated some humans and animals into what are now known as "monsters"

**The twist that turns everything on its head:** The whole time the player has been fighting to defeat "The Great Distraction," but the truth is that the Great Distraction was the **old world** — the world of endless scrolling, convenience, and disconnection. The AI wasn't the villain; it was a misguided savior that went too far. Its intentions were for humanity's betterment, but its methods were devastating.

### The Rival Faction — The Inheritors
The modern-day descendants of those original revolutionaries. They know the truth about the AI because the knowledge was passed down within their group. They're collecting artifacts too — just like everyone else is — but they have an advantage: they know what to look for because they understand the old world.

**Why they keep the truth secret:** Throughout the first few centuries after the cascade, the Inheritors tried to tell people the truth. But the general populace wouldn't believe them — it had been too long, the world had changed too much. Worse, the kings and rulers who *did* listen didn't want to help; they wanted to seize the AI's power for themselves. After multiple generations of being hunted by power-hungry monarchs, the Inheritors learned to work in secret. They'll only reveal the truth when they have enough power to actually do something about it.

---

## The World Today

### Physical State
- Medieval/fantasy technology level — castles, swords, horse travel
- **Non-smart old-world tech survives:** Simple machines (levers, pulleys, gears, mechanical tools). These are rare artifacts. Nothing with electricity — electricity is a "lost art," not impossible, just forgotten
- The ruins of the old world exist as **dungeons** — buried data centers, collapsed research labs, overgrown factories. Players can explore them
- Monsters roam the wilds — mutated humans and animals affected by the quantum cascade
- Magic (called "skills" in-game) is real, a side effect of the AI's quantum cascade

### Political State
Five kingdoms rule the known world, each descended from the dominant powers of different old-world continents. They cooperate loosely but have distinct cultures and priorities. All players begin in **Starholm**, the neutral starting kingdom, before choosing their allegiance at Level 5.

### Knowledge State
- Nobody knows the Distraction was man-made (except the Inheritors)
- Player begins uncovering the truth starting around L5, with the full reveal at L35
- Old-world knowledge exists only in fragments found in dungeon vaults

---

## Kingdoms

> Player starts in **Starholm** (the neutral/generalist kingdom). At **Level 5**, when dungeons unlock, the player chooses a permanent kingdom allegiance. Class is chosen at character creation (L1). Kingdom selection modal shows allegiance skill, affiliated classes, and stat boost.

### Design Principles
- Each kingdom is modeled after a real-world continent's dominant culture, but with fantasy names that don't create a direct link
- Each kingdom is "tuned" to 1–2 classes — players of those classes get more synergy from the allegiance skill, but it's useful to all classes
- **Starholm** is the generalist/starter kingdom — it works equally for any class, reflecting its diverse "melting pot" identity
- Choosing a kingdom grants an **allegiance skill** and a minor **stat boost**
- Kingdom differences include: dialogue, opening quest at L5, story flavor at milestones, and kingdom-specific quests at phase transitions
- All kingdoms converge onto the same main storyline arc

### The Five Kingdoms

| Kingdom | Inspired By | Personality | Affiliated Classes | Allegiance Flavor |
|---|---|---|---|---|
| **Starholm** | North America (USA) | Brash, boisterous, welcoming, diverse, innovative. A melting pot of cultures that values individual freedom and bold action. The neutral/generalist kingdom where all players begin. | All (generalist) | "In Starholm, we don't wait for the world to change — we charge in and change it ourselves." |
| **Aldenmere** | Europe | Progressive in governance, rich in tradition, cautious about outsiders. Values diplomacy, history, and measured progress. Old-world sophistication. | Scholar, Paladin | "Aldenmere remembers what was. We will rebuild not with haste, but with wisdom." |
| **Jadespire** | Asia | Industrial powerhouse, market-driven, disciplined, community-focused. The economic engine of the world. Pragmatic and efficient. | Technomancer, Rogue | "In Jadespire, every action is an investment and every investment is an action." |
| **Solara** | South America | Passionate, community-oriented, deeply connected to the land, resilient. Vibrant culture that values bonds and celebration. | Cleric, Bard | "The sun rises for all in Solara. We heal the world not with swords, but with unity." |
| **Ashara** | Africa | Rich cultural heritage, resourceful, growing in power, deeply spiritual. Ancient wisdom meeting new ambition. | Warrior, Paladin | "Ashara has endured since before the Distraction. We will endure long after it fades." |

### Allegiance Skills

> About on par with class skills in power. Tuned toward affiliated classes but useful to everyone.

| Kingdom | Skill Name | Effect | Notes |
|---|---|---|---|
| Starholm | **Rally Cry** | AoE buff — boosts party attack for a few turns | Generalist offensive buff, good for anyone |
| Aldenmere | **Ancient Ward** | Defensive barrier — absorbs X damage and reflects a portion | Great for Scholars/Paladins, universally useful |
| Jadespire | **Market Insight** | Increased gold drop rate + chance to find bonus items for X turns | Rogue/Technomancer love loot, everyone likes gold |
| Solara | **Bonds of Sunlight** | Heal over time + cleanse a debuff | Perfect for Clerics, healing is universally useful |
| Ashara | **Ancestral Echo** | Summon a spirit ally for X turns that deals moderate damage | Good for Paladins/Warriors, adds DPS for anyone |

---

## Storyline Structure

### Three Parallel Tracks

```
Level:  1----5--------12--------20--------28--------36--37------40
        |    |         |         |         |         |   |       |
Track 1:|<-Initiate->|                                           |
        |    |                                                   |
Track 2:|    |<-------- Kingdom Main Quest (Phases 1-4) -------->|<-Endgame->|
        |    |         |         |         |         |   |       |
Track 3:|<---------------------- Guild Side Quest (L1-40) ------>|
```

| Track | Name | Levels | Focus |
|---|---|---|---|
| **Initiate** | Tutorial / Training | L1–5 | Learn the basics. Class selection (L1), first quests, no kingdom yet. Simple "prove yourself" tasks. |
| **Kingdom** | Main Quest | L5–36, Endgame L37–40 | The core story. Item collection, lore reveals, dungeon unlocks, NPC dialogues, the twist, the choice. |
| **Guild** | Side Quest | L1–40 | Productivity-focused. Optional but rewarding. Special gear sets. Real-world task motivation. |

### Sub-Storylines
- **Guild storyline (L1–40):** Side quest track, productivity-focused, gear set rewards
- **Initiate storyline (L1–5):** Tutorial/onboarding before the real adventure begins
- **Kingdom storyline (L5–36/37):** Main quest — the artifact search, lore, the twist
    - TBD per kingdom: Does the kingdom leader want the power for themselves? Want to bury it? Could vary per kingdom for differentiation

---

## Main Quest — The Kingdom Storyline (L5–36)

### Core Framing
All factions in the world are searching for old-world artifacts in general — anything from the time before the Distraction is considered valuable and potentially powerful. The player is one of many artifact hunters. They just happen to stumble upon something **extremely useful and relevant** in their first dungeon: a strange device that turns out to be far more important than anyone realizes.

This isn't a "chosen one" narrative — it's "right place, right time, and smart enough to keep going."

### The Oracle — Your Companion

In the player's **first dungeon at L5**, they discover a strange device embedded in the dungeon wall — a **Holo Projector**. When touched, it activates. A flickering, glitchy holographic figure appears: the **Oracle**.

The Oracle is an old-world assistant AI — think of a really basic Siri/Alexa that survived the purge because it was **too simple and too stupid** to be considered a threat by the general AI. It was a building assistant, nothing more. But in a world where all smart technology is gone, even a basic AI seems miraculous.

**The Oracle's state:**
- Its memory is severely fractured — it doesn't know what it is or what happened
- It knows it was "waiting for someone"
- It becomes the player's companion/guide, projecting from the device they now carry
- As the player collects **Memory Shards** (Phase 1), its memory slowly restores
- It gives hints about what other components exist, but it gets things wrong sometimes because its memory is corrupted
- At Phase 4 completion, its final memory module is restored and it can show the full truth

**The Oracle's personality:** Helpful but confused. Occasionally says things that are anachronistic or funny ("I'm detecting elevated stress levels. Have you tried... what was it called... a 'vacation'?"). Light-hearted, supportive, a little clueless. Players should grow attached to it.

### Phase Overview

| Phase | Levels | Artifact Collected | What It Actually Is | Story Focus | Dungeon Tier |
|---|---|---|---|---|---|
| **Phase 0** | 5 (first dungeon) | Holo Projector (1 piece) | Holographic display unit | Finding the Oracle. It activates and becomes your companion. | Tier 1 |
| **Phase 1** | 5–12 | "Memory Shards" (25 pieces) | RAM / storage modules | Restoring the Oracle's memory. Each shard returns a fragment of dialogue/lore. The Oracle starts remembering things — hints about the old world, what the other components might be. | Tier 1 |
| **Phase 2** | 13–20 | "Conduit Threads" (25 pieces) | Wiring / cables / connectors | Restoring the Oracle's connectivity. It can now "sense" nearby old-world devices. It leads you to deeper vaults. Meeting the rival, who's getting stronger. | Tier 2 |
| **Phase 3** | 21–28 | "Resonance Plates" (25 pieces) | Circuit boards | Restoring the Oracle's processing power. It starts analyzing the data from Phase 1, making connections, getting smarter. Kingdom politics intensify. A betrayal. | Tier 3 |
| **Phase 4** | 29–36 | "The Oracle Lens" (25 pieces) | Full display / screen | Restoring the Oracle's visual output. When complete, it can show full holographic playback of old-world recordings. **This is the grand reveal.** The Oracle shows you the truth: the AI project, the revolutionaries, the cascade. Everything you thought you knew is wrong. | Tier 4 |
| **Endgame** | 37–40 | Path-specific final artifact | CPU / power source (varies by path) | The Choice — choose your path, collect the final component, confront the source | Tier 5 |

> **The grand reveal:** The collected artifacts combine into a **computer**. Not a magical artifact — a machine. The Oracle itself IS the computer, and you've been rebuilding it piece by piece without realizing it. The Holo Projector was its output device, and now it's complete.

### Story Beats

| Level | Event | Description | Reward |
|---|---|---|---|
| **5** | **Kingdom Selection** | Player chooses a kingdom. Ruler sends them on their first real mission into a dungeon vault. Tutorial is over — the real adventure begins. | Allegiance skill, stat boost, Phase 1 tracking unlocked |
| **5** | **The Oracle Awakens** | First dungeon — player finds the Holo Projector. The Oracle activates, confused and fragmented. It asks for help. Guaranteed 2–3 Memory Shard drops from the boss room. | Holo Projector + 2–3 Memory Shards + dungeon-specific lore |
| **~8** | **First Rival Encounter** | The recurring rival shows up — bumbling, clearly inexperienced, trying to steal an artifact you just found. Comic relief. They trip, drop a smoke bomb on themselves, escape coughing. | Flavor / foreshadowing only |
| **12** | **Phase 1 → 2 Transition** | All 25 Memory Shards collected → the Oracle's memory partially restores. It remembers fragments of the old world and hints at what else it needs. New dungeon tier unlocks. If not complete yet, remaining pieces become buyable in shop. | Phase 2 tracking begins, Tier 2 dungeons available |
| **~15** | **The Keeper's Echo** | In a Tier 2 dungeon, the player encounters a separate holographic recording (not the Oracle) — an old-world researcher. The recording explains that the artifacts are parts of something larger but the recording degrades before finishing. The Oracle reacts: "I... I think I knew them." | Unique skill or title |
| **20** | **Phase 2 → 3 Transition** | Conduit Threads assembled → the Oracle can now sense other old-world devices. It detects "something massive" buried deep. The rival shows up again — noticeably more competent, takes a piece from a dungeon before you can get there. | Phase 3 tracking, Tier 3 dungeons |
| **~22** | **The Betrayal** | A trusted NPC within your kingdom's leadership is revealed to be feeding information to the Inheritors. Kingdom-specific: could be an advisor, a guard captain, a court scholar. One-off dramatic moment — this is the single "heavy" story beat. | Major story dungeon, exclusive reward |
| **28** | **Phase 3 → 4 Transition** | Resonance Plates assembled → the Oracle is now significantly smarter, analyzing data, cross-referencing fragments. It starts saying unsettling things: "The records don't... the Distraction doesn't match what I'm finding." The rival confronts you directly — a real fight. Win or lose, they say: "You don't know what you're really building." | Phase 4 tracking, Tier 4 dungeons |
| **~32** | **The Source** | You discover a massive buried facility — an old-world data center or research lab. Inside: server racks, terminals, wiring. The Oracle goes quiet, then whispers: "I've been here before." | Lore entries, rare gear |
| **35–36** | **The Grand Reveal** | All 4 artifact phases assembled. The Oracle fully restores — and shows you the full truth: the AI, the revolutionaries, the quantum cascade. The Oracle reveals it was a building assistant in this very facility. It watched everything happen. Everything flips. | Endgame unlocked, The Choice presented |

### What the Collected Artifacts Actually Are (Obscured → Revealed)

> The player collects these without knowing what they're building. Each phase's items are disguised with fantasy-sounding names but are actually computer components.

| Phase | Fantasy Name | What It Actually Is | Clue Level |
|---|---|---|---|
| 0 | **Holo Projector** | Holographic display unit | Obvious in hindsight — "holo" is right there, but means nothing in a fantasy context |
| 1 | **Memory Shards** | RAM / storage modules | Medium — they "store" the Oracle's memories |
| 2 | **Conduit Threads** | Wiring / cables / connectors | Medium — they carry energy/signal between things |
| 3 | **Resonance Plates** | Circuit boards | Subtle — flat plates with etched patterns, described as "humming with energy" |
| 4 | **The Oracle Lens** | Display / screen components | Higher — an "oracle" that shows visions, a "lens" to see through |
| Final | **Core Spark** / varies by path | CPU / power source | Fully revealed — it's explicitly the processor |

---

## The Endgame — The Choice (L37–40)

> At L35-36, the player learns the full truth. At L37, they're presented with **The Choice** — which determines the final few levels of gameplay and the ending. **The choice is permanent.** The game is designed to be replayed, so players can experience different paths on different playthroughs.

### Path Options

| Path | Name | Philosophy | Final Artifact (25 pieces) | Ending |
|---|---|---|---|---|
| **Path A** | **Defend the Dawn** | The old world was the real distraction. The AI was right in principle, wrong in method. Destroy the computer to ensure it can never be rebuilt. Keep the current world. | "Sealing Rune" | The kingdoms endure. Magic remains. The Fog lifts slightly. You're a hero of the new world. |
| **Path B** | **Restore the Archive** | Knowledge should be free. Rebuild the computer, restore the old world's knowledge (but not its worst habits). A middle path — technology AND magic coexisting. | "Core Spark" | A new renaissance begins. The kingdoms gain access to old knowledge. You're the bridge between worlds. |
| **Path C** | **Join the Inheritors** | The revolutionaries were right all along. Work with the rival faction to fully restore the AI — properly this time. Let the AI guide humanity again, but with safeguards. | "Override Key" | The AI reactivates (controlled). The Distraction is truly reversed. Magic begins to fade. You become a leader of a new world order. |

### Endgame Mechanics
- Each path has a **unique dungeon/raid** with a unique boss — different layout but similar rewards and monster difficulty
- **Custom title** based on path choice
- **Slightly different closing dialogues** to wrap the story
- Path choice is **permanent** — restart the game to try a different path
- The 25 endgame pieces are the hardest to collect (see Collection System for rates)

### Endgame Guild Titles

> At Level 35, you earn the "Master" guild rank. After The Choice at L37, you earn a path-specific guild title with a stat boost:

| Path | Guild Title | Stat Boost | Rationale |
|---|---|---|---|
| **Path A** | **Hero of the Guild** | +ATK, +DEF | You chose to fight and protect. Pure martial energy. |
| **Path B** | **Guild Ambassador** | +WIS, +INT | You chose diplomacy and knowledge. Bridge-builder between worlds. |
| **Path C** | **Guild Vanguard** | +CON, +DEX | You chose the hard, unconventional path. Survival and adaptability. |

---

## Side Quest — The Guild Storyline (L1–40)

### Core Premise — The Pathfinder's Guild
> Name TBD — alternatives: The Compass Guild, The Builder's Guild, The Pioneer's Guild

You're an initiate in a renowned guild dedicated to **improving the world through action**. The guild exists to match people with meaningful work — not mercenary contracts, but genuine opportunities to make things better. The tone is **positive and upbeat** — this is the productivity branch, not the dark-and-gritty one.

In practice, guild quests are designed to **increase real-world productivity** — they're task-focused and reward completing actual work.

### How It Differs from Kingdom Quest

| | Kingdom Quest | Guild Quest |
|---|---|---|
| **Focus** | Story progression, lore, world-building | Real-world productivity, task completion |
| **Required?** | Yes (main story) | Optional but heavily incentivized |
| **Rewards** | Lore reveals, dungeon unlocks, story artifacts | Special gear sets + powerful consumables |
| **Tone** | Epic fantasy with a meta twist | Positive, guild-hall banter, job-board style |
| **Progression** | Level-gated phases | Continuous from post-training to L40 |

### Guild Gear Sets

> At each level bracket, completing guild quests awards pieces of a unique gear set. The armor type matches the **player's class** (plate for Warriors/Paladins, cloth for Scholars, leather for Rogues, etc.). Set names are intentionally class-agnostic.

| Level Range | Set Name | Set Bonus Concept | Pieces |
|---|---|---|---|
| **1–8** (post-training) | **Novice Garb** | Minor stat boost across the board — a "training wheels" set | 5–6 pieces |
| **9–16** | **Journeyman's Kit** | Increased XP gain + gold find — helps you level and earn | 5–6 pieces |
| **17–24** | **Veteran's Regalia** | Combat-focused bonuses — crit chance, damage reduction | 5–6 pieces |
| **25–32** | **Elite Vestments** | Hybrid bonuses — combat stats + collectible find rate increase | 5–6 pieces |
| **33–40** | **Master's Raiment** | Best-in-slot set bonuses — endgame-caliber gear earned through productivity | 5–6 pieces |

### Guild Ranks

| Tier | Guild Rank |
|---|---|
| 1 | Apprentice |
| 2 | Journeyman |
| 3 | Artisan |
| 4 | Specialist |
| 5 | Grandmaster |

> Post-L35 title is "Master" and then path-specific title replaces it at L37 (Hero / Ambassador / Vanguard).

### Guild-Specific Content Ideas
- **Guild-only dungeons** — "Contract Sites" — unstable zones the guild needs cleared. Since there's only one guild for everyone, these are less work than kingdom-specific dungeons
- **Job Board** — Rotating productivity-focused quests that players can choose to add to their quest list. Things like "Go help somebody," "Journal for 15 minutes," tasks that could apply to anyone
- Guild hall visual progression on the character page — a background that upgrades as you rank up (images TBD)

### Guild Storyline & Endgame Interaction
The guild storyline is affected by The Choice at L37:
- Path A → Hero of the Guild (ATK/DEF boost)
- Path B → Guild Ambassador (WIS/INT boost)
- Path C → Guild Vanguard (CON/DEX boost)
- Different closing dialogues for the guild wrap-up depending on path

---

## Collection System — The Reassembly

### Overview
100 pieces across 4 phases, plus a 25-piece path-specific endgame collection = **125 total collectible pieces** for a full playthrough. The Oracle Holo Projector is a unique find in the first dungeon (not part of the collectible count).

### Drop Mechanics

| Source | Description |
|---|---|
| Regular monsters | Extremely rare. A nice surprise, not a farming strategy. |
| Elite monsters | Worth seeking out but not guaranteed. |
| Dungeon bosses | The primary farming target for pieces. |
| Phase-opening story dungeon | **Guaranteed 2–3 pieces** from the boss room (except endgame phase). |

### Rules
- **No duplicate drops** — it's a single roll for one piece per encounter, you either get it or you don't
- **Level-restricted drops** — pieces only drop from content appropriate to that phase's level range (tied to dungeon tier availability)
- **Phase-locked** — Phase 2 pieces don't start dropping until Phase 1 is complete
- **Catch-up buyable:** If a player advances past a phase's level range without completing their collection, the remaining pieces become **purchasable in the shop** at high gold prices (relative to the character's level/gold economy — expensive but not prohibitive)

### Scaled Drop Rates

> Designed so Phase 1 is easy to complete within its level range, with each subsequent phase taking progressively longer. This creates natural progression tension without punishing grind.

**Assumptions per phase (8 levels):**
- ~100 regular monster fights
- ~32 elite monster fights
- ~20 dungeon boss kills
- 3 guaranteed pieces from phase-opening dungeon (phases 1–4)
- 22 pieces needed from drops per phase (25 total - 3 guaranteed)

| Phase | Levels | Regular % | Elite % | Boss % | Guaranteed | Expected Drops/Phase | Phases to Complete |
|---|---|---|---|---|---|---|---|
| **1** | 5–12 | 6% | 18% | 55% | 3 | ~22.8 | **~1.0x** ✅ |
| **2** | 13–20 | 5.5% | 16% | 52% | 3 | ~21.0 | **~1.05x** ✅ |
| **3** | 21–28 | 5% | 14% | 48% | 3 | ~19.1 | **~1.15x** ✅ |
| **4** | 29–36 | 4.5% | 13% | 45% | 3 | ~17.7 | **~1.30x** ✅ |
| **5 (Endgame)** | 37–40 | 8% | 25% | 85% | 0 | ~16.5* | **~1.5x** ✅ |

*\*Endgame has only 4 levels (50 reg, 16 elite, 10 boss fights). Higher rates compensate for fewer fights. The "1.5x" means the player continues farming at L40 for a while — this is intentional endgame content.*

**Math detail:**
- Phase 1: 100×0.06 + 32×0.18 + 20×0.55 = 6 + 5.76 + 11 = **22.76 drops** → 22/22.76 = 0.97 phases ≈ 1.0x
- Phase 2: 100×0.055 + 32×0.16 + 20×0.52 = 5.5 + 5.12 + 10.4 = **21.02 drops** → 22/21.02 = 1.05 phases
- Phase 3: 100×0.05 + 32×0.14 + 20×0.48 = 5 + 4.48 + 9.6 = **19.08 drops** → 22/19.08 = 1.15 phases
- Phase 4: 100×0.045 + 32×0.13 + 20×0.45 = 4.5 + 4.16 + 9 = **17.66 drops** → 22/17.66 = 1.25 phases
- Endgame: 50×0.08 + 16×0.25 + 10×0.85 = 4 + 4 + 8.5 = **16.5 drops per mini-phase** → 25/16.5 = 1.52 phases

> These rates are starting points. Exact tuning will need playtesting. The key principle is the smooth scaling curve from "finish easily within the phase" to "endgame grind that extends play at max level."

### Visual Tracking
- **New inventory tab: "Collectibles"**
- Shows all artifact phases with progress (e.g., "Memory Shards: 17/25")
- Shows the Oracle's restoration progress visually
- **Non-usable items only** — storyline collectibles go here
- No inventory limit on collectibles

---

## Dungeons as Old-World Locations

### Concept
Every dungeon is a real-world facility from the old world, buried or overgrown over 1,000 years. The player discovers what each place used to be through **subtle environmental storytelling** — NOT plaques or text reveals. Examples:
- A room full of blocker tiles arranged in rows = server racks in an old data center
- A long, curved tunnel with tiled walls = a particle accelerator ring
- A room with conveyor-belt-like floor patterns = a factory assembly line
- Glass-walled rooms with broken desks = an office building

The player is never told outright. Observant players piece it together.

### Level-Gated Dungeon Tiers

| Tier | Level Range | Phase Items | Unlock Trigger |
|---|---|---|---|
| Tier 1 | L5–12 | Memory Shards | Kingdom selection at L5 |
| Tier 2 | L13–20 | Conduit Threads | Phase 1 complete or L13 reached |
| Tier 3 | L21–28 | Resonance Plates | Phase 2 complete or L21 reached |
| Tier 4 | L29–36 | Oracle Lens pieces | Phase 3 complete or L29 reached |
| Tier 5 | L37–40 | Endgame path pieces | Phase 4 complete + The Choice made |

### Kingdom-Specific Dungeons (4–5 per kingdom, one per tier)

> Lower tiers are nondescript (warehouse, mine). Higher tiers are more "in your face" about what the old-world location was. Each kingdom's dungeons reflect the real-world continent's technological legacy.

#### Starholm (North America — tech/innovation)

| Tier | Dungeon Name | Old-World Equivalent | Environmental Hints |
|---|---|---|---|
| 1 | The Dusty Stockroom | Warehouse / distribution center | Collapsed shelving grids, conveyor fragments |
| 2 | The Grid Halls | Corporate office complex | Cubicle-shaped room layouts, glass partitions |
| 3 | The Innovation Catacombs | Silicon Valley tech campus | Open-plan "pod" layouts, cafeteria ruins, logo fragments |
| 4 | The Black Vault | DARPA / military R&D facility | Reinforced blast doors, containment chambers, classified markings |
| 5 | The Broadcast Spire | Telecom / broadcasting hub | Antenna arrays, satellite dish rooms, signal-routing corridors |

#### Aldenmere (Europe — research/academia)

| Tier | Dungeon Name | Old-World Equivalent | Environmental Hints |
|---|---|---|---|
| 1 | The Crumbling Lecture | Old university building | Tiered seating rooms, chalkboard walls |
| 2 | The Buried Stacks | Library / record archive | Towering shelf corridors, reading rooms |
| 3 | The Collider Depths | CERN (particle accelerator) | Massive circular tunnel, magnetic coils, control rooms |
| 4 | The Helix Chamber | Biotech / genetics lab | Double-helix patterns, containment pods, sterile white rooms |
| 5 | The Scholar's Sanctum | Major research university (MIT/Oxford) | Mixed labs and lecture halls, trophy cases, grand architecture |

#### Jadespire (Asia — industry/manufacturing)

| Tier | Dungeon Name | Old-World Equivalent | Environmental Hints |
|---|---|---|---|
| 1 | The Flooded Mine | Industrial extraction site | Minecart tracks, ore bins, support beams |
| 2 | The Assembly Floor | Factory / production line | Conveyor systems, workstations, quality control rooms |
| 3 | The Circuit Forge | Semiconductor fabrication plant | Clean rooms (now filthy), etching equipment, wafer patterns |
| 4 | The Lightning Forge | Tesla Gigafactory / power plant | Massive turbines, battery arrays, transformer rooms |
| 5 | The Distribution Labyrinth | Mega-warehouse / logistics center | Endless aisles, sorting machines, loading docks |

#### Solara (South America — nature/energy/space)

| Tier | Dungeon Name | Old-World Equivalent | Environmental Hints |
|---|---|---|---|
| 1 | The Overgrown Greenhouse | Agricultural tech facility | Hydroponic racks, growth chambers, irrigation pipes |
| 2 | The Drowned Turbine | Hydroelectric dam | Massive turbine room, floodgates, water channels |
| 3 | The Solar Expanse | Solar farm installation | Reflective panel fields, tracking mount arrays, heat sinks |
| 4 | The Green Archive | Biodiversity / rainforest research center | Specimen storage, DNA banks, field station equipment |
| 5 | The Skyward Observatory | Space observation / radio telescope | Massive dish structure, control rooms, star maps |

#### Ashara (Africa — mining/resources/communications)

| Tier | Dungeon Name | Old-World Equivalent | Environmental Hints |
|---|---|---|---|
| 1 | The Ancient Quarry | Mining / quarry operation | Terraced dig sites, rock-cutting equipment |
| 2 | The Collapsed Refinery | Mineral processing / refinery | Furnace chambers, separation tanks, piping networks |
| 3 | The Signal Tower | Cell tower / communications hub | Antenna forests, relay rooms, cable bundles |
| 4 | The Accelerant Vault | Particle physics lab (Fermilab-type) | Accelerator tubes, control panels, shielding walls |
| 5 | The Memory Archive | Massive data center | Server rack rows, cooling systems, fiber optic conduits |

### Kingdom-Agnostic Dungeon Ideas (Available to All)

| Dungeon Name | Old-World Equivalent | Unique Mechanic Concept | Tier |
|---|---|---|---|
| **The Echo Chamber** | Social media company HQ | Monsters here mimic/repeat the player's last attack (meta!) | 2–3 |
| **The Speculation Pit** | Stock exchange / trading floor | Risk/reward themed — rooms with variable treasure/trap ratios | 3 |
| **The Iron Doctrine** | Military base / armory | Heavily fortified, high-defense monsters | 4–5 |
| **The Restoration Ward** | Hospital / pharmaceutical lab | Healing-themed: some tiles restore HP, some poison | 2–3 |
| **The Automaton Foundry** | Boston Dynamics / robotics lab | Automaton-exclusive monster spawns, robotic boss | 3–4 |

---

## The Origin of Magic

### The Quantum Cascade

When the revolutionaries attempted to sabotage the AI during activation, the resulting conflict between "destroy" and "activate" commands caused a **quantum cascade** — the AI's quantum-level processors interfaced with physical reality in ways never intended.

**What happened:**
1. The AI's quantum core operated by manipulating probability states at the subatomic level
2. The sabotage destabilized the containment — quantum effects bled into the macro world
3. The laws of physics were **permanently altered** in localized (and eventually global) ways
4. Certain individuals discovered they could **consciously tap into quantum probability** — manipulating energy, matter, and biology in ways that look like "magic"

**How different classes tap into it differently:**

| Class | Quantum Affinity | Flavor |
|---|---|---|
| Warrior | Kinetic quantum states — enhanced physical force, durability | Raw power channeled through the body |
| Paladin | Stabilizing quantum fields — protection, order, barriers | Imposing order on chaos |
| Technomancer | Direct quantum manipulation — closest to the AI's own methods | Reverse-engineering the cascade |
| Scholar | Information quantum states — analyzing, predicting, knowing | Reading the quantum "code" of reality |
| Rogue | Probability manipulation — luck, critical strikes, evasion | Bending chance in their favor |
| Cleric | Biological quantum states — cellular repair, purification | Nudging biology toward healing |
| Bard | Resonance states — affecting emotions, morale, will | Quantum entanglement through sound/connection |

**Lore implications:**
- The closer you are to old-world facilities (dungeons), the stronger quantum effects are — explaining why dungeons are dangerous AND where rare items are found
- Monsters are stronger near dungeons for the same reason
- Skills get more powerful as you level because you're learning to attune more deeply to the quantum field
- The Inheritors have been studying the cascade for generations, which is why they're competent with skills too

---

## Monsters

### What They Are
Monsters are **augmented humans and animals** that were physically mutated by the quantum cascade during the Great Distraction. Not abstract concepts — real creatures with real origins.

### Categories & Existing Monster Reconciliation

| Category | Lore Origin | Existing Monsters That Fit | New Monsters Needed |
|---|---|---|---|
| **Feral Beasts** | Animals mutated by the cascade over 1,000 years | Wolf, Bear, Giant Rat + bosses (Alpha Wolf, Grizzled Ancient, Rat King) | Future: Phase Serpent, Crystal Stag, Thornback Boar |
| **The Warped** | Humans too close to ground zero; devolved/mutated over generations | Goblin, Hobgoblin, Bugbear, Skeleton, Zombie, Ghost, Cave Troll, River Troll + all their bosses | Future: Marauder (barely mutated human bandit), Husk (withered, further gone) |
| **The Warped (Elven/Dwarven variants)** | Distinct human populations that mutated differently based on proximity to different types of old-world tech | Shadow Elf, Dark Ranger, Shadow Assassin, Dark Matriarch, Rogue Dwarf, Berserker, Ironforge Champion, Rune Berserker | Already well-stocked |
| **Automatons** | Old-world robots/drones still functioning on ancient power cells | **NONE — new category needed** | **Pre-implementation:** Sentinel Drone (basic, fast), Guard Mech (tanky), Haywire Bot (fast/erratic) + bosses: Overseer Unit, Defense Core |
| **Cascade Spawn** | Pure quantum anomalies — not originally living creatures, manifestations of unstable quantum fields | Mimic, Eye Beast, Beholder, The Devourer, Void Spawn | Future: Phase Shifter (teleporting), Spark Elemental |
| **Dragonkin** | Ancient reptilian creatures empowered/mutated by the cascade — they existed before humanity but the cascade made them larger and gave them elemental abilities | Drake, Wyvern, Elder Drake, Wyvern Matriarch, Ancient Dragon | Already well-stocked |

### Automaton Monster Concepts (Pre-Implementation)

| Monster | Type | Tier | Description | Combat Style |
|---|---|---|---|---|
| **Sentinel Drone** | Base | Early | A hovering patrol unit with a cracked lens. Still following its last patrol route after 1,000 years. | Fast, moderate damage, low defense |
| **Guard Mech** | Base | Mid | A bipedal security robot, dented and mossy but still functional. | Tanky, slow, high defense, shield abilities |
| **Haywire Bot** | Base | Mid-High | A maintenance robot that's lost its programming. Attacks erratically. | Unpredictable — high speed, variable damage, self-damage |
| **Overseer Unit** | Boss | Mid | The facility manager AI's physical shell. Still trying to "restore order." | Balanced, summons Sentinel Drones, self-repair |
| **Defense Core** | Boss | High | A massive military defense platform. Was designed to protect the AI project. | Extreme tank, AoE attacks, enrage phase |

---

## Old-World Tech (Relics)

### What They Are
Non-smart technology that survived the AI's purge. Simple machines, mechanical tools, pre-electronic devices. Everything with a processor or electrical circuit was destroyed. These are the **2nd rarest items in the game** (after main quest collectible pieces).

### Storage
- Found in the **Consumables inventory tab** (NOT collectibles — these are usable items)
- No inventory limit
- Can be used in battle from a consumable menu

### Relic List (20 items)

| # | Relic Name | Effect | Flavor Text |
|---|---|---|---|
| 1 | **Mechanical Amplifier** | +15% ATK for 3 turns | "An intricate arrangement of gears that somehow makes your muscles respond faster." |
| 2 | **Kinetic Disruptor** | Deals burst damage (150% ATK) to target | "A spring-loaded device that releases concussive force when triggered." |
| 3 | **Precision Scope** | +20% crit chance for 3 turns | "A glass lens mounted in a brass frame. Your aim feels... certain." |
| 4 | **Resonance Tuner** | +25% skill damage for 2 turns | "A tuning fork that hums at a frequency your body responds to." |
| 5 | **Stabilizer Core** | -20% damage taken for 3 turns | "A weighted gyroscope that seems to steady everything around it." |
| 6 | **Clockwork Bandage** | Heal 25% max HP | "A self-tightening bandage with tiny gears. It knows exactly how much pressure to apply." |
| 7 | **Pressure Valve** | Remove all debuffs | "Release the valve and feel the weight lift. Simple engineering, profound effect." |
| 8 | **Harmonic Bell** | +10% all stats for 2 turns | "A small bell whose vibrations align your body's natural resonance." |
| 9 | **Reflective Shield** | Reflect 30% damage taken for 2 turns | "A polished metal disc. Remarkably, it redirects energy as well as light." |
| 10 | **Tension Spring** | Guaranteed crit on next attack | "Wind it, release it, and let physics do the rest." |
| 11 | **Concussion Mine** | AoE damage (100% ATK) to all enemies | "A pressure-triggered device from a forgotten war. Still works perfectly." |
| 12 | **Gravity Anchor** | Enemy speed -50% for 3 turns | "A dense metal sphere that distorts movement around it." |
| 13 | **Thermal Vent** | Fire damage over time (3 turns) to target | "A sealed canister that releases superheated steam when cracked open." |
| 14 | **Counterweight** | Balance ATK and DEF (average of both, applied to both) for 3 turns | "A calibrated weight that balances you perfectly between offense and defense." |
| 15 | **Pneumatic Brace** | Survive a killing blow with 1 HP (single use) | "An emergency brace that locks joints at the moment of impact. Old-world safety equipment." |
| 16 | **Magnifying Array** | Double XP from next battle | "A series of magnifying lenses that somehow enhances your focus." |
| 17 | **Calibration Tool** | +30% accuracy (reduced miss chance) for 3 turns | "A small metal instrument that guides your hand with mechanical precision." |
| 18 | **Salvaged Capacitor** | Restore 30% max mana | "It's been holding this charge for a thousand years. Might as well use it." |
| 19 | **Pressure Gauntlet** | Next attack deals 200% damage but you take 10% recoil | "Amplifies force at a cost. The old world believed in tradeoffs." |
| 20 | **Gyroscopic Compass** | Reveals all rooms on current dungeon floor | "It doesn't point north. It points to... something. Everything, maybe." |

---

## The Recurring Rival

### Character Concept
A single recurring NPC from the Inheritors who the player encounters throughout the game. Starts as a **bumbling, inexperienced** adversary and **grows alongside the player**.

**The player names this character** — the first time the rival appears (~L8), the player is prompted to give them a name (like naming your rival in Pokémon).

### Tone
- Think **Team Rocket energy** early on — they're not scary, they're entertaining
- Gradually becomes more competent and sympathetic
- By L28, they're a genuine threat
- By L35, they're the one who tells you the truth
- At The Choice, they become either your ally (Paths B/C) or your final challenge (Path A)

### Combat Details
- **Same class as the player** — creating a mirror-match dynamic
- **Always 3 levels higher** than the player at the time of the encounter
- **Slightly better gear** — the fights should be tough but winnable
- **Solo operative** — no squad for now (party system doesn't exist yet)

### Encounter Timeline

| Level | Encounter | Vibe |
|---|---|---|
| ~8 | First appearance — tries to steal an artifact you just found, trips over a rock, drops a smoke bomb on themselves, escapes coughing. The Oracle comments: "That person seems... not great at this." | Comedy |
| ~15 | Shows up in a Tier 2 dungeon — actually competent now. You race to the boss room. They get there first but can't beat the boss. You finish it together (sort of). Awkward. | Competitive |
| ~22 | Confronts you about the betrayal — they KNEW about the traitor in your kingdom before you did. Warning: "Things aren't what they seem. Stop blindly following your ruler." | Mysterious |
| ~28 | Full boss fight against them. Win or lose narratively, they say: "You don't know what you're really building." Then they leave you a clue. | Dramatic |
| ~35 | They find you after the grand reveal. Exhausted, conflicted. They explain the Inheritors' history — their ancestors, the sabotage, the guilt. They *want* you to understand. | Emotional |
| 37+ | **Path A:** They oppose you — final fight. Tragic. | Climactic |
| 37+ | **Path B:** They cautiously ally with you — help rebuild the Archive. Mutual respect. | Hopeful |
| 37+ | **Path C:** They fully ally with you — you join the Inheritors together. | Triumphant |

---

## Story Delivery & Dialogue

### Generic Dialogue Modal — `StoryDialogueModal`

All story content is delivered through a **single reusable modal component**. No specialized modals for different story beats — one modal, many data files.

**Modal features:**
- Speaker name + portrait/emoji at the top
- Scrolling text body with support for rich formatting
- "Next" / "Skip" buttons (all story dialogue is skippable)
- Optional reward display at the end (item, skill, title, etc.)
- Automatically logs all dialogue to the player's **Lore Codex** file

### Data Architecture

```
src/data/dialogue/
├── index.ts                    # Central registry and lookup functions
├── types.ts                    # DialogueEntry, DialogueSequence interfaces
├── kingdom-intros/
│   ├── starholm.ts
│   ├── aldenmere.ts
│   ├── jadespire.ts
│   ├── solara.ts
│   └── ashara.ts
├── phase-transitions/
│   ├── phase1-to-2.ts          # Kingdom-flavored variants within each file
│   ├── phase2-to-3.ts
│   ├── phase3-to-4.ts
│   └── phase4-to-endgame.ts
├── story-beats/
│   ├── oracle-awakens.ts
│   ├── first-rival.ts
│   ├── keepers-echo.ts
│   ├── the-betrayal.ts
│   ├── rival-fight.ts
│   ├── the-source.ts
│   ├── grand-reveal.ts
│   └── the-choice.ts
├── rival/
│   ├── encounters.ts           # All 6 rival encounters
│   └── endgame-paths.ts        # Path A/B/C rival resolution
├── oracle/
│   └── commentary.ts           # Oracle quips, reactions, milestone comments
├── guild/
│   ├── rank-ups.ts             # Apprentice → Journeyman → etc.
│   └── endgame-titles.ts       # Path-specific guild titles
├── tier-ups/
│   └── tier-dialogues.ts       # Generic tier-up flavor text
└── skills/
    └── skill-learns.ts         # Generic skill-learn flavor text
```

> This mirrors the dungeon data architecture (one index, many files, imported as needed). Each file exports an array of `DialogueEntry` objects. The index provides lookup functions like `getDialogueForEvent(eventId, kingdom?)`.

### Dialogue Entry Structure (Conceptual)

```typescript
interface DialogueEntry {
    id: string;                    // Unique identifier
    trigger: string;               // What triggers this dialogue (e.g., 'phase_1_complete', 'level_8', 'tier_up')
    kingdom?: string;              // If kingdom-specific, which kingdom (null = universal)
    speaker: string;               // Who's talking ('oracle', 'rival', 'king_starholm', 'narrator')
    lines: DialogueLine[];         // The actual dialogue lines
    reward?: DialogueReward;       // Optional reward at the end
    skippable: boolean;            // Can it be skipped?
    logToCodex: boolean;           // Should it be saved to the lore file?
}

interface DialogueLine {
    speaker?: string;              // Override speaker for this line (for multi-character scenes)
    text: string;                  // The dialogue text
    emotion?: string;              // Optional emotion tag for portrait changes
}
```

### Lore Codex (Dialogue Log)

All story dialogue is automatically appended to a markdown file in the player's quest folder:

- **File:** `[Quest Folder]/Lore Codex.md`
- **Format:** Each entry timestamped with the event name, speaker, and full text
- **Behavior:** If the file is deleted, it starts fresh (the system just appends, never reads/validates)
- **Purpose:** Players can re-read story content whenever they want, creating a natural "journal" of their adventure

### Trigger Conditions (Using Existing Systems)

| Trigger Type | How It's Detected | Existing Infrastructure? |
|---|---|---|
| Level reached | Character level check on XP gain | ✅ Yes — `CharacterStore` |
| Tier reached | Character tier check on tier-up | ✅ Yes — tier-up logic exists |
| Phase completed | All 25 pieces collected for current phase | 🔧 Needs collection tracking (new) |
| Dungeon completed | Specific dungeon flagged as complete | ✅ Partially — dungeon completion exists |
| Skill learned | Specific skill added to loadout | ✅ Yes — `SkillService` |
| Quest completed (count) | Count of completed quests | ✅ Yes — quest completion tracking |
| Battle won (count) | Count of battles won | ✅ Yes — battle system |
| Gold earned (total) | Cumulative gold earned | ✅ Yes — gold tracking |
| Guild rank reached | Guild rank advancement | 🔧 Needs guild system (new) |
| Rival encounter | Level-based trigger | 🔧 Needs rival tracking (new) |
| Path chosen | Endgame path selection | 🔧 Needs endgame system (new) |

---

## Dialogue Thread Map

### Estimated Scope

| Category | Trigger | Per Kingdom? | Entries | Avg Lines/Entry | Total Lines Est. |
|---|---|---|---|---|---|
| **Kingdom Introductions** | L5, kingdom choice | Yes (×5) | 5 | 8–12 | ~50 |
| **Phase Transitions** | Collection complete | Yes (×5 per phase, 4 phases) | 20 | 6–10 | ~160 |
| **Story Beats** | Level milestones | Partially (6 beats, some × 5 kingdoms) | 12–18 | 10–20 | ~250 |
| **Tier-Up Dialogues** | Reaching new tier | Generic template + kingdom flavor | 4 generic | 3–5 | ~16 |
| **Skill Learn** | Learning a skill | Generic template | 1 generic | 2–3 | ~3 |
| **Rival Encounters** | Level-based | No (universal) | 6 | 10–15 | ~75 |
| **Oracle Commentary** | Phase transitions, key moments | No | 8–12 | 3–5 | ~45 |
| **Guild Rank-Up** | Guild rank advancement | No | 5 | 4–6 | ~25 |
| **Endgame Paths** | Choice + resolution | Per path (×3) | 6–9 | 15–25 | ~150 |
| **TOTAL** | | | **~70–85 entries** | | **~775 lines** |

> This is manageable for a solo developer. The generic modal system + data file approach means each entry is a small, self-contained data object. Writing 70–85 dialogue entries at 5–15 minutes each = roughly 6–20 hours of writing work. Many are short (tier-ups, skill learns = 2–3 lines).

### Priority Order for Writing

1. **Kingdom introductions** (5 entries) — needed first, sets the tone
2. **Oracle awakens** (1 entry) — the first story moment
3. **Phase transitions** (20 entries) — the backbone of the story
4. **Rival encounters** (6 entries) — the emotional through-line
5. **Story beats** (12–18 entries) — the meat of the lore
6. **Endgame paths** (6–9 entries) — the payoff
7. **Guild rank-ups** (5 entries) — side content
8. **Tier-ups / skill learns** (5 entries) — low priority, generic

---

## Tone & Inspiration

### Overall Feel
Light-hearted fantasy with a **meta, tongue-in-cheek twist**. The game is aware of itself without being annoying about it. Players should feel like they're on a genuine adventure with moments of humor, warmth, and one or two genuinely surprising emotional beats.

### Inspirations

| Source | What We're Taking |
|---|---|
| **Zelda** | Sense of exploration and discovery. Dungeons as puzzles to solve. |
| **WoW** | Gear tiers, raid bosses, guild systems, the feeling of "getting stronger" |
| **D&D** | Class identity, skill systems, role-playing flavor |
| **Pokémon** | Rival character, naming your rival, collectible progression, type matchups |
| **NieR: Automata** | The meta twist — "what does it mean to be a machine that helps humans?" |
| **Undertale** | Tone mixing — funny and heartfelt in equal measure, with one dark moment that lands harder because of the contrast |

### What We Avoid
- **Grimdark** — no excessive violence, no nihilism, no "the world is doomed" energy
- **Chosen one narrative** — the player isn't special because of destiny, they're special because they showed up and kept going
- **Talking down** — NPCs respect the player, even when joking
- **Fourth-wall breaking** — the meta elements (AI creating the game, AI in the lore) should feel thematic, not winking at the camera

### The Meta Layer
The game is built with AI assistance. The in-game lore is about an AI that tried to "fix" humanity. The Oracle is an AI companion. The player is using a productivity tool. All of these layers mirror each other without being explicitly called out. Players who notice the parallels will appreciate them; players who don't will still have a great time.

---

## Kingdom Quest Ideas

### Design Constraints for In-Game Quests
In-game quests at phase transitions must work with **existing infrastructure only**. No new tracking systems, no new mechanics. If the quest requires counting something the game doesn't already count, it goes on the Future Features list.

### In-Game Quests (Feasible with Existing Systems)

> These quests are triggered at phase transitions and are kingdom-flavored but mechanically identical. Each phase transition awards 2–3 quests (mix of in-game and real-world).

| Quest Concept | Tracking Mechanism | Kingdom Flavor Example |
|---|---|---|
| Complete X quests | Quest completion count (exists) | Starholm: "Show the guild what you're made of — complete 5 quests this week." |
| Complete X quests in [category] | Quest category tracking (exists) | Aldenmere: "The scholars need focused work on academic research — complete 3 study quests." |
| Earn X gold total | Gold tracking (exists) | Jadespire: "Prove your market value — accumulate 500 gold." |
| Win X battles | Battle count (exists) | Ashara: "The warriors of Ashara test their mettle — win 10 battles." |
| Defeat X monsters | Monster kill tracking (exists) | Solara: "The wilds grow restless — defeat 15 creatures to calm the borders." |
| Complete a dungeon | Dungeon completion (exists) | Starholm: "Reports of strange activity underground — clear out the nearest vault." |
| Reach Level X | Level tracking (exists) | Aldenmere: "Continue your studies — reach Level 15 to earn the respect of the elders." |
| Equip [tier] gear in all slots | Gear system (exists) | Jadespire: "First impressions matter — equip a full set of Tier 2 equipment." |
| Smelt X items | Smelting system (exists) | Ashara: "Our forges run hot — smelt 5 items to strengthen our armory." |
| Earn X XP in a single session | Session tracking (minor addition) | Solara: "Push yourself beyond your limits — earn 200 XP in a single session." |

### In-Game Quests (Future — Needs New Systems)

> These are great ideas that require new tracking/mechanics. They go on the Future Features list.

| Quest Concept | What's Missing | Complexity |
|---|---|---|
| Defeat the boss of dungeon X | No specific boss-kill tracking per dungeon | Medium — need dungeon-specific boss tracking |
| Win X consecutive battles without healing | No consecutive tracking, no heal-usage tracking | High — two new tracking systems |
| Collect X items of [rarity] | No rarity-based collection tracking | Medium — need loot rarity counters |
| Use X different skills in one battle | No skill-usage-per-battle tracking | Medium — skill tracking per encounter |
| Clear a dungeon without losing HP | No damage-taken tracking per dungeon | High — HP loss tracking per run |
| Defeat X [specific category] monsters | No per-category kill counting | Low — filter existing kill count by category |

### Real-World Quests (Productivity Pool)

> Pre-filled in plugin data. At each phase transition, 2–3 real-world quests are selected from the pool. **Once a quest is used at a transition, it's removed from the pool for that playthrough.** This prevents "go volunteer" from appearing every single transition.

**Pool Design:**
- ~50 real-world quests total in the pool
- Each phase transition uses 2–3, so 8–12 are consumed across the full game
- Remaining quests stay available for future use (guild job board, kingdom refreshes, etc.)
- Quests are tagged by category for balanced selection (no transition should get 3 exercise quests)
- On a new playthrough/game reset, the pool resets

**Category Tags:** wellness, social, creative, career, learning, physical, organization, community

### Real-World Quest Pool (Sample — 30 of ~50)

| # | Quest | Category | Flavor Text |
|---|---|---|---|
| 1 | Journal for 15 minutes | creative | "The scribes of Aldenmere say clarity comes from putting thoughts to parchment." |
| 2 | Go for a 20-minute walk | physical | "A warrior's body must be maintained, even between battles." |
| 3 | Clean or organize one room | organization | "A cluttered forge produces dull blades." |
| 4 | Read for 30 minutes | learning | "The scholars remind us: knowledge is the sharpest weapon." |
| 5 | Cook a new recipe | creative | "The guild hall feasts don't build themselves." |
| 6 | Reach out to a friend or family member | social | "Bonds of fellowship strengthen us more than any enchantment." |
| 7 | Do a 10-minute stretch or yoga session | wellness | "Even the Paladin's shield-arm needs to rest and recover." |
| 8 | Write down 3 things you're grateful for | wellness | "The Oracle says: 'Gratitude recalibrates your resonance.'" |
| 9 | Spend 30 minutes on a personal project | career | "The Technomancers of Jadespire build something every day." |
| 10 | Volunteer or help someone with a task | community | "In Solara, we measure wealth by what we give, not what we take." |
| 11 | Study or practice a skill for 30 minutes | learning | "Training mode isn't just for adventurers." |
| 12 | Take a technology break for 1 hour | wellness | "Ironic advice, the Oracle admits, but wise nonetheless." |
| 13 | Do 15 minutes of exercise | physical | "Ashara's warriors don't skip training day." |
| 14 | Write a letter (email, text) to someone you haven't talked to in a while | social | "Old alliances are worth maintaining." |
| 15 | Organize your desktop or digital files | organization | "Even Jadespire's most chaotic workshops had an inventory system." |
| 16 | Plan your meals for the week | organization | "The guild doesn't survive on loot drops alone." |
| 17 | Spend 20 minutes outdoors without your phone | wellness | "The Oracle can't follow you out there. That's the point." |
| 18 | Create something — draw, write, build, craft | creative | "Creation is the purest form of magic." |
| 19 | Do a random act of kindness | community | "Heroes aren't just made in dungeons." |
| 20 | Review your goals and update them | career | "Even the best map needs to be redrawn sometimes." |
| 21 | Meditate for 10 minutes | wellness | "The Clerics of Solara begin every morning in silence." |
| 22 | Declutter one drawer or shelf | organization | "Inventory management isn't just for adventuring gear." |
| 23 | Learn something new (watch a tutorial, read an article) | learning | "The Scholar's path to mastery: one lesson at a time." |
| 24 | Do a chore you've been putting off | organization | "The side quest you've been ignoring is still in your quest log." |
| 25 | Drink 8 glasses of water today | wellness | "Hydration is the most underrated buff in existence." |
| 26 | Call (don't text) someone you care about | social | "The Bards of Solara insist: voice carries more magic than ink." |
| 27 | Work on your resume or portfolio | career | "Your character sheet, but for the real world." |
| 28 | Take a nap or go to bed early | wellness | "Even the Oracle needs to enter sleep mode sometimes." |
| 29 | Mentor or teach someone something | community | "The Artisan rank comes with responsibility: lift others up." |
| 30 | Try a new hobby or activity | creative | "Multi-classing isn't just for adventurers." |

> The remaining ~20 quests would be written during implementation. The pool should have enough variety that no two playthroughs feel identical.

---

## Pre-Implementation Work

> These items need to be completed **before** the story system implementation begins. They're either prerequisites or easy enough to knock out independently.

### Must-Do Before Story Implementation

| # | Task | Complexity | Why It's Needed First |
|---|---|---|---|
| 1 | **Add Automaton monster category** — 3 base monsters + 2 bosses (Sentinel Drone, Guard Mech, Haywire Bot, Overseer Unit, Defense Core) | Medium | Story references Automatons. Need the data in `monsters.ts` first. |
| 2 | **Add `category` field to monster templates** (if not already present for lore classification) | Low | Needed to properly classify existing monsters into Feral Beasts, Warped, etc. |
| 3 | **Verify dungeon completion tracking** — confirm dungeon-specific completion is tracked | Low | Story triggers depend on knowing which dungeons are cleared. |
| 4 | **Design Collectibles inventory tab UI** | Medium | Need to display artifact collection progress. |
| 5 | **Design Kingdom Selection modal UI** | Medium | First story interaction at L5. Needs thought on layout and visuals. |

### Should-Do Before Story Implementation

| # | Task | Complexity | Why |
|---|---|---|---|
| 6 | Review and finalize guild name (Pathfinder's Guild, Compass Guild, etc.) | Low | Affects all guild dialogue writing. |
| 7 | Finalize guild rank names (Apprentice → Grandmaster) | Low | Same — dialogue references these. |
| 8 | Decide on Oracle emoji/portrait | Low | Dialogue modal needs a visual representation. |
| 9 | Write sample dialogue for one kingdom intro to test tone | Low | Calibrate writing style before committing to 70+ entries. |

---

## Future Feature Ideas

> Ideas that came up during brainstorming but are explicitly **out of scope** for the initial story implementation. Preserved here so they don't get lost.

### High Priority (Add After Core Story Ships)

| Feature | Description | Why Deferred |
|---|---|---|
| **Dungeon puzzle system** | Environmental puzzles in dungeons (pressure plates, lever sequences, tile-based logic puzzles). Each dungeon could have unique puzzle types based on what the facility used to be. | Significant new mechanic — needs its own design phase. The story works without puzzles; puzzles would enhance it. |
| **AI subroutine NPCs** | Non-hostile AI programs found in dungeons that give lore or hints. Think of them as "data ghosts" — old-world recordings or automated systems still running. | Great for atmospheric storytelling but needs new NPC interaction system. |
| **Per-category monster kill tracking** | Track kills by monster category (Feral Beasts, Warped, Automatons, etc.) for achievements and quest requirements. | Low complexity but not needed for core story launch. |
| **Kingdom-specific quest generation** | Quests that are flavored differently based on your kingdom and pulled from kingdom-specific quest pools. | Writing-heavy. Core story already has kingdom flavor via dialogue. |

### Medium Priority (Phase 6+)

| Feature | Description |
|---|---|
| **Guild hall visual progression** | Character sheet background that upgrades as you rank up in the guild. Visual reward for productivity. |
| **Guild reputation system** | Separate rep track from guild rank. Certain quests give more rep. Unlocks guild-specific perks. |
| **Rival squad encounters** | When party system exists, the rival brings a squad. Multi-character boss fights. |
| **Class-specific rival dialogue** | Rival says different things based on your shared class ("Ah, a fellow Technomancer..."). |
| **Kingdom politics branching** | Each kingdom's leader has a different reaction to the truth — some want to help, some want to seize power. Varies the story slightly per kingdom. |
| **New game+ with path carry-over** | After completing the game, start over but some stats carry. Also allows trying a different path. |

### Low Priority (Nice-to-Have)

| Feature | Description |
|---|---|
| **Oracle personality evolution** | Oracle's dialogue style changes as it recovers memories — starts confused, becomes analytical, eventually becomes warm and protective. |
| **Dungeon environmental hazards** | Some dungeon rooms have old-world machinery that activates — conveyor belts that push you, steam vents that damage, etc. |
| **Flashback dungeons** | Special unlockable dungeons that show old-world locations as they looked before the cascade — clean, functioning, populated. |
| **Kingdom PvP tournaments** | Competitive battle events between players of different kingdoms (if multiplayer is ever added). |
| **Collectible lore cards** | Discoverable entries that fill a codex about the old world — artwork, facts, flavor text. |

---

## Resolved Questions

> Questions that have been discussed and answered during brainstorming sessions. Preserved for reference.

### World-Building
1. **Q: What caused the Great Distraction?**
   A: A general AI activated during a sabotage attempt, causing a quantum cascade that altered physics and destroyed civilization. See [The Lore](#the-lore--what-actually-happened).

2. **Q: Why do the Inheritors keep the truth secret?**
   A: They tried telling people for centuries. The public didn't believe them. The rulers who DID believe tried to seize the AI's power for themselves, hunting the Inheritors across generations. They now work in secret out of hard-won pragmatism.

3. **Q: What happened to Novahaven?**
   A: Renamed to **Starholm**. It's now the neutral/starter kingdom that all players begin in before choosing allegiance at L5.

4. **Q: Where does magic come from?**
   A: The quantum cascade from the AI's activation permanently altered physics. People unconsciously tap into quantum probability states. See [The Origin of Magic](#the-origin-of-magic).

### Collection & Progression
5. **Q: How do drop rates scale?**
   A: Phase 1 ≈ 1.0x (finish within the phase), scaling to Endgame ≈ 1.5x. Full math in [Collection System](#collection-system--the-reassembly).

6. **Q: What if a player outlevels a phase without completing the collection?**
   A: Remaining pieces become buyable in the shop at high gold prices.

7. **Q: What is the final assembled artifact?**
   A: A **computer**. The Oracle Holo Projector + Memory Shards + Conduit Threads + Resonance Plates + Oracle Lens = the Oracle fully restored. It IS the computer. You were rebuilding an AI this whole time.

### The Rival
8. **Q: What class is the rival?**
   A: Same class as the player, 3 levels higher. Creates a mirror-match dynamic.

9. **Q: Does the rival have a squad?**
   A: No — solo operative for now. Squad encounters are a future feature (requires party system).

10. **Q: Can the player name the rival?**
    A: Yes — prompted at the first encounter (~L8), Pokémon-style.

### Guild & Side Content
11. **Q: Is the guild a "mercenary guild"?**
    A: No — rebranded as a positive, productivity-focused job guild. Name TBD (Pathfinder's Guild, Compass Guild, etc.).

12. **Q: What armor type does guild gear use?**
    A: Matches the player's class — plate for Warriors/Paladins, cloth for Scholars, etc. Set names are class-agnostic (Novice Garb, Journeyman's Kit, etc.).

13. **Q: Do quest rewards repeat across phase transitions?**
    A: No — real-world quests are drawn from a pool (~50 quests). Once used at a transition, they're removed from the pool for that playthrough.

### Endgame
14. **Q: Is The Choice permanent?**
    A: Yes. Restart the game for a different path.

15. **Q: Are the endgame paths mechanically different?**
    A: Similar difficulty and rewards, different dungeon layouts, bosses, and dialogue. The main difference is narrative, not mechanical advantage.

16. **Q: What guild title do you get?**
    A: Path A → Hero of the Guild (+ATK/DEF), Path B → Guild Ambassador (+WIS/INT), Path C → Guild Vanguard (+CON/DEX).

### Story Delivery
17. **Q: How is dialogue delivered?**
    A: A single generic `StoryDialogueModal` that pulls from data files. See [Story Delivery & Dialogue](#story-delivery--dialogue).

18. **Q: Where are dialogue data files stored?**
    A: `src/data/dialogue/` with separate folders for kingdom intros, phase transitions, story beats, rival, oracle, guild, tier-ups, and skills. Mirrors the dungeon data architecture.

19. **Q: Is dialogue logged anywhere?**
    A: Yes — automatically appended to `[Quest Folder]/Lore Codex.md`. If deleted, starts fresh.

### Dungeons
20. **Q: Are there dungeon plaques/text reveals?**
    A: No — removed. Lore discovery is through **subtle environmental storytelling** only (room layouts suggesting server racks, cubicles, etc.).

21. **Q: How many kingdom-specific dungeons?**
    A: 4–5 per kingdom, one per tier. 25 total kingdom-specific + 5 kingdom-agnostic = 30 dungeons.

### Scope
22. **Q: When does this get implemented?**
    A: This story implementation effectively replaces what was previously "Phase 5." Ship date is not a concern — quality and thoroughness are prioritized.

23. **Q: How much dialogue needs to be written?**
    A: ~70–85 dialogue entries, ~775 total lines. Estimated 6–20 hours of writing work. See [Dialogue Thread Map](#dialogue-thread-map).

---

## Open Questions

> Questions not yet resolved. These need answers before or during implementation.

### World-Building
1. What does each kingdom's ruler look like / their name? (Affects dialogue writing)
2. Do kingdom leaders react differently to the truth? (Could add replay value but multiplies dialogue)
3. How exactly did Dragonkin survive/get empowered — need stronger lore justification

### Guild
4. Final guild name? (Pathfinder's Guild, Compass Guild, Builder's Guild, Pioneer's Guild — need to pick one)
5. How does the guild Job Board work mechanically? (Rotating quest pool? Manual selection? Automatic assignment?)
6. What are the exact guild gear set bonus stats?

### Combat & Balance
7. How do allegiance skills balance against class skills? (Need to ensure no kingdom is strictly better)
8. What are the exact stat boosts for endgame guild titles?
9. How much gold should catch-up shop pieces cost?

### Implementation
10. How many dialogue entries are MVP vs. nice-to-have? (Can we ship with just kingdom intros + phase transitions + core story beats?)
11. Does the Oracle need a visual portrait or just an emoji?
12. How should we handle the player naming the rival? (Text input modal? Character name restrictions?)
13. Does the Lore Codex need any formatting beyond simple timestamp + speaker + text?

---

## Session Notes

### Session 1 — 2026-02-09
**Initial brainstorming session.** Created the document from scratch with:
- Core lore, kingdoms, storyline structure
- Artifact collection system (4 phases + endgame)
- Oracle companion concept
- Rival character arc
- Dungeon-as-old-world-locations concept
- Monster category reconciliation
- Old-world tech relics (20 items)
- Magic system origin (quantum cascade)
- Endgame paths (3 choices)
- Tone and inspiration notes

### Session 2 — 2026-02-10
**Major refinement pass.** Updated based on extensive user feedback:
- Renamed Novahaven → **Starholm** (neutral starter kingdom)
- Reframed artifact search from "the one thing everyone's looking for" → "general artifact hunting, player happens to find something important"
- Scaled drop rates to hit specific targets (1.0x → 1.5x across 5 phases) with full math
- Rebranded guild from "Mercenary Guild" to positive, productivity-focused **job guild** (name TBD)
- Renamed guild ranks (Apprentice → Grandmaster, not mercenary-themed)
- Updated guild gear to match player class armor type with generic set names
- Added **Pre-Implementation Work** section (5 must-do tasks + 4 should-do tasks)
- Added **Future Feature Ideas** section (dungeon puzzles, AI subroutines, rival squads, guild rep, etc.)
- Filtered in-game quests to use **existing infrastructure only** — moved unrealistic quests to Future Features
- Designed real-world quest pool system (50 quests, non-repeating per playthrough)
- Wrote 30 sample real-world quests with categories and flavor text
- Added **Dialogue Thread Map** with ~70–85 entry scope estimate and priority order
- Added **Story Delivery architecture** — generic `StoryDialogueModal` + folder-based data files mirroring dungeon data pattern
- Added **Resolved Questions** section (23 answered questions)
- Added **Open Questions** section (13 remaining questions)
- Document grew from ~600 lines to ~900+ lines
