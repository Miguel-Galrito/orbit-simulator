/**
 * physics.js
 * N-body gravity engine, integrated with 4th-order Runge-Kutta (RK4).
 *
 * Internal units are SI (meters, kilograms, seconds) for physical
 * correctness. The UI layer (script.js) converts to/from AU, Earth
 * masses, km/s and days for human-friendly input/output.
 */

const G = 6.674e-11;          // gravitational constant, m^3 kg^-1 s^-2
const AU = 1.495978707e11;    // astronomical unit, m
const EARTH_MASS = 5.972e24;  // kg
const DAY = 86400;            // s

/**
 * A single gravitating body.
 * Position/velocity are stored in SI units.
 */
class Body {
  constructor({ name, mass, x, y, vx, vy, color, radius, fixed = false }) {
    this.name = name;
    this.mass = mass;   // kg
    this.x = x;          // m
    this.y = y;          // m
    this.vx = vx;        // m/s
    this.vy = vy;        // m/s
    this.color = color;
    this.radius = radius; // display radius in px, not physical
    this.fixed = fixed;   // if true, never moves (e.g. anchoring a star is NOT used by default -
                           // we integrate everyone for physical correctness)
    this.trail = [];
  }
}

/** Returns [ax, ay] arrays (m/s^2) for every body given current state. */
function computeAccelerations(bodies) {
  const n = bodies.length;
  const ax = new Array(n).fill(0);
  const ay = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      let distSq = dx * dx + dy * dy;
      // softening to avoid singularities on close encounters
      const softening = (1e8) ** 2;
      distSq += softening;
      const dist = Math.sqrt(distSq);
      const f = G / (distSq * dist); // = G / dist^3, precomputed for reuse

      const fx = f * dx;
      const fy = f * dy;

      ax[i] += fx * bodies[j].mass;
      ay[i] += fy * bodies[j].mass;
      ax[j] -= fx * bodies[i].mass;
      ay[j] -= fy * bodies[i].mass;
    }
  }
  return [ax, ay];
}

/**
 * Advances the whole system by dt seconds using classical RK4.
 * State vector per body is [x, y, vx, vy]; derivative is [vx, vy, ax, ay].
 */
function rk4Step(bodies, dt) {
  const n = bodies.length;

  function stateOf(list) {
    return list.map(b => [b.x, b.y, b.vx, b.vy]);
  }

  function derivative(state) {
    // build temp bodies at this state to compute accelerations
    const temp = bodies.map((b, i) => ({ ...b, x: state[i][0], y: state[i][1] }));
    const [ax, ay] = computeAccelerations(temp);
    return state.map((s, i) => [s[2], s[3], ax[i], ay[i]]);
  }

  function addScaled(state, deriv, h) {
    return state.map((s, i) => [
      s[0] + deriv[i][0] * h,
      s[1] + deriv[i][1] * h,
      s[2] + deriv[i][2] * h,
      s[3] + deriv[i][3] * h,
    ]);
  }

  const s0 = stateOf(bodies);
  const k1 = derivative(s0);
  const k2 = derivative(addScaled(s0, k1, dt / 2));
  const k3 = derivative(addScaled(s0, k2, dt / 2));
  const k4 = derivative(addScaled(s0, k3, dt));

  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    b.x += (dt / 6) * (k1[i][0] + 2 * k2[i][0] + 2 * k3[i][0] + k4[i][0]);
    b.y += (dt / 6) * (k1[i][1] + 2 * k2[i][1] + 2 * k3[i][1] + k4[i][1]);
    b.vx += (dt / 6) * (k1[i][2] + 2 * k2[i][2] + 2 * k3[i][2] + k4[i][2]);
    b.vy += (dt / 6) * (k1[i][3] + 2 * k2[i][3] + 2 * k3[i][3] + k4[i][3]);
  }
}

/** Total mechanical energy of the system (kinetic + gravitational potential), Joules. */
function totalEnergy(bodies) {
  let kinetic = 0;
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
  }
  let potential = 0;
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1e8;
      potential -= (G * bodies[i].mass * bodies[j].mass) / dist;
    }
  }
  return kinetic + potential;
}

// ---------- Presets ----------
// Positions in AU, velocities in km/s, mass in Earth masses (converted below).

function toSI(defs) {
  return defs.map(d => new Body({
    name: d.name,
    mass: d.massEarth * EARTH_MASS,
    x: d.xAU * AU,
    y: d.yAU * AU,
    vx: d.vxKms * 1000,
    vy: d.vyKms * 1000,
    color: d.color,
    radius: d.radius,
  }));
}

const PRESETS = {
  solar: () => toSI([
    { name: 'Sun',     massEarth: 333000, xAU: 0,    yAU: 0, vxKms: 0,   vyKms: 0,     color: '#ffd24f', radius: 14 },
    { name: 'Mercury', massEarth: 0.055,  xAU: 0.39, yAU: 0, vxKms: 0,   vyKms: 47.9,  color: '#b5b5b5', radius: 3 },
    { name: 'Venus',   massEarth: 0.815,  xAU: 0.72, yAU: 0, vxKms: 0,   vyKms: 35.0,  color: '#e6c27a', radius: 4 },
    { name: 'Earth',   massEarth: 1,      xAU: 1.0,  yAU: 0, vxKms: 0,   vyKms: 29.8,  color: '#4fd6ff', radius: 4.5 },
    { name: 'Mars',    massEarth: 0.107,  xAU: 1.52, yAU: 0, vxKms: 0,   vyKms: 24.1,  color: '#ff6b4f', radius: 3.5 },
    { name: 'Jupiter', massEarth: 317.8,  xAU: 5.2,  yAU: 0, vxKms: 0,   vyKms: 13.1,  color: '#e0b17a', radius: 9 },
    { name: 'Saturn',  massEarth: 95.2,   xAU: 9.58, yAU: 0, vxKms: 0,   vyKms: 9.7,   color: '#e8d6a0', radius: 8 },
  ]),

  binary: () => toSI([
    { name: 'Star A', massEarth: 200000, xAU: -1, yAU: 0, vxKms: 0, vyKms: -15, color: '#ffd24f', radius: 10 },
    { name: 'Star B', massEarth: 160000, xAU: 1,  yAU: 0, vxKms: 0, vyKms: 18.5, color: '#ff8a4f', radius: 9 },
    { name: 'Planet', massEarth: 1, xAU: 3, yAU: 0, vxKms: 0, vyKms: 14, color: '#4fd6ff', radius: 3.5 },
  ]),

  earthmoon: () => toSI([
    { name: 'Earth',     massEarth: 1,       xAU: 0,        yAU: 0, vxKms: 0, vyKms: 0,    color: '#4fd6ff', radius: 8 },
    { name: 'Moon',      massEarth: 0.0123,  xAU: 0.00257,  yAU: 0, vxKms: 0, vyKms: 1.02,  color: '#c9c9c9', radius: 3 },
    { name: 'Satellite', massEarth: 0.0000001, xAU: 0.00090, yAU: 0, vxKms: 0, vyKms: 7.7,  color: '#ff4fd2', radius: 2 },
  ]),

  chaos: () => toSI([
    { name: 'A', massEarth: 100000, xAU: -1,  yAU: 0.3,  vxKms: 2,  vyKms: 10, color: '#ffd24f', radius: 8 },
    { name: 'B', massEarth: 90000,  xAU: 1,   yAU: -0.4, vxKms: -3, vyKms: -9, color: '#ff6b4f', radius: 7 },
    { name: 'C', massEarth: 80000,  xAU: 0.2, yAU: 1.1,  vxKms: 6,  vyKms: -2, color: '#4fd6ff', radius: 7 },
  ]),
};