const gameBoard = document.getElementById('gameBoard');
const message = document.getElementById('message');
let board = ['', '', '', '', '', '', '', '', '']; // Empty board initially
let currentPlayer = 'X';
let gameOver = false;

// Function to load game state from Local Storage
function loadGame() {
    const savedBoard = localStorage.getItem('ticTacToeBoard');
    const savedPlayer = localStorage.getItem('ticTacToeCurrentPlayer');

    if (savedBoard) {
        board = JSON.parse(savedBoard);
        currentPlayer = savedPlayer;
        updateBoard();
        updateMessage();
    }
}

// Function to save game state to Local Storage
function saveGame() {
    localStorage.setItem('ticTacToeBoard', JSON.stringify(board));
    localStorage.setItem('ticTacToeCurrentPlayer', currentPlayer);
}

// Function to update the displayed board based on 'board' array
function updateBoard() {
    const cells = gameBoard.querySelectorAll('td');
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = board[i];
    }
}

// Function to update the message (e.g., whose turn it is)
function updateMessage() {
    if (gameOver) {
        message.textContent = `Player ${currentPlayer === 'X' ? 'O' : 'X'} Wins!`;
    } else {
        message.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

// Function to check for a win or a tie
function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            gameOver = true;
            updateMessage();
            return;
        }
    }

    // Check for a tie
    if (!board.includes('')) {
        gameOver = true;
        message.textContent = "It's a Tie!";
    }
}

// Function to handle a cell click
function handleCellClick(event) {
    const cell = event.target;
    const index = cell.dataset.index;

    if (board[index] === '' && !gameOver) {
        board[index] = currentPlayer;
        cell.textContent = currentPlayer;
        checkWin();
        if (!gameOver) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateMessage();
        }
        saveGame(); // Save the game state after each move
    }
}

// Function to reset the game
function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;
    updateBoard();
    updateMessage();
    localStorage.removeItem('ticTacToeBoard'); // Clear saved game
    localStorage.removeItem('ticTacToeCurrentPlayer');
}

// Add event listeners to cells
const cells = gameBoard.querySelectorAll('td');
for (const cell of cells) {
    cell.addEventListener('click', handleCellClick);
}

// Load saved game state (if any) when the page loads
loadGame();