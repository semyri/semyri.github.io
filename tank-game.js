const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const angleInput = document.getElementById('angle');
const powerInput = document.getElementById('power');
const fireButton = document.getElementById('fireButton');
const turnInfo = document.getElementById('turnInfo');
const hitDisplay = document.getElementById('hitDisplay');

const groundY = canvas.height - 50; // Height of the ground
const tankWidth = 40;
const tankHeight = 25;
const gravity = 0.1; // Adjust for stronger/weaker gravity

let currentPlayer = 1;
let hitsPlayer1 = 0;
let hitsPlayer2 = 0;
let projectile = null;

const tank1 = {
    x: 50,
    y: groundY - tankHeight,
    color: 'blue',
    score: 0
};

const tank2 = {
    x: canvas.width - 50 - tankWidth,
    y: groundY - tankHeight,
    color: 'red',
    score: 0
};

function drawTank(tank) {
    ctx.fillStyle = tank.color;
    ctx.fillRect(tank.x, tank.y, tankWidth, tankHeight);
    // Add a simple barrel to indicate direction
    ctx.beginPath();
    ctx.moveTo(tank.x + tankWidth / 2, tank.y);
    ctx.lineTo(tank.x + tankWidth / 2 + (tank.color === 'blue' ? 20 : -20), tank.y - 10);
    ctx.strokeStyle = tank.color;
    ctx.lineWidth = 4;
    ctx.stroke();
}

function drawGround() {
    ctx.fillStyle = 'brown';
    ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function drawProjectile() {
    if (projectile) {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}

function updateProjectile() {
    if (projectile) {
        projectile.x += projectile.velocityX;
        projectile.y += projectile.velocityY;
        projectile.velocityY += gravity;

        // Check for ground collision
        if (projectile.y + 5 >= groundY) {
            projectile = null;
            switchTurn();
        }

        // Check for tank hits
        checkHit(tank1);
        checkHit(tank2);
    }
}

function checkHit(targetTank) {
    if (projectile &&
        projectile.x > targetTank.x && projectile.x < targetTank.x + tankWidth &&
        projectile.y > targetTank.y && projectile.y < targetTank.y + tankHeight) {

        if (targetTank === tank1) {
            hitsPlayer2++;
            tank2.score++;
        } else {
            hitsPlayer1++;
            tank1.score++;
        }

        projectile = null;
        updateHitDisplay();
        checkGameOver();
        switchTurn();
    }
}

function updateHitDisplay() {
    hitDisplay.textContent = `Hits - Player 1: ${tank1.score}, Player 2: ${tank2.score}`;
}

function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnInfo.textContent = `Player ${currentPlayer}'s Turn`;
}

function fireProjectile(angle, power) {
    const radians = angle * (Math.PI / 180);
    const initialVelocity = power / 5; // Adjust scaling factor as needed

    projectile = {
        x: currentPlayer === 1 ? tank1.x + tankWidth : tank2.x,
        y: groundY - tankHeight,
        velocityX: initialVelocity * Math.cos(radians) * (currentPlayer === 1 ? 1 : -1),
        velocityY: -initialVelocity * Math.sin(radians),
    };
}

function checkGameOver() {
    if (hitsPlayer1 >= 3 || hitsPlayer2 >= 3) {
        const winner = hitsPlayer1 >= 3 ? 1 : 2;
        turnInfo.textContent = `Player ${winner} Wins!`;
        fireButton.disabled = true;
        projectile = null;
    }
}

function resetGame() {
    hitsPlayer1 = 0;
    hitsPlayer2 = 0;
    tank1.score = 0;
    tank2.score = 0;
    currentPlayer = 1;
    projectile = null;
    fireButton.disabled = false;
    turnInfo.textContent = `Player ${currentPlayer}'s Turn`;
    updateHitDisplay();
    draw(); // Redraw tanks and ground
}

fireButton.addEventListener('click', () => {
    const angle = parseFloat(angleInput.value);
    const power = parseFloat(powerInput.value);
    fireProjectile(angle, power);
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawTank(tank1);
    drawTank(tank2);
    drawProjectile();
}

function gameLoop() {
    draw();
    updateProjectile();

    if (!projectile && !fireButton.disabled) {
        // If there's no active projectile and game isn't over, allow next shot
        requestAnimationFrame(gameLoop);
    } else if (projectile) {
        // If there's an active projectile, continue the animation
        requestAnimationFrame(gameLoop);
    }
}

gameLoop();