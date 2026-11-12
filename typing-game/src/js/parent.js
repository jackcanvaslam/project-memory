/* Dragon Keys - the page for grown-ups: progress, trouble keys and settings */
'use strict';

App.register('parent', {
  noScene: true,
  enter(el) {
    this.importToken = (this.importToken || 0) + 1;
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
        <td>${r && r.plays ? r.bestAcc + '%' + (r.recoveryAcc ? `<small style="display:block">Focused retry: ${r.recoveryAcc}%</small>` : '') : ''}</td><td>${r && r.bestWpm ? r.bestWpm : ''}</td><td>${r ? r.plays : ''}</td></tr>`;
    }).join('');
    el.innerHTML = `<div class="parent">
      <header><button class="btn icon" data-act="back" aria-label="Back">${ic('back')}</button>
        <div><h1>Stats</h1><p>${esc(S.kid || 'Your rider')}'s progress with ${esc(S.pet.name || 'your dragon')}. For grown-ups too. Save a backup to keep progress outside this browser.</p></div></header>
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
          <li>Try a short visit: a hand warm-up, two missions, then a break or another adventure.</li>
          <li>Stars come from accuracy, not speed. Speed follows once the fingers know where to go.</li>
          <li>Help Phoenix find the bumps on F and J. Follow the named finger and matching highlighted hand. The game cannot detect which physical finger presses a key.</li>
          <li>New missions are gentle. Optional challenges revisit passed lessons: Calm has no enemies; Normal enemies strike after slips at two different positions in one word; Fierce also adds time pressure.</li>
          <li>A full lesson needs 90% accuracy to pass; three stars need 98%. A focused retry can earn one star while keeping the original full-lesson result visible.</li>
          <li>Celebrate comfortable hand placement and improving accuracy. There is no speed target to keep up with.</li></ul></div></div>
        <div><h2>Settings</h2><div class="box"><div class="settings">
          <label><input type="checkbox" data-set="music" ${S.settings.music ? 'checked' : ''}> Music</label>
          <label><input type="checkbox" data-set="sound" ${S.settings.sound ? 'checked' : ''}> Sound effects</label>
          <label><input type="checkbox" data-set="unlockAll" ${S.settings.unlockAll ? 'checked' : ''}> Unlock every level</label>
          <label><input type="checkbox" data-set="memoryHints" ${S.settings.memoryHints ? 'checked' : ''}> Try remembered keys first</label>
          <p style="margin:0;font-size:13px">On passed lessons only, finger hints appear after a pause. F and J stay visible, and help is always available.</p>
          <label>Challenge difficulty <select data-set="difficulty">${Object.keys(DIFFICULTY).map(k => `<option value="${k}" ${S.settings.difficulty === k ? 'selected' : ''}>${DIFFICULTY[k].name}</option>`).join('')}</select></label>
          <label>Child <input class="text" data-set="kid" maxlength="10" value="${esc(S.kid)}"></label>
          <label>Dragon <input class="text" data-set="pet" maxlength="10" value="${esc(S.pet.name)}"></label>
          <button class="btn small" data-act="reset">Erase all progress</button>
        </div></div></div>
      </div>
      <h2>Save and restore your adventure</h2>
      <div class="box">
        <p>${Store.isMemoryOnly() ? '<b style="color:#ff8f9c">This browser could not save progress. Download a backup before closing the page.</b>' : 'Progress and your current mission are saved in this browser. Clearing browser data or moving to another browser can remove them; a downloaded backup lets you restore them.'}</p>
        ${Store.getLoadWarning() ? `<p role="alert" style="color:#ff8f9c">${esc(Store.getLoadWarning())}</p>` : ''}
        <p>${S.checkpoint ? 'Checkpoint ready: ' + esc(LEVELS.find(l => l.id === S.checkpoint.id).title) + '. Continue it from the dragon den.' : 'A checkpoint is created when you start a mission.'}</p>
        <div class="row"><button class="btn primary small" data-act="backup">Download backup</button><button class="btn small" data-act="restore">Restore backup</button></div>
        <input type="file" data-backup-input accept="application/json,.json" aria-label="Choose a Dragon Keys backup" hidden>
        <p data-backup-status role="status" aria-live="polite" style="min-height:1.3em;margin-bottom:0"></p>
      </div>
      <h2>Every level</h2>
      <div class="box"><table><tr><th>Level</th><th>Teaches</th><th>Stars</th><th>Best accuracy</th><th>Best speed</th><th>Plays</th></tr>${rows}</table></div>
    </div>`;
  },
  change(t) {
    if (t.hasAttribute('data-backup-input')) {
      const file = t.files && t.files[0]; t.value = '';
      if (file) this.readBackup(file);
      return;
    }
    const S = Store.get(), k = t.dataset.set;
    if (!k) return;
    if (k === 'sound') { S.settings.sound = t.checked; Sound.setOn(t.checked); }
    else if (k === 'music') { S.settings.music = t.checked; Sound.setMusic(t.checked); }
    else if (k === 'unlockAll') S.settings.unlockAll = t.checked;
    else if (k === 'memoryHints') S.settings.memoryHints = t.checked;
    else if (k === 'difficulty') S.settings.difficulty = t.value;
    else if (k === 'kid') { S.kid = cleanName(t.value, S.kid); t.value = S.kid; }
    else if (k === 'pet') { S.pet.name = cleanName(t.value, S.pet.name); t.value = S.pet.name; }
    Store.save();
  },
  backupStatus(message, error = false) {
    const status = $('[data-backup-status]', this.el);
    if (status) { status.textContent = message; status.style.color = error ? '#ff8f9c' : '#a9f5da'; }
  },
  downloadBackup() {
    const blob = new Blob([Store.exportSave()], {type:'application/json'}), url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dragon-keys-save-' + Store.today() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    this.backupStatus('Backup download started. Keep the JSON file somewhere safe.');
  },
  async readBackup(file) {
    const token = ++this.importToken;
    this.backupStatus('Checking the backup…');
    try {
      if (file.size > 2e6) throw new Error('Choose a Dragon Keys backup smaller than 2 MB.');
      const text = await file.text();
      if (token !== this.importToken || App.screen !== 'parent') return;
      const preview = Store.inspectBackup(text), passed = Object.values(preview.levels).filter(l => l.stars > 0).length;
      App.modal(`<div class="modal"><div class="kicker">Backup ready</div><h2>Restore ${esc(preview.pet.name || 'this dragon')}?</h2>
        <p>${esc(preview.kid || 'Your rider')} · ${passed} levels passed · ${preview.coins} shards${preview.checkpoint ? ' · mission checkpoint included' : ''}.</p>
        <p>This replaces the progress currently in this browser. Download your current adventure first if you want to keep both.</p>
        <div class="row"><button class="btn small" data-act="download">Back up current</button><button class="btn" data-act="cancel">Cancel</button><button class="btn primary" data-act="restore">Restore this backup</button></div></div>`,
      {dismiss:true, act:a => {
        if (a === 'download') { this.downloadBackup(); return; }
        if (a !== 'restore') { App.closeModal(); this.backupStatus('Restore cancelled. Current progress is unchanged.'); return; }
        try {
          Store.restoreBackup(text);
          Sound.setOn(Store.get().settings.sound); Sound.setMusic(Store.get().settings.music);
          App.closeModal(); this.render();
          this.backupStatus(Store.isMemoryOnly() ? 'Backup restored for this visit, but this browser could not save it. Keep your downloaded backup.' : 'Adventure restored. Your dragon and progress are ready.', Store.isMemoryOnly());
        } catch (error) { App.closeModal(); this.backupStatus(error.message, true); }
      }, key:e => { if (e.key === 'Escape') { App.closeModal(); this.backupStatus('Restore cancelled. Current progress is unchanged.'); } }});
      this.backupStatus('Backup checked. Review it before restoring.');
    } catch (error) {
      if (token === this.importToken && App.screen === 'parent') this.backupStatus(error.message || 'This backup could not be read.', true);
    }
  },
  act(a) {
    if (a === 'back') { Sound.click(); App.go('den'); }
    else if (a === 'backup') this.downloadBackup();
    else if (a === 'restore') $('[data-backup-input]', this.el).click();
    else if (a === 'reset') {
      App.modal(`<div class="modal"><h2>Erase everything?</h2><p>This removes all stars, shards, unlocked looks and the dragon. It cannot be undone.</p>
        <div class="row"><button class="btn small" data-act="backup">Download backup</button><button class="btn primary" data-act="no">Keep it</button><button class="btn" data-act="yes">Erase</button></div></div>`,
      { dismiss: true, act: x => { if (x === 'backup') this.downloadBackup(); else if (x === 'yes') { Store.reset(); App.go('title'); } else App.closeModal(); } });
    }
  },
  exit() { this.importToken = (this.importToken || 0) + 1; },
  key(e) { if (e.key === 'Escape') this.act('back'); },
});

window.addEventListener('DOMContentLoaded', () => App.start());

