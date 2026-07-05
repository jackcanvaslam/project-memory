"""Basic command mode: spoken phrases that map to keystrokes instead of
being pasted as text (Talon-style, minimal grammar)."""

from __future__ import annotations

import re

# phrase -> list of key actions understood by app.execute_command
COMMANDS: dict[str, list[str]] = {
    "new line": ["enter"],
    "new paragraph": ["enter", "enter"],
    "delete that": ["ctrl+z"],
    "select all": ["ctrl+a"],
    "copy that": ["ctrl+c"],
    "paste that": ["ctrl+v"],
    "undo that": ["ctrl+z"],
    "redo that": ["ctrl+y"],
    "press enter": ["enter"],
    "press tab": ["tab"],
    "press escape": ["escape"],
}

_STRIP = re.compile(r"[^a-z ]+")


def normalize(transcript: str) -> str:
    return _STRIP.sub("", transcript.lower()).strip()


def match_command(transcript: str) -> list[str] | None:
    """Return key actions if the whole utterance is exactly a command."""
    return COMMANDS.get(normalize(transcript))
