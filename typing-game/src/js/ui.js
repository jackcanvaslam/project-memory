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
    Scene.gems.length = 0;
    const old = screensEl.lastElementChild;
    const el = document.createElement('div');
    el.className = 'screen scr-' + name;
    screensEl.appendChild(el);
    if (old) { old.classList.add('leaving'); setTimeout(() => old.remove(), 250); }
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
  const mouthPos = svg => pos(svg, 0.80, 0.585);

  function petSvg(cls = '', over = {}) {
    const S = Store.get();
    return Art.dragon(Object.assign({ color: S.pet.color, stage: Store.stage(), wear: S.pet.wear, cls }, over));
  }

  const sysButtons = () => `<button class="btn white round" data-g="sound" aria-label="Sound">${ic(Store.get().settings.sound ? 'soundOn' : 'soundOff')}</button>
        <button class="btn white round" data-g="full" aria-label="Full screen">${ic('full')}</button>`;

  function hud({ back = false, title = '', sub = '' } = {}) {
    const S = Store.get();
    return `<div class="hud">
      ${back ? `<button class="btn white round" data-act="back" aria-label="Back">${ic('back')}</button>` : ''}
      <div class="hud-title">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>
      <div class="hud-right">
        ${S.streak.count > 1 ? `<div class="pill" title="Days in a row">${ic('flame')}<b>${S.streak.count}</b></div>` : ''}
        <div class="pill" title="Stars">${ic('star')}<b class="star-count">${Store.totalStars()}</b></div>
        <div class="pill coin-pill" title="Coins">${ic('coin')}<b class="coin-count">${S.coins}</b></div>
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
    } else if (g.dataset.g === 'full') {
      const d = document;
      if (d.fullscreenElement) { if (d.exitFullscreen) d.exitFullscreen(); }
      else if (d.documentElement.requestFullscreen) d.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (!current || !current.noScene) { Scene.update(dt); Scene.draw(); }
    if (current && current.tick) current.tick(dt);
    FX.update(dt); FX.draw();
    requestAnimationFrame(frame);
  }

  function start() {
    stage = $('#stage'); screensEl = $('#screens'); toastEl = $('#toast');
    Scene.init($('#bg')); FX.init($('#fx'));
    const S = Store.load();
    Sound.setOn(S.settings.sound);
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('keydown', onKey);
    stage.addEventListener('click', onGlobalClick);
    go('title');
    requestAnimationFrame(frame);
  }

  return { register, go, modal, closeModal, toast, pos, mouthPos, petSvg, hud, sysButtons, countTo, refreshCoins, later, start,
    get W() { return W; }, get scale() { return scale; }, get screen() { return currentName; }, get hasModal() { return !!modalEl; } };
})();
