"""Microphone capture for push-to-talk recording.

Records 16 kHz mono float32 directly (Whisper's required format) via
sounddevice, so no resampling step is needed.
"""

from __future__ import annotations

import logging
import threading

import numpy as np
import sounddevice as sd

from .config import AudioConfig

log = logging.getLogger(__name__)


class Recorder:
    """Buffers mic audio between start() and stop()."""

    def __init__(self, cfg: AudioConfig):
        self.cfg = cfg
        self._chunks: list[np.ndarray] = []
        self._lock = threading.Lock()
        self._stream: sd.InputStream | None = None

    @property
    def recording(self) -> bool:
        return self._stream is not None

    def start(self) -> None:
        if self._stream is not None:
            return
        self._chunks = []
        self._stream = sd.InputStream(
            samplerate=self.cfg.sample_rate,
            channels=self.cfg.channels,
            dtype="float32",
            callback=self._on_audio,
        )
        self._stream.start()
        log.debug("recording started")

    def _on_audio(self, indata: np.ndarray, frames, time_info, status) -> None:
        if status:
            log.warning("audio status: %s", status)
        with self._lock:
            max_chunks = int(
                self.cfg.max_seconds * self.cfg.sample_rate / max(len(indata), 1)
            )
            if len(self._chunks) < max_chunks:
                self._chunks.append(indata.copy())

    def stop(self) -> np.ndarray:
        """Stop recording and return the buffered audio as mono float32."""
        stream, self._stream = self._stream, None
        if stream is not None:
            stream.stop()
            stream.close()
        with self._lock:
            chunks, self._chunks = self._chunks, []
        if not chunks:
            return np.zeros(0, dtype=np.float32)
        audio = np.concatenate(chunks)
        if audio.ndim > 1:
            audio = audio.mean(axis=1)
        log.debug("recorded %.2fs of audio", len(audio) / self.cfg.sample_rate)
        return audio.astype(np.float32)
