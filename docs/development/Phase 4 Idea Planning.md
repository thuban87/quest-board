# Phase 4 ideas:

-AI generation of custom dungeons. We have the foundation for this set up in that we have a settings menu option to set the dungeon folder (where custom dungeon markdowns are stored) as well as a settings option to create a DUNGEON_FORMAT.md file in the chosen dungeon directory. 

The idea is that users will create their own dungeons in markdown form using the dungeon_format file as a guide, then at next plugin initialization, the plugin will parse the markdown files and create a dungeon object for each one. We'll need to update the dungeon_format.md with the new info we've gleaned during our dungeon making to make it more seamless for users. 

This should happen later in phase 4

-Dungeon bosses.  We need to create new boss monsters that are specifically for boss fights. Need to wire them up appropriately so they're within our guidelines in the battle formulas. We will likely create a few different levels of boss, easy, medium, high and epic. They'll be at different levels and have different stats. One way we could alter the difficulty withou altering the formulas is to set bosses in some dungeons to be a higher level than the dungeon. 

-Raids.  We need to create some new raids that consist of the following:
    -Regular dungeon mobs
    -A few boss monsters as "phase" markers throughout the raid.
    -A final boss at the end of the raid. The real raid boss. Similar setup as the dungeon bosses but harder. Already have the formula for this figured out

-AI generation of quests. We could have users enter their list of todos into a modal with things fields like desscription, objectives, rewards, etc. Then we could use that to generate a quest markdown file. 

- **Level Tier Transitions** ✅ | Animate sprite change when crossing tier boundary | Levels 5→6, 12→13, 17→18, 24→25 |

    -The above levels are not accurate anymore. We need to confirm new tier system and make sure it's in place across the plugin for this to work

- **Dual-Class Unlock** | At Level 25, unlock secondary class selection | Modal, XP bonus, visual blending |

    **Dual-Class Visual** | Blend sprites from both classes | Secondary class element added to sprite |
    -Could do the visuals with a sub to 0the pixel art ai site. Would take a considerable amount of setup but could be worth doing.

- **Class Change System** | Command to change class, costs XP formula | Modal showing cost, confirmation |

    -This should be early in the phase 4 timeline

- **Progressive Quest Reveal** | Hide future milestones/tasks until reached | Update as quest progresses |

    -This is partially implemented. We can limit tasks per section to a certain number and hide the rest. Would need to also add an option to hide sections that are ahead of the current one. 
    -Should be done early in phase 4

- **Weekly Sprint View** | Dedicated view showing weekly progress with character sprite | Switch Board/Sheet/Sprint |

    **Sprint Progress Bars** | Visual bars per category showing goal vs actual | Class-colored bars |

- **Daily Note Integration** | Append completed quests to daily note | Configurable template |

- **Export Stats** | Generate formatted text for sharing | Include character name/class |

- **Advanced Settings** | Character re-customization, API key management, all other settings | Full control panel |

- **Import/Export** | Export all quests and character data, import from backup | Safety net |

- **React UI Polish** | Smooth animations, transitions, hover effects, React.memo on all cards/columns | Use CSS transitions |

- ### High Priority: Skill Trees
- Quest dependencies (unlock quests by completing prerequisites)
- Visual tree/graph showing locked/unlocked paths
- Example: "Learn React Basics" unlocks "Build Quest Board" + "Build Portfolio Site"
- Strategic planning layer for quest selection
- Encourages long-term goal setting

    -I had a different thing in mind for skill trees but I'm curious what you think of this way of doing it. I feel like I'm getting away from the core purpose of this app (productivity) in favor of playing games. So my way was purely a game-based idea where you unlock skills that enhance your stats, give new moves, etc, but that's all gameplay related. We need to add more features taht enhance the core point of all of this so I'm intrigued by the above suggestion. It would require either AI quest generation or a detailed quest chain made by the user

- Party system: Different han what I had listed before. Iw ant this one to be a per-character party, similar to final fantasy, where you get 2-4 party members that you collect through various means and they fight with you. We'd have to implement parties for monsters first probably, otherwise our party will just be decimating things. 
    -Make two party system: Monster parties and palyer parties. 
    -Can get party memebrs by various methods
    -Look in docs\Party System - Early Planning.md for preliminary planning
    -Should be phase 5 more than likely

- Skills: This is a MAJOR one and should be done sooner rather than later. This is adding actual moves to characters, like slash for warriro, holy light for paladin, etc. These moves should be relient on mana to use, so we'll need to figure out a good system for managing mana. Skills should be chosen from a pool at certain levels so you gain more skills as you grow. And then at end game you can somehow gain access tot he skills you passed up along the way or something. Should be implemented early in phase 4 as it's foundational for some other things like dual class and party members

- AI diversity: Allow for claude and openai API keys/usage in lieue of gemini only. Allows for paid, potentially better choices

- Analytics dashboard (historical trends, completion rates, XP over time)

- Equipment upgrade system (improve gear through quests)
    -Worth looking at. Unsure how we'd implement this but it's producitivty forwward which we need more of

- Quest voting system (community-created quests)
    -Could be an interesting way to start a mmo type gameplay. An easier way to test the waters of cross-vault cooperation/competition

- Boss Fights
- **Quest-based bosses**: Designate a quest as a "Boss Fight" when it meets criteria:
  - Minimum 10 tasks
  - At least 2 nested/sub-tasks
  - Optional: specific category or priority
- **Boss assignment**: Quest complexity maps to boss tier/type
- **Extended combat**: Boss has more HP, special attacks, multiple phases
- **Same multiplier mechanic**: Complete quest tasks → stronger attacks against boss

