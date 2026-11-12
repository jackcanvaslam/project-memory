/* Dragon Keys - a typing level: the dragon flies, each finished word collects a shard,
   and a clean streak builds "flow", which drives the music and the glow. */
'use strict';

/* Position is derived from saved text, never from an unrelated regenerated lesson. */
const LessonRun = {
  ends(lines) { return lines.map(line => { const ends = []; for (let i = 0; i < line.length; i++) if (line[i] === ' ') ends.push(i + 1); ends.push(line.length); return ends; }); },
  position(lines, li, pos) {
    const ends = this.ends(lines);
    return { done: lines.slice(0, li).reduce((n, line) => n + line.length, 0) + pos,
      wi: ends[li].filter(n => n <= pos).length,
      wordsDone: ends.slice(0, li).reduce((n, line) => n + line.length, 0) + ends[li].filter(n => n <= pos).length };
  },
  stars(pct, recovery = false) { return recovery ? (pct >= 90 ? 1 : 0) : pct >= 98 ? 3 : pct >= 95 ? 2 : pct >= 90 ? 1 : 0; },
};

App.register('level', {
  GAP: 250,                      // distance between shards, in pixels
  CH: 29,                        // width of one character in the typing line
  MILESTONES: [10, 25, 50, 75, 100, 150, 200, 300],

  enter(el, { id, route = 0, challenge = false, resume = false, recovery = false, repairLines = null, attempt = null }) {
    const S = Store.get();
    const idx = Content.levelIndex(id), level = LEVELS[idx], world = WORLDS[level.world - 1];
    const saved = resume ? Store.getCheckpoint(id) : null;
    this.route = saved ? saved.route : route;
    this.recovery = saved ? saved.recovery : recovery;
    this.attempt = saved ? saved.attempt : attempt;
    this.challenge = !this.recovery && Combat.on(idx, saved ? saved.challenge : challenge);
    this.mission = Missions.get(id, this.route);
    this.level = level; this.idx = idx; this.t = 0; this.doneT = 0; this.calm = false;
    Scene.setTheme(world.theme); Scene.setHorizon(-250); Scene.setSpeed(40);
    Sound.music(world.theme); Sound.setEnergy(0.1);

    const lines = saved ? saved.lines : repairLines || Content.build(id, Store.weakKeys(), { pet: S.pet.name, kid: S.kid });
    this.wordEnds = LessonRun.ends(lines);
    const wordsTotal = this.wordEnds.reduce((t, e) => t + e.length, 0);
    const hues = { meadow: [170, 300, 60, 200], peaks: [190, 50, 320, 130], cave: [50, 185, 320, 95], castle: [45, 190, 330, 130], summit: [130, 190, 50, 320] }[world.theme];
    this.gemList = Array.from({ length: wordsTotal }, (_, i) => ({ D: (i + 1) * this.GAP, y: 196 + Math.sin(i * 1.9) * 44, hue: hues[i % hues.length] }));
    this.L = { lines, li: 0, pos: 0, wi: 0, err: false, total: lines.reduce((t, l) => t + l.length, 0), done: 0, first: 0, errors: 0,
      streak: 0, best: 0, activeMs: 0, lastT: 0, phase: 'intro', gemsGot: 0, wordsDone: 0, wordsTotal, note: 0, kps: 0, d: 0, heat: 0, idle: 0, missed: {}, segments: [] };
    if (saved) {
      Object.assign(this.L, saved.progress, LessonRun.position(lines, saved.progress.li, saved.progress.pos));
      this.L.gemsGot = this.L.wordsDone; this.L.d = this.L.wordsDone * this.GAP;
      this.L.lastT = 0; this.L.phase = 'intro';
    }

    const n = Store.worldLevels(level.world).indexOf(level) + 1;
    const fight = this.challenge, foe = FOE_INFO[world.theme];
    const tip = fight
      ? (BOSS_LEVELS.has(level.id) ? `<b>Boss: ${foe.boss}.</b> Every word you finish hurts it.` : `<b>${foe.name}</b> ride the words. Finish a word to destroy its enemy.`)
        + ` Two different slips on one word let it strike.${(saved && saved.combat ? saved.combat.fierce : S.settings.difficulty === 'fierce') ? ' Fierce also has a word timer.' : ''} Full mana? Press <b>Enter</b> for a power.`
      : this.recovery ? 'A short practice for the keys that need another try. Reach <b>90% accuracy</b> to earn one star and continue.'
      : 'No timer and no attacks. Feel the bumps on <b>F</b> and <b>J</b>. Follow the finger guide, one key at a time.';
    el.innerHTML = `<div class="edge"></div><div class="lv-progress"><i></i></div>
      <div class="lv-top">
        <button class="btn icon" data-act="pause" aria-label="Pause">${ic('pause')}</button>
        <div class="hud-title">${esc(level.title)}<small>World ${level.world} · Level ${n} · ${this.recovery ? 'Focused practice' : fight ? 'Optional battle' : 'Learning flight'}</small></div>
        <div style="flex:1"></div>
        <div class="chip acc" title="Accuracy"><small>acc</small><span>100%</span></div>
        <div class="chip streak" title="Right keys in a row">${ic('flame')}<span>0</span></div>
        <div class="chip gems" title="Shards">${ic('shard')}<span>0</span></div>
        ${App.sysButtons()}
      </div>
      <div class="mission-status"><strong>${esc(this.mission.title)}</strong><span>${esc(this.mission.goal)}</span></div>
      <div class="flow"><span>Flow</span><div><i></i></div></div>
      <div class="lv-col">
        <div class="prompt panel"><div class="next-line"></div></div>
        <div class="kb-panel panel">${Keyboard.markup()}</div>
      </div>
      <div class="lv-banner"><div class="kicker">${saved ? 'Your flight is saved' : this.recovery ? 'Try just the tricky parts' : 'Your mission'}</div><h2>${esc(this.mission.title)}</h2><p>${esc(this.mission.goal)}</p>
        <p>${tip}</p>
        <div class="go">Press <span class="keycap">SPACE</span> to ${saved ? 'resume' : 'start'}</div></div>`;
    this.prompt = $('.prompt', el); this.nextEl = $('.next-line', el); this.flowEl = $('.flow i', el);
    this.kb = Keyboard.create(el);
    this.kb.setLearned(Content.keysUpTo(idx));
    this.kb.setMemoryHints(S.settings.memoryHints && Store.levelStars(id) > 0 && !this.recovery);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act === 'pause') this.pause(); });
    el.classList.add('intro');
    this.d = App.myDragon(); this.d.place(this.hx(), 200);
    this.C = fight ? new Combat(this) : null;
    if (this.C && saved && saved.combat) this.C.restore(saved.combat);
    if (this.C && this.C.boss) Sound.music('boss');
    Scene.onDraw = ctx => { Missions.draw(ctx, this.mission, this.L.done / this.L.total, this.t); if (this.C) this.C.draw(ctx, 'back'); this.d.draw(ctx); if (this.C) this.C.draw(ctx, 'front'); };
    this.onVisibility = () => { if (document.hidden && this.L.phase === 'play') { this.checkpoint(); if (!App.hasModal) this.pause(true); } };
    this.onPageLeave = () => this.checkpoint();
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageLeave);
    this.renderLine(false);
    this.updateHud();
    this.tick(0);
  },
  hx() { return App.W / 2 - 250; },

  renderLine(aim = true) {
    const L = this.L, line = L.lines[L.li];
    const old = $('.line', this.prompt); if (old) old.remove();
    const div = document.createElement('div'); div.className = 'line';
    div.innerHTML = '<i class="caret"></i>' + [...line].map(ch => `<span class="ch${ch === ' ' ? ' sp' : ''}">${ch === ' ' ? '' : esc(ch)}</span>`).join('');
    this.prompt.insertBefore(div, this.nextEl);
    this.lineEl = div; this.tiles = $$('.ch', div); this.caret = $('.caret', div);
    this.tiles.forEach((tile, i) => { if (i < L.pos) tile.classList.add('done'); });
    this.tiles[L.pos].classList.add('cur');
    this.caret.style.transform = `translateX(${L.pos * this.CH}px)`;
    const next = L.lines[L.li + 1];
    this.nextEl.innerHTML = next ? `<small>Next</small>${esc(next)}` : '<small>Last line</small>';
    if (aim) this.kb.target(line[L.pos]);
  },

  start() {
    const b = $('.lv-banner', this.el); if (b) b.remove();
    this.el.classList.remove('intro');
    this.L.phase = 'play'; Sound.whoosh();
    this.L.lastT = 0;
    this.kb.target(this.L.lines[this.L.li][this.L.pos]);
    this.checkpoint();
  },

  key(e) {
    const L = this.L;
    if (L.phase === 'intro') { if (e.key === ' ' || e.key === 'Enter') this.start(); else if (e.key === 'Escape') this.pause(); return; }
    if (L.phase !== 'play') return;
    if (this.C && this.C.handleKey(e)) return;
    if (e.key === 'Escape') { this.pause(); return; }
    if (e.key.length !== 1) { if (e.key === 'Shift') this.kb.press(e); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const exp = L.lines[L.li][L.pos];
    this.capsWarn(e.getModifierState && e.getModifierState('CapsLock'));
    if (e.key === exp) { this.kb.press(e, true); this.hit(exp); }
    else if (e.key === ' ' && L.pos === 0 && L.li > 0) { /* a space after a line wrap is fine */ }
    else { this.kb.press(e, false); this.miss(e.key, exp); }
  },

  capsWarn(on) {
    let w = $('.caps-warn', this.el);
    if (on && !w) { w = document.createElement('div'); w.className = 'caps-warn'; w.textContent = 'Caps Lock is on. Press the Caps Lock key once to turn it off.'; this.el.appendChild(w); }
    else if (!on && w) w.remove();
  },

  hit(exp) {
    const L = this.L, now = performance.now();
    if (L.lastT) L.activeMs += Math.min(now - L.lastT, 4000); else L.activeMs += 400;
    L.lastT = now; L.idle = 0;
    const tile = this.tiles[L.pos];
    tile.classList.remove('cur', 'err'); tile.classList.add('done'); if (L.err) tile.classList.add('slip');
    if (!L.err) { L.first++; Store.noteKey(exp, true); }
    L.err = false; L.done++; L.streak++; L.best = Math.max(L.best, L.streak);
    L.kps += 1; this.d.vy -= 55;
    L.heat = Math.min(1, L.heat + 0.013 + (L.streak > 20 ? 0.005 : 0));
    Sound.key(L.note++, L.streak);
    if (this.C) this.C.key();
    const p = App.pos(tile, 0.5, 0.3);
    FX.burst(p.x, p.y, { n: 3, size: 4, speed: 130, ring: false, g: -200, colors: [`rgb(${Scene.ACCENT[Scene.theme]})`, '#ffffff'] });
    L.pos++;
    if (L.pos === this.wordEnds[L.li][L.wi]) this.wordDone();
    if (this.MILESTONES.includes(L.streak)) this.combo(L.streak);
    if (L.pos >= L.lines[L.li].length) {
      L.li++; L.pos = 0; L.wi = 0;
      if (L.li >= L.lines.length) { this.updateHud(); this.finish(); return; }
      this.renderLine();
      this.checkpoint();
    } else {
      this.tiles[L.pos].classList.add('cur');
      this.caret.style.transform = `translateX(${L.pos * this.CH}px)`;
      this.kb.target(L.lines[L.li][L.pos]);
    }
    this.updateHud();
    if (L.done % 8 === 0) this.checkpoint();
  },

  miss(typed, exp) {
    const L = this.L;
    const firstSlip = !L.err;
    if (firstSlip) {
      L.err = true; L.errors++; Store.noteKey(exp, false);
      L.missed[exp] = (L.missed[exp] || 0) + 1;
      const line = L.lines[L.li], start = line.lastIndexOf(' ', Math.max(0, L.pos - 1)) + 1;
      const space = line.indexOf(' ', L.pos), segment = line.slice(start, space < 0 ? line.length : space).trim();
      if (segment && !L.segments.includes(segment) && L.segments.length < 30) L.segments.push(segment);
      L.streak = 0; L.note = 0;
      Sound.miss();
      if (this.C) this.C.slip();
    }
    const tile = this.tiles[L.pos], caret = this.caret, line = this.lineEl;
    tile.classList.add('err'); caret.classList.add('bad');
    setTimeout(() => { tile.classList.remove('err'); caret.classList.remove('bad'); }, 280);
    this.kb.reveal();
    if (exp !== exp.toLowerCase() && typed === exp.toLowerCase()) App.toast('Hold Shift to make a capital letter');
    else if (exp === '?' && typed === '/') App.toast('Hold Shift and press / to make a question mark');
    this.updateHud();
    if (firstSlip) this.checkpoint();
  },

  wordDone() {
    const L = this.L, g = this.gemList[L.wordsDone], m = this.d.mouth();
    if (!(this.C && this.C.wordDone(L.wordsDone))) {
      FX.burst(m.x + 10, m.y, { n: 12, speed: 280, size: 8, g: 0, colors: [`hsl(${g.hue},100%,75%)`, '#ffffff', `hsl(${g.hue},90%,60%)`], ringGrow: 170 });
      Sound.gem();
    }
    L.wordsDone++; L.gemsGot++; L.wi++; L.note = 0;
    const chip = $('.chip.gems', this.el);
    chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
  },

  combo(n) {
    const m = this.d.mouth();
    FX.text(m.x + 130, Math.max(110, m.y - 70), `${n} in a row`, '#ffc23d', 34);
    Sound.milestone();
    if (this.C) return;            // in a fight, fire is a power she casts herself
    Sound.fire();
    this.d.jawTarget = 1;
    let k = 0;
    const iv = setInterval(() => {
      const q = this.d.mouth();
      FX.fire(q.x, q.y, q.dx, q.dy, 1.15);
      if (++k > 10 || App.screen !== 'level') { clearInterval(iv); this.d.jawTarget = 0; }
    }, 45);
  },

  updateHud() {
    const L = this.L, el = this.el;
    const attempted = L.done + (L.err ? 1 : 0);
    const acc = attempted ? Math.round(L.first / attempted * 100) : 100;
    $('.chip.acc span', el).textContent = acc + '%';
    $('.chip.streak span', el).textContent = L.streak;
    $('.chip.streak', el).classList.toggle('hot', L.streak >= 10);
    $('.chip.gems span', el).textContent = L.gemsGot;
    $('.lv-progress i', el).style.width = (L.done / L.total * 100) + '%';
  },

  tick(dt) {
    const L = this.L, d = this.d;
    if (document.hidden || App.hasModal) { L.lastT = 0; return; }
    this.t += dt;
    L.kps *= Math.exp(-dt);
    L.idle += dt;
    if (L.phase === 'play' && L.idle > 2.5) L.heat = Math.max(0, L.heat - dt * 0.06);

    const ends = this.wordEnds[L.li] || [1];
    const ws = L.wi ? ends[L.wi - 1] : 0, we = ends[L.wi] || 1;
    const frac = L.phase === 'play' ? clamp((L.pos - ws) / Math.max(1, we - ws), 0, 1) : 0;
    L.d += ((L.wordsDone + frac) * this.GAP - L.d) * (1 - Math.exp(-9 * dt));

    // flow drives the picture and the music together
    const done = L.phase === 'done';
    Scene.setSpeed(done ? 620 : 46 + Math.min(6, L.kps) * 115);
    Scene.setHeat(done ? 1 : L.heat);
    const base = this.C && this.C.bossOn() ? 0.5 : 0.16;
    Sound.setEnergy(L.phase === 'intro' ? 0.1 : done ? (this.calm ? 0.15 : Math.max(0.6, L.heat)) : base + L.heat * (1 - base));
    if (this.C) this.C.tick(dt);
    this.flowEl.style.width = (L.heat * 100) + '%';
    this.el.style.setProperty('--heat', L.heat.toFixed(2));

    // steer the dragon: it weaves from shard to shard, and loops then streaks away at the end
    const hx = this.hx(), nextGem = this.gemList[L.wordsDone], flow = clamp(Scene.speed * 0.95, 80, 720);
    const aim = this.C && !done ? this.C.aimY() : null;
    let tx = hx + Math.min(46, L.kps * 9), ty = aim != null ? aim : nextGem ? nextGem.y : 190;
    if (done) {
      this.doneT += dt;
      const u = this.doneT / 0.95;
      if (u < 1) { tx = hx + Math.sin(u * TAU) * 110; ty = this.loopY - 90 + Math.cos(u * TAU) * 90; }
      else { tx = hx + (u - 1) * 1700; ty = this.loopY - 30; }
    }
    d.boost = done ? 4 : L.kps;
    d.update(dt, tx, ty + Math.sin(this.t * 4.2) * 4, done ? 260 : flow, done ? 60 : 30, done ? 10 : 8);

    const h = d.head();
    Scene.gems.length = 0;
    for (let i = L.wordsDone; i < Math.min(this.gemList.length, L.wordsDone + 7); i++) {
      const g = this.gemList[i], x = hx + 56 + (g.D - L.d);
      if (x > App.W + 60) break;
      if (this.C && this.C.hides(i)) continue;
      Scene.gems.push({ x, y: g.y, hue: g.hue, s: 1.1, a: done ? 0 : 1, phase: i });
    }
    if (h.y < 96) { h.y = 96; d.vy = Math.max(0, d.vy); }
  },

  checkpoint() {
    const L = this.L;
    if (!L || L.phase !== 'play' || L.li >= L.lines.length) return;
    const progress = {};
    for (const key of ['li', 'pos', 'err', 'first', 'errors', 'streak', 'best', 'activeMs', 'missed', 'segments']) progress[key] = L[key];
    Store.setCheckpoint({ v: 1, id: this.level.id, route: this.route, challenge: this.challenge,
      recovery: this.recovery, attempt: this.attempt, lines: L.lines, progress, combat: this.C ? this.C.snapshot() : null });
  },

  exit() {
    if (this.C) { this.C.closeCast(); Sound.setTension(0); Scene.slowmo = false; }
    this.checkpoint();
    if (this.kb) this.kb.destroy();
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageLeave);
  },

  pause(quiet = false) {
    const L = this.L;
    if (L.phase === 'done') return;
    if (this.C) this.C.closeCast();
    this.checkpoint(); this.kb.clear();
    L.lastT = 0; if (!quiet) Sound.click();
    const resume = () => { L.lastT = 0; if (L.phase === 'play') this.kb.target(L.lines[L.li][L.pos]); };
    App.modal(`<div class="modal"><button class="btn icon x" data-act="resume" aria-label="Close">${ic('close')}</button><div class="kicker">Paused</div><h2>Take a breath</h2><p>${Store.isMemoryOnly() ? 'This browser cannot save to disk. Keep this tab open, or export a backup from Parent settings.' : 'Your place is saved in this browser. Your dragon will wait.'}</p>
      <div class="row"><button class="btn" data-act="den">${ic('home')} Save & rest</button><button class="btn" data-act="again">${ic('retry')} Restart</button>
      <button class="btn primary" data-act="resume">${ic('play')} Resume</button></div></div>`,
    { act: a => { if (a === 'den') App.go('den'); else if (a === 'again') {
        this.L.phase = 'abandoned'; Store.clearCheckpoint(this.level.id); Store.save();
        App.go('level', { id: this.level.id, route: this.route, challenge: this.challenge, recovery: this.recovery, repairLines: this.recovery ? this.L.lines : null, attempt: this.attempt });
      } else App.closeModal(); },
      key: e => { if (e.key === 'Enter' || e.key === ' ') App.closeModal(); }, onClose: resume });
  },

  finish() {
    const L = this.L, S = Store.get(), level = this.level, id = level.id;
    L.phase = 'done'; this.kb.clear(); this.capsWarn(false);
    this.loopY = this.d.head().y; this.doneT = 0;
    Sound.whoosh();

    const acc = L.first / L.total, pct = Math.floor(acc * 100);
    const wpm = Math.max(1, Math.round((L.total / 5) / (Math.max(L.activeMs, 2000) / 60000)));
    const fight = this.C ? this.C.summary() : null;
    const stars = LessonRun.stars(pct, this.recovery);
    const rec = S.levels[id] || (S.levels[id] = { stars: 0, bestAcc: 0, bestWpm: 0, plays: 0 });
    const firstClear = stars > 0 && rec.stars === 0, worldWasDone = Store.worldDone(level.world);
    const newBest = !this.recovery && stars > 0 && rec.stars > 0 && pct > rec.bestAcc;
    if (!this.recovery) {
      rec.plays++; rec.bestAcc = Math.max(rec.bestAcc, pct);
      if (stars) rec.bestWpm = Math.max(rec.bestWpm, wpm);
    } else rec.recoveryAcc = Math.max(rec.recoveryAcc || 0, pct);
    rec.stars = Math.max(rec.stars, stars);

    const notes = [];
    let coins = 0;
    if (stars) {
      coins = this.recovery ? 5 : Math.round(L.gemsGot * 0.5) + stars * 5;
      if (firstClear) { coins += 10; notes.push('first clear'); }
      if (fight && fight.bossBeaten) { coins += 15; notes.push('boss beaten'); }
      if (fight && !fight.downed && fight.hits === 0) { coins += 5; notes.push('untouched'); }
      if (fight && fight.fierce) { coins += Math.ceil(coins * 0.25); notes.push('fierce bonus'); }
    }
    const streakBonus = stars ? Store.touchStreak() : 0;
    if (streakBonus) { coins += streakBonus; notes.push(S.streak.count > 1 ? `${S.streak.count} day streak` : 'first flight today'); }
    Store.addCoins(coins);
    const secs = Math.round(L.activeMs / 1000);
    if (!this.recovery) {
      const t = Date.now();
      S.history.push({ t, id, acc: pct, wpm, secs, stars });
      this.attempt = { t, originalPct: pct, originalWpm: wpm, originalSecs: secs };
    } else {
      const original = S.history.find(item => item.t === this.attempt.t && item.id === id);
      if (original) { original.recoveryAcc = pct; original.stars = Math.max(original.stars, stars); original.secs += secs; }
    }
    if (S.history.length > 300) S.history.shift();
    S.totalSecs += secs;

    if (stars) {
      S.adventure.completed++;
      S.adventure.sessionCount++;
    }

    const events = [];
    if (!worldWasDone && Store.worldDone(level.world)) {
      for (const w of Store.grantRewards()) events.push({ type: 'reward', world: w });
      if (level.world === 5) events.push({ type: 'champion' });
    }
    if (Store.stage() > S.seenStage) { events.push({ type: 'grow', before: S.seenStage }); S.seenStage = Store.stage(); }
    Store.clearCheckpoint(id);
    if (!stars) {
      this.repairLines = Content.recovery(id, L.missed, L.segments, L.lines);
      // An unfinished focused retry survives closing the tab on this result.
      Store.setCheckpoint({ v: 1, id, route: this.route, challenge: false, recovery: true, attempt: this.attempt,
        lines: this.repairLines, progress: { li: 0, pos: 0, err: false, first: 0, errors: 0, streak: 0, best: 0, activeMs: 0, missed: {}, segments: [] }, combat: null });
    }
    Store.save();
    App.later(() => this.results({ pct, wpm, stars, coins, notes, newBest, events, fight }), 1500);
  },

  results(r) {
    const L = this.L, level = this.level, next = LEVELS[this.idx + 1], pass = r.stars > 0;
    const speed = SPEED_NAMES.filter(([n]) => r.wpm >= n).pop()[1];
    const f = r.fight, title = this.recovery && pass ? 'You worked it out' : r.pct === 100 ? 'Flawless' : r.stars === 3 ? 'Brilliant flying' : r.stars === 2 ? 'Great flying' : r.stars === 1 ? 'Mission complete' : 'Let’s try the tricky keys';
    const readyToRest = pass && Store.get().adventure.sessionCount >= 2;
    const fourth = !f ? `<b>${L.gemsGot}</b><span>shards caught</span>`
      : f.boss ? `<b>${f.bossBeaten ? 'Won' : 'Lost'}</b><span>${esc(f.boss)}<br>${f.hits} ${f.hits === 1 ? 'hit' : 'hits'} taken</span>`
      : `<b>${f.kills}</b><span>enemies beaten<br>${f.hits} ${f.hits === 1 ? 'hit' : 'hits'} taken</span>`;
    const continueSession = () => { if (readyToRest) { Store.get().adventure.sessionCount = 0; Store.save(); } };
    const goNext = () => {
      const ev = r.events.shift();
      if (ev) { Celebrate[ev.type](ev, goNext); return; }
      continueSession();
      if (!next) App.go('den');
      else App.go('briefing', { id: next.id, skipWarmup: true });
    };
    const again = () => { const ev = r.events.shift(); if (ev) { Celebrate[ev.type](ev, again); return; } continueSession(); App.go('briefing', { id: level.id, skipWarmup: true }); };
    const battle = () => { const ev = r.events.shift(); if (ev) { Celebrate[ev.type](ev, battle); return; } continueSession(); App.go('level', { id: level.id, route: this.route, challenge: true }); };
    const repair = () => App.go('level', { id: level.id, resume: true });
    const rest = () => { const ev = r.events.shift(); if (ev) { Celebrate[ev.type](ev, rest); return; } Store.get().adventure.sessionCount = 0; Store.save(); App.go('den'); };
    const toMap = () => { const ev = r.events.shift(); if (ev) { Celebrate[ev.type](ev, toMap); return; } App.go('map', { world: level.world }); };
    const wrap = App.modal(`<div class="modal result"><div class="kicker">${esc(level.title)}</div><h2>${title}${r.newBest ? '<span class="badge-new">NEW BEST</span>' : ''}</h2>
      <div class="stars">${[0, 1, 2].map(i => `<div class="slot">${ic('starOff')}${i < r.stars ? ic('star', 'won') : ''}</div>`).join('')}</div>
      <p class="mission-story">${esc(pass ? this.mission.success : 'Your mission progress is safe. Practice just the keys that were tricky, then continue.')}</p>
      ${pass ? '' : `<p>You reached <b>${r.pct}%</b>. This short retry needs 90% to earn one star.<br>No need to repeat the whole mission.</p>`}
      ${this.recovery && pass ? `<p>One star for <b>${r.pct}% on your focused retry</b>. Your full mission was ${this.attempt.originalPct}%. Replay the full mission any time for two or three stars.</p>` : ''}
      ${pass && f && f.downed ? '<p>Your dragon is safe. Battle damage does not reduce your accuracy stars.</p>' : ''}
      ${readyToRest ? '<p><b>Two missions complete.</b> Your adventure is saved. This is a good place to rest your hands.</p>' : ''}
      ${pass ? `<p class="adventure-reward">${esc(Missions.rewardText(Store.get().adventure.completed))}</p>` : ''}
      <div class="stats">
        <div class="stat ${r.pct >= 90 ? 'good' : ''}"><b>${r.pct}%</b><span>accuracy</span></div>
        <div class="stat"><b>${r.wpm}</b><span>words a minute<br>${speed}</span></div>
        <div class="stat"><b>${L.best}</b><span>best streak</span></div>
        <div class="stat">${fourth}</div>
      </div>
      <div class="earn">${ic('shard')} +<span class="earn-n">0</span>${r.notes.length ? `<small>${esc(r.notes.join(', '))}</small>` : ''}</div>
      <div class="row">
        <button class="btn" data-act="map">${ic('map')} Map</button>
        ${pass ? `<button class="btn" data-act="again">${ic('retry')} Replay</button>
          ${!this.challenge && Store.get().settings.difficulty !== 'calm' ? `<button class="btn" data-act="challenge">${ic('bolt')} Optional battle</button>` : ''}
          <button class="btn ${readyToRest ? '' : 'primary'}" data-act="next">${next ? 'Next mission' : 'Visit den'} ${ic('next')}</button>
          ${readyToRest ? '<button class="btn primary" data-act="rest">Save & rest</button>' : ''}`
          : `<button class="btn primary big" data-act="repair">${ic('retry')} Practice tricky keys</button>`}
      </div></div>`,
    { act: a => { Sound.click(); if (a === 'next') goNext(); else if (a === 'again') again(); else if (a === 'repair') repair(); else if (a === 'rest') rest();
        else if (a === 'challenge') battle(); else toMap(); },
      key: e => { if (e.key === 'Enter') { Sound.click(); if (!pass) repair(); else if (readyToRest) rest(); else goNext(); } } });

    if (pass) { Sound.fanfare(); FX.confetti(30 + r.stars * 34); } else { this.calm = true; Sound.almost(); }
    $$('.won', wrap).forEach((s, i) => App.later(() => {
      s.classList.add('in'); Sound.star(i);
      const p = App.pos(s); FX.burst(p.x, p.y, { n: 18, speed: 360, size: 9, colors: ['#ffd23f', '#ffffff', '#ff9a3d'] });
    }, 500 + i * 400));
    App.later(() => {
      const e = $('.earn-n', wrap); if (!e) return;
      App.countTo(e, 0, r.coins, 800);
      const p = App.pos($('.earn', wrap)); FX.burst(p.x, p.y, { n: 12, colors: ['#22e1ff', '#ffffff'], speed: 240 });
    }, 550 + r.stars * 400);
  },
});

/* Pop-ups for the big moments */
const Celebrate = {
  show(html, cb, act) {
    Sound.levelUp(); FX.confetti(110);
    FX.cannon(0, 720, -0.9, 34); FX.cannon(App.W, 720, -2.25, 34);
    App.modal(html, { act: (a) => { Sound.click(); if (act) act(a); cb(); }, key: e => { if (e.key === 'Enter' || e.key === ' ') cb(); } });
  },
  /* finishing a world wins a trail, a crest or a skin */
  reward(ev, cb) {
    const S = Store.get(), r = ev.world.reward, field = { skin: 'color', trail: 'trail', crest: 'crest' }[r.kind];
    const it = ({ skin: DRAGON_COLORS, trail: TRAILS, crest: CRESTS })[r.kind][r.id];
    const look = { zoom: [1.5, 1.3, 1.1, 0.95][Store.stage()] }; look[field] = r.id;
    this.show(`<div class="modal unlock"><div class="kicker">${ev.world.name} complete</div><h2>New ${r.kind}: ${it.name}</h2>
      ${App.dv(look)}
      ${(() => { const m = MOVES.find(x => x.world === ev.world.id); return m ? `<p>New power: <b>${m.name}</b>. It ${m.text}.</p>` : ''; })()}
      <div class="row"><button class="btn" data-act="later">Keep my look</button><button class="btn primary" data-act="equip">Equip it</button></div></div>`, cb,
    a => { if (a === 'equip') { S.pet[field] = r.id; Store.save(); Sound.equip(); } });
  },
  grow(ev, cb) {
    const S = Store.get(), st = Store.stage();
    this.show(`<div class="modal unlock"><div class="kicker">${STAGE_NAMES[ev.before]} to ${STAGE_NAMES[st]}</div><h2>${esc(S.pet.name)} grew</h2>
      <div class="grow">${App.dv({ stage: ev.before, zoom: 1 })}${ic('next')}${App.dv({ stage: st, zoom: 1 })}</div>
      <p>Every star you earn makes your dragon stronger.</p>
      <div class="row"><button class="btn primary" data-act="ok">Continue</button></div></div>`, cb);
  },
  champion(ev, cb) {
    const S = Store.get();
    this.show(`<div class="modal unlock"><div class="kicker">Every world complete</div><h2>${esc(S.kid)}, typing champion</h2>
      ${App.dv({ color: 'gold', crest: 'halo', trail: 'prism', zoom: 0.95 })}
      <p>You have explored every letter key. Keep building accuracy and using the finger guide, or try a familiar mission as a battle.</p>
      <div class="row"><button class="btn primary" data-act="ok">Continue</button></div></div>`, cb);
  },
};

