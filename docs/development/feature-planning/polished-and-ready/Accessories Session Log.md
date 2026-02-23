# Accessories & Special Abilities Session Log

**Phase:** Accessories & Special Abilities (Phase 4 expansion)  
**Start Date:** 2026-02-21  
**Related Docs:**
- [Implementation Plan](feature-planning/brainstorming/Accessories%20%26%20Special%20Abilities%20Brainstorm.md)
- [Feature Roadmap v2](Feature%20Roadmap%20v2.md)

---

## Session Format

Each session entry includes:
- **Date & Focus** — What was worked on
- **Completed** — Tasks finished
- **Files Changed** — Source files modified/created
- **Testing Notes** — Test results and coverage
- **Blockers/Issues** — Problems encountered
- **Next Steps** — What to do next session

---

## Session 1 — 2026-02-21 — Brainstorming & Planning

**Focus:** Deep codebase review and implementation plan creation

**Completed:**
- [x] Deep review of 15+ source files for integration points
- [x] Identified 14 internal findings (architecture, security, performance, guidelines, gaps)
- [x] Reviewed 8 external dev findings and resolved all with Brad
- [x] Locked all 16 design decisions
- [x] Wrote comprehensive implementation plan (10 phases, 28 files, ~84 tests planned)
- [x] Created companion session log

**Files Changed:**
- `docs/development/feature-planning/brainstorming/Accessories & Special Abilities Brainstorm.md` — Full rewrite as implementation plan
- `docs/development/Accessories Session Log.md` — Created

**Testing Notes:** N/A (planning session)

**Blockers/Issues:**
- `Minimap.tsx` confirmed dead code — should be cleaned up separately
- Existing `console.log` in 4 source files — deferred to pre-BRAT cleanup
- `uniqueDropId` field on `MonsterTemplate` needs removal after boss loot table migration

**Next Steps:**
- Begin Phase 1: Data Foundation & Models
- Start with `accessories.ts` data file creation and model interface updates

### Next Session Prompt
> Start Phase 1 of the Accessories & Special Abilities implementation. Review the implementation plan in `docs/development/feature-planning/brainstorming/Accessories & Special Abilities Brainstorm.md`. Begin by adding `templateId` to `GearItem` in `Gear.ts`, `BossLootTable` to `Monster.ts`, `totalShieldsUsedThisWeek` to `Character.ts`, then create `src/data/accessories.ts` with all 50+ templates and T1 name pools. Follow with Phase 1.5 tests.

---

## Session 2 — 2026-02-21 — Phase 1: Data Foundation & Models + Phase 1.5: Tests

**Focus:** Implement all Phase 1 model changes, schema migration, data file creation, and comprehensive tests

**Completed:**
- [x] Added `templateId?: string` to `GearItem` in `Gear.ts`
- [x] Added `BossLootTable` interface + `bossLootTable?` field to `MonsterTemplate` in `Monster.ts`
- [x] Replaced `shieldUsedThisWeek: boolean` with `totalShieldsUsedThisWeek: number` in `Character.ts`
- [x] Bumped `CHARACTER_SCHEMA_VERSION` to 6
- [x] Implemented `migrateCharacterV5toV6()` with boolean→number conversion
- [x] Updated migration chain (v4→v5 now chains to v6)
- [x] Updated all 12 `shieldUsedThisWeek` references across 4 files (StreakService, characterStore, settings, TestCharacterGenerator)
- [x] Created `src/data/accessories.ts` — 52 curated templates (30 general + 20 boss + 2 achievement), T1 name pools, lazy-initialized registry
- [x] Modified `uniqueItems.ts` — removed Ring of Completionist and Amulet of Dedication, added `templateId` to `createUniqueItem()` return
- [x] Created `test/accessories-data.test.ts` — 60 tests covering all 12 test cases from the plan
- [x] Full regression suite: 664 tests passed, 0 failures

**Files Changed:**
- `src/models/Gear.ts` — Added `templateId` to `GearItem`
- `src/models/Monster.ts` — Added `BossLootTable` interface + field
- `src/models/Character.ts` — Schema v6 migration, field rename
- `src/services/StreakService.ts` — Boolean→number shield logic
- `src/store/characterStore.ts` — Updated default
- `src/settings.ts` — Updated reset handler
- `src/services/TestCharacterGenerator.ts` — Updated default
- `src/data/accessories.ts` — **[NEW]** 52 templates + T1 name pools
- `src/data/uniqueItems.ts` — Removed Ring/Amulet, added templateId
- `test/accessories-data.test.ts` — **[NEW]** 60 tests

**Testing Notes:**
- 60/60 accessory data tests pass
- 664/664 total suite tests pass (0 regressions)
- Pre-existing `deprecated-code/Minimap.tsx` build errors resolved by moving folder out of workspace

**Blockers/Issues:**
- `deprecated-code/` folder was causing build failures — Brad moved it out of workspace to resolve
- No new bugs discovered

**Next Steps:**
- Begin Phase 2: AccessoryEffectService
- Implement the effect handler registry and all effect resolution methods

### Next Session Prompt
> Start Phase 2 of the Accessories & Special Abilities implementation. The data foundation is complete in `src/data/accessories.ts`. Create `src/services/AccessoryEffectService.ts` with the effect handler registry and all resolution methods (getGoldMultiplier, getXPMultiplier, getCombatBonus, etc.). Reference the implementation plan starting at Phase 2 in the brainstorm document.

---

## Session 3 — 2026-02-21 — Phase 2: AccessoryEffectService + Phase 2.5: Tests

**Focus:** Build the central effect resolver service and comprehensive test suite

**Completed:**
- [x] Created `src/services/AccessoryEffectService.ts` — 9 grouped pure-function methods (~250 lines)
- [x] Implemented explicit effect type maps (no string concatenation) for all 37 effect types
- [x] Shared `getEquippedAccessoryEffects()` helper for slot iteration + template lookup
- [x] `source: 'all'` matching for gold and XP multipliers
- [x] Conditional HP-threshold bonuses with division-by-zero guard
- [x] Boolean return types for map reveal and auto-revive (non-stacking)
- [x] Created `test/accessory-effect-service.test.ts` — 68 tests covering all 11 test groups from plan
- [x] Full regression suite: 732 tests passed, 0 failures

**Files Changed:**
- `src/services/AccessoryEffectService.ts` — **[NEW]** 9 grouped methods, pure function resolver
- `test/accessory-effect-service.test.ts` — **[NEW]** 68 tests

**Testing Notes:**
- 68/68 accessory effect service tests pass (7ms)
- 732/732 total suite tests pass (0 regressions, up from 664)
- Clean build, deployed to test vault

**Blockers/Issues:**
- No new bugs discovered
- No deviations from the plan

**Next Steps:**
- Begin Phase 3: Loot Integration
- Implement `pickWeightedSlot()`, boss loot tables, smelting block, quest tier gating

### Next Session Prompt
> Start Phase 3 of the Accessories & Special Abilities implementation. The AccessoryEffectService is complete. Implement loot integration: add `pickWeightedSlot()` to `LootGenerationService.ts`, add `bossLootTable` data to `monsters.ts`, add smelting block to `SmeltingService.ts`, consolidate accessory checkboxes in `GearSlotMappingModal.ts`, and update `settings.ts` defaults. Reference the implementation plan starting at Phase 3 in the brainstorm document.

---

## Session 4 — 2026-02-21 — Phase 3: Loot Integration + Phase 3.5: Tests

**Focus:** Wire accessories into the existing gear drop pool, implement boss loot tables, smelting guards, and comprehensive tests

**Completed:**
- [x] Added `pickWeightedSlot()` to `LootGenerationService.ts` — weighted slot selection (primary 1.0, accessory 0.4)
- [x] Added `rollAccessoryTier()` — level-gated tier selection from `ACCESSORY_TIER_POOLS`
- [x] Added `generateAccessoryForSlot()` — T1 procedural generation + T2+ curated template resolution
- [x] Added `generateT1Accessory()` and `generateCuratedAccessory()` helper methods
- [x] Added `rollBossLootTable()` — uniqueness check against inventory/equipped, extra gold on duplicate
- [x] Added training mode guard to exclude accessory slots
- [x] Added quest loot tier gating for accessory slots
- [x] Added `bossLootTable` to all 20 boss templates in `monsters.ts` (1:1 boss→accessory mapping, 80-90% drop chance)
- [x] Added accessory smelting block in `SmeltingService.ts` + `doubleTierChance` parameter
- [x] Consolidated accessory checkboxes to single "Accessories" toggle in `GearSlotMappingModal.ts`
- [x] Updated `DEFAULT_QUEST_SLOT_MAPPING` in `settings.ts` with accessory defaults
- [x] Fixed feedback: removed ring emoji, changed "Accessory 2" → "Accessory", excluded accessories from smelting page
- [x] Created `test/accessory-drops.test.ts` — 40 tests
- [x] Created `test/boss-loot-table.test.ts` — 24 tests
- [x] Full regression suite: 796 tests passed, 0 failures

**Files Changed:**
- `src/services/LootGenerationService.ts` — ~290 new lines (weighted slots, accessory generation, boss loot tables)
- `src/data/monsters.ts` — `bossLootTable` on all 20 bosses (~60 lines)
- `src/services/SmeltingService.ts` — Accessory smelting block + `doubleTierChance` (~15 lines)
- `src/modals/GearSlotMappingModal.ts` — Consolidated accessory checkbox (~30 lines)
- `src/settings.ts` — Updated default quest slot mapping
- `src/models/Gear.ts` — Accessory slot display names → "Accessory"
- `src/modals/BlacksmithModal.ts` — Excluded accessories from smelting inventory grid
- `test/accessory-drops.test.ts` — **[NEW]** 40 tests
- `test/boss-loot-table.test.ts` — **[NEW]** 24 tests

**Testing Notes:**
- 40/40 accessory drops tests pass (15ms)
- 24/24 boss loot table tests pass (11ms)
- 796/796 total suite tests pass (0 regressions, up from 732)
- Clean build, deployed to test vault, manually verified by Brad

**Blockers/Issues:**
- Boss loot tables will not fire in combat until Phase 4a wires `monsterTemplateId` through `BattleService.generateVictoryLoot()`
- Existing settings won't auto-migrate to include accessory slots — users must toggle manually in Gear Slot Mapping modal (note for BRAT rollout)

**Next Steps:**
- Begin Phase 4a: UI — Equip & Tooltips
- Add accessory slots to character sheet, comparison tooltips, and wire `BattleService.generateVictoryLoot()` to pass `monsterTemplateId`

### Next Session Prompt
> Start Phase 4a of the Accessories & Special Abilities implementation. Phase 3 loot integration is complete (weighted drops, boss loot tables, smelting guard). The critical next step is wiring `BattleService.generateVictoryLoot()` to pass `monsterTemplateId` to `generateCombatLoot()` so boss accessories actually drop. Then add accessory equip slots to the character sheet UI and implement comparison tooltips. Reference the implementation plan starting at Phase 4a in the brainstorm document.

---

## Session 5 — 2026-02-21 — Phase 4a: Combat & Loot Integration + Bug Fixes

**Focus:** Wire AccessoryEffectService into all game systems (combat, loot, tooltips, smelting, consumables) and fix accessory equip/UI bugs found during testing

**Completed:**
- [x] CombatService — stat multipliers, crit/dodge/block/def/attack/HP/mana bonuses, fire resist, crit damage
- [x] BattleService — XP/gold multipliers in handleVictory, lifesteal/poison procs, crit damage bonus, conditional bonuses, Phoenix Feather auto-revive, boss loot table wiring via monsterTemplateId
- [x] LootGenerationService — quest/combat/dungeon gold multipliers, gear drop/tier bonuses, boss consumable guarantee, daily vs quest gold source detection
- [x] StatsService — stat multiplier (Heart of the Wyrm +10% all stats), stat gain XP bonus
- [x] BlacksmithModal — doubleTierChance from accessories passed to smelting
- [x] ConsumableUsageService — potion healing bonus applied to HP and mana restore
- [x] gearFormatters — accessory ability text in string and DOM tooltips using shared formatEffectLabel()
- [x] InventoryModal — flexible accessory slot equip, consolidated filter (3→1 button), targeted slot comparison tooltip
- [x] characterStore — equipGear allows accessories in any slot
- [x] AccessoryEffectService — EFFECT_DISPLAY_LABELS map + formatEffectLabel() for human-readable effect names
- [x] Added 3 test accessories to test vault data.json (Merchant's Signet, Alchemist's Purse, Berserker's Band)
- [x] 3 rounds of bug-fix iteration with Brad:
  - Round 1: Fixed accessory-locked slots, filter consolidation, potion healing bonus
  - Round 2: Fixed slot targeting (clicked vs general open), human-readable labels, gold debug logging
  - Round 3: Fixed tooltip comparison against targeted slot, switched debug to console.warn
- [x] Verified gold multiplier working (acc=1.35 confirmed in console)
- [x] Excluded test/ directory from tsconfig to fix build errors from Phase 3.5 test files

**Files Changed:**
- `src/services/CombatService.ts` — Accessory combat bonuses (~40 lines)
- `src/services/BattleService.ts` — XP/gold multipliers, procs, Phoenix Feather, crit damage, conditionals (~60 lines)
- `src/services/LootGenerationService.ts` — Gold/loot multipliers, boss consumable (~35 lines)
- `src/services/StatsService.ts` — Stat multiplier, XP multiplier (~10 lines)
- `src/services/AccessoryEffectService.ts` — EFFECT_DISPLAY_LABELS + formatEffectLabel() (~70 lines)
- `src/services/ConsumableUsageService.ts` — Potion healing bonus (~20 lines)
- `src/modals/BlacksmithModal.ts` — doubleTierChance passthrough (~5 lines)
- `src/modals/InventoryModal.ts` — Flexible equip, consolidated filter, targeted tooltip (~60 lines)
- `src/store/characterStore.ts` — equipGear accessory slot flexibility (~5 lines)
- `src/utils/gearFormatters.ts` — Shared formatEffectLabel() in both tooltip paths (~15 lines)
- `tsconfig.json` — Excluded test/ from production build
- `test/battle.test.ts` — Added fireResist, critDamageBonus to mocks
- `test/store/battleStore.test.ts` — Added fireResist, critDamageBonus to mocks
- `test/services/BattleService.test.ts` — Added fireResist, critDamageBonus to mocks
- `test/services/ConsumableUsageService.test.ts` — Added fireResist, critDamageBonus to mocks

**Testing Notes:**
- Build passes cleanly with test/ excluded from tsconfig
- Deployed to test vault 4 times during iterative testing
- Gold multiplier verified: base=32 × acc=1.35 = 43 (Merchant's Signet +10% + Alchemist's Purse +25%)
- Tooltip comparison, filter consolidation, slot targeting all Brad-confirmed
- Human-readable labels confirmed looking good

**Blockers/Issues:**
- `console.debug` is filtered by default in Obsidian DevTools — use `console.warn` for temporary debugging
- Accessories generated by LootGenerationService still get a hardcoded slot (e.g., `accessory2` for rings) — this is cosmetic only since `equipGear` and `equipItem` now handle flexible placement

**Next Steps:**
- Begin Phase 4b: remaining service integrations (StreakService, DungeonStore, stamina cap)
- Phase 4c: tests for all Phase 4a/4b integrations

### Next Session Prompt
> Start Phase 4b of the Accessories & Special Abilities implementation. Phase 4a (Combat & Loot Integration) is fully complete and tested. Remaining Phase 4b items: (1) StreakService — wire streak shield bonus into `updateStreak()`/`checkStreakOnLoad()`, (2) DungeonStore — map reveal via `dungeon_map_reveal`, golden chest chance via `dungeon_golden_chest`, Phoenix Feather auto-revive via `dungeon_auto_revive`, (3) Stamina cap bonus via `utility_stamina_cap` in `awardStamina()`. Reference the brainstorm document Phase 4b section.

---

## Session 6 — 2026-02-21 — Phase 4b: Consumer Integration — Meta-Game ✅

**Focus:** Wire accessory effects into XP awards, streak shields, character stats, stamina caps, dungeon map reveal, and sell gold multiplier

**Completed:**
- [x] `useXPAward.ts` — Accessory XP multipliers for quest, recurring, and first-daily tasks (additive with class bonus)
- [x] `StreakService.ts` — Generalized shield logic: Paladin base + accessory `streakShield` bonus stacking
- [x] `QuestActionsService.ts` — Pass `equippedGear` to `updateStreak()`
- [x] `main.ts` — Pass `equippedGear` to `checkStreakOnLoad()`
- [x] `characterStore.ts` — HP/Mana clamping on equip/unequip, dynamic stamina cap, sell gold multiplier in `bulkRemoveGear`, accessory bonuses in `recalculateMaxHPMana`
- [x] `dungeonStore.ts` — `phoenixFeatherUsedThisDungeon` flag, map reveal from `dungeon_map_reveal` on dungeon entry
- [x] `useDungeonBonuses.ts` **[NEW]** — Memoized hook for dungeon accessory bonuses
- [x] `DungeonView.tsx` — Wired `useDungeonBonuses` hook
- [x] `settings.ts` — Replaced test level dropdown with number input (1-40)
- [x] `InventoryModal.ts` — Fixed sell multiplier: moved from `bulkRemoveGear` to actual `sellItem()` path, added bonus Notice text

**Files Changed:**
- `src/hooks/useXPAward.ts` — XP multiplier integration (~20 lines)
- `src/services/StreakService.ts` — Shield stacking logic (~30 lines)
- `src/services/QuestActionsService.ts` — Callsite update (1 line)
- `main.ts` — Callsite update (1 line)
- `src/store/characterStore.ts` — HP/Mana clamping, stamina cap, sell multiplier, recalculateMaxHPMana (~50 lines)
- `src/store/dungeonStore.ts` — Phoenix Feather flag, map reveal (~25 lines)
- `src/hooks/useDungeonBonuses.ts` — **[NEW]** Dungeon bonus hook (~45 lines)
- `src/components/DungeonView.tsx` — Hook wiring (~5 lines)
- `src/settings.ts` — Number input for test level (~10 lines)
- `src/modals/InventoryModal.ts` — Sell multiplier fix (~15 lines)

**Testing Notes:**
- All 796 tests pass (0 regressions)
- Manual testing confirmed 5/6 features in Obsidian:
  - ✅ Scholar's Monocle: quest XP bonus applied
  - ✅ Stamina Sash: stamina cap increased
  - ✅ Stoneblood Amulet: maxHP increase on equip, clamp on unequip
  - ✅ Mana Wellspring Ring: maxMana increase on equip
  - ✅ Cartographer's Lens: full dungeon map revealed on entry
  - ⚠️ Miser's Pendant: initially no effect (sell multiplier was in wrong code path — fixed)
- Streak shield stacking deferred to unit/integration tests (Phase 4c)

**Bugs Found & Fixed:**
- **Sell multiplier in wrong location:** Was in `bulkRemoveGear()` (used for smelting cleanup, not selling). Actual sell path is `InventoryModal.sellItem()` → `removeGear()` + `updateGold()`. Moved multiplier there.
- **No bulk sell feature exists:** `bulkRemoveGear()` has no UI caller for selling — only used by QuestActionsService for smelting. Keeping the multiplier there too for future-proofing.

**Next Steps:**
- Phase 4c: Unit and integration tests for all Phase 4b integrations
- Phase 6: Achievement Accessory Migration

### Next Session Prompt
> Phase 4b (Meta-Game Integration) is complete. Begin Phase 4c: unit and integration tests for all Phase 4a/4b consumer integrations. Key areas to test: XP multiplier stacking in useXPAward, streak shield generalization in StreakService, HP/Mana clamping in characterStore, dynamic stamina cap, sell gold multiplier in InventoryModal.sellItem, and dungeon map reveal in dungeonStore.

---

## Session 7 — 2026-02-22 — Phase 4c: Tests — Consumer Integration ✅

**Focus:** Integration tests for all Phase 4a/4b consumer integrations, plus React testing infrastructure setup

**Completed:**
- [x] Installed `@testing-library/react` + `jsdom` for React hook/component testing
- [x] Updated `vitest.config.ts` environment from `node` → `jsdom`
- [x] Cleaned up `test/setup.ts` — removed manual DOM mock (jsdom provides it)
- [x] Wrote `test/accessory-integration.test.ts` — 33 tests across 8 describe blocks
- [x] Fixed pre-existing import path bugs in `accessory-drops.test.ts` and `boss-loot-table.test.ts`

**Files Changed:**
- `test/accessory-integration.test.ts` — **[NEW]** 33 integration tests covering 8 consumer systems
- `vitest.config.ts` — Environment change (`node` → `jsdom`)
- `test/setup.ts` — Removed manual DOM mock
- `test/accessory-drops.test.ts` — Fixed import paths (`../../src/` → `../src/`)
- `test/boss-loot-table.test.ts` — Fixed import paths (`../../src/` → `../src/`)
- `package.json` — Added `@testing-library/react`, `jsdom` devDependencies
- `package-lock.json` — Updated lockfile

**Testing Notes:**
- 829 tests pass (0 failures), up from 765
  - +33 new integration tests
  - +31 recovered tests from path fix (accessory-drops + boss-loot-table)
- Test coverage across 8 describe blocks:
  - `deriveCombatStats` (5) — crit/dodge/block, HP/Mana%, stat multiplier, loot tier, fire resist
  - `handleVictory` (3) — XP multiplier, gold multiplier, boss loot templating
  - `LootGenerationService` (5) — quest gold, daily gold, set chance, tier upgrade, boss consumable
  - `StreakService` (4) — shield counts, weekly reset, streak preservation
  - `characterStore` (6) — HP/Mana clamping, stamina cap, sell value, rapid equip
  - `dungeonStore` (2) — map reveal, golden chest
  - `useXPAward` (4) — quest/recurring/first-daily XP, additive stacking
  - `gearFormatters` (4) — tooltip abilities, T1 omission, lifesteal proc, stat gain

**Bugs Found & Fixed:**
- **Pre-existing path bug:** `accessory-drops.test.ts` and `boss-loot-table.test.ts` used `../../src/` imports but live directly in `test/` (1 level deep). Fixed to `../src/`, recovering 31 tests that were silently failing.

**Next Steps:**
- Phase 6: Achievement Accessory Migration
- Phase 7: AI Generation
- Future: Title System implementation

### Next Session Prompt
> Phase 4c (Consumer Integration Tests) is complete — 33 tests verifying all accessory consumer integrations. React testing infrastructure (`@testing-library/react` + jsdom) is now installed and ready for future component/hook testing. The full test suite is at 829 tests with 0 failures. Next priorities: Phase 6 (Achievement Accessory Migration) or Title System implementation.

---

## Session 8 — 2026-02-22 — Phase 5: Manual Testing & Fixes ✅

**Focus:** Brad's manual QA pass on all accessory features, implementing missing functionality, fixing tooltips, and upgrading character sheet tooltips.

**Completed:**
- [x] Implemented Phoenix Feather dungeon revive (was missing entirely)
- [x] Fixed accessory tooltip to be context-aware (browse = 1×3 grid, slot-click = 1×1 comparison)
- [x] Replaced plain `title` tooltips on character sheet with rich DOM tooltips
- [x] Added then removed ACC-DEBUG logs for combat stats, smelting, XP, gold, stamina, and sell value
- [x] Added CSS for multi-accessory tooltip layout
- [x] Brad passed all 25 manual test items

**Files Changed:**
- `src/components/DungeonView.tsx` — Phoenix Feather auto-revive logic in `handleDefeat`
- `src/store/dungeonStore.ts` — Added `markPhoenixFeatherUsed` action
- `src/utils/gearFormatters.ts` — Added `createAccessoryMultiTooltip` and `attachAccessoryTooltip`
- `src/modals/InventoryModal.ts` — Context-aware accessory tooltip + import fix
- `src/components/character/EquipmentGrid.tsx` — Rich tooltip via `useRef`+`useEffect`+`attachGearTooltip`
- `src/components/character/EquipmentPaperdoll.tsx` — Rich tooltip via `useRef`+`useEffect`+`attachGearTooltip`
- `src/styles/inventory.css` — Multi-accessory tooltip CSS
- `src/services/CombatService.ts` — Debug log added then removed
- `src/services/SmeltingService.ts` — Debug log added then removed
- `src/services/BattleService.ts` — Debug log added then removed
- `src/services/LootGenerationService.ts` — Debug log added then removed
- `src/hooks/useXPAward.ts` — Debug log added then removed
- `src/store/characterStore.ts` — Debug log added then removed

**Testing Notes:**
- 829 tests pass (0 failures)
- All 25 manual test items passed by Brad
- Build clean, deployed to test vault

**Bugs Found & Fixed:**
- **Missing feature:** Phoenix Feather dungeon revive had store tracking (`phoenixFeatherUsedThisDungeon`) but no actual revive logic in `DungeonView.tsx`
- **Tooltip bug:** Accessory tooltip showed 1×1 comparison in all contexts instead of 1×3 grid when browsing

**Next Steps:**
- Phase 5 complete — accessories fully tested and working
- Next: Phase 6 (Achievement Accessory Migration) or Title System implementation

### Next Session Prompt
> Phase 5 (Manual Testing & Fixes) is complete. All 25 test matrix items passed. Phoenix Feather revive implemented, accessory tooltips are context-aware, and character sheet has rich tooltips. All debug logs removed. 829 tests, 0 failures. Next priorities: Phase 6 (Achievement Accessory Migration) or Title System implementation.
