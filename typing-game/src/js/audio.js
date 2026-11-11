/* Dragon Keys - sound effects, made in the browser so there are no files to load */
'use strict';

const Sound = (() => {
  let ac = null, master = null, on = true;
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];          // major pentatonic steps
  const freq = semis => 440 * Math.pow(2, (semis - 9) / 12);       // 0 = middle C

  function ensure() {
    if (!on) return false;
    try {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
      return true;
    } catch (e) { return false; }
  }

  function tone(f, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0, attack = 0.005 } = {}) {
    if (!ensure()) return;
    const t0 = ac.currentTime + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(dur, { vol = 0.2, at = 0, from = 1200, to = 300, q = 1 } = {}) {
    if (!ensure()) return;
    const t0 = ac.currentTime + at, n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t0);
  }

  const api = {
    /* each right key plays the next note of a little tune, so words sound like melodies */
    key(step = 0) { tone(freq(SCALE[step % SCALE.length] + 12), 0.11, { type: 'triangle', vol: 0.16 }); },
    miss() { tone(150, 0.16, { type: 'square', vol: 0.07, slide: 0.6 }); },
    word() { tone(freq(28), 0.12, { type: 'sine', vol: 0.16 }); tone(freq(33), 0.2, { type: 'sine', vol: 0.16, at: 0.07 }); },
    gem() { tone(freq(31), 0.1, { type: 'triangle', vol: 0.14 }); tone(freq(36), 0.1, { type: 'triangle', vol: 0.14, at: 0.06 }); tone(freq(40), 0.22, { type: 'triangle', vol: 0.14, at: 0.12 }); },
    coin() { tone(1319, 0.08, { type: 'square', vol: 0.06 }); tone(1760, 0.2, { type: 'square', vol: 0.06, at: 0.06 }); },
    click() { tone(520, 0.07, { type: 'triangle', vol: 0.14, slide: 1.5 }); },
    pop() { tone(300, 0.1, { type: 'sine', vol: 0.2, slide: 2.4 }); },
    star(i = 0) { const f = freq([24, 28, 31][i] || 36); tone(f, 0.35, { type: 'triangle', vol: 0.2 }); tone(f * 2, 0.3, { type: 'sine', vol: 0.08, at: 0.02 }); },
    fanfare() { [12, 16, 19, 24, 19, 24, 28].forEach((n, i) => tone(freq(n), i === 6 ? 0.6 : 0.16, { type: 'triangle', vol: 0.2, at: i * 0.11 })); [0, 7].forEach(n => tone(freq(n), 0.9, { type: 'sine', vol: 0.12, at: 0.66 })); },
    almost() { [16, 14, 12].forEach((n, i) => tone(freq(n), 0.24, { type: 'triangle', vol: 0.16, at: i * 0.16 })); },
    fire() { noise(0.5, { vol: 0.3, from: 900, to: 180, q: 0.7 }); tone(110, 0.4, { type: 'sawtooth', vol: 0.05, slide: 0.5 }); },
    whoosh() { noise(0.3, { vol: 0.14, from: 400, to: 2400, q: 0.9 }); },
    crack() { noise(0.09, { vol: 0.35, from: 3200, to: 900, q: 2 }); tone(240, 0.08, { type: 'square', vol: 0.06, slide: 0.5 }); },
    hatch() { noise(0.35, { vol: 0.4, from: 2600, to: 300, q: 0.8 }); [12, 16, 19, 24, 28, 31].forEach((n, i) => tone(freq(n), 0.3, { type: 'triangle', vol: 0.18, at: 0.12 + i * 0.07 })); },
    munch() { for (let i = 0; i < 3; i++) noise(0.08, { vol: 0.25, from: 700, to: 300, q: 3, at: i * 0.16 }); },
    chirp() { tone(880, 0.09, { type: 'sine', vol: 0.14, slide: 1.6 }); tone(1100, 0.12, { type: 'sine', vol: 0.14, slide: 1.4, at: 0.1 }); },
    buy() { [19, 24, 28].forEach((n, i) => tone(freq(n), 0.16, { type: 'square', vol: 0.06, at: i * 0.07 })); },
    nope() { tone(200, 0.14, { type: 'square', vol: 0.06 }); tone(160, 0.2, { type: 'square', vol: 0.06, at: 0.12 }); },
    lose() { tone(330, 0.3, { type: 'triangle', vol: 0.16, slide: 0.5 }); },
    levelUp() { [12, 19, 24, 31, 36].forEach((n, i) => tone(freq(n), 0.5, { type: 'sine', vol: 0.16, at: i * 0.09 })); },
    setOn(v) { on = v; if (master) master.gain.value = v ? 0.5 : 0; },
    get on() { return on; },
    unlock() { ensure(); },
  };
  return api;
})();
