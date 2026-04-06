// Constants
const SCREEN_WIDTH = 1200;
const SCREEN_HEIGHT = 800;
const PLAYER_SPEED = 7;
const PLAYER_RADIUS = 28;
const BULLET_SPEED = 15;

// ---------------- BULLET ----------------
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
    }

    update() {
        // Convert angle to radians for Math functions
        this.x += Math.cos(this.angle * Math.PI / 180) * BULLET_SPEED;
        this.y += Math.sin(this.angle * Math.PI / 180) * BULLET_SPEED;
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// ---------------- ENEMY ----------------
class Enemy {
    constructor() {
        this.size = [20, 35, 60][Math.floor(Math.random() * 3)];
        this.health = this.size * 2;

        let side = Math.floor(Math.random() * 4);
        if (side === 0) {
            this.x = -50;
            this.y = Math.random() * SCREEN_HEIGHT;
        } else if (side === 1) {
            this.x = SCREEN_WIDTH + 50;
            this.y = Math.random() * SCREEN_HEIGHT;
        } else if (side === 2) {
            this.x = Math.random() * SCREEN_WIDTH;
            this.y = -50;
        } else {
            this.x = Math.random() * SCREEN_WIDTH;
            this.y = SCREEN_HEIGHT + 50;
        }

        this.speed = 1 + Math.random();

        // Different colors
        this.color = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'][Math.floor(Math.random() * 6)];
    }

    update(playerX, playerY) {
        let dx = playerX - this.x;
        let dy = playerY - this.y;
        let angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
    }

    draw(ctx) {
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();

        // Health bar background
        ctx.fillStyle = 'darkred';
        ctx.fillRect(this.x - this.size, this.y + this.size + 12, this.size * 2, 6);

        // Health bar current
        let healthRatio = this.health / (this.size * 2);
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x - this.size, this.y + this.size + 12, this.size * 2 * healthRatio, 6);
    }
}

// ---------------- GAME ----------------
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();

        // Event listeners
        document.addEventListener('keydown', (e) => this.onKeyPress(e));
        document.addEventListener('keyup', (e) => this.onKeyRelease(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.onMousePress(e));
    }

    reset() {
        this.state = 'START';
        this.playerX = SCREEN_WIDTH / 2;
        this.playerY = SCREEN_HEIGHT / 2;
        this.playerAngle = 0;
        this.keys = new Set();
        this.bullets = [];
        this.enemies = [];
        this.spawnTimer = 0;
        this.invincibleTimer = 0;
        this.lives = 3;
        this.score = 0;
    }

    draw() {
        this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        if (this.state === 'START') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE SHOOTER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'gray';
            this.ctx.fillText('Press ENTER to Start', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
            return;
        }

        if (this.state === 'GAME_OVER') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = 'gray';
            this.ctx.fillText('Press ENTER to Restart', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
            return;
        }

        // Player (triangle)
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        let tipX = this.playerX + Math.cos(this.playerAngle * Math.PI / 180) * 40;
        let tipY = this.playerY + Math.sin(this.playerAngle * Math.PI / 180) * 40;
        let leftX = this.playerX + Math.cos((this.playerAngle + 140) * Math.PI / 180) * 30;
        let leftY = this.playerY + Math.sin((this.playerAngle + 140) * Math.PI / 180) * 30;
        let rightX = this.playerX + Math.cos((this.playerAngle - 140) * Math.PI / 180) * 30;
        let rightY = this.playerY + Math.sin((this.playerAngle - 140) * Math.PI / 180) * 30;
        this.ctx.moveTo(tipX, tipY);
        this.ctx.lineTo(leftX, leftY);
        this.ctx.lineTo(rightX, rightY);
        this.ctx.closePath();
        this.ctx.fill();

        // Bullets
        for (let bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        // Enemies
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // UI
        this.ctx.fillStyle = 'white';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 780);
        this.ctx.fillText(`Score: ${this.score}`, 20, 750);
    }

    update(deltaTime) {
        if (this.state !== 'GAME') return;

        // Player movement
        if (this.keys.has('KeyW')) this.playerY += PLAYER_SPEED;
        if (this.keys.has('KeyS')) this.playerY -= PLAYER_SPEED;
        if (this.keys.has('KeyA')) this.playerX -= PLAYER_SPEED;
        if (this.keys.has('KeyD')) this.playerX += PLAYER_SPEED;

        // Keep inside screen
        this.playerX = Math.max(0, Math.min(SCREEN_WIDTH, this.playerX));
        this.playerY = Math.max(0, Math.min(SCREEN_HEIGHT, this.playerY));

        // Spawn enemies (max 3)
        this.spawnTimer++;
        if (this.spawnTimer > 150 && this.enemies.length < 3) {
            this.enemies.push(new Enemy());
            this.spawnTimer = 0;
        }

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            if (this.bullets[i].x < 0 || this.bullets[i].x > SCREEN_WIDTH ||
                this.bullets[i].y < 0 || this.bullets[i].y > SCREEN_HEIGHT) {
                this.bullets.splice(i, 1);
            }
        }

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(this.playerX, this.playerY);
        }

        // Bullet collision
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let dist = Math.hypot(this.bullets[i].x - this.enemies[j].x, this.bullets[i].y - this.enemies[j].y);
                if (dist < this.enemies[j].size) {
                    this.enemies[j].health -= 20;
                    this.bullets.splice(i, 1);
                    if (this.enemies[j].health <= 0) {
                        this.enemies.splice(j, 1);
                        this.score += 100;
                    }
                    break; // Bullet can only hit one enemy
                }
            }
        }

        // Player collision
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        for (let enemy of this.enemies) {
            let dist = Math.hypot(this.playerX - enemy.x, this.playerY - enemy.y);
            if (dist < enemy.size + PLAYER_RADIUS) {
                if (this.invincibleTimer === 0) {
                    this.lives--;
                    this.invincibleTimer = 120; // 2 seconds at 60fps
                    if (this.lives <= 0) {
                        this.state = 'GAME_OVER';
                    }
                }
                break; // Only one collision per frame
            }
        }
    }

    onKeyPress(e) {
        e.preventDefault(); // Prevent default browser behavior
        if (this.state === 'START' && e.code === 'Enter') {
            this.state = 'GAME';
        } else if (this.state === 'GAME_OVER' && e.code === 'Enter') {
            this.reset();
        }
        this.keys.add(e.code);
    }

    onKeyRelease(e) {
        this.keys.delete(e.code);
    }

    onMouseMove(e) {
        let rect = this.canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;
        let dx = mouseX - this.playerX;
        let dy = mouseY - this.playerY;
        this.playerAngle = Math.atan2(dy, dx) * 180 / Math.PI; // Convert to degrees
    }

    onMousePress(e) {
        e.preventDefault();
        if (this.state === 'GAME') {
            this.bullets.push(new Bullet(this.playerX, this.playerY, this.playerAngle));
        }
    }
}

// Initialize game
let canvas = document.getElementById('gameCanvas');
let game = new Game(canvas);

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    game.update(deltaTime);
    game.draw();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);