import arcade
import random
import math

SCREEN_WIDTH = 1200
SCREEN_HEIGHT = 800
SCREEN_TITLE = "Space Shooter Ultimate"

PLAYER_SPEED = 7
PLAYER_RADIUS = 28
BULLET_SPEED = 15


# ---------------- BULLET ----------------
class Bullet:
    def __init__(self, x, y, angle):
        self.x = x
        self.y = y
        self.angle = angle

    def update(self):
        self.x += math.cos(math.radians(self.angle)) * BULLET_SPEED
        self.y += math.sin(math.radians(self.angle)) * BULLET_SPEED

    def draw(self):
        arcade.draw_circle_filled(self.x, self.y, 5, arcade.color.YELLOW)


# ---------------- ENEMY ----------------
class Enemy:
    def __init__(self):
        self.size = random.choice([20, 35, 60])
        self.health = self.size * 2

        side = random.randint(0, 3)

        if side == 0:
            self.x = -50
            self.y = random.randint(0, SCREEN_HEIGHT)
        elif side == 1:
            self.x = SCREEN_WIDTH + 50
            self.y = random.randint(0, SCREEN_HEIGHT)
        elif side == 2:
            self.x = random.randint(0, SCREEN_WIDTH)
            self.y = -50
        else:
            self.x = random.randint(0, SCREEN_WIDTH)
            self.y = SCREEN_HEIGHT + 50

        self.speed = random.uniform(1, 2)

        # Different colors
        self.color = random.choice([
            arcade.color.RED,
            arcade.color.ORANGE,
            arcade.color.YELLOW,
            arcade.color.GREEN,
            arcade.color.BLUE,
            arcade.color.PURPLE
        ])

    def update(self, player_x, player_y):
        dx = player_x - self.x
        dy = player_y - self.y
        angle = math.atan2(dy, dx)
        self.x += math.cos(angle) * self.speed
        self.y += math.sin(angle) * self.speed

    def draw(self):
        # Enemy body
        arcade.draw_circle_filled(self.x, self.y, self.size, self.color)

        # Health bar background
        arcade.draw_rectangle_filled(
            self.x,
            self.y + self.size + 12,
            self.size * 2,
            6,
            arcade.color.DARK_RED
        )

        # Health bar current
        health_ratio = self.health / (self.size * 2)

        arcade.draw_rectangle_filled(
            self.x - (self.size * 2 * (1 - health_ratio)) / 2,
            self.y + self.size + 12,
            self.size * 2 * health_ratio,
            6,
            arcade.color.LIME_GREEN
        )


# ---------------- GAME ----------------
class Game(arcade.Window):

    def __init__(self):
        super().__init__(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_TITLE)
        arcade.set_background_color(arcade.color.BLACK)

        self.state = "START"

        self.player_x = SCREEN_WIDTH // 2
        self.player_y = SCREEN_HEIGHT // 2
        self.player_angle = 0

        self.keys = set()

        self.bullets = []
        self.enemies = []

        self.spawn_timer = 0
        self.invincible_timer = 0

        self.lives = 3
        self.score = 0

    def on_draw(self):
        self.clear()

        if self.state == "START":
            arcade.draw_text("SPACE SHOOTER",
                             SCREEN_WIDTH/2, SCREEN_HEIGHT/2,
                             arcade.color.WHITE, 40,
                             anchor_x="center")
            arcade.draw_text("Press ENTER to Start",
                             SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50,
                             arcade.color.GRAY, 20,
                             anchor_x="center")
            return

        if self.state == "GAME_OVER":
            arcade.draw_text("GAME OVER",
                             SCREEN_WIDTH/2, SCREEN_HEIGHT/2,
                             arcade.color.WHITE, 40,
                             anchor_x="center")
            arcade.draw_text("Press ENTER to Restart",
                             SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50,
                             arcade.color.GRAY, 20,
                             anchor_x="center")
            return

        # Player
        arcade.draw_triangle_filled(
            self.player_x + math.cos(math.radians(self.player_angle)) * 40,
            self.player_y + math.sin(math.radians(self.player_angle)) * 40,
            self.player_x + math.cos(math.radians(self.player_angle + 140)) * 30,
            self.player_y + math.sin(math.radians(self.player_angle + 140)) * 30,
            self.player_x + math.cos(math.radians(self.player_angle - 140)) * 30,
            self.player_y + math.sin(math.radians(self.player_angle - 140)) * 30,
            arcade.color.WHITE
        )

        for bullet in self.bullets:
            bullet.draw()

        for enemy in self.enemies:
            enemy.draw()

        arcade.draw_text(f"Lives: {self.lives}", 20, 760, arcade.color.WHITE, 18)
        arcade.draw_text(f"Score: {self.score}", 20, 730, arcade.color.WHITE, 18)

    def on_update(self, delta_time):

        if self.state != "GAME":
            return

        # Player movement
        if arcade.key.W in self.keys:
            self.player_y += PLAYER_SPEED
        if arcade.key.S in self.keys:
            self.player_y -= PLAYER_SPEED
        if arcade.key.A in self.keys:
            self.player_x -= PLAYER_SPEED
        if arcade.key.D in self.keys:
            self.player_x += PLAYER_SPEED

        # Keep inside screen
        self.player_x = max(0, min(SCREEN_WIDTH, self.player_x))
        self.player_y = max(0, min(SCREEN_HEIGHT, self.player_y))

        # Spawn enemies (max 3)
        self.spawn_timer += 1
        if self.spawn_timer > 150 and len(self.enemies) < 3:
            self.enemies.append(Enemy())
            self.spawn_timer = 0

        # Update bullets
        for bullet in self.bullets[:]:
            bullet.update()
            if bullet.x < 0 or bullet.x > SCREEN_WIDTH or bullet.y < 0 or bullet.y > SCREEN_HEIGHT:
                self.bullets.remove(bullet)

        # Update enemies
        for enemy in self.enemies:
            enemy.update(self.player_x, self.player_y)

        # Bullet collision
        for bullet in self.bullets[:]:
            for enemy in self.enemies[:]:
                if math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < enemy.size:
                    enemy.health -= 20
                    if bullet in self.bullets:
                        self.bullets.remove(bullet)
                    if enemy.health <= 0:
                        self.enemies.remove(enemy)
                        self.score += 100

        # Player collision
        if self.invincible_timer > 0:
            self.invincible_timer -= 1

        for enemy in self.enemies:
            if math.hypot(self.player_x - enemy.x,
                          self.player_y - enemy.y) < enemy.size + PLAYER_RADIUS:

                if self.invincible_timer == 0:
                    self.lives -= 1
                    self.invincible_timer = 120

                    if self.lives <= 0:
                        self.state = "GAME_OVER"

    def on_key_press(self, key, modifiers):
        if self.state == "START" and key == arcade.key.ENTER:
            self.state = "GAME"

        if self.state == "GAME_OVER" and key == arcade.key.ENTER:
            self.__init__()

        self.keys.add(key)

    def on_key_release(self, key, modifiers):
        self.keys.discard(key)

    def on_mouse_motion(self, x, y, dx, dy):
        dx = x - self.player_x
        dy = y - self.player_y
        self.player_angle = math.degrees(math.atan2(dy, dx))

    def on_mouse_press(self, x, y, button, modifiers):
        if self.state == "GAME":
            self.bullets.append(Bullet(self.player_x, self.player_y, self.player_angle))


def main():
    game = Game()
    arcade.run()


if __name__ == "__main__":
    main()