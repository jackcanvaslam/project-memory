/* Dragon Keys - saved progress (kept in this browser only) */
'use strict';

const Store = (() => {
  const KEY = 'dragon-keys-save-v1';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);

  const fresh = () => ({
    v: 1, kid: '', hatched: false,
    pet: { name: '', color: 'emerald', trail: 'spark', crest: 'horns' },
    coins: 0, levels: {}, owned: {}, seenStage: 0,
    keys: {}, history: [], streak: { count: 0, last: '' }, totalSecs: 0,
    settings: { sound: true, music: true, unlockAll: false, difficulty: 'normal' }, mini: { best: 0, plays: 0 },
  });

  let S = fresh();
  let memoryOnly = false;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S = Object.assign(fresh(), JSON.parse(raw));
      S.pet = Object.assign(fresh().pet, S.pet);
      S.settings = Object.assign(fresh().settings, S.settings);
      S.mini = Object.assign(fresh().mini, S.mini);
    } catch (e) { memoryOnly = true; }
    // tidy up saves from the first version of the game
    if (!DRAGON_COLORS[S.pet.color]) S.pet.color = 'emerald';
    if (!TRAILS[S.pet.trail]) S.pet.trail = 'spark';
    if (!CRESTS[S.pet.crest]) S.pet.crest = 'horns';
    delete S.pet.wear; delete S.pet.hearts; delete S.pet.lastCare; delete S.food; delete S.friends;
    grantRewards();
    return S;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { memoryOnly = true; }
  }
  function reset() { S = fresh(); save(); return S; }

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
    if (S.settings.unlockAll) return true;
    const i = LEVELS.findIndex(l => l.id === id);
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
    nextLevel, highestIndex, weakKeys, noteKey, touchStreak, addCoins, today, owns, give, ownKey, priceOf, grantRewards, isMemoryOnly: () => memoryOnly };
})();
