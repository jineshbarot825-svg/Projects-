// Canvas and Context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballSize = 8;

const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0,
    speed: 6
};

const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0,
    speed: 4
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 5,
    dy: 5,
    size: ballSize,
    maxSpeed: 7
};

// Game State
let gameRunning = false;
let gameStarted = false;

// Input Handling
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    w: false,
    s: false
};

let mouseY = canvas.height / 2;

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
        e.preventDefault();
        toggleGameState();
    }
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
    if (e.key === 'ArrowUp') {
        keys.ArrowUp = true;
        e.preventDefault();
    }
    if (e.key === 'ArrowDown') {
        keys.ArrowDown = true;
        e.preventDefault();
    }
    if (e.key === 'w' || e.key === 'W') {
        keys.w = true;
    }
    if (e.key === 's' || e.key === 'S') {
        keys.s = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
        keys.ArrowUp = false;
    }
    if (e.key === 'ArrowDown') {
        keys.ArrowDown = false;
    }
    if (e.key === 'w' || e.key === 'W') {
        keys.w = false;
    }
    if (e.key === 's' || e.key === 'S') {
        keys.s = false;
    }
});

document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Toggle Game State
function toggleGameState() {
    if (!gameStarted) {
        gameStarted = true;
        gameRunning = true;
        updateGameStatus();
        gameLoop();
    } else {
        gameRunning = !gameRunning;
        updateGameStatus();
    }
}

// Update Game Status Display
function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!gameStarted) {
        statusElement.textContent = 'Press SPACE to Start';
    } else if (gameRunning) {
        statusElement.textContent = 'Game Running';
    } else {
        statusElement.textContent = 'Game Paused';
    }
}

// Reset Game
function resetGame() {
    gameRunning = false;
    gameStarted = false;
    player.score = 0;
    computer.score = 0;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = 5;
    ball.dy = 5;
    player.y = canvas.height / 2 - paddleHeight / 2;
    computer.y = canvas.height / 2 - paddleHeight / 2;
    updateScores();
    updateGameStatus();
    draw();
}

// Update Player Paddle
function updatePlayer() {
    // Mouse control
    if (mouseY - paddleHeight / 2 > 0 && mouseY + paddleHeight / 2 < canvas.height) {
        player.y = mouseY - paddleHeight / 2;
    }

    // Keyboard control (overrides mouse if pressed)
    if (keys.ArrowUp || keys.w) {
        player.y -= player.speed;
    }
    if (keys.ArrowDown || keys.s) {
        player.y += player.speed;
    }

    // Boundary collision
    if (player.y < 0) {
        player.y = 0;
    }
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

// Update Computer Paddle (AI)
function updateComputer() {
    const computerCenter = computer.y + computer.height / 2;
    const difficulty = 0.15; // Difficulty factor (0-1, higher = easier to beat)

    // AI follows the ball with some imperfection
    if (computerCenter < ball.y - 35 && Math.random() > difficulty) {
        computer.y += computer.speed;
    } else if (computerCenter > ball.y + 35 && Math.random() > difficulty) {
        computer.y -= computer.speed;
    }

    // Boundary collision
    if (computer.y < 0) {
        computer.y = 0;
    }
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

// Update Ball
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.size, Math.min(canvas.height - ball.size, ball.y));
    }

    // Left and right wall collision (score)
    if (ball.x - ball.size < 0) {
        computer.score++;
        resetBall();
        updateScores();
    } else if (ball.x + ball.size > canvas.width) {
        player.score++;
        resetBall();
        updateScores();
    }

    // Player paddle collision
    if (
        ball.x - ball.size < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = Math.abs(ball.dx);
        ball.x = player.x + player.width + ball.size;

        // Add spin based on where the ball hits the paddle
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy += hitPos * 3;

        // Limit ball speed
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > ball.maxSpeed) {
            ball.dx = (ball.dx / speed) * ball.maxSpeed;
            ball.dy = (ball.dy / speed) * ball.maxSpeed;
        }
    }

    // Computer paddle collision
    if (
        ball.x + ball.size > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = computer.x - ball.size;

        // Add spin based on where the ball hits the paddle
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy += hitPos * 3;

        // Limit ball speed
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        if (speed > ball.maxSpeed) {
            ball.dx = (ball.dx / speed) * ball.maxSpeed;
            ball.dy = (ball.dy / speed) * ball.maxSpeed;
        }
    }
}

// Reset Ball to Center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 4;
    const speed = 5;
    ball.dx = Math.random() > 0.5 ? speed * Math.cos(angle) : -speed * Math.cos(angle);
    ball.dy = speed * Math.sin(angle);
}

// Update Scores Display
function updateScores() {
    document.getElementById('playerScore').textContent = player.score;
    document.getElementById('computerScore').textContent = computer.score;
}

// Draw Functions
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#00ff88';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    drawPaddle(player, '#00ff88');
    drawPaddle(computer, '#ff00ff');

    // Draw ball
    drawBall();
}

function drawPaddle(paddle, color) {
    ctx.fillStyle = color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
}

// Game Loop
function gameLoop() {
    if (!gameRunning) {
        draw();
        setTimeout(gameLoop, 1000 / 60);
        return;
    }

    updatePlayer();
    updateComputer();
    updateBall();
    draw();

    setTimeout(gameLoop, 1000 / 60);
}

// Initialize
updateScores();
updateGameStatus();
draw();
gameLoop();
