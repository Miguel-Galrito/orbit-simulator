"""Numerical propagation for the two-body problem."""

import numpy as np

from ..domain.state import StateVector


def acceleration(position: np.ndarray, mu: float) -> np.ndarray:
    r = np.linalg.norm(position)
    if r == 0:
        raise ValueError("Position cannot be zero")
    return -mu * position / r**3


def _derivative(y: np.ndarray, mu: float) -> np.ndarray:
    return np.concatenate((y[3:], acceleration(y[:3], mu)))


def rk4_step(state: StateVector, dt: float, mu: float) -> StateVector:
    y = np.concatenate((state.position, state.velocity))
    k1 = _derivative(y, mu)
    k2 = _derivative(y + 0.5 * dt * k1, mu)
    k3 = _derivative(y + 0.5 * dt * k2, mu)
    k4 = _derivative(y + dt * k3, mu)
    yn = y + dt * (k1 + 2*k2 + 2*k3 + k4) / 6
    return StateVector(yn[:3], yn[3:])


def propagate(state: StateVector, duration: float, dt: float, mu: float) -> tuple[np.ndarray, np.ndarray]:
    """Propagate and return arrays of times and 3D states."""
    if duration < 0 or dt <= 0:
        raise ValueError("duration must be >= 0 and dt must be > 0")
    steps = int(np.ceil(duration / dt))
    times = np.minimum(np.arange(steps + 1) * dt, duration)
    states = np.empty((steps + 1, 6))
    current = state
    states[0] = np.concatenate((current.position, current.velocity))
    for i in range(1, steps + 1):
        step = times[i] - times[i - 1]
        current = rk4_step(current, step, mu)
        states[i] = np.concatenate((current.position, current.velocity))
    return times, states
