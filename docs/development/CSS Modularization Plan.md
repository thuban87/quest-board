# CSS Modularization Plan

**Goal:** Split the 8100+ line `styles.css` into smaller, maintainable modules to improve developer experience and AI assistant effectiveness.

---

## Current Problem

- `styles.css` is 8100+ lines and 170KB
- AI agents truncate or lose context when working with the file
- Finding specific styles is difficult
- Changes are risky due to file size
- Code review is painful

---

## Proposed Solution

Use **PostCSS with `postcss-import`** to split CSS into logical modules during development, then bundle them back into a single `styles.css` for deployment.

### Why PostCSS?
- Lightweight (no Sass/SCSS learning curve)
- Standard CSS syntax with `@import`
- Minimal new dependencies
- Works seamlessly with esbuild

---

## New File Structure

```
quest-board/
├── src/
│   └── styles/
│       ├── index.css          # Entry point - imports all modules
│       ├── variables.css      # CSS custom properties (~40 lines)
│       ├── base.css           # Container, header, error states (~100 lines)
│       ├── kanban.css         # Kanban columns, quest cards (~400 lines)
│       ├── character.css      # Character sheet, stats, streaks (~400 lines)
│       ├── modals.css         # All modal dialogs (~600 lines)
│       ├── sidebar.css        # Sidebar view (~300 lines)
│       ├── fullpage.css       # Full-page Kanban view (~400 lines)
│       ├── power-ups.css      # Buffs, status bar (~250 lines)
│       ├── inventory.css      # Inventory, blacksmith, loot (~500 lines)
│       ├── combat.css         # Battle view, actions (~800 lines)
│       ├── dungeons.css       # Exploration, tiles, minimap (~1200 lines)
│       ├── animations.css     # All @keyframes (~200 lines)
│       └── mobile.css         # Responsive @media queries (~300 lines)
├── styles.css                 # Generated output (gitignored or committed)
└── postcss.config.cjs         # PostCSS configuration
```

### Module Breakdown by Line Range

| Module | Original Line Range | Description |
|--------|---------------------|-------------|
| `variables.css` | 1-38 | CSS custom properties |
| `base.css` | 40-313 | Container, header, empty/error states, responsive base |
| `modals.css` | 315-580 | Modal backdrop, forms, class selection, buttons |
| `kanban.css` | 581-813 | Kanban board, columns, quest cards |
| `character.css` | 814-1062 | Character sheet, XP, perk, stats, training notice |
| `sidebar.css` | 1063-1800 | Task list, sections, sidebar container, tabs |
| `fullpage.css` | 1200-1443 | Full-page Kanban columns, collapsed states |
| `power-ups.css` | 2886-3100 | Active buffs, status bar, buff tray |
| `inventory.css` | 3800-5000 | Inventory, loot, blacksmith modals |
| `combat.css` | 5200-6400 | Battle view, HP bars, actions, picker |
| `dungeons.css` | 6800-8000 | Dungeon grid, tiles, minimap, D-pad, transitions |
| `animations.css` | scattered | All @keyframes consolidated |
| `mobile.css` | scattered | All @media queries consolidated |

---

## Implementation Steps

### Phase 1: Setup (5 min)
1. Install dependencies:
   ```bash
   npm install -D postcss postcss-import postcss-cli
   ```

2. Create `postcss.config.cjs`:
   ```javascript
   module.exports = {
     plugins: [
       require('postcss-import'),
     ]
   };
   ```

3. Create folder structure:
   ```bash
   mkdir src/styles
   ```

4. Update `package.json` scripts:
   ```json
   {
     "scripts": {
       "css:build": "postcss src/styles/index.css -o styles.css",
       "css:watch": "postcss src/styles/index.css -o styles.css --watch",
       "dev": "npm run css:watch & node esbuild.config.mjs",
       "build": "npm run css:build && node esbuild.config.mjs production"
     }
   }
   ```

### Phase 2: Create Entry Point (2 min)
Create `src/styles/index.css`:
```css
/* Quest Board - CSS Entry Point */
/* All modules are bundled into styles.css during build */

@import "./variables.css";
@import "./base.css";
@import "./kanban.css";
@import "./character.css";
@import "./modals.css";
@import "./sidebar.css";
@import "./fullpage.css";
@import "./power-ups.css";
@import "./inventory.css";
@import "./combat.css";
@import "./dungeons.css";
@import "./animations.css";
@import "./mobile.css";
```

### Phase 3: Split CSS (30-45 min)
Extract sections from `styles.css` into individual module files:

1. **variables.css** - Lines 1-38 (CSS custom properties)
2. **base.css** - Container, header, empty/error states
3. **kanban.css** - Board, columns, cards
4. **character.css** - Sheet, stats, gear, streaks
5. **modals.css** - All modals (create quest, level up, achievements, etc.)
6. **sidebar.css** - Sidebar-specific styles
7. **fullpage.css** - Full-page view
8. **power-ups.css** - Buffs, status bar
9. **inventory.css** - Inventory, blacksmith, loot
10. **combat.css** - Battle view, actions
11. **dungeons.css** - Exploration, tiles, minimap, D-pad
12. **animations.css** - All @keyframes (consolidate from scattered locations)
13. **mobile.css** - All @media queries (consolidate from scattered locations)

### Phase 4: Verify (5 min)
1. Run `npm run css:build`
2. Compare output `styles.css` with original (should be identical or equivalent)
3. Run `npm run build` to ensure full build works
4. Deploy to test vault and verify no visual regressions

---

## Verification Checklist

- [ ] `npm run css:build` produces valid CSS
- [ ] Output `styles.css` is roughly same size as original
- [ ] `npm run build` succeeds
- [ ] Plugin loads in test vault
- [ ] All views render correctly (sidebar, full-page, modals)
- [ ] Dungeon view works
- [ ] Combat view works
- [ ] Mobile responsive still works

---

## Rollback Plan

If issues arise:
1. Keep original `styles.css` as `styles.css.backup` during migration
2. Can revert by restoring backup
3. No changes to TypeScript/React code required

---

## Future Improvements (Optional)

Once modularized, consider:
- **CSS nesting** (native or via PostCSS plugin)
- **Autoprefixer** for browser compatibility
- **CSS minification** for production builds
- **CSS variables documentation** in a separate file

---

## Dependencies to Add

```json
{
  "devDependencies": {
    "postcss": "^8.4.x",
    "postcss-import": "^16.x",
    "postcss-cli": "^11.x"
  }
}
```

---

## Notes

- The original `styles.css` can be deleted or gitignored after migration (it becomes a build artifact)
- AI agents will work with individual ~100-500 line files instead of one 8100 line file
- Finding styles becomes trivial: "dungeon styles" → look in `dungeons.css`
- Changes are isolated: editing `modals.css` won't affect `combat.css`

---

**Created:** 2026-01-27
**Status:** Pending Review
