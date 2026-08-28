"""Matplotlib visualisation helpers."""

import matplotlib.pyplot as plt
import numpy as np


def plot_trajectory(states: np.ndarray, title: str = "Orbital trajectory"):
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.plot(states[:, 0] / 1e3, states[:, 1] / 1e3, label="spacecraft")
    ax.scatter([0], [0], s=120, label="central body")
    ax.set_xlabel("x (km)")
    ax.set_ylabel("y (km)")
    ax.set_title(title)
    ax.set_aspect("equal", adjustable="box")
    ax.grid(True, alpha=0.25)
    ax.legend()
    return fig
