# Git Branching Workflow Guide

A comprehensive reference for managing development, staging, and production environments using Git branching strategies.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Branch Structure](#branch-structure)
3. [The Standard Workflow](#the-standard-workflow)
4. [Merging: CLI vs Pull Requests](#merging-cli-vs-pull-requests)
5. [Release Process](#release-process)
6. [Common Scenarios](#common-scenarios)
7. [Edge Cases & Troubleshooting](#edge-cases--troubleshooting)
8. [Quick Reference Commands](#quick-reference-commands)
9. [Git Worktrees (Advanced)](#git-worktrees-advanced)


---

## Core Concepts

### Why Use Branching?

Branching solves critical problems in software development:

| Problem | Solution |
|---------|----------|
| "I need to fix a bug in production but I'm mid-feature" | Hotfix branches from `main` |
| "My feature broke something, but production must stay stable" | Feature branches isolate risky work |
| "I want to test integration before deploying" | Staging branch for integration testing |
| "Multiple developers working on different features" | Each feature gets its own branch |

### The Golden Rules

1. **`main` is sacred** — It always represents production-ready, deployable code
2. **Never commit directly to `main`** — All changes flow through staging
3. **Feature branches are disposable** — Delete them after merging
4. **Staging is your testing ground** — Catch integration issues before they hit production

---

## Branch Structure

### Branch Types

| Branch | Lifespan | Purpose | Deploys To |
|--------|----------|---------|------------|
| `main` | Permanent | Production-ready code | Production environment |
| `staging` | Permanent | Integration testing, pre-release validation | Staging environment |
| `feature/*` | Temporary | New feature development | Development/test environment |
| `fix/*` | Temporary | Bug fixes (non-urgent) | Development/test environment |
| `hotfix/*` | Temporary | Urgent production fixes | Main + Staging |

### Visual Branch Hierarchy

```
main (production)
  │
  ├── staging (integration/testing)
  │     │
  │     ├── feature/user-auth
  │     ├── feature/dashboard-redesign
  │     ├── fix/login-validation
  │     └── ... (other feature/fix branches)
  │
  └── hotfix/critical-security-fix (branches directly from main)
```

### Branch Naming Conventions

```
feature/short-description    → New functionality
fix/issue-description        → Non-urgent bug fixes
hotfix/critical-issue        → Urgent production fixes
refactor/component-name      → Code restructuring
docs/topic                   → Documentation updates
```

Examples:
- `feature/user-authentication`
- `fix/inventory-save-bug`
- `hotfix/xss-vulnerability`
- `refactor/quest-service`

---

## The Standard Workflow

### Starting a New Feature

```powershell
# 1. Make sure staging is up to date
git checkout staging
git pull origin staging

# 2. Create feature branch from staging
git checkout -b feature/my-new-feature

# 3. Do your work, commit frequently
git add .
git commit -m "feat: add initial component structure"

# ... more work ...

git add .
git commit -m "feat: implement core logic"

# 4. Push branch to remote (optional, for backup/collaboration)
git push -u origin feature/my-new-feature
```

### Testing in Development Environment

```powershell
# While on your feature branch
npm run build
npm run deploy:test    # Deploy to test/dev environment

# Test, find issues, fix them, repeat
git add .
git commit -m "fix: resolve edge case in validation"
npm run build
npm run deploy:test
```

### Merging to Staging

Choose **ONE** of these methods:

#### Method A: CLI Merge (Fast, Solo Development)

```powershell
# 1. Switch to staging
git checkout staging

# 2. Merge your feature
git merge feature/my-new-feature

# 3. Push to remote
git push origin staging

# 4. Deploy to staging environment
npm run build
npm run deploy:staging
```

#### Method B: Pull Request (Team Standard)

```powershell
# 1. Push your feature branch
git push origin feature/my-new-feature

# 2. On GitHub:
#    - Go to repository → Pull Requests → New Pull Request
#    - Base: staging ← Compare: feature/my-new-feature
#    - Add title and description
#    - Request reviews (if applicable)
#    - Create Pull Request

# 3. After PR is approved/reviewed, click "Merge Pull Request" on GitHub

# 4. Locally, update your staging branch
git checkout staging
git pull origin staging

# 5. Deploy to staging
npm run build
npm run deploy:staging
```

### Staging Tests Pass → Merge to Production

#### Method A: CLI Merge

```powershell
git checkout main
git merge staging
git push origin main
```

#### Method B: Pull Request

```powershell
# On GitHub:
# - New Pull Request
# - Base: main ← Compare: staging
# - Create and merge PR

# Locally:
git checkout main
git pull origin main
```

### Cleanup: Delete Feature Branch

```powershell
# Delete local branch
git branch -d feature/my-new-feature

# Delete remote branch (if pushed)
git push origin --delete feature/my-new-feature
```

---

## Merging: CLI vs Pull Requests

### Comparison

| Aspect | CLI Merge | Pull Request |
|--------|-----------|--------------|
| **Speed** | Faster (no UI) | Slower (requires GitHub UI) |
| **Code Review** | None | Built-in review system |
| **Discussion** | None | Comment threads on changes |
| **Audit Trail** | Just commit history | Full PR history with context |
| **CI/CD Integration** | Manual | Automated checks can block merge |
| **Conflict Resolution** | Local (in editor) | Can do in GitHub UI (limited) |
| **Best For** | Solo developers, fast iteration | Teams, code review requirements |

### Industry Standard

> **Pull Requests are the standard approach in professional team development.**
> 
> They provide:
> - **Code review**: Other developers can catch bugs and suggest improvements
> - **Knowledge sharing**: Team members learn from each other's code
> - **Documentation**: PR descriptions explain *why* changes were made
> - **Quality gates**: CI/CD can run tests before merge is allowed
> - **Accountability**: Clear record of who approved what

### Recommendation for Learning

1. **Start with CLI merges** to understand the mechanics of branching and merging
2. **Transition to Pull Requests** once comfortable, to gain real-world experience
3. **Use PRs exclusively** when collaborating with others or on public projects

---

## Release Process

### Understanding Build Artifacts

Most projects have **source code** (what you write) and **build artifacts** (what gets deployed):

```
Source Code (in Git)          Build Artifacts (NOT in Git)
├── src/                      ├── main.js (generated)
├── package.json              ├── styles.css (possibly generated)
├── manifest.json             └── ... (other compiled files)
└── tsconfig.json
```

Build artifacts are typically in `.gitignore` because:
- They're generated, not authored
- They cause merge conflicts
- They bloat the repository

### Release Workflow (Manual)

```powershell
# 1. Ensure main is ready
git checkout main
git pull origin main

# 2. Update version in manifest.json (or package.json)
# Edit: "version": "1.6.0"

# 3. Commit the version bump
git add manifest.json
git commit -m "chore: bump version to 1.6.0"
git push origin main

# 4. Create a git tag
git tag v1.6.0
git push origin v1.6.0

# 5. Build the project
npm run build

# 6. Create GitHub Release
#    - Go to GitHub → Releases → "Create new release"
#    - Choose tag: v1.6.0
#    - Title: "v1.6.0 - Feature Description"
#    - Write release notes
#    - ATTACH FILES: main.js, manifest.json, styles.css (or whatever your project needs)
#    - Click "Publish release"
```

### Release Workflow (Automated with GitHub Actions)

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - '*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: npm install
          
      - name: Build
        run: npm run build
          
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            main.js
            manifest.json
            styles.css
```

With this automation, the release process becomes:

```powershell
# 1. Update version, commit, push
# 2. Create and push tag
git tag v1.6.0
git push origin v1.6.0

# GitHub Actions automatically:
# - Builds the project
# - Creates a release
# - Attaches the build files
```

### Version Numbering (Semantic Versioning)

```
v1.6.0
 │ │ │
 │ │ └── PATCH: Bug fixes, no new features
 │ └──── MINOR: New features, backwards compatible
 └────── MAJOR: Breaking changes
```

Examples:
- `v1.5.0` → `v1.5.1`: Fixed a bug
- `v1.5.1` → `v1.6.0`: Added new feature
- `v1.6.0` → `v2.0.0`: Changed API in breaking way

---

## Common Scenarios

### Scenario 1: Hotfix During Feature Development

**Situation**: You're deep in `feature/big-project` when a critical bug is discovered in production.

**Solution**:

```powershell
# 1. Save your current work
git add .
git commit -m "WIP: feature progress"

# 2. Create hotfix branch FROM MAIN (not staging!)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 3. Fix the bug
# ... make fixes ...
git add .
git commit -m "fix: resolve critical payment bug"

# 4. Merge hotfix to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# 5. Create release for the fix
git tag v1.5.1
git push origin v1.5.1
# ... create GitHub release ...

# 6. ALSO merge hotfix to staging (so it's not lost)
git checkout staging
git merge hotfix/critical-bug
git push origin staging

# 7. Delete hotfix branch
git branch -d hotfix/critical-bug

# 8. Return to your feature work
git checkout feature/big-project

# 9. Update feature branch with the fix
git merge staging
```

**Why hotfix from main?** The bug exists in production (main). Branching from staging might include untested features you don't want to deploy yet.

---

### Scenario 2: Feature Breaks in Staging

**Situation**: Feature works in dev, but breaks after merging to staging.

**Solution** (Fix Forward):

```powershell
# 1. Stay on your feature branch
git checkout feature/my-feature

# 2. Fix the issues
# ... make fixes ...
git add .
git commit -m "fix: resolve staging integration issues"

# 3. Test locally again
npm run build
npm run deploy:test

# 4. Merge to staging AGAIN
git checkout staging
git merge feature/my-feature
git push origin staging

# 5. Redeploy to staging
npm run build
npm run deploy:staging

# 6. Repeat until staging works
```

**Key insight**: You can merge a feature branch to staging multiple times. Each merge brings in your latest fixes.

---

### Scenario 3: Need to Ship Different Feature First

**Situation**: Working on `feature/A`, but `feature/B` needs to ship first.

**Solution**:

```powershell
# 1. Save feature/A progress
git add .
git commit -m "WIP: feature A progress"

# 2. Create feature/B from staging
git checkout staging
git checkout -b feature/B

# 3. Complete feature/B work
# ... work, test, etc ...
git add .
git commit -m "feat: implement feature B"

# 4. Merge B to staging, test
git checkout staging
git merge feature/B
npm run build
npm run deploy:staging

# 5. Staging passes, merge to main
git checkout main
git merge staging
git push origin main
# ... create release ...

# 6. Delete feature/B branch
git branch -d feature/B

# 7. Return to feature/A
git checkout feature/A

# 8. Update feature/A with latest staging (includes B)
git merge staging

# 9. Continue feature/A work
```

---

### Scenario 4: Merge Conflict

**Situation**: Git says there's a conflict when merging.

**Solution**:

```powershell
# 1. Git will tell you which files have conflicts
git merge staging
# Auto-merging src/component.ts
# CONFLICT (content): Merge conflict in src/component.ts

# 2. Open the conflicted file(s)
# You'll see conflict markers:
<<<<<<< HEAD
    // Your changes (current branch)
    const value = "feature version";
=======
    // Their changes (incoming branch)
    const value = "staging version";
>>>>>>> staging

# 3. Edit the file to resolve (pick one, combine, or rewrite)
    const value = "merged version";

# 4. Mark as resolved
git add src/component.ts

# 5. Complete the merge
git commit -m "merge: resolve conflict in component.ts"
```

---

### Scenario 5: Accidentally Committed to Wrong Branch

**Situation**: Made commits on `main` instead of a feature branch.

**Solution**:

```powershell
# 1. Create a new branch with your commits (before doing anything else!)
git checkout -b feature/my-work

# 2. Go back to main
git checkout main

# 3. Reset main to before your commits
git reset --hard origin/main

# 4. Your work is safe on feature/my-work
git checkout feature/my-work
# Continue working normally
```

---

## Edge Cases & Troubleshooting

### "I have uncommitted changes and need to switch branches"

```powershell
# Option 1: Commit them (even as WIP)
git add .
git commit -m "WIP: save progress"
git checkout other-branch

# Option 2: Stash them (temporary storage)
git stash
git checkout other-branch
# ... do work ...
git checkout original-branch
git stash pop    # Restores your changes
```

### "I want to undo my last commit"

```powershell
# Undo commit but KEEP changes (staged)
git reset --soft HEAD~1

# Undo commit and UNSTAGE changes
git reset HEAD~1

# Undo commit and DISCARD changes (dangerous!)
git reset --hard HEAD~1
```

### "I need to update staging with main (reverse sync)"

Sometimes main gets ahead of staging (via hotfixes). Sync them:

```powershell
git checkout staging
git merge main
git push origin staging
```

### "My feature branch is way behind staging"

```powershell
git checkout feature/my-feature
git merge staging
# Resolve any conflicts
git push origin feature/my-feature
```

### "I want to see what's different between branches"

```powershell
# See commits in staging not in main
git log main..staging --oneline

# See file differences
git diff main..staging

# See which files changed
git diff main..staging --stat
```

### "I merged something I shouldn't have"

```powershell
# If not pushed yet - reset
git reset --hard HEAD~1

# If already pushed - revert (creates undo commit)
git revert <merge-commit-hash>
git push origin branch-name
```

---

## Quick Reference Commands

### Daily Workflow

| Action | Command |
|--------|---------|
| Start new feature | `git checkout staging && git checkout -b feature/xyz` |
| Save work | `git add . && git commit -m "message"` |
| Switch branches | `git checkout branch-name` |
| Update current branch | `git pull origin branch-name` |
| Push changes | `git push origin branch-name` |

### Merging

| Action | Command |
|--------|---------|
| Merge feature to staging | `git checkout staging && git merge feature/xyz` |
| Merge staging to main | `git checkout main && git merge staging` |
| Update feature with staging | `git checkout feature/xyz && git merge staging` |

### Branch Management

| Action | Command |
|--------|---------|
| List all branches | `git branch -a` |
| Delete local branch | `git branch -d branch-name` |
| Delete remote branch | `git push origin --delete branch-name` |
| Rename current branch | `git branch -m new-name` |

### Releases

| Action | Command |
|--------|---------|
| Create tag | `git tag v1.0.0` |
| Push tag | `git push origin v1.0.0` |
| Push all tags | `git push origin --tags` |
| List tags | `git tag -l` |

### Inspection

| Action | Command |
|--------|---------|
| View status | `git status` |
| View commit history | `git log --oneline -10` |
| View branches with last commit | `git branch -v` |
| View remote tracking | `git remote -v` |

---

## Git Worktrees (Advanced)

Git worktrees allow you to have multiple branches checked out simultaneously in different directories, all sharing the same repository history. This eliminates the need to stash, commit WIP, or lose context when switching branches.

### What Problem Do Worktrees Solve?

| Standard Branching Pain Point | Worktree Solution |
|-------------------------------|-------------------|
| Must stash/commit to switch branches | Just `cd` to another directory |
| IDE reconfigures on branch switch | Each worktree has its own IDE state |
| Can't run two versions simultaneously | Each worktree runs independently |
| Build cache invalidated on switch | Each worktree has independent build state |
| Context switching is disruptive | Work stays exactly where you left it |

### Directory Structure Patterns

#### Pattern A: Sibling Directories (Simple)

```
obsidian-plugins/
├── my-plugin/              ← main branch
├── my-plugin-staging/      ← staging branch
└── my-plugin-feature/      ← feature branch
```

**Setup:**
```powershell
cd C:\projects\obsidian-plugins\my-plugin
git worktree add ../my-plugin-staging staging
git worktree add ../my-plugin-feature feature/new-feature
```

**Pros:** Simple to set up from existing repo
**Cons:** Clutters parent directory with multiple folders

---

#### Pattern B: Nested Directories (Recommended)

A cleaner structure using a bare repository as the parent:

```
obsidian-plugins/
└── switchboard/            ← Parent folder (bare repo lives here)
    ├── .bare/              ← The actual git repository (bare)
    ├── main/               ← main branch worktree
    ├── staging/            ← staging branch worktree
    ├── feature-auth/       ← feature branch worktree
    └── feature-ui/         ← another feature branch
```

**Pros:** 
- All worktrees contained in one project folder
- Open IDE at parent level, `cd` into any branch
- Cleaner organization
- Easy to see all active branches at a glance

**Cons:**
- Initial setup is more involved
- Requires converting to bare repository pattern

---

### Setting Up Nested Worktrees (Recommended Pattern)

This is a one-time setup to convert an existing project to the nested worktree pattern.

#### Step 1: Backup and Clone as Bare

```powershell
# Start in your plugins directory
cd C:\Users\bwales\projects\obsidian-plugins

# Rename existing repo temporarily
Rename-Item switchboard switchboard-old

# Create new parent directory
New-Item -ItemType Directory -Name switchboard
cd switchboard

# Clone as bare repository into .bare folder
git clone --bare https://github.com/yourusername/switchboard.git .bare

# Tell git where the bare repo is
echo "gitdir: ./.bare" > .git
```

#### Step 2: Configure the Bare Repository

```powershell
# Configure to fetch all branches
cd .bare
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch origin
cd ..
```

#### Step 3: Create Worktrees for Each Branch

```powershell
# Create worktree for main branch
git worktree add main main

# Create worktree for staging branch
# (creates the branch if it doesn't exist)
git worktree add staging staging
# OR if staging doesn't exist yet:
git worktree add staging -b staging main

# Create worktree for a feature branch
git worktree add feature-auth -b feature/auth staging
```

#### Step 4: Copy node_modules (Optional Optimization)

Each worktree needs its own `node_modules`. You can either:

```powershell
# Option A: Install fresh in each worktree
cd main
npm install
cd ../staging
npm install

# Option B: Copy from old project (faster)
Copy-Item -Recurse ..\switchboard-old\node_modules .\main\
Copy-Item -Recurse ..\switchboard-old\node_modules .\staging\
```

#### Step 5: Clean Up

```powershell
# Once everything works, delete the old repo
Remove-Item -Recurse -Force ..\switchboard-old
```

---

### Worktree Commands Reference

| Command | What It Does |
|---------|--------------|
| `git worktree add <path> <branch>` | Create worktree for existing branch |
| `git worktree add <path> -b <new-branch> <base>` | Create worktree with new branch |
| `git worktree list` | List all worktrees |
| `git worktree remove <path>` | Remove a worktree |
| `git worktree prune` | Clean up stale worktree references |
| `git worktree move <old-path> <new-path>` | Move a worktree |

### Daily Workflow with Nested Worktrees

#### Starting Your Day

```powershell
# Open IDE at project root
cd C:\Users\bwales\projects\obsidian-plugins\switchboard
code .    # Opens VS Code, can see all worktrees

# Work on a specific branch
cd main
npm run build
```

#### Switching Context (No Stashing Required!)

```powershell
# Currently in feature-auth with uncommitted changes
# Need to check something in staging
cd ../staging
# Your feature-auth changes are still there, untouched!

# Done checking, go back
cd ../feature-auth
# Continue exactly where you left off
```

#### Creating a New Feature

```powershell
# From project root
cd C:\Users\bwales\projects\obsidian-plugins\switchboard

# Create new feature worktree
git worktree add feature-dashboard -b feature/dashboard staging

# Work in it
cd feature-dashboard
npm install
npm run dev
```

#### Merging Feature to Staging

```powershell
# Go to staging worktree
cd ../staging

# Merge the feature
git merge feature/dashboard

# Test
npm run build
npm run deploy:staging

# If staging tests pass, merge to main
cd ../main
git merge staging
git push origin main
```

#### Cleaning Up Completed Feature

```powershell
# From project root
cd C:\Users\bwales\projects\obsidian-plugins\switchboard

# Remove the worktree
git worktree remove feature-dashboard

# Delete the branch
git branch -d feature/dashboard
```

---

### Worktree Scenarios

#### Scenario 1: Hotfix While Mid-Feature

```powershell
# You're in feature-auth with half-done work
# Critical bug reported in production!

# No stashing needed - just go to main
cd ../main

# Create hotfix from main
git checkout -b hotfix/critical-bug

# Fix the bug
# ... edit files ...
git add .
git commit -m "fix: critical bug"

# Merge to main
git checkout main
git merge hotfix/critical-bug
git push origin main

# Also merge to staging
cd ../staging
git merge main

# Return to feature work - everything is exactly as you left it
cd ../feature-auth
```

#### Scenario 2: Compare Two Implementations

```powershell
# Run both versions simultaneously
# Terminal 1:
cd switchboard/main
npm run dev -- --port 3000

# Terminal 2:
cd switchboard/feature-auth
npm run dev -- --port 3001

# Open browser to localhost:3000 AND localhost:3001
# Compare behavior side by side!
```

#### Scenario 3: Review a PR Locally

```powershell
# Someone submitted PR from branch "feature/user-profile"
# Create temporary worktree to review it

cd C:\Users\bwales\projects\obsidian-plugins\switchboard
git fetch origin
git worktree add pr-review origin/feature/user-profile

# Review the code
cd pr-review
npm install
npm run dev

# Done reviewing - clean up
cd ..
git worktree remove pr-review
```

---

### Worktrees vs Standard Branching: Comparison

| Aspect | Standard Branching | Worktrees |
|--------|-------------------|-----------|
| **Directories** | 1 | Multiple (one per branch) |
| **Switching branches** | `git checkout` (requires clean state) | Just `cd` to another folder |
| **Uncommitted work** | Must stash or commit | Stays in its worktree |
| **IDE state** | Reconfigures on switch | Each worktree has own state |
| **Disk space** | Minimal | More (full working copy each) |
| **node_modules** | One copy | One per worktree |
| **Build cache** | Invalidated on switch | Independent per worktree |
| **Mental model** | Simpler | More to track |
| **Setup complexity** | None | Initial setup required |

### When to Use Each

#### Use Standard Branching When:
- Working on one feature at a time (focused workflow)
- Disk space is limited
- Comfortable with stashing
- Prefer simpler mental model
- Rarely need to compare branches

#### Use Worktrees When:
- Frequently switching between branches
- Need to run multiple versions simultaneously
- Want to keep IDE state per branch
- Hate stashing and context switching
- Do lots of comparing between branches
- Large projects with long build times

---

### Resume & Job Relevance

| Skill | Job Relevance |
|-------|--------------|
| **Standard branching + PRs** | ⭐⭐⭐⭐⭐ Essential - every team uses this |
| **Worktrees** | ⭐⭐⭐ Nice to have - shows Git depth |

**Interview note:** Worktrees rarely come up in interviews, but mentioning them shows you're not a surface-level Git user. Focus on mastering standard branching and PRs first — that's what you'll be tested on and use daily.

---

## Appendix: Environment Setup

### Recommended `.gitignore` for Build Artifacts

```gitignore
# Build outputs
main.js
*.js.map

# Dependencies
node_modules/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### Deploy Scripts (package.json)

```json
{
  "scripts": {
    "build": "your-build-command",
    "deploy:test": "copy-to-test-environment",
    "deploy:staging": "copy-to-staging-environment",
    "deploy:production": "copy-to-production-environment"
  }
}
```

---

*Last Updated: 2026-02-02*
