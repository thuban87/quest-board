# Phase 3 Implementation Checklist

> **Status:** ⚡ Phase 3C In Progress (Steps 1-11 ✅, Step 14 ✅, Steps 12-13/15-17 Remaining)  
> **Estimated Time:** 17-24 days  
> **Purpose:** Shorthand reference with links to full documentation

---

## Pre-Implementation Setup

Complete these BEFORE starting any Phase 3 work:

- [x] **Set up Vitest** for unit testing ✅
  - Installed `vitest` and `@vitest/ui`
  - Created `vitest.config.ts` with obsidian alias
  - Created `test/setup.ts` + `test/mocks/obsidian.ts`

- [x] **Create Dev Vault** for safe testing ✅
  - Created `Quest-Board-Test-Vault/`
  - Updated `deploy.mjs` for multi-vault
  - Added `npm run deploy:test` script

- [x] **Create Combat Simulator** for balance testing ✅
  - `test/combat-simulator.test.ts` with full combat simulation logic
  - Added `npm run test:balance` script
  - ✅ **Balance tuning complete (v25)** - Casual-friendly 50%+ win rate floor

- [x] **Add `isMobile()` utility** for responsive components ✅
  - Created `src/utils/platform.ts`
  - Includes `isMobile()`, `isDesktop()`, `getTapTargetSize()`, etc.

---

## Phase 3A: Gear & Loot System (5-7 days)

### Step 0: Migration & Schema (CRITICAL) ✅

- [x] Add `migrateCharacterV1toV2()` function
  - See: [Gear Doc → Character Schema Migration](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#character-schema-migration)
- [x] Add `migrateEquippedGear()` for format change
- [x] Add atomic character store actions (`updateGold`, `updateHP`, etc.)
  - See: [Gear Doc → Atomic Character Store Actions](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#atomic-character-store-actions)
- [x] Test migration with existing character data (24 unit tests passing)

### Step 1: Data Models ✅

- [x] Create `GearItem`, `GearSlot`, `GearTier` types
  - See: [Gear Doc → Data Model](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#data-model)
- [x] Create `LootReward` discriminated union
- [x] Add `validateGearItem()` to validator.ts

### Step 2: Gold & Inventory ✅

- [x] Add `gold`, `gearInventory`, `inventoryLimit` to Character
- [x] Implement `updateGold()`, `addGear()`, `removeGear()` store actions
- [x] Display gold in Character Sheet

### Step 3: Starter Gear ✅

- [x] Create 6 starter gear items (one per slot)
  - See: [Gear Doc → Starter Gear](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#starter-gear)
- [x] Assign to new characters on creation
- [x] Grant to existing characters on migration

### Step 4: Unique Items Registry ✅

- [x] Create `src/data/uniqueItems.ts`
  - See: [Gear Doc → Unique Items Registry](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#unique-items-registry)
- [x] Add boss drops (Goblin King's Crown, Stormbringer Blade, Aegis of the Steadfast, etc.)
- [x] Add achievement rewards (Ring of the Completionist, Amulet of Dedication)

### Step 5: Loot Generation Service ✅

- [x] Create `LootGenerationService.ts`
  - See: [Gear Doc → Loot Generation Service](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#loot-generation-service)
- [x] Implement tier rolling with exponential scaling
- [x] Implement gear level variance (+/- character level)
- [x] Support unique items via `createUniqueItem()` in combat

### Step 6: Quest Completion Integration ✅

- [x] Hook into `QuestActionsService.moveQuest()` for loot drops
- [x] Roll loot on quest complete via `LootGenerationService`
- [x] Award gold and gear based on quest priority
- [x] Show `LootModal` with items (tier-colored display)

### Step 7: Character Sheet UI ✅

- [x] Display 6 equipped gear slots with tier colors
- [x] Show derived combat stats (gear-aware via `deriveCombatStats`)
  - See: [Gear Doc → Architectural Considerations](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#architectural-considerations)
- [x] Implement gear tooltips on hover
- [x] Attributes section includes gear stat bonuses

### Step 8: Inventory UI ✅

- [x] Create two-tab inventory (Gear | Consumables)
- [x] Implement grid view for gear items
- [x] Add equip/swap actions
- [x] Add sell items for gold
- [x] Add comparison tooltip (hover to see +/- vs equipped)
- [x] Add armor/weapon type display
- [x] Disable equip button for class-restricted items

### Step 9: Inventory Management Modal ✅

- [x] Show when inventory full on loot drop
  - See: [Gear Doc → Inventory Management Modal](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#inventory-management-modal)
- [x] Dual-pane layout (pending loot | current inventory)
- [x] Checkboxes for Keep/Trash on pending items
- [x] Checkboxes for Sell on existing items
- [x] Running status bar with slot math
- [x] Integration with QuestActionsService loot flow

> [!WARNING]
> **Deferred Testing:** Full workflow untested due to difficulty generating 50+ inventory items. Modal opens but Keep/Trash/Sell workflow needs verification.

### Step 10: Smelting System ✅

- [x] Create `SmeltingService.ts` with transaction pattern
  - See: [Gear Doc → Smelting Transaction Pattern](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#smelting-transaction-pattern)
- [x] Create `BlacksmithModal.ts` with 3-slot UI
- [x] Click-to-select item selection
- [x] Tier filtering dropdown
- [x] Result preview section
- [x] Same-slot bonus detection
- [x] Level averaging for output
- [x] Mixed tiers → highest tier output
- [x] Same tiers → next tier up output
- [x] Post-smelt LootModal display for new item
- [x] Legendary refinement (4000g cost) - *untested, no legendary items*

### Step 11: Set Bonuses ✅

- [x] Implement `normalizeSetId()` for folder rename resilience
  - See: [Gear Doc → Automatic Set Generation](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#automatic-set-generation)
- [x] `SetBonusService.ts` with keyword-based thematic bonus generation
- [x] Calculate bonuses on equip (via `selectActiveSetBonuses` selector)
- [x] Display set membership in LootModal tooltips and gear display
- [x] Active Sets section in CharacterSheet
- [x] `excludedSetFolders` setting with UI (main, side, training, recurring, daily)

### Step 12: Legendary Lore

- [ ] Implement template-based flavor text generation
  - See: [Gear Doc → Legendary Lore](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#legendary-lore-procedural-flavor-text)
- [ ] Store `originQuestId` AND `originQuestTitle` snapshot
- [ ] Optional AI enhancement (fallback to templates)

### Step 13: Settings UI ✅

- [x] Quest type → gear slot remapping
- [x] Per-type slot assignments with live updates
- [x] Add custom quest type mapping UI

### Step 14: Armor/Weapon Types & Class Restrictions ✅

- [x] Added `ArmorType` (cloth, leather, mail, plate)
- [x] Added `WeaponType` (sword, axe, mace, dagger, staff, wand, bow, shield)
- [x] Added `CLASS_ARMOR_PROFICIENCY` and `CLASS_WEAPON_PROFICIENCY` maps
- [x] Loot generation picks class-appropriate gear types
- [x] `equipGear` enforces class restrictions
- [x] Display type in LootModal and InventoryModal
- [x] Starter gear uses cloth/sword (equippable by all)

### Step 15: Inventory Modal Improvements ✅

- [x] Add sorting options (tier, level, slot, name) - clickable headers with arrows
- [x] Add filtering options (by slot, by tier) - multi-select toggle buttons
- [x] Improve grid layout for large inventories
- [x] Full-page modal sizing (90vw x 85vh)
- [x] "Clear Filters" button when filters active

### Step 16: Consumables System ✅

- [x] Fix consumable generation to save to inventory
- [x] Created 8 tiered HP/Mana potions (Minor, Lesser, Greater, Superior)
- [x] Removed Pomodoro and Bribery concepts
- [x] Consumables tab in inventory modal
- [x] Fixed LootModal to show consumable emoji/name from registry
- [ ] Implement use mechanics (deferred to Phase 3B combat)

---

## Phase 3B: Fight System (5-7 days)

### Step 1: Combat Stats & Balance Integration ✅

- [x] Create `CombatStats` interface
  - See: [Fight Doc → Derived Combat Stats](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#derived-combat-stats)
- [x] Extract v25 balance constants to `src/config/combatConfig.ts`
- [x] Create `src/services/CombatService.ts` with `deriveCombatStats()`
- [x] Extend StatsService with gear bonuses

### Step 1b: Monster Config ✅

- [x] Extract `MONSTER_TEMPLATES` to `src/data/monsters.ts` (19 templates across 8 categories)
- [x] Extract tier multipliers to `src/config/combatConfig.ts`
- [x] Implement raid boss tank penalty in combat service
  - See: [Fight Doc → Combat Balance (Tuned v25)](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-balance-tuned-v25)

### Step 2: Stamina System ✅

- [x] Add stamina fields to Character (`stamina`, `staminaGainedToday`, `lastStaminaResetDate`)
  - See: [Fight Doc → Stamina Details](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#stamina-details)
- [x] Implement `awardStamina()` with daily cap (50)
  - See: [Fight Doc → Daily Stamina Cap](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#daily-stamina-cap)
- [x] Wire stamina award into quest completion
- [x] Add stamina display to Character Sheet

### Step 3: Store System ✅

- [x] Create StoreModal with tiered potions
  - See: [Fight Doc → Store System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#store-system)
- [x] Implement health/mana potions (8 tiers)
- [x] Deduct gold on purchase
- [x] Add to QuestBoardCommandMenu

### Step 4: HP/Mana Persistence ✅

- [x] Add `currentHP`, `currentMana` to Character
- [x] Display HP/Mana/Stamina bars in Character Sheet
- [x] Implement Long Rest mechanic (fullRestore command)
  - See: [Fight Doc → The "Long Rest" Mechanic](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#the-long-rest-mechanic)

### Step 5: Battle Store ✅

- [x] Create `src/store/battleStore.ts` with state machine
  - See: [Fight Doc → Combat State Machine](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-state-machine)
- [x] Implement dual persistence (localStorage + plugin data)
  - See: [Fight Doc → Zustand Battle Store with Dual Persistence](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#zustand-battle-store-with-dual-persistence)
- [ ] Test crash recovery (requires combat UI)

### Step 6: Monster System ✅

- [x] Create `Monster.ts` types (`MonsterTemplate`, `Monster`, `MonsterPrefix`, `MonsterCategory`)
  - See: [Fight Doc → Monster Definition](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#monster-definition)
- [x] Create 19 base monsters in `src/data/monsters.ts` across 8 categories
- [x] Implement prefix system (60% none, 20% fierce, 15% sturdy, 5% ancient)
  - See: [Fight Doc → Monster Prefix System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#monster-prefix-system)
- [x] Create `MonsterService.ts` with `createMonster()`, `rollPrefix()`, `selectMonsterLevel()`
- [x] Implement 7.5% exponential stat scaling per level
- [x] Wire `monsterService` to main.ts for testing access
- [x] Unit tests for monster creation, prefixes, and level selection (19 tests)

### Step 7: Battle Service ✅

- [x] Create `BattleService.ts` with full turn execution
- [x] Implement damage calculation with dodge/block/crit (via CombatService)
  - See: [Fight Doc → Damage Calculation](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#damage-calculation)
- [x] Attack style handling (physical, magic, hybrid_physical, hybrid_magic)
- [x] Handle state transitions (PLAYER_INPUT → PROCESSING → ANIMATING → ENEMY_TURN)
- [x] Victory/defeat logic with XP/gold/loot rewards
- [x] Retreat mechanics (30% + CHA*2%, fail = 15% HP damage)
- [x] Wire `battleService` to main.ts for testing access
- [x] Unit tests for attack styles, defend, and outcome handling (18 tests)

### Step 8: Combat UI ✅

- [x] Create BattleView with sprites + emoji fallbacks
  - See: [Fight Doc → Combat UI](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-ui)
- [x] Action buttons (Attack/Defend/Run/Item) - fixed layout
- [x] Combat log
- [x] CSS animations
- [x] Mobile-friendly controls
  - See: [Fight Doc → Mobile Combat Controls](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#mobile-combat-controls)
- [x] XP/gold/HP persistence after battle
- [x] HP initialization uses derived maxHP (gear-aware)
- [x] Damage balance tuning - Integrated v25 simulation results

### Step 9: Death Penalty ✅

- [x] Implement "Unconscious" status
  - See: [Fight Doc → Death Penalty & Recovery](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#death-penalty--recovery)
- [x] Apply 10% gold penalty
- [x] Show recovery options modal
- [x] Block fighting/Long Rest during recovery
- [x] Status bar timer countdown
- [x] Working Use buttons for consumables

### Step 10: Quest Bounty System ✅

- [x] Create `Bounty.ts` model and `BountyService.ts`
- [x] Create `BountyModal.ts` (accept/decline UI with monster preview)
- [x] Create `BountyReviveModal.ts` (unconscious player pre-modal)
- [x] Add `bountyChance` setting (0-20% slider)
- [x] Integrate bounty trigger in `QuestActionsService.moveQuest()`
- [x] Fix race condition - bounty triggers on loot modal close
- [x] Add `onBattleStart` callback to open battle view after accepting
- [x] Apply +200% loot luck bonus (via `BOUNTY_LOOT_BONUS = 3.0`)
- [x] Show bounty notification UI
- [x] AI-generated bounty descriptions via Gemini API
- [x] Burn-on-use cache with background regeneration
- [x] Keyword-matched fallback templates for non-AI users

### Step 11: Elite Overworld Mobs ✅

- [x] Add elite spawn constants to `combatConfig.ts`
  - `ELITE_LEVEL_UNLOCK = 5` (no elites before L5)
  - `ELITE_BOUNTY_CHANCE = 0.30` (30% for bounties)
  - `ELITE_OVERWORLD_CHANCE = 0.15` (15% for random fights)
  - `ELITE_NAME_PREFIXES` (6 options: Elite, Champion, Veteran, Alpha, Savage, Enraged)
- [x] Update `BountyService.generateBounty()` with elite roll logic
- [x] Add `isElite` flag to `Bounty` interface
- [x] Update `BountyModal.ts` with elite badge and flee button
- [x] Create `EliteEncounterModal.ts` (pre-fight modal for overworld elites)
  - Warning header, monster preview with red glow animation
  - Fight and Flee buttons (flee = no stamina cost)
- [x] Update `main.ts` start-fight command with elite modal flow
- [x] Update `BattleView.tsx` MonsterDisplay with elite class + badge
- [x] Add CSS animations (`qb-elite-pulse`, elite styling for modal and battle)

---

## Phase 3C: Exploration System (7-10 days)

### Step 1: Dungeon State Store ✅

- [x] Create Zustand store with light persistence
  - See: [Exploration Doc → State Management](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#state-management)
- [x] Single dungeon at a time with warning modal (preview mode bypasses)
  - See: [Exploration Doc → Single Dungeon at a Time](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#single-dungeon-at-a-time)
- [x] Room state tracking (chests, monsters, traps)

### Step 2: Tile System ✅

- [x] Create `TileDefinition`, `TileInstance` types
  - See: [Exploration Doc → Tile System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#tile-system)
- [x] Emoji fallbacks for all tile types
- [x] Walkability and interaction rules
- [x] TileRegistry with cave tileset sprites (64px tiles at 2x scale = 128px)
- [x] Organized folder structure for tiles:
  - `{tileset}/floor/`, `{tileset}/wall/` - tileset-specific tiles
  - `_shared/floor/`, `_shared/wall/`, `_shared/hazard/`, `_shared/obstacle/`, `_shared/decorative/` - universal tiles
  - `_interactive/` - chests, doors, portals
- [x] Overlay tile rendering (`isOverlay: true`) - chests/portals/obstacles render on top of floor

### Step 3: Room Rendering ✅

- [x] CSS Grid with event delegation (ONE click handler)
  - See: [Exploration Doc → Technical Approach](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#technical-approach)
- [x] Player sprite with direction-based facing (north/south/east/west)
- [x] Test performance (9x7 = 63 tiles, renders smoothly)
- [x] Dev Preview command - preview dungeons without consuming resources
- [x] DungeonView.tsx + DungeonItemView.tsx (Obsidian view wrapper)
- [x] Scalable tiles (2x default 128px, 1x 64px option)

### Step 4: Click-to-Move ✅

- [x] A* pathfinding with timeout (500 iterations)
  - See: [Exploration Doc → Click-to-Move with A* Pathfinding](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#click-to-move-with-a-pathfinding)
- [x] Validate path before moving (goal walkable check)
- [x] Show notification for unreachable tiles
- [x] Animated step-by-step movement (200ms per tile)
- [x] Door click pathfinds to door first, then transitions

### Step 5: Keyboard Controls ✅

- [x] WASD + arrows for single-step movement
- [x] E for interact with adjacent tile (placeholder Notice)
- [x] Handle dungeon focus loss (auto-focus on mount, tabIndex)
- [x] 180ms movement cooldown for WASD spam prevention
- [x] Mobile D-pad controls (moved from Step 16)
  - Centered at bottom: 80px, 56px buttons
  - onTouchStart for immediate response
  - Mobile tile size reduced to 40px for better visibility

### Step 6: Room Transitions ✅

- [x] Zelda-style screen slide animation (200ms per direction)
- [x] CSS keyframes for slide-in/out (north/south/east/west)
- [x] Transition state management with input blocking
- [x] Door auto-trigger on walk (no separate activation)

### Step 7: Dungeon Templates ✅

- [x] Create `DungeonTemplate` format (already existed)
- [x] Door definitions embedded in rooms
- [x] **Forest Ruins** (8 rooms) - meandering outdoor dungeon
  - East/West transitions in addition to North/South
  - Crossroads hub with 3 exits
  - Treasure branches (west_treasure, hidden_cache)
  - Boss lair with Master tier chests
- [x] Dungeon selection modal (SuggestModal) in dev preview command

### Step 8: Room State Tracking ✅

- [x] Track `chestsOpened`, `monstersKilled` per room via `roomStates`
- [x] Visual feedback: opened chests show open sprite
- [x] Visual feedback: killed monsters render as floor
- [x] Persist across room changes (exploit prevention)

### Step 9: Chest Interaction ✅

- [x] E key or click-interact to open adjacent chest
- [x] Immediate loot award (gold, gear, consumables) - no pending
- [x] Notification with loot summary
- [x] Mark chest opened in room state
- [x] Chest open/closed sprite variants

### Step 10: Combat Integration ✅

- [x] Monster encounter triggers Fight System
  - Step-on activation for both WASD and click-to-move
  - Monster sprites display in dungeon (animated GIF with emoji fallback)
  - Monster sprites passed to BattleView for combat display
- [x] Freeze exploration during combat (`explorationState === 'IN_COMBAT'`)
- [x] Resume exact position on victory (player stays on monster tile)
- [x] Monster tiles disappear after combat (`markMonsterKilled()`)

### Step 11: Death Handling ✅

- [x] Show death modal with 3 options
  - `DungeonDeathModal` with Restart, Rescue, Leave buttons
  - Fixed race condition: `onDefeat` prop in BattleView triggers modal
- [x] Restart (respawn all monsters, restore 50% HP)
- [x] Rescue (pay gold based on level, restore 50% HP)
- [x] Leave (exit dungeon, keep loot collected so far)

### Step 12: Exit & Rewards

- [x] Grant pending loot on exit (❌ Cancelled due to state persistence taking care of farming potential)
- [x] Show summary screen

### Step 13: Dungeon Selection UI

- [ ] List templates with loot bias displayed
  - See: [Exploration Doc → Dungeon Selection](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#dungeon-selection)
- [ ] Key counter display
- [ ] Random dungeon option

### Step 14: Dungeon Map ✅

- [x] Full map modal (rooms as colored rectangles)
  - See: [Exploration Doc → Minimap & Full Map](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#minimap--full-map)
- [x] BFS room position calculation via `DungeonMapService`
- [x] Connection lines between rooms (SVG overlay)
- [x] Fog of war - only visited rooms displayed (true fog)
- [x] Current room pulsing glow effect
- [x] Boss room skull icon 💀
- [x] M key toggle open/close map
- [x] Map button in dungeon header
- [x] Exploration history persistence per dungeon (saved to character data)
- [x] *(Minimap scrapped - mobile responsiveness issues)*

### Step 15: Additional Dungeons ✅

- [x] Castle Crypt (10 rooms) - Undead/Aberration dungeon, medium difficulty, eye-beast boss
- [x] Bandit Stronghold (20 rooms) - Humanoid dungeon, hard difficulty, river-troll boss
- [x] **Kebab-case migration complete** - All monster IDs, sprite folders, and filenames unified to kebab-case
- [ ] Create 1-2 more hand-crafted templates
- [ ] Test variety and difficulty scaling

### Step 16: Mobile Controls

- [ ] D-pad with `onTouchStart` (not onClick)
  - See: [Exploration Doc → Mobile Touch Support](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#mobile-touch-support)
- [ ] Larger tap targets (44x44px min)
- [ ] Interact button for mobile

### Step 17: AI Generation (Stretch)

- [ ] Two-pass LLM dungeon creation
  - See: [Exploration Doc → AI-Generated Dungeons](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#ai-generated-dungeons)
- [ ] Validation + auto-padding for layout strings
- [ ] Test quality/playability

---

## Post-Implementation

- [ ] Update GEMINI.md with new file structure
- [ ] Update Feature Roadmap (mark Phase 3 complete)
- [ ] Create user-facing documentation
- [ ] Consume dungeon key (or refund if abandoned)
  - Gear System reference
  - Combat mechanics guide
  - Dungeon creation guide (if user dungeons added)

---

## Related Documents

- [[Gear and Loot System]] - Full specifications
- [[Fight System]] - Full specifications  
- [[Exploration System]] - Full specifications
- [[Claude code review]] - Detailed architectural review

---

*Last Updated: 2026-01-27*
