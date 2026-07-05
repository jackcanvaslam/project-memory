# LocalFlow

A local, open-source [Wispr Flow](https://wisprflow.ai) clone for **Windows 11**, tuned for a
**GTX 1660 Ti (6 GB VRAM)**. Hold a hotkey, speak, release — cleaned, punctuated text appears
at your cursor in any app. Fully offline: no audio ever leaves your machine.

**Pipeline:** push-to-talk hotkey (Ctrl+Win) → mic capture at 16 kHz →
[faster-whisper](https://github.com/SYSTRAN/faster-whisper) `small.en` (`int8_float32` on CUDA) →
[Ollama](https://ollama.com) `qwen2.5:3b` cleanup (fillers, punctuation, self-corrections) →
clipboard-paste injection.

Design rationale, benchmarks, and alternatives are in [docs/research.md](docs/research.md).

## Why these exact choices (GTX 1660 Ti)

- **`int8_float32`, never `float16`.** Turing TU116 has no tensor cores; fp16 silently falls
  back to fp32, and large models in fp32 spill past 6 GB VRAM and run ~3x *slower* than CPU.
- **`small.en` STT (~2.7 GB) + a 3B cleanup LLM (~2 GB) ≈ 4.7 GB** — fits 6 GB with headroom.
  A 7B LLM will not co-reside with Whisper; don't use one.
- **Push-to-talk, not streaming.** Whisper is a batch model; transcribing the whole utterance
  on key release gives sub-1s results without streaming complexity.
- **Clipboard paste with restore** is what Wispr Flow itself uses on Windows; per-character
  Unicode typing is the automatic fallback for clipboard-blocking apps.

## Setup (Windows 11)

1. **Python 3.11+** — [python.org](https://www.python.org/downloads/) (check "Add to PATH").
2. **Ollama** — install from [ollama.com](https://ollama.com), then:
   ```
   ollama pull qwen2.5:3b
   ```
3. **This app:**
   ```
   git clone <this repo> && cd project-memory
   python -m venv .venv && .venv\Scripts\activate
   pip install -r requirements.txt
   ```
4. **CUDA:** no separate toolkit needed — at startup LocalFlow adds Ollama's bundled CUDA DLLs
   to the search path so faster-whisper finds them. If CUDA still fails, the app automatically
   falls back to CPU (`int8`), which is still usable for `small.en`.

## Run

```
python -m localflow            # full pipeline
python -m localflow --no-llm   # Phase 1: raw dictation, no cleanup
python -m localflow --cpu      # force Whisper onto CPU (frees all VRAM)
python -m localflow -v         # verbose logging with per-stage latency
```

For no console window, use `pythonw.exe -m localflow`. To dictate into apps running as
Administrator, run LocalFlow as Administrator too (Windows UIPI blocks injection upward —
Wispr Flow has the same limitation).

**Usage:** hold **Ctrl+Win**, speak, release. The tray icon shows state:
gray = idle, red = listening, orange = processing.

Saying exactly "new line", "delete that", "select all", etc. executes the keystroke instead
of typing the words (see `localflow/commands.py`).

## Configuration

First run writes defaults to `~\.localflow\config.json`. Notable settings:

| Setting | Default | Notes |
|---|---|---|
| `hotkey` | `ctrl+win` | e.g. `ctrl+alt`, `ctrl+shift+d` |
| `stt.model` | `small.en` | `distil-small.en` (faster) or `distil-large-v3` (more accurate, still fits in int8) |
| `stt.compute_type` | `int8_float32` | leave alone on GTX 16xx |
| `cleanup.model` | `qwen2.5:3b` | `llama3.2:3b` is an equivalent alternative; never a 7B |
| `cleanup.enabled` | `true` | `false` = raw dictation |
| `cleanup.keep_alive` | `5m` | `-1` keeps the LLM in VRAM forever; `5m` lets Ollama free VRAM when idle |
| `dictionary` | `[]` | terms preserved exactly, fed to both Whisper and the cleanup prompt |
| `injection.method` | `clipboard` | `type` forces per-character Unicode keystrokes |

## Latency tripwires

Measured targets: ~1s transcription, ~1.5s end-to-end once the LLM is warm. If you see worse:

- **End-to-end > 2.5s** → drop `cleanup.model` to a 2B (`gemma2:2b`) or run Ollama on CPU.
- **Transcription alone > 1.5s** on short phrases → you're on float32 or spilling VRAM;
  verify `compute_type` is `int8_float32` and the model is `small.en`.
- **CUDA out-of-memory** → run with `--cpu`, or set `cleanup.keep_alive` to `0`.
- Check `nvidia-smi`: combined usage should stay under ~5 GB.

## Development

Pure-logic tests run on any OS (no mic/GUI/GPU needed):

```
pip install pytest && python -m pytest tests/
```

Roadmap (see docs/research.md §6): Phase 3 — settings UI, stats; Phase 4 — richer per-app
tone profiles, extended command grammar, optional Silero VAD auto-stop, live partials.

## Credits

Architecture based on research into [Murmur](https://github.com/BrianDurand1/murmur),
WhisperWriter, Handy, and OpenWhispr — see docs/research.md §5 for the full comparison.
