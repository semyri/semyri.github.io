const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageDisplay = document.getElementById('message');
const fishDisplay = document.getElementById('fish-display');
const itemDisplay = document.getElementById('item-display');
const newGameButton = document.getElementById('newGameButton'); // Get the new game button
const returnToMainButton = document.getElementById('returnToMainButton'); // Get the return to main page button

// --- Game State ---
const gameState = {
    isOnBoat: false,
    isFishing: false,
    fishingIntervalId: null,
    caughtFish: null,
    caughtItem: null,
    inventory: {
        fish: [],
        items: []
    }
};

// --- Island ---
const island = {
    x: 150,
    y: 100,
    width: 300,
    height: 200,
    color: 'green',
    house: {
        x: 250,
        y: 150,
        width: 50,
        height: 50,
        color: 'brown'
    },
    dock: {
        x: 150,
        y: 280,
        width: 50,
        height: 20,
        color: 'tan'
    }
};

// --- Player ---
const player = {
    x: 200,
    y: 250,
    width: 10,
    height: 10,
    color: 'black',
    speed: 2
};

// --- Boat ---
const boat = {
    x: 100,
    y: 300,
    width: 30,
    height: 15,
    color: 'brown',
    speed: 2
};

// --- Fish Data ---
const fishTypes = [
    { name: "Pufferfish", weightRange: [1, 5], rarity: 0.2, allowedFromShore: true },
    { name: "Clownfish", weightRange: [0.5, 2], rarity: 0.3, allowedFromShore: true },
    { name: "Angelfish", weightRange: [2, 6], rarity: 0.25, allowedFromShore: true },
    { name: "Moorish Idol", weightRange: [3, 8], rarity: 0.1, allowedFromShore: false },
    { name: "Butterflyfish", weightRange: [1, 4], rarity: 0.2, allowedFromShore: true },
    { name: "Royal Gramma", weightRange: [0.8, 3], rarity: 0.25, allowedFromShore: true },
    { name: "Blue Tang", weightRange: [4, 10], rarity: 0.08, allowedFromShore: false },
    { name: "Yellow Tang", weightRange: [3, 7], rarity: 0.12, allowedFromShore: false },
    { name: "Flame Angelfish", weightRange: [2.5, 5.5], rarity: 0.09, allowedFromShore: false },
    { name: "Coral Beauty", weightRange: [2, 5], rarity: 0.1, allowedFromShore: false },
    { name: "Banggai Cardinalfish", weightRange: [1, 3.5], rarity: 0.15, allowedFromShore: false },
    { name: "Mandarin Dragonet", weightRange: [0.5, 2.5], rarity: 0.18, allowedFromShore: false },
    { name: "Spotted Eagle Ray", weightRange: [20, 50], rarity: 0.05, allowedFromShore: false },
    { name: "Manta Ray", weightRange: [30, 70], rarity: 0.03, allowedFromShore: false },
    { name: "Hammerhead Shark", weightRange: [40, 80], rarity: 0.02, allowedFromShore: false },
    { name: "Great White Shark", weightRange: [50, 100], rarity: 0.01, allowedFromShore: false },
    { name: "Whale Shark", weightRange: [60, 120], rarity: 0.005, allowedFromShore: false },
    { name: "Sea Turtle", weightRange: [10, 30], rarity: 0.06, allowedFromShore: false },
    { name: "Octopus", weightRange: [5, 15], rarity: 0.08, allowedFromShore: false },
    { name: "Squid", weightRange: [2, 8], rarity: 0.1, allowedFromShore: false },
    { name: "Jellyfish", weightRange: [1, 5], rarity: 0.15, allowedFromShore: false },
    { name: "Seahorse", weightRange: [0.2, 1], rarity: 0.12, allowedFromShore: true },
    { name: "Starfish", weightRange: [0.5, 2], rarity: 0.1, allowedFromShore: true },
    { name: "Sea Anemone", weightRange: [1, 4], rarity: 0.12, allowedFromShore: true },
    { name: "Sea Urchin", weightRange: [0.5, 2.5], rarity: 0.15, allowedFromShore: false },
    { name: "Lobster", weightRange: [5, 12], rarity: 0.08, allowedFromShore: false },
    { name: "Crab", weightRange: [2, 6], rarity: 0.15, allowedFromShore: true },
    { name: "Shrimp", weightRange: [0.5, 2], rarity: 0.2, allowedFromShore: true },
    { name: "Oyster", weightRange: [1, 3], rarity: 0.1, allowedFromShore: false },
    { name: "Clam", weightRange: [1, 4], rarity: 0.12, allowedFromShore: true },
    { name: "Scallop", weightRange: [2, 5], rarity: 0.1, allowedFromShore: false },
    { name: "Dolphin", weightRange: [15, 40], rarity: 0.04, allowedFromShore: false },
    { name: "Seal", weightRange: [20, 50], rarity: 0.05, allowedFromShore: false },
    { name: "Penguin", weightRange: [5, 10], rarity: 0.07, allowedFromShore: false },
    { name: "Swordfish", weightRange: [25, 60], rarity: 0.02, allowedFromShore: false },
    { name: "Tuna", weightRange: [30, 70], rarity: 0.02, allowedFromShore: false },
    { name: "Marlin", weightRange: [35, 80], rarity: 0.01, allowedFromShore: false },
    { name: "Sailfish", weightRange: [20, 50], rarity: 0.03, allowedFromShore: false },
    { name: "Barracuda", weightRange: [10, 25], rarity: 0.05, allowedFromShore: false },
    { name: "Grouper", weightRange: [15, 35], rarity: 0.04, allowedFromShore: false },
    { name: "Snapper", weightRange: [8, 20], rarity: 0.06, allowedFromShore: false },
    { name: "Red Snapper", weightRange: [12, 28], rarity: 0.05, allowedFromShore: false },
    { name: "Lionfish", weightRange: [3, 7], rarity: 0.08, allowedFromShore: false },
    { name: "Eel", weightRange: [5, 15], rarity: 0.1, allowedFromShore: false },
    { name: "Moray Eel", weightRange: [8, 20], rarity: 0.08, allowedFromShore: false },
    { name: "Electric Eel", weightRange: [10, 25], rarity: 0.07, allowedFromShore: false },
    { name: "Catfish", weightRange: [5, 12], rarity: 0.12, allowedFromShore: true },
    { name: "Stingray", weightRange: [10, 25], rarity: 0.06, allowedFromShore: false },
    { name: "Flounder", weightRange: [3, 8], rarity: 0.1, allowedFromShore: true },
    { name: "Halibut", weightRange: [10, 25], rarity: 0.08, allowedFromShore: false }
];

// --- Item Data ---
const itemTypes = [
    { name: "Fishing Boots", rarity: 0.1 },
    { name: "Fishing Hat", rarity: 0.1 },
    { name: "Message in a Bottle", rarity: 0.05 },
    { name: "Old Tire", rarity: 0.2 },
    { name: "Rusty Can", rarity: 0.2 },
    { name: "Seaweed", rarity: 0.3 },
    { name: "Driftwood", rarity: 0.15 },
    { name: "Anchor", rarity: 0.02 }
];

// --- Drawing Functions ---
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawIsland() {
    drawRect(island.x, island.y, island.width, island.height, island.color);
    drawRect(island.house.x, island.house.y, island.house.width, island.house.height, island.house.color);
    drawRect(island.dock.x, island.dock.y, island.dock.width, island.dock.height, island.dock.color);
}

function drawFish(fish) {
    if (!fish) return;

    const scale = 0.5; // Adjust scale for visibility
    const fishX = canvas.width / 2 - (fish.width * scale) / 2;
    const fishY = canvas.height / 2 - (fish.height * scale) / 2;

    ctx.fillStyle = fish.color || '#FF5733';
    ctx.beginPath();
    ctx.ellipse(fishX + (fish.width * scale) / 2, fishY + (fish.height * scale) / 2, (fish.width * scale) / 2, (fish.height * scale) / 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(fishX, fishY + (fish.height * scale) / 2);
    ctx.lineTo(fishX - (fish.width * scale) / 4, fishY + (fish.height * scale) / 4);
    ctx.lineTo(fishX - (fish.width * scale) / 4, fishY + (fish.height * scale) * 3 / 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(fishX + (fish.width * scale) * 3 / 4, fishY + (fish.height * scale) / 4, (fish.width * scale) / 20, 0, 2 * Math.PI);
    ctx.fill();
}

// --- Inventory Management ---
function updateInventoryDisplay() {
    fishDisplay.innerHTML = '<h4>Fish Trophies</h4>';
    itemDisplay.innerHTML = '<h4>Closet Items</h4>';

    gameState.inventory.fish.forEach(fish => {
        const fishElement = document.createElement('div');
        fishElement.classList.add('inventory-item', 'fish-trophy');
        fishElement.textContent = `${fish.name} (${fish.weight} lbs)`;
        fishDisplay.appendChild(fishElement);
    });

    gameState.inventory.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('inventory-item', 'item-icon');
        itemElement.textContent = item.name;
        itemDisplay.appendChild(itemElement);
    });
}

function addFishToInventory(fish) {
    const existingFishIndex = gameState.inventory.fish.findIndex(f => f.name === fish.name);
    if (existingFishIndex > -1) {
        if (fish.weight > gameState.inventory.fish[existingFishIndex].weight) {
            gameState.inventory.fish[existingFishIndex] = fish;
        }
    } else {
        gameState.inventory.fish.push(fish);
    }
    updateInventoryDisplay();
}

function addItemToInventory(item) {
    gameState.inventory.items.push(item);
    updateInventoryDisplay();
}

// --- Fishing Logic ---
function getRandomFish(fromShore = false) {
    const availableFish = fromShore ? fishTypes.filter(fish => fish.allowedFromShore) : fishTypes;

    // Normalize rarities for available fish
    const totalRarity = availableFish.reduce((sum, fish) => sum + fish.rarity, 0);
    const normalizedFish = availableFish.map(fish => ({
        ...fish,
        normalizedRarity: fish.rarity / totalRarity
    }));

    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const fish of normalizedFish) {
        cumulativeProbability += fish.normalizedRarity;
        if (rand <= cumulativeProbability) {
            const weight = Math.floor(Math.random() * (fish.weightRange[1] - fish.weightRange[0] + 1)) + fish.weightRange[0];
            return { ...fish, weight };
        }
    }
    return null;
}

function getRandomItem() {
    // Normalize rarities for items
    const totalRarity = itemTypes.reduce((sum, item) => sum + item.rarity, 0);
    const normalizedItems = itemTypes.map(item => ({
        ...item,
        normalizedRarity: item.rarity / totalRarity
    }));

    const rand = Math.random();
    let cumulativeProbability = 0;
    for (const item of normalizedItems) {
        cumulativeProbability += item.normalizedRarity;
        if (rand <= cumulativeProbability) {
            return { ...item };
        }
    }
    return null;
}

function startFishing(fromShore = false) {
    gameState.isFishing = true;
    messageDisplay.textContent = 'Fishing...';

    // Use a stored interval ID to allow stopping the fishing animation
    gameState.fishingIntervalId = setInterval(() => {
        const randomFish = getRandomFish(fromShore);
        if (randomFish) {
            gameState.caughtFish = randomFish;
            drawFish(randomFish);
        } else {
            gameState.caughtFish = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawIsland();
            if (gameState.isOnBoat) {
                drawRect(boat.x, boat.y, boat.width, boat.height, boat.color);
            }
            drawRect(player.x, player.y, player.width, player.height, player.color);
        }
    }, 100);

    setTimeout(() => {
        clearInterval(gameState.fishingIntervalId); // Clear the interval using the stored ID
        gameState.fishingIntervalId = null; // Reset the interval ID
        gameState.isFishing = false;

        // Only catch something if the fishing process was not interrupted
        if (gameState.caughtFish) {
            messageDisplay.textContent = `You caught a ${gameState.caughtFish.name} (${gameState.caughtFish.weight} lbs)!`;
            addFishToInventory(gameState.caughtFish);
            gameState.caughtFish = null;
        } else if (!gameState.playerMovedDuringFishing) { // Check the flag here
            const randomItem = getRandomItem();
            if (randomItem) {
                messageDisplay.textContent = `You found ${randomItem.name}!`;
                addItemToInventory(randomItem);
                gameState.caughtItem = null;
            } else {
                messageDisplay.textContent = 'Nothing caught.';
            }
        }

        gameState.playerMovedDuringFishing = false; // Reset the flag
    }, 3000);
}

// --- Game Logic ---
function isPositionOnLand(x, y, width, height) {
    const isInsideIsland = (
        x < island.x + island.width &&
        x + width > island.x &&
        y < island.y + island.height &&
        y + height > island.y
    );

    return isInsideIsland;
}

function stopFishing() {
    if (gameState.isFishing) {
        clearInterval(gameState.fishingIntervalId);
        gameState.isFishing = false;
        gameState.fishingIntervalId = null;
        gameState.caughtFish = null; // Reset caught fish
        gameState.caughtItem = null; // Reset caught item
        messageDisplay.textContent = 'Stopped fishing.';
        gameState.playerMovedDuringFishing = true; // Set the flag
    }
}

function updatePlayerPosition(keys) {
    if (gameState.isFishing && (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown)) {
        stopFishing();
        gameState.playerMovedDuringFishing = true; // Player moved, set the flag
    } else {
        gameState.playerMovedDuringFishing = false; // Reset the flag if no movement
    }

    let playerMoved = false;

    if (!gameState.isOnBoat) {
        // Walking on land
        let newX = player.x;
        let newY = player.y;

        if (keys.ArrowLeft) { newX -= player.speed; playerMoved = true; }
        if (keys.ArrowRight) { newX += player.speed; playerMoved = true; }
        if (keys.ArrowUp) { newY -= player.speed; playerMoved = true; }
        if (keys.ArrowDown) { newY += player.speed; playerMoved = true; }

        if (newX >= 0 && newX + player.width <= canvas.width &&
            newY >= 0 && newY + player.height <= canvas.height &&
            isPositionOnLand(newX, newY, player.width, player.height)) {
            player.x = newX;
            player.y = newY;
        }

        // Check for dock collision
        if (checkCollision(player, island.dock)) {
            messageDisplay.textContent = "Press 'B' to board the boat";
        } else if (!gameState.isFishing) {
            messageDisplay.textContent = "";
        }
    } else {
        // Moving the boat
        let newX = boat.x;
        let newY = boat.y;

        if (keys.ArrowLeft) { newX -= boat.speed; playerMoved = true; }
        if (keys.ArrowRight) { newX += boat.speed; playerMoved = true; }
        if (keys.ArrowUp) { newY -= boat.speed; playerMoved = true; }
        if (keys.ArrowDown) { newY += boat.speed; playerMoved = true; }

        if (newX >= 0 && newX + boat.width <= canvas.width &&
            newY >= 0 && newY + boat.height <= canvas.height &&
            !isPositionOnLand(newX, newY, boat.width, boat.height)) {
            boat.x = newX;
            boat.y = newY;
            player.x = boat.x + boat.width / 2 - player.width / 2;
            player.y = boat.y + boat.height / 2 - player.height / 2;
        }
    }

    // Update fishing state based on player movement
    if (gameState.isFishing && playerMoved) {
        stopFishing();
    }
}

function isBoatNearDock() {
    // Check if the boat is within a certain distance of the dock
    const distanceThreshold = 35; // Define the maximum distance for unboarding
    const distance = Math.hypot(boat.x + boat.width / 2 - (island.dock.x + island.dock.width / 2),
                                boat.y + boat.height / 2 - (island.dock.y + island.dock.height / 2));

    return distance <= distanceThreshold;
}

// Function to reset the game state
function resetGame() {
    // Reset game state variables
    gameState.isOnBoat = false;
    gameState.isFishing = false;
    gameState.fishingIntervalId = null;
    gameState.caughtFish = null;
    gameState.caughtItem = null;
    gameState.inventory.fish = [];
    gameState.inventory.items = [];

    // Reset player and boat positions
    player.x = 200;
    player.y = 250;
    boat.x = 100;
    boat.y = 300;

    // Clear any displayed messages
    messageDisplay.textContent = '';

    // Update the inventory display
    updateInventoryDisplay();

    // Optionally, clear local storage to start fresh
    localStorage.removeItem('islandGameState');

    // Redraw the game
    gameLoop();
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y;
}

// --- Controls ---
let keys = {};
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;

    if (event.key === 'b' || event.key === 'B') {
        if (!gameState.isOnBoat && checkCollision(player, island.dock)) {
            // Board the boat only if not already on the boat and near the dock
            gameState.isOnBoat = true;
            player.x = boat.x + boat.width / 2 - player.width / 2;
            player.y = boat.y + boat.height / 2 - player.height / 2;
            messageDisplay.textContent = "Press 'B' to get off the boat, Press 'F' to fish";
        } else if (gameState.isOnBoat && isBoatNearDock()) {
            // Get off the boat only if near the dock
            gameState.isOnBoat = false;
            player.x = island.dock.x + island.dock.width / 2 - player.width / 2; // Set player position near the dock
            player.y = island.dock.y - player.height; // Set player position above the dock
            messageDisplay.textContent = "";
        }
    }

    if (event.key === 'f' || event.key === 'F') {
        if (!gameState.isFishing) {
            const isNearShore = !gameState.isOnBoat;
            startFishing(isNearShore);
        }
    }
    event.preventDefault();
});

function isNearShore() {
    const shoreDistanceThreshold = 20; // Define how close to the shore is considered "near"

    // Check if any part of the player is close to the shore
    const isNearShore = (
        player.x + player.width > island.x - shoreDistanceThreshold &&
        player.x < island.x + island.width + shoreDistanceThreshold &&
        player.y + player.height > island.y - shoreDistanceThreshold &&
        player.y < island.y + island.height + shoreDistanceThreshold
    );

    return isNearShore;
}

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// --- Save and Load ---
function saveGame() {
    localStorage.setItem('islandGameState', JSON.stringify(gameState));
    console.log("Game saved!");
}

function loadGame() {
    const savedState = JSON.parse(localStorage.getItem('islandGameState'));
    if (savedState) {
        // Update the current gameState with the saved state
        Object.assign(gameState, savedState); // Use Object.assign for a simple merge
        updateInventoryDisplay();
        console.log("Game loaded!");
    }
}

// --- Game Loop ---
function gameLoop() {
    updatePlayerPosition(keys);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    drawIsland();
    if (!gameState.isOnBoat) {
        drawRect(player.x, player.y, player.width, player.height, player.color);
    } else {
        drawRect(boat.x, boat.y, boat.width, boat.height, boat.color);
        drawRect(player.x, player.y, player.width, player.height, player.color);
    }

    // Draw the currently displayed fish
    if (gameState.isFishing && gameState.caughtFish) {
        drawFish(gameState.caughtFish);
    }

    requestAnimationFrame(gameLoop);
}

// Load the game if a save state exists
loadGame();

// Initialize and start the game
updateInventoryDisplay();
gameLoop();

// Save the game periodically (e.g., every 30 seconds)
setInterval(saveGame, 30000);

// Event listeners for the new buttons
newGameButton.addEventListener('click', () => {
    // Reset the game state
    resetGame();
});

returnToMainButton.addEventListener('click', () => {
    // Redirect to the main page
    window.location.href = 'index.html';
});