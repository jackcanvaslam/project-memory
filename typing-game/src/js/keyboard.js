/* Dragon Keys - the on-screen keyboard and the two guide hands */
'use strict';

const Keyboard = (() => {
  const SPECIAL_FINGER = { Tab: 'L1', CapsLock: 'L1', ShiftLeft: 'L1', Backspace: 'R1', Enter: 'R1', ShiftRight: 'R1', ' ': 'T' };
  const fingerOf = k => SPECIAL_FINGER[k] || KEY_FINGER[k] || 'R1';
  const FINGER_LABEL = { 1: 'pinky', 2: 'ring finger', 3: 'middle finger', 4: 'index finger' };

  function markup() {
    const rows = KEY_ROWS.map((row, r) => {
      const keys = row.map(([label, w, id], i) => {
        const k = id || label, f = fingerOf(k), wide = label.length > 1;
        let style = `--kc:${Art.FINGER_COLORS[f]}`;
        if (k === ' ') style += ';flex:none;width:352px';
        else if (wide && i === 0) style += `;flex:none;width:${Math.round(w * 50 + (w - 1) * 5)}px`;
        const cls = ['key', wide ? 'wide' : '', (k === 'f' || k === 'j') ? 'bump' : ''].join(' ');
        return `<div class="${cls}" data-k="${k === '"' ? '&quot;' : k === '\\' ? '\\' : k}" style="${style}">${label === '\\' ? '\\' : label}</div>`;
      }).join('');
      return `<div class="kb-row ${r === 0 ? 'num' : r === 4 ? 'sp' : ''}">${keys}</div>`;
    }).join('');
    const hand = side => `<div class="hand-box"><div class="finger-hint hint-${side}"></div>${Art.hand(side)}</div>`;
    return `${hand('left')}<div class="kb">${rows}</div>${hand('right')}`;
  }

  /* What it takes to type a character: which key, and whether Shift is needed */
  function plan(ch) {
    let base = ch, shift = false;
    if (SHIFTED[ch]) { base = SHIFTED[ch]; shift = true; }
    else if (ch.length === 1 && ch !== ch.toLowerCase()) { base = ch.toLowerCase(); shift = true; }
    const finger = fingerOf(base);
    const shiftKey = shift ? (finger[0] === 'L' ? 'ShiftRight' : 'ShiftLeft') : null;
    return { base, shift, finger, shiftKey, shiftFinger: shiftKey ? SPECIAL_FINGER[shiftKey] : null };
  }
  function fingerName(f) {
    if (f === 'T') return 'thumb';
    return (f[0] === 'L' ? 'left ' : 'right ') + FINGER_LABEL[f[1]];
  }

  function create(root) {
    const keyEls = {};
    root.querySelectorAll('.key').forEach(el => { keyEls[el.dataset.k] = el; });
    const hints = { L: root.querySelector('.hint-left'), R: root.querySelector('.hint-right') };
    let targets = [];

    function clear() {
      targets.forEach(el => el.classList.remove('target'));
      targets = [];
      root.querySelectorAll('.fg.use').forEach(el => el.classList.remove('use'));
      Object.values(hints).forEach(h => h && h.classList.remove('show'));
    }
    function useFinger(f, text) {
      const sel = f === 'T' ? '.fg-T' : '.fg-' + f;
      root.querySelectorAll(sel).forEach(el => { el.classList.add('use'); el.style.setProperty('--fc', Art.FINGER_COLORS[f]); });
      const sides = f === 'T' ? ['L', 'R'] : [f[0]];
      sides.forEach(s => { const h = hints[s]; if (h) { h.textContent = text; h.style.setProperty('--fc', Art.FINGER_COLORS[f]); h.classList.add('show'); } });
    }
    function target(ch) {
      clear();
      if (ch == null) return;
      const p = plan(ch);
      const el = keyEls[p.base];
      if (el) { el.classList.add('target'); targets.push(el); }
      useFinger(p.finger, p.finger === 'T' ? 'thumb' : FINGER_LABEL[p.finger[1]]);
      if (p.shiftKey) {
        const s = keyEls[p.shiftKey];
        if (s) { s.classList.add('target'); targets.push(s); }
        useFinger(p.shiftFinger, 'pinky on Shift');
      }
    }
    function setLearned(keys) {
      const known = keys == null ? null : new Set(keys);
      const shift = keys == null || keys.includes('SHIFT');
      for (const k in keyEls) {
        let on;
        if (k === ' ') on = true;
        else if (k === 'ShiftLeft' || k === 'ShiftRight') on = shift;
        else if (k.length > 1) on = false;
        else on = known ? known.has(k) : !/[0-9`\-=\[\]\\]/.test(k);
        keyEls[k].classList.toggle('off', !on);
      }
    }
    function press(e, ok) {
      let k = e.code === 'ShiftLeft' || e.code === 'ShiftRight' ? e.code : e.key;
      if (k.length === 1) k = SHIFTED[k] || k.toLowerCase();
      const el = keyEls[k];
      if (!el) return;
      const cls = ok == null ? ['down'] : ['down', ok ? 'ok' : 'bad'];
      el.classList.add(...cls);
      setTimeout(() => el.classList.remove(...cls), 150);
    }
    return { target, clear, setLearned, press, keyEls };
  }

  return { markup, create, plan, fingerName, fingerOf };
})();
