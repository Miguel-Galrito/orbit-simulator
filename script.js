/**
 * script.js
 * Rendering loop, camera (pan/zoom), UI wiring and body-picking.
 * Depends on physics.js being loaded first.
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let bodies = [];
let running = true;
let showTrails = true;
let simTimeDays = 0;
let initialEnergy = 0;

// camera
let camX = 0, camY = 0;         // world offset in AU
let pxPerAU = 100;               // zoom level (px per AU), synced with #zoom slider
let dragging = false;
let dragStart = { x: 0, y: 0 };
let camStart = { x: 0, y: 0 };
let selected = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function loadPreset(name) {
  bodies = PRESETS[name]();
  simTimeDays = 0;
  selected = null;
  camX = 0; camY = 0;
  initialEnergy = totalEnergy(bodies);
  updateStats();
}

function worldToScreen(xAU, yAU) {
  return [
    canvas.width / 2 + (xAU - camX) * pxPerAU,
    canvas.height / 2 + (yAU - camY) * pxPerAU,
  ];
}

function screenToWorld(px, py) {
  return [
    (px - canvas.width / 2) / pxPerAU + camX,
    (py - canvas.height / 2) / pxPerAU + camY,
  ];
}

function draw() {
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle starfield grid (purely decorative, fixed pattern)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const gridStep = pxPerAU;
  const offsetX = (canvas.width / 2 - camX * pxPerAU) % gridStep;
  const offsetY = (canvas.height / 2 - camY * pxPerAU) % gridStep;
  for (let x = offsetX; x < canvas.width; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = offsetY; y < canvas.height; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  for (const b of bodies) {
    const xAU = b.x / AU, yAU = b.y / AU;

    if (showTrails && b.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < b.trail.length; i++) {
        const [sx, sy] = worldToScreen(b.trail[i][0], b.trail[i][1]);
        if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const [sx, sy] = worldToScreen(xAU, yAU);
    ctx.beginPath();
    ctx.fillStyle = b.color;
    ctx.arc(sx, sy, b === selected ? b.radius + 3 : b.radius, 0, Math.PI * 2);
    ctx.fill();

    if (b === selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, b.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(232,236,247,0.7)';
    ctx.font = '11px Segoe UI, Arial';
    ctx.fillText(b.name, sx + b.radius + 5, sy + 3);
  }
}

function step() {
  const speed = parseInt(document.getElementById('speed').value, 10);
  // dt scales with slider: base step ~ 4 hours, multiplied by speed, subdivided
  // into a few sub-steps per frame for RK4 stability at high speed.
  const totalDt = speed * 4 * 3600; // seconds per frame
  const subSteps = Math.min(20, Math.max(1, speed));
  const dt = totalDt / subSteps;

  for (let s = 0; s < subSteps; s++) {
    rk4Step(bodies, dt);
  }
  simTimeDays += totalDt / DAY;

  for (const b of bodies) {
    b.trail.push([b.x / AU, b.y / AU]);
    if (b.trail.length > 600) b.trail.shift();
  }
}

function updateStats() {
  document.getElementById('simTime').textContent = simTimeDays.toFixed(1);
  document.getElementById('bodyCount').textContent = bodies.length;
  const e = totalEnergy(bodies);
  const drift = initialEnergy !== 0 ? ((e - initialEnergy) / Math.abs(initialEnergy)) * 100 : 0;
  document.getElementById('energyDrift').textContent = drift.toFixed(3) + '%';
}

function loop() {
  if (running) step();
  draw();
  updateStats();
  requestAnimationFrame(loop);
}

// ---------- UI wiring ----------

document.getElementById('preset').addEventListener('change', e => loadPreset(e.target.value));
document.getElementById('resetBtn').addEventListener('click', () => {
  loadPreset(document.getElementById('preset').value);
});
document.getElementById('playBtn').addEventListener('click', e => {
  running = !running;
  e.target.textContent = running ? 'Pause' : 'Play';
});
document.getElementById('trailBtn').addEventListener('click', e => {
  showTrails = !showTrails;
  e.target.textContent = 'Trails: ' + (showTrails ? 'On' : 'Off');
  if (!showTrails) for (const b of bodies) b.trail = [];
});
document.getElementById('zoom').addEventListener('input', e => {
  pxPerAU = parseInt(e.target.value, 10);
});

document.getElementById('addBtn').addEventListener('click', () => {
  const name = document.getElementById('bName').value || 'Body';
  const massEarth = parseFloat(document.getElementById('bMass').value) || 1;
  const xAU = parseFloat(document.getElementById('bX').value) || 0;
  const yAU = parseFloat(document.getElementById('bY').value) || 0;
  const vxKms = parseFloat(document.getElementById('bVX').value) || 0;
  const vyKms = parseFloat(document.getElementById('bVY').value) || 0;
  const color = document.getElementById('bColor').value;

  bodies.push(new Body({
    name,
    mass: massEarth * EARTH_MASS,
    x: xAU * AU,
    y: yAU * AU,
    vx: vxKms * 1000,
    vy: vyKms * 1000,
    color,
    radius: 4,
  }));
  initialEnergy = totalEnergy(bodies);
});

// pan
canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  camStart = { x: camX, y: camY };
});
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('mousemove', e => {
  if (!dragging) return;
  camX = camStart.x - (e.clientX - dragStart.x) / pxPerAU;
  camY = camStart.y - (e.clientY - dragStart.y) / pxPerAU;
});

// click to select nearest body
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const [wx, wy] = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  let closest = null, closestDist = Infinity;
  for (const b of bodies) {
    const dx = b.x / AU - wx, dy = b.y / AU - wy;
    const d = Math.hypot(dx, dy);
    if (d < closestDist) { closestDist = d; closest = b; }
  }
  const info = document.getElementById('selectedInfo');
  if (closest && closestDist < 40 / pxPerAU) {
    selected = closest;
    const speedKms = Math.hypot(closest.vx, closest.vy) / 1000;
    info.innerHTML = `<b>${closest.name}</b><br>
      Mass: ${(closest.mass / EARTH_MASS).toFixed(4)} Earth masses<br>
      Speed: ${speedKms.toFixed(2)} km/s<br>
      Distance from origin: ${(Math.hypot(closest.x, closest.y) / AU).toFixed(3)} AU`;
    info.classList.add('visible');
  } else {
    selected = null;
    info.classList.remove('visible');
  }
});

// scroll to zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const slider = document.getElementById('zoom');
  let val = pxPerAU - e.deltaY * 0.1;
  val = Math.max(10, Math.min(400, val));
  pxPerAU = val;
  slider.value = val;
}, { passive: false });

// init
loadPreset('solar');
loop();