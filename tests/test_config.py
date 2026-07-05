import json

from localflow.config import Config


def test_defaults_are_1660ti_safe():
    cfg = Config()
    assert cfg.stt.compute_type == "int8_float32"  # never float16 on TU116
    assert cfg.stt.model == "small.en"
    assert cfg.cleanup.model == "qwen2.5:3b"  # 7B won't co-reside in 6 GB
    assert cfg.audio.sample_rate == 16000


def test_round_trip(tmp_path):
    path = tmp_path / "config.json"
    cfg = Config()
    cfg.dictionary = ["Kubernetes", "Wispr"]
    cfg.cleanup.model = "llama3.2:3b"
    cfg.save(path)
    loaded = Config.load(path)
    assert loaded.dictionary == ["Kubernetes", "Wispr"]
    assert loaded.cleanup.model == "llama3.2:3b"
    assert loaded.stt.compute_type == "int8_float32"


def test_load_missing_file_returns_defaults(tmp_path):
    cfg = Config.load(tmp_path / "nope.json")
    assert cfg.stt.model == "small.en"


def test_mode_and_profiles(tmp_path):
    path = tmp_path / "config.json"
    path.write_text(json.dumps({
        "mode": "toggle",
        "cleanup": {"app_profiles": [{"match": "slack", "tone": "casual"}]},
    }))
    cfg = Config.load(path)
    assert cfg.mode == "toggle"
    assert cfg.cleanup.app_profiles == [{"match": "slack", "tone": "casual"}]
    # invalid mode falls back to default
    path.write_text(json.dumps({"mode": "bogus"}))
    assert Config.load(path).mode == "hold"


def test_unknown_keys_ignored(tmp_path):
    path = tmp_path / "config.json"
    path.write_text(json.dumps({
        "hotkey": "ctrl+alt",
        "stt": {"model": "distil-small.en", "bogus": 1},
        "future_section": {"x": 2},
    }))
    cfg = Config.load(path)
    assert cfg.hotkey == "ctrl+alt"
    assert cfg.stt.model == "distil-small.en"
