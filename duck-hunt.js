const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

const groundY = canvas.height - 40;
const duckSize = 40;
let score = 0;
let ducks = [];
let isGameOver = false;

function createDuck() {
    const speed = Math.random() * 2 + 1; // Random speed between 1 and 3
    const direction = Math.random() < 0.5 ? 1 : -1; // 1 for right, -1 for left
    const startX = direction === 1 ? -duckSize : canvas.width;
    const duck = {
        x: startX,
        y: Math.random() * (groundY - duckSize),
        speed: speed,
        direction: direction,
        width: duckSize,
        height: duckSize,
        color: 'brown' // You can replace this with an image later
    };
    ducks.push(duck);
}

function drawDuck(duck) {
    ctx.fillStyle = duck.color;
    ctx.fillRect(duck.x, duck.y, duck.width, duck.height);
}

function drawGround() {
    ctx.fillStyle = 'green';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function updateDucks() {
    for (let i = 0; i < ducks.length; i++) {
        ducks[i].x += ducks[i].speed * ducks[i].direction;

        // Remove duck if it goes off-screen
        if ((ducks[i].direction === 1 && ducks[i].x > canvas.width) ||
            (ducks[i].direction === -1 && ducks[i].x < -ducks[i].width)) {
            ducks.splice(i, 1);
            i--;
            if (!isGameOver) {
                messageDisplay.textContent = 'You missed a duck!';
            }
        }
    }
}

function checkHit(mouseX, mouseY) {
    for (let i = 0; i < ducks.length; i++) {
        if (mouseX > ducks[i].x && mouseX < ducks[i].x + ducks[i].width &&
            mouseY > ducks[i].y && mouseY < ducks[i].y + ducks[i].height) {

            ducks.splice(i, 1);
            score++;
            scoreDisplay.textContent = "Score: " + score;
            messageDisplay.textContent = 'Nice shot!';
            return; // Exit the loop after a hit
        }
    }
    messageDisplay.textContent = 'You missed!';
}

canvas.addEventListener('click', function(event) {
    if (isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    checkHit(mouseX, mouseY);
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();

    // Draw and update ducks
    for (let i = 0; i < ducks.length; i++) {
        drawDuck(ducks[i]);
    }
    updateDucks();

    // Check for game over
    if (isGameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over! Score: ' + score, canvas.width / 2 - 120, canvas.height / 2);
        return;
    }

    requestAnimationFrame(gameLoop);
}

function resetGame() {
    score = 0;
    ducks = [];
    isGameOver = false;
    scoreDisplay.textContent = "Score: " + score;
    messageDisplay.textContent = '';
    gameLoop();
}

setInterval(createDuck, 2000); // Create a new duck every 2 seconds
gameLoop();