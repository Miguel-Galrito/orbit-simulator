# Orbit Simulator 🛰️

A portfolio-grade **Python orbital mechanics simulator** for the classical two-body problem. It converts orbital elements to Cartesian states, propagates spacecraft motion with a 4th-order Runge–Kutta (RK4) integrator, computes orbital diagnostics, and exposes an interactive Streamlit interface.

> Built as an aerospace + software engineering portfolio project.

## Stack

- Python 3.10+
- NumPy
- Matplotlib
- Streamlit (optional UI)
- Pytest

## Architecture

```text
orbit-simulator/
├── src/orbit_simulator/
│   ├── domain/
│   │   ├── constants.py      # Physical constants
│   │   ├── state.py          # Cartesian state model
│   │   ├── elements.py       # Classical elements → state
│   │   └── metrics.py        # Energy, eccentricity, period, etc.
│   ├── simulation/
│   │   └── propagator.py     # Two-body acceleration + RK4
│   ├── visualization/
│   │   └── plot.py           # Matplotlib trajectory plots
│   └── app.py                # Streamlit UI
├── tests/
├── examples/
├── pyproject.toml
└── README.md
```

The separation between **domain**, **simulation**, **visualization**, and **UI** makes the physics reusable without the web interface.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev,app]"
pytest
streamlit run src/orbit_simulator/app.py
```

Or run the standalone example:

```bash
python examples/earth_orbit.py
```

## Physics

The propagator solves the classical two-body equation:

`r'' = -μ r / |r|³`

The simulator currently supports bound elliptical orbits (`a > 0`, `0 ≤ e < 1`) and uses SI units internally. The RK4 integrator provides much better accuracy than a naive Euler implementation for this educational use case.

## Roadmap

- J2 oblateness perturbation
- Atmospheric drag
- Third-body gravity
- Thrust / finite burns
- Lambert transfer solver
- 3D trajectory visualisation
- Hohmann and bi-elliptic transfer tools
- Energy/angular-momentum error dashboards
- CI with automated tests

## Portfolio talking points

This project demonstrates **Python, numerical integration, vectorised scientific computing, software architecture, testing, data visualisation, and aerospace domain knowledge**.

## License

MIT
