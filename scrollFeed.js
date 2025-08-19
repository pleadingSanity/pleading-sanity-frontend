Placeholder content for scrollFeed.js/* Pleading Sanity — scrollFeed.js
 * Infinite, lazy feed for Sanity Hub.
 * - Loads from content_feed.json or content.json (whichever exists)
 * - Supports YouTube + TikTok embeds (real player if possible)
 * - Falls back to a clean link card with thumb
 * - Infinite scroll via IntersectionObserver
 * - Defensive against bad/missing data
 */

(function () {
  const FEED_IDS = ["feed", "grid"]; // try #feed first, fallback to #grid if present
  const FEED_URLS = ["content_feed.json", "content.json"]; // try these in order
  const PAGE_SIZE = 6; // how many posts to append per “page”
  const SKELETON_COUNT = 3;

  let allPosts = [];
  let page = 0;
  let feedEl;
  let sentinel;
  let observer;

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);

  function pickFeedEl() {
    for (const id of FEED_IDS) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    // last resort: create one
    const made = document.createElement("main");
    made.id = "feed";
    document.body.appendChild(made);
    return made;
  }

  async function fetchFirstAvailable(urls) {
    for (const u of urls) {
      try {
        const res = await fetch(u, { cache: "no-store" });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        // try next
      }
    }
    throw new Error("No feed JSON found");
  }

  function uniqueByUrl(items) {
    const seen = new Set();
    return items.filter((it) => {
      const key = (it.url || it.embed || it.title || "").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ---- parsers for embeds ----
  function ytIdFromUrl(u) {
    if (!u) return null;
    try {
      const url = new URL(u);
      if (url.hostname.includes("youtube.com")) {
        if (url.searchParams.get("v")) return url.searchParams.get("v");
        // youtu.be share link as path? handled below
      }
      if (url.hostname === "youtu.be") {
        return url.pathname.replace("/", "");
      }
    } catch (_) {}
    const m = String(u).match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    return m ? m[1] : null;
  }

  function ttIdFromUrl(u) {
    const m = String(u).match(/video\/(\d{8,})/);
    return m ? m[1] : null;
  }

  function buildYouTubeEmbed(id) {
    const src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
    return `<iframe class="ps-embed" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen src="${src}"></iframe>`;
  }

  function buildTikTokEmbed(id) {
    const src = `https://www.tiktok.com/embed/v2/${id}`;
    return `<iframe class="ps-embed" loading="lazy" allow="encrypted-media; autoplay; clipboard-write; fullscreen; picture-in-picture" allowfullscreen src="${src}"></iframe>`;
  }

  function cardHTML({ title = "", url = "", thumb = "", embedHTML = "" }) {
    // if we have embed, show player + meta; else show image link card
    if (embedHTML) {
      return `
      <article class="ps-post">
        <div class="ps-media">${embedHTML}</div>
        <div class="ps-meta">
          <div class="ps-title">${escapeHTML(title)}</div>
          <div class="ps-actions"><a href="${url}" target="_blank" rel="noopener">Open</a></div>
        </div>
      </article>`;
    }
    return `
    <article class="ps-post">
      ${thumb ? `<img class="ps-img" loading="lazy" src="${thumb}" alt="${escapeHTML(title)}"/>` : ""}
      <div class="ps-meta">
        <div class="ps-title">${escapeHTML(title)}</div>
        <div class="ps-actions"><a href="${url}" target="_blank" rel="noopener">Open</a></div>
      </div>
    </article>`;
  }

  function skeletonHTML() {
    return `
    <article class="ps-post ps-skeleton">
      <div class="ps-media"></div>
      <div class="ps-meta">
        <div class="ps-title"></div>
        <div class="ps-actions"></div>
      </div>
    </article>`;
  }

  function escapeHTML(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  // ---------- render ----------
  function appendSkeletons(n = SKELETON_COUNT) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = skeletonHTML();
      frag.appendChild(wrapper.firstElementChild);
    }
    feedEl.appendChild(frag);
  }

  function removeSkeletons() {
    feedEl.querySelectorAll(".ps-skeleton").forEach((el) => el.remove());
  }

  function appendPage() {
    const start = page * PAGE_SIZE;
    const slice = allPosts.slice(start, start + PAGE_SIZE);
    if (!slice.length) {
      // no more pages — stop observing
      if (observer && sentinel) observer.unobserve(sentinel);
      sentinel?.remove();
      return;
    }

    const frag = document.createDocumentFragment();
    for (const post of slice) {
      const wrap = document.createElement("div");
      wrap.innerHTML = cardHTML(post);
      frag.appendChild(wrap.firstElementChild);
    }
    feedEl.appendChild(frag);
    page++;
  }

  // ---------- transform JSON to post objects ----------
  function normalizeItems(json) {
    // primary: json.items = [{title,url,thumb,embed?}]
    let items = Array.isArray(json?.items) ? json.items : [];

    // optional legacy: support {youtube: {keywords:[]}} etc. -> as link cards to searches
    // (kept minimal; real embeds need real video URLs)
    if (!items.length && json?.youtube?.keywords?.length) {
      const kws = json.youtube.keywords.slice(0, 8);
      items = kws.map((k) => ({
        title: `YouTube: ${k}`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(k)}`,
        thumb: "",
      }));
    }

    // Map to enriched objects with embed where possible
    return items.map((it) => {
      const title = it.title || "";
      const url = it.url || "";
      const thumb = it.thumb || "";

      let embedHTML = "";

      const yid = ytIdFromUrl(url);
      if (yid) embedHTML = buildYouTubeEmbed(yid);

      const tid = !embedHTML ? ttIdFromUrl(url) : null;
      if (tid) embedHTML = buildTikTokEmbed(tid);

      // if item.embed is provided directly, trust it
      if (!embedHTML && it.embed) embedHTML = it.embed;

      return { title, url, thumb, embedHTML };
    });
  }

  // ---------- init ----------
  async function init() {
    feedEl = pickFeedEl();
    decorateStyles();

    appendSkeletons();

    try {
      const json = await fetchFirstAvailable(FEED_URLS);
      allPosts = uniqueByUrl(normalizeItems(json));
    } catch (e) {
      removeSkeletons();
      feedEl.innerHTML = `
        <article class="ps-post">
          <div class="ps-meta">
            <div class="ps-title">Feed not available</div>
            <div class="ps-actions">
              Add <code>content.json</code> or <code>content_feed.json</code> at repo root.
            </div>
          </div>
        </article>`;
      return;
    }

    removeSkeletons();
    appendPage(); // first page

    // sentinel for infinite scroll
    sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.height = "1px";
    feedEl.appendChild(sentinel);

    observer = new IntersectionObserver((entries) => {
      const onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) {
        appendPage();
      }
    });
    observer.observe(sentinel);
  }

  // Inject minimal styles if host page doesn’t have them
  function decorateStyles() {
    if ($("#ps-scrollfeed-styles")) return;
    const css = `
      :root{
        --ps-bg:#0b0b0d;--ps-fg:#e9e9f2;--ps-muted:#a7a7bb;
        --ps-card:#141421;--ps-ring:#222238
      }
      #${(pickFeedEl().id)}{
        display:flex; flex-direction:column; gap:18px;
        padding:20px; max-width:720px; margin:0 auto;
      }
      .ps-post{
        background:var(--ps-card); border:1px solid var(--ps-ring);
        border-radius:12px; overflow:hidden;
        box-shadow:0 2px 6px rgba(0,0,0,.35);
      }
      .ps-media{ position:relative; }
      .ps-embed, .ps-img{
        width:100%; display:block; aspect-ratio:16/9; border:0;
        background:#000;
      }
      .ps-meta{ padding:12px; }
      .ps-title{ font-weight:700; margin:0 0 6px; color:var(--ps-fg); }
      .ps-actions a{ color:var(--ps-fg); opacity:.8; text-decoration:none }
      .ps-actions a:hover{ opacity:1 }
      .ps-skeleton .ps-media{ background:#0f0f19; height:0; padding-top:56.25% }
      .ps-skeleton .ps-title{ height:16px; width:60%; background:#1e1e2d; border-radius:6px }
    `;
    const style = document.createElement("style");
    style.id = "ps-scrollfeed-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // auto-init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for manual re-init if needed
  window.PSScrollFeed = { reload: () => { page = 0; allPosts = []; init(); } };
})();
