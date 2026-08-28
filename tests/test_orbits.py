import math

import numpy as np

from orbit_simulator.domain.constants import DAY, EARTH_MU, EARTH_RADIUS
from orbit_simulator.domain.elements import OrbitalElements
from orbit_simulator.domain.metrics import eccentricity, period
from orbit_simulator.simulation.propagator import propagate


def test_circular_orbit_period_is_reasonable():
    a = EARTH_RADIUS + 400_000.0
    state = OrbitalElements(a, 0.0).to_state(EARTH_MU)
    expected = 2 * math.pi * math.sqrt(a**3 / EARTH_MU)
    assert abs(period(state.position, state.velocity, EARTH_MU) - expected) < 1e-6


def test_rk4_preserves_radius_for_circular_orbit():
    a = EARTH_RADIUS + 400_000.0
    state = OrbitalElements(a, 0.0).to_state(EARTH_MU)
    _, states = propagate(state, 600.0, 2.0, EARTH_MU)
    radii = np.linalg.norm(states[:, :3], axis=1)
    assert np.max(np.abs(radii - a)) < 50.0


def test_elements_round_trip_eccentricity():
    state = OrbitalElements(EARTH_RADIUS + 1_000_000.0, 0.2, math.radians(51.6)).to_state(EARTH_MU)
    assert abs(eccentricity(state.position, state.velocity, EARTH_MU) - 0.2) < 1e-12
