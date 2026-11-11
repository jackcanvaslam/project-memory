/* Dragon Keys - the world map */
'use strict';

App.register('map', {
  enter(el, params = {}) {
    const next = Store.nextLevel();
    this.world = params.world || next.world;
    this.t = 0;
    Scene.setHorizon(0); Scene.setSpeed(14);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b); });
    this.d = App.myDragon({ size: [1.25, 1.1, 1, 0.95][Store.stage()] }); this.d.place(App.W / 2, 300);
    Scene.onDraw = ctx => this.d.draw(ctx);
    this.render();
    if (params.open) this.card(params.open);
  },
  spots(n) {
    return n === 6
      ? [[170, 505], [372, 395], [574, 505], [776, 390], [968, 495], [1128, 375]]
      : [[230, 490], [490, 382], [770, 490], [1040, 376]];
  },
  render() {
    const el = this.el, w = WORLDS[this.world - 1], open = Store.worldOpen(this.world);
    Scene.setTheme(w.theme);
    Sound.music(w.theme); Sound.setEnergy(0.3);
    const levels = Store.worldLevels(this.world), pts = this.spots(levels.length), next = Store.nextLevel();
    const got = levels.reduce((t, l) => t + Store.levelStars(l.id), 0);
    // a smooth glowing trail through the level spots
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    this.orbit = null;
    const nodes = levels.map((l, i) => {
      const stars = Store.levelStars(l.id), unlocked = Store.levelOpen(l.id) && open, isNext = l.id === next.id && stars === 0 && unlocked;
      if (isNext) this.orbit = pts[i];
      const cls = ['node', stars ? 'done' : '', !unlocked ? 'locked' : '', isNext ? 'next' : ''].join(' ');
      const face = !unlocked ? ic('lock') : l.kind === 'review' ? ic('bolt') : String(i + 1).padStart(2, '0');
      const label = l.kind === 'review' ? 'Final run' : l.title;
      return `<button class="${cls}" style="left:${pts[i][0]}px;top:${pts[i][1]}px" data-act="level" data-id="${l.id}" ${unlocked ? '' : 'tabindex="-1"'}>
        <span class="node-dot">${face}</span>
        <span class="node-stars">${[0, 1, 2].map(s => ic(s < stars ? 'star' : 'starOff')).join('')}</span>
        <span class="node-label">${esc(label)}</span></button>`;
    }).join('');
    if (!this.orbit && open) { const i = levels.findIndex(l => l.id === next.id); this.orbit = pts[i >= 0 ? i : pts.length - 1]; }
    el.innerHTML = `${App.hud({ back: true, title: 'World map' })}
      <div class="map-banner panel"><div class="kicker">World ${w.id} · ${w.skill}</div><h2>${w.name}</h2><p>${ic('star')} ${got} of ${levels.length * 3}</p></div>
      <div class="map-area">
        ${open ? `<svg class="path" viewBox="0 0 1280 720">
          <path d="${d}" fill="none" stroke="rgba(${Scene.ACCENT[w.theme]},.25)" stroke-width="10" stroke-linecap="round"/>
          <path class="flow" d="${d}" fill="none" stroke="rgb(${Scene.ACCENT[w.theme]})" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="14 14"/></svg>${nodes}`
        : `<div class="map-lock panel" style="position:absolute">${ic('lock')}<h3>${w.name} is locked</h3><p>Finish every level in ${WORLDS[this.world - 2].name} to open it.</p></div>`}
      </div>
      ${this.world > 1 ? `<button class="btn icon map-arrow l" data-act="prev" aria-label="Previous world">${ic('back')}</button>` : ''}
      ${this.world < WORLDS.length ? `<button class="btn icon map-arrow r" data-act="nextw" aria-label="Next world">${ic('next')}</button>` : ''}
      <div class="map-dots">${WORLDS.map(x => `<button class="${x.id === this.world ? 'on' : ''}" data-act="world" data-id="${x.id}" aria-label="World ${x.id}">${Store.worldOpen(x.id) ? '0' + x.id : ic('lock')}</button>`).join('')}</div>`;
  },
  tick(dt) {
    this.t += dt;
    const off = (App.W - 1280) / 2, o = this.orbit, t = this.t;
    this.d.boost = 1.2;
    // the dragon circles the level she is up to
    if (o) this.d.update(dt, o[0] + off + Math.cos(t * 1.25) * 120, o[1] - 10 + Math.sin(t * 1.25) * 84, 0, 24, 7);
    else this.d.update(dt, App.W / 2 + Math.sin(t * 0.5) * 300, 250 + Math.sin(t * 1.1) * 70, 0, 20, 7);
  },
  act(a, b) {
    if (a === 'back') { Sound.click(); App.go('den'); }
    else if (a === 'prev') { this.world--; Sound.whoosh(); this.render(); }
    else if (a === 'nextw') { this.world++; Sound.whoosh(); this.render(); }
    else if (a === 'world') { this.world = +b.dataset.id; Sound.whoosh(); this.render(); }
    else if (a === 'level') { Sound.pop(); this.card(b.dataset.id); }
  },
  card(id) {
    const l = LEVELS.find(x => x.id === id), rec = Store.get().levels[id];
    if (!l || !Store.levelOpen(id)) return;
    const n = Store.worldLevels(l.world).indexOf(l) + 1;
    const start = () => { Sound.click(); App.go('level', { id }); };
    App.modal(`<div class="modal lv-card"><button class="btn icon x" data-act="close" aria-label="Close">${ic('close')}</button>
      <div class="kicker">World ${l.world} · Level ${n}</div><h2>${esc(l.title)}</h2>
      ${LevelInfo.html(l)}
      ${rec && rec.plays ? `<div class="best">${[0, 1, 2].map(s => ic(s < (rec.stars || 0) ? 'star' : 'starOff')).join('')} best ${rec.bestAcc || 0}% · ${rec.bestWpm || 0} wpm</div>` : ''}
      <div class="row"><button class="btn primary big" data-act="start">${ic('play')} Start</button></div></div>`,
    { dismiss: true, act: a => { if (a === 'start') start(); else App.closeModal(); }, key: e => { if (e.key === 'Enter' || e.key === ' ') start(); } });
  },
  key(e) {
    if (e.key === 'ArrowLeft' && this.world > 1) this.act('prev');
    else if (e.key === 'ArrowRight' && this.world < WORLDS.length) this.act('nextw');
    else if (e.key === 'Enter') { const n = Store.nextLevel(); if (n.world === this.world && Store.worldOpen(this.world)) this.card(n.id); }
    else if (e.key === 'Escape') this.act('back');
  },
});

/* What a level teaches, shown on the map card and at the start of the level */
const LevelInfo = {
  html(l) {
    if (l.kind === 'keys') {
      const caps = [...l.keys].map(k => {
        const f = Keyboard.fingerOf(k);
        return `<div><span class="keycap" style="--kc:${Art.FINGER_COLORS[f]}">${esc(k.toUpperCase())}</span>${Keyboard.fingerName(f)}</div>`;
      }).join('');
      return `<p>Two new keys</p><div class="keys">${caps}</div>`;
    }
    if (l.intro) return `<p>${esc(l.intro)}</p>`;
    if (l.kind === 'review') return '<p>The final run for this world. Every key you have learned, mixed together.</p>';
    if (l.kind === 'common') return '<p>The words people type most often. Get them into your fingers.</p>';
    if (l.id === '4-4') return '<p>Capitals, commas and question marks, all together in real sentences.</p>';
    if (l.id === '5-5' || l.id === '5-6') return '<p>Type the story to find out what happens.</p>';
    return '<p>Real sentences. Eyes on the screen and let your fingers find the keys.</p>';
  },
};
