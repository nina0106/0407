let topPoints = [];
let bottomPoints = [];
let stars = [];
let particles = [];
let nodes = [];
let isGameOver = false;
let isStarted = false;
let isGameWin = false;
let currentLevel = 1;
const maxLevels = 3;
let pointCount = 6;
let shakeAmount = 0;

// 計時器相關
let startTime;
let currentTime = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  initGame();
  for (let i = 0; i < 80; i++) {
    stars.push({ x: random(width), y: random(height), s: random(1, 2) });
  }
}

function initGame() {
  topPoints = [];
  bottomPoints = [];
  particles = [];
  nodes = [];
  currentTime = 0;
  
  // 難度設定
  pointCount = 6 + (currentLevel * 2);
  let spacing = width / (pointCount - 1);
  
  for (let i = 0; i < pointCount; i++) {
    let x = i * spacing;
    let baseY = height / 2 + sin(i * 0.8) * (100 + currentLevel * 20);
    let yTop = baseY + random(-80, 80);
    
    // 狹窄難度調度
    let gap = map(currentLevel, 1, 3, 60, 35);
    
    topPoints.push({ x: x, y: yTop });
    bottomPoints.push({ x: x, y: yTop + gap });

    // 障礙節點
    if (i > 0 && i < pointCount - 1 && random() > 0.4) {
      nodes.push({
        x: x,
        y: yTop + gap / 2 + random(-12, 12),
        r: random(8, 15)
      });
    }
  }
}

function draw() {
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9;
  }

  background(10, 10, 30);
  drawBackground();

  if (isGameWin) return displayGameWin();
  if (isGameOver) return displayGameOver();

  drawPath();
  drawNodes();

  let pX, pY;

  if (!isStarted) {
    pX = 30;
    pY = (topPoints[0].y + bottomPoints[0].y) / 2;
    drawUI(">> 點擊滑鼠：啟動電流急急棒 <<", width / 2, height - 100, 24, "#0ff");
  } else {
    // 記錄時間
    currentTime = (millis() - startTime) / 1000;
    
    pX = mouseX;
    pY = mouseY;
    checkCollision(pX, pY);
    addParticles(pX, pY);

    if (pX >= width - 10) {
      if (currentLevel < maxLevels) {
        currentLevel++;
        isStarted = false;
        shakeAmount = 10;
        initGame();
      } else {
        isGameWin = true;
      }
    }
  }

  updateParticles();
  drawPlayer(pX, pY);
  drawHUD();
}

function drawBackground() {
  fill(255, 255, 255, 180);
  for (let s of stars) ellipse(s.x, s.y, s.s);
}

function drawPath() {
  // 強化的發光道路視覺
  noFill();
  
  // 第一層：超寬淡色光暈
  strokeWeight(20);
  stroke(0, 255, 255, 15); 
  renderPathLines();
  
  // 第二層：中等寬度強光
  strokeWeight(10);
  stroke(255, 0, 255, 60); 
  renderPathLines();
  
  // 第三層：核心亮線
  strokeWeight(3);
  stroke(255, 255, 255); 
  renderPathLines();

  // 道路內部填充 (調亮)
  fill(0, 255, 255, 35);
  noStroke();
  beginShape();
  for (let p of topPoints) curveVertex(p.x, p.y);
  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    curveVertex(bottomPoints[i].x, bottomPoints[i].y);
  }
  endShape(CLOSE);
}

function renderPathLines() {
  beginShape();
  for (let p of topPoints) curveVertex(p.x, p.y);
  endShape();
  beginShape();
  for (let p of bottomPoints) curveVertex(p.x, p.y);
  endShape();
}

function drawNodes() {
  for (let n of nodes) {
    // 閃爍紅色警告
    let glow = 150 + sin(frameCount * 0.15) * 105;
    fill(255, 50, 50, glow);
    noStroke();
    ellipse(n.x, n.y, n.r + sin(frameCount * 0.2) * 5); 
    
    // 核心亮點
    fill(255, 200, 200);
    ellipse(n.x, n.y, n.r * 0.5);
  }
}

function drawPlayer(x, y) {
  push();
  // 玩家光球
  fill(255);
  noStroke();
  ellipse(x, y, 10);
  
  // 外圍電場環
  noFill();
  strokeWeight(2);
  stroke(255, 255, 0, 200);
  ellipse(x, y, 18 + sin(frameCount * 0.3) * 6);
  pop();
}

function checkCollision(px, py) {
  let spacing = width / (pointCount - 1);
  let i = floor(px / spacing);

  if (i >= 0 && i < topPoints.length - 1) {
    let t = (px - topPoints[i].x) / (topPoints[i+1].x - topPoints[i].x);
    let topY = lerp(topPoints[i].y, topPoints[i+1].y, t);
    let botY = lerp(bottomPoints[i].y, bottomPoints[i+1].y, t);

    // 嚴格判定距離
    if (py < topY + 5 || py > botY - 5) triggerGameOver();
  }
  
  for (let n of nodes) {
    if (dist(px, py, n.x, n.y) < n.r / 2 + 5) triggerGameOver();
  }

  if (px < 0 || py < 0 || py > height) triggerGameOver();
}

function triggerGameOver() {
  isGameOver = true;
  shakeAmount = 25;
}

function drawHUD() {
  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  textStyle(BOLD);
  // 中文化顯示
  fill(0, 255, 255);
  text(`【 目前關卡：${currentLevel} / ${maxLevels} 】`, 20, 20);
  fill(255, 255, 0);
  text(`【 挑戰秒數：${currentTime.toFixed(2)}s 】`, 20, 50);
}

function drawUI(msg, x, y, sz, col) {
  textAlign(CENTER);
  textSize(sz);
  fill(col);
  text(msg, x, y);
}

function displayGameOver() {
  background(50, 0, 0, 220);
  drawUI("⚡ 挑戰失敗：你被電到了！ ⚡", width / 2, height / 2, 32, "#ff4444");
  drawUI(`最終紀錄：第 ${currentLevel} 關 (${currentTime.toFixed(2)} 秒)`, width / 2, height / 2 + 50, 20, "#fff");
  drawUI("點擊滑鼠重新開始挑戰", width / 2, height / 2 + 90, 16, "#aaa");
}

function displayGameWin() {
  background(0, 50, 30, 220);
  drawUI("🏆 恭喜通關：你是電速大師！ 🏆", width / 2, height / 2, 36, "#44ffaa");
  drawUI(`總耗時：${currentTime.toFixed(2)} 秒`, width / 2, height / 2 + 60, 24, "#fff");
  drawUI("點擊滑鼠挑戰更高極限", width / 2, height / 2 + 110, 18, "#aaa");
}

function addParticles(x, y) {
  if (frameCount % 1 == 0) {
    particles.push({ x: x, y: y, l: 255, col: color(random(200, 255), 255, 0) });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.l -= 10;
    fill(red(p.col), green(p.col), blue(p.col), p.l);
    noStroke();
    ellipse(p.x, p.y, random(2, 5));
    if (p.l <= 0) particles.splice(i, 1);
  }
}

function mousePressed() {
  if (isGameOver || isGameWin) {
    currentLevel = 1;
    isGameOver = false;
    isGameWin = false;
    isStarted = false;
    initGame();
  } else if (!isStarted) {
    isStarted = true;
    startTime = millis(); // 點擊後正式開始計時
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGame();
}