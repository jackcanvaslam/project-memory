/* Dragon Keys - a typing level: the dragon flies, each finished word collects a gem */
'use strict';

App.register('level', {
  GAP: 250,                      // distance between gems, in pixels
  MILESTONES: [10, 25, 50, 75, 100, 150, 200, 300],

  enter(el, { id }) {
    const S = Store.get();
    const idx = Content.levelIndex(id), level = LEVELS[idx], world = WORLDS[level.world - 1];
    this.level = level; this.idx = idx; this.t = 0;
    Scene.setTheme(world.theme); Scene.setHorizon(-250); Scene.setSpeed(40);

    const lines = Content.build(id, Store.weakKeys(), { pet: S.pet.name, kid: S.kid });
    this.wordEnds = lines.map(line => { const ends = []; for (let i = 0; i < line.length; i++) if (line[i] === ' ') ends.push(i + 1); ends.push(line.length); return ends; });
    const wordsTotal = this.wordEnds.reduce((t, e) => t + e.length, 0);
    const hues = { meadow: [200, 330, 45, 275], peaks: [190, 50, 320, 130], cave: [50, 185, 320, 95], castle: [45, 190, 330, 130], summit: [130, 190, 50, 320] }[world.theme];
    this.gemList = Array.from({ length: wordsTotal }, (_, i) => ({ D: (i + 1) * this.GAP, y: 190 + Math.sin(i * 1.9) * 42, hue: hues[i % hues.length] }));
    this.L = { lines, li: 0, pos: 0, wi: 0, err: false, total: lines.reduce((t, l) => t + l.length, 0), done: 0, first: 0, errors: 0,
      streak: 0, best: 0, activeMs: 0, lastT: 0, phase: 'intro', gemsGot: 0, wordsDone: 0, wordsTotal, note: 0, kps: 0, d: 0 };
    this.fly = { y: 180, vy: 0 };

    const n = Store.worldLevels(level.world).indexOf(level) + 1;
    el.innerHTML = `<div class="lv-top">
        <button class="btn white round" data-act="pause" aria-label="Pause">${ic('pause')}</button>
        <div class="hud-title">${esc(level.title)}<small>World ${level.world} · Level ${n}</small></div>
        <div class="lv-progress"><i></i><b>${ic('gem')}</b></div>
        <div class="pill acc" title="Accuracy">${ic('target')}<b>100%</b></div>
        <div class="pill streak" title="Right keys in a row">${ic('flame')}<b>0</b></div>
        <div class="pill gems" title="Gems">${ic('gem')}<b>0</b></div>
        ${App.sysButtons()}
      </div>
      <div class="flyer">${App.petSvg('fly')}</div>
      <div class="lv-col">
        <div class="prompt glass"><div class="next-line"></div></div>
        <div class="kb-panel glass">${Keyboard.markup()}</div>
      </div>
      <div class="lv-banner glass"><h2>${esc(level.title)}</h2>${LevelInfo.html(level)}
        <p>${level.world === 1 ? 'Rest your fingers on <b>A S D F</b> and <b>J K L ;</b> and try not to look down.' : 'Stars are for careful typing, not speed. Take your time.'}</p>
        <div class="go">Press <span class="keycap" style="--kc:#8f96b3;min-width:128px;height:40px;font-size:21px">SPACE</span> to start</div></div>`;
    this.flyer = $('.flyer', el); this.prompt = $('.prompt', el); this.nextEl = $('.next-line', el);
    this.kb = Keyboard.create(el);
    this.kb.setLearned(Content.keysUpTo(idx));
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act === 'pause') this.pause(); });
    el.classList.add('intro');
    this.renderLine(false);
    this.tick(0);
  },

  renderLine(aim = true) {
    const L = this.L, line = L.lines[L.li];
    const old = $('.line', this.prompt); if (old) old.remove();
    const div = document.createElement('div'); div.className = 'line';
    div.innerHTML = [...line].map(ch => `<span class="ch${ch === ' ' ? ' sp' : ''}">${ch === ' ' ? '' : esc(ch)}</span>`).join('');
    this.prompt.insertBefore(div, this.nextEl);
    this.tiles = [...div.children];
    this.tiles[0].classList.add('cur');
    const next = L.lines[L.li + 1];
    this.nextEl.innerHTML = next ? `<small>Next</small>${esc(next)}` : '<small>Last line. Nearly there!</small>';
    if (aim) this.kb.target(line[0]);
  },

  start() {
    const b = $('.lv-banner', this.el); if (b) b.remove();
    this.el.classList.remove('intro');
    this.L.phase = 'play'; Sound.whoosh();
    this.kb.target(this.L.lines[0][0]);
  },

  key(e) {
    const L = this.L;
    if (L.phase === 'intro') { if (e.key === ' ' || e.key === 'Enter') this.start(); else if (e.key === 'Escape') this.pause(); return; }
    if (L.phase !== 'play') return;
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
    L.lastT = now;
    const tile = this.tiles[L.pos];
    tile.classList.remove('cur', 'err'); tile.classList.add('done', 'popped'); if (L.err) tile.classList.add('slip');
    if (!L.err) { L.first++; Store.noteKey(exp, true); }
    L.err = false; L.done++; L.streak++; L.best = Math.max(L.best, L.streak);
    L.kps += 1; this.fly.vy -= 85;
    Sound.key(L.note++);
    const p = App.pos(tile, 0.5, 0.4);
    FX.burst(p.x, p.y, { n: 4, size: 5, speed: 150, ring: false, colors: ['#fff7b0', '#9be0b8', '#ffffff'] });
    L.pos++;
    if (L.pos === this.wordEnds[L.li][L.wi]) this.wordDone();
    if (this.MILESTONES.includes(L.streak)) this.combo(L.streak);
    if (L.pos >= L.lines[L.li].length) {
      L.li++; L.pos = 0; L.wi = 0;
      if (L.li >= L.lines.length) { this.updateHud(); this.finish(); return; }
      this.renderLine();
    } else {
      this.tiles[L.pos].classList.add('cur');
      this.kb.target(L.lines[L.li][L.pos]);
    }
    this.updateHud();
  },

  miss(typed, exp) {
    const L = this.L;
    if (!L.err) { L.err = true; L.errors++; Store.noteKey(exp, false); }
    L.streak = 0; L.note = 0;
    const tile = this.tiles[L.pos];
    tile.classList.remove('err'); void tile.offsetWidth; tile.classList.add('err');
    setTimeout(() => tile.classList.remove('err'), 260);
    this.flyer.classList.remove('wobble'); void this.flyer.offsetWidth; this.flyer.classList.add('wobble');
    Sound.miss();
    if (exp !== exp.toLowerCase() && typed === exp.toLowerCase()) App.toast('Hold Shift to make a capital letter');
    else if (exp === '?' && typed === '/') App.toast('Hold Shift and press / to make a question mark');
    this.updateHud();
  },

  wordDone() {
    const L = this.L, g = this.gemList[L.wordsDone];
    const left = App.W / 2 - 500, x = clamp(left + 188 + (g.D - L.d), left + 175, left + 400);
    FX.burst(x, this.fly.y, { n: 12, speed: 260, size: 8, colors: [`hsl(${g.hue},100%,75%)`, '#ffffff', `hsl(${g.hue},90%,60%)`], ringGrow: 150 });
    L.wordsDone++; L.gemsGot++; L.wi++; L.note = 0;
    Sound.gem();
    const pill = $('.pill.gems', this.el);
    pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse');
    setTimeout(() => pill.classList.remove('pulse'), 400);
  },

  combo(n) {
    const svg = $('svg', this.flyer), left = App.W / 2 - 500;
    FX.text(left + 330, Math.max(120, this.fly.y - 74), `${n} in a row!`, '#ffd23f', 40);
    Sound.fire();
    svg.classList.add('mouth-open');
    let k = 0;
    const iv = setInterval(() => {
      FX.fire(left + 162, this.fly.y, 0.97, -0.12, 1.1);
      if (++k > 9 || App.screen !== 'level') { clearInterval(iv); svg.classList.remove('mouth-open'); }
    }, 45);
  },

  updateHud() {
    const L = this.L, el = this.el;
    const attempted = L.done + (L.err ? 1 : 0);
    const acc = attempted ? Math.round(L.first / attempted * 100) : 100;
    $('.pill.acc b', el).textContent = acc + '%';
    $('.pill.streak b', el).textContent = L.streak;
    $('.pill.streak', el).classList.toggle('hot', L.streak >= 10);
    $('.pill.gems b', el).textContent = L.gemsGot;
    const pct = L.done / L.total * 100;
    $('.lv-progress i', el).style.width = pct + '%';
    $('.lv-progress b', el).style.left = pct + '%';
  },

  tick(dt) {
    const L = this.L, f = this.fly;
    this.t += dt;
    L.kps *= Math.exp(-dt);
    const ends = this.wordEnds[L.li] || [1];
    const ws = L.wi ? ends[L.wi - 1] : 0, we = ends[L.wi] || 1;
    const frac = L.phase === 'play' ? clamp((L.pos - ws) / Math.max(1, we - ws), 0, 1) : 0;
    const dT = (L.wordsDone + frac) * this.GAP;
    L.d += (dT - L.d) * (1 - Math.exp(-9 * dt));
    Scene.setSpeed(L.phase === 'done' ? 560 : 46 + Math.min(6, L.kps) * 115);

    const left = App.W / 2 - 500, nextGem = this.gemList[L.wordsDone];
    const targetY = L.phase !== 'done' && nextGem ? nextGem.y : 180;
    f.vy += ((targetY - f.y) * 30 - f.vy * 7) * dt;
    f.y += f.vy * dt;
    const bob = Math.sin(this.t * 5) * 4;
    const tilt = clamp(f.vy * 0.06, -14, 14) - Math.min(7, L.kps * 1.3);
    this.flyer.style.transform = `translate(${left}px, ${f.y - 120 + bob}px) rotate(${tilt}deg)`;

    Scene.gems.length = 0;
    for (let i = L.wordsDone; i < Math.min(this.gemList.length, L.wordsDone + 7); i++) {
      const g = this.gemList[i], x = left + 188 + (g.D - L.d);
      if (x > App.W + 60) break;
      Scene.gems.push({ x, y: g.y, hue: g.hue, s: 1.15, a: 1, phase: i });
    }
    if (L.kps > 2 && Math.random() < dt * L.kps * 3) FX.trail(left + 24, f.y + 22 + bob, ['#fff7b0', '#ffd23f', '#ffffff', '#ffb3d6']);
  },

  pause() {
    const L = this.L;
    if (L.phase === 'done') return;
    L.lastT = 0; Sound.click();
    App.modal(`<div class="modal"><button class="x" data-act="resume" aria-label="Close">${ic('close')}</button><h2>Paused</h2><p>Take a breath. Your dragon will wait.</p>
      <div class="row"><button class="btn white" data-act="map">${ic('map')} Map</button><button class="btn blue" data-act="again">${ic('retry')} Start again</button>
      <button class="btn green" data-act="resume">${ic('play')} Keep going</button></div></div>`,
    { act: a => { if (a === 'map') App.go('map', { world: this.level.world }); else if (a === 'again') App.go('level', { id: this.level.id }); else App.closeModal(); },
      key: e => { if (e.key === 'Enter' || e.key === ' ') App.closeModal(); } });
  },

  finish() {
    const L = this.L, S = Store.get(), level = this.level, id = level.id;
    L.phase = 'done'; this.kb.clear(); this.capsWarn(false);
    this.flyer.classList.add('loop'); Sound.whoosh();

    const acc = L.first / L.total, pct = Math.floor(acc * 100);
    const wpm = Math.max(1, Math.round((L.total / 5) / (Math.max(L.activeMs, 2000) / 60000)));
    const stars = pct >= 98 ? 3 : pct >= 95 ? 2 : pct >= 90 ? 1 : 0;
    const rec = S.levels[id] || (S.levels[id] = { stars: 0, bestAcc: 0, bestWpm: 0, plays: 0 });
    const firstClear = stars > 0 && rec.stars === 0, worldWasDone = Store.worldDone(level.world);
    const newBest = stars > 0 && rec.stars > 0 && pct > rec.bestAcc;
    rec.plays++; rec.stars = Math.max(rec.stars, stars); rec.bestAcc = Math.max(rec.bestAcc, pct);
    if (stars) rec.bestWpm = Math.max(rec.bestWpm, wpm);

    const notes = [];
    let coins = 3;
    if (stars) {
      coins = Math.round(L.wordsTotal * 0.4) + stars * 5;
      if (firstClear) { coins += 10; notes.push('first time bonus'); }
      if (S.pet.hearts >= 5) { coins += Math.ceil(coins * 0.2); notes.push('happy dragon bonus'); }
    }
    const streakBonus = Store.touchStreak();
    if (streakBonus) { coins += streakBonus; notes.push(S.streak.count > 1 ? `${S.streak.count} day streak` : 'first flight today'); }
    Store.addCoins(coins);
    S.history.push({ t: Date.now(), id, acc: pct, wpm, secs: Math.round(L.activeMs / 1000), stars });
    if (S.history.length > 300) S.history.shift();
    S.totalSecs += Math.round(L.activeMs / 1000);

    const events = [];
    if (!worldWasDone && Store.worldDone(level.world)) {
      const w = WORLDS[level.world - 1];
      if (w.friend && !S.friends.includes(w.friend)) { S.friends.push(w.friend); events.push({ type: 'friend', friend: w.friend, world: w }); }
      if (level.world === 5) { S.owned['c-gold'] = true; events.push({ type: 'champion' }); }
    }
    if (Store.stage() > S.seenStage) { events.push({ type: 'grow', before: S.seenStage }); S.seenStage = Store.stage(); }
    Store.save();
    App.later(() => this.results({ pct, wpm, stars, coins, notes, newBest, events }), 1050);
  },

  results(r) {
    const L = this.L, level = this.level, next = LEVELS[this.idx + 1], pass = r.stars > 0;
    const speed = SPEED_NAMES.filter(([n]) => r.wpm >= n).pop()[1];
    const title = r.stars === 3 ? 'Perfect flight!' : r.stars === 2 ? 'Great flying!' : r.stars === 1 ? 'Nice work!' : 'So close!';
    const goNext = () => {
      const ev = r.events.shift();
      if (ev) { Celebrate[ev.type](ev, goNext); return; }
      if (!next) App.go('map', { world: 5 });
      else if (next.world !== level.world) App.go('map', { world: next.world });
      else App.go('level', { id: next.id });
    };
    const again = () => App.go('level', { id: level.id });
    const toMap = () => { const ev = r.events.shift(); if (ev) { Celebrate[ev.type](ev, toMap); return; } App.go('map', { world: level.world }); };
    const wrap = App.modal(`<div class="modal result"><h2>${title}${r.newBest ? '<span class="badge-new">New best!</span>' : ''}</h2>
      <div class="stars">${[0, 1, 2].map(i => `<div class="slot">${ic('starOff')}${i < r.stars ? ic('star', 'won') : ''}</div>`).join('')}</div>
      ${pass ? '' : `<p>You scored ${r.pct}%. You need 90% to earn a star.<br>Slow down and aim for the glowing key. You can do it!</p>`}
      <div class="stats">
        <div class="stat ${r.pct >= 90 ? 'good' : ''}"><b>${r.pct}%</b><span>accuracy</span></div>
        <div class="stat"><b>${r.wpm}</b><span>words a minute<br>${speed}</span></div>
        <div class="stat"><b>${L.best}</b><span>keys in a row</span></div>
        <div class="stat"><b>${L.gemsGot}</b><span>gems</span></div>
      </div>
      <div class="earn">${ic('coin')} +<span class="earn-n">0</span>${r.notes.length ? `<small>${esc(r.notes.join(', '))}</small>` : ''}</div>
      <div class="row">
        <button class="btn white" data-act="map">${ic('map')} Map</button>
        ${pass ? `<button class="btn blue" data-act="again">${ic('retry')} Again</button><button class="btn green big" data-act="next">${next ? 'Next' : 'Finish'} ${ic('next')}</button>`
          : `<button class="btn green big" data-act="again">${ic('retry')} Try again</button>`}
      </div></div>`,
    { act: a => { Sound.click(); if (a === 'next') goNext(); else if (a === 'again') again(); else toMap(); },
      key: e => { if (e.key === 'Enter') { Sound.click(); if (pass) goNext(); else again(); } } });

    if (pass) { Sound.fanfare(); FX.confetti(40 + r.stars * 40); } else Sound.almost();
    $$('.won', wrap).forEach((s, i) => App.later(() => {
      s.classList.add('in'); Sound.star(i);
      const p = App.pos(s); FX.burst(p.x, p.y, { n: 18, speed: 340, size: 9 });
    }, 450 + i * 420));
    App.later(() => {
      const e = $('.earn-n', wrap); if (!e) return;
      App.countTo(e, 0, r.coins, 800); Sound.coin();
      const p = App.pos($('.earn', wrap)); FX.burst(p.x, p.y, { n: 14, colors: ['#ffd23f', '#ffc928', '#fff7b0'], speed: 240 });
    }, 500 + r.stars * 420);
  },
});

/* Little parties for big moments */
const Celebrate = {
  show(html, cb) {
    Sound.levelUp(); FX.confetti(130);
    FX.cannon(0, 720, -0.9, 40); FX.cannon(App.W, 720, -2.25, 40);
    App.modal(html, { act: () => { Sound.click(); cb(); }, key: e => { if (e.key === 'Enter' || e.key === ' ') cb(); } });
  },
  friend(ev, cb) {
    this.show(`<div class="modal unlock"><p style="margin:0">You finished ${ev.world.name}!</p><h2>A new friend!</h2>
      ${Art.friend(ev.friend)}
      <p style="margin-top:12px"><b style="color:var(--purple-d)">${FRIENDS[ev.friend].name}</b> has moved into your den.</p>
      <div class="row"><button class="btn green" data-act="ok">Hooray!</button></div></div>`, cb);
  },
  grow(ev, cb) {
    const S = Store.get();
    this.show(`<div class="modal unlock"><h2>${esc(S.pet.name)} grew!</h2><p>All those stars made your dragon bigger and stronger.</p>
      <div class="grow">${App.petSvg('', { stage: ev.before })}${ic('next')}${App.petSvg('happy')}</div>
      <p style="margin-top:10px"><b style="color:var(--purple-d)">${STAGE_NAMES[Store.stage()]}</b></p>
      <div class="row"><button class="btn green" data-act="ok">Hooray!</button></div></div>`, cb);
  },
  champion(ev, cb) {
    const S = Store.get();
    this.show(`<div class="modal unlock"><p style="margin:0">You finished every world!</p><h2>${esc(S.kid)}, typing champion!</h2>
      ${App.petSvg('happy', { color: 'gold', wear: ['crown'] })}
      <p style="margin-top:12px">You unlocked the <b style="color:#c98a00">Legend</b> dragon colour. Find it in the shop.</p>
      <div class="row"><button class="btn green" data-act="ok">Amazing!</button></div></div>`, cb);
  },
};
