"""Global push-to-talk hotkey via pynput.

Default combo: hold Ctrl+Win to record, release to transcribe (same as
Murmur). The listener runs on a pynput background thread; callbacks must
return quickly, so the app hands real work off to a worker thread.
"""

from __future__ import annotations

import logging
from typing import Callable

from pynput import keyboard

log = logging.getLogger(__name__)

_KEY_ALIASES = {
    "ctrl": {keyboard.Key.ctrl, keyboard.Key.ctrl_l, keyboard.Key.ctrl_r},
    "win": {keyboard.Key.cmd, keyboard.Key.cmd_l, keyboard.Key.cmd_r},
    "cmd": {keyboard.Key.cmd, keyboard.Key.cmd_l, keyboard.Key.cmd_r},
    "alt": {keyboard.Key.alt, keyboard.Key.alt_l, keyboard.Key.alt_r},
    "shift": {keyboard.Key.shift, keyboard.Key.shift_l, keyboard.Key.shift_r},
}


def parse_hotkey(spec: str) -> list[set]:
    """Parse e.g. "ctrl+win" into a list of alias-sets, one per key."""
    groups = []
    for part in spec.lower().split("+"):
        part = part.strip()
        if part in _KEY_ALIASES:
            groups.append(_KEY_ALIASES[part])
        elif len(part) == 1:
            groups.append({keyboard.KeyCode.from_char(part)})
        else:
            raise ValueError(f"unknown hotkey component: {part!r}")
    if not groups:
        raise ValueError("empty hotkey")
    return groups


class PushToTalk:
    """Fires on_activate when all hotkey keys are held, on_deactivate
    when any of them is released."""

    def __init__(
        self,
        hotkey: str,
        on_activate: Callable[[], None],
        on_deactivate: Callable[[], None],
    ):
        self.groups = parse_hotkey(hotkey)
        self.on_activate = on_activate
        self.on_deactivate = on_deactivate
        self._held: set = set()
        self._active = False
        self._listener: keyboard.Listener | None = None

    def _group_index(self, key) -> int | None:
        for i, group in enumerate(self.groups):
            if key in group:
                return i
        return None

    def _on_press(self, key) -> None:
        idx = self._group_index(key)
        if idx is None:
            return
        self._held.add(idx)
        if not self._active and len(self._held) == len(self.groups):
            self._active = True
            self.on_activate()

    def _on_release(self, key) -> None:
        idx = self._group_index(key)
        if idx is None:
            return
        self._held.discard(idx)
        if self._active:
            self._active = False
            self.on_deactivate()

    def start(self) -> None:
        self._listener = keyboard.Listener(
            on_press=self._on_press, on_release=self._on_release
        )
        self._listener.start()
        log.info("push-to-talk listener started")

    def stop(self) -> None:
        if self._listener is not None:
            self._listener.stop()
            self._listener = None
