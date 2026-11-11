/* Dragon Keys - title screen, hatching the egg, the den and the shop */
'use strict';

/* ---------------- Title ---------------- */
App.register('title', {
  enter(el) {
    Scene.setTheme('meadow'); Scene.setHorizon(0, true); Scene.setSpeed(34);
    const S = Store.get();
    const cols = [['#7a5cf0', '#5233c4'], ['#ff6fa8', '#d13a79'], ['#ff9f43', '#d86f10'], ['#ffc928', '#dc9a00'], ['#3fd17f', '#1c9955'], ['#4db8ff', '#1c82d2']];
    const logo = [...'DRAGON KEYS'].map((ch, i) => ch === ' ' ? '<span class="gap"></span>'
      : `<span style="--c:${cols[i % 6][0]};--cd:${cols[i % 6][1]};--i:${i}">${ch}</span>`).join('');
    el.innerHTML = `<div class="corner">${App.sysButtons()}</div>
      <div class="logo">${logo}</div>
      <div class="tagline">Learn to type with your very own dragon</div>
      <div class="title-pet">${S.hatched ? App.petSvg('fly') : Art.egg(S.pet.color)}</div>
      <div class="title-play">
        <button class="btn green big pulse" data-act="play">${ic('play')} ${S.hatched ? 'Play' : 'Start'}</button>
        <div class="title-hint">or press Enter</div>
      </div>`;
    el.addEventListener('click', e => { if (e.target.closest('[data-act="play"]')) this.play(); });
    this.t = 0; this.pet = $('.title-pet', el);
  },
  tick(dt) {
    this.t += dt;
    if (Store.get().hatched) {
      this.pet.style.transform = `translate(${Math.sin(this.t * 0.6) * 60}px, ${Math.sin(this.t * 1.7) * 16}px) rotate(${Math.sin(this.t * 1.7 + 1) * 4}deg)`;
      if (Math.random() < dt * 8) { const p = App.pos(this.pet, 0.1, 0.6); FX.trail(p.x, p.y, ['#fff7b0', '#ffd23f', '#ffffff']); }
    }
  },
  play() { Sound.click(); App.go(Store.get().hatched ? 'den' : 'hatch'); },
  key(e) { if (e.key === 'Enter' || e.key === ' ') this.play(); },
});

/* ---------------- First run: name, hatch the egg, name the dragon ---------------- */
App.register('hatch', {
  enter(el) {
    Scene.setTheme('meadow'); Scene.setHorizon(0); Scene.setSpeed(16);
    this.step = 'name'; this.taps = 0;
    el.innerHTML = `<div class="hatch-card glass" style="top:230px">
        <h2>Welcome to Dragon Keys!</h2>
        <p style="font-size:24px;font-weight:500;margin:10px 0 0;color:var(--ink-soft)">What is your name?</p>
        <div class="name-form"><input class="text" maxlength="10" placeholder="Your name" autocomplete="off" spellcheck="false">
          <button class="btn green" data-act="next">Next ${ic('next')}</button></div>
      </div>`;
    el.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) this.act(b.dataset.act); });
    setTimeout(() => { const i = $('input', el); if (i) i.focus(); }, 60);
  },
  act(a) {
    const S = Store.get(), el = this.el;
    if (a === 'next' && this.step === 'name') {
      S.kid = cleanName($('input', el).value, 'Friend');
      Store.save(); Sound.click();
      this.showEgg();
    } else if (a === 'dice') {
      $('input', el).value = Content.pick(PET_NAMES); Sound.pop();
    } else if (a === 'done' && this.step === 'petname') {
      S.pet.name = cleanName($('input', el).value, 'Ember');
      S.hatched = true; S.pet.hearts = 3; Store.save(); Sound.levelUp();
      App.go('den', { welcome: true });
    }
  },
  showEgg() {
    const S = Store.get(), el = this.el;
    this.step = 'egg';
    el.innerHTML = `<div class="coach glass">Look, <b>${esc(S.kid)}</b>, a dragon egg! Rest your pointer fingers on the two keys with little bumps:
        <span class="keycap" style="--kc:${Art.FINGER_COLORS.L4}">F</span> and <span class="keycap" style="--kc:${Art.FINGER_COLORS.R4}">J</span>. Tap them to help it hatch!</div>
      <div class="hatch-meter">${'<i></i>'.repeat(8)}</div>
      <div class="hatch-egg">${Art.egg(S.pet.color)}</div>
      <div class="kb-dock glass">${Keyboard.markup()}</div>`;
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
    $$('.hatch-meter i', this.el).forEach((d, i) => d.classList.toggle('on', i < this.taps));
    eggEl.classList.remove('shake'); void eggEl.getBoundingClientRect(); eggEl.classList.add('shake');
    eggEl.classList.remove('k1', 'k2', 'k3', 'k4'); eggEl.classList.add('k' + Math.min(4, Math.ceil(this.taps / 2)));
    Sound.crack();
    const p = App.pos(eggEl, 0.5, 0.45);
    FX.burst(p.x, p.y, { n: 8, speed: 200, colors: ['#fff6dc', '#ffd23f', '#ffffff'], ring: false });
    if (this.taps >= 8) this.hatch(); else this.kb.target(this.taps % 2 ? 'j' : 'f');
  },
  hatch() {
    const S = Store.get(), el = this.el;
    this.step = 'hatching'; this.kb.clear();
    const box = $('.hatch-egg', el), p = App.pos(box, 0.5, 0.5);
    Sound.hatch(); FX.shells(p.x, p.y, 22); FX.burst(p.x, p.y, { n: 30, speed: 480, size: 10 }); FX.confetti(120);
    box.innerHTML = Art.dragon({ color: S.pet.color, stage: 0, cls: 'happy' });
    $('.kb-dock', el).remove(); $('.hatch-meter', el).remove();
    $('.coach', el).innerHTML = `It hatched! Say hello to your baby dragon.`;
    App.later(() => {
      this.step = 'petname';
      const card = document.createElement('div');
      card.className = 'hatch-card glass';
      card.innerHTML = `<h2>What will you call your dragon?</h2>
        <div class="name-form"><input class="text" maxlength="10" placeholder="Dragon name" autocomplete="off" spellcheck="false">
          <button class="btn yellow round" data-act="dice" title="Pick a name for me">${ic('retry')}</button>
          <button class="btn green" data-act="done">Let's go! ${ic('next')}</button></div>`;
      el.appendChild(card);
      $('input', card).focus();
    }, 1500);
  },
});

/* ---------------- The den ---------------- */
App.register('den', {
  noScene: true,
  enter(el, params = {}) {
    this.params = params; this.trayOpen = false; this.busy = false;
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b) this.act(b.dataset.act, b);
      else if (this.trayOpen && !e.target.closest('.tray')) { this.trayOpen = false; this.render(); }
    });
    this.render();
    const S = Store.get();
    if (params.welcome) this.say(`Hi ${S.kid}! I'm ${S.pet.name}. Let's learn to type together!`);
    else this.say(this.greeting());
    this.checkGrowth();
  },
  greeting() {
    const S = Store.get(), next = Store.nextLevel();
    if (S.pet.hearts <= 1) return 'My tummy is rumbling. Do you have a snack?';
    const lines = [
      `Welcome back, ${S.kid}! Ready to fly?`,
      `Next level: ${next.title}`,
      'Careful fingers earn the most stars.',
      'Try not to peek at your hands!',
    ];
    if (S.streak.count >= 2) lines.push(`${S.streak.count} days in a row. You are on fire!`);
    if (Store.totalStars() >= 6) lines.push(`We have ${Store.totalStars()} stars already!`);
    return Content.pick(lines);
  },
  say(text) {
    const old = $('.bubble', this.el); if (old) old.remove();
    const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text;
    this.el.appendChild(b);
    clearTimeout(this.bubbleT); this.bubbleT = setTimeout(() => b.remove(), 7000);
  },
  render() {
    const S = Store.get(), el = this.el, st = Store.stage(), stars = Store.totalStars();
    const nextAt = GROW_AT[st + 1];
    const pct = nextAt ? Math.round((stars - GROW_AT[st]) / (nextAt - GROW_AT[st]) * 100) : 100;
    const miniOpen = Store.worldDone(1) || S.settings.unlockAll;
    const hearts = [0, 1, 2, 3, 4].map(i => ic(i < S.pet.hearts ? 'heart' : 'heartOff')).join('');
    const keepBubble = $('.bubble', el);
    el.innerHTML = `<div class="room-wrap">${Art.room(S.owned)}</div>
      <div class="den-pets">
        ${S.friends.map(f => `<div class="fr-${f}" data-act="friend" data-f="${f}">${Art.friend(f)}</div>`).join('')}
        <div class="den-pet" data-act="pet" style="width:${260 + st * 22}px;left:${640 - (260 + st * 22) / 2}px;top:${580 - (260 + st * 22) * 1.012}px">${App.petSvg()}</div>
      </div>
      ${App.hud({ title: `${S.pet.name}'s Den` })}
      <div class="pet-card glass">
        <h3>${esc(S.pet.name)}</h3><div class="stage">${STAGE_NAMES[st]}</div>
        <div class="hearts" title="Feed your dragon to fill its hearts">${hearts}</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="bar-label">${nextAt ? `${stars} of ${nextAt} stars to grow bigger` : 'Fully grown. What a dragon!'}${S.pet.hearts >= 5 ? '<br><b style="color:#d13a79">Happy dragon: +20% coins</b>' : ''}</div>
      </div>
      <div class="den-actions">
        <button class="btn blue" data-act="shop">${ic('bag')}Shop</button>
        <button class="btn pink" data-act="feed">${ic('food')}Feed</button>
        <button class="btn green big pulse" data-act="play">${ic('play')}Play</button>
        <button class="btn ${miniOpen ? 'orange' : 'grey'}" data-act="mini">${ic(miniOpen ? 'gem' : 'lock')}Gem Storm</button>
        <button class="btn white" data-act="parent">${ic('chart')}Grown-ups</button>
      </div>
      ${this.trayOpen ? this.trayHtml() : ''}`;
    if (keepBubble) el.appendChild(keepBubble);
  },
  trayHtml() {
    const S = Store.get();
    const have = SHOP.food.filter(f => S.food[f.id] > 0);
    if (!have.length) return `<div class="tray glass"><p>No snacks yet.</p><button class="btn blue small" data-act="shop">${ic('bag')} Buy snacks</button></div>`;
    return `<div class="tray glass">${have.map(f => `<button class="food" data-act="eat" data-id="${f.id}" title="${f.name}">${Art.item(f.id)}<span class="count">${S.food[f.id]}</span></button>`).join('')}</div>`;
  },
  act(a, b) {
    const S = Store.get();
    if (a === 'play') { Sound.click(); App.go('map'); }
    else if (a === 'shop') { Sound.click(); Shop.open(this.trayOpen ? 'food' : null, () => { this.trayOpen = false; this.render(); }); }
    else if (a === 'feed') { Sound.pop(); this.trayOpen = !this.trayOpen; this.render(); }
    else if (a === 'eat') this.feed(b.dataset.id, b);
    else if (a === 'parent') { Sound.click(); App.go('parent'); }
    else if (a === 'mini') {
      if (Store.worldDone(1) || S.settings.unlockAll) { Sound.click(); App.go('mini'); }
      else { Sound.nope(); App.toast('Finish the Sunny Meadow to unlock Gem Storm'); }
    } else if (a === 'pet') this.pat();
    else if (a === 'friend') {
      const svg = $('svg', b); svg.classList.remove('hop'); void svg.getBoundingClientRect(); svg.classList.add('hop');
      Sound.chirp(); const p = App.pos(b, 0.5, 0.2); FX.hearts(p.x, p.y, 3);
    }
  },
  pat() {
    const S = Store.get(), box = $('.den-pet', this.el), svg = $('svg', box);
    svg.classList.remove('hop'); void svg.getBoundingClientRect(); svg.classList.add('hop', 'happy');
    setTimeout(() => svg.classList.remove('happy'), 900);
    Sound.chirp();
    const p = App.pos(box, 0.6, 0.25); FX.hearts(p.x, p.y, 5);
    this.say(Content.pick([`I love flying with you, ${S.kid}!`, 'That tickles!', 'Can we practise some more?', 'Rawr! That means thank you.', this.greeting()]));
  },
  feed(id, btn) {
    if (this.busy) return;
    const S = Store.get(), food = SHOP.food.find(f => f.id === id);
    if (!food || !(S.food[id] > 0)) return;
    this.busy = true;
    S.food[id]--; S.pet.hearts = Math.min(5, S.pet.hearts + food.hearts); S.pet.lastCare = Store.today(); Store.save();
    const from = App.pos(btn), petBox = $('.den-pet', this.el), to = App.mouthPos($('svg', petBox));
    const fly = document.createElement('div'); fly.className = 'fly-item'; fly.innerHTML = Art.item(id);
    fly.style.left = (from.x - 35) + 'px'; fly.style.top = (from.y - 35) + 'px';
    this.el.appendChild(fly);
    this.trayOpen = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { fly.style.left = (to.x - 30) + 'px'; fly.style.top = (to.y - 30) + 'px'; fly.style.transform = 'scale(.5) rotate(200deg)'; }));
    Sound.whoosh();
    App.later(() => {
      fly.remove();
      this.render();
      const svg = $('.den-pet svg', this.el);
      svg.classList.add('eating'); Sound.munch();
      App.later(() => {
        svg.classList.remove('eating'); svg.classList.add('happy');
        const p = App.pos(svg, 0.6, 0.2); FX.hearts(p.x, p.y, 7);
        if (food.fire) {
          this.say('SPICY!');
          svg.classList.add('mouth-open'); Sound.fire();
          let n = 0; const m = App.mouthPos(svg);
          const iv = setInterval(() => { FX.fire(m.x + 10, m.y, 0.96, -0.26, 1); if (++n > 12) clearInterval(iv); }, 50);
        } else this.say(Content.pick(['Yum! Thank you!', 'Delicious!', 'My favourite!']));
        App.later(() => { svg.classList.remove('happy', 'mouth-open'); this.busy = false; }, 1100);
      }, 1250);
    }, 580);
  },
  /* show a little party when the dragon has grown since she last saw it */
  checkGrowth() {
    const S = Store.get(), st = Store.stage();
    if (st <= S.seenStage) return;
    const before = S.seenStage; S.seenStage = st; Store.save();
    App.later(() => {
      Sound.levelUp(); FX.confetti(110);
      App.modal(`<div class="modal unlock"><h2>${esc(S.pet.name)} grew!</h2><p>All those stars made your dragon bigger and stronger.</p>
        <div class="grow">${App.petSvg('', { stage: before })}${ic('next')}${App.petSvg('happy')}</div>
        <p style="margin-top:10px"><b style="color:var(--purple-d)">${STAGE_NAMES[st]}</b></p>
        <div class="row"><button class="btn green" data-act="ok">Hooray!</button></div></div>`,
      { act: () => App.closeModal(), key: e => { if (e.key === 'Enter' || e.key === ' ') App.closeModal(); }, onClose: () => this.render() });
    }, 700);
  },
  exit() { clearTimeout(this.bubbleT); },
});

/* ---------------- The shop ---------------- */
const Shop = (() => {
  let tab = 'food', done = null;
  const TABS = [['food', 'Snacks'], ['wear', 'Dress up'], ['color', 'Colours'], ['room', 'Den']];

  function open(startTab, onClose) {
    if (startTab) tab = startTab;
    done = onClose;
    draw();
  }
  function goodsHtml() {
    const S = Store.get();
    const price = (id, p) => `<button class="btn yellow small" data-act="buy" data-id="${id}" data-price="${p}">${ic('coin')} ${p}</button>`;
    if (tab === 'food') return SHOP.food.map(f => `<div class="good">${Art.item(f.id)}<b>${f.name}</b>
      <span style="font-size:15px;color:var(--ink-soft);font-weight:500">${S.food[f.id] ? 'You have ' + S.food[f.id] : (f.fire ? 'Breathes fire!' : '+' + f.hearts + (f.hearts > 1 ? ' hearts' : ' heart'))}</span>${price(f.id, f.price)}</div>`).join('');
    if (tab === 'wear') return SHOP.wear.map(w => {
      const own = S.owned[w.id], on = S.pet.wear.includes(w.id);
      return `<div class="good ${on ? 'on' : ''}">${Art.item(w.id)}<b>${w.name}</b>${own
        ? `<button class="btn ${on ? 'white' : 'green'} small" data-act="wear" data-id="${w.id}">${on ? 'Take off' : 'Wear'}</button>` : price(w.id, w.price)}</div>`;
    }).join('');
    if (tab === 'color') return Object.entries(DRAGON_COLORS).map(([id, c]) => {
      const own = id === 'emerald' || S.owned['c-' + id], on = S.pet.color === id;
      const sw = `<div class="swatch" style="--sm:${c.main};--sl:${c.light};--sd:${c.dark};--sw:${c.wing};--swd:${c.wingDark}"></div>`;
      let btn;
      if (on) btn = `<button class="btn white small" disabled>${ic('check')} Wearing</button>`;
      else if (own) btn = `<button class="btn green small" data-act="color" data-id="${id}">Use</button>`;
      else if (c.price < 0) btn = `<span style="font-size:15px;font-weight:500;color:var(--ink-soft);line-height:1.2">${ic('lock')} Finish Dragon Summit</span>`;
      else btn = price('c-' + id, c.price);
      return `<div class="good ${on ? 'on' : ''}">${sw}<b>${c.name}</b>${btn}</div>`;
    }).join('');
    return SHOP.room.map(r => `<div class="good ${S.owned[r.id] ? 'on' : ''}">${Art.item(r.id)}<b>${r.name}</b>${S.owned[r.id]
      ? `<span style="font-size:16px;font-weight:600;color:var(--green-d)">${ic('check')} In your den</span>` : price(r.id, r.price)}</div>`).join('');
  }
  function draw() {
    const S = Store.get();
    App.modal(`<div class="modal shop"><button class="x" data-act="close" aria-label="Close">${ic('close')}</button>
      <div class="shop-side"><div style="font-size:26px;font-weight:700">${esc(S.pet.name)}</div>${App.petSvg()}
        <div class="pill">${ic('coin')}<b class="coin-count">${S.coins}</b></div></div>
      <div class="shop-main"><div class="tabs">${TABS.map(([id, name]) => `<button class="tab ${id === tab ? 'on' : ''}" data-act="tab" data-id="${id}">${name}</button>`).join('')}</div>
        <div class="goods">${goodsHtml()}</div></div></div>`,
    { act, onClose: () => { if (done) done(); }, dismiss: true });
  }
  function act(a, b) {
    const S = Store.get(), id = b.dataset.id;
    if (a === 'close') { Sound.click(); App.closeModal(); return; }
    if (a === 'tab') { tab = id; Sound.pop(); draw(); return; }
    if (a === 'wear') {
      const slot = Art.wearSlot(id);
      if (S.pet.wear.includes(id)) S.pet.wear = S.pet.wear.filter(w => w !== id);
      else S.pet.wear = S.pet.wear.filter(w => Art.wearSlot(w) !== slot).concat(id);
      Store.save(); Sound.pop(); draw(); return;
    }
    if (a === 'color') { S.pet.color = id; Store.save(); Sound.pop(); draw(); return; }
    if (a === 'buy') {
      const cost = +b.dataset.price;
      if (S.coins < cost) { Sound.nope(); App.toast(`You need ${cost - S.coins} more coins. Play a level to earn some!`); return; }
      const before = S.coins, p = App.pos(b);
      Store.addCoins(-cost);
      if (tab === 'food') S.food[id] = (S.food[id] || 0) + 1;
      else {
        S.owned[id] = true;
        if (tab === 'wear') { const slot = Art.wearSlot(id); S.pet.wear = S.pet.wear.filter(w => Art.wearSlot(w) !== slot).concat(id); }
        if (tab === 'color') S.pet.color = id.slice(2);
      }
      Store.save(); Sound.buy();
      draw();
      FX.burst(p.x, p.y, { n: 16, colors: ['#ffd23f', '#fff7b0', '#ff9f43'] });
      App.refreshCoins(before);
    }
  }
  return { open };
})();
