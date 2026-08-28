"""Orbital diagnostics derived from a Cartesian state."""

import numpy as np


def specific_energy(position: np.ndarray, velocity: np.ndarray, mu: float) -> float:
    return float(np.dot(velocity, velocity) / 2 - mu / np.linalg.norm(position))


def angular_momentum(position: np.ndarray, velocity: np.ndarray) -> np.ndarray:
    return np.cross(position, velocity)


def eccentricity(position: np.ndarray, velocity: np.ndarray, mu: float) -> float:
    h = angular_momentum(position, velocity)
    e_vec = np.cross(velocity, h) / mu - position / np.linalg.norm(position)
    return float(np.linalg.norm(e_vec))


def semi_major_axis(position: np.ndarray, velocity: np.ndarray, mu: float) -> float:
    energy = specific_energy(position, velocity, mu)
    if energy >= 0:
        return float("inf")
    return float(-mu / (2 * energy))


def period(position: np.ndarray, velocity: np.ndarray, mu: float) -> float:
    a = semi_major_axis(position, velocity, mu)
    if not np.isfinite(a):
        return float("inf")
    return float(2 * np.pi * np.sqrt(a**3 / mu))
