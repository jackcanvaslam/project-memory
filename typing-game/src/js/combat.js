/* Dragon Keys - combat. Enemies ride the words of the lesson: typing a word destroys the enemy
   carrying it. Mistakes let enemies strike, clean streaks heal, and a full mana bar arms a
   power that is cast by pressing Enter and typing a short word. */
'use strict';

const MOVES = [
  { id: 'fire',   name: 'Fire breath', icon: 'flame',  text: 'burns the three nearest enemies',   color: '#ff9a3d', world: 0 },
  { id: 'shield', name: 'Shield',      icon: 'shield', text: 'blocks the next two hits',          color: '#22e1ff', world: 1 },
  { id: 'slow',   name: 'Time slow',   icon: 'clock',  text: 'freezes enemies for eight seconds', color: '#b79bff', world: 2 },
];
const FOE_INFO = {
  meadow: { kind: 'bat',    name: 'Gloom bats',   boss: 'Gloom Queen',  rgb: '255,95,210' },
  peaks:  { kind: 'hawk',   name: 'Storm hawks',  boss: 'Tempest Roc',  rgb: '255,225,77' },
  cave:   { kind: 'golem',  name: 'Shard golems', boss: 'Geode Titan',  rgb: '90,220,255' },
  castle: { kind: 'knight', name: 'Iron wraiths', boss: 'Iron Warden',  rgb: '255,194,61' },
  summit: { kind: 'drake',  name: 'Ember drakes', boss: 'Ashen Wyrm',   rgb: '255,110,60' },
};
const EMBER_SKIN = { a: '#ff7a3d', b: '#7a1030', fin: '#ffd23f', belly: '#ffd9b0', glow: '255,110,60' };
const ASHEN_SKIN = { a: '#ff3d5a', b: '#1a0612', fin: '#ff9a3d', belly: '#ffb0a0', glow: '255,60,80' };
const DIFFICULTY = {
  calm:   { name: 'Calm',   text: 'No enemies and no bosses. Just the missions.' },
  normal: { name: 'Normal', text: 'Each world ends with a boss. Other battles are optional on finished lessons. No timer.' },
  fierce: { name: 'Fierce', text: 'As Normal, but enemies and bosses also strike if a word takes too long. Pays 25% more shards.' },
};

/* ---------------- how each enemy is drawn (all face left, toward the dragon) ---------------- */
const FoeArt = {
  bat(ctx, t, s) {
    const f = Math.sin(t * 11), edge = 'rgba(255,95,210,.95)';
    ctx.lineJoin = 'round'; ctx.lineWidth = 1.6 / s + 0.6;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(side * 7, -2);
      ctx.lineTo(side * 24, -14 - f * 12); ctx.lineTo(side * 42, -8 - f * 20);
      ctx.lineTo(side * 34, 6 - f * 6); ctx.lineTo(side * 27, 0 - f * 4); ctx.lineTo(side * 20, 10 - f * 3); ctx.lineTo(side * 13, 3); ctx.lineTo(side * 7, 9);
      ctx.closePath(); ctx.fillStyle = '#2b1160'; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-11, -22); ctx.lineTo(-3, -13); ctx.lineTo(3, -13); ctx.lineTo(11, -22); ctx.lineTo(8, -9); ctx.closePath(); ctx.fillStyle = '#1a0b3d'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 14, 0, 0, TAU); ctx.fillStyle = '#1a0b3d'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(-3, 12); ctx.lineTo(-1, 6); ctx.moveTo(1, 6); ctx.lineTo(3, 12); ctx.lineTo(5, 6); ctx.fill();
    this.eyes(ctx, [[-5, -3], [5, -3]], 3.2, '255,160,235');
  },
  hawk(ctx, t, s) {
    const f = Math.sin(t * 9), edge = 'rgba(255,225,77,.95)';
    ctx.lineJoin = 'round'; ctx.lineWidth = 1.6 / s + 0.6;
    const wing = (dy, alpha) => {
      ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(8, -34 * f - 6 + dy); ctx.lineTo(34, -26 * f - 2 + dy); ctx.lineTo(24, -8 * f); ctx.lineTo(30, -2); ctx.lineTo(14, 2); ctx.closePath();
      ctx.fillStyle = '#1d2a6e'; ctx.fill(); ctx.strokeStyle = 'rgba(90,225,255,.9)'; ctx.stroke(); ctx.globalAlpha = 1;
    };
    wing(8, 0.55);
    ctx.beginPath(); ctx.moveTo(-38, 3); ctx.lineTo(-24, -4); ctx.lineTo(-16, -11); ctx.lineTo(14, -7); ctx.lineTo(40, -6); ctx.lineTo(30, 1); ctx.lineTo(38, 8); ctx.lineTo(8, 10); ctx.lineTo(-16, 8); ctx.lineTo(-24, 4); ctx.closePath();
    ctx.fillStyle = '#141a4a'; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
    ctx.fillStyle = '#ffe14d'; ctx.beginPath(); ctx.moveTo(-38, 3); ctx.lineTo(-24, -4); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill();
    wing(0, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,240,140,.8)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(38, 2); ctx.lineTo(48, -3 + f * 3); ctx.lineTo(46, 4); ctx.lineTo(58, 1 - f * 3); ctx.stroke(); ctx.restore();
    this.eyes(ctx, [[-17, -3]], 3, '255,255,255');
  },
  golem(ctx, t, s) {
    ctx.lineJoin = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 + t * 0.9, d = 23 + Math.sin(t * 2 + i) * 3, hue = i % 2 ? 265 : 188;
      ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(5.5, -2); ctx.lineTo(0, 11); ctx.lineTo(-5.5, -2); ctx.closePath(); ctx.fillStyle = `hsl(${hue},90%,55%)`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(-5.5, -2); ctx.lineTo(0, 11); ctx.closePath(); ctx.fillStyle = `hsl(${hue},100%,76%)`; ctx.fill();
      ctx.restore();
    }
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - t * 0.5; ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.closePath();
    ctx.fillStyle = '#12103a'; ctx.fill(); ctx.strokeStyle = 'rgba(90,220,255,.95)'; ctx.lineWidth = 1.6 / s + 0.6; ctx.stroke();
    this.eyes(ctx, [[-2, 0]], 5.5, '255,90,220');
    ctx.fillStyle = '#12103a'; ctx.fillRect(-3, -4.5, 2, 9);
  },
  knight(ctx, t, s) {
    const w = Math.sin(t * 5) * 3, edge = 'rgba(255,194,61,.95)';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = 1.6 / s + 0.6;
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.quadraticCurveTo(24, -8 + w, 40, -2 + w); ctx.lineTo(36, 22 - w); ctx.quadraticCurveTo(22, 14, 8, 17); ctx.closePath(); ctx.fillStyle = '#6a1640'; ctx.fill(); ctx.strokeStyle = 'rgba(255,61,110,.8)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-2, -18); ctx.quadraticCurveTo(14, -32, 26, -24 + w * 0.6); ctx.quadraticCurveTo(14, -22, 10, -14); ctx.closePath(); ctx.fillStyle = '#ff3d6e'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, 15); ctx.lineTo(-14, -4); ctx.arc(0, -4, 14, Math.PI, 0); ctx.lineTo(14, 15); ctx.quadraticCurveTo(0, 20, -14, 15); ctx.closePath(); ctx.fillStyle = '#232a5c'; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,120,60,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -3); ctx.lineTo(3, -3); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,160,.9)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    ctx.strokeStyle = '#e9edff'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(2, 16); ctx.lineTo(-52, 6); ctx.stroke();
    ctx.fillStyle = '#e9edff'; ctx.beginPath(); ctx.moveTo(-60, 4.5); ctx.lineTo(-48, 2); ctx.lineTo(-49, 10); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.6 / s + 0.6; ctx.beginPath(); ctx.moveTo(-28, -4); ctx.lineTo(-10, -2); ctx.lineTo(-11, 14); ctx.quadraticCurveTo(-20, 24, -27, 12); ctx.closePath(); ctx.fillStyle = '#1a2050'; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
    ctx.fillStyle = '#ffc23d'; ctx.beginPath(); ctx.arc(-19, 7, 3, 0, TAU); ctx.fill();
  },
  eyes(ctx, pts, r, rgb) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y] of pts) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6); g.addColorStop(0, `rgba(${rgb},.95)`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
};

class Combat {
  /* is there fighting on this level, given the difficulty she chose? */
  static on(idx, challenge = false) {
    const d = Store.get().settings.difficulty;
    if (d === 'calm' || !LEVELS[idx]) return false;
    if (BOSS_LEVELS.has(LEVELS[idx].id)) return true;            // the last level of a world is always its boss
    return !!challenge && Store.levelStars(LEVELS[idx].id) > 0;  // other battles are an optional replay
  }
  static moves() {
    const S = Store.get();
    return MOVES.filter(m => m.world === 0 || S.settings.unlockAll || Store.worldDone(m.world));
  }

  constructor(lv) {
    const S = Store.get(), L = lv.L, level = lv.level, world = WORLDS[level.world - 1];
    this.lv = lv; this.info = FOE_INFO[world.theme]; this.theme = world.theme;
    this.fierce = S.settings.difficulty === 'fierce';
    this.maxHp = 5; this.hp = 5; this.mana = 0; this.shield = 0; this.frozen = 0; this.downed = false;
    this.wordSlips = 0; this.slipPositions = new Set(); this.clock = 0; this.clockFrac = 0; this.warned = false;
    this.kills = 0; this.hits = 0; this.cast = null; this.t = 0; this.queue = []; this.bossBeaten = false;
    this.moves = Combat.moves();
    this.perChar = [1.5, 1.3, 1.2, 1.1, 1.0][level.world - 1];
    this.words = [];
    L.lines.forEach((line, li) => { let s = 0; lv.wordEnds[li].forEach(e => { this.words.push(line.slice(s, e)); s = e; }); });

    this.byWord = new Array(L.wordsTotal).fill(null); this.foes = []; this.boss = null;
    if (BOSS_LEVELS.has(level.id)) {
      this.boss = { name: this.info.boss, kind: this.info.kind, hp: L.wordsTotal, max: L.wordsTotal, x: App.W + 260, y: 180, flash: 0, charge: 0, lunge: 0, state: 'fight', deadT: 0, dr: null };
    } else {
      const toughRate = [0, 0.12, 0.16, 0.2, 0.25][level.world - 1];
      for (let i = 0; i < L.wordsTotal;) {
        const tough = i + 1 < L.wordsTotal && hash(i, lv.idx + 3) < toughRate;
        const f = { w0: i, w1: tough ? i + 1 : i, tough, armor: tough, kind: this.info.kind, seed: hash(i, 9) * 10, x: 0, y: 190, flash: 0, charge: 0, lunge: 0, state: 'alive', placed: false, dr: null };
        this.foes.push(f);
        for (let k = f.w0; k <= f.w1; k++) this.byWord[k] = f;
        i = f.w1 + 1;
      }
    }
    this.buildHud();
  }

  /* ---------- the bars at the top ---------- */
  buildHud() {
    const el = this.lv.el, box = document.createElement('div');
    box.className = 'vitals';
    box.innerHTML = `<div class="vit life"><span>Life</span><div class="pips">${'<i></i>'.repeat(this.maxHp)}<b></b></div></div>
      <div class="vit mana"><span>Mana</span><div class="meter"><i></i></div></div>`;
    el.appendChild(box); this.box = box;
    if (this.boss) {
      const bb = document.createElement('div'); bb.className = 'bossbar';
      bb.innerHTML = `<span>${this.boss.name}</span><div><i></i></div>`;
      el.appendChild(bb); this.bossEl = bb;
    }
    el.classList.add('combat');
    this.hud();
  }
  hud() {
    const pips = $$('.pips i', this.box);
    pips.forEach((p, i) => p.classList.toggle('on', i < this.hp));
    $('.pips b', this.box).innerHTML = this.shield > 0 ? ic('shield').repeat(this.shield) : '';
    this.box.classList.toggle('low', this.hp <= 2 && !this.downed); this.box.classList.toggle('down', this.downed);
    const full = this.mana >= 100 && !this.downed;
    $('.meter i', this.box).style.width = this.mana + '%';
    this.box.classList.toggle('full', full);
    $('.mana span', this.box).textContent = full ? 'Press Enter' : 'Mana';
    const enter = this.lv.kb.keyEls.Enter; if (enter) enter.classList.toggle('charged', full && !this.cast);
    if (this.bossEl) { $('i', this.bossEl).style.width = (this.boss.hp / this.boss.max * 100) + '%'; this.bossEl.classList.toggle('gone', this.boss.state !== 'fight'); }
    Sound.setTension(this.downed ? 0 : this.hp <= 1 ? 1 : this.hp === 2 ? 0.55 : 0);
  }

  cur() { return this.byWord[this.lv.L.wordsDone] || null; }
  bossOn() { return !!this.boss && this.boss.state === 'fight'; }
  /* while an enemy carries a word, or the boss is up, the plain shard for that word is hidden */
  hides(i) { return !!this.byWord[i] || this.bossOn(); }
  /* where the dragon should look */
  aimY() { const f = this.cur(); return f ? f.y : this.bossOn() ? this.boss.y + Math.sin(this.t * 1.1) * 50 : null; }

  /* ---------- typing events from the level ---------- */
  key() {
    if (this.downed) return;
    const L = this.lv.L, m = this.lv.d.mouth(), f = this.cur();
    if (f) { FX.beam(m, { x: f.x - 8, y: f.y }, `rgb(${this.lv.d.pal.glow})`, 2.5); f.flash = 1; f.x += 7; }
    else if (this.bossOn()) { FX.beam(m, { x: this.boss.x - 60 + Math.random() * 40, y: this.boss.y + (Math.random() - 0.5) * 60 }, `rgb(${this.lv.d.pal.glow})`, 2.5); this.boss.flash = Math.max(this.boss.flash, 0.45); }
    if (this.mana < 100) {
      this.mana = Math.min(100, this.mana + 2.5);
      if (this.mana >= 100) { Sound.charged(); const h = this.lv.d.head(); FX.text(h.x + 40, h.y - 70, 'Mana full: press Enter', '#b79bff', 24); }
    }
    if (L.streak > 0 && L.streak % 20 === 0 && this.hp < this.maxHp) {
      this.hp++; Sound.heal();
      const h = this.lv.d.head(); FX.burst(h.x, h.y, { n: 14, speed: 220, g: -260, colors: ['#7dffb0', '#ffffff'] }); FX.text(h.x + 30, h.y - 60, '+1 life', '#7dffb0', 24);
    }
    this.hud();
  }
  /* word i has just been finished. Returns true if combat showed it, so the level skips its own effect. */
  wordDone(i) {
    this.wordSlips = 0; this.slipPositions.clear(); this.clock = 0; this.warned = false;
    if (this.downed) return false;
    const f = this.byWord[i];
    if (f) {
      f.charge = 0;
      if (i < f.w1) { f.armor = false; FX.burst(f.x, f.y, { n: 12, speed: 260, colors: ['#d6faff', '#ffffff'], ringGrow: 160 }); Sound.crack(); return true; }
      this.kill(f); return true;
    }
    if (this.bossOn()) { this.hitBoss(1); return true; }
    return false;
  }
  kill(f) {
    f.state = 'dead'; this.kills++;
    for (let k = f.w0; k <= f.w1; k++) this.byWord[k] = null;
    const c = `rgb(${this.info.rgb})`;
    FX.burst(f.x, f.y, { n: f.tough ? 26 : 18, speed: 340, size: 9, g: 120, colors: [c, '#ffffff', '#ffd23f'], ringGrow: 260 });
    Sound.kill();
  }
  hitBoss(n) {
    const b = this.boss;
    b.hp = Math.max(0, b.hp - n); b.flash = 1;
    FX.burst(b.x - 40, b.y, { n: 8 + n * 4, speed: 300, size: 9, colors: [`rgb(${this.info.rgb})`, '#ffffff'], ringGrow: 220 });
    if (n > 1) FX.text(b.x - 40, b.y - 110, `-${n}`, '#ff9a3d', 38);
    Sound.bossHit();
    if (b.hp <= 0) this.bossDead();
    this.hud();
  }
  bossDead() {
    const b = this.boss;
    b.state = 'dead'; this.bossBeaten = true;
    for (let i = 0; i < 6; i++) App.later(() => FX.burst(b.x + (Math.random() - 0.5) * 160, b.y + (Math.random() - 0.5) * 120, { n: 22, speed: 420, size: 11, colors: [`rgb(${this.info.rgb})`, '#ffffff', '#ffd23f'], ringGrow: 320 }), i * 130);
    FX.text(App.W / 2, 150, `${b.name} defeated`, '#ffd23f', 44); FX.confetti(70);
    Sound.bossDown(); Sound.music(this.theme); Scene.hit();
    this.hud();
  }
  /* a wrong key. One slip on a word is a warning, a second lets the enemy strike. */
  slip() {
    if (this.downed || this.frozen > 0) return;
    const f = this.cur(), L = this.lv.L;
    if (!f && !this.bossOn()) return;
    if (this.slipPositions.has(L.done)) return;
    this.slipPositions.add(L.done); this.wordSlips++;
    if (this.wordSlips >= 2) { this.wordSlips = 0; this.strike(); }
    else { (f || this.boss).charge = 1; Sound.warn(); }
  }
  strike() {
    const f = this.cur(), h = this.lv.d.head();
    if (f) { f.lunge = 1; f.charge = 0; this.land(); }
    else if (this.bossOn()) { this.boss.charge = 0; this.boss.lunge = 1; FX.shoot({ x: this.boss.x - 90, y: this.boss.y }, { x: h.x + 20, y: h.y }, () => {}, true, 0.22); this.land(); }
  }
  land() {
    if (this.downed) return;
    const d = this.lv.d, h = d.head();
    if (this.shield > 0) {
      this.shield--; Sound.block();
      FX.burst(h.x + 20, h.y, { n: 14, speed: 300, g: 0, colors: ['#22e1ff', '#ffffff'], ringGrow: 300 }); FX.text(h.x + 40, h.y - 64, 'Blocked', '#22e1ff', 26);
    } else {
      this.hp--; this.hits++;
      Scene.hit(); d.zap = 1; d.vx -= 260; d.vy += 160; Sound.hurt();
      FX.burst(h.x + 10, h.y, { n: 16, speed: 320, colors: ['#ff4d6d', '#ffffff', '#ff9a3d'], ringGrow: 240 }); FX.text(h.x + 40, h.y - 64, '-1 life', '#ff4d6d', 26);
      this.lv.L.heat *= 0.6;
      if (this.hp <= 0) this.down();
    }
    this.hud();
  }
  /* The optional battle never takes away typing mastery. */
  down() {
    this.downed = true; this.closeCast(); this.mana = 0; this.shield = 0; this.frozen = 0;
    for (const f of this.foes) if (f.state === 'alive') f.state = 'flee';
    this.byWord.fill(null);
    if (this.boss && this.boss.state === 'fight') { this.boss.state = 'leave'; Sound.music(this.theme); }
    Sound.down(); this.lv.L.heat = 0;
    FX.text(App.W / 2, 236, 'Knocked back', '#ff4d6d', 46);
    App.toast('Your dragon is safe. Finish the typing: your accuracy stars still count.', 4200);
    this.hud();
  }

  /* ---------- powers ---------- */
  handleKey(e) {
    if (this.cast) {
      if (e.key === 'Escape') { this.closeCast(); return true; }
      if (e.key.length !== 1) return true;
      const c = this.cast, k = e.key.toLowerCase();
      if (!c.pick) { const o = c.opts.find(x => x.word[0] === k); if (!o) return this.fizzle(e); c.pick = o; c.pos = 1; }
      else if (c.pick.word[c.pos] === k) c.pos++;
      else return this.fizzle(e);
      this.lv.kb.press(e, true); Sound.key(c.pos + 2, 40);
      if (c.pos >= c.pick.word.length) this.release(c.pick.move); else this.drawCast();
      return true;
    }
    if (e.key === 'Enter') {
      if (this.downed) return true;
      if (this.mana >= 100) this.openCast(); else { Sound.nope(); App.toast('Fill the mana bar with correct keys first', 1800); }
      return true;
    }
    return false;
  }
  openCast() {
    const lv = this.lv, letters = Content.lettersUpTo(lv.idx) || 'fj';
    const pool = Content.shuffle(Content.wordPool(letters, 3, 5)), used = new Set(), opts = [];
    for (const move of this.moves) {
      let word = pool.find(w => !used.has(w[0]));
      if (!word) {   // not enough real words yet: make one from the keys she knows
        const first = [...letters].filter(c => !used.has(c)), a = first.length ? Content.pick(first) : letters[0];
        word = a + Content.pick([...letters]) + Content.pick([...letters]);
      }
      used.add(word[0]); opts.push({ move, word });
    }
    this.cast = { opts, pick: null, pos: 0 };
    lv.L.lastT = 0; Scene.slowmo = true; Sound.castOpen();
    const el = document.createElement('div'); el.className = 'cast';
    lv.el.appendChild(el); this.castEl = el;
    lv.el.classList.add('casting');
    this.drawCast(); this.hud();
  }
  drawCast() {
    const c = this.cast;
    this.castEl.innerHTML = `<div class="kicker">Choose a power and type its word</div><div class="cast-opts">${c.opts.map(o => {
      const mine = c.pick === o, n = mine ? c.pos : 0;
      return `<div class="cast-opt ${mine ? 'on' : c.pick ? 'off' : ''}" style="--mc:${o.move.color}">${ic(o.move.icon)}<b>${o.move.name}</b>
        <span class="cw"><i>${esc(o.word.slice(0, n))}</i>${esc(o.word.slice(n))}</span><small>${o.move.text}</small></div>`;
    }).join('')}</div><div class="cast-esc">Esc to cancel</div>`;
    const next = c.pick ? c.pick.word[c.pos] : null;
    this.lv.kb.target(next);
  }
  closeCast() {
    if (!this.cast) return;
    this.cast = null; if (this.castEl) { this.castEl.remove(); this.castEl = null; }
    Scene.slowmo = false; this.lv.el.classList.remove('casting');
    const L = this.lv.L; L.lastT = 0;
    if (L.phase === 'play') this.lv.aim();
    this.hud();
  }
  fizzle(e) {
    if (e) this.lv.kb.press(e, false);
    this.mana = 50; Sound.nope();
    const h = this.lv.d.head(); FX.text(h.x + 40, h.y - 64, 'Fizzled', '#8f98c9', 26);
    this.closeCast();
    return true;
  }
  release(move) {
    const lv = this.lv, d = lv.d, h = d.head();
    this.mana = 0; this.closeCast();
    Sound.cast(move.id);
    FX.text(h.x + 120, Math.max(110, h.y - 80), move.name, move.color, 36);
    if (move.id === 'fire') {
      d.jawTarget = 1;
      let k = 0;
      const iv = setInterval(() => { const q = d.mouth(); FX.fire(q.x, q.y, q.dx, q.dy, 1.5); if (++k > 14 || App.screen !== 'level') { clearInterval(iv); d.jawTarget = 0; } }, 45);
      // Resolve the result now so pausing/saving never drops a paid-for power.
      if (this.bossOn()) this.hitBoss(4);
      else this.queue.slice(0, 3).forEach(f => { if (f.state === 'alive') this.kill(f); });
    } else if (move.id === 'shield') {
      this.shield = 2;
      FX.burst(h.x + 10, h.y, { n: 20, speed: 280, g: 0, colors: ['#22e1ff', '#ffffff'], ringGrow: 340 });
    } else {
      this.frozen = 8; this.clock = 0;
      for (const f of this.foes) f.charge = 0;
      if (this.boss) this.boss.charge = 0;
    }
    this.hud();
  }

  /* ---------- every frame ---------- */
  tick(dt) {
    const lv = this.lv, L = lv.L, W = App.W, hx = lv.hx();
    this.t += dt;
    const playing = L.phase === 'play' && !this.downed;
    if (playing && this.frozen > 0) this.frozen = Math.max(0, this.frozen - dt);
    const still = this.frozen > 0;

    // on Fierce, taking too long on a word also lets the enemy strike
    const f0 = this.cur();
    if (this.fierce && playing && !this.cast && !still && (f0 || this.bossOn())) {
      const allow = 2.5 + (this.words[L.wordsDone] || 'aaaa').length * this.perChar;
      this.clock += dt; this.clockFrac = this.clock / allow;
      if (this.clockFrac > 0.7 && !this.warned) { this.warned = true; (f0 || this.boss).charge = 1; Sound.warn(); }
      if (this.clock >= allow) { this.clock = 0; this.warned = false; this.strike(); }
    } else if (!playing || still) this.clockFrac = 0;

    const q = [];
    for (const f of this.foes) {
      if (f.state === 'dead') continue;
      if (f.state === 'flee') { f.x += 620 * dt; f.y -= 150 * dt; if (f.dr) f.dr.update(dt, f.x, f.y, 300, 40, 10); continue; }
      if (q.length < (f.kind === 'drake' ? 4 : 6)) q.push(f);
    }
    q.forEach((f, j) => {
      if (!f.placed) { f.placed = true; f.x = W + 80 + j * 110; f.y = 140 + hash(f.w0, 5) * 110; }
      const tx = hx + 265 + j * 155, ty = 190 + (still ? 0 : Math.sin(this.t * 1.5 + f.seed) * 32) + (j % 2 ? 24 : -16);
      const e = 1 - Math.exp(-(still ? 1.2 : 5) * dt);
      f.x += (tx - f.x) * e; f.y += (ty - f.y) * e;
      f.flash = Math.max(0, f.flash - dt * 6); f.lunge = Math.max(0, f.lunge - dt * 3);
      if (f.kind === 'drake') {
        if (!f.dr) { f.dr = new Dragon({ stage: f.tough ? 2 : 1, size: 0.6, pal: EMBER_SKIN, trail: 'ember' }); f.dr.place(f.x, f.y); f.dr.segs.forEach((s, i) => { s.x = f.x + i * f.dr.L; }); }
        const p = this.drawPos(f);
        if (!still) f.dr.update(dt, p.x, p.y, -170, 60, 12);
      }
    });
    this.queue = q;

    const b = this.boss;
    if (b) {
      b.flash = Math.max(0, b.flash - dt * 4); b.lunge = Math.max(0, b.lunge - dt * 2.5);
      if (b.state === 'fight') {
        const e = 1 - Math.exp(-2.2 * dt), rage = 1 + (1 - b.hp / b.max) * 0.8;
        b.x += (W - 215 - b.x) * e;
        b.y += (188 + (still ? 0 : Math.sin(this.t * 0.9 * rage) * 46) - b.y) * e;
      } else if (b.state === 'dead') { b.deadT += dt; b.y += 90 * dt * b.deadT; }
      else { b.x += 520 * dt; b.y -= 90 * dt; }
      if (b.kind === 'drake') {
        if (!b.dr) { b.dr = new Dragon({ stage: 3, size: 1.5, pal: ASHEN_SKIN, trail: 'ember', crest: 'spikes' }); b.dr.place(b.x, b.y); b.dr.segs.forEach((s, i) => { s.x = b.x + i * b.dr.L; }); }
        if (!still || b.state !== 'fight') b.dr.update(dt, b.x - 90 - b.lunge * 60, b.y, b.state === 'leave' ? 300 : -200, 30, 9);
      }
    }
  }

  /* an enemy lunges at the dragon when it strikes */
  drawPos(f) {
    if (f.lunge <= 0) return f;
    const h = this.lv.d.head(), p = Math.sin(f.lunge * Math.PI) * 0.82;
    return { x: lerp(f.x, h.x + 70, p), y: lerp(f.y, h.y, p) };
  }

  draw(ctx, layer) {
    const d = this.lv.d, h = d.head();
    if (layer === 'front') {
      if (this.shield > 0 || this.downed) {
        const r = d.headS * 3.6 + 10, a = this.downed ? 0.35 : 0.9, c = this.downed ? '190,200,255' : '34,225,255';
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(h.x + Math.cos(d.heading) * d.headS, h.y + Math.sin(d.heading) * d.headS);
        const g = ctx.createRadialGradient(0, 0, r * 0.55, 0, 0, r); g.addColorStop(0, `rgba(${c},0)`); g.addColorStop(1, `rgba(${c},${0.3 * a})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = `rgba(${c},${a})`; ctx.lineWidth = 2; ctx.setLineDash([14, 8]); ctx.lineDashOffset = -this.t * 40; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      return;
    }
    if (this.frozen > 0) { ctx.fillStyle = `rgba(120,170,255,${0.1 * Math.min(1, this.frozen)})`; ctx.fillRect(0, 0, App.W, 720); }
    for (let j = this.queue.length - 1; j >= 0; j--) this.drawFoe(ctx, this.queue[j], j === 0);
    for (const f of this.foes) if (f.state === 'flee' && f.x < App.W + 120) this.drawFoe(ctx, f, false);
    if (this.boss && (this.boss.state !== 'dead' || this.boss.deadT < 1.1) && this.boss.x < App.W + 300) this.drawBoss(ctx);
  }

  body(ctx, kind, x, y, s, tt, dr) {
    if (kind === 'drake') { if (dr) dr.draw(ctx); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    FoeArt[kind](ctx, tt, s);
    ctx.restore();
  }

  drawFoe(ctx, f, engaged) {
    const p = this.drawPos(f), s = f.tough ? 1.55 : 1.22, still = this.frozen > 0, rgb = this.info.rgb;
    const x = p.x, y = p.y;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 62 * s); g.addColorStop(0, `rgba(${rgb},${engaged ? 0.3 : 0.16})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 62 * s, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save(); if (!engaged) ctx.globalAlpha = 0.75;
    this.body(ctx, f.kind, x, y, s, still ? f.seed : this.t + f.seed, f.dr);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    if (f.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${f.flash * 0.5})`; ctx.beginPath(); ctx.arc(x, y, 26 * s, 0, TAU); ctx.fill(); }
    if (f.armor) {   // tough enemies wear a ring of armour that the first word breaks
      ctx.strokeStyle = 'rgba(214,250,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 + this.t * 0.7; ctx.lineTo(x + Math.cos(a) * 44 * s, y + Math.sin(a) * 44 * s); }
      ctx.stroke();
    }
    if (still) {
      ctx.fillStyle = 'rgba(150,200,255,.28)'; ctx.beginPath(); ctx.arc(x, y, 40 * s, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(220,240,255,.9)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 40 * s, y - Math.sin(a) * 40 * s); ctx.lineTo(x + Math.cos(a) * 40 * s, y + Math.sin(a) * 40 * s); ctx.stroke(); }
    }
    if (engaged && !still) {
      if (f.charge > 0) {   // it has been warned once: the next slip lets it strike
        const pulse = 0.6 + 0.4 * Math.sin(this.t * 14);
        ctx.strokeStyle = `rgba(255,60,90,${pulse})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 50 * s, 0, TAU); ctx.stroke();
      }
      if (this.fierce && this.clockFrac > 0) {
        ctx.strokeStyle = this.clockFrac > 0.7 ? 'rgba(255,60,90,.95)' : 'rgba(255,255,255,.55)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(x, y, 56 * s, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, this.clockFrac)); ctx.stroke();
      }
    }
    ctx.restore();
    if (engaged) {   // how much of its word is left
      const L = this.lv.L, ends = this.lv.wordEnds[L.li] || [1], ws = L.wi ? ends[L.wi - 1] : 0, we = ends[L.wi] || 1;
      let left = 1 - clamp((L.pos - ws) / Math.max(1, we - ws), 0, 1);
      if (f.tough) left = L.wordsDone === f.w0 ? 0.5 + left * 0.5 : left * 0.5;
      const w = 46 * s, by = y - 48 * s;
      ctx.fillStyle = 'rgba(6,8,26,.8)'; ctx.fillRect(x - w / 2 - 2, by - 2, w + 4, 9);
      ctx.fillStyle = f.charge > 0 ? '#ff4d6d' : `rgb(${rgb})`; ctx.fillRect(x - w / 2, by, w * left, 5);
    }
  }

  drawBoss(ctx) {
    const b = this.boss, rgb = this.info.rgb, still = this.frozen > 0, s = 3.1;
    const fade = b.state === 'dead' ? Math.max(0, 1 - b.deadT / 1.1) : 1;
    const x = b.x - b.lunge * 46, y = b.y;
    ctx.save(); ctx.globalAlpha = fade;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, 230); g.addColorStop(0, `rgba(${rgb},${0.26 + 0.08 * Math.sin(this.t * 3)})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 230, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(${rgb},.5)`; ctx.lineWidth = 2; ctx.setLineDash([6, 16]); ctx.lineDashOffset = this.t * 30;
    ctx.beginPath(); ctx.arc(x, y, 150 + Math.sin(this.t * 2) * 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    this.body(ctx, b.kind, x, y, s, still ? 1 : this.t * 0.55, b.dr);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (b.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${b.flash * 0.3})`; ctx.beginPath(); ctx.arc(x, y, 120, 0, TAU); ctx.fill(); }
    if (still) { ctx.fillStyle = 'rgba(150,200,255,.2)'; ctx.beginPath(); ctx.arc(x, y, 150, 0, TAU); ctx.fill(); }
    if (b.state === 'fight' && !still) {
      if (b.charge > 0) { ctx.strokeStyle = `rgba(255,60,90,${0.6 + 0.4 * Math.sin(this.t * 14)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 168, 0, TAU); ctx.stroke(); }
      if (this.fierce && this.clockFrac > 0) {
        ctx.strokeStyle = this.clockFrac > 0.7 ? 'rgba(255,60,90,.95)' : 'rgba(255,255,255,.5)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y, 180, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, this.clockFrac)); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.restore();
  }

  snapshot() {
    return { hp: this.hp, mana: this.mana, shield: this.shield, frozen: this.frozen, downed: this.downed,
      kills: this.kills, hits: this.hits, wordSlips: this.wordSlips, slipPositions: [...this.slipPositions],
      clock: this.clock, fierce: this.fierce, bossHp: this.boss ? this.boss.hp : null, bossBeaten: this.bossBeaten,
      foes: this.foes.map(f => ({ state: f.state, armor: f.armor })) };
  }
  restore(saved) {
    if (!saved) return;
    for (const key of ['hp', 'mana', 'shield', 'frozen', 'downed', 'kills', 'hits', 'wordSlips', 'clock', 'fierce', 'bossBeaten']) this[key] = saved[key];
    this.slipPositions = new Set(saved.slipPositions || []);
    this.foes.forEach((f, i) => {
      const s = saved.foes[i];
      if (s) { f.state = s.state; f.armor = s.armor; }
      if (f.state !== 'alive') for (let k = f.w0; k <= f.w1; k++) this.byWord[k] = null;
    });
    if (this.boss) {
      this.boss.hp = saved.bossHp == null ? this.boss.max : Math.min(this.boss.max, saved.bossHp);
      this.boss.state = this.bossBeaten ? 'dead' : this.downed ? 'leave' : 'fight';
    }
    if (this.downed) this.byWord.fill(null);
    this.hud();
  }

  /* what the fight adds to the result screen */
  summary() {
    const el = this.lv.kb.keyEls.Enter; if (el) el.classList.remove('charged');
    Sound.setTension(0); Scene.slowmo = false;
    return { downed: this.downed, kills: this.kills, hits: this.hits, boss: this.boss ? this.boss.name : null, bossBeaten: this.bossBeaten, fierce: this.fierce };
  }
}

