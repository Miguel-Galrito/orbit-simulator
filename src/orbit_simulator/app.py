"""Interactive Streamlit front-end."""

import math
import streamlit as st

from orbit_simulator.domain.constants import EARTH_MU, EARTH_RADIUS
from orbit_simulator.domain.elements import OrbitalElements
from orbit_simulator.domain.metrics import eccentricity, period, semi_major_axis, specific_energy
from orbit_simulator.simulation.propagator import propagate
from orbit_simulator.visualization.plot import plot_trajectory

st.set_page_config(page_title="Orbit Simulator", page_icon="🛰️", layout="wide")
st.title("🛰️ Orbit Simulator")
st.caption("Two-body orbital mechanics • Python + NumPy + RK4")

col1, col2 = st.columns(2)
with col1:
    altitude_km = st.slider("Altitude (km)", 200, 50_000, 400, 50)
    ecc = st.slider("Eccentricity", 0.0, 0.90, 0.0, 0.01)
    inclination_deg = st.slider("Inclination (deg)", 0.0, 180.0, 0.0, 1.0)
with col2:
    duration_orbits = st.slider("Simulation length (orbits)", 0.25, 3.0, 1.0, 0.25)
    steps_per_orbit = st.slider("RK4 steps/orbit", 100, 2000, 500, 100)

r_perigee = EARTH_RADIUS + altitude_km * 1e3
a = r_perigee / (1 - ecc)
period_s = 2 * math.pi * math.sqrt(a**3 / EARTH_MU)

elements = OrbitalElements(
    semi_major_axis=a,
    eccentricity=ecc,
    inclination=math.radians(inclination_deg),
)
state = elements.to_state(EARTH_MU)
_, states = propagate(state, duration_orbits * period_s, period_s / steps_per_orbit, EARTH_MU)

fig = plot_trajectory(states, "Earth-centered two-body orbit")
st.pyplot(fig, use_container_width=True)

c1, c2, c3, c4 = st.columns(4)
c1.metric("Semi-major axis", f"{semi_major_axis(states[0,:3], states[0,3:], EARTH_MU)/1e3:,.1f} km")
c2.metric("Eccentricity", f"{eccentricity(states[0,:3], states[0,3:], EARTH_MU):.4f}")
c3.metric("Period", f"{period(states[0,:3], states[0,3:], EARTH_MU)/60:.1f} min")
c4.metric("Specific energy", f"{specific_energy(states[0,:3], states[0,3:], EARTH_MU)/1e6:.2f} MJ/kg")

st.info("Educational two-body model. It does not include J2, drag, third-body gravity, thrust, collisions, or atmospheric effects.")
