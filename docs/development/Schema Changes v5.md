# Character Schema v5 - Skills System

**Migration:** v4 → v5
**Date:** 2026-01-29
**Feature:** Phase 5 Skills System

---

## Summary

Schema v5 adds two new fields to the Character interface to support the Pokemon Gen 1-inspired skills system:

1. **`skills`** - Tracks unlocked and equipped skills
2. **`persistentStatusEffects`** - Status effects that persist between battles

---

## New Fields

### `skills`

```typescript
skills: {
    /** All learned skill IDs */
    unlocked: string[];
    /** Currently equipped skills (max 5) */
    equipped: string[];
}
```

**Purpose:** Manages the player's skill loadout for combat.

- `unlocked` - Populated based on character class and level during migration
- `equipped` - Max 5 skills that can be used in battle
- Skills are unlocked at specific levels (defined in `src/data/skills.ts`)

**Default:** Empty arrays `{ unlocked: [], equipped: [] }` if migration cannot determine skills.

**Smart Loadout Migration:** When migrating from v4, the system:
1. Looks up all skills available for the character's class at their current level
2. Builds a balanced loadout prioritizing:
   - Heal/Meditate
   - Buff  
   - Ultimate (once-per-battle)
   - Damage/Hybrid skills

---

### `persistentStatusEffects`

```typescript
persistentStatusEffects: StatusEffect[];
```

**Purpose:** Status effects that survive between battles but are cleared by:
- Long Rest
- Death recovery

**Status Types:**
- DoT: `burn`, `poison`, `bleed`, `curse`
- Hard CC: `paralyze`, `sleep`, `freeze`, `stun`
- Soft CC: `confusion`

**Default:** Empty array `[]`

---

## Migration Chain

```
v1 → v2 (Gear System)
  → v3 (Death Penalty)
    → v4 (Activity Tracking)
      → v5 (Skills System) ← Current
```

All migrations are chained - migrating from v1 will automatically apply v2, v3, v4, and v5 migrations in sequence.

---

## Related Files

| File | Description |
|------|-------------|
| `src/models/Character.ts` | Character interface + migration functions |
| `src/models/Skill.ts` | Skill, ElementalType, SkillCategory types |
| `src/models/StatusEffect.ts` | StatusEffect, StatusEffectType types |
| `src/data/skills.ts` | All 57 skill definitions (lazy-loaded) |
| `src/store/battleStore.ts` | BattlePlayer for volatile battle state |

---

## Testing Notes

1. **Test vault character is v3** - Migration will go v3 → v4 → v5
2. **Verify skills populated** - Check character has skills unlocked/equipped after load
3. **Check loadout logic** - Warrior at level 10 should have Meditate, Sharpen, Slash equipped

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v5 | 2026-01-29 | Added skills system fields |
| v4 | 2026-01-xx | Added activityHistory |
| v3 | 2026-01-xx | Added status, recoveryTimerEnd |
| v2 | 2026-01-xx | Added gear system fields |
| v1 | Initial | Base character structure |
