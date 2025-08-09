// --- Global Utilities for selecting DOM elements ---
const getElement = (selector) => document.querySelector(selector);
const getAllElements = (selector) => document.querySelectorAll(selector);

// --- All core site functionality is wrapped in a single event listener ---
document.addEventListener('DOMContentLoaded', () => {

  // === Core Site Animation & UX Logic ===

  // --- 1. Intro Section Logic (RISE FROM MADNESS) ---
  const introSection = getElement('.intro');
  const shopCtaButton = getElement('.cta-button.pulse-effect');
  const introTextContent = getElement('.intro-content');

  // Set initial state for animations
  if (introTextContent) {
    introTextContent.style.opacity = 0;
    introTextContent.style.transform = 'translateY(20px)';
  }

  // Hide the intro screen after a set time and trigger the hero CTA pulse
  setTimeout(() => {
    if (introSection) {
      introSection.style.opacity = '0';
      introSection.addEventListener('transitionend', () => {
        introSection.style.display = 'none';
        introSection.style.zIndex = -1; // Ensure it doesn't block clicks
        if (shopCtaButton) {
          shopCtaButton.style.animationPlayState = 'running';
        }
      }, { once: true });
    } else if (shopCtaButton) {
      // Fallback for browsers that don't render the intro correctly
      shopCtaButton.style.animationPlayState = 'running';
    }
  }, 5000); // Intro screen will fade out after 5 seconds

  // --- 2. Smooth Scroll for Navbar Links ---
  getAllElements('.nav-links a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = getElement(href);
        target?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });


  // === Dynamic Content & Interaction Logic ===

  // --- 3. Quote Ticker (Typed Effect with Hover/Click Control) ---
  const quotes = [
    "The pain didn’t kill me — it made me art.",
    "Madness is just misunderstood genius.",
    "You weren’t too much — they were too little.",
    "Sanity isn’t silence — it’s choosing your own noise.",
    "The meds didn’t fix me. I forged myself anyway.",
    "You felt everything because you’re real.",
    "Labels don’t fit gods in disguise.",
    "Healing isn’t soft. It’s war.",
    "Your breakdown was a broadcast.",
    "Not broken. Rewritten."
  ];

  const quoteTickerElement = getElement('#quoteTicker');
  let currentQuoteIndex = 0;
  let currentIndexInQuote = 0;
  let typingTimeout, deletingTimeout;
  let isPaused = false;
  let currentQuote = quotes[0];

  function typeQuote() {
    if (!quoteTickerElement || isPaused) return;
    if (currentIndexInQuote < currentQuote.length) {
      quoteTickerElement.textContent += currentQuote.charAt(currentIndexInQuote++);
      typingTimeout = setTimeout(typeQuote, 60);
    } else {
      typingTimeout = setTimeout(deleteQuote, 3000); // Pause before deleting
    }
  }

  function deleteQuote() {
    if (!quoteTickerElement || isPaused) return;
    if (quoteTickerElement.textContent.length > 0) {
      quoteTickerElement.textContent = quoteTickerElement.textContent.slice(0, -1);
      deletingTimeout = setTimeout(deleteQuote, 30);
    } else {
      currentIndexInQuote = 0;
      currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
      currentQuote = quotes[currentQuoteIndex];
      typingTimeout = setTimeout(typeQuote, 500);
    }
  }

  function startTickerIfIdle() {
    if (!quoteTickerElement) return;
    if (!quoteTickerElement.textContent) {
      currentQuote = quotes[currentQuoteIndex];
      typeQuote();
    }
  }

  if (quoteTickerElement) {
    quoteTickerElement.addEventListener('mouseenter', () => {
      isPaused = true;
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
      quoteTickerElement.style.borderRightColor = 'transparent';
    });
    quoteTickerElement.addEventListener('mouseleave', () => {
      isPaused = false;
      quoteTickerElement.style.borderRightColor = 'rgba(255,255,255,0.7)';
      if (currentIndexInQuote < currentQuote.length) typeQuote();
      else deletingTimeout = setTimeout(deleteQuote, 500);
    });
    quoteTickerElement.addEventListener('click', () => {
      isPaused = !isPaused;
      if (isPaused) {
        clearTimeout(typingTimeout);
        clearTimeout(deletingTimeout);
        quoteTickerElement.style.borderRightColor = 'transparent';
      } else {
        quoteTickerElement.style.borderRightColor = 'rgba(255,255,255,0.7)';
        if (currentIndexInQuote < currentQuote.length) typeQuote();
        else deletingTimeout = setTimeout(deleteQuote, 500);
      }
    });

    // Pause ticker if tab hidden (saves battery)
    document.addEventListener('visibilitychange', () => {
      isPaused = document.hidden;
      if (!isPaused) startTickerIfIdle();
    });

    startTickerIfIdle();
  }


  // --- 4. IntersectionObserver for Animations and Video Autoplay ---
  const feedItems = Array.from(getAllElements('.feed-item-placeholder'));
  const IO_SUPPORTED = 'IntersectionObserver' in window;

  function playIfVideo(el) {
    const v = el.querySelector?.('.feed-video');
    if (!v || v.dataset.loaded) return;
    v.muted = true;
    v.playsInline = true;
    v.load();
    v.dataset.loaded = "1";
    v.play().catch(() => {/* autoplay may be blocked; ignore */});
  }

  function pauseIfVideo(el) {
    const v = el.querySelector?.('.feed-video');
    if (v && !v.paused) v.pause();
  }

  if (IO_SUPPORTED && feedItems.length) {
    const feedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = entry.target;
        if (entry.isIntersecting) {
          item.style.animationPlayState = 'running';
          playIfVideo(item);
        } else {
          pauseIfVideo(item);
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    feedItems.forEach(item => {
      item.style.animationPlayState = 'paused';
      feedObserver.observe(item);
    });
  } else {
    // Fallback: just start animations/videos
    feedItems.forEach(item => {
      item.style.animationPlayState = 'running';
      playIfVideo(item);
    });
  }

  // --- 5. CTA Pulse via IntersectionObserver (Corrected) ---
  if (shopCtaButton && IO_SUPPORTED) {
    const shopCtaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        shopCtaButton.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0.5 });
    shopCtaObserver.observe(shopCtaButton);
  }


  // === Feature-Specific Logic ===

  // --- 6. Games Link Routing ---
  const gamesLink = getElement('#games-link');
  if (gamesLink) {
    gamesLink.addEventListener('click', (e) => {
      e.preventDefault();
      // TODO: This URL should point to your live, Vercel-hosted Games Zone page.
      window.location.href = 'https://www.pleadingsanity.co.uk/games';
    });
  }

  // --- 7. Sign-up Form (Backend Integration Placeholder) ---
  const signupForm = getElement('.signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = signupForm.querySelector('input[type="email"]');
      const email = emailInput?.value?.trim();
      if (!email) return;
      alert('Thank you for joining the movement! You will receive early access updates.');
      emailInput.value = '';
      // TODO: Integrate with Firebase Cloud Function for email capture
      // Example: fetch('/.netlify/functions/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    });
  }

  // --- 8. Tracksuit Unlock Logic (Backend Integration Placeholder) ---
  const unlockTracksuitButton = getElement('.unlock-tracksuit-btn');
  const tracksuitOverlay = getElement('.tracksuit-blur-overlay');
  if (unlockTracksuitButton && tracksuitOverlay) {
    unlockTracksuitButton.addEventListener('click', () => {
      // TODO: Here, you'd trigger your Firebase/Vercel Function call
      console.log("Tracksuit Unlock Attempted!");
      // Simulate successful backend unlock after a delay
      setTimeout(() => {
        tracksuitOverlay.classList.add('unlocked');
        unlockTracksuitButton.textContent = "Access Granted";
        unlockTracksuitButton.disabled = true;
        console.log("Tracksuit Unlocked Visually!");
      }, 1000);
    });
  }
});
    }

    // Function to trigger ticker if it's not already running
    function triggerQuoteTickerPulse() {
        if (quoteTickerElement && quoteTickerElement.textContent === '') { // Only start if empty
             currentQuoteDisplaying = quotes[currentQuoteIndex];
             typeQuote(currentQuoteDisplaying);
        }
    }

    // Pause on hover/tap
    if (quoteTickerElement) {
        quoteTickerElement.addEventListener('mouseenter', () => {
            isPausedByHover = true;
            clearTimeout(typingTimeout);
            clearTimeout(deletingTimeout);
            quoteTickerElement.style.borderRightColor = 'transparent'; // Hide caret when paused
        });
        quoteTickerElement.addEventListener('mouseleave', () => {
            isPausedByHover = false;
            quoteTickerElement.style.borderRightColor = 'rgba(255,255,255,0.7)'; // Show caret
            // Resume from current state
            if (currentIndexInQuote < currentQuoteDisplaying.length) {
                typeQuote(currentQuoteDisplaying.substring(currentIndexInQuote)); // Type remaining
            } else {
                setTimeout(deleteQuote, 500); // If at end of quote, start deleting
            }
        });
        // For mobile tap: a simple toggle
        quoteTickerElement.addEventListener('click', () => {
            isPausedByHover = !isPausedByHover;
            if (isPausedByHover) {
                clearTimeout(typingTimeout);
                clearTimeout(deletingTimeout);
                quoteTickerElement.style.borderRightColor = 'transparent';
            } else {
                quoteTickerElement.style.borderRightColor = 'rgba(255,255,255,0.7)';
                if (currentIndexInQuote < currentQuoteDisplaying.length) {
                    typeQuote(currentQuoteDisplaying.substring(currentIndexInQuote));
                } else {
                    setTimeout(deleteQuote, 500);
                }
            }
        });
    }

    // Initial trigger for the quote ticker
    triggerQuoteTickerPulse();


    // --- IntersectionObserver for Feed Items & Dynamic Animations ---
    const feedItems = getAllElements('.feed-item-placeholder');

    const feedObserverOptions = {
        root: null, // viewport
        rootMargin: '0px 0px -10% 0px', // Trigger when 10% from bottom of viewport
        threshold: 0.1 // Trigger when 10% of item is visible
    };

    const feedObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                item.style.animationPlayState = 'running'; // Play CSS animation (fadeInItem is on the element itself)

                // If it's a video, load and play
                const video = item.querySelector('.feed-video');
                if (video) {
                    video.load();
                    video.play().catch(error => console.log("Autoplay blocked:", error));
                }
                // Optional: stop observing once animated if it's a one-time animation
                // observer.unobserve(item);
            } else {
                 // Optional: Pause videos when they go out of view
                 const video = entry.target.querySelector('.feed-video');
                 if (video && !video.paused) {
                     video.pause();
                 }
            }
        });
    }, feedObserverOptions);

    feedItems.forEach(item => {
        item.style.animationPlayState = 'paused'; // Start CSS animation paused
        feedObserver.observe(item);
    });


    // CTA Pulse via IntersectionObserver
    const shopCtaButton = getElement('.cta-button.pulse-effect');
    const shopCtaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (shopCtaButton) shopCtaButton.style.animationPlayState = 'running';
            } else {
                if (shopCtaButton) shopCtaButton.style.animationPlayState = 'paused';
            }
        });
    }, { threshold: 0.5 }); // Trigger when 50% of button is visible
    if (shopCtaButton) {
        shopCtaObserver.observe(shopCtaButton);
    }

    // --- Games Link Routing (Example, adjust to your actual games page URL) ---
    const gamesLink = getElement('#games-link');
    if (gamesLink) {
        gamesLink.addEventListener('click', function(e) {
            e.preventDefault();
            // This URL should point to your Vercel-hosted Games Zone page for now
            window.location.href = 'https://www.pleadingsanity.co.uk/games'; 
        });
    }

    // --- Sign-up Form Submission (Placeholder for Backend Integration) ---
    const signupForm = getElement('.signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = signupForm.querySelector('input[type="email"]');
            const email = emailInput.value;
            console.log(`Email submitted: ${email}. This would be sent to Firebase/Netlify Function.`);
            alert('Thank you for joining the movement! You will receive early access updates.');
            emailInput.value = ''; // Clear form
            // Here, integrate with Firebase Cloud Function for email capture
            // e.g., fetch('/api/signup', { method: 'POST', body: JSON.stringify({ email }) });
        });
    }
});
