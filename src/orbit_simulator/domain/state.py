"""Cartesian spacecraft state representation."""

from dataclasses import dataclass
import numpy as np

@dataclass(frozen=True)
class StateVector:
    """Position and velocity in an inertial Cartesian frame."""

    position: np.ndarray
    velocity: np.ndarray

    def __post_init__(self) -> None:
        p = np.asarray(self.position, dtype=float)
        v = np.asarray(self.velocity, dtype=float)
        if p.shape != (3,) or v.shape != (3,):
            raise ValueError("position and velocity must each have shape (3,)")
        object.__setattr__(self, "position", p)
        object.__setattr__(self, "velocity", v)

    @property
    def radius(self) -> float:
        return float(np.linalg.norm(self.position))

    @property
    def speed(self) -> float:
        return float(np.linalg.norm(self.velocity))
