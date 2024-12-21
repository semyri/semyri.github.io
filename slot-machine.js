const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const message = document.getElementById('message');
const currentBetSpan = document.getElementById('current-bet');
const currentCreditsSpan = document.getElementById('current-credits');

// Symbols
const symbols = ['!', '+', '-', 'x', '/', '7', '*'];

// Payout Table
const payoutTable = {
    '!': {
        3: 2,
        2: 1
    },
    '+': {
        3: 5,
        2: 2
    },
    '-': {
        3: 8,
        2: 4
    },
    'x': {
        3: 10
    },
    '/': {
        3: 15
    },
    '7': {
        3: 20
    },
    '*': {
        3: 50
    }
};

let spinning = false;
let credits = 100;
let betAmount = 1;

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

function createReel(reel) {
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
            reel.removeChild(reel.querySelector('.old'));
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
    updateCreditsDisplay(); // Update credits display after betting
    message.textContent = 'Spinning...';
    message.className = ''; // Reset message styling

    // Play a series of beeps for the spinning sound
    for (let i = 0; i < 15; i++) {
        const freq = 200 + Math.random() * 400; // Vary frequency for each beep
        createBeep(freq, 0.05, 'triangle'); // Short triangle wave beeps
        await new Promise(resolve => setTimeout(resolve, 30)); // Short delay between beeps
    }

    let spinCount = 0;
    const spinInterval = setInterval(() => {
        spinReel(reel1);
        spinReel(reel2);
        spinReel(reel3);
        spinCount++;

        if (spinCount >= 15) {
            clearInterval(spinInterval);
            // Stop reels individually with delays
            setTimeout(() => {
                spinReel(reel1, true).then(symbol1 => {
                    createBeep(400, 0.1); // Slightly longer beep when reel stops
                    setTimeout(() => {
                        spinReel(reel2, true).then(symbol2 => {
                            createBeep(400, 0.1); // Slightly longer beep when reel stops
                            setTimeout(() => {
                                spinReel(reel3, true).then(symbol3 => {
                                    createBeep(400, 0.1); // Slightly longer beep when reel stops
                                    checkWin(symbol1, symbol2, symbol3);
                                    spinning = false;
                                });
                            }, 200); // Delay for reel 3
                        });
                    }, 200); // Delay for reel 2
                });
            }, 200); // Delay for reel 1
        }
    }, 100);
}

function checkWin(symbol1, symbol2, symbol3) {
    const symbols = [symbol1, symbol2, symbol3];
    let winAmount = 0;

    // Check for three of a kind
    if (symbol1 === symbol2 && symbol2 === symbol3) {
        winAmount = payoutTable[symbol1][3] * betAmount;
    } else {
        // Check for two of a kind (more complex logic for multiple pairs)
        for (let i = 0; i < symbols.length; i++) {
            for (let j = i + 1; j < symbols.length; j++) {
                if (symbols[i] === symbols[j]) {
                    if (payoutTable[symbols[i]][2])
                        winAmount = Math.max(winAmount, payoutTable[symbols[i]][2] * betAmount);
                }
            }
        }
    }

    if (winAmount > 0) {
        message.textContent = `You won ${winAmount} credits!`;
        message.className = 'win';
        credits += winAmount;
        // Win sound: A higher-pitched, longer beep
        createBeep(880, 0.5, 'square');
    } else {
        message.textContent = `Try again. Credits: ${credits}`;
        message.className = 'lose';
        // Lose sound: A quick, low-pitched boop
        createBeep(100, 0.1);
    }
    updateCreditsDisplay(); // Update credits display after win/loss
    saveGame();
}

function changeBet(amount) {
    betAmount = Math.max(1, betAmount + amount); // Ensure bet is at least 1
    currentBetSpan.textContent = betAmount;
}

function resetGame() {
    credits = 100; // Reset credits to 100
    betAmount = 1;
    message.textContent = '';
    message.className = '';
    currentBetSpan.textContent = betAmount;
    updateCreditsDisplay(); // Update credits display after reset
    createReel(reel1);
    createReel(reel2);
    createReel(reel3);
    localStorage.removeItem('slotMachine');
}

function saveGame() {
    const savedData = {
        credits: credits,
        reel1: reel1.innerHTML,
        reel2: reel2.innerHTML,
        reel3: reel3.innerHTML,
        betAmount: betAmount
    };
    localStorage.setItem('slotMachine', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('slotMachine'));
    if (savedData) {
        credits = savedData.credits;
        reel1.innerHTML = savedData.reel1;
        reel2.innerHTML = savedData.reel2;
        reel3.innerHTML = savedData.reel3;
        betAmount = savedData.betAmount || 1;
        currentBetSpan.textContent = betAmount;
        message.textContent = `Game resumed. Credits: ${credits}`;
    } else {
        createReel(reel1);
        createReel(reel2);
        createReel(reel3);
    }
    updateCreditsDisplay(); // Update credits display after loading
}

// Function to update the credits display
function updateCreditsDisplay() {
    currentCreditsSpan.textContent = credits;
}

// Initialize the game on page load
loadGame();