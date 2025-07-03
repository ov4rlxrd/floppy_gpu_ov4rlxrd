const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const birdWidth = 70;
const birdHeight = 40;
const verticalGap = 160;
const pipeSpacing = 440;
const initialPipeOffset = 1000;
const pipeSpeed = 3;
const pipeHitboxMarginX = 225;


const birdHitbox = {
  offsetX: 10,
  offsetY: 5,
  width: birdWidth - 19,
  height: birdHeight - 9
};

const stars = [];
const startCount = 250;

let birdX, birdY, birdVelocity;
const gravity = 0.2;
const lift = -7;
const maxFallSpeed = 8;
let score;
let pipes;

const birdSkins = [
  { name: 'Green', src: 'gpu_bird_green.png' },
  { name: 'Purple', src: 'gpu_bird_purple.png' },
  { name: 'Pink', src: 'gpu_bird_pink.png' },
  { name: 'Blue', src: 'gpu_bird_blue.png' },
  { name: 'Orange', src: 'gpu_bird_orange.png' }
];

const pipeTopImg = new Image();
pipeTopImg.src = 'pipe_top.png';

const pipeBottomImg = new Image();
pipeBottomImg.src = 'pipe_bottom.png';

let selectedSkin = null;
const birdImg = new Image();

let gameState = 'menu'; 
let savedScore = 0;
let savedPipes = [];
let savedBirdY = 0;
let savedBirdVelocity = 0;
let pipeWidth, pipeHeightTop, pipeHeightBottom;

const bgMusic = new Audio('background_music.mp3'); 
bgMusic.loop = true;
bgMusic.volume = 0.5;
bgMusic.play();

const volumeControl = document.getElementById('volumeControl');
volumeControl.addEventListener('input', () => {
  bgMusic.volume = volumeControl.value;
});


let imagesLoaded = 0;
function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === 2) {

    pipeWidth       = pipeTopImg.width;       
    pipeHeightTop   = pipeTopImg.height;      
    pipeHeightBottom= pipeBottomImg.height;   
    resetGame();  
    gameLoop();  
  }
}
pipeTopImg.onload = checkImagesLoaded;
pipeBottomImg.onload = checkImagesLoaded;

document.addEventListener('keydown', e => {
  if (e.code === 'Escape') {
    if (gameState === 'game') {
      
      savedScore = score;
      savedPipes = pipes.map(p => ({ ...p }));
      savedBirdY = birdY;
      savedBirdVelocity = birdVelocity;
      gameState = 'menu';
    } else if (gameState === 'menu' && selectedSkin !== null) {
      
      score = savedScore;
      pipes = savedPipes.map(p => ({ ...p }));
      birdY = savedBirdY;
      birdVelocity = savedBirdVelocity;
      gameState = 'game';
    }
  }

  if (gameState === 'game' && (e.code === 'Space' || e.code === 'ArrowUp')) {
    flap();
  }
});

document.addEventListener('touchstart', () => {
  if (gameState === 'game') flap();
})

function rectIntersect(r1, r2) {
  return !(
    r1.x + r1.width  < r2.x ||
    r1.x            > r2.x + r2.width ||
    r1.y + r1.height < r2.y ||
    r1.y            > r2.y + r2.height
  );
}



function initStarts() {
  stars.length = 0;
  for (let i = 0; i < startCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      baseRadius: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2
    });
  } 
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  birdX = canvas.width / 2;
  initStarts();
  if (gameState === 'game') resetGame();
}
window.addEventListener('resize', resize);
resize();

document.addEventListener('keydown', e => {
  if (gameState === 'game' && (e.code === 'Space' || e.code === 'ArrowUp')) flap();
});
document.addEventListener('touchstart', () => {
  if (gameState === 'game') flap();
});

function flap() { birdVelocity = lift; }

function resetGame() {
  score = 0;
  birdY = canvas.height / 2;
  birdVelocity = 0;
  pipes = [{ x: birdX + initialPipeOffset, holeY: randomHoleY() }];
}

function randomHoleY() {
  const min = pipeHeightBottom + verticalGap / 2;
  const max = canvas.height - pipeHeightTop - verticalGap / 2;
  return Math.random() * (max - min) + min;
}


const skinImages = [];

function loadSkinImages(callback) {
  let loadedCount = 0;
  birdSkins.forEach((skin, i) => {
    const img = new Image();
    img.src = skin.src;
    img.onload = () => {
      loadedCount++;
      if (loadedCount === birdSkins.length) {
        callback();
      }
    };
    skinImages[i] = img;
  });
}

function drawMenu() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.font = '32px Arial';
  ctx.fillText('Select your bird skin:', 50, 50);


  ctx.font = '24px Arial';
  ctx.fillText('Current Score: ' + savedScore, 400, 55);

  birdSkins.forEach((skin, index) => {
    const x = 50;
    const y = 100 + index * 90;

    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, 300, 70);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(skin.name, x + 100, y + 45);

    const img = skinImages[index];
    if (img) {
      ctx.drawImage(img, x + 10, y + 10, 70, 50);
    }
  });

  ctx.font = '18px Arial';
  ctx.fillStyle = '#888';
  ctx.fillText('Press ESC to resume game', 50, canvas.height - 30);
}


function onCanvasClick(e) {
  if (gameState !== 'menu') return;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  birdSkins.forEach((skin, index) => {
    const x = 50;
    const y = 100 + index * 90;
    if (mouseX >= x && mouseX <= x + 300 && mouseY >= y && mouseY <= y + 70) {
      selectedSkin = skin;
      birdImg.src = selectedSkin.src;
      birdImg.onload = () => {
        score = 0;
        birdY = canvas.height / 2;
        birdVelocity = 0;
        pipes = [{ x: birdX + initialPipeOffset, holeY: randomHoleY() }];
        savedScore = 0;
        savedPipes = pipes.map(p => ({ ...p }));
        savedBirdY = birdY;
        savedBirdVelocity = birdVelocity;
        gameState = 'game';
      };
    }
  });
}

canvas.addEventListener('click', onCanvasClick);

function update() {
  if (gameState !== 'game') return;

  pipes.forEach((p, i) => {
    
    p.x -= pipeSpeed;
    if (i === pipes.length - 1 && p.x < canvas.width - pipeSpacing) {
      pipes.push({ x: canvas.width, holeY: randomHoleY(), scored: false });
    }
    if (!p.scored && p.x + pipeWidth - pipeHitboxMarginX < birdX + birdHitbox.offsetX) {
      score++;
      p.scored = true;
    }


    const holeTop    = p.holeY - verticalGap / 2;
    const holeBottom = p.holeY + verticalGap / 2;
  

    const topPipeBox = {
      x: p.x + pipeHitboxMarginX,
      y: holeTop    - pipeHeightBottom,
      width:  pipeWidth - 2 * pipeHitboxMarginX,
      height: pipeHeightBottom
    };
  

    const bottomPipeBox = {
      x: p.x + pipeHitboxMarginX,
      y: holeBottom,
      width:  pipeWidth - 2 * pipeHitboxMarginX,
      height: pipeHeightTop
    };
  

    const birdBox = {
      x: birdX + birdHitbox.offsetX,
      y: birdY + birdHitbox.offsetY,
      width:  birdHitbox.width,
      height: birdHitbox.height
    };
  

    if (rectIntersect(birdBox, topPipeBox) ||
        rectIntersect(birdBox, bottomPipeBox)) {
        gameState = 'gameover';
    }
  });


  birdVelocity += gravity;
  if (birdVelocity > maxFallSpeed) birdVelocity = maxFallSpeed;
  birdY += birdVelocity;

  if (birdY + birdHeight > canvas.height || birdY < 0) {
    gameState = 'gameover'
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'game') {
    ctx.fillStyle = '#4D8FC3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff'
    const time = Date.now() / 1000;
    stars.forEach(star => {
      const pulse = Math.sin(time*2+star.phase) * 0.5 +1;
      const radius = star.baseRadius * pulse;
      ctx.beginPath();
      ctx.arc(star.x, star.y, radius,0, Math.PI * 2);
      ctx.fill();
    })

    ctx.fillStyle = '#2E8B57';
    pipes.forEach(p => {
      const holeTop    = p.holeY - verticalGap / 2;
      const holeBottom = p.holeY + verticalGap / 2;
    
      const topPipeY = holeTop - pipeHeightBottom;
      ctx.drawImage(pipeBottomImg, p.x, topPipeY, pipeWidth, pipeHeightBottom);
    

      const bottomPipeY = holeBottom;
      ctx.drawImage(pipeTopImg, p.x, bottomPipeY, pipeWidth, pipeHeightTop);
      console.log('pipeWidth =', pipeWidth, 'margin =', pipeHitboxMarginX);
    });
    if (birdImg.complete) {
      ctx.drawImage(birdImg, birdX, birdY, birdWidth, birdHeight);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Press ESC to choose team', 10, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Made by ov4rlxrd', 10, 120);

  } else if (gameState === 'gameover') {
    drawGameOver();
  }
}

function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#fff';
  ctx.font = '64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 50);

  ctx.font = '36px Arial';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);

  ctx.font = '24px Arial';
  ctx.fillText('Press Space or Click to Restart', canvas.width / 2, canvas.height / 2 + 60);
}

document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState === 'gameover') {
    resetGame();
    gameState = 'game';
  }
});

canvas.addEventListener('click', () => {
  if (gameState === 'gameover') {
    resetGame();
    gameState = 'game';
  }
});


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

