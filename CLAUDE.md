# Quest Board - Development Guidelines

Instructions for AI assistants (Claude Code, etc.) working on this project.

---

## Project Context

**Developer:** Brad Wales (ADHD, visual learner, prefers vibe coding with Claude)
**Purpose:** Personal power tool - gamified task tracker with RPG mechanics for ADHD brain
**Primary Goal:** Replace overwhelming Master Dashboard with engaging quest system
**Tech Stack:** TypeScript, React, Obsidian API, esbuild, Gemini API (Phase 3)
**Timeline:** 3 phases over ~2 weeks (1/22 - early Feb 2026)
**Release:** Personal use (potential public release in far future)

**Development Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Production:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

---

## CRITICAL: Git Workflow

**Brad handles ALL git commands.** AI assistants should:
- ✅ Read git status, git log, git diff (read-only commands)
- ❌ NEVER run: git add, git commit, git push, git pull, git merge, git rebase, etc.
- ✅ Provide commit messages at session wrap-up for Brad to copy/paste

**Why:** Brad wants full control over version control. No surprises, no accidental commits.

---

## Development Session Workflow

**CRITICAL:** Follow this exact flow. Do not skip steps.

### 1. Review & Discuss
- Review what feature/phase needs to be built
- Reference [[Feature Priority List]] for current phase
- Answer Brad's questions
- Clarify requirements and edge cases
- Discuss implementation approach

### 2. Do the Work
- Write code following OOP architecture guidelines (see below)
- Build the feature as discussed
- Work in **dev environment** only: `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- Keep Brad updated on progress
- Follow separation of concerns (Models, Services, Components, Utils)

### 3. DO TESTING
**⚠️ CRITICAL: Test BEFORE moving forward**

**Testing process:**
1. Create build in dev environment
2. Run through relevant test checklist (Phase 1/2/3)
3. Fix any bugs found
4. Rebuild and retest until passing
5. Report results to Brad

**Do NOT proceed to deployment until testing passes in dev.**

### 4. Deployment
**Only after Brad confirms testing passed:**

1. **Copy files from dev to production:**
   - Source: `C:\Users\bwales\projects\obsidian-plugins\quest-board`
   - Destination: `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

2. **Required files to copy:**
   - `main.js` (compiled from main.ts)
   - `styles.css`
   - `manifest.json`
   - Any other assets (images, templates, etc.)

3. **Reload Obsidian** to test in production vault

### 5. Wait for User Confirmation
- Brad confirms plugin works in production environment
- Don't proceed to wrap-up without this confirmation

### 6. Wrap Up Phase/Feature
**Only when Brad says "let's wrap up":**

1. Update [[Session Log]] with what was completed
2. Update [[Feature Priority List]] (mark completed items)
3. Provide git commit message for Brad to copy/paste

**Commit message format:**
```bash
git commit -m "feat: [concise description]"
```

**Examples:**
```bash
git commit -m "feat: implement task file linking with bidirectional confirmation"
git commit -m "feat: add age-based XP scaling for levels 1-30"
git commit -m "fix: quest visibility showing wrong task count"
```

---

## Core Principles

### 1. Speed Over Perfection (For Character/Quest Entry)
- Character creation on first launch (one-time, ~2 minutes)
- Quest capture MUST be <30 seconds
- Required fields: Title, Category, XP (auto-suggest based on category)
- Everything else is optional
- Default values should be smart (today's date, medium priority, etc.)

### 2. Dopamine-Driven Design
- Small wins frequently (XP gains, checkmarks, animations)
- Celebrate milestones (confetti, victory screens, level-ups)
- Character sprite evolves with levels (visual growth)
- Show streak counters prominently
- Make leveling up feel AMAZING
- Class bonuses provide meaningful rewards

### 3. Generic, Not Specific
- This is NOT just a job hunting tool
- 7 classes support different playstyles and quest focuses
- User-defined categories (no hardcoded "Dev", "Part-time", etc.)
- Flexible enough for chores, fitness, work projects, anything
- Terminology should be game-y but not cringe ("Quest" not "Task")

### 5. Visual First (Leverage Brad's Strengths)
- **Brad has 99th percentile visual working memory**
- Progress MUST be visible at a glance
- Character evolution shows growth visually
- Use progress bars, XP bars, sprite animations
- Class-based color theming
- Stats should be graphical, not just numbers
- **Phase 1-2:** Placeholders are fine (colored shapes, emoji, simple SVG)
- **Phase 3:** Full pixel art sprite system with layering

### 6. OOP Architecture (CRITICAL - Non-Negotiable!)

**Brad's first plugins ended up with massive 2,850-line main.ts files.** We are NOT repeating that mistake.

**Principles:**
- **Separation of Concerns:** Models, Services, Components, Utils - each has ONE job
- **Single Responsibility:** Each class/function does ONE thing well
- **No Monolithic Files:** If a file exceeds ~200-300 lines, it needs splitting
- **Readable Code:** Brad will need to understand and maintain this long-term
- **JSDoc Everything:** Public methods get documentation comments

**Why this matters:**
- Brad needs to learn this codebase deeply for potential public release
- Refactoring monolithic code is painful (he's doing it now with other plugins)
- Clean architecture from the start = sustainable long-term
- This is a portfolio piece demonstrating good practices

---

## File Structure (Enforce This!)

```
quest-board/
├── main.ts                    # THIN entry point only
├── manifest.json
├── styles.css                 # Global styles only
├── .gitignore                 # Standard ignores (node_modules, etc.)
├── src/
│   ├── components/            # React components (UI only)
│   │   ├── Board.tsx
│   │   ├── QuestCard.tsx
│   │   ├── StatsView.tsx
│   │   ├── QuickCapture.tsx
│   │   ├── VictoryScreen.tsx
│   │   ├── SprintView.tsx
│   │   ├── TavernView.tsx    # Rest mode view
│   │   └── ErrorBoundary.tsx # Catches render errors in quest cards
│   ├── models/                # Data models (pure data structures)
│   │   ├── Quest.ts
│   │   ├── Character.ts
│   │   ├── Consumable.ts
│   │   ├── QuestStatus.ts
│   │   └── Stats.ts
│   ├── services/              # Business logic (stateful operations)
│   │   ├── QuestManager.ts   # CRUD for quests
│   │   ├── QuestCache.ts     # In-memory cache with debounced watcher
│   │   ├── XPSystem.ts       # XP/level calculations
│   │   ├── LootSystem.ts     # Loot drops and consumables
│   │   ├── EnrageSystem.ts   # Quest enrage mechanics
│   │   ├── SpriteRenderer.ts # Sprite caching and composition
│   │   └── Integrations.ts   # Chronos/Switchboard
│   ├── store/                 # State management (Zustand)
│   │   ├── questStore.ts     # Quest state (file is source of truth)
│   │   ├── characterStore.ts # Character state
│   │   └── uiStore.ts        # UI state (persisted: tab, filters)
│   ├── utils/                 # Pure functions (no state)
│   │   ├── storage.ts        # File I/O
│   │   ├── dateUtils.ts      # Date formatting
│   │   ├── validator.ts      # Quest/Character validation + schema check
│   │   ├── sanitizer.ts      # Input sanitization (DOMPurify)
│   │   ├── safeJson.ts       # Prototype pollution protection
│   │   └── pathValidator.ts  # Validate linkedTaskFile paths
│   └── settings.ts            # Settings tab UI (includes API key field)
└── README.md
```

**main.ts should ONLY: (Keep THIN - ~50-100 lines max)**
- Import and initialize plugin
- Register commands (`this.addCommand`)
- Create ribbon icons (`this.addRibbonIcon`)
- Initialize services
- Pass control to services
- Handle plugin load/unload lifecycle

**Example main.ts structure:**
```typescript
export default class QuestBoardPlugin extends Plugin {
  settings: QuestBoardSettings;
  questManager: QuestManager;
  xpSystem: XPSystem;

  async onload() {
    await this.loadSettings();

    // Initialize services
    this.questManager = new QuestManager(this.app, this.settings);
    this.xpSystem = new XPSystem(this.settings);

    // Register commands
    this.addCommand({
      id: 'open-quest-board',
      name: 'Open Quest Board',
      callback: () => this.questManager.openBoard()
    });

    // Register views, ribbon, etc.
    this.addRibbonIcon('dice', 'Quest Board', () => {
      this.questManager.openBoard();
    });
  }

  async onunload() {
    // Cleanup
  }
}
```

**Components should ONLY: (UI layer)**
- Render React UI
- Handle user interactions (clicks, drags, inputs)
- Call services for data operations
- Display data passed via props
- **Never** directly read/write files
- **Never** contain business logic
- **Never** manage global state

**Services should ONLY: (Business logic layer)**
- Manage application state
- Perform business logic (XP calculations, quest progression)
- Call utils for pure operations (file I/O, date formatting)
- Coordinate between components and data layer
- **Never** render UI
- **Never** directly manipulate DOM

**Utils should ONLY: (Pure function layer)**
- Pure functions (input → output, no side effects)
- File I/O operations (read/write quest files)
- Date/time formatting
- Data transformations
- Validation functions
- Reusable across services
- **Never** manage state
- **Never** make assumptions about application context

**Architecture enforcement:**
- If a file grows beyond 300 lines, refactor it
- If a class has more than 5-7 public methods, split it
- If a function has more than 3 parameters, consider an options object
- If you're importing a component in a util, you're doing it wrong

---

## State Management (Zustand)

**Problem:** Obsidian file events → React UI updates is messy without a store.

**Solution:** Zustand (lightweight, zero boilerplate)

### Quest Store

```typescript
// src/store/questStore.ts
import create from 'zustand';

interface QuestStore {
  quests: Map<string, Quest>;

  // Actions
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  deleteQuest: (questId: string) => void;

  // Computed
  getQuestsByStatus: (status: QuestStatus) => Quest[];
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  quests: new Map(),

  addQuest: (quest) => set((state) => {
    const newQuests = new Map(state.quests);
    newQuests.set(quest.id, quest);
    return { quests: newQuests };
  }),

  updateQuest: (questId, updates) => set((state) => {
    const newQuests = new Map(state.quests);
    const quest = newQuests.get(questId);
    if (quest) {
      newQuests.set(questId, { ...quest, ...updates });
    }
    return { quests: newQuests };
  }),

  getQuestsByStatus: (status) => {
    return Array.from(get().quests.values())
      .filter(q => q.status === status);
  }
}));
```

### Usage in Components

```typescript
// Board.tsx
const Board = () => {
  // Component ONLY re-renders when availableQuests changes
  const availableQuests = useQuestStore(state =>
    state.getQuestsByStatus('available')
  );

  const updateQuest = useQuestStore(state => state.updateQuest);

  return (
    <div className="board">
      <KanbanColumn quests={availableQuests} status="available" />
    </div>
  );
};
```

### Bridge from Obsidian to Store

```typescript
// main.ts
export default class QuestBoardPlugin extends Plugin {
  async onload() {
    // Load initial data
    const quests = await this.questManager.loadAllQuests();
    useQuestStore.getState().setQuests(quests);

    // Watch for file changes
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (this.questManager.isQuestFile(file)) {
          const quest = await this.questManager.loadQuest(file);
          useQuestStore.getState().updateQuest(quest.id, quest);
        }
      })
    );
  }
}
```

**Benefits:**
- Clean separation: Obsidian events → Store → React UI
- Only changed data triggers re-renders
- No prop drilling
- Easy to debug

### Data Storage Strategy

**Two types of data, two storage approaches:**

| Data Type | What It Contains | Storage Location | Why |
|-----------|------------------|------------------|-----|
| **Plugin State** | Character, XP, level, achievements, inventory, UI preferences | `loadData()`/`saveData()` API | Safe from user deletion, syncs with plugin folder |
| **Quest Content** | Quest files, templates | `Life/Quest Board/` (visible vault folder) | User-editable, easy to backup, human-readable |

**Plugin State (loadData/saveData):**
```typescript
// main.ts
interface QuestBoardData {
  character: Character;
  achievements: Achievement[];
  inventory: Consumable[];
  uiState: {
    activeTab: string;
    filters: FilterSettings;
  };
}

export default class QuestBoardPlugin extends Plugin {
  data: QuestBoardData;

  async onload() {
    // Load plugin state from .obsidian/plugins/quest-board/data.json
    this.data = Object.assign({}, DEFAULT_DATA, await this.loadData());
  }

  async savePluginData() {
    // Persists character, achievements, inventory, UI state
    await this.saveData(this.data);
  }
}
```

**Quest Content (Vault Files):**
```
Life/Quest Board/
├── quests/
│   ├── main/              # User-created quests (Markdown)
│   ├── training/          # Training mode quests
│   └── ai-generated/      # AI-created quests (JSON)
└── templates/             # Reusable templates
```

**Why NOT use hidden `.quest-data/` folder:**
- Hidden folders may not sync with some cloud tools
- User might lose data when moving vaults
- `loadData()`/`saveData()` is the Obsidian-standard approach

**File is Source of Truth:**
- Quest files are the canonical source for quest data
- Zustand store is just a cache for React rendering
- Never persist quest data to `loadData()` (would cause state drift)

---

## Security

### API Key Storage (Obsidian Settings)

**CRITICAL:** Never commit API keys to git. Never store in vault files (they sync to cloud).

**Approach:** Store API keys in Obsidian plugin settings (standard for AI plugins).

**Setup:**

1. **Settings interface includes API key field:**
```typescript
// src/settings.ts
interface QuestBoardSettings {
  geminiApiKey: string;  // User pastes their key here
  // ... other settings
}

const DEFAULT_SETTINGS: QuestBoardSettings = {
  geminiApiKey: '',
  // ...
};
```

2. **Settings tab UI:**
```typescript
// Settings tab
new Setting(containerEl)
  .setName('Gemini API Key')
  .setDesc('Required for AI quest generation. Get one at makersuite.google.com')
  .addText(text => text
    .setPlaceholder('Enter your API key')
    .setValue(this.plugin.settings.geminiApiKey)
    .onChange(async (value) => {
      this.plugin.settings.geminiApiKey = value;
      await this.plugin.saveSettings();
    })
    .inputEl.type = 'password'  // Hide the key
  );
```

3. **Use in services:**
```typescript
// src/services/AIQuestGenerator.ts
export class AIQuestGenerator {
  private apiKey: string;

  constructor(settings: QuestBoardSettings) {
    this.apiKey = settings.geminiApiKey || '';
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Check plugin settings.');
    }
  }
}
```

**Why this approach:**
- Obsidian settings are stored in `.obsidian/plugins/quest-board/data.json`
- This is the standard pattern for Obsidian AI plugins (Copilot, Smart Connections, etc.)
- No risk of syncing keys to cloud storage
- Works for public release (each user provides their own key)

### Input Sanitization

**Problem:** AI can hallucinate XSS attacks in quest descriptions.

**Solution:** DOMPurify with strict configuration

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```typescript
// src/utils/sanitizer.ts
import DOMPurify from 'dompurify';

export class Sanitizer {
  /**
   * Sanitize HTML content, allowing only safe formatting tags
   */
  static sanitizeQuestDescription(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    });
  }

  /**
   * Strip ALL HTML from text (for titles, names, etc.)
   * Uses DOMPurify for safety instead of DOM manipulation
   */
  static sanitizeQuestTitle(text: string): string {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  }

  /**
   * Validate string length to prevent DoS via massive payloads
   */
  static validateLength(text: string, maxLength: number, fieldName: string): string {
    if (text.length > maxLength) {
      console.warn(`${fieldName} exceeds max length (${maxLength}), truncating`);
      return text.substring(0, maxLength);
    }
    return text;
  }
}
```

**Usage:**
```typescript
// When loading AI-generated quest
const quest = await generateQuest(params);
quest.title = Sanitizer.sanitizeQuestTitle(quest.title);
quest.title = Sanitizer.validateLength(quest.title, 200, 'Quest title');
quest.description = Sanitizer.sanitizeQuestDescription(quest.description);
quest.description = Sanitizer.validateLength(quest.description, 5000, 'Quest description');
```

**Never use `dangerouslySetInnerHTML` without sanitization.**

### Prototype Pollution Protection

**Problem:** Malicious JSON files could inject `__proto__` or `constructor` keys.

**Solution:** Safe JSON parsing with key filtering

```typescript
// src/utils/safeJson.ts
export class SafeJSON {
  /**
   * Parse JSON with prototype pollution protection
   */
  static parse<T>(content: string): T {
    return JSON.parse(content, (key, value) => {
      // Strip dangerous keys that could pollute prototypes
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        console.warn(`Stripped dangerous key from JSON: ${key}`);
        return undefined;
      }
      return value;
    });
  }
}
```

**Usage:**
```typescript
// Always use SafeJSON.parse instead of JSON.parse for user-editable files
const quest = SafeJSON.parse<Quest>(fileContent);
```

### Path Validation for Linked Files

**Problem:** Malicious `linkedTaskFile` paths could attempt to read outside the vault.

**Solution:** Validate paths resolve within the vault

```typescript
// src/utils/pathValidator.ts
export class PathValidator {
  /**
   * Validate that a path resolves to a file within the vault
   */
  static validateLinkedPath(vault: Vault, path: string): TFile | null {
    // Normalize path (remove ../, leading slashes, etc.)
    const normalizedPath = path.replace(/\.\.\/|\.\//g, '').replace(/^\/+/, '');
    
    // Check if file exists in vault
    const file = vault.getAbstractFileByPath(normalizedPath);
    
    if (!file) {
      console.warn(`Linked file not found: ${path}`);
      return null;
    }
    
    if (!(file instanceof TFile)) {
      console.warn(`Linked path is not a file: ${path}`);
      return null;
    }
    
    return file;
  }
}
```

---

## Performance Optimizations

### File I/O Caching

**Problem:** Reading 100+ quest files on every load is slow.

**Solution:** In-memory cache with debounced file watcher

```typescript
// src/services/QuestCache.ts
import { debounce } from 'obsidian';

export class QuestCache {
  private cache: Map<string, Quest> = new Map();
  private vault: Vault;
  private pendingReloads: Set<string> = new Set();

  constructor(vault: Vault) {
    this.vault = vault;
    this.setupWatcher();
  }

  private setupWatcher(): void {
    // Debounce file watcher to prevent redundant reloads during rapid edits
    const debouncedReload = debounce(
      (path: string) => this.processReload(path),
      300,  // 300ms delay
      true  // Run on leading edge too
    );

    this.vault.on('modify', (file) => {
      if (this.isQuestFile(file)) {
        this.pendingReloads.add(file.path);
        debouncedReload(file.path);
      }
    });

    this.vault.on('delete', (file) => {
      if (this.isQuestFile(file)) {
        this.invalidate(file.path);
      }
    });
  }

  private async processReload(path: string): Promise<void> {
    if (this.pendingReloads.has(path)) {
      this.pendingReloads.delete(path);
      this.invalidate(path);
      await this.loadQuest(path);
    }
  }

  get(questId: string): Quest | null {
    return this.cache.get(questId) || null;
  }

  invalidate(path: string): void {
    // Extract questId from path, remove from cache
    const questId = this.getQuestIdFromPath(path);
    this.cache.delete(questId);
  }

  async loadQuest(path: string): Promise<Quest | null> {
    const file = this.vault.getAbstractFileByPath(path);
    if (!file || !(file instanceof TFile)) return null;

    const content = await this.vault.read(file);
    const quest = this.parseQuest(content);

    if (quest) {
      this.cache.set(quest.id, quest);
    }

    return quest;
  }
}
```

**Result:** Only touch disk when files actually change. Debouncing prevents multiple reloads during rapid typing.

### React Memoization

**Problem:** Moving one card re-renders entire board.

**Solution:** React.memo and smart state structure

```typescript
// Memoize quest cards
const QuestCard = React.memo(({ quest, onMove }: QuestCardProps) => {
  // Only re-renders if quest object reference changes
  return <div className="quest-card">...</div>;
}, (prev, next) => {
  return prev.quest.id === next.quest.id &&
         prev.quest.status === next.quest.status;
});

// Memoize columns
const KanbanColumn = React.memo(({ quests, status }) => {
  // Only re-renders if quests in THIS column change
  return (
    <div className="column">
      {quests.map(q => <QuestCard key={q.id} quest={q} />)}
    </div>
  );
});
```

**Store quests by column:**
```typescript
// DON'T store all quests in one array
const [quests, setQuests] = useState([...]); // ❌ Changing one re-renders all

// DO use Zustand selectors
const availableQuests = useQuestStore(state =>
  state.getQuestsByStatus('available') // ✅ Only subscribes to available quests
);
```

### Sprite Caching

**Problem:** Canvas composition is expensive, don't recomposite every frame.

**Solution:** Cache composited sprites using version-based keys

```typescript
// src/services/SpriteRenderer.ts
export class SpriteRenderer {
  private cache: Map<number, string> = new Map(); // spriteVersion -> dataURL

  render(character: Character): string {
    // Use version number for fast cache lookup (avoids string concatenation)
    const cacheKey = character.spriteVersion;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!; // Return cached sprite
    }

    // Generate sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    // Layer sprites
    this.drawLayer(ctx, this.getBaseSprite(character.class, character.levelTier));
    this.drawLayer(ctx, this.getSkinOverlay(character.skinTone));
    this.drawLayer(ctx, this.getHairSprite(character.hairStyle, character.hairColor));
    // ... more layers

    const dataURL = canvas.toDataURL('image/png');
    this.cache.set(cacheKey, dataURL);
    return dataURL;
  }

  invalidate(spriteVersion: number): void {
    this.cache.delete(spriteVersion);
  }
}

// Character model includes spriteVersion
interface Character {
  // ... other fields
  spriteVersion: number;  // Increment this whenever appearance changes
}

// When updating character appearance:
function updateCharacterAppearance(character: Character, changes: Partial<Character>): Character {
  return {
    ...character,
    ...changes,
    spriteVersion: character.spriteVersion + 1  // Invalidate cache
  };
}
```

**Only recomposite when character customization actually changes. Version-based keys are faster than string concatenation.**

---

## Data Validation

### Validator Class

**Problem:** Users can manually edit quest files, introduce typos that crash UI.

**Solution:** Strict validation with schema versioning on file load

```typescript
// src/utils/validator.ts
const CURRENT_SCHEMA_VERSION = 1;

export class QuestValidator {
  /**
   * Validate quest data and handle schema migrations if needed
   */
  static validate(data: unknown): Quest | null {
    // Type guards
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    const quest = data as any;

    // Schema version check (enables future migrations)
    if (!quest.schemaVersion) {
      quest.schemaVersion = 1;  // Assume v1 for legacy files
    }
    
    // Future: Add migration logic here
    // if (quest.schemaVersion < 2) {
    //   quest = migrateV1ToV2(quest);
    // }

    // Required fields
    if (!quest.id || typeof quest.id !== 'string') {
      console.error('Invalid quest: missing id');
      return null;
    }

    if (!quest.title || typeof quest.title !== 'string') {
      console.error('Invalid quest: missing title');
      return null;
    }

    // Type coercion for common mistakes
    if (typeof quest.xpValue === 'string') {
      quest.xpValue = parseInt(quest.xpValue) || 0;
    }

    if (typeof quest.xpValue !== 'number' || quest.xpValue < 0) {
      console.error('Invalid quest: xpValue must be number >= 0');
      return null;
    }

    // Enum validation
    const validStatuses = ['available', 'in-progress', 'active', 'completed'];
    if (!validStatuses.includes(quest.status)) {
      quest.status = 'available'; // Default
    }

    return quest as Quest;
  }

  static validateAndWarn(data: unknown, fileName: string): Quest | null {
    const quest = this.validate(data);
    if (!quest) {
      new Notice(`Quest file "${fileName}" is invalid. Check console for details.`);
    }
    return quest;
  }
}
```

**Use on every file load (with SafeJSON for prototype pollution protection):**
```typescript
import { SafeJSON } from './safeJson';

async loadQuest(file: TFile): Promise<Quest | null> {
  const content = await this.vault.read(file);
  const data = SafeJSON.parse(content);  // Use SafeJSON, not JSON.parse!
  return QuestValidator.validateAndWarn(data, file.name);
}
```

### Error Boundaries

**Problem:** A single corrupted quest file could crash the entire React UI.

**Solution:** Wrap components in error boundaries for graceful degradation

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-card">
          <span>⚠️ Failed to load</span>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Usage in Board:**
```typescript
// Board.tsx
{quests.map(quest => (
  <ErrorBoundary key={quest.id} fallback={<div>Quest load error</div>}>
    <QuestCard quest={quest} />
  </ErrorBoundary>
))}
```

---

## Data Models

### Quest JSON Structure
```json
{
  "schemaVersion": 1,
  "id": "unique-uuid",
  "title": "Apply to Acme Corp - Junior Dev",
  "category": "dev",
  "status": "in-progress",
  "priority": "high",
  "xpValue": 15,
  "url": "https://jobs.example.com/posting",
  "createdDate": "2026-02-03T10:00:00Z",
  "completedDate": null,
  "tags": ["remote", "react", "full-time"],
  "timeline": [
    {
      "date": "2026-02-03T10:00:00Z",
      "event": "Quest created"
    },
    {
      "date": "2026-02-10T14:30:00Z",
      "event": "Interview scheduled"
    }
  ],
  "notes": "Found through LinkedIn. Know someone who works there.",
  "customFields": {}
}
```

**Rules:**
- `id` is UUID v4, generated on creation
- `status` is enum: "available" | "in-progress" | "active" | "completed"
- `timeline` always has at least one entry (creation)
- ISO 8601 dates everywhere
- `customFields` is future-proofing for user extensions

### Settings Structure
```json
{
  "storageFolder": "Career/Jobs/Quests",
  "weeklyGoal": 8,
  "categories": [
    {"name": "dev", "xpValue": 15, "color": "#4CAF50"},
    {"name": "part-time", "xpValue": 10, "color": "#2196F3"}
  ],
  "milestones": [
    {"threshold": 10, "name": "First 10 Quests"},
    {"threshold": 25, "name": "Quarter Century"}
  ],
  "deadlineDate": "2026-05-01",
  "dangerZoneDays": 30,
  "powerUps": [
    {"name": "Dad Accountability", "xpBonus": 10}
  ],
  "chronosEnabled": true,
  "switchboardEnabled": true,
  "dailyNoteIntegration": true
}
```

---

## Coding Standards

### TypeScript
- **Strict mode:** Always
- **No `any` types:** Use `unknown` or proper types
- **Interfaces over types:** For object shapes
- **JSDoc comments:** For all public methods

### React
- **Functional components only:** No class components
- **Hooks:** useState, useEffect, useCallback, useMemo
- **Props typing:** Always type your props
- **Key props:** Always provide unique keys in lists

### Error Handling
- **Try-catch:** Wrap file I/O and external calls
- **User-friendly messages:** Use Obsidian Notice API
- **Graceful degradation:** If Chronos isn't installed, hide features, don't crash
- **Logging:** console.log for development, remove for production

### Performance
- **Lazy load:** Don't load all quests at once if 100+
- **Memoization:** Use React.memo for expensive components
- **Debouncing:** For search/filter inputs
- **Virtualization:** If board has 50+ cards, consider react-window

---

## Integration Guidelines

### Chronos
```typescript
// Check if Chronos is installed
const chronosPlugin = this.app.plugins.getPlugin('chronos');
if (chronosPlugin) {
  // Create calendar event
  chronosPlugin.createEvent({
    title: quest.title,
    startDate: someDate,
    duration: 60
  });
}
```

**Rules:**
- Always check if plugin exists before calling
- Provide fallback UI if not installed
- Don't make Chronos required

### Switchboard
```typescript
// Export line configuration
const switchboardLine = {
  id: "quest-mode",
  name: "Quest Mode",
  color: "#4CAF50",
  safePaths: ["Career", "Projects"],
  landingPage: "Career/Jobs/Quest Board.md"
};
// User can import this into Switchboard settings
```

**Rules:**
- Export JSON they can copy-paste
- Don't try to programmatically modify Switchboard

### Daily Notes
```typescript
// Append to today's daily note
const todayNote = this.app.workspace.getActiveFile();
if (todayNote) {
  const content = await this.app.vault.read(todayNote);
  const updated = content + `\n- Completed: [[${quest.title}]]`;
  await this.app.vault.modify(todayNote, updated);
}
```

**Rules:**
- Configurable template in settings
- Check if daily note exists first
- Don't overwrite existing content

---

## Testing Strategy

### Manual Testing Checklist (Per Phase)
Phase 1:
- [ ] Create quest via command palette
- [ ] Quest appears in correct column
- [ ] Move quest between columns
- [ ] XP increases on completion
- [ ] Level updates correctly
- [ ] Stats display accurate numbers
- [ ] Plugin survives reload

Phase 2:
- [ ] Drag-and-drop works smoothly
- [ ] Victory screen appears on milestone
- [ ] XP bar animates
- [ ] Character sheet displays correctly
- [ ] Achievements unlock
- [ ] Timeline shows events
- [ ] UI works in dark/light themes

Phase 3:
- [ ] "Take Quest" opens quest
- [ ] Weekly Sprint View accurate
- [ ] Daily note integration works
- [ ] Chronos creates events
- [ ] Switchboard config exports
- [ ] Stats export to clipboard
- [ ] Categories editable
- [ ] Import/export preserves data

### Edge Cases to Test
- Empty board (no quests)
- 100+ quests (performance)
- Corrupted JSON file
- Chronos/Switchboard not installed
- Mobile view (if applicable)
- Concurrent edits (two devices)

---

## Common Pitfalls (Avoid These!)

### Don't:
- ❌ Put all code in main.ts (Brad is refactoring to avoid this)
- ❌ Use synchronous file I/O (always async)
- ❌ Hardcode categories (user-defined!)
- ❌ Forget error handling on file operations
- ❌ Make sound effects enabled by default
- ❌ Assume integrations are available
- ❌ Overthink the MVP (ship Phase 1 fast)
- ❌ Run git commands (Brad handles all git operations)

### Do:
- ✅ Keep Quick Capture under 30 seconds
- ✅ Make XP gains satisfying (animations!)
- ✅ Test with Brad's actual workflow
- ✅ Gracefully handle missing plugins
- ✅ Use TypeScript strict mode
- ✅ Comment your code (Brad will read it later)
- ✅ Celebrate milestones with confetti
- ✅ Follow the session workflow (Discuss → Confirm → Build → Test → Wait → Wrap Up)

---

## Brad's Workflow

**How Brad will use this:**
1. Opens Obsidian in morning
2. Opens Quest Board (ribbon icon or hotkey)
3. Checks weekly sprint progress
4. Clicks "Take Quest" to pick a job to apply to
5. Applies to job
6. Marks quest as "In Progress" (drag or click)
7. Gets XP, sees progress bar fill
8. Repeats 3-5 times per day
9. Checks stats before bed, feels accomplished

**Critical moments:**
- Quick capture when he finds a job posting on LinkedIn
- Victory screen when hitting weekly goal
- Stats export to share with Dad on Sundays

---

## Decision-Making Framework

When faced with a choice:

1. **Does it add friction to data entry?** → Choose the faster option
2. **Does it make progress visible?** → Choose the visual option
3. **Does it feel rewarding?** → Choose the dopamine-inducing option
4. **Is it generic enough?** → Choose the flexible option
5. **Does it work for non-ADHD users too?** → Choose the inclusive option

**If unsure, ask Brad.**

---

## Visual Design & Character System

### Character Classes

**7 classes, each with 15% XP bonus and unique perk:**
1. **Warrior** - Admin/completion quests
2. **Paladin** - Health + Social quests (Brad's choice)
3. **Technomancer** - Dev/creative quests
4. **Scholar** - Academic/study quests
5. **Rogue** - Efficiency/quick wins
6. **Cleric** - Health/wellness quests
7. **Bard** - Social/dating quests

**See:** [[Character Creation & Visual Design]] for complete class descriptions and perks.

### Visual Progression

**5 Level Tiers (sprite changes):**
- Levels 1-5: Basic gear, starting out
- Levels 6-12: Improved gear, growing confidence
- Levels 13-17: Teen/young adult transition
- Levels 18-24: Adult professional gear
- Levels 25-30: Master tier, all gear unlocked

**Dual-Class at Level 25:**
- Choose secondary class (7.5% bonus)
- Visual blending of both classes
- Both perks active

### Sprite System

**Phase 1-2: Placeholders**
- Colored circles with emoji (🔴⚔️ = Warrior)
- Simple SVG shapes
- Geometric stick figures
- **Goal:** Functionality works, visuals are "good enough"

**Phase 3: Pixel Art (Veo Generation)**
- 7 classes × 5 tiers = 35 base sprites (16×16 or 32×32 px)
- Customization layers: hair (16), skin (4), accessories (4) = 24 sprites
- Gear sprites: ~30-45
- **Total: ~90-100 small pixel art images**
- Generated using Google Veo (Brad's Gemini Ultra subscription)
- Bundled with plugin (no runtime API calls)

**Sprite Layering:**
```typescript
// Client-side assembly using Canvas
Layer 1: Base sprite (class + level tier)
Layer 2: Skin tone overlay
Layer 3: Hair (style + color)
Layer 4: Accessories
Layer 5: Equipped gear
Layer 6: Dual-class indicator (if level 25+)
```

### Character Sheet Layout

**Hybrid visual + stats:**
- Left: Pixel art character sprite
- Right: Stats, XP bar, level, class
- Below: Equipped gear slots, achievements
- Visual progression shows growth

**Placeholder during Phase 1-2:**
- Simple shape/emoji where sprite will be
- Layout correct, visuals refined in Phase 3

---

## Build & Deployment Process

### Development Build
**Location:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`

```bash
# Build the plugin
npm run build

# This creates main.js from main.ts
# Check for errors before deploying
```

### Deployment to Production
**Location:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

**Files to copy:**
1. `main.js` (compiled output)
2. `styles.css`
3. `manifest.json`
4. Any additional assets (images, templates)

**Process:**
1. Build in dev environment
2. Test in dev environment
3. Fix any issues
4. Copy required files to production
5. Reload Obsidian (Ctrl+R or restart)
6. Test in production environment
7. Confirm with Brad before considering feature complete

**Don't:**
- ❌ Copy source files (.ts) to production
- ❌ Copy node_modules to production
- ❌ Deploy without testing in dev first
- ❌ Overwrite production until dev testing passes

---

## Game Mechanics (Phase 3+)

### Enrage System (Anti-Procrastination)

**Problem:** Quests sit in "In Progress" forever.

**Solution:** Quest enrages after 7 days, XP penalty increases over time.

```typescript
// src/services/EnrageSystem.ts
export class EnrageSystem {
  checkEnrage(quest: Quest): void {
    if (quest.status !== 'in-progress') return;

    const daysInProgress = this.getDaysSince(quest.lastUpdated);

    if (daysInProgress >= 7 && !quest.enraged) {
      quest.enraged = true;
      quest.xpPenalty = 0.25; // 25% XP loss
      new Notice(`⚠️ "${quest.title}" is enraging! Complete it soon!`);
    }

    if (daysInProgress >= 14) {
      quest.xpPenalty = 0.50; // 50% XP loss
      new Notice(`🔥 "${quest.title}" is enraged! Half XP remaining!`);
    }
  }

  getEffectiveXP(quest: Quest): number {
    if (!quest.enraged) return quest.xpValue;
    return Math.floor(quest.xpValue * (1 - quest.xpPenalty));
  }
}
```

**Visual:**
- Quest card glows red
- Angry emoji indicator
- Pulsing animation
- XP value shown with strikethrough (~~100~~ → 75)

### Loot System (Consumables)

**Loot drops on quest/task completion for dopamine hits.**

```typescript
// src/models/Consumable.ts
interface Consumable {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic';
  effect: 'pomodoro-25' | 'restore-streak' | 'skip-task' | 'xp-boost';
  sprite?: string; // Pixel art icon
}

// src/services/LootSystem.ts
export class LootSystem {
  private LOOT_TABLE = {
    common: [
      { name: 'Potion of Focus', effect: 'pomodoro-25', chance: 0.15 },
      { name: 'Minor XP Boost', effect: 'xp-boost-10', chance: 0.20 }
    ],
    rare: [
      { name: 'Scroll of Pardon', effect: 'restore-streak', chance: 0.05 },
      { name: 'Coin of Bribery', effect: 'skip-task', chance: 0.03 }
    ]
  };

  rollLoot(quest: Quest): Consumable | null {
    const roll = Math.random();

    // Check rare first
    for (const item of this.LOOT_TABLE.rare) {
      if (roll < item.chance) {
        return this.createConsumable(item);
      }
    }

    // Then common
    for (const item of this.LOOT_TABLE.common) {
      if (roll < item.chance) {
        return this.createConsumable(item);
      }
    }

    return null; // No loot this time
  }

  useConsumable(consumable: Consumable, character: Character): void {
    switch (consumable.effect) {
      case 'pomodoro-25':
        // Trigger 25-minute Pomodoro timer
        break;
      case 'restore-streak':
        // Restore broken daily streak
        character.streakShield = true;
        break;
      case 'skip-task':
        // Auto-complete one trivial task
        break;
      case 'xp-boost-10':
        // Temp 10% XP boost for next quest
        character.tempXPBoost = 0.10;
        break;
    }
  }
}
```

**UI:**
- Loot drop modal: "You found a Potion of Focus!"
- Inventory display in character sheet
- Use consumable button

**Sprites needed:**
- ~10-15 consumable item icons (16×16 px)

### Tavern View (Rest Mode)

**Cozy rest view for weekends/breaks.**

```typescript
// src/components/TavernView.tsx
const TavernView = () => {
  const character = useCharacterStore(state => state.character);

  return (
    <div className="tavern">
      <div className="scene">
        <div className="fireplace">🔥</div>
        <div className="character-resting">
          {/* Character sprite in sitting/resting pose */}
          <img src={getSittingSprite(character)} alt="Resting" />
        </div>
      </div>

      <div className="message">
        <h2>Take a rest, {character.name}.</h2>
        <p>You've earned it.</p>
        <p>Current streak: <strong>{character.streak} days</strong></p>
      </div>

      <button onClick={returnToQuests}>Return to Quests</button>
    </div>
  );
};
```

**Toggleable:**
- Manual toggle
- Auto-enable on weekends (optional setting)
- "Rest Day" status in character sheet

---

## Future Enhancements (Post-Phase 3)

These are parked for future iterations:

### Skill Trees
- Quest dependencies (unlock quests by completing prerequisites)
- Visual tree/graph showing locked/unlocked quests
- Example: "Learn React Basics" unlocks "Build Quest Board" + "Build Portfolio Site"
- Adds strategic planning layer to quest selection

### Other Ideas
- Recurring quests (daily/weekly patterns)
- Boss battles (multi-stage epic milestones)
- Party system (shared boards with friends/family)
- Advanced AI features (Claude API for longer quests)
- Mobile companion app
- Quest templates (save and reuse quest patterns)

**Don't build these during Phases 1-3.** Add to [[Idea List]].

---

## Success Criteria

**The plugin is successful if:**
1. Brad uses it daily for job hunting
2. It reduces friction (doesn't add it)
3. It provides motivation (dopamine hits work)
4. Other ADHD users want it
5. It's portfolio-worthy (clean code, good UX)

**The plugin has FAILED if:**
- Brad stops using it after a week
- Data entry takes too long (friction)
- It feels like a chore, not a game
- Code is unreadable (defeats refactoring purpose)

---

**When in doubt, optimize for Brad actually using this thing. A perfectly architected plugin that sits unused is worthless. But unlike his first plugins, this one starts clean and stays clean - no 2,850-line main.ts nightmares.**

---

**Last Updated:** 2026-01-18
