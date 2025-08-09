// ai-control.js — tiny hook layer so "Arron" and other AIs can drive updates safely.
// This file exposes window.PS API with guarded entry points that can be called by
// Netlify Functions, GitHub Actions, or future browser-side agents.

(function(){
  const PS = (window.PS = window.PS || {});

  // Append feed items dynamically (videos or images)
  PS.addFeedItem = function addFeedItem(item){
    try{
      const grid = document.getElementById('ps-feed');
      if(!grid) return false;
      const card = document.createElement('article');
      card.className = 'feed-item-placeholder';
      const meta = document.createElement('div'); meta.className='meta';
      const left = document.createElement('span'); left.textContent = item.title || 'Drop';
      const right = document.createElement('span'); right.textContent = '♥';
      meta.append(left,right);

      if(item.type==='video'){
        const v = document.createElement('video');
        v.className='feed-video'; v.muted=true; v.playsInline=true; v.preload='metadata';
        v.src=item.src; if(item.poster) v.poster=item.poster;
        card.appendChild(v);
      }else{
        const img = document.createElement('img');
        img.className='feed-image'; img.alt=item.alt||item.title||'Drop'; img.src=item.src;
        card.appendChild(img);
      }
      card.appendChild(meta);
      grid.prepend(card);
      return true;
    }catch(e){ console.warn('PS.addFeedItem failed', e); return false; }
  };

  // Replace ticker quotes
  PS.setQuotes = function setQuotes(list){
    try{
      if(!Array.isArray(list) || !list.length) return false;
      window.PS_QUOTES = list.slice(0,50);
      return true;
    }catch(e){ console.warn('PS.setQuotes failed', e); return false; }
  };

  // Simple heartbeat so automations can verify the page is live
  PS.heartbeat = ()=>({ ok:true, ts: Date.now(), ver: '1.0.0' });
})();