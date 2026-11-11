/* Dragon Keys - the night skies (drawn on a canvas) and the particle effects */
'use strict';

const TAU = Math.PI * 2;
const hash = (i, seed) => { const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
const tri = x => { const f = x - Math.floor(x); return 1 - 2 * Math.abs(f - 0.5); };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Scene = (() => {
  let canvas, ctx, W = 1280, H = 720, k = 1;
  let theme = 'meadow', scroll = 0, t = 0;
  let hz = 0, hzTarget = 0, speed = 24, speedTarget = 24;
  let heat = 0, heatTarget = 0, shake = 0, flash = 0, slow = 0, zoom = 1;
  let onDraw = null;
  const gems = [], streaks = [];
  /* the colour each world lends to the interface */
  const ACCENT = { meadow: '45,230,200', peaks: '255,92,205', cave: '150,115,255', castle: '255,190,92', summit: '255,122,60' };

  function init(c) { canvas = c; ctx = c.getContext('2d'); }
  function resize(w, h, scale) {
    W = w; H = h;
    k = clamp(scale * (window.devicePixelRatio || 1), 0.75, 1.5);
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  function setTheme(name) {
    theme = name;
    if (canvas && canvas.parentNode) canvas.parentNode.style.setProperty('--accent', ACCENT[name]);
  }
  function setHorizon(v, instant) { hzTarget = v; if (instant) hz = v; }
  function setSpeed(v) { speedTarget = v; }
  function setHeat(v) { heatTarget = clamp(v, 0, 1); }
  /* a wrong key: the world stutters for a moment */
  function hit() { shake = 1; flash = 1; slow = 0.1; }

  function update(dt) {
    t += dt;
    let wdt = dt;
    if (slow > 0) { slow -= dt; wdt = dt * 0.12; }
    speed = lerp(speed, speedTarget, 1 - Math.pow(0.03, dt));
    hz = lerp(hz, hzTarget, 1 - Math.pow(0.002, dt));
    heat = lerp(heat, heatTarget, 1 - Math.pow(0.05, dt));
    shake = Math.max(0, shake - dt * 5); flash = Math.max(0, flash - dt * 3.2);
    zoom = lerp(zoom, 1 + clamp((speed - 70) / 620, 0, 1) * 0.07, 1 - Math.pow(0.1, dt));
    scroll += speed * wdt;
    if (speed > 130 && Math.random() < dt * speed / (46 - heat * 26)) {
      streaks.push({ x: W + 40, y: 66 + Math.random() * 260, len: 50 + Math.random() * 130 + heat * 120, v: speed * 3 + 320, a: 0.16 + Math.random() * 0.2 + heat * 0.25 });
    }
    for (let i = streaks.length - 1; i >= 0; i--) { const s = streaks[i]; s.x -= s.v * wdt; if (s.x + s.len < 0) streaks.splice(i, 1); }
  }

  /* ---------- drawing helpers ---------- */
  function sky(stops) { ctx.fillStyle = vgrad(0, H, stops); ctx.fillRect(-30, -30, W + 60, H + 60); }
  function ridge(fn, p, fill, step = 14, rim = null) {
    const off = scroll * p;
    ctx.beginPath(); ctx.moveTo(-30, H + 40);
    for (let x = -30; x <= W + 30 + step; x += step) ctx.lineTo(x, fn(x + off) + hz);
    ctx.lineTo(W + 30 + step, H + 40); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (rim) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let x = -30; x <= W + 30 + step; x += step) ctx.lineTo(x, fn(x + off) + hz);
      ctx.strokeStyle = `rgba(${rim},0.16)`; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = `rgba(${rim},0.75)`; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    }
  }
  function ceiling(fn, p, fill, step = 12, rim = null) {
    const off = scroll * p;
    ctx.beginPath(); ctx.moveTo(-30, -40);
    for (let x = -30; x <= W + 30 + step; x += step) ctx.lineTo(x, fn(x + off));
    ctx.lineTo(W + 30 + step, -40); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (rim) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath(); for (let x = -30; x <= W + 30 + step; x += step) ctx.lineTo(x, fn(x + off));
      ctx.strokeStyle = `rgba(${rim},0.6)`; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore();
    }
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
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  function light(fn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; fn(); ctx.restore(); }
  function cloud(x, y, s, color, alpha = 1) {
    ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath();
    const e = (cx, cy, rx, ry) => { ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); };
    e(x, y, 90 * s, 16 * s); e(x - 40 * s, y - 10 * s, 46 * s, 16 * s); e(x + 20 * s, y - 16 * s, 56 * s, 20 * s); e(x + 70 * s, y - 4 * s, 40 * s, 12 * s);
    ctx.fill(); ctx.globalAlpha = 1;
  }
  function roundTree(x, y, s, c1) {
    ctx.fillStyle = c1; ctx.fillRect(x - 4 * s, y - 34 * s, 8 * s, 40 * s);
    ctx.beginPath(); ctx.arc(x, y - 58 * s, 30 * s, 0, TAU); ctx.moveTo(x, y - 40 * s); ctx.arc(x - 20 * s, y - 40 * s, 21 * s, 0, TAU); ctx.moveTo(x + 42 * s, y - 40 * s); ctx.arc(x + 20 * s, y - 40 * s, 21 * s, 0, TAU); ctx.fill();
  }
  function pine(x, y, s, c1) {
    ctx.fillStyle = c1;
    for (let i = 0; i < 3; i++) {
      const w = (30 - i * 7) * s, top = y - (42 + i * 24) * s, bot = y - (6 + i * 22) * s;
      ctx.beginPath(); ctx.moveTo(x - w, bot); ctx.lineTo(x, top); ctx.lineTo(x + w, bot); ctx.closePath(); ctx.fill();
    }
  }
  function stars(count, seed, maxY, alpha = 1) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < count; i++) {
      const x = hash(i, seed) * (W + 40) - 20, y = hash(i, seed + 3) * maxY;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.8 + hash(i, seed + 5) * 2.4) + i);
      const r = 0.6 + hash(i, seed + 7) * 1.5;
      ctx.globalAlpha = alpha * tw; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function moon(x, y, r, tint, halo) {
    light(() => glow(x, y, r * 4.4, halo, 0.7));
    ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(120,140,200,.28)'; ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.18, r * 0.2, 0, TAU); ctx.moveTo(x + r * 0.55, y + r * 0.3); ctx.arc(x + r * 0.3, y + r * 0.3, r * 0.25, 0, TAU); ctx.moveTo(x + r * 0.3, y - r * 0.46); ctx.arc(x + r * 0.18, y - r * 0.46, r * 0.12, 0, TAU); ctx.fill();
  }
  function motes(count, seed, colors, drift = 0.4, top = 80, span = 420) {
    light(() => {
      for (let i = 0; i < count; i++) {
        const x = ((hash(i, seed) * 3000 - scroll * (0.25 + hash(i, seed + 2) * drift) + Math.sin(t * 0.7 + i) * 40) % (W + 80) + W + 80) % (W + 80) - 40;
        const y = top + hash(i, seed + 4) * span + Math.sin(t * 1.1 + i * 1.7) * 22 + hz * 0.3;
        glow(x, y, 7 + hash(i, seed + 6) * 8, colors[i % colors.length], 0.45 + 0.45 * Math.sin(t * 2.2 + i));
      }
    });
  }
  function crystal(x, y, s, hue, lean) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(lean);
    light(() => glow(0, -30 * s, 90 * s, `hsla(${hue},100%,65%,.55)`, 0.55 + 0.25 * Math.sin(t * 2 + x * 0.01)));
    const shard = (dx, h, w, l) => {
      ctx.fillStyle = `hsl(${hue},90%,${l}%)`;
      ctx.beginPath(); ctx.moveTo(dx - w, 0); ctx.lineTo(dx - w * 0.7, -h * 0.8); ctx.lineTo(dx, -h); ctx.lineTo(dx + w * 0.7, -h * 0.8); ctx.lineTo(dx + w, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `hsl(${hue},100%,${l + 22}%)`;
      ctx.beginPath(); ctx.moveTo(dx - w, 0); ctx.lineTo(dx - w * 0.7, -h * 0.8); ctx.lineTo(dx, -h); ctx.lineTo(dx - w * 0.15, 0); ctx.closePath(); ctx.fill();
    };
    shard(-16 * s, 40 * s, 9 * s, 50); shard(15 * s, 50 * s, 10 * s, 46); shard(0, 76 * s, 13 * s, 56);
    ctx.restore();
  }
  function castle(x, y, s, body, roof, win) {
    const tower = (tx, w, h, cone) => {
      ctx.fillStyle = body; ctx.fillRect(x + tx * s, y - h * s, w * s, h * s + 80);
      for (let i = 0; i < 3; i++) ctx.fillRect(x + (tx - 3 + i * (w + 6) / 3 + 0.5) * s, y - (h + 9) * s, (w / 3 - 2) * s, 10 * s);
      if (cone) {
        ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x + (tx - 5) * s, y - (h + 6) * s); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 6 + cone) * s); ctx.lineTo(x + (tx + w + 5) * s, y - (h + 6) * s); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = roof; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + (tx + w / 2) * s, y - (h + 6 + cone) * s); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 22 + cone) * s); ctx.stroke();
        const wave = Math.sin(t * 4 + x * 0.02 + tx) * 3 * s;
        ctx.fillStyle = '#ff3d8f'; ctx.beginPath(); ctx.moveTo(x + (tx + w / 2) * s, y - (h + 22 + cone) * s); ctx.lineTo(x + (tx + w / 2 + 16) * s, y - (h + 17 + cone) * s + wave); ctx.lineTo(x + (tx + w / 2) * s, y - (h + 11 + cone) * s); ctx.closePath(); ctx.fill();
      }
      light(() => {
        ctx.fillStyle = win; ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 1.5 + tx + x * 0.01);
        ctx.beginPath(); ctx.roundRect(x + (tx + w / 2 - 4) * s, y - (h - 14) * s, 8 * s, 13 * s, [4 * s, 4 * s, 0, 0]); ctx.fill();
        if (h > 60) { ctx.beginPath(); ctx.roundRect(x + (tx + w / 2 - 3) * s, y - (h - 44) * s, 6 * s, 10 * s, [3 * s, 3 * s, 0, 0]); ctx.fill(); }
      });
    };
    tower(-70, 26, 70, 30); tower(44, 26, 84, 34); tower(-34, 68, 46, 0); tower(-12, 24, 112, 40);
    light(() => { ctx.fillStyle = win; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.roundRect(x - 9 * s, y - 20 * s, 18 * s, 26 * s, [9 * s, 9 * s, 0, 0]); ctx.fill(); });
  }

  let auroraCv = null, auroraImg = null;
  function aurora() {
    const AW = 160, AH = 52, span = 420;
    if (!auroraCv) { auroraCv = document.createElement('canvas'); auroraCv.width = AW; auroraCv.height = AH; auroraImg = auroraCv.getContext('2d').createImageData(AW, AH); }
    const px = auroraImg.data, bands = [[120, 80, 255, 190, 0.9], [200, 90, 180, 255, 1.3], [80, 200, 120, 255, 0.6]];
    for (let cx = 0; cx < AW; cx++) {
      const x = cx / AW * W, col = [];
      for (let b = 0; b < 3; b++) {
        const [by, r, g, bl, sp] = bands[b];
        col.push([by + Math.sin(x * 0.005 + t * 0.35 * sp + b * 2) * 34 + Math.sin(x * 0.013 - t * 0.25 + b) * 16 + hz * 0.1,
          110 + Math.sin(x * 0.02 + t * sp + b) * 40, (0.3 + 0.1 * Math.sin(x * 0.03 + t * 1.5 + b)) , r, g, bl]);
      }
      for (let cy = 0; cy < AH; cy++) {
        const y = cy / AH * span;
        let R = 0, G = 0, B = 0;
        for (const [y0, hgt, k2, r, g, bl] of col) {
          const u = (y - y0) / hgt;
          if (u <= 0 || u >= 1) continue;
          const a = (u < 0.25 ? u / 0.25 : (1 - u) / 0.75) * k2;
          R += r * a; G += g * a; B += bl * a;
        }
        const i = (cy * AW + cx) * 4;
        px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = 255;
      }
    }
    auroraCv.getContext('2d').putImageData(auroraImg, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(auroraCv, -30, 0, W + 60, span); ctx.restore();
  }

  /* ---------- the five worlds ---------- */
  const THEMES = {
    meadow() {
      sky([[0, '#03051a'], [0.42, '#0a1746'], [0.74, '#12336b'], [1, '#0e4a6a']]);
      stars(120, 5, 430, 0.95);
      moon(W - 230, 122 + hz * 0.12, 46, '#eaf6ff', 'rgba(140,215,255,.5)');
      slots(0.035, 520, 11, (x, r) => cloud(x, 120 + r * 150 + hz * 0.2, 0.9 + r * 0.8, '#9fd0ff', 0.07));
      ctx.fillStyle = vgrad(330 + hz, 560 + hz, [[0, 'rgba(40,225,205,0)'], [1, 'rgba(40,225,205,.2)']]); ctx.fillRect(-30, 330 + hz, W + 60, 230);
      ridge(x => 420 - 86 * (0.6 * tri(x * 0.0011 + 0.3) + 0.4 * tri(x * 0.0027 + 1.7)), 0.08, vgrad(300 + hz, 480 + hz, [[0, '#132a66'], [1, '#0d1f4e']]), 14, '120,170,255');
      const h1 = x => 500 - 38 * (Math.sin(x * 0.0031) * 0.6 + Math.sin(x * 0.0073 + 1) * 0.4);
      ridge(h1, 0.2, '#0b2a50', 14, '60,225,210');
      const h2 = x => 560 - 34 * (Math.sin(x * 0.0026 + 2) * 0.6 + Math.sin(x * 0.0061) * 0.4);
      slots(0.38, 210, 31, (x, r, i, wx) => { const y = h2(wx) + hz + 8; if (r < 0.55) roundTree(x, y, 0.75 + r * 0.5, '#07223f'); else pine(x, y, 0.9 + r * 0.4, '#07223f'); });
      ridge(h2, 0.38, '#082542', 14, '50,235,200');
      const h3 = x => 640 - 26 * (Math.sin(x * 0.0041 + 4) * 0.6 + Math.sin(x * 0.0093 + 2) * 0.4);
      slots(0.7, 320, 47, (x, r, i, wx) => { if (r < 0.7) roundTree(x, h3(wx) + hz + 10, 1.1 + r * 0.5, '#051a30'); });
      ridge(h3, 0.7, '#061c33', 14, '90,255,190');
      light(() => slots(0.7, 74, 53, (x, r, i, wx) => {
        const y = h3(wx) + hz + 12 + r * 34;
        glow(x, y, 9 + r * 6, ['rgba(255,80,220,.9)', 'rgba(60,230,255,.9)', 'rgba(190,255,90,.9)', 'rgba(255,255,255,.9)'][i & 3], 0.5 + 0.4 * Math.sin(t * 2 + i));
      }));
      motes(22, 91, ['rgba(200,255,120,.9)', 'rgba(120,255,220,.9)'], 0.4, 230, 330);
      ridge(x => 706 - 14 * Math.sin(x * 0.006 + 1), 1.15, '#030c1a');
    },

    peaks() {
      sky([[0, '#06031c'], [0.34, '#1f0f4c'], [0.6, '#671e78'], [0.8, '#d43f7e'], [1, '#ff8b5c']]);
      stars(90, 5, 280, 0.85);
      // a low sun with bands across it
      const sx = W * 0.66, sy = 430 + hz * 0.5, sr = 150;
      light(() => glow(sx, sy, 420, 'rgba(255,120,170,.5)', 0.8));
      ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.clip();
      ctx.fillStyle = vgrad(sy - sr, sy + sr, [[0, '#fff27a'], [0.5, '#ff7a6b'], [1, '#ff2f9a']]); ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      ctx.fillStyle = '#5a1a72';
      for (let i = 0; i < 7; i++) { const y = sy - 6 + i * 22 + ((t * 5) % 22); ctx.fillRect(sx - sr, y, sr * 2, 3 + i * 1.6); }
      ctx.restore();
      slots(0.04, 520, 13, (x, r) => cloud(x, 150 + r * 150 + hz * 0.2, 1 + r * 0.7, '#ff9fd0', 0.1));
      ridge(x => 470 - 240 * Math.pow(0.55 * tri(x * 0.0012 + 0.2) + 0.45 * tri(x * 0.0031 + 0.9), 1.25), 0.07, vgrad(230 + hz, 520 + hz, [[0, '#4a2590'], [1, '#2a1560']]), 8, '255,130,225');
      ridge(x => 540 - 220 * Math.pow(0.6 * tri(x * 0.0016 + 0.6) + 0.4 * tri(x * 0.0043 + 0.1), 1.3), 0.16, vgrad(320 + hz, 600 + hz, [[0, '#2a1464'], [1, '#190c44']]), 8, '170,130,255');
      slots(0.24, 560, 71, (x, r, i) => {
        const y = 250 + r * 150 + hz * 0.7 + Math.sin(t * 0.8 + i) * 6, s = 0.7 + hash(i, 4) * 0.6;
        ctx.fillStyle = '#140a36'; ctx.beginPath(); ctx.moveTo(x - 62 * s, y); ctx.quadraticCurveTo(x - 20 * s, y + 70 * s, x + 4 * s, y + 84 * s); ctx.quadraticCurveTo(x + 30 * s, y + 50 * s, x + 62 * s, y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y, 66 * s, 13 * s, 0, 0, TAU); ctx.fill();
        pine(x - 18 * s, y - 2 * s, 0.6 * s, '#140a36'); roundTree(x + 24 * s, y - 2 * s, 0.45 * s, '#140a36');
        light(() => {
          ctx.strokeStyle = 'rgba(60,230,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, y, 66 * s, 13 * s, 0, Math.PI, TAU); ctx.stroke();
          const g = ctx.createLinearGradient(0, y, 0, y + 150 * s); g.addColorStop(0, 'rgba(90,235,255,.75)'); g.addColorStop(1, 'rgba(90,235,255,0)');
          ctx.strokeStyle = g; ctx.lineWidth = 3 * s; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -t * 60;
          ctx.beginPath(); ctx.moveTo(x + 40 * s, y + 6 * s); ctx.lineTo(x + 40 * s, y + 150 * s); ctx.stroke(); ctx.setLineDash([]);
        });
      });
      const m3 = x => 630 - 150 * Math.pow(0.6 * tri(x * 0.0021 + 0.3) + 0.4 * tri(x * 0.0057 + 0.5), 1.2);
      ridge(m3, 0.36, vgrad(470 + hz, 700 + hz, [[0, '#170b3e'], [1, '#0e0628']]), 8, '60,225,255');
      slots(0.6, 130, 37, (x, r, i, wx) => pine(x, 650 - 22 * Math.sin(wx * 0.004) + hz + 12, 0.9 + r * 0.8, '#0a0420'));
      ridge(x => 650 - 22 * Math.sin(x * 0.004), 0.6, '#0a0420', 14, '255,110,210');
      ridge(x => 706 - 16 * Math.sin(x * 0.005 + 2), 1.1, '#050212');
      ctx.strokeStyle = 'rgba(255,220,240,.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const bx = ((hash(i, 81) * 2000 + t * (26 + i * 5)) % (W + 200)) - 100, by = 120 + hash(i, 83) * 160 + Math.sin(t * 2 + i) * 8 + hz * 0.2, f = Math.sin(t * 9 + i * 2) * 5;
        ctx.beginPath(); ctx.moveTo(bx - 10, by + f); ctx.quadraticCurveTo(bx - 4, by - 5, bx, by); ctx.quadraticCurveTo(bx + 4, by - 5, bx + 10, by + f); ctx.stroke();
      }
    },

    cave() {
      sky([[0, '#0b0628'], [0.5, '#1c1052'], [1, '#0a2444']]);
      slots(0.05, 420, 9, (x, r) => { ctx.fillStyle = 'rgba(80,60,170,.13)'; ctx.beginPath(); ctx.ellipse(x, 260 + r * 200, 300, 170 + r * 80, 0, 0, TAU); ctx.fill(); });
      light(() => slots(0.1, 700, 15, (x, r) => {
        const g = ctx.createLinearGradient(x, 0, x - 180, 620); g.addColorStop(0, 'rgba(120,200,255,.2)'); g.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 60 + r * 60, 0); ctx.lineTo(x - 80, 640); ctx.lineTo(x - 320, 640); ctx.closePath(); ctx.fill();
      }));
      const f1 = x => 520 - 150 * Math.pow(tri(x * 0.0036 + 0.2) * 0.6 + tri(x * 0.0091) * 0.4, 2.2);
      slots(0.22, 330, 61, (x, r, i, wx) => crystal(x, f1(wx) + hz * 0.7 + 30, 1.1 + r * 0.7, [185, 300, 95, 265][i & 3], (r - 0.5) * 0.5));
      ridge(x => f1(x) - hz * 0.3, 0.22, '#1a0f4a', 8, '150,120,255');
      ceiling(x => 30 + 170 * Math.pow(tri(x * 0.0041 + 0.6) * 0.55 + tri(x * 0.0113 + 0.3) * 0.45, 2.4), 0.3, '#130a3a', 8, '110,90,220');
      const f2 = x => 610 - 130 * Math.pow(tri(x * 0.0047 + 0.7) * 0.6 + tri(x * 0.0129 + 0.4) * 0.4, 2);
      slots(0.5, 260, 67, (x, r, i, wx) => crystal(x, f2(wx) + hz + 28, 1.4 + r * 0.9, [300, 185, 265, 95, 45][((i % 5) + 5) % 5], (r - 0.5) * 0.6));
      ridge(f2, 0.5, '#0f0830', 8, '90,220,255');
      ceiling(x => 10 + 120 * Math.pow(tri(x * 0.0063 + 0.1) * 0.6 + tri(x * 0.0171) * 0.4, 2.6), 0.6, '#0a0624', 8);
      ridge(x => 700 - 60 * Math.pow(tri(x * 0.0058 + 0.3), 2), 1.1, '#06031a', 8);
      motes(26, 91, ['rgba(160,255,220,.9)', 'rgba(255,170,255,.9)', 'rgba(255,240,160,.9)'], 0.5, 80, 420);
    },

    castle() {
      sky([[0, '#03051c'], [0.4, '#120f50'], [0.72, '#3a1c88'], [1, '#7c2fa2']]);
      stars(120, 7, 380, 0.9);
      moon(W * 0.2, 132 + hz * 0.1, 56, '#fff6dc', 'rgba(255,225,170,.45)');
      // searchlights sweeping behind the towers
      light(() => {
        for (let i = 0; i < 3; i++) {
          const bx = W * (0.3 + i * 0.26), by = 520 + hz, a = -Math.PI / 2 + Math.sin(t * 0.4 + i * 2.1) * 0.5;
          const g = ctx.createLinearGradient(bx, by, bx + Math.cos(a) * 560, by + Math.sin(a) * 560);
          g.addColorStop(0, 'rgba(120,200,255,.22)'); g.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.07) * 620, by + Math.sin(a - 0.07) * 620); ctx.lineTo(bx + Math.cos(a + 0.07) * 620, by + Math.sin(a + 0.07) * 620); ctx.closePath(); ctx.fill();
        }
      });
      slots(0.04, 520, 17, (x, r) => cloud(x, 200 + r * 160 + hz * 0.3, 1 + r * 0.7, '#c9a0ff', 0.08));
      const c1 = x => 500 - 50 * (Math.sin(x * 0.002) * 0.6 + Math.sin(x * 0.0051 + 1) * 0.4);
      slots(0.14, 640, 73, (x, r, i, wx) => castle(x, c1(wx) + hz + 10, 1.1 + r * 0.5, '#1c1560', '#2a2080', '#ffd36a'));
      ridge(c1, 0.14, '#1c1560', 14, '170,140,255');
      const c2 = x => 560 - 36 * (Math.sin(x * 0.0029 + 2) * 0.6 + Math.sin(x * 0.0067) * 0.4);
      slots(0.3, 560, 79, (x, r, i, wx) => { if (r > 0.4) castle(x + 200, c2(wx + 200) + hz + 8, 1.5 + r * 0.5, '#120e44', '#1c1660', '#6be6ff'); });
      slots(0.3, 150, 41, (x, r, i, wx) => roundTree(x, c2(wx) + hz + 8, 0.7 + r * 0.5, '#0f0b3a'));
      ridge(c2, 0.3, '#120e44', 14, '255,150,230');
      const c3 = x => 640 - 26 * (Math.sin(x * 0.0037 + 4) * 0.6 + Math.sin(x * 0.0089 + 2) * 0.4);
      slots(0.6, 240, 43, (x, r, i, wx) => {
        const y = c3(wx) + hz + 6;
        if (r < 0.5) pine(x, y, 1.2 + r, '#0a0828'); else roundTree(x, y, 1 + r * 0.5, '#0a0828');
        ctx.strokeStyle = '#0a0828'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 70, y + 6); ctx.lineTo(x + 70, y - 46); ctx.stroke();
        light(() => glow(x + 70, y - 52, 46, 'rgba(255,200,110,.95)', 0.7 + 0.2 * Math.sin(t * 3 + i)));
        ctx.fillStyle = '#ffe9b0'; ctx.beginPath(); ctx.arc(x + 70, y - 52, 5, 0, TAU); ctx.fill();
      });
      ridge(c3, 0.6, '#0a0828', 14, '255,190,110');
      ridge(x => 706 - 14 * Math.sin(x * 0.006 + 1), 1.1, '#04031a');
    },

    summit() {
      sky([[0, '#02041a'], [0.5, '#0b1448'], [0.85, '#33205f'], [1, '#5a2444']]);
      stars(160, 3, 520, 1);
      aurora();
      moon(W * 0.8, 120 + hz * 0.1, 52, '#f2f5ff', 'rgba(190,210,255,.45)');
      slots(0.05, 1500, 87, (x) => {
        const y = 520 + hz * 0.5, w = 300, h = 250;
        light(() => glow(x, y - h + 6, 170, 'rgba(255,110,50,.85)', 0.6 + 0.15 * Math.sin(t * 2)));
        ctx.fillStyle = '#140f44'; ctx.beginPath(); ctx.moveTo(x - w, y + 60); ctx.lineTo(x - 46, y - h); ctx.lineTo(x + 46, y - h); ctx.lineTo(x + w, y + 60); ctx.closePath(); ctx.fill();
        light(() => {
          ctx.fillStyle = '#ff9a4a'; ctx.beginPath(); ctx.ellipse(x, y - h + 2, 44, 8, 0, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,110,40,.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x - 10, y - h + 6); ctx.quadraticCurveTo(x - 40, y - h + 90, x - 30, y - h + 170); ctx.moveTo(x + 20, y - h + 6); ctx.quadraticCurveTo(x + 50, y - h + 70, x + 80, y - h + 130); ctx.stroke();
        });
      });
      ridge(x => 520 - 190 * Math.pow(0.6 * tri(x * 0.0017 + 0.4) + 0.4 * tri(x * 0.0049 + 0.8), 1.4), 0.14, vgrad(330 + hz, 600 + hz, [[0, '#262682'], [1, '#161650']]), 8, '120,150,255');
      ridge(x => 600 - 170 * Math.pow(0.6 * tri(x * 0.0024 + 0.1) + 0.4 * tri(x * 0.0067 + 0.6), 1.3), 0.3, vgrad(430 + hz, 680 + hz, [[0, '#191858'], [1, '#0e0d36']]), 8, '255,120,80');
      const s3 = x => 660 - 90 * Math.pow(0.6 * tri(x * 0.0033 + 0.5) + 0.4 * tri(x * 0.0087 + 0.2), 1.5);
      ridge(s3, 0.6, '#0a0828', 8, '255,150,60');
      light(() => {
        slots(0.6, 260, 59, (x, r, i, wx) => {
          const y = s3(wx) + hz + 30;
          ctx.strokeStyle = `rgba(255,${120 + Math.round(60 * Math.sin(t * 2 + i))},50,.9)`; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 20); ctx.lineTo(x + 4, y + 40); ctx.lineTo(x + 22, y + 66); ctx.stroke();
          glow(x + 10, y + 34, 50, 'rgba(255,110,40,.5)', 0.6);
        });
        for (let i = 0; i < 34; i++) {
          const life = (t * (0.12 + hash(i, 71) * 0.14) + hash(i, 73)) % 1;
          const x = ((hash(i, 75) * 2600 - scroll * 0.5) % (W + 60) + W + 60) % (W + 60) - 30 + Math.sin(t + i) * 20;
          glow(x, H - life * 540 + hz * 0.5, 5 + hash(i, 77) * 5, 'rgba(255,170,70,.95)', (1 - life) * 0.9);
        }
      });
      ridge(x => 708 - 30 * Math.pow(tri(x * 0.0061 + 0.3), 2), 1.1, '#04031a', 8);
    },
  };

  function drawGem(g) {
    const bob = Math.sin(t * 3 + g.phase) * 5, spin = Math.sin(t * 2.2 + g.phase) * 0.18;
    ctx.save(); ctx.translate(g.x, g.y + bob); ctx.rotate(spin); ctx.scale(g.s, g.s);
    light(() => { glow(0, 0, 54, `hsla(${g.hue},100%,70%,.8)`, g.a * (0.6 + 0.25 * Math.sin(t * 5 + g.phase))); });
    ctx.globalAlpha = g.a;
    const P = [[-15, -5], [-8, -15], [8, -15], [15, -5], [0, 18]];
    ctx.lineJoin = 'round';
    ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.fillStyle = `hsla(${g.hue},95%,58%,.9)`; ctx.fill();
    ctx.fillStyle = `hsl(${g.hue},100%,80%)`; ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-8, -15); ctx.lineTo(8, -15); ctx.lineTo(15, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${g.hue},95%,46%)`; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.lineTo(0, 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
    ctx.strokeStyle = `hsl(${g.hue},100%,92%)`; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const sx = shake ? (hash(Math.floor(t * 60), 1) - 0.5) * shake * 12 : 0, sy = shake ? (hash(Math.floor(t * 60), 2) - 0.5) * shake * 8 : 0;
    ctx.save();
    ctx.translate(W * 0.3 + sx, 240 + sy); ctx.scale(zoom, zoom); ctx.translate(-W * 0.3, -240);
    THEMES[theme]();
    ctx.restore();
    if (streaks.length) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineWidth = 2;
      for (const s of streaks) {
        const g = ctx.createLinearGradient(s.x, 0, s.x + s.len, 0); g.addColorStop(0, `rgba(255,255,255,${s.a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.len, s.y); ctx.stroke();
      }
      ctx.restore();
    }
    if (heat > 0.03) light(() => glow(W * 0.3, 210, 380 + heat * 320, `rgba(${ACCENT[theme]},${0.05 + heat * 0.16})`, 1));
    for (const g of gems) drawGem(g);
    if (onDraw) onDraw(ctx);
    if (flash > 0) { ctx.fillStyle = `rgba(255,30,80,${flash * 0.17})`; ctx.fillRect(0, 0, W, H); }
  }

  return { init, resize, setTheme, setHorizon, setSpeed, setHeat, hit, update, draw, gems, ACCENT,
    set onDraw(fn) { onDraw = fn; }, get theme() { return theme; }, get W() { return W; }, get H() { return H; }, get speed() { return speed; }, get heat() { return heat; }, get time() { return t; } };
})();

/* ---------------- Particles drawn on top of everything ---------------- */
const FX = (() => {
  let canvas, ctx, W = 1280, H = 720, k = 1, dirty = false;
  const parts = [];
  const NEON = ['#22e1ff', '#ff3df0', '#b6ff3d', '#ffd23f', '#8b5cff', '#ffffff', '#ff7a3d'];

  function init(c) { canvas = c; ctx = c.getContext('2d'); }
  function resize(w, h, scale) {
    W = w; H = h; k = clamp(scale * (window.devicePixelRatio || 1), 0.75, 1.5);
    canvas.width = Math.round(W * k); canvas.height = Math.round(H * k);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  const add = p => { if (parts.length < 900) parts.push(Object.assign({ age: 0, life: 1, vx: 0, vy: 0, g: 0, drag: 0, rot: 0, vr: 0, size: 6, color: '#fff', type: 'dot' }, p)); };

  function burst(x, y, opts = {}) {
    const n = opts.n || 14, colors = opts.colors || ['#ffffff', '#22e1ff', '#b6ff3d'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = (opts.speed || 260) * (0.35 + Math.random() * 0.75);
      add({ type: Math.random() < 0.6 ? 'star' : 'line', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: opts.g == null ? 300 : opts.g, drag: 2.6,
        size: (opts.size || 7) * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], life: 0.45 + Math.random() * 0.45, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10 });
    }
    if (opts.ring !== false) add({ type: 'ring', x, y, size: 8, grow: opts.ringGrow || 220, color: colors[0], life: 0.4 });
  }
  function confetti(n = 140) {
    for (let i = 0; i < n; i++) {
      add({ type: 'conf', x: W / 2 + (Math.random() - 0.5) * W * 0.9, y: -20 - Math.random() * 260, vx: (Math.random() - 0.5) * 160, vy: 160 + Math.random() * 300,
        g: 120, drag: 0.5, size: 5 + Math.random() * 7, color: NEON[i % NEON.length], life: 2.6 + Math.random() * 1.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, sway: Math.random() * TAU });
    }
  }
  function cannon(x, y, dir, n = 50) {
    for (let i = 0; i < n; i++) {
      const a = dir + (Math.random() - 0.5) * 0.9, v = 500 + Math.random() * 600;
      add({ type: 'conf', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 700, drag: 1.6, size: 5 + Math.random() * 7, color: NEON[i % NEON.length], life: 1.8 + Math.random(), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, sway: Math.random() * TAU });
    }
  }
  function fire(x, y, dx, dy, power = 1) {
    const n = Math.round(10 * power);
    for (let i = 0; i < n; i++) {
      const sp = (460 + Math.random() * 420) * power, spread = (Math.random() - 0.5) * 0.42;
      const c = Math.cos(spread), s = Math.sin(spread);
      add({ type: 'fire', x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: (dx * c - dy * s) * sp, vy: (dx * s + dy * c) * sp - 20, g: -140, drag: 2.8, size: 13 + Math.random() * 15, life: 0.4 + Math.random() * 0.32 });
    }
  }
  function shells(x, y, n = 16, colors = ['#eaf6ff', '#9dfcff']) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.8, v = 300 + Math.random() * 500;
      add({ type: 'shell', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1200, size: 12 + Math.random() * 20, color: colors[i % colors.length], life: 1.3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16 });
    }
  }
  function text(x, y, str, color = '#fff', size = 34) {
    add({ type: 'text', x, y, vy: -60, drag: 1.4, str, color, size, life: 1.1 });
  }
  function shoot(from, to, onHit) {
    add({ type: 'ball', x: from.x, y: from.y, fx: from.x, fy: from.y, tx: to.x, ty: to.y, life: 0.15, size: 16, onArrive: onHit });
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      if (p.age >= p.life) { if (p.onArrive) p.onArrive(p); parts.splice(i, 1); continue; }
      if (p.type === 'ball') {
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
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.3 : r; if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else ctx.moveTo(rad, 0); }
    ctx.closePath(); ctx.fill();
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
        case 'star':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade; ctx.rotate(p.rot); ctx.fillStyle = p.color; star4(p.size * (0.5 + fade * 0.8)); break;
        case 'line': {
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade; ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.lineCap = 'round';
          const v = Math.hypot(p.vx, p.vy) || 1, len = Math.min(26, v * 0.05) + 2;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.vx / v * len, -p.vy / v * len); ctx.stroke(); break;
        }
        case 'ring':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade * 0.9; ctx.strokeStyle = p.color; ctx.lineWidth = 3 * fade + 0.6; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.stroke(); break;
        case 'conf':
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, fade * 4); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.age * 9 + p.sway)); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 5, p.size, p.size * 0.4); break;
        case 'fire': {
          const r = p.size * (0.5 + u * 0.9);
          const col = u < 0.25 ? '255,244,190' : u < 0.55 ? '255,170,60' : u < 0.8 ? '255,80,60' : '150,60,160';
          ctx.globalCompositeOperation = 'lighter';
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(${col},${0.9 * fade})`); g.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); break;
        }
        case 'shell':
          ctx.globalAlpha = Math.min(1, fade * 3); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(-p.size / 2, p.size / 3); ctx.lineTo(-p.size / 4, -p.size / 2); ctx.lineTo(p.size / 5, -p.size / 5); ctx.lineTo(p.size / 2, -p.size / 2.4); ctx.lineTo(p.size / 2.5, p.size / 2.2); ctx.closePath(); ctx.fill(); break;
        case 'text': {
          const pop = Math.min(1, u * 7);
          ctx.globalAlpha = Math.min(1, fade * 2.2); ctx.scale(0.6 + pop * 0.4, 0.6 + pop * 0.4);
          ctx.font = `800 ${p.size}px "Exo 2", "Segoe UI", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = p.color; ctx.shadowBlur = 18; ctx.fillStyle = p.color; ctx.fillText(p.str, 0, 0);
          ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.globalAlpha *= 0.85; ctx.fillText(p.str, 0, 0); break;
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

  return { init, resize, burst, confetti, cannon, fire, shells, text, shoot, update, draw, clear, get count() { return parts.length; } };
})();
