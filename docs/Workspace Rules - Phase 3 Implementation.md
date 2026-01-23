# Workspace Rules - Phase 3 Implementation

> **Purpose:** Agent guidelines for implementing Phase 3 RPG features  
> **Applies To:** Gear & Loot, Fight System, Exploration  
> **Updated:** 2026-01-23

---

## ⚠️ CRITICAL: Read First

1. **Read session log:** `docs/Phase 3 Implementation Session Log.md`
2. **Read checklist:** `docs/rpg-dev-aspects/Phase 3 Implementation Checklist.md`  
3. **NEVER deploy to main vault** until Brad explicitly approves
4. **Use dev vault** for all testing

---

## Development Workflow

### Deploy Commands

| Command | Target | When to Use |
|---------|--------|-------------|
| `npm run build` | Check for errors | Always first |
| `npm run deploy:test` | Dev vault | All development work |
| `npm run deploy:production` | Production vault | ONLY after Brad approves |

### Dev Vault Location

```
C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board
```

### Workflow Steps

1. **Build** - `npm run build` (check for errors)
2. **Fix** - Address any TypeScript/build errors
3. **Deploy to Dev** - `npm run deploy:test`
4. **Brad Tests** - Wait for Brad to test in dev vault
5. **Iterate** - Repeat 1-4 until feature complete
6. **Brad Approves** - Only then:
7. **Deploy to Production** - `npm run deploy:production`

### ⚠️ Deploy Safety Measures

> [!CAUTION]
> **Production deploys overwrite Brad's real data!**
> Multiple safeguards are in place to prevent accidents.

**Safeguard 1: Naming Convention**
- `deploy:test` = dev vault (safe)
- `deploy:production` = real vault (dangerous)
- No shorthand `deploy` command exists

**Safeguard 2: Confirmation Prompt**
The `deploy:production` script will ask:
```
⚠️  PRODUCTION DEPLOY
Target: G:\My Drive\IT\Obsidian Vault\My Notebooks\.obsidian\plugins\quest-board
Are you SURE? Type 'yes' to continue:
```

**Safeguard 3: Agent Rules**
- Agents should NEVER run `deploy:production` without explicit user approval
- If an agent is asked to deploy, they must confirm: "Deploy to PRODUCTION vault?"
- Default is ALWAYS `deploy:test`

**Safeguard 4: Visual Indicator**
When testing in Obsidian, the dev vault has a different name:
- Dev vault: `Quest-Board-Test-Vault`
- Production vault: `My Notebooks`

**What to do if you accidentally deployed to production:**
1. Don't panic
2. Check git status for uncommitted changes
3. Restore from git if needed: `git checkout -- .`
4. Verify plugin still works in production Obsidian

---

## Testing Procedures

### Unit Tests (Vitest)

```bash
npm test              # Run all tests
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

**What to Test:**
- Services: `LootGenerationService`, `BattleService`, pathfinding
- Validators: `validateGearItem()`, `validateMonsterTemplate()`
- Utilities: `normalizeSetId()`, damage calculations

**Don't Unit Test (yet):**
- React components (slow, fragile)
- Obsidian API integration (requires mocks)

### Balance Testing

```bash
npm run test:balance  # Combat simulation
```

Check output for:
- Win rate 60-80% = balanced
- Win rate <50% = too hard
- Win rate >90% = too easy

### Manual Testing Checklist

After each feature, test in dev vault:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Character data persists after reload
- [ ] Mobile Obsidian (if applicable)
- [ ] Edge cases (empty inventory, 0 HP, etc.)

---

## Architecture Guidelines

### Zustand Store Pattern

```typescript
// ✅ DO: Atomic field updates
updateGold: (delta) => {
  set(state => ({
    character: { ...state.character, gold: state.character.gold + delta }
  }));
  get().saveCharacter();
}

// ❌ DON'T: Full object replacement
setCharacter(updatedCharacter); // Race condition risk!
```

### Service Pattern

```typescript
// ✅ DO: Stateless pure functions
export function calculateDamage(attacker: CombatStats, defender: CombatStats): DamageResult {...}

// ❌ DON'T: Stateful singletons
class BattleManager {
  private activeBattle: Battle; // State belongs in Zustand!
}
```

### Mobile-First

```typescript
import { Platform } from 'obsidian';

const isMobile = Platform.isMobile;

// Touch targets: min 44x44px
// Use onTouchStart (not onClick) for D-pad
// Stack buttons vertically on mobile
```

### Sprite Fallback Pattern

```tsx
function Icon({ spriteId, emoji }: { spriteId?: string; emoji: string }) {
  const [error, setError] = useState(false);
  
  if (error || !spriteId) return <span>{emoji}</span>;
  
  return <img src={spriteId} onError={() => setError(true)} />;
}
```

---

## New File Locations

| Type | Location |
|------|----------|
| Gear models | `src/models/Gear.ts` |
| Combat models | `src/models/Combat.ts` |
| Dungeon models | `src/models/Dungeon.ts` |
| Loot service | `src/services/LootGenerationService.ts` |
| Battle service | `src/services/BattleService.ts` |
| Exploration service | `src/services/ExplorationService.ts` |
| Battle store | `src/store/battleStore.ts` |
| Dungeon store | `src/store/dungeonStore.ts` |
| Unique items | `src/data/uniqueItems.ts` |
| Monsters | `src/data/monsters.ts` |
| Dungeons | `src/data/dungeons.ts` |
| Unit tests | `src/**/__tests__/*.test.ts` |

---

## Character Schema Migration

> ⚠️ **CRITICAL:** Implement `migrateCharacterV1toV2()` BEFORE any gear code!

```typescript
// In characterStore initialization
function loadCharacter(savedData: any): Character {
  if (savedData?.schemaVersion !== 2) {
    return migrateCharacterV1toV2(savedData);
  }
  return savedData;
}
```

See: Gear doc → Character Schema Migration section

---

## Session Handoff

At end of each session:

1. ✅ **Test with Brad** before updating docs
2. ✅ **Update Session Log** (`Phase 3 Implementation Session Log.md`)
3. ✅ **Update Checklist** (mark items complete)
4. ✅ **Suggest commit message**
5. ✅ **Write Next Session Prompt** in session log

---

## Reference Documents

| Doc | Purpose |
|-----|---------|
| [[Gear and Loot System]] | Full gear/inventory specs |
| [[Fight System]] | Combat mechanics, monsters |
| [[Exploration System]] | Dungeon tiles, pathfinding |
| [[Phase 3 Implementation Checklist]] | Step-by-step with links |
| [[Claude code review]] | Detailed architectural review |
| [[Foundation Session Log]] | Prior development history |

---

*Last Updated: 2026-01-23*
