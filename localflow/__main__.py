"""Entry point: python -m localflow [--config PATH] [--no-llm] [--cpu]

On Windows, launch with pythonw.exe -m localflow to avoid a console window.
Run as Administrator if you need to dictate into elevated apps (UIPI).
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from .app import LocalFlowApp
from .config import DEFAULT_CONFIG_PATH, Config


def main() -> None:
    parser = argparse.ArgumentParser(prog="localflow")
    parser.add_argument(
        "--config", type=Path, default=DEFAULT_CONFIG_PATH,
        help=f"config file path (default: {DEFAULT_CONFIG_PATH})",
    )
    parser.add_argument(
        "--no-llm", action="store_true",
        help="skip Ollama cleanup (Phase 1 raw dictation mode)",
    )
    parser.add_argument(
        "--cpu", action="store_true",
        help="force Whisper onto CPU (frees all 6 GB VRAM)",
    )
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    cfg = Config.load(args.config)
    if not args.config.exists():
        cfg.save(args.config)  # write defaults so the user can edit them
    if args.no_llm:
        cfg.cleanup.enabled = False
    if args.cpu:
        cfg.stt.device = "cpu"

    LocalFlowApp(cfg).run()


if __name__ == "__main__":
    main()
