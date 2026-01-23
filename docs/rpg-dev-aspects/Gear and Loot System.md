# Gear & Loot System - Brainstorming Document

> **Status:** 🟡 Brainstorming  
> **Priority:** Phase 3A (First to implement)  
> **Dependencies:** None (foundational system)

---

## Overview

The Gear & Loot System provides tangible rewards for quest completion. Users earn equipment that improves their character's stats, creating a progression loop that makes quest completion more rewarding.

### Design Philosophy
- **Single-player RPG** - No multiplayer balancing concerns
- **User agency** - Customizable drop tables, per-quest overrides
- **Difficulty via combat** - Not via gear scarcity
- **Dopamine first** - Getting loot should feel good!

---

## Gear Slots

Six primary slots (matching current `EquippedGear` structure):

| Slot | Combat Role | Visual Location |
|------|-------------|-----------------|
| 🪖 **Head** | Defense, magic resist | Character sheet |
| 🎽 **Chest** | Main armor, constitution | Character sheet |
| 👖 **Legs** | Defense, mobility | Character sheet |
| 🥾 **Boots** | Speed, dodge chance | Character sheet |
| ⚔️ **Weapon** | Attack power, crit chance | Character sheet |
| 🛡️ **Shield** | Block chance, defense | Character sheet |

### Accessory Slots (Stretch Goal)
- 💍 **Accessory 1** - Ring/Amulet
- 💍 **Accessory 2** - Ring/Amulet  
- 💍 **Accessory 3** - Trinket/Charm

> [!NOTE]
> Current `EquippedGear` interface has: `'weapon' | 'armor' | 'accessory1' | 'accessory2' | 'accessory3'`
> We'll need to expand this to support individual armor slots.

---

## Gear Tiers

Six tiers of quality, affecting stat ranges and visual style:

| Tier | Level Range | Color | Drop Weight |
|------|-------------|-------|-------------|
| 🔘 **Common** | 1-5 | Gray | Training only |
| 🟢 **Adept** | 1-15 | Green | High |
| 🔵 **Journeyman** | 5-25 | Blue | Medium |
| 🟣 **Master** | 15-35 | Purple | Low |
| 🟠 **Epic** | 25-40 | Orange | Very Low |
| 🟡 **Legendary** | 30-40 | Gold | Ultra Rare |

### Tier Drop Rates by Quest Difficulty

| Quest Difficulty | Common | Adept | Journeyman | Master | Epic | Legendary |
|------------------|--------|-------|------------|--------|------|-----------|
| Trivial | - | 80% | 20% | - | - | - |
| Easy | - | 60% | 35% | 5% | - | - |
| Medium | - | 40% | 40% | 18% | 2% | - |
| Hard | - | 20% | 35% | 35% | 9% | 1% |
| Epic | - | 10% | 25% | 40% | 20% | 5% |

> [!IMPORTANT]  
> **Training Mode:** Only drops Common and Adept gear regardless of difficulty.

---

## Gear Level Scaling

Gear levels are tied to character level with variance:

```
GearLevel = CharacterLevel + Random(-2, +3)
GearLevel = Clamp(GearLevel, 1, 40)
```

### Stat Calculation

```typescript
interface GearStats {
  // Primary stat based on slot
  primaryStat: StatType;
  primaryValue: number;
  
  // Optional secondary stats
  secondaryStats?: Partial<CharacterStats>;
  
  // Combat bonuses
  attackPower?: number;      // Weapons
  defense?: number;          // Armor
  blockChance?: number;      // Shields
  critChance?: number;       // Weapons, some accessories
  dodgeChance?: number;      // Boots, light armor
}
```

### Stat Scaling Formula (Exponential)

> [!TIP]
> Using exponential scaling so high-tier gear feels significantly more powerful.
> A Legendary Level 40 item should feel "broken" compared to Common Level 1.

```typescript
// Tier multipliers (used in exponential formula)
const TIER_MULTIPLIERS: Record<GearTier, number> = {
  common: 0.5,
  adept: 1.0,
  journeyman: 1.5,
  master: 2.0,
  epic: 2.5,
  legendary: 3.0,
};

// Exponential stat formula - high level legendaries feel POWERFUL
function calculateBaseStatValue(gearLevel: number, tier: GearTier): number {
  const tierMultiplier = TIER_MULTIPLIERS[tier];
  
  // Formula: (level * 3) + (tierMultiplier * level)
  // This creates exponential feel where tier matters MORE at high levels
  const baseValue = (gearLevel * 3) + (tierMultiplier * gearLevel);
  
  // Add small variance
  const variance = Math.floor(baseValue * 0.1);
  return baseValue + randomRange(-variance, variance);
}

// Example outputs:
// Level 1 Common:    (3) + (0.5 * 1)  = 3.5   ≈ 4
// Level 1 Legendary: (3) + (3.0 * 1)  = 6     ≈ 6
// Level 40 Common:   (120) + (0.5 * 40) = 140
// Level 40 Legendary:(120) + (3.0 * 40) = 240 ← Feels properly powerful!
```

**Why exponential?** Linear scaling (`level * 2 + tier * 5`) made a Level 40 Legendary only ~20x stronger than a Level 1 stick. With this formula, tier matters *multiplicatively* with level, making high-tier finds exciting at any level.

---

## Quest Type → Gear Slot Mapping

Default mappings (user-customizable):

| Quest Type | Primary Reward(s) | Secondary Reward(s) |
|------------|-------------------|---------------------|
| **Main** | Chest, Legs | Accessories |
| **Side** | Weapon, Shield | - |
| **Training** | Head, Boots | Weapon |
| **Recurring** | Accessories | Chest, Legs |
| **Daily** | Gold, Consumables | Random gear slot |

### User Customization Options

1. **Per-Quest Override** (Create Quest Modal)
   - User can specify exact gear slot reward
   - Overrides default quest type mapping
   - Example: "This Main quest rewards Boots instead"

2. **Global Remapping** (Settings)
   - User can reassign up to 3 slots per quest type
   - Syncs with folder structure (dynamic quest types)
   - Example: "Recurring quests now drop: Head, Weapon, Shield"

---

## Starter Gear

New characters begin with:

| Slot | Item | Stats |
|------|------|-------|
| Head | Cloth Hood | +1 Wisdom |
| Chest | Linen Tunic | +2 Constitution |
| Legs | Simple Pants | +1 Constitution |
| Boots | Worn Sandals | +1 Dexterity |
| Weapon | Wooden Sword | +3 Attack Power |
| Shield | Wooden Buckler | +5% Block Chance |

> All starter gear is **Common** tier, Level 1.

---

## Data Model

### GearItem Interface

```typescript
interface GearItem {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Display name
  description: string;           // Flavor text
  
  slot: GearSlot;                // Which slot it equips to
  tier: GearTier;                // Common through Legendary
  level: number;                 // 1-40
  
  stats: GearStats;              // Stat bonuses (procedurally generated)
  
  // Economy
  sellValue: number;             // Gold received when sold
  
  // Visual
  spriteId?: string;             // Reference to sprite asset
  iconEmoji?: string;            // Fallback display
  
  // Source tracking
  source: 'quest' | 'combat' | 'exploration' | 'shop' | 'starter';
  sourceId?: string;             // Quest ID or monster ID
  acquiredAt: string;            // ISO date
}

type GearSlot = 'head' | 'chest' | 'legs' | 'boots' | 'weapon' | 'shield' | 'accessory1' | 'accessory2' | 'accessory3';

type GearTier = 'common' | 'adept' | 'journeyman' | 'master' | 'epic' | 'legendary';
```

### Inventory Architecture

> [!IMPORTANT]
> **Critical: Separate Storage for Gear vs Consumables**
> 
> The existing `inventory: InventoryItem[]` uses `{ itemId, quantity }` for **stackable** items (consumables, materials).
> 
> Gear items have **procedurally generated stats** (Diablo-style). Two "Iron Swords" with different stats CANNOT stack.
> 
> **Solution:** Two distinct inventories on Character.

```typescript
// Updated Character interface additions
interface Character {
  // ... existing fields ...
  
  // Stackable items (consumables, materials, keys)
  inventory: InventoryItem[];     // EXISTING - keep for stackables
  
  // Unique gear items (cannot stack - each has unique stats)
  gearInventory: GearItem[];      // NEW - for procedural gear
  
  // Equipped gear (one per slot)
  equippedGear: Record<GearSlot, GearItem | null>;  // UPDATED
  
  // Currency
  gold: number;                   // NEW - for sell/buy economy
}

// Existing stackable inventory item (unchanged)
interface InventoryItem {
  itemId: string;     // e.g., "health_potion", "dungeon_key"
  quantity: number;   // Can stack
}
```

> [!NOTE]
> Store all inventory with character data via `loadData()`/`saveData()`.
> NOT in vault files - gear is plugin-managed, not user-edited.

---

## Gold & Economy System

> [!TIP]
> **Why Gold Matters:** Without currency, "bad loot" is purely annoying - users just delete it.
> Gold closes the loop: Bad loot → Sell → Gold → Buy potions → Success in combat.

### Gold Sources
| Source | Amount |
|--------|--------|
| Sell gear | Based on tier + level (see formula) |
| Quest completion | Small bonus (10-50g based on difficulty) |
| Combat victory | Monster loot tables |
| Exploration chests | Random gold piles |

### Sell Value Formula

```typescript
function calculateSellValue(item: GearItem): number {
  const tierBase: Record<GearTier, number> = {
    common: 5,
    adept: 15,
    journeyman: 40,
    master: 100,
    epic: 250,
    legendary: 500,
  };
  
  return tierBase[item.tier] + (item.level * 2);
}

// Examples:
// Common Level 1:     5 + 2 = 7g
// Adept Level 10:     15 + 20 = 35g
// Legendary Level 40: 500 + 80 = 580g
```

### Gold Uses
- **Sell gear:** Delete item → gain gold
- **Buy consumables:** Health potions, buffs, dungeon keys
- **Re-roll rewards:** Spend gold to re-roll quest loot (stretch goal)
- **Upgrade gear:** Pay to enhance existing items (stretch goal)

---

## Loot Generation Service

### LootReward Type (Discriminated Union)

> [!NOTE]
> Allows a single reward to be gear, consumables, OR gold.
> A chest can contain 50g + a Potion + a Sword all at once.

```typescript
type LootReward =
  | { type: 'gear'; item: GearItem }
  | { type: 'consumable'; itemId: string; quantity: number }
  | { type: 'gold'; amount: number };

// A quest or chest can drop multiple rewards
type LootDrop = LootReward[];
```

### Loot Generation Service

```typescript
class LootGenerationService {
  /**
   * Generate loot for a completed quest
   */
  generateQuestLoot(quest: Quest, character: Character): LootDrop {
    const rewards: LootReward[] = [];
    
    // 1. Always give some gold
    rewards.push({
      type: 'gold',
      amount: this.calculateQuestGold(quest.difficulty),
    });
    
    // 2. Roll for gear based on quest type
    const gearSlot = this.getSlotForQuestType(quest.type);
    if (gearSlot) {
      const tier = this.rollTier(quest.difficulty);
      const level = this.rollGearLevel(character.level);
      rewards.push({
        type: 'gear',
        item: this.generateGearItem(gearSlot, tier, level),
      });
    }
    
    // 3. Daily quests give consumables instead of gear
    if (quest.type === 'daily') {
      rewards.push({
        type: 'consumable',
        itemId: 'health_potion',
        quantity: 1,
      });
    }
    
    return rewards;
  }
  
  /**
   * Generate loot from combat (future)
   */
  generateCombatLoot(monster: Monster, character: Character): LootDrop {
    // Based on monster loot table
  }
  
  /**
   * Generate loot from exploration chest
   */
  generateChestLoot(chestTier: ChestTier, character: Character): LootDrop {
    // Mixed rewards: gold + gear + consumables
  }
}
```

---

## Blacksmith System (Smelting)

> [!TIP]
> **Why Smelting Works:** Makes "junk" loot exciting because you're "one sword away" from a free upgrade.
> Keeps the inventory relevant even at high levels.

### The Mechanic

Combine 3 items of the **same tier** to create 1 item of the **next tier up** with randomly rolled stats.

```
3x Common Sword → 1x Adept Sword (random stats)
3x Adept Helm  → 1x Journeyman Helm (random stats)
3x Epic Shield → 1x Legendary Shield (random stats)
```

### Smelting Rules

| Rule | Details |
|------|----------|
| **Same Tier Required** | All 3 items must be same tier |
| **Any Slot** | Can mix slots (3 random items → 1 random slot) |
| **Same Slot Bonus** | 3 items of same slot → guaranteed that slot |
| **Level Averaging** | Result level = average of input levels (rounded up) |
| **No Legendary Smelting** | Can't smelt 3 Legendary (already max tier) |

### Implementation

```typescript
interface SmeltingService {
  /**
   * Check if 3 items can be smelted
   */
  canSmelt(items: [GearItem, GearItem, GearItem]): boolean {
    // All same tier, none legendary
    const tier = items[0].tier;
    return items.every(i => i.tier === tier) && tier !== 'legendary';
  }
  
  /**
   * Smelt 3 items into 1 higher tier item
   */
  smelt(items: [GearItem, GearItem, GearItem]): GearItem {
    const inputTier = items[0].tier;
    const outputTier = getNextTier(inputTier);
    
    // Determine output slot
    const slots = items.map(i => i.slot);
    const allSameSlot = slots.every(s => s === slots[0]);
    const outputSlot = allSameSlot ? slots[0] : randomSlot();
    
    // Average level (rounded up)
    const avgLevel = Math.ceil(items.reduce((sum, i) => sum + i.level, 0) / 3);
    
    return generateGearItem(outputSlot, outputTier, avgLevel);
  }
}
```

### UI: Blacksmith Panel

- [ ] 3 "input" slots to drag items into
- [ ] Preview of output tier + slot
- [ ] "Smelt!" button with confirmation
- [ ] Animation: items merge, new item appears with glow

---

## Legendary Lore (Procedural Flavor Text)

> [!TIP]
> **Why This Matters:** Text is Obsidian's superpower. 
> Legendary items create **permanent memories** of real-life accomplishments.

### The Mechanic

When a **Legendary** item drops, generate a unique "History" based on the quest that spawned it.

### Example

| Quest | Item | Flavor Text |
|-------|------|-------------|
| "Finish Q3 Financial Report" | **The Accountant's Greataxe** | *"Forged in the fires of the Q3 Financial Report. It creates order from chaos."* |
| "Complete Kitchen Renovation" | **Helm of Home Improvement** | *"This helm was tempered by the dust of drywall and the heat of a thousand contractor disputes."* |
| "Ship v2.0 Release" | **The Deployer's Shield** | *"When the pipelines failed and the servers burned, this shield held the line."* |

### Generation Options

#### Option A: Template-Based (No AI)

```typescript
const LEGENDARY_TEMPLATES = [
  "Forged in the fires of {questName}. It {verb} {noun}.",
  "When all seemed lost during {questName}, this {itemType} was born.",
  "The {adjective} power of {questName} flows through this {itemType}.",
];

const VERBS = ["creates", "destroys", "channels", "remembers"];
const NOUNS = ["order from chaos", "strength from struggle", "victory from defeat"];
```

#### Option B: AI-Enhanced (If Gemini/Claude configured)

```typescript
const prompt = `
Generate a legendary item name and flavor text (2 sentences max) for an RPG.
Quest completed: "${quest.title}"
Quest category: ${quest.category}
Item slot: ${slot}

Style: Epic fantasy with subtle humor. Reference the quest without being too literal.

Response format:
{
  "name": "The [Epic Name]",
  "flavorText": "[Flavor text referencing the quest]"
}
`;
```

### Updated GearItem Interface

```typescript
interface GearItem {
  // ... existing fields ...
  
  // Legendary-only fields
  isLegendary: boolean;          // Quick check
  legendaryName?: string;        // "The Accountant's Greataxe"
  legendaryLore?: string;        // Flavor text
  originQuest?: string;          // Quest title that spawned it
}
```

### UI: Legendary Item Display

- [ ] Gold border + glow effect
- [ ] Unique name displayed prominently
- [ ] Flavor text in italics below stats
- [ ] "Origin: {Quest Name}" link to original quest file

---

## Set Bonuses (Project-Based)

> [!TIP]
> **Why This Works:** Gamifies finishing a specific large project.
> Natural fit with folder-based quest types we already have.

### The Mechanic

Gear dropped from quests in the **same folder** forms a "Set". Equipping multiple pieces from a set grants bonuses.

### Example: "Kitchen Renovation" Set

All gear dropped from quests in `Life/Quest Board/quests/Kitchen Renovation/` belongs to this set.

| Pieces Equipped | Bonus |
|-----------------|-------|
| 2 pieces | +5 Constitution |
| 4 pieces | +10% XP from Kitchen Renovation quests |
| 6 pieces (Full Set) | +25% Gold from Kitchen Renovation, unique title |

### Set Tracking

```typescript
interface GearItem {
  // ... existing fields ...
  
  // Set tracking
  setId?: string;                // Folder path hash or name
  setName?: string;              // "Kitchen Renovation" (display name)
}

interface GearSet {
  id: string;                    // Unique identifier (folder path hash)
  name: string;                  // Display name (folder name)
  folderPath: string;            // Source folder
  
  // Bonuses at different piece counts
  bonuses: {
    pieces: number;              // 2, 4, or 6
    effect: SetBonusEffect;
  }[];
}

type SetBonusEffect =
  | { type: 'stat_bonus'; stat: StatType; value: number }
  | { type: 'xp_bonus'; category: string; percent: number }
  | { type: 'gold_bonus'; category: string; percent: number }
  | { type: 'title'; title: string };
```

### Automatic Set Generation

Sets are created automatically based on quest folder structure:

```typescript
function getSetFromQuest(quest: Quest): GearSet | null {
  // Parse folder path
  const folderPath = quest.path.substring(0, quest.path.lastIndexOf('/'));
  const folderName = folderPath.split('/').pop();
  
  // Skip root quest folder (no set for loose quests)
  if (folderPath === 'Life/Quest Board/quests') return null;
  
  return {
    id: hashString(folderPath),
    name: folderName,
    folderPath,
    bonuses: generateDefaultBonuses(folderName),
  };
}
```

### UI: Set Display

- [ ] Character sheet shows active set bonuses
- [ ] Equipped items show set membership ("Kitchen Renovation 2/6")
- [ ] Inventory filter: "Show set pieces"
- [ ] Set bonus text turns green when threshold reached

---

## UI Components Needed

### Character Sheet Updates
- [ ] Gear slots display (6 equipped items)
- [ ] Stat totals from gear
- [ ] Gear tooltip on hover
- [ ] Gold display

### Inventory Panel
- [ ] **Two tabs:** Gear | Consumables
- [ ] Grid view of unequipped gear items
- [ ] Sort/filter by slot, tier
- [ ] Equip/unequip actions
- [ ] Sell items (with gold preview)

### Quest Completion Modal
- [ ] Loot reveal animation
- [ ] "New gear!" notification
- [ ] Gold gained display
- [ ] Compare to current equipped

### Create Quest Modal Updates
- [ ] Gear reward override selector
- [ ] Slot dropdown (optional)
- [ ] Preview of potential rewards

### Settings Page
- [ ] Quest type → Gear slot mapping editor
- [ ] Per-type slot assignments (max 3)

---

## Open Questions

1. ~~**Inventory Limit?**~~ ✅ DECIDED
   - **Answer:** Start with 50 slots, unlock more via achievements. Need to add achievement rewards system.

2. ~~**Gear Comparison?**~~ ✅ DECIDED
   - **Answer:** Show comparison tooltip on hover, but no auto-equip.

3. ~~**Salvage/Sell System?**~~ ✅ DECIDED
   - **Answer:** Sell for gold. Gold buys consumables.

4. ~~**Set Bonuses?**~~ ✅ DECIDED
   - **Answer:** Project folder-based sets. See "Set Bonuses" section above.

5. ~~**Gear Degradation?**~~ ✅ DECIDED
   - **Answer:** No degradation - too punishing for task gamification.

---

## Implementation Order

> [!CAUTION]
> **Step 0 is CRITICAL** - We're modifying Character data structure.
> Must handle migration to avoid breaking existing user saves.

0. **Migration safety** - Update `characterStore` to initialize `gearInventory: []` and `gold: 0` if missing from saved data
1. **Data models** - `GearItem`, `GearSlot`, `GearTier`, `LootReward` types
2. **Gold system** - Add to Character, display in UI
3. **Starter gear** - Assign to new characters
4. **Loot generation service** - Roll tiers, stats, slots
5. **Quest completion integration** - Drop gear + gold on quest complete
6. **Character sheet UI** - Display equipped gear + gold
7. **Inventory UI** - View/equip/unequip/sell
8. **Settings UI** - Quest type remapping
9. **Quest modal update** - Override rewards

---

## Related Documents

- [[Fight System]] - Gear affects combat stats
- [[Exploration System]] - Loot from dungeons

---

*Last Updated: 2026-01-23*
