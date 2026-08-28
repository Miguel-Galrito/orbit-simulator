# Orbit Simulator — N-Body Gravity Sandbox

An interactive 2D orbital mechanics simulator built with vanilla JavaScript
and HTML5 Canvas — no frameworks, no dependencies. Simulates real
gravitational n-body dynamics using a 4th-order Runge-Kutta (RK4) integrator,
with a simplified Solar System, a binary star system, an Earth–Moon–satellite
system, and a chaotic 3-body scenario as presets.

**[Live demo →](#)** *[https://Miguel-Galrito.github.io/orbit-simulator](https://Miguel-Galrito.github.io/orbit-simulator)*

## Why this project

Built to combine an aerospace engineering background with software
development — orbital mechanics is exactly the kind of problem that needs
both a correct physical model and decent numerical methods to stay stable.

## Features

- **Real n-body gravity**: every body attracts every other body (not just
  a fixed central mass), integrated with RK4 for numerical stability.
- **4 presets**: simplified Solar System (Sun → Saturn, real relative
  masses and orbital speeds), a binary star with an orbiting planet, an
  Earth–Moon–satellite system, and a chaotic unstable 3-body configuration.
- **Add your own bodies** at runtime with custom mass, position and
  velocity, and watch how they perturb the system.
- **Pan and zoom** camera, adjustable simulation speed.
- **Energy drift readout**: tracks total mechanical energy (kinetic +
  potential) over time as a sanity check on integrator accuracy — a
  well-behaved RK4 run should stay within a fraction of a percent over
  a full simulated year.
- **Click a body** to inspect its live mass, speed and distance from the
  origin.

## Physics notes

- Units: internally everything is SI (meters, kilograms, seconds); the UI
  converts to/from astronomical units (AU), Earth masses, km/s and days
  for readability.
- Gravity: pairwise Newtonian gravitation, `F = G·m₁·m₂/r²`, with a small
  softening term to avoid force singularities on close encounters.
- Integration: classical RK4 applied to the full `[x, y, vx, vy]` state
  vector of every body simultaneously — this is what keeps orbits closed
  and stable instead of visibly drifting like a naive Euler integrator
  would.

## Project structure

```
orbit-simulator/
├── index.html      UI layout and control panel
├── style.css        Styling
├── physics.js       Gravity model + RK4 integrator + presets (no DOM code)
├── script.js         Rendering loop, camera, UI wiring
└── README.md
```

`physics.js` has zero DOM dependencies on purpose — the integrator and
presets could be reused headless (e.g. for tests or a Node script) without
touching the rendering code.

## Running locally

No build step. Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Possible next steps

- 3D rendering (Three.js) with inclination and out-of-plane orbits
- Orbital elements input (semi-major axis, eccentricity, inclination) instead of raw position/velocity
- Barycentric camera mode (auto-follow center of mass)
- Collision detection / merging on close approach
- Save/load custom systems as JSON

## License

MIT
