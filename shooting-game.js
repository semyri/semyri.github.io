const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');

// Game States
const GAME_STATE = {
    MENU: 'menu',
    RUNNING: 'running',
    GAME_OVER: 'game_over'
};

// Game Variables
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let targetsMissed = 0;
let maxTargetsMissed = 3;
let gameState = GAME_STATE.MENU;
let targetInterval;
let explosions = [];

// Player Object
const player = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    speed: 0,
    maxSpeed: 4,
    acceleration: 0.3,
    deceleration: 0.2,
    color: 'blue',
    rapidFire: false,
    rapidFireEndTime: 0
};

// Movement Variables
let isMovingLeft = false;
let isMovingRight = false;

// Projectiles and Targets Arrays
let projectiles = [];
let targets = [];

// Target Parameters
const targetParams = {
    size: 30,
    baseSpeed: 1,
    speedIncrease: 0.05,
    maxSpeed: 4,
    interval: 2000
};

// Power-up Parameters
const powerUpParams = {
    size: 20,
    chance: 0.1, // 10% chance to spawn a power-up
    duration: 5000, // 5 seconds in milliseconds
    color: 'yellow'
};
let powerUps = [];

// Explosion parameters
const explosionParams = {
    maxRadius: 30,
    duration: 30 // Number of frames the explosion lasts
};

// Web Audio API Setup for Sound Effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Simple envelope to prevent clicks
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration - 0.01);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- Functions ---

function initGame() {
    // Initialize player position and other game state variables
    resetGame();

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Start the game loop
    gameLoop();
}

function handleKeyDown(event) {
    if (gameState === GAME_STATE.RUNNING) {
        if (event.key === 'ArrowLeft') {
            isMovingLeft = true;
            isMovingRight = false;
        } else if (event.key === 'ArrowRight') {
            isMovingRight = true;
            isMovingLeft = false;
        } else if (event.key === ' ') {
            if (player.rapidFire) {
                rapidFireShoot();
            } else {
                shoot();
            }
        }
    } else if (gameState === GAME_STATE.MENU || gameState === GAME_STATE.GAME_OVER) {
        if (event.key === 'Enter') {
            resetGame();
            startGame();
        }
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowLeft') {
        isMovingLeft = false;
    } else if (event.key === 'ArrowRight') {
        isMovingRight = false;
    }
}

function startGame() {
    gameState = GAME_STATE.RUNNING;
    targetInterval = setInterval(createTarget, targetParams.interval);
    updateHighScoreDisplay();
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.fillStyle = 'red';
        ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    });
}

function drawTargets() {
    targets.forEach(target => {
        ctx.fillStyle = 'green';
        ctx.fillRect(target.x, target.y, target.width, target.height);
    });
}

function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 0,
        alpha: 1,
        duration: explosionParams.duration
    });
}

function drawExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        let explosion = explosions[i];
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 165, 0, ${explosion.alpha})`; // Orange color with fading alpha
        ctx.fill();

        explosion.radius += explosionParams.maxRadius / explosionParams.duration;
        explosion.alpha -= 1 / explosionParams.duration;

        if (explosion.duration <= 0) {
            explosions.splice(i, 1);
        } else {
            explosion.duration--;
        }
    }
}

function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.y -= projectile.speed;
        if (projectile.y < 0) {
            projectiles.splice(index, 1);
        }
    });
}

function updateTargets() {
    for (let i = targets.length - 1; i >= 0; i--) {
        targets[i].y += targets[i].speed;
        if (targets[i].y > canvas.height) {
            targets.splice(i, 1);
            targetsMissed++;
            if (targetsMissed >= maxTargetsMissed) {
                gameOver();
            }
        }
    }
}

function createTarget() {
    if (gameState === GAME_STATE.RUNNING) {
        let x = Math.random() * (canvas.width - targetParams.size);
        let y = -targetParams.size;
        let speed = Math.min(targetParams.baseSpeed + score * targetParams.speedIncrease, targetParams.maxSpeed);
        targets.push({
            x: x,
            y: y,
            width: targetParams.size,
            height: targetParams.size,
            speed: speed
        });

        // Randomly create power-ups
        if (Math.random() < powerUpParams.chance) {
            createPowerUp(x, y);
        }
    }
}

function createPowerUp(x, y) {
    powerUps.push({
        x: x,
        y: y,
        width: powerUpParams.size,
        height: powerUpParams.size,
        color: powerUpParams.color,
        type: 'rapidFire', // Currently, only one type of power-up
        speed: 2
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });
}

function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

function checkCollision() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        for (let j = targets.length - 1; j >= 0; j--) {
            if (projectiles[i].x < targets[j].x + targets[j].width &&
                projectiles[i].x + projectiles[i].width > targets[j].x &&
                projectiles[i].y < targets[j].y + targets[j].height &&
                projectiles[i].y + projectiles[i].height > targets[j].y) {

                // Create explosion
                createExplosion(targets[j].x + targets[j].width / 2, targets[j].y + targets[j].height / 2);

                projectiles.splice(i, 1);
                targets.splice(j, 1);
                score++;
                scoreDisplay.textContent = "Score: " + score;

                // Play hit sound
                playSound(150, 0.1, 'square'); // Example: 150Hz, 0.1s, square wave

                break;
            }
        }
    }

    // Check collision with power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (player.x < powerUps[i].x + powerUps[i].width &&
            player.x + player.width > powerUps[i].x &&
            player.y < powerUps[i].y + powerUps[i].height &&
            player.y + player.height > powerUps[i].y) {

            if (powerUps[i].type === 'rapidFire') {
                player.rapidFire = true;
                player.rapidFireEndTime = Date.now() + powerUpParams.duration;
            }

            powerUps.splice(i, 1);

            // Play power-up sound
            playSound(440, 0.2); // Example: 440Hz, 0.2s, sine wave
        }
    }
}

function updatePlayer() {
    // Handle rapid fire
    if (player.rapidFire && Date.now() > player.rapidFireEndTime) {
        player.rapidFire = false;
    }

    if (isMovingLeft && player.speed > -player.maxSpeed) {
        player.speed -= player.acceleration;
    } else if (isMovingRight && player.speed < player.maxSpeed) {
        player.speed += player.acceleration;
    } else {
        if (player.speed > 0) {
            player.speed -= player.deceleration;
        } else if (player.speed < 0) {
            player.speed += player.deceleration;
        }

        if (Math.abs(player.speed) < player.deceleration) {
            player.speed = 0;
        }
    }

    player.x += player.speed;

    if (player.x < 0) {
        player.x = 0;
        player.speed = 0;
    } else if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
        player.speed = 0;
    }
}

function drawMenu() {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press Enter to Start', canvas.width / 2, canvas.height / 2);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over! Score: ' + score, canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillText('Targets Missed: ' + targetsMissed, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 40);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === GAME_STATE.RUNNING) {
        drawPlayer();
        drawProjectiles();
        drawTargets();
        drawPowerUps(); // Draw power-ups
        drawExplosions();
        updateProjectiles();
        updateTargets();
        updatePowerUps();
        checkCollision();
        updatePlayer();
    } else if (gameState === GAME_STATE.MENU) {
        drawMenu();
    } else if (gameState === GAME_STATE.GAME_OVER) {
        drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    clearInterval(targetInterval);

    // Update high score if the current score is higher
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScoreDisplay();
    }

    // Play game over sound
    playSound(100, 0.5, 'triangle'); // Example: 100Hz, 0.5s, triangle wave
}

function shoot() {
    projectiles.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speed: 5
    });

    playSound(220, 0.1); // Example: 220Hz, 0.1s, sine wave
}

function rapidFireShoot() {
    projectiles.push({
        x: player.x + player.width / 2 - 2.5,
        y: player.y,
        width: 5,
        height: 10,
        speed: 5
    });

    // Play rapid-fire sound (higher frequency for a different effect)
    playSound(330, 0.05); // Example: 330Hz, 0.05s, sine wave
}

function updateHighScoreDisplay() {
    highScoreDisplay.textContent = "High Score: " + highScore;
}

function resetGame() {
    score = 0;
    targetsMissed = 0;
    projectiles = [];
    targets = [];
    powerUps = [];
    explosions = [];
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 60;
    player.speed = 0;
    isMovingLeft = false;
    isMovingRight = false;
    scoreDisplay.textContent = "Score: " + score;
    targetParams.baseSpeed = 1;
}

// Event listeners for buttons
const newGameButton = document.getElementById('newGameButton');
const backToMainButton = document.getElementById('backToMainButton');

newGameButton.addEventListener('click', function() {
    if (gameState === GAME_STATE.GAME_OVER || gameState === GAME_STATE.MENU) {
        resetGame();
        startGame();
    }
});

// Initialize and start the game
initGame();