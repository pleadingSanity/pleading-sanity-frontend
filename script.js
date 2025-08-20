/* Pleading Sanity — Unified Hub Script (best version)
   - Prefers window.PS_FEED (from content.feed.js) → YouTube search cards + TikTok
   - Fallback: Netlify function /.netlify/functions/fetch-videos (real video embeds)
   - Keeps your original hooks: #yt-feed, #yt-loader, #tt-feed, #ps-config
*/
(function () {
  // ----- Helpers -----
  const $ = (s, r = document) => r.querySelector(s);
  const el = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content.firstElementChild; };
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  // Year in footer (if present)
  const y = $('#y'); if (y) y.textContent = new Date().getFullYear();

  // DOM targets (keep your old IDs)
  const ytFeed   = $('#yt-feed');
  const ytLoader = $('#yt-loader') || (() => { const n = el(`<div id="yt-loader" class="loader">Loading…</div>`); (ytFeed||document.body).after(n); return n; })();
  const ttFeed   = $('#tt-feed');

  // Config from <script id="ps-config"> … or window.PS_FEED
  const inlineCfg = (() => { try { return JSON.parse($('#ps-config')?.textContent || '{}'); } catch { return {}; }})();
  const FEED = window.PS_FEED || {};
  const pageSize = FEED.meta?.pageSize || inlineCfg.pageSize || 12;
  const region   = FEED.meta?.region   || inlineCfg.region   || 'GB';

  // State
  let mode = 'auto';                 // 'ps-feed' (search cards) | 'netlify' (live videos)
  let loading = false, exhausted = false;
  let nextPageToken = '';            // netlify pagination
  const seen = new Set();            // de-dupe (ids/urls)

  // ---------- Decide mode ----------
  const hasPSKeywords =
    Array.isArray(FEED.youtube?.categories) &&
    FEED.youtube.categories.some(c => Array.isArray(c.keywords) && c.keywords.length);

  if (hasPSKeywords) {
    mode = 'ps-feed'; // no API: build YouTube SEARCH cards from keywords
  } else {
    mode = 'netlify'; // live: call Netlify function for video list
  }

  // ---------- Renderers ----------
  function skeleton(n=6){
    const frag = document.createDocumentFragment();
    for (let i=0;i<n;i++){
      frag.appendChild(el(`
        <article class="card skel">
          <div class="card__media skeleton"></div>
          <div class="card__body">
            <div class="skeleton" style="height:18px;width:70%;border-radius:6px;margin:10px 0"></div>
            <div class="skeleton" style="height:12px;width:45%;border-radius:6px"></div>
          </div>
        </article>`));
    }
    ytFeed.appendChild(frag);
  }
  function clearSkeleton(){ ytFeed?.querySelectorAll('.skel')?.forEach(n=>n.remove()); }

  function appendCards(items){
    if (!items || !items.length) return;
    const frag = document.createDocumentFragment();
    items.forEach(it => {
      // de-dupe by id/url
      const key = it.id || it.url || it.title;
      if (!key || seen.has(key)) return; seen.add(key);

      let card;
      if (it.kind === 'youtube-search') {
        card = el(`
          <article class="card">
            <div class="card__media">
              <a href="${esc(it.url)}" target="_blank" rel="noopener" aria-label="Open YouTube results for ${esc(it.title)}">
                <img loading="lazy" src="${esc(it.thumb)}" alt="${esc(it.title)}">
              </a>
            </div>
            <div class="card__body">
              <h3 class="card__title">${esc(it.title)}</h3>
              <div class="card__meta"><span>#YouTube</span><span>#${esc(it.cat||'')}</span></div>
              <div class="muted"><a href="${esc(it.url)}" target="_blank" rel="noopener">Open results</a></div>
            </div>
          </article>`);
      } else if (it.kind === 'youtube-embed') {
        card = el(`
          <article class="card">
            <div class="card__media">
              <iframe class="embed" title="${esc(it.title||'Video')}"
                src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(it.id)}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </div>
            <div class="card__body">
              <h3 class="card__title">${esc(it.title||'')}</h3>
              <div class="card__meta">${it.author?`<span>${esc(it.author)}</span>`:''}</div>
            </div>
          </article>`);
      } else if (it.kind === 'tiktok') {
        card = el(`
          <article class="card">
            <div class="card__media">
              <blockquote class="tiktok-embed" cite="${esc(it.url)}" data-video-id="">
                <a href="${esc(it.url)}" target="_blank" rel="noopener">Open TikTok</a>
              </blockquote>
            </div>
            <div class="card__body">
              <h3 class="card__title">${esc(it.title||'TikTok')}</h3>
              <div class="card__meta"><span>#TikTok</span></div>
            </div>
          </article>`);
      } else {
        // generic link/image
        card = el(`
          <article class="card">
            <div class="card__media">
              ${it.thumb ? `<a href="${esc(it.url||'#')}" ${/^https?:\/\//.test(it.url||'')?'target="_blank" rel="noopener"':''}>
                <img loading="lazy" src="${esc(it.thumb)}" alt="${esc(it.title||'')}">
              </a>` : `<a href="${esc(it.url||'#')}" target="_blank" rel="noopener" class="muted">Open</a>`}
            </div>
            <div class="card__body">
              <h3 class="card__title">${esc(it.title||'')}</h3>
              <div class="card__meta">${(it.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join(' ')}</div>
            </div>
          </article>`);
      }
      frag.appendChild(card);
    });
    ytFeed.appendChild(frag);

    // load TikTok script once if needed
    if (items.some(i => i.kind==='tiktok') && !document.querySelector('script[src*="tiktok.com/embed.js"]')) {
      const s = document.createElement('script'); s.src='https://www.tiktok.com/embed.js'; s.async=true; document.body.appendChild(s);
    }
  }

  function endOfFeed(msg='Up to date.'){ exhausted = true; ytLoader.textContent = msg; }

  // ---------- MODE A: window.PS_FEED (no API) ----------
  function buildItemsFromPS(){
    const out = [];
    // Featured (optional)
    (FEED.featured || []).forEach(f => out.push({
      id: f.id || f.url || f.title,
      kind: f.type === 'youtube' ? 'youtube-search' : (f.type || 'image'),
      title: f.title || '',
      url: f.url || '',
      thumb: f.thumb || '',
      tags: f.tags || []
    }));
    // YouTube search cards per keyword
    (FEED.youtube?.categories || []).forEach(cat=>{
      (cat.keywords||[]).forEach(q=>{
        out.push({
          id: `ytsearch_${q}`,
          kind: 'youtube-search',
          title: q,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
          thumb: `https://dummyimage.com/1280x720/141421/7cf2d8&text=${encodeURIComponent(q)}`,
          cat: cat.name,
          tags: [cat.name, 'YouTube']
        });
      });
    });
    // TikTok curated
    (FEED.tiktok?.urls || []).forEach(u=>{
      out.push({ id: `tt_${u}`, kind:'tiktok', title:'TikTok', url:u });
    });
    return out;
  }

  // paginate PS items client-side
  let psCursor = 0;
  const psItems = mode==='ps-feed' ? buildItemsFromPS() : [];

  async function loadPSBatch() {
    const slice = psItems.slice(psCursor, psCursor + pageSize);
    psCursor += slice.length;
    appendCards(slice);
    if (psCursor >= psItems.length) endOfFeed('You’re all caught up ✨');
  }

  // ---------- MODE B: Netlify Function (live video list) ----------
  async function loadNetlifyPage() {
    const url = new URL('/.netlify/functions/fetch-videos', location.origin);
    url.searchParams.set('region', region);
    url.searchParams.set('topics', (inlineCfg.topics || ['mental health']).join(','));
    url.searchParams.set('pageSize', String(pageSize));
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('YouTube fetch failed');
    const data = await res.json();

    const mapped = (data.items || []).map(v => ({
      id: v.id, kind: 'youtube-embed', title: v.title || '', author: v.channelTitle || ''
    }));
    appendCards(mapped);

    nextPageToken = data.nextPageToken || '';
    if (!mapped.length || !nextPageToken) endOfFeed('Up to date.');
  }

  function handleError(){
    ytLoader.textContent = 'Live feed unavailable. Showing fallback.';
    if (!ytFeed.hasChildNodes()){
      ['kXYiU_JCYtU','3YxaaGgTQYM','ktvTqknDobU'].forEach(id=>{
        appendCards([{id, kind:'youtube-embed', title:''}]);
      });
    }
    exhausted = true;
  }

  // ---------- Infinite Scroll ----------
  async function loadMore(){
    if (loading || exhausted) return;
    loading = true; ytLoader.textContent = 'Loading…'; skeleton(6);
    try {
      if (mode === 'ps-feed') {
        await loadPSBatch();
      } else {
        await loadNetlifyPage();
      }
    } catch (e) {
      console.warn(e); handleError();
    } finally {
      clearSkeleton();
      loading = false;
      if (!exhausted) ytLoader.textContent = 'Scroll for more…';
    }
  }

  if ('IntersectionObserver' in window) {
    const sentinel = el(`<div style="height:1px"></div>`);
    ytLoader.after(sentinel);
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if (e.isIntersecting) loadMore(); });
    }, { rootMargin: '1200px 0px' });
    io.observe(sentinel);
  } else {
    // very old browsers
    loadMore();
  }

  // ---------- TikTok side rail (if you also have #tt-feed section like before) ----------
  function renderTikTokSide(){
    const urls = FEED.tiktok?.urls || inlineCfg.tiktok || [];
    if (!ttFeed || !urls.length) return;
    const frag = document.createDocumentFragment();
    urls.forEach(u=>{
      frag.appendChild(el(`
        <div class="card">
          <blockquote class="tiktok-embed" cite="${esc(u)}" data-video-id="">
            <a href="${esc(u)}" target="_blank" rel="noopener">TikTok</a>
          </blockquote>
        </div>`));
    });
    ttFeed.appendChild(frag);
    if (!document.querySelector('script[src*="tiktok.com/embed.js"]')){
      const s = document.createElement('script'); s.src='https://www.tiktok.com/embed.js'; s.async=true; document.body.appendChild(s);
    }
  }

  // Kickoff
  renderTikTokSide();
  loadMore(); // first batch
})();
