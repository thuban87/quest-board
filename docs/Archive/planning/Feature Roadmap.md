# OLD DOCUMENT - DO NOT USE. New roadmap at Feature Roadmap v2.md

# Quest Board - Feature Roadmap

**Goal:** Complete fully-functional personal plugin in ~2 weeks (1/22 - early Feb)

---

## Phase 1: Core Mechanics
**Timeline:** 1/22 - 1/24 (2-3 days)
**Goal:** Character creation + quest system working with placeholders

| Priority | Feature | Details | Notes |
|----------|---------|---------|-------|
| 1 | **Plugin Scaffold** | TypeScript (OOP!), esbuild, manifest.json, styles.css, .gitignore | Copy from existing plugin, enforce OOP from start |
| 2 | **Data Models** | Quest (with schemaVersion), Character (with spriteVersion), Consumable, QuestStatus, CharacterClass enums | OOP structure, separate concerns |
| 2a | **Zustand Setup** | Install Zustand, create questStore, characterStore, uiStore (persist UI state only) | State management foundation |
| 2b | **Security Utils** | safeJson.ts (prototype pollution), sanitizer.ts (DOMPurify), validator.ts (schema validation), pathValidator.ts | Security from day 1 |
| 3 | **Character Creation Modal** | First launch modal: name, class selection (7 classes), appearance (simple) | Use placeholder visuals (emoji/SVG) |
| 4 | **Character Storage** | Save character to settings, load on plugin init | Include class, appearance, level, XP |
| 5 | **Class System** | 7 classes with XP bonuses, starting perks | Calculate bonuses in XPSystem service |
| 6 | **Task File Linking** | Quests link to markdown files, read tasks, bidirectional confirmation | Test with real task files |
| 7 | **Quest Storage** | Manual quests (markdown), AI quests (JSON) in `Life/Quest Board/` | Test read/write early |
| 7a | **Quest Cache** | In-memory cache with debounced file watcher (300ms), only reload on modify/delete events | Performance optimization |
| 7b | **Quest Validator** | Validate all loaded quests with schema versioning, type coercion for common errors | Prevent crashes from manual edits |
| 8 | **Basic Settings Tab** | API key field, character data, storage location, weekly goal, class bonuses | Editable character appearance |
| 9 | **Kanban Board View** | React component with 4 columns, quest cards, character name in header, use Zustand store | No drag-drop yet |
| 10 | **Quest Card Component** | Display title, category, progress (X/Y tasks), XP earned, use React.memo for performance | Clean, readable design |
| 11 | **Card Actions** | Move between columns (buttons), edit, delete | Context menu or buttons |
| 12 | **Age-Based XP System** | Award XP per task + completion bonus, level 1-30 with age milestones | Class bonuses applied |
| 13 | **Level Calculation** | Calculate level from XP, age-based thresholds, update on XP gain | Display in header/stats |
| 14 | **Character Sheet View** | Display character name, class, level, XP bar, placeholder visual | Switch between Board/Sheet views |
| 15 | **Basic Stats Display** | Total quests, XP, level, streak, training vs real game mode | Simple text + progress bars |
| 16 | **Ribbon Icon** | Add icon to sidebar to open Quest Board | Use existing Obsidian icons |

**Deliverable:** Character creation works, quests link to task files, XP system with class bonuses functional, placeholder visuals in place.

**Test Checklist:**
- [x] First launch shows character creation modal
- [x] Can create character with name, class, appearance
- [x] Character data saves to settings
- [x] Can create quest linked to task markdown file
- [x] Quest reads tasks from linked file
- [x] Quest appears on kanban board
- [x] Move quest through all 4 columns
- [x] Checking off task in file awards XP (with class bonus if applicable) *(Phase 2)*
	- [x] XP increases correctly per task + completion bonus *(Phase 2)*
- [x] Level updates when XP threshold reached *(Phase 2)*
- [x] Character sheet displays name, class, level, XP bar
- [x] Placeholder character visual shows (emoji/SVG)
- [x] Stats display accurate numbers
- [x] Plugin survives Obsidian reload
- [x] Character data persists across reloads

---

## Phase 2: Polish & Training Mode
**Timeline:** 1/25 - 1/26 (1-2 days)
**Goal:** UI/UX polish, training mode, better placeholders, rewarding experience

| Priority | Feature | Details | Notes |
|----------|---------|---------|-------|
| 17 | **XP Wiring & Task Display** ✅ | Task completion → XP awards, task checkboxes on cards, class bonuses | `useXPAward` hook, `toggleTaskInFile` |
| 18 | ~~Enhanced Placeholder Visuals~~ **UI Redesign** ✅ | Full-page Kanban + Focused Sidebar views, collapsible columns/cards | Replaced old App.tsx/KanbanBoard.tsx |
| 18.5 | **Section Parsing & Task Display** ✅ | `##`/`###` as Mini Objectives, collapsible sections, hide completed tasks, visibleTasksPerSection, view sync, sidebar scroll | `taskSectionsStore`, `readTasksWithSections()` |
| 19 | **Quest Creation Modal** ✅ | Modal to create quest files with frontmatter: name, category (dropdown), priority, linkedTaskFile (Browse), XP values, Description/Objectives/Rewards sections | `CreateQuestModal.ts`, FuzzySuggestModal |
| 20 | **Drag-and-Drop** ✅ | Enable dragging cards between columns | @dnd-kit/core, DroppableColumn, DraggableCard |
| 21 | **Character Sheet Layout** ✅ | Gear slots, sprite folder setting, vault.getResourcePath() | spriteFolder setting, emoji fallback |
| 22 | **XP Progress Bar** ✅ | Animated fill bar showing XP toward next level | 0.5s ease-out CSS transition |
| 23 | **Level-Up Celebration** ✅ | Confetti, modal, XP gain animation on level-up | LevelUpModal with confetti animation |
| 24 | **Weekly Streak Tracker** ✅ | Count consecutive days with quest completions, Paladin shield protection, checkStreakOnLoad | `StreakService.ts`, streak fields in Character |
| 24.5 | **SidebarQuests & FullKanban Consolidation** ✅ | Major refactor eliminating ~150 lines of duplicated code between components. Created shared hooks and configs. **New file locations:** XP progress → `XPSystem.ts:getXPProgressForCharacter()`, character saving → `useSaveCharacter.ts`, DnD wrappers → `DnDWrappers.tsx`, DnD logic → `useDndQuests.ts`, collapse state → `useCollapsedItems.ts`, status config → `questStatusConfig.ts` (SIDEBAR_STATUSES, KANBAN_STATUSES). Quest loading → `useQuestLoader.ts`, quest actions → `useQuestActions.ts`+`QuestActionsService.ts` | Architecture refactor for maintainability |
| 25 | **Power-Ups Display** ⚡ | Show active class perk + other bonuses. **Core loop complete:** `PowerUpService.ts`, triggers, buff display in CharacterSheet, XP multipliers wired into `calculateXPWithBonus`. **Remaining:** More triggers, status bar indicator | "Task Slayer: +5% XP" |
| 26 | **Training Mode** ✅ | Roman numeral levels (I-X), separate XP pool, 100 XP per level, graduation to Level 1 | 10 training levels, LevelUpModal graduation |
| 27 | **Quest Visibility Controls** ✅ | Show next 3-4 tasks, hide future tasks with hints | "Choose your adventure" feel, `visibleTasks` setting |
| 28 | **Achievement System** ✅ | Track and display achievements, unlock popups, hub modal | 32 defaults, AchievementHubModal, level/category triggers, confetti |
| 29 | **Gear Slot UI** ✅ | Display empty gear slots on character sheet | Outlines for weapon, armor, accessories |
| 30 | **Sprite Renderer Service** ✅ | Tier-based sprite folders (tier1-5), animated GIF display, auto-switch on level up | 5 visual tiers, `getLevelTier()` |
| 31 | **Command Menu & Settings** ✅ | Consolidated command menu modal (`QuestBoardCommandMenu.ts`), folder exclusion settings, template configuration | 5 categories, excluded folders hide from Kanban |

| 33 | **Filter/Search** ✅ | Filter/Sort by category, priority, tags, type, date, search text. Dynamic quest types from folders. Intra-column drag reorder. Dual file links on cards. | `filterStore.ts`, `FilterBar.tsx`, `useFilteredQuests.ts`, dynamic `questType` |

**Deliverable:** Plugin feels polished, rewarding, visually engaging. Training mode works. Placeholder visuals improved.

**Test Checklist:**
- [x] Drag quest from Available to Completed (via buttons or drag-drop)
- [x] XP bar animates smoothly (0.5s CSS transition)
- [x] Level-up celebration appears with class-themed message and confetti
- [ ] Character Sheet shows accurate stats with better placeholder visual
- [x] Achievements unlock correctly (32 defaults, category triggers, unlock popup with confetti)
- [x] Training mode: Roman numerals I-X, separate XP (75/level), graduation works
- [x] Quest visibility: Next 3-4 tasks shown, future hidden
- [x] Gear slots displayed (empty outlines)
- [x] Class perk displayed in power-ups section
- [x] Filter works correctly (category, priority, tags, type, date, search)

---

## Phase 3: AI Integration & Pixel Art
**Timeline:** 1/27 - 1/29 (2-3 days)
**Goal:** Sprite generation, visual upgrade, AI quest creation, ecosystem integration

| Priority | Feature | Details | Notes |
|----------|---------|---------|-------|
| 34 | **API Key in Settings** | Gemini API key stored in plugin settings (standard for AI plugins) | User pastes key in Settings tab |
| 35 | **Sprite Generation (Whisk/Veo)** | Generate ~51 sprites for Paladin class + shared assets | Paladin only (Brad's class) + icon packs for items |
| 36 | **Sprite Asset Organization** | Bundle sprites with plugin in assets folder | 32×32 px PNG files |
| 37 | **Sprite Layering System** | Client-side Canvas-based sprite assembly | Base + skin + hair + accessories + gear |
| 38 | **Replace Placeholder Visuals** | Swap all placeholders with real pixel art | Character sheet, board header, everywhere |
| 39 | **Level Tier Transitions** ✅ | Animate sprite change when crossing tier boundary | Levels 5→6, 12→13, 17→18, 24→25 |
| 39.5 | **Combat Balance Simulation** ✅ | ~45 iterations to validate balance. Monster power curve, tier multipliers, HP/damage formulas tuned for 40-80% overworld win rate. Includes L30 "Welcome to your 30s" hidden buff. | Implementation plan: `docs/rpg-dev-aspects/Combat Balance Simulation Implementation Plan.md` |
| 40 | **Gear Visual System** | Display equipped gear on character sprite | Weapon, armor, accessories overlay |
| 41 | **Dual-Class Unlock** | At Level 25, unlock secondary class selection | Modal, XP bonus, visual blending |
| 42 | **Dual-Class Visual** | Blend sprites from both classes | Secondary class element added to sprite |
| 43 | **Class Change System** | Command to change class, costs XP formula | Modal showing cost, confirmation |
| 44 | **AI Quest Generation (Gemini)** | Modal for quest parameters, API call using Settings key, sanitize output with DOMPurify, preview, save | User edits title/description, masked details |
| 45 | **Quest Generation Preview** | Show generated quest with hints, not full details, sanitize all text fields | "Contains X tasks, Y rewards" |
| 46 | **Progressive Quest Reveal** | Hide future milestones/tasks until reached | Update as quest progresses |
| 47 | **Enrage System** | EnrageSystem service: check quests in progress > 7 days, apply XP penalty | Red glow, warning notices |
| 48 | **Loot System** ✅| LootSystem service: roll for consumables on quest/task complete | Loot drop modal, inventory display |
| 49 | **Consumable Usage** ✅| Use consumable items (Pomodoro timer, restore streak, skip task, XP boost) | Apply effects to character/quests |
| 50 | **Tavern View** | TavernView component: cozy rest screen with sitting character sprite | Manual toggle or weekend auto-enable |
| 51 | **"Take Quest" Button** | Pick random Available quest, open details | Prominent button in header |
| 52 | **Weekly Sprint View** | Dedicated view showing weekly progress with character sprite | Switch Board/Sheet/Sprint |
| 53 | **Sprint Progress Bars** | Visual bars per category showing goal vs actual | Class-colored bars |
| 54 | **Daily Note Integration** | Append completed quests to daily note | Configurable template |
| 55 | **Chronos Integration** | "Schedule Quest Block" button creates calendar event | Check if Chronos installed |
| 56 | **Switchboard Integration** | Export "Quest Mode" line configuration | Check if Switchboard installed |
| 57 | **Export Stats** | Generate formatted text for sharing | Include character name/class |
| 58 | **Advanced Settings** | Character re-customization, API key management, all other settings | Full control panel |
| 59 | **Category Management** | Add/edit/delete custom categories with class bonuses | Dynamic system |
| 60 | **Import/Export** | Export all quests and character data, import from backup | Safety net |
| 61 | **React UI Polish** | Smooth animations, transitions, hover effects, React.memo on all cards/columns | Use CSS transitions |
| 62 | **Theme Compatibility** | Test with popular themes, ensure class-based colors readable | Dark/light mode support |

**Deliverable:** Full visual experience with pixel art, AI quest generation, dual-class system, ecosystem integration.

**Test Checklist:**
- [ ] API key in Settings works correctly
- [ ] ~51 sprites generated for Paladin class + shared assets (Whisk/Veo)
- [ ] Sprite layering works correctly
- [ ] Sprite caching prevents redundant composition
- [ ] Character sprite updates correctly with customization changes
- [x] Level tier transitions animate smoothly
- [ ] Equipped gear displays on character sprite
- [ ] Dual-class unlocks at Level 25
- [ ] Dual-class visual blending works
- [ ] Class change costs correct XP amount
- [ ] AI quest generation creates valid quests with sanitized content
- [ ] AI quest preview masks details appropriately
- [ ] Progressive reveal works during quest
- [ ] Enrage system activates at 7 days, visual indicators work
- [ ] Enrage XP penalty calculates correctly
- [ ] Loot drops on quest/task completion
- [ ] Loot rarity distribution correct (common > rare > epic)
- [ ] Consumables can be used from inventory
- [ ] Consumable effects apply correctly (Pomodoro, streak restore, etc.)
- [ ] Tavern view displays with sitting sprite
- [ ] Tavern view toggle works
- [ ] "Take Quest" opens quest and linked file
- [ ] Weekly Sprint View shows character sprite
- [ ] Daily note integration works
- [ ] Chronos creates calendar events
- [ ] Switchboard config exports
- [ ] Stats export includes character info
- [ ] Character re-customization updates sprite and cache
- [ ] Import/Export preserves character + quests + inventory
- [ ] Quest validation catches common errors
- [ ] Input sanitization prevents XSS
- [ ] React memoization prevents unnecessary re-renders
- [ ] File I/O cache only reloads on actual file changes
- [ ] UI looks good in dark and light themes (61: React UI Polish)
- [ ] Class-based color theming works (62: Theme Compatibility)

---

## ⚠️ Testing Items to Switch Back Before Launch

These values were adjusted for development/testing and should be reverted before release:

| Item | Current Value | Production Value | Location |
|------|---------------|------------------|----------|
| **Daily Stamina Cap** | 500 | 50 | `characterStore.ts` → `awardStamina()` → `MAX_DAILY` |
| **Bounty Slider Max** | 100% | 20% | `settings.ts` → Bounty Chance slider → `.setLimits(0, 100, 5)` → change to `.setLimits(0, 20, 1)` |
| **Set Piece Drop Rate** | 40% | 33% | `LootGenerationService.ts` → set drop probability |

---

## Technical Debt / Risks

**Performance:**
- Rendering 100+ quests might lag → Implement virtualization if needed
- Frequent file I/O could slow down → Cache in memory, batch writes

**Data Integrity:**
- Concurrent edits from multiple devices → Add conflict resolution
- Corrupted JSON files → Add validation and error handling

**Theme Conflicts:**
- Custom CSS might break with some themes → Use CSS variables, test popular themes

**Integration Failures:**
- Chronos/Switchboard might not be installed → Graceful fallbacks, hide features if unavailable

**Accessibility:**
- Keyboard navigation → Ensure all actions accessible without mouse
- Screen readers → Test with NVDA/JAWS

### ✅ Completed Technical Debt (2026-01-21)

| Issue | Solution | Status |
|-------|----------|--------|
| **#1: "Reload Everything" Time Bomb** | Implemented `watchQuestFolderGranular` with per-file callbacks. Uses `loadSingleQuest` + `upsertQuest` for granular updates. | ✅ Fixed |
| **#2: Race Condition Hack** | Replaced boolean `saveLockRef` with `Set<string>` `pendingSavesRef` for per-quest save tracking. | ✅ Fixed |
| **#4: View Logic Leak (Sprite Paths)** | Extracted to `useCharacterSprite.ts` hook | ✅ Fixed |
| **#5: Quest ID Sanitization** | Added `sanitizeQuestId()` in `QuestService.ts` | ✅ Fixed |
| **Linked File Sync Bug** | Added secondary file watcher for linked task files via `linkedFileToQuestRef` Map | ✅ Fixed |
| **XP Award Missing in Kanban** | Added missing `useXPAward` hook call to `FullKanban.tsx` | ✅ Fixed |

---

## Future Enhancements (Post-Phase 3)

### High Priority: Skill Trees
- Quest dependencies (unlock quests by completing prerequisites)
- Visual tree/graph showing locked/unlocked paths
- Example: "Learn React Basics" unlocks "Build Quest Board" + "Build Portfolio Site"
- Strategic planning layer for quest selection
- Encourages long-term goal setting

### Other Ideas
- ~~Recurring quests (daily/weekly patterns)~~ ✅ **COMPLETED 2026-01-20**
- ~~Boss battles (multi-stage epic milestones with team mechanics)~~ → See RPG Game Mechanics below
- Party system (shared quest boards with friends/family)
- Quest templates (save and reuse complex quest structures)
- Advanced AI (Claude API for generating longer, more complex quests)
- Mobile companion app
- Analytics dashboard (historical trends, completion rates, XP over time)
- Equipment upgrade system (improve gear through quests)
- Quest voting system (community-created quests)

### Gear System Enhancements (Deferred)

| Feature | Description | Why Deferred |
|---------|-------------|--------------|
| **Tag-Based Loot Tables** | Use task tags (#bugfix → defensive gear, #creative → wisdom weapons) to influence loot drops. Encourages better Obsidian organization to "target farm" stats. | Adds parsing complexity. Folder-based quest types already provide categorization. Good stretch goal after MVP. |
| **Socketing with Obsidian Files** | "Socket" a markdown note into gear (e.g., `[[My Core Values]]` → Chestpiece). If you edit that file weekly, the item gets +10% stats. Ties important notes to character power. | Very meta/complex. Requires file watching + state management. Cool concept but could feel forced. Revisit after core gear system is stable. |

### RPG Game Mechanics (Combat System)

**Vision:** Turn productivity into an actual game with visual combat, monsters, and boss battles.

#### Core Combat Concept
- **Battle Arena**: Full-page or sidebar view that appears during combat encounters
- **Turn-based system**: Player and enemies take turns attacking
- **Task-as-power mechanic**: Completing tasks between turns multiplies your attack power
  - Base attack = character stats (from level, class, gear)
  - Task multiplier = `1 + (tasksCompleted * 0.25)` or similar formula
  - Example: Complete 3 tasks → your next attack does 175% damage

#### Monster Encounters
- **Random encounters**: Trigger when starting certain quests or at intervals
- **Enemy groups**: "3 Goblins" with combined HP pool
- **Difficulty scaling**: Based on player level and quest category
- **Rewards**: XP, gold, gear drops on victory
- **Elite Overworld Mobs** ✅ (2026-01-26): 15% chance at L5+ for random fights, 30% for bounties. Pre-fight modal with flee option. Red glow animation, random name prefixes.

#### Boss Fights
- **Quest-based bosses**: Designate a quest as a "Boss Fight" when it meets criteria:
  - Minimum 10 tasks
  - At least 2 nested/sub-tasks
  - Optional: specific category or priority
- **Boss assignment**: Quest complexity maps to boss tier/type
- **Extended combat**: Boss has more HP, special attacks, multiple phases
- **Same multiplier mechanic**: Complete quest tasks → stronger attacks against boss

#### Character Stats ✅ (Completed 2026-01-20)
- **Primary Stats (STR/INT/WIS/CON/DEX/CHA)**: Base from level + class-specific bonuses
- **Derived Stats (HP/Mana/Attack/Defense/Speed/Crit)**: Calculated from primary stats
- **XP-based growth**: 100 XP per category = +1 to mapped stat
- **Level cap**: Max bonus = Level × 2 per stat
- **Custom mapping UI**: Settings page for user-defined category→stat mappings

#### Gear System Integration
- Equipment earned from quests provides stat bonuses
- Gear slots: Weapon (attack), Armor (defense), Accessory (special)
- Visual: Equipped gear shows on character sprite

#### Implementation Architecture
```
BattleService.ts       - Combat logic, damage formulas, turn management
EnemyService.ts        - Monster definitions, spawn logic, difficulty scaling
BattleView.tsx         - Full-page combat arena with sprites and animations
BattleState (Zustand)  - HP, turn state, active buffs, task multiplier
enemies.json           - Monster stats, boss definitions, loot tables
```

#### UI Components
- Health bars (player + enemy)
- Attack/Defend/Item action buttons
- Task completion indicator ("Complete a task to power up!")
- Animated sprite combat (attack animations, damage numbers)
- Victory/Defeat screens with rewards

#### Why This Works
- **Productivity tied to progress**: Can't just grind combat, must complete real tasks
- **Immediate gratification**: See task completion translate to damage instantly
- **Optional depth**: Can fight without tasks (slower) or power up with them
- **Portfolio showcase**: Unique game mechanic that demonstrates full-stack skills

---

## Post-Phase 3 Tasks (Personal Use Iteration)

### Week 1 (1/29 - 2/5)
- [ ] Dog-food the plugin (use it daily for job hunting)
- [ ] Fix critical bugs
- [ ] Gather feedback from own usage
- [ ] Write basic README

### Week 2-3 (2/5 - 2/15)
- [ ] Refactor all plugins (Quest Board + others)
- [ ] Break up monolithic files
- [ ] Improve OOP architecture
- [ ] Add JSDoc comments

### Week 4+ (After 2/15)
- [ ] Add Quest Board to BRAT for beta testing
- [ ] Share on Obsidian Discord for feedback
- [ ] Create demo video/GIF
- [ ] Write comprehensive documentation
- [ ] Link GitHub repo in portfolio

---

## Development Totals

**Phase 1:** ~16-24 hours (2-3 days of focused work)
**Phase 2:** ~8-16 hours (1-2 days of focused work)
**Phase 3:** ~16-24 hours (2-3 days of focused work)

**Total MVP:** ~40-64 hours across 7 days

**Assumptions:**
- Using Claude Code for rapid development
- Leveraging existing plugin templates
- React knowledge from previous plugins
- No major architectural surprises

---

## Success Criteria

**By 1/29, Quest Board must:**
1. ✅ Have all 3 phases implemented
2. ✅ Be usable for job hunting immediately
3. ✅ Have no critical bugs
4. ✅ Feel rewarding to use (XP, victories, achievements)
5. ✅ Integrate with Chronos and Switchboard
6. ✅ Be fast (board loads <1 second with 50 quests)
7. ✅ Be intuitive (Brad's dad could use it without tutorial)

**If we hit these, it's a success and Brad can start using it while building the rest of his portfolio.**

---

**Last Updated:** 2026-01-27
