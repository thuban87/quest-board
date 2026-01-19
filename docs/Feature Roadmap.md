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
- [ ] Checking off task in file awards XP (with class bonus if applicable) *(Phase 2)*
- [ ] XP increases correctly per task + completion bonus *(Phase 2)*
- [ ] Level updates when XP threshold reached *(Phase 2)*
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
| 17 | **Drag-and-Drop** | Enable dragging cards between columns | Use React DnD or similar |
| 18 | **Enhanced Placeholder Visuals** | Better SVG character representations, class-colored shapes | Still placeholders, but nicer |
| 19 | **Character Sheet Layout** | Finalize hybrid layout: character visual left, stats right, gear slots below | Placeholder visual in place |
| 20 | **XP Progress Bar** | Animated fill bar showing XP toward next level | Satisfying fill animation |
| 21 | **Level-Up Celebration** | Confetti, modal, XP gain animation on level-up | Class-themed messages |
| 22 | **Weekly Streak Tracker** | Count consecutive days with quest completions | Display prominently |
| 23 | **Power-Ups Display** | Show active class perk + other bonuses from settings | "Task Slayer: +5% XP" |
| 24 | **Training Mode** | Roman numeral levels (I-IV), separate XP pool, graduation to Level 1 | Test mechanics safely |
| 25 | **Quest Visibility Controls** | Show next 3-4 tasks, hide future tasks with hints | "Choose your adventure" feel |
| 26 | **Achievement System** | Track and display achievements (placeholder badges) | First Quest, Level 10, etc. |
| 27 | **Gear Slot UI** | Display empty gear slots on character sheet | Outlines for weapon, armor, accessories |
| 28 | **Sprite Renderer Service** | SpriteRenderer class with version-based caching (spriteVersion → dataURL) | Only recomposite when character changes |
| 29 | **React UI Polish** | Smooth animations, transitions, hover effects, React.memo on all cards/columns | Use CSS transitions |
| 30 | **Theme Compatibility** | Test with popular themes, ensure class-based colors readable | Dark/light mode support |
| 31 | **Filter/Search** | Filter quests by category, priority, or search text | Add to board header |

**Deliverable:** Plugin feels polished, rewarding, visually engaging. Training mode works. Placeholder visuals improved.

**Test Checklist:**
- [ ] Drag quest from Available to Completed
- [ ] XP bar animates smoothly
- [ ] Level-up celebration appears with class-themed message
- [ ] Character Sheet shows accurate stats with better placeholder visual
- [ ] Achievements unlock correctly (placeholder badges)
- [ ] Training mode: Roman numerals, separate XP, graduation works
- [ ] Quest visibility: Next 3-4 tasks shown, future hidden
- [ ] Gear slots displayed (empty outlines)
- [ ] Class perk displayed in power-ups section
- [ ] Filter works correctly
- [ ] UI looks good in dark and light themes
- [ ] Class-based color theming works

---

## Phase 3: AI Integration & Pixel Art
**Timeline:** 1/27 - 1/29 (2-3 days)
**Goal:** Sprite generation, visual upgrade, AI quest creation, ecosystem integration

| Priority | Feature | Details | Notes |
|----------|---------|---------|-------|
| 32 | **API Key in Settings** | Gemini API key stored in plugin settings (standard for AI plugins) | User pastes key in Settings tab |
| 33 | **Sprite Generation (Veo)** | Generate ~100-120 pixel art sprites using Google Veo | 7 classes × 5 tiers + customization + gear + consumables |
| 34 | **Sprite Asset Organization** | Bundle sprites with plugin in assets folder | 16×16 or 32×32 px PNG files |
| 35 | **Sprite Layering System** | Client-side Canvas-based sprite assembly | Base + skin + hair + accessories + gear |
| 34 | **Replace Placeholder Visuals** | Swap all placeholders with real pixel art | Character sheet, board header, everywhere |
| 35 | **Level Tier Transitions** | Animate sprite change when crossing tier boundary | Levels 5→6, 12→13, 17→18, 24→25 |
| 36 | **Gear Visual System** | Display equipped gear on character sprite | Weapon, armor, accessories overlay |
| 37 | **Dual-Class Unlock** | At Level 25, unlock secondary class selection | Modal, XP bonus, visual blending |
| 38 | **Dual-Class Visual** | Blend sprites from both classes | Secondary class element added to sprite |
| 39 | **Class Change System** | Command to change class, costs XP formula | Modal showing cost, confirmation |
| 40 | **AI Quest Generation (Gemini)** | Modal for quest parameters, API call using Settings key, sanitize output with DOMPurify, preview, save | User edits title/description, masked details |
| 41 | **Quest Generation Preview** | Show generated quest with hints, not full details, sanitize all text fields | "Contains X tasks, Y rewards" |
| 42 | **Progressive Quest Reveal** | Hide future milestones/tasks until reached | Update as quest progresses |
| 43 | **Enrage System** | EnrageSystem service: check quests in progress > 7 days, apply XP penalty | Red glow, warning notices |
| 44 | **Loot System** | LootSystem service: roll for consumables on quest/task complete | Loot drop modal, inventory display |
| 45 | **Consumable Usage** | Use consumable items (Pomodoro timer, restore streak, skip task, XP boost) | Apply effects to character/quests |
| 46 | **Tavern View** | TavernView component: cozy rest screen with sitting character sprite | Manual toggle or weekend auto-enable |
| 47 | **"Take Quest" Button** | Pick random Available quest, open details | Prominent button in header |
| 48 | **Weekly Sprint View** | Dedicated view showing weekly progress with character sprite | Switch Board/Sheet/Sprint |
| 49 | **Sprint Progress Bars** | Visual bars per category showing goal vs actual | Class-colored bars |
| 50 | **Daily Note Integration** | Append completed quests to daily note | Configurable template |
| 51 | **Chronos Integration** | "Schedule Quest Block" button creates calendar event | Check if Chronos installed |
| 52 | **Switchboard Integration** | Export "Quest Mode" line configuration | Check if Switchboard installed |
| 53 | **Export Stats** | Generate formatted text for sharing | Include character name/class |
| 54 | **Advanced Settings** | Character re-customization, API key management, all other settings | Full control panel |
| 55 | **Category Management** | Add/edit/delete custom categories with class bonuses | Dynamic system |
| 56 | **Import/Export** | Export all quests and character data, import from backup | Safety net |

**Deliverable:** Full visual experience with pixel art, AI quest generation, dual-class system, ecosystem integration.

**Test Checklist:**
- [ ] API key in Settings works correctly
- [ ] All ~100-120 sprites generated and bundled (includes consumables)
- [ ] Sprite layering works correctly
- [ ] Sprite caching prevents redundant composition
- [ ] Character sprite updates correctly with customization changes
- [ ] Level tier transitions animate smoothly
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

---

## Future Enhancements (Post-Phase 3)

### High Priority: Skill Trees
- Quest dependencies (unlock quests by completing prerequisites)
- Visual tree/graph showing locked/unlocked paths
- Example: "Learn React Basics" unlocks "Build Quest Board" + "Build Portfolio Site"
- Strategic planning layer for quest selection
- Encourages long-term goal setting

### Other Ideas
- Recurring quests (daily/weekly patterns)
- Boss battles (multi-stage epic milestones with team mechanics)
- Party system (shared quest boards with friends/family)
- Quest templates (save and reuse complex quest structures)
- Advanced AI (Claude API for generating longer, more complex quests)
- Mobile companion app
- Analytics dashboard (historical trends, completion rates, XP over time)
- Equipment upgrade system (improve gear through quests)
- Quest voting system (community-created quests)

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

**Last Updated:** 2026-01-19
