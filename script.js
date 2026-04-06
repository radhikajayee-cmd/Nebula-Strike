// Constants
const SCREEN_WIDTH = 1200;
const SCREEN_HEIGHT = 800;
const PLAYER_SPEED = 7;
const PLAYER_RADIUS = 28;
const BULLET_SPEED = 15;

// ---------------- STAR ----------------
class Star {
    constructor() {
        this.x = Math.random() * SCREEN_WIDTH;
        this.y = Math.random() * SCREEN_HEIGHT;
        this.speed = Math.random() * 0.5 + 0.1;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.8 + 0.2;
    }

    update() {
        this.y += this.speed;
        if (this.y > SCREEN_HEIGHT) {
            this.y = 0;
            this.x = Math.random() * SCREEN_WIDTH;
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// ---------------- PARTICLE ----------------
class Particle {
    constructor(x, y, color, life = 60) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        let alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// ---------------- BULLET ----------------
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle; // in degrees
        this.trail = [];
        this.maxTrail = 10;
    }

    update() {
        // Convert angle to radians for Math functions
        this.x += Math.cos(this.angle * Math.PI / 180) * BULLET_SPEED;
        this.y += Math.sin(this.angle * Math.PI / 180) * BULLET_SPEED;

        // Add to trail
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            let alpha = (i / this.trail.length) * 0.5;
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw bullet with glow
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ---------------- ENEMY ----------------
class Enemy {
    constructor() {
        this.size = [20, 35, 60][Math.floor(Math.random() * 3)];
        this.health = this.size * 2;
        this.maxHealth = this.health;

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
        this.pulse = 0;
        this.pulseSpeed = 0.05;

        // Different colors
        this.color = ['#ff4444', '#ffaa00', '#ffff00', '#44ff44', '#4444ff', '#aa44ff'][Math.floor(Math.random() * 6)];
    }

    update(playerX, playerY) {
        let dx = playerX - this.x;
        let dy = playerY - this.y;
        let angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        // Pulsing animation
        this.pulse += this.pulseSpeed;
    }

    draw(ctx) {
        let currentSize = this.size + Math.sin(this.pulse) * 2;

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, 2 * Math.PI);
        ctx.fill();

        // Inner circle for depth
        ctx.fillStyle = this.color.replace('44', '88');
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize * 0.7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Health bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - this.size, this.y + this.size + 12, this.size * 2, 8);

        // Health bar current with smooth transition
        let healthRatio = this.health / this.maxHealth;
        let barColor = healthRatio > 0.5 ? '#44ff44' : healthRatio > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = barColor;
        ctx.fillRect(this.x - this.size, this.y + this.size + 12, this.size * 2 * healthRatio, 8);

        // Health bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - this.size, this.y + this.size + 12, this.size * 2, 8);
    }
}

// ---------------- EXPLOSION ----------------
class Explosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.color = color;
        for (let i = 0; i < 20; i++) {
            this.particles.push(new Particle(x, y, color, 60));
        }
    }

    update() {
        for (let particle of this.particles) {
            particle.update();
        }
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        for (let particle of this.particles) {
            particle.draw(ctx);
        }
    }

    isFinished() {
        return this.particles.length === 0;
    }
}

// ---------------- PLAYER ----------------
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.hover = 0;
        this.hoverSpeed = 0.1;
    }

    update() {
        this.hover += this.hoverSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);

        // Glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;

        // Spaceship body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -35); // Nose
        ctx.lineTo(-15, 10); // Left wing
        ctx.lineTo(-8, 25); // Left rear
        ctx.lineTo(0, 15); // Center rear
        ctx.lineTo(8, 25); // Right rear
        ctx.lineTo(15, 10); // Right wing
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#4444ff';
        ctx.beginPath();
        ctx.arc(0, -10, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 20 + Math.sin(this.hover) * 2, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
    }
}

// ---------------- GAME ----------------
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();

        // Background stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push(new Star());
        }

        // Effects
        this.explosions = [];
        this.particles = [];
        this.shake = 0;
        this.shakeIntensity = 0;

        // Event listeners
        document.addEventListener('keydown', (e) => this.onKeyPress(e));
        document.addEventListener('keyup', (e) => this.onKeyRelease(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.onMousePress(e));
    }

    reset() {
        this.state = 'GAME'; // Start immediately for action
        this.player = new Player(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
        this.keys = new Set();
        this.bullets = [];
        this.enemies = [];
        // Spawn initial enemies for immediate action
        for (let i = 0; i < 3; i++) {
            this.enemies.push(new Enemy());
        }
        this.spawnTimer = 0;
        this.invincibleTimer = 0;
        this.lives = 3;
        this.score = 0;
        this.explosions = [];
        this.particles = [];
        this.shake = 0;
    }

    draw() {
        // Screen shake
        let shakeX = (Math.random() - 0.5) * this.shake;
        let shakeY = (Math.random() - 0.5) * this.shake;
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // Background gradient
        let gradient = this.ctx.createRadialGradient(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 0, SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 600);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0a0a0a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Stars
        for (let star of this.stars) {
            star.draw(this.ctx);
        }

        if (this.state === 'START') {
            // Animated title
            this.ctx.fillStyle = '#00ffff';
            this.ctx.font = 'bold 60px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 20;
            this.ctx.fillText('NEBULA STRIKE', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Orbitron';
            this.ctx.fillText('Press ENTER to Start', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 20);
            this.ctx.restore();
            return;
        }

        if (this.state === 'GAME_OVER') {
            // Game over screen
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 50px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#ff4444';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('GAME OVER', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 50);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Orbitron';
            this.ctx.fillText(`Final Score: ${this.score}`, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
            this.ctx.fillText('Press ENTER to Restart', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 40);
            this.ctx.restore();
            return;
        }

        // Player
        this.player.draw(this.ctx);

        // Bullets
        for (let bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        // Enemies
        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Effects
        for (let explosion of this.explosions) {
            explosion.draw(this.ctx);
        }
        for (let particle of this.particles) {
            particle.draw(this.ctx);
        }

        // UI Panel
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, SCREEN_WIDTH, 60);
        this.ctx.fillRect(0, SCREEN_HEIGHT - 60, SCREEN_WIDTH, 60);

        // Score
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 24px Orbitron';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 35);

        // Lives
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Orbitron';
        this.ctx.fillText('LIVES:', SCREEN_WIDTH - 150, 25);
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(SCREEN_WIDTH - 80 + i * 25, 35, 8, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    update(deltaTime) {
        // Update stars
        for (let star of this.stars) {
            star.update();
        }

        if (this.state !== 'GAME') return;

        // Update player
        this.player.update();

        // Player movement
        if (this.keys.has('KeyW')) this.player.y += PLAYER_SPEED;
        if (this.keys.has('KeyS')) this.player.y -= PLAYER_SPEED;
        if (this.keys.has('KeyA')) this.player.x -= PLAYER_SPEED;
        if (this.keys.has('KeyD')) this.player.x += PLAYER_SPEED;

        // Keep inside screen
        this.player.x = Math.max(0, Math.min(SCREEN_WIDTH, this.player.x));
        this.player.y = Math.max(0, Math.min(SCREEN_HEIGHT, this.player.y));

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
            enemy.update(this.player.x, this.player.y);
        }

        // Update effects
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            if (this.explosions[i].isFinished()) {
                this.explosions.splice(i, 1);
            }
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Screen shake decay
        if (this.shake > 0) {
            this.shake -= 0.5;
        }

        // Bullet collision
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                let dist = Math.hypot(this.bullets[i].x - this.enemies[j].x, this.bullets[i].y - this.enemies[j].y);
                if (dist < this.enemies[j].size) {
                    // Hit effect
                    for (let k = 0; k < 5; k++) {
                        this.particles.push(new Particle(this.enemies[j].x, this.enemies[j].y, '#ffff00', 30));
                    }
                    this.shake = 5;

                    this.enemies[j].health -= 20;
                    this.bullets.splice(i, 1);
                    if (this.enemies[j].health <= 0) {
                        // Explosion
                        this.explosions.push(new Explosion(this.enemies[j].x, this.enemies[j].y, this.enemies[j].color));
                        this.shake = 10;
                        this.enemies.splice(j, 1);
                        this.score += 100;
                    }
                    break;
                }
            }
        }

        // Player collision
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        for (let enemy of this.enemies) {
            let dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist < enemy.size + PLAYER_RADIUS) {
                if (this.invincibleTimer === 0) {
                    this.shake = 15;
                    this.lives--;
                    this.invincibleTimer = 120;
                    if (this.lives <= 0) {
                        this.shake = 30;
                        this.state = 'GAME_OVER';
                    }
                }
                break;
            }
        }
    }

    onKeyPress(e) {
        e.preventDefault();
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
        let dx = mouseX - this.player.x;
        let dy = mouseY - this.player.y;
        this.player.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    onMousePress(e) {
        e.preventDefault();
        if (this.state === 'GAME') {
            let angleRad = this.player.angle * Math.PI / 180;
            let bulletX = this.player.x + Math.cos(angleRad) * 40;
            let bulletY = this.player.y + Math.sin(angleRad) * 40;
            this.bullets.push(new Bullet(bulletX, bulletY, this.player.angle));
            // Shooting sound placeholder
            // playSound('shoot.wav');
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