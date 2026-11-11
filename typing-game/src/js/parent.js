/* Dragon Keys - the page for grown-ups: progress, trouble keys and settings */
'use strict';

App.register('parent', {
  noScene: true,
  enter(el) {
    Sound.music('home'); Sound.setEnergy(0.2);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b); });
    el.addEventListener('change', e => this.change(e.target));
    this.render();
  },
  fmtTime(secs) {
    const m = Math.round(secs / 60);
    return m < 60 ? m + ' min' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  },
  chart(hist) {
    if (hist.length < 2) return '<p>The chart appears after two finished levels.</p>';
    const W = 520, H = 190, pad = 34, n = hist.length;
    const maxW = Math.max(20, ...hist.map(h => h.wpm));
    const x = i => pad + i * (W - pad - 10) / (n - 1);
    const ya = v => H - 24 - (clamp(v, 60, 100) - 60) / 40 * (H - 44), yw = v => H - 24 - v / maxW * (H - 44);
    const line = (fn, key) => hist.map((h, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + fn(h[key]).toFixed(1)).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%">
      <path d="M${pad} ${ya(90)}H${W - 10}" stroke="rgba(125,255,176,.4)" stroke-width="1.5" stroke-dasharray="6 6"/>
      <text x="0" y="${ya(100) + 4}">100%</text><text x="4" y="${ya(90) + 4}">90%</text><text x="4" y="${ya(60) + 4}">60%</text>
      <path d="${line(yw, 'wpm')}" fill="none" stroke="#22e1ff" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="${line(ya, 'acc')}" fill="none" stroke="#7dffb0" stroke-width="2.5" stroke-linejoin="round"/>
      ${hist.map((h, i) => `<circle cx="${x(i)}" cy="${ya(h.acc)}" r="3" fill="#7dffb0"/>`).join('')}
      <text x="${pad}" y="${H - 4}">oldest</text><text x="${W - 10}" y="${H - 4}" text-anchor="end">latest</text></svg>
      <div class="legend"><span><i style="background:#7dffb0"></i>Accuracy</span><span><i style="background:#22e1ff"></i>Speed (up to ${maxW} words a minute)</span><span>Dashed line: 90% pass mark</span></div>`;
  },
  render() {
    const S = Store.get(), el = this.el;
    const passed = LEVELS.filter(l => Store.levelStars(l.id) > 0).length;
    const hist = S.history.slice(-30), last10 = S.history.slice(-10);
    const avgAcc = last10.length ? Math.round(last10.reduce((t, h) => t + h.acc, 0) / last10.length) : 0;
    const bestWpm = S.history.reduce((m, h) => h.stars ? Math.max(m, h.wpm) : m, 0);
    const rate = k => { const r = S.keys[k]; return r && r.hit + r.miss >= 8 ? r.miss / (r.hit + r.miss) : null; };
    const heat = ['qwertyuiop', "asdfghjkl;'", 'zxcvbnm,./'].map(row => `<div>${[...row].map(k => {
      const r = rate(k);
      const bg = r == null ? '' : r < 0.05 ? 'background:#1f6b4a;color:#c9ffe0' : r < 0.12 ? 'background:#7a6a1a;color:#fff3b0' : r < 0.25 ? 'background:#9a5216;color:#ffe0c0' : 'background:#b3263f;color:#ffe0e6';
      return `<span style="${bg}" title="${r == null ? 'Not enough practice yet' : Math.round(r * 100) + '% missed'}">${esc(k)}</span>`;
    }).join('')}</div>`).join('');
    const trouble = Object.keys(S.keys).map(k => [k, rate(k)]).filter(([, r]) => r != null && r >= 0.08).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const rows = LEVELS.map(l => {
      const r = S.levels[l.id];
      return `<tr><td>${l.id}</td><td>${esc(l.title)}</td><td>${r && r.stars ? ic('star').repeat(r.stars) : r && r.plays ? 'not passed yet' : ''}</td>
        <td>${r && r.plays ? r.bestAcc + '%' : ''}</td><td>${r && r.bestWpm ? r.bestWpm : ''}</td><td>${r ? r.plays : ''}</td></tr>`;
    }).join('');
    el.innerHTML = `<div class="parent">
      <header><button class="btn icon" data-act="back" aria-label="Back">${ic('back')}</button>
        <div><h1>Stats</h1><p>${esc(S.kid)}'s progress with ${esc(S.pet.name)}. For grown-ups too. Everything is saved in this browser only.</p></div></header>
      <div class="cards">
        <div class="card"><b>${passed} / ${LEVELS.length}</b><span>levels passed</span></div>
        <div class="card"><b>${Store.totalStars()} / ${LEVELS.length * 3}</b><span>stars</span></div>
        <div class="card"><b>${this.fmtTime(S.totalSecs)}</b><span>time typing</span></div>
        <div class="card"><b>${S.streak.count}</b><span>days in a row</span></div>
        <div class="card"><b>${avgAcc ? avgAcc + '%' : '-'}</b><span>accuracy, last 10</span></div>
        <div class="card"><b>${bestWpm || '-'}</b><span>best words a minute</span></div>
      </div>
      <div class="two">
        <div><h2>Last ${hist.length || ''} levels</h2><div class="box">${this.chart(hist)}</div></div>
        <div><h2>Trouble keys</h2><div class="box"><div class="heat">${heat}</div>
          <div class="legend"><span><i style="background:#1f6b4a"></i>solid</span><span><i style="background:#7a6a1a"></i>some slips</span><span><i style="background:#9a5216"></i>often missed</span><span><i style="background:#b3263f"></i>needs work</span></div>
          <p>${trouble.length ? 'Most missed: ' + trouble.map(([k, r]) => `<b>${esc(k.toUpperCase())}</b> (${Math.round(r * 100)}%)`).join(', ') + '. Levels quietly add extra words with these keys.' : 'No trouble keys so far. Grey keys have not had enough practice to judge.'}</p></div></div>
      </div>
      <div class="two">
        <div><h2>How to help</h2><div class="box"><ul>
          <li>Ten minutes a day works better than an hour once a week.</li>
          <li>Stars come from accuracy, not speed. Speed follows once the fingers know where to go.</li>
          <li>Eyes stay on the screen. The glowing key and the coloured fingers show which finger to use.</li>
          <li>The music follows the typing. A clean streak adds layers, and a wrong key drops them.</li>
          <li>A level needs 90% accuracy to pass. Three stars need 98%, so replaying levels is worth it.</li>
          <li>A typical goal for a ten-year-old is 20 to 25 words a minute at 90% accuracy or better.</li></ul></div></div>
        <div><h2>Settings</h2><div class="box"><div class="settings">
          <label><input type="checkbox" data-set="music" ${S.settings.music ? 'checked' : ''}> Music</label>
          <label><input type="checkbox" data-set="sound" ${S.settings.sound ? 'checked' : ''}> Sound effects</label>
          <label><input type="checkbox" data-set="unlockAll" ${S.settings.unlockAll ? 'checked' : ''}> Unlock every level</label>
          <label>Child <input class="text" data-set="kid" maxlength="10" value="${esc(S.kid)}"></label>
          <label>Dragon <input class="text" data-set="pet" maxlength="10" value="${esc(S.pet.name)}"></label>
          <button class="btn small" data-act="reset">Erase all progress</button>
        </div>${Store.isMemoryOnly() ? '<p style="color:#ff8f9c"><b>This browser is blocking saved data, so progress will be lost when the page closes.</b> Try a normal (not private) window.</p>' : ''}</div></div>
      </div>
      <h2>Every level</h2>
      <div class="box"><table><tr><th>Level</th><th>Teaches</th><th>Stars</th><th>Best accuracy</th><th>Best speed</th><th>Plays</th></tr>${rows}</table></div>
    </div>`;
  },
  change(t) {
    const S = Store.get(), k = t.dataset.set;
    if (!k) return;
    if (k === 'sound') { S.settings.sound = t.checked; Sound.setOn(t.checked); }
    else if (k === 'music') { S.settings.music = t.checked; Sound.setMusic(t.checked); }
    else if (k === 'unlockAll') S.settings.unlockAll = t.checked;
    else if (k === 'kid') { S.kid = cleanName(t.value, S.kid); t.value = S.kid; }
    else if (k === 'pet') { S.pet.name = cleanName(t.value, S.pet.name); t.value = S.pet.name; }
    Store.save();
  },
  act(a) {
    if (a === 'back') { Sound.click(); App.go('den'); }
    else if (a === 'reset') {
      App.modal(`<div class="modal"><h2>Erase everything?</h2><p>This removes all stars, shards, unlocked looks and the dragon. It cannot be undone.</p>
        <div class="row"><button class="btn primary" data-act="no">Keep it</button><button class="btn" data-act="yes">Erase</button></div></div>`,
      { dismiss: true, act: x => { if (x === 'yes') { Store.reset(); App.go('title'); } else App.closeModal(); } });
    }
  },
  key(e) { if (e.key === 'Escape') this.act('back'); },
});

window.addEventListener('DOMContentLoaded', () => App.start());
