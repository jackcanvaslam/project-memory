"""LocalFlow — a local, open-source Wispr Flow clone for Windows 11.

Pipeline: push-to-talk hotkey -> mic capture (16 kHz mono) ->
faster-whisper (small.en, int8_float32 on CUDA) -> Ollama cleanup LLM ->
clipboard-paste injection into the focused window.
"""

__version__ = "0.1.0"
