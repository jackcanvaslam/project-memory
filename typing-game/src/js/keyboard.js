/* Dragon Keys - the on-screen keyboard and the two guide hands */
'use strict';

const Keyboard = (() => {
  const SPECIAL_FINGER = { Tab: 'L1', CapsLock: 'L1', ShiftLeft: 'L1', Backspace: 'R1', Enter: 'R1', ShiftRight: 'R1', ' ': 'T' };
  const fingerOf = k => SPECIAL_FINGER[k] || KEY_FINGER[k] || 'R1';
  const FINGER_LABEL = { 1: 'pinky', 2: 'ring finger', 3: 'middle finger', 4: 'index finger' };
  const HOME_KEY = { L1: 'A', L2: 'S', L3: 'D', L4: 'F', R4: 'J', R3: 'K', R2: 'L', R1: ';' };

  function handMarkup(side) {
    const left = side === 'left', prefix = left ? 'L' : 'R';
    // The original thumb extends beyond x=190 when rotated. Reserve room for
    // both thumbs, their outlines and the hint animation inside the SVG itself.
    let svg = Art.hand(side).replace('viewBox="0 0 190 200"', 'viewBox="-24 -16 238 232"')
      .replace(`class="fg fg-${prefix}4"`, `class="fg fg-${prefix}4 home-finger"`);
    const letters = left ? ['A', 'S', 'D', 'F'] : [';', 'L', 'K', 'J'];
    const x = [32.5, 63.5, 95.5, 127.5], y = [103, 75, 61, 79];
    // Text sits outside the mirrored hand group so right-hand labels stay legible.
    const labels = letters.map((letter, i) => `<text class="hand-key hand-key-${prefix}${i + 1}${i === 3 ? ' home-letter' : ''}" x="${left ? x[i] : 190 - x[i]}" y="${y[i]}" text-anchor="middle">${letter}</text>`).join('');
    svg = svg.replace('</svg>', `${labels}<text class="hand-caption" x="${left ? 82 : 108}" y="175" text-anchor="middle">${side.toUpperCase()} HAND</text><text class="hand-caption-sub" x="${left ? 82 : 108}" y="192" text-anchor="middle">HOME KEYS</text></svg>`);
    return `<div class="hand-box"><div class="finger-hint hint-${side}"></div>${svg}</div>`;
  }

  function markup() {
    const rows = KEY_ROWS.map((row, r) => {
      const keys = row.map(([label, w, id], i) => {
        const k = id || label, f = fingerOf(k), wide = label.length > 1;
        let style = `--kc:${Art.FINGER_COLORS[f]}`;
        if (k === ' ') style += ';flex:none;width:352px';
        else if (wide && i === 0) style += `;flex:none;width:${Math.round(w * 44 + (w - 1) * 4)}px`;
        const cls = ['key', wide ? 'wide' : '', (k === 'f' || k === 'j') ? 'bump home-anchor' : ''].join(' ');
        return `<div class="${cls}" data-k="${k === '"' ? '&quot;' : k === '\\' ? '\\' : k}" style="${style}">${label === '\\' ? '\\' : label}</div>`;
      }).join('');
      return `<div class="kb-row ${r === 0 ? 'num' : r === 4 ? 'sp' : ''}">${keys}</div>`;
    }).join('');
    return `<div class="keyboard-coach">
      <div class="coach-bar">
        <div class="coach-key" aria-hidden="true">F J</div>
        <div class="coach-copy"><strong class="coach-title">Find your home keys</strong><span class="coach-detail">Rest your left index on F and your right index on J.</span></div>
        <button class="coach-help" type="button" data-coach-help hidden>Show hint</button>
        <div class="coach-anchors"><span>Left index <b>F</b></span><span>Right index <b>J</b></span><small>Feel the raised bumps</small></div>
      </div>
      <div class="keyboard-hands">${handMarkup('left')}<div class="kb">${rows}</div>${handMarkup('right')}</div>
    </div>`;
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

  function coaching(ch) {
    const p = plan(ch), name = fingerName(p.finger);
    let detail;
    if (p.finger === 'T') detail = 'Tap Space with one thumb. Keep your other fingers on their home keys.';
    else if (p.shift) detail = `Hold ${fingerName(p.shiftFinger)} on Shift, then tap ${p.base.toUpperCase()}. Return to ${HOME_KEY[p.finger]}.`;
    else if (p.base === 'f' || p.base === 'j') detail = `Find the raised bump on ${p.base.toUpperCase()}. This is your ${name}'s home.`;
    else if (HOME_KEY[p.finger].toLowerCase() === p.base) detail = `Keep this finger resting on ${p.base.toUpperCase()}. Tap gently, then relax.`;
    else detail = `Reach from ${HOME_KEY[p.finger]} to ${p.base.toUpperCase()}, then return to ${HOME_KEY[p.finger]}.`;
    return { title: `${name} → ${ch === ' ' ? 'SPACE' : ch.toUpperCase()}`, detail, key: ch === ' ' ? '␣' : ch, color: Art.FINGER_COLORS[p.finger] };
  }

  function create(root) {
    const keyEls = {};
    root.querySelectorAll('.key').forEach(el => { keyEls[el.dataset.k] = el; });
    const hints = { L: root.querySelector('.hint-left'), R: root.querySelector('.hint-right') };
    const coach = root.querySelector('.keyboard-coach');
    const title = root.querySelector('.coach-title'), detail = root.querySelector('.coach-detail'), badge = root.querySelector('.coach-key');
    const help = root.querySelector('[data-coach-help]');
    let targets = [], current = null, memory = false, pending = null, destroyed = false;
    const pressTimers = new Set();

    function cancelHint() { if (pending !== null) clearTimeout(pending); pending = null; }
    function clearLights() {
      targets.forEach(el => el.classList.remove('target')); targets = [];
      root.querySelectorAll('.fg.use, .hand-key.use').forEach(el => el.classList.remove('use'));
      Object.values(hints).forEach(h => h && h.classList.remove('show'));
    }

    function clear() {
      cancelHint(); clearLights(); current = null;
      if (title) title.textContent = 'Find your home keys';
      if (detail) detail.textContent = 'Rest your left index on F and your right index on J.';
      if (badge) badge.textContent = 'F J';
      if (help) help.hidden = true;
      if (coach) { coach.classList.remove('awaiting-hint'); coach.style.removeProperty('--coach-color'); }
    }
    function useFinger(f, text) {
      const sel = f === 'T' ? '.fg-T' : '.fg-' + f + ', .hand-key-' + f;
      root.querySelectorAll(sel).forEach(el => { el.classList.add('use'); el.style.setProperty('--fc', Art.FINGER_COLORS[f]); });
      const sides = f === 'T' ? ['L', 'R'] : [f[0]];
      sides.forEach(s => { const h = hints[s]; if (h) { h.textContent = text; h.style.setProperty('--fc', Art.FINGER_COLORS[f]); h.classList.add('show'); } });
    }
    function reveal() {
      cancelHint();
      if (current == null || destroyed) return;
      clearLights();
      const p = plan(current), copy = coaching(current);
      if (title) title.textContent = copy.title;
      if (detail) detail.textContent = copy.detail;
      if (badge) badge.textContent = copy.key;
      if (coach) { coach.style.setProperty('--coach-color', copy.color); coach.classList.remove('awaiting-hint'); }
      if (help) help.hidden = true;
      const el = keyEls[p.base];
      if (el) { el.classList.add('target'); targets.push(el); }
      useFinger(p.finger, p.finger === 'T' ? 'thumb' : FINGER_LABEL[p.finger[1]]);
      if (p.shiftKey) {
        const s = keyEls[p.shiftKey];
        if (s) { s.classList.add('target'); targets.push(s); }
        useFinger(p.shiftFinger, 'pinky on Shift');
      }
    }
    /* quiet: she knows this key, so show nothing unless she pauses or asks */
    function target(ch, quiet = memory) {
      clear();
      if (ch == null || destroyed) return;
      current = ch;
      if (!quiet) { reveal(); return; }
      if (title) title.textContent = 'Eyes on the screen';
      if (detail) detail.textContent = 'You know this key. A hint appears if you pause.';
      if (badge) badge.textContent = '\u2713';
      if (coach) coach.classList.add('awaiting-hint');
      if (help) help.hidden = false;
      pending = setTimeout(reveal, 1500);
    }
    function setMemoryHints(enabled) { memory = !!enabled; const ch = current; if (ch != null) target(ch); }
    function onHelp(event) { event.preventDefault(); reveal(); help.blur(); }
    if (help) help.addEventListener('click', onHelp);
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
      if (destroyed) return;
      let k = e.code === 'ShiftLeft' || e.code === 'ShiftRight' ? e.code : e.key;
      if (k.length === 1) k = SHIFTED[k] || k.toLowerCase();
      const el = keyEls[k];
      if (!el) return;
      const cls = ok == null ? ['down'] : ['down', ok ? 'ok' : 'bad'];
      el.classList.add(...cls);
      const timer = setTimeout(() => { el.classList.remove(...cls); pressTimers.delete(timer); }, 150);
      pressTimers.add(timer);
    }
    function destroy() {
      clear(); destroyed = true;
      pressTimers.forEach(clearTimeout); pressTimers.clear();
      if (help) help.removeEventListener('click', onHelp);
    }
    return { target, clear, setLearned, press, keyEls, setMemoryHints, reveal, destroy };
  }

  return { markup, create, plan, fingerName, fingerOf, coaching };
})();
