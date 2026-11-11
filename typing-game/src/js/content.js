/* Dragon Keys - builds the lines of text for each level */
'use strict';

const Content = (() => {
  const MAXLINE = 28;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const isLetter = ch => /[a-z]/.test(ch);

  const levelIndex = id => LEVELS.findIndex(l => l.id === id);

  /* Every key learned up to and including level index i */
  function keysUpTo(i) {
    let keys = '';
    for (let k = 0; k <= i && k < LEVELS.length; k++) keys += LEVELS[k].keys;
    if (i >= levelIndex('4-1')) keys += 'SHIFT';
    return keys;
  }
  function lettersUpTo(i) {
    return keysUpTo(Math.min(i, levelIndex('3-6'))).replace(/[^a-z]/g, '');
  }
  function wordPool(letters, minLen = 1, maxLen = 9) {
    const ok = new Set(letters);
    return WORD_SET.filter(w => w.length >= minLen && w.length <= maxLen && [...w].every(c => ok.has(c)));
  }

  function wrap(text, max = MAXLINE) {
    const out = []; let line = '';
    for (const w of text.split(' ')) {
      if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
      else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
    return out;
  }

  /* Pick words, favouring ones with the new keys and the keys she misses most */
  function weightedWords(pool, count, favour, weak) {
    const fav = new Set(favour);
    const scored = pool.map(w => {
      let s = 1;
      if ([...w].some(c => fav.has(c))) s += 3;
      for (const c of w) s += (weak[c] || 0) * 2;
      return { w, s };
    });
    const out = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 30) {
      const total = scored.reduce((t, x) => t + x.s, 0);
      let r = Math.random() * total, chosen = scored[0];
      for (const x of scored) { r -= x.s; if (r <= 0) { chosen = x; break; } }
      if (out.length && out[out.length - 1] === chosen.w) continue;
      if (out.includes(chosen.w) && scored.length > count) continue;
      if (out.filter(x => x === chosen.w).length >= 2 && scored.length > 6) continue;
      out.push(chosen.w);
    }
    return out;
  }

  function wordLines(words, lineCount, joiner = ' ', max = 25) {
    const lines = []; let line = '';
    for (const w of words) {
      if (lines.length >= lineCount) break;
      const next = line ? line + joiner + w : w;
      if (next.length > max) { lines.push(line); line = w; } else line = next;
    }
    if (line && lines.length < lineCount) lines.push(line);
    return lines;
  }

  function mixedGroups(newKeys, oldLetters, groups) {
    const letters = [...newKeys].filter(isLetter);
    const punct = [...newKeys].filter(c => !isLetter(c));
    const anchors = oldLetters.length ? [...oldLetters] : letters;
    const out = [];
    for (let g = 0; g < groups; g++) {
      const len = 2 + rnd(2);
      let s = '';
      const mustAt = rnd(len);
      for (let i = 0; i < len; i++) {
        let c = (i === mustAt || Math.random() < 0.35) ? pick(letters.length ? letters : anchors) : pick(anchors);
        if (s.length >= 2 && s[s.length - 1] === c && s[s.length - 2] === c) c = pick(anchors);
        s += c;
      }
      if (punct.length && Math.random() < 0.6) s += pick(punct);
      out.push(s);
    }
    return out.join(' ');
  }

  function decorate(words, p) {
    if (p === ';') return words.map(w => Math.random() < 0.5 ? w + ';' : w);
    if (p === ',') return words.map((w, i) => (i % 4 !== 3) ? w + ',' : w);
    if (p === '.') return words.map((w, i) => (i % 2 === 1) ? w + '.' : w);
    return words;
  }

  function keysLevel(level, idx, weak) {
    const [a, b] = [...level.keys];
    const old = lettersUpTo(idx - 1);
    const all = lettersUpTo(idx);
    const punct = [...level.keys].find(c => !isLetter(c));
    const lines = [
      `${a}${a}${a} ${b}${b}${b} ${a}${a} ${b}${b} ${a}${b}`,
      `${a}${b}${a} ${a}${a}${b} ${b}${a} ${a}${b}${b} ${a}${b}`,
    ];
    if (punct) lines[1] = `${a}${b} ${a}${a}${b} ${a}${b} f${b} j${b} ${a}${b}`;
    const newLetters = [...level.keys].filter(isLetter);
    const pool = wordPool(all, 2, level.world === 1 ? 6 : 7);
    const withNew = pool.filter(w => newLetters.some(c => w.includes(c)));
    lines.push(mixedGroups(level.keys, old, 5));
    if (withNew.length >= 8) {
      const count = level.world === 1 ? 3 : 4;
      let words = shuffle(weightedWords(withNew, 20, newLetters, weak).concat(weightedWords(pool, 10, [], weak)));
      words = words.filter((w, i) => i === 0 || w !== words[i - 1]);
      if (punct) words = decorate(words, punct);
      lines.push(...wordLines(words, count));
    } else {
      lines.push(mixedGroups(level.keys, old, 5));
      lines.push(mixedGroups(level.keys, old, 5));
    }
    if (level.extra) lines.push(...level.extra);
    return lines;
  }

  function reviewLevel(level, idx, weak) {
    const all = lettersUpTo(idx);
    const worldKeys = LEVELS.filter(l => l.world === level.world).map(l => l.keys).join('').replace(/[^a-z]/g, '');
    const pool = wordPool(all, 2, 7);
    let words = weightedWords(pool, 60, worldKeys, weak);
    if (level.world === 1) words = words.map(w => Math.random() < 0.2 ? w + ';' : w);
    const lines = wordLines(words, 7);
    if (level.world === 3) lines.splice(4, 3, 'a fox, a cat, and a zebra.', 'mix six eggs in a bowl.', 'the wizard can zap a box.');
    return lines;
  }

  function commonLevel() {
    return wordLines(shuffle(COMMON_WORDS), 8, ' ', 27);
  }

  function authoredLevel(level, names) {
    let src = level.lines.slice();
    if (level.pick) src = shuffle(src).slice(0, level.pick);
    const out = [];
    for (let s of src) {
      s = s.replace(/\{P\}/g, names.pet).replace(/\{K\}/g, names.kid);
      out.push(...wrap(s));
    }
    return out;
  }

  /* weak: map of key -> 0..1 "how often she misses it" ; names: {pet, kid} */
  function build(levelId, weak = {}, names = { pet: 'Ember', kid: 'Sam' }) {
    const idx = levelIndex(levelId);
    const level = LEVELS[idx];
    let lines;
    if (level.kind === 'keys') lines = keysLevel(level, idx, weak);
    else if (level.kind === 'review') lines = reviewLevel(level, idx, weak);
    else if (level.kind === 'common') lines = commonLevel();
    else lines = authoredLevel(level, names);
    return lines.map(l => l.trim()).filter(Boolean);
  }

  /* Words for the mini-game: anything she can already type */
  function miniWords(highestIdx) {
    const pool = wordPool(lettersUpTo(highestIdx), 2, 7);
    return pool.length >= 12 ? pool : wordPool('asdfghjkl', 2, 6);
  }

  return { build, keysUpTo, lettersUpTo, levelIndex, wordPool, miniWords, wrap, shuffle, pick, rnd };
})();
