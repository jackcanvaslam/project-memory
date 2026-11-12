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

A level passes at 90% accuracy. Stars are given at 90%, 95% and 98%. Speed is shown but never blocks progress. The last level of each world is a review.

## Flow and music

A run of correct keys builds "flow", shown as a bar at the top of a level. Flow drives two things together:

- **The picture.** The scene speeds up, streaks and glow build, and a wrong key makes the world stutter and flash.
- **The music.** Each world has its own theme, tempo and key. Layers come in as flow rises: pad, then arpeggio, bass, hats, kick, snare and finally the lead tune. Each correct key plays the next note up in the chord that is sounding. A wrong key plays a low falling note, muffles the mix for about a second and drops layers out.

## Combat

Enemies ride the words of the lesson, so the text she types is unchanged. Finishing a word destroys the enemy carrying it, and the last level of each world is a boss whose life drops with every finished word.

- **Life.** The dragon has five points. One slip on a word is a warning. A second slip on the same word, or three slips close together, lets the enemy strike. Every 20 correct keys in a row heals one point.
- **Knocked back.** At zero life the enemies leave and she finishes the text, but the run is capped at one star.
- **Mana and powers.** Correct keys fill the mana bar. When it is full, Enter opens the power menu and typing a power's word casts it. Fire breath burns the three nearest enemies, Shield (after World 1) blocks two hits, and Time slow (after World 2) freezes enemies for eight seconds. A wrong key in the word fizzles the cast and keeps half the mana.
- **Difficulty**, set in the lair or on the Stats screen:
  - Calm has no enemies.
  - Normal has enemies from level 4, and they strike only for mistakes.
  - Fierce has enemies from level 1, adds a time limit per word and pays 25% more shards.

## The dragon

Stars make the dragon grow through four sizes. Shards collected in flight buy skins, trails and crests in the Forge, and finishing each world wins one that cannot be bought.

The Stats screen shows accuracy and speed over time, the keys missed most, and settings (music, sound, unlock every level, erase progress).

## Changing the game

The source is in `src/`. After editing, rebuild the single file with Node:

```bash
node build.js
```

- `src/js/data.js` holds the levels, word list, sentences, skins, trails and crests.
- `src/js/content.js` builds the lines for each level.
- `src/js/audio.js` is the music and sound engine. Each world's theme is a small table near the top.
- `src/js/combat.js` holds the enemies, life and mana rules, powers and bosses.
- `src/js/dragon.js` draws and animates the dragon. `src/js/scene.js` draws the skies.
- `src/js/level.js` is the typing level itself.

## Credits

Fonts: Exo 2 and JetBrains Mono, both under the SIL Open Font License (see `src/fonts/`). All artwork, music and sound effects are generated in code.
