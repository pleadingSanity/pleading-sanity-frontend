// games.js – Pleading Sanity Mini Game Links

document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-list");

  const games = [
    {
      title: "🧠 Math Mission",
      description: "Boost your brainpower with fun math challenges!",
      url: "https://www.coolmathgames.com/1-math-lines",
    },
    {
      title: "🔤 Word Wizard",
      description: "Spell and learn with fast-paced word puzzles.",
      url: "https://www.abcya.com/games/alphabet_bubble",
    },
    {
      title: "🌈 Emotion Explorer",
      description: "Discover feelings and emotional awareness games.",
      url: "https://www.mentalup.co/games/emotion-matching",
    },
    {
      title: "🌬️ Breathe Buddy",
      description: "Follow along with breathing exercises to relax.",
      url: "https://www.youtube.com/watch?v=5TbUxGZtwGI",
    }
  ];

  if (gameContainer) {
    games.forEach(game => {
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
})
