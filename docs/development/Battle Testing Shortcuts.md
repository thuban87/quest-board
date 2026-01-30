# Battle Testing Shortcuts

Quick reference for artificially leveling characters and equipping appropriate gear for balance testing.

---

## Editing data.json

1. **Close Obsidian** (or hot-reload won't pick up changes)
2. Open: `C:\Quest-Board-Test-Vault\.obsidian\plugins\quest-board\data.json`
3. Find the `"character"` object
4. Edit `totalXP` and `level` fields, and add gear to `equippedGear`
5. Save and reopen Obsidian

---

## XP Thresholds by Level

Set `totalXP` to the value below and update `level` to match:

### Tier 1: Acolyte (L1-8)
| Level | Total XP | For Quick Test |
|-------|----------|----------------|
| 1 | 0 | Use 0 |
| 5 | 2,360 | Use 2400 |
| 8 | 4,760 | Use 4800 |

### Tier 2: Squire (L9-16)
| Level | Total XP | For Quick Test |
|-------|----------|----------------|
| 10 | 6,860 | Use 6900 |
| 15 | 13,860 | Use 13900 |
| 16 | 15,560 | Use 15600 |

### Tier 3: Knight (L17-24)
| Level | Total XP | For Quick Test |
|-------|----------|----------------|
| 17 | 17,160 | Use 17200 |
| 20 | 22,680 | Use 22700 |
| 24 | 31,720 | Use 31750 |

### Tier 4: Champion (L25-32)
| Level | Total XP | For Quick Test |
|-------|----------|----------------|
| 25 | 33,920 | Use 34000 |
| 30 | 47,020 | Use 47050 |
| 32 | 53,240 | Use 53250 |

### Tier 5: Divine Avatar (L33-40)
| Level | Total XP | For Quick Test |
|-------|----------|----------------|
| 33 | 56,340 | Use 56400 |
| 35 | 63,020 | Use 63050 |
| 40 | 82,520 | Use 82550 |

---

## Setting Character Level

In `data.json`, find the `"character"` object and set:

```json
{
  "character": {
    "totalXP": 22700,
    "level": 20,
    // ... rest of character
  }
}
```

---

## Level-Appropriate Gear Sets

Copy the entire `equippedGear` block for your test level.

### Level 10 Gear (Tier 2 - Adept/Journeyman Mix)

```json
"equippedGear": {
  "head": {
    "id": "test-head-10",
    "name": "Squire's Helm",
    "description": "A sturdy training helm.",
    "slot": "head",
    "armorType": "mail",
    "tier": "adept",
    "level": 10,
    "stats": { "primaryStat": "vitality", "primaryValue": 35, "defense": 15 },
    "sellValue": 35,
    "iconEmoji": "🪖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "chest": {
    "id": "test-chest-10",
    "name": "Squire's Breastplate",
    "description": "Reliable protection.",
    "slot": "chest",
    "armorType": "mail",
    "tier": "journeyman",
    "level": 10,
    "stats": { "primaryStat": "vitality", "primaryValue": 50, "defense": 25 },
    "sellValue": 60,
    "iconEmoji": "🎽",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "legs": {
    "id": "test-legs-10",
    "name": "Squire's Greaves",
    "description": "Solid leg protection.",
    "slot": "legs",
    "armorType": "mail",
    "tier": "adept",
    "level": 10,
    "stats": { "primaryStat": "vitality", "primaryValue": 30, "defense": 12 },
    "sellValue": 35,
    "iconEmoji": "👖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "boots": {
    "id": "test-boots-10",
    "name": "Squire's Boots",
    "description": "Quick on your feet.",
    "slot": "boots",
    "armorType": "leather",
    "tier": "adept",
    "level": 10,
    "stats": { "primaryStat": "agility", "primaryValue": 25, "dodgeChance": 3 },
    "sellValue": 35,
    "iconEmoji": "🥾",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "weapon": {
    "id": "test-weapon-10",
    "name": "Training Sword",
    "description": "A balanced blade.",
    "slot": "weapon",
    "weaponType": "sword",
    "tier": "journeyman",
    "level": 10,
    "stats": { "primaryStat": "strength", "primaryValue": 40, "attackPower": 20, "critChance": 5 },
    "sellValue": 60,
    "iconEmoji": "⚔️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "shield": {
    "id": "test-shield-10",
    "name": "Iron Buckler",
    "description": "A reliable shield.",
    "slot": "shield",
    "weaponType": "shield",
    "tier": "adept",
    "level": 10,
    "stats": { "primaryStat": "vitality", "primaryValue": 20, "defense": 10, "blockChance": 8 },
    "sellValue": 35,
    "iconEmoji": "🛡️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory1": null,
  "accessory2": null,
  "accessory3": null
}
```

---

### Level 20 Gear (Tier 3 - Journeyman/Master Mix)

```json
"equippedGear": {
  "head": {
    "id": "test-head-20",
    "name": "Knight's Helm",
    "description": "A helm worn by seasoned knights.",
    "slot": "head",
    "armorType": "plate",
    "tier": "journeyman",
    "level": 20,
    "stats": { "primaryStat": "vitality", "primaryValue": 70, "defense": 30 },
    "sellValue": 80,
    "iconEmoji": "🪖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "chest": {
    "id": "test-chest-20",
    "name": "Knight's Cuirass",
    "description": "Heavy plate chest armor.",
    "slot": "chest",
    "armorType": "plate",
    "tier": "master",
    "level": 20,
    "stats": { "primaryStat": "vitality", "primaryValue": 100, "defense": 50 },
    "sellValue": 140,
    "iconEmoji": "🎽",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "legs": {
    "id": "test-legs-20",
    "name": "Knight's Cuisses",
    "description": "Plate armor for the thighs.",
    "slot": "legs",
    "armorType": "plate",
    "tier": "journeyman",
    "level": 20,
    "stats": { "primaryStat": "vitality", "primaryValue": 60, "defense": 25 },
    "sellValue": 80,
    "iconEmoji": "👖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "boots": {
    "id": "test-boots-20",
    "name": "Knight's Sabatons",
    "description": "Armored boots.",
    "slot": "boots",
    "armorType": "plate",
    "tier": "journeyman",
    "level": 20,
    "stats": { "primaryStat": "agility", "primaryValue": 50, "dodgeChance": 5 },
    "sellValue": 80,
    "iconEmoji": "🥾",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "weapon": {
    "id": "test-weapon-20",
    "name": "Knight's Longsword",
    "description": "A masterfully crafted blade.",
    "slot": "weapon",
    "weaponType": "sword",
    "tier": "master",
    "level": 20,
    "stats": { "primaryStat": "strength", "primaryValue": 80, "attackPower": 40, "critChance": 8 },
    "sellValue": 140,
    "iconEmoji": "⚔️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "shield": {
    "id": "test-shield-20",
    "name": "Knight's Kite Shield",
    "description": "A large protective shield.",
    "slot": "shield",
    "weaponType": "shield",
    "tier": "master",
    "level": 20,
    "stats": { "primaryStat": "vitality", "primaryValue": 50, "defense": 25, "blockChance": 12 },
    "sellValue": 140,
    "iconEmoji": "🛡️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory1": {
    "id": "test-acc1-20",
    "name": "Ring of Power",
    "description": "Boosts attack.",
    "slot": "accessory1",
    "tier": "journeyman",
    "level": 20,
    "stats": { "primaryStat": "strength", "primaryValue": 30, "attackPower": 15 },
    "sellValue": 80,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory2": null,
  "accessory3": null
}
```

---

### Level 30 Gear (Tier 4 - Master/Epic Mix)

```json
"equippedGear": {
  "head": {
    "id": "test-head-30",
    "name": "Champion's Crown",
    "description": "A crown of champions.",
    "slot": "head",
    "armorType": "plate",
    "tier": "master",
    "level": 30,
    "stats": { "primaryStat": "vitality", "primaryValue": 120, "defense": 50, "magicDefense": 25 },
    "sellValue": 160,
    "iconEmoji": "🪖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "chest": {
    "id": "test-chest-30",
    "name": "Champion's Aegis",
    "description": "Legendary protection.",
    "slot": "chest",
    "armorType": "plate",
    "tier": "epic",
    "level": 30,
    "stats": { "primaryStat": "vitality", "primaryValue": 165, "defense": 80, "magicDefense": 40 },
    "sellValue": 310,
    "iconEmoji": "🎽",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "legs": {
    "id": "test-legs-30",
    "name": "Champion's Legguards",
    "description": "Heavy plate legs.",
    "slot": "legs",
    "armorType": "plate",
    "tier": "master",
    "level": 30,
    "stats": { "primaryStat": "vitality", "primaryValue": 100, "defense": 40 },
    "sellValue": 160,
    "iconEmoji": "👖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "boots": {
    "id": "test-boots-30",
    "name": "Champion's Greaves",
    "description": "Swift and strong.",
    "slot": "boots",
    "armorType": "plate",
    "tier": "epic",
    "level": 30,
    "stats": { "primaryStat": "agility", "primaryValue": 85, "dodgeChance": 8 },
    "sellValue": 310,
    "iconEmoji": "🥾",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "weapon": {
    "id": "test-weapon-30",
    "name": "Champion's Greatsword",
    "description": "A terrifying blade.",
    "slot": "weapon",
    "weaponType": "sword",
    "tier": "epic",
    "level": 30,
    "stats": { "primaryStat": "strength", "primaryValue": 135, "attackPower": 65, "critChance": 12 },
    "sellValue": 310,
    "iconEmoji": "⚔️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "shield": {
    "id": "test-shield-30",
    "name": "Champion's Bulwark",
    "description": "Ultimate protection.",
    "slot": "shield",
    "weaponType": "shield",
    "tier": "epic",
    "level": 30,
    "stats": { "primaryStat": "vitality", "primaryValue": 80, "defense": 40, "blockChance": 15 },
    "sellValue": 310,
    "iconEmoji": "🛡️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory1": {
    "id": "test-acc1-30",
    "name": "Ring of Might",
    "description": "Pure strength.",
    "slot": "accessory1",
    "tier": "master",
    "level": 30,
    "stats": { "primaryStat": "strength", "primaryValue": 50, "attackPower": 25 },
    "sellValue": 160,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory2": {
    "id": "test-acc2-30",
    "name": "Amulet of Vitality",
    "description": "Boosts HP.",
    "slot": "accessory2",
    "tier": "master",
    "level": 30,
    "stats": { "primaryStat": "vitality", "primaryValue": 60 },
    "sellValue": 160,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory3": null
}
```

---

### Level 40 Gear (Tier 5 - Epic/Legendary Mix)

```json
"equippedGear": {
  "head": {
    "id": "test-head-40",
    "name": "Divine Avatar's Diadem",
    "description": "Crown of the divine.",
    "slot": "head",
    "armorType": "plate",
    "tier": "legendary",
    "level": 40,
    "stats": { "primaryStat": "vitality", "primaryValue": 200, "defense": 80, "magicDefense": 60 },
    "sellValue": 580,
    "iconEmoji": "🪖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z",
    "isLegendary": true
  },
  "chest": {
    "id": "test-chest-40",
    "name": "Divine Avatar's Vestments",
    "description": "The ultimate protection.",
    "slot": "chest",
    "armorType": "plate",
    "tier": "legendary",
    "level": 40,
    "stats": { "primaryStat": "vitality", "primaryValue": 280, "defense": 120, "magicDefense": 80 },
    "sellValue": 580,
    "iconEmoji": "🎽",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z",
    "isLegendary": true
  },
  "legs": {
    "id": "test-legs-40",
    "name": "Divine Avatar's Legplates",
    "description": "Unbreakable leg armor.",
    "slot": "legs",
    "armorType": "plate",
    "tier": "epic",
    "level": 40,
    "stats": { "primaryStat": "vitality", "primaryValue": 175, "defense": 70 },
    "sellValue": 330,
    "iconEmoji": "👖",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "boots": {
    "id": "test-boots-40",
    "name": "Divine Avatar's Treads",
    "description": "Swift as the wind.",
    "slot": "boots",
    "armorType": "plate",
    "tier": "epic",
    "level": 40,
    "stats": { "primaryStat": "agility", "primaryValue": 140, "dodgeChance": 12 },
    "sellValue": 330,
    "iconEmoji": "🥾",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "weapon": {
    "id": "test-weapon-40",
    "name": "Blade of the Divine",
    "description": "A legendary weapon of immense power.",
    "slot": "weapon",
    "weaponType": "sword",
    "tier": "legendary",
    "level": 40,
    "stats": { "primaryStat": "strength", "primaryValue": 220, "attackPower": 100, "critChance": 18 },
    "sellValue": 580,
    "iconEmoji": "⚔️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z",
    "isLegendary": true
  },
  "shield": {
    "id": "test-shield-40",
    "name": "Aegis of Eternity",
    "description": "An unbreakable barrier.",
    "slot": "shield",
    "weaponType": "shield",
    "tier": "legendary",
    "level": 40,
    "stats": { "primaryStat": "vitality", "primaryValue": 130, "defense": 60, "blockChance": 20 },
    "sellValue": 580,
    "iconEmoji": "🛡️",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z",
    "isLegendary": true
  },
  "accessory1": {
    "id": "test-acc1-40",
    "name": "Signet of the Champion",
    "description": "Raw power incarnate.",
    "slot": "accessory1",
    "tier": "epic",
    "level": 40,
    "stats": { "primaryStat": "strength", "primaryValue": 80, "attackPower": 40, "critChance": 5 },
    "sellValue": 330,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory2": {
    "id": "test-acc2-40",
    "name": "Heart of the Mountain",
    "description": "Endless vitality.",
    "slot": "accessory2",
    "tier": "epic",
    "level": 40,
    "stats": { "primaryStat": "vitality", "primaryValue": 100 },
    "sellValue": 330,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  },
  "accessory3": {
    "id": "test-acc3-40",
    "name": "Sorcerer's Focus",
    "description": "Enhances magic.",
    "slot": "accessory3",
    "tier": "epic",
    "level": 40,
    "stats": { "primaryStat": "intellect", "primaryValue": 80, "secondaryStats": { "wisdom": 40 } },
    "sellValue": 330,
    "iconEmoji": "💍",
    "source": "quest",
    "acquiredAt": "2026-01-30T00:00:00.000Z"
  }
}
```

---

## Quick Character Template

Full example for a Level 20 Paladin:

```json
"character": {
  "id": "test-paladin-20",
  "name": "Test Paladin",
  "class": "paladin",
  "level": 20,
  "totalXP": 22700,
  "gold": 5000,
  "currentHP": 500,
  "maxHP": 500,
  "currentMana": 150,
  "maxMana": 150,
  "stamina": 5,
  "status": "active",
  "isTrainingMode": false,
  "trainingLevel": 10,
  "trainingXP": 900,
  "skills": {
    "unlockedSkillIds": ["meditate", "paladin_holy_strike", "paladin_heal", "paladin_smite", "paladin_shield_of_faith"],
    "equippedSkillIds": ["paladin_holy_strike", "paladin_heal", "paladin_smite", "paladin_shield_of_faith"]
  },
  "schemaVersion": 5,
  "baseStats": {
    "strength": 12,
    "agility": 8,
    "intellect": 10,
    "vitality": 14,
    "wisdom": 10,
    "charisma": 8
  },
  "statBonuses": {},
  "equippedGear": { /* paste L20 gear from above */ },
  "lastSavedAt": "2026-01-30T00:00:00.000Z",
  "lastModified": "2026-01-30T00:00:00.000Z",
  "createdAt": "2026-01-30T00:00:00.000Z"
}
```

---

## Testing Checklist

- [ ] Level 10 (Tier 2) - Early game balance
- [ ] Level 20 (Tier 3) - Mid game balance  
- [ ] Level 30 (Tier 4) - Late game balance
- [ ] Level 40 (Tier 5) - Endgame balance
