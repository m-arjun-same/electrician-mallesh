import { yearPlateSteps, routePlate, notePlate, skylineGrains, skylineSteps, pendingPlate } from './textures.js';
import { createFinale, impressionSVG } from './finale.js';
const $ = (s, el = document) => el.querySelector(s);
const sec = $('#route'), stage = $('.wh__sticky'), canvas = $('.wh__gl');
const plane = $('.wh__plane'), planeIn = $('.wh__plane-in'), light = $('.wh__light'), rail = $('.wh__rail');
const ROOT = document.documentElement, BASE = new URL('./', import.meta.url);
const RM = ROOT.classList.contains('rm') || matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 768px), (hover: none) and (max-width: 1100px), (hover: none) and (max-height: 500px)').matches || /[?&]rm=1/.test(location.search);
const secTop = () => sec.getBoundingClientRect().top + scrollY;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const UK = ROOT.lang === 'uk';   // the Ukrainian pages read the same route in their own words (years.ua.json, written by gen.mjs)
const data = await (await fetch(new URL(UK ? 'years.ua.json' : 'years.json', BASE))).json();
data.chapters.forEach((ch) => ch.items.forEach((it) => { if (it.img) it.img = new URL(it.img, BASE).href; }));
await document.fonts.ready.catch(() => {});
const rings = []; // {year, s, chapter, caption, kicker, quiet, items[], palette}
const routeMarks = []; // {s, text}
data.chapters.forEach((ch) => {
const years = [...new Set([...Object.keys(ch.lines || {}).map(Number), ...ch.items.filter((i) => !i.flow).map((i) => i.year)])].sort((a, b) => a - b);
years.forEach((y, k) => {
const all = ch.items.filter((i) => i.year === y && !i.flow && (i.img || i.kind || i.pending));
const groups = [...new Set(all.filter((i) => i.group).map((i) => i.group))];
rings.push({
year: y, label: (ch.labels && ch.labels[y]) || String(y), chapter: ch, palette: ch.palette || 'violet', quiet: ch.tone === 'dark',
hush: (ch.hush || []).includes(y),
caption: (ch.lines && ch.lines[y]) || `${y} — ${ch.title}`, kicker: k === 0 ? ch.kicker : '', stack: (ch.stacks && ch.stacks[y]) || null,
items: all.filter((i) => !i.group),
stations: groups.flatMap((g) => { const its = all.filter((i) => i.group === g), out = [];
for (let j = 0; j < its.length; j += 3) out.push({ caption: j ? '' : (ch.groups && ch.groups[g]) || '', items: its.slice(j, j + 3) });
return out; }),
});
});
});
const S0 = 44, D = 46, SD = 38, ST0 = 34; // station k of a ring sits at ring.s + ST0 + k * SD; each station lengthens the segment by SD
const RUN = 20;
{ let s = S0; rings.forEach((r, i) => { r.s = s; r.i = i; r.stations.forEach((st, k) => { st.s = s + ST0 + k * SD; });
const nx = rings[i + 1]; s += D + r.stations.length * SD + (r.stations.length && nx && !nx.quiet && !nx.hush ? RUN : 0); }); }
const S_END = rings[rings.length - 1].s + 44;
const darks = rings.filter((r) => r.quiet);
const bend = (d, dx, dy) => (d && rings[d.i + 1] ? [d.s + 4, rings[d.i + 1].s + 4, dx, dy] : [0, 1, 0, 0]);
const B1 = bend(darks[0], 9, -1.5), B2 = bend(darks[1], -8, 3.5);
const S_DARKS = [darks[0] ? darks[0].s : -1e5, darks[1] ? darks[1].s : -1e5];
const S_EMBER = darks[0] ? darks[0].s + 6 : -1e5;
const S_ISLE = darks[1] ? darks[1].s + 4 : 1e5;
data.chapters.forEach((ch) => {
if (!ch.route) return;
const r = rings.find((x) => x.chapter === ch);
routeMarks.push({ s: r.s + D * 0.42, text: ch.route });
});
const nodes = data.chapters.map((ch) => rings.find((x) => x.chapter === ch).s - 7).slice(0, 8);
const ROUTE_TH = -2.3, R0 = 5.2;
const C = (s) => [
2.2 * Math.sin(s * 0.045) + 1.2 * Math.sin(s * 0.021 + 1.3) + B1[2] * ss(B1[0], B1[1], s) + B2[2] * ss(B2[0], B2[1], s),
1.6 * Math.sin(s * 0.037 + 0.7) + B1[3] * ss(B1[0], B1[1], s) + B2[3] * ss(B2[0], B2[1], s),
-s];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => mul(a, 1 / Math.hypot(...a));
function frame(s) { const T = norm(sub(C(s + 0.6), C(s - 0.6))); const X = norm(cross(T, [0, 1, 0])); return { T, X, Y: cross(X, T) }; }
const KP = [0];
rings.forEach((r) => { r.kp = KP.length; KP.push(r.s - 17); r.stations.forEach((st) => { st.kp = KP.length; KP.push(st.s - 17); }); });
KP.push(S_END - 8);
const P_T = 0.8, P_F = 0.87;
function camFromP(p) {
if (p < 0.1) { const e = p / 0.1; return { s: -48 + 48 * (e * e * (3 - 2 * e)), e, g: 0, f: 0 }; }
if (p > P_T) { const g = Math.min(1, (p - P_T) / (P_F - P_T)), fz = Math.max(0, (p - P_F) / (1 - P_F)); return { s: S_END - 8 + 26 * g * g * (3 - 2 * g), e: 1, g, f: fz }; }
const f = (p - 0.1) / (P_T - 0.1) * (KP.length - 1), k = Math.min(KP.length - 2, Math.floor(f)), u = f - k;
const w = u - Math.sin(2 * Math.PI * u) / (2 * Math.PI) * 0.6; // slower near each ring = a gentle dwell
return { s: KP[k] + (KP[k + 1] - KP[k]) * w, e: 1, g: 0, f: 0 };
}
const pOfKP = (k) => 0.1 + (P_T - 0.1) * k / (KP.length - 1);
const pOfRing = (i) => pOfKP(rings[i].kp);
window.__whRoute = { rings: () => rings.map((r) => ({ y: r.year, s: r.s })) };
data.chapters.forEach((ch) => {
const r = rings.find((x) => x.chapter === ch);
const a = document.createElement('a');
a.href = '#route'; a.innerHTML = `<span class="wh__rl">${ch.rail || ch.title}</span>`;
if (ch.tone === 'dark') a.classList.add('is-quiet');
a.dataset.s = r.s; a.setAttribute('aria-label', ch.title);
a.addEventListener('click', (ev) => {
ev.preventDefault();
const top = secTop() + pOfRing(r.i) * (sec.offsetHeight - innerHeight);
scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
});
rail.append(a);
});
let gen = 0, teardown = null;   // the route's build generation (a restored context starts a new one)
const gl = !RM && canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
/* round 9i: a route that cannot run (no context, a shader that does not link, a context that never comes back, an exception while it
builds, or one that is not ready 8 s after the reader is inside it) must never leave the pinned entry stage standing for twenty
screens: the section becomes the calm year list, exactly as for phones and reduced motion */
let listed = false;
function toList() {
if (listed) return; listed = true; gen++; try { if (teardown) teardown(); } catch (e) {}
canvas.style.display = 'none'; ROOT.classList.remove('wh-on'); window.__whReady = true; buildList();
}
if (!gl) {
window.__whReady = true; buildList();
} else {
try { start(); } catch (e) { toList(); }
{ let inside = 0; const wd = setInterval(() => { if (window.__whReady || listed) return clearInterval(wd); if (sec.getBoundingClientRect().top < innerHeight * 0.6 && ++inside >= 8) { clearInterval(wd); toList(); } }, 1000); }
let lostT = 0;
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gen++; if (teardown) teardown(); window.__whReady = false; clearTimeout(lostT); lostT = setTimeout(() => { if (gl.isContextLost()) toList(); }, 8000); });
canvas.addEventListener('webglcontextrestored', () => { clearTimeout(lostT); start(); });
}
/* round 10.1 (phones): the year list's pictures appear fast and a slot is never an empty box.
- every slot carries a 24 px placeholder of its own photo (inline in the page, a few hundred bytes) and its dominant colour, so
a slot that is on screen before its photo has arrived shows a soft blur of that photo, never a black hole;
- the photo comes in a phone-sized cut (works-p/: 320 / 400 / 480 / 560 / 720 px wide, chosen from the slot's real width and the
screen density, at most 2x; never the desktop file);
- loading starts early: the list is built about four screens ahead, the first six photos are asked for the moment it is built,
the rest when they are within about two and a half screens, nearest first, four requests at a time;
- a photo is fetched and decoded off the screen first, then swapped in over the placeholder with a short (0.38 s) un-blur;
one picture that fails is retried once and never stops the others (round 10 robustness kept). */
function phoneList(imgs) {
sec.classList.add('is-ph');
const B = [320, 400, 480, 560, 720], dpr = Math.min(2, Math.max(1, devicePixelRatio || 1));
const MAX = 4, queue = []; let active = 0;
const fold = () => innerHeight || 700;
const pick = (im) => {
const pw = +im.dataset.pw; if (!pw || !im.dataset.src) return null;
const need = im.getBoundingClientRect().width * dpr * 0.92;
let w = B.find((b) => b >= need) || B[B.length - 1]; if (w > pw) w = pw;
return new URL(im.dataset.src.replace(/^works\//, 'works-p/').replace(/\.webp$/, '-' + w + '.webp'), BASE).href;
};
const shown = (im) => { im.classList.add('is-in'); im.dataset.st = 'done'; };
const fallback = (im) => {   // generated pictures (skyline file, pending plate) and the old 640 px cut for a slot without a phone variant
const g = im.dataset.gen;
if (g === 'skyline') return new URL('works-p/skyline-' + im.dataset.y + '-720.webp', BASE).href;   // the 720 px cut (126 KB, the full file is 316 KB)
if (g === 'pending') return pendingPlate(im.alt.replace(/ · (capture pending|знімок готується)$/, ''), 720, 480).toDataURL('image/jpeg', 0.82);
if (im.dataset.src) return new URL(im.dataset.src.replace(/^works\//, 'works-m/'), BASE).href;
return null;
};
const dist = (im) => {   // how far the slot is from the screen: nearest first, passed ones last, strip slots hidden to the right a bit further
const r = im.getBoundingClientRect(), h = fold();
const d = r.top > h ? r.top - h : r.bottom < 0 ? -r.bottom * 1.5 + h : 0;
return d + (r.left > innerWidth ? h * 0.4 : 0);
};
const want = (im) => {
if (im.dataset.st) return; im.dataset.st = 'queued'; queue.push(im); pump();
};
const fail = (im, tries, g) => {
if (tries < 1) { im.dataset.st = ''; setTimeout(() => { if (!im.dataset.st) { im.dataset.tries = String(tries + 1); want(im); } }, 1200); return; }
if (g === 'skyline') { try { im.src = skylineGrains(+im.dataset.y, 1200, 500).toDataURL(); shown(im); } catch (e) {} }
else im.dataset.st = 'done';   // the placeholder stays: a blurred photo, not a hole
};
const run = (im) => {
const tries = +(im.dataset.tries || 0), g = im.dataset.gen;
const mini = im.classList.contains('wl__mini');
let url = null; try { url = mini ? new URL('works-p/mini/c' + im.dataset.cell + '.webp', BASE).href : pick(im) || fallback(im); } catch (e) {}
if (!url) { im.dataset.st = 'done'; return; }
im.dataset.st = 'load'; active++;
let over = false;
const done = () => { if (over) return; over = true; active--; pump(); };
const pre = new Image(); pre.decoding = 'async';
pre.onload = () => {
const ready = () => { done(); try {
if (mini) { im.style.setProperty('--im', 'url("' + url + '")'); shown(im); }
else if (im.dataset.q || g === 'skyline' || url.startsWith('data:')) { im.src = url; (im.decode ? im.decode() : Promise.resolve()).then(() => shown(im), () => shown(im)); }
else { im.src = url; shown(im); }
} catch (e) { shown(im); } };
if (pre.decode) pre.decode().then(ready, ready); else ready();
};
pre.onerror = () => { done(); fail(im, tries, g); };
try { pre.src = url; } catch (e) { done(); fail(im, tries, g); }
};
function pump() {
while (active < MAX && queue.length) {
let bi = 0, bd = Infinity;
if (queue.length > 1) for (let i = 0; i < queue.length; i++) { const d = dist(queue[i]); if (d < bd) { bd = d; bi = i; } }
const im = queue.splice(bi, 1)[0];
if (!im.offsetParent && !im.getClientRects().length) { im.dataset.st = ''; continue; }   // a hidden slot (the desktop-only block): not now
run(im);
}
}
imgs.forEach((im) => { const q = im.dataset.q; if (q) { try { im.src = 'data:image/webp;base64,' + q; } catch (e) {} } });
const per = new IntersectionObserver((es) => es.forEach((e) => {
if (!e.isIntersecting) return; const im = e.target; per.unobserve(im);
try {
want(im);
const strip = im.parentElement;   // a swipe strip: its other photos are asked for together, so a swipe never meets a bare slot
if (strip && strip.scrollWidth > strip.clientWidth + 2) for (const n of strip.children) if (n.tagName === 'IMG' || n.classList.contains('wl__mini')) want(n);
} catch (err) {}
}), { rootMargin: Math.round(fold() * 2.5) + 'px 0px' });
imgs.forEach((im) => per.observe(im));
const minis = [...sec.querySelectorAll('.wl__mini')];   // the flip works: one small file per cell, not the 816 KB flip-card atlas
minis.forEach((m) => per.observe(m));
const lead = sec.querySelector('.wh__list') || sec;
const near = new IntersectionObserver((es) => { if (!es.some((e) => e.isIntersecting)) return; near.disconnect(); imgs.filter((im) => im.offsetParent).slice(0, 6).forEach((im) => { try { want(im); } catch (e) {} }); }, { rootMargin: Math.round(fold() * 4) + 'px 0px' });
near.observe(lead);
}
function buildList() {
sec.classList.add('is-list');
const PHONE = matchMedia('(max-width: 768px), (hover: none) and (max-height: 500px)').matches;
const imgs = [...sec.querySelectorAll('.wl__ph img')];
if (PHONE) phoneList(imgs); else {
/* round 10: one picture that fails (a thrown error in a generator, a network blip, a decode that gives up on a busy phone) must never
leave the others blank, so every picture is fetched on its own (try / catch, one retry) and a picture in a swipe strip also asks
for its next two neighbours, so a swipe never meets an empty box. The Luhansk skyline is a ready-made file now (the same grains the
tunnel draws, rendered once): a phone no longer paints 160 000 grains and encodes a 900 KB data URL on its main thread. */
const show = (im) => im.classList.add('is-in');
const load = (im, tries = 0) => {
if (im.dataset.busy || (!tries && im.getAttribute('src'))) return; im.dataset.busy = '1'; if (tries) im.removeAttribute('src');
const g = im.dataset.gen;
const done = () => { delete im.dataset.busy; };
const ok = () => { done(); if (im.decode) im.decode().then(() => show(im), () => show(im)); else show(im); };
const bad = () => { done(); if (tries < 1) setTimeout(() => load(im, tries + 1), 1200); else if (g === 'skyline') { try { im.src = skylineGrains(+im.dataset.y, 1200, 500).toDataURL(); show(im); } catch (e) {} } };
im.addEventListener('load', ok, { once: true }); im.addEventListener('error', bad, { once: true });
try {
if (g === 'skyline') im.src = new URL('skyline-' + im.dataset.y + '.webp', BASE).href;
else if (g === 'pending') im.src = pendingPlate(im.alt.replace(/ · (capture pending|знімок готується)$/, ''), 720, 480).toDataURL('image/jpeg', 0.82);
else if (im.dataset.src) im.src = new URL(PHONE ? im.dataset.src.replace(/^works\//, 'works-m/') : im.dataset.src, BASE).href;   // phones get the 640 px cut
else { done(); }
} catch (e) { bad(); }
};
const ahead = (im) => {
const strip = im.parentElement; if (!strip || strip.scrollWidth <= strip.clientWidth + 2) return;
for (let k = 0, n = im.nextElementSibling; n && k < 2; n = n.nextElementSibling, k++) if (n.tagName === 'IMG' && !n.getAttribute('src')) load(n);
};
const io = new IntersectionObserver((es) => es.forEach((e) => {
if (!e.isIntersecting) return; const im = e.target; io.unobserve(im);
try { load(im); ahead(im); } catch (err) {}
}), { rootMargin: '600px 0px' });
imgs.forEach((im) => io.observe(im));
}
const minis = PHONE ? [] : [...sec.querySelectorAll('.wl__minis')];
if (minis.length) fetch(new URL(data.atlas, BASE)).then((r) => r.json()).then((m) => {
const url = `url("${new URL(m.atlas || 'atlas.webp', BASE).href}")`;
const io2 = new IntersectionObserver((es) => es.forEach((e) => {
if (!e.isIntersecting) return; io2.unobserve(e.target);
e.target.querySelectorAll('.wl__mini').forEach((el) => {
const c = +el.dataset.cell, x = c % m.cols, y = Math.floor(c / m.cols);
Object.assign(el.style, { backgroundImage: url, backgroundSize: `${m.cols * 100}% ${m.rows * 100}%`, backgroundPosition: `${(x / (m.cols - 1)) * 100}% ${(y / (m.rows - 1)) * 100}%` });
el.classList.add('is-in');
});
}), { rootMargin: '600px 0px' });
minis.forEach((el) => io2.observe(el));
});
}
function start() {
const my = ++gen, ac = new AbortController(), sig = ac.signal;
const MOBILE = matchMedia('(max-width: 700px)').matches;
const DPR0 = window.__zxDpr ? window.__zxDpr(1.5) : Math.min(devicePixelRatio || 1, 1.5);
let DPR = DPR0;   /* round 9i: pixel budget on huge windows (see boot.js __zxFit); unchanged up to 1920 x 1080 */
const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
const GLSL_COMMON = `
uniform vec4 uB1, uB2; uniform float uR, uIsle, uEnd;
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
vec3 C(float s){
return vec3(2.2*sin(s*.045)+1.2*sin(s*.021+1.3)+uB1.z*sst(uB1.x,uB1.y,s)+uB2.z*sst(uB2.x,uB2.y,s),
1.6*sin(s*.037+.7)+uB1.w*sst(uB1.x,uB1.y,s)+uB2.w*sst(uB2.x,uB2.y,s), -s);}
float Rad(float s){ float o=sst(uEnd-36.,uEnd+8.,s); return uR*(1.+.22*sst(uIsle,uIsle+40.,s))*(1.+2.6*o*o); }
vec3 wallP(float s,float th,float r){
vec3 T=normalize(C(s+.6)-C(s-.6)); vec3 X=normalize(cross(T,vec3(0,1,0))); vec3 Y=cross(X,T);
return C(s)+r*(cos(th)*X+sin(th)*Y);}
`;
const progs = [];
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
function prog(vs, fs) {
const p = gl.createProgram(), v = sh(gl.VERTEX_SHADER, '#version 300 es\nprecision highp float;\n' + vs), f = sh(gl.FRAGMENT_SHADER, '#version 300 es\nprecision highp float;\n' + fs);
gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
const o = { p, u: {} }; progs.push(o); return o;
}
function whenLinked(cb) {
const ext = gl.getExtension('KHR_parallel_shader_compile');
(function poll() {
if (my !== gen || gl.isContextLost()) return;
const near = sec.getBoundingClientRect().top < innerHeight * 1.2;
if (ext && !near && !progs.every((o) => gl.getProgramParameter(o.p, ext.COMPLETION_STATUS_KHR))) { setTimeout(poll, 30); return; }
for (const o of progs) {
if (!gl.getProgramParameter(o.p, gl.LINK_STATUS)) { cb(false); return; }
const n = gl.getProgramParameter(o.p, gl.ACTIVE_UNIFORMS);
for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(o.p, i).name.replace('[0]', ''); o.u[nm] = gl.getUniformLocation(o.p, nm); }
}
cb(true);
})();
}
const PALS = `
vec3 palette(float s,float sel){
vec3 a1=vec3(.643,.545,1.), a2=vec3(1.,.70,.48), a3=vec3(1.,.93,.86);      // Luhansk: violet + ember
vec3 b1=vec3(.643,.545,1.), b2=vec3(.44,.89,1.),  b3=vec3(.96,.95,1.);      // Kyiv: violet + cyan
vec3 c1=vec3(.49,1.,.80),   c2=vec3(.44,.89,1.),  c3=vec3(.93,1.,.97);      // Ireland: mint + cyan
float k1=sst(uEmber,uEmber+26.,s), k2=sst(uIsle,uIsle+34.,s);
vec3 p1=mix(mix(a1,b1,k1),c1,k2*.75), p2=mix(mix(a2,b2,k1),c2,k2), p3=mix(mix(a3,b3,k1),c3,k2);
vec3 col = sel<.55?p1:(sel<.86?p2:p3);
return col;
}
float darkness(float s){ return max(exp(-pow((s-uDarks.x)/11.,2.)),exp(-pow((s-uDarks.y)/11.,2.))); }
float renew(float s){ return sst(uDarks.x+8.,uDarks.x+24.,s)*(1.-sst(uDarks.x+44.,uDarks.x+96.,s))+sst(uDarks.y+8.,uDarks.y+24.,s)*(1.-sst(uDarks.y+44.,uDarks.y+96.,s)); }`;
const CALM = `
uniform vec4 uCalm[4]; uniform int uCalmN;
float calmAt(float s,float th){ float c=0.;
for(int i=0;i<4;i++){ if(i>=uCalmN) break; vec4 z=uCalm[i];
float dth=abs(mod(th-z.y+3.14159265,6.2831853)-3.14159265);
c=max(c,(1.-smoothstep(z.z*.62,z.z*1.18,abs(s-z.x)))*(1.-smoothstep(z.w*.6,z.w*1.25,dth))); }
return c; }`;
const gP = prog(`
${GLSL_COMMON}
uniform float uEmber; uniform vec2 uDarks;
${PALS}
${CALM}
layout(location=0) in vec2 aC; layout(location=1) in vec4 aA; layout(location=2) in vec4 aB;
uniform mat4 uVP; uniform float uCam, uT, uPh, uSp, uVel, uWin, uFlow, uDpr, uRings[16]; uniform vec2 uRes; uniform float uFoc;
out vec2 vUV; out vec3 vCol; out float vA;
float thAt(float s,float dir,float kind){ return aA.y + dir*(s*(kind>.5?.006:.07) + uSp*(kind>.5?.012:.035)); }
void main(){
float kind=aA.w, dir=aB.x<.5?1.:-1.;
float fv=(.55+aB.w*.9)*(kind>.5?.25:1.); float flow=uFlow*fv;
float base=uCam-6.;
float s=base+mod(aA.x*uWin-uPh*fv-base,uWin);
float L=flow*.09+uVel*.045; float m=kind>.5?.08:.16; if(abs(L)<m) L=m*(L<0.?-1.:1.); L=clamp(L,-5.,5.);
float r0=Rad(s)*(kind>.5?(.18+aA.z*.62):(.965+aA.z*.07));
vec3 P0=wallP(s,thAt(s,dir,kind),r0), P1=wallP(s+L,thAt(s+L,dir,kind),r0);
vec4 c0=uVP*vec4(P0,1.), c1=uVP*vec4(P1,1.);
if(c0.w<.12||c1.w<.12){ gl_Position=vec4(2.,2.,2.,1.); return; }
vec2 s0=c0.xy/c0.w*.5*uRes, s1=c1.xy/c1.w*.5*uRes;
vec2 dv=s1-s0; float len=length(dv); float mx=uRes.y*.045; if(len>mx){ dv*=mx/len; len=mx; } vec2 d=len>1e-3?dv/len:vec2(1.,0.); vec2 n=vec2(-d.y,d.x);
float w=clamp(aB.y*uFoc/c0.w*uRes.y*.5, .6*uDpr, 2.6*uDpr);
float al=aC.x;
vec2 sp=s0+dv*al+d*(al*2.-1.)*w+n*aC.y*w;
float z=mix(c0.z/c0.w,c1.z/c1.w,al);
gl_Position=vec4(sp/(.5*uRes),z,1.);
vUV=vec2(al,aC.y);
float rel=s-base;
float a=sst(1.5,14.,s-uCam)*sst(0.,6.,rel)*(1.-sst(uWin*.5,uWin-4.,rel))*sst(-4.,12.,s)*(1.-sst(uEnd+12.,uEnd+40.,s))*(1.+1.4*sst(uEnd-34.,uEnd+4.,s));
float ring=0.; for(int i=0;i<16;i++){ ring+=exp(-pow((s-uRings[i])/1.1,2.)); }
float dk=darkness(s);
vec3 col=palette(s,fract(aB.x*2.));
col=mix(col,vec3(dot(col,vec3(.33))*.55),dk);
float tw=.72+.28*sin(uT*(.35+aB.z*.5)+aB.z*31.);
a*=tw*(kind>.5?.45:1.)*(1.+1.6*ring*(1.-dk))*(1.-.86*dk)*(1.+.5*renew(s));
a*=mix(1.,.3,sst(8.,50.,len/uDpr));
a*=1.-(kind>.5?.6:.84)*calmAt(s,thAt(s,dir,kind));
vCol=col; vA=a;
}`, `
in vec2 vUV; in vec3 vCol; in float vA; out vec4 o;
void main(){ float across=exp(-vUV.y*vUV.y*3.2); float along=mix(1.,.2,vUV.x)*smoothstep(0.,.08,vUV.x+.02)*(1.-smoothstep(.85,1.,vUV.x));
float a=across*along*vA; o=vec4(vCol*a,a); }`);
const pP = prog(`
${GLSL_COMMON}
layout(location=0) in vec2 aG;
uniform mat4 uVP; uniform float uS, uTh, uW, uH, uTilt, uRot, uInset, uGate; uniform mat2 uM;
out vec2 vUV; out float vS; out float vW;
void main(){
vec2 q=aG-.5; float cr=cos(uRot), sr=sin(uRot); vec2 qr=vec2(cr*q.x-sr*q.y, sr*q.x+cr*q.y);
vec2 ts=uM*vec2(qr.x*uW,qr.y*uH);  // (arc length along theta, ds)
float s=uS+ts.y; float R=Rad(s)*uInset;
float far=clamp((ts.y+ .5*max(uW,uH))/max(uW,uH),0.,1.);
float r=R*(1.-uTilt*far);
vec3 P=wallP(s,uTh+ts.x/R,r);
if(uGate>.5){ // a plane across the tunnel, facing the traveller
vec3 T=normalize(C(uS+.6)-C(uS-.6)); vec3 X=normalize(cross(T,vec3(0,1,0))); vec3 Y=cross(X,T);
P=C(uS)+X*(q.x*uW)+Y*(q.y*uH-Rad(uS)*.3+uTilt); s=uS; }
gl_Position=uVP*vec4(P,1.); vUV=vec2(aG.x,1.-aG.y); vS=s; vW=gl_Position.w;
}`, `
uniform sampler2D uTex; uniform float uCam, uFeather, uAlpha, uT, uDim, uGate, uNear, uWarm, uRev; uniform int uNB; uniform vec4 uBands[6];
in vec2 vUV; in float vS; in float vW; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
void main(){
vec4 t=texture(uTex,vUV);
float dist=vS-uCam;
float fog=(1.-smoothstep(60.,105.,dist))*smoothstep(-1.,5.,dist);
float a=1.;
if(uFeather>0.){
vec2 d2=min(vUV,1.-vUV)*vec2(1.5,1.);
float e=min(d2.x,d2.y);
float band=1.-smoothstep(0.,uFeather*1.2,e);   // 1 at the very edge, 0 inside
float g=h(floor(vUV*vec2(900.,600.)));
float m=smoothstep(0.,uFeather,e+(g-.5)*uFeather*.5*band);
a*=m;
a*=smoothstep(2.2,7.5,vW);
t.rgb=mix(t.rgb,t.rgb*mix(vec3(.86,.82,1.05),vec3(1.03,.96,.86),uWarm),.35);
}
a*=fog*uAlpha*uNear*(uFeather>0.?1.:smoothstep(3.,11.,dist));
for(int i=0;i<6;i++){ if(i>=uNB) break; vec4 b=uBands[i];
if(vUV.y>=b.x && vUV.y<b.y){ float k=clamp((uRev-float(i)*.55)/1.6,0.,1.); k=k*k*(3.-2.*k);
float edge=mix(b.z-.05,b.w+.05,k); float mk=(1.-smoothstep(edge-.05,edge,vUV.x))*smoothstep(0.,.3,k);
float ink=smoothstep(.03,.14,dot(t.rgb,vec3(.3,.5,.2))); a*=mix(1.,mix(mk,1.,smoothstep(.9,1.,k)),ink); } }
if(t.a*a<.01) discard;
gl_FragDepth = (uFeather>0. && t.a*a<.92) ? .9999995 : gl_FragCoord.z;   // fading parts of a work never hide the grains behind it
o=vec4(t.rgb*a*uDim,t.a*a);
}`);
const rP = prog(`
${GLSL_COMMON}
layout(location=0) in vec2 aG;
uniform mat4 uVP; uniform float uMode, uS0, uS1, uTh, uW;
out float vV; out float vS;
void main(){
float s, th, r;
if(uMode<.5){ s=uS0+aG.y*uW; th=aG.x*6.2831853; r=Rad(s)*.99; }
else { s=mix(uS0,uS1,aG.x); th=uTh+aG.y*uW/Rad(s); r=Rad(s)*.985; }
gl_Position=uVP*vec4(wallP(s,th,r),1.); vV=aG.y; vS=s;
}`, `
uniform vec3 uCol; uniform float uI, uCam, uT, uMode, uNodes[8];
in float vV; in float vS; out vec4 o;
void main(){
float dist=vS-uCam;
float fog=(1.-smoothstep(45.,110.,dist))*smoothstep(-2.,4.,dist);
float core=exp(-vV*vV*(uMode<.5?6.:14.));
vec3 col=uCol; float k=uI;
if(uMode>.5){
float pulse=exp(-pow((vS-(uCam+6.+mod(uT*3.,70.)))/2.2,2.));
float node=0.; for(int i=0;i<8;i++) node+=exp(-pow((vS-uNodes[i])/.7,2.));
col=mix(col,vec3(.78,.22,.17)*1.6,clamp(node,0.,1.)); k*=1.+1.4*pulse+2.*node;
}
float a=core*fog*k; o=vec4(col*a,a);
}`);
const eP = prog(`
${GLSL_COMMON}
uniform float uEmber; uniform vec2 uDarks;
${PALS}
layout(location=0) in vec2 aG;
uniform mat4 uVP; uniform float uMode, uCam, uSp, uW;
out vec2 vG; out float vS; out float vTh; flat out int vI;
void main(){
float s, th, r;
if(uMode<.5){ s=uCam-2.+aG.y*112.; th=aG.x*6.2831853; r=Rad(s)*1.03; }
else {
float i=float(gl_InstanceID); float dir=mod(i,2.)<.5?1.:-1.;
s=uCam-2.+aG.x*112.; th=i*2.399963+dir*(s*.07+uSp*.035)+aG.y*uW/Rad(s); r=Rad(s)*.995;
}
gl_Position=uVP*vec4(wallP(s,th,r),1.); vG=aG; vS=s; vTh=th; vI=gl_InstanceID;
}`, `
uniform float uMode, uCam, uPh, uSp, uEmber; uniform vec2 uDarks; uniform float uIsle, uEnd, uSkin;
${CALM}
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
${PALS}
in vec2 vG; in float vS; in float vTh; flat in int vI; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p,float P){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
vec2 i1=vec2(mod(i.x+1.,P),i.y); i.x=mod(i.x,P);
return mix(mix(h(i),h(vec2(i1.x,i.y)),f.x),mix(h(i+vec2(0,1)),h(vec2(i1.x,i.y+1.)),f.x),f.y); }
void main(){
float dist=vS-uCam;
float fog=(1.-smoothstep(50.,108.,dist))*sst(1.,10.,dist)*sst(-4.,12.,vS)*(1.-sst(uEnd+12.,uEnd+40.,vS))*(1.+1.2*sst(uEnd-34.,uEnd+4.,vS));
float dk=darkness(vS), rn=renew(vS);
if(uMode<.5){
float u=vG.x*48.;
vec2 q=vec2(u+vS*.53, vS*.045+uPh*.03);
float n=vn(q,48.)*.65+vn(q*vec2(2.,2.)+vec2(0.,uPh*.02),96.)*.35;
n=pow(n,3.2);
vec3 col=palette(vS,n>.3?.7:.2);
float a=n*.26*fog*uSkin*(1.-.8*dk)*(1.+.4*rn)*(1.-.7*calmAt(vS,vTh));
o=vec4(col*a,a);
} else {
float fi=float(vI);
float pat=pow(.5+.5*sin((vS+uPh*(.8+.3*mod(fi,3.)))*.32+fi*1.7),7.);
float core=exp(-vG.y*vG.y*5.);
vec3 col=palette(vS,fract(fi*.37));
float a=core*fog*(.06+.7*pat)*(1.-.88*dk)*(1.+.6*rn)*(1.-.85*calmAt(vS,vTh));
o=vec4(mix(col,vec3(1.),.25*pat)*a,a);
}
}`);
const fP = prog(`
${GLSL_COMMON}
layout(location=0) in vec2 aC; layout(location=1) in vec4 aA; layout(location=2) in vec4 aB; layout(location=3) in vec4 aD;
uniform mat4 uVP; uniform float uCols, uRows;
out vec2 vUVa; out vec2 vUVb; out vec2 vQ; out float vA; out float vMix; out float vS; out float vLayer;
vec2 cellUV(float idx, vec2 uv){ return (vec2(mod(idx,uCols),floor(idx/uCols))+uv)/vec2(uCols,uRows); }
void main(){
float s=aA.x, th=aA.y, layer=aA.z, W=aB.x, rot=aB.y;
float H=W*.625;
vec2 q=aC; float cr=cos(rot), sr=sin(rot); vec2 qr=vec2(cr*q.x-sr*q.y, sr*q.x+cr*q.y);
float R=Rad(s)*(layer>1.5?.52:layer>.5?.76:aA.w);
float sd=s+qr.x*W; float far=clamp(qr.x+.5,0.,1.);
float r=R*(1.-(layer>.5?.05:.18)*far);
vec3 P=wallP(sd,th+qr.y*H/R,r);
gl_Position=uVP*vec4(P,1.);
float sg=cos(th)>=0.?1.:-1.;
vec2 uv=vec2(.5-sg*aC.x,.5-sg*aC.y);
vUVa=cellUV(aB.z,uv); vUVb=cellUV(aB.w,uv); vQ=uv;
vMix=aD.x; vA=aD.y; vS=s; vLayer=layer;
}`, `
uniform sampler2D uTex; uniform float uCam, uVel; uniform vec3 uTint;
in vec2 vUVa; in vec2 vUVb; in vec2 vQ; in float vA; in float vMix; in float vS; in float vLayer; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
if(vA<.004) discard;
float g=h(floor(vQ*vec2(260.,162.)));
float mx=smoothstep(g-.22,g+.22,vMix*1.44-.22);
vec3 t=mix(texture(uTex,vUVa).rgb,texture(uTex,vUVb).rgb,mx);
float e=min(min(vQ.x,1.-vQ.x),min(vQ.y,1.-vQ.y));
float m=smoothstep(g*.07,g*.07+.045,e);
float dist=vS-uCam;
float fog=(1.-smoothstep(42.,92.,dist))*smoothstep(1.5,9.,dist);
float a=m*fog*vA*(1.-.35*smoothstep(20.,60.,abs(uVel)));
vec3 col=mix(t,t*uTint,.16+.2*step(1.5,vLayer));
o=vec4(col*a,a);
}`);
const sP = prog(`
layout(location=0) in vec4 aD;
uniform mat4 uVP; uniform vec3 uC, uEye; uniform float uT, uSz, uDpr, uScale, uA; uniform vec2 uRes; uniform float uFoc;
out float vF; out float vA;
void main(){
vec3 d=aD.xyz; float br=1.+.0055*sin(uT*.8)+.035*sin(uT*.45+aD.w*6.28);
vec3 P=uC+d*.3*br*uScale;
vec4 c=uVP*vec4(P,1.); gl_Position=c;
gl_PointSize=clamp(uSz*uFoc/c.w*uRes.y*.5,1.,6.*uDpr);
vF=clamp(dot(d,normalize(uEye-uC))*.5+.5,0.,1.); vA=.6+.4*sin(uT*.5+aD.w*20.);
}`, `
uniform float uA; in float vF; in float vA; out vec4 o;
void main(){ vec2 q=gl_PointCoord-.5; float a=exp(-dot(q,q)*14.)*vA*(.35+.65*vF);
vec3 col=mix(vec3(.64,.55,1.),vec3(1.,.98,.95),vF); o=vec4(col*a*uA,a*uA); }`);
const bP = prog(`
out vec2 vP; void main(){ vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2); vP=p; gl_Position=vec4(p*2.-1.,0.,1.); }`, `
uniform vec2 uMouth, uSph, uRes; uniform float uFin, uExitR, uExit, uT, uDk, uIsleK, uSphA, uEntry;
in vec2 vP; out vec4 o;
float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
float ss01(float x){ return smoothstep(0.,.5,x); }
void main(){
vec2 asp=vec2(uRes.x/uRes.y,1.);
vec3 bg=vec3(.043,.039,.059);
vec3 tint=mix(mix(vec3(.64,.55,1.),vec3(.45,.95,.8),uIsleK*(1.-ss01(uExitR))),vec3(1.,.82,.55),uFin);
float dm=length((vP-uMouth)*asp), ds=length((vP-uSph)*asp);
vec3 col=bg+tint*(.20*exp(-dm*dm*28.)+.07*exp(-dm*4.))*(1.-.75*uDk);
col+=vec3(1.,.97,.93)*uEntry*exp(-dm*dm*900.)*1.2 + tint*uEntry*.25*exp(-dm*dm*60.);
col+=vec3(.85,.8,1.)*.16*exp(-ds*ds*90.)*uSphA;
vec3 paper=vec3(.99,.97,.93);
float core=exp(-dm*dm*mix(46.,3.6,uExitR)), halo=exp(-dm*dm*mix(12.,1.3,uExitR));
col=mix(col,paper,clamp(core*uExit*1.5,0.,1.));
col+=vec3(.64,.55,1.)*halo*uExit*.32;
col*=1.-.35*(1.-uExit*.85)*smoothstep(.55,1.25,length((vP-.5)*asp));
col+=(h(vP*uRes+fract(uT*7.)*91.)-.5)*.022;
o=vec4(col,1.);
}`);
const N = Math.round(clamp(innerWidth * innerHeight / (1920 * 1080) * 34000, MOBILE ? 8000 : 14000, MOBILE ? 12000 : 38000));
const quad = new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]);
const inst = new Float32Array(N * 8), STREAMS = MOBILE ? 36 : 56;
for (let i = 0; i < N; i++) {
const dust = Math.random() < 0.12, stream = !dust && Math.random() < 0.74;
const sel = Math.random(), g = (Math.random() + Math.random() + Math.random() - 1.5) * 0.05;
const th = stream ? (Math.floor(Math.random() * STREAMS) / STREAMS) * Math.PI * 2 + g : Math.random() * Math.PI * 2;
inst.set([Math.random(), th, stream ? 0.45 + g * 2 : Math.random(), dust ? 1 : 0,
sel, (dust ? 0.026 : 0.034) * (0.6 + Math.random() * 0.9), Math.random(), Math.random()], i * 8);
}
const gVao = gl.createVertexArray(); gl.bindVertexArray(gVao);
let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW);
gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribDivisor(1, 1);
gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16); gl.vertexAttribDivisor(2, 1);
function grid(nx, ny, vmin = 0) {
const v = [], idx = [];
for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v.push(i / nx, vmin + (1 - vmin) * j / ny);
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1); }
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
return { vao, n: idx.length };
}
const patchG = grid(28, 18);
const ribbonG = grid(320, 2, -1);
const skinG = grid(MOBILE ? 64 : 96, MOBILE ? 100 : 140);
const SN = MOBILE ? 900 : 1600, sph = new Float32Array(SN * 4);
for (let i = 0; i < SN; i++) {
const y = 1 - 2 * (i + 0.5) / SN, r = Math.sqrt(1 - y * y), th = i * 2.399963;
sph.set([Math.cos(th) * r, y, Math.sin(th) * r, Math.random()], i * 4);
}
const sVao = gl.createVertexArray(); gl.bindVertexArray(sVao);
b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, sph, gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
const bVao = gl.createVertexArray();
gl.bindVertexArray(null);
const SIDE_R = [[0, 1], [-1, 0]], SIDE_L = [[0, -1], [1, 0]], TOPB = [[1, 0], [0, 1]];
const m2 = (m) => new Float32Array([m[0][0], m[1][0], m[0][1], m[1][1]]); // column-major
const patches = [];
rings.forEach((r) => {
const right = r.i % 2 === 0, thT = right ? 0.05 : Math.PI - 0.05, thO = right ? Math.PI - 0.08 : 0.08;
patches.push({ kind: 'plate', ring: r, s: r.s - 5, th: thT, w: 11.6, h: 5.22, m: right ? SIDE_R : SIDE_L, tilt: 0.42, rot: 0, inset: 0.95 });
const slots = [
{ s: r.s - 5, th: thO, w: 7.2, h: 4.8, m: right ? SIDE_L : SIDE_R, rot: -0.03 },
{ s: r.s + 6, th: Math.PI / 2 + (right ? 0.22 : -0.22), w: 6.4, h: 4.2, m: TOPB, rot: 0.02 },
{ s: r.s + 15, th: thT, w: 6.8, h: 4.5, m: right ? SIDE_R : SIDE_L, rot: 0.025 },
{ s: r.s + 24, th: -Math.PI / 2 + (right ? -0.3 : 0.3), w: 6.0, h: 4.0, m: TOPB, rot: -0.02 },
];
const sky = r.items.find((it) => it.kind === 'skyline');
if (sky) patches.push({ kind: 'skyline', ring: r, s: r.s + 12, th: 0, w: R0 * 2.4, h: R0 * 1.013, m: TOPB, tilt: 0, rot: 0, inset: 1 });
heroes(r, r.items.filter((it) => !it.kind).slice(0, MOBILE ? 3 : 4), slots);
r.stations.forEach((st, k) => {
const rt = (r.i + k + 1) % 2 === 0, tT = rt ? 0.05 : Math.PI - 0.05, tO = rt ? Math.PI - 0.08 : 0.08;
const own = st.items.find((it) => it.note && !it.personal);
const capText = st.caption && own ? st.caption + '\n\n' + own.note : st.caption;
if (capText) patches.push({ kind: 'note', text: capText, ring: r, s: st.s - 6, th: tT + (rt ? -0.3 : 0.3), w: 12.4, h: 2.02, m: rt ? SIDE_R : SIDE_L, tilt: 0.3, rot: 0, inset: 0.95 });
if (st.items.length === 1 && rings[r.i + 1] && rings[r.i + 1].quiet) {
const it = st.items[0], a = it.aspect || 1.5, w = a >= 1 ? 8.6 : 5.4 * a * 1.6, h = w / a;
patches.push({ kind: 'photo', ring: r, item: it, idx: 0, gate: true, s: st.s - 1, th: 0, w, h, m: TOPB, tilt: R0 * 0.3 + 0.7, rot: 0, inset: 1 });   // gate: tilt = lift above the skyline line
return;
}
heroes(r, st.items.slice(0, 4), [
{ s: st.s - 5, th: tO, w: 7.2, h: 4.8, m: rt ? SIDE_L : SIDE_R, rot: -0.03 },
{ s: st.s + 8, th: tT, w: 6.8, h: 4.5, m: rt ? SIDE_R : SIDE_L, rot: 0.025 },
{ s: st.s + 17, th: tO, w: 6.8, h: 4.5, m: rt ? SIDE_L : SIDE_R, rot: -0.02 },
{ s: st.s + 27, th: tT, w: 6.6, h: 4.4, m: rt ? SIDE_R : SIDE_L, rot: 0.02 },
]);
});
});
function heroes(r, list, slots) {
const HS = MOBILE ? 1.75 : 2.1;
list.forEach((it, k) => {
const sl = slots[k], A = sl.w * sl.h * HS * HS, a = it.aspect || 1.5;
let w = Math.sqrt(A * a), h = A / w;
const capW = sl.m === TOPB ? 13 : 15, capH = sl.m === TOPB ? 9 : 10.5;
const k2 = Math.min(1, capW / w, capH / h); w *= k2; h *= k2;
patches.push({ kind: 'photo', ring: r, item: it, idx: k, tilt: 0.3, inset: 0.97, ...sl, w, h });
});
}
routeMarks.forEach((rm) => patches.push({ kind: 'route', text: rm.text, s: rm.s, th: -2.78, w: 7.4, h: 1.6, m: SIDE_L, tilt: 0.2, rot: 0, inset: 0.97 }));
patches.forEach((p) => { p.M = m2(p.m); p.tex = null; p.loading = false; });
patches.sort((a, b) => (a.kind === 'photo' ? 0 : 1) - (b.kind === 'photo' ? 0 : 1)); // opaque photos first, then plates over them
/* pictures are decoded off the main thread before they reach the GPU: an <img> handed straight to texImage2D is decoded
there, in one long task (155 ms for the atlas on the QA laptop) (round 9). They are opaque, so premultiplying is moot */
function decoded(url) {
if (window.createImageBitmap) return fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then((b) => createImageBitmap(b));
const im = new Image(); im.decoding = 'async'; im.src = url; return im.decode().then(() => im);
}
function makeTex(src) {
const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
return t;
}
function makeTexBanded(src, done) {
const w = src.naturalWidth || src.width, h = src.naturalHeight || src.height, n = 4, bh = Math.ceil(h / n), t = gl.createTexture();
const band = (k) => {
if (my !== gen || gl.isContextLost()) return;
gl.bindTexture(gl.TEXTURE_2D, t);
if (k === 0) gl.texStorage2D(gl.TEXTURE_2D, 1 + Math.floor(Math.log2(Math.max(w, h))), gl.RGBA8, w, h);
if (k < n) {
const y0 = k * bh, rows = Math.min(bh, h - y0);
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, y0);
gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, y0, w, rows, gl.RGBA, gl.UNSIGNED_BYTE, src);
gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0);
later(() => band(k + 1));
return;
}
gl.generateMipmap(gl.TEXTURE_2D);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
done(t);
};
band(0);
}
const later = (() => { const mc = new MessageChannel(), q = []; mc.port1.onmessage = () => { const f = q.shift(); if (f) f(); }; return (f) => { q.push(f); mc.port2.postMessage(0); }; })();
function loadPatch(p) { // lazy: one texture per frame, only near the camera
p.loading = true;
const up = (f) => { if (my === gen) f(); };
const stepped = (it, done) => {
const go = () => { if (my !== gen) return; const r = it.next(); if (r.done) later(() => done(r.value)); else later(go); };
go();
};
const plateTex = (cv) => up(() => { p.h = p.w * cv.height / cv.width; p.bands = cv.bands || null; p.rv = 0; p.tex = makeTex(cv); });
const plain = (cv) => up(() => { p.tex = makeTex(cv); });
if (p.kind === 'plate') { stepped(yearPlateSteps({ year: p.ring.label, caption: p.ring.caption, kicker: p.ring.kicker, quiet: p.ring.quiet, stack: p.ring.stack }), plateTex); return; }
if (p.kind === 'route') { plain(routePlate(p.text)); return; }
if (p.kind === 'note') { plateTex(notePlate(p.text)); return; }
if (p.kind === 'skyline') { stepped(skylineSteps(p.ring.year), plain); return; }
const ph = () => { plain(pendingPlate(p.item.caption.replace(/ · (capture pending|знімок готується)$/, ''))); };
if (!p.item.img) return ph();
decoded(p.item.img).then((im) => up(() => { const cv = p.item.badge ? stamped(im, p.item.badge) : p.item.note && p.item.personal ? captioned(im, p.item.note) : im; plain(cv); })).catch(ph);
}
function captioned(im, text) {
const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d'); g.drawImage(im, 0, 0);
const y0 = h * 0.6, gr = g.createLinearGradient(0, y0, 0, h * 0.86);
gr.addColorStop(0, 'rgba(12,10,16,0)'); gr.addColorStop(1, 'rgba(12,10,16,.62)'); g.fillStyle = gr; g.fillRect(0, y0, w, h - y0);
let fs = Math.round(w * 0.085); g.font = `italic 400 ${fs}px Instrument, Georgia, serif`;
let lines = [text];
if (g.measureText(text).width > w * 0.7 && text.includes(' · ')) {
const parts = text.split(' · '); let best = 1, bd = 1e9;
for (let k = 1; k < parts.length; k++) { const d = Math.abs(parts.slice(0, k).join(' · ').length - parts.slice(k).join(' · ').length); if (d < bd) { bd = d; best = k; } }
lines = [parts.slice(0, best).join(' · '), parts.slice(best).join(' · ')];
}
const tw = Math.max(...lines.map((l) => g.measureText(l).width)); if (tw > w * 0.7) { fs = Math.floor(fs * w * 0.7 / tw); g.font = `italic 400 ${fs}px Instrument, Georgia, serif`; }
g.textAlign = 'center'; g.fillStyle = '#f1e7d6';
lines.forEach((l, k) => g.fillText(l, w / 2, h * 0.79 - (lines.length - 1 - k) * fs * 1.18));
return c;
}
function stamped(im, b) {
const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height, c = document.createElement('canvas'); c.width = w; c.height = h;
const g = c.getContext('2d'); g.drawImage(im, 0, 0);
const bx = w * (b.x || 0.13), by = h * (b.y || 0.66), bw = w * 0.28, bh = h * 0.175;
const s = document.createElement('canvas'); s.width = Math.ceil(bw); s.height = Math.ceil(bh);
const q = s.getContext('2d');
q.fillStyle = '#c8382c'; q.beginPath(); q.roundRect(0, 0, bw, bh, bh * 0.07); q.fill();
q.globalCompositeOperation = 'destination-out';
let z = 11; const rr = () => ((z = (z * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 900; i++) { q.globalAlpha = 0.15 + rr() * 0.5; q.beginPath(); q.arc(rr() * bw, rr() * bh, 0.6 + rr() * 1.8, 0, 6.283); q.fill(); }
q.globalAlpha = 1;
const [l1, l2, note] = b.lines;
let fz = Math.round(bh * 0.25); q.font = `600 ${fz}px Bricolage, sans-serif`; q.letterSpacing = `${Math.round(fz * 0.12)}px`;
const mw = Math.max(q.measureText(l1).width, q.measureText(l2).width); if (mw > bw * 0.84) { fz = Math.floor(fz * bw * 0.84 / mw); q.font = `600 ${fz}px Bricolage, sans-serif`; q.letterSpacing = `${Math.round(fz * 0.12)}px`; }
q.textAlign = 'center'; q.fillText(l1, bw / 2, bh * 0.36); q.fillText(l2, bw / 2, bh * 0.36 + fz * 1.05);
q.letterSpacing = '0px'; q.font = `italic 400 ${Math.round(fz * 0.82)}px Instrument, Georgia, serif`; q.fillText(note, bw / 2, bh * 0.88);
q.globalCompositeOperation = 'source-over';
g.save(); g.translate(bx + bw / 2, by + bh / 2); g.rotate(-0.045); g.globalAlpha = 0.95; g.drawImage(s, -bw / 2, -bh / 2); g.restore();
return c;
}
const queue = []; let pumping = false;
const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8, didTimeout: false }), 120));
function pump(sC) {
if (pumping || !queue.length) return;
pumping = true;
idle(() => {
if (my !== gen) return;
queue.sort((a, b) => Math.abs(a.s - sC) - Math.abs(b.s - sC));
const q = queue.shift(); if (q && !q.tex && !q.loading) loadPatch(q);
pumping = false;
}, { timeout: 300 });
}
const allWorks = data.chapters.flatMap((ch) => ch.items).filter((it) => it.cell !== undefined);
const used = new Map(); allWorks.forEach((w) => used.set(w.cell, { n: 0, at: [], year: w.year, max: w.once ? 1 : 2 }));
patches.forEach((q) => { if (q.kind === 'photo' && q.item && q.item.cell !== undefined) used.get(q.item.cell).at.push(q.s); });
const stretches = [];
rings.forEach((r, i) => {
if (r.quiet || r.hush || !r.items.some((it) => it.cell !== undefined)) return;
const prev = rings[i - 1], pv = prev ? (prev.stations.length ? prev.stations[prev.stations.length - 1].s + 24 : prev.s) : -40;
const own = allWorks.filter((it) => (it.year === r.year && !it.flow) || (it.flow && prev && prev.quiet && it.year === prev.year)).map((it) => it.cell);
stretches.push({ s0: Math.max(4, pv + 9), s1: r.s - 14, end: r.s, year: r.year, own });
});
stretches.push({ s0: rings[rings.length - 1].s + 8, s1: S_END - 12, end: S_END - 6, year: 2026, own: [] });
let z = 7; const rr = () => ((z = (z * 16807) % 2147483647) / 2147483647);
const cards = [];
const PER = MOBILE ? 4 : 7, PER_MAX = MOBILE ? 6 : 10;
const heroAt = (cell) => used.get(cell).at.length > 0;
stretches.forEach((st, k) => {
const flips = st.own.filter((c) => !heroAt(c)).length;
const n = k === stretches.length - 1 ? PER + 1 : clamp(Math.ceil(flips / 2), PER, PER_MAX);
for (let j = 0; j < n; j++) {
const u = rr(), layer = u < 0.6 ? 0 : u < 0.86 ? 1 : 2;
const sPos = st.s0 + (st.s1 - st.s0) * ((j + 0.15 + rr() * 0.7) / n);
cards.push({ st, s: sPos, th: (j * 2.399963 + k * 1.3 + rr() * 0.6) % (Math.PI * 2), layer,
W: (layer === 0 ? 7.2 : layer === 1 ? 4.8 : 3.2) * (0.85 + rr() * 0.3) * (MOBILE ? 0.85 : 1), rj: 0.94 + rr() * 0.05,
rot: (rr() - 0.5) * 0.1, drift: (rr() - 0.5) * 0.012, T: 14 + ((cards.length * 0.618) % 1) * 26,
a: -1, b: -1, mix: 0, turning: false, alpha: 0 });
}
});
const okFor = (cell, sPos) => { const u = used.get(cell); return u.n < u.max && u.at.every((x) => Math.abs(x - sPos) > 125); };
const take = (cell, sPos) => { const u = used.get(cell); u.n++; u.at.push(sPos); return cell; };
for (const key of ['a', 'b']) for (const st of stretches) {
const mine = cards.filter((c) => c.st === st && c[key] < 0);
for (const c of mine) { const cell = st.own.find((w) => okFor(w, c.s) && w !== c.a); if (cell !== undefined) c[key] = take(cell, c.s); }
}
for (const key of ['a', 'b']) for (const c of cards) {
if (c[key] >= 0) continue;
const cand = allWorks.map((w) => w.cell).filter((w) => okFor(w, c.s) && w !== c.a)
.sort((x, y) => (Math.abs(used.get(x).year - c.st.year) - Math.abs(used.get(y).year - c.st.year)) || (used.get(x).n - used.get(y).n) || x - y);
if (cand.length) c[key] = take(cand[0], c.s);
}
for (let i = cards.length - 1; i >= 0; i--) if (cards[i].a < 0) cards.splice(i, 1);
const FN = cards.length, fInst = new Float32Array(FN * 12);
const fVao = gl.createVertexArray(); gl.bindVertexArray(fVao);
b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
const fBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, fBuf); gl.bufferData(gl.ARRAY_BUFFER, fInst.byteLength, gl.DYNAMIC_DRAW);
[1, 2, 3].forEach((l, k) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 48, k * 16); gl.vertexAttribDivisor(l, 1); });
gl.bindVertexArray(null);
const TURN_S = 1.25, MAX_TURN = 4;
const RadC = (s) => { const o = ss(S_END - 36, S_END + 8, s); return R0 * (1 + 0.22 * ss(S_ISLE, S_ISLE + 40, s)) * (1 + 2.6 * o * o); };
const wallC = (s, th, r) => { const f = frame(s), c = C(s); return add(c, add(mul(f.X, r * Math.cos(th)), mul(f.Y, r * Math.sin(th)))); };
const prj = (M, P) => { const x = M[0] * P[0] + M[4] * P[1] + M[8] * P[2] + M[12], y = M[1] * P[0] + M[5] * P[1] + M[9] * P[2] + M[13], w = M[3] * P[0] + M[7] * P[1] + M[11] * P[2] + M[15]; return w > 0.1 ? [x / w, y / w] : null; };
function updateCards(sC, dt) {
let turning = 0;
for (const c of cards) if (c.turning) turning++;
for (let i = 0; i < FN; i++) {
const c = cards[i], d = c.s - sC;
c.th += c.drift * dt;
const res = 1 - ss(c.st.end - 22, c.st.end - 10, c.s);
const want = (d > -6 && d < 110 ? 1 : 0) * (c.layer === 2 ? 0.34 : c.layer === 1 ? 0.58 : 0.9) * Math.max(0.35, res);
c.alpha += (want - c.alpha) * Math.min(1, dt / 0.55);
const tgt = c.b >= 0 && d < c.T ? 1 : 0;
if (c.alpha < 0.02) { c.mix = tgt; c.turning = false; }
else if (Math.abs(tgt - c.mix) > 1e-4) {
if (!c.turning && turning < MAX_TURN) { c.turning = true; turning++; }
if (c.turning) { c.mix += Math.sign(tgt - c.mix) * Math.min(Math.abs(tgt - c.mix), dt / TURN_S); if (Math.abs(tgt - c.mix) <= 1e-4) { c.mix = tgt; c.turning = false; turning--; } }
}
const e = c.mix * c.mix * (3 - 2 * c.mix);
fInst.set([c.s, c.th, c.layer, c.rj, c.W, c.rot, c.a, Math.max(0, c.b < 0 ? c.a : c.b), e, Math.max(0, c.alpha), 0, 0], i * 12);
}
gl.bindBuffer(gl.ARRAY_BUFFER, fBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, fInst);
}
const finale = createFinale(gl, prog, { MOBILE, root: stage });
let atlasTex = null, atlasMeta = null, atlasLoading = false;
function loadAtlas() {
atlasLoading = true;
fetch(new URL(data.atlas, BASE)).then((r) => r.json()).then((m) => {
atlasMeta = m;
decoded(new URL(m.atlas || 'atlas.webp', BASE).href).then((im) => { idle(() => { if (my === gen) makeTexBanded(im, (t) => { atlasTex = t; }); }, { timeout: 300 }); }).catch(() => {});
});
}
function persp(fy, asp, n, f) { const t = 1 / Math.tan(fy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; }
function look(eye, tgt, up) {
const z = norm(sub(eye, tgt)), x = norm(cross(up, z)), y = cross(z, x);
return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}
function mm(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
const proj4 = (M, P) => { const x = M[0] * P[0] + M[4] * P[1] + M[8] * P[2] + M[12], y = M[1] * P[0] + M[5] * P[1] + M[9] * P[2] + M[13], w = M[3] * P[0] + M[7] * P[1] + M[11] * P[2] + M[15]; return [x / w * 0.5 + 0.5, y / w * 0.5 + 0.5, w]; };
let W = 0, H = 0;
function resize() {
DPR = window.__zxFit ? window.__zxFit(stage.clientWidth, stage.clientHeight, DPR0) : DPR0;
const w = Math.round(stage.clientWidth * DPR), h = Math.round(stage.clientHeight * DPR);
if (w === W && h === H) return;   /* round 9: a resize event with the same size reallocates nothing */
W = w; H = h; canvas.width = W; canvas.height = H;
}
resize(); addEventListener('resize', resize, { signal: sig });
const target = () => clamp((scrollY - secTop()) / (sec.offsetHeight - innerHeight), 0, 1);
let flowSpd = 1.6, flowPh = 0, spinPh = 0;
const cap = $('.wh__cap'), capY = $('.wh__cy'), capL = $('.wh__cl'); let capRing = null;
let p = target(), pv = 0, roll = 0, camVel = 0, lastS = camFromP(p).s, t0 = performance.now(), last = t0;
const OM = 2 * Math.PI / 1.15, ZE = 0.9;
const score = Object.assign({ progress() {}, ring() {}, flip() {}, exit() {} }, window.WH_SCORE || {});
let scoreRing = -1;
const stats = { frames: 0, sum: 0, worst: 0, N, dpr: DPR, list: [] };
let running = false, active = false;
let sealed = false, again = null;
const ARROW = '<svg class="i ia" viewBox="0 0 28 18" aria-hidden="true"><path class="ia-s" pathLength="1" d="M2 9.7C8.2 8.8 15.6 9 24.4 9.2"/><path class="ia-h" pathLength="1" d="M18.3 3.1C20.6 5.2 22.5 7.1 25.3 9.2C22.7 11.1 20.7 12.9 18.1 15.2"/></svg>';
function seal() {
if (sealed) return;
const before = stage.getBoundingClientRect().top;
sealed = true; p = 1; pv = 0;
if (active) { active = false; if (window.Grain && window.Grain.pause) window.Grain.pause(false); }
ROOT.classList.remove('wh-on'); rail.classList.remove('is-on');
finale.draw(1, 0, W, H, DPR);
if (!again) {
again = document.createElement('button'); again.type = 'button'; again.className = 'press wh__again'; again.innerHTML = (UK ? 'Пролетіти маршрут ще раз ' : 'Fly the route again ') + ARROW;
(finale.el.querySelector('.wh__finline') || finale.el).appendChild(again); if (window.__inkBind) window.__inkBind(again);
again.addEventListener('click', restart);
}
sec.classList.add('is-sealed');
requestAnimationFrame(() => requestAnimationFrame(() => sec.classList.add('is-card')));
placeAgain();
window.__whSealed = true;
}
let againT = 0;
function placeAgain() {
const line = finale.el.querySelector('.wh__finline');
clearTimeout(againT);
if (!line || !again) return;
let done = false;
const go = () => { if (done || !sealed) return; done = true; line.removeEventListener('transitionend', end); sec.classList.add('is-again-in'); };
const end = (e) => { if (e.propertyName === 'transform' && e.target === line) go(); };
line.addEventListener('transitionend', end);
againT = setTimeout(go, 1900);
}
function unseal() {
if (sealed) { sealed = false; sec.classList.remove('is-card', 'is-sealed', 'is-going', 'is-again-in'); window.__whSealed = false; }
p = 0; pv = 0; lastS = camFromP(0).s; camVel = 0; roll = 0; scoreRing = -1;
cards.forEach((c) => { c.alpha = 0; c.mix = 0; c.turning = false; });
finale.draw(0, 0, W, H, DPR);
}
function restart() {
sec.classList.add('is-going');
setTimeout(() => {
unseal();
if (window.__ss) window.__ss.stop();
const top = secTop(); scrollTo(0, top);
sec.classList.add('is-again'); setTimeout(() => sec.classList.remove('is-again'), 1300);
arbitrate();
const z = top + 0.1 * (sec.offsetHeight - innerHeight), t0 = performance.now(), D = 3400; let stopG = false;
const halt = () => { stopG = true; };
['wheel', 'keydown', 'touchstart', 'pointerdown'].forEach((ev) => addEventListener(ev, halt, { once: true, passive: true }));
const g = (now) => { if (stopG) return; const k = Math.min(1, (now - t0) / D), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, top + (z - top) * e); if (k < 1) requestAnimationFrame(g); };
setTimeout(() => requestAnimationFrame(g), 700);
}, 560);
}
let lastY = scrollY;
addEventListener('scroll', () => {
if (!ready) return;
const y = scrollY, dy = y - lastY, up = dy < 0; lastY = y;
if (!sealed) return;
const r = sec.getBoundingClientRect();
if (r.top > 0) { unseal(); arbitrate(); return; }
if (r.top < -1 && r.bottom > innerHeight + 1) {
if (Math.abs(dy) > innerHeight * 1.5) { unseal(); arbitrate(); return; }
const span = sec.offsetHeight - innerHeight, t = up ? Math.max(0, y - span) : y + span, d = t - y;   // keep the reader's own motion
scrollTo(0, t); lastY = t; if (window.__ss) window.__ss.shift(d);
if (up) { unseal(); arbitrate(); }
}
}, { passive: true, signal: sig });
addEventListener('site:rewind', () => { if (!ready) return; unseal(); arbitrate(); }, { signal: sig });
let ready = false;
function arbitrate() {
if (!ready || my !== gen) return;
const r = sec.getBoundingClientRect(), a = !sealed && r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5;
if (!sealed && r.bottom <= innerHeight * 0.5) { seal(); return; }   // flown (or jumped) past the exit: the tunnel stays sealed
if (a !== active) { active = a; if (window.Grain && window.Grain.pause) window.Grain.pause(a); if (!a) ROOT.classList.remove('wh-on'); }
if (!running && !document.hidden) { running = true; last = performance.now(); requestAnimationFrame(tick); }
}
addEventListener('scroll', arbitrate, { passive: true, signal: sig }); addEventListener('resize', arbitrate, { passive: true, signal: sig });
document.addEventListener('visibilitychange', arbitrate, { signal: sig });
teardown = () => {
ac.abort(); running = false; ready = false;
if (active) { active = false; if (window.Grain && window.Grain.pause) window.Grain.pause(false); }
ROOT.classList.remove('wh-on'); rail.classList.remove('is-on');
if (again) again.remove(); if (finale.el) finale.el.remove();
if (sealed) { sealed = false; sec.classList.remove('is-card', 'is-sealed', 'is-going', 'is-again-in'); window.__whSealed = false; }
};
whenLinked((ok) => {
if (my !== gen) return;
if (!ok) { toList(); return; }
ready = true; window.__whReady = true; lastY = scrollY;
if (!atlasTex && !atlasLoading) loadAtlas();
requestAnimationFrame((t) => { if (my !== gen) return; last = t - 16; tick(t); arbitrate(); });
});
const calm = new Float32Array(16);
const rings12 = new Float32Array(16).fill(-1e5);
rings.forEach((r, i) => { if (i < 16 && !r.quiet) rings12[i] = r.s; });
const nodes8 = new Float32Array(8).fill(-1e5); nodes.forEach((n, i) => { nodes8[i] = n; });
function common(u) {
gl.uniform4fv(u.uB1, B1); gl.uniform4fv(u.uB2, B2); gl.uniform1f(u.uR, R0); gl.uniform1f(u.uIsle, S_ISLE); gl.uniform1f(u.uEnd, S_END);
}
function tick(now) {
if (document.hidden || sealed || my !== gen || !ready) { running = false; return; }
const stop = !active;
if (!stop) requestAnimationFrame(tick); else running = false;
const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
const ft = performance.now();
const tg = target();
if (stop) { p = tg; pv = 0; } else { pv += (OM * OM * (tg - p) - 2 * ZE * OM * pv) * dt; p += pv * dt; }
if (Math.abs(tg - p) < 1e-5 && Math.abs(pv) < 1e-5) { p = tg; pv = 0; }
const cam = camFromP(p);
const sv = (cam.s - lastS) / Math.max(dt, 1e-3); lastS = cam.s;
camVel += (clamp(sv, -60, 60) - camVel) * Math.min(1, dt * 4);
const T = (now - t0) / 1000;
const e = cam.e === 1 && p >= 0.1 ? 1 : p / 0.1;
const sc = e < 0.45 ? 1 - 0.4 * ss(0, 0.45, e) : 0.6 + 1.9 * ss(0.62, 1, e) ** 2;
plane.style.transform = `translateZ(0) rotateX(${(10 * ss(0, 0.45, e) * (1 - ss(0.6, 1, e))).toFixed(2)}deg) scale(${sc.toFixed(4)})`;
plane.style.opacity = (1 - ss(0.62, 0.95, e)).toFixed(3);
planeIn.style.opacity = (1 - ss(0.12, 0.34, e)).toFixed(3);
plane.style.borderRadius = `${(28 * ss(0, 0.45, e)).toFixed(1)}px`;
plane.style.setProperty('--edge', (0.35 * ss(0.1, 0.45, e)).toFixed(3));
const hole = Math.max(innerWidth, innerHeight) * 0.75 * ss(0.36, 0.9, e) ** 1.6;
plane.style.setProperty('--hole', `${hole.toFixed(1)}px`); plane.style.setProperty('--hf', `${Math.min(160, hole * 1.2 + (e > 0.36 ? 30 : 0)).toFixed(1)}px`);
plane.style.visibility = e >= 0.999 ? 'hidden' : 'visible';
light.style.opacity = (cam.g > 0 ? 0.92 * ss(0.3, 0.62, cam.g) * (1 - ss(0.0, 0.22, cam.f)) : 0).toFixed(3);
const railOn = !stop && e > 0.9 && cam.g < 0.2;
rail.classList.toggle('is-on', railOn); ROOT.classList.toggle('wh-on', railOn);
const sC = cam.s, look_ = 19;
const fr = frame(Math.max(sC, -10));
const curv = sub(add(C(sC + 10), C(sC - 10)), mul(C(sC), 2));
const rollT = clamp(-dot(curv, fr.X) * 0.12, -0.22, 0.22);
roll += (rollT - roll) * Math.min(1, dt * 1.6);
const up = norm(add(mul(fr.Y, Math.cos(roll)), mul(fr.X, Math.sin(roll))));
const eye = add(C(sC), mul(fr.Y, 0.75));
const tgtP = C(sC + look_);
const sphS = sC + 5.6 + 20 * cam.g * cam.g;
const sphFr = frame(sphS);
const sphC = add(C(sphS), mul(sphFr.Y, -0.62 + 0.62 * cam.g));
const asp = W / H, fovBase = asp < 1 ? 2 * Math.atan(Math.tan(0.62) / asp) : 1.08;
const fov = Math.min(1.9, fovBase + clamp(Math.abs(camVel) / 60, 0, 1) * 0.1);
const VP = mm(persp(fov, asp, 0.08, 400), look(eye, tgtP, up));
const foc = 1 / Math.tan(fov / 2);
const mouth = proj4(VP, C(sC + 70)), sp = proj4(VP, sphC);
const dk = Math.max(...S_DARKS.map((d) => Math.exp(-(((sC + 10 - d) / 16) ** 2))));
const slowK = 1 - 0.78 * Math.max(...S_DARKS.map((d) => Math.exp(-(((sC + 8 - d) / 22) ** 2))));
flowSpd += (1.6 * slowK - flowSpd) * Math.min(1, dt * 1.2); flowPh += flowSpd * dt; spinPh += (flowSpd / 1.6) * dt;
const isleK = ss(S_ISLE, S_ISLE + 34, sC + 20);
gl.viewport(0, 0, W, H);
gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
gl.useProgram(bP.p); gl.bindVertexArray(bVao);
gl.uniform2f(bP.u.uMouth, mouth[2] > 0 ? mouth[0] : 0.5, mouth[2] > 0 ? mouth[1] : 0.5);
gl.uniform2f(bP.u.uSph, sp[0], sp[1]); gl.uniform2f(bP.u.uRes, W, H);
gl.uniform1f(bP.u.uExit, ss(0.05, 0.6, cam.g) * (1 - 0.97 * ss(0.0, 0.24, cam.f))); gl.uniform1f(bP.u.uExitR, ss(0.05, 0.6, cam.g) * (1 - 0.9 * ss(0.0, 0.3, cam.f))); gl.uniform1f(bP.u.uT, T); gl.uniform1f(bP.u.uDk, dk);
gl.uniform1f(bP.u.uIsleK, isleK); gl.uniform1f(bP.u.uFin, ss(0.0, 0.3, cam.f) * (1 - 0.6 * ss(0.8, 1, cam.f))); gl.uniform1f(bP.u.uSphA, ss(0.55, 1, e) * (1 - cam.g));
gl.uniform1f(bP.u.uEntry, (1 - ss(0.6, 1, e)) * ss(0.05, 0.4, e));
gl.drawArrays(gl.TRIANGLES, 0, 3);
gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
pump(sC);
calm.fill(0); let calmN = 0;
for (const q of patches) { if (calmN >= 4) break; const d = q.s - sC;
if ((q.kind === 'plate' || q.kind === 'note') && q.tex && d > -6 && d < 100) calm.set([q.s, q.th, q.w / 2 + 0.8, (q.h / 2) / (R0 * q.inset) + 0.14], 4 * calmN++); }
gl.useProgram(pP.p); common(pP.u); gl.bindVertexArray(patchG.vao);
gl.uniformMatrix4fv(pP.u.uVP, false, VP); gl.uniform1f(pP.u.uCam, sC); gl.uniform1f(pP.u.uT, T);
for (const q of patches) {
const d = q.s - sC;
if (!q.tex && !q.loading && !q.queued && d < 170 && d > -20) { q.queued = true; queue.push(q); }
if (q.tex && (d < -60 || d > 240)) { gl.deleteTexture(q.tex); q.tex = null; q.loading = false; q.queued = false; }
if (!q.tex || d < -4 || d > 108) continue;
gl.depthMask(q.kind === 'photo');
gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, q.tex); gl.uniform1i(pP.u.uTex, 0);
gl.uniform1f(pP.u.uS, q.s); gl.uniform1f(pP.u.uTh, q.th); gl.uniform1f(pP.u.uW, q.w); gl.uniform1f(pP.u.uH, q.h);
gl.uniform1f(pP.u.uTilt, q.tilt); gl.uniform1f(pP.u.uRot, q.rot); gl.uniform1f(pP.u.uInset, q.inset);
gl.uniformMatrix2fv(pP.u.uM, false, q.M);
gl.uniform1f(pP.u.uFeather, q.kind === 'photo' ? 0.16 : 0); gl.uniform1f(pP.u.uGate, q.kind === 'skyline' || q.gate ? 1 : 0);
gl.uniform1f(pP.u.uAlpha, q.kind === 'plate' && q.ring.quiet ? 0.9 : 1);
{ // cap on-screen size: a passing work fades out before it covers ~45% of the screen
let nf = 1;
if (q.kind === 'photo') {
const cpos = q.gate ? C(q.s) : wallC(q.s, q.th, RadC(q.s) * q.inset), dd = Math.max(0.5, Math.hypot(...sub(cpos, eye)));
const cov = (q.w * foc / (2 * dd)) * (q.h * foc / (2 * dd)) / Math.max(asp, 1 / asp);
nf = 1 - ss(0.26, 0.45, cov);
}
gl.uniform1f(pP.u.uNear, nf);
}
gl.uniform1f(pP.u.uWarm, q.item && q.item.personal ? (q.item.group === 'drawings' ? 0.6 : 1) : 0);
if (q.bands) { // the plate writes itself as the traveller approaches; far behind or far ahead it is blank again
if (d < 72) q.rv = Math.min(9, q.rv + dt); else if (d > 96) q.rv = 0;
gl.uniform1i(pP.u.uNB, q.bands.length); gl.uniform4fv(pP.u.uBands, new Float32Array(24).fill(0).map((v, j) => (q.bands[j >> 2] || [0, 0, 0, 0])[j & 3]));
gl.uniform1f(pP.u.uRev, q.rv);
} else gl.uniform1i(pP.u.uNB, 0);
gl.uniform1f(pP.u.uDim, q.kind === 'photo' ? (q.item.group === 'drawings' ? 0.88 : 0.92) : q.kind === 'note' ? 0.92 : 1);
gl.drawElements(gl.TRIANGLES, patchG.n, gl.UNSIGNED_SHORT, 0);
}
gl.depthMask(false);
if (!atlasTex && !atlasLoading && sC > -40) loadAtlas();
if (atlasTex) {
updateCards(sC, dt);
gl.useProgram(fP.p); common(fP.u); gl.bindVertexArray(fVao);
gl.uniformMatrix4fv(fP.u.uVP, false, VP); gl.uniform1f(fP.u.uCam, sC);
gl.uniform1f(fP.u.uCols, atlasMeta.cols); gl.uniform1f(fP.u.uRows, atlasMeta.rows);
gl.uniform1f(fP.u.uVel, camVel);
const tint = isleK > 0.5 ? [0.85, 1.05, 1.0] : [0.92, 0.88, 1.08]; gl.uniform3f(fP.u.uTint, ...tint);
gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, atlasTex); gl.uniform1i(fP.u.uTex, 0);
gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, FN);
}
gl.blendFunc(gl.ONE, gl.ONE);
gl.useProgram(eP.p); common(eP.u);
gl.uniformMatrix4fv(eP.u.uVP, false, VP); gl.uniform1f(eP.u.uCam, sC); gl.uniform1f(eP.u.uPh, flowPh); gl.uniform1f(eP.u.uSp, spinPh);
gl.uniform1f(eP.u.uEmber, S_EMBER); gl.uniform2f(eP.u.uDarks, S_DARKS[0], S_DARKS[1]); gl.uniform1f(eP.u.uSkin, 1);
gl.uniform4fv(eP.u.uCalm, calm); gl.uniform1i(eP.u.uCalmN, calmN);
gl.uniform1f(eP.u.uMode, 0); gl.bindVertexArray(skinG.vao); gl.drawElements(gl.TRIANGLES, skinG.n, gl.UNSIGNED_SHORT, 0);
gl.uniform1f(eP.u.uMode, 1); gl.uniform1f(eP.u.uW, 0.07); gl.bindVertexArray(ribbonG.vao);
gl.drawElementsInstanced(gl.TRIANGLES, ribbonG.n, gl.UNSIGNED_SHORT, 0, MOBILE ? 22 : 34);
gl.blendFunc(gl.ONE, gl.ONE);
gl.useProgram(rP.p); common(rP.u); gl.bindVertexArray(ribbonG.vao);
gl.uniformMatrix4fv(rP.u.uVP, false, VP); gl.uniform1f(rP.u.uCam, sC); gl.uniform1f(rP.u.uT, T);
gl.uniform1fv(rP.u.uNodes, nodes8);
gl.uniform1f(rP.u.uMode, 1); gl.uniform1f(rP.u.uS0, Math.max(0, sC - 4)); gl.uniform1f(rP.u.uS1, Math.min(S_END - 6, sC + 110));
gl.uniform1f(rP.u.uTh, ROUTE_TH); gl.uniform1f(rP.u.uW, 0.16);
gl.uniform3f(rP.u.uCol, 0.78, 0.7, 1.0); gl.uniform1f(rP.u.uI, 0.55);
if (sC + 110 > 0) gl.drawElements(gl.TRIANGLES, ribbonG.n, gl.UNSIGNED_SHORT, 0);
gl.uniform1f(rP.u.uMode, 0); gl.uniform1f(rP.u.uW, 0.5);
for (const r of rings) {
const d = r.s - sC; if (d < -3 || d > 110) continue;
gl.uniform1f(rP.u.uS0, r.s);
if (r.quiet) { gl.uniform3f(rP.u.uCol, 0.42, 0.40, 0.46); gl.uniform1f(rP.u.uI, 0.22); }
else { const c = r.palette === 'isle' ? [0.6, 1, 0.85] : r.palette === 'ember' ? [1, 0.78, 0.6] : [0.75, 0.66, 1]; gl.uniform3f(rP.u.uCol, ...c); gl.uniform1f(rP.u.uI, 0.5); }
gl.drawElements(gl.TRIANGLES, ribbonG.n, gl.UNSIGNED_SHORT, 0);
}
gl.useProgram(gP.p); common(gP.u); gl.bindVertexArray(gVao);
gl.uniformMatrix4fv(gP.u.uVP, false, VP); gl.uniform1f(gP.u.uCam, sC); gl.uniform1f(gP.u.uT, T);
gl.uniform1f(gP.u.uVel, camVel); gl.uniform1f(gP.u.uWin, 120); gl.uniform1f(gP.u.uFlow, flowSpd); gl.uniform1f(gP.u.uPh, flowPh); gl.uniform1f(gP.u.uSp, spinPh); gl.uniform1f(gP.u.uDpr, DPR);
gl.uniform1fv(gP.u.uRings, rings12); gl.uniform2f(gP.u.uRes, W, H); gl.uniform1f(gP.u.uFoc, foc);
gl.uniform1f(gP.u.uEmber, S_EMBER); gl.uniform2f(gP.u.uDarks, S_DARKS[0], S_DARKS[1]);
gl.uniform4fv(gP.u.uCalm, calm); gl.uniform1i(gP.u.uCalmN, calmN);
gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
gl.disable(gl.DEPTH_TEST);
gl.useProgram(sP.p); gl.bindVertexArray(sVao);
gl.uniformMatrix4fv(sP.u.uVP, false, VP); gl.uniform3fv(sP.u.uC, sphC); gl.uniform3fv(sP.u.uEye, eye);
gl.uniform1f(sP.u.uT, T); gl.uniform1f(sP.u.uSz, 0.032); gl.uniform1f(sP.u.uDpr, DPR); gl.uniform2f(sP.u.uRes, W, H); gl.uniform1f(sP.u.uFoc, foc);
gl.uniform1f(sP.u.uA, (1 - 0.85 * ss(0.2, 0.7, cam.g)) * ss(0.5, 0.8, e));
gl.uniform1f(sP.u.uScale, ss(0.5, 0.95, e) * (1 - 0.7 * ss(0.3, 1, cam.g)));
if (e > 0.5) gl.drawArrays(gl.POINTS, 0, SN);
finale.draw(cam.f, T, W, H, DPR);
if (MOBILE && cap) {
let best = null, bd = 1e9; for (const r of rings) { const d = Math.abs(sC - (r.s - 17)); if (d < bd) { bd = d; best = r; } }
const op = cam.g > 0 || e < 1 ? 0 : 1 - ss(5, 13, bd);
if (best !== capRing && op < 0.05) { capRing = best; capY.textContent = best.label; capL.textContent = best.caption.replace(/^\d{4}\s—\s/, ''); }
cap.style.opacity = (best === capRing ? op : 0).toFixed(3);
}
score.progress(p, sC, camVel);
{ let ri = -1; for (let i = 0; i < rings.length; i++) if (sC >= rings[i].s - 14) ri = i;
if (ri !== scoreRing) { if (ri >= 0) score.ring(rings[ri], ri > scoreRing ? 1 : -1); scoreRing = ri; }
const nx = rings[ri + 1]; const pv0 = ri >= 0 ? rings[ri].s : -40;
score.flip(nx && !nx.quiet && !nx.hush ? ss(pv0 + 7, nx.s - 20, sC + 20) * (1 - ss(nx.s - 15, nx.s - 5, sC + 20)) : 0);
score.exit(cam.g); }
if (!stop && tg >= 1 && p > 0.995) seal();
let act = 0; rail.querySelectorAll('a').forEach((a, i) => { if (sC >= +a.dataset.s - 30) act = i; });
rail.querySelectorAll('a').forEach((a, i) => a.classList.toggle('is-on', i === act));
const ms = performance.now() - ft; stats.frames++; stats.sum += dt; stats.worst = Math.max(stats.worst, dt * 1000);
stats.cpu = ms; stats.p = p; stats.s = sC;
}
}
