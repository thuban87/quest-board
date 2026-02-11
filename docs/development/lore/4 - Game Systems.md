# Game Systems
> Part of the Quest Board Story & Lore documentation. See also:
> - [[1 - World Lore & Kingdoms]]
> - [[2 - Storyline & Characters]]
> - [[3 - Dialogue & Story Delivery]]
> - [[5 - Quests & Planning]]

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

## The Pathfinder's Guild

### Core Premise
You're an initiate in the **Pathfinder's Guild** — a renowned guild dedicated to **improving the world through action**. The guild exists to match people with meaningful work — not mercenary contracts, but genuine opportunities to make things better. The tone is **positive and upbeat** — this is the productivity branch, not the dark-and-gritty one.

In practice, guild quests are designed to **increase real-world productivity** — they're task-focused and reward completing actual work.

### How It Differs from Kingdom Quest

| | Kingdom Quest | Guild Quest |
|---|---|---|
| **Focus** | Story progression, lore, world-building | Real-world productivity, task completion |
| **Required?** | Yes (main story) | Optional but heavily incentivized |
| **Rewards** | Lore reveals, dungeon unlocks, story artifacts | Special gear sets + powerful consumables |
| **Tone** | Epic fantasy with a meta twist | Positive, guild-hall banter, job-board style |
| **Progression** | Level-gated phases | Continuous from post-training to L40 |

### Guild Ranks

| Tier | Guild Rank |
|---|---|
| 1 | Apprentice |
| 2 | Journeyman |
| 3 | Artisan |
| 4 | Specialist |
| 5 | Grandmaster |

> Post-L35 title is "Master" and then path-specific title replaces it at L37 (Hero / Ambassador / Vanguard).

### Guild Gear Sets

> At each level bracket, completing guild quests awards pieces of a unique gear set. The armor type matches the **player's class** (plate for Warriors/Paladins, cloth for Scholars, leather for Rogues, etc.). Set names are intentionally class-agnostic.

| Level Range | Set Name | Set Bonus Concept | Pieces |
|---|---|---|---|
| **1–8** (post-training) | **Novice Garb** | Minor stat boost across the board — a "training wheels" set | 5–6 pieces |
| **9–16** | **Journeyman's Kit** | Increased XP gain + gold find — helps you level and earn | 5–6 pieces |
| **17–24** | **Veteran's Regalia** | Combat-focused bonuses — crit chance, damage reduction | 5–6 pieces |
| **25–32** | **Elite Vestments** | Hybrid bonuses — combat stats + collectible find rate increase | 5–6 pieces |
| **33–40** | **Master's Raiment** | Best-in-slot set bonuses — endgame-caliber gear earned through productivity | 5–6 pieces |

> **TBD:** Exact set bonus stats need to be defined per class/level. There will be different stat distributions depending on player class. This is a significant balance task that needs its own design pass.

### The Job Board

The guild's Job Board provides a rotating pool of productivity-focused quests:

- **Pool size:** ~40-50 total quests available
- **Display:** Shows **3 random quests** at a time
- **Cooldown:** Once a quest is taken, it can't appear again for **7 days** (prevents farming specific reward quests)
- **Rewards:** Include special gear and unique items — the cooldown prevents over-farming
- **Rotation:** New quests are drawn from the pool whenever a slot opens up

### Guild-Specific Content Ideas
- **Guild-only dungeons** — "Contract Sites" — unstable zones the guild needs cleared. Since there's only one guild for everyone, these are less work than kingdom-specific dungeons
- Guild hall visual progression on the character page — a background that upgrades as you rank up (images TBD)

### Guild Storyline & Endgame Interaction
The guild storyline is affected by The Choice at L37:
- Path A → Hero of the Guild (ATK/DEF boost)
- Path B → Guild Ambassador (WIS/INT boost)
- Path C → Guild Vanguard (CON/DEX boost)
- Different closing dialogues for the guild wrap-up depending on path

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

## Resolved Questions

### Collection & Progression
1. **Q: How do drop rates scale?**
   A: Phase 1 ≈ 1.0x (finish within the phase), scaling to Endgame ≈ 1.5x. Full math in [Collection System](#collection-system--the-reassembly).

2. **Q: What if a player outlevels a phase without completing the collection?**
   A: Remaining pieces become buyable in the shop at high gold prices.

### Guild
3. **Q: Final guild name?**
   A: **Pathfinder's Guild**.

4. **Q: Is the guild a "mercenary guild"?**
   A: No — rebranded as a positive, productivity-focused job guild.

5. **Q: What armor type does guild gear use?**
   A: Matches the player's class — plate for Warriors/Paladins, cloth for Scholars, etc. Set names are class-agnostic (Novice Garb, Journeyman's Kit, etc.).

6. **Q: Do quest rewards repeat across phase transitions?**
   A: No — real-world quests are drawn from a pool (~50 quests). Once used at a transition, they're removed from the pool for that playthrough.

7. **Q: How does the guild Job Board work mechanically?**
   A: Rotating pool: ~40-50 total quests, shows 3 random quests at a time, 7-day cooldown on taken quests. Includes special gear/rewards to incentivize participation while preventing farming.

### Dungeons
8. **Q: Are there dungeon plaques/text reveals?**
   A: No — removed. Lore discovery is through **subtle environmental storytelling** only (room layouts suggesting server racks, cubicles, etc.).

9. **Q: How many kingdom-specific dungeons?**
   A: 4–5 per kingdom, one per tier. 25 total kingdom-specific + 5 kingdom-agnostic = 30 dungeons.

### Endgame
10. **Q: What guild title do you get?**
    A: Path A → Hero of the Guild (+ATK/DEF), Path B → Guild Ambassador (+WIS/INT), Path C → Guild Vanguard (+CON/DEX).

---

## Open Questions

1. **Guild gear set bonus stats** — Need to define exact stats per class/level. Different stat distributions depending on player class. Significant balance task needing its own design pass.
2. **Catch-up shop prices** — How much gold should remaining collection pieces cost? Need economy testing at various levels to determine average gold accumulation rates before this can be answered.
3. **Endgame title stat boosts** — Exact numerical values TBD. See [[2 - Storyline & Characters#Endgame Guild Titles]].
