/* Dragon Keys - Gem Storm: words fall from the sky, type them before they land */
'use strict';

App.register('mini', {
  enter(el) {
    Scene.setTheme('summit'); Scene.setHorizon(0); Scene.setSpeed(18);
    const S = Store.get();
    this.words = Content.miniWords(Store.highestIndex());
    this.state = 'ready';
    el.innerHTML = `<div class="lv-top">
        <button class="btn white round" data-act="back" aria-label="Back">${ic('back')}</button>
        <div class="hud-title">Gem Storm<small>Best: ${S.mini.best}</small></div>
        <div style="flex:1"></div>
        <div class="pill score">${ic('gem')}<b>0</b></div>
        <div class="pill lives"></div>
        ${App.sysButtons()}
      </div>
      <div class="mini-area"></div><div class="mini-line"></div><div class="mini-rock"></div>
      <div class="mini-pet">${App.petSvg()}</div>
      <div class="mini-hint glass">Gems are falling! Type a word to zap its gem before it lands.<br>
        <span style="color:var(--purple-d)">Press <span class="keycap" style="--kc:#8f96b3;min-width:128px;height:40px;font-size:21px">SPACE</span> to start</span></div>`;
    this.area = $('.mini-area', el);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && b.dataset.act === 'back') { Sound.click(); App.go('den'); } });
    this.reset();
  },
  reset() {
    this.drops = []; this.aim = null; this.score = 0; this.lives = 3; this.time = 0; this.spawnIn = 0.4; this.zapped = 0;
    this.area.innerHTML = '';
    this.hud();
  },
  hud() {
    $('.pill.score b', this.el).textContent = this.score;
    $('.pill.lives', this.el).innerHTML = [0, 1, 2].map(i => ic(i < this.lives ? 'heart' : 'heartOff')).join('');
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
    el.innerHTML = `${ic('gem')}<span><i></i><b>${esc(word)}</b></span>`;
    this.area.appendChild(el);
    const x = 60 + lane * laneW + Math.random() * 60;
    this.drops.push({ word, typed: 0, x, y: 70, lane, el, v: 30 + Math.min(60, this.time * 0.5) + Math.random() * 12 });
  },
  tick(dt) {
    if (this.state !== 'play') return;
    this.time += dt; this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.drops.length < 6) { this.spawn(); this.spawnIn = Math.max(0.95, 2.5 - this.time * 0.022); }
    for (const d of this.drops.slice()) {
      if (d.dead || this.state !== 'play') continue;
      d.y += d.v * dt;
      d.el.style.transform = `translate(${d.x}px, ${d.y}px)`;
      if (d.y > 720 - 138 - 50) this.land(d);
    }
  },
  land(d) {
    const p = App.pos(d.el);
    FX.burst(p.x, p.y, { n: 12, colors: ['#9aa0bd', '#ffffff', '#59d8ff'], speed: 200 });
    this.remove(d);
    this.lives--; Sound.lose(); this.hud();
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
      if (!hits.length) { Sound.miss(); return; }
      this.aim = hits[0]; this.aim.el.classList.add('aim');
    }
    const d = this.aim;
    if (d.word[d.typed] !== k) {
      Sound.miss(); d.el.classList.remove('bad'); void d.el.offsetWidth; d.el.classList.add('bad');
      return;
    }
    d.typed++; Sound.key(d.typed);
    $('i', d.el).textContent = d.word.slice(0, d.typed); $('b', d.el).textContent = d.word.slice(d.typed);
    if (d.typed >= d.word.length) this.zap(d);
  },
  zap(d) {
    const svg = $('.mini-pet svg', this.el), from = App.mouthPos(svg), to = App.pos(d.el);
    d.dead = true; this.aim = null;
    this.score += d.word.length * 10; this.zapped++;
    svg.classList.add('mouth-open'); Sound.fire();
    setTimeout(() => svg.classList.remove('mouth-open'), 260);
    FX.shoot(from, to, () => {
      FX.burst(to.x, to.y, { n: 20, speed: 340, size: 9, colors: ['#59d8ff', '#ffffff', '#ffd23f', '#ff8fc1'] });
      FX.text(to.x, to.y - 20, '+' + d.word.length * 10, '#ffd23f', 30);
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
    if (best && this.score > 0) { Sound.fanfare(); FX.confetti(90); } else Sound.almost();
    App.modal(`<div class="modal"><h2>${best && this.score > 0 ? 'New best score!' : 'The storm has passed'}</h2>
      <p>You zapped ${this.zapped} ${this.zapped === 1 ? 'gem' : 'gems'}.</p>
      <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat good"><b>${this.score}</b><span>score</span></div><div class="stat"><b>${S.mini.best}</b><span>best</span></div></div>
      <div class="earn">${ic('coin')} +${coins}</div>
      <div class="row"><button class="btn white" data-act="den">${ic('home')} Den</button><button class="btn green big" data-act="again">${ic('retry')} Play again</button></div></div>`,
    { act: a => { Sound.click(); if (a === 'den') App.go('den'); else { App.closeModal(); $('.hud-title small', this.el).textContent = 'Best: ' + S.mini.best; this.begin(); } },
      key: e => { if (e.key === 'Enter') { App.closeModal(); this.begin(); } } });
  },
});
