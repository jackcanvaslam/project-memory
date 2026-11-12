/* Dragon Keys - sound and music, all made in the browser so there are no files to load.
   Each world has its own theme. The music is built in layers that come in as "energy" rises:
   right keys push the energy up and play rising notes in the tune's key, a wrong key drops
   the energy, muffles the mix and plays a low note. */
'use strict';

const Sound = (() => {
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const Q = { maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], maj: [0, 4, 7], min: [0, 3, 7], sus4: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 14] };
  const _ = -1;

  /* lead tunes: [eighth-note position within 4 bars, semitones from the tonic, length in eighths] */
  const tune = list => { const m = {}; list.forEach(([pos, note, len = 1]) => { m[pos] = [note, len]; }); return m; };

  const THEMES = {
    /* the lair: slow, open, no drums */
    home: { bpm: 72, root: 53, prog: [[0, 'maj7'], [-3, 'm7'], [-7, 'maj7'], [-5, 'sus4']], swing: 0,
      padCut: 900, padVol: 0.05, arpVoice: 'bell', arpOct: 1, arpLen: 6, arpVol: 0.07, arp: [0, _, _, _, 2, _, _, _, 1, _, _, _, 3, _, _, _],
      bass: [0, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _], bassLen: 12, bassVol: 0.16, bassCut: 500,
      kick: [], snare: [], hat: [], snareType: 'rim', leadVoice: 'bell', leadOct: 2, leadVol: 0.07, keyVoice: 'bell', keyOct: 2,
      lead: tune([[4, 4, 3], [12, 7, 3], [20, 0, 3], [28, 2, 4]]) },
    /* Moonlit Meadow: warm and unhurried, C major, a soft swing */
    meadow: { bpm: 84, root: 48, prog: [[0, 'maj7'], [-3, 'm7'], [5, 'maj7'], [7, 'add9']], swing: 0.16,
      padCut: 1100, padVol: 0.046, arpVoice: 'pluck', arpOct: 1, arpLen: 2.2, arpVol: 0.085, arp: [0, _, 1, _, 2, _, 1, _, 3, _, 2, _, 1, _, 2, _],
      bass: [0, _, _, _, _, _, 0, _, 0, _, _, _, _, _, 7, _], bassLen: 3, bassVol: 0.2, bassCut: 520,
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1], snareType: 'rim',
      leadVoice: 'bell', leadOct: 2, leadVol: 0.075, keyVoice: 'pluck', keyOct: 2,
      lead: tune([[0, 4], [2, 7], [4, 12, 2], [6, 11], [7, 7], [8, 9], [10, 12], [12, 16, 2], [14, 14], [15, 12], [16, 9], [18, 12], [20, 5, 2], [22, 9, 2], [24, 7], [26, 11], [28, 14, 4]]) },
    /* Sky Peaks: soaring, D major, a pulsing bass and a long singing lead */
    peaks: { bpm: 100, root: 50, prog: [[-3, 'm7'], [5, 'maj7'], [0, 'add9'], [7, 'sus4']], swing: 0,
      padCut: 1500, padVol: 0.042, arpVoice: 'saw', arpOct: 1, arpLen: 1.3, arpVol: 0.05, arp: [0, 1, 2, 3, 1, 2, 3, 4, 0, 1, 2, 3, 2, 3, 4, 5],
      bass: [0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 12, _], bassLen: 1.6, bassVol: 0.19, bassCut: 800,
      kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1], snareType: 'snare',
      leadVoice: 'lead', leadOct: 2, leadVol: 0.07, keyVoice: 'saw', keyOct: 2,
      lead: tune([[0, 4, 4], [4, 7, 2], [6, 9, 2], [8, 12, 4], [12, 11, 2], [14, 7, 2], [16, 4, 4], [20, 2, 2], [22, 0, 2], [24, 2, 6]]) },
    /* Crystal Cave: glassy and mysterious, E minor, bells with long echoes */
    cave: { bpm: 92, root: 52, prog: [[0, 'm9'], [-4, 'maj7'], [5, 'm7'], [7, 'm7']], swing: 0,
      padCut: 1000, padVol: 0.044, arpVoice: 'bell', arpOct: 1, arpLen: 5, arpVol: 0.07, arp: [0, _, _, 2, _, _, 1, _, _, _, 3, _, 2, _, 1, _],
      bass: [0, _, _, _, _, _, _, _, _, _, 0, _, _, _, _, _], bassLen: 7, bassVol: 0.22, bassCut: 380,
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], snareType: 'clap',
      leadVoice: 'bell', leadOct: 2, leadVol: 0.085, keyVoice: 'bell', keyOct: 2, drips: true,
      lead: tune([[0, 7, 3], [3, 3, 3], [6, 0, 2], [8, -2, 3], [11, 0, 3], [14, 3, 2], [16, 5, 3], [19, 3, 3], [22, 0, 2], [24, 2, 4], [28, -2, 4]]) },
    /* Night Citadel: a heroic march, C minor, snare rolls and a brass fanfare */
    castle: { bpm: 108, root: 48, prog: [[0, 'min'], [-4, 'maj'], [3, 'maj'], [-2, 'maj']], swing: 0,
      padCut: 1700, padVol: 0.046, arpVoice: 'pulse', arpOct: 1, arpLen: 1, arpVol: 0.045, arp: [0, _, 2, _, 3, _, 2, _, 0, _, 2, _, 3, _, 4, _],
      bass: [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, _, 7, 12], bassLen: 1.5, bassVol: 0.19, bassCut: 700,
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1], hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], snareType: 'snare',
      leadVoice: 'brass', leadOct: 2, leadVol: 0.075, keyVoice: 'pulse', keyOct: 2,
      lead: tune([[0, -5], [1, -5], [2, 0, 2], [4, 3, 2], [6, 2], [7, 0], [8, 3, 4], [12, 0, 4], [16, -2], [17, -2], [18, 3, 2], [20, 7, 2], [22, 5], [23, 3], [24, 2, 4], [28, 5, 4]]) },
    /* Dragon Summit: fast and driving, A minor, a rolling bass and four-on-the-floor */
    summit: { bpm: 124, root: 45, prog: [[0, 'min'], [-4, 'maj'], [5, 'min'], [7, 'maj']], swing: 0,
      padCut: 1900, padVol: 0.044, arpVoice: 'saw', arpOct: 2, arpLen: 1.1, arpVol: 0.042, arp: [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 4, 3, 2],
      bass: [0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 12, 7], bassLen: 0.9, bassVol: 0.17, bassCut: 900,
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 1], snareType: 'snare',
      leadVoice: 'lead', leadOct: 3, leadVol: 0.062, keyVoice: 'saw', keyOct: 2,
      lead: tune([[0, 0], [2, 3], [4, 7, 2], [6, 5], [7, 3], [8, 0, 4], [12, 3, 4], [16, -4], [18, 0], [20, 5, 2], [22, 3], [23, 0], [24, -1, 4], [28, 2, 2], [30, 7, 2]]) },
  };
  /* boss fights: fast and heavy, D minor, with a brass call */
  THEMES.boss = { bpm: 132, root: 50, prog: [[0, 'min'], [-4, 'maj'], [5, 'min'], [7, 'maj']], swing: 0,
    padCut: 2000, padVol: 0.044, arpVoice: 'saw', arpOct: 1, arpLen: 1, arpVol: 0.044, arp: [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 3, 2, 4, 3, 2, 1],
    bass: [0, _, 0, 0, 12, _, 0, 0, 0, _, 0, 0, 12, _, 7, 12], bassLen: 0.9, bassVol: 0.18, bassCut: 950,
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], hat: [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1], snareType: 'snare',
    leadVoice: 'brass', leadOct: 2, leadVol: 0.07, keyVoice: 'saw', keyOct: 2,
    lead: tune([[0, 0], [1, 0], [2, 3], [4, 7, 2], [6, 5], [7, 3], [8, -4, 3], [11, 0], [12, 3, 4], [16, 5], [17, 5], [18, 8], [20, 12, 2], [22, 10], [23, 8], [24, 7, 3], [27, 11], [28, 14, 4]]) };
  const LAYERS = ['pad', 'arp', 'bass', 'hat', 'kick', 'snare', 'lead'];
  /* how loud each layer is for a given energy between 0 and 1 */
  const layerLevel = (name, e) => ({ pad: 0.75 + 0.25 * e, arp: smooth(0.08, 0.2, e), bass: smooth(0.2, 0.34, e), hat: smooth(0.3, 0.44, e) * 0.9,
    kick: smooth(0.42, 0.56, e), snare: smooth(0.56, 0.7, e), lead: smooth(0.72, 0.86, e) })[name];
  const cutoffFor = e => 900 * Math.pow(20000 / 900, 0.3 + 0.7 * e);

  /* One engine per audio context, so the same code can play live or render to a buffer for testing */
  class Engine {
    constructor(ctx) {
      const c = this.ctx = ctx;
      const gain = (v, to) => { const g = c.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
      this.comp = c.createDynamicsCompressor();
      this.comp.threshold.value = -15; this.comp.knee.value = 14; this.comp.ratio.value = 5; this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
      this.master = gain(1.1, c.destination); this.comp.connect(this.master);
      this.sfx = gain(1, this.comp);
      this.musicVol = gain(1, this.comp);
      this.duck = gain(1, this.musicVol);
      this.filter = c.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.Q.value = 0.7; this.filter.frequency.value = 20000; this.filter.connect(this.duck);
      this.cut = 20000;
      // a room for the music to sit in
      const sr = c.sampleRate, len = Math.floor(sr * 2.4), ir = c.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      this.rev = c.createConvolver(); this.rev.buffer = ir; this.rev.connect(gain(0.5, this.filter));
      // an echo for the typing notes
      this.echo = c.createDelay(1); this.echo.delayTime.value = 0.21;
      const fb = gain(0.3, this.echo); this.echo.connect(fb); this.echo.connect(gain(0.3, this.sfx));
      this.keyBus = gain(1, this.sfx); this.keyBus.connect(this.echo);
      this.noise = c.createBuffer(1, sr, sr);
      { const d = this.noise.getChannelData(0); for (let i = 0; i < sr; i++) d[i] = Math.random() * 2 - 1; }
      this.th = null; this.L = null; this.cur = { croot: 60, q: Q.maj }; this.stepDur = 0.2; this.energy = 0.15; this.tension = 0;
    }

    /* switch world: the old theme fades out on its own set of layers, the new one starts clean */
    setTheme(id, t = this.ctx.currentTime) {
      const c = this.ctx, old = this.L;
      if (old) { old.bus.gain.setTargetAtTime(0, t, 0.09); setTimeout(() => { try { old.bus.disconnect(); } catch (e) { /* already gone */ } }, 1500); }
      const th = this.th = THEMES[id] || THEMES.home;
      this.stepDur = 60 / th.bpm / 4;
      const bus = c.createGain(); bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + 0.35); bus.connect(this.filter);
      const send = c.createGain(); send.gain.value = 0.3; send.connect(this.rev);
      const wet = c.createGain(); wet.connect(bus); wet.connect(send);
      const delay = c.createDelay(1.5); delay.delayTime.value = 60 / th.bpm * 0.75;
      const fb = c.createGain(); fb.gain.value = 0.34; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      delay.connect(lp); lp.connect(fb); fb.connect(delay);
      const dOut = c.createGain(); dOut.gain.value = 0.36; lp.connect(dOut); dOut.connect(wet);
      const L = this.L = { bus, wet, delay };
      for (const name of LAYERS) {
        const g = c.createGain(); g.gain.value = layerLevel(name, this.energy);
        g.connect(name === 'bass' || name === 'kick' || name === 'hat' ? bus : wet);
        if (name === 'arp' || name === 'lead') g.connect(delay);
        L[name] = g;
      }
      L.tense = c.createGain(); L.tense.connect(bus);
      L.padFilter = c.createBiquadFilter(); L.padFilter.type = 'lowpass'; L.padFilter.Q.value = 0.5; L.padFilter.frequency.value = th.padCut * (0.8 + this.energy * 1.6); L.padFilter.connect(L.pad);
      const ch = th.prog[0]; this.cur = { croot: th.root + ch[0], q: Q[ch[1]] };
    }

    applyEnergy(e, t = this.ctx.currentTime, tau = 0.2) {
      this.energy = e;
      if (!this.L) return;
      for (const name of LAYERS) this.L[name].gain.setTargetAtTime(layerLevel(name, e), t, tau);
      this.L.padFilter.frequency.setTargetAtTime(this.th.padCut * (0.8 + e * 1.6), t, tau);
      this.cut = cutoffFor(e);
      if (!(this.dipUntil > t)) this.filter.frequency.setTargetAtTime(this.cut, t, tau);
    }

    /* ---- instruments ---- */
    voice(kind, f, t, dur, vol, dest) {
      const c = this.ctx, g = c.createGain(); g.connect(dest);
      const osc = (type, freq, detune = 0) => { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune; o.start(t); return o; };
      const stopAt = t + dur * 1.7 + 0.1, stop = (...os) => os.forEach(o => o.stop(stopAt));
      const pluckEnv = (a = 0.004) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.6); };
      if (kind === 'bell') {
        const car = osc('sine', f), mod = osc('sine', f * 3.01), mg = c.createGain();
        mg.gain.setValueAtTime(f * 2.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.9);
        mod.connect(mg); mg.connect(car.frequency); car.connect(g); pluckEnv(0.003); stop(car, mod);
      } else if (kind === 'pluck') {
        const a = osc('triangle', f), b = osc('sine', f * 2), bg = c.createGain(); bg.gain.value = 0.25;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + dur);
        a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); pluckEnv(); stop(a, b);
      } else if (kind === 'saw') {
        const a = osc('sawtooth', f, -7), b = osc('sawtooth', f, 7);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(Math.min(11000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.6), t + dur * 1.1);
        a.connect(lp); b.connect(lp); lp.connect(g); pluckEnv(); stop(a, b);
      } else if (kind === 'pulse') {
        const a = osc('square', f), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(6000, f * 6);
        a.connect(lp); lp.connect(g); pluckEnv(); stop(a);
      } else { // 'lead' and 'brass': held notes with a little vibrato
        const a = osc('sawtooth', f, -5), b = osc(kind === 'brass' ? 'sawtooth' : 'square', f, 5), bg = c.createGain(); bg.gain.value = kind === 'brass' ? 1 : 0.4;
        const lfo = osc('sine', 5.4), lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.4, dur));
        lfo.connect(lg); lg.connect(a.frequency); lg.connect(b.frequency);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.4;
        lp.frequency.setValueAtTime(kind === 'brass' ? 500 : 1400, t); lp.frequency.exponentialRampToValueAtTime(kind === 'brass' ? 3000 : 4200, t + 0.07);
        a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + Math.max(0.04, dur * 0.8)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.25);
        stop(a, b, lfo);
      }
    }
    pad(notes, t, dur) {
      const c = this.ctx, th = this.th;
      for (const n of notes) {
        const g = c.createGain(); g.connect(this.L.padFilter);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(th.padVol, t + 0.4); g.gain.setValueAtTime(th.padVol, t + dur - 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.7);
        for (const det of [-9, 9]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = midi(n); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + dur + 0.8); }
      }
    }
    bass(f, t, dur) {
      const c = this.ctx, th = this.th, g = c.createGain(); g.connect(this.L.bass);
      const a = c.createOscillator(); a.type = 'sawtooth'; a.frequency.value = f;
      const s = c.createOscillator(); s.type = 'sine'; s.frequency.value = f;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3; lp.frequency.setValueAtTime(th.bassCut, t); lp.frequency.exponentialRampToValueAtTime(Math.max(90, th.bassCut * 0.3), t + dur);
      a.connect(lp); lp.connect(g); s.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(th.bassVol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.15);
      a.start(t); s.start(t); a.stop(t + dur * 1.2 + 0.05); s.stop(t + dur * 1.2 + 0.05);
    }
    noiseHit(t, dur, vol, type, freq, q, dest, sweepTo) {
      const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(dest); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    }
    tone(f, t, dur, vol, dest, type = 'sine', slideTo = 0) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
    }
    kick(t) { this.tone(165, t, 0.3, 0.62, this.L.kick, 'sine', 42); this.noiseHit(t, 0.02, 0.12, 'highpass', 2000, 0.7, this.L.kick); }
    snare(t, kind) {
      const d = this.L.snare;
      if (kind === 'rim') { this.tone(820, t, 0.05, 0.14, d, 'triangle'); this.noiseHit(t, 0.035, 0.1, 'bandpass', 2600, 2, d); }
      else if (kind === 'clap') { for (let i = 0; i < 3; i++) this.noiseHit(t + i * 0.012, 0.09 + (i === 2 ? 0.14 : 0), 0.16, 'bandpass', 1300, 1.2, d); }
      else { this.noiseHit(t, 0.17, 0.26, 'bandpass', 1900, 0.8, d); this.tone(200, t, 0.09, 0.18, d, 'triangle', 150); }
    }
    hat(t, open) { this.noiseHit(t, open ? 0.2 : 0.04, open ? 0.07 : 0.06, 'highpass', 7600, 0.8, this.L.hat); }

    /* one sixteenth-note step of the current theme */
    step(s, t) {
      const th = this.th, st = s % 16, bar = Math.floor(s / 16), ch = th.prog[bar % th.prog.length], sd = this.stepDur;
      const croot = th.root + ch[0], q = Q[ch[1]];
      this.cur = { croot, q };
      if (st % 2 && th.swing) t += th.swing * sd;
      if (st === 0) this.pad(q.map(i => croot + i), t, sd * 16);
      const b = th.bass[st]; if (b >= 0) this.bass(midi(croot - 12 + b), t, sd * th.bassLen);
      const a = th.arp[st];
      if (a >= 0) this.voice(th.arpVoice, midi(croot + 12 * th.arpOct + q[a % q.length] + 12 * Math.floor(a / q.length)), t, sd * th.arpLen, th.arpVol * (st % 4 ? 0.8 : 1), this.L.arp);
      if (th.kick[st]) this.kick(t);
      if (th.snare[st]) this.snare(t, th.snareType);
      if (th.hat[st]) this.hat(t, th.hat[st] === 2);
      if (st % 2 === 0) { const n = th.lead[(bar % 4) * 8 + st / 2]; if (n) this.voice(th.leadVoice, midi(th.root + th.leadOct * 12 + n[0]), t, sd * 2 * n[1] * 0.9, th.leadVol, this.L.lead); }
      if (this.tension > 0.05) {   // low on life: a heartbeat under the music and an uneasy high ping
        if (st % 8 === 0 || st % 8 === 2) this.tone(st % 8 ? 54 : 64, t, 0.17, 0.4 * this.tension, this.L.tense, 'sine', 38);
        if (st % 8 === 4) this.voice('pulse', midi(th.root + 37), t, 0.12, 0.02 * this.tension, this.L.tense);
      }
      if (th.drips && (s * 7 + bar * 3) % 23 === 0) this.voice('bell', midi(th.root + 48 + [0, 3, 7, 10][(s >> 2) % 4]), t + sd * 0.5, 0.5, 0.03, this.L.arp);
    }

    /* the notes of the chord playing right now, low to high, for the typing sounds */
    ladder(oct) {
      const { croot, q } = this.cur, set = new Set();
      for (let o = 0; o < 3; o++) for (const iv of q) set.add(croot + 12 * (oct + o) + (iv % 12));
      return [...set].sort((x, y) => x - y);
    }
    /* a right key: the next note up. It climbs through the word and starts higher as the streak grows. */
    key(i, streak, t = this.ctx.currentTime) {
      const th = this.th || THEMES.home, lad = this.ladder(th.keyOct), lift = Math.min(4, Math.floor(streak / 12));
      const n = lad[Math.min(lad.length - 1, (i % 7) + lift)];
      this.voice(th.keyVoice, midi(n), t, 0.16, 0.13 + Math.min(0.05, streak * 0.001), this.keyBus);
      if (streak >= 25) this.tone(midi(n + 12), t, 0.12, 0.03, this.keyBus);
    }
    /* a wrong key: a low falling note, and the whole mix goes dull for a moment */
    miss(t = this.ctx.currentTime) {
      const f = midi(this.cur.croot - 12), c = this.ctx;
      const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.34);
      lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.34, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(lp); lp.connect(g); g.connect(this.sfx); o.start(t); o.stop(t + 0.45);
      this.tone(92, t, 0.2, 0.3, this.sfx, 'sine', 48);
      this.dip(t);
    }
    /* muffle and duck the music for a moment */
    dip(t = this.ctx.currentTime, len = 1.2, depth = 0.5) {
      this.filter.frequency.cancelScheduledValues(t); this.filter.frequency.setValueAtTime(260, t);
      this.filter.frequency.exponentialRampToValueAtTime(Math.max(600, this.cut), t + len);
      this.dipUntil = t + len;
      this.duck.gain.cancelScheduledValues(t); this.duck.gain.setValueAtTime(depth, t); this.duck.gain.linearRampToValueAtTime(1, t + len * 0.6);
    }
    chordHit(t, kind, vol, up = 1, dur = 0.5) { const { croot, q } = this.cur; q.forEach((iv, i) => this.voice(kind, midi(croot + 12 * up + iv), t + i * 0.012, dur, vol, this.keyBus)); }
    run(t, notes, gap, kind = 'bell', vol = 0.13, dur = 0.3) { const lad = this.ladder((this.th || THEMES.home).keyOct); notes.forEach((n, i) => this.voice(kind, midi(lad[Math.min(lad.length - 1, n)]), t + i * gap, dur, vol, this.keyBus)); }
  }

  /* ---------------- the live player ---------------- */
  let ac = null, eng = null, sfxOn = true, musicOn = true, themeId = 'home', wanted = 'home';
  let energy = 0.15, stepN = 0, nextTime = 0, timer = 0;
  const MUSIC_LEVEL = 0.6;

  function ensure() {
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ac = new AC(); eng = new Engine(ac);
        eng.sfx.gain.value = sfxOn ? 1 : 0; eng.musicVol.gain.value = musicOn ? MUSIC_LEVEL : 0;
        eng.energy = energy; eng.setTheme(wanted); themeId = wanted; stepN = 0; nextTime = 0;
        timer = setInterval(pump, 30);
      }
      if (ac.state === 'suspended') ac.resume();
      return ac.state === 'running';
    } catch (e) { return false; }
  }
  function pump() {
    if (!eng || !musicOn || ac.state !== 'running' || document.hidden) return;
    const now = ac.currentTime;
    if (nextTime < now) nextTime = now + 0.06;
    while (nextTime < now + 0.15) { eng.step(stepN, nextTime); nextTime += eng.stepDur; stepN++; }
    eng.applyEnergy(energy, now);
  }
  const live = fn => (...a) => { if (ensure()) fn(...a); };
  const now = () => ac.currentTime;

  const api = {
    unlock() { ensure(); },
    /* choose the world's theme. Safe to call before the first key press. */
    music(id) {
      wanted = THEMES[id] ? id : 'home';
      if (!eng || wanted === themeId) return;
      themeId = wanted; eng.setTheme(themeId); stepN = 0; nextTime = ac.currentTime + 0.12;
    },
    setEnergy(e) { energy = Math.max(0, Math.min(1, e)); },
    setTension(v) { if (eng) eng.tension = Math.max(0, Math.min(1, v)); },
    get energy() { return energy; },
    setOn(v) { sfxOn = v; if (eng) eng.sfx.gain.setTargetAtTime(v ? 1 : 0, ac.currentTime, 0.03); },
    setMusic(v) { musicOn = v; if (eng) { eng.musicVol.gain.setTargetAtTime(v ? MUSIC_LEVEL : 0, ac.currentTime, 0.12); nextTime = 0; } },
    get on() { return sfxOn; }, get musicOn() { return musicOn; },

    key: live((i, streak) => eng.key(i, streak || 0)),
    miss: live(() => eng.miss()),
    word: live(() => eng.run(now(), [5, 7], 0.05, 'bell', 0.09, 0.25)),
    gem: live(() => eng.run(now(), [4, 6, 8], 0.055, 'bell', 0.11, 0.4)),
    milestone: live(() => { const t = now(); eng.noiseHit(t, 0.4, 0.12, 'highpass', 900, 0.8, eng.sfx, 9000); eng.noiseHit(t + 0.36, 1.1, 0.13, 'highpass', 5200, 0.6, eng.sfx); eng.chordHit(t + 0.36, 'saw', 0.07, 2, 0.5); }),
    click: live(() => { eng.tone(620, now(), 0.06, 0.09, eng.sfx, 'triangle', 930); }),
    pop: live(() => { eng.tone(340, now(), 0.09, 0.12, eng.sfx, 'sine', 760); }),
    whoosh: live(() => eng.noiseHit(now(), 0.32, 0.1, 'bandpass', 500, 0.9, eng.sfx, 2800)),
    star: live(i => { eng.run(now(), [2 + i * 2], 0, 'bell', 0.2, 0.7); eng.noiseHit(now(), 0.3, 0.05, 'highpass', 6000, 0.7, eng.sfx); }),
    fanfare: live(() => { const t = now(); eng.run(t, [0, 2, 4, 6, 8, 10], 0.09, 'saw', 0.09, 0.3); eng.chordHit(t + 0.6, 'saw', 0.085, 1, 1.1); eng.chordHit(t + 0.6, 'bell', 0.07, 2, 1.4); eng.noiseHit(t + 0.6, 1.4, 0.1, 'highpass', 5000, 0.6, eng.sfx); }),
    almost: live(() => { const t = now(); eng.run(t, [5, 3, 1], 0.17, 'pluck', 0.12, 0.4); eng.tone(midi(eng.cur.croot - 12), t + 0.5, 0.7, 0.14, eng.sfx, 'triangle'); }),
    fire: live(() => { const t = now(); eng.noiseHit(t, 0.5, 0.2, 'bandpass', 1000, 0.7, eng.sfx, 180); eng.tone(120, t, 0.4, 0.07, eng.sfx, 'sawtooth', 60); }),
    crack: live(() => { const t = now(); eng.noiseHit(t, 0.08, 0.3, 'bandpass', 3200, 2, eng.sfx, 900); eng.tone(260, t, 0.07, 0.06, eng.sfx, 'square', 130); }),
    hatch: live(() => { const t = now(); eng.noiseHit(t, 0.4, 0.3, 'bandpass', 2600, 0.8, eng.sfx, 300); eng.run(t + 0.1, [0, 2, 4, 6, 8, 10, 11], 0.07, 'bell', 0.13, 0.5); eng.chordHit(t + 0.62, 'saw', 0.07, 1, 1.2); }),
    buy: live(() => eng.run(now(), [3, 5, 7], 0.07, 'pulse', 0.07, 0.2)),
    equip: live(() => eng.run(now(), [4, 7], 0.06, 'bell', 0.1, 0.3)),
    nope: live(() => { const t = now(); eng.tone(196, t, 0.13, 0.09, eng.sfx, 'square'); eng.tone(156, t + 0.12, 0.2, 0.09, eng.sfx, 'square'); }),
    lose: live(() => { eng.tone(330, now(), 0.34, 0.16, eng.sfx, 'triangle', 150); }),
    /* combat */
    hurt: live(() => { const t = now(); eng.noiseHit(t, 0.28, 0.36, 'lowpass', 1200, 0.7, eng.sfx, 160); eng.tone(190, t, 0.32, 0.22, eng.sfx, 'sawtooth', 55); eng.dip(t, 1.4, 0.4); }),
    block: live(() => { const t = now(); eng.tone(1250, t, 0.16, 0.12, eng.sfx, 'triangle', 1900); eng.noiseHit(t, 0.07, 0.14, 'highpass', 5000, 0.8, eng.sfx); eng.run(t, [8], 0, 'bell', 0.1, 0.5); }),
    warn: live(() => { const t = now(); eng.tone(980, t, 0.06, 0.06, eng.sfx, 'square'); eng.tone(980, t + 0.09, 0.06, 0.06, eng.sfx, 'square'); }),
    kill: live(() => { const t = now(); eng.noiseHit(t, 0.2, 0.2, 'bandpass', 1500, 0.8, eng.sfx, 260); eng.run(t + 0.02, [6, 9], 0.05, 'bell', 0.09, 0.35); }),
    charged: live(() => { const t = now(); eng.run(t, [3, 6, 9], 0.07, 'bell', 0.12, 0.6); eng.noiseHit(t, 0.35, 0.06, 'highpass', 1500, 0.8, eng.sfx, 9000); }),
    heal: live(() => eng.run(now(), [2, 4, 6, 8], 0.07, 'pluck', 0.1, 0.45)),
    castOpen: live(() => { const t = now(); eng.noiseHit(t, 0.4, 0.1, 'bandpass', 2600, 1, eng.sfx, 300); eng.tone(520, t, 0.4, 0.07, eng.sfx, 'sine', 180); }),
    cast: live(id => {
      const t = now();
      if (id === 'fire') { eng.noiseHit(t, 0.8, 0.26, 'bandpass', 1200, 0.7, eng.sfx, 160); eng.tone(130, t, 0.7, 0.1, eng.sfx, 'sawtooth', 50); eng.chordHit(t, 'saw', 0.07, 1, 0.6); }
      else if (id === 'shield') { eng.chordHit(t, 'bell', 0.09, 2, 1.2); eng.noiseHit(t, 0.5, 0.06, 'highpass', 4000, 0.8, eng.sfx, 9000); eng.tone(330, t, 0.5, 0.08, eng.sfx, 'triangle', 990); }
      else { eng.tone(1400, t, 1.0, 0.12, eng.sfx, 'sine', 90); eng.chordHit(t + 0.1, 'bell', 0.07, 1, 1.6); eng.noiseHit(t, 0.9, 0.08, 'bandpass', 3000, 1.4, eng.sfx, 200); }
    }),
    down: live(() => { const t = now(); eng.tone(120, t, 1.1, 0.3, eng.sfx, 'sawtooth', 32); eng.noiseHit(t, 0.7, 0.3, 'lowpass', 900, 0.7, eng.sfx, 80); eng.dip(t, 2.4, 0.3); }),
    bossHit: live(() => { const t = now(); eng.noiseHit(t, 0.16, 0.22, 'bandpass', 700, 0.9, eng.sfx, 170); eng.tone(130, t, 0.14, 0.14, eng.sfx, 'square', 70); }),
    bossDown: live(() => { const t = now(); for (let i = 0; i < 5; i++) eng.noiseHit(t + i * 0.13, 0.4, 0.26, 'lowpass', 1400, 0.7, eng.sfx, 90); eng.tone(90, t, 1.2, 0.26, eng.sfx, 'sawtooth', 30); eng.run(t + 0.7, [0, 2, 4, 6, 8, 10], 0.08, 'saw', 0.09, 0.4); eng.chordHit(t + 1.2, 'bell', 0.08, 2, 1.6); }),
    levelUp: live(() => { const t = now(); eng.run(t, [0, 3, 5, 8, 10], 0.1, 'bell', 0.14, 0.7); eng.noiseHit(t, 0.5, 0.08, 'highpass', 1200, 0.8, eng.sfx, 9000); }),

    /* for tests: render a few bars to a buffer and report how loud and how bright it is */
    async _render(id, bars = 4, e = 1, events = []) {
      const sr = 44100, th = THEMES[id], secs = 60 / th.bpm * 4 * bars + 1;
      const oc = new OfflineAudioContext(2, Math.floor(sr * secs), sr), en = new Engine(oc);
      en.musicVol.gain.value = MUSIC_LEVEL; en.energy = e; en.setTheme(id, 0); en.applyEnergy(e, 0, 0.001);
      let t = 0.05;
      const evs = events.slice().sort((a, b) => a.t - b.t);
      for (let s = 0; s < bars * 16; s++) {
        while (evs.length && evs[0].t <= t + en.stepDur) { const ev = evs.shift(); if (ev.type === 'miss') en.miss(ev.t); else en.key(ev.i || 0, ev.streak || 0, ev.t); }
        en.step(s, t); t += en.stepDur;
      }
      const buf = await oc.startRendering(), x = buf.getChannelData(0), win = Math.floor(sr * 0.25), out = [];
      let peak = 0;
      for (let w = 0; w + win <= x.length; w += win) {
        let s2 = 0, d2 = 0;
        for (let i = w + 1; i < w + win; i++) { const v = x[i]; s2 += v * v; const d = v - x[i - 1]; d2 += d * d; if (Math.abs(v) > peak) peak = Math.abs(v); }
        out.push({ rms: Math.sqrt(s2 / win), bright: s2 > 1e-9 ? Math.sqrt(d2 / s2) : 0 });
      }
      return { peak, windows: out };
    },
    _state() { return { running: !!ac && ac.state === 'running', theme: themeId, energy, step: stepN }; },
    /* for tests: how loud and how bright the live output is right now */
    _tap() {
      if (!eng) return null;
      if (!eng.tapNode) { eng.tapNode = ac.createAnalyser(); eng.tapNode.fftSize = 8192; eng.master.connect(eng.tapNode); }
      const x = new Float32Array(8192); eng.tapNode.getFloatTimeDomainData(x);
      let s2 = 0, d2 = 0, peak = 0;
      for (let i = 1; i < x.length; i++) { s2 += x[i] * x[i]; const d = x[i] - x[i - 1]; d2 += d * d; peak = Math.max(peak, Math.abs(x[i])); }
      return { rms: Math.sqrt(s2 / x.length), bright: s2 > 1e-9 ? Math.sqrt(d2 / s2) : 0, peak, cutoff: eng.filter.frequency.value };
    },
    THEMES,
  };
  return api;
})();

