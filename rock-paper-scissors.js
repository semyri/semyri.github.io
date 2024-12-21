let playerScore = 0;
let computerScore = 0;
const message = document.getElementById('message');

function getComputerChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    const randomIndex = Math.floor(Math.random() * 3);
    return choices[randomIndex];
}

function play(playerChoice) {
    const computerChoice = getComputerChoice();
    let result = '';

    if (playerChoice === computerChoice) {
        result = "It's a tie!";
    } else if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        result = 'You win!';
        playerScore++;
        saveGame();
    } else {
        result = 'Computer wins!';
        computerScore++;
        saveGame();
    }

    message.textContent = `You chose ${playerChoice}, computer chose ${computerChoice}. ${result} Score: ${playerScore} - ${computerScore}`;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    message.textContent = '';
    localStorage.removeItem('rockPaperScissors');
}

function saveGame() {
    const savedData = {
        playerScore: playerScore,
        computerScore: computerScore
    };
    localStorage.setItem('rockPaperScissors', JSON.stringify(savedData));
}

function loadGame() {
    const savedData = JSON.parse(localStorage.getItem('rockPaperScissors'));
    if (savedData) {
        playerScore = savedData.playerScore;
        computerScore = savedData.computerScore;
        message.textContent = `Game resumed. Score: ${playerScore} - ${computerScore}`;
    }
}

// Load saved game (if any) on page load
loadGame();