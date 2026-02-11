# Dialogue & Story Delivery
> Part of the Quest Board Story & Lore documentation. See also:
> - [[1 - World Lore & Kingdoms]]
> - [[2 - Storyline & Characters]]
> - [[4 - Game Systems]]
> - [[5 - Quests & Planning]]

---

## Generic Dialogue Modal — `StoryDialogueModal`

All story content is delivered through a **single reusable modal component**. No specialized modals for different story beats — one modal, many data files.

**Modal features:**
- Speaker name + portrait/emoji at the top
- Scrolling text body with support for rich formatting
- "Next" / "Skip" buttons (all story dialogue is skippable)
- Optional reward display at the end (item, skill, title, etc.)
- Automatically logs all dialogue to the player's **Lore Codex** file

---

## Data Architecture

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

---

## Dialogue Entry Structure (Conceptual)

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

---

## Lore Codex (Dialogue Log)

All story dialogue is automatically appended to a markdown file in the player's quest folder:

- **File:** `[Quest Folder]/Lore Codex.md`
- **Format:** Each entry timestamped with the event name, speaker, and full text
- **Behavior:** If the file is deleted, it starts fresh (the system just appends, never reads/validates)
- **Purpose:** Players can re-read story content whenever they want, creating a natural "journal" of their adventure

> **TBD:** The Lore Codex probably needs richer formatting beyond just timestamp + speaker + text. Brad will experiment with this during implementation to determine what works well visually.

---

## Trigger Conditions (Using Existing Systems)

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

> **All dialogue entries are required before launch — no exceptions.** No MVP cutdowns.

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

## Resolved Questions

1. **Q: How is dialogue delivered?**
   A: A single generic `StoryDialogueModal` that pulls from data files. One modal, many data files.

2. **Q: Where are dialogue data files stored?**
   A: `src/data/dialogue/` with separate folders for kingdom intros, phase transitions, story beats, rival, oracle, guild, tier-ups, and skills. Mirrors the dungeon data architecture.

3. **Q: Is dialogue logged anywhere?**
   A: Yes — automatically appended to `[Quest Folder]/Lore Codex.md`. If deleted, starts fresh.

4. **Q: How many dialogue entries are MVP vs. nice-to-have?**
   A: All dialogue must be complete before launch. No MVP cutdowns — everything ships.

---

## Open Questions

1. **Lore Codex formatting** — Probably needs richer formatting than basic timestamp + speaker + text. Brad will experiment during implementation.
