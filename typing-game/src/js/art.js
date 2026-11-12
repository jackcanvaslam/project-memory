/* Dragon Keys - small pieces of vector art: icons, the egg and the guide hands.
   The dragon itself is drawn on a canvas, see dragon.js. */
'use strict';

const Art = (() => {
  /* lighten (amt > 0) or darken (amt < 0) a hex colour */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + ((amt < 0 ? 0 : 255) - v) * Math.abs(amt)));
    return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  /* one colour per finger, the same on the keyboard and on the hands */
  const FINGER_COLORS = { L1: '#ff4d8d', L2: '#ff9a3d', L3: '#ffe14d', L4: '#4dff9a', R4: '#3de0ff', R3: '#4d8dff', R2: '#a06bff', R1: '#f36bff', T: '#cdd6ff' };

  function starPoints(cx, cy, R, r, n = 5) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(2) + ',' + (cy + Math.sin(a) * rad).toFixed(2));
    }
    return pts.join(' ');
  }
  const line = d => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ICONS = {
    star: `<polygon points="${starPoints(12, 12.6, 10, 4.4)}" fill="#ffd23f" stroke="#fff3b0" stroke-width="1" stroke-linejoin="round"/>`,
    starOff: `<polygon points="${starPoints(12, 12.6, 10, 4.4)}" fill="rgba(255,255,255,.06)" stroke="rgba(190,200,255,.4)" stroke-width="1.2" stroke-linejoin="round"/>`,
    shard: '<path d="M7 3.5h10l4.5 6L12 21 2.5 9.5z" fill="#22e1ff" stroke="#d6faff" stroke-width="1" stroke-linejoin="round"/><path d="M2.5 9.5h19M8.5 9.5L12 21l3.5-11.5M7 3.5l1.5 6L12 3.5l3.5 6 1.5-6" fill="none" stroke="#0b6f9c" stroke-width="1" stroke-linejoin="round"/>',
    lock: line('M7.5 11V8a4.5 4.5 0 0 1 9 0v3') + '<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/>',
    flame: '<path d="M12 2.5c1 4 6 6 6 11.5a6 6 0 0 1-12 0c0-2.500 1.200-4 2.400-5.200.300 1.600 1 2.600 2 3 0-3.800.600-7 1.600-9.300z" fill="#ff7a2f" stroke="#ffd0a0" stroke-width="1" stroke-linejoin="round"/><path d="M12 12.500c.800 1.800 2.600 2.600 2.600 4.600a2.600 2.600 0 0 1-5.200 0c0-1.800 1.400-2.800 2.600-4.600z" fill="#ffe14d"/>',
    home: line('M3.500 11.500L12 4l8.500 7.500M6 10v10h4.500v-5.500h3V20H18V10'),
    back: line('M14.500 5l-7 7 7 7'),
    next: line('M9.500 5l7 7-7 7'),
    play: '<path d="M7.500 4.800v14.400a.800.800 0 0 0 1.200.700l12-7.200a.800.800 0 0 0 0-1.400l-12-7.200a.800.800 0 0 0-1.200.700z" fill="currentColor"/>',
    forge: line('M12 2.500l2.200 5.300 5.300 2.200-5.300 2.200L12 17.500l-2.200-5.300L4.500 10l5.300-2.200zM18.500 15.500l.900 2.100 2.100.900-2.100.900-.900 2.100-.900-2.100-2.100-.900 2.100-.900z'),
    soundOn: line('M4 9.500h3.500L12 5.500v13l-4.500-4H4zM15.500 9a4.500 4.500 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11'),
    soundOff: line('M4 9.500h3.500L12 5.500v13l-4.500-4H4zM16 9.500l5 5m0-5l-5 5'),
    music: line('M9 18V5.500l10-2V16') + '<circle cx="6.500" cy="18" r="2.600" fill="currentColor"/><circle cx="16.500" cy="16" r="2.600" fill="currentColor"/>',
    musicOff: line('M9 18V5.500l10-2V16M3.500 3.500l17 17') + '<circle cx="6.500" cy="18" r="2.600" fill="currentColor"/><circle cx="16.500" cy="16" r="2.600" fill="currentColor"/>',
    chart: line('M4 20V12M10 20V6M16 20v-9M21 20H3'),
    full: line('M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'),
    close: line('M6 6l12 12M18 6L6 18'),
    check: line('M4.500 12.500l5 5L19.500 7'),
    retry: line('M19 12a7 7 0 1 1-2.300-5.200M19.500 3.500v5h-5'),
    map: line('M3.500 6l5.500-2 6 2 5.500-2v14l-5.500 2-6-2-5.500 2zM9 4v14M15 6v14'),
    bolt: '<path d="M13.500 2L5 13.500h5.500L9.500 22 19 10h-5.500z" fill="#ffe14d" stroke="#fff6c0" stroke-width="1" stroke-linejoin="round"/>',
    target: line('M12 3a9 9 0 1 0 9 9M12 8a4 4 0 1 0 4 4M12 12l8-8M17 4h3v3'),
    pause: '<rect x="6" y="5" width="4.500" height="14" rx="1.200" fill="currentColor"/><rect x="13.500" y="5" width="4.500" height="14" rx="1.200" fill="currentColor"/>',
    shield: line('M12 3l7.500 2.800v5.700c0 4.600-3.200 8-7.500 9.500-4.300-1.500-7.500-4.900-7.500-9.500V5.800z'),
    clock: line('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.500l3.500 2'),
    storm: line('M7 15a4.500 4.500 0 0 1 .600-9A5.500 5.500 0 0 1 18 7.500 3.800 3.800 0 0 1 17.500 15M12 12l-2.500 4.500h3L11 21'),
  };
  const fix = s => s.replace(/(\d)\.(\d)00\b/g, '$1.$2');
  const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${fix(ICONS[name])}</svg>`;

  /* ---------------- The egg ---------------- */
  function egg(colorId = 'emerald') {
    const c = DRAGON_COLORS[colorId] || DRAGON_COLORS.emerald;
    const shell = 'M110 18C158 18 188 96 188 148C188 200 154 228 110 228C66 228 32 200 32 148C32 96 62 18 110 18Z';
    return `<svg class="egg" viewBox="0 0 220 250" overflow="visible" stroke-linejoin="round" stroke-linecap="round">
  <defs>
    <radialGradient id="egg-g" cx="40%" cy="32%" r="80%"><stop offset="0" stop-color="#2b3a8c"/><stop offset="1" stop-color="#090c2c"/></radialGradient>
    <radialGradient id="egg-core" cx="50%" cy="60%" r="50%"><stop offset="0" stop-color="${c.a}" stop-opacity=".95"/><stop offset="1" stop-color="${c.a}" stop-opacity="0"/></radialGradient>
    <clipPath id="egg-clip"><path d="${shell}"/></clipPath>
  </defs>
  <ellipse cx="110" cy="236" rx="80" ry="10" fill="${c.a}" opacity=".18"/>
  <g class="egg-shell">
    <path d="${shell}" fill="url(#egg-g)"/>
    <g clip-path="url(#egg-clip)">
      <circle class="egg-core" cx="110" cy="150" r="96" fill="url(#egg-core)"/>
      <path d="M32 96L80 70L110 96L150 66L190 100M24 150L66 128L110 150L156 126L196 152M40 198L82 178L110 198L146 176L184 200M80 70L66 128L82 178M150 66L156 126L146 176M110 18V96M110 150V228" fill="none" stroke="${c.a}" stroke-opacity=".28" stroke-width="2"/>
    </g>
    <path d="${shell}" fill="none" stroke="${c.a}" stroke-width="3"/>
    <path d="M70 62Q84 34 106 28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/>
    <g fill="none" stroke="#fff" stroke-width="3.5" class="cracks">
      <path class="crack c1" d="M110 20l-10 26 16 14 -12 22"/>
      <path class="crack c2" d="M104 82l20 16 -18 20 22 14"/>
      <path class="crack c3" d="M104 82l-26 12 -10 26 -24 8"/>
      <path class="crack c4" d="M128 132l30 -8 26 14M128 132l-14 30 12 26"/>
    </g>
  </g></svg>`;
  }

  /* ---------------- Hands for the finger guide ---------------- */
  function hand(side) {
    const ids = side === 'left' ? ['L1', 'L2', 'L3', 'L4'] : ['R1', 'R2', 'R3', 'R4'];
    // drawn as a left hand (pinky first); the right hand is mirrored
    const f = [[20, 66, 25, 86], [50, 38, 27, 112], [82, 24, 27, 124], [114, 42, 27, 108]];
    const fingers = f.map(([x, y, w, h], i) => `<g class="fg fg-${ids[i]}" style="--fc:${FINGER_COLORS[ids[i]]}"><rect class="fg-body" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/><circle class="fg-tip" cx="${x + w / 2}" cy="${y + w / 2}" r="5"/></g>`).join('');
    return `<svg class="hand hand-${side}" viewBox="0 0 190 200" overflow="visible">
  <g ${side === 'right' ? 'transform="translate(190 0) scale(-1 1)"' : ''} stroke-linejoin="round">
    <g class="fg fg-T" style="--fc:${FINGER_COLORS.T}"><rect class="fg-body" x="140" y="96" width="29" height="78" rx="14.5" transform="rotate(38 154 150)"/><circle class="fg-tip" cx="154.5" cy="110.5" r="5" transform="rotate(38 154 150)"/></g>
    <rect class="palm" x="18" y="122" width="126" height="78" rx="34"/>
    ${fingers}
  </g></svg>`;
  }

  /* small pictures for the forge */
  function swatch(kind, id) {
    if (kind === 'skin') { const c = DRAGON_COLORS[id]; return `<div class="sw sw-skin" style="--a:${c.a};--b:${c.b};--f:${c.fin};--g:${c.glow}"><i></i></div>`; }
    if (kind === 'trail') {
      const c = TRAILS[id].colors;
      const d = id === 'bolt' ? 'M6 32L20 22L30 34L44 18L56 30L70 20L86 26' : 'M6 34C24 10 38 40 54 24S76 22 88 18';
      const grad = id === 'prism' ? '<stop offset="0" stop-color="#ff3df0"/><stop offset=".35" stop-color="#ffe14d"/><stop offset=".65" stop-color="#4dff9a"/><stop offset="1" stop-color="#22e1ff"/>' : `<stop offset="0" stop-color="${c[1]}" stop-opacity=".2"/><stop offset="1" stop-color="${c[0]}"/>`;
      return `<svg class="sw" viewBox="0 0 94 52"><defs><linearGradient id="tg-${id}">${grad}</linearGradient></defs>
        <path d="${d}" fill="none" stroke="url(#tg-${id})" stroke-width="${id === 'comet' ? 9 : 5}" stroke-linecap="round" stroke-linejoin="round" opacity=".35"/>
        <path d="${d}" fill="none" stroke="url(#tg-${id})" stroke-width="${id === 'comet' ? 4 : 2.2}" stroke-linecap="round" stroke-linejoin="round"/>
        ${id === 'ember' ? '<circle cx="30" cy="12" r="2" fill="#ffb02e"/><circle cx="52" cy="8" r="1.6" fill="#ff7a3d"/><circle cx="70" cy="10" r="2.2" fill="#ffb02e"/>' : ''}
        ${id === 'frost' ? '<path d="M28 42v6M25 45h6M60 40v6M57 43h6" stroke="#e0f8ff" stroke-width="1.6"/>' : ''}</svg>`;
    }
    const P = {
      horns: 'M30 44Q22 20 8 14Q22 24 20 44M62 44Q62 18 80 8Q72 24 74 44',
      blade: 'M22 46L50 4L70 46Z',
      twin: 'M34 46Q24 20 4 10M40 46Q34 26 16 6M58 46Q66 22 88 12',
      spikes: 'M12 46L20 24L28 46L38 14L48 46L58 8L66 46L74 22L82 46',
      antlers: 'M30 46L24 26L8 18M24 26L26 8M16 22L10 8M64 46L70 26L86 18M70 26L68 8M78 22L84 8',
      halo: 'M30 46Q24 30 14 24M64 46Q70 30 80 24',
    }[id];
    return `<svg class="sw" viewBox="0 0 94 52"><path d="${P}" fill="${id === 'blade' ? 'rgba(157,252,255,.25)' : 'none'}" stroke="#d6faff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${id === 'halo' ? '<ellipse cx="47" cy="12" rx="26" ry="6.5" fill="none" stroke="#ffe9a0" stroke-width="3"/>' : ''}</svg>`;
  }

  return { shade, ic, egg, hand, swatch, starPoints, FINGER_COLORS };
})();

