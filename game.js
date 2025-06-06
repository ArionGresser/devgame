// game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const UI = {
  round: document.getElementById("round"),
  alive: document.getElementById("alive"),
  destroyed: document.getElementById("destroyed"),
  money: document.getElementById("money"),
  speedBtn: document.getElementById("speedBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  damageLevel: document.getElementById("damageLevel"),
  rateLevel: document.getElementById("rateLevel"),
  wallLevel: document.getElementById("wallLevel"),
  roundTimer: document.getElementById("round-timer"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  finalRound: document.getElementById("finalRound"),
  finalKilled: document.getElementById("finalKilled")
};

let enemies = [];
let bullets = [];
let isPaused = false;
let speed = 1;
let damage = 15;
let attackRate = 1000;
let damageLevel = 0;
let rateLevel = 0;
let wallLevel = 0;
let money = 60;
let round = 1;
let wallHP = 100;
let maxWallHP = 100;
let destroyed = 0;
let lastShot = 0;
let roundInProgress = false;

function spawnEnemies(qtd) {
  for (let i = 0; i < qtd; i++) {
    const shape = i % 3 === 0 ? "triangle" : i % 2 === 0 ? "square" : "circle";
    const isElite = round % 5 === 0 && i === 0;
    const isBoss = round % 10 === 0 && i === 0;
    enemies.push({
      x: canvas.width + i * 60,
      y: 80 + Math.random() * (canvas.height - 160),
      w: 40,
      h: 40,
      hp: isBoss ? 300 : isElite ? 150 : 50,
      maxHp: isBoss ? 300 : isElite ? 150 : 50,
      speed: isBoss ? 0.3 : isElite ? 0.8 : 1.2,
      shape,
      elite: isElite,
      boss: isBoss
    });
  }
}

function updateUI() {
  UI.round.textContent = round;
  UI.alive.textContent = enemies.length;
  UI.destroyed.textContent = destroyed;
  UI.money.textContent = money;
  UI.damageLevel.textContent = "Nível: " + damageLevel;
  UI.rateLevel.textContent = "Nível: " + rateLevel;
  UI.wallLevel.textContent = "Nível: " + wallLevel;
  UI.pauseBtn.textContent = isPaused ? "Continuar" : "Pausar";
}

function drawEnemy(enemy) {
  const { x, y, w, h, hp, maxHp, shape, elite, boss } = enemy;
  ctx.fillStyle = boss ? "#f00" : elite ? "#ff0" : shape === "circle" ? "#0f0" : shape === "square" ? "#08f" : "#f0f";
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "square") {
    ctx.fillRect(x, y, w, h);
  } else if (shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y - 6, w, 5);
  ctx.fillStyle = "#f00";
  ctx.fillRect(x, y - 6, w * (hp / maxHp), 5);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach((b) => {
    ctx.fillRect(b.x, b.y, 8, 4);
  });
}

function shoot() {
  const now = Date.now();
  if (now - lastShot < attackRate / speed) return;

  const target = enemies.find(e => e.x > 80);
  if (target) {
    const origin = { x: 70, y: canvas.height / 2 };

    const dx0 = (target.x + target.w / 2) - origin.x;
    const dy0 = (target.y + target.h / 2) - origin.y;
    const initialDist = Math.sqrt(dx0 * dx0 + dy0 * dy0);
    const bulletSpeed = 6 * speed;
    const timeToHit = initialDist / bulletSpeed;

    const predictedX = target.x - (target.speed * speed * timeToHit);
    const predictedY = target.y;

    const dx = (predictedX + target.w / 2) - origin.x;
    const dy = (predictedY + target.h / 2) - origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    bullets.push({
      x: origin.x,
      y: origin.y,
      dx: (dx / dist) * 6,
      dy: (dy / dist) * 6,
      damage
    });

    lastShot = now;
  }
}

function handleBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx * speed;
    b.y += b.dy * speed;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (b.x + 8 > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
        e.hp -= b.damage;
        bullets.splice(i, 1);
        if (e.hp <= 0) {
          enemies.splice(j, 1);
          destroyed++;
          money += 10;
        }
        break;
      }
    }
    if (b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
  }
}

function drawWall() {
  ctx.fillStyle = "#999";
  ctx.fillRect(20, canvas.height / 2 - 50, 30, 100);
  ctx.fillStyle = "#fff";
  ctx.fillText("HP: " + wallHP + "/" + maxWallHP, 20, canvas.height / 2 - 60);
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed * speed;
    if (e.x < 60) {
      wallHP -= e.hp;
      enemies.splice(i, 1);
    }
  }
  if (wallHP <= 0) {
    wallHP = 0;
    isPaused = true;
    showGameOver();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWall();
  enemies.forEach(drawEnemy);
  drawBullets();
  updateUI();
}

function gameLoop() {
  if (!isPaused) {
    shoot();
    handleBullets();
    updateEnemies();
    draw();
    if (enemies.length === 0 && roundInProgress) {
      roundInProgress = false;
      UI.roundTimer.style.display = "block";
      let count = 5;
      UI.roundTimer.textContent = count;
      const timer = setInterval(() => {
        count--;
        UI.roundTimer.textContent = count;
        if (count <= 0) {
          clearInterval(timer);
          UI.roundTimer.style.display = "none";
          round++;
          startNextRound();
        }
      }, 1000);
    }
  }
  requestAnimationFrame(gameLoop);
}

function startNextRound() {
  spawnEnemies(5 + round * 2);
  roundInProgress = true;
  updateUI();
}

document.getElementById("pauseBtn").onclick = () => {
  isPaused = !isPaused;
  UI.pauseBtn.textContent = isPaused ? "Continuar" : "Pausar";
  updateUI();
};

document.getElementById("speedBtn").onclick = () => {
  speed = speed === 1 ? 2 : 1;
  UI.speedBtn.textContent = speed + "x";
};

document.getElementById("upgradeDamageBtn").onclick = () => {
  if (money >= 20) {
    money -= 20;
    damage += 5;
    damageLevel++;
    updateUI();
  }
};

document.getElementById("upgradeRateBtn").onclick = () => {
  if (money >= 20) {
    money -= 20;
    attackRate = Math.max(100, attackRate - 100);
    rateLevel++;
    updateUI();
  }
};

document.getElementById("upgradeWallBtn").onclick = () => {
  if (money >= 20) {
    money -= 20;
    maxWallHP += 20;
    wallHP = maxWallHP;
    wallLevel++;
    updateUI();
  }
};

document.getElementById("restartBtn").onclick = () => {
  location.reload();
};

document.getElementById("gameOverRestartBtn").onclick = () => {
  location.reload();
};

function showGameOver() {
  UI.finalRound.textContent = round;
  UI.finalKilled.textContent = destroyed;
  UI.gameOverScreen.style.display = "block";
}

startNextRound();
gameLoop();
