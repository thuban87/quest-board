Recommended Order
1. 🧠 Finish the foundational brainstorming first (Doc 1 — World & Kingdoms)
The remaining open decisions here — ruler names, which kingdoms align to which endgame paths — ripple into everything else. Dialogue references rulers by name. Kingdom intros reference their philosophy. The betrayal story beat depends on knowing which leaders are power-hungry. This is a short brainstorming session, not a big lift, but it unblocks all the writing work.

2. 🔧 Knock out the pre-implementation code tasks (Doc 5 — Planning section)
The 5 must-do tasks: add Automaton monsters, add monster category field, verify dungeon tracking, design the Collectibles tab, design Kingdom Selection modal. These are small, independent code tasks that don't depend on written dialogue but ARE dependencies for the story system. Classic "unblock the critical path" work.

3. 🏗️ Build the dialogue delivery system with ONE real example (Doc 3)
This is the key insight: build the StoryDialogueModal, the DialogueEntry interfaces, the data folder structure, and the trigger system — but test it with just the Starholm kingdom intro. One real piece of dialogue, end-to-end. This lets you:

See how the modal feels before writing 70+ entries
Validate the data structure works
Test the Lore Codex logging
Discover formatting issues early
Writing 775 lines of dialogue blind and hoping it reads well in the modal is risky. Writing the code with pure placeholder text means you never feel the tone. One real example gives you both.

4. ✍️ Write the story content (Doc 2 + Doc 3 content)
Now you write the bulk of the dialogue — kingdom intros, phase transitions, rival encounters, oracle commentary, story beats. You already know what the modal looks like, how much text fits, and how the flow feels. This is the big creative push (~6-20 hours of writing). Having the working system in front of you while you write makes a huge difference.

5. 📋 Fill in quest content pools (Doc 5) and remaining balance work (Doc 4)
Plug in the real-world quest pool (already 30/50 done), assign kingdom quest variants to phase transitions, and tackle the balance questions (guild gear stats, shop prices, title boosts — probably needs playtesting by then).