# Dragon Keys

A typing game for kids. You hatch a dragon egg, then fly your dragon through 28 levels that teach touch typing a few keys at a time. Stars and coins buy snacks, outfits and furniture for the dragon's den.

## Play

Open `index.html` in Chrome, Edge, Firefox or Safari. That one file is the whole game. It needs no install, no internet and no account, and it needs a real keyboard.

Progress is saved in the browser on that computer. Using a different browser, a private window, or clearing site data starts a fresh game.

## What it teaches

| World | Levels | Keys |
|---|---|---|
| 1. Sunny Meadow | 6 | Home row: F J, D K, S L, A ;, G H |
| 2. Sky Peaks | 6 | Top row: E I, R U, T Y, W O, Q P |
| 3. Crystal Cave | 6 | Bottom row: V M, C comma, B N, X full stop, Z slash |
| 4. Castle Kingdom | 4 | Shift keys, question mark, apostrophe, sentences |
| 5. Dragon Summit | 6 | Common words, sentences, animal facts, a short story |

A level passes at 90% accuracy. Stars are given at 90%, 95% and 98%. Speed is shown but never blocks progress. The last level of each world is a review, and finishing a world brings a new animal friend into the den.

The "Grown-ups" button in the den shows accuracy and speed over time, the keys she misses most, and settings (sound, unlock every level, erase progress).

## Changing the game

The source is in `src/`. After editing, rebuild the single file with Node:

```bash
node build.js
```

- `src/js/data.js` holds the levels, word list, sentences and shop prices.
- `src/js/content.js` builds the lines for each level.
- `src/js/art.js` and `src/js/scene.js` draw the characters and the backgrounds.
- `src/js/level.js` is the typing level itself.

## Credits

Fonts: Fredoka and Atkinson Hyperlegible, both under the SIL Open Font License (see `src/fonts/`). All artwork and sound effects are generated in code.
