/* Dragon Keys - the app shell: sizing, screens, pop-ups, shared bits of UI */
'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = Art.ic;
const cleanName = (s, fallback) => (String(s || '').replace(/[^A-Za-z]/g, '').slice(0, 10).replace(/^./, c => c.toUpperCase())) || fallback;

const App = (() => {
  let stage, screensEl, toastEl, current = null, currentName = '', W = 1280, scale = 1, last = 0;
  let modalEl = null, modalKey = null, modalClose = null, toastTimer = 0;
  const screens = {};
  const timers = new Set();

  function register(name, def) { screens[name] = def; }

  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw / 1280, vh / 720);
    W = Math.round(clamp(vw / scale, 1280, 1680));
    stage.style.width = W + 'px';
    stage.style.transform = `translate(${-W * scale / 2}px, ${-360 * scale}px) scale(${scale})`;
    Scene.resize(W, 720, scale); FX.resize(W, 720, scale);
  }

  /* timers that are cancelled automatically when the screen changes */
  function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; }
  function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

  function go(name, params = {}) {
    if (current && current.exit) current.exit();
    clearTimers();
    closeModal(true);
    FX.clear();
    Scene.gems.length = 0; Scene.onDraw = null; Scene.setHeat(0);
    const old = screensEl.lastElementChild;
    const el = document.createElement('div');
    el.className = 'screen scr-' + name;
    screensEl.appendChild(el);
    if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 230); }
    current = screens[name]; currentName = name;
    current.el = el;
    current.enter(el, params);
  }

  function modal(html, opts = {}) {
    closeModal(true);
    modalEl = document.createElement('div');
    modalEl.className = 'modal-wrap';
    modalEl.innerHTML = html;
    modalKey = opts.key || null; modalClose = opts.onClose || null;
    stage.appendChild(modalEl);
    modalEl.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b && opts.act) { opts.act(b.dataset.act, b, e); return; }
      if (e.target === modalEl && opts.dismiss) closeModal();
    });
    return modalEl;
  }
  function closeModal(silent) {
    if (!modalEl) return;
    const cb = modalClose;
    modalEl.remove(); modalEl = null; modalKey = null; modalClose = null;
    if (cb && !silent) cb();
  }

  function toast(msg, ms = 2600) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  /* position of an element in stage coordinates (ax, ay pick a point inside it) */
  function pos(el, ax = 0.5, ay = 0.5) {
    const r = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: (r.left + r.width * ax - s.left) / scale, y: (r.top + r.height * ay - s.top) / scale };
  }

  /* a live picture of the dragon for use inside the page. over can set stage, color, trail, crest, zoom. */
  function dv(over = {}) {
    return `<canvas class="dv" ${Object.entries(over).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}></canvas>`;
  }
  /* the dragon as she has set it up, for drawing on the main canvas */
  function myDragon(over = {}) {
    const S = Store.get();
    return new Dragon(Object.assign({ color: S.pet.color, stage: Store.stage(), trail: S.pet.trail, crest: S.pet.crest }, over));
  }

  const sysButtons = () => {
    const s = Store.get().settings;
    return `<button class="btn icon" data-g="music" aria-label="Music" title="Music">${ic(s.music ? 'music' : 'musicOff')}</button>
        <button class="btn icon" data-g="sound" aria-label="Sound effects" title="Sound effects">${ic(s.sound ? 'soundOn' : 'soundOff')}</button>
        <button class="btn icon" data-g="full" aria-label="Full screen" title="Full screen">${ic('full')}</button>`;
  };

  function hud({ back = false, title = '', sub = '' } = {}) {
    const S = Store.get();
    return `<div class="hud">
      ${back ? `<button class="btn icon" data-act="back" aria-label="Back">${ic('back')}</button>` : ''}
      <div class="hud-title">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>
      <div class="hud-right">
        ${S.streak.count > 1 ? `<div class="chip" title="Days in a row">${ic('flame')}${S.streak.count}</div>` : ''}
        <div class="chip" title="Stars">${ic('star')}<span class="star-count">${Store.totalStars()}</span></div>
        <div class="chip" title="Shards">${ic('shard')}<span class="coin-count">${S.coins}</span></div>
        ${sysButtons()}
      </div></div>`;
  }

  function countTo(el, from, to, ms = 700) {
    if (!el) return;
    const t0 = performance.now();
    const step = now => {
      const u = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - u, 3)));
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function refreshCoins(from) {
    const S = Store.get();
    $$('.coin-count').forEach(el => { if (from == null) el.textContent = S.coins; else countTo(el, from, S.coins); });
    $$('.star-count').forEach(el => { el.textContent = Store.totalStars(); });
  }

  function onKey(e) {
    Sound.unlock();
    const inField = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (!inField && (e.key === ' ' || e.key === "'" || e.key === '/' || e.key === 'Backspace' || e.key === 'Tab')) e.preventDefault();
    if (e.repeat) return;
    if (modalEl) {
      if (e.key === 'Escape' && modalEl.querySelector('.x')) { closeModal(); return; }
      if (modalKey) modalKey(e);
      return;
    }
    if (inField && e.key !== 'Enter') return;
    if (current && current.key) current.key(e);
  }

  function onGlobalClick(e) {
    Sound.unlock();
    // keep keyboard focus off buttons so Space and Enter never press one by accident while typing
    const a = document.activeElement;
    if (a && a.tagName === 'BUTTON') a.blur();
    const g = e.target.closest('[data-g]');
    if (!g) return;
    const S = Store.get();
    if (g.dataset.g === 'sound') {
      S.settings.sound = !S.settings.sound; Sound.setOn(S.settings.sound); Store.save();
      $$('[data-g="sound"]').forEach(b => { b.innerHTML = ic(S.settings.sound ? 'soundOn' : 'soundOff'); });
      Sound.click();
    } else if (g.dataset.g === 'music') {
      S.settings.music = !S.settings.music; Sound.setMusic(S.settings.music); Store.save();
      $$('[data-g="music"]').forEach(b => { b.innerHTML = ic(S.settings.music ? 'music' : 'musicOff'); });
      Sound.click();
    } else if (g.dataset.g === 'full') {
      const d = document;
      if (d.fullscreenElement) { if (d.exitFullscreen) d.exitFullscreen(); }
      else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (current && current.tick) current.tick(dt);
    if (!current || !current.noScene) { Scene.update(dt); Scene.draw(); }
    DragonViews.tick(dt);
    FX.update(dt); FX.draw();
    requestAnimationFrame(frame);
  }

  function start() {
    stage = $('#stage'); screensEl = $('#screens'); toastEl = $('#toast');
    Scene.init($('#bg')); FX.init($('#fx'));
    const S = Store.load();
    Sound.setOn(S.settings.sound); Sound.setMusic(S.settings.music);
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKey);
    stage.addEventListener('click', onGlobalClick);
    go('title');
    requestAnimationFrame(frame);
  }

  return { register, go, modal, closeModal, toast, pos, dv, myDragon, hud, sysButtons, countTo, refreshCoins, later, start,
    get W() { return W; }, get scale() { return scale; }, get screen() { return currentName; }, get hasModal() { return !!modalEl; } };
})();


/* The home-key warm-up. It runs before the first flight of each day, then gets out of the way. */
'use strict';
App.register('briefing', {
  enter(el, { id } = {}) {
    const level = LEVELS.find(l => l.id === id) || Store.nextLevel(), S = Store.get();
    if (!Store.levelOpen(level.id)) { App.go('den'); return; }
    this.id = level.id; this.taps = 0;
    Scene.setTheme(WORLDS[level.world - 1].theme); Scene.setHorizon(0); Scene.setSpeed(12);
    Sound.music('home'); Sound.setEnergy(.25);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act); });
    el.innerHTML = `${App.hud({ back: true, title: 'Hands ready', sub: 'Once a day · no score or timer' })}
      <div class="warmup-heading panel"><div class="kicker">Today's warm-up</div><h2>Find the bumps on F and J</h2>
        <p>Left index on <b>F</b>. Right index on <b>J</b>. Tap them in turn to wake ${esc(S.pet.name || 'your dragon')}.</p>
        <div class="warmup-taps" aria-label="Warm-up progress">${'<i></i>'.repeat(8)}</div><span class="warmup-note" role="status">8 taps, then you fly.</span>
        <div style="margin-top:12px"><button class="btn small" data-act="skip">Skip today</button></div></div>
      <div class="kb-dock panel">${Keyboard.markup()}</div>`;
    this.kb = Keyboard.create(el); this.kb.setLearned('fj'); this.kb.target('f', false);
  },
  act(a) {
    if (a === 'back') { Sound.click(); App.go('den'); }
    else if (a === 'skip') { Sound.click(); this.launch(); }
  },
  launch() {
    const S = Store.get();
    S.adventure.warmDay = Store.today(); Store.save();
    App.go('level', { id: this.id, route: Missions.autoRoute(this.id) });
  },
  key(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Escape') { this.act('back'); return; }
    if (e.key.length !== 1) return;
    const want = this.taps % 2 ? 'j' : 'f', ok = e.key.toLowerCase() === want;
    this.kb.press(e, ok);
    if (!ok) { $('.warmup-note', this.el).textContent = `Try ${want.toUpperCase()} with your ${want === 'f' ? 'left' : 'right'} index finger.`; return; }
    this.taps++; Sound.key(this.taps, 0);
    $$('.warmup-taps i', this.el).forEach((el, i) => el.classList.toggle('on', i < this.taps));
    if (this.taps === 8) { this.launch(); return; }
    $('.warmup-note', this.el).textContent = `${8 - this.taps} to go.`;
    this.kb.target(this.taps % 2 ? 'j' : 'f', false);
  },
  exit() { if (this.kb) { this.kb.destroy(); this.kb = null; } },
});
