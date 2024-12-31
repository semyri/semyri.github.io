const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const angleInput = document.getElementById('angle');
const powerInput = document.getElementById('power');
const fireButton = document.getElementById('fireButton');
const turnInfo = document.getElementById('turnInfo');
const hitDisplay = document.getElementById('hitDisplay');
const windDisplay = document.getElementById('windDisplay');
const moveLeftButton = document.getElementById('moveLeft');
const moveRightButton = document.getElementById('moveRight');
const projectileTypeSelect = document.getElementById('projectileType');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerMessage = document.getElementById('winnerMessage');
const playAgainButton = document.getElementById('playAgainButton');

const groundY = canvas.height - 50; // Height of the ground
const tankWidth = 40;
const tankHeight = 25;
const gravity = 0.1; // Adjust for stronger/weaker gravity
const moveDistance = 5; // How many pixels tanks move per button press
const angleIncrement = 1; // Increment/decrement value for angle
const powerIncrement = 1; // Increment/decrement value for power

let currentPlayer = 1;
let hitsPlayer1 = 0;
let hitsPlayer2 = 0;
let projectile = null;
let windSpeed = 0;
let windDirection = 1; // 1 for right, -1 for left
let isSwitchingTurn = false; // Flag to prevent multiple turn switches
let isGameOver = false; // Flag to indicate if the game is over

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

// Terrain data (mountain range)
const terrain = [
    { x: canvas.width / 2 - 80, y: groundY, type: 'mountain' }, // Example mountain
    // You can add more mountains or other terrain types here
];

// Sound effects (beep and boop)
const shootSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+btoa(Array.from({length:2500}, ()=>(Math.random()*127|128)).join(','))); // Beep
const explosionSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+btoa(Array.from({length:1500}, ()=>(Math.random()*127|128)).join(','))); // Boop

function drawTank(tank) {
    ctx.fillStyle = tank.color;
    ctx.fillRect(tank.x, tank.y, tankWidth, tankHeight);

    // Draw barrel
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

    // Draw terrain
    drawTerrain();
}

function drawTerrain() {
    terrain.forEach(element => {
        if (element.type === 'mountain') {
            // Draw a simple mountain using a polygon (triangle)
            ctx.fillStyle = 'gray';
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(element.x + 80, element.y - 100);
            ctx.lineTo(element.x + 160, element.y);
            ctx.closePath();
            ctx.fill();
        }
    });
}

function drawProjectile() {
    if (projectile) {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
    }
}

function drawExplosion(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'orange';
    ctx.fill();

    // Add some particles (optional)
    for (let i = 0; i < 10; i++) {
        const particleX = x + (Math.random() - 0.5) * radius * 2;
        const particleY = y + (Math.random() - 0.5) * radius * 2;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
    }
}

function checkTerrainCollision(x, y) {
    for (let element of terrain) {
        if (element.type === 'mountain') {
            const mountainBaseLeft = element.x;
            const mountainTopX = element.x + 80;
            const mountainBaseRight = element.x + 160;
            const mountainTopY = element.y - 100;

            // Check if projectile is within the horizontal bounds of the mountain
            if (x >= mountainBaseLeft && x <= mountainBaseRight) {
                // Calculate the y-coordinate of the mountain sides at the projectile's x-coordinate
                let mountainSideYLeft = element.y - (x - mountainBaseLeft) * (element.y - mountainTopY) / (mountainTopX - mountainBaseLeft);
                let mountainSideYRight = mountainTopY + (x - mountainTopX) * (element.y - mountainTopY) / (mountainBaseRight - mountainTopX);

                // Check if the projectile is below EITHER of the mountain sides
                if ((y <= mountainSideYLeft || y <= mountainSideYRight) && y >= mountainTopY) {
                    return true; // Collision detected
                }
            }
        }
    }
    return false; // No collision
}

function updateProjectile() {
    if (projectile) {
        projectile.x += projectile.velocityX + (windSpeed * windDirection);
        projectile.y += projectile.velocityY;
        projectile.velocityY += gravity;

        // Check for ground collision
        if (projectile.y + projectile.radius >= groundY) {
            explosionSound.play();
            drawExplosion(projectile.x, projectile.y, projectile.radius + 5);
            projectile = null;
            if (!isSwitchingTurn) {
                isSwitchingTurn = true;
                switchTurn();
            }
        }
        // Check for terrain collision
        else if (checkTerrainCollision(projectile.x, projectile.y)) {
            explosionSound.play();
            drawExplosion(projectile.x, projectile.y, projectile.radius + 5);
            projectile = null;
            if (!isSwitchingTurn) {
                isSwitchingTurn = true;
                switchTurn();
            }
        }
        // Check for tank hits
        else {
            checkHit(tank1);
            checkHit(tank2);
        }
    }
}

function checkHit(targetTank) {
    if (projectile &&
        projectile.x > targetTank.x && projectile.x < targetTank.x + tankWidth &&
        projectile.y > targetTank.y && projectile.y < targetTank.y + tankHeight) {

        explosionSound.play();
        drawExplosion(projectile.x, projectile.y, projectile.radius + 5);

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
        if (!isSwitchingTurn) {
            isSwitchingTurn = true;
            switchTurn();
        }
    }
}

function updateHitDisplay() {
    hitDisplay.textContent = `Hits - Player 1: ${tank1.score}, Player 2: ${tank2.score}`;
}

function updateWind() {
    windSpeed = Math.random() * 2; // Max wind speed of 2
    windDirection = Math.random() > 0.5 ? 1 : -1;

    // Update wind display text with "->" or "<-" for direction
    windDisplay.textContent = `Wind: ${windSpeed.toFixed(1)} ${windDirection === 1 ? '-->' : '<--'}`;
}

function switchTurn() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnInfo.textContent = `Player ${currentPlayer}'s Turn`;
    updateWind();
    fireButton.disabled = false; // Re-enable the fire button
    isSwitchingTurn = false; // Reset the flag
}

function fireProjectile(angle, power) {
    // Disable the fire button immediately after firing
    fireButton.disabled = true;

    const currentTank = currentPlayer === 1 ? tank1 : tank2;
    const radians = angle * (Math.PI / 180);
    const initialVelocity = power / 5;

    projectile = {
        x: currentTank.x + (currentTank === tank1 ? tankWidth : 0),
        y: groundY - tankHeight,
        velocityX: initialVelocity * Math.cos(radians),
        velocityY: -initialVelocity * Math.sin(radians),
        radius: 5,
        type: projectileTypeSelect.value
    };

    // Reverse velocity for Player 2
    if (currentTank === tank2) {
        projectile.velocityX = -projectile.velocityX;
    }

    // Adjust properties based on projectile type
    switch (projectile.type) {
        case 'heavy':
            projectile.radius = 7;
            projectile.damageMultiplier = 1.5;
            break;
        case 'explosive':
            projectile.radius = 10;
            projectile.damageMultiplier = 1.2;
            break;
        default: // 'normal'
            projectile.damageMultiplier = 1;
    }

    shootSound.play();
}

function moveTank(direction) {
    const currentTank = currentPlayer === 1 ? tank1 : tank2;

    const terrainCollision = (newX) => {
        for (let element of terrain) {
            if (element.type === 'mountain') {
                const mountainLeft = element.x;
                const mountainRight = element.x + 160;
                if (newX + tankWidth > mountainLeft && newX < mountainRight) {
                    return true;
                }
            }
        }
        return false;
    }

    // Determine movement direction based on player
    let moveDirection = direction;

    // Check for potential collision with terrain
    let newX = currentTank.x + moveDirection;
    if (!terrainCollision(newX) && newX >= 0 && newX <= canvas.width - tankWidth) {
        currentTank.x = newX;
        draw();
    }
}

function checkGameOver() {
    if (!isGameOver && (hitsPlayer1 >= 3 || hitsPlayer2 >= 3)) {
        isGameOver = true;
        const winner = hitsPlayer1 >= 3 ? 1 : 2;
        showGameOverScreen(winner);
    }
}
function showGameOverScreen(winner) {
    winnerMessage.textContent = `Player ${winner} Wins!`;
    gameOverScreen.style.display = "block";
}

function resetGame() {
    hitsPlayer1 = 0;
    hitsPlayer2 = 0;
    tank1.score = 0;
    tank2.score = 0;
    currentPlayer = 1;
    projectile = null;
    fireButton.disabled = false;
    moveLeftButton.disabled = false;
    moveRightButton.disabled = false;
    turnInfo.textContent = `Player ${currentPlayer}'s Turn`;
    updateHitDisplay();
    updateWind();
    isGameOver = false; // Reset game over flag
    gameOverScreen.style.display = "none"; // Hide game over screen
    draw();
}

function drawTrajectoryPreview() {
    if (!projectile) {
        const currentTank = currentPlayer === 1 ? tank1 : tank2;
        const angle = parseFloat(angleInput.value);
        const power = parseFloat(powerInput.value);
        const radians = angle * (Math.PI / 180);
        const initialVelocity = power / 5;

        const startX = currentTank.x + (currentTank === tank1 ? tankWidth : 0);
        const startY = groundY - tankHeight;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent
        ctx.moveTo(startX, startY);

        let previewX = startX;
        let previewY = startY;
        let velocityX = initialVelocity * Math.cos(radians);
        let velocityY = -initialVelocity * Math.sin(radians);

        // Adjust velocity for Player 2 to move in the opposite direction
        if (currentTank === tank2) {
            velocityX = -velocityX;
        }

        // Simulate a few steps of the trajectory
        for (let i = 0; i < 50; i++) {
            previewX += velocityX + (windSpeed * windDirection);
            previewY += velocityY;
            velocityY += gravity;

            // Check if preview hits terrain or ground
            if (previewY >= groundY || checkTerrainCollision(previewX, previewY)) {
                break; // Stop drawing if it hits something
            }

            ctx.lineTo(previewX, previewY);
        }
        ctx.stroke();
    }
}

// Event listeners

// Keyboard controls
document.addEventListener('keydown', (event) => {
    if (isGameOver) return; // Ignore input if game is over

    if (event.code === 'ArrowLeft') {
        moveTank(-moveDistance);
        event.preventDefault(); // Prevent default arrow key behavior
    } else if (event.code === 'ArrowRight') {
        moveTank(moveDistance);
        event.preventDefault(); // Prevent default arrow key behavior
    } else if (event.code === 'ArrowUp') {
        angleInput.value = Math.min(90, parseFloat(angleInput.value) + angleIncrement);
        draw(); // Redraw to show updated trajectory
        event.preventDefault(); // Prevent default arrow key behavior
    } else if (event.code === 'ArrowDown') {
        angleInput.value = Math.max(0, parseFloat(angleInput.value) - angleIncrement);
        draw(); // Redraw to show updated trajectory
        event.preventDefault(); // Prevent default arrow key behavior
    } else if (event.code === 'Space') {
        event.preventDefault(); // Prevent default spacebar behavior (scrolling)
        if (!fireButton.disabled) { // Check if the fire button is not disabled
            const angle = parseFloat(angleInput.value);
            const power = parseFloat(powerInput.value);
            fireProjectile(angle, power);
        }
    } else if (event.code === 'Equal' || event.code === 'NumpadAdd') {
        // Plus key for both regular and numpad
        powerInput.value = Math.min(100, parseFloat(powerInput.value) + powerIncrement);
        draw(); // Redraw to show updated trajectory
    } else if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
        // Minus key for both regular and numpad
        powerInput.value = Math.max(1, parseFloat(powerInput.value) - powerIncrement);
        draw(); // Redraw to show updated trajectory
    } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
        // Change projectile type (cycle through options)
        const currentTypeIndex = projectileTypeSelect.selectedIndex;
        projectileTypeSelect.selectedIndex = (currentTypeIndex + 1) % projectileTypeSelect.options.length;
    }
});

fireButton.addEventListener('click', () => {
    const angle = parseFloat(angleInput.value);
    const power = parseFloat(powerInput.value);
    fireProjectile(angle, power);
});

moveLeftButton.addEventListener('click', () => {
    moveTank(-moveDistance);
});

moveRightButton.addEventListener('click', () => {
    moveTank(moveDistance);
});

playAgainButton.addEventListener('click', () => {
    resetGame();
});

// Main game functions
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGround();
    drawTank(tank1);
    drawTank(tank2);
    drawProjectile();
    drawTrajectoryPreview();
}

function gameLoop() {
    draw();
    updateProjectile();

    requestAnimationFrame(gameLoop);
}

// Initialize game
updateWind();
gameLoop();