/* Phronesis Labs · landing directions — ambient and scroll behaviour.
   Everything degrades to a readable static page: the .js class is what turns motion on. */
(function(){
  var root=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduce) root.classList.add('js');

  /* header: transparent over the hero, solid once you leave it */
  var hdr=document.querySelector('.hdr');
  if(hdr && !hdr.classList.contains('lock')){
    var onScroll=function(){ hdr.classList.toggle('solid', scrollY>40); };
    addEventListener('scroll',onScroll,{passive:true}); onScroll();
  }
  var burger=document.querySelector('.hdr-burger'), nav=document.querySelector('.hdr-nav');
  if(burger&&nav) burger.addEventListener('click',function(){
    var open=nav.classList.toggle('open'); burger.setAttribute('aria-expanded',open);
  });

  /* reveals */
  var seen=function(els,cls){
    if(!('IntersectionObserver' in window)||reduce){ els.forEach(function(e){e.classList.add(cls);}); return; }
    var io=new IntersectionObserver(function(en){ en.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add(cls); io.unobserve(e.target); } });
    },{rootMargin:'0px 0px -6% 0px',threshold:.12});
    els.forEach(function(e){ io.observe(e); });
  };
  seen([].slice.call(document.querySelectorAll('.rv')),'in');
  seen([].slice.call(document.querySelectorAll('.chip')),'in');

  /* numbers count up when they arrive */
  var nums=[].slice.call(document.querySelectorAll('[data-count]'));
  var run=function(el){
    var to=parseFloat(el.getAttribute('data-count')), dec=(to%1)?1:0, t0=null, dur=1000;
    if(reduce){ el.textContent=to.toFixed(dec); return; }
    requestAnimationFrame(function step(ts){
      if(!t0)t0=ts; var p=Math.min(1,(ts-t0)/dur); p=1-Math.pow(1-p,3);
      el.textContent=(to*p).toFixed(dec); if(p<1) requestAnimationFrame(step);
    });
  };
  if('IntersectionObserver' in window){
    var io2=new IntersectionObserver(function(en){ en.forEach(function(e){
      if(e.isIntersecting){ run(e.target); io2.unobserve(e.target); } }); },{threshold:.6});
    nums.forEach(function(e){ io2.observe(e); });
  } else nums.forEach(run);

  /* hero: cursor parallax on the markers and the data card */
  var hero=document.querySelector('.hero');
  if(hero&&!reduce&&matchMedia('(pointer:fine)').matches){
    var raf=false,mx=0,my=0;
    hero.addEventListener('mousemove',function(e){
      var r=hero.getBoundingClientRect();
      mx=(e.clientX-r.left)/r.width*2-1; my=(e.clientY-r.top)/r.height*2-1;
      if(!raf){ raf=true; requestAnimationFrame(function(){
        hero.style.setProperty('--mx',mx.toFixed(3)); hero.style.setProperty('--my',my.toFixed(3)); raf=false; }); }
    });
    hero.addEventListener('mouseleave',function(){ hero.style.setProperty('--mx',0); hero.style.setProperty('--my',0); });
  }

  /* markers reveal their captions in sequence, then stay */
  var pins=[].slice.call(document.querySelectorAll('.pin'));
  if(reduce) pins.forEach(function(p){ p.classList.add('show'); });
  else pins.forEach(function(p,i){ setTimeout(function(){ p.classList.add('show'); }, 1500+i*260); });

  /* the reticle walks the frame and reads out what the lab is measuring */
  var ret=document.querySelector('.reticle');
  if(ret&&!reduce){
    var read=ret.querySelector('.read');
    var stops=JSON.parse(ret.getAttribute('data-stops')||'[]');
    var i=-1;
    var hop=function(){
      i=(i+1)%stops.length; var s=stops[i];
      ret.classList.remove('on');
      setTimeout(function(){
        ret.style.left=s.x; ret.style.top=s.y;
        read.innerHTML=s.t; ret.classList.add('on');
      },520);
    };
    setTimeout(function(){ hop(); setInterval(hop,4200); },1900);
  }

  /* carousel arrows */
  document.querySelectorAll('[data-rail]').forEach(function(nav){
    var rail=document.querySelector(nav.getAttribute('data-rail'));
    if(!rail) return;
    nav.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        var step=rail.firstElementChild ? rail.firstElementChild.offsetWidth+16 : 400;
        rail.scrollBy({left:(b.dataset.dir==='next'?1:-1)*step,behavior:reduce?'auto':'smooth'});
      });
    });
  });

  /* drop the intro curtain from the tree once it has played */
  var curtain=document.querySelector('.curtain');
  if(curtain){ if(reduce) curtain.remove(); else setTimeout(function(){ curtain.remove(); },1300); }
})();
