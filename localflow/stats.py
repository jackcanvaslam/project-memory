"""Usage statistics: dictation count, words, audio time, latency."""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path

log = logging.getLogger(__name__)

DEFAULT_STATS_PATH = Path.home() / ".localflow" / "stats.json"


@dataclass
class Stats:
    dictations: int = 0
    words: int = 0
    audio_seconds: float = 0.0
    latency_seconds: float = 0.0


class StatsTracker:
    def __init__(self, path: Path | str = DEFAULT_STATS_PATH):
        self.path = Path(path)
        self.stats = self._load()

    def _load(self) -> Stats:
        if not self.path.exists():
            return Stats()
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            known = {
                k: v for k, v in raw.items() if k in Stats.__dataclass_fields__
            }
            return Stats(**known)
        except (ValueError, TypeError) as e:
            log.warning("could not read stats file, starting fresh: %s", e)
            return Stats()

    def record(self, text: str, audio_seconds: float, latency_seconds: float) -> None:
        self.stats.dictations += 1
        self.stats.words += len(text.split())
        self.stats.audio_seconds += audio_seconds
        self.stats.latency_seconds += latency_seconds
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(
                json.dumps(asdict(self.stats), indent=2) + "\n", encoding="utf-8"
            )
        except OSError as e:
            log.warning("could not save stats: %s", e)

    def summary(self) -> str:
        s = self.stats
        if s.dictations == 0:
            return "No dictations yet"
        avg = s.latency_seconds / s.dictations
        return (
            f"{s.dictations} dictations, {s.words} words, "
            f"{s.audio_seconds / 60:.1f} min spoken, avg {avg:.1f}s latency"
        )
