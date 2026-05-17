// Base placeholder logic
console.log("Temple Run Setup Initialized.");

// UI elements
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    // Start game logic here
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    // Restart game logic here
});
