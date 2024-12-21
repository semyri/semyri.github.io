const gameBoard = document.getElementById('gameBoard');
const message = document.getElementById('message');
let cards = ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'E', 'E', 'F', 'F']; // Pairs of symbols
let flippedCards = [];
let matchedCards = [];
let moves = 0;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createBoard() {
    cards = shuffle(cards);
    gameBoard.innerHTML = ''; // Clear the board
    for (let i = 0; i < cards.length; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = i;
        card.textContent = cards[i];
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
    }
}

function handleCardClick(event) {
    const card = event.target;
    const index = parseInt(card.dataset.index);

    if (flippedCards.length < 2 && !flippedCards.includes(card) && !matchedCards.includes(card)) {
        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            moves++;
            setTimeout(checkMatch, 1000); // Delay to show the second card
        }
    }
}

function checkMatch() {
    const card1 = flippedCards[0];
    const card2 = flippedCards[1];
    const index1 = parseInt(card1.dataset.index);
    const index2 = parseInt(card2.dataset.index);

    if (cards[index1] === cards[index2]) {
        // Match found
        card1.classList.replace('flipped', 'matched');
        card2.classList.replace('flipped', 'matched');
        matchedCards.push(card1, card2);
        if (matchedCards.length === cards.length) {
            message.textContent = `You won in ${moves} moves!`;
            saveGame();
        }
    } else {
        // Not a match
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }

    flippedCards = [];
}

function resetGame() {
    flippedCards = [];
    matchedCards = [];
    moves = 0;
    message.textContent = '';
    createBoard();
    localStorage.removeItem('memoryGame');
}

function saveGame() {
    const savedData = {
        cards: cards,
        matchedCards: matchedCards.map(card => parseInt(card.dataset.index)),
        moves: moves
    };
    localStorage.setItem('memoryGame', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('memoryGame'));
    if (savedData) {
        cards = savedData.cards;
        matchedCards = savedData.matchedCards.map(index => {
            const card = document.createElement('div');
            card.classList.add('card', 'matched');
            card.dataset.index = index;
            card.textContent = cards[index];
            return card;
        });
        moves = savedData.moves;
        message.textContent = 'Game resumed...';
        createBoard(); // Recreate board with matched cards
        matchedCards.forEach(card => gameBoard.children[parseInt(card.dataset.index)].classList.add('matched', 'flipped'));
    } else {
        createBoard();
    }
}

// Initialize the game on page load
loadGame();