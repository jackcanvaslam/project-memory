/* Dragon Keys - saved progress (kept in this browser only) */
'use strict';

const Store = (() => {
  const KEY = 'dragon-keys-save-v1';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

  const fresh = () => ({
    v: 2, kid: '', hatched: false,
    pet: { name: '', color: 'emerald', trail: 'spark', crest: 'horns' },
    coins: 0, levels: {}, owned: {}, seenStage: 0,
    keys: {}, history: [], streak: { count: 0, last: '' }, totalSecs: 0,
    settings: { sound: true, music: true, unlockAll: false, difficulty: 'normal', memoryHints: false, alwaysHints: false }, mini: { best: 0, plays: 0 },
    adventure: { completed: 0, sessionCount: 0, lastReward: 0, warmDay: '' }, checkpoint: null,
  });

  let S = fresh();
  let memoryOnly = false;
  let loadWarning = '';
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const copy = o => JSON.parse(JSON.stringify(o));
  const levelIds = new Set(LEVELS.map(l => l.id));
  const fail = text => { throw new Error(text); };
  const char = k => typeof k === 'string' && /^[\x20-\x7e]$/.test(k);
  function number(v, fallback = 0, max = 1e7, strict = false, integer = true) {
    if (v === undefined) return fallback;
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      if (strict) fail('A saved number is invalid.');
      return fallback;
    }
    const n = Math.max(0, Math.min(max, v));
    return integer ? Math.floor(n) : n;
  }
  function record(v, strict, label) {
    if (object(v)) return v;
    if (strict && v !== undefined) fail(label + ' must be an object.');
    return {};
  }
  function bool(v, fallback, strict) {
    if (v === undefined) return fallback;
    if (typeof v === 'boolean') return v;
    if (strict) fail('A saved setting is invalid.');
    return fallback;
  }
  function name(v, fallback, strict) {
    if (v === undefined) return fallback;
    if (typeof v !== 'string') { if (strict) fail('A saved name is invalid.'); return fallback; }
    return v.replace(/[^a-zA-Z]/g, '').slice(0, 10);
  }
  function asset(v, options, fallback, strict) {
    if (typeof v === 'string' && has(options, v)) return v;
    if (strict && v !== undefined) fail('This backup contains an unknown dragon look.');
    return fallback;
  }
  function listOfLines(value, optional = false) {
    if (optional && value === undefined) return [];
    if (!Array.isArray(value) || value.length > 120 || (!optional && value.length === 0)) fail('The saved practice text is invalid.');
    if (value.some(s => typeof s !== 'string' || !/^[\x20-\x7e]{1,160}$/.test(s)) || value.join('').length > 10000) fail('The saved practice text is invalid.');
    return value.slice();
  }
  function checkpoint(value) {
    if (value == null) return null;
    if (!object(value) || value.v !== 1 || !levelIds.has(value.id)) fail('The saved mission is not recognized.');
    const lines = listOfLines(value.lines), p = record(value.progress, true, 'Mission progress');
    const li = number(p.li, -1, 120, true), pos = number(p.pos, -1, 160, true);
    if (li < 0 || li >= lines.length || pos < 0 || pos >= lines[li].length) fail('The saved mission position is invalid.');
    const done = lines.slice(0, li).reduce((n, s) => n + s.length, 0) + pos;
    const err = bool(p.err, false, true), first = number(p.first, 0, 10000, true), errors = number(p.errors, 0, 10000, true);
    const streak = number(p.streak, 0, 10000, true), best = number(p.best, 0, 10000, true);
    if (first > done || first + errors !== done + (err ? 1 : 0) || streak > best || best > done) fail('The saved mission totals do not match its position.');
    const missed = {};
    for (const [k, v] of Object.entries(record(p.missed, true, 'Missed keys'))) {
      if (!char(k)) fail('A saved practice key is invalid.');
      missed[k] = number(v, 0, 10000, true);
    }
    let attempt = null;
    if (value.attempt != null) {
      const a = record(value.attempt, true, 'Recovery attempt');
      attempt = {t:number(a.t, 0, 9e15, true), originalPct:number(a.originalPct, 0, 100, true),
        originalWpm:number(a.originalWpm, 0, 1000, true), originalSecs:number(a.originalSecs, 0, 86400, true)};
    }
    let combat = null;
    if (value.combat != null) {
      const c = record(value.combat, true, 'Challenge progress');
      if (!Array.isArray(c.foes) || c.foes.length > 500 || !Array.isArray(c.slipPositions) || c.slipPositions.length > 5000) fail('The saved challenge is invalid.');
      combat = {hp:number(c.hp, 5, 5, true), mana:number(c.mana, 0, 100, true, false), shield:number(c.shield, 0, 600, true, false),
        frozen:number(c.frozen, 0, 600, true, false), downed:bool(c.downed, false, true), kills:number(c.kills, 0, 10000, true),
        hits:number(c.hits, 0, 10000, true), wordSlips:number(c.wordSlips, 0, 10, true),
        slipPositions:[...new Set(c.slipPositions.map(n => number(n, 0, 10000, true)))], clock:number(c.clock, 0, 86400, true, false),
        fierce:bool(c.fierce, false, true), bossHp:c.bossHp == null ? null : number(c.bossHp, 0, 10000, true),
        bossBeaten:bool(c.bossBeaten, false, true), foes:c.foes.map(f => {
          if (!object(f) || !['alive', 'dead', 'flee'].includes(f.state)) fail('A saved challenge creature is invalid.');
          return {state:f.state, armor:bool(f.armor, false, true)};
        })};
    }
    const challenge = bool(value.challenge, false, true), recovery = bool(value.recovery, false, true);
    if (recovery && !attempt) fail('The recovery mission is missing its original attempt.');
    if (challenge && recovery) fail('Recovery practice cannot be a challenge.');
    return {v:1,id:value.id,route:value.route === 1 ? 1 : 0,challenge,recovery,attempt,lines,
      progress:{li,pos,err,first,errors,streak,best,activeMs:number(p.activeMs, 0, 864e5, true, false),missed,segments:listOfLines(p.segments, true)},combat};
  }
  function normalize(raw, strict = false) {
    if (!object(raw)) fail('Choose a Dragon Keys save file.');
    if (strict && (![1, 2].includes(raw.v) || !object(raw.pet) || !object(raw.levels))) fail('Choose a Dragon Keys save file.');
    const out = fresh(), pet = record(raw.pet, strict, 'Dragon'), settings = record(raw.settings, strict, 'Settings');
    out.kid = name(raw.kid, '', strict); out.hatched = bool(raw.hatched, false, strict);
    out.pet = {name:name(pet.name, '', strict), color:asset(pet.color, DRAGON_COLORS, 'emerald', strict),
      trail:asset(pet.trail, TRAILS, 'spark', strict), crest:asset(pet.crest, CRESTS, 'horns', strict)};
    out.coins = number(raw.coins, 0, 1e7, strict); out.totalSecs = number(raw.totalSecs, 0, 1e9, strict);
    out.seenStage = number(raw.seenStage, 0, GROW_AT.length - 1, strict);
    for (const [id, value] of Object.entries(record(raw.levels, strict, 'Levels'))) {
      if (!levelIds.has(id)) { if (strict) fail('The backup contains an unknown level.'); continue; }
      const r = record(value, strict, 'Level result');
      out.levels[id] = {stars:number(r.stars, 0, 3, strict), bestAcc:number(r.bestAcc, 0, 100, strict),
        bestWpm:number(r.bestWpm, 0, 1000, strict), plays:number(r.plays, 0, 1e6, strict)};
      if (r.recoveryAcc !== undefined) out.levels[id].recoveryAcc = number(r.recoveryAcc, 0, 100, strict);
      // the pace of her best run, as seconds at each twentieth of the level, for the ghost to replay
      if (Array.isArray(r.ghost) && r.ghost.length === 20) out.levels[id].ghost = r.ghost.map(n => number(n, 0, 7200, strict, false));
      else if (strict && r.ghost !== undefined) fail('A saved best run is invalid.');
    }
    const owned = record(raw.owned, strict, 'Unlocked looks');
    for (const [prefix, options] of [['c-',DRAGON_COLORS],['t-',TRAILS],['h-',CRESTS]]) for (const id of Object.keys(options)) {
      if (has(owned, prefix + id) && bool(owned[prefix + id], false, strict)) out.owned[prefix + id] = true;
    }
    for (const [k, value] of Object.entries(record(raw.keys, strict, 'Key practice'))) {
      if (!char(k)) { if (strict) fail('A saved practice key is invalid.'); continue; }
      const r = record(value, strict, 'Key practice');
      out.keys[k] = {hit:number(r.hit, 0, 1e6, strict),miss:number(r.miss, 0, 1e6, strict)};
    }
    if (raw.history !== undefined && !Array.isArray(raw.history) && strict) fail('Practice history must be a list.');
    for (const h of (Array.isArray(raw.history) ? raw.history.slice(-300) : [])) {
      if (!object(h) || !levelIds.has(h.id)) { if (strict) fail('A saved practice result is invalid.'); continue; }
      const r = {t:number(h.t, 0, 9e15, strict),id:h.id,acc:number(h.acc, 0, 100, strict),wpm:number(h.wpm, 0, 1000, strict),
        secs:number(h.secs, 0, 86400, strict),stars:number(h.stars, 0, 3, strict)};
      // Recovery is recorded alongside the original run, never as an invented full-lesson score.
      if (h.recovered !== undefined) r.recovered = bool(h.recovered, false, strict);
      if (h.recoveryAcc !== undefined) r.recoveryAcc = number(h.recoveryAcc, 0, 100, strict);
      if (h.recoverySecs !== undefined) r.recoverySecs = number(h.recoverySecs, 0, 86400, strict);
      out.history.push(r);
    }
    const streak = record(raw.streak, strict, 'Daily practice');
    out.streak = {count:number(streak.count, 0, 100000, strict),last:typeof streak.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(streak.last) && Number.isFinite(Date.parse(streak.last + 'T12:00')) ? streak.last : ''};
    for (const k of ['sound','music','unlockAll','memoryHints','alwaysHints']) out.settings[k] = bool(settings[k], out.settings[k], strict);
    if (['calm','normal','fierce'].includes(settings.difficulty)) out.settings.difficulty = settings.difficulty;
    else if (strict && settings.difficulty !== undefined) fail('The saved challenge difficulty is invalid.');
    const mini = record(raw.mini, strict, 'Gem Storm');
    out.mini = {best:number(mini.best, 0, 1e7, strict),plays:number(mini.plays, 0, 1e6, strict)};
    const adventure = record(raw.adventure, strict, 'Adventures');
    const passed = Object.values(out.levels).filter(l => l.stars > 0).length;
    out.adventure = {completed:number(adventure.completed, passed, 1e6, strict),sessionCount:number(adventure.sessionCount, 0, 1000, strict),
      lastReward:number(adventure.lastReward, 0, 1e6, strict),
      warmDay:typeof adventure.warmDay === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(adventure.warmDay) ? adventure.warmDay : ''};
    try { out.checkpoint = checkpoint(raw.checkpoint); } catch (e) { if (strict) throw e; }
    return out;
  }

  function load() {
    let raw;
    try {
      raw = localStorage.getItem(KEY);
      memoryOnly = false;
    } catch (e) { memoryOnly = true; }
    loadWarning = '';
    if (raw) {
      try { S = normalize(JSON.parse(raw)); }
      catch (e) { S = fresh(); loadWarning = 'The saved data could not be read. You can restore a downloaded backup below.'; }
    } else S = fresh();
    grantRewards();
    return S;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); memoryOnly = false; return true; }
    catch (e) { memoryOnly = true; return false; }
  }
  function reset() { S = fresh(); loadWarning = ''; save(); return S; }
  function getCheckpoint(id) { return S.checkpoint && (!id || S.checkpoint.id === id) ? copy(S.checkpoint) : null; }
  function setCheckpoint(value) {
    let next;
    try { next = checkpoint(value); } catch (e) { return false; }
    S.checkpoint = next;
    return save();
  }
  function clearCheckpoint(id) { if (!id || (S.checkpoint && S.checkpoint.id === id)) S.checkpoint = null; }
  function exportSave() {
    return JSON.stringify({format:'dragon-keys-backup',version:1,exportedAt:new Date().toISOString(),save:normalize(S)}, null, 2);
  }
  function inspectBackup(text) {
    if (typeof text !== 'string' || text.length > 2e6) fail('Choose a Dragon Keys backup smaller than 2 MB.');
    let raw;
    try { raw = JSON.parse(text, (k, v) => {
      if (['__proto__','prototype','constructor'].includes(k)) fail('Unsafe backup field.');
      return v;
    }); } catch (e) { fail('This file is not a readable Dragon Keys backup.'); }
    if (object(raw) && raw.format === 'dragon-keys-backup') {
      if (raw.version !== 1) fail('This backup version is not supported.');
      raw = raw.save;
    }
    return normalize(raw, true);
  }
  function restoreBackup(text) {
    const next = inspectBackup(text);
    S = next; loadWarning = ''; grantRewards(); save();
    return S;
  }

  /* what she owns: skins, trails and crests */
  const ownKey = (kind, id) => ({ skin: 'c-', trail: 't-', crest: 'h-' })[kind] + id;
  const priceOf = (kind, id) => ({ skin: DRAGON_COLORS, trail: TRAILS, crest: CRESTS })[kind][id].price;
  const owns = (kind, id) => priceOf(kind, id) === 0 || !!S.owned[ownKey(kind, id)];
  const give = (kind, id) => { S.owned[ownKey(kind, id)] = true; };
  /* finishing a world wins its reward, including for saves made before rewards existed */
  function grantRewards() {
    const won = [];
    for (const w of WORLDS) if (worldDone(w.id) && !owns(w.reward.kind, w.reward.id)) { give(w.reward.kind, w.reward.id); won.push(w); }
    return won;
  }

  const get = () => S;
  const totalStars = () => Object.values(S.levels).reduce((t, l) => t + (l.stars || 0), 0);
  const stage = () => { const s = totalStars(); let st = 0; GROW_AT.forEach((n, i) => { if (s >= n) st = i; }); return st; };
  const levelStars = id => (S.levels[id] && S.levels[id].stars) || 0;
  const worldLevels = w => LEVELS.filter(l => l.world === w);
  const worldDone = w => worldLevels(w).every(l => levelStars(l.id) > 0);
  const worldOpen = w => w === 1 || S.settings.unlockAll || worldDone(w - 1);
  function levelOpen(id) {
    const i = LEVELS.findIndex(l => l.id === id);
    if (i < 0) return false;
    if (S.settings.unlockAll) return true;
    return i === 0 || levelStars(LEVELS[i - 1].id) > 0;
  }
  function nextLevel() {
    const l = LEVELS.find(l => levelStars(l.id) === 0);
    return l || LEVELS[LEVELS.length - 1];
  }
  function highestIndex() {
    let hi = 0;
    LEVELS.forEach((l, i) => { if (levelStars(l.id) > 0) hi = i; });
    return hi;
  }

  /* How often each key is missed, 0..1, only counted once there is enough data */
  function weakKeys() {
    const out = {};
    for (const k in S.keys) {
      const { hit = 0, miss = 0 } = S.keys[k];
      if (hit + miss >= 8) out[k] = Math.min(1, (miss / (hit + miss)) * 3);
    }
    return out;
  }
  function noteKey(ch, ok) {
    const k = ch.toLowerCase();
    const rec = S.keys[k] || (S.keys[k] = { hit: 0, miss: 0 });
    if (ok) rec.hit++; else rec.miss++;
    // Let old mistakes fade so the chart shows how she types now
    if (rec.hit + rec.miss > 200) { rec.hit = Math.round(rec.hit * 0.7); rec.miss = Math.round(rec.miss * 0.7); }
    if (k !== '^' && (ch !== k || SHIFTED[ch])) noteKey('^', ok);   // '^' stands for using Shift
  }
  /* Does she hit this key reliably enough that the finger hints can stay quiet? */
  function mastered(ch) {
    const one = k => { const r = S.keys[k]; return !!r && r.hit + r.miss >= 20 && r.miss / (r.hit + r.miss) <= 0.06; };
    const k = ch.toLowerCase();
    return one(k) && (ch === k && !SHIFTED[ch] || one('^'));
  }

  /* Returns the daily streak bonus if this is the first finished level today, else 0 */
  function touchStreak() {
    const t = today();
    if (S.streak.last === t) return 0;
    S.streak.count = (S.streak.last && dayDiff(S.streak.last, t) === 1) ? S.streak.count + 1 : 1;
    S.streak.last = t;
    return Math.min(S.streak.count, 7) * 2;
  }

  function addCoins(n) { S.coins = Math.max(0, S.coins + n); }

  return { load, save, reset, get, totalStars, stage, levelStars, worldLevels, worldDone, worldOpen, levelOpen,
    nextLevel, highestIndex, weakKeys, noteKey, mastered, touchStreak, addCoins, today, owns, give, ownKey, priceOf, grantRewards,
    getCheckpoint, setCheckpoint, clearCheckpoint, exportSave, inspectBackup, restoreBackup,
    isMemoryOnly: () => memoryOnly, getLoadWarning: () => loadWarning };
})();

