/* Dragon Keys - story missions. Each mission is a scene across the sky that the dragon
   builds as she types: every finished word lights one more piece, and finishing the
   level plays a short ending. */
'use strict';

const Missions = (() => {
  const objectives = [
    { kind: 'bridge', pieces: 20, title: 'The starlight crossing', goal: 'A sky bridge has gone dark. Every word you finish lights another plank.', success: 'The bridge is open. Travellers can cross again.' },
    { kind: 'rescue', pieces: 16, title: 'A friend in the clouds', goal: 'A sky owl has lost its way. Light a trail of stars to lead it home.', success: 'The sky owl is home, and it knows who to thank.' },
    { kind: 'garden', pieces: 18, title: 'The sleeping garden', goal: 'The wind garden is asleep. Every word you finish wakes another flower.', success: 'The garden is awake and dancing in the breeze.' },
    { kind: 'beacon', pieces: 14, title: 'The missing lights', goal: 'The beacon has gone dark. Gather the lost lights and send them home.', success: 'The beacon shines. Every dragon can find the way.' },
    { kind: 'mend', pieces: 16, title: 'The cloud engine', goal: 'An island is drifting. Restart its cloud engine, one ring at a time.', success: 'The engine is turning and the island is back on course.' },
    { kind: 'chart', pieces: 14, title: 'A map of small wonders', goal: 'An explorer left a star map unfinished. Join the stars to reveal it.', success: 'A new constellation fills the map.' },
  ];
  const places = ['Meadow', 'Peaks', 'Cavern', 'Citadel', 'Summit'];
  const unlocks = [
    { at: 1, id: 'hello', name: 'A dragon greeting', text: 'Your dragon greets you by name at the lair.' },
    { at: 2, id: 'loop', name: 'Sky loop', text: 'Your dragon learned Sky Loop. Type "loop" in the lair.' },
    { at: 4, id: 'lanterns', name: 'Floating lanterns', text: 'Warm lanterns now float around your lair.' },
    { at: 6, id: 'owl', name: 'A visiting sky owl', text: 'A sky owl has made your lair its favourite stopping place.' },
    { at: 8, id: 'heart', name: 'Heart flight', text: 'Your dragon learned Heart Flight. Type "heart" in the lair.' },
    { at: 10, id: 'flowers', name: 'A wind garden', text: 'A wind garden blooms in your lair.' },
    { at: 14, id: 'eight', name: 'Ribbon flight', text: 'Your dragon learned Ribbon Flight. Type "ribbon" in the lair.' },
    { at: 18, id: 'pennants', name: 'Explorer pennants', text: 'Your lair now flies the colours of a seasoned explorer.' },
    { at: 22, id: 'sparks', name: 'Firefly friends', text: 'Fireflies have joined your dragon at home.' },
    { at: 28, id: 'stars', name: 'Your constellation', text: 'A dragon constellation glows above your lair.' },
  ];

  function get(id, route = 0) {
    const level = LEVELS.find(l => l.id === id) || LEVELS[0];
    route = route === 1 ? 1 : 0;
    const local = LEVELS.filter(l => l.world === level.world).indexOf(level);
    const objective = objectives[(local + (level.world - 1) * 2 + route * 3) % objectives.length];
    return { ...objective, id: level.id, route, world: level.world, title: `${places[level.world - 1]} · ${objective.title}` };
  }
  /* the last level of a world is its finale: a boss, not a building job */
  function boss(id) {
    const level = LEVELS.find(l => l.id === id) || LEVELS[0], w = WORLDS[level.world - 1], foe = FOE_INFO[w.theme];
    return { kind: 'boss', pieces: 0, id: level.id, route: 0, world: level.world, title: `${places[level.world - 1]} finale · ${foe.boss}`,
      goal: `The ${foe.boss} blocks the way out of ${w.name}. Every word you finish weakens it.`,
      success: `The ${foe.boss} is beaten. ${w.name} is safe.`, lost: `The ${foe.boss} got away this time. Your stars still count.` };
  }
  /* which of the two stories to tell: they alternate each time a level is played */
  function autoRoute(id) { const r = Store.get().levels[id]; return r && r.plays % 2 ? 1 : 0; }

  const rewards = count => unlocks.filter(r => r.at <= count);
  function rewardText(count) {
    const earned = rewards(count), latest = earned.at(-1), next = unlocks.find(r => r.at > count);
    if (!latest) return 'Finish your first mission to earn a greeting from your dragon.';
    return latest.text + (next ? ` Next discovery in ${next.at - count} mission${next.at - count === 1 ? '' : 's'}.` : ' Your lair is full of the discoveries you made together.');
  }

  /* ---------- drawing ---------- */
  const LIT = '#9dffe0', GOLD = '#ffd98a', DIM = 'rgba(130,160,225,.3)';
  let ep = 0, lastT = 0, lastId = '';
  const dot = (c, x, y, r, color) => { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const seg = (c, x, y, x2, y2, color, width = 3) => { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke(); };
  function halo(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
  }
  function star(c, x, y, size, color) {
    c.fillStyle = color; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = size * (i % 2 ? 0.43 : 1); if (i) c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  function owl(c, x, y, t, size = 1) {
    c.save(); c.translate(x, y); c.scale(size, size);
    c.fillStyle = '#b5e5f1'; c.beginPath(); c.ellipse(-13, -2, 17, 7, -0.4 - Math.sin(t * 6) * 0.3, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(13, -2, 17, 7, 0.4 + Math.sin(t * 6) * 0.3, 0, TAU); c.fill();
    dot(c, 0, 0, 16, '#def9f8'); dot(c, -6, -2, 6, '#2d5c72'); dot(c, 6, -2, 6, '#2d5c72'); dot(c, -5, -3, 2, '#fff'); dot(c, 5, -3, 2, '#fff');
    c.fillStyle = '#f4c878'; c.beginPath(); c.moveTo(-3, 5); c.lineTo(3, 5); c.lineTo(0, 10); c.closePath(); c.fill(); c.restore();
  }
  function flower(c, x, y, t, color, grow = 1) {
    const h = 34 * grow, sway = Math.sin(t) * 4 * grow;
    seg(c, x, y, x + sway, y - h, '#67d6b4', 3);
    if (grow < 0.3) { dot(c, x + sway, y - h, 3, '#8fe3c6'); return; }
    const r = 7 * Math.min(1, (grow - 0.3) / 0.7);
    for (let j = 0; j < 5; j++) { const a = j * TAU / 5 + t * 0.3; dot(c, x + sway + Math.cos(a) * r * 1.2, y - h + Math.sin(a) * r * 1.2, r, color); }
    dot(c, x + sway, y - h, r * 0.8, '#fff2c0');
  }

  /* where each piece of a scene sits. X0..X1 is the stretch of sky the scene uses. */
  function layout(m, n, W) {
    const X0 = W * 0.41, X1 = W - 56, span = X1 - X0, P = [];
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) : 0.5;
      if (m.kind === 'bridge') P.push([X0 + 46 + u * (span - 92), 238 - Math.sin(u * Math.PI) * 26]);
      else if (m.kind === 'rescue') P.push([X0 + 20 + u * (span - 150), 176 + Math.sin(u * 7.5) * 46 - u * 20]);
      else if (m.kind === 'garden') P.push([X0 + 30 + u * (span - 60), 250 - Math.sin(u * Math.PI) * 10 + (i % 2) * 5]);
      else if (m.kind === 'beacon') P.push([X0 + 10 + hash(i, 31) * (span - 190), 104 + hash(i, 37) * 130]);
      else if (m.kind === 'mend') { const a = -Math.PI / 2 + i * TAU / n; P.push([X0 + span * 0.6 + Math.cos(a) * 84, 168 + Math.sin(a) * 84]); }
      else { const pts = [[0, .62], [.09, .3], [.18, .52], [.27, .2], [.37, .36], [.46, .62], [.55, .3], [.64, .5], [.73, .16], [.8, .42], [.87, .66], [.93, .34], [.97, .54], [1, .26]]; const q = pts[Math.round(u * (pts.length - 1))]; P.push([X0 + 20 + q[0] * (span - 40), 96 + q[1] * 150]); }
    }
    return { X0, X1, span, P };
  }
  const pieces = (m, total) => Math.max(1, Math.min(m.pieces || 1, total));
  /* the piece that the word just finished has lit, so the level can aim a beam of light at it */
  function spot(m, wordsDone, total) {
    if (!m || m.kind === 'boss') return null;
    const n = pieces(m, total), k = Math.floor(wordsDone / total * n + 1e-6), before = Math.floor((wordsDone - 1) / total * n + 1e-6);
    if (k === before || k < 1) return null;
    const L = layout(m, n, App.W), p = L.P[k - 1];
    return m.kind === 'beacon' ? { x: p[0], y: p[1] } : { x: p[0], y: p[1] - (m.kind === 'garden' ? 30 : 0) };
  }

  /* st: { done, total (words), t (seconds), finale (seconds since the last word, or -1) } */
  function draw(c, m, st) {
    if (!m || m.kind === 'boss') return;
    const W = App.W, n = pieces(m, st.total), p = st.total ? st.done / st.total : 0;
    if (m.id + m.route !== lastId || st.t < lastT) { lastId = m.id + m.route; ep = p; }
    const dt = Math.min(0.05, Math.max(0, st.t - lastT)); lastT = st.t;
    ep += (p - ep) * (1 - Math.exp(-7 * dt));
    const k = Math.floor(p * n + 1e-6), f = st.finale, t = st.t, L = layout(m, n, W), P = L.P, X0 = L.X0, X1 = L.X1;
    const fin = f >= 0 ? Math.min(1, f / 1.6) : 0;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';

    if (m.kind === 'bridge') {
      for (const [x, s] of [[X0 + 6, 1], [X1 - 6, -1]]) {   // an island at each end, with a lamp post
        c.fillStyle = '#16264f'; c.beginPath(); c.moveTo(x - 40, 244); c.lineTo(x + 40, 244); c.lineTo(x + s * 8, 300); c.closePath(); c.fill();
        seg(c, x, 244, x, 196, '#31508a', 4);
        const on = s === 1 ? k > 0 : k >= n;
        if (on) halo(c, x, 190, 46, '255,217,138', 0.5 + fin * 0.3);
        star(c, x, 190, 8, on ? GOLD : '#3a5a8f');
      }
      c.strokeStyle = 'rgba(130,160,225,.35)'; c.lineWidth = 1.5; c.beginPath();
      for (let i = 0; i < n; i++) c.lineTo(P[i][0], P[i][1] - 26); c.stroke();
      for (let i = 0; i < n; i++) {
        const [x, y] = P[i], lit = i < k, w = (L.span - 92) / n * 0.72;
        if (lit) halo(c, x, y, 26, '157,255,224', 0.3);
        c.fillStyle = lit ? LIT : DIM; c.fillRect(x - w / 2, y - 4, w, 8);
        seg(c, x, y - 4, x, y - 26, lit ? 'rgba(157,255,224,.7)' : 'rgba(130,160,225,.25)', 1.5);
      }
      if (f >= 0) for (let j = 0; j < 4; j++) {   // travellers with lanterns cross
        const u = clamp(fin * 1.25 - j * 0.12, 0, 1), i = Math.min(n - 1, Math.floor(u * (n - 1))), q = P[i];
        if (u <= 0) continue;
        halo(c, q[0], q[1] - 16, 22, '255,217,138', 0.6); dot(c, q[0], q[1] - 12, 5, '#fff2c0'); dot(c, q[0], q[1] - 22, 3.5, GOLD);
      }
    } else if (m.kind === 'rescue') {
      const hx = X1 - 70, hy = 150;   // the owl's home: a ring with a perch
      c.strokeStyle = k >= n ? GOLD : '#3a5a8f'; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 40, Math.PI * 0.85, Math.PI * 2.15); c.stroke();
      seg(c, hx - 30, hy + 30, hx + 30, hy + 30, k >= n ? GOLD : '#3a5a8f', 5);
      if (k >= n) halo(c, hx, hy, 80, '255,217,138', 0.25 + fin * 0.35);
      for (let i = 0; i < n; i++) {
        const [x, y] = P[i], lit = i < k;
        if (i) seg(c, P[i - 1][0], P[i - 1][1], x, y, lit ? 'rgba(157,255,224,.55)' : 'rgba(130,160,225,.14)', 1.5);
        if (lit) halo(c, x, y, 20, '255,217,138', 0.45);
        star(c, x, y, lit ? 7 : 4.5, lit ? GOLD : '#3a5a8f');
      }
      const at = clamp(ep * n - 0.5, 0, n - 1), i0 = Math.floor(at), i1 = Math.min(n - 1, i0 + 1), u = at - i0;
      let ox = lerp(P[i0][0], P[i1][0], u), oy = lerp(P[i0][1], P[i1][1], u) - 24;
      if (f >= 0) { ox = lerp(ox, hx, fin); oy = lerp(oy, hy + 12, fin) - Math.sin(fin * Math.PI) * 40; }
      owl(c, ox, oy + Math.sin(t * 2.4) * 4, t, 1.25);
      if (fin >= 1) for (let j = 0; j < 5; j++) star(c, hx + Math.cos(t * 2 + j * 1.26) * 62, hy + Math.sin(t * 2 + j * 1.26) * 62, 4, GOLD);
    } else if (m.kind === 'garden') {
      c.fillStyle = '#12304a'; c.beginPath(); c.ellipse((X0 + X1) / 2, 262, L.span / 2 + 6, 16, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(103,214,180,.5)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse((X0 + X1) / 2, 262, L.span / 2 + 6, 16, 0, Math.PI, TAU); c.stroke();
      const cols = ['#ff9fd6', '#b3beff', '#ffd98a', '#9dffe0'];
      for (let i = 0; i < n; i++) {
        const [x, y] = P[i], grow = clamp(ep * n - i, 0, 1);
        if (grow > 0.3) halo(c, x, y - 32, 22, '255,159,214', 0.22 * grow);
        flower(c, x, y, t * (1.2 + fin * 2) + i, cols[i % 4], 0.22 + grow * (0.78 + fin * 0.25));
      }
      if (f >= 0) for (let j = 0; j < 22; j++) {   // petals lift off on the breeze
        const u = (fin * 1.3 + hash(j, 3)) % 1, x = X0 + hash(j, 5) * L.span + Math.sin(t * 2 + j) * 14;
        c.globalAlpha = (1 - u) * fin; dot(c, x, 230 - u * 150, 3, cols[j % 4]); c.globalAlpha = 1;
      }
    } else if (m.kind === 'beacon') {
      const bx = X1 - 60, top = 112;
      c.fillStyle = '#1a2c58'; c.beginPath(); c.moveTo(bx - 26, 262); c.lineTo(bx - 15, top + 22); c.lineTo(bx + 15, top + 22); c.lineTo(bx + 26, 262); c.closePath(); c.fill();
      c.fillStyle = '#31508a'; c.fillRect(bx - 22, top + 14, 44, 8);
      for (let i = 0; i < n; i++) {
        const u = clamp(ep * n - i, 0, 1), [x, y] = P[i];
        if (u >= 1) continue;
        const px = lerp(x, bx, u * u), py = lerp(y, top, u * u) - Math.sin(u * Math.PI) * 30 + Math.sin(t * 2 + i) * 5 * (1 - u);
        halo(c, px, py, 18, u > 0 ? '255,217,138' : '130,160,225', u > 0 ? 0.6 : 0.3);
        dot(c, px, py, 4.5, u > 0 ? GOLD : '#7f97cf');
      }
      const b = k / n;
      if (b > 0) halo(c, bx, top, 30 + b * 60, '255,217,138', 0.25 + b * 0.5);
      dot(c, bx, top, 11 + b * 5, b > 0 ? GOLD : '#3a5a8f');
      if (b > 0) for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * 0.4; seg(c, bx + Math.cos(a) * 24, top + Math.sin(a) * 24, bx + Math.cos(a) * (30 + b * 22), top + Math.sin(a) * (30 + b * 22), `rgba(255,217,138,${0.3 + b * 0.5})`, 2); }
      if (f >= 0) {   // the beam sweeps the sky
        const a = Math.PI + 0.25 + Math.sin(f * 2.2) * 0.55, g = c.createLinearGradient(bx, top, bx + Math.cos(a) * 900, top + Math.sin(a) * 900);
        g.addColorStop(0, `rgba(255,230,160,${0.55 * fin})`); g.addColorStop(1, 'rgba(255,230,160,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(bx, top);
        c.lineTo(bx + Math.cos(a - 0.09) * 950, top + Math.sin(a - 0.09) * 950); c.lineTo(bx + Math.cos(a + 0.09) * 950, top + Math.sin(a + 0.09) * 950); c.closePath(); c.fill(); c.restore();
      }
    } else if (m.kind === 'mend') {
      const cx = X0 + L.span * 0.6, cy = 168 - fin * 14, spin = t * (0.15 + ep * 1.1 + fin * 2.5);
      c.fillStyle = '#16264f'; c.beginPath(); c.moveTo(cx - 150, cy + 96); c.lineTo(cx + 150, cy + 96); c.lineTo(cx + 40, cy + 150); c.lineTo(cx - 60, cy + 140); c.closePath(); c.fill();
      if (k > 0) halo(c, cx, cy, 130, '157,255,224', 0.1 + ep * 0.2 + fin * 0.2);
      for (let i = 0; i < n; i++) {
        const a0 = -Math.PI / 2 + i * TAU / n + 0.05, a1 = a0 + TAU / n - 0.1, lit = i < k;
        c.strokeStyle = lit ? LIT : DIM; c.lineWidth = lit ? 9 : 6; c.beginPath(); c.arc(cx, cy, 84, a0, a1); c.stroke();
      }
      c.save(); c.translate(cx, cy); c.rotate(spin);
      for (let i = 0; i < 3; i++) { c.rotate(TAU / 3); seg(c, 0, 0, 0, -56, k > 0 ? GOLD : '#3a5a8f', 6); dot(c, 0, -58, 9, k > 0 ? LIT : '#3a5a8f'); }
      c.restore(); dot(c, cx, cy, 14, k > 0 ? GOLD : '#3a5a8f');
      if (f >= 0) for (let j = 0; j < 9; j++) { const u = (fin + j / 9) % 1; c.globalAlpha = (1 - u) * 0.5 * fin; dot(c, cx - 40 + j * 10 + Math.sin(t + j) * 8, cy + 130 + u * 70, 12 + u * 14, '#cfe6ff'); c.globalAlpha = 1; }
    } else {
      for (let i = 0; i < n; i++) {
        const [x, y] = P[i], lit = i < k;
        if (i) seg(c, P[i - 1][0], P[i - 1][1], x, y, lit ? `rgba(157,255,224,${0.6 + fin * 0.4})` : 'rgba(130,160,225,.12)', lit ? 2 + fin * 1.5 : 1);
        if (lit) halo(c, x, y, 22 + fin * 14, '255,217,138', 0.45);
        star(c, x, y, lit ? 8 + fin * 3 * (0.5 + 0.5 * Math.sin(t * 6 + i)) : 4.5, lit ? GOLD : '#3a5a8f');
      }
      if (f >= 0) {   // a shooting star crosses the finished map
        const u = clamp(f / 1.2, 0, 1), sx = lerp(X0, X1, u), sy = 96 + u * 40;
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(sx - 160, sy - 24, sx, sy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(255,255,255,${1 - u})`);
        c.strokeStyle = g; c.lineWidth = 3; c.beginPath(); c.moveTo(sx - 160, sy - 24); c.lineTo(sx, sy); c.stroke(); c.restore();
      }
    }
    c.restore();
  }

  function drawLair(c, count, t) {
    const has = id => rewards(count).some(r => r.id === id), W = App.W;
    c.save();
    if (has('stars')) { for (let i = 0; i < 7; i++) { const x = W * .35 + i * 44, y = 105 + Math.sin(i * 1.2) * 22; star(c, x, y, 4, '#ffe0a1'); if (i) seg(c, x - 44, 105 + Math.sin((i - 1) * 1.2) * 22, x, y, 'rgba(183,220,246,.3)', 1); } }
    if (has('lanterns')) { for (let i = 0; i < 3; i++) { const x = W * .35 + i * W * .13, y = 170 + Math.sin(t + i) * 8; seg(c, x, y - 18, x, y + 25, '#8ea8a6', 1); dot(c, x, y, 11, 'rgba(255,211,129,.22)'); dot(c, x, y, 5, '#ffe0a1'); } }
    if (has('pennants')) { seg(c, W * .34, 130, W * .66, 130, '#78bcae', 1); for (let i = 0; i < 5; i++) { c.fillStyle = ['#a8d8e7', '#d6b4e8', '#f8d793'][i % 3]; c.beginPath(); c.moveTo(W * .35 + i * W * .065, 130); c.lineTo(W * .35 + i * W * .065 + 17, 130); c.lineTo(W * .35 + i * W * .065 + 8, 150); c.closePath(); c.fill(); } }
    if (has('flowers')) for (let i = 0; i < 8; i++) flower(c, W * .35 + i * 38, 568 + (i % 2) * 5, t + i, ['#ff9fd6', '#b3beff', '#ffd98a'][i % 3]);
    if (has('owl')) owl(c, W * .27, 452 + Math.sin(t * 1.5) * 6, t, 1.5);
    if (has('sparks')) for (let i = 0; i < 14; i++) dot(c, W * .36 + Math.sin(i * 13 + t * .3) * 120 + i * 16, 450 + Math.cos(i * 5 + t * .5) * 65, 1.5, '#ffe0a1');
    c.restore();
  }

  return { get, boss, autoRoute, rewards, rewardText, draw, drawLair, spot };
})();
