# QB Feature Tracking

Simple task list for Quest Board development. Copy to your quest tracker.

---

## Phase 2: Polish & Training Mode

### ✅ Completed
- [x] XP Wiring & Task Display - Task completion → XP awards, class bonuses
- [x] UI Redesign - Full-page Kanban + Focused Sidebar views
- [x] Section Parsing & Task Display - `##`/`###` as Mini Objectives, collapsible sections
- [x] Quest Creation Modal - FuzzySuggestModal for file browsing
- [x] Drag-and-Drop - @dnd-kit/core, DroppableColumn, DraggableCard
- [x] Character Sheet Layout - Gear slots, sprite folder setting
- [x] XP Progress Bar - Animated fill bar (0.5s CSS transition)
- [x] Level-Up Celebration - Confetti modal with class-themed message
- [x] Training Mode - Roman numerals I-X, 75 XP/level, graduation
- [x] Smart Template System - 12 domain-specific quest templates
- [x] Multi-File Task Linking - Multiple task files per quest
- [x] Quest-Level Collapse - ▼/▶ toggle on quest cards
- [x] Achievement System - 32 defaults, hub modal, unlock popup, triggers
- [x] Weekly Streak Tracker - Count consecutive days with completions
- [x] Quest Visibility Controls - Show next 3-4 tasks, hide future
- [x] Gear Slot UI - Display empty gear slots on character sheet
- [x] Sprite Renderer Service - Version-based caching

### Remaining
- [ ] Power-Ups Display - Show active class perk + bonuses
- [ ] Filter/Search - Filter quests by category/priority

---

## Phase 3: AI & Pixel Art

### Sprite System (Revised Plan)
- [ ] Paladin Class Sprites Only - 5 tiers × 6 gear slots = ~30 sprites
- [ ] Shared/Universal Sprites - Body base, skin tones, hair, accessories (~21)
- [ ] Icon Pack Integration - Use existing icon packs for items, reduce generation
- [ ] Sprite Layering System - Canvas-based assembly
- [x] Level Tier Transitions - Animate sprite changes

**Note:** Original estimate was 100-120 sprites. Revised to ~50 for Paladin only + icons as needed.

### Polish (Moved from Phase 2)
- [ ] React UI Polish - Smooth animations, transitions
- [ ] Theme Compatibility - Dark/light mode testing

### AI Features
- [ ] API Key in Settings - Gemini API key storage
- [ ] AI Quest Generation (Gemini)
- [ ] Quest Generation Preview
- [ ] Progressive Quest Reveal

### Game Systems
- [ ] Enrage System - 7+ day XP penalty
- [ ] Loot System - Roll for consumables
- [ ] Consumable Usage

### Views & UI
- [ ] Tavern View - Rest screen
- [ ] "Take Quest" Button - Random quest picker
- [ ] Weekly Sprint View
- [ ] Sprint Progress Bars

### Integrations
- [ ] Daily Note Integration
- [ ] Chronos Integration
- [ ] Switchboard Integration

### Settings
- [ ] Export Stats
- [ ] Advanced Settings
- [ ] Category Management
- [ ] Import/Export

---

**Last Updated:** 2026-01-21
