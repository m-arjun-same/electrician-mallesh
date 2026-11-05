const SEALD = 'M2.3 1.5C8 .9 16 1.4 21.9 1.1C22.9 7 22.5 15 23 22.4C16 23.1 8 22.6 1.3 22.9C1.6 15 .9 8 2.3 1.5Z';
const SLS = 'M10.6 5.3C8.6 4.4 5.6 4.8 5.6 7.4C5.6 10.3 10.6 10.4 10.5 14.1C10.4 17.4 7.2 18.9 4.7 17.7';
const SLL = 'M14.7 4.7C14.6 9 14.9 13.9 14.5 18.4C16.3 18.2 17.9 18.3 19.5 18.7';
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rnd(seed) { let z = seed >>> 0 || 1; return () => ((z = (z * 16807) % 2147483647) / 2147483647); }
export function stoneGrains(N, seed = 6) {
const out = new Float32Array(N * 4), nrm = new Float32Array(N * 3), r = rnd(seed), hw = 0.17, hh = 0.21;
const c = document.createElement('canvas'), R = 96; c.width = c.height = R;
const g = c.getContext('2d'); g.scale(R / 24, R / 24); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#000';
g.lineWidth = 2.3; g.stroke(new Path2D(SLS)); g.lineWidth = 2.1; g.stroke(new Path2D(SLL));
const carved = g.getImageData(0, 0, R, R).data;
const faces = [[0.30, 'bottom'], [0.1, 'top'], [0.1, 'x+'], [0.1, 'x-'], [0.1, 'z+'], [0.1, 'z-'], [0.2, 'edge']];
for (let n = 0; n < N; n++) {
const pk = r(); let acc = 0, f = 'bottom';
for (const fc of faces) { acc += fc[0]; if (pk <= acc) { f = fc[1]; break; } }
const a = r() * 2 - 1, b = r() * 2 - 1; let x, y, z, w = 0.35 + 0.55 * r() * (0.6 + 0.4 * Math.sin(a * 7 + b * 5)), nx = 0, ny = 0, nz = 0;
if (f === 'bottom') {
x = a * hw; z = b * hw; y = hh; ny = 1;
const px = Math.min(R - 1, Math.max(0, Math.round((-a * 0.5 + 0.5) * R))), pz = Math.min(R - 1, Math.max(0, Math.round((-b * 0.5 + 0.5) * R)));
const cut = carved[(pz * R + px) * 4 + 3] > 100, edge = Math.max(Math.abs(a), Math.abs(b)) > 0.86;
if (cut) { y = hh - 0.004; w = 6.99; } else if (!edge) w = 4.99;
} else if (f === 'top') {
x = a * hw; z = b * hw; y = -hh; ny = -1;
const kr = Math.hypot(a, b); if (kr < 0.55) { y = -hh - 0.07 * Math.sqrt(Math.max(0, 1 - kr * kr / 0.3)); w = 0.6 + 0.4 * r(); }
} else if (f === 'x+' || f === 'x-') { x = f === 'x+' ? hw : -hw; y = a * hh; z = b * hw; nx = Math.sign(x); }
else if (f === 'edge') {
const e3 = (r() * 12) | 0, sa = e3 & 1 ? 1 : -1, sb = e3 & 2 ? 1 : -1, ax = e3 >> 2; w = 1;
if (ax === 0) { x = a * hw; y = sa * hh; z = sb * hw; ny = sa * 0.7; nz = sb * 0.7; }
else if (ax === 1) { y = a * hh; x = sa * hw; z = sb * hw; nx = sa * 0.7; nz = sb * 0.7; }
else { z = a * hw; x = sa * hw; y = sb * hh; nx = sa * 0.7; ny = sb * 0.7; }
} else { z = f === 'z+' ? hw : -hw; y = a * hh; x = b * hw; nz = Math.sign(z); }
out.set([x, -y, z, w], n * 4); nrm.set([nx, -ny, nz], n * 3); // face down
}
return { pos: out, nrm };
}
export function createFinale(gl, prog, { MOBILE, root }) {
const N = MOBILE ? 7000 : 16000, HN = MOBILE ? 360 : 700;
const { pos, nrm } = stoneGrains(N);
const r = rnd(41), rand = new Float32Array(N * 4);
for (let i = 0; i < N; i++) rand.set([r(), r(), r(), r()], i * 4);
const halo = new Float32Array(HN * 4);
for (let i = 0; i < HN; i++) halo.set([r() * Math.PI * 2, 0.36 + (r() - 0.5) * 0.05, (r() - 0.5) * 0.03, r()], i * 4);
const P = prog(`
layout(location=0) in vec4 aP; layout(location=1) in vec3 aN; layout(location=2) in vec4 aR;
uniform float uF, uT, uAsp, uDpr, uH, uMode, uZoom;
out vec3 vC; out float vA;
vec3 rotY(vec3 p,float a){ float c=cos(a), s=sin(a); return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z); }
vec3 rotX(vec3 p,float a){ float c=cos(a), s=sin(a); return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z); }
float sst(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
void main(){
float f=uF;
float form=sst(.02,.34,f-aR.w*.06);               // light -> grains -> stone
float tilt=-sst(.5,.7,f)*1.5708;                    // turn the carved face toward us
float spin=(1.-sst(.46,.66,f))*(f*5.2+uT*.05);     // slow turn, settles before the press
float press=sst(.66,.76,f);                        // move onto the screen
float lift=sst(.76,.86,f);                         // after the stamp: lift and dissolve
vec3 p, n=aN; float code=aP.w, a=1.;
if(uMode<.5){
p=rotX(rotY(aP.xyz,spin),tilt+.3*(1.-sst(.5,.7,f))); n=rotX(rotY(n,spin),tilt+.3*(1.-sst(.5,.7,f)));
float desc=(1.-sst(.18,.5,f))*.5;               // descends in the beam
p.y+=desc+.06;
vec3 cloud=vec3((aR.x-.5)*1.5,(aR.y-.5)*1.1,(aR.z-.5)*.6);   // the light, spread wide
cloud*= .35+.65*aR.w;
p=mix(cloud,p,form);
float sc=mix(1.,1.12,press);
p*=sc; p.z+=press*.12;
p+=normalize(vec3(aR.x-.5,aR.y-.5,.2))*lift*(.25+.6*aR.z); // grains scatter into ink specks
a=1.-lift;
} else {
float ang=aP.x+uT*.05+f*3.2, rr=aP.y*(1.+.05*sin(f*9.+aP.w*20.));
p=vec3(cos(ang)*rr*1.35,aP.z+sin(ang)*rr*.22-.02,sin(ang)*rr*.9);
p=rotX(p,-.18);
a=sst(.2,.42,f)*(1.-sst(.6,.72,f))*(.35+.65*aP.w);
}
float cz=1.55; vec3 q=p; q.z-=cz;
float fy=1./tan(.36)*uZoom;
gl_Position=vec4(q.x*fy/uAsp,q.y*fy,(-q.z-.1)/10.,-q.z);
float red=step(3.5,code)*(1.-step(5.5,code)), cream=step(5.5,code);
vec3 stone=mix(vec3(.58,.54,.50),vec3(.84,.79,.72),aR.x)*(.85+.4*aR.y);
vec3 col=mix(mix(stone,vec3(.86,.24,.2),red),vec3(1.,.95,.88),cream);
float sh=.42+.85*max(dot(normalize(n+vec3(0,0,.0001)),normalize(vec3(-.45,.75,.55))),0.);
col*=mix(1.,sh,form);
vec3 light=vec3(1.,.95,.86);
col=mix(light*1.35,col,form);
if(uMode>.5) col=vec3(.95,.80,.52);
vC=col; vA=a*(uMode>.5?.55:1.)*sst(0.,.06,f);
gl_PointSize=max(1.,(uMode>.5?2.2:2.3)*uDpr*uH/900.*(1.+press*.35)*(.7+.6*aR.z)*(2.4/-q.z)*uZoom);
}`, `
in vec3 vC; in float vA; out vec4 o;
void main(){ vec2 d=gl_PointCoord-.5; float a=smoothstep(.5,.2,length(d))*vA; o=vec4(vC*a,a); }`);
const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
const buf = (data, loc, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
buf(pos, 0, 4); buf(nrm, 1, 3); buf(rand, 2, 4);
const hvao = gl.createVertexArray(); gl.bindVertexArray(hvao);
buf(halo, 0, 4); gl.disableVertexAttribArray(1); gl.vertexAttrib3f(1, 0, 0, 1); buf(rand.subarray(0, HN * 4), 2, 4);
gl.bindVertexArray(null);
const UK = document.documentElement.lang === 'uk';
const fin = document.createElement('div'); fin.className = 'wh__fin'; fin.setAttribute('aria-hidden', 'false');
fin.innerHTML = `<div class="wh__beam"></div>
<div class="wh__stamp">${impressionSVG()}</div>
<p class="wh__fintop">${UK ? 'Це був мій маршрут — і мої клієнти пройшли його зі мною.' : 'This was my route, and my clients became part of it.'}</p>
<p class="wh__finline">${UK ? 'А найцікавіше на цьому шляху ще попереду.' : 'And the most interesting part of the route is still ahead.'}</p>`;
root.append(fin);
const beam = fin.querySelector('.wh__beam'), stamp = fin.querySelector('.wh__stamp'), line = fin.querySelector('.wh__finline'), top = fin.querySelector('.wh__fintop');
const specks = [...fin.querySelectorAll('.sp')];
function draw(f, T, W, H, DPR) {
const on = f > 0.001;
fin.style.visibility = on ? 'visible' : 'hidden';
beam.style.opacity = (ss(0.08, 0.3, f) * (1 - ss(0.62, 0.78, f)) * 0.9).toFixed(3);
const st = ss(0.73, 0.8, f);
stamp.style.opacity = st.toFixed(3);
stamp.style.transform = `translate(-50%,-50%) scale(${(1.05 - 0.05 * st).toFixed(4)})`;
stamp.style.filter = `blur(${((1 - st) * 3).toFixed(2)}px)`;
specks.forEach((s, i) => { s.style.opacity = ss(0.76 + (i % 5) * 0.008, 0.82 + (i % 5) * 0.008, f).toFixed(3); });
line.style.opacity = ss(0.84, 0.92, f).toFixed(3);
line.style.transform = `translate(-50%, ${((1 - ss(0.84, 0.92, f)) * 10).toFixed(1)}px)`;
top.style.opacity = ss(0.80, 0.88, f).toFixed(3);
top.style.transform = `translate(-50%, calc(-100% - ${((1 - ss(0.80, 0.88, f)) * 10).toFixed(1)}px))`;
if (!on || f > 0.9) return;
gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
gl.useProgram(P.p);
gl.uniform1f(P.u.uF, f); gl.uniform1f(P.u.uZoom, W / H < 1 ? 1.85 * W / H : 1.13); gl.uniform1f(P.u.uT, T); gl.uniform1f(P.u.uAsp, W / H); gl.uniform1f(P.u.uDpr, DPR); gl.uniform1f(P.u.uH, H / DPR);
gl.uniform1f(P.u.uMode, 1); gl.bindVertexArray(hvao); gl.drawArrays(gl.POINTS, 0, HN);
gl.uniform1f(P.u.uMode, 0); gl.bindVertexArray(vao); gl.drawArrays(gl.POINTS, 0, N);
}
return { draw, el: fin };
}
export function impressionSVG() {
const r = rnd(77); let specks = '';
for (let i = 0; i < 9; i++) {
const a = r() * Math.PI * 2, d = 12.6 + r() * 2.6;
specks += `<circle class="sp" cx="${(12 + Math.cos(a) * d).toFixed(2)}" cy="${(12 + Math.sin(a) * d).toFixed(2)}" r="${(0.12 + r() * 0.32).toFixed(2)}" fill="#b8322a"/>`;
}
return `<svg viewBox="-4 -4 32 32" width="100%" height="100%" role="img" aria-label="SL seal">
<defs>
<filter id="wh-rough" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.7"/></filter>
<filter id="wh-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="2.4" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.25" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
<mask id="wh-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>
<g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="2.3" d="${SLS}"/><path stroke-width="2.1" d="${SLL}"/></g>
<g fill="#000"><circle cx="19.6" cy="5.2" r=".55"/><circle cx="4.2" cy="20.6" r=".45"/><circle cx="20.8" cy="13.4" r=".35"/><circle cx="8.8" cy="21.4" r=".3"/><circle cx="17.2" cy="2.4" r=".3"/></g></mask>
</defs>
<g filter="url(#wh-ink)"><path fill="#c8382c" filter="url(#wh-rough)" mask="url(#wh-cut)" d="${SEALD}"/></g>
${specks}
</svg>`;
}
