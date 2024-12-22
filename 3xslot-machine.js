const reelContainer = document.getElementById('reels');
const message = document.getElementById('message');
const currentBetSpan = document.getElementById('current-bet');
const currentCreditsSpan = document.getElementById('current-credits');
const decreaseBetButton = document.getElementById('decreaseBet');
const increaseBetButton = document.getElementById('increaseBet');
const maxBetButton = document.getElementById('maxBet');

// Symbols (no wildcards)
const symbols = ['!', 'X', '+', '-', '/', '*'];

// Payout Table (only three of a kind wins)
const payoutTable = {
    '!': { 3: 2 },
    'X': { 3: 5 },
    '+': { 3: 8 },
    '-': { 3: 10 },
    '/': { 3: 15 },
    '*': { 3: 20 }
};

let spinning = false;
let credits = 100;
let betAmount = 1;
const maxBet = 50;

// Web Audio API for Sound Effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function createBeep(frequency, duration, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.start();
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01); // Fade in
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration - 0.01); // Fade out

    setTimeout(() => {
        oscillator.stop();
    }, duration * 1000);
}

function createReels() {
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            createReel(`reel${i}-${j}`);
        }
    }
}

function createReel(reelId) {
    const reel = document.getElementById(reelId);
    reel.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const symbolIndex = Math.floor(Math.random() * symbols.length);
        const symbolDiv = document.createElement('div');
        symbolDiv.classList.add('symbol');
        if (i === 0) symbolDiv.classList.add('old');
        if (i === 1) symbolDiv.classList.add('current');
        if (i === 2) symbolDiv.classList.add('new');
        // Set the symbol text
        symbolDiv.textContent = symbols[symbolIndex];
        reel.appendChild(symbolDiv);
    }
}

function spinReel(reel, isFinalSpin) {
    return new Promise(resolve => {
        const currentSymbolDiv = reel.querySelector('.current');
        const newSymbolDiv = reel.querySelector('.new');
        const nextSymbolIndex = Math.floor(Math.random() * symbols.length);
        const nextSymbol = symbols[nextSymbolIndex];

        const nextSymbolDiv = document.createElement('div');
        nextSymbolDiv.classList.add('symbol', 'new');
        nextSymbolDiv.textContent = nextSymbol;

        // Move symbols
        currentSymbolDiv.classList.remove('current');
        currentSymbolDiv.classList.add('old');
        newSymbolDiv.classList.remove('new');
        newSymbolDiv.classList.add('current');

        reel.appendChild(nextSymbolDiv);

        // Remove old symbol after transition completes
        setTimeout(() => {
            if (reel.contains(reel.querySelector('.old'))) {
                reel.removeChild(reel.querySelector('.old'));
            }
            if (isFinalSpin) {
                resolve(nextSymbol); // Resolve with the new symbol on final spin
            } else {
                resolve();
            }
        }, 100);
    });
}

async function spin() {
    if (spinning || credits < betAmount) return;

    spinning = true;
    credits -= betAmount;
    updateCreditsDisplay();
    message.textContent = 'Spinning...';
    message.className = '';

    for (let i = 0; i < 15; i++) {
        const freq = 200 + Math.random() * 400;
        createBeep(freq, 0.05, 'triangle');
        await new Promise(resolve => setTimeout(resolve, 30));
    }

    let spinCount = 0;
    const spinInterval = setInterval(() => {
        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 3; j++) {
                spinReel(document.getElementById(`reel${i}-${j}`));
            }
        }
        spinCount++;

        if (spinCount >= 15) {
            clearInterval(spinInterval);
            const finalSymbols = {};
            const reelPromises = [];
            for (let i = 1; i <= 3; i++) {
                for (let j = 1; j <= 3; j++) {
                    const reelId = `reel${i}-${j}`;
                    const reel = document.getElementById(reelId);
                    reelPromises.push(spinReel(reel, true).then(symbol => {
                        finalSymbols[reelId] = reel.querySelector('.current').textContent;
                    }));
                }
            }
            Promise.all(reelPromises).then(() => {
                setTimeout(() => {
                    checkWin(finalSymbols);
                    spinning = false;
                }, 600);
            });
        }
    }, 100);
}

function checkWin(finalSymbols) {
    let winAmount = 0;

    // Check horizontal wins
    for (let i = 1; i <= 3; i++) {
        const symbol1 = finalSymbols[`reel1-${i}`];
        const symbol2 = finalSymbols[`reel2-${i}`];
        const symbol3 = finalSymbols[`reel3-${i}`];
        winAmount += calculateWinForLine(symbol1, symbol2, symbol3);
    }

    // Check vertical wins
    for (let j = 1; j <= 3; j++) {
        const symbol1 = finalSymbols[`reel${j}-1`];
        const symbol2 = finalSymbols[`reel${j}-2`];
        const symbol3 = finalSymbols[`reel${j}-3`];
        winAmount += calculateWinForLine(symbol1, symbol2, symbol3);
    }

    // Check diagonal wins
    const diagonal1 = [finalSymbols['reel1-1'], finalSymbols['reel2-2'], finalSymbols['reel3-3']];
    const diagonal2 = [finalSymbols['reel1-3'], finalSymbols['reel2-2'], finalSymbols['reel3-1']];
    winAmount += calculateWinForLine(...diagonal1);
    winAmount += calculateWinForLine(...diagonal2);

    if (winAmount > 0) {
        message.textContent = `You won ${winAmount} credits!`;
        message.className = 'win';
        credits += winAmount;
        createBeep(880, 0.5, 'square');
    } else {
        message.textContent = `Try again. Credits: ${credits}`;
        message.className = 'lose';
        createBeep(100, 0.1);
    }

    updateCreditsDisplay();
    saveGame();
}

function calculateWinForLine(symbol1, symbol2, symbol3) {
    // Only check for three of a kind (no wildcards)
    if (symbol1 === symbol2 && symbol2 === symbol3) {
        return payoutTable[symbol1][3] * betAmount;
    }

    return 0; // No win
}

function changeBet(amount) {
    betAmount = Math.max(1, betAmount + amount); // Ensure bet is at least 1
    betAmount = Math.min(betAmount, credits); // Ensure bet is not more than credits
    currentBetSpan.textContent = betAmount;
}

function handleMaxBet() {
    betAmount = Math.min(maxBet, credits); // Set bet to max allowed or current credits, whichever is lower
    currentBetSpan.textContent = betAmount;
}

function resetGame() {
    // Ask for confirmation before resetting
    if (confirm('Are you sure you want to start a new game?')) {
        credits = 100; // Reset credits to 100
        betAmount = 1;
        message.textContent = '';
        message.className = '';
        currentBetSpan.textContent = betAmount;
        updateCreditsDisplay(); // Update credits display after reset
        createReels();
        localStorage.removeItem('slotMachine');
    }
}

function saveGame() {
    const reelsState = {};
    for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
            const reelId = `reel${i}-${j}`;
            reelsState[reelId] = document.getElementById(reelId).innerHTML;
        }
    }

    const savedData = {
        credits: credits,
        reels: reelsState,
        betAmount: betAmount
    };
    localStorage.setItem('slotMachine', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('slotMachine'));
    if (savedData) {
        credits = savedData.credits;
        betAmount = savedData.betAmount || 1;
        currentBetSpan.textContent = betAmount;
        message.textContent = `Game resumed. Credits: ${credits}`;

        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 3; j++) {
                const reelId = `reel${i}-${j}`;
                const reel = document.getElementById(reelId);
                reel.innerHTML = savedData.reels[reelId] || '';
            }
        }
    } else {
        createReels();
    }
    updateCreditsDisplay();
}

// Function to update the credits display
function updateCreditsDisplay() {
    currentCreditsSpan.textContent = credits;
}

// Event listeners for bet adjustment buttons
decreaseBetButton.addEventListener('click', () => changeBet(-1));
increaseBetButton.addEventListener('click', () => changeBet(1));
maxBetButton.addEventListener('click', handleMaxBet);

// Function to create the payout table
function createPayoutTable() {
    const tableBody = document.querySelector('#payout-table tbody');
    tableBody.innerHTML = ''; // Clear existing table rows

    // Create rows for 3 of a kind
    for (const symbol in payoutTable) {
        const payout = payoutTable[symbol][3];
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol}</td>
            <td>${symbol}</td>
            <td>${symbol}</td>
            <td>${payout}x Bet</td>
        `;
        tableBody.appendChild(row);
    }
}

// Initialize the game on page load
createReels();
loadGame();
createPayoutTable();