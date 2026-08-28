"""Classical orbital elements and conversion to Cartesian state."""

from dataclasses import dataclass
import math
import numpy as np

from .state import StateVector

@dataclass(frozen=True)
class OrbitalElements:
    """Classical elements: a (m), e, i, RAAN, argument of periapsis, true anomaly."""
    semi_major_axis: float
    eccentricity: float
    inclination: float = 0.0
    raan: float = 0.0
    argument_of_periapsis: float = 0.0
    true_anomaly: float = 0.0

    def to_state(self, mu: float) -> StateVector:
        a, e = self.semi_major_axis, self.eccentricity
        if a <= 0 or not (0 <= e < 1):
            raise ValueError("This educational converter currently supports bound ellipses: a>0 and 0<=e<1")
        p = a * (1 - e * e)
        nu = self.true_anomaly
        r = p / (1 + e * math.cos(nu))
        rp = np.array([r * math.cos(nu), r * math.sin(nu), 0.0])
        vp = math.sqrt(mu / p) * np.array([-math.sin(nu), e + math.cos(nu), 0.0])

        ci, si = math.cos(self.inclination), math.sin(self.inclination)
        co, so = math.cos(self.raan), math.sin(self.raan)
        cw, sw = math.cos(self.argument_of_periapsis), math.sin(self.argument_of_periapsis)
        R = np.array([
            [co*cw-so*sw*ci, -co*sw-so*cw*ci, so*si],
            [so*cw+co*sw*ci, -so*sw+co*cw*ci, -co*si],
            [sw*si, cw*si, ci],
        ])
        return StateVector(R @ rp, R @ vp)
