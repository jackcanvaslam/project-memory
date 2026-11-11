/* Dragon Keys - the world map */
'use strict';

App.register('map', {
  enter(el, params = {}) {
    const next = Store.nextLevel();
    this.world = params.world || next.world;
    Scene.setHorizon(0); Scene.setSpeed(14);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b); });
    this.render();
    if (params.open) this.card(params.open);
  },
  spots(n) {
    return n === 6
      ? [[170, 505], [372, 385], [574, 505], [776, 380], [968, 495], [1128, 365]]
      : [[230, 490], [490, 372], [770, 490], [1040, 366]];
  },
  render() {
    const el = this.el, w = WORLDS[this.world - 1], open = Store.worldOpen(this.world);
    Scene.setTheme(w.theme);
    const levels = Store.worldLevels(this.world), pts = this.spots(levels.length), next = Store.nextLevel();
    const got = levels.reduce((t, l) => t + Store.levelStars(l.id), 0);
    // a smooth dotted trail through the level spots
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    let petAt = null;
    const nodes = levels.map((l, i) => {
      const stars = Store.levelStars(l.id), unlocked = Store.levelOpen(l.id) && open, isNext = l.id === next.id && stars === 0 && unlocked;
      if (isNext) petAt = pts[i];
      const cls = ['node', stars ? 'done' : '', l.kind === 'review' ? 'review' : '', !unlocked ? 'locked' : '', isNext ? 'next' : ''].join(' ');
      const face = !unlocked ? ic('lock') : l.kind === 'review' ? ic('gem') : (i + 1);
      const label = l.title.replace(/ Treasure Flight$/, '').replace(/^(Sunny Meadow|Meadow|Sky Peaks|Crystal Cave)$/, 'Treasure Flight');
      return `<button class="${cls}" style="left:${pts[i][0]}px;top:${pts[i][1]}px" data-act="level" data-id="${l.id}" ${unlocked ? '' : 'tabindex="-1"'}>
        <span class="node-dot">${face}</span>
        <span class="node-stars">${[0, 1, 2].map(s => ic(s < stars ? 'star' : 'starOff')).join('')}</span>
        <span class="node-label">${esc(label)}</span></button>`;
    }).join('');
    if (!petAt && open) { const i = levels.findIndex(l => l.id === next.id); petAt = pts[i >= 0 ? i : pts.length - 1]; }
    el.innerHTML = `${App.hud({ back: true, title: 'World Map' })}
      <div class="map-banner glass"><h2>World ${w.id}: ${w.name}</h2><p>${w.skill} &nbsp;·&nbsp; ${ic('star')} ${got} of ${levels.length * 3}</p></div>
      <div class="map-area">
        ${open ? `<svg class="path" viewBox="0 0 1280 720"><path d="${d}" fill="none" stroke="rgba(40,25,110,.35)" stroke-width="16" stroke-linecap="round" stroke-dasharray="2 30" transform="translate(0 6)"/>
          <path d="${d}" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 30"/></svg>${nodes}
          ${petAt ? `<div class="map-pet" style="left:${petAt[0] - 138}px;top:${petAt[1] - 150}px">${App.petSvg('fly')}</div>` : ''}`
        : `<div class="map-lock glass" style="position:absolute">${ic('lock')}<h3>${w.name} is still locked</h3><p>Finish every level in ${WORLDS[this.world - 2].name} to open it.</p></div>`}
      </div>
      ${this.world > 1 ? `<button class="btn white round map-arrow l" data-act="prev" aria-label="Previous world">${ic('back')}</button>` : ''}
      ${this.world < WORLDS.length ? `<button class="btn white round map-arrow r" data-act="nextw" aria-label="Next world">${ic('next')}</button>` : ''}
      <div class="map-dots">${WORLDS.map(x => `<button class="${x.id === this.world ? 'on' : ''} ${Store.worldOpen(x.id) ? '' : 'locked'}" data-act="world" data-id="${x.id}" aria-label="World ${x.id}">${Store.worldOpen(x.id) ? x.id : ic('lock')}</button>`).join('')}</div>`;
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
    App.modal(`<div class="modal lv-card"><button class="x" data-act="close" aria-label="Close">${ic('close')}</button>
      <p style="margin:0">World ${l.world} · Level ${n}</p><h2>${esc(l.title)}</h2>
      ${LevelInfo.html(l)}
      ${rec && rec.plays ? `<div class="best">${[0, 1, 2].map(s => ic(s < (rec.stars || 0) ? 'star' : 'starOff')).join('')} Best: ${rec.bestAcc || 0}% · ${rec.bestWpm || 0} words a minute</div>` : ''}
      <div class="row"><button class="btn green big" data-act="start">${ic('play')} Start</button></div></div>`,
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
      return `<p>Two new keys to learn:</p><div class="keys">${caps}</div>`;
    }
    if (l.intro) return `<p>${esc(l.intro)}</p>`;
    if (l.kind === 'review') return '<p>A treasure flight! Use every key you have learned to collect the gems.</p>';
    if (l.kind === 'common') return '<p>These are the words people type most often. Get them into your fingers!</p>';
    if (l.id === '4-4') return '<p>Capitals, commas and question marks, all together in real sentences.</p>';
    if (l.id.startsWith('5-5') || l.id.startsWith('5-6')) return '<p>Type the story to find out what happens.</p>';
    return '<p>Real sentences now. Keep your eyes on the screen and let your fingers find the keys.</p>';
  },
};
