// ##################################################
// Constants
//
// ##################################################
let ENEMY_DIE_IMAGES = [
  "./images/animation/100.png",
  "./images/animation/90.png",
  "./images/animation/80.png",
  "./images/animation/70.png",
  "./images/animation/60.png",
  "./images/animation/50.png",
  "./images/animation/40.png",
  "./images/animation/30.png",
  "./images/animation/20.png",
];
let ENEMY_IMAGE = "./images/E11.png";
let ENEMY_SIZE = 40;
let PLAYER2 = "./images/P2.png";
let PLAYER1 = "./images/P.png";
let PLAYER_HEIGHT = 25;
let PLAYER_WIDTH = 50;
let CANVAS_HEIGHT = 640;
let CANVAS_WIDTH = 640;
let BULLET_HEIGHT = 10;
let BULLET_WIDTH = 2;
let TEXT_BLINK_FREQ = 500; // Lower it is, faster it is

// ##################################################
// Globals
//
// ##################################################
let keys = [
  {
    shoot_key: { key: " ", code: 32 },
    right_key: { key: "ArrowRight", code: 39 },
    left_key: { key: "ArrowLeft", code: 37 },
  },
  {
    shoot_key: { key: "None", code: 0 },
    right_key: { key: "None", code: 0 },
    left_key: { key: "None", code: 0 },
  },
];
let prev_key_state = null;
let game_started = false;
let waiting_key = false;
let key_state = null;
let key_name = null;
let key_code = null;
let player1 = null;
let player2 = null;
let enemies = null;
let canvas = null;
let lastTime = 0;
let time = null;
let ctx = null;
let stat = [0, 0];
let wave = 1;
let opt = 0;
let change_control = null;

// ##################################################
// Functions
//
// ##################################################
function valueInRange(val, min, max) {
  return val >= min && val <= max;
}

function getRandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// right now doesn't do shit either
// for enemies if they are not an army but are
// each for themselves
function checkEnemyCollision(A, B) {
  let a = { x: A.position.x, y: A.position.y };
  let b = { x: B.position.x, y: B.position.y };
  if (a.y == b.y && a.x != b.x)
    return (
      valueInRange(a.x, b.x, b.x + B.w) || valueInRange(b.x, a.x, a.x + A.w)
    );
}

function checkBulletEnemyCollision(B, E) {
  let e = { x: E.position.x, y: E.position.y };
  let b = { x: B.position.x, y: B.position.y };
  return valueInRange(b.x, e.x, e.x + E.w) && valueInRange(b.y, e.y, e.y + E.h);
}

function checkBulletPlayerCollision(B, P) {
  let p = { x: P.position.x - P.w / 2, y: P.position.y };
  let b = { x: B.position.x, y: B.position.y };
  return valueInRange(b.x, p.x, p.x + P.w) && valueInRange(b.y, p.y, p.y + P.h);
}

function checkOptionsButton() {
  if (isKeyDown(37)) return 1;
  if (isKeyDown(39)) return 2;
  return 0;
}

function isPlayer2() {
  if (
    keys[1].shoot_key.key != "None" &&
    keys[1].left_key.key != "None" &&
    keys[1].right_key.key != "None"
  )
    return true;
  return false;
}

class Point2D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Base {
  constructor(x, y, w, h, s) {
    this.position = new Point2D(x, y);
    this.speed = s;
    this.w = w;
    this.h = h;
  }
}

class Entity extends Base {
  constructor(img, x, y, w, h, s) {
    super(x, y, w, h, s);
    this.img = new Image();
    this.img.src = img;
  }
}

// ##################################################
// Entities
//
// ##################################################
// Player
class Player extends Entity {
  constructor(img, p) {
    super(
      img,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT - PLAYER_HEIGHT - 5,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
      300
    );
    this.bulletDelay = 0;
    this.bullets = [];
    this.status = 0;
    this.score = 0;
    this.vel = 0;
    this.p = p - 1;
  }

  shoot() {
    let bullet = new Bullet(this.position.x, this.position.y, -1, 800);
    this.bullets.push(bullet);
  }

  handleInput() {
    if (isKeyDown(keys[this.p].left_key.code) && this.position.x > this.w / 2) {
      this.xVel = -this.speed;
    } else if (
      isKeyDown(keys[this.p].right_key.code) &&
      this.position.x + this.w / 2 < CANVAS_WIDTH
    ) {
      this.xVel = this.speed;
    } else {
      this.xVel = 0;
    }
    if (wasKeyPressed(keys[this.p].shoot_key.code)) {
      if (this.bulletDelay > 0.35) {
        this.shoot();
        this.bulletDelay = 0;
      }
    }
  }

  updateBullets(dt) {
    for (let i = 0; i < this.bullets.length; i++) {
      let b = this.bullets[i];
      if (b.isAlive) {
        b.update(dt);
      } else {
        this.bullets.splice(i, 1);
        b = null;
      }
    }
  }

  update(dt) {
    this.bulletDelay += dt;
    this.position.x += this.xVel * dt;
    this.updateBullets(dt);
  }

  draw() {
    ctx.drawImage(
      this.img,
      this.position.x - this.w / 2,
      this.position.y,
      PLAYER_WIDTH,
      PLAYER_HEIGHT
    );

    for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw();
  }
}

// Bullet
class Bullet extends Base {
  constructor(x, y, direction, speed) {
    super(x, y, BULLET_WIDTH, BULLET_HEIGHT, speed);
    this.direction = direction;
    this.isAlive = true;
  }

  update(dt) {
    this.position.y += this.speed * this.direction * dt;
    if (this.position.y < 0 || this.position.y > CANVAS_HEIGHT)
      this.isAlive = false;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = "green";
    ctx.fillRect(this.position.x, this.position.y, BULLET_WIDTH, BULLET_HEIGHT);
  }
}

// Enemy
class Enemy extends Entity {
  constructor(x, y) {
    super(ENEMY_IMAGE, x, y, ENEMY_SIZE, ENEMY_SIZE, 50);
    this.doShoot = false;
    this.isAlive = true;
    this.dieCounter = 0;
    this.bullet = null;
    this.direction = 1;
    this.dieDelay = 0;
    this.waiting = 0;
    this.delay = 3;
  }

  shoot() {
    this.bullet = new Bullet(this.position.x, this.position.y, 1, 200);
  }

  update(dt) {
    this.waiting += dt;
    let go = (this.speed * (wave / 2)) / enemies.length;
    if (go < 2) {
      this.position.x += go * this.direction;
    } else {
      this.position.x += 2 * this.direction;
    }
    if (this.position.x > CANVAS_WIDTH - ENEMY_SIZE || this.position.x < 0)
      for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].direction *= -1;
        enemies[i].position.y += 40;
      }
    if (this.bullet == null) {
      if (this.waiting >= this.delay) {
        this.waiting = 0;
        if (Math.floor(Math.random() * 100) < 5) this.shoot();
      }
    } else {
      this.bullet.update(dt);
      if (!this.bullet.isAlive) this.bullet = null;
      else if (checkBulletPlayerCollision(this.bullet, player1))
        player1.status = -1;
      else if (checkBulletPlayerCollision(this.bullet, player2))
        player2.status = -1;
    }
    /* was used if enemies was each of themselves
    for (let i = 0; i < enemies.length; i++) {
      if (checkEnemyCollision(this, enemies[i])) this.direction *= -1;
    }*/
  }

  draw() {
    ctx.drawImage(
      this.img,
      this.position.x,
      this.position.y,
      ENEMY_SIZE,
      ENEMY_SIZE
    );
    if (this.bullet != null) this.bullet.draw();
  }

  dieAnimation(dt) {
    this.dieDelay += dt;
    if (this.dieDelay > 0.017) {
      this.dieDelay = 0;
      this.img.src = ENEMY_DIE_IMAGES[this.dieCounter];
      this.dieCounter++;
      if (this.dieCounter == ENEMY_DIE_IMAGES.length) return true;
    }
    return false;
  }
}

// ##################################################
// Initialization functions
//
// ##################################################
function initCanvas() {
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  window.addEventListener("resize", resize);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
}

function setUpEnemies() {
  enemies = [];
  for (let i = 1; i < 5; i++)
    for (let j = 1; j < 11; j++) enemies.push(new Enemy(j * 50, 60 * i));
}

function initGame() {
  player1 = new Player(PLAYER1, 1);
  player2 = new Player(PLAYER2, 2);
  setUpEnemies();
}

function init() {
  initCanvas();
  key_state = [];
  prev_key_state = [];
  resize();
}

// ###################################################################
// Input functions
//
// ###################################################################
function isKeyDown(key) {
  return key_state[key];
}

function wasKeyPressed(key) {
  return !prev_key_state[key] && key_state[key];
}

// ##################################################
// Screen functions
//
// ##################################################
function fillText(text, x, y, color, fontSize) {
  ctx.fillStyle = color;
  ctx.font = fontSize + "px Arial";
  ctx.fillText(text, x, y);
}

function fillCenteredText(text, x, y, color, fontSize) {
  let measurements = ctx.measureText(text);
  fillText(text, x - measurements.width / 2, y, color, fontSize);
}

function fillBlinkingText(text, x, y, blinkFreq, color, fontSize) {
  if (~~(Date.now() / blinkFreq) % 2) {
    fillCenteredText(text, x, y, color, fontSize);
  }
}

function clearScreen() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawScore() {
  fillCenteredText(
    "Score: " + (player1.score + player2.score),
    CANVAS_WIDTH / 2,
    30,
    "green",
    20
  );
}

function endScreen() {
  fillCenteredText(
    "LOST  Score: " + (player1.score + player2.score),
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2.75,
    "#FFF",
    36
  );
  fillBlinkingText(
    "Escape to go back!",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2.1,
    TEXT_BLINK_FREQ,
    "#FFF",
    36
  );
  fillBlinkingText(
    "Enter to play again!",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 1.8,
    TEXT_BLINK_FREQ,
    "#FFF",
    36
  );
}

function drawStartScreen() {
  fillCenteredText(
    "Space Invaders",
    CANVAS_WIDTH / 2.6,
    CANVAS_HEIGHT / 2.75,
    "#FFF",
    36
  );
  fillBlinkingText(
    "Press enter to play!",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    TEXT_BLINK_FREQ,
    "#FFF",
    36
  );
  fillCenteredText(
    "'LEFT ARROW' for player one",
    CANVAS_WIDTH / 2.3,
    CANVAS_HEIGHT / 1.4,
    "#AAA",
    16
  );
  fillCenteredText(
    "'RIGHT ARROW' for player two",
    CANVAS_WIDTH / 1.3,
    CANVAS_HEIGHT / 1.4,
    "#AAA",
    16
  );
}

function playerSettings(num) {
  let arr = [keys[num].left_key, keys[num].right_key, keys[num].shoot_key];
  let output = [];
  arr.forEach((k) => {
    if (k.key == " ") output.push("Space");
    else output.push(k.key);
  });
  fillCenteredText(
    "(1) LEFT: " + output[0],
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 4,
    "#FFF",
    36
  );
  fillCenteredText(
    "(2) RIGHT: " + output[1],
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 3,
    "#FFF",
    36
  );
  fillCenteredText(
    "(3) SHOOT: " + output[2],
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2.4,
    "#FFF",
    36
  );
  fillBlinkingText(
    "Escape to go back!",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 1.5,
    TEXT_BLINK_FREQ,
    "#FFF",
    36
  );
}

function pressButton() {
  fillCenteredText(
    "Press any key",
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    "#FFF",
    36
  );
}

function changeControls(p, control) {
  clearScreen();
  pressButton();
  let notAllowedKeys = ["1", "2", "3", "Enter", "Escape"];
  if (key_name != null && !notAllowedKeys.includes(key_name)) {
    switch (control) {
      case "l":
        keys[p].left_key.key = key_name;
        keys[p].left_key.code = key_code;
        break;
      case "r":
        keys[p].right_key.key = key_name;
        keys[p].right_key.code = key_code;
        break;
      case "s":
        keys[p].shoot_key.key = key_name;
        keys[p].shoot_key.code = key_code;
        break;
    }
    change_control = null;
    waiting_key = false;
  }
}

// ##################################################
// Drawing & Update functions
//
// ##################################################
function resolveCollisions(player) {
  for (let i = 0, b_len = player.bullets.length; i < b_len; i++)
    for (let j = 0, e_len = enemies.length; j < e_len; j++) {
      let bullet = player.bullets[i];
      let enemy = enemies[j];
      if (checkBulletEnemyCollision(bullet, enemy)) {
        enemy.isAlive = false;
        bullet.isAlive = false;
        player.score += 25;
      }
    }
  if (enemies.length == 0) player.status = 1;
}

function drawEnemies() {
  for (i = 0; i < enemies.length; i++) enemies[i].draw();
}

function updateEnemies(dt) {
  for (i = 0; i < enemies.length; i++) {
    let enemy = enemies[i];
    let death = false;
    enemy.update(dt);
    if (!enemy.isAlive) death = enemy.dieAnimation(dt);
    if (enemy.position.y + enemy.h > CANVAS_HEIGHT - 40) player1.status = -1;
    if (enemy.position.y + enemy.h > CANVAS_HEIGHT - 40) player2.status = -1;
    if (death) {
      enemies.splice(i, 1);
      enemy = null;
    }
  }
}

function updateGame(dt) {
  if (isPlayer2()) player2.handleInput();
  player1.handleInput();
  prev_key_state = key_state.slice();
  if (isPlayer2()) player2.update(dt);
  player1.update(dt);
  updateEnemies(dt);
  resolveCollisions(player1);
  resolveCollisions(player2);
  if (player1.status != 0 || player2.status != 0) game_started = false;
  return [player1.status, player2.status];
}

function nextWave() {
  wave++;
  setUpEnemies();
  game_started = true;
  player1.status = 0;
  player2.status = 0;
}

function drawGame() {
  player1.draw();
  if (isPlayer2()) player2.draw();
  drawEnemies();
  drawScore();
}

function animate() {
  let now = window.performance.now();
  let dt = now - lastTime;
  if (dt > 100) dt = 100;
  if (wasKeyPressed(13) && !game_started && opt == 0) {
    initGame();
    game_started = true;
  }
  if (game_started) stat = updateGame(dt / 1000);
  clearScreen();
  if (game_started) {
    drawGame();
  } else if (stat.includes(-1)) {
    endScreen();
    if (isKeyDown(27) || isKeyDown(13)) {
      wave = 1;
      stat = [0, 0];
    }
  } else if (stat.includes(1)) {
    nextWave();
  } else if (opt != 0) {
    if (change_control == null) {
      playerSettings(opt - 1);
      if (isKeyDown(27)) opt = 0;
      else if (isKeyDown(49) || isKeyDown(97)) {
        change_control = "l";
        waiting_key = true;
      } else if (isKeyDown(50) || isKeyDown(98)) {
        change_control = "r";
        waiting_key = true;
      } else if (isKeyDown(51) || isKeyDown(99)) {
        change_control = "s";
        waiting_key = true;
      }
    } else {
      if (waiting_key) changeControls(opt - 1, change_control);
    }
  } else {
    drawStartScreen();
    opt = checkOptionsButton();
  }
  lastTime = now;
  requestAnimationFrame(animate);
}

// ##################################################
// Event listeners
//
// ##################################################
function resize() {
  let w = window.innerWidth;
  let h = window.innerHeight;
  let scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT);
  canvas.width = CANVAS_WIDTH * scale;
  canvas.height = CANVAS_HEIGHT * scale;
  ctx.transform(scale, 0, 0, scale, 0, 0);
}

function onKeyDown(e) {
  key_state[e.which] = true;
  key_name = e.key;
  key_code = e.which;
}

function onKeyUp(e) {
  key_state[e.which] = false;
}

// ##################################################
// Start the game
//
// ##################################################
window.onload = function () {
  init();
  animate();
};
