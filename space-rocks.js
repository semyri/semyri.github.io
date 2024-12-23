const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

// Game Variables
let score = 0;
let lives = 3;
let isGameOver = false;
let isPaused = false; // Add a pause state

// --- Helper Functions ---

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Ship Object ---
const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    angle: 0,  // Angle in radians
    rotationSpeed: 0.1, // Radians per frame
    thrust: 0.1,
    friction: 0.99, // Slight friction to slow down
    velocityX: 0,
    velocityY: 0,
    isThrusting: false,

    draw: function() {
        ctx.save(); // Save the current drawing state

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw the ship as a triangle
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius * 0.7);
        ctx.lineTo(-this.radius, this.radius * 0.7);
        ctx.closePath();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw thruster flame if thrusting
        if (this.isThrusting) {
            ctx.beginPath();
            ctx.moveTo(-this.radius, -this.radius * 0.3);
            ctx.lineTo(-this.radius * 1.8, 0);
            ctx.lineTo(-this.radius, this.radius * 0.3);
            ctx.closePath();

            ctx.fillStyle = 'orange';
            ctx.fill();
        }

        ctx.restore(); // Restore the previous drawing state
    },

    update: function() {
        // Rotate the ship
        if (keys.left) {
            this.angle -= this.rotationSpeed;
        }
        if (keys.right) {
            this.angle += this.rotationSpeed;
        }

        // Apply thrust
        if (keys.up) {
            this.isThrusting = true;
            this.velocityX += this.thrust * Math.cos(this.angle);
            this.velocityY += this.thrust * Math.sin(this.angle);
        } else {
            this.isThrusting = false;
        }

        // Apply friction
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;

        // Move the ship
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Wrap around screen edges
        if (this.x > canvas.width + this.radius) {
            this.x = -this.radius;
        } else if (this.x < -this.radius) {
            this.x = canvas.width + this.radius;
        }
        if (this.y > canvas.height + this.radius) {
            this.y = -this.radius;
        } else if (this.y < -this.radius) {
            this.y = canvas.height + this.radius;
        }
    }
};

// --- Bullet Object ---
function Bullet(x, y, angle) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.speed = 8;
    this.velocityX = this.speed * Math.cos(angle);
    this.velocityY = this.speed * Math.sin(angle);
    this.life = 60; // Frames the bullet lives
}

Bullet.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
};

Bullet.prototype.update = function() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.life--;
};

let bullets = [];

// --- Asteroid Object ---
function Asteroid(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = 2;
    this.angle = Math.random() * Math.PI * 2; // Random direction
    this.velocityX = this.speed * Math.cos(this.angle);
    this.velocityY = this.speed * Math.sin(this.angle);
}

Asteroid.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
};

Asteroid.prototype.update = function() {
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Wrap around screen edges
    if (this.x > canvas.width + this.radius) {
        this.x = -this.radius;
    } else if (this.x < -this.radius) {
        this.x = canvas.width + this.radius;
    }
    if (this.y > canvas.height + this.radius) {
        this.y = -this.radius;
    } else if (this.y < -this.radius) {
        this.y = canvas.height + this.radius;
    }
};

let asteroids = [];

// --- Initialize Game ---

function createAsteroids(numAsteroids) {
    for (let i = 0; i < numAsteroids; i++) {
        let x, y, radius;
        do {
            // Ensure asteroids don't spawn on top of the ship
            x = getRandomInt(0, canvas.width);
            y = getRandomInt(0, canvas.height);
            radius = getRandomInt(30, 60);
        } while (distance(ship.x, ship.y, x, y) < ship.radius + radius + 50);

        asteroids.push(new Asteroid(x, y, radius));
    }
}

function initGame() {
    score = 0;
    lives = 3;
    isGameOver = false;
    asteroids = [];
    bullets = [];

    createAsteroids(5); // Start with 5 asteroids
    updateScoreAndLives();
}

// --- Game Loop ---

function gameLoop() {
    if (isGameOver || isPaused) {
        return; // Stop updating if game is over or paused
    }

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

function update() {
    ship.update();

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();
        if (bullets[i].life <= 0) {
            bullets.splice(i, 1);
        }
    }

    // Update asteroids
    for (let asteroid of asteroids) {
        asteroid.update();
    }

    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ship.draw();

    for (let bullet of bullets) {
        bullet.draw();
    }

    for (let asteroid of asteroids) {
        asteroid.draw();
    }
}

// --- Collision Detection ---

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkCollisions() {
    // Ship-Asteroid Collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        if (distance(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.radius + asteroids[i].radius) {
            // Collision!
            lives--;
            updateScoreAndLives();

            // Reset ship position and clear velocity
            ship.x = canvas.width / 2;
            ship.y = canvas.height / 2;
            ship.velocityX = 0;
            ship.velocityY = 0;

            // Remove the asteroid
            asteroids.splice(i, 1);

            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    }

    // Bullet-Asteroid Collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (distance(bullets[i].x, bullets[i].y, asteroids[j].x, asteroids[j].y) < bullets[i].radius + asteroids[j].radius) {
                // Bullet hit!

                // Break asteroid into smaller ones
                if (asteroids[j].radius > 20) {
                    asteroids.push(new Asteroid(asteroids[j].x, asteroids[j].y, asteroids[j].radius / 2));
                    asteroids.push(new Asteroid(asteroids[j].x, asteroids[j].y, asteroids[j].radius / 2));
                }

                // Remove bullet and asteroid
                bullets.splice(i, 1);
                asteroids.splice(j, 1);

                // Increase score
                score += 10;
                updateScoreAndLives();
                break; // Bullet can only hit one asteroid
            }
        }
    }

    // Create new asteroids if none left
    if (asteroids.length === 0) {
        createAsteroids(5);
    }
}

// --- Game Over ---

function gameOver() {
    isGameOver = true;
    ctx.fillStyle = 'white';
    ctx.font = '48px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
}

// --- Event Listeners ---

const keys = {
    left: false,
    right: false,
    up: false,
    space: false
};

document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') {
        keys.left = true;
    } else if (event.code === 'ArrowRight') {
        keys.right = true;
    } else if (event.code === 'ArrowUp') {
        keys.up = true;
    } else if (event.code === 'Space') {
        keys.space = true;
        // Shoot a bullet
        bullets.push(new Bullet(ship.x + ship.radius * Math.cos(ship.angle), ship.y + ship.radius * Math.sin(ship.angle), ship.angle));
    } else if (event.code === 'KeyP') { // Pause the game
        isPaused = !isPaused;
        if (!isPaused) {
            gameLoop(); // Resume game loop if unpaused
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') {
        keys.left = false;
    } else if (event.code === 'ArrowRight') {
        keys.right = false;
    } else if (event.code === 'ArrowUp') {
        keys.up = false;
    } else if (event.code === 'Space') {
        keys.space = false;
    }
});

// --- Update Score and Lives Display ---

function updateScoreAndLives() {
    scoreElement.textContent = 'Score: ' + score;
    livesElement.textContent = 'Lives: ' + lives;
}

// --- Start the Game ---

initGame();
gameLoop();