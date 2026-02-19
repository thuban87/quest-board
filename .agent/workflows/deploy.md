---
description: Build and deploy to test, staging, or production environments
---

# Deployment Workflow

## Environments & Directories

| Environment | Path | Purpose |
|-------------|------|---------|
| **Development** | `C:\Users\bwales\projects\obsidian-plugins\quest-board` | Source code, active development |
| **Test** | `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board` | Isolated testing, safe to break |
| **Staging** | `C:\Quest-Board-Staging-Vault\Staging Vault\.obsidian\plugins\quest-board` | Real files/settings, pre-production |
| **Production** | `G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board` | Brad's main vault |

## Commands

| Command | What It Does |
|---------|-------------|
| `npm run build` | Production build only (includes CSS bundling, no deploy) |
| `npm run deploy:test` | Build + copy to test vault |
| `npm run deploy:staging` | Build + copy to staging vault |
| `npm run deploy:production` | Build + copy to production vault |
| `npm run dev` | Watch mode — auto-builds on file change |

## Steps

### Deploy to Test (default deployment)

// turbo
1. **Verify tests pass before deploying.**
```powershell
npx vitest run 2>&1 | Out-File -Encoding utf8 test-output.txt
```

// turbo
2. **Check test results.**
```powershell
Get-Content test-output.txt -Tail 20
```

3. **Build and deploy to test vault.**
```powershell
npm run deploy:test
```

4. **Notify Brad.** Let Brad know the build is deployed to the test vault and ready for manual testing in Obsidian. Include a list of items to test based on work done.

### Deploy to Staging

// turbo
1. **Verify tests pass before deploying.**
```powershell
npx vitest run 2>&1 | Out-File -Encoding utf8 test-output.txt
```

// turbo
2. **Check test results.**
```powershell
Get-Content test-output.txt -Tail 20
```

3. **Build and deploy to staging vault.**
```powershell
npm run deploy:staging
```

4. **Notify Brad.** Let Brad know the build is deployed to the staging vault and ready for testing.

### Deploy to Production

> ⚠️ **NEVER deploy to production unless Brad explicitly requests it.** Brad will typically handle production deployments himself.

If Brad explicitly asks for a production deploy:

// turbo
1. **Verify tests pass.**
```powershell
npx vitest run 2>&1 | Out-File -Encoding utf8 test-output.txt
```

// turbo
2. **Check test results.**
```powershell
Get-Content test-output.txt -Tail 20
```

3. **Confirm with Brad** that he wants to proceed with production deployment. Wait for explicit approval.

4. **Deploy to production.**
```powershell
npm run deploy:production
```

5. **Notify Brad** that the production deployment is complete.

## Notes

- Character schema migrations (v1→v2→v3) happen automatically on load
- CSS is bundled from `src/styles/` via PostCSS — never edit `styles.css` directly
- **Test** vault is isolated — break things freely!
- **Staging** uses real vault files — ideal for final validation before production
