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
    function target(ch) {
      clear();
      if (ch == null || destroyed) return;
      current = ch;
      if (!memory) { reveal(); return; }
      if (title) title.textContent = 'Try this key from memory';
      if (detail) detail.textContent = 'A hint appears after a short pause. You can ask for it any time.';
      if (badge) badge.textContent = '?';
      if (coach) coach.classList.add('awaiting-hint');
      if (help) help.hidden = false;
      pending = setTimeout(reveal, 1200);
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


/* Adventure objectives accompany the existing, progressively taught key sets. */
'use strict';
const Missions = (() => {
  const objectives = [
    { kind:'bridge', title:'The starlight crossing', goal:'A broken sky bridge separates two islands. Each completed phrase restores another piece.', success:'The bridge is open. Travellers can cross again.' },
    { kind:'rescue', title:'A friend in the clouds', goal:'A little sky owl has lost its way. Light a trail so it can fly safely home.', success:'Your sky owl friend is home. It gives you a thankful little bow.' },
    { kind:'garden', title:'The sleeping garden', goal:'The wind garden needs a little dragon magic. Each phrase helps another flower bloom.', success:'The garden is awake, and its flowers are dancing in the breeze.' },
    { kind:'beacon', title:'The missing lights', goal:'The guiding beacon has gone dark. Gather light as you type and help it shine again.', success:'The beacon shines. Every dragon can find the path home.' },
    { kind:'mend', title:'The cloud engine', goal:'An island has drifted off course. Restore the rings of its cloud engine, one phrase at a time.', success:'The cloud engine is turning. The island is back on its gentle course.' },
    { kind:'chart', title:'A map of small wonders', goal:'An explorer left an unfinished star map. Reveal its hidden constellation with your dragon.', success:'A new constellation fills the map. Where will it lead next?' },
  ];
  const places = ['Meadow','Peaks','Cavern','Citadel','Summit'];
  const unlocks = [
    { at:1, id:'hello', name:'A dragon greeting', text:'Your dragon greets you by name at the lair.' },
    { at:2, id:'loop', name:'Sky loop', text:'Your dragon learned Sky Loop. Try it in the lair.' },
    { at:4, id:'lanterns', name:'Floating lanterns', text:'Warm lanterns now float around your lair.' },
    { at:6, id:'owl', name:'A visiting sky owl', text:'A sky owl has made your lair its favourite stopping place.' },
    { at:8, id:'heart', name:'Heart flight', text:'Your dragon learned Heart Flight. Try your new trick in the lair.' },
    { at:10, id:'flowers', name:'A wind garden', text:'A little wind garden blooms in your lair.' },
    { at:14, id:'eight', name:'Ribbon flight', text:'Your dragon learned Ribbon Flight. Choose it in the lair.' },
    { at:18, id:'pennants', name:'Explorer pennants', text:'Your lair now flies the colours of a seasoned explorer.' },
    { at:22, id:'sparks', name:'Firefly friends', text:'Gentle fireflies have joined your dragon at home.' },
    { at:28, id:'stars', name:'Your constellation', text:'A dragon constellation glows above your lair.' },
  ];
  function get(id, route=0) {
    const level=LEVELS.find(l=>l.id===id)||LEVELS[0];
    route=route===1?1:0;
    const local=LEVELS.filter(l=>l.world===level.world).indexOf(level);
    const objective=objectives[(local+(level.world-1)*2+route*3)%objectives.length];
    return {...objective,id:level.id,route,world:level.world,title:`${places[level.world-1]} · ${objective.title}`};
  }
  const rewards = count => unlocks.filter(r=>r.at<=count);
  function rewardText(count) {
    const earned=rewards(count), latest=earned.at(-1), next=unlocks.find(r=>r.at>count);
    if(!latest) return 'Finish your first mission to earn a greeting from your dragon.';
    return latest.text+(next?` Next discovery in ${next.at-count} mission${next.at-count===1?'':'s'}.`:' Your lair is full of the discoveries you made together.');
  }
  function dot(c,x,y,r,color) { c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill(); }
  function line(c,x,y,x2,y2,color,width=3) {c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
  function star(c,x,y,size,color) {
    c.fillStyle=color;c.beginPath();
    for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=size*(i%2?0.43:1);if(i)c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);else c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.closePath();c.fill();
  }
  function owl(c,x,y,t,size=1) {
    c.save();c.translate(x,y);c.scale(size,size);
    c.fillStyle='#b5e5f1'; c.beginPath();c.ellipse(-13,-2,17,7,-0.4-Math.sin(t*4)*0.15,0,Math.PI*2);c.fill();
    c.beginPath();c.ellipse(13,-2,17,7,0.4+Math.sin(t*4)*0.15,0,Math.PI*2);c.fill();
    dot(c,0,0,16,'#def9f8');dot(c,-6,-2,6,'#2d5c72');dot(c,6,-2,6,'#2d5c72');dot(c,-5,-3,2,'#fff');dot(c,5,-3,2,'#fff');
    c.fillStyle='#f4c878';c.beginPath();c.moveTo(-3,5);c.lineTo(3,5);c.lineTo(0,10);c.closePath();c.fill();c.restore();
  }
  function flower(c,x,y,t,color='#f3a9df') {
    line(c,x,y,x+Math.sin(t)*3,y-28,'#67bcac',3);
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;dot(c,x+Math.cos(a)*8,y-30+Math.sin(a)*8,6,color);}dot(c,x,y-30,5,'#ffe0a1');
  }
  function draw(c,m,progress,t) {
    if(!m)return;
    const p=Math.max(0,Math.min(1,Number(progress)||0)),n=Math.floor(p*8),W=typeof App==='undefined'?1280:App.W;
    c.save();c.translate(W*0.76,191);c.lineCap='round';c.lineJoin='round';
    const halo=c.createRadialGradient(0,0,12,0,0,155);halo.addColorStop(0,'rgba(98,228,215,.12)');halo.addColorStop(1,'rgba(98,228,215,0)');c.fillStyle=halo;c.fillRect(-160,-112,320,210);
    const base='#315b78',lit='#b5f4dd',gold='#ffe0a1';
    if(m.kind==='bridge'){
      c.fillStyle='#274a69';c.beginPath();c.moveTo(-144,45);c.lineTo(-88,45);c.lineTo(-116,88);c.closePath();c.fill();c.beginPath();c.moveTo(88,45);c.lineTo(144,45);c.lineTo(115,88);c.closePath();c.fill();
      for(let i=0;i<8;i++){const x=-88+i*25;c.fillStyle=i<n?lit:base;c.fillRect(x,24+Math.sin(i/7*Math.PI)*-10,21,9);if(i<n)dot(c,x+10,17,2,gold);}
      line(c,-115,25,-115,-10,gold,3);star(c,-115,-17,7,gold);line(c,116,25,116,-10,n===8?gold:base,3);star(c,116,-17,7,n===8?gold:base);
    } else if(m.kind==='rescue'){
      for(let i=0;i<8;i++)star(c,-114+i*31,16+Math.sin(i*.65)*21,5,i<n?gold:base);
      c.strokeStyle=lit;c.lineWidth=3;c.beginPath();c.arc(119,-4,33,Math.PI,Math.PI*2);c.stroke();c.fillStyle='#6e6b76';c.fillRect(85,27,68,7);
      owl(c,-115+p*224,-20+Math.sin(t*2)*5,t,1.2);
    } else if(m.kind==='garden'){
      c.fillStyle='#294f58';c.beginPath();c.ellipse(0,57,138,15,0,0,Math.PI*2);c.fill();
      for(let i=0;i<8;i++){const x=-112+i*32,y=44+(i%2)*9;if(i<n)flower(c,x,y,t+i,['#ffb5de','#b3beff','#ffe0a1'][i%3]);else{line(c,x,y,x,y-10,'#457e73',2);dot(c,x,y-12,3,'#79bbaa');}}
    } else if(m.kind==='beacon'){
      c.fillStyle='#426279';c.fillRect(-28,-30,56,92);c.fillStyle='#d7c599';c.fillRect(-35,-36,70,8);c.fillRect(-36,58,72,8);
      for(let i=0;i<8;i++){c.fillStyle=i<n?gold:base;c.fillRect(-18,46-i*10,36,6);}
      dot(c,0,-54,14+p*5,p>0?gold:base);if(p>0){c.globalAlpha=p*.7;for(let i=0;i<6;i++){const a=-Math.PI+i*Math.PI/5;line(c,Math.cos(a)*29,-54+Math.sin(a)*29,Math.cos(a)*57,-54+Math.sin(a)*57,gold,2);}c.globalAlpha=1;}
    } else if(m.kind==='mend'){
      for(let i=0;i<8;i++){c.strokeStyle=i<n?lit:base;c.lineWidth=6;c.beginPath();c.arc(0,0,54,(i/8)*Math.PI*2+t*p*.25,(i/8)*Math.PI*2+.57+t*p*.25);c.stroke();}
      c.save();c.rotate(t*p*.45);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);line(c,0,0,0,-35,gold,5);dot(c,0,-36,7,lit);}c.restore();dot(c,0,0,12,gold);
    } else {
      const pts=[[-120,20],[-87,-30],[-50,8],[-16,-45],[24,-22],[56,22],[88,-14],[123,14]];
      for(let i=0;i<pts.length;i++){const[x,y]=pts[i];if(i)line(c,pts[i-1][0],pts[i-1][1],x,y,i<n?'#8edbd0':base,2);star(c,x,y,7,i<n?gold:base);}
    }
    c.restore();
  }
  function drawLair(c,count,t) {
    const has=id=>rewards(count).some(r=>r.id===id),W=App.W;
    c.save();
    if(has('stars')){for(let i=0;i<7;i++){const x=W*.35+i*44,y=105+Math.sin(i*1.2)*22;star(c,x,y,4,'#ffe0a1');if(i)line(c,x-44,105+Math.sin((i-1)*1.2)*22,x,y,'rgba(183,220,246,.3)',1);}}
    if(has('lanterns')){for(let i=0;i<3;i++){const x=W*.35+i*W*.13,y=170+Math.sin(t+i)*8;line(c,x,y-18,x,y+25,'#8ea8a6',1);dot(c,x,y,11,'rgba(255,211,129,.22)');dot(c,x,y,5,'#ffe0a1');}}
    if(has('pennants')){line(c,W*.34,130,W*.66,130,'#78bcae',1);for(let i=0;i<5;i++){c.fillStyle=['#a8d8e7','#d6b4e8','#f8d793'][i%3];c.beginPath();c.moveTo(W*.35+i*W*.065,130);c.lineTo(W*.35+i*W*.065+17,130);c.lineTo(W*.35+i*W*.065+8,150);c.closePath();c.fill();}}
    if(has('flowers'))for(let i=0;i<8;i++)flower(c,W*.35+i*38,568+(i%2)*5,t+i);
    if(has('owl'))owl(c,W*.65,485+Math.sin(t*1.5)*6,t,1.5);
    if(has('sparks'))for(let i=0;i<14;i++)dot(c,W*.36+Math.sin(i*13+t*.3)*120+i*16,450+Math.cos(i*5+t*.5)*65,1.5,'#ffe0a1');
    c.restore();
  }
  return {get,rewards,rewardText,draw,drawLair};
})();
