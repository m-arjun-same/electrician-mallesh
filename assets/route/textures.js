export function rng(seed) {
let s = seed >>> 0 || 1;
return () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909), (s ^= s >>> 16) >>> 0) / 4294967296);
}
const PAL = {
ember: [['#2a1631', '#7a3a4c', '#e59a6a'], ['#1b1426', '#5a3157', '#f0b27e'], ['#20152a', '#6d3a3a', '#d98a5c']],
violet: [['#171208', '#5c3d1e', '#e2a458'], ['#120e0c', '#46332a', '#ffd9a0'], ['#1a1208', '#6b4423', '#f5c98a']],
isle: [['#16130c', '#5a4a2f', '#e8d9ae'], ['#100f0c', '#4c4230', '#efe3c2'], ['#181410', '#655234', '#f2e7c8']],
silent: [['#121117', '#2a2830', '#6b6676']],
};
let NT = null;
function noiseTile() {
if (NT) return NT;
NT = document.createElement('canvas'); NT.width = NT.height = 256;
const g = NT.getContext('2d'), id = g.createImageData(256, 256), r = rng(99);
for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
g.putImageData(id, 0, 0); return NT;
}
export function placeholderPhoto(year, idx, palette, w = 960, h = 640) {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
const r = rng(year * 131 + idx * 977 + 7);
const set = PAL[palette] || PAL.violet;
const [a, b, hi] = set[(idx + year) % set.length];
const sky = g.createLinearGradient(0, 0, 0, h);
sky.addColorStop(0, a); sky.addColorStop(0.62, b); sky.addColorStop(1, a);
g.fillStyle = sky; g.fillRect(0, 0, w, h);
const lx = w * (0.25 + r() * 0.5), ly = h * (0.3 + r() * 0.25);
const sun = g.createRadialGradient(lx, ly, 0, lx, ly, w * 0.55);
sun.addColorStop(0, hi); sun.addColorStop(0.18, hi + 'aa'); sun.addColorStop(1, hi + '00');
g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55; g.fillStyle = sun; g.fillRect(0, 0, w, h);
g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
const hy = h * (0.62 + r() * 0.08);
g.fillStyle = a;
g.beginPath(); g.moveTo(0, h);
if (palette === 'violet') {
let x = 0; g.lineTo(0, hy);
while (x < w) { const bw = 18 + r() * 60, bh = 20 + r() * h * 0.28; g.lineTo(x, hy - bh); g.lineTo(x + bw, hy - bh); x += bw; }
g.lineTo(w, hy);
} else if (palette === 'isle') {
for (let x = 0; x <= w; x += 8) g.lineTo(x, hy - 40 * Math.sin(x / w * 3 + r() * 0.05 + idx) - 26 * Math.sin(x / w * 7.3 + year));
} else {
for (let x = 0; x <= w; x += 10) g.lineTo(x, hy + 10 * Math.sin(x / w * 5 + idx) - (x > w * 0.6 && x < w * 0.64 ? 70 : 0));
}
g.lineTo(w, h); g.closePath(); g.fill();
g.globalCompositeOperation = 'lighter';
for (let i = 0; i < 160; i++) {
const x = r() * w, y = hy + (palette === 'violet' ? -r() * h * 0.25 : r() * (h - hy));
g.fillStyle = hi + (palette === 'violet' ? '66' : '22');
g.fillRect(x, y, palette === 'violet' ? 3 : 10 + r() * 30, palette === 'violet' ? 4 : 1);
}
for (let i = 0; i < 26; i++) {
const x = r() * w, y = r() * h * 0.7, rad = 6 + r() * 34;
const bk = g.createRadialGradient(x, y, 0, x, y, rad);
bk.addColorStop(0, hi + '40'); bk.addColorStop(1, hi + '00');
g.fillStyle = bk; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
}
g.globalCompositeOperation = 'source-over';
const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75);
v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
g.fillStyle = v; g.fillRect(0, 0, w, h);
g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.5;
g.fillStyle = g.createPattern(noiseTile(), 'repeat'); g.fillRect(0, 0, w, h);
g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
g.font = '500 30px Bricolage, sans-serif';
g.fillStyle = 'rgba(244,240,232,.86)';
g.fillText(`${year} · ${document.documentElement.lang === 'uk' ? 'фото' : 'photo'} ${idx + 1}`, 38, h - 40);
return c;
}
function drain(it) { let r = it.next(); while (!r.done) r = it.next(); return r.value; }
function* brushInkSteps(text, font, w, h, x, y, color, seed) {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
const r = rng(seed);
g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = color;
for (let i = 0; i < 4; i++) { g.globalAlpha = i ? 0.22 : 1; g.fillText(text, x + (r() - 0.5) * 3, y + (r() - 0.5) * 3); }
g.globalAlpha = 1;
const mask = g.getImageData(0, 0, w, h);
yield;
g.globalCompositeOperation = 'destination-out';
for (let yy = 0; yy < h; yy += 3 + r() * 5) {
let xx = 0;
while (xx < w) {
const len = 20 + r() * 160, gap = 30 + r() * 220;
if (r() < 0.3) { g.globalAlpha = 0.12 + r() * 0.35; g.fillRect(xx, yy + xx * -0.06, len * 0.6, 0.8 + r() * 1.2); }
xx += len + gap;
}
}
g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
yield;
g.fillStyle = color;
const d = mask.data;
for (let i = 0; i < 2600; i++) {
const px = (r() * w) | 0, py = (r() * h) | 0;
if (d[(py * w + px) * 4 + 3] > 120) {
const ang = r() * 6.283, dist = 3 + r() * r() * 26;
g.globalAlpha = 0.35 + r() * 0.6;
g.beginPath(); g.arc(px + Math.cos(ang) * dist, py + Math.sin(ang) * dist, 0.6 + r() * 1.6, 0, 6.283); g.fill();
}
}
g.globalAlpha = 1;
return c;
}
function seal(g, x, y, s) {
g.save(); g.translate(x, y); g.rotate(-0.06);
g.fillStyle = '#c8382c'; g.globalAlpha = 0.92;
g.beginPath(); g.roundRect(0, 0, s, s, s * 0.12); g.fill();
g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1;
g.font = `italic ${s * 0.78}px Instrument, serif`; g.textAlign = 'center';
g.fillText('s', s * 0.5, s * 0.72);
g.restore();
}
const STACK_MAX = 1250;
function haze(g, cx, cy, rx, ry, k = 0.3) {
g.save(); g.translate(cx, cy); g.scale(rx, ry);
const r = g.createRadialGradient(0, 0, 0, 0, 0, 1);
[[0, 1], [0.35, 0.92], [0.6, 0.62], [0.8, 0.28], [0.93, 0.07], [1, 0]].forEach(([o, v]) => r.addColorStop(o, `rgba(8,7,12,${(k * v).toFixed(3)})`));
g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, 6.2832); g.fill(); g.restore();
}
function shadowed(g, t, x, y, k = 0.7) { g.save(); g.shadowColor = `rgba(8,7,12,${k})`; g.shadowBlur = 18; g.fillText(t, x, y); g.restore(); }   // longest stack line in px of the 2000 px plate: short lines, little run into the depth
function stackFonts(quiet) {
return {
stamp: { f: (z) => `600 ${z}px Bricolage, sans-serif`, z: 50, ls: 16 },
line: { f: (z) => `${quiet ? 500 : 600} ${z}px Bricolage, sans-serif`, z: 100, ls: 0 },
key: { f: (z) => `italic 400 ${z}px Instrument, Georgia, serif`, z: 140, ls: 0 },
};
}
export function yearPlate(spec, w = 2000) { return drain(yearPlateSteps(spec, w)); }
export function* yearPlateSteps({ year, caption, kicker, quiet, stack }, w = 2000) {
stack = stack && stack.length ? stack : [[caption.replace(/^\d{4}\s—\s/, ''), 'key']];
const F = stackFonts(quiet), m = document.createElement('canvas').getContext('2d');
const meas = (t, r, z) => { m.font = F[r].f(z); m.letterSpacing = `${F[r].ls}px`; const v = m.measureText(r === 'stamp' ? t.toUpperCase() : t).width; m.letterSpacing = '0px'; return v; };
let k = 1; stack.forEach(([t, r]) => { if (r !== 'stamp') k = Math.min(k, STACK_MAX / meas(t, r, F[r].z)); });
const L = stack.map(([t, r]) => { const z = r === 'stamp' ? F[r].z : Math.round(F[r].z * k); return { t: r === 'stamp' ? t.toUpperCase() : t, r, z, wd: meas(t, r, z) }; });
let y = 560; const YB = 500;
L.forEach((l, i) => { const prev = L[i - 1]; y += (prev ? Math.round(0.4 * Math.max(prev.z, l.z)) : 70) + Math.round(l.z * 0.78); l.y = y; y += Math.round(l.z * 0.24); });
const h = y + 70;
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
const ink = quiet ? '#a39dab' : '#f6f1e8';
let fs = quiet ? 380 : 410; g.font = `italic 400 ${fs}px Instrument, Georgia, serif`;
const tw = g.measureText(String(year)).width; if (tw > w - 420) fs = Math.floor(fs * (w - 420) / tw);
const yearFont = `italic 400 ${fs}px Instrument, Georgia, serif`;
g.font = yearFont; const yw = g.measureText(String(year)).width, x0 = Math.round((w - yw) / 2);
const yc = yield* brushInkSteps(String(year), yearFont, w, h, x0, YB, ink, String(year).length * 977 + fs);
yield;
if (!quiet) { // soft violet bloom under the ink
g.save(); g.filter = 'blur(28px)'; g.globalAlpha = 0.55; g.drawImage(yc, 0, 0); g.restore();
yield;
g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#e2a458'; g.fillRect(0, 0, w, h); g.restore();
}
yield;
g.font = yearFont; g.fillStyle = ink; shadowed(g, String(year), x0, YB, 0.55);
g.drawImage(yc, 0, 0);
if (kicker) {
g.font = '600 46px Bricolage, sans-serif'; g.letterSpacing = '8px'; g.textAlign = 'center';
g.fillStyle = '#b8a4ff'; g.fillText(kicker.toUpperCase(), w / 2, 100);
g.letterSpacing = '0px'; g.textAlign = 'left';
}
if (!quiet) seal(g, Math.min(w - 210, x0 + yw + 40), 170, 104);
const col = { stamp: quiet ? '#9d97a6' : '#d9c7a8', line: quiet ? '#a9a3b2' : '#efe9df', key: quiet ? '#c2bdc9' : '#f7f2e9' };
g.textAlign = 'center';
c.bands = [];
for (let i = 0; i < L.length; i++) {
const l = L[i];
g.font = F[l.r].f(l.z); g.letterSpacing = `${F[l.r].ls}px`;
if (l.r === 'key' && !quiet) { g.save(); g.filter = 'blur(16px)'; g.fillStyle = '#e2a458'; g.globalAlpha = 0.42; g.fillText(l.t, w / 2, l.y); g.restore(); }
g.fillStyle = col[l.r]; shadowed(g, l.t, w / 2 + (l.r === 'stamp' ? F.stamp.ls / 2 : 0), l.y);
if (l.r === 'stamp') { // hairlines either side: a place mark, not a heading
g.fillStyle = quiet ? 'rgba(157,151,166,.6)' : 'rgba(217,199,168,.6)';
g.fillRect(w / 2 - l.wd / 2 - 118, l.y - l.z * 0.34, 84, 3); g.fillRect(w / 2 + l.wd / 2 + 34, l.y - l.z * 0.34, 84, 3);
}
g.letterSpacing = '0px';
const prev = L[i - 1], next = L[i + 1];
const top = prev ? (prev.y + l.y - l.z * 0.78) / 2 : l.y - l.z * 1.1, bot = next ? (l.y + next.y - next.z * 0.78) / 2 : Math.min(h, l.y + l.z * 0.5);
const half = l.wd / 2 + (l.r === 'stamp' ? 140 : 40);
c.bands.push([top / h, bot / h, (w / 2 - half) / w, (w / 2 + half) / w]);
if (i < L.length - 2) yield;   /* never between the last line and the haze: a pause there shifts a few edge pixels */
}
g.textAlign = 'left';
g.globalCompositeOperation = 'destination-over'; haze(g, w / 2, h * 0.55, w * 0.5, h * 0.56, quiet ? 0.26 : 0.32); g.globalCompositeOperation = 'source-over';
return c;
}
export function routePlate(text, w = 1400, h = 300) {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
g.beginPath(); g.fillStyle = '#c8382c'; g.arc(60, 150, 18, 0, 6.283); g.fill();
g.font = '500 92px Bricolage, sans-serif'; g.fillStyle = '#efe9df';
g.save(); g.filter = 'blur(14px)'; g.fillStyle = '#e2a458'; g.globalAlpha = 0.6; g.fillText(text, 110, 182); g.restore();
g.fillText(text, 110, 182);
return c;
}
export function notePlate(text, w = 2000) {
const [main, sub] = text.split('\n\n');
const split = (t) => { const l = t.split('\n'); return l.length === 1 && t.length > 40 && t.includes(' · ') ? t.split(' · ') : l; };
const L = [...split(main).map((t) => ({ t, k: 1 })), ...(sub ? split(sub).map((t) => ({ t, k: 0.72, sub: true })) : [])];
const g0 = document.createElement('canvas').getContext('2d');
let fs = 120; g0.font = `italic 400 ${fs}px Instrument, Georgia, serif`;
const tw = Math.max(...L.map((l) => g0.measureText(l.t).width * l.k)); if (tw > w - 260) fs = Math.floor(fs * (w - 260) / tw);
let y = 0; L.forEach((l, i) => { l.z = Math.round(fs * l.k); if (i) y += Math.round(l.z * 1.2) + (l.sub && !L[i - 1].sub ? Math.round(fs * 0.5) : 0); l.y = y; });
const h = L.length === 1 ? 325 : Math.round(y + 325 - (L.length > 1 ? 0 : 0));
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
const off = (h - y) / 2 + fs * 0.32;
g.fillStyle = 'rgba(239,226,206,.7)'; g.fillRect(40, off - fs * 0.32 - 2, 150, 3);
c.bands = [];
L.forEach((l, i) => {
const yy = off + l.y; g.font = `italic 400 ${l.z}px Instrument, Georgia, serif`;
g.save(); g.filter = 'blur(16px)'; g.fillStyle = '#e8b98a'; g.globalAlpha = l.sub ? 0.3 : 0.45; g.fillText(l.t, 230, yy); g.restore();
g.fillStyle = l.sub ? 'rgba(241,231,214,.86)' : '#f1e7d6'; shadowed(g, l.t, 230, yy);
const wd = g.measureText(l.t).width, prev = L[i - 1], next = L[i + 1];
const top = prev ? (off + prev.y + yy - l.z * 0.8) / 2 : 0, bot = next ? (yy + off + next.y - next.z * 0.8) / 2 : h;
c.bands.push([top / h, bot / h, (i ? 200 : 20) / w, (260 + wd) / w]);
});
g.globalCompositeOperation = 'destination-over'; haze(g, w * 0.42, h / 2, w * 0.44, h * 0.62, 0.3); g.globalCompositeOperation = 'source-over';
return c;
}
export function skylineGrains(seed = 2013, w = 1800, h = 760) { return drain(skylineSteps(seed, w, h)); }
export function* skylineSteps(seed = 2013, w = 1800, h = 760) {
const m = document.createElement('canvas'); m.width = w; m.height = h;
const mg = m.getContext('2d'); const r = rng(seed);
const base = h * 0.8;
mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(0, base);
let x = 0;
while (x < w) {
const bw = 30 + r() * 90, t = r();
let bh = 60 + r() * 220;
if (t < 0.08) { // church dome
mg.lineTo(x, base - bh); mg.arc(x + bw / 2, base - bh, bw / 2, Math.PI, 0); mg.lineTo(x + bw / 2, base - bh - bw / 2 - 50); mg.lineTo(x + bw, base - bh);
} else if (t < 0.16) { // tower block
bh += 160; mg.lineTo(x, base - bh); mg.lineTo(x + bw * 0.7, base - bh);
} else if (t < 0.2) { // chimney
mg.lineTo(x, base - bh); mg.lineTo(x + 12, base - bh); mg.lineTo(x + 12, base - bh - 200); mg.lineTo(x + 26, base - bh - 200); mg.lineTo(x + 26, base - bh); mg.lineTo(x + bw, base - bh);
} else { mg.lineTo(x, base - bh); mg.lineTo(x + bw, base - bh); }
x += bw;
}
mg.lineTo(w, base); mg.lineTo(w, base + 6); mg.lineTo(0, base + 6); mg.closePath(); mg.fill();
const md = mg.getImageData(0, 0, w, h).data;
yield;
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
const cols = ['#ffd2a8', '#ffb37a', '#e8bd7f', '#f4f0e8'];
for (let i = 0; i < 160000; i++) {
const px = r() * w, py = r() * h, inside = md[((py | 0) * w + (px | 0)) * 4 + 3] > 100;
if (!inside && r() > 0.012) continue;
const edge = inside && md[(((py - 5) | 0) * w + (px | 0)) * 4 + 3] < 100;
g.globalAlpha = inside ? (edge ? 1 : 0.5 + r() * 0.5) : 0.35;
g.fillStyle = cols[(r() * cols.length) | 0];
const d = edge ? 4.4 : 1.6 + r() * 2.2; g.fillRect(px - d / 2, py - d / 2, d, d);
if ((i & 32767) === 32767) yield;
}
for (let i = 0; i < 700; i++) {
const px = r() * w, py = base - r() * 400;
if (md[((py | 0) * w + (px | 0)) * 4 + 3] > 100) { g.globalAlpha = 0.9; g.fillStyle = '#ffcf8a'; g.fillRect(px, py, 3, 4); }
}
g.globalAlpha = 1;
yield;
g.save(); g.filter = 'blur(10px)'; g.globalAlpha = 0.55; g.globalCompositeOperation = 'lighter'; g.drawImage(c, 0, 0); g.restore();
yield;
const fm = g.createLinearGradient(0, 0, w, 0);
fm.addColorStop(0, 'rgba(0,0,0,0)'); fm.addColorStop(0.16, 'rgba(0,0,0,1)'); fm.addColorStop(0.84, 'rgba(0,0,0,1)'); fm.addColorStop(1, 'rgba(0,0,0,0)');
g.globalCompositeOperation = 'destination-in'; g.fillStyle = fm; g.fillRect(0, 0, w, h);
g.globalCompositeOperation = 'source-over';
return c;
}
export function pendingPlate(name, w = 1200, h = 800) {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d');
g.fillStyle = '#121019'; g.fillRect(0, 0, w, h);
g.strokeStyle = 'rgba(164,139,255,.55)'; g.lineWidth = 3; g.setLineDash([14, 12]);
g.strokeRect(36, 36, w - 72, h - 72); g.setLineDash([]);
g.fillStyle = '#c8382c'; g.beginPath(); g.arc(90, 96, 12, 0, 6.283); g.fill();
g.fillStyle = '#efe9df'; g.font = `italic ${Math.round(h * 0.13)}px Instrument, serif`;
g.fillText(name, 84, h * 0.56);
g.fillStyle = 'rgba(195,188,207,.8)'; g.font = `500 ${Math.round(h * 0.05)}px Bricolage, sans-serif`;
g.fillText(document.documentElement.lang === 'uk' ? 'Знімок готується' : 'Capture pending', 86, h * 0.56 + h * 0.11);
return c;
}
