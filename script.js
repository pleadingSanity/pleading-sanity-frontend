document.addEventListener("DOMContentLoaded", () => {
  // Scroll Feed Content
  const feedContainer = document.getElementById("feed");
  if (feedContainer) {
    fetch("content.json")
      .then((response) => response.json())
      .then((data) => {
        data.content.forEach((item) => {
          const block = document.createElement("div");
          block.className = "scroll-block";

          if (item.type === "video") {
            block.innerHTML = `<video src="${item.url}" controls></video>`;
          } else if (item.type === "quote") {
            block.innerHTML = `<div class="quote">${item.text}</div>`;
          } else if (item.type === "image") {
            block.innerHTML = `<img src="${item.url}" alt="Feed Image">`;
          } else if (item.type === "story") {
            block.innerHTML = `<div class="story"><h4>${item.title}</h4><p>${item.text}</p></div>`;
          }

          feedContainer.appendChild(block);
        });
      });
  }

  // Email Sign-up
  const form = document.getElementById("email-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      alert("Thanks for signing up: " + email);
    });
  }

  // Quote Ticker
  const ticker = document.getElementById("quote-ticker");
  if (ticker) {
    const quotes = [
      "Madness made me magic.",
      "Still breathing? You're still undefeated.",
      "Pain is part of the process.",
      "The system fears the healed.",
      "P.S. — You're not broken. You're building."
    ];
    let i = 0;
    setInterval(() => {
      ticker.innerText = quotes[i];
      i = (i + 1) % quotes.length;
    }, 4000);
  }

  // Mind Mode
  const mindBtn = document.getElementById("mind-mode");
  const mindPanel = document.getElementById("mind-panel");
  if (mindBtn && mindPanel) {
    mindBtn.addEventListener("click", () => {
      mindPanel.classList.toggle("show");
    });
  }

  // Games Section (if not already handled in games.js)
  const gameContainer = document.getElementById("game-list");
  if (gameContainer) {
    const games = [
      {
        title: "🧠 Math Mission",
        description: "Boost your brainpower with fun math challenges!",
        url: "https://www.coolmathgames.com/1-math-lines"
      },
      {
        title: "🔤 Word Wizard",
        description: "Spell and learn with fast-paced word puzzles.",
        url: "https://www.abcya.com/games/alphabet_bubble"
      },
      {
        title: "🌈 Emotion Explorer",
        description: "Discover feelings and emotional awareness games.",
        url: "https://www.mentalup.co/games/emotion-matching"
      },
      {
        title: "💨 Breathe Buddy",
        description: "Follow along with breathing exercises to relax.",
        url: "https://www.youtube.com/watch?v=57blUxGZtWI"
      }
    ];
    games.forEach((game) => {
      const card = document.createElement("div");
      card.className = "game-card";
      card.innerHTML = `
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <a href="${game.url}" target="_blank">Play Now</a>
      `;
      gameContainer.appendChild(card);
    });
  }
});
