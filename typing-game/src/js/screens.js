/* Dragon Keys - title screen, hatching the egg, the lair and the forge */
'use strict';

/* ---------------- Title ---------------- */
App.register('title', {
  enter(el) {
    const S = Store.get();
    Scene.setTheme('peaks'); Scene.setHorizon(0, true); Scene.setSpeed(26);
    Sound.music('home'); Sound.setEnergy(0.3);
    el.innerHTML = `<div class="corner">${App.sysButtons()}</div>
      <div class="logo">Dragon Keys</div>
      <div class="tagline">Small adventures. Confident fingers. Your own dragon.</div>
      <div class="title-play">
        <button class="btn primary big pulse" data-act="play">${ic('play')} ${S.hatched ? 'Continue' : 'Start'}</button>
        <div class="title-hint">or press Enter</div>
      </div>`;
    el.addEventListener('click', e => { if (e.target.closest('[data-act="play"]')) this.play(); });
    this.t = 0;
    this.d = S.hatched ? App.myDragon({ size: [1.6, 1.4, 1.2, 1.1][Store.stage()] }) : new Dragon({ stage: 3, color: 'emerald', size: 1.1 });
    this.d.place(App.W / 2 - 300, 380);
    Scene.onDraw = ctx => this.d.draw(ctx);
  },
  tick(dt) {
    this.t += dt;
    const W = App.W, t = this.t;
    this.d.boost = 1.4;
    this.d.update(dt, W / 2 + Math.sin(t * 0.5) * W * 0.33, 380 + Math.sin(t * 1.0 + 0.5) * 120, 0, 22, 7);
  },
  play() { Sound.click(); App.go(Store.get().hatched ? 'den' : 'hatch'); },
  key(e) { if (e.key === 'Enter' || e.key === ' ') this.play(); },
});

/* ---------------- First run: name, hatch the egg, name the dragon ---------------- */
App.register('hatch', {
  enter(el) {
    Scene.setTheme('meadow'); Scene.setHorizon(0); Scene.setSpeed(14);
    Sound.music('home'); Sound.setEnergy(0.2);
    this.step = 'name'; this.taps = 0; this.d = null; this.t = 0;
    el.innerHTML = `<div class="hatch-card panel" style="top:220px">
        <div class="kicker">Welcome</div><h2>What is your name?</h2>
        <div class="name-form"><input class="text" maxlength="10" placeholder="Your name" autocomplete="off" spellcheck="false">
          <button class="btn primary" data-act="next">Next ${ic('next')}</button></div>
      </div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act); });
    setTimeout(() => { const i = $('input', el); if (i) i.focus(); }, 60);
  },
  act(a) {
    const S = Store.get(), el = this.el;
    if (a === 'next' && this.step === 'name') {
      S.kid = cleanName($('input', el).value, 'Rider');
      Store.save(); Sound.click();
      this.showEgg();
    } else if (a === 'dice') {
      $('input', el).value = Content.pick(PET_NAMES); Sound.pop();
    } else if (a === 'done' && this.step === 'petname') {
      S.pet.name = cleanName($('input', el).value, 'Ember');
      S.hatched = true; Store.save(); Sound.levelUp();
      App.go('den', { welcome: true });
    }
  },
  showEgg() {
    const S = Store.get(), el = this.el;
    this.step = 'egg';
    el.innerHTML = `<div class="coach panel">A dragon egg, <b>${esc(S.kid)}</b>. Rest your index fingers on the two keys with small bumps,
        <span class="keycap" style="--kc:${Art.FINGER_COLORS.L4}">F</span> and <span class="keycap" style="--kc:${Art.FINGER_COLORS.R4}">J</span>, then tap them in turn to wake it.</div>
      <div class="hatch-meter">${'<i></i>'.repeat(8)}</div>
      <div class="hatch-egg">${Art.egg(S.pet.color)}</div>
      <div class="kb-dock panel">${Keyboard.markup()}</div>`;
    if (this.kb) this.kb.destroy();
    this.kb = Keyboard.create(el);
    this.kb.setLearned('fj');
    this.kb.target('f');
  },
  key(e) {
    if (e.key === 'Enter') { if (this.step === 'name') this.act('next'); else if (this.step === 'petname') this.act('done'); return; }
    if (this.step !== 'egg' || e.key.length !== 1) return;
    const want = this.taps % 2 ? 'j' : 'f', ok = e.key.toLowerCase() === want;
    this.kb.press(e, ok);
    const eggEl = $('.egg', this.el);
    if (!ok) { Sound.miss(); return; }
    this.taps++;
    Sound.setEnergy(0.2 + this.taps * 0.06);
    $$('.hatch-meter i', this.el).forEach((d, i) => d.classList.toggle('on', i < this.taps));
    eggEl.classList.remove('shake'); void eggEl.getBoundingClientRect(); eggEl.classList.add('shake');
    eggEl.classList.remove('k1', 'k2', 'k3', 'k4'); eggEl.classList.add('k' + Math.min(4, Math.ceil(this.taps / 2)));
    Sound.crack(); Sound.key(this.taps, 0);
    const p = App.pos(eggEl, 0.5, 0.45);
    FX.burst(p.x, p.y, { n: 8, speed: 220, ring: false });
    if (this.taps >= 8) this.hatch(); else this.kb.target(this.taps % 2 ? 'j' : 'f');
  },
  hatch() {
    const S = Store.get(), el = this.el;
    this.step = 'hatching'; this.kb.destroy(); this.kb = null;
    const box = $('.hatch-egg', el), p = App.pos(box, 0.5, 0.5);
    Sound.hatch(); Sound.setEnergy(0.75);
    FX.shells(p.x, p.y, 22); FX.burst(p.x, p.y, { n: 34, speed: 520, size: 10 }); FX.confetti(110);
    box.remove(); $('.kb-dock', el).remove(); $('.hatch-meter', el).remove();
    this.home = { x: p.x + 60, y: p.y - 20 };
    this.d = new Dragon({ stage: 0, color: S.pet.color, size: 1.7 });
    this.d.place(p.x, p.y);
    Scene.onDraw = ctx => this.d.draw(ctx);
    $('.coach', el).innerHTML = 'It hatched. Say hello to your dragon.';
    App.later(() => {
      this.step = 'petname';
      const card = document.createElement('div');
      card.className = 'hatch-card panel';
      card.innerHTML = `<div class="kicker">One more thing</div><h2>Name your dragon</h2>
        <div class="name-form"><input class="text" maxlength="10" placeholder="Dragon name" autocomplete="off" spellcheck="false">
          <button class="btn icon" data-act="dice" title="Pick a name for me" style="height:56px;width:56px">${ic('retry')}</button>
          <button class="btn primary" data-act="done">Let's fly ${ic('next')}</button></div>`;
      el.appendChild(card);
      $('input', card).focus();
    }, 1500);
  },
  tick(dt) {
    if (!this.d) return;
    this.t += dt;
    // the hatchling circles where the egg was
    this.d.boost = 2;
    this.d.update(dt, this.home.x + Math.cos(this.t * 1.5) * 150, this.home.y + Math.sin(this.t * 1.5) * 70, 0, 26, 7);
  },
  exit() { if (this.kb) { this.kb.destroy(); this.kb = null; } },
});

/* ---------------- The lair (home screen) ---------------- */
App.register('den', {
  TIPS: [
    'Stars come from accuracy. Slow and clean beats fast and messy.',
    'Keep your eyes on the screen. The glowing key shows where to go.',
    'Every word you finish builds a little more of the mission.',
    'Index fingers rest on F and J. Feel for the small bumps.',
    'Two missions make a little adventure. You can stop and come back.',
    'Three stars need 98% accuracy. Replay a level to chase them.',
    'Every world ends with a boss. Other battles are an optional replay.',
    'Type a word in the lair to make your dragon play. Try its name too.',
    'Mana full? Press Enter and type the power word.',
  ],
  enter(el, params = {}) {
    const next = Store.nextLevel();
    Scene.setTheme(WORLDS[next.world - 1].theme); Scene.setHorizon(0); Scene.setSpeed(22);
    Sound.music('home'); Sound.setEnergy(0.3);
    this.t = 0; this.trickTime = 0; this.trick = null; this.buf = '';
    this.tip = params.welcome ? `Welcome, ${Store.get().kid}. Your first adventure is waiting.` : Content.pick(this.TIPS);
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act, b); });
    this.d = App.myDragon({ size: [1.8, 1.5, 1.3, 1.15][Store.stage()] }); this.d.place(App.W * 0.6, 330);
    Scene.onDraw = ctx => { Missions.drawLair(ctx, Store.get().adventure.completed, this.t); this.d.draw(ctx); };
    this.render();
    this.checkNews();
  },
  render() {
    const S = Store.get(), el = this.el, st = Store.stage(), stars = Store.totalStars(), next = Store.nextLevel();
    const nextAt = GROW_AT[st + 1];
    const pct = nextAt ? Math.round((stars - GROW_AT[st]) / (nextAt - GROW_AT[st]) * 100) : 100;
    const miniOpen = Store.worldDone(1) || S.settings.unlockAll;
    const allDone = LEVELS.every(l => Store.levelStars(l.id) > 0);
    const n = Store.worldLevels(next.world).indexOf(next) + 1, got = Store.levelStars(next.id);
    const checkpoint = Store.getCheckpoint(), pending = checkpoint && LEVELS.find(l=>l.id===checkpoint.id);
    const cmds = this.commands().filter(c => !c.secret);
    el.innerHTML = `${App.hud({ title: 'The Lair', sub: WORLDS[next.world - 1].name })}
      <div class="lair-card panel">
        <div class="kicker">${STAGE_NAMES[st]}</div><h3>${esc(S.pet.name)}</h3>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="bar-label">${nextAt ? `${stars} of ${nextAt} stars to grow` : 'Fully grown'}</div>
        <div class="lair-stats">
          <div><b>${LEVELS.filter(l => Store.levelStars(l.id) > 0).length}</b><span>levels</span></div>
          <div><b>${stars}</b><span>stars</span></div>
          <div><b>${S.streak.count}</b><span>day streak</span></div>
        </div>
        <div class="lair-tip">${esc(this.tip)}</div>
      </div>
      <div class="lair-next panel">
        <div class="kicker">${pending ? 'Ready when you are' : allDone ? 'All levels cleared' : 'Next adventure'}</div>
        <h4>${esc(pending ? pending.title : next.title)}</h4><p>${pending ? 'Your unfinished mission is waiting.' : `World ${next.world} · Level ${n} · ${WORLDS[next.world - 1].skill}`}</p>
        <div class="stars">${[0, 1, 2].map(i => ic(i < (pending ? Store.levelStars(pending.id) : got) ? 'star' : 'starOff')).join('')}</div>
        <span class="adventure-count">${S.adventure.sessionCount} of 2 missions this adventure</span>
        <p class="checkpoint-note">${pending ? 'Continue from the key you reached. Your dragon remembers the way.' : 'Press Enter to fly. Two missions make an adventure.'}</p>
        <button class="btn" data-act="map">${ic('map')} Choose a lesson</button>
        <p class="checkpoint-note">${Store.isMemoryOnly() ? 'Saving is unavailable in this browser. Use Stats → Export backup before closing.' : 'Saved in this browser. Stats has backup and restore.'}</p>
      </div>
      <div class="companion-panel panel"><p>${S.adventure.completed ? `“Hello, ${esc(S.kid||'Rider')}. Ready for our next adventure?”` : `“I’m ${esc(S.pet.name||'Ember')}. Let’s fly.”`}</p>
        <div class="lair-say"><span>Type a word to play</span><b class="lair-typed"></b></div>
        <div class="trick-buttons">${cmds.map(c => c.open ? `<button class="btn" data-act="trick" data-trick="${c.id}">${c.word}</button>` : `<button class="btn" disabled title="Finish more missions to learn this trick">? ? ?</button>`).join('')}</div>
        <small>${esc(Missions.rewardText(S.adventure.completed))}</small>
      </div>
      <div class="lair-actions">
        <button class="btn" data-act="map">${ic('map')} Map</button>
        <button class="btn" data-act="forge">${ic('forge')} Forge</button>
        <button class="btn primary big pulse" data-act="play">${ic('play')} ${pending ? 'Resume mission' : 'Start adventure'}</button>
        <button class="btn" data-act="mini" ${miniOpen ? '' : 'style="opacity:.55"'}>${ic(miniOpen ? 'storm' : 'lock')} Gem Storm</button>
        <button class="btn" data-act="parent">${ic('chart')} Stats</button>
      </div>`;
  },
  act(a, b) {
    const S = Store.get();
    if (a === 'diff') { S.settings.difficulty = b.dataset.id; Store.save(); Sound.pop(); this.render(); }
    else if (a === 'play') {
      Sound.click();
      const cp = Store.getCheckpoint();
      if (cp) App.go('level', { id: cp.id, resume: true });
      else {
        if (S.adventure.sessionCount >= 2) { S.adventure.sessionCount = 0; Store.save(); }
        const id = Store.nextLevel().id;
        // the warm-up comes before the first flight of the day only
        if (S.adventure.warmDay !== Store.today()) App.go('briefing', { id }); else App.go('level', { id, route: Missions.autoRoute(id) });
      }
    }
    else if (a === 'trick') this.perform(b.dataset.trick);
    else if (a === 'map') { Sound.click(); App.go('map'); }
    else if (a === 'forge') { Sound.click(); Forge.open(() => { this.d.setLook(Object.assign(DragonViews.look({ dataset: {} }), { size: [1.8, 1.5, 1.3, 1.15][Store.stage()] })); this.render(); }); }
    else if (a === 'parent') { Sound.click(); App.go('parent'); }
    else if (a === 'mini') {
      if (Store.worldDone(1) || S.settings.unlockAll) { Sound.click(); App.go('mini'); }
      else { Sound.nope(); App.toast('Finish Moonlit Meadow to unlock Gem Storm'); }
    }
  },
  /* words she can type in the lair, and what each makes the dragon do */
  commands() {
    const S = Store.get(), got = id => Missions.rewards(S.adventure.completed).some(r => r.id === id);
    return [{ word: 'dash', id: 'dash', open: true }, { word: 'flash', id: 'flash', open: true }, { word: 'fire', id: 'fire', open: true },
      { word: 'loop', id: 'loop', open: got('loop') }, { word: 'heart', id: 'heart', open: got('heart') }, { word: 'ribbon', id: 'eight', open: got('eight') },
      { word: (S.pet.name || 'ember').toLowerCase(), id: 'name', open: true, secret: true }];
  },
  perform(id) {
    const c = this.commands().find(x => x.id === id), d = this.d, h = d.head(), S = Store.get();
    if (!c || !c.open) return;
    if (id === 'fire') {
      d.jawTarget = 1; Sound.fire();
      let k = 0;
      const iv = setInterval(() => { const q = d.mouth(); FX.fire(q.x, q.y, q.dx, q.dy, 1.3); if (++k > 16 || App.screen !== 'den') { clearInterval(iv); d.jawTarget = 0; } }, 45);
    } else if (id === 'flash') {
      Sound.levelUp(); FX.burst(h.x, h.y, { n: 40, speed: 520, size: 11, g: 0, colors: ['#ffffff', '#22e1ff', '#ff3df0', '#ffd98a'], ringGrow: 420 }); FX.confetti(50);
    } else if (id === 'name') {
      Sound.heal(); FX.text(h.x, h.y - 90, `Hi, ${S.kid || 'Rider'}!`, '#ffd98a', 32); FX.burst(h.x, h.y, { n: 16, speed: 240, g: -200, colors: ['#ff8fc1', '#ffffff'] });
    } else { this.trick = id; this.trickTime = 0; Sound.whoosh(); }
  },
  key(e) {
    if (e.key === 'Enter') { this.act('play'); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || !/^[a-zA-Z]$/.test(e.key)) return;
    this.buf = (this.buf + e.key.toLowerCase()).slice(-12);
    Sound.key(this.buf.length, 0);
    const hit = this.commands().find(c => c.open && this.buf.endsWith(c.word));
    const out = $('.lair-typed', this.el);
    if (out) { out.textContent = hit ? hit.word : this.buf; out.classList.toggle('hit', !!hit); }
    clearTimeout(this.bufT); this.bufT = setTimeout(() => { this.buf = ''; const o = $('.lair-typed', this.el); if (o) { o.textContent = ''; o.classList.remove('hit'); } }, hit ? 1200 : 2600);
    if (hit) { this.buf = ''; this.perform(hit.id); }
  },
  tick(dt) {
    this.t += dt;
    const t = this.t, W = App.W;
    if (this.trick === 'dash') {
      this.trickTime += dt;
      const u = Math.min(1, this.trickTime / 1.8);
      this.d.boost = 5; this.d.update(dt, W * .53 + Math.sin(u * TAU) * W * .3, 290 + Math.sin(u * TAU * 2) * 26, 20, 70, 11);
      if (u === 1) this.trick = null;
      return;
    }
    if (this.trick) {
      this.trickTime += dt;
      const u=Math.min(1,this.trickTime/5), a=u*Math.PI*2;
      let x,y;
      if (this.trick==='heart') { x=W*.53+Math.pow(Math.sin(a),3)*125; y=285-(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a))*8; }
      else if (this.trick==='eight') { x=W*.53+Math.sin(a)*160;y=290+Math.sin(a*2)*67; }
      else { x=W*.53+Math.cos(a)*145;y=285+Math.sin(a)*100; }
      this.d.boost=2;this.d.update(dt,x,y,20,28,8);
      if(u===1)this.trick=null;
      return;
    }
    this.d.boost = 0.8;
    this.d.update(dt, W * 0.56 + Math.sin(t * 0.55) * 80, 300 + Math.sin(t * 0.9) * 50 + Math.sin(t * 2.1) * 10, 120, 20, 7);
  },
  exit() { clearTimeout(this.bufT); },
  /* things she has not been told about yet: growth, and rewards from worlds finished in an older version */
  checkNews() {
    const S = Store.get(), st = Store.stage();
    if (st > S.seenStage) {
      const before = S.seenStage; S.seenStage = st; Store.save();
      App.later(() => Celebrate.grow({ before }, () => { App.closeModal(); this.render(); }), 600);
    }
  },
});

/* ---------------- The forge: skins, trails and crests ---------------- */
const Forge = (() => {
  const TABS = [['skin', 'Skins'], ['trail', 'Trails'], ['crest', 'Crests']];
  const TABLE = { skin: DRAGON_COLORS, trail: TRAILS, crest: CRESTS };
  const FIELD = { skin: 'color', trail: 'trail', crest: 'crest' };
  let tab = 'skin', sel = null, done = null;

  function open(onClose) { done = onClose; sel = null; draw(); }
  const equipped = (kind, id) => Store.get().pet[FIELD[kind]] === id;
  function lockText(kind, id) {
    const it = TABLE[kind][id];
    if (kind === 'skin') return 'Finish Dragon Summit';
    return 'Finish ' + WORLDS[it.world - 1].name;
  }
  function draw() {
    const S = Store.get();
    if (!sel || sel.kind !== tab) sel = { kind: tab, id: S.pet[FIELD[tab]] };
    const it = TABLE[tab][sel.id], own = Store.owns(tab, sel.id), on = equipped(tab, sel.id);
    const look = { color: S.pet.color, trail: S.pet.trail, crest: S.pet.crest, zoom: [1.5, 1.25, 1.05, 0.9][Store.stage()] };
    look[FIELD[tab]] = sel.id;
    const action = on ? `${ic('check')} Equipped`
      : own ? `<button class="btn primary" data-act="equip">Equip</button>`
      : it.price < 0 ? `${ic('lock')} ${lockText(tab, sel.id)}`
      : `<button class="btn primary" data-act="buy">${ic('shard')} Buy for ${it.price}</button>`;
    const goods = Object.entries(TABLE[tab]).map(([id, x]) => {
      const o = Store.owns(tab, id), e = equipped(tab, id);
      const state = e ? `${ic('check')} Equipped` : o ? 'Owned' : x.price < 0 ? `${ic('lock')} ${lockText(tab, id)}` : `${ic('shard')} ${x.price}`;
      return `<button class="good ${e ? 'on' : ''} ${sel.id === id ? 'sel' : ''}" data-act="pick" data-id="${id}">${Art.swatch(tab, id)}<b>${x.name}</b><small>${state}</small></button>`;
    }).join('');
    App.modal(`<div class="modal forge"><button class="btn icon x" data-act="close" aria-label="Close">${ic('close')}</button>
      <div class="forge-view">${App.dv(look)}
        <div class="info"><div class="kicker">${tab}</div><h3>${it.name}</h3><div class="act">${action}</div></div></div>
      <div class="forge-main"><div class="tabs">${TABS.map(([id, name]) => `<button class="tab ${id === tab ? 'on' : ''}" data-act="tab" data-id="${id}">${name}</button>`).join('')}
          <div class="chip">${ic('shard')}<span class="coin-count">${S.coins}</span></div></div>
        <div class="goods">${goods}</div></div></div>`,
    { act, onClose: () => { if (done) done(); }, dismiss: true });
  }
  function act(a, b) {
    const S = Store.get();
    if (a === 'close') { Sound.click(); App.closeModal(); return; }
    if (a === 'tab') { tab = b.dataset.id; sel = null; Sound.pop(); draw(); return; }
    if (a === 'pick') { sel = { kind: tab, id: b.dataset.id }; Sound.pop(); draw(); return; }
    if (a === 'equip') { S.pet[FIELD[tab]] = sel.id; Store.save(); Sound.equip(); draw(); return; }
    if (a === 'buy') {
      const cost = TABLE[tab][sel.id].price;
      if (S.coins < cost) { Sound.nope(); App.toast(`You need ${cost - S.coins} more shards. Fly a level to collect some.`); return; }
      const before = S.coins, p = App.pos(b);
      Store.addCoins(-cost); Store.give(tab, sel.id); S.pet[FIELD[tab]] = sel.id; Store.save();
      Sound.buy();
      draw();
      FX.burst(p.x, p.y, { n: 18, colors: ['#22e1ff', '#ffffff', '#ff3df0'] });
      App.refreshCoins(before);
    }
  }
  return { open };
})();

