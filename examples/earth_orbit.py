"""Run a one-orbit 400 km circular Earth example."""

from orbit_simulator.domain.constants import EARTH_MU, EARTH_RADIUS
from orbit_simulator.domain.elements import OrbitalElements
from orbit_simulator.domain.metrics import period
from orbit_simulator.simulation.propagator import propagate
from orbit_simulator.visualization.plot import plot_trajectory

import matplotlib.pyplot as plt

altitude = 400_000.0
state = OrbitalElements(EARTH_RADIUS + altitude, 0.0).to_state(EARTH_MU)
T = period(state.position, state.velocity, EARTH_MU)
_, states = propagate(state, T, T / 500, EARTH_MU)

plot_trajectory(states, "400 km circular Earth orbit")
plt.show()
