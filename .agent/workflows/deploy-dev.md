---
description: Deploy to development vault for testing Phase 3 features
---

# Deploy to Dev Vault

Use this workflow when testing Phase 3 features (Gear, Combat, Exploration).

## Prerequisites

- Dev vault exists at `C:\Quest-Board-Test-Vault\`
- The vault has `.obsidian\plugins\quest-board\` folder

## Steps

// turbo
1. Build the project:
```bash
npm run build
```

2. If build succeeds, deploy to dev vault:
```bash
npm run deploy:test
```

3. Open the dev vault in Obsidian and test your changes

4. If changes work, get Brad's approval before deploying to main vault

5. Deploy to main vault (ONLY after approval):
```bash
npm run deploy:production
```

## Notes

- **NEVER deploy to main vault** during Phase 3 development without Brad's explicit approval
- The dev vault is isolated from Brad's real data
- Break things freely in the dev vault - that's what it's for!
