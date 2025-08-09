// --- Global Utilities ---
const getElement = (selector) => document.querySelector(selector);
const getAllElements = (selector) => document.querySelectorAll(selector);

// --- Intro Section Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const introSection = getElement('.intro');
    const introTextContent = getElement('.intro-content'); // Contains h1 and p
    const shopCtaButton = getElement('.cta-button.pulse-effect'); // The CTA button in hero section

    // Initial state setup for intro text for animation
    if (introTextContent) {
        introTextContent.style.opacity = 0; // Ensure it starts invisible
        introTextContent.style.transform = 'translateY(20px)';
        // CSS animations handle the actual reveal
    }

    // Hide intro screen after its animation completes and trigger subsequent animations
    // Adjust this timeout based on your desired intro animation duration + pause
    setTimeout(() => {
        if (introSection) {
            introSection.style.opacity = '0';
            introSection.addEventListener('transitionend', () => {
                introSection.style.display = 'none';
                introSection.style.zIndex = -1; // Ensure it doesn't block clicks
                // Trigger pulse animation after intro hides
                if (shopCtaButton) { // Ensure button exists before trying to access it
                    shopCtaButton.style.animationPlayState = 'running';
                }
            }, { once: true });
        } else {
            // Fallback if intro doesn't exist/hide, ensure other animations still play
            if (shopCtaButton) { // Ensure button exists before trying to access it
                shopCtaButton.style.animationPlayState = 'running';
            }
        }
    }, 5000); // 5 seconds (introTextReveal + fadeIn delays + some pause)

    // Smooth scroll for nav links
    getAllElements('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1); // Get ID without '#'
            const targetElement = getElement(`#${targetId}`);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Quote Ticker Functionality ---
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
    let currentQuoteIndex = 0;
    const quoteTickerElement = getElement('#quoteTicker');
    let typingTimeout;
    let deletingTimeout;
    let currentIndexInQuote = 0;
    let isPausedByHover = false;
    let currentQuoteDisplaying = ''; // Store the current quote being displayed

    function typeQuote(quoteToType) {
        if (isPausedByHover) return;

        if (currentIndexInQuote < quoteToType.length) {
            quoteTickerElement.textContent += quoteToType.charAt(currentIndexInQuote);
            currentIndexInQuote++;
            typingTimeout = setTimeout(() => typeQuote(quoteToType), 60); // Typing speed
        } else {
            setTimeout(deleteQuote, 3000); // Pause before deleting
        }
    }

    function deleteQuote() {
        if (isPausedByHover) return;

        if (quoteTickerElement.textContent.length > 0) {
            quoteTickerElement.textContent = quoteTickerElement.textContent.slice(0, -1);
            deletingTimeout = setTimeout(deleteQuote, 30); // Deleting speed
        } else {
            currentIndexInQuote = 0;
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            currentQuoteDisplaying = quotes[currentQuoteIndex]; // Get next quote
            setTimeout(() => typeQuote(currentQuoteDisplaying), 500); // Pause before typing next
        }
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
