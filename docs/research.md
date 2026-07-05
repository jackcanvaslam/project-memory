# Building a Local, Open-Source Wispr Flow Clone on Windows 11 (GTX 1660 Ti, 6 GB VRAM)

## TL;DR
- **Yes, this is fully buildable on your hardware, and a proven blueprint already exists.** The winning stack is **faster-whisper (small.en, `int8_float32` on the GPU) → Ollama (Qwen 2.5 3B, Q4_K_M) for cleanup → clipboard-paste injection via a global hotkey.** A near-identical open-source project ("Murmur") already does exactly this on a comparable NVIDIA GPU with ~1.5s end-to-end latency.
- **Your 6 GB VRAM is the binding constraint, and it forces two specific choices:** (1) never use `float16` on the GTX 1660 Ti (Turing TU116 has no tensor cores and half-rate FP16 — use `int8_float32`); (2) keep STT on GPU (small model, ~2.7 GB) and run a 3B cleanup LLM that Ollama auto-unloads, rather than a 7B that won't co-reside.
- **What you can replicate vs. what you can't:** hotkey dictation, high-accuracy transcription, filler-word/punctuation cleanup, custom vocabulary, and basic command mode are all replicable locally. Wispr Flow's ~700ms cloud latency, its proprietary fine-tuned ASR, and per-app tone auto-switching are harder — but you can approximate tone-switching by feeding the active window title into the cleanup prompt.

## Key Findings

### 1. How Wispr Flow actually works
Wispr Flow is a cloud-dependent AI voice keyboard. The user experience is a single push-to-talk/toggle hotkey: hold, speak naturally, release, and clean formatted text is inserted at the cursor in any app. The distinguishing feature is not the transcription but the **LLM post-processing layer**: it removes filler words, resolves mid-sentence self-corrections, adds punctuation/capitalization, and adapts tone to the target app (casual in Slack, formal in email). It also offers a Command Mode for voice editing, custom vocabulary, and a whisper-detection mode.

Architecturally (confirmed via Wispr's own engineering posts and infra vendor Baseten): Flow runs its **entire pipeline — ASR plus Llama-based transcript enhancement — in the cloud** on AWS. Per Wispr Flow's engineering post (wisprflow.ai/post/technical-challenges): *"Our users expect full transcription and LLM formatting/interpretation of their speech within 700ms of when they stop speaking,"* budgeted as *"E2E ASR inference in <200ms, E2E LLM inference in <200ms, and ... a maximum networking budget of 200ms."* Baseten's case study confirms the LLM step: *"the Llama model must consistently process and generate 100+ tokens in under 250 milliseconds. The Wispr Flow team achieved this with Baseten's TensorRT-LLM engine builder for fine-tuned Llama models."* Wispr trains its own personalized ASR models rather than using stock Whisper, and its growth teardown claims a ~10% word error rate vs. ~27% for OpenAI Whisper and ~47% for Apple dictation. **There is no offline mode; all audio is uploaded.** This is the core thing you are replacing with local components.

On Windows, Flow itself uses clipboard-based paste injection (it temporarily writes to the clipboard, pastes, and restores prior contents), and it explicitly fails when the target app runs with higher privileges than Flow ("Update admin settings to paste" — fixed by running as Administrator). This is direct confirmation of the injection approach and its gotchas that your clone will also face.

**Feasible to replicate locally:** hotkey capture, transcription, filler/punctuation/capitalization cleanup, self-correction handling, custom vocabulary, command mode, cross-app text injection.
**Hard/cloud-dependent:** ~700ms latency, the proprietary low-WER personalized ASR, seamless per-app tone auto-switching (approximatable), and mobile apps.

### 2. Local speech-to-text engine options for a GTX 1660 Ti (6 GB)
The GTX 1660 Ti is Turing TU116: **no tensor cores and weak/half-rate FP16.** This is the single most important hardware fact for STT selection. Confirmed consequences from primary GitHub sources:

- **`float16` does not work efficiently.** CTranslate2 (faster-whisper's backend) throws "Requested float16 compute type, but the target device or backend do not support efficient float16 computation" and silently falls back to float32 (faster-whisper Issues #42, #727). The maintainer-recommended working config for the 1660 Ti is **`device="cuda", compute_type="int8_float32"`** (faster-whisper Issue #1399), and on the 1660 family FP32 is actually *faster* than FP16 (whisper Discussion #391).

**Recommended runtime: faster-whisper (CTranslate2).** On NVIDIA GPUs it is the fastest local Whisper implementation, ~4x faster than reference Whisper at identical accuracy, with int8 cutting VRAM ~40%. Measured numbers on your exact class of card:

- **small.en, GPU FP32, GTX 1660 Super (6 GB):** ~0.6s to decode 10s of audio, ~2.7 GB VRAM (whisper Discussion #391). Sub-1-second — ideal for dictation. This is the field-tested sweet spot.
- **medium.en, GPU FP32, 1660 Super:** ~1.1s for 10s audio (greedy), ~5.7 GB VRAM — nearly the whole card, borderline, and beam search pushes it to 2.3–3.9s.
- **faster-whisper on 1660 Ti, float32, 200s audio file (Discussion #1254):** tiny 5.0s, base 6.0s, small 10.8s (~18x real-time), medium 25.4s (~8x real-time). **large/large-v2 ran ~1000s — roughly 3x SLOWER than CPU** because the FP32 large model overflows 6 GB VRAM into system RAM. The maintainer confirmed this is VRAM spillover; the fix is int8, but nobody re-benchmarked large in int8 on this card.

**Model recommendation:** use **small.en** (or distil-small.en) for the best latency/accuracy balance. Avoid large-v3 in any form — it either doesn't fit or spills. `distil-large-v3` (int8, English-only, ~756M params, ~1.5 GB, ~6x faster than large-v3) is a reasonable higher-accuracy option that should fit in int8 and avoid the spill, but there's no 1660 Ti-specific benchmark confirming its speed.

**Alternative engines:**
- **whisper.cpp** — CUDA/Vulkan capable, more memory-efficient, has a `--stream` mode and Silero VAD integration. Good fallback, but its CUDA path is generally slower than CTranslate2 on NVIDIA. Note: whisper.cpp GPU init on Vulkan can take 5–30s.
- **NVIDIA Parakeet TDT 0.6B v3** — leads the Open ASR Leaderboard: **6.32% avg WER at RTFx 3,332.74** (the highest throughput of any system on the leaderboard), per NVIDIA's Canary/Parakeet technical report (arXiv:2509.14128); the v3 model card lists 6.34% across 25 European languages, and the English-only v2 is 6.05% WER at RTFx 3,390 (RTFx 3,380 at batch size 128 on the parakeet-tdt-0.6b-v2 HF model card). It is transducer-based (streaming-native) and **almost never hallucinates during silence** (trained on the large Granary corpus — ~660,000 hours multilingual for v3, ~120,000 hours English for v2; a widely-cited "36k hours of pure non-speech" figure could not be verified and should be treated as unconfirmed). Runs via NeMo/ONNX; on a 6 GB card it's viable but heavier to set up than faster-whisper. Handy and OpenWhispr bundle it. Strong option if you want the lowest-latency, no-hallucination path, but more integration work.
- **Moonshine (v2)** — ultra-low-latency streaming ONNX model (~61M params tiny), sliding-window attention, designed for on-device real-time; runs on CPU. Excellent for a live-preview partial transcript, less accurate than Whisper small for the final pass.
- **Vosk** — lightweight, streaming, low accuracy; only if you need CPU-only real-time.

**GPU vs CPU tradeoff on 6 GB:** run STT on GPU (small = ~2.7 GB) and either (a) run the cleanup LLM on CPU/RAM, or (b) run a small quantized LLM on GPU and rely on Ollama's idle auto-unload. The catastrophic large-model numbers above are the concrete warning against trying to fit too much in 6 GB.

**Streaming vs batch:** Whisper is architecturally a batch (30s-chunk) model, not truly streaming. Real dictation apps (including Wispr and this plan) use a **push-to-talk pattern**: buffer audio while the key is held, transcribe the whole utterance on release. For near-real-time feel, the standard patterns are: faster-whisper + Silero VAD on short segments; whisper_streaming (local-agreement policy, ~3.3s latency); or a tiny model for live partials + small model for the final pass (VoiceInk/local-whisper do this). For your hardware and use case, **push-to-talk with faster-whisper small.en is the right default** — it gives sub-1s results on short phrases without streaming complexity.

### 3. The Ollama cleanup LLM layer
Ollama runs the local cleanup model and exposes an HTTP API (`localhost:11434`). It keeps the model warm in VRAM between calls (no cold-start) and **unloads after exactly 5 minutes idle by default** — per the Ollama FAQ (docs.ollama.com/faq): *"By default models are kept in memory for 5 minutes before being unloaded"* (override with `OLLAMA_KEEP_ALIVE` or per-request `keep_alive`; `0` = unload now, `-1` = never). This idle auto-unload is the key memory-management behavior that makes co-residence with Whisper workable and frees the GPU for other apps.

**Model recommendation for 6 GB shared with Whisper:**
- **Qwen 2.5 3B (Q4_K_M, ~2 GB)** — the recommended default. Strong instruction-following at low VRAM; pairs with small.en (2.7 GB) to fit ~4.7 GB on the card with headroom.
- **Llama 3.2 3B (Q4_K_M, ~2–3 GB)** — equivalent alternative, good instruction following.
- **Gemma 2 2B / Phi-4-mini 3.8B (~3 GB)** — smaller/faster options.
- **Qwen 2.5 7B (Q4_K_M, ~5 GB)** — what Murmur uses on a 12 GB card; **too large to co-reside with Whisper on 6 GB.** Only viable if you run Whisper on CPU or accept model swapping.
- **Avoid reasoning models (Qwen 3 "thinking", DeepSeek-R1):** their thinking tokens add multi-second latency that kills the dictation feel.

**Recommended cleanup latency:** ~1s once warm for a 3B model on a short dictation. Keep the prompt tight and temperature low (~0.3).

**Example system prompt** (adapted from the proven Murmur prompt — strict, with worked examples, which is what makes small models obey format):
```
You clean up dictated text. Follow the rules and study the examples.
RULES:
- Remove meaningless filler words (um, uh, like, you know) unless they carry meaning.
- Add natural punctuation and capitalization; end statements with a period, questions with a question mark.
- Capitalize proper nouns, product names, and brand names.
- Apply spoken self-corrections ("scratch that", "actually I meant", "no wait") — remove the struck portion, keep the corrected version.
- Preserve these terms EXACTLY: {dictionary}
- Do NOT add words that weren't spoken. Do NOT change meaning. Do NOT formalize tone. Do NOT wrap in quotes. Do NOT add preamble.
EXAMPLES:
INPUT:   hey can you um send me the file when you get a chance
CLEANED: Hey can you send me the file when you get a chance?
INPUT:   i was thinking we could go to the store actually no the park
CLEANED: I was thinking we could go to the park.
NOW CLEAN THIS DICTATION:
INPUT:   {text}
CLEANED:
```

**GPU/CPU split strategy:** The cleanest design on 6 GB is **STT on GPU + Qwen 2.5 3B on GPU (total ~4.7 GB)**, letting Ollama auto-unload when idle. If you also run other GPU apps (games, ComfyUI), fall back to a 3B/2B model or move Whisper to CPU. Running the LLM entirely on CPU is viable for a 3B model (a few hundred ms to ~1–2s) and keeps the whole GPU free for STT.

### 4. System-level text injection & hotkey plumbing on Windows 11
**Hotkey capture:** Use **pynput** (`keyboard.GlobalHotKeys` or a raw `Listener`) for a push-to-talk hold/release or toggle hotkey. pynput is cross-platform, actively maintained, and its listeners run on a background thread. The `keyboard` library also works and supports global hotkeys but often needs admin rights and is Windows/Linux-focused. Ctrl+Win is a good default combo (used by Murmur).

**Text injection — two approaches, with tradeoffs:**
1. **Clipboard + paste (recommended default):** put cleaned text on the clipboard (pyperclip), send Ctrl+V, then restore prior clipboard. **Fast, reliable for long text, and Unicode-safe.** This is what Wispr Flow itself uses. Gotchas: some apps read the clipboard slowly (add a short sleep before restoring), some terminals/IDEs use Ctrl+Shift+V, and some apps (Citrix, RDP, password managers) block clipboard paste.
2. **Direct keystroke synthesis via SendInput (`KEYEVENTF_UNICODE`):** types each character as a Unicode keystroke; works when clipboard is blocked (RDP/VDI) and needs no clipboard. Slower for long text. `pynput.Controller.type()` wraps this; for max speed use ctypes SendInput or the KeyWin library. Note that SendInput events carry an `LLMHF_INJECTED` flag that some secure apps/games detect and block.

**Windows-specific gotchas (all confirmed):**
- **Elevated apps:** a non-elevated app cannot inject into a window running as Administrator (UIPI). To dictate into elevated apps, run your tool as Administrator. Wispr Flow hits exactly this.
- **Unicode:** use `KEYEVENTF_UNICODE` for non-ASCII; note `\n` may be dropped and needs an explicit Enter key.
- **Focus:** injection goes to the focused window — ensure a text field is focused; there's no way to guarantee focus, so a brief status indicator helps.

**Audio capture + VAD:** capture mic with **sounddevice** (or pyaudio) at 16 kHz mono float32 (Whisper's required format — resample from 44.1/48 kHz with e.g. `soxr`/`librosa`/`rubato`). For voice activity detection use **Silero VAD** (deep-learning, far more accurate than webrtcvad, ~0.004 RTF on CPU — negligible) with a 0.5 speech threshold, 250ms min speech, 500ms min silence. webrtcvad is lighter but noisier. For pure push-to-talk you may not even need VAD (record while key held); VAD is essential for the auto-stop-on-silence and continuous modes.

### 5. Existing open-source projects to fork or borrow from
| Project | Stack | Local STT | Ollama/LLM cleanup | Windows | Notes / closeness to Wispr Flow |
|---|---|---|---|---|---|
| **Murmur** (BrianDurand1/murmur) | Single-file Python | faster-whisper small.en | **Yes — Ollama Qwen 2.5 7B** | **Yes (built for it)** | **Closest match to your exact goal.** Ctrl+Win hold, tray icon, custom dictionary, strict cleanup prompt. Built in one Claude Code session. Best starting fork. |
| **WhisperWriter** (savbell + TomFrankly fork) | Python (pynput) | Whisper, faster-whisper, Vosk | **Yes — Ollama + others** | **Yes (Tom Frankly fork is Windows-focused)** | Mature, multiple recording modes, find/replace, cleanup + instruction hotkeys, custom system prompts. Base project needs a maintainer but is a strong, well-featured fork target. |
| **Handy** (cjpais/Handy) | Tauri (Rust + React) | whisper.cpp + Parakeet V3, Silero VAD, CUDA | Post-processing via OpenAI-compatible API (local OK) | **Yes (winget)** | ~25.6k GitHub stars / 2.2k forks (mid-2026), actively maintained, MIT, push-to-talk, paste injection, custom dictionary, GPU accel. Best if you prefer a polished Rust app over Python. |
| **OpenWhispr** | Electron (whisper.cpp, sherpa-onnx) | Whisper + Parakeet | **Yes — "Agent Mode" custom prompts** | **Yes** | Explicitly markets itself as an open Wispr Flow alternative; visual overlay, cross-platform, MIT. |
| **VoiceInk** (Beingpax) | Swift | whisper.cpp + Parakeet | **Yes — Ollama/LM Studio** | macOS only | Great feature reference (Power Mode per-app profiles, dictionary) but **not Windows** — borrow ideas, not code. |
| **Whispering / whisperi / Diction** | JS/Tauri/Docker | mixed (some cloud-first) | Yes (OpenAI-compatible/Ollama) | varies | Additional references; Whisperi and Diction lean cloud for STT. |
| **Talon Voice** | Python-scriptable engine | own Conformer engine | N/A (command-focused) | Yes | The gold standard for **command mode** and scripting (`.talon` files, per-app grammars). Reference for your command-mode phase, not for dictation cleanup. |

**Recommendation:** **Fork Murmur** as the base (it is your exact architecture and hardware target) and **borrow WhisperWriter's** multi-mode/config structure and cleanup+instruction hotkey design. Study Handy for a production-grade Rust alternative and Talon for command-mode patterns.

### 6. Recommended architecture & implementation plan

**Component / data-flow (in words):**
1. **Tray app + hotkey listener** (pynput) sits idle in the system tray with idle/listening/processing states.
2. **On hotkey press** (hold Ctrl+Win) → start recording mic via sounddevice at 16 kHz mono; show "listening" state.
3. **On hotkey release** → stop recording; pass the buffered float32 audio to **faster-whisper (small.en, int8_float32, CUDA)**, biasing recognition with the custom-vocabulary `initial_prompt`; show "processing."
4. **Raw transcript** → POST to **Ollama** (`localhost:11434/api/generate`, model `qwen2.5:3b`, temp 0.3) with the strict cleanup system prompt + `{dictionary}` + `{active_window_title}` for tone.
5. **Cleaned text** → put on clipboard, send Ctrl+V, restore clipboard (fallback to SendInput/Unicode if paste fails); return to idle.
6. **Optional command mode:** if the transcript matches a command grammar ("new line", "delete that", "select all"), execute the mapped keystroke instead of pasting.

**Recommended concrete config:**
- STT: `WhisperModel("small.en", device="cuda", compute_type="int8_float32")`; fallback `device="cpu", compute_type="int8"`.
- Cleanup: Ollama `qwen2.5:3b` (Q4_K_M); fallback `llama3.2:3b`.
- VRAM budget: small.en ~2.7 GB + Qwen 2.5 3B ~2 GB ≈ 4.7 GB, fits 6 GB with headroom.
- Packages: `faster-whisper`, `sounddevice`, `numpy`, `pynput`, `pyperclip`, `requests`, `pystray`, `silero-vad` (optional), `soxr` (resample). Launch via `pythonw.exe` (no console window). Add Ollama's bundled CUDA DLLs to PATH at startup so faster-whisper finds CUDA without a separate install (Murmur's trick).

**Phased roadmap:**
- **Phase 0 — Environment:** Install Python 3.12, Ollama (`ollama pull qwen2.5:3b`), faster-whisper; confirm CUDA works with `int8_float32`. Verify `nvidia-smi` shows the model on GPU.
- **Phase 1 — MVP dictation (no LLM):** hotkey → record → faster-whisper small.en → clipboard paste. Target: raw transcription typed into any app in ~1s. This alone is ~95% useful.
- **Phase 2 — AI cleanup:** add the Ollama call with the strict prompt. Measure end-to-end latency (target ~1.5s like Murmur).
- **Phase 3 — Polish:** tray icon + status bubble (pystray/Tk), settings UI (hotkey/model/backend), custom dictionary (feeds both Whisper `initial_prompt` and the cleanup prompt), stats.
- **Phase 4 — Advanced:** per-app tone (feed active window title into the prompt), command mode (Talon-style grammar → keystrokes), optional live partials via a tiny model or Moonshine, optional Silero VAD auto-stop.

**Main risks & mitigations on this hardware:**
- **VRAM contention (top risk):** small.en + 3B fits; never load large-v3 or a 7B alongside Whisper. Mitigation: rely on Ollama idle auto-unload; if running games/ComfyUI, drop to 3B/2B and/or move Whisper to CPU.
- **The FP16 trap:** using `float16` will silently fall back to float32 (slower) or, with large models, spill VRAM and run 3x slower than CPU. **Always use `int8_float32` on this GPU.**
- **Latency:** expect ~1.5s end-to-end (vs Wispr's ~700ms cloud). Mitigations: keep Ollama warm, use small.en not medium, low temp, short prompt, greedy decoding.
- **Injection failures:** elevated-app blocking (run as admin), clipboard-blocking apps (SendInput fallback), terminal paste shortcuts. Build both injection paths.
- **Whisper silence hallucination:** Whisper can invent text on silence; mitigate with VAD trimming or consider Parakeet (which rarely hallucinates on silence) if this becomes a problem.

## Recommendations
1. **Start by forking Murmur** and getting Phase 1 (raw dictation) working with `faster-whisper small.en, int8_float32`. This is the fastest path to a working tool and matches your hardware exactly.
2. **Use Qwen 2.5 3B (Q4_K_M) in Ollama, not 7B** — the 7B won't co-reside with Whisper on 6 GB. Validate with `nvidia-smi` that combined usage stays under ~5 GB.
3. **Implement clipboard-paste injection first, SendInput/Unicode as fallback**, and run the app as Administrator so it works in elevated windows.
4. **Benchmark your own latency at each phase.** Thresholds that should change your plan: if end-to-end > ~2.5s, drop the cleanup model to a 2B or move it to CPU; if transcription alone > ~1.5s on short phrases, you are likely on float32 large or spilling VRAM — switch to small.en/int8; if VRAM errors appear, move the LLM to CPU.
5. **Defer streaming.** Push-to-talk is good enough and vastly simpler; only add live partials (tiny model/Moonshine) in Phase 4 if the wait feels long on long dictations.
6. **Evaluate Handy or OpenWhispr as a no-code/less-code fallback** — if you'd rather configure than build, Handy (Rust, Parakeet+Whisper, active) already delivers most of the local dictation experience; add a local OpenAI-compatible cleanup endpoint pointed at Ollama.

## Caveats
- Several performance figures come from the **GTX 1660 Super**, not the Ti — they share the TU116 die, 6 GB, and no-tensor-core FP16 limitation, so they're representative but not identical, and they were measured on vanilla openai-whisper `decode()` (faster-whisper `transcribe()` should be at least as fast).
- The catastrophic "large model 3x slower than CPU" numbers were measured in **float32** (VRAM spillover); nobody re-benchmarked large in int8 on this card, so large-model int8 performance is unknown but still not recommended for real-time.
- Wispr Flow's specific claims (10% WER, ~700ms budget) are **vendor/engineering figures** (Wispr + Baseten) describing cloud infrastructure you are not replicating; treat them as targets, not guarantees.
- Many benchmark blogs cited (promptquorum, localaimaster, gigagpu, codersera) are **secondary aggregators**; the primary sources are the GitHub issues/discussions and official model cards, which I prioritized for the hardware-specific numbers.
- Model/VRAM figures assume Q4_K_M quantization and short context; longer cleanup prompts and larger KV caches raise LLM VRAM.
- The open-source landscape moves fast; verify each project's current maintenance status, star count, and license before committing to a fork.