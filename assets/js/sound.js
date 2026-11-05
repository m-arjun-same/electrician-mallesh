/* Live-synthesised calm score (WebAudio) — same concept as reference sound.js: no audio files */
(function(){
  var ctx=null, master=null, on=false, timers=[];
  function start(){
    if(!ctx){ ctx=new (window.AudioContext||window.webkitAudioContext)(); master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination); }
    ctx.resume(); master.gain.linearRampToValueAtTime(.14, ctx.currentTime+1.2);
    function pad(freq,t){ var o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
      o.type='sine'; o.frequency.value=freq; f.type='lowpass'; f.frequency.value=900;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.16,t+2); g.gain.linearRampToValueAtTime(0,t+6);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+6.2); }
    function bell(freq,t){ var o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine'; o.frequency.value=freq;
      g.gain.setValueAtTime(.12,t); g.gain.exponentialRampToValueAtTime(.0001,t+2.4);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+2.5); }
    var chords=[[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7],[220,261.6,329.6]], ci=0;
    function loop(){ if(!on) return; var t=ctx.currentTime+.1, c=chords[ci++%chords.length];
      c.forEach(function(f){ pad(f,t); }); bell(c[2]*2, t+1.5); timers.push(setTimeout(loop, 6000)); }
    on=true; loop();
  }
  function stop(){ on=false; timers.forEach(clearTimeout); timers=[]; if(master) master.gain.linearRampToValueAtTime(0, ctx.currentTime+.6); }
  window.__sound={ toggle:function(){ var nowOn=!on; if(nowOn) start(); else stop(); return nowOn; } };
})();
