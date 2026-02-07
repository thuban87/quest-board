# Template System Overhaul

> **Status:** In Progress (Session 1 complete, Session 2 next)  
> **Created:** 2026-02-06  
> **Scope:** Fix bugs and redesign the Scrivener's Desk template system

---

## Overview

The template system ("Scrivener's Desk") has several UX issues. This overhaul is split into 3 sessions, ordered by priority and dependency.

**What we're keeping:** The Scroll Library modal design (gallery view).  
**What's broken:** Template type persistence, unclear template descriptions, barebones "Use Template" flow, and incomplete "Draft New Scroll" editor.

---

## Session 1: Template Type Persistence Bug ✅

**Problem:** Daily note and watched folder templates saved as `side` quest type. When reopened for editing, daily/watcher fields were missing.

**Root cause:** Three bugs found and fixed:
1. **Constructor field loading** — `ScrivenersQuillModal` constructor didn't load `watchFolder`, `namingMode`, `archiveMode`, etc. from `ParsedTemplate` when editing
2. **Frontmatter not updated on save** — `saveTemplate()` skipped frontmatter injection when body already had `---`, so edited templates kept original `questType: side` unchanged. Fixed to always strip old frontmatter and rebuild from form state
3. **Regex truncation** — `TemplateService.extractFrontmatter()` used `\w+` which doesn't match hyphens, so `daily-quest` → `daily`. Changed to `\S+`

**Files changed:** `ScrivenersQuillModal.ts`, `TemplateService.ts`

---

## Session 2: Template Taglines + Use Template Modal *(Next)*

### Part A: Template Taglines (Issue D)

**Problem:** RPG-themed template names (e.g., "Forge Enhancement", "Mind Fortress") are unclear. Users can't tell what a template actually does without creating one.

**Work required:**
1. Review all 14+ templates in `G:\My Drive\IT\Obsidian Vault\My Notebooks\System\Templates\Quest Board`
2. Add a `description` or `tagline` frontmatter field to each template
3. Update `ParsedTemplate` model in `TemplateService.ts` to parse the new field
4. Display tagline in `ScrollLibraryModal.renderTemplateCard()` (subtle, below the RPG name)
5. Display tagline in `DynamicTemplateModal.onOpen()` header area

**Taglines need Brad's review** before being added to templates.

### Part B: Use Template Modal Overhaul (Issue C)

**Problem:** `DynamicTemplateModal` (231 lines) is nearly empty for most templates — just name, category, and "Create Quest" with no info or options.

**Proposed approach:** Richer confirmation modal (not full editor redirect). Should display:
- Template tagline/description
- Template category and quest type
- All available placeholder fields with hints
- Preview of what the quest file will contain (or at minimum, a summary of tasks)
- "Create Quest" button

**Key file:** `src/modals/SmartTemplateModal.ts` — `DynamicTemplateModal` class

**Design decision for Brad:** Should "Use Template" be a streamlined one-modal creation, or should it redirect to the Draft Scroll editor prefilled? Recommendation: streamlined single modal.

---

## Session 3: Draft New Scroll Redesign *(Last)*

**Problem:** The "Draft New Scroll" (`ScrivenersQuillModal`) editor is missing fields, and its side-by-side preview doesn't actually preview anything useful.

**Proposed changes:**
1. **Remove the side-by-side preview pane** — it's wasting space and not functional
2. **Make the editor full-width** with all available options:
   - All current fields plus any missing ones discovered in Session 1
   - Better organization of sections (basic info, tasks, recurrence, folder watching, archive settings)
3. **After saving, redirect to the quest file in Obsidian editing mode** (not source mode) so it looks formatted but is still editable
4. **"Edit Scroll" should use the same improved modal** — this should already work after Session 1's type persistence fix

**Key file:** `src/modals/ScrivenersQuillModal.ts` (780 lines) — This is the biggest rewrite.

**Dependencies:** Session 1 (type persistence fix) must be done first so the editor loads correctly. Session 2 (taglines) should be done so the description field is available in the editor.

**Open questions for that session:**
- What specific fields are missing from the editor? (Need to catalog during investigation)
- Is the Obsidian editing mode redirect feasible via API? (`app.workspace.openLinkText` + a mode switch call)

---

## Also Fixed This Session (Pre-Overhaul)

- ✅ **Quest card file button bug** — Clicking 📄 on quest cards created new files instead of opening existing ones. Fixed path construction in `QuestCard.tsx` and filename alignment in `FolderWatchService.ts`.
