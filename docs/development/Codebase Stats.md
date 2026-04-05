# 🏰 Quest Board — Codebase Stats

**Generated:** 2026-02-07 | **Version:** v1.0.0

---

## Overall Size

| Metric | Value |
|--------|-------|
| **Total Source Files** | **170** (.ts / .tsx) |
| **Total Lines of Code** | **43,574** |
| **Total Characters** | **~1.67 million** |
| **Total File Size** | **1.73 MB** of TypeScript/TSX |
| **CSS Modules** | **17 files**, **17,316 lines**, ~392K characters |
| **Grand Total (code + CSS)** | **~60,890 lines** |

---

## Breakdown by Layer

| Layer | Files | Lines | % of Code |
|-------|------:|------:|----------:|
| **Services** | 37 | 13,377 | 30.7% |
| **Modals** | 40 | 9,723 | 22.3% |
| **Components** (.tsx) | 12 | 4,718 | 10.8% |
| **Data** (definitions) | 7 | 3,685 | 8.5% |
| **Models** | 13 | 2,582 | 5.9% |
| **Store** (Zustand) | 8 | 2,146 | 4.9% |
| **Dungeons** (templates) | 7 | 1,844 | 4.2% |
| **Utils** | 14 | 1,610 | 3.7% |
| **Hooks** | 10 | 1,327 | 3.0% |
| **Settings** (`settings.ts`) | 1 | 1,002 | 2.3% |
| **Character** (sprites/classes) | 13 | 812 | 1.9% |
| **Config** | 1 | 419 | 1.0% |
| **Views** | 7 | 329 | 0.8% |

---

## File Size Distribution

| Metric | Value |
|--------|-------|
| **Average file** | 256 lines |
| **Median file** | 179 lines |
| **Smallest file** | 4 lines |
| **Largest file** | 1,240 lines (`BattleService.ts`) |
| **Files over 300 lines** | 49 (29% of codebase) |
| **Files over 500 lines** | 23 (14% of codebase) |

---

## 🐉 Top 10 Largest Files

| # | File | Lines |
|---|------|------:|
| 1 | `BattleService.ts` | 1,240 |
| 2 | `DungeonView.tsx` | 1,229 |
| 3 | `ScrivenersQuillModal.ts` | 1,050 |
| 4 | `settings.ts` | 1,002 |
| 5 | `monsters.ts` | 987 |
| 6 | `characterStore.ts` | 917 |
| 7 | `skills.ts` | 910 |
| 8 | `monsterSkills.ts` | 858 |
| 9 | `Character.ts` | 814 |
| 10 | `BattleView.tsx` | 784 |

---

## Testing

| Metric | Value |
|--------|-------|
| **Test files** | 17 (in `test/` directory) |
| **Test lines** | 6,139 |
| **Test-to-source ratio** | ~1:7 (14% coverage by volume) |

---

## Exported Symbols

| Metric | Value |
|--------|-------|
| **Total exports** (classes, functions, consts, interfaces, types, enums) | **697** |

---

## Feature Count (by architectural components)

| Feature Area | Count |
|-------------|------:|
| Services | 37 |
| Modals / UI Dialogs | 40 |
| React Components | 12 |
| Zustand Stores | 8 |
| Data Models | 13 |
| Custom Hooks | 10 |
| Data Files (skills, monsters, dungeons) | 14 |
| Utility Modules | 14 |
| CSS Style Modules | 17 |

---

## Summary

~44K lines of TypeScript + ~17K lines of CSS = **~61K total lines of hand-crafted code**, across **170 source files** and **17 style modules**. The heaviest areas are **services** (31% of all code) and **modals** (22%). There are 23 files exceeding the 500-line guideline — the combat system (`BattleService`, `BattleView`, `DungeonView`) and template system (`ScrivenersQuillModal`) being the biggest. For context, 61K lines puts this solidly in "serious application" territory — comparable to a small-to-medium standalone app.
