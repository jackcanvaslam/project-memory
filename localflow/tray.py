"""System tray icon with idle/listening/processing states (pystray)."""

from __future__ import annotations

import threading
from typing import Callable

import pystray
from PIL import Image, ImageDraw

STATE_COLORS = {
    "idle": (110, 110, 110),
    "listening": (220, 60, 60),
    "processing": (240, 160, 40),
    "error": (140, 40, 160),
}


def _make_icon(color: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((8, 8, 56, 56), fill=color + (255,))
    # simple mic silhouette
    draw.rounded_rectangle((27, 18, 37, 38), radius=5, fill=(255, 255, 255, 230))
    draw.arc((22, 26, 42, 44), start=0, end=180, fill=(255, 255, 255, 230), width=3)
    draw.line((32, 44, 32, 50), fill=(255, 255, 255, 230), width=3)
    return img


class Tray:
    def __init__(self, on_quit: Callable[[], None]):
        self._icons = {state: _make_icon(c) for state, c in STATE_COLORS.items()}
        self.icon = pystray.Icon(
            "LocalFlow",
            self._icons["idle"],
            "LocalFlow — idle",
            menu=pystray.Menu(
                pystray.MenuItem("Quit", lambda: on_quit()),
            ),
        )

    def set_state(self, state: str, detail: str = "") -> None:
        self.icon.icon = self._icons.get(state, self._icons["idle"])
        title = f"LocalFlow — {state}"
        if detail:
            title += f" ({detail})"
        self.icon.title = title

    def run_detached(self) -> None:
        threading.Thread(target=self.icon.run, daemon=True).start()

    def stop(self) -> None:
        self.icon.stop()
