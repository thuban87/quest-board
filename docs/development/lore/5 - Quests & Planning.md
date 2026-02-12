# Quests & Planning
> Part of the Quest Board Story & Lore documentation. See also:
> - [[1 - World Lore & Kingdoms]]
> - [[2 - Storyline & Characters]]
> - [[3 - Dialogue & Story Delivery]]
> - [[4 - Game Systems]]

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

### In-Game Quests — Future (Needs New Systems)

> Great ideas that require new tracking/mechanics. Deferred until those systems exist.

| Quest Concept | What's Missing | Complexity |
|---|---|---|
| Defeat the boss of dungeon X | No specific boss-kill tracking per dungeon | Medium — need dungeon-specific boss tracking |
| Win X consecutive battles without healing | No consecutive tracking, no heal-usage tracking | High — two new tracking systems |
| Collect X items of [rarity] | No rarity-based collection tracking | Medium — need loot rarity counters |
| Use X different skills in one battle | No skill-usage-per-battle tracking | Medium — skill tracking per encounter |
| Clear a dungeon without losing HP | No damage-taken tracking per dungeon | High — HP loss tracking per run |
| Defeat X [specific category] monsters | No per-category kill counting | Low — filter existing kill count by category |

---

## Real-World Quest Pool

### Pool Design
Pre-filled in plugin data. At each phase transition, 2–3 real-world quests are selected from the pool. **Once a quest is used at a transition, it's removed from the pool for that playthrough.** This prevents "go volunteer" from appearing every single transition.

- **~50 real-world quests total** in the pool
- Each phase transition uses 2–3, so 8–12 are consumed across the full game
- Remaining quests stay available for future use (guild job board, kingdom refreshes, etc.)
- Quests are tagged by category for balanced selection (no transition should get 3 exercise quests)
- On a new playthrough/game reset, the pool resets

**Category Tags:** wellness, social, creative, career, learning, physical, organization, community

### Quest Pool (Sample — 30 of ~50)

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
| 6 | Write sample dialogue for one kingdom intro to test tone | Low | Calibrate writing style before committing to 70+ entries. |

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
| **Guild Job Board kingdom posting** | Repurpose the "pick your kingdom via a guild task posting" concept for guild-specific content or side quest mechanics. Originally brainstormed as a kingdom selection option but replaced by the Crossroads Festival. |

---

## Resolved Questions

1. **Q: When does this get implemented?**
   A: This story implementation effectively replaces what was previously "Phase 5." Ship date is not a concern — quality and thoroughness are prioritized.

2. **Q: How much dialogue needs to be written?**
   A: ~70–85 dialogue entries, ~775 total lines. Estimated 6–20 hours of writing work. See [[3 - Dialogue & Story Delivery#Dialogue Thread Map]].

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
- Rebranded guild from "Mercenary Guild" to positive, productivity-focused **Pathfinder's Guild**
- Renamed guild ranks (Apprentice → Grandmaster, not mercenary-themed)
- Updated guild gear to match player class armor type with generic set names
- Added Pre-Implementation Work section (5 must-do tasks + 1 should-do task)
- Added Future Feature Ideas section (dungeon puzzles, AI subroutines, rival squads, guild rep, etc.)
- Filtered in-game quests to use existing infrastructure only — moved unrealistic quests to Future Features
- Designed real-world quest pool system (50 quests, non-repeating per playthrough)
- Wrote 30 sample real-world quests with categories and flavor text
- Added Dialogue Thread Map with ~70–85 entry scope estimate and priority order
- Added Story Delivery architecture — generic `StoryDialogueModal` + folder-based data files mirroring dungeon data pattern

### Session 3 — 2026-02-10
**Documentation restructure.** Split original 1000+ line brainstorming document into 5 focused docs:
- Resolved open questions: Dragonkin origin (mutated lizards), guild name (Pathfinder's Guild), Job Board mechanics (rotating 3-quest pool with 7-day cooldown), rival naming (text input, alpha only), Oracle portrait (Brad will sprite), MVP dialogue scope (everything ships), leader reactions (yes, aligned to endgame paths)
- Original brainstorming doc archived as `Story & Lore Brainstorming (Original).md`

### Session 4 — 2026-02-12
**Deep brainstorming and decision-locking pass.** Major decisions finalized:
- Cataclysm renamed from "The Great Distraction" (now truth-only term at L35+) to kingdom-specific folk names (Starholm: "When the world broke", Aldenmere: "The Unraveling", Jadespire: "The Great Stillness", Solara: "The Great Collapse", Ashara: "The Rending")
- Added folk theories about the cataclysm (6 theories with NPC believer groups)
- Kingdom rulers named: King Harken, King Castellan, Queen Jinren, Queen Marisun, King Obaran
- Kingdom-to-path alignment locked: Solara=Restore Archive, Ashara=Defend Dawn, Aldenmere=Join Inheritors, Jadespire+Starholm=Power-hungry
- Allegiance skills reworked to all-passive (Trailblazer's Drive, Ancient Ward, Market Insight, Bonds of Vitality, Ancestral Fortitude)
- Kingdom selection = Crossroads Festival at L5 (ambassadors from each kingdom pitch the player)
- Automaton monsters updated to biped-only designs
- Comic relief NPCs defined: Blacksmith "Grimjaw", Guildmaster Fennick, Shopkeeper "Merch", Old Wren (conspiracy theorist), Oracle comedy moments
- Family member NPC "Cousin Pip" — level-based letters tracking productivity progress (teasing → pride arc)
- 80/20 NPC tone rule established (80% respectful, 20% lovable snark)
- Guild Job Board Posting concept noted for future use
