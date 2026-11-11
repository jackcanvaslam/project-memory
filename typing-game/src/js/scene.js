/* Dragon Keys - moving backgrounds (drawn on a canvas) and particle effects */
'use strict';

const TAU = Math.PI * 2;
const hash = (i, seed) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
const tri = x => { const f = x - Math.floor(x); return 1 - 2 * Math.abs(f - 0.5); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Scene = (() => {
  let canvas, ctx, W = 1280, H = 720, k = 1;
  let theme = 'meadow', scroll = 0, t = 0;
  let hz = 0, hzTarget = 0;
  let speed = 24, speedTarget = 24;
  const gems = [];       // {x, y, hue, s, a}
  const streaks = [];

  function init(c) { canvas = c; ctx = c.getContext('2d'); }
  function resize(w, h, scale) {
    W = w; H = h;
    k = clamp(scale * (window.devicePixelRatio || 1), 0.75, 1.5);
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  function setTheme(name) { theme = name; }
  function setHorizon(v, instant) { hzTarget = v; if (instant) hz = v; }
  function setSpeed(v) { speedTarget = v; }

  function update(dt) {
    t += dt;
    speed = lerp(speed, speedTarget, 1 - Math.pow(0.03, dt));
    hz = lerp(hz, hzTarget, 1 - Math.pow(0.002, dt));
    scroll += speed * dt;
    if (speed > 150 && Math.random() < dt * speed / 40) {
      streaks.push({ x: W + 40, y: 70 + Math.random() * 230, len: 40 + Math.random() * 90, v: speed * 3 + 300, a: 0.38 });
    }
    for (let i = streaks.length - 1; i >= 0; i--) { const s = streaks[i]; s.x -= s.v * dt; if (s.x + s.len < 0) streaks.splice(i, 1); }
  }

  /* ---------- drawing helpers ---------- */
  function ridge(fn, p, fill, step = 14) {
    const off = scroll * p;
    ctx.beginPath(); ctx.moveTo(0, H + 2);
    for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, fn(x + off) + hz);
    ctx.lineTo(W + step, H + 2); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function ceiling(fn, p, fill, step = 12) {
    const off = scroll * p;
    ctx.beginPath(); ctx.moveTo(0, -2);
    for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, fn(x + off));
    ctx.lineTo(W + step, -2); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function slots(p, spacing, seed, cb) {
    const off = scroll * p;
    const first = Math.floor(off / spacing) - 1, last = Math.floor((off + W) / spacing) + 1;
    for (let i = first; i <= last; i++) {
      const wx = i * spacing + hash(i, seed + 1) * spacing * 0.6;
      cb(wx - off, hash(i, seed), i, wx);
    }
  }
  function vgrad(y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  function glow(x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  function cloud(x, y, s, color, alpha = 1) {
    ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath();
    const e = (cx, cy, rx, ry) => { ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); };
    e(x, y, 60 * s, 22 * s); e(x - 30 * s, y - 14 * s, 30 * s, 22 * s); e(x + 10 * s, y - 24 * s, 36 * s, 28 * s); e(x + 42 * s, y - 8 * s, 26 * s, 18 * s);
    ctx.fill(); ctx.globalAlpha = 1;
  }
  function roundTree(x, y, s, c1, c2, trunk) {
    ctx.fillStyle = trunk; ctx.fillRect(x - 5 * s, y - 34 * s, 10 * s, 38 * s);
    ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x, y - 58 * s, 32 * s, 0, TAU); ctx.moveTo(x, y - 40 * s); ctx.arc(x - 22 * s, y - 40 * s, 22 * s, 0, TAU); ctx.moveTo(x + 44 * s, y - 40 * s); ctx.arc(x + 22 * s, y - 40 * s, 22 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x - 8 * s, y - 66 * s, 16 * s, 0, TAU); ctx.fill();
  }
  function pine(x, y, s, c1, c2) {
    ctx.fillStyle = c1;
    for (let i = 0; i < 3; i++) {
      const w = (30 - i * 7) * s, top = y - (40 + i * 24) * s, bot = y - (6 + i * 22) * s;
      ctx.beginPath(); ctx.moveTo(x - w, bot); ctx.lineTo(x, top); ctx.lineTo(x + w, bot); ctx.closePath(); ctx.fill();
    }
    if (c2) { ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 70 * s); ctx.lineTo(x, y - 88 * s); ctx.lineTo(x + 9 * s, y - 70 * s); ctx.closePath(); ctx.fill(); }
  }
  function stars(count, seed, maxY, alpha = 1) {
    for (let i = 0; i < count; i++) {
      const x = hash(i, seed) * W, y = hash(i, seed + 3) * maxY;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + hash(i, seed + 5) * 2.5) + i);
      const r = 0.7 + hash(i, seed + 7) * 1.6;
      ctx.globalAlpha = alpha * tw; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function crystal(x, y, s, hue, lean) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
    glow(0, -30 * s, 70 * s, `hsla(${hue},100%,70%,.5)`, 0.5 + 0.2 * Math.sin(t * 2 + x * 0.01));
    const shard = (dx, h, w, l) => {
      ctx.fillStyle = `hsl(${hue},85%,${l}%)`;
      ctx.beginPath(); ctx.moveTo(dx - w, 0); ctx.lineTo(dx - w * 0.7, -h * 0.8); ctx.lineTo(dx, -h); ctx.lineTo(dx + w * 0.7, -h * 0.8); ctx.lineTo(dx + w, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `hsl(${hue},95%,${l + 18}%)`;
      ctx.beginPath(); ctx.moveTo(dx - w, 0); ctx.lineTo(dx - w * 0.7, -h * 0.8); ctx.lineTo(dx, -h); ctx.lineTo(dx - w * 0.15, 0); ctx.closePath(); ctx.fill();
    };
    shard(-16 * s, 40 * s, 9 * s, 52); shard(15 * s, 50 * s, 10 * s, 48); shard(0, 76 * s, 13 * s, 58);
    ctx.restore();
  }
  function castle(x, y, s, body, roof, win) {
    const tower = (tx, w, h, cone) => {
      ctx.fillStyle = body; ctx.fillRect(x + tx * s, y - h * s, w * s, h * s + 60);
      for (let i = 0; i < 3; i++) ctx.fillRect(x + (tx - 3 + i * (w + 6) / 3 + 0.5) * s, y - (h + 9) * s, (w / 3 - 2) * s, 10 * s);
      if (cone) {
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x + (tx - 5) * s, y - (h + 6) * s); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 6 + cone) * s); ctx.lineTo(x + (tx + w + 5) * s, y - (h + 6) * s); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = roof; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + (tx + w / 2) * s, y - (h + 6 + cone) * s); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 22 + cone) * s); ctx.stroke();
        const wave = Math.sin(t * 4 + x * 0.02 + tx) * 3 * s;
        ctx.fillStyle = '#ff6b8b'; ctx.beginPath(); ctx.moveTo(x + (tx + w / 2) * s, y - (h + 22 + cone) * s); ctx.lineTo(x + (tx + w / 2 + 16) * s, y - (h + 17 + cone) * s + wave); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 11 + cone) * s); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = win; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 1.5 + tx);
      ctx.beginPath(); ctx.roundRect(x + (tx + w / 2 - 4) * s, y - (h - 14) * s, 8 * s, 13 * s, [4 * s, 4 * s, 0, 0]); ctx.fill();
      ctx.globalAlpha = 1;
    };
    tower(-70, 26, 70, 30); tower(44, 26, 84, 34); tower(-34, 68, 46, 0); tower(-12, 24, 112, 40);
    ctx.fillStyle = win; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.roundRect(x - 9 * s, y - 20 * s, 18 * s, 26 * s, [9 * s, 9 * s, 0, 0]); ctx.fill(); ctx.globalAlpha = 1;
  }

  /* ---------- the five worlds ---------- */
  const THEMES = {
    meadow() {
      ctx.fillStyle = vgrad(0, H, [[0, '#3fa9f5'], [0.45, '#9adcff'], [0.75, '#e6f9ff']]); ctx.fillRect(0, 0, W, H);
      const sx = W - 230, sy = 120 + hz * 0.15;
      glow(sx, sy, 190, 'rgba(255,246,190,.9)', 0.75);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.08); ctx.fillStyle = 'rgba(255,244,170,.35)';
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.beginPath(); ctx.moveTo(60, -7); ctx.lineTo(118, 0); ctx.lineTo(60, 7); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#fff3a0'; ctx.beginPath(); ctx.arc(sx, sy, 48, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe566'; ctx.beginPath(); ctx.arc(sx, sy, 40, 0, TAU); ctx.fill();
      slots(0.04, 460, 11, (x, r) => cloud(x, 90 + r * 120 + hz * 0.2, 0.7 + r * 0.5, '#ffffff', 0.75));
      ridge(x => 420 - 80 * (0.6 * tri(x * 0.0011 + 0.3) + 0.4 * tri(x * 0.0027 + 1.7)), 0.08, vgrad(300 + hz, 470 + hz, [[0, '#b9d6ff'], [1, '#d6ecff']]));
      slots(0.1, 380, 23, (x, r) => cloud(x, 170 + r * 150 + hz * 0.35, 0.9 + r * 0.7, '#ffffff', 0.95));
      const h1 = x => 500 - 38 * (Math.sin(x * 0.0031) * 0.6 + Math.sin(x * 0.0073 + 1) * 0.4);
      ridge(h1, 0.2, '#a5e9a8');
      const h2 = x => 560 - 34 * (Math.sin(x * 0.0026 + 2) * 0.6 + Math.sin(x * 0.0061) * 0.4);
      slots(0.38, 210, 31, (x, r, i, wx) => { const y = h2(wx) + hz + 8; r < 0.55 ? roundTree(x, y, 0.75 + r * 0.5, '#4fc46f', '#74dd8c', '#9a6b3f') : pine(x, y, 0.9 + r * 0.4, '#3fae6a', '#6bd08a'); });
      ridge(h2, 0.38, '#74d886');
      const h3 = x => 640 - 26 * (Math.sin(x * 0.0041 + 4) * 0.6 + Math.sin(x * 0.0093 + 2) * 0.4);
      slots(0.7, 320, 47, (x, r, i, wx) => { if (r < 0.7) roundTree(x, h3(wx) + hz + 10, 1.1 + r * 0.5, '#2fa85a', '#52c878', '#7d5530'); });
      ridge(h3, 0.7, '#48c26c');
      slots(0.7, 90, 53, (x, r, i, wx) => {
        const y = h3(wx) + hz + 14 + r * 30, col = ['#ff6b8b', '#ffd23f', '#ffffff', '#c08bff'][i & 3];
        ctx.strokeStyle = '#2f9a55'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = col; for (let p = 0; p < 5; p++) { ctx.beginPath(); ctx.arc(x + Math.cos(p * TAU / 5) * 5, y + Math.sin(p * TAU / 5) * 5, 4, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
      });
      ridge(x => 706 - 14 * Math.sin(x * 0.006 + 1), 1.15, '#2fa85a');
    },

    peaks() {
      ctx.fillStyle = vgrad(0, H, [[0, '#4a3fb0'], [0.3, '#b05fc9'], [0.55, '#ff8fa3'], [0.8, '#ffd08a']]); ctx.fillRect(0, 0, W, H);
      stars(40, 5, 220, 0.6);
      const sx = W * 0.68, sy = 400 + hz * 0.5;
      glow(sx, sy, 330, 'rgba(255,225,150,.9)', 0.8);
      ctx.fillStyle = '#fff1b8'; ctx.beginPath(); ctx.arc(sx, sy, 92, 0, TAU); ctx.fill();
      slots(0.04, 520, 13, (x, r) => cloud(x, 120 + r * 150 + hz * 0.2, 1 + r * 0.6, '#ffc2d8', 0.55));
      ridge(x => 470 - 240 * Math.pow(0.55 * tri(x * 0.0012 + 0.2) + 0.45 * tri(x * 0.0031 + 0.9), 1.25), 0.07, vgrad(230 + hz, 520 + hz, [[0, '#fff0f6'], [0.25, '#c9a0ea'], [1, '#a57fdc']]), 8);
      ridge(x => 540 - 220 * Math.pow(0.6 * tri(x * 0.0016 + 0.6) + 0.4 * tri(x * 0.0043 + 0.1), 1.3), 0.16, vgrad(320 + hz, 600 + hz, [[0, '#f4dcff'], [0.22, '#9a6fd6'], [1, '#7c52c2']]), 8);
      slots(0.24, 560, 71, (x, r, i) => {
        const y = 250 + r * 150 + hz * 0.7 + Math.sin(t * 0.8 + i) * 6, s = 0.7 + hash(i, 4) * 0.6;
        ctx.fillStyle = '#6a4a3a'; ctx.beginPath(); ctx.moveTo(x - 62 * s, y); ctx.quadraticCurveTo(x - 20 * s, y + 70 * s, x + 4 * s, y + 84 * s); ctx.quadraticCurveTo(x + 30 * s, y + 50 * s, x + 62 * s, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6fd98a'; ctx.beginPath(); ctx.ellipse(x, y, 66 * s, 15 * s, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8eeaa2'; ctx.beginPath(); ctx.ellipse(x - 8 * s, y - 4 * s, 44 * s, 8 * s, 0, 0, TAU); ctx.fill();
        pine(x - 18 * s, y - 2 * s, 0.6 * s, '#2f9a62', '#57c486'); roundTree(x + 24 * s, y - 2 * s, 0.45 * s, '#43b877', '#74dd9c', '#8a5a34');
      });
      slots(0.12, 400, 23, (x, r) => cloud(x, 300 + r * 130 + hz * 0.6, 1.1 + r * 0.8, '#ffe3ec', 0.8));
      const m3 = x => 630 - 150 * Math.pow(0.6 * tri(x * 0.0021 + 0.3) + 0.4 * tri(x * 0.0057 + 0.5), 1.2);
      ridge(m3, 0.36, vgrad(470 + hz, 700 + hz, [[0, '#8a5fd0'], [1, '#5e3fa8']]), 8);
      slots(0.6, 130, 37, (x, r, i, wx) => pine(x, 650 - 22 * Math.sin(wx * 0.004) + hz + 12, 0.9 + r * 0.8, '#432a86', null));
      ridge(x => 650 - 22 * Math.sin(x * 0.004), 0.6, '#4a2f92');
      ridge(x => 706 - 16 * Math.sin(x * 0.005 + 2), 1.1, '#33206e');
      for (let i = 0; i < 5; i++) {
        const bx = ((hash(i, 81) * 2000 + t * (26 + i * 5)) % (W + 200)) - 100, by = 120 + hash(i, 83) * 160 + Math.sin(t * 2 + i) * 8 + hz * 0.2, f = Math.sin(t * 9 + i * 2) * 5;
        ctx.strokeStyle = 'rgba(60,30,110,.7)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 10, by + f); ctx.quadraticCurveTo(bx - 4, by - 5, bx, by); ctx.quadraticCurveTo(bx + 4, by - 5, bx + 10, by + f); ctx.stroke();
      }
    },

    cave() {
      ctx.fillStyle = vgrad(0, H, [[0, '#150c3a'], [0.5, '#2b1b66'], [1, '#0f2f55']]); ctx.fillRect(0, 0, W, H);
      slots(0.05, 420, 9, (x, r) => { ctx.fillStyle = 'rgba(70,50,150,.16)'; ctx.beginPath(); ctx.ellipse(x, 260 + r * 200, 300, 170 + r * 80, 0, 0, TAU); ctx.fill(); });
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      slots(0.1, 700, 15, (x, r) => {
        const g = ctx.createLinearGradient(x, 0, x - 180, 620); g.addColorStop(0, 'rgba(140,220,255,.16)'); g.addColorStop(1, 'rgba(140,220,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 60 + r * 60, 0); ctx.lineTo(x - 80, 640); ctx.lineTo(x - 320, 640); ctx.closePath(); ctx.fill();
      });
      ctx.restore();
      const f1 = x => 520 - 150 * Math.pow(tri(x * 0.0036 + 0.2) * 0.6 + tri(x * 0.0091) * 0.4, 2.2);
      slots(0.22, 330, 61, (x, r, i, wx) => crystal(x, f1(wx) + hz * 0.7 + 30, 1.1 + r * 0.7, [185, 300, 95, 265][i & 3], (r - 0.5) * 0.5));
      ridge(x => f1(x) - hz * 0.3, 0.22, '#231659', 8);
      ceiling(x => 30 + 170 * Math.pow(tri(x * 0.0041 + 0.6) * 0.55 + tri(x * 0.0113 + 0.3) * 0.45, 2.4), 0.3, '#1b1049', 8);
      const f2 = x => 610 - 130 * Math.pow(tri(x * 0.0047 + 0.7) * 0.6 + tri(x * 0.0129 + 0.4) * 0.4, 2);
      slots(0.5, 260, 67, (x, r, i, wx) => crystal(x, f2(wx) + hz + 28, 1.4 + r * 0.9, [300, 185, 265, 95, 45][((i % 5) + 5) % 5], (r - 0.5) * 0.6));
      ridge(f2, 0.5, '#170e40', 8);
      ceiling(x => 10 + 120 * Math.pow(tri(x * 0.0063 + 0.1) * 0.6 + tri(x * 0.0171) * 0.4, 2.6), 0.6, '#0f0930', 8);
      ridge(x => 700 - 60 * Math.pow(tri(x * 0.0058 + 0.3), 2), 1.1, '#0a0624', 8);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const x = ((hash(i, 91) * 3000 - scroll * (0.3 + hash(i, 93) * 0.5) + Math.sin(t * 0.7 + i) * 40) % (W + 80) + W + 80) % (W + 80) - 40;
        const y = 80 + hash(i, 95) * 420 + Math.sin(t * 1.1 + i * 1.7) * 24;
        glow(x, y, 9 + hash(i, 97) * 8, ['rgba(160,255,220,.9)', 'rgba(255,180,255,.9)', 'rgba(255,240,160,.9)'][i % 3], 0.5 + 0.5 * Math.sin(t * 2.2 + i));
      }
      ctx.restore();
    },

    castle() {
      ctx.fillStyle = vgrad(0, H, [[0, '#1c1d5c'], [0.38, '#5a3f9f'], [0.62, '#e8848a'], [0.82, '#ffd2a0']]); ctx.fillRect(0, 0, W, H);
      stars(70, 7, 300, 0.85);
      const mx = W * 0.2, my = 130 + hz * 0.1;
      glow(mx, my, 150, 'rgba(255,250,220,.7)', 0.6);
      ctx.fillStyle = '#fff9dc'; ctx.beginPath(); ctx.arc(mx, my, 50, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(220,210,170,.5)'; ctx.beginPath(); ctx.arc(mx - 16, my - 10, 9, 0, TAU); ctx.moveTo(mx + 26, my + 12); ctx.arc(mx + 14, my + 12, 12, 0, TAU); ctx.moveTo(mx + 16, my - 22); ctx.arc(mx + 10, my - 22, 6, 0, TAU); ctx.fill();
      slots(0.04, 520, 17, (x, r) => cloud(x, 190 + r * 160 + hz * 0.3, 1 + r * 0.7, '#f7a8c0', 0.4));
      const c1 = x => 500 - 50 * (Math.sin(x * 0.002) * 0.6 + Math.sin(x * 0.0051 + 1) * 0.4);
      slots(0.14, 640, 73, (x, r, i, wx) => castle(x, c1(wx) + hz + 10, 1.1 + r * 0.5, '#5a4aa8', '#7a5fd0', '#ffe08a'));
      ridge(c1, 0.14, '#5a4aa8');
      const c2 = x => 560 - 36 * (Math.sin(x * 0.0029 + 2) * 0.6 + Math.sin(x * 0.0067) * 0.4);
      slots(0.3, 560, 79, (x, r, i, wx) => { if (r > 0.4) castle(x + 200, c2(wx + 200) + hz + 8, 1.5 + r * 0.5, '#3f3586', '#5b48b8', '#ffd76a'); });
      slots(0.3, 150, 41, (x, r, i, wx) => roundTree(x, c2(wx) + hz + 8, 0.7 + r * 0.5, '#372f7c', '#463c94', '#2a2360'));
      ridge(c2, 0.3, '#3f3586');
      const c3 = x => 640 - 26 * (Math.sin(x * 0.0037 + 4) * 0.6 + Math.sin(x * 0.0089 + 2) * 0.4);
      slots(0.6, 240, 43, (x, r, i, wx) => {
        const y = c3(wx) + hz + 6;
        r < 0.5 ? pine(x, y, 1.2 + r, '#241f5c', null) : roundTree(x, y, 1 + r * 0.5, '#241f5c', '#2f2972', '#1a1646');
        ctx.strokeStyle = '#1a1646'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 70, y + 6); ctx.lineTo(x + 70, y - 46); ctx.stroke();
        glow(x + 70, y - 52, 40, 'rgba(255,214,120,.95)', 0.7 + 0.2 * Math.sin(t * 3 + i));
        ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(x + 70, y - 52, 7, 0, TAU); ctx.fill();
      });
      ridge(c3, 0.6, '#2a2468');
      ridge(x => 706 - 14 * Math.sin(x * 0.006 + 1), 1.1, '#17143f');
    },

    summit() {
      ctx.fillStyle = vgrad(0, H, [[0, '#040720'], [0.5, '#0f1a55'], [0.85, '#3a2470']]); ctx.fillRect(0, 0, W, H);
      stars(150, 3, 520, 1);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const bands = [[120, '80,255,190', 0.9], [200, '90,180,255', 1.3], [80, '200,120,255', 0.6]];
      bands.forEach(([by, rgb, sp], b) => {
        const g = ctx.createLinearGradient(0, 0, 0, 1);
        g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.25, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        for (let x = 0; x < W; x += 6) {
          const y = by + Math.sin(x * 0.005 + t * 0.35 * sp + b * 2) * 34 + Math.sin(x * 0.013 - t * 0.25 + b) * 16 + hz * 0.1;
          const hgt = 110 + Math.sin(x * 0.02 + t * sp + b) * 40;
          ctx.globalAlpha = 0.20 + 0.08 * Math.sin(x * 0.03 + t * 1.5);
          ctx.setTransform(k, 0, 0, k * hgt, x * k, y * k);
          ctx.fillRect(0, 0, 6, 1);
        }
      });
      ctx.restore(); ctx.setTransform(k, 0, 0, k, 0, 0);
      const mx = W * 0.8, my = 120 + hz * 0.1;
      glow(mx, my, 170, 'rgba(210,225,255,.7)', 0.6);
      ctx.fillStyle = '#f2f5ff'; ctx.beginPath(); ctx.arc(mx, my, 54, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(180,190,230,.55)'; ctx.beginPath(); ctx.arc(mx - 18, my - 8, 10, 0, TAU); ctx.moveTo(mx + 29, my + 16); ctx.arc(mx + 16, my + 16, 13, 0, TAU); ctx.moveTo(mx + 15, my - 24); ctx.arc(mx + 8, my - 24, 7, 0, TAU); ctx.fill();
      slots(0.05, 1500, 87, (x, r) => {
        const y = 520 + hz * 0.5, w = 300, h = 250;
        glow(x, y - h + 6, 130, 'rgba(255,120,60,.8)', 0.55 + 0.15 * Math.sin(t * 2));
        ctx.fillStyle = '#1b1650'; ctx.beginPath(); ctx.moveTo(x - w, y + 60); ctx.lineTo(x - 46, y - h); ctx.lineTo(x + 46, y - h); ctx.lineTo(x + w, y + 60); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff8a3c'; ctx.beginPath(); ctx.ellipse(x, y - h + 2, 44, 9, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#ff6a2a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 10, y - h + 6); ctx.quadraticCurveTo(x - 40, y - h + 90, x - 30, y - h + 170); ctx.moveTo(x + 20, y - h + 6); ctx.quadraticCurveTo(x + 50, y - h + 70, x + 80, y - h + 130); ctx.stroke();
      });
      ridge(x => 520 - 190 * Math.pow(0.6 * tri(x * 0.0017 + 0.4) + 0.4 * tri(x * 0.0049 + 0.8), 1.4), 0.14, vgrad(330 + hz, 600 + hz, [[0, '#3b3a9a'], [1, '#232266']]), 8);
      ridge(x => 600 - 170 * Math.pow(0.6 * tri(x * 0.0024 + 0.1) + 0.4 * tri(x * 0.0067 + 0.6), 1.3), 0.3, vgrad(430 + hz, 680 + hz, [[0, '#2a2878'], [1, '#17154a']]), 8);
      const s3 = x => 660 - 90 * Math.pow(0.6 * tri(x * 0.0033 + 0.5) + 0.4 * tri(x * 0.0087 + 0.2), 1.5);
      ridge(s3, 0.6, '#100e36', 8);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      slots(0.6, 260, 59, (x, r, i, wx) => {
        const y = s3(wx) + hz + 30;
        ctx.strokeStyle = `rgba(255,${120 + Math.round(60 * Math.sin(t * 2 + i))},50,.85)`; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 4, y + 40); ctx.lineTo(x + 22, y + 66); ctx.stroke();
        glow(x + 10, y + 34, 46, 'rgba(255,110,40,.5)', 0.6);
      });
      for (let i = 0; i < 30; i++) {
        const life = (t * (0.12 + hash(i, 71) * 0.14) + hash(i, 73)) % 1;
        const x = ((hash(i, 75) * 2600 - scroll * 0.5) % (W + 60) + W + 60) % (W + 60) - 30 + Math.sin(t + i) * 20;
        const y = H - life * 520 + hz * 0.5;
        glow(x, y, 5 + hash(i, 77) * 5, 'rgba(255,170,70,.95)', (1 - life) * 0.9);
      }
      ctx.restore();
      ridge(x => 708 - 30 * Math.pow(tri(x * 0.0061 + 0.3), 2), 1.1, '#07061f', 8);
    },
  };

  function drawGem(g) {
    const bob = Math.sin(t * 3 + g.phase) * 5;
    ctx.save(); ctx.translate(g.x, g.y + bob); ctx.scale(g.s, g.s); ctx.globalAlpha = g.a;
    glow(0, 0, 44, `hsla(${g.hue},100%,78%,.75)`, g.a * (0.65 + 0.2 * Math.sin(t * 5 + g.phase)));
    ctx.globalAlpha = g.a;
    const P = [[-17, -6], [-9, -16], [9, -16], [17, -6], [0, 19]];
    ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = `hsl(${g.hue},80%,32%)`;
    ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = `hsl(${g.hue},90%,62%)`; ctx.fill();
    ctx.fillStyle = `hsl(${g.hue},95%,78%)`; ctx.beginPath(); ctx.moveTo(-17, -6); ctx.lineTo(-9, -16); ctx.lineTo(9, -16); ctx.lineTo(17, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${g.hue},90%,50%)`; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.lineTo(0, 19); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${g.hue},100%,92%)`; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-8, -14); ctx.lineTo(-2, -14); ctx.lineTo(-7, -7); ctx.closePath(); ctx.fill();
    const tw = (Math.sin(t * 4 + g.phase * 3) + 1) / 2;
    ctx.globalAlpha = g.a * tw; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(14.5, -15.5); ctx.lineTo(21, -13); ctx.lineTo(14.5, -10.5); ctx.lineTo(12, -4); ctx.lineTo(9.5, -10.5); ctx.lineTo(3, -13); ctx.lineTo(9.5, -15.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    THEMES[theme]();
    if (streaks.length) {
      ctx.lineCap = 'round'; ctx.lineWidth = 3;
      for (const s of streaks) { ctx.strokeStyle = `rgba(255,255,255,${s.a})`; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.len, s.y); ctx.stroke(); }
    }
    for (const g of gems) drawGem(g);
  }

  return { init, resize, setTheme, setHorizon, setSpeed, update, draw, gems,
    get theme() { return theme; }, get W() { return W; }, get H() { return H; }, get speed() { return speed; } };
})();

/* ---------------- Particles drawn on top of everything ---------------- */
const FX = (() => {
  let canvas, ctx, W = 1280, H = 720, k = 1, dirty = false;
  const parts = [];
  const CONFETTI = ['#ff5d8f', '#ffd23f', '#5ad67d', '#4db8ff', '#a07bff', '#ff9f43', '#ffffff'];

  function init(c) { canvas = c; ctx = c.getContext('2d'); }
  function resize(w, h, scale) {
    W = w; H = h; k = clamp(scale * (window.devicePixelRatio || 1), 0.75, 1.5);
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  const add = p => { if (parts.length < 900) parts.push(Object.assign({ age: 0, life: 1, vx: 0, vy: 0, g: 0, drag: 0, rot: 0, vr: 0, size: 6, color: '#fff', type: 'dot' }, p)); };

  function burst(x, y, opts = {}) {
    const n = opts.n || 14, colors = opts.colors || ['#fff7b0', '#ffd23f', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (opts.speed || 260) * (0.35 + Math.random() * 0.75);
      add({ type: Math.random() < 0.5 ? 'star' : 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 520, drag: 2.2,
        size: (opts.size || 7) * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], life: 0.5 + Math.random() * 0.45, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, glow: true });
    }
    if (opts.ring !== false) add({ type: 'ring', x, y, size: 10, grow: opts.ringGrow || 190, color: colors[0], life: 0.42 });
  }
  function confetti(n = 140) {
    for (let i = 0; i < n; i++) {
      add({ type: 'conf', x: W / 2 + (Math.random() - 0.5) * W * 0.9, y: -20 - Math.random() * 260, vx: (Math.random() - 0.5) * 160, vy: 140 + Math.random() * 260,
        g: 160, drag: 0.6, size: 8 + Math.random() * 8, color: CONFETTI[i % CONFETTI.length], life: 3.2 + Math.random() * 1.6, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, sway: Math.random() * TAU });
    }
  }
  function cannon(x, y, dir, n = 50) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * 0.9, v = 500 + Math.random() * 600;
      add({ type: 'conf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, drag: 1.6, size: 7 + Math.random() * 8, color: CONFETTI[i % CONFETTI.length], life: 2 + Math.random(), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, sway: Math.random() * TAU });
    }
  }
  function fire(x, y, dx, dy, power = 1) {
    const n = Math.round(10 * power);
    for (let i = 0; i < n; i++) {
      const sp = (420 + Math.random() * 380) * power, spread = (Math.random() - 0.5) * 0.5;
      const c = Math.cos(spread), s = Math.sin(spread);
      add({ type: 'fire', x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, vx: (dx * c - dy * s) * sp, vy: (dx * s + dy * c) * sp - 30, g: -160, drag: 2.6, size: 14 + Math.random() * 16, life: 0.45 + Math.random() * 0.35 });
    }
  }
  function trail(x, y, colors) {
    add({ type: 'star', x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 30, vx: -120 - Math.random() * 120, vy: (Math.random() - 0.5) * 60, drag: 1.2,
      size: 4 + Math.random() * 6, color: colors[Math.floor(Math.random() * colors.length)], life: 0.5 + Math.random() * 0.4, rot: Math.random() * TAU, vr: 4, glow: true });
  }
  function hearts(x, y, n = 6) {
    for (let i = 0; i < n; i++) add({ type: 'heart', x: x + (Math.random() - 0.5) * 90, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 70, vy: -110 - Math.random() * 110, g: -30, size: 12 + Math.random() * 12, color: '#ff5d8f', life: 1 + Math.random() * 0.6, sway: Math.random() * TAU, delay: i * 0.06 });
  }
  function shells(x, y, n = 16) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = 300 + Math.random() * 480;
      add({ type: 'shell', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1300, size: 14 + Math.random() * 20, color: i % 3 ? '#fff6dc' : '#e9dcb6', life: 1.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
    }
  }
  function text(x, y, str, color = '#fff', size = 34) {
    add({ type: 'text', x, y, vy: -70, drag: 1.2, str, color, size, life: 1.1 });
  }
  /* things that fly to a spot in an arc, like coins going to the counter */
  function fly(kind, from, to, n, onArrive) {
    for (let i = 0; i < n; i++) {
      add({ type: 'fly', kind, x: from.x, y: from.y, fx: from.x + (Math.random() - 0.5) * 60, fy: from.y + (Math.random() - 0.5) * 40, tx: to.x, ty: to.y,
        cx: (from.x + to.x) / 2 + (Math.random() - 0.5) * 240, cy: Math.min(from.y, to.y) - 80 - Math.random() * 120, size: 15, life: 0.75 + Math.random() * 0.25, delay: i * 0.055, onArrive, rot: 0 });
    }
  }
  function shoot(from, to, onHit) {
    add({ type: 'ball', x: from.x, y: from.y, fx: from.x, fy: from.y, tx: to.x, ty: to.y, life: 0.16, size: 16, onArrive: onHit });
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      if (p.age >= p.life) { if (p.onArrive) p.onArrive(p); parts.splice(i, 1); continue; }
      if (p.type === 'fly') {
        const u = p.age / p.life, e = u * u * (3 - 2 * u), m = 1 - e;
        p.x = m * m * p.fx + 2 * m * e * p.cx + e * e * p.tx; p.y = m * m * p.fy + 2 * m * e * p.cy + e * e * p.ty; p.rot += dt * 9;
      } else if (p.type === 'ball') {
        const u = p.age / p.life; p.x = lerp(p.fx, p.tx, u); p.y = lerp(p.fy, p.ty, u);
        add({ type: 'fire', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, size: 16, life: 0.25, drag: 1 });
      } else {
        p.vy += p.g * dt;
        const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.sway != null) { p.sway += dt * 5; p.x += Math.sin(p.sway) * 50 * dt; }
        if (p.grow) p.size += p.grow * dt;
      }
    }
  }

  function star4(r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.38 : r; i ? ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : ctx.moveTo(rad, 0); }
    ctx.closePath(); ctx.fill();
  }
  function heartPath(s) {
    ctx.beginPath(); ctx.moveTo(0, s * 0.9);
    ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.7, -s * 1.1, 0, -s * 0.35);
    ctx.bezierCurveTo(s * 0.7, -s * 1.1, s * 1.3, -s * 0.1, 0, s * 0.9); ctx.closePath();
  }

  function draw() {
    if (!parts.length && !dirty) return;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    dirty = parts.length > 0;
    for (const p of parts) {
      if (p.delay > 0) continue;
      const u = p.age / p.life, fade = 1 - u;
      ctx.save(); ctx.translate(p.x, p.y);
      switch (p.type) {
        case 'dot':
          ctx.globalAlpha = fade; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size * 0.5 * (0.4 + fade * 0.6), 0, TAU); ctx.fill(); break;
        case 'star':
          ctx.globalAlpha = fade; ctx.rotate(p.rot); ctx.fillStyle = p.color; star4(p.size * (0.5 + fade * 0.7)); break;
        case 'ring':
          ctx.globalAlpha = fade * 0.8; ctx.strokeStyle = p.color; ctx.lineWidth = 5 * fade + 1; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.stroke(); break;
        case 'conf':
          ctx.globalAlpha = Math.min(1, fade * 4); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.age * 9 + p.sway)); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); break;
        case 'fire': {
          const r = p.size * (0.5 + u * 0.9);
          const col = u < 0.25 ? '255,244,170' : u < 0.55 ? '255,170,50' : u < 0.8 ? '255,90,40' : '120,90,100';
          ctx.globalCompositeOperation = u < 0.8 ? 'lighter' : 'source-over';
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${col},${0.9 * fade})`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); break;
        }
        case 'heart':
          ctx.globalAlpha = Math.min(1, fade * 2.5); ctx.scale(0.6 + Math.min(1, u * 5) * 0.4, 0.6 + Math.min(1, u * 5) * 0.4);
          ctx.fillStyle = p.color; ctx.strokeStyle = '#c9285c'; ctx.lineWidth = 2.5; heartPath(p.size); ctx.fill(); ctx.stroke(); break;
        case 'shell':
          ctx.globalAlpha = Math.min(1, fade * 3); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.strokeStyle = '#1f8f5a'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(-p.size / 2, p.size / 3); ctx.lineTo(-p.size / 4, -p.size / 2); ctx.lineTo(p.size / 5, -p.size / 5); ctx.lineTo(p.size / 2, -p.size / 2.4); ctx.lineTo(p.size / 2.5, p.size / 2.2); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
        case 'text': {
          const pop = Math.min(1, u * 6);
          ctx.globalAlpha = Math.min(1, fade * 2.2); ctx.scale(0.5 + pop * 0.5, 0.5 + pop * 0.5);
          ctx.font = `700 ${p.size}px Fredoka, "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(38,26,82,.85)'; ctx.strokeText(p.str, 0, 0); ctx.fillStyle = p.color; ctx.fillText(p.str, 0, 0); break;
        }
        case 'fly': {
          const sc = 1 - u * 0.3;
          ctx.scale(sc * Math.cos(p.rot) * 0.8 + sc * 0.2, sc);
          if (p.kind === 'coin') {
            ctx.fillStyle = '#ffc928'; ctx.strokeStyle = '#c98500'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 0, p.size * 0.62, 0, TAU); ctx.fill();
          } else if (p.kind === 'star') {
            ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#e09a00'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
            ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? p.size * 0.5 : p.size * 1.1; i ? ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad) : ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
            ctx.closePath(); ctx.fill(); ctx.stroke();
          } else { ctx.fillStyle = '#ff5d8f'; heartPath(p.size); ctx.fill(); }
          break;
        }
        case 'ball': {
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(255,250,200,1)'); g.addColorStop(0.4, 'rgba(255,170,50,.9)'); g.addColorStop(1, 'rgba(255,90,40,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); break;
        }
      }
      ctx.restore();
    }
  }
  function clear() { parts.length = 0; dirty = true; }

  return { init, resize, burst, confetti, cannon, fire, trail, hearts, shells, text, fly, shoot, update, draw, clear, get count() { return parts.length; } };
})();
