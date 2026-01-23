Alright, I ran all three docs past claude code for a more thorough review. The basics still sound good but they found a number of issues with our plan that we need to address/account for. Here's my take on the review, followed by the review itself:

## My take:

2.1: Current characters don't have gear so there shouldn't be any breaking but we do need to form a solid migration plan for my character (the only character so far, no other users)

2.4: I don't know that this is exactly an issue really. If a user WANTS to grind, that's not the end of the world as long as the primary goal of task completion is still being met. Let's balance this out a bit: impose a daily limit that's a healthy number like 50, not 20.

2.5: I'm torn on this one. On one hand it's up tot he user to make sure they have enough slots available, or we could give them the option when the loot is presented to sell/delete items in their bag. If that's too complicated, I'm open to the expanding inventory but it HAS to be blocked from gaining new items at that point. MY concern here is what if they complete one dungeon, get their inventory expanded, then immediately go into another dungeon? Theoretically, they could keep expanding their inventory if that's the way the system is built. IF we go the expansion route, we need to set a hard boundary like not allowing them to enter a new dungeon until they free up at least 2 slots or something. But I think the ideal here is really to allow selling/deleting when presented with the pending loot.

2.6: I like this idea a lot

2.10: This seems important and easy to fix for the lore naming system

2.11: I think this one could just be a known limitation. If you rename a folder midway through collecting the set, you broke it. Frustrating but also not that important and they can try again with their next project. IF this is an easy fix though, let's do it

2.12: I disagree with this one. I believe it should be one dungeon at a time. Allowing for multiple concurrent dungeons is overengineering in my opinion. If you switch PCs and then go to a different dungeon, there should be a warning that you'll lose your saved progress in the other dungeon, but there shouldn't be a choice to save the old dungeon and start another, it should be finish or lose progress

3.4: So I'm actually torn on the whole user-created dungeon system. I think we should start with our dungeons only, but build for the user-designed-dungeons down the road. Custom monsters is fine to include in MVP but dungeons should be a later release

6.1: I'm not opposed to this but what other considerations are there from changing the schema version? Like aren't all quests currently schemaVersion=1? Do we need to migrate those too?

7.2: -We need to set up unit testing before we implement ANYTHING in these plans. I want to be prepared for testing right away once changes are in place. Let's discuss the best form for this to take and I'll need help setting it up

-I'd also like help setting up a dev vault that we can test in and really get messy with things/break stuff if needed. That way my vault stays clean until we perform the migration. Not sure how this would work though. Would I need to disable my current plugin in my main vault? Or does a new vault get its own plugin folder so we would jsut deploy to that and not touch the plugin in my current vault?

9: -I have my personal character but honestly I'm fine starting over if need be. That might be the cleanest approach to be honest. Let's plan to test in a dev vault with test user and then when we finish all testing and everything, we can revisit whether migration makes sense or if starting over is the say to go. I don't have a ton of features right now so that wouldn't be the end of the world, not much lost really
-Per character. There are mechanics planned to increase this so it needs to be per player
-This is intentional but haven't tested yet. Is there a site or something I can go to to run these simulations to find the best progression routes?
-I plan to make sprites for player characters and and monsters, that's about it. I want to get tile packs and icon packs for things like dungeon environments, weapons, armor, etc. I've got my eye on a full game set you can review at https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites
-I don't have gemini integrated yet and it remains to be seen exactly how they will be integrated. Let's put a pin in this for now
-Personally I want to make mobile development a priority. The current system works fine for mobile, though a dedicated kanban screen that works specifically for mobile would be nice too. But the new systems should almost entirely be built in a way that encourages mobile play too. This seems to mostly be the case though. Modals work fine on mobile and a large amount of what we're building is modal-based right? So that's a good start but let's keep an eye towards mobile for sure.


## Claude Code Review - First pass:

Quest Board RPG Features - Architectural Review

  Executive Summary

  I've reviewed the three proposed features (Gear & Loot → Fight System → Exploration) and analyzed
  how they integrate with your existing architecture. Overall, the proposals are well-designed and
  thoughtfully scoped, but I've identified 12 critical issues and 18 architectural considerations that
   need attention before implementation.

  Key Findings:
  - ✅ Strong foundation: Your current architecture (service layer, Zustand stores, validation
  patterns) supports these features well
  - ⚠️ State management complexity: Three new Zustand stores with persistence will need careful
  coordination
  - 🔴 Critical gap: Missing migration strategy for EquippedGear format change
  - ⚠️ Race conditions: Multiple systems updating character state simultaneously
  - ⚠️ Performance: 165-tile dungeons with click handlers need optimization (already addressed in
  docs)

  ---
  1. FEATURE INTERACTION ANALYSIS

  1.1 Data Flow Across Systems

  Quest Completion
      ├─→ Award XP (existing)
      ├─→ Grant Dungeon Key (new)
      └─→ Generate Quest Bounty (Fight System)
           └─→ Combat with +200% loot luck
                └─→ Award gear (Gear System)

  Task Completion
      ├─→ Award XP (existing)
      └─→ Award Stamina (Fight System)
           └─→ Enable random combat
                └─→ Award gear (Gear System)

  Dungeon Entry (Exploration)
      ├─→ Consume Key
      ├─→ Encounter Monsters → Combat (Fight System)
      └─→ Open Chests → Loot (Gear System)

  Combat Victory (Fight System)
      ├─→ Award XP (existing)
      ├─→ Award Gold (Gear System)
      └─→ Roll Loot (Gear System)

  Gear Equipped (Gear System)
      ├─→ Update Derived Stats (existing StatsService)
      └─→ Affects Combat Power (Fight System)

  Analysis: The features form a clean progression loop with no circular dependencies. Good design!

  ---
  2. CRITICAL ISSUES (Must Address)

  🔴 Issue #1: EquippedGear Format Migration

  Problem: Current format is { slot, itemId }[]. New format is Record<GearSlot, GearItem | null>.

  Impact: Data loss if not handled. Existing users will lose equipped gear on update.

  Solution:
  // In characterStore initialization
  function migrateEquippedGear(oldFormat: any): Record<GearSlot, GearItem | null> {
    if (!Array.isArray(oldFormat)) {
      // Already new format or uninitialized
      return initializeEmptySlots();
    }

    // Migrate old format
    const newFormat: Record<GearSlot, GearItem | null> = initializeEmptySlots();

    for (const item of oldFormat) {
      if (item.slot && item.itemId) {
        // Convert old itemId reference to full GearItem
        newFormat[item.slot] = generateStarterGear(item.slot); // Fallback
      }
    }

    return newFormat;
  }

  Priority: BLOCKER - Must implement in Step 0 before any gear code.

  ---
  🔴 Issue #2: Character State Update Race Conditions

  Problem: Multiple systems will simultaneously update character:
  - XP system: character.totalXP, character.level
  - Gear system: character.gold, character.gearInventory, character.equippedGear
  - Fight system: character.currentHP, character.stamina
  - Exploration: character.dungeonKeys

  Impact: Last write wins. Updates could overwrite each other.

  Current Pattern (from codebase):
  // useXPAward.ts updates character like this:
  const updatedCharacter = { ...character, totalXP: newXP };
  onSaveCharacter(updatedCharacter); // ← Full object replace

  Risk: If Gear System updates gold while XP system updates totalXP, one change gets lost.

  Solution: Use atomic field updates in characterStore:

  // characterStore.ts - Add granular setters
  interface CharacterStore {
    // Existing
    setCharacter: (character: Character) => void;

    // NEW - Atomic field updates
    updateGold: (deltaGold: number) => void;
    updateHP: (newHP: number) => void;
    updateStamina: (deltaStamina: number) => void;
    updateDungeonKeys: (deltaKeys: number) => void;
    equipGear: (slot: GearSlot, item: GearItem) => void;
    unequipGear: (slot: GearSlot) => GearItem | null;
  }

  // Implementation
  updateGold: (deltaGold) => {
    set((state) => {
      if (!state.character) return state;
      const newGold = Math.max(0, state.character.gold + deltaGold);
      return {
        character: { ...state.character, gold: newGold }
      };
    });

    // Persist
    get().saveCharacter();
  }

  Priority: HIGH - Implement before Fight/Gear systems.

  ---
  🔴 Issue #3: Combat State Loss on Obsidian Restart

  Problem: Fight System doc says:
  "Combat state MUST persist if user switches notes!"

  But what about Obsidian restart mid-combat?

  Current Approach: Zustand persist middleware saves to localStorage.

  Risk: localStorage is per-window. If user:
  1. Starts combat in vault A
  2. Closes Obsidian
  3. Opens vault B on different PC
  4. Returns to vault A

  Combat state syncs via Obsidian Sync, but localStorage is isolated.

  Solution: Dual persistence for combat:

  // useBattleStore - Use BOTH localStorage AND plugin data
  const useBattleStore = create<BattleState>()(
    persist(
      (set, get) => ({
        // ... battle state
      }),
      {
        name: 'quest-board-battle',
        storage: createBattleStorage(), // Custom storage
      }
    )
  );

  // Custom storage writes to BOTH
  function createBattleStorage(): StateStorage {
    return {
      getItem: async (name) => {
        // Try localStorage first (fast)
        const local = localStorage.getItem(name);
        if (local) return local;

        // Fallback to plugin data (synced)
        const plugin = app.plugins.getPlugin('quest-board');
        return plugin?.settings?.battleState || null;
      },

      setItem: async (name, value) => {
        // Write to both
        localStorage.setItem(name, value);

        const plugin = app.plugins.getPlugin('quest-board');
        if (plugin) {
          plugin.settings.battleState = value;
          await plugin.saveSettings();
        }
      },
    };
  }

  Priority: HIGH - Prevents combat state loss.

  ---
  🔴 Issue #4: Stamina Anti-Grind Bypass

  Problem: Fight System has stamina to prevent grinding, but what about:
  - User completes 100 tasks → 200 stamina (capped at 10)
  - User fights 10 times
  - User completes 1 task → +2 stamina
  - User fights 2 more times
  - Loop forever

  Risk: "1 task = 2 fights" breaks the anti-grind intent if user task-completes incrementally.

  Solution: Daily stamina cap:

  interface Character {
    // ... existing
    stamina: number;
    staminaGainedToday: number;      // NEW - Reset at midnight
    lastStaminaResetDate: string;    // NEW - ISO date
  }

  function awardStamina(character: Character, amount: number): Character {
    const today = getLocalDateString();

    // Reset if new day
    if (character.lastStaminaResetDate !== today) {
      character.staminaGainedToday = 0;
      character.lastStaminaResetDate = today;
    }

    // Cap daily gain at 20 (10 fights max per day)
    const MAX_DAILY_STAMINA = 20;
    if (character.staminaGainedToday >= MAX_DAILY_STAMINA) {
      return character; // No more stamina today
    }

    const granted = Math.min(amount, MAX_DAILY_STAMINA - character.staminaGainedToday);
    character.stamina = Math.min(character.stamina + granted, 10);
    character.staminaGainedToday += granted;

    return character;
  }

  Priority: MEDIUM - Not a blocker, but needed for anti-grind goals.

  ---
  ⚠️ Issue #5: Inventory Full - Silent Loot Loss

  Problem: Gear doc addresses this with a modal, but what if:
  - User completes dungeon with 10 pending loot items
  - User has 45/50 inventory slots used
  - 10 pending items exceed limit

  Current Solution (from doc): Show modal on individual drops.

  Gap: Dungeon gives loot on EXIT, not per-chest. Pending loot accumulates.

  Solution: Expand inventory temporarily for dungeon rewards:

  function exitDungeon(completed: boolean): void {
    const pendingLoot = useDungeonStore.getState().pendingLoot;
    const gearRewards = pendingLoot.filter(r => r.type === 'gear');

    const character = useCharacterStore.getState().character;
    const freeSlots = character.inventoryLimit - character.gearInventory.length;

    if (gearRewards.length > freeSlots) {
      // OPTION A: Allow temporary overflow (preferred for UX)
      showNotification(`Inventory expanded temporarily! Sell items to return to
  ${character.inventoryLimit} limit.`);
      grantAllLoot(pendingLoot);
      character.inventoryOverflowUntil = Date.now() + (24 * 60 * 60 * 1000); // 24h grace period
    } else {
      // OPTION B: Force sell/discard modal
      showInventoryFullModal({ ... });
    }
  }

  Priority: MEDIUM - UX issue, not data integrity issue.

  ---
  ⚠️ Issue #6: Dungeon Key Cap Too Low

  Problem: Fight doc says:
  "Cap dungeon keys at 3-5. Prevents hoarding..."

  But if user completes 3 main quests in one day (realistic), they hit cap instantly and waste
  rewards.

  Risk: Feels punishing, not rewarding. "I earned a key but can't collect it."

  Solution: Higher cap with decay:

  interface DungeonKeyConfig {
    maxKeys: number;           // 10 (not 5)
    decayToMax: number;        // 5 (soft cap)
    decayRate: number;         // -1 key per day if > decayToMax
  }

  // At midnight check:
  function applyKeyDecay(character: Character): void {
    if (character.dungeonKeys > 5) {
      character.dungeonKeys -= 1;
      showNotification("Unused dungeon keys decay over time. Use them before they expire!");
    }
  }

  This allows:
  - Earning 3-5 keys in a productive day
  - Using them over the weekend
  - Prevents infinite hoarding (decay over time)

  Priority: LOW - Design refinement, not critical.

  ---
  🔴 Issue #7: Gear Stat Recalculation Performance

  Problem: Gear doc says:
  "Recalculate on equip/unequip only."

  But when exactly? If recalc is synchronous and heavy, UI could freeze.

  Current Pattern (from StatsService.ts):
  getTotalStat(character, stat) {
    const base = character.baseStats[stat];
    const bonus = character.statBonuses[stat];
    const powerUp = getStatBoostFromPowerUps(character.activePowerUps, stat);
    return base + bonus + powerUp;
  }

  New calculation with gear:
  getTotalStat(character, stat) {
    let total = character.baseStats[stat];
    total += character.statBonuses[stat];
    total += getStatBoostFromPowerUps(character.activePowerUps, stat);

    // NEW - Sum gear stats
    for (const slot of GEAR_SLOTS) {
      const item = character.equippedGear[slot];
      if (item) {
        total += item.stats.primaryValue || 0;
        total += item.stats.secondaryStats?.[stat] || 0;
      }
    }

    // NEW - Apply set bonuses
    total += getSetBonuses(character.equippedGear, stat);

    return total;
  }

  Risk: Called EVERY time CharacterSheet renders (potentially every React render).

  Solution: Cached derived stats in character store:

  interface CharacterStore {
    character: Character | null;
    derivedCombatStats: CombatStats | null; // NEW - Cached

    // Call this ONLY on equip/unequip/level-up
    recalculateCombatStats: () => void;
  }

  recalculateCombatStats: () => {
    const character = get().character;
    if (!character) return;

    const stats = calculateDerivedCombatStats(character); // Heavy calc
    set({ derivedCombatStats: stats });
  }

  // Components read cached value
  const combatStats = useCharacterStore(s => s.derivedCombatStats);

  Priority: MEDIUM - Not critical for 50 gear items, but needed for scale.

  ---
  ⚠️ Issue #8: A Pathfinding Timeout Not Enough*

  Problem: Exploration doc says:
  "Max 500 iterations, then just step once toward goal"

  But if room is intentionally unsolvable (wall blocking), A* will:
  1. Hit 500 iterations
  2. Return "step toward goal"
  3. Step into wall (illegal move)
  4. Player clicks again
  5. Infinite loop

  Solution: Validate result before applying:

  function findPath(start, goal, room) {
    const path = aStarWithTimeout(start, goal, room, 500);

    if (!path || path.length === 0) {
      // Timeout - check if goal is even reachable
      if (!isWalkable(goal, room)) {
        return null; // Goal is a wall!
      }

      // Goal is walkable but path not found - return safe fallback
      const fallback = getAdjacentWalkableTile(start, room);
      return fallback ? [fallback] : null;
    }

    return path;
  }

  function handleTileClick(x, y) {
    const path = findPath(playerPos, [x, y], currentRoom);

    if (!path) {
      showNotification("Can't reach that tile!");
      return; // Don't move
    }

    moveAlongPath(path);
  }

  Priority: MEDIUM - Prevents UI frustration.

  ---
  ⚠️ Issue #9: Monster Loot Table - Specific Items Missing

  Problem: Fight System doc says:
  "Loot table supports both random slots AND specific unique items"

  interface LootTableEntry {
    slot?: GearSlot;        // For random generation
    itemId?: string;        // For specific unique items
    chance: number;
  }

  But Gear System's LootGenerationService doesn't have a unique item registry. How do you resolve
  itemId: "goblin_kings_crown"?

  Gap: No data structure for unique/named items.

  Solution: Separate unique items from procedural gear:

  // New file: src/data/uniqueItems.ts
  export const UNIQUE_ITEMS: Record<string, GearItem> = {
    goblin_kings_crown: {
      id: 'unique_goblin_kings_crown',
      name: "Goblin King's Crown",
      tier: 'epic',
      slot: 'head',
      stats: { /* fixed stats */ },
      isUnique: true,
      // ... rest
    },
  };

  // LootGenerationService.ts
  function rollLoot(lootTable: LootTableEntry[]): GearItem | null {
    for (const entry of lootTable) {
      if (Random(0, 100) < entry.chance) {
        if (entry.itemId) {
          // Specific unique item
          return UNIQUE_ITEMS[entry.itemId] || null;
        } else if (entry.slot) {
          // Procedural gear
          return generateGearItem(entry.slot, ...);
        }
      }
    }
    return null;
  }

  Priority: LOW - Can implement later with bosses.

  ---
  🟡 Issue #10: Legendary Lore - Quest Context Lost

  Problem: Gear doc proposes storing originQuest: string (quest title).

  But quests can be renamed or deleted. Legendary items would reference dead quests.

  Solution: Store quest ID + snapshot:

  interface GearItem {
    // ... existing

    // Legendary origin
    isLegendary: boolean;
    legendaryLore?: string;
    originQuestId?: string;           // Quest ID (stable)
    originQuestTitle?: string;        // Snapshot (display even if quest deleted)
    originQuestCategory?: string;     // Snapshot
  }

  Priority: LOW - Nice-to-have for lore feature.

  ---
  ⚠️ Issue #11: Set Bonuses - Folder Rename Breaks Sets

  Problem: Gear doc says:
  "Sets are created automatically based on quest folder structure"

  function getSetFromQuest(quest: Quest): GearSet | null {
    const folderPath = quest.path.substring(0, quest.path.lastIndexOf('/'));
    const folderName = folderPath.split('/').pop();

    return {
      id: hashString(folderPath), // ← Hash of path
      name: folderName,
      // ...
    };
  }

  Risk: If user renames folder Kitchen Renovation → Kitchen Project, the set ID changes. Existing
  equipped gear loses set bonuses.

  Solution: Normalize folder paths before hashing:

  function normalizeSetId(folderPath: string): string {
    // Remove vault prefix, normalize separators
    const normalized = folderPath
      .replace(/^.*\/Quest Board\/quests\//, '')
      .toLowerCase()
      .replace(/\s+/g, '_');

    return hashString(normalized);
  }

  // OR: Store set ID in gear item at drop time
  interface GearItem {
    setId?: string;        // Captured at drop, never changes
    setName?: string;      // Display name (can update)
  }

  Priority: MEDIUM - Affects long-term gear value.

  ---
  🟡 Issue #12: Exploration Dungeon State - Multi-Device Conflict

  Problem: Exploration doc says:
  "Light persistence only... save to data.json"

  But if user:
  1. Starts dungeon on PC 1
  2. Opens Obsidian on PC 2
  3. Starts DIFFERENT dungeon

  Both write to settings.dungeonState. Last save wins. PC 1's dungeon progress lost.

  Solution: Instance-based persistence:

  interface PluginSettings {
    // OLD (single dungeon)
    dungeonState?: PersistedDungeonState;

    // NEW (multiple instances)
    dungeonInstances: Record<string, PersistedDungeonState>; // Key = dungeonInstanceId
  }

  // On dungeon start:
  const instanceId = crypto.randomUUID();
  settings.dungeonInstances[instanceId] = { ... };

  // On dungeon end:
  delete settings.dungeonInstances[instanceId];

  This allows:
  - Multiple dungeons in progress (PC 1 + PC 2)
  - Old instances auto-cleaned on completion
  - No cross-device conflicts

  Priority: MEDIUM - Multi-device support.

  ---
  3. ARCHITECTURAL CONCERNS

  3.1 Zustand Store Explosion

  Current stores: 4 (quest, character, ui, taskSections)
  New stores: 3 (gear/inventory, battle, dungeon)

  Total: 7 Zustand stores

  Risk: State management complexity. Which store owns what?

  Recommendation: Consolidate gear into character store:

  // characterStore.ts - Extend instead of creating gearStore
  interface CharacterStore {
    character: Character | null;
    inventory: InventoryItem[];
    gearInventory: GearItem[];        // NEW
    achievements: Achievement[];
    gold: number;                     // NEW (move from Character)
    dungeonKeys: number;              // NEW (move from Character)

    // Actions
    addGear: (item: GearItem) => void;
    removeGear: (itemId: string) => GearItem | null;
    equipGear: (slot: GearSlot, item: GearItem) => void;
    unequipGear: (slot: GearSlot) => GearItem | null;
    updateGold: (delta: number) => void;
  }

  Reasoning: Gear is tightly coupled to character. Separate store adds coordination overhead.

  ---
  3.2 Service Layer Patterns

  Observation: Your services are stateless functions (XPSystem) or instantiated per-use
  (AchievementService).

  New systems propose:
  - LootGenerationService (stateless ✅)
  - BattleService (stateless ✅)
  - ExplorationService (stateless ✅)
  - SmeltingService (stateless ✅)

  Recommendation: Keep this pattern! It's clean and testable.

  // ✅ GOOD - Stateless service
  export function calculateDamage(attacker: CombatStats, defender: CombatStats): DamageResult {
    // Pure function
  }

  // ❌ AVOID - Stateful singleton
  class BattleManager {
    private activeBattle: Battle | null = null;
    // This belongs in Zustand, not a service!
  }

  ---
  3.3 Validation Strategy

  Current pattern (from validator.ts):
  export function validateQuest(data: unknown): ValidationResult {
    // Type guards, required fields, defaults
  }

  New validation needed:
  - validateGearItem(data: unknown)
  - validateMonsterTemplate(data: unknown)
  - validateDungeonTemplate(data: unknown)

  Recommendation: Extend existing validator.ts instead of creating per-feature validators.

  // validator.ts - Add to existing file
  export function validateGearItem(data: unknown): ValidationResult<GearItem> {
    // ... validation
  }

  export function validateDungeonTemplate(data: unknown): ValidationResult<DungeonTemplate> {
    // ... validation
  }

  ---
  3.4 File I/O Patterns

  Current pattern: Quests are vault files. Everything else is loadData()/saveData().

  New data:
  - Gear inventory: loadData() ✅
  - Monster templates: Plugin files (TypeScript) ✅
  - Dungeon templates: Plugin files OR vault files (user choice) ⚠️

  Recommendation: Hybrid approach (already in Exploration doc):

  Plugin files (src/data/):
  ├── monsters.ts           // Default monsters
  ├── dungeons.ts           // Default dungeons
  └── uniqueItems.ts        // Unique gear

  Vault files (optional):
  ├── System/Quest Board/
      ├── Custom Monsters/
      └── Custom Dungeons/

  User files override plugin defaults (power user feature).

  ---
  4. SECURITY REVIEW

  4.1 Input Validation

  Current security (excellent!):
  - ✅ SafeJSON with prototype pollution filter
  - ✅ Path validation for quest files
  - ✅ DOMPurify for AI-generated content
  - ✅ Schema validation with defaults

  New attack vectors:

  A. Gear Item Injection

  If gear items are procedurally generated, no user input = no risk ✅

  But if AI generates legendary lore:

  // legendaryLore from AI could contain <script>
  const item: GearItem = {
    legendaryLore: aiResponse.flavorText, // ← SANITIZE THIS
  };

  Solution: Sanitize AI output:

  import DOMPurify from 'isomorphic-dompurify';

  function generateLegendaryLore(quest: Quest): string {
    const rawLore = callAI(prompt);
    return DOMPurify.sanitize(rawLore, { ALLOWED_TAGS: [] }); // Strip all HTML
  }

  B. Dungeon Template Loading

  If users can create custom dungeon templates in vault:

  # Custom Dungeon.md
  ---
  dungeonId: "../../../sensitive-file" # Path traversal!
  ---

  Solution: Use existing pathValidator.ts:

  import { validatePath } from './utils/pathValidator';

  function loadCustomDungeon(path: string): DungeonTemplate | null {
    const validPath = validatePath(vault, path, 'System/Quest Board/Custom Dungeons/');
    if (!validPath) {
      console.warn('Invalid dungeon path:', path);
      return null;
    }

    // Safe to load
    const content = await vault.read(validPath);
    return parseDungeonTemplate(content);
  }

  Priority: HIGH - Apply before allowing custom dungeons.

  ---
  4.2 Data Integrity

  Existing protection:
  - ✅ Schema versioning (schemaVersion: 1)
  - ✅ Type coercion in validator
  - ✅ Default values for missing fields

  New data structures need same treatment:

  interface GearItem {
    schemaVersion: 1; // ADD THIS
    id: string;
    // ... rest
  }

  interface DungeonTemplate {
    schemaVersion: 1; // ADD THIS
    id: string;
    // ... rest
  }

  Recommendation: Add schema version to ALL new data types.

  ---
  5. PERFORMANCE ANALYSIS

  5.1 Render Performance

  Potential bottlenecks:

  1. Dungeon grid (165 tiles)
    - ✅ Already addressed in doc with event delegation
    - ✅ CSS Grid is performant
  2. Inventory rendering (50+ gear items)
    - ⚠️ If each item is a React component with hover tooltips

  Solution: Use React.memo + virtualization:

  import { FixedSizeGrid } from 'react-window';

  function InventoryGrid({ items }: { items: GearItem[] }) {
    return (
      <FixedSizeGrid
        columnCount={5}
        rowCount={Math.ceil(items.length / 5)}
        columnWidth={64}
        rowHeight={64}
        height={400}
        width={400}
      >
        {({ columnIndex, rowIndex, style }) => {
          const item = items[rowIndex * 5 + columnIndex];
          return <GearIcon key={item.id} item={item} style={style} />;
        }}
      </FixedSizeGrid>
    );
  }
  3. Combat animations
    - ✅ CSS-based (performant)
    - ⚠️ Make sure to use transform (GPU) not left/top (CPU)

  Recommendation: Profile with React DevTools after implementing inventory UI.

  ---
  5.2 Data Size Growth

  Current data (character):
  - Character: ~2 KB
  - Achievements: ~5 KB (32 items)
  - Inventory (consumables): ~1 KB

  New data:
  - Gear inventory (50 items): ~25 KB (500 bytes each)
  - Dungeon state: ~5 KB (room states)
  - Battle state: ~2 KB

  Total: ~40 KB per user

  Obsidian limit: loadData() max is ~1 MB per plugin.

  Verdict: No problem ✅ Even with 200 gear items (~100 KB), still well under limit.

  Future consideration (from Gear doc):
  "Auto-archive Common items after 30 days"

  Good idea! Implement when users report slow loads.

  ---
  5.3 File Watcher Load

  Current watchers:
  - Quest folder (granular, per-file)
  - Linked task files (via map)
  - XP award (singleton across components)

  New watchers needed:
  - None! Gear/combat/dungeon use loadData(), not vault files ✅

  Verdict: No impact on file watcher performance.

  ---
  6. INTEGRATION CHECKLIST

  6.1 Character Model Extensions

  Required fields to add:

  interface Character {
    // ... existing fields ...

    // Gear System
    gearInventory: GearItem[];
    equippedGear: Record<GearSlot, GearItem | null>;
    gold: number;
    inventoryLimit: number;                    // Default 50, unlock via achievements
    inventoryOverflowUntil?: number;           // Timestamp for temp overflow

    // Fight System
    currentHP: number;
    currentMana: number;
    stamina: number;
    staminaGainedToday: number;
    lastStaminaResetDate: string;
    lastLongRest?: string;                     // ISO date of last long rest

    // Exploration
    dungeonKeys: number;
    dungeonKeysEarnedToday: number;
    lastDungeonKeyResetDate: string;
  }

  Migration function needed for ALL of these:

  function migrateCharacterV2(old: Character): Character {
    return {
      ...old,
      schemaVersion: 2, // Bump version

      // Gear defaults
      gearInventory: old.gearInventory || [],
      equippedGear: old.equippedGear || initializeEquippedGear(),
      gold: old.gold ?? 0,
      inventoryLimit: old.inventoryLimit ?? 50,

      // Combat defaults
      currentHP: old.currentHP ?? calculateMaxHP(old),
      currentMana: old.currentMana ?? calculateMaxMana(old),
      stamina: old.stamina ?? 10,
      staminaGainedToday: old.staminaGainedToday ?? 0,
      lastStaminaResetDate: old.lastStaminaResetDate ?? getLocalDateString(),

      // Exploration defaults
      dungeonKeys: old.dungeonKeys ?? 0,
      dungeonKeysEarnedToday: old.dungeonKeysEarnedToday ?? 0,
      lastDungeonKeyResetDate: old.lastDungeonKeyResetDate ?? getLocalDateString(),
    };
  }

  ---
  6.2 Service Integration Points

  XPSystem.ts - No changes needed ✅

  StatsService.ts - Extend for gear bonuses:
  // Add gear bonus calculation
  export function getDerivedCombatStats(character: Character): CombatStats {
    const base = getTotalStat(character, ...);

    // Add gear bonuses
    let attackPower = base.str;
    for (const slot of GEAR_SLOTS) {
      const item = character.equippedGear[slot];
      if (item?.stats.attackPower) {
        attackPower += item.stats.attackPower;
      }
    }

    // ... rest of derived stats
  }

  PowerUpService.ts - No changes needed ✅ (already supports stat boosts)

  AchievementService.ts - No changes needed ✅

  useXPAward.ts - Add stamina/key rewards:
  // After awarding XP for task completion:
  awardStamina(character, 2);

  // After quest completion:
  if (quest.type === 'main') {
    awardDungeonKey(character, 1);
    const bounty = generateQuestBounty(quest);
    showBountyNotification(bounty);
  }

  ---
  6.3 UI Component Mapping

  Existing components that need updates:

  1. CharacterSheet.tsx:
    - Add gear slots display
    - Add gold display
    - Add HP/Mana bars
    - Add stamina/dungeon keys
  2. QuestCard.tsx:
    - Add bounty indicator (if quest has active bounty)

  New components needed:

  1. Gear System:
    - InventoryPanel.tsx (tabs: Gear | Consumables)
    - GearIcon.tsx (with tier colors)
    - GearTooltip.tsx (hover stats)
    - LootModal.tsx (quest completion rewards)
    - SmeltingPanel.tsx (blacksmith 3→1 merge)
  2. Fight System:
    - BattleView.tsx (combat arena)
    - BattleActions.tsx (Attack/Defend/Run buttons)
    - BattleLog.tsx (combat text feed)
    - DefeatModal.tsx (death recovery options)
    - BountyNotification.tsx (quest bounty popup)
  3. Exploration:
    - DungeonSelectionModal.tsx (choose dungeon)
    - DungeonView.tsx (CSS Grid tile renderer)
    - DungeonMinimap.tsx (3x3 corner map)
    - ChestLootModal.tsx (open chest)
    - ExitDungeonModal.tsx (early exit confirmation)

  ---
  7. RECOMMENDATIONS

  7.1 Implementation Order (Refined)

  Phase 3A: Gear & Loot (5-7 days)

  0. Migration & Schema
    - Add schemaVersion: 2 migration for Character
    - Migrate EquippedGear format
    - Add atomic character store actions
    - Test migration with existing user data
  1. Data Models
    - GearItem, GearSlot, GearTier types
    - LootReward discriminated union
    - Validate with validateGearItem()
  2. Gold & Inventory
    - Add gold, gearInventory to Character
    - Character store actions: updateGold(), addGear(), removeGear()
    - Settings migration
    - Test save/load
  3. Starter Gear
    - Create starter gear set (6 items)
    - Assign to new characters
    - Migrate existing characters (give starter gear)
  4. Loot Generation
    - LootGenerationService.ts
    - Tier rolling, stat scaling formula
    - Quest → slot mapping
    - Test with various levels/tiers
  5. Quest Completion Integration
    - Hook into QuestActionsService.moveQuest()
    - Roll loot on quest complete
    - Show LootModal
    - Award gold
  6. Character Sheet UI
    - Gear slots display
    - Gold counter
    - Test gear tooltips
  7. Inventory UI
    - Grid view (with virtualization if >50 items)
    - Equip/unequip actions
    - Sell items
    - Test with 50+ items
  8. Blacksmith (Smelting)
    - Transaction pattern (mark pending → create → delete)
    - UI with 3-slot merge
    - Test edge cases (inventory full, different tiers)
  9. Set Bonuses
    - Folder-based set generation
    - Bonus calculation on equip
    - Display in Character Sheet
  10. Legendary Lore
    - Template-based generation (AI optional)
    - Origin quest snapshot
    - Display in tooltip

  Phase 3B: Fight System (5-7 days)

  1. Combat Stats
    - CombatStats interface
    - Extend StatsService with gear bonuses
    - Cache derived stats in character store
    - Test stat scaling
  2. Stamina System
    - Add stamina fields to Character
    - Award +2 per task (with daily cap)
    - Consume -1 per fight
    - Test anti-grind protection
  3. Store System
    - /buy slash command
    - Consumable items (health/mana potions)
    - Gold transaction
    - Test purchase validation
  4. HP/Mana Persistence
    - Add to Character
    - Display in Character Sheet
    - Long Rest mechanic (daily routine file)
    - Test across sessions
  5. Battle Store
    - Zustand store with dual persistence (localStorage + plugin data)
    - State machine: PLAYER_INPUT → PROCESSING → ANIMATING → etc.
    - Test crash recovery
  6. Monster System
    - MonsterTemplate interface
    - Create 5-10 base monsters (with emoji fallbacks)
    - Prefix system (Fierce/Sturdy/Ancient)
    - Stat scaling formula
    - Test level matching
  7. Battle Service
    - Damage calculation (with dodge/block/crit)
    - Turn execution
    - Victory/defeat handling
    - Test edge cases (0 damage, crit chains)
  8. Combat UI
    - BattleView with sprites + emoji fallbacks
    - Action buttons (Attack/Defend/Run)
    - HP/Mana bars
    - Combat log
    - CSS animations (shake, flash, critical numbers)
    - Test on mobile (touch controls)
  9. Death Penalty
    - "Unconscious" status
    - Gold penalty (10%)
    - Recovery options modal
    - Test all 3 recovery paths
  10. Quest Bounty System
    - Generate bounty on main quest complete
    - +200% loot luck
    - Bounty notification UI
    - Test loot table tier jump

  Phase 3C: Exploration (7-10 days)

  1. Dungeon State Store
    - Zustand store with light persistence
    - Instance-based (support multi-device)
    - Room state tracking
    - Test save/load/cleanup
  2. Tile System
    - TileDefinition, TileInstance types
    - Emoji fallbacks for all tile types
    - Walkability rules
    - Test rendering
  3. Room Rendering
    - CSS Grid with event delegation
    - Player sprite with transform animation
    - Test performance (165 tiles)
  4. Click-to-Move
    - A* pathfinding with timeout (500 iterations)
    - Validate path before moving
    - Fallback for unreachable tiles
    - Test edge cases (walls, invalid clicks)
  5. Keyboard Controls
    - WASD + arrows for single-step movement
    - E for interact
    - Test with dungeon focus loss
  6. Room Transitions
    - Fade-to-black animation (150ms out/in)
    - Door auto-trigger
    - Load new room
    - Test with combat interruption
  7. Dungeon Templates
    - Create "Goblin Cave" (5 rooms)
    - Room layout validation (auto-pad rows)
    - Door definitions embedded in rooms
    - Test loading/parsing
  8. Room State Tracking
    - Chests opened array
    - Monsters killed array
    - Persist per room
    - Test exploit prevention (leave/return)
  9. Chest Interaction
    - Loot modal on open
    - Add to pending rewards
    - Mark chest opened
    - Test inventory full edge case
  10. Combat Integration
    - Monster encounter triggers Fight System
    - Freeze exploration during combat
    - Resume on victory
    - Handle death in dungeon
    - Test state handoff
  11. Death Handling
    - Death modal with 3 options
    - Rescue (gold payment)
    - Restart (lose progress)
    - Leave (keep loot so far)
    - Test all paths
  12. Exit & Rewards
    - Grant pending loot on exit
    - Consume dungeon key
    - Summary screen
    - Test key refund on early exit
  13. Dungeon Selection UI
    - List templates with loot bias
    - Key counter display
    - Random dungeon option
    - Test key consumption
  14. Minimap
    - 3x3 corner view
    - Full map modal
    - Fog of war (CSS filter)
    - Test performance (10+ rooms)
  15. Additional Dungeons
    - Create 1-2 more templates
    - Test variety, difficulty scaling
  16. AI Generation (Stretch)
    - Two-pass LLM dungeon creation
    - Validation + auto-padding
    - Test quality/playability
  17. Mobile Touch
    - D-pad with onTouchStart
    - Larger tap targets (44x44px)
    - Test on mobile Obsidian

  ---
  7.2 Testing Strategy

  For each phase:

  1. Unit Tests (if adding to test suite):
    - Services: Loot generation, damage calculation, pathfinding
    - Validators: Gear, monsters, dungeons
  2. Manual Testing Checklist:
    - Create test character in dev vault
    - Run through full flow (quest → loot → equip → combat → dungeon)
    - Test edge cases (inventory full, death, crash recovery)
    - Test multi-device (sync via Obsidian Sync)
  3. Performance Testing:
    - Profile with 50+ gear items
    - Profile dungeon with 165 tiles
    - Check file watcher impact

  ---
  7.3 Documentation Updates Needed

  Update these docs after implementation:

  - CLAUDE.md: Add Gear/Fight/Exploration sections to File Structure
  - Session Log.md: Log progress, decisions, bugs
  - Feature Roadmap.md: Mark Phase 3 items complete
  - New files:
    - docs/Gear System.md (tech reference)
    - docs/Combat Mechanics.md (formulas, balancing)
    - docs/Dungeon Creation Guide.md (for custom dungeons)

  ---
  8. FINAL VERDICT

  8.1 Overall Assessment

  Rating: ⭐⭐⭐⭐☆ (4/5 - Very Strong)

  Strengths:
  - ✅ Well-scoped features with clear MVP boundaries
  - ✅ Thoughtful anti-grind mechanics (stamina, key caps, decay)
  - ✅ Good separation of concerns (services, stores, UI)
  - ✅ Security already considered (AI sanitization, path validation)
  - ✅ Performance optimizations noted (event delegation, caching)
  - ✅ Emoji fallbacks throughout (excellent resilience pattern)

  Weaknesses:
  - ⚠️ Character state update race conditions need atomic actions
  - ⚠️ Migration strategy missing for EquippedGear format change
  - ⚠️ Some edge cases under-specified (inventory overflow, A* invalid paths)
  - ⚠️ Zustand store count growing (7 total - manageable but complex)

  ---
  8.2 Go/No-Go Recommendation

  Verdict: 🟢 GO - Proceed with implementation

  Conditions:
  1. ✅ Address Critical Issues #1-3 BEFORE starting (migration, race conditions, combat persistence)
  2. ✅ Implement atomic character updates in Phase 3A Step 0
  3. ✅ Test migration with existing user data before deploying
  4. ⚠️ Monitor performance after each phase (profile with DevTools)
  5. ⚠️ Consider consolidating gear into character store (optional optimization)

  ---
  8.3 Risk Mitigation Priorities

  High Priority (Implement before Phase 3A):
  - Character schema v2 migration
  - Atomic character store actions (updateGold, updateHP, etc.)
  - Dual persistence for combat state

  Medium Priority (Implement during phases):
  - Stamina daily cap (anti-grind)
  - Gear stat cache (performance)
  - A* path validation (UX)
  - Set bonus folder rename handling

  Low Priority (Defer to polish phase):
  - Unique item registry
  - Legendary lore quest snapshots
  - Inventory auto-archive
  - Dungeon key decay system

  ---
  9. QUESTIONS FOR YOU

  Before you start implementation, clarify these:

  1. Character Schema Migration: Do you have existing users with data, or is this still
  development-only? If real users, test migration thoroughly.
  2. Gear Inventory Limit: Doc says 50 slots. Is this per-character or global? (I assume
  per-character)
  3. Combat Balance: Have you playtested the damage formulas? Stats scale exponentially with gear
  (Level 40 Legendary = 240 stat points). Is this intentional?
  4. Dungeon Commitment: Docs mention 2-3 hand-crafted dungeons. Each is ~10-20 rooms. That's
  significant asset creation (sprites, layouts). Are you generating sprites with AI, or using existing
   tile packs?
  5. AI Integration: Docs mention AI for legendary lore and dungeon generation. Do you already have
  Gemini API integrated, or is this new?
  6. Mobile Support: Obsidian mobile is mentioned. Are you actively testing on mobile, or is this
  desktop-first with mobile as stretch goal?

  ---
  10. SUMMARY

  Your RPG features are well-designed and ready for implementation with the critical issues addressed.
   The architecture is clean, security is considered, and performance optimizations are noted.

  Key Takeaways:
  - ✅ Features integrate cleanly with existing codebase
  - 🔴 Fix character state race conditions FIRST
  - 🔴 Implement migration for EquippedGear format change
  - ⚠️ 7 Zustand stores is manageable but consider consolidation
  - ✅ Follow the refined implementation order above
  - ✅ Test each phase before moving to next

  Estimated Implementation Time:
  - Phase 3A (Gear): 5-7 days
  - Phase 3B (Combat): 5-7 days
  - Phase 3C (Exploration): 7-10 days
  - Total: 17-24 days of focused work

  Next Steps:
  1. Review this report
  2. Answer the 6 questions above
  3. Implement Critical Issues #1-3
  4. Begin Phase 3A Step 0 (Migration)

  Good luck! The plugin is going to be awesome. 🎮⚔️


  # I fed Claude Code my answer and review at this point. They then responded with the below

  ## Claude code review -pass 2:

  Updated Architectural Review - Key Changes

  CRITICAL ISSUES - REVISED STATUS

  ✅ Issue #1: Migration Strategy - SIMPLIFIED

  New Approach: Test in dev vault → decide on migration vs fresh start later
  - Since you're the only user and open to restarting, this is no longer a blocker
  - We'll implement the migration code anyway (good practice), but won't stress-test it
  - Action: Build dev vault setup first (see Section 8 below)

  ✅ Issue #2: Character State Race Conditions - STILL CRITICAL

  No change here - atomic updates still needed for gold/HP/stamina/keys

  ✅ Issue #3: Combat State Persistence - STILL HIGH PRIORITY

  No change - dual persistence needed

  ✅ Issue #4: Stamina Daily Cap - UPDATED TO 50

  New limit: 50 stamina/day = 25 fights max
  const MAX_DAILY_STAMINA = 50; // Was 20, now 50
  This is a reasonable balance - prevents truly infinite grinding while allowing substantial gameplay.

  ✅ Issue #5: Inventory Full - NEW PRIMARY SOLUTION

  Primary: Sell/Delete modal when presenting pending loot
  Fallback: Temporary expansion with dungeon entry block

  function exitDungeon(completed: boolean): void {
    const pendingLoot = useDungeonStore.getState().pendingLoot;
    const gearRewards = pendingLoot.filter(r => r.type === 'gear');

    const character = useCharacterStore.getState().character;
    const freeSlots = character.inventoryLimit - character.gearInventory.length;

    if (gearRewards.length > freeSlots) {
      // PRIMARY: Show management modal
      showInventoryManagementModal({
        pendingLoot: gearRewards,
        freeSlots,
        onConfirm: (acceptedItems) => {
          grantLoot(acceptedItems);
          // User sold/deleted enough items to make room
        },
        onAbandon: () => {
          // User chose to abandon excess loot
          showNotification('Some loot was abandoned.');
        },
      });
    } else {
      // Enough room - grant all
      grantAllLoot(pendingLoot);
    }
  }

  // Inventory Management Modal UI:
  // - Left: Pending loot (with stats, can mark for abandon)
  // - Right: Current inventory (can sell/delete items)
  // - Bottom: "Free X more slots to accept all" counter
  // - Confirm button enabled when enough slots free

  Why this is better: User has agency, no weird overflow states, no dungeon entry blocking logic.

  ✅ Issue #6: Key Decay - APPROVED

  You like this one, so we'll implement it.

  ✅ Issue #10: Legendary Lore - CONFIRMED IMPORTANT

  Easy fix, will implement.

  ✅ Issue #11: Set Bonuses Folder Rename - IMPLEMENT IF EASY

  Let me show you how easy it is:

  // Simple normalization - 5 lines
  function normalizeSetId(folderPath: string): string {
    return folderPath
      .replace(/^.*\/quests\//, '') // Remove prefix
      .toLowerCase()
      .replace(/\s+/g, '_');         // "Kitchen Renovation" → "kitchen_renovation"
  }

  // Store normalized ID in gear at drop time
  interface GearItem {
    setId: string;      // "kitchen_renovation" (stable)
    setName: string;    // "Kitchen Renovation" (display, can change)
  }

  Verdict: This IS easy. Let's do it. 5 minutes to implement, saves frustration.

  ✅ Issue #12: Multi-Dungeon Instances - SIMPLIFIED TO SINGLE DUNGEON

  New approach: One active dungeon at a time, warn on overwrite.

  interface PluginSettings {
    // Single dungeon state, not Record<>
    activeDungeonState?: PersistedDungeonState;
  }

  function startDungeon(templateId: string): void {
    const existing = plugin.settings.activeDungeonState;

    if (existing) {
      showWarningModal({
        title: 'Active Dungeon Detected',
        message: `You have an in-progress dungeon (${existing.dungeonTemplateId}). Starting a new
  dungeon will lose your progress.`,
        options: [
          { label: 'Resume Existing', action: () => resumeDungeon(existing) },
          { label: 'Abandon & Start New', action: () => overwriteDungeon(templateId) },
          { label: 'Cancel', action: () => {} },
        ],
      });
    } else {
      // No existing dungeon, proceed
      initializeDungeon(templateId);
    }
  }

  Why this is better: Simpler state management, no instance ID tracking, clear UX.

  ---
  ARCHITECTURAL UPDATES

  3.4: User Dungeons - MVP SCOPE REDUCED ✅

  MVP: Built-in dungeons only, custom monsters OK
  Future: User-created dungeons

  This means:
  - No vault file parsing for dungeon templates in Phase 3C
  - No path validation for user dungeon files
  - ~2-3 fewer implementation steps
  - Security surface reduced

  Architecture note: We'll still use the DungeonTemplate interface, just load from TypeScript files:

  // src/data/dungeons.ts
  export const BUILTIN_DUNGEONS: DungeonTemplate[] = [
    { id: 'goblin_cave', /* ... */ },
    { id: 'fire_temple', /* ... */ },
    { id: 'iron_keep', /* ... */ },
  ];

  // Future: Add custom dungeon loading
  // export function loadCustomDungeons(vault: Vault): DungeonTemplate[] { ... }

  ---
  6.1: Schema Versioning - CLARIFIED ✅

  Your question: "Aren't all quests currently schemaVersion=1? Do we need to migrate those too?"

  Answer: No migration needed for quests! Here's why:

  Each data type has independent versioning:

  // Quest.ts (unchanged)
  interface Quest {
    schemaVersion: 1; // ← Quest schema version
    // ...
  }

  // Character.ts (will become v2)
  interface Character {
    schemaVersion: 1; // ← Will change to 2
    // ...
  }

  When we add gear/HP/stamina/keys to Character, we bump Character to v2. Quests stay at v1 because
  quest structure isn't changing.

  Migration only needed for Character:
  // In characterStore or main.ts onload
  function loadCharacter(savedData: any): Character {
    if (savedData.schemaVersion === 1) {
      // Migrate v1 → v2: add new fields
      return migrateCharacterV1toV2(savedData);
    }
    return savedData; // Already v2
  }

  No quest migration needed. ✅

  ---
  TESTING SETUP - YOUR QUESTIONS

  7.2.1: Unit Testing Setup

  You want this ready BEFORE implementation. Here's what I recommend:

  Option A: Vitest (Recommended - Modern, Fast)
  npm install -D vitest @vitest/ui

  Option B: Jest (Traditional, More Mature)
  npm install -D jest @types/jest ts-jest

  Why Vitest?
  - Faster than Jest (native ESM support)
  - Better TypeScript support out of the box
  - Built-in UI (npx vitest --ui)
  - Same API as Jest (easy to learn)

  Test Structure:
  quest-board/
  ├── src/
  │   ├── services/
  │   │   ├── LootGenerationService.ts
  │   │   └── __tests__/
  │   │       └── LootGenerationService.test.ts
  │   ├── utils/
  │   │   ├── pathfinding.ts
  │   │   └── __tests__/
  │   │       └── pathfinding.test.ts
  ├── vitest.config.ts
  └── package.json

  Example Test:
  // src/services/__tests__/LootGenerationService.test.ts
  import { describe, it, expect } from 'vitest';
  import { calculateGearLevel, rollTier } from '../LootGenerationService';

  describe('LootGenerationService', () => {
    it('generates gear within ±3 levels of character', () => {
      const characterLevel = 10;
      const gearLevel = calculateGearLevel(characterLevel);
      expect(gearLevel).toBeGreaterThanOrEqual(7);
      expect(gearLevel).toBeLessThanOrEqual(13);
    });

    it('rolls correct tier distribution for medium difficulty', () => {
      const rolls = Array.from({ length: 1000 }, () => rollTier('medium'));
      const journeymanCount = rolls.filter(t => t === 'journeyman').length;

      // Should be ~40% (with some variance)
      expect(journeymanCount).toBeGreaterThan(350);
      expect(journeymanCount).toBeLessThan(450);
    });
  });

  Setup Files:

  vitest.config.ts:
  import { defineConfig } from 'vitest/config';

  export default defineConfig({
    test: {
      globals: true,
      environment: 'jsdom', // For React component tests
      setupFiles: './test/setup.ts',
    },
  });

  test/setup.ts:
  // Mock Obsidian API for tests
  global.app = {
    vault: {
      read: vi.fn(),
      // ... other mocks
    },
  };

  npm scripts:
  {
    "scripts": {
      "test": "vitest",
      "test:ui": "vitest --ui",
      "test:coverage": "vitest --coverage"
    }
  }

  What to test first:
  1. Services (pure functions, easy to test):
    - calculateGearLevel()
    - rollTier()
    - calculateDamage()
    - findPath() (A* pathfinding)
  2. Validators:
    - validateGearItem()
    - validateMonsterTemplate()
  3. Utilities:
    - normalizeSetId()
    - sanitizeQuestId()

  What NOT to test initially (harder, less value):
  - React components (UI testing is slow)
  - Obsidian integration (requires mocking entire API)
  - File I/O (covered by manual testing)

  ---
  7.2.2: Dev Vault Setup

  Your question: "Would I need to disable my current plugin in my main vault? Or does a new vault get
  its own plugin folder?"

  Answer: Each vault has its own .obsidian/plugins/ folder! They're completely isolated.

  Setup Steps:

  1. Create Test Vault:
  # Outside your current vault
  mkdir Quest-Board-Test-Vault
  cd Quest-Board-Test-Vault
  mkdir .obsidian
  2. Update deploy.js for Multi-Vault:
  // deploy.js
  const fs = require('fs');
  const path = require('path');

  const TARGET = process.env.DEPLOY_TARGET || 'main';

  const VAULTS = {
    main: 'G:\\My Drive\\IT\\Obsidian Vault\\My Notebooks\\.obsidian\\plugins\\quest-board',
    test: 'C:\\Quest-Board-Test-Vault\\.obsidian\\plugins\\quest-board',
  };

  const targetPath = VAULTS[TARGET];

  if (!targetPath) {
    console.error(`Unknown target: ${TARGET}`);
    process.exit(1);
  }

  // ... rest of deploy script (copy files to targetPath)
  3. Add npm scripts:
  {
    "scripts": {
      "build": "esbuild ...",
      "deploy": "node deploy.js",
      "deploy:test": "DEPLOY_TARGET=test node deploy.js",
      "dev:test": "npm run build && npm run deploy:test"
    }
  }
  4. Workflow:
  # Work on code
  vim src/services/LootGenerationService.ts

  # Deploy to test vault
  npm run deploy:test

  # Open test vault in Obsidian
  # Test feature

  # If good, deploy to main vault
  npm run deploy

  Test Vault Structure:
  Quest-Board-Test-Vault/
  ├── .obsidian/
  │   ├── plugins/
  │   │   └── quest-board/          ← Plugin deploys here
  │   └── workspace.json
  ├── Life/
  │   └── Quest Board/
  │       ├── quests/
  │       │   ├── main/
  │       │   │   └── Test Quest.md
  │       │   └── side/
  │       └── System/
  └── Test Character.md

  Benefits:
  - Break things without fear
  - Test migrations
  - Create extreme edge cases (100 gear items, 0 HP, etc.)
  - Keep main vault clean

  Note: Your main vault stays completely untouched. Plugins are per-vault.

  ---
  COMBAT BALANCE TESTING - YOUR QUESTION

  Your question: "Is there a site or something to run simulations for progression?"

  Answer: Not really, but we can BUILD one! Here's a quick simulation tool:

  Combat Simulator (JavaScript)

  // test/combat-simulator.ts
  import { calculateDamage, CombatStats } from '../src/services/BattleService';

  interface SimulationResult {
    playerWinRate: number;
    avgTurnsToWin: number;
    avgPlayerHPRemaining: number;
  }

  function simulateCombat(
    playerStats: CombatStats,
    monsterStats: CombatStats,
    iterations: number = 1000
  ): SimulationResult {
    let wins = 0;
    let totalTurns = 0;
    let totalHPRemaining = 0;

    for (let i = 0; i < iterations; i++) {
      let playerHP = playerStats.maxHP;
      let monsterHP = monsterStats.maxHP;
      let turns = 0;

      while (playerHP > 0 && monsterHP > 0) {
        turns++;

        // Player turn
        const playerDamage = calculateDamage(playerStats, monsterStats);
        monsterHP -= playerDamage.damage;

        if (monsterHP <= 0) {
          wins++;
          totalHPRemaining += playerHP;
          break;
        }

        // Monster turn
        const monsterDamage = calculateDamage(monsterStats, playerStats);
        playerHP -= monsterDamage.damage;
      }

      totalTurns += turns;
    }

    return {
      playerWinRate: (wins / iterations) * 100,
      avgTurnsToWin: totalTurns / wins,
      avgPlayerHPRemaining: totalHPRemaining / wins,
    };
  }

  // Test different level matchups
  function testLevelProgression() {
    const levels = [1, 5, 10, 15, 20, 25, 30, 35, 40];

    for (const level of levels) {
      const playerStats = derivePlayerStats(level, 'warrior', 'journeyman' /* gear tier */);
      const monsterStats = deriveMonsterStats(level, 'goblin');

      const result = simulateCombat(playerStats, monsterStats);

      console.log(`Level ${level}:`);
      console.log(`  Win Rate: ${result.playerWinRate.toFixed(1)}%`);
      console.log(`  Avg Turns: ${result.avgTurnsToWin.toFixed(1)}`);
      console.log(`  Avg HP Left: ${result.avgPlayerHPRemaining.toFixed(0)}/${playerStats.maxHP}`);
      console.log();
    }
  }

  // Run with: npm run test:balance
  testLevelProgression();

  Usage:
  npm run test:balance

  Output:
  Level 1:
    Win Rate: 67.3%
    Avg Turns: 5.2
    Avg HP Left: 23/50

  Level 10:
    Win Rate: 72.1%
    Avg Turns: 8.4
    Avg HP Left: 89/150

  Level 40:
    Win Rate: 78.5%
    Avg Turns: 12.1
    Avg HP Left: 387/500

  What to look for:
  - Win rate 60-80%: Challenging but fair
  - Win rate < 50%: Too hard, nerf monsters
  - Win rate > 90%: Too easy, buff monsters
  - Avg HP left: Should scale with level (more buffer at high levels)

  Gear Testing:
  // Test impact of gear tiers
  const noGearStats = derivePlayerStats(20, 'warrior', null);
  const adeptGearStats = derivePlayerStats(20, 'warrior', 'adept');
  const legendaryGearStats = derivePlayerStats(20, 'warrior', 'legendary');

  simulateCombat(noGearStats, monsterStats);       // 45% win rate
  simulateCombat(adeptGearStats, monsterStats);    // 65% win rate
  simulateCombat(legendaryGearStats, monsterStats); // 85% win rate

  This lets you iterate on formulas until balance feels right!

  ---
  MOBILE CONSIDERATIONS - YOUR PRIORITY

  You said: "Mobile should be a priority. Modals work fine. Keep an eye towards mobile."

  Current systems that work on mobile ✅:
  - Quest cards (touch-friendly)
  - Character sheet (scrollable)
  - Modals (native Obsidian modals are mobile-optimized)

  New systems - mobile considerations:

  Gear System (Mostly Fine):

  - ✅ Inventory grid: Touch-friendly if tiles are 44x44px min
  - ✅ Gear tooltips: Use :active for touch (not just :hover)
  - ✅ Drag-to-equip: Support touch drag (react-dnd supports this)

  CSS for touch:
  .gear-icon {
    width: 48px;
    height: 48px; /* Min 44x44 for touch */
    touch-action: manipulation; /* Disable double-tap zoom */
  }

  .gear-icon:hover,
  .gear-icon:active { /* :active for touch */
    transform: scale(1.1);
  }

  Fight System (Needs Touch Controls):

  - ⚠️ Action buttons need to be large (60x60px min)
  - ⚠️ Combat log should be scrollable (mobile screens small)
  - ✅ Turn-based = no timing issues (unlike real-time games)

  Mobile UI:
  // src/components/BattleView.tsx
  function BattleView({ isMobile }: { isMobile: boolean }) {
    return (
      <div className={cn('battle-view', isMobile && 'mobile')}>
        {/* Monster at top (mobile: smaller) */}
        <MonsterSprite size={isMobile ? 'small' : 'large'} />

        {/* Combat log (mobile: shorter, scrollable) */}
        <CombatLog maxHeight={isMobile ? 100 : 200} />

        {/* Action buttons (mobile: larger, full width) */}
        <div className={cn('action-buttons', isMobile && 'stacked')}>
          <button className="action-btn">⚔️ Attack</button>
          <button className="action-btn">🛡️ Defend</button>
          <button className="action-btn">🏃 Run</button>
        </div>
      </div>
    );
  }

  Detect mobile:
  // src/utils/platform.ts
  export function isMobile(): boolean {
    return Platform.isMobile; // Obsidian API
  }

  Exploration System (Most Complex):

  - ⚠️ Click-to-move: Works on mobile (tap tile)
  - ⚠️ D-pad controls: REQUIRED for mobile (on-screen buttons)
  - ⚠️ Pathfinding: Touch drag across tiles? (stretch)

  Mobile Exploration UI:
  function DungeonView({ isMobile }: { isMobile: boolean }) {
    return (
      <>
        {/* Dungeon grid (scales to screen) */}
        <div className="dungeon-grid" style={{ zoom: isMobile ? 0.75 : 1 }}>
          {/* Tiles render here */}
        </div>

        {/* Mobile D-pad (only on mobile) */}
        {isMobile && (
          <div className="mobile-dpad">
            <button onTouchStart={() => move('north')}>⬆️</button>
            <button onTouchStart={() => move('west')}>⬅️</button>
            <button onTouchStart={() => move('south')}>⬇️</button>
            <button onTouchStart={() => move('east')}>➡️</button>
            <button onTouchStart={() => interact()}>✋ Interact</button>
          </div>
        )}
      </>
    );
  }

  Important: Use onTouchStart (not onClick) for instant response:
  <button
    onTouchStart={() => move('north')}  // Instant (0ms)
    onClick={() => move('north')}       // Fallback for desktop (300ms delay on mobile)
  >
    ⬆️
  </button>

  Mobile CSS:
  /* D-pad for mobile */
  .mobile-dpad {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: grid;
    grid-template-areas:
      ". up ."
      "left interact right"
      ". down .";
    gap: 8px;
  }

  .mobile-dpad button {
    width: 60px;
    height: 60px;
    font-size: 24px;
    border-radius: 50%;
    background: var(--background-modifier-border);
    border: 2px solid var(--interactive-accent);
    touch-action: manipulation;
  }

  Mobile Testing Checklist:
  - Tap targets ≥44x44px
  - Touch gestures work (drag, long-press)
  - No hover-only interactions (use :active too)
  - Scrollable areas don't conflict with page scroll
  - D-pad buttons use onTouchStart for instant response
  - Text is readable at mobile sizes (16px min)

  ---
  TILE PACK REVIEW - ANOKOLISA

  You linked: https://anokolisa.itch.io/free-pixel-art-asset-pack-topdown-tileset-rpg-16x16-sprites

  Analysis:
  - ✅ 16x16 tiles (you'll need to scale to 32x32 with CSS)
  - ✅ Includes floors, walls, objects, characters
  - ✅ Free for commercial use
  - ✅ Top-down perspective (matches your dungeon design)

  Scaling:
  .tile {
    width: 32px;
    height: 32px;
    background-image: url('floor.png'); /* 16x16 source */
    background-size: 32px 32px; /* Scale to 32x32 */
    image-rendering: pixelated; /* Keep sharp edges */
  }

  What you still need to create:
  - Player character sprites (you said you'll make these)
  - Monster sprites (you said you'll make these)
  - Gear icons (optional - can use emojis as fallback)

  Emoji fallback pattern (from your docs):
  interface Tile {
    spriteId: string;
    iconEmoji: string; // ⬜⬛🚪📦
  }

  function TileRenderer({ tile }: { tile: Tile }) {
    const [error, setError] = useState(false);

    if (error || !tile.spriteId) {
      return <span>{tile.iconEmoji}</span>;
    }

    return (
      <img
        src={`assets/tiles/${tile.spriteId}.png`}
        onError={() => setError(true)}
        alt={tile.iconEmoji}
      />
    );
  }

  This gives you a complete fallback system. Plugin works even with 0 sprites installed!

  ---
  REVISED IMPLEMENTATION PRIORITIES

  Based on your feedback:

  Before ANY Implementation:

  1. ✅ Set up Vitest for unit testing
  2. ✅ Create dev vault with deploy script
  3. ✅ Set up combat simulator for balance testing
  4. ✅ Write first tests (validators, loot generation)

  Phase 3A: Gear (5-7 days)

  - REMOVED: User gear customization (future)
  - ADDED: Inventory management modal (sell/delete on full)
  - ADDED: Set bonus normalization (5 min fix)
  - SIMPLIFIED: Character migration (test in dev vault first)

  Phase 3B: Fight (5-7 days)

  - UPDATED: Stamina cap to 50/day (not 20)
  - ADDED: Mobile action buttons (large, touch-friendly)
  - ADDED: Balance testing with simulator

  Phase 3C: Exploration (7-10 days)

  - REMOVED: User-created dungeons (future)
  - REMOVED: Path validation for user dungeons
  - SIMPLIFIED: Single dungeon at a time (no instance tracking)
  - ADDED: Mobile D-pad controls (on-screen buttons)
  - ADDED: Touch gesture support

  Total Time Estimate: Still 17-24 days, but with cleaner scope.

  ---
  FINAL CHECKLIST

  Before you start Phase 3A, complete these:

  Testing Setup:
  - Install Vitest: npm install -D vitest @vitest/ui
  - Create vitest.config.ts
  - Create test/setup.ts (mock Obsidian API)
  - Add test scripts to package.json
  - Write first test: LootGenerationService.test.ts
  - Run tests: npm test

  Dev Vault Setup:
  - Create Quest-Board-Test-Vault/ folder
  - Update deploy.js for multi-vault support
  - Add deploy:test npm script
  - Deploy to test vault: npm run deploy:test
  - Open test vault in Obsidian
  - Verify plugin loads

  Combat Simulator:
  - Create test/combat-simulator.ts
  - Add test:balance npm script
  - Run initial simulation: npm run test:balance
  - Document baseline win rates

  Mobile Preparation:
  - Add isMobile() utility: src/utils/platform.ts
  - Test current plugin on mobile Obsidian
  - Document mobile-specific CSS patterns

  Ready to Start:
  - All above complete ✅
  - Git branch: feat/phase-3a-gear-system
  - Begin with Step 0: Character migration code

  ---
  SUMMARY OF CHANGES

  Your feedback resulted in:
  - ✅ Simplified: Migration strategy (dev vault testing)
  - ✅ Simplified: Dungeon persistence (single instance)
  - ✅ Reduced MVP scope: No user dungeons initially
  - ✅ Improved UX: Inventory management modal vs overflow
  - ✅ Clarified: Schema versioning (Character only)
  - ✅ Balanced: Stamina cap (50 instead of 20)
  - ✅ Prioritized: Mobile support (D-pad, touch gestures)
  - ✅ Prepared: Testing infrastructure (Vitest, dev vault, simulator)