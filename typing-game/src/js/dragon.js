/* Dragon Keys - the dragon. Its body is a chain of points: the head is steered and
   everything behind it follows, so the motion comes from physics, not from fixed frames. */
'use strict';

const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgbMix = (a, b, t, alpha = 1) => `rgba(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)},${alpha})`;
const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * t; };

class Dragon {
  constructor(opts = {}) {
    this.t = Math.random() * 20; this.flap = Math.random() * 6; this.jaw = 0; this.jawTarget = 0;
    this.boost = 0; this.heading = 0; this.vx = 0; this.vy = 0; this.zap = 0;
    this.trail = []; this.parts = []; this.segs = null;
    this.setLook(opts);
    this.place(opts.x || 0, opts.y || 0);
  }

  setLook({ color = 'emerald', stage = 1, trail = 'spark', crest = 'horns', size = this.size || 1 } = {}) {
    const st = clamp(stage, 0, 3), grew = this.stage !== st || this.size !== size;
    this.size = size;
    this.stage = st; this.trailId = TRAILS[trail] ? trail : 'spark'; this.crest = CRESTS[crest] ? crest : 'horns';
    this.pal = DRAGON_COLORS[color] || DRAGON_COLORS.emerald;
    this.ca = hexRgb(this.pal.a); this.cb = hexRgb(this.pal.b); this.cf = hexRgb(this.pal.fin);
    this.N = [17, 22, 28, 34][st]; this.L = [9.5, 10.5, 11, 11.5][st] * size; this.W = [9, 11, 13, 15][st] * size;
    this.wingLen = [38, 52, 66, 80][st] * size; this.headS = this.W * [1.55, 1.42, 1.32, 1.24][st];
    if (grew && this.segs) this.place(this.segs[0].x, this.segs[0].y);
  }

  place(x, y) {
    this.segs = Array.from({ length: this.N }, (_, i) => ({ x: x - i * this.L, y }));
    this.vx = this.vy = 0; this.heading = 0; this.trail.length = 0; this.parts.length = 0;
  }

  /* Steer the head toward (tx, ty). flow is how fast the air streams past, in pixels a second. */
  update(dt, tx, ty, flow = 0, k = 34, c = 8.5) {
    const S = this.segs, h = S[0], N = this.N, L = this.L;
    this.t += dt;
    this.vx += ((tx - h.x) * k - this.vx * c) * dt; this.vy += ((ty - h.y) * k - this.vy * c) * dt;
    h.x += this.vx * dt; h.y += this.vy * dt;
    this.heading = angLerp(this.heading, Math.atan2(this.vy, this.vx + flow + 60), 1 - Math.exp(-9 * dt));
    for (let i = 1; i < N; i++) {
      const s = S[i], p = S[i - 1];
      s.x -= flow * dt; s.y += 5 * dt;
      const dx = p.x - s.x, dy = p.y - s.y, d = Math.hypot(dx, dy) || 1;
      s.x = p.x - dx / d * L; s.y = p.y - dy / d * L;
    }
    const speed = Math.hypot(this.vx + flow, this.vy);
    this.flap += dt * (3.2 + Math.min(11, speed * 0.022 + this.boost * 1.6));
    this.jaw += (this.jawTarget - this.jaw) * (1 - Math.exp(-18 * dt));
    this.zap = Math.max(0, this.zap - dt * 3);

    // the trail: points left behind by the tail, carried away by the air
    const life = this.trailId === 'comet' ? 1.15 : 0.7;
    for (const p of this.trail) { p.x -= flow * dt; p.a += dt / life; }
    while (this.trail.length && this.trail[this.trail.length - 1].a >= 1) this.trail.pop();
    const tail = S[N - 1];
    this.trail.unshift({ x: tail.x, y: tail.y, a: 0 });
    if (this.trail.length > 90) this.trail.pop();

    const rate = { spark: 10, ember: 26, frost: 20, bolt: 8, comet: 16, prism: 22 }[this.trailId] * (0.35 + Math.min(1.6, speed / 260));
    if (Math.random() < rate * dt && this.parts.length < 70) {
      const cols = TRAILS[this.trailId].colors, id = this.trailId;
      this.parts.push({ x: tail.x, y: tail.y + (Math.random() - 0.5) * this.W, vx: -flow * 0.25 + (Math.random() - 0.5) * 50, vy: id === 'ember' ? -30 - Math.random() * 50 : id === 'frost' ? 20 + Math.random() * 30 : (Math.random() - 0.5) * 50,
        a: 0, life: 0.5 + Math.random() * 0.6, size: 1.5 + Math.random() * 2.6, color: id === 'prism' ? `hsl(${Math.random() * 360},100%,70%)` : cols[Math.random() < 0.5 ? 0 : 1], spin: Math.random() * TAU });
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.a += dt / p.life; p.x += (p.vx - flow * 0.75) * dt; p.y += p.vy * dt; p.spin += dt * 5;
      if (p.a >= 1) this.parts.splice(i, 1);
    }
  }

  head() { return this.segs[0]; }
  /* where the mouth is and which way it points, for fire and for catching things */
  mouth() {
    const h = this.segs[0], c = Math.cos(this.heading), s = Math.sin(this.heading), d = this.headS * 2.4;
    return { x: h.x + c * d, y: h.y + s * d, dx: c, dy: s };
  }

  draw(ctx) {
    const S = this.segs, N = this.N, W = this.W, L = this.L, pal = this.pal;
    // body points, with a wave that grows toward the tail
    const P = [], wv = 3.2 + Math.min(4, this.boost);
    for (let i = 0; i < N; i++) {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(N - 1, i + 1)];
      let tx = a.x - b.x, ty = a.y - b.y; const d = Math.hypot(tx, ty) || 1; tx /= d; ty /= d;
      const u = i / (N - 1), amp = W * 0.62 * Math.pow(u, 1.25) * Math.sin(this.t * wv - i * 0.52);
      const wid = W * (u < 0.2 ? 0.74 + 0.26 * Math.sin(u / 0.2 * Math.PI / 2) : 1 - 0.9 * Math.pow((u - 0.2) / 0.8, 1.1));
      const r = clamp(tx * 2.5, -1, 1);   // which way up this part of the body is: it rolls over when the dragon turns back
      P.push({ x: S[i].x + ty * amp, y: S[i].y - tx * amp, tx, ty, nx: ty, ny: -tx, ux: ty * r, uy: -tx * r, r, w: Math.max(1, wid), u });
    }
    const tip = P[N - 1], glow = pal.glow;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    this.drawTrail(ctx, tip);

    // far wing, behind the body
    const iw = Math.round(N * 0.17), wp = P[iw], wAng = Math.atan2(wp.ty, wp.tx);
    this.drawWing(ctx, wp, wAng, this.flap - 0.55, 0.9, 0.45);

    // soft light around the whole body
    ctx.globalCompositeOperation = 'lighter';
    const spine = () => { ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); for (let i = 1; i < N - 1; i++) ctx.quadraticCurveTo(P[i].x, P[i].y, (P[i].x + P[i + 1].x) / 2, (P[i].y + P[i + 1].y) / 2); ctx.lineTo(tip.x, tip.y); };
    spine(); ctx.strokeStyle = `rgba(${glow},0.07)`; ctx.lineWidth = W * 2 + 34; ctx.stroke();
    spine(); ctx.strokeStyle = `rgba(${glow},0.12)`; ctx.lineWidth = W * 2 + 14; ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // back fins
    const finH = W * [0.75, 0.95, 1.1, 1.3][this.stage];
    ctx.fillStyle = rgbMix(this.cf, this.cb, 0.15, 0.95);
    for (let i = 2; i < N - 2; i += 2) {
      const p = P[i], hgt = finH * Math.pow(Math.sin(Math.PI * Math.min(1, p.u * 1.15)), 0.6) * (0.9 + 0.1 * Math.sin(this.t * 4 - i));
      const bx = p.x + p.ux * p.w * 0.85, by = p.y + p.uy * p.w * 0.85;
      ctx.beginPath();
      ctx.moveTo(bx + p.tx * L * 0.75, by + p.ty * L * 0.75);
      ctx.lineTo(bx + p.ux * hgt - p.tx * hgt * 0.95, by + p.uy * hgt - p.ty * hgt * 0.95);
      ctx.lineTo(bx - p.tx * L * 0.75, by - p.ty * L * 0.75);
      ctx.closePath(); ctx.fill();
    }
    // tail blade
    ctx.beginPath();
    ctx.moveTo(tip.x + tip.tx * W * 0.4, tip.y + tip.ty * W * 0.4);
    ctx.lineTo(tip.x - tip.tx * W * 1.0 + tip.nx * W * 1.0, tip.y - tip.ty * W * 1.0 + tip.ny * W * 1.0);
    ctx.lineTo(tip.x - tip.tx * W * 3.0, tip.y - tip.ty * W * 3.0);
    ctx.lineTo(tip.x - tip.tx * W * 1.0 - tip.nx * W * 0.8, tip.y - tip.ty * W * 1.0 - tip.ny * W * 0.8);
    ctx.closePath(); ctx.fill();

    // legs, tucked back in flight
    ctx.strokeStyle = rgbMix(this.ca, this.cb, 0.55); ctx.lineWidth = W * 0.5;
    for (const f of [0.3, 0.6]) {
      const p = P[Math.round(N * f)], qx = p.x - p.ux * p.w * 0.7, qy = p.y - p.uy * p.w * 0.7;
      const kx = qx - p.tx * W * 0.9 - p.ux * W * 0.75, ky = qy - p.ty * W * 0.9 - p.uy * W * 0.75;
      const fx = kx - p.tx * W * 0.95 + p.ux * W * 0.1, fy = ky - p.ty * W * 0.95 + p.uy * W * 0.1;
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    }

    // the body: one tapered shape, coloured from head to tail
    const edge = side => { for (let i = 0; i < N; i++) { const p = P[side > 0 ? i : N - 1 - i]; ctx.lineTo(p.x + p.nx * p.w * side, p.y + p.ny * p.w * side); } };
    const g = ctx.createLinearGradient(P[0].x, P[0].y, tip.x, tip.y);
    g.addColorStop(0, pal.a); g.addColorStop(1, pal.b);
    ctx.beginPath(); ctx.moveTo(P[0].x + P[0].nx * P[0].w, P[0].y + P[0].ny * P[0].w); edge(1); ctx.lineTo(tip.x - tip.tx * 2, tip.y - tip.ty * 2); edge(-1); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = rgbMix(this.cb, [4, 6, 24], 0.45); ctx.lineWidth = 2; ctx.stroke();
    // lighter belly
    ctx.beginPath();
    for (let i = 0; i < N; i++) { const p = P[i]; ctx.lineTo(p.x - p.ux * p.w * 0.12, p.y - p.uy * p.w * 0.12); }
    for (let i = N - 1; i >= 0; i--) { const p = P[i]; ctx.lineTo(p.x - p.ux * p.w * 0.9, p.y - p.uy * p.w * 0.9); }
    ctx.closePath(); ctx.globalAlpha = 0.3; ctx.fillStyle = pal.belly; ctx.fill(); ctx.globalAlpha = 1;
    // a bright line along the flank
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    for (let i = 1; i < N - 2; i++) { const p = P[i]; ctx.lineTo(p.x + p.ux * p.w * 0.3, p.y + p.uy * p.w * 0.3); }
    ctx.strokeStyle = rgbMix(this.cf, [255, 255, 255], 0.3, 0.75); ctx.lineWidth = Math.max(1.2, W * 0.13); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    this.drawWing(ctx, wp, wAng, this.flap, 1, 1);
    this.drawHead(ctx, P[0]);
    ctx.restore();
  }

  drawTrail(ctx, tip) {
    const T = this.trail, id = this.trailId, cols = TRAILS[id].colors, n = T.length;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    if (n > 2) {
      const c0 = hexRgb(cols[0]), c1 = hexRgb(cols[1]);
      const base = id === 'comet' ? this.W * 0.95 : id === 'bolt' ? 2.2 : this.W * 0.5;
      const jit = id === 'bolt' ? 7 : 0, seed = Math.floor(this.t * 24);
      let px = tip.x, py = tip.y;
      for (let i = 1; i < n; i += 1) {
        const p = T[i], f = 1 - p.a;
        let x = p.x, y = p.y;
        if (jit) { const r = hash(i + seed * 7, 3) - 0.5; y += r * jit * 2 * (0.3 + p.a); x += (hash(i + seed * 3, 5) - 0.5) * 3; }
        ctx.strokeStyle = id === 'prism' ? `hsla(${(i * 10 + this.t * 160) % 360},100%,65%,${f * 0.8})` : rgbMix(c0, c1, Math.min(1, p.a * 1.6), f * f * (id === 'comet' ? 0.38 : 0.7));
        ctx.lineWidth = Math.max(0.6, base * (id === 'bolt' ? 1 : f));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        px = x; py = y;
      }
    }
    for (const p of this.parts) {
      const f = 1 - p.a;
      ctx.globalAlpha = f; ctx.fillStyle = p.color;
      const s = p.size * (0.5 + f * 0.7);
      if (id === 'frost' || id === 'spark') {
        ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 1.6); ctx.lineTo(p.x + s * 0.5, p.y); ctx.lineTo(p.x, p.y + s * 1.6); ctx.lineTo(p.x - s * 0.5, p.y); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(p.x - s * 1.6, p.y); ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x + s * 1.6, p.y); ctx.lineTo(p.x, p.y - s * 0.5); ctx.closePath(); ctx.fill();
      } else { ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  drawWing(ctx, p, ang, phase, size, alpha) {
    const Lw = this.wingLen * size, f = Math.sin(phase), sy = 0.2 + 0.8 * f + (f < 0 ? f * 0.25 : 0);
    ctx.save();
    const roll = p.r >= 0 ? Math.max(p.r, 0.3) : Math.min(p.r, -0.3);
    ctx.translate(p.x + p.ux * p.w * 0.55, p.y + p.uy * p.w * 0.55);
    ctx.rotate(ang + (-0.12 + Math.cos(phase) * 0.1) * Math.sign(roll));
    ctx.scale(1, sy * roll);
    const E = [-0.16 * Lw, -0.6 * Lw], T1 = [0.16 * Lw, -1.3 * Lw], T2 = [-0.66 * Lw, -1.12 * Lw], T3 = [-1.16 * Lw, -0.62 * Lw], R = [-0.72 * Lw, 0.02 * Lw];
    const shape = () => {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0.16 * Lw, -0.55 * Lw, T1[0], T1[1]);
      ctx.quadraticCurveTo(-0.16 * Lw, -0.92 * Lw, T2[0], T2[1]);
      ctx.quadraticCurveTo(-0.7 * Lw, -0.74 * Lw, T3[0], T3[1]);
      ctx.quadraticCurveTo(-0.76 * Lw, -0.26 * Lw, R[0], R[1]);
      ctx.closePath();
    };
    const g = ctx.createLinearGradient(0, 0, T2[0], T2[1]);
    g.addColorStop(0, rgbMix(this.ca, this.cf, 0.3, 0.85 * alpha)); g.addColorStop(1, rgbMix(this.cf, this.cb, 0.25, 0.34 * alpha));
    shape(); ctx.fillStyle = g; ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    shape(); ctx.strokeStyle = rgbMix(this.cf, [255, 255, 255], 0.2, 0.8 * alpha); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(E[0], E[1]); ctx.lineTo(T1[0], T1[1]); ctx.moveTo(E[0], E[1]); ctx.lineTo(T2[0], T2[1]); ctx.moveTo(E[0], E[1]); ctx.lineTo(T3[0], T3[1]);
    ctx.strokeStyle = rgbMix(this.cf, [255, 255, 255], 0.45, 0.7 * alpha); ctx.lineWidth = Math.max(1.4, this.W * 0.2); ctx.stroke();
    ctx.restore();
  }

  drawHead(ctx, p) {
    const s = this.headS, pal = this.pal, t = this.t;
    const dark = rgbMix(this.cb, [4, 6, 24], 0.45), bone = rgbMix(this.cf, [255, 255, 255], 0.55);
    ctx.save();
    const hr = clamp(Math.cos(this.heading) * 2.5, -1, 1), roll = hr >= 0 ? Math.max(hr, 0.4) : Math.min(hr, -0.4);
    ctx.translate(p.x, p.y); ctx.rotate(this.heading); ctx.scale(s, s * roll);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const poly = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
    const horn = (pts, fill, a = 1) => { ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); ctx.quadraticCurveTo(pts[6], pts[7], pts[8], pts[9]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.globalAlpha = 1; };

    // glow behind the head
    ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(0.6, 0, 0, 0.6, 0, 4.2);
    gg.addColorStop(0, `rgba(${pal.glow},0.28)`); gg.addColorStop(1, `rgba(${pal.glow},0)`);
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0.6, 0, 4.2, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // far horn and the frill behind the jaw
    const c = this.crest;
    if (c === 'twin') horn([-0.1, -0.78, -1.9, -1.5, -3.5, -1.0, -1.8, -1.0, -0.7, -0.62], bone, 0.5);
    else if (c !== 'blade' && c !== 'spikes' && c !== 'antlers') horn([-0.1, -0.78, -1.2, -1.55, -2.3, -1.2, -1.3, -1.05, -0.7, -0.62], bone, 0.5);
    ctx.fillStyle = rgbMix(this.cf, this.cb, 0.2, 0.95);
    for (let k = 0; k < 3; k++) { const y = -0.35 + k * 0.42, w = Math.sin(t * 3 + k) * 0.08; poly([[-0.85, y - 0.22], [-2.0 - k * 0.12, y + 0.2 + w], [-0.9, y + 0.24]]); ctx.fill(); }

    // jaw, which opens for fire
    ctx.save();
    ctx.translate(-0.2, 0.3); ctx.rotate(this.jaw * 0.5);
    if (this.jaw > 0.05) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,170,60,${this.jaw * 0.8})`; poly([[0.2, -0.05], [2.3, -0.05], [2.2, 0.3], [0.3, 0.3]]); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    poly([[0, -0.02], [2.3, 0.02], [1.85, 0.34], [0.3, 0.52]]);
    ctx.fillStyle = rgbMix(this.ca, this.cb, 0.35); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 0.13; ctx.stroke();
    ctx.restore();

    // skull
    const skull = [[-1.7, -0.56], [-0.9, -0.84], [0.35, -0.94], [1.75, -0.44], [2.52, -0.12], [2.44, 0.2], [1.0, 0.28], [-0.1, 0.74], [-0.95, 0.66], [-1.7, 0.5]];
    const hg = ctx.createLinearGradient(2.5, 0, -1.2, 0);
    hg.addColorStop(0, rgbMix(this.ca, [255, 255, 255], 0.28)); hg.addColorStop(1, pal.a);
    poly(skull); ctx.fillStyle = hg; ctx.fill();
    ctx.beginPath(); skull.slice(0, 9).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = dark; ctx.lineWidth = 0.13; ctx.stroke();
    poly([[1.75, -0.44], [2.52, -0.12], [2.44, 0.2], [1.2, 0.26], [1.5, -0.1]]); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
    poly([[2.0, -0.34], [2.16, -0.82], [2.4, -0.18]]); ctx.fillStyle = bone; ctx.fill();
    poly([[-0.2, 0.68], [-0.75, 1.12], [-0.9, 0.62]]); ctx.fillStyle = rgbMix(this.cf, this.cb, 0.2); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(2.2, -0.06, 0.09, 0.06, -0.3, 0, TAU); ctx.fill();

    // crest
    if (c === 'blade') { poly([[0.5, -0.9], [-3.1, -2.35], [-1.0, -0.72]]); ctx.fillStyle = rgbMix(this.cf, [255, 255, 255], 0.25); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 0.1; ctx.stroke(); }
    else if (c === 'twin') horn([-0.3, -0.84, -2.1, -1.9, -3.9, -1.55, -2.0, -1.4, -0.95, -0.72], bone);
    else if (c === 'spikes') { ctx.fillStyle = bone; for (let k = 0; k < 5; k++) { const x = 0.5 - k * 0.42; poly([[x, -0.9 + k * 0.02], [x - 0.75, -1.75 - (k === 2 ? 0.45 : k % 2 ? 0.2 : 0)], [x - 0.42, -0.82]]); ctx.fill(); } }
    else if (c === 'antlers') {
      ctx.strokeStyle = bone; ctx.lineWidth = 0.2;
      ctx.beginPath(); ctx.moveTo(-0.3, -0.82); ctx.lineTo(-1.2, -1.9); ctx.lineTo(-2.6, -2.5); ctx.moveTo(-0.85, -1.48); ctx.lineTo(-0.5, -2.3); ctx.moveTo(-1.2, -1.9); ctx.lineTo(-1.25, -2.85); ctx.moveTo(-1.9, -2.2); ctx.lineTo(-2.2, -3.1); ctx.stroke();
      ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(0.1, -0.84); ctx.lineTo(-0.6, -1.8); ctx.lineTo(-1.8, -2.25); ctx.moveTo(-0.6, -1.8); ctx.lineTo(-0.5, -2.6); ctx.stroke(); ctx.globalAlpha = 1;
    } else horn([-0.35, -0.84, -1.5, -1.8, -2.7, -1.55, -1.6, -1.25, -0.95, -0.72], bone);
    if (c === 'halo') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,220,120,.35)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(-0.5, -2.45 + Math.sin(t * 2) * 0.08, 1.25, 0.36, -0.08, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 0.16; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    // eye
    ctx.globalCompositeOperation = 'lighter';
    const eg = ctx.createRadialGradient(0.92, -0.34, 0, 0.92, -0.34, 0.95);
    eg.addColorStop(0, `rgba(${pal.glow},0.9)`); eg.addColorStop(1, `rgba(${pal.glow},0)`);
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(0.92, -0.34, 0.95, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const blink = (t % 4.6) > 4.48 ? 0.15 : 1;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0.42, -0.4); ctx.quadraticCurveTo(0.95, -0.4 - 0.34 * blink, 1.42, -0.26); ctx.quadraticCurveTo(0.9, -0.26 + 0.2 * blink, 0.42, -0.4); ctx.fill();
    ctx.fillStyle = '#0a0d2a'; ctx.beginPath(); ctx.ellipse(1.02, -0.36, 0.08, 0.16 * blink, 0.1, 0, TAU); ctx.fill();
    poly([[0.05, -0.9], [1.62, -0.5], [1.5, -0.4], [0.2, -0.66]]); ctx.fillStyle = rgbMix(this.ca, this.cb, 0.6); ctx.fill();

    // whiskers that trail in the wind
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgbMix(this.cf, [255, 255, 255], 0.4, 0.85); ctx.lineWidth = 0.07;
    const lag = Math.min(1.4, Math.hypot(this.vx, this.vy) * 0.004 + this.boost * 0.12);
    for (const k of [0, 1]) {
      const sway = Math.sin(t * 3.3 + k * 1.7) * 0.28;
      ctx.beginPath(); ctx.moveTo(2.2, 0.06 + k * 0.1);
      ctx.quadraticCurveTo(1.6, 1.0 + k * 0.35 + sway, -0.4 - lag - k * 0.5, 1.15 + k * 0.5 + sway * 1.6); ctx.stroke();
    }
    if (this.zap > 0) { ctx.fillStyle = `rgba(255,80,110,${this.zap * 0.5})`; poly(skull); ctx.fill(); }
    ctx.restore();
  }
}

/* Small live dragons inside the page (shop preview, pop-ups). Any <canvas class="dv"> gets one. */
const DragonViews = {
  list: document.getElementsByClassName('dv'),
  look(el) {
    const S = Store.get(), d = el.dataset;
    return { color: d.color || S.pet.color, stage: d.stage != null ? +d.stage : Store.stage(), trail: d.trail || S.pet.trail, crest: d.crest || S.pet.crest };
  },
  tick(dt) {
    for (const el of this.list) {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) continue;
      const k = Math.min(2, (window.devicePixelRatio || 1) * App.scale);
      if (!el._d) { el.width = Math.round(w * k); el.height = Math.round(h * k); el._d = new Dragon(this.look(el)); el._d.place(w * 0.74, h * 0.45); el._look = ''; }
      const key = JSON.stringify(el.dataset);
      if (key !== el._look) { el._look = key; el._d.setLook(this.look(el)); }
      const d = el._d, z = +el.dataset.zoom || 1, ctx = el.getContext('2d');
      const cx = w / z * 0.74, cy = h / z * 0.45;
      d.boost = 0.6;
      d.update(dt, cx + Math.sin(d.t * 0.9) * 10, cy + Math.sin(d.t * 1.7) * h / z * 0.1, 90);
      ctx.setTransform(k * z, 0, 0, k * z, 0, 0); ctx.clearRect(0, 0, w / z, h / z);
      d.draw(ctx);
    }
  },
};
