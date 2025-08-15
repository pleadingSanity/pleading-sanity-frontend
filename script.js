(function(){
  // --- Initialization and configuration ---
  document.getElementById('y').textContent = new Date().getFullYear();
  const config = JSON.parse(document.getElementById('ps-config').textContent || '{}');
  const ytFeed = document.getElementById('yt-feed');
  const ytLoader = document.getElementById('yt-loader');

  // --- YouTube Feed Logic ---
  let nextPageToken = '';
  let loading = false;
  let exhausted = false;

  async function fetchAndRenderYouTubeVideos() {
    if (loading || exhausted) return;
    loading = true;
    ytLoader.textContent = 'Loading…';

    try {
      const url = new URL('/.netlify/functions/fetch-videos', location.origin);
      url.searchParams.set('region', config.region || 'GB');
      url.searchParams.set('topics', (config.topics || ['mental health']).join(','));
      url.searchParams.set('pageSize', config.pageSize || 12);
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch YouTube videos');
      const data = await response.json();

      renderYouTubeVideos(data.items);
      updatePagination(data.nextPageToken, data.items.length);

    } catch (e) {
      console.error('YouTube API error:', e);
      handleYouTubeError();
    } finally {
      loading = false;
    }
  }

  function renderYouTubeVideos(videos) {
    if (!videos || videos.length === 0) return;
    const fragment = document.createDocumentFragment();
    videos.forEach(video => {
      fragment.appendChild(createVideoCard(video));
    });
    ytFeed.appendChild(fragment);
  }

  function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <iframe class="embed" title="${video.title || 'Video'}"
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
      </iframe>
      <div class="small">${video.title || ''}</div>
    `;
    return card;
  }

  function updatePagination(newToken, itemCount) {
    nextPageToken = newToken || '';
    if (itemCount === 0 || !nextPageToken) {
      exhausted = true;
      ytLoader.textContent = 'Up to date.';
    } else {
      ytLoader.textContent = 'Scroll for more…';
    }
  }

  function handleYouTubeError() {
    ytLoader.textContent = 'Live feed unavailable. Showing fallback.';
    if (!ytFeed.hasChildNodes()) {
      ['kXYiU_JCYtU', '3YxaaGgTQYM', 'ktvTqknDobU'].forEach(id => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<iframe class="embed" src="https://www.youtube-nocookie.com/embed/${id}" allowfullscreen></iframe>`;
        ytFeed.appendChild(card);
      });
    }
    exhausted = true;
  }

  // --- Infinite Scroll Setup ---
  if ('IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    ytLoader.after(sentinel);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fetchAndRenderYouTubeVideos();
        }
      });
    }, { rootMargin: '1200px 0px 0px 0px' });
    observer.observe(sentinel);
  } else {
    // Fallback for older browsers
    fetchAndRenderYouTubeVideos();
  }

  // --- TikTok Renderer ---
  function renderTikTokFeed() {
    const ttFeed = document.getElementById('tt-feed');
    (config.tiktok || []).forEach(url => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<blockquote class="tiktok-embed" cite="${url}" data-video-id=""><a target="_blank" href="${url}">TikTok</a></blockquote>`;
      ttFeed.appendChild(card);
    });
    if ((config.tiktok || []).length) {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }

  // Initial loads
  fetchAndRenderYouTubeVideos();
  renderTikTokFeed();
})();
