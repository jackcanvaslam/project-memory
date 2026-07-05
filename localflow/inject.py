"""Text injection into the focused window.

Default: clipboard + Ctrl+V with clipboard restore (what Wispr Flow
itself does on Windows — fast, Unicode-safe, reliable for long text).
Fallback: per-character Unicode keystrokes via pynput (SendInput with
KEYEVENTF_UNICODE under the hood) for clipboard-blocking apps.

Known limits (both paths): a non-elevated process cannot inject into an
elevated window (UIPI) — run LocalFlow as Administrator to fix.
"""

from __future__ import annotations

import logging
import time

import pyperclip
from pynput.keyboard import Controller, Key

log = logging.getLogger(__name__)


class Injector:
    def __init__(self, cfg):
        self.cfg = cfg
        self.keyboard = Controller()

    def inject(self, text: str) -> None:
        if not text:
            return
        if self.cfg.method == "type":
            self._type(text)
            return
        try:
            self._paste(text)
        except Exception as e:  # noqa: BLE001 - clipboard blocked -> type instead
            log.warning("clipboard paste failed (%s), falling back to typing", e)
            self._type(text)

    def _paste(self, text: str) -> None:
        previous = None
        if self.cfg.restore_clipboard:
            try:
                previous = pyperclip.paste()
            except pyperclip.PyperclipException:
                previous = None
        pyperclip.copy(text)
        with self.keyboard.pressed(Key.ctrl):
            self.keyboard.press("v")
            self.keyboard.release("v")
        # Give the target app time to read the clipboard before restoring.
        time.sleep(self.cfg.paste_delay_s)
        if previous is not None:
            pyperclip.copy(previous)

    def _type(self, text: str) -> None:
        # pynput drops bare \n in some apps; send explicit Enter presses.
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if line:
                self.keyboard.type(line)
            if i < len(lines) - 1:
                self.keyboard.press(Key.enter)
                self.keyboard.release(Key.enter)
