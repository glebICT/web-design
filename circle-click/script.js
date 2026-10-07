const field = document.getElementById('field');
const scoreEl = document.getElementById('score');
const missedEl = document.getElementById('missed');

const MAX_RADIUS = 100;     // px
const SHRINK_TIME = 2000;   // ms to shrink from 100px to 0
const PAUSE = 400;          // ms between circles

let score = 0;
let missed = 0;

function randomColor() {
  const channel = () => Math.floor(Math.random() * 256);
  return `rgb(${channel()}, ${channel()}, ${channel()})`;
}

function spawnCircle() {
  const circle = document.createElement('div');
  circle.className = 'circle';
  circle.style.background = randomColor();

  // Keep the full-size circle inside the window (and below the score bar)
  const top = 50 + MAX_RADIUS;
  const x = MAX_RADIUS + Math.random() * Math.max(0, window.innerWidth - 2 * MAX_RADIUS);
  const y = top + Math.random() * Math.max(0, window.innerHeight - top - MAX_RADIUS);
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;

  field.appendChild(circle);

  const start = performance.now();
  let done = false;

  function finish(hit) {
    if (done) return;
    done = true;
    circle.remove();
    if (hit) {
      score++;
      scoreEl.textContent = score;
    } else {
      missed++;
      missedEl.textContent = missed;
    }
    setTimeout(spawnCircle, PAUSE);
  }

  circle.addEventListener('pointerdown', () => finish(true));

  function frame(now) {
    if (done) return;
    const progress = (now - start) / SHRINK_TIME;
    const radius = MAX_RADIUS * (1 - progress);
    if (radius <= 0) {
      finish(false);
      return;
    }
    circle.style.width = `${radius * 2}px`;
    circle.style.height = `${radius * 2}px`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

spawnCircle();
