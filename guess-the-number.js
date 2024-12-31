let secretNumber = generateRandomNumber();
let attempts = 0;
const guessInput = document.getElementById('guessInput');
const message = document.getElementById('message');

function generateRandomNumber() {
    return Math.floor(Math.random() * 100) + 1;
}

function checkGuess() {
    const guess = parseInt(guessInput.value);
    attempts++;

    if (isNaN(guess) || guess < 1 || guess > 100) {
        message.textContent = 'Please enter a valid number between 1 and 100.';
    } else if (guess === secretNumber) {
        message.textContent = `Congratulations! You guessed it in ${attempts} attempts.`;
        guessInput.disabled = true;
        saveGame();
    } else if (guess < secretNumber) {
        message.textContent = 'Too low! Try again.';
    } else {
        message.textContent = 'Too high! Try again.';
    }
}

function resetGame() {
    secretNumber = generateRandomNumber();
    attempts = 0;
    guessInput.value = '';
    guessInput.disabled = false;
    message.textContent = '';
    localStorage.removeItem('guessTheNumber');
}

function saveGame() {
    const savedData = {
        secretNumber: secretNumber,
        attempts: attempts
    };
    localStorage.setItem('guessTheNumber', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('guessTheNumber'));
    if (savedData) {
        secretNumber = savedData.secretNumber;
        attempts = savedData.attempts;
        message.textContent = 'Game resumed...';
    }
}

// Load saved game (if any) on page load
loadGame();