# Phase 3 Implementation Checklist

> **Status:** 🟡 Phase 3A In Progress (Steps 0-10, 13-14 Complete, Step 11 Pending Testing)  
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
- [ ] Show derived combat stats (cached) - *deferred to Phase 3B*
  - See: [Gear Doc → Architectural Considerations](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Gear%20and%20Loot%20System.md#architectural-considerations)
- [x] Implement gear tooltips on hover

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

### Step 15: Inventory Modal Improvements

- [ ] Add sorting options (tier, level, slot, name)
- [ ] Add filtering options (by slot, by tier)
- [ ] Improve grid layout for large inventories

### Step 16: Consumables System

- [ ] Fix consumable generation to save to inventory (currently generates but doesn't save)
- [ ] Implement use mechanics for consumables (HP restore, mana restore, etc.)
- [ ] Add consumables tab functionality in inventory modal
- [ ] Create consumable types with defined effects

---

## Phase 3B: Fight System (5-7 days)

### Step 1: Combat Stats & Balance Integration

- [ ] Create `CombatStats` interface
  - See: [Fight Doc → Derived Combat Stats](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#derived-combat-stats)
- [ ] Extract `CLASS_INFO` modifiers to `src/config/classConfig.ts`
- [ ] Extract `getLevelModifier()` to `src/services/CombatService.ts`
- [ ] Extend StatsService with gear bonuses
- [ ] Cache `derivedCombatStats` in character store

### Step 1b: Monster Config

- [ ] Extract `MONSTER_TEMPLATES` to `src/data/monsters.ts`
- [ ] Extract tier multipliers to `src/config/combatConfig.ts`
- [ ] Implement raid boss tank penalty in combat service
  - See: [Fight Doc → Combat Balance (Tuned v25)](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-balance-tuned-v25)

### Step 2: Stamina System

- [ ] Add stamina fields to Character (`stamina`, `staminaGainedToday`, `lastStaminaResetDate`)
  - See: [Fight Doc → Stamina Details](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#stamina-details)
- [ ] Implement `awardStamina()` with daily cap (50)
  - See: [Fight Doc → Daily Stamina Cap](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#daily-stamina-cap)
- [ ] Consume stamina on `/fight` command

### Step 3: Store System

- [ ] Create `/buy` slash command
  - See: [Fight Doc → Store System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#store-system)
- [ ] Implement health/mana/revive potions
- [ ] Deduct gold on purchase

### Step 4: HP/Mana Persistence

- [ ] Add `currentHP`, `currentMana` to Character
- [ ] Display in Character Sheet
- [ ] Implement Long Rest mechanic
  - See: [Fight Doc → The "Long Rest" Mechanic](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#the-long-rest-mechanic)

### Step 5: Battle Store

- [ ] Create Zustand store with state machine
  - See: [Fight Doc → Combat State Machine](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-state-machine)
- [ ] Implement dual persistence (localStorage + plugin data)
  - See: [Fight Doc → Zustand Battle Store with Dual Persistence](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#zustand-battle-store-with-dual-persistence)
- [ ] Test crash recovery

### Step 6: Monster System

- [ ] Create `MonsterTemplate` interface
  - See: [Fight Doc → Monster Definition](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#monster-definition)
- [ ] Create 5-10 base monsters with emoji fallbacks
- [ ] Implement prefix system (Fierce/Sturdy/Ancient)
  - See: [Fight Doc → Monster Prefix System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#monster-prefix-system)

### Step 7: Battle Service

- [ ] Implement damage calculation with dodge/block/crit
  - See: [Fight Doc → Damage Calculation](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#damage-calculation)
- [ ] Handle state transitions
- [ ] Victory/defeat logic

### Step 8: Combat UI

- [ ] Create BattleView with sprites + emoji fallbacks
  - See: [Fight Doc → Combat UI](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#combat-ui)
- [ ] Action buttons (Attack/Defend/Run/Item)
- [ ] Combat log
- [ ] CSS animations
- [ ] Mobile-friendly controls
  - See: [Fight Doc → Mobile Combat Controls](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#mobile-combat-controls)

### Step 9: Death Penalty

- [ ] Implement "Unconscious" status
  - See: [Fight Doc → Death Penalty & Recovery](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#death-penalty--recovery)
- [ ] Apply 10% gold penalty
- [ ] Show recovery options modal

### Step 10: Quest Bounty System

- [ ] Generate bounty on main quest complete
  - See: [Fight Doc → Quest Bounty System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Fight%20System.md#quest-bounty-system-)
- [ ] Apply +200% loot luck bonus
- [ ] Show bounty notification UI

---

## Phase 3C: Exploration System (7-10 days)

### Step 1: Dungeon State Store

- [ ] Create Zustand store with light persistence
  - See: [Exploration Doc → State Management](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#state-management)
- [ ] Single dungeon at a time with warning modal
  - See: [Exploration Doc → Single Dungeon at a Time](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#single-dungeon-at-a-time)
- [ ] Room state tracking (chests, monsters, traps)

### Step 2: Tile System

- [ ] Create `TileDefinition`, `TileInstance` types
  - See: [Exploration Doc → Tile System](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#tile-system)
- [ ] Emoji fallbacks for all tile types
- [ ] Walkability and interaction rules

### Step 3: Room Rendering

- [ ] CSS Grid with event delegation (ONE click handler)
  - See: [Exploration Doc → Technical Approach](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#technical-approach)
- [ ] Player sprite with CSS transform animation
- [ ] Test performance (165 tiles)

### Step 4: Click-to-Move

- [ ] A* pathfinding with timeout (500 iterations)
  - See: [Exploration Doc → Click-to-Move with A* Pathfinding](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#click-to-move-with-a-pathfinding)
- [ ] Validate path before moving (goal walkable check)
- [ ] Show notification for unreachable tiles

### Step 5: Keyboard Controls

- [ ] WASD + arrows for single-step movement
- [ ] E for interact with adjacent tile
- [ ] Handle dungeon focus loss

### Step 6: Room Transitions

- [ ] Fade-to-black animation (150ms out/in)
- [ ] Door auto-trigger on walk
- [ ] Load new room, preserve state

### Step 7: Dungeon Templates

- [ ] Create `DungeonTemplate` format
  - See: [Exploration Doc → Dungeon Templates](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#dungeon-templates)
- [ ] Embed door definitions in rooms (NOT separate connections)
- [ ] Create "Goblin Cave" (5 rooms)

### Step 8: Room State Tracking

- [ ] Track `chestsOpened`, `monstersKilled` per room
- [ ] Persist to prevent exploit (leave/return)
- [ ] Test exploit prevention

### Step 9: Chest Interaction

- [ ] Show loot modal on open
- [ ] Add to pending rewards
- [ ] Mark chest opened in room state

### Step 10: Combat Integration

- [ ] Monster encounter triggers Fight System
  - See: [Exploration Doc → Combat Integration](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#combat-integration)
- [ ] Freeze exploration during combat
- [ ] Resume exact position on victory
- [ ] Handle death in dungeon → Death Modal

### Step 11: Death Handling

- [ ] Show death modal with 3 options
  - See: [Exploration Doc → Death & Rescue](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#death--rescue)
- [ ] Restart (lose all)
- [ ] Rescue (pay gold)
- [ ] Leave (keep loot so far)

### Step 12: Exit & Rewards

- [ ] Grant pending loot on exit
- [ ] Consume dungeon key (or refund if abandoned)
- [ ] Show summary screen

### Step 13: Dungeon Selection UI

- [ ] List templates with loot bias displayed
  - See: [Exploration Doc → Dungeon Selection](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#dungeon-selection)
- [ ] Key counter display
- [ ] Random dungeon option

### Step 14: Minimap

- [ ] 3x3 corner view
  - See: [Exploration Doc → Minimap & Full Map](file:///c:/Users/bwales/projects/obsidian-plugins/quest-board/docs/rpg-dev-aspects/Exploration%20System.md#minimap--full-map)
- [ ] Full map modal (rooms as colored rectangles)
- [ ] Fog of war with CSS `filter: brightness(0)`

### Step 15: Additional Dungeons

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

*Last Updated: 2026-01-24*
