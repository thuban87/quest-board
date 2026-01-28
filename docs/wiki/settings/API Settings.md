# API Settings

Configure Gemini AI integration for enhanced Quest Board features.

---

## Overview

Quest Board uses **Google's Gemini API** for AI-powered features:

| Feature | Description | Required? |
|---------|-------------|-----------|
| Bounty Descriptions | Narrative flavor text for monster encounters | Optional |
| Set Bonus Generation | Thematic equipment set bonuses based on folder names | Optional |
| Quest Generation | (Coming soon) Convert task lists to quest files | Future |

> [!IMPORTANT]
> **AI is entirely optional.** The plugin works fully without an API key. AI features simply use fallback content or skip generation.

---

## Getting a Gemini API Key

1. Visit [makersuite.google.com](https://makersuite.google.com)
2. Sign in with your Google account
3. Click **Get API Key** or **Create API Key**
4. Copy the generated key (starts with `AI...`)
5. Paste into Quest Board settings

### Free Tier Limits

Gemini's free tier is **extremely generous** for Quest Board's usage:

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Tokens per day | 1,500,000+ |

Quest Board caches all AI responses, so you'll rarely hit these limits during normal use.

---

## Configuring the API Key

1. Open Obsidian Settings (`Ctrl/Cmd + ,`)
2. Navigate to **Quest Board**
3. Find **AI Integration** section
4. Paste your API key into the field

The key is stored securely via Obsidian's plugin data system and **never leaves your vault**.

> [!NOTE]
> The key field shows as a password field (dots) for privacy. Your key is saved automatically.

---

## AI-Powered Features

### Bounty Descriptions

When a bounty triggers, the AI generates a short narrative:

> *"A hulking Cave Troll emerges from the shadows, drawn by the completion of your administrative conquest..."*

**Without API key:** Generic descriptions are used.

### Set Bonus Generation

When you equip gear from a thematic folder (e.g., `fitness/`), the AI generates set bonuses:

- **2-piece:** +5% Constitution
- **4-piece:** +10% Max HP, +5% damage resistance

**Without API key:** Default bonuses based on folder name heuristics.

---

## Testing Your Configuration

### Test Set Bonus Generation

1. Open Settings → Quest Board
2. Scroll to **🧪 Gemini AI Testing**
3. Enter a set name (e.g., `Fitness`)
4. Click **Generate**
5. Results appear in an alert (and console)

**Success example:**
```
✅ Generated bonuses for "Fitness":
(2) +5% Constitution
(4) +10% Max HP, +5% Physical Resistance
```

**Failure example:**
```
❌ Generation failed:
API key invalid or rate limit exceeded
```

### Cache Status

Click **Show Status** to see:
- How many sets are cached
- Which set IDs exist
- Pending generations

---

## Cache Management

AI responses are **cached** to minimize API calls and ensure consistency.

### When to Clear Cache

- Testing new set names
- Regenerating bonuses after changes
- Troubleshooting display issues

### How to Clear

1. Settings → Quest Board → Debug
2. Click **Clear Set Bonus Cache**
3. Note: Keeps the first entry for comparison

> [!TIP]
> Clearing cache doesn't affect equipped gear—bonuses regenerate on next equip.

---

## Bounty Description Cache

Bounty descriptions are also cached:

| Behavior | Description |
|----------|-------------|
| **Burn-on-use** | Each description is used once, then removed |
| **Pre-generation** | AI generates multiple descriptions per folder |
| **Fallback** | If cache is empty, uses template descriptions |

The cache populates automatically during gameplay.

---

## Troubleshooting

### API Key Not Working

1. Verify key is complete (no extra spaces)
2. Check key hasn't expired or been revoked
3. Ensure you're under free tier limits
4. Test with **Test Set Bonus Generation**

### No AI Content Appearing

1. Check API key is configured
2. Try clearing cache and regenerating
3. Check console for error messages (`Ctrl/Cmd + Shift + I`)

### Rate Limiting

If you see rate limit errors:
- Wait a minute and try again
- Reduce testing frequency
- Normal gameplay rarely triggers limits

---

## Privacy and Security

| Concern | Protection |
|---------|------------|
| API key storage | Obsidian plugin data (encrypted at rest on some platforms) |
| Data sent to API | Only set names and quest folder names |
| No personal data | Quest content and task text are never sent |
| Local caching | Reduces external calls |

---

## Future AI Features

### Quest Generation (Phase 4)

Convert bullet lists into properly formatted quest files:

1. Paste a task list
2. AI structures it as a quest
3. Frontmatter auto-generated
4. Linked task file created

### AI Dungeon Generation (Phase 4)

Describe a dungeon concept, and AI generates:
- Room layouts
- Monster placement
- Loot distribution
- Narrative elements

---

## See Also

- [[Settings Overview]] – All settings
- [[Combat Guide]] – Bounty system details
- [[Gear & Equipment]] – Set bonuses

---

**AI enhances but never blocks gameplay.** Everything works without it! 🤖
