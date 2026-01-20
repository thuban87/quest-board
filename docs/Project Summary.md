# Quest Board - Project Summary

**Status:** Active Development (Phase 2 complete, Phase 3 in progress)
**Development Started:** 2026-01-22
**Type:** Obsidian Plugin (React-based)
**Purpose:** Gamified task/project tracker with RPG mechanics for ADHD brains
**Primary Use:** Personal power tool (public release potential for far future)

---

## Vision

Quest Board transforms any goal-oriented workflow (job hunting, household chores, work projects, etc.) into an RPG-style quest system. Users gain XP, level up, unlock achievements, and visualize progress through an intuitive kanban board interface.

**The Problem It Solves:**
- Traditional task managers don't provide dopamine hits for ADHD brains
- Low friction capture is essential but often missing
- Progress feels invisible when grinding through applications/tasks
- Motivation dies without gamification and external accountability

**The Solution:**
- RPG-style progression system (XP, levels, achievements)
- Visual kanban board that makes progress tangible
- Quick capture via command palette (under 30 seconds)
- Customizable for ANY workflow (not just job hunting)
- Built-in accountability features (stats export, reminders)

---

## Quest Data Storage

**Location:** `Life/Quest Board/`

```
Life/Quest Board/
├── quests/
│   ├── main/              # Main questline quests
│   ├── training/          # Training mode (Roman numerals)
│   └── ai-generated/      # AI-created quests
└── templates/             # Reusable quest templates
```

**Plugin State Storage:**
- Character data (XP, level, achievements, inventory) is stored via Obsidian's `loadData()`/`saveData()` API
- This data lives in `.obsidian/plugins/quest-board/data.json`
- Quest files remain in visible vault folders for easy editing

**File Formats:**
- **Manual Quests:** Markdown with frontmatter (easy to read/edit)
- **AI-Generated Quests:** JSON files (structured, parseable)
- **Both:** Manually editable via File Explorer

---

## Main Questline

The main questline represents Brad's journey to "catch up" to functional adulthood. Each level = a year of life (1-30), with XP thresholds tied to age milestones (12-13, 18, 21, 25, 30, etc.).

**Core Quests:**
1. **The Bureaucratic Labyrinth** - Admin tasks (`System/Task Management/To-Dos/Admin.md`)
2. **The Provisioning Expedition** - Shopping & meal planning (`Life/Household/Shopping Lists/`)
3. **The Academic Ascension** - School assignments & study (`Career/School/`)
4. **The Wellness Campaign** - Health, fitness, medical (`Health/`)
5. **The Freelance Crusade** - BBAB client work (`BBAB/`)
6. **The Career Quest** - Job hunting (`Career/Jobs/`)
7. **The Social Circuit** - Dating, friends, events (`Life/Social/`)

---

## XP Model (World of Warcraft Style)

**Small rewards throughout, bonus at completion:**
- **Each task completed:** 2-10 XP (like killing mobs in WoW)
- **Quest completion bonus:** 20-100 XP (like turning in the quest)
- **Milestones/Boss Fights:** 50-200 XP (major achievements)

**Example: 10-task quest**
- 10 tasks × 5 XP = 50 XP during quest
- Completion bonus = 30 XP
- Total: 80 XP

**Age-Based Level Scaling:**
- Levels 1-2: 200 XP each (early childhood, easy)
- Levels 3-4: 350 XP each (elementary years)
- Level 5: 550 XP (things get real)
- Level 10: 800 XP (double digits milestone)
- Levels 12-13: 600 XP each (middle school transition)
- Level 18: 1000 XP (adulthood)
- Level 21: 900 XP (legal adult)
- Level 25: 1200 XP (quarter century)
- Level 30: 1500 XP (the big 3-0, full adult responsibility)

**Goal:** Reach Level 30 = symbolically "caught up" to current age with full ADHD support systems in place.

---

## Character Creation & Customization

**First Launch Experience:** Create your character before entering the game.

### Classes (7 Options)

Each class provides **15% XP bonus** to specific quest types and unique starting perk:

1. **Warrior** (Executor/Doer)
   - Bonus: Admin/completion quests
   - Perk: "Task Slayer" (completion streak bonus)
   - Visual: Sword, armor, aggressive stance

2. **Paladin** (Defender/Support)
   - Bonus: Health AND Social quests (balanced)
   - Perk: "Shield of Discipline" (1 missed day doesn't break streak)
   - Visual: Shield, holy armor, defensive stance

3. **Technomancer** (Builder/Creator)
   - Bonus: Development/creative quests
   - Perk: "Code Warrior" (productivity bonus)
   - Visual: Tech gear, laptop accessory, modern style

4. **Scholar** (Learner/Academic)
   - Bonus: Academic/study quests
   - Perk: "Knowledge Seeker" (research bonus)
   - Visual: Books, robes, scholarly accessories

5. **Rogue** (Strategist/Efficient)
   - Bonus: Quick wins, efficiency-focused quests
   - Perk: "Clever Shortcut" (bonus XP for completing under time estimate)
   - Visual: Light armor, daggers, agile stance

6. **Cleric** (Healer/Wellness)
   - Bonus: Health/wellness quests
   - Perk: "Self-Care Aura" (wellness streak bonus)
   - Visual: Staff, healing symbols, supportive gear

7. **Bard** (Social/Charisma)
   - Bonus: Social/dating quests
   - Perk: "Charming Presence" (social battery recharge)
   - Visual: Musical instrument, stylish outfit

### Dual-Class System

**Unlocked at Level 25:**
- Choose second class
- Primary class: 15% XP bonus (unchanged)
- Secondary class: 7.5% XP bonus (half value)
- Visual: Character sprite shows elements of both classes
- Achievement: "Multiclass Mastery"

### Class Change

**Can change class after creation:**
- Costs XP: `currentLevel × 100`
  - Level 10 = 1,000 XP
  - Level 25 = 2,500 XP
- Meaningful cost prevents trivial switching
- Useful if playstyle changes over time

### Customization Options

**Simple presets (3-4 per slot):**
- **Skin Tone:** Light, Medium, Tan, Dark
- **Hair Style:** Short, Medium, Long, Bald
- **Hair Color:** Brown, Black, Blonde, Red
- **Accessories:** None, Glasses, Hat, Headphones

**Outfit Colors:**
- Primary color (class-based default, customizable)
- Secondary color (accent)

### Character Evolution

**Sprite changes with level tiers:**
- **Levels 1-5:** Basic gear, learning phase
- **Levels 6-12:** Improved gear, growing confidence
- **Levels 13-17:** Teen/young adult equipment
- **Levels 18-24:** Adult professional gear
- **Levels 25-30:** Master-tier equipment, all slots unlocked

**Each tier shows visual progression** - better armor, more accessories, confident posture.

### Visual Implementation

**Phase 1-2: Placeholder Visuals**
- Colored shapes or emoji representing classes
- Text-based stats
- Simple progress bars

**Phase 3: Pixel Art Sprites (Veo Generation)**
- 7 classes × 5 level tiers = 35 base sprites (16×16 or 32×32 px)
- Customization layers: hair, skin tone, accessories
- Layered sprite system (client-side assembly)
- Equipped gear overlays

**No API costs during use** - sprites generated once with Veo, bundled with plugin.

---

## Training Mode

**Purpose:** Test mechanics without affecting real progression.

**Levels:** Roman numerals (I, II, III, IV)
**XP Pool:** Separate from main game
**Quest Types:** Mix of trivial real tasks (laundry, make dinner, dog park) and made-up tutorial tasks
**Graduation:** After completing Training IV, real game starts at Level 1

---

## Quest Visibility & Progressive Reveal

**What you see:**
- Next 3-4 tasks/milestones in current quest
- Current quest description and goal
- Total XP estimate (not exact breakdown)
- Hint about hidden rewards ("Contains 2 gear rewards, 1 achievement")

**What's hidden:**
- Tasks beyond next 3-4
- Exact XP values for future milestones
- Boss fight triggers (surprise challenges)
- Specific reward details until unlocked

**Goal:** "Choose your own adventure" feel - you know the general path but not every detail.

---

## Core Features

### Phase 1: Core Mechanics
**Timeline:** 1/22 - 1/24 (2-3 days)

1. **Character Creation (First Launch)**
   - Modal on first plugin launch
   - Name input
   - Class selection (7 classes with descriptions)
   - Simple appearance customization (3-4 presets per slot)
   - Save to settings
   - **Use placeholder visuals** (colored shapes, emoji, or simple icons)

2. **Task File Linking (Bidirectional)**
   - Quests link to existing markdown task files
   - Task files declare their quest in frontmatter
   - Plugin reads tasks from linked files
   - XP awarded as tasks are checked off

3. **Class Bonus System**
   - Calculate XP bonuses based on selected class
   - Apply 15% bonus to matching quest categories
   - Display class name and bonus in UI

4. **Kanban Board View**
   - Four columns: Available → In Progress → Active → Completed
   - Card displays: Title, category, progress (X/Y tasks), XP earned
   - Filter by category/priority
   - Next 3-4 tasks visible per quest
   - Character name displayed in header

5. **Quick Capture Modal**
   - Command: "Add New Quest"
   - Manual quest creation (markdown with frontmatter)
   - Link to existing task file OR create new quest structure
   - Quest name suggestions

6. **Basic Stats Dashboard / Character Sheet**
   - Character name and class prominently displayed
   - **Placeholder character visual** (colored circle with class emoji)
   - Current Level (Roman numerals for Training, numbers for real game)
   - Total XP with progress bar to next level
   - Quests completed this week
   - Training mode vs. Real game status
   - Class bonus indicator

7. **Age-Based XP System**
   - Level 1-30 progression (catching up to adulthood)
   - XP thresholds tied to life milestones
   - WoW-style: XP per task + completion bonus
   - Class bonuses applied to XP calculations
   - Training mode XP separate from main game

8. **File-Based Storage**
   - Character data in settings
   - Manual quests: Markdown in `Life/Quest Board/quests/main/`
   - AI quests: JSON in `Life/Quest Board/quests/ai-generated/`
   - Training quests: `Life/Quest Board/quests/training/`
   - All files manually editable

### Phase 2: The Polish & Training Mode
**Timeline:** 1/25 - 1/26 (1-2 days)

1. **Drag-and-Drop**
   - Smooth card movement between columns
   - Visual feedback on hover
   - Auto-save on drop

2. **Enhanced Character Sheet View**
   - RPG-style stat display layout
   - **Improved placeholder visuals** (better SVG shapes or simple illustrations)
   - Character name prominently displayed
   - Class and level shown
   - Current level and XP bar (animated)
   - Training Mode vs. Real Game indicator
   - Active "power-ups" (bonuses from settings)
   - Weekly streak tracker
   - Quest completion history
   - Achievement badge placeholders

3. **Victory Screens**
   - Confetti animation on milestone completion
   - Level-up celebrations (show character name + new level)
   - Achievement unlocked notifications
   - XP gain animations
   - Boss fight victory screens
   - Class-themed celebration messages

4. **Training Mode Implementation**
   - Roman numeral levels (I-IV)
   - Separate XP tracking
   - Graduation ceremony to Level 1
   - Tutorial quests with mix of real/trivial tasks

5. **Quest Visibility Controls**
   - Show next 3-4 tasks only
   - "Choose your adventure" task selection
   - Progressive reveal as tasks complete
   - Hidden future tasks with hint text

6. **React UI Polish**
   - Smooth animations
   - Custom theming options
   - Responsive layout
   - Dark/light mode compatibility
   - Class-based color theming option

### Phase 3: AI Integration & Advanced Features
**Timeline:** 1/27 - 1/29 (2-3 days)

1. **Pixel Art Sprite Generation (Whisk/Veo)**
   - Generate Paladin class sprites only (Brad's class)
   - 5 level tiers × 6 gear slots = ~30 class sprites
   - Shared assets: body base, skin tones, hair, accessories (~21 sprites)
   - **Revised total: ~51 sprites** (down from original 100-120 estimate)
   - Use existing icon packs for additional items as needed
   - Bundle sprites with plugin (no runtime API calls)

2. **Sprite Layering System**
   - Client-side sprite assembly (Canvas or SVG)
   - Layer base sprite (class + level tier)
   - Apply customization layers (skin, hair, accessories)
   - Display equipped gear overlays
   - Update sprite when leveling up to new tier
   - Replace all placeholder visuals with real sprites

3. **Character Sheet Visual Upgrade**
   - Full pixel art character display
   - Animated level-up transitions
   - Visual gear slots showing equipped items
   - Achievement badges with icons
   - Class emblem/symbol display

4. **Dual-Class Feature (Level 25)**
   - Unlock at Level 25
   - Select secondary class
   - Apply secondary bonus (7.5% XP)
   - Update character sprite to show dual-class visuals
   - Achievement: "Multiclass Mastery"

5. **Class Change System**
   - Command: "Change Class"
   - Cost calculation: `currentLevel × 100 XP`
   - Confirmation modal showing cost
   - Update bonuses and sprite
   - Log class change in history

6. **AI Quest Generation (Gemini API)**
   - Modal: User inputs quest parameters
     - Quest name, goal, timeline, difficulty
     - Expected level gain
     - Category/theme
   - API generates full quest structure with milestones, boss fights, hidden rewards
   - Preview modal shows:
     - Generated title & description (editable)
     - Task count estimate
     - Reward hints ("Contains 2 gear rewards, 1 achievement")
     - Total XP estimate
   - Direct save to `quests/ai-generated/` folder
   - Hidden details revealed progressively during quest

7. **"Take Quest" Button**
   - Opens random "Available" quest or specific quest
   - Opens quest file or linked task file
   - Optional: Opens quest URL in browser
   - Optional: Starts Pomodoro timer

8. **Weekly Sprint View**
   - Progress bar toward weekly goal
   - Breakdown by category
   - Streak visualization
   - Next milestone countdown
   - Character sprite display

9. **Chronos Integration**
   - "Schedule Quest Block" button
   - Creates time block in Chronos calendar
   - Reminder if no quests completed in X days
   - Auto-log completed quests to daily note

10. **Switchboard Integration**
    - Pre-configured "Quest Mode" line
    - Auto-opens Quest Board as landing page
    - Fades non-relevant folders
    - Custom accent color

11. **Accountability Features**
    - Export weekly stats as formatted text
    - Email/webhook options for sharing
    - Accountability partner notifications
    - Daily note integration

12. **Advanced Settings Panel**
    - Character re-customization
    - Quest visibility (how many tasks ahead shown)
    - Weekly quest goals
    - XP values per category
    - Age-based XP thresholds
    - Milestone rewards list
    - Power-ups and bonuses
    - Training mode toggle
    - Class bonus adjustments

---

## Generic Design Principles

Quest Board is NOT just for job hunting. It should support:

1. **Job Hunting Mode**
   - Categories: Dev, AI, Part-time, Internship
   - Quests = Job Applications
   - Milestones: First interview, First offer, etc.

2. **Household Mode**
   - Categories: Kitchen, Cleaning, Maintenance, Errands
   - Quests = Chores
   - Milestones: Weekly goals, Monthly deep cleans

3. **Work Project Mode**
   - Categories: Development, Meetings, Documentation, Bugs
   - Quests = Tasks/Tickets
   - Milestones: Sprint completion, Feature launches

4. **Fitness Mode**
   - Categories: Cardio, Strength, Flexibility, Rest
   - Quests = Workouts
   - Milestones: Consistency streaks, Personal records

**How we make it generic:**
- User-defined categories (not hardcoded)
- Customizable XP values
- Flexible milestone system
- Template presets for common use cases
- Rename "Quest" terminology in settings if desired

---

## Technical Architecture

### Tech Stack
- TypeScript (strict mode)
- React (functional components, hooks)
- Zustand (state management)
- DOMPurify (input sanitization)
- Obsidian API
- Google Veo (sprite generation, Phase 3)
- Gemini API (AI quest generation, Phase 3)
- esbuild (bundling)

### File Structure
```
quest-board/
├── main.ts                 # Plugin entry point
├── manifest.json           # Plugin metadata
├── styles.css              # Global styles
├── src/
│   ├── components/         # React components
│   │   ├── Board.tsx       # Main kanban board
│   │   ├── QuestCard.tsx   # Individual quest card
│   │   ├── StatsView.tsx   # Character sheet/stats
│   │   ├── QuickCapture.tsx # Modal for adding quests
│   │   ├── VictoryScreen.tsx # Celebration animations
│   │   └── SprintView.tsx  # Weekly progress
│   ├── models/             # Data models
│   │   ├── Quest.ts        # Quest class
│   │   └── Stats.ts        # Stats/XP calculations
│   ├── services/           # Business logic
│   │   ├── QuestManager.ts # CRUD operations
│   │   ├── XPSystem.ts     # Level/XP logic
│   │   └── Integrations.ts # Chronos/Switchboard
│   ├── utils/              # Helpers
│   │   └── storage.ts      # File I/O
│   └── settings.ts         # Settings tab
└── README.md
```

### Data Structure (Quest JSON)
```json
{
  "schemaVersion": 1,
  "id": "unique-id",
  "title": "Apply to Acme Corp - Junior Dev",
  "category": "dev",
  "status": "in-progress",
  "priority": "high",
  "xpValue": 15,
  "url": "https://...",
  "createdDate": "2026-02-03",
  "completedDate": null,
  "tags": ["remote", "react"],
  "timeline": [
    {"date": "2026-02-03", "event": "Quest started"},
    {"date": "2026-02-10", "event": "Interview scheduled"}
  ],
  "notes": "Found through LinkedIn",
  "customFields": {}
}
```

---

## Integration Points

### Chronos
- Schedule quest blocks in calendar
- Auto-log completed quests to daily note
- Reminder notifications for inactivity

### Switchboard
- Pre-configured "Quest Mode" line
- Custom landing page (Quest Board)
- Signal isolation for focus

### Daily Notes
- Append daily quest stats
- "Today's Quests" section
- Weekly summary generation

### QuickAdd (User-side)
- Users can create QuickAdd macros to trigger Quest Board commands
- Enables voice-to-quest workflows

---

## Development Timeline

**Week of 1/13:**
- ✅ Finish Mise plugin (cooking/kitchen)

**Week of 1/20:**
- 1/20-1/22: Multi-PC sync for Chronos
- 1/22: Acquire Ultra AI subscription (unlimited Claude)
- 1/22-1/24: Phase 1 (Board + Quick Capture + Stats)
- 1/25-1/26: Phase 2 (Character Sheet + Victory Screens + Polish)
- 1/27-1/29: Phase 3 (Integrations + Advanced Features)

**Week of 1/27 - 2/15:**
- Personal testing and iteration
- Refactor all plugins for OOP architecture
- Break up monolithic main.ts files
- Improve readability and maintainability

**After 2/15:**
- Continue personal use and refinement
- Link GitHub repos in portfolio
- (Far future: Potential community release after learning codebase deeply)

---

## Monetization Strategy

1. **Free Version (Community Plugin)**
   - All core features
   - Basic integrations
   - Open source

2. **Sponsor Tiers (GitHub Sponsors)**
   - $3/month: Early access to new features
   - $10/month: Priority support + feature requests
   - $25/month: Quarterly 1:1 calls + custom templates

3. **Portfolio Piece**
   - Demonstrates React proficiency
   - Shows UX/gamification thinking
   - Proves ability to ship complete products

---

## Success Metrics

**Technical:**
- [ ] All 3 phases complete by 1/29
- [ ] No critical bugs in personal testing
- [ ] Performance: Board loads in <1 second with 100+ quests
- [ ] Mobile responsive
- [ ] Quest files manually editable without breaking plugin

**User Experience:**
- [ ] Quest creation (manual or AI) takes <2 minutes
- [ ] Task completion feels rewarding (WoW-style XP)
- [ ] Training mode effectively tests mechanics
- [ ] Progressive reveal creates excitement
- [ ] Age-based leveling feels meaningful

**Personal:**
- [ ] Brad uses it daily for task management
- [ ] Reduces friction in task tracking
- [ ] Provides dopamine hits for ADHD brain
- [ ] Replaces overwhelming Master Dashboard
- [ ] Actually completes quests (doesn't abandon system)

**Community (Far Future Potential):**
- [ ] Other ADHD users might find it useful
- [ ] Could demonstrate React/gamification skills
- [ ] Potential for community interest
- [ ] Possible GitHub Sponsors if released publicly

---

## Open Questions

1. Should we include sound effects (optional, off by default)?
2. What's the best way to handle quest archiving (completed quests pile up)?
3. Should milestones be global or per-category?
4. Discord webhook vs email for accountability notifications?
5. How to handle quest dependencies ("Can't start Quest B until Quest A is done")?

---

## Risks & Mitigations

**Risk:** Scope creep during development
**Mitigation:** Stick to 3-phase plan, park extra features in "Future" list

**Risk:** React performance with large quest lists
**Mitigation:** Implement pagination/virtualization if needed

**Risk:** Chronos/Switchboard integration breaks in future updates
**Mitigation:** Graceful fallbacks, don't make integrations required

**Risk:** Brad gets distracted building this instead of using it
**Mitigation:** Build Phase 1 → Test in Training Mode → Build Phase 2 → Test more → Build Phase 3

**Risk:** Quest files become corrupted or uneditable
**Mitigation:** Comprehensive manual editing guide, validation on file read, backups

---

## Gameplay Mechanics (Phase 3)

### Enrage System (Anti-Procrastination)
- Quests in "In Progress" for 7+ days start enraging
- Visual: Red glow, angry indicator, pulsing animation
- XP penalty: 25% after 7 days, 50% after 14 days
- Encourages completion, discourages quest hoarding

### Loot System (Consumables)
- Random loot drops on quest/task completion
- Consumable items stored in inventory
- Item types:
  - **Potion of Focus:** Triggers 25-minute Pomodoro timer
  - **Scroll of Pardon:** Restores broken daily streak
  - **Coin of Bribery:** Auto-completes one trivial task
  - **XP Boost:** Temporary 10-20% XP bonus
- Rarity tiers: Common (15-20% drop), Rare (3-5% drop), Epic (1% drop)
- Requires ~10-15 consumable item sprites (16×16 px)

### Tavern View (Rest Mode)
- Cozy rest screen: character sitting by fireplace
- Shows current streak, gentle encouragement
- Toggle manually or auto-enable on weekends
- Separate "sitting/resting" character sprite variant needed

---

## Future Enhancements (Post-Phase 3)

### Skill Trees (High Priority)
- Quest dependencies: unlock quests by completing prerequisites
- Visual tree/graph showing locked/unlocked quests
- Example: "Learn React Basics" unlocks "Build Quest Board" + "Build Portfolio"
- Strategic planning layer for quest selection
- Encourages long-term goal setting

### Other Ideas
- [ ] Party system (share quests with friends/family)
- [ ] Quest templates (save common quest patterns)
- [ ] Recurring quests (daily/weekly chores)
- [ ] Boss battles (multi-stage epic milestones)
- [ ] Guild system (team-based goals)
- [ ] Export/import quest packs
- [ ] Mobile app companion
- [ ] Analytics dashboard (historical trends)
- [ ] Advanced AI features (Claude API for complex quests)

---

## Marketing Copy (Draft)

**Tagline:** "Turn your to-do list into an RPG"

**Description:**
Quest Board transforms mundane tasks into epic quests. Whether you're job hunting, managing household chores, or tracking work projects, Quest Board gamifies your workflow with XP, levels, achievements, and visual progress tracking. Built for ADHD brains that need dopamine hits to stay motivated.

**Key Features:**
✨ RPG-style progression (gain XP, level up)
🎯 Visual kanban board
⚡ Quick capture (under 30 seconds)
🏆 Milestone celebrations
📊 Stats dashboard
🔗 Integrates with Chronos & Switchboard
🎨 Fully customizable categories
🧠 Built by an ADHD dev, for ADHD brains

---

**Links:** [[Idea List]] | [[Feature Roadmap]] | [[Session Log]]
