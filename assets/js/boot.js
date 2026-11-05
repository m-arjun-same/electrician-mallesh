/* Boot gate — same idea as reference: reduced-motion flag + brief scroll lock while hero settles */
(function(){
  var el=document.documentElement;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) el.classList.add('rm');
  el.classList.add('js','lock');
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; scrollTo(0,0);}catch(e){}
  var locked=true;
  function unlock(){ if(!locked) return; locked=false; el.classList.remove('lock'); }
  ['wheel','touchmove','keydown'].forEach(function(t){ addEventListener(t,function(e){ if(locked && t!=='keydown') e.preventDefault(); },{passive:false}); });
  setTimeout(unlock, 900);
  window.__unlock=unlock;
})();
/* 60fps cap — reference caps rAF at 60 on high-refresh screens */
(function(){
  var orig=window.requestAnimationFrame, last=0, STEP=1000/60;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.requestAnimationFrame=function(cb){
    return orig.call(window,function(t){
      if(t-last < STEP-2){ window.requestAnimationFrame(cb); return; }
      last=t; cb(t);
    });
  };
})();
