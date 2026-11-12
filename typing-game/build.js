#!/usr/bin/env node
/* Packs everything in src/ into one file, index.html, that runs by double-clicking it.
   Usage: node build.js */
'use strict';
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const b64 = f => fs.readFileSync(path.join(src, f)).toString('base64');

const JS = ['data', 'content', 'state', 'audio', 'art', 'scene', 'dragon', 'combat', 'keyboard', 'missions', 'ui', 'screens', 'map', 'level', 'mini', 'parent'];

const fonts = `
@font-face { font-family: 'Exo 2'; font-weight: 100 900; font-display: block; src: url(data:font/woff2;base64,${b64('fonts/exo2.woff2')}) format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 100 800; font-display: block; src: url(data:font/woff2;base64,${b64('fonts/jetbrains-mono.woff2')}) format('woff2'); }`;

const css = read('style.css').replace('/*__FONTS__*/', fonts);
const js = JS.map(n => `/* ---- ${n}.js ---- */\n` + read(`js/${n}.js`)).join('\n');
if (js.includes('</script')) throw new Error('A script contains a closing script tag');

const html = read('index.html').replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
const out = path.join(__dirname, 'index.html');
fs.writeFileSync(out, html);
console.log(`Built ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KB)`);
