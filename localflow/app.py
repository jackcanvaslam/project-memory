"""LocalFlow orchestrator: hotkey -> record -> transcribe -> clean -> inject."""

from __future__ import annotations

import logging
import threading
import time

from pynput.keyboard import Controller, Key

from .audio import Recorder
from .cleanup import Cleaner
from .commands import match_command
from .config import Config
from .hotkeys import PushToTalk
from .inject import Injector
from .stats import StatsTracker
from .transcriber import Transcriber
from .tray import Tray
from .window import active_window_title

log = logging.getLogger(__name__)

_SPECIAL_KEYS = {
    "enter": Key.enter,
    "tab": Key.tab,
    "escape": Key.esc,
}


class LocalFlowApp:
    def __init__(self, cfg: Config, config_path: str | None = None):
        self.cfg = cfg
        self.recorder = Recorder(cfg.audio)
        self.transcriber = Transcriber(cfg.stt, cfg.dictionary)
        self.cleaner = Cleaner(cfg.cleanup, cfg.dictionary)
        self.injector = Injector(cfg.injection)
        self.keyboard = Controller()
        self.stats = StatsTracker()
        self.tray = Tray(
            on_quit=self.quit,
            on_toggle_cleanup=self._toggle_cleanup,
            cleanup_enabled=lambda: self.cfg.cleanup.enabled,
            stats_text=self.stats.summary,
            config_path=config_path,
        )
        self.hotkey = PushToTalk(
            cfg.hotkey, self._on_hotkey_down, self._on_hotkey_up
        )
        self._stop = threading.Event()

    # -- lifecycle ---------------------------------------------------------

    def run(self) -> None:
        self.tray.run_detached()
        self.tray.set_state("processing", "loading model")
        self.transcriber.load()
        if self.cfg.cleanup.enabled:
            threading.Thread(target=self.cleaner.warm_up, daemon=True).start()
        self.tray.set_state("idle")
        self.hotkey.start()
        log.info(
            "ready — %s %s to dictate",
            "hold" if self.cfg.mode == "hold" else "press",
            self.cfg.hotkey,
        )
        try:
            while not self._stop.wait(0.5):
                pass
        except KeyboardInterrupt:
            pass
        finally:
            self.hotkey.stop()
            self.tray.stop()

    def quit(self) -> None:
        self._stop.set()

    def _toggle_cleanup(self) -> None:
        self.cfg.cleanup.enabled = not self.cfg.cleanup.enabled
        log.info("AI cleanup %s", "on" if self.cfg.cleanup.enabled else "off")
        if self.cfg.cleanup.enabled:
            threading.Thread(target=self.cleaner.warm_up, daemon=True).start()

    # -- hotkey callbacks (must return fast; pynput thread) -----------------

    def _on_hotkey_down(self) -> None:
        if self.cfg.mode == "toggle" and self.recorder.recording:
            self._finish_recording()
            return
        try:
            self.recorder.start()
            self.tray.set_state("listening")
        except Exception as e:  # noqa: BLE001
            log.error("could not start recording: %s", e)
            self.tray.set_state("error", str(e))

    def _on_hotkey_up(self) -> None:
        if self.cfg.mode == "toggle":
            return  # toggle mode stops on the next press, not on release
        self._finish_recording()

    def _finish_recording(self) -> None:
        if not self.recorder.recording:
            return
        audio = self.recorder.stop()
        self.tray.set_state("processing")
        threading.Thread(
            target=self._process, args=(audio,), daemon=True
        ).start()

    # -- pipeline -----------------------------------------------------------

    def _process(self, audio) -> None:
        t0 = time.perf_counter()
        try:
            transcript = self.transcriber.transcribe(audio)
            if not transcript:
                return
            if self.cfg.commands_enabled:
                actions = match_command(transcript)
                if actions is not None:
                    self._execute_command(actions)
                    return
            title = active_window_title()
            cleaned = self.cleaner.clean(transcript, title)
            self.injector.inject(cleaned)
            latency = time.perf_counter() - t0
            self.stats.record(
                cleaned,
                audio_seconds=len(audio) / self.cfg.audio.sample_rate,
                latency_seconds=latency,
            )
            log.info("end-to-end %.2fs", latency)
        except Exception as e:  # noqa: BLE001 - never crash the app loop
            log.exception("pipeline failed: %s", e)
            self.tray.set_state("error", str(e)[:60])
            time.sleep(2)
        finally:
            self.tray.set_state("idle")

    def _execute_command(self, actions: list[str]) -> None:
        for action in actions:
            parts = action.split("+")
            if len(parts) == 2 and parts[0] == "ctrl":
                with self.keyboard.pressed(Key.ctrl):
                    self.keyboard.press(parts[1])
                    self.keyboard.release(parts[1])
            else:
                key = _SPECIAL_KEYS.get(action)
                if key is not None:
                    self.keyboard.press(key)
                    self.keyboard.release(key)
