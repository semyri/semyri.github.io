const NUM_HOLES = 18;
let players = [];
let scores = [];
let currentHole = 1;
let roundStarted = false;

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    updateDisplay();

    document.getElementById('addPlayerButton').addEventListener('click', addPlayer);
    document.getElementById('startRoundButton').addEventListener('click', startRound);
    document.getElementById('newRoundButton').addEventListener('click', newRound);
});

function loadFromLocalStorage() {
    try {
        const storedPlayers = localStorage.getItem('players');
        const storedScores = localStorage.getItem('scores');
        const storedCurrentHole = localStorage.getItem('currentHole');
        if (storedPlayers) {
            players = JSON.parse(storedPlayers);
            scores = JSON.parse(storedScores);
            currentHole = parseInt(storedCurrentHole, 10);
            roundStarted = true;
        }
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('players', JSON.stringify(players));
    localStorage.setItem('scores', JSON.stringify(scores));
    localStorage.setItem('currentHole', currentHole);
}

function addPlayer() {
    const playerName = document.getElementById('player-name').value.trim();
    if (playerName.length > 0) {
        players.push(playerName);
        scores.push(Array(NUM_HOLES).fill(0)); // Initialize scores for new player
        document.getElementById('player-name').value = '';
        saveToLocalStorage();
        updateDisplay();
    }
}

function updatePlayerList() {
    const playerList = document.getElementById('player-list');
    const colors = ['red', 'orange', 'green', 'blue', 'purple', 'brown', 'pink', 'gray', 'olive', 'teal', 'cyan', 'magenta'];
    playerList.innerHTML = players.map((player, index) => {
        const totalScore = scores[index].reduce((sum, score) => sum + score, 0);
        const color = colors[index % colors.length];
        return `<li style="color: ${color};">${player} - Total: ${totalScore}</li>`;
    }).join('');
}

function updateScoreTable() {
    const scoreTable = document.getElementById('score-table');
    let tableHTML = `<tr><th>Hole</th>${players.map(p => `<th>${p}</th>`).join('')}</tr>`;

    for (let i = 0; i < NUM_HOLES; i++) {
        tableHTML += `<tr><td>${i + 1}</td>${scores.map((s, index) => `<td><input type="number" data-player="${index}" data-hole="${i}" value="${s[i]}" inputmode="numeric"></td>`).join('')}</tr>`;
    }
    scoreTable.innerHTML = tableHTML;
    scoreTable.addEventListener('input', handleScoreChange);
}

function handleScoreChange(event) {
    const input = event.target;
    if (input.type !== 'number') return; //only process number inputs

    const playerIndex = parseInt(input.dataset.player, 10);
    const holeIndex = parseInt(input.dataset.hole, 10);
    let newScore = input.value;

    if (isNaN(newScore)) {
        alert("Please enter a valid number.");
        input.value = scores[playerIndex][holeIndex]; //reset to previous value
        return;
    } else {
        newScore = parseInt(newScore, 10);
    }

    scores[playerIndex][holeIndex] = newScore;
    saveToLocalStorage();
    updateDisplay();
}

function updateSummaryTable() {
    const summaryContent = document.getElementById('summary-content');
    if (roundStarted) {
        const totalScores = scores.map(playerScores => playerScores.reduce((a, b) => a + b, 0));
        summaryContent.innerHTML = players.map((player, index) => `${player}: ${totalScores[index]}`).join(' | ');
        summaryContent.style.display = 'block';
    } else {
        summaryContent.style.display = 'none';
    }
}

function updateDisplay() {
    const playerEntry = document.getElementById('player-entry');
    playerEntry.style.display = roundStarted ? 'none' : 'block';
    const scorecard = document.getElementById('scorecard');
    scorecard.style.display = roundStarted ? 'block' : 'none';
    const roundSummary = document.getElementById('round-summary');
    roundSummary.style.display = roundStarted ? 'block' : 'none';
    const newRoundButtonContainer = document.getElementById('new-round-button-container');
    newRoundButtonContainer.style.display = roundStarted ? 'block' : 'none';

    updatePlayerList();
    updateScoreTable();
    updateSummaryTable();
}

function newRound() {
    if (confirm("Are you sure you want to start a new round? This will erase current data.")) {
        localStorage.removeItem('players');
        localStorage.removeItem('scores');
        localStorage.removeItem('currentHole');
        players = [];
        scores = [];
        currentHole = 1;
        roundStarted = false;
        updateDisplay();
    }
}

function startRound() {
    if (players.length >= 1 && !roundStarted) {
        roundStarted = true;
        updateDisplay();
        saveToLocalStorage();
    } else if (players.length < 1) {
        alert("Please enter at least one player.");
    }
}