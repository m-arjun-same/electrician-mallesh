(function(){
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Lenis smooth scroll — same vendor lib as reference */
  var lenis=null;
  if(!rm && window.Lenis){
    lenis=new Lenis({ duration:1.15, smoothWheel:true });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  function goTo(sel){ var el=document.querySelector(sel); if(!el) return;
    if(lenis) lenis.scrollTo(el,{offset:-70}); else el.scrollIntoView({behavior: rm?'auto':'smooth'}); }

  /* Anchor links through Lenis */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){ var h=a.getAttribute('href'); if(h.length>1){ e.preventDefault(); goTo(h); closeMenu(); } });
  });

  /* Reveal on scroll — IntersectionObserver, clip wipe */
  var io=new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); } }); },{threshold:.12, rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });

  /* Header bg + chapter label */
  var bg=document.querySelector('.hdr-bg'), mid=document.querySelector('[data-chap]');
  var secs=[].slice.call(document.querySelectorAll('[data-chap]'));
  addEventListener('scroll',function(){ bg.classList.toggle('is-on', scrollY>40);
    var cur='Portfolio'; secs.forEach(function(s){ if(s.getBoundingClientRect().top<innerHeight*.45) cur=s.getAttribute('data-chap'); }); if(mid) mid.textContent=cur;
  },{passive:true});

  /* Fullscreen menu */
  var menu=document.getElementById('menu'), mb=document.getElementById('menuBtn'), open=false;
  function closeMenu(){ if(!open) return; open=false; menu.classList.remove('is-open'); menu.setAttribute('aria-hidden','true'); mb.setAttribute('aria-expanded','false'); mb.querySelector('span').textContent='Menu'; if(lenis) lenis.start(); }
  mb.addEventListener('click',function(){ open=!open; menu.classList.toggle('is-open',open); menu.setAttribute('aria-hidden', String(!open)); mb.setAttribute('aria-expanded',String(open)); mb.querySelector('span').textContent=open?'Close':'Menu'; if(lenis){ open?lenis.stop():lenis.start(); } });
  addEventListener('keydown',function(e){ if(e.key==='Escape') closeMenu(); });
  window.__closeMenu=closeMenu;

  /* Long board: press-to-glide scroller (reference interaction) */
  var lv=document.getElementById('longView'), lb=document.getElementById('longBtn'), live=false, auto=null;
  lb.addEventListener('click',function(){
    live=!live; lv.classList.toggle('is-live',live);
    lb.querySelector('span').textContent= live?'Done':'Scroll the board';
    if(live){ auto=setInterval(function(){ lv.scrollTop+=2.2; if(lv.scrollTop+lv.clientHeight>=lv.scrollHeight-4){ clearInterval(auto); } },16); }
    else if(auto) clearInterval(auto);
  });
  lv.addEventListener('pointerdown',function(){ if(auto) clearInterval(auto); });

  /* Sound toggle */
  var sb=document.getElementById('sndBtn');
  sb.addEventListener('click',function(){ var on=window.__sound && window.__sound.toggle(); sb.setAttribute('aria-pressed',String(!!on)); sb.querySelector('.snd-state').textContent= on?'on':'off'; });

  /* Grain — canvas noise, parts around the pointer (reference grain engine, simplified) */
  var cv=document.getElementById('grain'), cx=cv.getContext('2d'), W,H, mx=-999,my=-999;
  function size(){ W=cv.width=innerWidth; H=cv.height=innerHeight; } size(); addEventListener('resize',size);
  addEventListener('pointermove',function(e){ mx=e.clientX; my=e.clientY; },{passive:true});
  var img=cx.createImageData(160,160);
  (function draw(){
    var d=img.data;
    for(var i=0;i<d.length;i+=4){ var v=(Math.random()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=28; }
    var pat=cx.createPattern((function(){ var t=document.createElement('canvas'); t.width=t.height=160; t.getContext('2d').putImageData(img,0,0); return t; })(),'repeat');
    cx.clearRect(0,0,W,H); cx.fillStyle=pat; cx.fillRect(0,0,W,H);
    if(mx>0){ cx.save(); cx.globalCompositeOperation='destination-out'; var g=cx.createRadialGradient(mx,my,0,mx,my,150); g.addColorStop(0,'rgba(0,0,0,.9)'); g.addColorStop(1,'rgba(0,0,0,0)'); cx.fillStyle=g; cx.beginPath(); cx.arc(mx,my,150,0,7); cx.fill(); cx.restore(); }
    if(!rm) setTimeout(function(){ requestAnimationFrame(draw); },80);
  })();

  /* Booking form — local only, no data leaves the page */
  document.getElementById('bookForm').addEventListener('submit',function(e){ e.preventDefault(); document.getElementById('formOk').hidden=false; e.target.querySelector('button').blur(); });
})();
