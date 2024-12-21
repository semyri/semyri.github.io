const reel1 = document.getElementById('reel1');
const reel2 = document.getElementById('reel2');
const reel3 = document.getElementById('reel3');
const message = document.getElementById('message');

const symbols = ['🍒', '🍊', '🍋', '🔔', '⭐', '7️⃣' , '69'];
let spinning = false;
let credits = 10; // Initialize with some credits

function createReel(reel) {
    reel.innerHTML = '';
    for (let i = 0; i < 3; i++) { // 3 visible symbols per reel
        const symbolIndex = Math.floor(Math.random() * symbols.length);
        const symbolDiv = document.createElement('div');
        symbolDiv.classList.add('symbol');
        symbolDiv.textContent = symbols[symbolIndex];
        reel.appendChild(symbolDiv);
    }
}

function spinReel(reel) {
    const currentSymbol = reel.children[1].textContent; // Get the middle symbol
    const newSymbolIndex = Math.floor(Math.random() * symbols.length);
    const newSymbol = symbols[newSymbolIndex];

    const newSymbolDiv = document.createElement('div');
    newSymbolDiv.classList.add('symbol');
    newSymbolDiv.textContent = newSymbol;

    reel.removeChild(reel.firstChild); // Remove the top symbol
    reel.appendChild(newSymbolDiv); // Add the new symbol at the bottom
    return newSymbol;
}

function spin() {
    if (spinning || credits <= 0) return;

    spinning = true;
    credits--;
    message.textContent = 'Spinning...';

    let spinCount = 0;
    const spinInterval = setInterval(() => {
        const symbol1 = spinReel(reel1);
        const symbol2 = spinReel(reel2);
        const symbol3 = spinReel(reel3);

        if (++spinCount >= 15) { // Number of spins before stopping
            clearInterval(spinInterval);
            checkWin(symbol1, symbol2, symbol3);
            spinning = false;
        }
    }, 100); // Adjust spin speed here
}

function checkWin(symbol1, symbol2, symbol3) {
    if (symbol1 === symbol2 && symbol2 === symbol3) {
        message.textContent = `You won! All three match: ${symbol1}`;
        credits += 10; // Example win amount
    } else if (symbol1 === symbol2 || symbol2 === symbol3 || symbol1 === symbol3) {
        message.textContent = `You won! Two match: ${symbol1}, ${symbol2}, ${symbol3}`;
        credits += 2; // Example win amount
    } else {
        message.textContent = `Try again. Credits: ${credits}`;
    }
    saveGame();
}

function resetGame() {
    credits = 10;
    message.textContent = '';
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
        reel3: reel3.innerHTML
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
        message.textContent = `Game resumed. Credits: ${credits}`;
    } else {
        createReel(reel1);
        createReel(reel2);
        createReel(reel3);
    }
}

// Initialize the game on page load
loadGame();