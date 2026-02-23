/**
 * Seed script: Adds test accessories and consumables to data.json
 * for Phase 5 manual testing of the Accessories feature.
 * 
 * Run: node scripts/seed-test-accessories.js
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = 'C:/Quest-Board-Test-Vault/.obsidian/plugins/quest-board/data.json';

// Read current data
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Helper: create a GearItem from accessory template data
function createAccessory(id, name, templateId, slot, tier, level, stats, sellValue, emoji) {
    return {
        id,
        name,
        description: `TEST: ${name} — see ability via templateId lookup`,
        slot,
        tier,
        level,
        stats,
        sellValue,
        iconEmoji: emoji,
        source: 'quest',
        acquiredAt: new Date().toISOString(),
        templateId,
    };
}

// 8 new accessories to add
const newAccessories = [
    createAccessory(
        'test-windrunners-anklet-001',
        "Windrunner's Anklet",
        'windrunners_anklet',
        'accessory3',
        'journeyman',
        30,
        { primaryStat: 'dexterity', primaryValue: 10 },
        80,
        '🔮'
    ),
    createAccessory(
        'test-guardians-talisman-001',
        "Guardian's Talisman",
        'guardians_talisman',
        'accessory1',
        'journeyman',
        30,
        { primaryStat: 'constitution', primaryValue: 10, secondaryStats: { dexterity: 4 } },
        80,
        '📿'
    ),
    createAccessory(
        'test-phoenix-feather-001',
        'Phoenix Feather',
        'phoenix_feather',
        'accessory3',
        'legendary',
        30,
        { primaryStat: 'constitution', primaryValue: 6 },
        200,
        '🔮'
    ),
    createAccessory(
        'test-streak-shield-charm-001',
        'Streak Shield Charm',
        'streak_shield_charm',
        'accessory3',
        'master',
        30,
        { primaryStat: 'charisma', primaryValue: 4, secondaryStats: { wisdom: 4 } },
        120,
        '🔮'
    ),
    createAccessory(
        'test-blacksmiths-favor-001',
        "Blacksmith's Favor",
        'blacksmiths_favor',
        'accessory2',
        'master',
        30,
        { primaryStat: 'strength', primaryValue: 6 },
        120,
        '💍'
    ),
    createAccessory(
        'test-vampires-fang-001',
        "Vampire's Fang",
        'vampires_fang',
        'accessory1',
        'journeyman',
        30,
        { primaryStat: 'strength', primaryValue: 8, secondaryStats: { dexterity: 4 } },
        80,
        '💍'
    ),
    createAccessory(
        'test-toxic-fang-charm-001',
        'Toxic Fang Charm',
        'toxic_fang_charm',
        'accessory3',
        'master',
        30,
        { primaryStat: 'dexterity', primaryValue: 6 },
        120,
        '🔮'
    ),
    createAccessory(
        'test-taxmans-ring-001',
        "Taxman's Ring",
        'taxmans_ring',
        'accessory2',
        'journeyman',
        30,
        { primaryStat: 'intelligence', primaryValue: 6, secondaryStats: { charisma: 6 } },
        80,
        '💍'
    ),
];

// Check for duplicates before adding
const existingIds = new Set(data.character.gearInventory.map(g => g.id));
const existingTemplates = new Set(data.character.gearInventory.filter(g => g.templateId).map(g => g.templateId));

let addedCount = 0;
for (const acc of newAccessories) {
    if (existingIds.has(acc.id)) {
        console.log(`SKIP (id exists): ${acc.name}`);
        continue;
    }
    if (acc.templateId && existingTemplates.has(acc.templateId)) {
        console.log(`SKIP (templateId "${acc.templateId}" exists): ${acc.name}`);
        continue;
    }
    data.character.gearInventory.push(acc);
    addedCount++;
    console.log(`ADDED: ${acc.name} (${acc.templateId})`);
}

// Add Phoenix Tear to consumable inventory if not present
const hasTear = data.inventory.some(i => i.itemId === 'phoenix-tear');
if (!hasTear) {
    data.inventory.push({
        itemId: 'phoenix-tear',
        quantity: 2,
        acquiredDate: new Date().toISOString(),
    });
    console.log('ADDED: Phoenix Tear ×2 to consumable inventory');
} else {
    console.log('SKIP: Phoenix Tear already in consumable inventory');
}

// Write back
fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

console.log(`\nDone! Added ${addedCount} accessories.`);
console.log(`Gear inventory now has ${data.character.gearInventory.length} items.`);
console.log(`Consumable inventory now has ${data.inventory.length} items.`);
