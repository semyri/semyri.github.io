// Elements
const playerNameInput = document.getElementById('player-name');
const addPlayerButton = document.getElementById('add-player');
const playerList = document.getElementById('player-list');
const startGameButton = document.getElementById('start-game');
const startScreen = document.querySelector('.start-screen');
const gameScreen = document.querySelector('.game-screen');
const holeNumberSpan = document.getElementById('hole-number');
const scoreInputArea = document.querySelector('.score-input-area');
const numberPad = document.querySelector('.number-pad');
const nextHoleButton = document.getElementById('next-hole');
const prevHoleButton = document.getElementById('prev-hole');
const viewScorecardButton = document.getElementById('view-scorecard');
const scorecardScreen = document.querySelector('.scorecard-screen');
const scorecardTable = document.getElementById('scorecard-table');
const backToGameButton = document.getElementById('back-to-game');
const totalScoresDiv = document.getElementById('total-scores');
const newRoundButton = document.getElementById('new-round'); // Get the new button element

// Variables
let players = [];
let currentHole = 1;
let scores = {}; // { playerName: { hole1: score, hole2: score, ... } }
let selectedPlayerScoreElement = null; // Keep track of the currently selected score element

// Functions

// Add Player
function addPlayer() {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        players.push(playerName);
        scores[playerName] = {};
        // Initialize all scores to 3 for each player
        for (let i = 1; i <= 18; i++) {
            scores[playerName][i] = 3;
        }
        renderPlayerList();
        playerNameInput.value = '';

        // Enable Start Game button if at least one player is added
        startGameButton.disabled = players.length === 0;
    }
}

// Render Player List
function renderPlayerList() {
    playerList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${player}</span>
            <button class="remove-player">X</button>
        `;
        li.querySelector('.remove-player').addEventListener('click', () => {
            removePlayer(player);
        });
        playerList.appendChild(li);
    });
}

// Remove Player
function removePlayer(playerName) {
    players = players.filter(p => p !== playerName);
    delete scores[playerName];
    renderPlayerList();
    startGameButton.disabled = players.length === 0;
}

// Start Game (and Load from Local Storage)
function startGame() {
    loadGameData(); // Load data from local storage

    // Update UI elements based on loaded data
    holeNumberSpan.textContent = currentHole;
    createScoreInputs();
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    prevHoleButton.disabled = currentHole === 1;
    updateTotalScores(); // Update individual player scores

    // Enable Start Game button if players are found, disable New Round if no players are found
    startGameButton.disabled = players.length === 0;
    newRoundButton.disabled = players.length === 0;
}

// Create Score Inputs
function createScoreInputs() {
    scoreInputArea.innerHTML = '';
    players.forEach(player => {
        const playerScoreDiv = document.createElement('div');
        playerScoreDiv.classList.add('player-score');
        playerScoreDiv.innerHTML = `
            <span class="player-name">${player}</span>
            <div class="score-controls">
                <button class="decrement">-</button>
                <span class="score">${scores[player][currentHole] || 3}</span>
                <button class="increment">+</button>
            </div>
        `;

        const scoreElement = playerScoreDiv.querySelector('.score');
        playerScoreDiv.querySelector('.decrement').addEventListener('click', () => {
            updateScore(player, -1);
            scoreElement.textContent = scores[player][currentHole];
            updateTotalScores();
        });
        playerScoreDiv.querySelector('.increment').addEventListener('click', () => {
            updateScore(player, 1);
            scoreElement.textContent = scores[player][currentHole];
            updateTotalScores();
        });

        // Show number pad on score click/tap
        scoreElement.addEventListener('click', () => {
            selectedPlayerScoreElement = scoreElement;
            showNumberPad(player);
        });

        scoreInputArea.appendChild(playerScoreDiv);
    });
}

// Update Score
function updateScore(player, change) {
    if (!scores[player][currentHole]) {
        scores[player][currentHole] = 3; // Default to 3 if no score yet
    }
    scores[player][currentHole] += change;

    // Keep score non-negative
    if (scores[player][currentHole] < 0) {
        scores[player][currentHole] = 0;
    }

    saveGameData(); // Save to local storage after each score update
}

// Show Number Pad
function showNumberPad(player) {
    numberPad.innerHTML = ''; // Clear previous buttons

    // Create number buttons
    for (let i = 1; i <= 9; i++) {
        const button = document.createElement('button');
        button.dataset.value = i;
        button.textContent = i;
        button.addEventListener('click', () => {
            updateScoreFromNumberPad(player, i);
        });
        numberPad.appendChild(button);
    }

    // Add Clear and Done buttons
    const clearButton = document.createElement('button');
    clearButton.dataset.value = 'clear';
    clearButton.textContent = 'C';
    clearButton.addEventListener('click', () => {
        updateScoreFromNumberPad(player, 0); // Set score to 0
    });
    numberPad.appendChild(clearButton);

    const zeroButton = document.createElement('button');
    zeroButton.dataset.value = '0';
    zeroButton.textContent = '0';
    zeroButton.addEventListener('click', () => {
        updateScoreFromNumberPad(player, 0);
    });
    numberPad.appendChild(zeroButton);

    const doneButton = document.createElement('button');
    doneButton.dataset.value = 'done';
    doneButton.textContent = 'Done';
    doneButton.addEventListener('click', () => {
        numberPad.classList.add('hidden');
    });
    numberPad.appendChild(doneButton);

    numberPad.classList.remove('hidden');
}

// Update Score from Number Pad
function updateScoreFromNumberPad(player, value) {
    scores[player][currentHole] = value;
    selectedPlayerScoreElement.textContent = value;
    updateTotalScores();
    saveGameData(); // Save to local storage after score update
}

// Next Hole
function nextHole() {
    if (currentHole < 18) {
        currentHole++;
        holeNumberSpan.textContent = currentHole;
        createScoreInputs();
        prevHoleButton.disabled = false;
        saveGameData(); // Save to local storage when moving to the next hole
    } else {
        // Handle end of round (maybe show a message or automatically go to scorecard)
    }
}

// Previous Hole
function previousHole() {
    if (currentHole > 1) {
        currentHole--;
        holeNumberSpan.textContent = currentHole;
        createScoreInputs();
        prevHoleButton.disabled = currentHole === 1;
        saveGameData(); // Save to local storage when moving to the previous hole
    }
}

// View Scorecard
function viewScorecard() {
    renderScorecard();
    gameScreen.classList.add('hidden');
    scorecardScreen.classList.remove('hidden');
}

// Render Scorecard
function renderScorecard() {
    scorecardTable.innerHTML = '';

    // Header Row
    const headerRow = scorecardTable.insertRow();
    const playerNameHeader = document.createElement('th');
    playerNameHeader.textContent = 'Player';
    headerRow.appendChild(playerNameHeader);
    for (let i = 1; i <= 18; i++) {
        const holeHeader = document.createElement('th');
        holeHeader.textContent = `Hole ${i}`;
        headerRow.appendChild(holeHeader);
    }
    const totalHeader = document.createElement('th');
    totalHeader.textContent = 'Total';
    headerRow.appendChild(totalHeader);

    // Player Rows
    players.forEach(player => {
        const playerRow = scorecardTable.insertRow();
        const playerNameCell = playerRow.insertCell();
        playerNameCell.textContent = player;

        let playerTotal = 0;
        for (let i = 1; i <= 18; i++) {
            const score = scores[player][i] || 0;
            const scoreCell = playerRow.insertCell();
            scoreCell.textContent = score;
            playerTotal += score;
        }
        const totalCell = playerRow.insertCell();
        totalCell.textContent = playerTotal;
    });
}

// Back to Game
function backToGame() {
    scorecardScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
}

// Update Total Scores (for top-right display)
function updateTotalScores() {
    totalScoresDiv.innerHTML = ''; // Clear previous scores

    players.forEach(player => {
        let playerTotal = 0;
        for (let i = 1; i <= 18; i++) {
            playerTotal += (scores[player][i] || 0) - 3; // Calculate relative to par
        }

        const playerTotalSpan = document.createElement('span');
        playerTotalSpan.textContent = `${player}: ${playerTotal >= 0 ? '+' + playerTotal : playerTotal}`;
        totalScoresDiv.appendChild(playerTotalSpan);
    });
}

// Local Storage Functions
function saveGameData() {
    const gameData = {
        players: players,
        currentHole: currentHole,
        scores: scores
    };
    localStorage.setItem('discGolfGame', JSON.stringify(gameData));
}

function loadGameData() {
    const gameDataString = localStorage.getItem('discGolfGame');
    if (gameDataString) {
        const gameData = JSON.parse(gameDataString);
        players = gameData.players;
        currentHole = gameData.currentHole;
        scores = gameData.scores;
    }
}

// Start New Round
function startNewRound() {
    // Clear game data
    players = [];
    currentHole = 1;
    scores = {};

    // Clear local storage
    localStorage.removeItem('discGolfGame');

    // Reset UI elements
    playerNameInput.value = '';
    renderPlayerList();
    holeNumberSpan.textContent = currentHole;
    updateTotalScores();
    createScoreInputs();

    // Hide game screen and show start screen
    gameScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startGameButton.disabled = true; // Disable Start Game button since there are no players
    newRoundButton.disabled = false; // Enable New Round button
}

// Event Listeners
addPlayerButton.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        addPlayer();
    }
});
startGameButton.addEventListener('click', startGame);
nextHoleButton.addEventListener('click', nextHole);
prevHoleButton.addEventListener('click', previousHole);
viewScorecardButton.addEventListener('click', viewScorecard);
backToGameButton.addEventListener('click', backToGame);
newRoundButton.addEventListener('click', startNewRound);