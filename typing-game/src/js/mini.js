/* Dragon Keys - Gem Storm: words fall from the sky, type them before they land */
'use strict';

App.register('mini', {
  enter(el) {
    Scene.setTheme('summit'); Scene.setHorizon(0); Scene.setSpeed(18);
    Sound.music('summit'); Sound.setEnergy(0.25);
    const S = Store.get();
    this.words = Content.miniWords(Store.highestIndex());
    this.state = 'ready'; this.t = 0;
    el.innerHTML = `<div class="lv-top" style="top:0">
        <button class="btn icon" data-act="back" aria-label="Back">${ic('back')}</button>
        <div class="hud-title">Gem Storm<small>Best ${S.mini.best}</small></div>
        <div style="flex:1"></div>
        <div class="chip score"><small>score</small><span>0</span></div>
        <div class="chip lives"></div>
        ${App.sysButtons()}
      </div>
      <div class="mini-area"></div><div class="mini-line"></div>
      <div class="mini-hint panel">Words are falling. Type one to blast it before it reaches the red line.
        <div class="go">Press <span class="keycap">SPACE</span> to start</div></div>`;
    this.area = $('.mini-area', el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act === 'back') { Sound.click(); App.go('den'); } });
    this.d = App.myDragon(); this.d.place(App.W / 2, 640);
    Scene.onDraw = ctx => this.d.draw(ctx);
    this.reset();
  },
  reset() {
    this.drops = []; this.aim = null; this.score = 0; this.lives = 3; this.time = 0; this.spawnIn = 0.4; this.zapped = 0; this.combo = 0;
    this.area.innerHTML = '';
    this.hud();
  },
  hud() {
    $('.chip.score span', this.el).textContent = this.score;
    $('.chip.lives', this.el).innerHTML = [0, 1, 2].map(i => `<span style="opacity:${i < this.lives ? 1 : 0.2}">${ic('flame')}</span>`).join('');
  },
  begin() {
    const h = $('.mini-hint', this.el); if (h) h.remove();
    this.reset(); this.state = 'play'; Sound.whoosh();
  },
  spawn() {
    const W = App.W, laneW = 230, lanes = Math.floor((W - 120) / laneW);
    const used = new Set(this.drops.filter(d => d.y < 150).map(d => d.lane));
    const free = [...Array(lanes).keys()].filter(i => !used.has(i));
    if (!free.length) return;
    const lane = Content.pick(free);
    const maxLen = this.time < 20 ? 4 : this.time < 45 ? 5 : 7;
    const firsts = new Set(this.drops.map(d => d.word[0]));
    let pool = this.words.filter(w => w.length <= maxLen && !firsts.has(w[0]));
    if (!pool.length) pool = this.words.filter(w => w.length <= maxLen);
    const word = Content.pick(pool);
    const el = document.createElement('div');
    el.className = 'drop';
    el.innerHTML = `${ic('shard')}<span><i></i><b>${esc(word)}</b></span>`;
    this.area.appendChild(el);
    const x = 60 + lane * laneW + Math.random() * 60;
    this.drops.push({ word, typed: 0, x, y: 74, lane, el, v: 30 + Math.min(60, this.time * 0.5) + Math.random() * 12 });
  },
  tick(dt) {
    this.t += dt;
    // the dragon hovers below and turns toward the word being typed
    const W = App.W, aimX = this.aim ? this.aim.x + 60 : W / 2;
    this.d.boost = 1;
    this.d.update(dt, W / 2 + (aimX - W / 2) * 0.3 + Math.sin(this.t * 0.8) * 20, 632 + Math.sin(this.t * 1.6) * 10, 90, 22, 7);
    if (this.state !== 'play') return;
    this.time += dt; this.spawnIn -= dt;
    Sound.setEnergy(clamp(0.3 + this.time / 90 + this.combo * 0.03, 0, 1));
    Scene.setHeat(clamp(this.combo / 12, 0, 1));
    if (this.spawnIn <= 0 && this.drops.length < 6) { this.spawn(); this.spawnIn = Math.max(0.95, 2.5 - this.time * 0.022); }
    for (const d of this.drops.slice()) {
      if (d.dead || this.state !== 'play') continue;
      d.y += d.v * dt;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
      if (d.y > 720 - 138 - 46) this.land(d);
    }
  },
  land(d) {
    const p = App.pos(d.el);
    FX.burst(p.x, p.y, { n: 14, colors: ['#ff4d6d', '#ffffff', '#ff9a3d'], speed: 240 });
    this.remove(d);
    this.lives--; this.combo = 0; Sound.miss(); Scene.hit(); this.hud();
    if (this.lives <= 0) this.over();
  },
  remove(d) {
    d.dead = true; d.el.remove();
    this.drops = this.drops.filter(x => x !== d);
    if (this.aim === d) this.aim = null;
  },
  key(e) {
    if (this.state === 'ready') { if (e.key === ' ' || e.key === 'Enter') this.begin(); else if (e.key === 'Escape') App.go('den'); return; }
    if (e.key === 'Escape') { App.go('den'); return; }
    if (this.state !== 'play' || e.key.length !== 1) return;
    const k = e.key.toLowerCase();
    if (!this.aim) {
      const hits = this.drops.filter(d => d.word[0] === k).sort((a, b) => b.y - a.y);
      if (!hits.length) { Sound.nope(); return; }
      this.aim = hits[0]; this.aim.el.classList.add('aim');
    }
    const d = this.aim;
    if (d.word[d.typed] !== k) {
      Sound.nope(); d.el.classList.remove('bad'); void d.el.offsetWidth; d.el.classList.add('bad');
      return;
    }
    d.typed++; Sound.key(d.typed, this.combo * 4);
    $('i', d.el).textContent = d.word.slice(0, d.typed); $('b', d.el).textContent = d.word.slice(d.typed);
    if (d.typed >= d.word.length) this.zap(d);
  },
  zap(d) {
    const from = this.d.mouth(), to = App.pos(d.el);
    d.dead = true; this.aim = null; this.combo++;
    const pts = d.word.length * 10;
    this.score += pts; this.zapped++;
    this.d.jawTarget = 1; Sound.fire();
    setTimeout(() => { this.d.jawTarget = 0; }, 260);
    FX.shoot(from, to, () => {
      FX.burst(to.x, to.y, { n: 20, speed: 360, size: 9, colors: ['#22e1ff', '#ffffff', '#ffd23f', '#ff3df0'] });
      FX.text(to.x, to.y - 20, '+' + pts, '#ffc23d', 26);
      Sound.gem();
      d.el.remove(); this.drops = this.drops.filter(x => x !== d);
    });
    this.hud();
  },
  over() {
    const S = Store.get();
    this.state = 'over';
    this.drops.forEach(d => d.el.remove()); this.drops = [];
    const coins = Math.min(30, Math.floor(this.score / 40));
    const best = this.score > S.mini.best;
    if (best) S.mini.best = this.score;
    S.mini.plays++; Store.addCoins(coins); Store.save();
    Sound.setEnergy(0.3); Scene.setHeat(0);
    if (best && this.score > 0) { Sound.fanfare(); FX.confetti(80); } else Sound.almost();
    App.modal(`<div class="modal"><div class="kicker">Gem Storm</div><h2>${best && this.score > 0 ? 'New best score' : 'Storm over'}</h2>
      <p>You blasted ${this.zapped} ${this.zapped === 1 ? 'word' : 'words'}.</p>
      <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat good"><b>${this.score}</b><span>score</span></div><div class="stat"><b>${S.mini.best}</b><span>best</span></div></div>
      <div class="earn">${ic('shard')} +${coins}</div>
      <div class="row"><button class="btn" data-act="den">${ic('home')} Lair</button><button class="btn primary big" data-act="again">${ic('retry')} Again</button></div></div>`,
    { act: a => { Sound.click(); if (a === 'den') App.go('den'); else { App.closeModal(); $('.hud-title small', this.el).textContent = 'Best ' + S.mini.best; this.begin(); } },
      key: e => { if (e.key === 'Enter') { App.closeModal(); this.begin(); } } });
  },
});

