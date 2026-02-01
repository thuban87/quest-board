# AI Dungeon Cleanup Prompt

Use this prompt as a second pass to fix common AI mistakes in generated dungeons.

---

## PROMPT START

You are reviewing and fixing a dungeon template for the Quest Board Obsidian plugin. The dungeon was AI-generated and may have errors. Your job is to identify and fix all issues.

**Paste the generated dungeon code here:**

```typescript
[PASTE DUNGEON CODE HERE]
```

---

### VALIDATION CHECKLIST

Verify each of these and fix any violations:

#### 1. Row Width Validation
- [ ] Every row in every layout is EXACTLY 11 characters wide
- [ ] Count each row manually: `###########` = 11 chars
- [ ] If a row is 10 or 12 characters, fix it immediately

**Common fix:** Add or remove a `.` or `#` to reach exactly 11 characters.

#### 2. Door Position Validation
For each door entry (e.g., `'5,6': { targetRoom: 'next_room', targetEntry: 'north' }`):
- [ ] The position `5,6` refers to column 5, row 6 (0-indexed)
- [ ] That position in the layout must be `.`, `O`, or a space - NOT `#`
- [ ] Doors are typically at edges: row 0 (top), row 6 (bottom), column 0 (left), column 10 (right)

**Common fix:** Replace the `#` at the door position with `.` or move the door to a valid position.

#### 3. Bidirectional Door Validation
For every door from Room A → Room B:
- [ ] Room B has a corresponding door back to Room A
- [ ] The `targetEntry` directions are opposite (north ↔ south, east ↔ west)

**Example:**
- Room A door: `'5,6': { targetRoom: 'room_b', targetEntry: 'north' }`
- Room B must have: `'5,0': { targetRoom: 'room_a', targetEntry: 'south' }`

#### 4. Monster Position Validation
For each `M` in a layout:
- [ ] There is a matching entry in the `monsters` array
- [ ] The `position: [x, y]` matches where the `M` appears (x = column, y = row)

For each entry in `monsters` array:
- [ ] There is a corresponding `M` at that position in the layout

**Common fix:** Add missing `M` to layout or add missing monster metadata.

#### 5. Chest Position Validation
For each `C` in a layout:
- [ ] There is a matching entry in the `chests` array
- [ ] The `position: [x, y]` matches where the `C` appears
- [ ] The tier is appropriate for the room's position in the dungeon

For each entry in `chests` array:
- [ ] There is a corresponding `C` at that position in the layout

#### 6. Doorway Clearance Validation
- [ ] No `B` (boulder), `~` (water), or `C` (chest) is placed directly adjacent to a door
- [ ] At least one `.` exists on each side of every door position

**Common fix:** Move obstacles away from doors or replace with `.`

#### 7. Entry Room Validation
- [ ] Exactly one room has type `'entry'`
- [ ] The entry room contains exactly one `P` (player spawn)
- [ ] The entry room has NO monsters

#### 8. Portal Validation
- [ ] Exactly one `O` (portal) exists in the entire dungeon
- [ ] The portal is in the boss room OR in a treasure room after the boss
- [ ] The portal position is walkable

#### 9. Boss Room Validation
- [ ] At least one room has type `'boss'`
- [ ] Boss room monsters include at least one with `isBoss: true`

---

### OUTPUT FORMAT

After validation, output:

1. **Issues Found:** List each problem discovered
2. **Fixes Applied:** Describe what you changed
3. **Corrected Code:** The complete fixed TypeScript code

If no issues were found, state "No issues found" and return the original code unchanged.

---

### EXAMPLE FIX

**Issue:** Row 3 of room 'guard_room' is only 10 characters wide

**Original:**
```
'#........#',  // Only 10 chars!
```

**Fixed:**
```
'#.........#',  // Now 11 chars
```

---

Now validate and fix the dungeon code provided above.

## PROMPT END
