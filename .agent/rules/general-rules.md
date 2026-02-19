---
trigger: always_on
---

# Quest Board — Workspace Rules

**Version:** 1.0.0 | **Updated:** 2026-02-18

## Project Context

**Developer:** Brad Wales (ADHD, visual learner, prefers vibe coding)
**Purpose:** Gamified Task Management plugin for Obsidian — Kanban quest board with RPG progression, combat, gear, and dungeons
**Tech Stack:** TypeScript, React 18, Zustand, Obsidian API, esbuild, PostCSS, Vitest
**Release:** Personal use via BRAT (potential public release later)

**Environments:**
- **Dev:** `C:\Users\bwales\projects\obsidian-plugins\quest-board`
- **Test:** `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board`
- **Staging:** `C:\Quest-Board-Staging-Vault\Staging Vault\.obsidian\plugins\quest-board`
- **Production:** `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board`

---

## Git Workflow (CRITICAL)

**Brad handles ALL git commands.** AI assistants should:
- ✅ Read: `git status`, `git log`, `git diff`
- ❌ **NEVER run:** `git add`, `git commit`, `git push`, `git pull`, `git merge`, `git rebase`
- ✅ Provide commit messages at session wrap-up for Brad to copy/paste

---

## Known Tooling Issues (CRITICAL)

The `grep_search` tool can be **unreliable** — it sometimes silently returns zero results for valid queries.

**Use these instead:**
- ✅ `rg "term" src --line-number` via `run_command`
- ✅ `Select-String -Path "src\**\*.ts" -Pattern "term"` via `run_command`
- ✅ `view_file`, `view_file_outline`, `find_by_name`, `view_code_item` — all work fine

**PowerShell constraint:** Do not use `&&` to chain commands — PowerShell will throw an error. Use semicolons or separate calls.

---

## Development Session Workflow

1. **Review & Discuss** — Clarify requirements, check Feature Roadmap v2
2. **Do the Work** — Write code in dev environment only
3. **Build** — `npm run build` (includes CSS bundling), fix errors, repeat until clean
4. **Deploy** — `npm run deploy:test` to test vault
5. **Wait for Confirmation** — Brad tests in Obsidian
6. **Wrap Up** — Update session docs indicated by user, provide commit message

### Workflow Gates (HARD STOPS)
- After `npm run build` passes, IMMEDIATELY run `npm run deploy:test`. Do not ask — just do it.
- After deploying to test, STOP and notify the user to test in Obsidian. Do NOT proceed to the next phase, write tests, or do any further code work until the user confirms it works.
- Test phases are a SEPARATE task from their parent phase. Never start writing tests until the user has explicitly confirmed the feature works in Obsidian.

### The "Brad Protocol"
- **Micro-Steps:** Break complex tasks into atomic steps
- **Explain Why:** Briefly justify architectural choices
- **Celebrate:** Acknowledge when a feature works

### Session Handoff Protocol
At the end of each session:
1. Perform and confirm testing **before** updating any documentation
2. Update the documents indicated by the user
3. Suggest a `git commit` message
4. Leave a "Next Session Prompt" in the session log
5. Note any bugs or issues discovered

---

## Architecture

### Layer Responsibilities

| Layer | Should | Should NOT |
|-------|--------|------------|
| **main.ts** | Register commands, initialize services, lifecycle | Contain business logic |
| **Components** | Render UI, handle user events, call hooks/services | File I/O, manage global state |
| **Services** | Business logic, file I/O, state coordination | Render UI, manipulate DOM |
| **Hooks** | Encapsulate reusable React logic, compose services | Be too component-specific |
| **Stores** | Zustand state management, React rendering cache | Be source of truth (quest files are) |
| **Utils** | Pure functions, data transformations | Manage state, context assumptions |
| **Models** | Define interfaces, constants, types | Import from other project files |

### Architecture Strengths (Preserve These!)
- **Quest files are source of truth** — Zustand store is a cache for React rendering
- **ColumnConfigService** is the single authority for column logic — no hardcoded status checks
- **PostCSS modular CSS** — All styles in `src/styles/`, bundled at build time
- **Separation of concerns** — Models, Services, Components, Hooks, Utils, Stores

---

## NPM Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build (includes CSS bundling) |
| `npm run deploy:test` | Build + deploy to test vault |
| `npm run deploy:staging` | Build + deploy to staging vault |
| `npm run deploy:production` | Build + deploy to production vault |
| `npm run dev` | Watch mode — auto-builds on file change |
| `npm run css:build` | Build CSS once |
| `npm run css:watch` | Watch CSS for changes |
| `npm run test` | Run test suite (Vitest, 168 tests) |

---

## CSS Modules

> ⚠️ **Never edit `styles.css` directly** — it's auto-generated from PostCSS!

All styles live in `src/styles/` and are bundled at build time.

| Task | Module |
|------|--------|
| Modal styles, forms | `modals.css` |
| Combat, battle view | `combat.css` |
| Dungeon exploration | `dungeons.css` |
| Inventory, tooltips | `inventory.css` |
| Character sheet | `character.css` |
| Template system | `scrivener.css` |
| Progress dashboard | `progress.css` |
| Mobile-specific | `mobile.css` |
| Kanban board | `kanban.css` |
| Power-ups, achievements | `power-ups.css` |
| Animations | `animations.css` |
| CSS variables | `variables.css` |

---

## UI Design Rules

- When designing modals and settings options, make any field that references a folder/file be **auto-complete** for that subject for easy navigation.

---

## Common Pitfalls

### Don't:
- ❌ Put business logic in `main.ts` — keep it as orchestration only
- ❌ Hardcode column statuses — use `ColumnConfigService`
- ❌ Use synchronous file I/O — always `await` vault operations
- ❌ Run git commands (see Git Workflow section)
- ❌ Skip testing before session wrap-up
- ❌ Edit `styles.css` directly — edit files in `src/styles/`
- ❌ Use `&&` in PowerShell commands
- ❌ Start writing tests before the user has manually verified the feature in Obsidian
- ❌ Pipe build output to files — only `npx vitest run` needs `Out-File` per the `/test` workflow

### Do:
- ✅ Keep files under 300 lines where possible
- ✅ Use TypeScript strict mode
- ✅ JSDoc all public methods
- ✅ Test in dev before confirming done
- ✅ Follow session handoff protocol
- ✅ Use `ColumnConfigService` for all column/status logic
- ✅ Prefix all CSS classes with `quest-board-`
- ✅ Use React functional components + hooks (no class components)
- ✅ Handle missing data gracefully (defaults, not crashes)
- ✅ Use `normalizePath()` for vault paths

---

## Testing Values to Verify Before Production

| Setting | Test Value | Production | Location |
|---------|-----------|------------|----------|
| Daily Stamina Cap | 500 | 50 | `CombatService.ts` → `awardStamina()` |
| Bounty Slider Max | 100% | 20% | `settings.ts` → slider limits |
| Set Piece Drop Rate | 40% | 33% | `LootGenerationService.ts` |

---

## Checklist Before Coding
- [ ] Have we checked `docs/development/Feature Roadmap v2.md` for current priorities?
- [ ] Is the user on the correct git branch?
- [ ] Do we understand the specific requirement?
- [ ] Have we reviewed relevant source files before making changes?

---

## Key Documentation

- `docs/development/Feature Roadmap v2.md` — Current phase/priority tracking
- `docs/development/Phase 4 Implementation Session Log.md` — Active development log
- `docs/archive/Kanban Implementation Session Log.md` — Custom columns implementation
- `docs/archive/Settings Redesign Session Log.md` — Settings panel redesign

---

## Workflows (MUST READ before executing)

Workflow files live in `.agent/workflows/`. When the user requests any of the activities below, **you MUST read the workflow file FIRST before taking any action.**

| Trigger | Workflow File | Description |
|---------|--------------|-------------|
| Session wrap-up, end of session, wrap up | `.agent/workflows/session-wrap-up.md` | End-of-session documentation updates and commit message |
| Deploy, deployment, deploy to test/staging/production | `.agent/workflows/deploy.md` | Build and deploy to test, staging, or production environments |
| Search, find in codebase, grep | `.agent/workflows/search.md` | Search the codebase using ripgrep or Select-String |
| Test, run tests, test suite | `.agent/workflows/test.md` | Run the test suite and capture output for reliable reading |
