# Quest Board - Character Creation & Visual Design

Complete reference for character customization, classes, and visual sprite system.

---

## Character Creation Flow

**Triggered on:** First plugin launch OR command "Quest Board: Create/Edit Character"

### Modal Interface

```
╔═══════════════════════════════════════════════╗
║        QUEST BOARD - CREATE CHARACTER         ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  What is your name, adventurer?               ║
║  ┌─────────────────────────────────────────┐ ║
║  │ [Character Name]                        │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  Choose Your Class:                           ║
║  ┌─────────────────────────────────────────┐ ║
║  │ ○ Warrior - Executor & Task Slayer     │ ║
║  │   +15% XP on Admin/Completion quests   │ ║
║  │                                         │ ║
║  │ ○ Paladin - Defender & Supporter       │ ║
║  │   +15% XP on Health & Social quests    │ ║
║  │                                         │ ║
║  │ ○ Technomancer - Builder & Creator     │ ║
║  │   +15% XP on Dev/Creative quests       │ ║
║  │                                         │ ║
║  │ ○ Scholar - Learner & Academic         │ ║
║  │   +15% XP on Study/Academic quests     │ ║
║  │                                         │ ║
║  │ ○ Rogue - Strategist & Efficient       │ ║
║  │   +15% XP on Quick Wins                │ ║
║  │                                         │ ║
║  │ ○ Cleric - Healer & Wellness           │ ║
║  │   +15% XP on Health/Wellness quests    │ ║
║  │                                         │ ║
║  │ ○ Bard - Charmer & Social              │ ║
║  │   +15% XP on Social/Dating quests      │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║  Customize Appearance:                        ║
║  Skin Tone:   [Light] [Medium] [Tan] [Dark]  ║
║  Hair Style:  [Short] [Medium] [Long] [Bald] ║
║  Hair Color:  [Brown] [Black] [Blonde] [Red] ║
║  Accessory:   [None] [Glasses] [Hat] [Phones]║
║                                               ║
║  Outfit Colors:                               ║
║  Primary:   [Color Picker]                    ║
║  Secondary: [Color Picker]                    ║
║                                               ║
║  ┌─────────────────────────────────────────┐ ║
║  │     [Character Preview]                 │ ║
║  │  (Placeholder in Phase 1-2)             │ ║
║  │  (Pixel art sprite in Phase 3)          │ ║
║  └─────────────────────────────────────────┘ ║
║                                               ║
║        [ Cancel ]      [ Begin Journey ]      ║
╚═══════════════════════════════════════════════╝
```

---

## Class System

### 1. Warrior (Executor/Doer)

**Focus:** Getting things done, completing tasks, administrative mastery

**XP Bonus:** +15% on Admin, Completion, and Household quests

**Starting Perk:** "Task Slayer"
- Completion streaks grant additional 5% XP
- Stacks with class bonus (20% total during streak)

**Visual Theme:**
- Heavy armor
- Sword and shield
- Aggressive, confident stance
- Colors: Red, silver, black

**Best for:** People who thrive on checking boxes and crushing to-do lists

---

### 2. Paladin (Defender/Support)

**Focus:** Balanced approach to health and social well-being, protecting progress

**XP Bonus:** +15% on both Health AND Social quests (unique dual-category bonus)

**Starting Perk:** "Shield of Discipline"
- If you miss one day in a streak, it doesn't break
- One "shield charge" per week (resets Monday)
- Protects your progress from occasional slip-ups

**Visual Theme:**
- Medium armor with holy symbols
- Shield prominently displayed
- Defensive, protective stance
- Colors: Gold, white, blue

**Best for:** People balancing self-care with social connection, need grace for imperfection

---

### 3. Technomancer (Builder/Creator)

**Focus:** Development, creative projects, building things

**XP Bonus:** +15% on Development, Creative, and Project quests

**Starting Perk:** "Code Warrior"
- Completing a multi-day project quest grants 25% bonus XP
- Encourages deep work sessions

**Visual Theme:**
- Modern tech aesthetic
- Laptop/tablet accessory
- Confident builder stance
- Colors: Green, cyan, dark gray

**Best for:** Developers, designers, builders, makers

---

### 4. Scholar (Learner/Academic)

**Focus:** Learning, studying, academic achievement, knowledge acquisition

**XP Bonus:** +15% on Academic, Study, and Research quests

**Starting Perk:** "Knowledge Seeker"
- Reading or studying for 30+ minutes grants bonus XP
- Integrates with study tracking

**Visual Theme:**
- Scholarly robes
- Books or scroll accessory
- Thoughtful, studious pose
- Colors: Blue, purple, brown

**Best for:** Students, lifelong learners, people in school

---

### 5. Rogue (Strategist/Efficient)

**Focus:** Efficiency, smart shortcuts, optimizing workflows

**XP Bonus:** +15% on Quick Win quests (tasks completed under time estimate)

**Starting Perk:** "Clever Shortcut"
- If you complete a quest faster than estimated, gain 20% bonus XP
- Rewards efficiency and strategic thinking

**Visual Theme:**
- Light armor, agile build
- Daggers or quick weapons
- Sneaky, efficient stance
- Colors: Black, dark green, gray

**Best for:** People who love optimizing, finding better ways, working smart not hard

---

### 6. Cleric (Healer/Wellness)

**Focus:** Health, self-care, wellness, healing

**XP Bonus:** +15% on Health, Fitness, Medical, and Wellness quests

**Starting Perk:** "Self-Care Aura"
- Wellness streaks (consecutive days with health tasks) grant stacking bonus
- Day 1: +5%, Day 2: +10%, Day 3: +15%, etc.

**Visual Theme:**
- Robes with healing symbols
- Staff or healing implement
- Supportive, nurturing stance
- Colors: White, light blue, green

**Best for:** People focusing on physical/mental health, recovery, fitness

---

### 7. Bard (Charmer/Social)

**Focus:** Social connections, dating, friendships, charisma

**XP Bonus:** +15% on Social, Dating, and Friendship quests

**Starting Perk:** "Charming Presence"
- Social battery recharges faster after completing social quests
- Reduces "social exhaustion" penalty for introverts

**Visual Theme:**
- Stylish outfit, no heavy armor
- Musical instrument accessory
- Charismatic, open stance
- Colors: Purple, gold, vibrant patterns

**Best for:** People working on social skills, dating, expanding social circles

---

## Dual-Class System

**Unlocks at:** Level 25

**Achievement:** "Multiclass Mastery"

### How It Works

1. **Reach Level 25**
2. **Notification:** "You've unlocked the ability to multiclass!"
3. **Modal appears:** "Choose your secondary class"
4. **Select second class** from remaining 6 options
5. **Bonuses applied:**
   - Primary class: 15% XP (unchanged)
   - Secondary class: 7.5% XP (half value)
   - Both perks active
6. **Visual update:** Character sprite gains elements from both classes

**Example: Paladin/Technomancer**
- Primary: Paladin (15% on Health/Social)
- Secondary: Technomancer (7.5% on Dev/Creative)
- Perks: Shield of Discipline + Code Warrior
- Visual: Shield + tech accessory, blended color scheme

**Strategy:** Choose complementary classes to cover more quest types.

---

## Class Change System

**Can change class at any time after creation, but it costs XP.**

### How It Works

**Command:** "Quest Board: Change Class"

**Cost Formula:**
```typescript
const cost = currentLevel * 100;
```

**Examples:**
- Level 5: 500 XP
- Level 10: 1,000 XP
- Level 15: 1,500 XP
- Level 25: 2,500 XP

**Process:**
1. Open class change modal
2. See current class and available classes
3. See XP cost prominently displayed
4. Confirm change
5. Deduct XP (can delevel if current XP < cost)
6. Apply new class bonuses
7. Update character sprite

**Why costly:** Makes class choice meaningful, prevents trivial switching, but allows flexibility if your needs change.

---

## Appearance Customization

### Skin Tone (4 options)
1. Light
2. Medium
3. Tan
4. Dark

**Implementation:** Overlay sprite layer with tint/opacity

### Hair Style (4 options)
1. Short
2. Medium (shoulder-length)
3. Long
4. Bald/No hair

**Implementation:** Separate sprite layer

### Hair Color (4 options)
1. Brown
2. Black
3. Blonde
4. Red

**Implementation:** Color swap on hair sprite layer

### Accessories (4 options)
1. None
2. Glasses
3. Hat (style varies by class)
4. Headphones

**Implementation:** Accessory sprite layer

### Outfit Colors
- **Primary:** Main armor/clothing color
- **Secondary:** Accent color

**Implementation:** Color swap on base sprite

---

## Visual Progression System

### Level Tiers

Characters evolve visually through 5 distinct tiers:

**Tier 1: Levels 1-5 (Childhood/Learning)**
- Basic gear
- Simple sprite
- Uncertain posture
- Visual theme: Just starting out

**Tier 2: Levels 6-12 (Growing Up)**
- Improved gear
- More confident sprite
- Better posture
- Visual theme: Getting the hang of it

**Tier 3: Levels 13-17 (Teen/Young Adult)**
- Teen/young adult aesthetic
- Decent equipment
- More mature sprite
- Visual theme: Transition period

**Tier 4: Levels 18-24 (Adult)**
- Professional-level gear
- Adult sprite
- Confident posture
- Visual theme: Full adult

**Tier 5: Levels 25-30 (Master)**
- Best equipment
- Master-tier sprite
- Authoritative posture
- All gear slots unlocked
- Visual theme: Peak performance

### Gear Slots

**Unlocked progressively:**
- **Level 1:** Weapon slot
- **Level 10:** Armor slot
- **Level 15:** Accessory 1 slot
- **Level 20:** Accessory 2 slot
- **Level 25:** Accessory 3 slot + Dual-class visual

**Visual representation:**
- Equipped gear shows on character sprite
- Empty slots show as outlines
- Gear obtained from quest rewards

---

## Sprite System (Phase 3)

### Asset Requirements

**Base Sprites:**
- 7 classes × 5 level tiers = **35 base sprites**
- Size: 16×16 or 32×32 pixels
- Style: Pixel art, RPG game aesthetic
- Format: PNG with transparency

**Customization Layers:**
- 4 hair styles × 4 colors = **16 hair sprites**
- 4 skin tone overlays = **4 sprites**
- 4 accessories = **4 sprites**
- **Total customization sprites: 24**

**Gear Sprites:**
- ~10-15 weapon sprites
- ~10-15 armor sprites
- ~10-15 accessory sprites
- **Total gear sprites: ~30-45**

**Grand Total: ~90-100 small pixel art images**

### Generation Plan (Using Veo)

**Prompt Template for Veo:**
```
"16x16 pixel art sprite, [class] character at level [tier],
[description of gear/appearance], front-facing view,
RPG game style, transparent background,
pixel perfect, retro game aesthetic"
```

**Example Prompts:**

**Warrior Level 1-5:**
```
"16x16 pixel art sprite, warrior character at beginner level,
basic leather armor and wooden sword, front-facing view,
RPG game style, transparent background, determined expression"
```

**Paladin Level 25-30:**
```
"16x16 pixel art sprite, paladin character at master level,
holy plate armor with golden shield and blessed sword,
front-facing view, RPG game style, transparent background,
confident and protective stance"
```

**Hair Layer (Brown, Short):**
```
"16x16 pixel art sprite, short brown hair overlay,
front-facing, transparent background, designed to layer on character sprite"
```

### Sprite Layering System

**Client-side assembly using HTML Canvas:**

```typescript
const renderCharacter = (ctx: CanvasRenderingContext2D, character: Character) => {
  // Layer 1: Base sprite (class + level tier)
  const baseSprite = getBaseSprite(character.class, character.levelTier);
  ctx.drawImage(baseSprite, 0, 0);

  // Layer 2: Skin tone overlay (optional tint)
  if (character.skinTone !== 'default') {
    const skinOverlay = getSkinOverlay(character.skinTone);
    ctx.globalAlpha = 0.3;
    ctx.drawImage(skinOverlay, 0, 0);
    ctx.globalAlpha = 1.0;
  }

  // Layer 3: Hair
  const hairSprite = getHairSprite(character.hairStyle, character.hairColor);
  ctx.drawImage(hairSprite, 0, 0);

  // Layer 4: Accessories
  if (character.accessory !== 'none') {
    const accessorySprite = getAccessorySprite(character.accessory);
    ctx.drawImage(accessorySprite, 0, 0);
  }

  // Layer 5: Equipped gear
  character.equippedGear.forEach(gear => {
    const gearSprite = getGearSprite(gear.id);
    ctx.drawImage(gearSprite, gear.x, gear.y);
  });

  // Layer 6: Dual-class indicator (if level 25+)
  if (character.secondaryClass) {
    const dualClassIcon = getDualClassIcon(character.secondaryClass);
    ctx.drawImage(dualClassIcon, 24, 0); // Top right corner
  }
};
```

**Result:** Instant character rendering, no API calls, fully customizable.

---

## Character Sheet Layout

**Hybrid approach: Character visual + stats side-by-side**

```
╔═══════════════════════════════════════════════════╗
║              CHARACTER SHEET                      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  ┌─────────────────┐   [Character Name]          ║
║  │                 │   Level [X] [Class Name]     ║
║  │                 │   [Secondary Class] (if 25+) ║
║  │   [Character    │                              ║
║  │     Sprite]     │   ▓▓▓▓▓▓▓▓░░░░ 1250/2000 XP ║
║  │   (Pixel Art)   │                              ║
║  │                 │   Quests Completed: 42       ║
║  │                 │   Current Streak: 7 days     ║
║  └─────────────────┘                              ║
║                                                   ║
║  ═════════════════════════════════════════════════║
║                                                   ║
║  EQUIPPED GEAR                                    ║
║  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ║
║  │Weapon│ │Armor │ │Acces1│ │Acces2│ │Acces3│  ║
║  │ [⚔️] │ │ [🛡️] │ │ [👓] │ │ [ ]  │ │ [ ]  │  ║
║  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘  ║
║                                                   ║
║  ACHIEVEMENTS                                     ║
║  🏆 First Quest    🏆 Level 10    🏆 Week Warrior║
║  🏆 Task Slayer    ⬜ (Locked)    ⬜ (Locked)    ║
║                                                   ║
║  ACTIVE PERKS                                     ║
║  • Task Slayer (+5% XP on streak)                ║
║  • Dad Accountability (+10% XP)                   ║
║                                                   ║
║  STATS                                            ║
║  Total Quests:        42                          ║
║  Total XP Earned:     8,450                       ║
║  Highest Streak:      14 days                     ║
║  Time to Level 30:    ~45 days (est)             ║
║                                                   ║
║            [ Edit Character ] [ Close ]           ║
╚═══════════════════════════════════════════════════╝
```

---

## Placeholder Visuals (Phase 1-2)

**Before pixel art sprites are created:**

### Option 1: Colored Circles with Emoji
```
Warrior:      🔴 ⚔️
Paladin:      🟡 🛡️
Technomancer: 🟢 💻
Scholar:      🔵 📚
Rogue:        ⚫ 🗡️
Cleric:       ⚪ ✨
Bard:         🟣 🎵
```

### Option 2: Simple SVG Shapes
```svg
<svg width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#ff4444" />
  <text x="32" y="42" text-anchor="middle" font-size="32">⚔️</text>
</svg>
```

### Option 3: Geometric Character
```svg
<svg width="64" height="96">
  <!-- Head -->
  <circle cx="32" cy="20" r="12" fill="#ffd1a3" />
  <!-- Body (class color) -->
  <rect x="20" y="32" width="24" height="40" fill="#ff4444" />
  <!-- Arms -->
  <rect x="10" y="40" width="8" height="24" fill="#ff4444" />
  <rect x="46" y="40" width="8" height="24" fill="#ff4444" />
  <!-- Legs -->
  <rect x="20" y="72" width="10" height="24" fill="#333" />
  <rect x="34" y="72" width="10" height="24" fill="#333" />
</svg>
```

**Any of these work for Phase 1-2 testing.** Functionality matters more than visuals initially.

---

## Settings Storage

**Character data stored in plugin settings:**

```json
{
  "character": {
    "name": "Brad",
    "class": "paladin",
    "secondaryClass": null,
    "level": 8,
    "totalXP": 1250,
    "appearance": {
      "skinTone": "light",
      "hairStyle": "short",
      "hairColor": "brown",
      "accessory": "glasses",
      "outfitPrimary": "#FFD700",
      "outfitSecondary": "#4169E1"
    },
    "equippedGear": [
      { "slot": "weapon", "itemId": "basic-sword" },
      { "slot": "armor", "itemId": "holy-shield" }
    ],
    "createdDate": "2026-01-22T10:00:00Z",
    "lastModified": "2026-01-25T15:30:00Z"
  }
}
```

**Editable via:**
- Settings panel
- "Edit Character" button on character sheet
- Command: "Quest Board: Edit Character"

---

## Implementation Checklist

### Phase 1
- [ ] Character creation modal UI
- [ ] Class selection with descriptions
- [ ] Simple appearance customization (dropdowns)
- [ ] Character data storage in settings
- [ ] Placeholder character visual (emoji or SVG)
- [ ] Class bonus XP calculations
- [ ] Starting perk implementation
- [ ] Character name display throughout plugin

### Phase 2
- [ ] Enhanced character sheet layout
- [ ] Better placeholder visuals (SVG improvements)
- [ ] Gear slot UI (empty slots shown)
- [ ] Achievement badge placeholders
- [ ] Class-themed UI colors (optional)
- [ ] "Edit Character" functionality

### Phase 3
- [ ] Generate all sprites with Veo (~90-100 images)
- [ ] Implement sprite layering system (Canvas)
- [ ] Replace placeholders with pixel art
- [ ] Level tier sprite transitions
- [ ] Gear visual system (sprites on character)
- [ ] Dual-class unlock at Level 25
- [ ] Dual-class visual blending
- [ ] Class change modal and XP cost
- [ ] Animated level-up sprite transition

---

**Last Updated:** 2026-01-18

**Links:** [[Project Summary]] | [[Feature Priority List]] | [[CLAUDE.md]]
