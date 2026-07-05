from localflow.stats import Stats, StatsTracker


def test_record_and_round_trip(tmp_path):
    path = tmp_path / "stats.json"
    tracker = StatsTracker(path)
    tracker.record("hello world foo", audio_seconds=2.0, latency_seconds=1.5)
    tracker.record("one two", audio_seconds=1.0, latency_seconds=0.5)

    reloaded = StatsTracker(path)
    assert reloaded.stats == Stats(
        dictations=2, words=5, audio_seconds=3.0, latency_seconds=2.0
    )


def test_summary(tmp_path):
    tracker = StatsTracker(tmp_path / "stats.json")
    assert tracker.summary() == "No dictations yet"
    tracker.record("a b c", audio_seconds=60.0, latency_seconds=2.0)
    assert "1 dictations" in tracker.summary()
    assert "3 words" in tracker.summary()
    assert "avg 2.0s" in tracker.summary()


def test_corrupt_stats_file_starts_fresh(tmp_path):
    path = tmp_path / "stats.json"
    path.write_text("{not json")
    tracker = StatsTracker(path)
    assert tracker.stats == Stats()
