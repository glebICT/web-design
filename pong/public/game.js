// Game state
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const serverInput = document.getElementById('serverInput');
const connectBtn = document.getElementById('connectBtn');
const connectDiv = document.getElementById('connect');

let ws = null;
let myY = 250;
const keys = {};
let lastSent = 0;
let connected = false;

// Input handling
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Connection functions
function connect() {
  const server = serverInput.value || 'localhost:8765';
  initConnection(`ws://${server}`);
}

function connectFromConnect() {
  const server = document.getElementById('serverInputConnect').value;
  initConnection(`ws://${server}`);
}

// Initialize WebSocket connection
function initConnection(url) {
  if (ws) ws.close();
  
  info.textContent = `Connecting to ${url}...`;
  connectBtn.disabled = true;
  connectBtn.textContent = 'Connecting...';
  
  ws = new WebSocket(url);
  
  ws.onopen = () => {
    info.textContent = 'Connected! WASD/Arrows to move';
    connectBtn.textContent = 'Disconnect';
    connectBtn.disabled = false;
    connected = true;
    connectDiv.classList.add('hidden');
    gameLoop();
  };
  
  ws.onmessage = (event) => {
    const state = JSON.parse(event.data);
    render(state);
  };
  
  ws.onerror = () => {
    info.textContent = '❌ Connection failed! Check IP/port/firewall';
    connectBtn.textContent = 'Retry';
    connectBtn.disabled = false;
  };
  
  ws.onclose = () => {
    info.textContent = 'Disconnected';
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
    connected = false;
  };
}

// Game loop
function gameLoop() {
  if (!connected) {
    requestAnimationFrame(gameLoop);
    return;
  }
  
  // Update position
  if (keys['ArrowUp'] || keys['w'] || keys['W']) myY = Math.max(0, myY - 6);
  if (keys['ArrowDown'] || keys['s'] || keys['S']) myY = Math.min(550, myY + 6);
  
  // Send position (rate limited)
  const now = Date.now();
  if (now - lastSent > 50) { // 20fps max
    ws.send(JSON.stringify({ y: myY }));
    lastSent = now;
  }
  
  requestAnimationFrame(gameLoop);
}

// Render game state
function render(state) {
  ctx.clearRect(0, 0, 800, 600);
  
  // Center line
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(400, 0);
  ctx.lineTo(400, 600);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Ball
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Players (first player left, second right)
  Object.entries(state.players).forEach(([id, player], index) => {
    const x = index === 0 ? 10 : 780;
    ctx.fillStyle = '#0f0';
    ctx.fillRect(x, player.y - 25, 10, 50);
    
    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`${player.ip.slice(0,8)}...`, x + 15, player.y);
    ctx.fillText(`Score: ${player.score}`, x + 15, 30);
  });
}

// Show connect screen on load
window.onload = () => {
  connectDiv.classList.remove('hidden');
  serverInput.value = 'localhost:8765';
};

// Enter to connect
document.getElementById('serverInputConnect').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') connectFromConnect();
});
serverInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') connect();
});
