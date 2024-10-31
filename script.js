const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

const GAME_CONFIG = {
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
    GAME_SPEED: 5,
    OBSTACLE_SPAWN_RATE: 0.02,
    GROUND_HEIGHT: 50,
    HEART_SPAWN_RATE: 0.005,
    MAX_LIVES: 9,
    INVINCIBLE_TIME: 2000
};

function createPigImage() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 60;
    tempCanvas.height = 60;
    
    // 耳朵
    tempCtx.fillStyle = '#ffb6c1';
    tempCtx.beginPath();
    tempCtx.ellipse(15, 15, 8, 12, -Math.PI/4, 0, Math.PI * 2);
    tempCtx.fill();
    tempCtx.beginPath();
    tempCtx.ellipse(45, 15, 8, 12, Math.PI/4, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 身体
    tempCtx.fillStyle = '#ffd1dc';
    tempCtx.beginPath();
    tempCtx.arc(30, 30, 25, 0, Math.PI * 2);
    tempCtx.fill();

    // 腮红
    tempCtx.fillStyle = '#ffb6c1';
    tempCtx.beginPath();
    tempCtx.arc(15, 35, 8, 0, Math.PI * 2);
    tempCtx.arc(45, 35, 8, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 眼睛
    tempCtx.fillStyle = 'white';
    tempCtx.beginPath();
    tempCtx.arc(20, 25, 6, 0, Math.PI * 2);
    tempCtx.arc(40, 25, 6, 0, Math.PI * 2);
    tempCtx.fill();
    
    tempCtx.fillStyle = 'black';
    tempCtx.beginPath();
    tempCtx.arc(21, 25, 3, 0, Math.PI * 2);
    tempCtx.arc(41, 25, 3, 0, Math.PI * 2);
    tempCtx.fill();
    
    tempCtx.fillStyle = 'white';
    tempCtx.beginPath();
    tempCtx.arc(22, 23, 1.5, 0, Math.PI * 2);
    tempCtx.arc(42, 23, 1.5, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 鼻子
    tempCtx.fillStyle = '#ff9999';
    tempCtx.beginPath();
    tempCtx.ellipse(30, 32, 7, 5, 0, 0, Math.PI * 2);
    tempCtx.fill();
    
    tempCtx.fillStyle = '#ffb6c1';
    tempCtx.beginPath();
    tempCtx.ellipse(28, 31, 2, 1.5, Math.PI/4, 0, Math.PI * 2);
    tempCtx.fill();

    // 微笑
    tempCtx.strokeStyle = '#ff7777';
    tempCtx.lineWidth = 2;
    tempCtx.beginPath();
    tempCtx.arc(30, 32, 12, 0.1 * Math.PI, 0.9 * Math.PI);
    tempCtx.stroke();

    return tempCanvas;
}

const pigImage = createPigImage();

let player, obstacles, hearts, score, lives, isGameRunning, gameSpeed, ground;
let isInvincible, lastHitTime;

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function updateLifeDisplay() {
    const lifeContainer = document.getElementById('lifeContainer');
    lifeContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        if (i > 0 && i % 3 === 0) {
            lifeContainer.appendChild(document.createElement('br'));
        }
        const heart = document.createElement('div');
        heart.className = 'life-heart';
        heart.innerHTML = '❤️';
        lifeContainer.appendChild(heart);
    }
}

function initGameState() {
    player = {
        x: 100,
        y: 0,
        width: 60,
        height: 60,
        velocityY: 0,
        jumpCount: 0,
        isVisible: true
    };
    obstacles = [];
    hearts = [];
    score = 0;
    lives = GAME_CONFIG.MAX_LIVES;
    isGameRunning = false;
    gameSpeed = GAME_CONFIG.GAME_SPEED;
    ground = [];
    isInvincible = false;
    lastHitTime = 0;
    updateLifeDisplay();
}

function initGround() {
    const segmentWidth = 50;
    const numSegments = Math.ceil(canvas.width / segmentWidth) + 1;
    ground = [];
    for (let i = 0; i < numSegments; i++) {
        ground.push({
            x: i * segmentWidth,
            width: segmentWidth,
            height: GAME_CONFIG.GROUND_HEIGHT
        });
    }
}

function updateGround() {
    for (let segment of ground) {
        segment.x -= gameSpeed;
        if (segment.x + segment.width < 0) {
            segment.x = canvas.width;
        }
    }
}

function drawGround() {
    ctx.fillStyle = '#4a4a4a';
    for (let segment of ground) {
        ctx.fillRect(segment.x, canvas.height - segment.height, 
                   segment.width, segment.height);
    }
}

function spawnObstacle() {
    if (Math.random() < GAME_CONFIG.OBSTACLE_SPAWN_RATE) {
        obstacles.push({
            x: canvas.width,
            y: canvas.height - GAME_CONFIG.GROUND_HEIGHT,
            width: 30,
            height: 60 + Math.random() * 40
        });
    }
}

function spawnHeart() {
    if (Math.random() < GAME_CONFIG.HEART_SPAWN_RATE) {
        hearts.push({
            x: canvas.width,
            y: canvas.height - GAME_CONFIG.GROUND_HEIGHT - 100 - Math.random() * 100,
            width: 30,
            height: 30
        });
    }
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }
}

function updateHearts() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        hearts[i].x -= gameSpeed;
        if (hearts[i].x + hearts[i].width < 0) {
            hearts.splice(i, 1);
        }
    }
}

function drawObstacles() {
    ctx.fillStyle = '#ff4444';
    for (let obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y - obstacle.height, 
                   obstacle.width, obstacle.height);
    }
}

function drawHearts() {
    ctx.font = '30px Arial';
    for (let heart of hearts) {
        ctx.fillText('❤️', heart.x, heart.y);
    }
}

function drawPig(x, y, width, height) {
    if (!player.isVisible) return;
    ctx.globalAlpha = isInvincible ? 0.5 : 1;
    ctx.drawImage(pigImage, x, y, width, height);
    ctx.globalAlpha = 1;
}

function checkCollision() {
    if (isInvincible) return false;

    for (let obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y &&
            player.y + player.height > obstacle.y - obstacle.height) {
            handleCollision();
            return lives <= 0;
        }
    }
    return false;
}

function checkHeartCollision() {
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        if (player.x < heart.x + heart.width &&
            player.x + player.width > heart.x &&
            player.y < heart.y + heart.height &&
            player.y + player.height > heart.y) {
            hearts.splice(i, 1);
            if (lives < GAME_CONFIG.MAX_LIVES) {
                lives++;
                updateLifeDisplay();
            }
            score += 50;
        }
    }
}

function handleCollision() {
    lives--;
    updateLifeDisplay();
    
    if (lives > 0) {
        isInvincible = true;
        lastHitTime = Date.now();
        
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            player.isVisible = !player.isVisible;
            blinkCount++;
            if (blinkCount >= 6) {
                clearInterval(blinkInterval);
                player.isVisible = true;
            }
        }, 300);
        
        setTimeout(() => {
            isInvincible = false;
        }, GAME_CONFIG.INVINCIBLE_TIME);
    }
}

function handleJump() {
    if (player.jumpCount < 2) {
        player.velocityY = GAME_CONFIG.JUMP_FORCE;
        player.jumpCount++;
    }
}

function gameLoop() {
    if (!isGameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    

    player.velocityY += GAME_CONFIG.GRAVITY;
    player.y += player.velocityY;

    if (player.y > canvas.height - GAME_CONFIG.GROUND_HEIGHT - player.height) {
        player.y = canvas.height - GAME_CONFIG.GROUND_HEIGHT - player.height;
        player.velocityY = 0;
        player.jumpCount = 0;
    }

    updateGround();
    spawnObstacle();
    updateObstacles();
    spawnHeart();
    updateHearts();
    checkHeartCollision();

    drawGround();
    drawObstacles();
    drawHearts();
    drawPig(player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#000';
    ctx.font = '20px Microsoft YaHei';
    ctx.fillText(`分数: ${score}`, 20, 30);

    if (checkCollision()) {
        gameOver();
        return;
    }

    gameSpeed += 0.001;

    requestAnimationFrame(gameLoop);
}

function startGame() {
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    initGameState();
    player.y = canvas.height - GAME_CONFIG.GROUND_HEIGHT - player.height;
    isGameRunning = true;
    
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    isGameRunning = false;
    document.getElementById('finalScore').textContent = `最终得分: ${score}`;
    gameOverScreen.style.display = 'flex';
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isGameRunning) {
            handleJump();
        }
    }
});

canvas.addEventListener('click', () => {
    if (isGameRunning) {
        handleJump();
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

window.addEventListener('load', () => {
    resizeCanvas();
    initGameState();
    initGround();
});

window.addEventListener('resize', () => {
    resizeCanvas();
    initGround();
});