/* Dragon Keys - all the artwork, drawn in code as SVG */
'use strict';

const Art = (() => {
  /* lighten (amt > 0) or darken (amt < 0) a hex colour */
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
      const t = amt < 0 ? 0 : 255;
      return Math.round(v + (t - v) * Math.abs(amt));
    });
    return '#' + ch.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  const FINGER_COLORS = { L1: '#ff6b8b', L2: '#ff9f43', L3: '#ffcf33', L4: '#4fd67d', R4: '#2fc7d9', R3: '#4d9bff', R2: '#8f7bff', R1: '#e36bff', T: '#4a5096' };

  /* ---------------- Icons ---------------- */
  function starPoints(cx, cy, R, r, n = 5) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rad = i % 2 ? r : R;
      pts.push((cx + Math.cos(a) * rad).toFixed(2) + ',' + (cy + Math.sin(a) * rad).toFixed(2));
    }
    return pts.join(' ');
  }
  const ICONS = {
    star: `<polygon points="${starPoints(12, 12.6, 10, 4.6)}" fill="#ffd23f" stroke="#e09a00" stroke-width="1.6" stroke-linejoin="round"/>`,
    starOff: `<polygon points="${starPoints(12, 12.6, 10, 4.6)}" fill="rgba(255,255,255,.28)" stroke="rgba(40,30,80,.35)" stroke-width="1.6" stroke-linejoin="round"/>`,
    coin: '<circle cx="12" cy="12" r="10" fill="#ffc928" stroke="#c98500" stroke-width="1.6"/><circle cx="12" cy="12" r="6.6" fill="#ffe27a" stroke="#e0a000" stroke-width="1.2"/><path d="M12 8.2l1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.3z" fill="#e0a000"/>',
    heart: '<path d="M12 20.5C4.5 14.8 2 11 2 7.9A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 10 1.9c0 3.1-2.5 6.9-10 12.6z" fill="#ff5d8f" stroke="#c9285c" stroke-width="1.6" stroke-linejoin="round"/>',
    heartOff: '<path d="M12 20.5C4.5 14.8 2 11 2 7.9A4.9 4.9 0 0 1 12 6a4.9 4.9 0 0 1 10 1.9c0 3.1-2.5 6.9-10 12.6z" fill="rgba(255,255,255,.3)" stroke="rgba(40,30,80,.35)" stroke-width="1.6" stroke-linejoin="round"/>',
    lock: '<path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><rect x="4.5" y="10.5" width="15" height="11" rx="3" fill="currentColor"/><circle cx="12" cy="16" r="1.8" fill="#fff" opacity=".85"/>',
    flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-2.5 1.2-4 2.4-5.2.3 1.6 1 2.6 2 3C10 9 10.500 5 12 2z" fill="#ff7a2f" stroke="#d1410c" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 12c.8 1.800 2.600 2.600 2.600 4.800a2.600 2.600 0 0 1-5.200 0c0-1.800 1.400-2.600 2.600-4.800z" fill="#ffd23f"/>',
    home: '<path d="M3 11.500L12 3.500l9 8" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.500 10.500V20h4.500v-5h4v5h4.500v-9.500L12 5z" fill="currentColor"/>',
    back: '<path d="M14.500 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/>',
    next: '<path d="M9.500 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M7 4.500v15a1 1 0 0 0 1.500.900l12.500-7.500a1 1 0 0 0 0-1.800L8.500 3.600A1 1 0 0 0 7 4.500z" fill="currentColor"/>',
    bag: '<path d="M8 8V7a4 4 0 0 1 8 0v1" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/><path d="M4.500 8h15l1 12.500h-17z" fill="currentColor" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/>',
    soundOn: '<path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/><path d="M15.500 9a4.500 4.500 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>',
    soundOff: '<path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"/><path d="M16 9.500l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/>',
    chart: '<rect x="4" y="12" width="4" height="8" rx="1.200" fill="currentColor"/><rect x="10" y="7" width="4" height="13" rx="1.200" fill="currentColor"/><rect x="16" y="3.500" width="4" height="16.500" rx="1.200" fill="currentColor"/>',
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>',
    close: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/>',
    check: '<path d="M4.500 12.500l5 5L19.500 7" fill="none" stroke="currentColor" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/>',
    retry: '<path d="M19 12a7 7 0 1 1-2.300-5.200" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round"/><path d="M19.500 3.500v5h-5" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linecap="round" stroke-linejoin="round"/>',
    gem: '<path d="M6.500 4h11l4 5.500L12 21 2.500 9.500z" fill="#59d8ff" stroke="#1492c9" stroke-width="1.500" stroke-linejoin="round"/><path d="M2.500 9.500h19M8.500 9.500L12 21l3.500-11.500M6.500 4l2 5.500L12 4l3.500 5.500 2-5.500" fill="none" stroke="#1492c9" stroke-width="1.100" stroke-linejoin="round"/><path d="M7.200 5l1.300 3.700H4.500z" fill="#c9f3ff"/>',
    map: '<path d="M3.500 6l5.500-2 6 2 5.500-2v14l-5.500 2-6-2-5.500 2z" fill="currentColor" stroke="currentColor" stroke-width="1.400" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" stroke="#fff" stroke-opacity=".55" stroke-width="1.400"/>',
    bolt: '<path d="M13.500 2L5 13.500h5.500L9.500 22 19 10h-5.500z" fill="#ffd23f" stroke="#e09a00" stroke-width="1.400" stroke-linejoin="round"/>',
    target: '<circle cx="12" cy="12" r="9" fill="#fff" stroke="#ff5d8f" stroke-width="2.400"/><circle cx="12" cy="12" r="4.600" fill="#ff5d8f"/>',
    food: '<path d="M12 7.500C8 5 4 8 4.800 13c.600 4.600 4 7 7.200 6 3.200 1 6.600-1.400 7.200-6C20 8 16 5 12 7.500z" fill="#ff5a5f" stroke="#b8262c" stroke-width="1.500" stroke-linejoin="round"/><path d="M12 7.500c0-2 .500-3.200 1.800-4.300" fill="none" stroke="#7a4a21" stroke-width="1.800" stroke-linecap="round"/><path d="M13.500 4.500c2-1.400 3.800-.800 4.500.600-1.600 1.200-3.300 1-4.500-.600z" fill="#5ad67d"/>',
    pause: '<rect x="6" y="5" width="4.500" height="14" rx="1.500" fill="currentColor"/><rect x="13.500" y="5" width="4.500" height="14" rx="1.500" fill="currentColor"/>',
  };
  const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name].replace(/(\d)\.(\d)00\b/g, '$1.$2')}</svg>`;

  /* ---------------- Things the dragon can wear ---------------- */
  const WEAR = {
    bow: { slot: 'head', at: [116, 50, -28, 1], icon: [50, 52, 1.7],
      svg: '<path d="M0 0L-24 -15Q-30 0 -24 15Z M0 0L24 -15Q30 0 24 15Z" fill="#ff6fb5" stroke="#c2327c" stroke-width="6"/><circle r="7.500" fill="#ffa3d3" stroke="#c2327c" stroke-width="5"/>' },
    party: { slot: 'head', at: [150, 42, -8, 1], icon: [50, 84, 1.3],
      svg: '<path d="M-24 6L2 -54L27 4Q2 14 -24 6Z" fill="#4db8ff" stroke="#1f6fc2" stroke-width="6"/><path d="M-13 -19L16 -22M-19 -5L22 -8" stroke="#fff36b" stroke-width="5" fill="none"/><circle cx="2" cy="-56" r="8.500" fill="#ff6fb5" stroke="#c2327c" stroke-width="5"/>' },
    wizard: { slot: 'head', at: [148, 44, -8, 1], icon: [50, 88, 1.05],
      svg: '<ellipse cx="0" cy="4" rx="42" ry="11" fill="#5b3cc4" stroke="#2f1d78" stroke-width="6"/><path d="M-27 2Q-14 -42 16 -74Q18 -38 29 2Q0 10 -27 2Z" fill="#7453e6" stroke="#2f1d78" stroke-width="6"/><path d="M-22 -6Q2 2 26 -6" stroke="#ffd23f" stroke-width="6" fill="none"/>' +
        `<polygon points="${starPoints(2, -34, 9, 4)}" fill="#ffd23f"/><circle cx="-10" cy="-18" r="2.500" fill="#fff"/><circle cx="14" cy="-22" r="2" fill="#fff"/>` },
    crown: { slot: 'head', at: [150, 44, -8, 1], icon: [50, 70, 1.45],
      svg: '<path d="M-27 6L-32 -26L-15 -11L0 -34L15 -11L32 -26L27 6Q0 13 -27 6Z" fill="#ffd23f" stroke="#c98500" stroke-width="6"/><circle cx="0" cy="-4" r="5.500" fill="#ff5d8f" stroke="#c9285c" stroke-width="2.500"/><circle cx="-17" cy="-2" r="3.500" fill="#59d8ff"/><circle cx="17" cy="-2" r="3.500" fill="#59d8ff"/><circle cx="0" cy="-34" r="4" fill="#fff6c9"/><circle cx="-32" cy="-26" r="3.500" fill="#fff6c9"/><circle cx="32" cy="-26" r="3.500" fill="#fff6c9"/>' },
    shades: { slot: 'face', at: [160, 84, 0, 1], icon: [34, 54, 1.5],
      svg: '<path d="M-20 -8L46 -16" stroke="#15131f" stroke-width="5" fill="none"/><rect x="-20" y="-15" width="38" height="29" rx="11" fill="#1d1b2e" stroke="#000" stroke-width="3"/><rect x="21" y="-21" width="27" height="25" rx="10" fill="#1d1b2e" stroke="#000" stroke-width="3"/><path d="M-12 -8l8 -3M27 -15l6 -2" stroke="#fff" stroke-opacity=".7" stroke-width="3.500" fill="none"/>' },
    scarf: { slot: 'neck', at: [130, 132, 0, 1], icon: [50, 36, 1.35],
      svg: '<path d="M10 4Q22 26 16 44L34 40Q36 20 28 2Z" fill="#ff5a5f" stroke="#a81f2e" stroke-width="6"/><path d="M-36 -8Q0 18 40 -12Q46 -2 40 8Q0 34 -38 10Q-42 0 -36 -8Z" fill="#ff5a5f" stroke="#a81f2e" stroke-width="6"/><path d="M-18 4l-4 14M0 9l-2 15M20 4l4 13M19 32l14-3" stroke="#fff" stroke-width="5" fill="none"/>' },
  };
  const wearSlot = id => WEAR[id] && WEAR[id].slot;

  /* ---------------- The dragon ---------------- */
  function dragonInner(opts = {}) {
    const c = DRAGON_COLORS[opts.color] || DRAGON_COLORS.emerald;
    const st = Math.max(0, Math.min(3, opts.stage == null ? 1 : opts.stage));
    const ws = [0.7, 0.9, 1.1, 1.3][st], hs = [0.6, 0.85, 1.05, 1.25][st];
    const wear = opts.wear || [];
    const M = c.main, D = c.dark, L = c.light;
    const horn = '#fff1cf', hornD = '#c9a36a';
    const wingD = 'M0 0C-8 -34 -34 -66 -78 -70C-66 -56 -64 -44 -68 -30C-54 -36 -46 -28 -44 -14C-32 -22 -20 -14 -16 4Z';
    const far = shade(M, -0.2);
    const headShapes = '<ellipse cx="150" cy="88" rx="56" ry="52"/><ellipse cx="196" cy="106" rx="30" ry="24"/>';
    const spikes = [];
    if (st >= 1) spikes.push('M108 46L88 36L96 62Z');
    spikes.push('M98 104L74 100L88 124Z');
    if (st >= 1) spikes.push('M78 138L55 140L71 160Z');
    if (st >= 3) spikes.push('M70 166L48 172L66 188Z');
    const wornHead = wear.find(w => wearSlot(w) === 'head');
    const wornFace = wear.find(w => wearSlot(w) === 'face');
    const wornNeck = wear.find(w => wearSlot(w) === 'neck');
    const put = id => { const w = WEAR[id]; return `<g transform="translate(${w.at[0]} ${w.at[1]}) rotate(${w.at[2]}) scale(${w.at[3]})">${w.svg}</g>`; };

    return `<g class="dr-root" paint-order="stroke" stroke-linejoin="round" stroke-linecap="round"><g transform="translate(0 44)">
  <ellipse class="dr-shadow" cx="120" cy="228" rx="72" ry="9" fill="#000" opacity=".16"/>
  <g class="dr-all">
    <g transform="translate(90 188)"><g class="dr-tail">
      <path d="M-12 -18C-40 -3 -60 -8 -60 -36L-76 -34C-78 8 -38 24 6 16Z" fill="${M}" stroke="${D}" stroke-width="7"/>
      <path d="M-88 -34L-68 -74L-48 -34L-68 -42Z" fill="${c.wing}" stroke="${c.wingDark}" stroke-width="7"/>
    </g></g>
    <g transform="translate(120 122) scale(${ws})"><g class="dr-wing dr-wing-far"><g transform="rotate(20)">
      <path d="${wingD}" fill="${c.wingDark}" stroke="${shade(c.wingDark, -0.3)}" stroke-width="7"/></g></g></g>
    <ellipse cx="164" cy="216" rx="16" ry="9" fill="${far}" stroke="${D}" stroke-width="7"/>
    <ellipse cx="126" cy="218" rx="17" ry="9" fill="${far}" stroke="${D}" stroke-width="7"/>
    <g class="dr-body">
      ${spikes.slice(1).map(d => `<path d="${d}" fill="${c.wing}" stroke="${c.wingDark}" stroke-width="6"/>`).join('')}
      <ellipse cx="118" cy="168" rx="50" ry="47" fill="${M}" stroke="${D}" stroke-width="7"/>
      <ellipse cx="139" cy="174" rx="27" ry="34" fill="${c.belly}"/>
      <path d="M118 158Q139 167 162 156M116 175Q139 185 165 173M120 192Q139 201 160 190" fill="none" stroke="${shade(c.belly, -0.16)}" stroke-width="3"/>
      <ellipse cx="96" cy="198" rx="24" ry="21" fill="${M}" stroke="${D}" stroke-width="7"/>
      <ellipse cx="106" cy="220" rx="22" ry="10" fill="${M}" stroke="${D}" stroke-width="7"/>
      <path d="M116 216v6M124 217v5" stroke="${D}" stroke-width="3" fill="none"/>
      <ellipse cx="152" cy="221" rx="17" ry="9" fill="${M}" stroke="${D}" stroke-width="7"/>
      <g transform="translate(152 158) rotate(-38)"><g class="dr-arm"><ellipse cx="0" cy="12" rx="9.500" ry="17" fill="${M}" stroke="${D}" stroke-width="7"/></g></g>
    </g>
    <g transform="translate(98 132) scale(${ws})"><g class="dr-wing dr-wing-near">
      <path d="${wingD}" fill="${c.wing}" stroke="${c.wingDark}" stroke-width="7"/>
      <path d="M0 0L-68 -30M0 0L-44 -14" stroke="${c.wingDark}" stroke-width="3.500" fill="none"/></g></g>
    <g transform="translate(138 130)"><g class="dr-head"><g transform="translate(-138 -130)">
      ${st >= 1 ? `<path d="${spikes[0]}" fill="${c.wing}" stroke="${c.wingDark}" stroke-width="6"/>` : ''}
      <g transform="translate(118 52) scale(${hs})"><path d="M-12 6L-28 -34Q0 -24 14 -6Z" fill="${horn}" stroke="${hornD}" stroke-width="6"/></g>
      <g transform="translate(154 40) scale(${hs})"><path d="M-13 4L-12 -38Q9 -22 15 2Z" fill="${horn}" stroke="${hornD}" stroke-width="6"/></g>
      <path d="M104 80L72 62L88 86L66 98L98 106Z" fill="${c.wing}" stroke="${c.wingDark}" stroke-width="6"/>
      <g fill="${D}" stroke="${D}" stroke-width="7">${headShapes}</g><g fill="${M}">${headShapes}</g>
      <ellipse cx="140" cy="56" rx="26" ry="10" fill="${L}" opacity=".55" transform="rotate(-14 140 56)"/>
      <ellipse cx="198" cy="96" rx="17" ry="7" fill="${L}" opacity=".5"/>
      <ellipse cx="208" cy="98" rx="2.600" ry="4" fill="${D}"/><ellipse cx="218" cy="101" rx="2.400" ry="3.600" fill="${D}"/>
      <ellipse cx="164" cy="116" rx="10" ry="6.500" fill="#ffa3bb" opacity=".9"/>
      <g class="dr-mouth-closed"><path d="M176 119Q199 136 222 115" fill="none" stroke="${D}" stroke-width="4"/><path d="M203 126l4.500 9 4.500 -11z" fill="#fff"/></g>
      <g class="dr-mouth-open"><path d="M174 116Q198 152 224 112Q198 127 174 116Z" fill="#7a1f3d" stroke="${D}" stroke-width="5"/><ellipse cx="199" cy="134" rx="9" ry="5" fill="#ff7d9c"/><path d="M207 121l3.500 7 4 -9z" fill="#fff"/></g>
      <g transform="translate(160 84)"><g class="dr-blink">
        <g class="dr-eye-open"><ellipse rx="16.500" ry="19.500" fill="#fff" stroke="${D}" stroke-width="6"/><circle cx="4" cy="2" r="11.500" fill="#2b2140"/><circle cx="8.500" cy="-3.500" r="4.600" fill="#fff"/><circle cx="1" cy="8" r="2.200" fill="#fff"/></g>
        <path class="dr-eye-happy" d="M-13 5Q0 -15 13 5" fill="none" stroke="${D}" stroke-width="5.500"/>
      </g></g>
      <g transform="translate(193 78)"><g class="dr-blink">
        <g class="dr-eye-open"><ellipse rx="10.500" ry="14" fill="#fff" stroke="${D}" stroke-width="6"/><circle cx="3" cy="2" r="7.600" fill="#2b2140"/><circle cx="5.600" cy="-1.600" r="3" fill="#fff"/></g>
        <path class="dr-eye-happy" d="M-9 4Q0 -11 9 4" fill="none" stroke="${D}" stroke-width="5"/>
      </g></g>
      ${wornFace ? put(wornFace) : ''}
      ${wornHead ? put(wornHead) : ''}
    </g></g></g>
    ${wornNeck ? put(wornNeck) : ''}
  </g></g></g>`.replace(/(\d)\.(\d)00\b/g, '$1.$2');
  }
  function dragon(opts = {}) {
    return `<svg class="dragon ${opts.cls || ''}" viewBox="0 0 260 280" overflow="visible">${dragonInner(opts)}</svg>`;
  }

  /* ---------------- The egg ---------------- */
  function egg(colorId = 'emerald') {
    const c = DRAGON_COLORS[colorId] || DRAGON_COLORS.emerald;
    return `<svg class="egg" viewBox="0 0 220 260" overflow="visible" stroke-linejoin="round" stroke-linecap="round">
  <ellipse cx="110" cy="236" rx="96" ry="20" fill="#8a5a2b"/>
  <path d="M22 232q30 -22 60 -4q26 -20 56 0q30 -18 60 4" fill="none" stroke="#b9843f" stroke-width="9"/>
  <path d="M30 244q40 14 80 4q40 12 80 -4" fill="none" stroke="#6b431c" stroke-width="7"/>
  <g class="egg-shell">
    <path d="M110 18C158 18 188 96 188 148C188 200 154 228 110 228C66 228 32 200 32 148C32 96 62 18 110 18Z" fill="#fff6dc" stroke="${c.dark}" stroke-width="7"/>
    <ellipse cx="78" cy="96" rx="15" ry="20" fill="${c.main}" transform="rotate(-18 78 96)"/>
    <ellipse cx="146" cy="128" rx="19" ry="23" fill="${c.main}" transform="rotate(14 146 128)"/>
    <ellipse cx="96" cy="176" rx="17" ry="14" fill="${c.light}"/>
    <ellipse cx="128" cy="62" rx="10" ry="12" fill="${c.light}"/>
    <ellipse cx="152" cy="190" rx="9" ry="8" fill="${c.main}"/>
    <ellipse cx="66" cy="150" rx="8" ry="10" fill="${c.wing}"/>
    <ellipse cx="80" cy="64" rx="9" ry="20" fill="#fff" opacity=".8" transform="rotate(24 80 64)"/>
    <g fill="none" stroke="${c.dark}" stroke-width="5">
      <path class="crack c1" d="M110 20l-10 26 16 14 -12 22"/>
      <path class="crack c2" d="M104 82l20 16 -18 20 22 14"/>
      <path class="crack c3" d="M104 82l-26 12 -10 26 -24 8"/>
      <path class="crack c4" d="M128 132l30 -8 26 14M128 132l-14 30 12 26"/>
    </g>
  </g></svg>`;
  }

  /* ---------------- Animal friends ---------------- */
  const FRIEND_SPECS = {
    bunny:  { fur: '#fffaf3', dark: '#cfa992', belly: '#ffe9ee', inner: '#ffb3c7' },
    fox:    { fur: '#ff9a3c', dark: '#c25a12', belly: '#fff3dc', inner: '#5a3420' },
    kitten: { fur: '#a9b4dc', dark: '#5f6aa3', belly: '#f4f6ff', inner: '#ffb3c7' },
    panda:  { fur: '#ffffff', dark: '#2d2b3a', belly: '#ffffff', inner: '#2d2b3a' },
  };
  function friend(type, cls = '') {
    const s = FRIEND_SPECS[type];
    const F = s.fur, D = s.dark, sw = 6;
    const limb = type === 'panda' ? '#2d2b3a' : type === 'fox' ? '#6b3a1e' : F;
    let ears = '', tail = '', extra = '', over = '';
    if (type === 'bunny') {
      ears = `<g transform="translate(74 52)"><g class="fr-ear"><ellipse cx="-4" cy="-34" rx="16" ry="42" fill="${F}" stroke="${D}" stroke-width="${sw}" transform="rotate(-9)"/><ellipse cx="-4" cy="-32" rx="7" ry="28" fill="${s.inner}" transform="rotate(-9)"/></g></g>
        <g transform="translate(126 52)"><g class="fr-ear fr-ear2"><ellipse cx="4" cy="-34" rx="16" ry="42" fill="${F}" stroke="${D}" stroke-width="${sw}" transform="rotate(11)"/><ellipse cx="4" cy="-32" rx="7" ry="28" fill="${s.inner}" transform="rotate(11)"/></g></g>`;
      tail = `<circle cx="150" cy="198" r="15" fill="#fff" stroke="${D}" stroke-width="${sw}"/>`;
      over = '<rect x="95" y="120" width="10" height="9" rx="2.500" fill="#fff" stroke="#b9a093" stroke-width="2"/>';
    } else if (type === 'fox') {
      ears = `<path d="M46 62L52 4L96 40Z" fill="${F}" stroke="${D}" stroke-width="${sw}"/><path d="M57 46L58 20L78 38Z" fill="${s.inner}"/>
        <path d="M154 62L148 4L104 40Z" fill="${F}" stroke="${D}" stroke-width="${sw}"/><path d="M143 46L142 20L122 38Z" fill="${s.inner}"/>`;
      tail = `<g transform="translate(138 204)"><g class="fr-tail"><path d="M0 0C30 6 62 -14 58 -52C56 -74 36 -80 28 -64C40 -44 20 -22 -4 -22Z" fill="${F}" stroke="${D}" stroke-width="${sw}"/><path d="M57 -50C56 -74 36 -80 28 -64C36 -52 48 -46 57 -50Z" fill="#fff8ea"/></g></g>`;
      extra = `<path d="M100 104C80 100 58 110 46 100C44 132 70 150 100 150C130 150 156 132 154 100C142 110 120 100 100 104Z" fill="#fff8ea"/>`;
    } else if (type === 'kitten') {
      ears = `<path d="M44 66L50 10L94 42Z" fill="${F}" stroke="${D}" stroke-width="${sw}"/><path d="M56 50L58 26L78 42Z" fill="${s.inner}"/>
        <path d="M156 66L150 10L106 42Z" fill="${F}" stroke="${D}" stroke-width="${sw}"/><path d="M144 50L142 26L122 42Z" fill="${s.inner}"/>`;
      tail = `<g transform="translate(140 208)"><g class="fr-tail"><path d="M0 0C28 4 48 -18 40 -50C36 -66 54 -74 58 -60" fill="none" stroke="${D}" stroke-width="22"/><path d="M0 0C28 4 48 -18 40 -50C36 -66 54 -74 58 -60" fill="none" stroke="${F}" stroke-width="11"/></g></g>`;
      extra = `<path d="M88 44v16M100 40v20M112 44v16" stroke="${D}" stroke-width="5" fill="none" opacity=".7"/>`;
      over = `<path d="M52 110l-24 -5M52 118l-24 4M148 110l24 -5M148 118l24 4" stroke="${D}" stroke-width="2.500" fill="none"/>`;
    } else if (type === 'panda') {
      ears = `<circle cx="48" cy="46" r="21" fill="#2d2b3a" stroke="#17151f" stroke-width="5"/><circle cx="152" cy="46" r="21" fill="#2d2b3a" stroke="#17151f" stroke-width="5"/>`;
      extra = `<ellipse cx="73" cy="97" rx="19" ry="23" fill="#2d2b3a" transform="rotate(18 73 97)"/><ellipse cx="127" cy="97" rx="19" ry="23" fill="#2d2b3a" transform="rotate(-18 127 97)"/>`;
    }
    const eyeFill = type === 'panda' ? '#fff' : '#2b2140';
    const eye = (x) => `<g transform="translate(${x} 97)"><g class="fr-blink">${type === 'panda'
      ? '<circle r="8.500" fill="#fff"/><circle cx="1" cy="1" r="5.500" fill="#2b2140"/><circle cx="3" cy="-2" r="2.200" fill="#fff"/>'
      : `<ellipse rx="9" ry="11.500" fill="${eyeFill}"/><circle cx="3" cy="-4" r="3.800" fill="#fff"/><circle cx="-2.500" cy="4" r="1.800" fill="#fff"/>`}</g></g>`;
    const outline = type === 'panda' ? '#8a8799' : D;
    return `<svg class="friend friend-${type} ${cls}" viewBox="0 0 200 236" overflow="visible" paint-order="stroke" stroke-linejoin="round" stroke-linecap="round">
  <ellipse cx="100" cy="224" rx="62" ry="8" fill="#000" opacity=".15"/>
  <g class="fr-all">
    ${tail}
    <ellipse cx="100" cy="174" rx="46" ry="42" fill="${F}" stroke="${outline}" stroke-width="${sw}"/>
    <ellipse cx="100" cy="182" rx="27" ry="27" fill="${s.belly}"/>
    <ellipse cx="76" cy="214" rx="19" ry="10" fill="${limb}" stroke="${outline}" stroke-width="${sw}"/>
    <ellipse cx="124" cy="214" rx="19" ry="10" fill="${limb}" stroke="${outline}" stroke-width="${sw}"/>
    <ellipse cx="58" cy="170" rx="11" ry="19" fill="${limb}" stroke="${outline}" stroke-width="${sw}" transform="rotate(18 58 170)"/>
    <ellipse cx="142" cy="170" rx="11" ry="19" fill="${limb}" stroke="${outline}" stroke-width="${sw}" transform="rotate(-18 142 170)"/>
    <g transform="translate(100 140)"><g class="fr-head"><g transform="translate(-100 -140)">
      ${ears}
      <ellipse cx="100" cy="92" rx="64" ry="56" fill="${F}" stroke="${outline}" stroke-width="${sw}"/>
      ${extra}
      ${eye(74)}${eye(126)}
      <ellipse cx="56" cy="116" rx="10" ry="6.500" fill="#ff8fab" opacity=".6"/><ellipse cx="144" cy="116" rx="10" ry="6.500" fill="#ff8fab" opacity=".6"/>
      <path d="M94 108Q100 104 106 108Q104 115 100 115Q96 115 94 108Z" fill="${type === 'bunny' || type === 'kitten' ? '#ff8fab' : '#2b2140'}"/>
      <path d="M89 119Q94.500 126 100 119Q105.500 126 111 119" fill="none" stroke="#2b2140" stroke-width="3"/>
      ${over}
    </g></g></g>
  </g></svg>`.replace(/(\d)\.(\d)00\b/g, '$1.$2');
  }

  /* ---------------- Shop items (each drawn in a 100 x 100 box) ---------------- */
  const ITEMS = {
    apple: '<path d="M50 32C32 18 12 34 16 58C19 80 36 93 50 86C64 93 81 80 84 58C88 34 68 18 50 32Z" fill="#ff5a5f" stroke="#b8262c" stroke-width="5"/><path d="M50 32Q49 20 56 12" fill="none" stroke="#7a4a21" stroke-width="5"/><path d="M57 20Q72 8 80 20Q66 30 57 20Z" fill="#5ad67d" stroke="#1f8f5a" stroke-width="4"/><ellipse cx="33" cy="50" rx="6" ry="11" fill="#fff" opacity=".5" transform="rotate(16 33 50)"/>',
    fish: '<path d="M70 50L93 30Q88 50 93 70Z" fill="#5fb6f2" stroke="#2470b3" stroke-width="5"/><ellipse cx="44" cy="50" rx="34" ry="21" fill="#9fdcff" stroke="#2470b3" stroke-width="5"/><path d="M40 31Q50 18 60 32" fill="#5fb6f2" stroke="#2470b3" stroke-width="4"/><path d="M50 40q8 10 0 20M60 42q6 8 0 16" fill="none" stroke="#5fb6f2" stroke-width="3.500"/><circle cx="26" cy="45" r="5" fill="#fff"/><circle cx="25" cy="45" r="2.800" fill="#2b2140"/><path d="M16 56q5 4 10 2" fill="none" stroke="#2470b3" stroke-width="3"/>',
    cake: '<ellipse cx="50" cy="86" rx="42" ry="8" fill="#e6e9f5" stroke="#aab3c8" stroke-width="3"/><rect x="18" y="48" width="64" height="36" rx="8" fill="#ffe0a8" stroke="#c98a3a" stroke-width="5"/><path d="M18 56Q18 44 30 44H70Q82 44 82 56Q76 68 68 58Q60 70 52 58Q44 70 36 58Q28 68 18 56Z" fill="#ff8fc1" stroke="#c93a82" stroke-width="5"/><rect x="46" y="22" width="8" height="22" rx="3" fill="#7fd6ff" stroke="#2470b3" stroke-width="3"/><path d="M50 8Q57 16 50 22Q43 16 50 8Z" fill="#ffb02e" stroke="#e06a00" stroke-width="2.500"/><circle cx="30" cy="74" r="2.500" fill="#59d8ff"/><circle cx="46" cy="76" r="2.500" fill="#ff5d8f"/><circle cx="62" cy="73" r="2.500" fill="#5ad67d"/><circle cx="72" cy="78" r="2.500" fill="#ffd23f"/>',
    chili: '<path d="M30 28C56 26 84 46 84 84C60 82 34 68 24 42Q24 32 30 28Z" fill="#ff3d3d" stroke="#a31515" stroke-width="5"/><path d="M34 38Q54 42 68 62" fill="none" stroke="#ff9d9d" stroke-width="4"/><path d="M34 30Q24 22 22 10" fill="none" stroke="#2f9e5a" stroke-width="7"/><path d="M20 38Q24 24 40 26Q36 36 20 38Z" fill="#4fd67d" stroke="#1f8f5a" stroke-width="4"/>',
    balloons: '<path d="M30 52Q40 74 50 96M56 44Q52 70 50 96M74 58Q60 78 50 96" fill="none" stroke="#8d84b5" stroke-width="2.500"/><ellipse cx="30" cy="30" rx="17" ry="21" fill="#ff5d8f" stroke="#c9285c" stroke-width="4.500"/><ellipse cx="74" cy="36" rx="17" ry="21" fill="#4db8ff" stroke="#1f6fc2" stroke-width="4.500"/><ellipse cx="54" cy="24" rx="17" ry="21" fill="#ffd23f" stroke="#d69a00" stroke-width="4.500"/><ellipse cx="48" cy="16" rx="4" ry="7" fill="#fff" opacity=".65" transform="rotate(24 48 16)"/><ellipse cx="24" cy="22" rx="4" ry="7" fill="#fff" opacity=".6" transform="rotate(24 24 22)"/><ellipse cx="68" cy="28" rx="4" ry="7" fill="#fff" opacity=".6" transform="rotate(24 68 28)"/>',
    poster: `<rect x="14" y="6" width="72" height="88" rx="5" fill="#2b2d6e" stroke="#fff6dc" stroke-width="6"/><path d="M64 22a13 13 0 1 0 10 21a11 11 0 1 1 -10 -21z" fill="#ffe27a"/><polygon points="${starPoints(36, 34, 8, 3.6)}" fill="#ffd23f"/><polygon points="${starPoints(52, 62, 6, 2.7)}" fill="#fff"/><polygon points="${starPoints(30, 74, 5, 2.2)}" fill="#7fd6ff"/><polygon points="${starPoints(70, 76, 6, 2.7)}" fill="#ff8fc1"/><path d="M36 34L52 62L30 74M52 62L70 76" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.500"/>`,
    rug: '<ellipse cx="50" cy="50" rx="48" ry="24" fill="#ff6b8b" stroke="#c9285c" stroke-width="3"/><ellipse cx="50" cy="50" rx="40" ry="19.500" fill="#ffa24a"/><ellipse cx="50" cy="50" rx="32" ry="15.500" fill="#ffd23f"/><ellipse cx="50" cy="50" rx="24" ry="11.500" fill="#5ad67d"/><ellipse cx="50" cy="50" rx="16" ry="7.500" fill="#4db8ff"/><ellipse cx="50" cy="50" rx="8" ry="3.800" fill="#a07bff"/>',
    plant: '<path d="M50 66Q40 30 18 26Q20 52 50 66Z" fill="#4fd67d" stroke="#1f8f5a" stroke-width="5"/><path d="M50 66Q60 26 84 22Q82 52 50 66Z" fill="#6ee59a" stroke="#1f8f5a" stroke-width="5"/><path d="M50 66Q42 20 52 6Q64 22 50 66Z" fill="#3cc474" stroke="#1f8f5a" stroke-width="5"/><path d="M28 62H72L66 94H34Z" fill="#ff9f6b" stroke="#c9541a" stroke-width="5"/><path d="M26 60H74V70H26Z" fill="#ffb98c" stroke="#c9541a" stroke-width="5"/>',
    lamp: '<circle cx="50" cy="40" r="44" fill="#fff3a8" opacity=".28" class="glow"/><path d="M40 54H60L66 92H34Z" fill="#fff6dc" stroke="#cdb48a" stroke-width="5"/><path d="M10 58Q14 12 50 12Q86 12 90 58Q50 68 10 58Z" fill="#ff5a5f" stroke="#b8262c" stroke-width="5"/><circle cx="34" cy="34" r="7" fill="#fff"/><circle cx="60" cy="28" r="9" fill="#fff"/><circle cx="72" cy="48" r="5.500" fill="#fff"/><circle cx="48" cy="50" r="4.500" fill="#fff"/><circle cx="22" cy="50" r="4" fill="#fff"/>',
    lights: '<path d="M4 30Q28 62 50 44Q72 28 96 56" fill="none" stroke="#5b4a8a" stroke-width="3.500"/><g stroke="#00000022" stroke-width="2"><ellipse cx="16" cy="48" rx="7" ry="9" fill="#ff5d8f"/><ellipse cx="34" cy="56" rx="7" ry="9" fill="#ffd23f"/><ellipse cx="52" cy="50" rx="7" ry="9" fill="#5ad67d"/><ellipse cx="70" cy="44" rx="7" ry="9" fill="#4db8ff"/><ellipse cx="88" cy="56" rx="7" ry="9" fill="#a07bff"/></g>',
    shelf: '<rect x="8" y="8" width="84" height="84" rx="6" fill="#c98a4b" stroke="#7a4a21" stroke-width="5"/><rect x="15" y="15" width="70" height="32" fill="#8a5a2b"/><rect x="15" y="54" width="70" height="32" fill="#8a5a2b"/><rect x="19" y="19" width="9" height="28" fill="#ff5d8f"/><rect x="29" y="24" width="8" height="23" fill="#ffd23f"/><rect x="38" y="17" width="10" height="30" fill="#4db8ff"/><rect x="49" y="22" width="7" height="25" fill="#5ad67d"/><path d="M60 47L66 20L75 22L71 47Z" fill="#a07bff"/><rect x="19" y="60" width="10" height="26" fill="#5ad67d"/><rect x="30" y="57" width="8" height="29" fill="#ff9f43"/><rect x="39" y="63" width="9" height="23" fill="#e36bff"/>' +
      `<polygon points="${starPoints(66, 72, 12, 5.4)}" fill="#ffd23f" stroke="#c98500" stroke-width="2.500"/>`,
    bed: '<ellipse cx="50" cy="84" rx="46" ry="9" fill="#000" opacity=".12"/><g fill="#e3f1ff" stroke="#8fb6e0" stroke-width="5"><circle cx="22" cy="62" r="18"/><circle cx="78" cy="62" r="18"/><circle cx="42" cy="50" r="22"/><circle cx="62" cy="52" r="20"/><rect x="18" y="58" width="64" height="24" rx="12"/></g><g fill="#e3f1ff"><circle cx="22" cy="62" r="15.500"/><circle cx="78" cy="62" r="15.500"/><circle cx="42" cy="50" r="19.500"/><circle cx="62" cy="52" r="17.500"/><rect x="20" y="58" width="60" height="22" rx="11"/></g><ellipse cx="34" cy="46" rx="20" ry="11" fill="#ffc7de" stroke="#e080ab" stroke-width="4" transform="rotate(-12 34 46)"/>',
    chest: '<path d="M22 44Q30 24 50 30Q70 22 78 44Z" fill="#ffd23f" stroke="#c98500" stroke-width="3"/><circle cx="40" cy="38" r="7" fill="#ffe27a" stroke="#c98500" stroke-width="2.500"/><circle cx="58" cy="36" r="7" fill="#ffe27a" stroke="#c98500" stroke-width="2.500"/><path d="M46 26l6 -8 6 8 -6 10z" fill="#59d8ff" stroke="#1492c9" stroke-width="2.500"/><path d="M8 34Q8 8 34 8H66Q92 8 92 34V40H8Z" fill="#b5713a" stroke="#6b3d16" stroke-width="5" transform="translate(0 -14) rotate(-10 50 30)" opacity="0"/><rect x="10" y="44" width="80" height="46" rx="6" fill="#b5713a" stroke="#6b3d16" stroke-width="5"/><path d="M10 58H90" stroke="#6b3d16" stroke-width="4"/><rect x="22" y="44" width="10" height="46" fill="#ffd23f" stroke="#c98500" stroke-width="3"/><rect x="68" y="44" width="10" height="46" fill="#ffd23f" stroke="#c98500" stroke-width="3"/><rect x="42" y="52" width="16" height="16" rx="4" fill="#ffd23f" stroke="#c98500" stroke-width="3"/><circle cx="50" cy="60" r="2.800" fill="#6b3d16"/>',
  };
  function item(id) {
    let inner = ITEMS[id];
    if (!inner && WEAR[id]) { const w = WEAR[id]; inner = `<g transform="translate(${w.icon[0]} ${w.icon[1]}) scale(${w.icon[2]})">${w.svg}</g>`; }
    return `<svg class="item item-${id}" viewBox="0 0 100 100" overflow="visible" stroke-linejoin="round" stroke-linecap="round">${(inner || '').replace(/(\d)\.(\d)00\b/g, '$1.$2')}</svg>`;
  }
  const itemInner = id => (ITEMS[id] || '').replace(/(\d)\.(\d)00\b/g, '$1.$2');

  /* ---------------- The den (the pet's room) ---------------- */
  function room(owned = {}) {
    const has = id => !!owned[id];
    const at = (id, x, y, s, sx = 1) => has(id) ? `<g class="room-item ri-${id}" transform="translate(${x} ${y}) scale(${s * sx} ${s})" stroke-linejoin="round" stroke-linecap="round">${itemInner(id)}</g>` : '';
    let lights = '';
    if (has('lights')) {
      const cols = ['#ff5d8f', '#ffd23f', '#5ad67d', '#4db8ff', '#a07bff', '#ff9f43'];
      let d = 'M-420 38', bulbs = '';
      for (let i = 0; i < 12; i++) {
        const x0 = -420 + i * 180, x1 = x0 + 180;
        d += `Q${x0 + 90} 120 ${x1} 38`;
        for (let k = 1; k <= 3; k++) {
          const t = k / 4, bx = x0 + 180 * t, by = 38 + 82 * 2 * t * (1 - t);
          bulbs += `<ellipse class="bulb" style="animation-delay:${((i * 3 + k) % 7) * 0.3}s" cx="${bx}" cy="${by + 11}" rx="9" ry="12" fill="${cols[(i * 3 + k) % cols.length]}"/>`;
        }
      }
      lights = `<path d="${d}" fill="none" stroke="#4b3a7a" stroke-width="4"/>${bulbs}`;
    }
    const planks = [];
    for (let i = 0; i < 6; i++) planks.push(`<path d="M-420 ${512 + i * 38 + i * i * 2}H1700" stroke="#c98f52" stroke-width="3" opacity=".55"/>`);
    const dots = [];
    for (let i = 0; i < 46; i++) {
      const x = -380 + ((i * 197) % 2040), y = 30 + ((i * 131) % 420);
      dots.push(`<polygon points="${starPoints(x, y, 7, 3)}" fill="#fff" opacity=".16"/>`);
    }
    return `<svg class="room" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet" overflow="visible">
  <defs>
    <linearGradient id="rm-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8f79e8"/><stop offset="1" stop-color="#b9a2f7"/></linearGradient>
    <linearGradient id="rm-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c88d"/><stop offset="1" stop-color="#dfa468"/></linearGradient>
    <linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ec2ff"/><stop offset="1" stop-color="#d8f4ff"/></linearGradient>
    <clipPath id="rm-win"><path d="M880 400V210a110 110 0 0 1 220 0V400Z"/></clipPath>
  </defs>
  <rect x="-420" y="-300" width="2120" height="800" fill="url(#rm-wall)"/>
  ${dots.join('')}
  <rect x="-420" y="486" width="2120" height="534" fill="url(#rm-floor)"/>
  ${planks.join('')}
  <rect x="-420" y="470" width="2120" height="22" fill="#6f58c9"/>
  <rect x="-420" y="470" width="2120" height="6" fill="#8f79e8"/>
  <g>
    <path d="M880 400V210a110 110 0 0 1 220 0V400Z" fill="url(#rm-sky)"/>
    <g clip-path="url(#rm-win)">
      <circle cx="1050" cy="170" r="30" fill="#fff3a8"/><circle cx="1050" cy="170" r="46" fill="#fff3a8" opacity=".35"/>
      <g class="win-cloud"><ellipse cx="930" cy="200" rx="34" ry="14" fill="#fff"/><ellipse cx="950" cy="190" rx="22" ry="14" fill="#fff"/></g>
      <g class="win-cloud wc2"><ellipse cx="1030" cy="262" rx="28" ry="11" fill="#fff"/><ellipse cx="1014" cy="254" rx="18" ry="11" fill="#fff"/></g>
      <path d="M860 372Q930 300 1000 352Q1060 310 1120 360V410H860Z" fill="#7ddc8f"/>
      <path d="M860 392Q940 344 1010 380Q1070 352 1120 384V410H860Z" fill="#4fc777"/>
    </g>
    <path d="M880 400V210a110 110 0 0 1 220 0V400Z" fill="none" stroke="#fff6dc" stroke-width="16" stroke-linejoin="round"/>
    <path d="M990 104V400M880 262H1100" stroke="#fff6dc" stroke-width="9"/>
    <rect x="862" y="394" width="256" height="20" rx="8" fill="#fff6dc" stroke="#d9c9a0" stroke-width="3"/>
  </g>
  ${lights}
  ${at('shelf', 316, 150, 2.1)}
  ${at('poster', 600, 118, 1.9)}
  ${at('balloons', 1130, 250, 2.3)}
  ${at('rug', 290, 455, 3, 7 / 3)}
  ${at('plant', 30, 380, 2.3)}
  ${at('bed', 880, 372, 2.5)}
  ${at('chest', 236, 420, 1.6)}
  ${at('lamp', 1110, 388, 2)}
</svg>`.replace(/(\d)\.(\d)00\b/g, '$1.$2');
  }

  /* ---------------- Hands for the finger guide ---------------- */
  function hand(side) {
    const ids = side === 'left' ? ['L1', 'L2', 'L3', 'L4'] : ['R1', 'R2', 'R3', 'R4'];
    // drawn as a left hand (pinky first); the right hand is mirrored
    const f = [[20, 66, 25, 86], [50, 38, 27, 112], [82, 24, 27, 124], [114, 42, 27, 108]];
    const fingers = f.map(([x, y, w, h], i) => `<g class="fg fg-${ids[i]}"><rect class="fg-body" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}"/><rect class="fg-tip" x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${w - 4}" rx="${(w - 8) / 2}" fill="${FINGER_COLORS[ids[i]]}"/></g>`).join('');
    return `<svg class="hand hand-${side}" viewBox="0 0 190 200" overflow="visible">
  <g ${side === 'right' ? 'transform="translate(190 0) scale(-1 1)"' : ''} stroke-linejoin="round">
    <g class="fg fg-T fg-T-${side}"><rect class="fg-body" x="140" y="96" width="29" height="78" rx="14.500" transform="rotate(38 154 150)"/><rect class="fg-tip" x="144" y="100" width="21" height="24" rx="10.500" fill="${FINGER_COLORS.T}" transform="rotate(38 154 150)"/></g>
    <rect class="palm" x="18" y="122" width="126" height="78" rx="34"/>
    ${fingers}
  </g></svg>`;
  }

  return { shade, ic, dragon, dragonInner, egg, friend, item, room, hand, starPoints, FINGER_COLORS, WEAR, wearSlot };
})();
