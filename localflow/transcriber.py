"""Speech-to-text via faster-whisper (CTranslate2).

GTX 1660 Ti notes (Turing TU116, no tensor cores):
- compute_type MUST be int8_float32 on CUDA. float16 raises
  "Requested float16 compute type ..." and silently falls back to
  float32; large models in float32 spill past 6 GB VRAM and run
  ~3x slower than CPU.
- small.en is the latency/accuracy sweet spot (~2.7 GB VRAM,
  sub-1s on short utterances).
"""

from __future__ import annotations

import logging
import os
import sys
import time

import numpy as np

log = logging.getLogger(__name__)


def _add_ollama_cuda_dlls() -> None:
    """Reuse Ollama's bundled CUDA DLLs so faster-whisper finds CUDA
    without a separate CUDA toolkit install (Murmur's trick)."""
    if sys.platform != "win32":
        return
    local = os.environ.get("LOCALAPPDATA", "")
    for sub in ("Programs\\Ollama\\lib\\ollama", "Programs\\Ollama"):
        path = os.path.join(local, sub)
        if os.path.isdir(path):
            try:
                os.add_dll_directory(path)
                os.environ["PATH"] = path + os.pathsep + os.environ.get("PATH", "")
                log.debug("added Ollama CUDA DLL dir: %s", path)
            except OSError:
                pass


class Transcriber:
    def __init__(self, cfg, dictionary: list[str] | None = None):
        self.cfg = cfg
        self.dictionary = dictionary or []
        self.model = None
        self.device_in_use = "?"

    def load(self) -> None:
        """Load the model, falling back CUDA -> CPU if CUDA init fails."""
        _add_ollama_cuda_dlls()
        from faster_whisper import WhisperModel

        attempts = []
        if self.cfg.device == "cuda":
            attempts.append(("cuda", self.cfg.compute_type))
        attempts.append(("cpu", self.cfg.cpu_compute_type))

        last_err: Exception | None = None
        for device, compute_type in attempts:
            try:
                t0 = time.perf_counter()
                self.model = WhisperModel(
                    self.cfg.model, device=device, compute_type=compute_type
                )
                self.device_in_use = f"{device}/{compute_type}"
                log.info(
                    "loaded %s on %s in %.1fs",
                    self.cfg.model,
                    self.device_in_use,
                    time.perf_counter() - t0,
                )
                return
            except Exception as e:  # noqa: BLE001 - any backend failure -> fallback
                last_err = e
                log.warning("failed to load on %s/%s: %s", device, compute_type, e)
        raise RuntimeError(f"could not load Whisper model: {last_err}")

    def initial_prompt(self) -> str | None:
        """Bias recognition toward custom-vocabulary terms."""
        if not self.dictionary:
            return None
        return "Vocabulary: " + ", ".join(self.dictionary) + "."

    def transcribe(self, audio: np.ndarray) -> str:
        if self.model is None:
            self.load()
        if len(audio) < 1600:  # <0.1s — nothing to transcribe
            return ""
        t0 = time.perf_counter()
        segments, _info = self.model.transcribe(
            audio,
            language=self.cfg.language,
            beam_size=self.cfg.beam_size,
            initial_prompt=self.initial_prompt(),
            condition_on_previous_text=False,
            vad_filter=True,  # trims silence; guards against hallucination
        )
        text = " ".join(seg.text.strip() for seg in segments).strip()
        log.info("transcribed %.2fs audio in %.2fs: %r",
                 len(audio) / 16000, time.perf_counter() - t0, text[:80])
        return text
