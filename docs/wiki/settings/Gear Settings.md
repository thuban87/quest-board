# Gear Settings

Configure how loot drops and gear sets work in Quest Board.

---

## Quest → Gear Slot Mapping

Control which gear slots can drop when completing different quest types.

### Default Mappings

| Quest Type | Slots |
|------------|-------|
| **Main** | Chest, Weapon, Head |
| **Side** | Legs, Boots, Shield |
| **Training** | Head, Shield |
| **Guild** | Chest, Legs |
| **Recurring** | Boots, Accessory1 |
| **Daily** | (no gear) |

### How It Works

1. When you complete a quest, the **folder name** determines quest type
2. The plugin rolls for a gear drop based on quest difficulty
3. If a drop occurs, it picks a **random slot** from the type's slot list
4. Gear tier is influenced by quest difficulty

### Editing Mappings

1. Open Settings → Quest Board
2. Find **Quest → Gear Slot Mapping** section
3. Edit existing types inline (comma-separated slots)
4. Available slots: `head`, `chest`, `legs`, `boots`, `weapon`, `shield`, `accessory1`, `accessory2`, `accessory3`

### Adding Custom Quest Types

1. Scroll to **Add Custom Quest Type**
2. Enter the folder name (e.g., `fitness`)
3. Enter desired slots (e.g., `legs, boots, accessory1`)
4. Click **Add**

The mapping takes effect immediately for all future drops.

> [!TIP]
> Match slots to thematic content! Fitness quests → legs/boots, creative quests → accessory, combat prep → weapon/shield.

### Disabling Drops

To prevent a quest type from dropping gear, leave the slots field empty.

**Example:** Daily quests have no slots by default, so completing them never drops gear.

---

## Difficulty and Loot Quality

Quest difficulty affects **gear tier chances**:

| Difficulty | Typical Tier Range |
|------------|--------------------|
| Trivial | No drops |
| Easy | Common (occasionally Uncommon) |
| Medium | Common to Rare |
| Hard | Uncommon to Epic |
| Epic | Rare to Legendary |

> [!NOTE]
> Higher difficulty also increases the **chance** of a drop occurring, not just the quality.

---

## Set Bonus Configuration

Gear from specific quest folders can form **sets** with AI-generated bonuses.

### Excluded Set Folders

| Setting | Default |
|---------|---------|
| Excluded Folders | `main, side, training, recurring, daily` |

Folders in this list **do not form gear sets**. Gear dropped from excluded folders has no set membership.

### Why Exclude?

Generic quest types like "main" and "side" would create meaningless sets. By excluding them, only **thematic folders** (e.g., `fitness`, `work`, `study`) form sets.

### Creating a Set

1. Create a quest folder (e.g., `fitness/`)
2. Add quests to that folder
3. Complete quests to earn gear
4. Gear shows "Fitness Set" as its set name
5. Equip multiple pieces for AI-generated set bonuses

### Set Bonus Examples

The plugin uses Gemini AI to generate thematic bonuses:

| Set | 2-Piece | 4-Piece |
|-----|---------|---------|
| **Fitness** | +5% Constitution | +10% Max HP |
| **Study** | +5% Intelligence | +15% XP from study quests |
| **Work** | +5% Strength | +10% gold from bounties |

> [!NOTE]
> Set bonuses are **cached** after generation. Clear the cache in Debug settings to regenerate.

---

## The Nine Gear Slots

| Slot | Primary Stats | Notes |
|------|---------------|-------|
| **Head** | Defense, Wisdom | Helmets, crowns, hoods |
| **Chest** | Defense, Constitution | Armor pieces |
| **Legs** | Defense, Dexterity | Leg armor |
| **Boots** | Dexterity, Dodge | Footwear |
| **Weapon** | Attack, Crit | Main hand |
| **Shield** | Block, Defense | Off-hand defense |
| **Accessory1** | Varies | Ring, amulet |
| **Accessory2** | Varies | Ring, amulet |
| **Accessory3** | Varies | Ring, amulet |

---

## Smelting System

Combine gear at the Blacksmith:

1. Select **3 items of the same tier**
2. Smelt them into **1 item of the next tier**
3. If all 3 items are the **same type** (e.g., all boots), output is guaranteed to be that type
4. Otherwise, output type is random

> [!TIP]
> Hoard gear you can't use! Plate-wearing Warriors can smelt cloth drops to eventually get plate upgrades.

### Future: Smelting Costs

Currently free. Future updates will add gold costs based on tier being smelted.

---

## Loot Drop Rates

### Drop Chance by Difficulty

| Difficulty | Base Drop Chance |
|------------|------------------|
| Trivial | 0% |
| Easy | 25% |
| Medium | 50% |
| Hard | 75% |
| Epic | 90% |

### Tier Distribution

Once a drop occurs, tier is rolled:

| Difficulty | Common | Uncommon | Rare | Epic | Legendary |
|------------|--------|----------|------|------|-----------|
| Easy | 70% | 25% | 5% | 0% | 0% |
| Medium | 45% | 35% | 15% | 5% | 0% |
| Hard | 20% | 35% | 30% | 13% | 2% |
| Epic | 5% | 20% | 35% | 30% | 10% |

### Set Piece Bonus

Gear from thematic folders (not excluded) has a **33% chance** to be a set piece instead of generic gear.

---

## See Also

- [[Settings Overview]] – All settings
- [[Gear & Equipment]] – Complete gear guide
- [[Combat Guide]] – Using gear in battle
- [[Custom Dungeons]] – Dungeon loot biases

---

**Happy looting!** 🎁
