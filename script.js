const $ = (s)=>document.querySelector(s), $$=(s)=>document.querySelectorAll(s);
document.addEventListener('DOMContentLoaded',()=>{
  const intro=$('.intro'), cta=$('.cta-button.pulse-effect'), introTxt=$('.intro-content');
  if(introTxt){introTxt.style.opacity=0;introTxt.style.transform='translateY(20px)';}
  setTimeout(()=>{ if(intro){ intro.style.opacity='0'; intro.addEventListener('transitionend',()=>{
      intro.style.display='none'; intro.style.zIndex=-1; if(cta) cta.style.animationPlayState='running';
  },{once:true}); } else if(cta){ cta.style.animationPlayState='running'; } },5000);

  $$('.nav-links a').forEach(a=>a.addEventListener('click',e=>{
    const href=a.getAttribute('href')||''; if(href.startsWith('#')){ e.preventDefault(); $(href)?.scrollIntoView({behavior:'smooth'}); }
  }));

  const quotes=[
    "The pain didn’t kill me — it made me art.","Madness is just misunderstood genius.","You weren’t too much — they were too little.",
    "Sanity isn’t silence — it’s choosing your own noise.","The meds didn’t fix me. I forged myself anyway.","You felt everything because you’re real.",
    "Labels don’t fit gods in disguise.","Healing isn’t soft. It’s war.","Your breakdown was a broadcast.","Not broken. Rewritten."
  ];
  const ticker=$('#quoteTicker'); let qi=0, idx=0, t1, t2, paused=false, q=quotes[0];
  function type(){ if(!ticker||paused) return; if(idx<q.length){ ticker.textContent+=q.charAt(idx++); t1=setTimeout(type,60);} else {t1=setTimeout(del,3000);} }
  function del(){ if(!ticker||paused) return; if(ticker.textContent.length){ ticker.textContent=ticker.textContent.slice(0,-1); t2=setTimeout(del,30);} else { idx=0; qi=(qi+1)%quotes.length; q=quotes[qi]; t1=setTimeout(type,500);} }
  function startIfIdle(){ if(ticker && !ticker.textContent) { q=quotes[qi]; type(); } }
  if(ticker){
    ticker.addEventListener('mouseenter',()=>{paused=true; clearTimeout(t1); clearTimeout(t2); ticker.style.borderRightColor='transparent';});
    ticker.addEventListener('mouseleave',()=>{paused=false; ticker.style.borderRightColor='rgba(255,255,255,.7)'; if(idx<q.length) type(); else t2=setTimeout(del,500);});
    document.addEventListener('visibilitychange',()=>{paused=document.hidden; if(!paused) startIfIdle();});
    startIfIdle();
  }

  const items=[...document.querySelectorAll('.feed-item-placeholder')];
  const IO='IntersectionObserver' in window;
  function playIfVideo(el){ const v=el.querySelector?.('.feed-video'); if(!v) return; if(!v.dataset.loaded){ v.muted=true; v.playsInline=true; v.load(); v.dataset.loaded='1'; } v.play().catch(()=>{}); }
  function pauseIfVideo(el){ const v=el.querySelector?.('.feed-video'); if(v && !v.paused) v.pause(); }
  if(IO && items.length){
    const obs=new IntersectionObserver((entries)=>entries.forEach(ent=>{
      const it=ent.target; if(ent.isIntersecting){ it.style.animationPlayState='running'; playIfVideo(it);} else { pauseIfVideo(it); }
    }),{root:null,rootMargin:'0px 0px -10% 0px',threshold:.1});
    items.forEach(it=>{ it.style.animationPlayState='paused'; obs.observe(it); });
  } else { items.forEach(it=>{ it.style.animationPlayState='running'; playIfVideo(it); }); }

  if(cta && IO){ const o=new IntersectionObserver((es)=>es.forEach(e=>{ cta.style.animationPlayState=e.isIntersecting?'running':'paused'; }),{threshold:.5}); o.observe(cta); }

  const form=document.querySelector('.signup-form');
  if(form){ form.addEventListener('submit',(e)=>{ e.preventDefault(); const em=form.querySelector('input[type="email"]')?.value?.trim(); if(!em) return; alert('Thank you for joining the movement!'); }); }
});
