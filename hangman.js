const hangmanFigure = document.getElementById('hangmanFigure').querySelectorAll('circle, line');
const wordElement = document.getElementById('word');
const incorrectGuessesElement = document.getElementById('incorrectGuesses');
const message = document.getElementById('message');
const guessInput = document.getElementById('guessInput');
const guessedLettersDisplay = document.getElementById('guessedLetters'); // Get the new element

const words = ['javascript', 'programming', 'coding', 'developer', 'computer'];
let selectedWord = '';
let guessedLetters = [];
let incorrectGuesses = 0;
const maxIncorrectGuesses = 7; // Increased to 7

function initializeGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    incorrectGuesses = 0;
    updateHangmanFigure();
    updateWordDisplay();
    updateIncorrectGuessesDisplay();
    message.textContent = '';
    guessInput.value = '';
    guessInput.disabled = false;
    guessedLettersDisplay.textContent = 'Guessed Letters: '; // Initialize display
}

function updateHangmanFigure() {
    for (let i = 0; i < hangmanFigure.length; i++) {
        hangmanFigure[i].style.display = i < incorrectGuesses ? 'block' : 'none';
    }
}

function updateWordDisplay() {
    wordElement.textContent = selectedWord
        .split('')
        .map(letter => (guessedLetters.includes(letter) ? letter : '_'))
        .join(' ');

    if (!wordElement.textContent.includes('_')) {
        message.textContent = 'You won!';
        guessInput.disabled = true;
        saveGame();
    }
}

function updateIncorrectGuessesDisplay() {
    incorrectGuessesElement.textContent = `Incorrect guesses: ${incorrectGuesses} / ${maxIncorrectGuesses}`;
    guessedLettersDisplay.textContent = 'Guessed Letters: ' + guessedLetters.join(', '); // Show guessed letters
}

function guessLetter() {
    const letter = guessInput.value.toLowerCase();
    guessInput.value = '';

    if (letter.length !== 1 || !letter.match(/[a-z]/i)) {
        message.textContent = 'Please enter a valid single letter.';
        return;
    }

    if (guessedLetters.includes(letter) || incorrectGuesses >= maxIncorrectGuesses) {
        return; // Already guessed or game over
    }

    guessedLetters.push(letter);

    if (selectedWord.includes(letter)) {
        updateWordDisplay();
    } else {
        incorrectGuesses++;
        updateHangmanFigure();
        updateIncorrectGuessesDisplay();
        if (incorrectGuesses === maxIncorrectGuesses) {
            message.textContent = `You lost! The word was: ${selectedWord}`;
            guessInput.disabled = true;
            saveGame();
        }
    }
}

function resetGame() {
    initializeGame();
    localStorage.removeItem('hangmanGame');
}

function saveGame() {
    const savedData = {
        selectedWord: selectedWord,
        guessedLetters: guessedLetters,
        incorrectGuesses: incorrectGuesses
    };
    localStorage.setItem('hangmanGame', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('hangmanGame'));
    if (savedData) {
        selectedWord = savedData.selectedWord;
        guessedLetters = savedData.guessedLetters;
        incorrectGuesses = savedData.incorrectGuesses;
        updateHangmanFigure();
        updateWordDisplay();
        updateIncorrectGuessesDisplay();
        message.textContent = 'Game resumed...';
    } else {
        initializeGame();
    }
}

// Initialize the game on page load
loadGame();