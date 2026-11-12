# Dragon Keys

A typing game. You hatch a dragon, then fly it through 28 levels that teach touch typing a few keys at a time. The look is dark and neon, the dragon's body moves by physics, and the music is generated live and follows how well you type.

## Play

Open `index.html` in Chrome, Edge, Firefox or Safari. That one file is the whole game. It needs no install, no internet and no account, and it needs a real keyboard.

Sound starts after the first key press or click, because browsers block audio before that. Music and sound effects have separate buttons in the top right of every screen.

Progress is saved in the browser on that computer. Using a different browser, a private window, or clearing site data starts a fresh game.

## What it teaches

| World | Levels | Keys |
|---|---|---|
| 1. Moonlit Meadow | 6 | Home row: F J, D K, S L, A ;, G H |
| 2. Sky Peaks | 6 | Top row: E I, R U, T Y, W O, Q P |
| 3. Crystal Cave | 6 | Bottom row: V M, C comma, B N, X full stop, Z slash |
| 4. Night Citadel | 4 | Shift keys, question mark, apostrophe, sentences |
| 5. Dragon Summit | 6 | Common words, sentences, animal facts, a short story |

A level passes at 90% accuracy. Stars are given at 90%, 95% and 98%. Speed is shown but never blocks progress. The last level of each world reviews its keys.

## Missions

Every level is a mission: a scene across the sky that the dragon builds as she types. Each finished word lights one more piece (a plank of a bridge, a star on a trail, a flower, a ring of an engine), and finishing the level plays a short ending. Each level has two stories, which alternate each time it is played. "Swap story" on the start card, or the Tab key, picks the other one.

The last level of each world is its finale: a boss fight, described under Combat.

## Getting to the typing quickly

From the lair, Enter then Space starts the next mission. Before the first flight of each day there is a short F and J warm-up (eight taps, or "Skip today").

Progress inside a level is saved as she types, so closing the browser mid-level loses nothing. The lair then offers "Resume mission".

## Finger hints that fade

The bar above the keyboard names the finger and the reach for the next key ("Reach from F to R, then return to F"). For each key she has typed at least 20 times with no more than 6% misses, the hint stays quiet so her eyes stay on the text. It comes back if she pauses for a second and a half or slips. "Always show finger hints" on the Stats screen turns the fading off.

## Racing her best run

Once a level has been passed, a faint dragon marked "your best" flies her quickest passing run again. If it is ahead of her dragon, she is behind her best pace. There is no timer and it cannot cost stars. The results screen says how the run compared.

## Typing in the lair

Typing a word in the lair makes the dragon do something: `dash`, `flash` and `fire` from the start, `loop`, `heart` and `ribbon` as missions are completed, and the dragon's own name. Nothing is scored.

## Flow and music

A run of correct keys builds "flow", shown as a bar at the top of a level. Flow drives two things together:

- **The picture.** The scene speeds up and the glow builds.
- **The music.** Each world has its own theme, tempo and key. Layers come in as flow rises: pad, then arpeggio, bass, hats, kick, snare and finally the lead tune. Each correct key plays the next note up in the chord that is sounding. A wrong key plays a low falling note and muffles the mix for about a second.

## Combat

Each world ends with a boss. Every finished word hurts it. Any other level can be replayed as an optional battle once it has been passed, with enemies riding the words.

- **Life.** The dragon has five points. Slips at two different places in one word let the enemy strike. Every 20 correct keys in a row heals one point.
- **Knocked back.** At zero life the enemies leave and she finishes the text. Battle damage never costs stars, which depend on accuracy alone.
- **Mana and powers.** Correct keys fill the mana bar. When it is full, Enter opens the power menu and typing a power's word casts it. Fire breath burns the three nearest enemies, Shield (after World 1) blocks two hits, and Time slow (after World 2) freezes enemies for eight seconds.
- **Difficulty**, set on the Stats screen:
  - Calm has no enemies and no bosses.
  - Normal has a boss at the end of each world and optional battles elsewhere, with no timer.
  - Fierce is the same, but enemies also strike if a word takes too long, and it pays 25% more shards.

## If a level is not passed

A level needs 90% accuracy. Below that, she gets a short practice made from the keys and words she slipped on. Passing it earns one star and moves her on, and the full level can be replayed any time for two or three.

## The dragon

Stars make the dragon grow through four sizes. Shards buy skins, trails and crests in the Forge, and finishing each world wins one that cannot be bought.

The Stats screen shows accuracy and speed over time, the keys missed most, settings, and buttons to download a backup of the save and to restore one.

## Changing the game

The source is in `src/`. After editing, rebuild the single file with Node:

```bash
node build.js
```

- `src/js/data.js` holds the levels, word list, sentences, skins, trails and crests.
- `src/js/content.js` builds the lines for each level.
- `src/js/audio.js` is the music and sound engine. Each world's theme is a small table near the top.
- `src/js/missions.js` draws the mission scenes and holds their stories.
- `src/js/combat.js` holds the enemies, life and mana rules, powers and bosses.
- `src/js/dragon.js` draws and animates the dragon. `src/js/scene.js` draws the skies.
- `src/js/level.js` is the typing level itself.

## Credits

Fonts: Exo 2 and JetBrains Mono, both under the SIL Open Font License (see `src/fonts/`). All artwork, music and sound effects are generated in code.
