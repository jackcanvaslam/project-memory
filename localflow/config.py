"""Configuration loading/saving for LocalFlow.

Defaults are tuned for a GTX 1660 Ti (6 GB, Turing TU116):
- STT must use int8_float32 on CUDA (no tensor cores; float16 silently
  falls back to float32 or spills VRAM).
- Cleanup LLM must stay <= 3B quantized so it co-resides with Whisper
  (small.en ~2.7 GB + Qwen 2.5 3B Q4_K_M ~2 GB ~= 4.7 GB of 6 GB).
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

DEFAULT_CONFIG_PATH = Path.home() / ".localflow" / "config.json"


@dataclass
class SttConfig:
    model: str = "small.en"
    device: str = "cuda"  # falls back to cpu automatically if CUDA init fails
    compute_type: str = "int8_float32"  # NEVER float16 on GTX 16xx
    cpu_compute_type: str = "int8"
    beam_size: int = 1  # greedy decoding for latency
    language: str = "en"


@dataclass
class CleanupConfig:
    enabled: bool = True
    ollama_url: str = "http://localhost:11434"
    model: str = "qwen2.5:3b"
    temperature: float = 0.3
    timeout_s: float = 15.0
    keep_alive: str = "5m"  # Ollama default idle unload; -1 = never unload
    app_tone: bool = True  # feed active window title into the prompt


@dataclass
class InjectionConfig:
    method: str = "clipboard"  # "clipboard" or "type"
    paste_delay_s: float = 0.15  # wait after Ctrl+V before restoring clipboard
    restore_clipboard: bool = True


@dataclass
class AudioConfig:
    sample_rate: int = 16000  # Whisper's required input rate
    channels: int = 1
    max_seconds: float = 120.0


@dataclass
class Config:
    hotkey: str = "ctrl+win"
    stt: SttConfig = field(default_factory=SttConfig)
    cleanup: CleanupConfig = field(default_factory=CleanupConfig)
    injection: InjectionConfig = field(default_factory=InjectionConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    dictionary: list[str] = field(default_factory=list)
    commands_enabled: bool = True

    @classmethod
    def load(cls, path: Path | str = DEFAULT_CONFIG_PATH) -> "Config":
        path = Path(path)
        if not path.exists():
            return cls()
        raw = json.loads(path.read_text(encoding="utf-8"))
        return cls.from_dict(raw)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Config":
        cfg = cls()
        for section, section_cls in (
            ("stt", SttConfig),
            ("cleanup", CleanupConfig),
            ("injection", InjectionConfig),
            ("audio", AudioConfig),
        ):
            if isinstance(raw.get(section), dict):
                known = {
                    k: v
                    for k, v in raw[section].items()
                    if k in section_cls.__dataclass_fields__
                }
                setattr(cfg, section, section_cls(**known))
        if isinstance(raw.get("hotkey"), str):
            cfg.hotkey = raw["hotkey"]
        if isinstance(raw.get("dictionary"), list):
            cfg.dictionary = [str(t) for t in raw["dictionary"]]
        if isinstance(raw.get("commands_enabled"), bool):
            cfg.commands_enabled = raw["commands_enabled"]
        return cfg

    def save(self, path: Path | str = DEFAULT_CONFIG_PATH) -> None:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps(asdict(self), indent=2) + "\n", encoding="utf-8"
        )
