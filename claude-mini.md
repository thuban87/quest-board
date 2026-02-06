# Quest Board - Quick Reference

**v1.0.0** | TypeScript + React + Obsidian API | Last Updated: 2026-02-05

---

## Critical Rules

1. **NO GIT COMMANDS** - Brad handles all git. Only use read commands (`git status`, `git log`, `git diff`). Provide commit messages at session wrap-up.
2. **Deploy to TEST first** - Always `npm run deploy:test`, never directly to production
3. **Don't edit `styles.css`** - It's auto-generated from PostCSS. Edit files in `src/styles/`
4. **Use ColumnConfigService** - No hardcoded `QuestStatus` checks for column logic
5. **PowerShell constraint** - Don't use `&&` for multiple commands (use semicolons or separate calls)

---

## Session Workflow

1. **Review** - Check Feature Roadmap v2, clarify requirements
2. **Code** - Work in dev environment only
3. **Build** - `npm run build`, fix errors, repeat until clean
4. **Deploy** - `npm run deploy:test` (copies to test vault)
5. **Wait** - Brad tests in test Obsidian vault
6. **Wrap up** - Update session log, Feature Roadmap, suggest commit message

**Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Test:** `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board`
- **Prod:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

---

## Architecture Principles

- **Separation of Concerns:** Models, Services, Components, Hooks, Utils
- **Single Responsibility:** Each class/function does ONE thing
- **No Monolithic Files:** Split if exceeding ~200-300 lines
- **JSDoc Everything:** Public methods get documentation

| Layer | Should Do | Should NOT Do |
|-------|-----------|---------------|
| **main.ts** | Register commands, initialize services, lifecycle | Contain business logic |
| **Components** | Render UI, handle user events, call hooks/services | File I/O, manage global state |
| **Services** | Business logic, file I/O, state coordination | Render UI, manipulate DOM |
| **Hooks** | Encapsulate reusable React logic, compose services | Be too component-specific |
| **Utils** | Pure functions, data transformations | Manage state, context assumptions |

---

## Key File Counts

| Type | Count | Notable Files |
|------|-------|---------------|
| **Services** | 36 | `QuestService`, `QuestActionsService`, `ColumnConfigService`, `SkillService`, `BattleService`, `FolderWatchService`, `TemplateService`, `DailyNoteService`, `PowerUpService` |
| **Modals** | 37 | `CreateQuestModal`, `ColumnManagerModal`, `SkillLoadoutModal`, `InventoryModal`, `ScrivenersQuillModal`, `ScrollLibraryModal`, `ProgressDashboardModal` |
| **Components** | 11 | `FullKanban`, `SidebarQuests`, `BattleView`, `DungeonView`, `CharacterSheet`, `QuestCard`, `FilterBar` |
| **Stores** | 8 | `questStore`, `characterStore`, `battleStore`, `dungeonStore`, `filterStore`, `uiStore` |
| **Models** | 13 | `Quest`, `Character`, `Gear`, `Skill`, `Monster`, `CustomColumn`, `Dungeon`, `StatusEffect` |
| **CSS Modules** | 17 | `combat.css`, `inventory.css`, `modals.css`, `dungeons.css`, `scrivener.css`, `progress.css` |

---

## Feature Status

### ✅ Complete (Phases 1-4)

**Quest Management:**
- Kanban board with custom user-defined columns
- AI quest generation via Gemini
- Template system ("Scrivener's Desk") with gallery and builder
- Folder watchers for auto-quest generation
- Daily notes integration (log completions)
- Recurring quests with dashboard
- Drag-and-drop reordering

**Character & Progression:**
- 7 character classes with unique perks
- 5-tier XP system (L1-40)
- Training mode (Roman numerals I-X)
- Character sheet with stats display
- Progress dashboard (activity history, XP/gold tracking)

**Combat System:**
- Turn-based battles with skills
- 19 base monsters + 20 bosses with signature skills
- Status effects and buffs
- Stamina system with daily cap
- Death penalty and recovery options
- Auto-attack feature

**Gear & Loot:**
- 9 gear slots, 6 tiers (Common → Legendary)
- Armor types (cloth, leather, mail, plate)
- Weapon types (sword, axe, mace, dagger, bow, staff, wand, shield)
- Class restrictions on equipment
- AI-generated set bonuses
- Smelting system (combine 3 → tier upgrade)
- WoW-style comparison tooltips

**Dungeons:**
- Full exploration UI with movement
- 4 tilesets (cave, forest, dungeon, castle)
- Boss encounters at dungeon end
- User-defined custom dungeons
- AI dungeon generation

**Power-Ups & Achievements:**
- 18 power-up triggers (Hat Trick, Blitz, Combo Breaker, etc.)
- 32 default achievements
- Streak tracking with Paladin shield

**UI & Settings:**
- 10-section settings panel with modals for complex settings
- Mobile optimization (column selector, condensed filters)
- 168 unit tests

### 🔮 Phase 5 (Future)

- **Party System:** 2-4 characters fighting together
- **Dual-class unlock** at L25
- **Class change modal**
- **Analytics dashboard** with historical trends
- **Quest dependencies** (skill tree visualization)
- **Tier sprite choices** at level-up

---

## Core Systems

### Custom Kanban Columns
Users can define their own kanban columns instead of fixed statuses:

- **Default columns:** Available → Active → In Progress → Completed
- **Custom columns:** Add, edit, delete, reorder via `ColumnManagerModal`
- **Completion detection:** Columns with `triggersCompletion: true` mark quests as complete
- **Migration:** Deleting a column migrates its quests to first column

**Key files:**
- `src/services/ColumnConfigService.ts` - Central column logic
- `src/modals/ColumnManagerModal.ts` - Settings UI
- `src/utils/columnMigration.ts` - Column deletion handling

**Usage pattern:**
```typescript
const columnService = new ColumnConfigService(plugin.settings);
const isComplete = columnService.isCompletionColumn(quest.status);
const defaultCol = columnService.getDefaultColumn();
```

### Skills System
Pokemon Gen 1 style skills using mana:

- **Skill types:** Damage, heal, buff, debuff, special
- **Loadout:** 4 equipped skills per character
- **Monster skills:** 20 signature boss skills with multi-hit/heal mechanics
- **Turn-based:** Select skill from submenu during battle

**Key files:**
- `src/services/SkillService.ts` - Skill management
- `src/modals/SkillLoadoutModal.ts` - Skill selection UI
- `src/data/skills.ts` - Player skill definitions
- `src/data/monsterSkills.ts` - Monster signature skills

### Template System ("Scrivener's Desk")
Quest templates with folder watchers:

- **Scroll Library:** Template gallery with search and usage stats
- **Scrivener's Quill:** Template builder with placeholder detection
- **Smart Template:** Dynamic form to create quests from templates
- **Folder Watchers:** Auto-create quests when files added to watched folders
- **Daily Note Quests:** Special template type for daily notes

**Key files:**
- `src/services/TemplateService.ts` - Template parsing
- `src/services/FolderWatchService.ts` - Folder watching
- `src/modals/ScrivenersQuillModal.ts` - Template builder

### Data Storage

| Data Type | Storage Method | Why |
|-----------|----------------|-----|
| Character, achievements, inventory, settings | `loadData()`/`saveData()` | Safe from user deletion, syncs with plugin |
| Quests | Markdown files in vault | User-editable, human-readable |

**Quest files are source of truth.** Zustand store is a cache for React rendering.

---

## CSS Modules

> ⚠️ **Never edit `styles.css` directly** - it's auto-generated!

All styles live in `src/styles/` and are bundled at build time via PostCSS.

**Build commands:**
- `npm run css:build` - Build CSS once
- `npm run css:watch` - Watch for changes
- `npm run build` - Full build (includes CSS)

**Which module to edit:**

| Task | Module |
|------|--------|
| Modal styles, forms | `modals.css` |
| Combat, battle view | `combat.css` |
| Dungeon exploration | `dungeons.css` |
| Inventory, tooltips | `inventory.css` |
| Character sheet | `character.css` |
| Template system | `scrivener.css` |
| Progress dashboard | `progress.css` |
| Mobile-specific | `mobile.css` |
| Kanban board | `kanban.css` |
| Power-ups, achievements | `power-ups.css` |
| Animations | `animations.css` |
| CSS variables | `variables.css` |

---

## Character Classes

7 classes with 15% XP bonus for matching quest category + unique perk:

| Class | Focus | Perk |
|-------|-------|------|
| Warrior | Admin/completion | Rage: +5% XP on multi-completions |
| Paladin | Health + Social | Shield: Streak protection (once/week) |
| Technomancer | Dev/creative | Overclock: Reduced cooldowns |
| Scholar | Academic/study | Focus: Bonus XP for long sessions |
| Rogue | Efficiency | Quick Strike: Bonus for fast completions |
| Cleric | Wellness | Restoration: Enhanced rest bonuses |
| Bard | Social | Inspiration: Team bonuses |

---

## Common Pitfalls

### ❌ Don't:
- Put all code in main.ts
- Use synchronous file I/O
- Hardcode column statuses (use ColumnConfigService)
- Run git commands
- Skip testing before deployment
- Edit `styles.css` directly
- Use `&&` in PowerShell commands

### ✅ Do:
- Keep files under 300 lines
- Use TypeScript strict mode
- JSDoc public methods
- Test in dev vault first
- Follow session workflow
- Use ColumnConfigService for status checks
- Check Feature Roadmap v2 before starting work

---

## Testing Values to Verify Before Production

| Setting | Test Value | Production | Location |
|---------|-----------|------------|----------|
| Daily Stamina Cap | 500 | 50 | `CombatService.ts` → `awardStamina()` |
| Bounty Slider Max | 100% | 20% | `settings.ts` → slider limits |
| Set Piece Drop Rate | 40% | 33% | `LootGenerationService.ts` |

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| `docs/development/Feature Roadmap v2.md` | Current phase/priority tracking |
| `docs/development/Phase 4 Implementation Session Log.md` | Active development log |
| `docs/archive/Kanban Implementation Session Log.md` | Custom columns implementation |
| `docs/archive/Settings Redesign Session Log.md` | Settings panel redesign |

---

## Security Essentials

1. **API Keys** - Store in Obsidian settings (not vault files)
2. **Input Sanitization** - Use DOMPurify for AI-generated content
3. **Safe JSON** - Use `safeJson.ts` to prevent prototype pollution
4. **Path Validation** - Validate `linkedTaskFile` paths resolve within vault
