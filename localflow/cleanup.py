"""Transcript cleanup via a local Ollama LLM.

Strict prompt with worked examples (adapted from Murmur) — the examples
are what make 3B-class models obey the output format. On any failure or
timeout the raw transcript is returned so dictation never breaks.
"""

from __future__ import annotations

import logging
import time

import requests

log = logging.getLogger(__name__)

PROMPT_TEMPLATE = """You clean up dictated text. Follow the rules and study the examples.
RULES:
- Remove meaningless filler words (um, uh, like, you know) unless they carry meaning.
- Add natural punctuation and capitalization; end statements with a period, questions with a question mark.
- Capitalize proper nouns, product names, and brand names.
- Apply spoken self-corrections ("scratch that", "actually I meant", "no wait") — remove the struck portion, keep the corrected version.
{dictionary_rule}{tone_rule}- Do NOT add words that weren't spoken. Do NOT change meaning. Do NOT formalize tone. Do NOT wrap in quotes. Do NOT add preamble.
EXAMPLES:
INPUT:   hey can you um send me the file when you get a chance
CLEANED: Hey can you send me the file when you get a chance?
INPUT:   i was thinking we could go to the store actually no the park
CLEANED: I was thinking we could go to the park.
NOW CLEAN THIS DICTATION:
INPUT:   {text}
CLEANED:"""


def build_prompt(
    text: str,
    dictionary: list[str] | None = None,
    window_title: str | None = None,
) -> str:
    dictionary_rule = ""
    if dictionary:
        dictionary_rule = (
            "- Preserve these terms EXACTLY: " + ", ".join(dictionary) + "\n"
        )
    tone_rule = ""
    if window_title:
        tone_rule = (
            f'- The text will be typed into a window titled "{window_title}"; '
            "keep punctuation style appropriate for that context.\n"
        )
    return PROMPT_TEMPLATE.format(
        dictionary_rule=dictionary_rule, tone_rule=tone_rule, text=text
    )


def parse_response(raw: str) -> str:
    """Strip artifacts small models occasionally add despite the rules."""
    text = raw.strip()
    for prefix in ("CLEANED:", "Cleaned:", "OUTPUT:", "Output:"):
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        text = text[1:-1].strip()
    return text


class Cleaner:
    def __init__(self, cfg, dictionary: list[str] | None = None):
        self.cfg = cfg
        self.dictionary = dictionary or []

    def warm_up(self) -> None:
        """Preload the model into VRAM so the first dictation isn't slow."""
        try:
            requests.post(
                f"{self.cfg.ollama_url}/api/generate",
                json={
                    "model": self.cfg.model,
                    "keep_alive": self.cfg.keep_alive,
                },
                timeout=self.cfg.timeout_s,
            )
            log.info("ollama model %s warmed up", self.cfg.model)
        except requests.RequestException as e:
            log.warning("ollama warm-up failed (is Ollama running?): %s", e)

    def clean(self, text: str, window_title: str | None = None) -> str:
        """Clean the transcript; return the raw text on any failure."""
        if not text.strip():
            return ""
        if not self.cfg.enabled:
            return text
        prompt = build_prompt(
            text,
            self.dictionary,
            window_title if self.cfg.app_tone else None,
        )
        t0 = time.perf_counter()
        try:
            resp = requests.post(
                f"{self.cfg.ollama_url}/api/generate",
                json={
                    "model": self.cfg.model,
                    "prompt": prompt,
                    "stream": False,
                    "keep_alive": self.cfg.keep_alive,
                    "options": {"temperature": self.cfg.temperature},
                },
                timeout=self.cfg.timeout_s,
            )
            resp.raise_for_status()
            cleaned = parse_response(resp.json().get("response", ""))
        except (requests.RequestException, ValueError) as e:
            log.warning("cleanup failed, using raw transcript: %s", e)
            return text
        log.info("cleanup took %.2fs", time.perf_counter() - t0)
        return cleaned if cleaned else text
