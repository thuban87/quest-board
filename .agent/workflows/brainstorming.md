---
description: Rules and standards for brainstorming sessions and creating implementation plans
---

# Brainstorming & Planning Workflow

Use this workflow when running a **brainstorming or planning session** — i.e., sessions where the output is documentation (implementation plans, design docs, decision logs) rather than code.

---

## Session Behavior

Brainstorming sessions are **research-only**. The agent should:

- ✅ Search the codebase (`rg`, `Select-String`, `view_file`, `view_file_outline`)
- ✅ Read existing docs, plans, session logs, and knowledge items
- ✅ Create/update documentation files
- ✅ Ask clarifying questions
- ✅ **Review `.agent/rules/obsidian-plugin-guidelines.md`** to ensure all planned work aligns with Obsidian's plugin guidelines
- ❌ **NOT** create, modify, or delete source code files
- ❌ **NOT** run `npm run build`, `npm run deploy:*`, or `npm run test`
- ❌ **NOT** start implementing features

> [!IMPORTANT]
> **Before finalizing any plan**, review the Obsidian plugin guidelines (`.agent/rules/obsidian-plugin-guidelines.md`). Every planned change should be checked against Obsidian's requirements — especially security (no innerHTML, no eval), API usage (requestUrl, processFrontMatter, registerEvent), CSS conventions (prefixed classes, CSS variables), and mobile compatibility.

If during brainstorming the agent discovers something that requires a code spike or proof-of-concept, it should **note the need** in the plan and defer it to an implementation session.

---

## Companion Session Log

> [!IMPORTANT]
> **When creating the first implementation plan, also create its companion session log.**

Every implementation plan gets a paired session log in `docs/development/`. The session log is created at the same time as the plan (not after implementation starts). This ensures documentation is ready from day one.

**Naming convention:**
- Plan: `docs/development/<Feature Name> Implementation Plan.md` or `docs/development/<Feature Name> Implementation Guide.md`
- Log: `docs/development/<Feature Name> Session Log.md`

The session log should use the established format from `Phase 4 Implementation Session Log.md`:
- Header with phase, start date, and related doc links
- `## Session Format` block (Date & Focus, Completed, Files Changed, Testing Notes, Blockers/Issues, Next Steps)
- Individual session entries added as work progresses

---

## Implementation Plan Structure

Every plan **must** include these sections. Omit only if genuinely not applicable.

### Required Sections

1. **Title & Metadata**
   - Plan name as H1
   - Status, estimated sessions/effort, created date, last updated date
   - Link to companion session log

2. **Table of Contents**
   - Every plan includes a table of contents, no exceptions
   - Use markdown anchor links to all major sections

3. **Overview / Problem Statement**
   - What problem this solves or what feature this adds
   - Brief background context
   - Goals and non-goals (what is explicitly out of scope)

4. **Key Design Decisions**
   - Document every significant architectural or behavioral choice
   - Include the *why* — not just what was decided, but the reasoning
   - Flag known tradeoffs and loopholes with rationale for accepting them

5. **Implementation Phases**
   - Break work into **session-sized phases** (1-2 hours each, completable in a single sitting)
   - Each phase must have:
     - Phase number and title
     - Estimated time
     - Clear goal statement ("Goal: ...")
     - Prerequisites (which prior phases must be complete)
     - Task list with specific files and changes
     - A testing section (see Testing Rule below)
   - Phases should be ordered so that dependencies come first
   - Note which phases can be parallelized vs. which are strictly sequential

6. **Plan Summary**

   A quick-glance overview of the entire project. Include:

   - A table breaking down all phases by **effort level** (small / medium / large)
   - **Execution order**, if different than phase numbering implies (e.g., Phase 5 depends on Phase 2 but not 3-4)
   - Total estimated sessions

   Example format:
   ```
   | Phase | Title                    | Effort | Depends On | Est. Time |
   |-------|--------------------------|--------|------------|-----------|
   | 1     | Foundation & Data Models | Medium | —          | 2h        |
   | 1.5   | Tests: Foundation        | Medium | Phase 1    | 1.5h      |
   | 2     | Core Service Logic       | Large  | Phase 1    | 3h        |
   | 2.5   | Tests: Core Services     | Large  | Phase 2    | 2.5h      |
   | 3     | UI Components            | Medium | Phase 2    | 2h        |
   ```

7. **Testing Phases (The 50/50 Rule)**

   > [!IMPORTANT]
   > **Every implementation phase must be paired with a testing phase of roughly equal effort.**

   For each "build X feature" phase, include a corresponding "test X feature" phase immediately after. Testing phases should specify:

   - **Test type**: unit tests, integration tests, or both (whichever is most appropriate to the feature)
   - **Coverage target**: ≥80% line coverage AND ≥80% branch coverage
   - **Test file location**: exact path where tests will live
   - **Key test cases**: bullet list of what needs to be tested
   - **Command to run**: `npx vitest run <test-file> | Out-File -FilePath test-output.txt -Encoding utf8`

   Phase numbering convention: if Phase 2 is "Build X", then Phase 2.5 is "Test X". This makes the pairing visually obvious.

   **Refactors:** Refactors still require a test phase. Even if no behavior changes, existing tests often need updating to reflect new file paths, renamed functions, restructured modules, or adjusted imports. The test phase for a refactor focuses on **updating and verifying existing tests pass** rather than writing new ones from scratch.

   **CSS-only changes:** May skip dedicated test phases since CSS is not covered by unit/integration tests. Note this explicitly in the plan.

   **Exception:** Pure documentation phases or phases that genuinely don't introduce anything capable of being tested (e.g., writing a design doc, updating README, creating templates) do not require a test partner phase. Note this explicitly in the plan.

8. **Verification Plan / Checklist**
   - Comprehensive checklist covering all testable behaviors
   - Separate sections for automated tests and manual testing
   - Manual test steps should include exact build/deploy commands
   - Use table format: `| Test | Expected | Status |`
   - Status column left empty (filled in during implementation)

9. **File Change Summary**
   - Table organized by phase
   - Mark files as `[NEW]`, `[MODIFY]`, or `[DELETE]`
   - Include the purpose of each change

### Recommended Sections (include when applicable)

10. **Architecture / Data Structures**
    - Interface definitions with TypeScript code blocks
    - ASCII diagrams for component layouts or data flow
    - Layer responsibility notes (which layer owns what)

11. **Migration Strategy**
    - How existing data transitions to the new structure
    - Edge cases and fallback behavior
    - Whether migration is automatic or manual

12. **Security & Validation**
    - Input validation rules
    - Sanitization requirements
    - Any trust boundary considerations

13. **Performance Considerations**
    - Caching strategies
    - Memoization opportunities
    - Lazy loading needs

14. **Rollback Plan**
    - How to revert if something goes wrong
    - Which files to revert
    - Whether data migration is reversible

15. **Design Decision Log**
    - Decisions explored and rejected (with reasoning)
    - Known loopholes or limitations accepted (with justification)
    - "We considered X but chose Y because Z" format

16. **Key References**
    - Table of source files, constants, existing patterns to reference
    - Links to related plans or session logs
    - External documentation or API references

17. **Session Handoff / Next Session Prompt**
    - Summary of what was accomplished
    - Clear prompt for the next session to continue work
    - Key files to reference

---

## Planning Standards

### Phase Sizing
- Each phase should be completable in **one coding session** (1-2 hours)
- If a phase feels too large, split it
- Include time estimates for both the build and test portions

### Effort Estimation
- Include estimated effort at the plan level (total sessions) AND per-phase
- After completion, record actual time for future calibration
- Format: `**Estimated Time:** 2-2.5 hours` / `**Actual Time:** ~1.5 hours (date)`

### Dependency Mapping
- Explicitly state phase dependencies: "**Prerequisite:** Phase 2 must be complete"
- Note which phases are independent and can be done in any order
- Call out cross-phase impacts (e.g., "Phase 3 generates TypeScript errors that Phase 5 resolves")

### Tech Debt Tracking
- Each phase should end with a `#### Tech Debt:` section
- Document shortcuts taken, cleanup deferred, and known limitations
- Include enough context that a future session can address each item independently

### Codebase Research
- Before designing, audit the relevant codebase sections
- Document existing patterns to follow (e.g., "Follow the exact pattern of `QuestBoardView.tsx`")
- List all files that import from or reference the affected areas (import audit)
- Note any conflicts with existing implementations

### Non-Goals
- Explicitly state what the plan does NOT cover
- Distinguish between "deferred to future" and "intentionally excluded"
- Use `> [!NOTE]` callouts for future considerations

---

## Documentation Conventions

### Formatting
- Use GitHub-style markdown with proper heading hierarchy
- Use `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`, `> [!NOTE]`, `> [!TIP]` callouts
- Code blocks with language tags for all code examples
- Tables for structured comparisons (settings, file lists, test matrices)
- ASCII art for layout mockups and component diagrams

### File Path References
- Use relative paths from project root in prose
- Use absolute paths in code examples and commands
- For tables, use basename with enough path context to be unambiguous

### Status Tracking
- Plans are living documents — update as implementation progresses
- Mark phases: ✅ COMPLETE, 🔲 TODO, ⏸️ DEFERRED
- Add actual completion dates and times next to estimates
- Notes and "what actually happened" annotations are encouraged

---

## Checklist (Before Presenting Plan to Brad)

- [ ] Obsidian plugin guidelines (`.agent/rules/obsidian-plugin-guidelines.md`) have been reviewed
- [ ] Table of contents is present and links work
- [ ] Plan summary table is present with effort levels and execution order
- [ ] Every build phase has a corresponding test phase (50/50 rule)
- [ ] Refactor phases include test update phases
- [ ] Documentation-only / non-testable phases are explicitly marked as exempt from testing
- [ ] Test phases specify coverage targets (≥80% line, ≥80% branch)
- [ ] All phases have effort estimates
- [ ] All phases have prerequisite dependencies noted
- [ ] File change summary covers all new, modified, and deleted files
- [ ] Verification checklist covers manual AND automated testing
- [ ] Design decisions include reasoning (not just "what")
- [ ] Non-goals are stated
- [ ] Companion session log has been created
