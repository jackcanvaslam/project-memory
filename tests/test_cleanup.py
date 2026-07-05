from localflow.cleanup import build_prompt, parse_response


def test_prompt_contains_text_and_examples():
    p = build_prompt("hello um world")
    assert "hello um world" in p
    assert "EXAMPLES:" in p
    assert p.rstrip().endswith("CLEANED:")


def test_prompt_dictionary_rule():
    p = build_prompt("deploy to prod", dictionary=["Kubernetes", "PyTorch"])
    assert "Preserve these terms EXACTLY: Kubernetes, PyTorch" in p
    assert "Preserve" not in build_prompt("deploy to prod")


def test_prompt_window_title_tone():
    p = build_prompt("hi", window_title="Inbox - Outlook")
    assert "Inbox - Outlook" in p
    assert "Outlook" not in build_prompt("hi")


def test_parse_response_strips_artifacts():
    assert parse_response("CLEANED: Hello there.") == "Hello there."
    assert parse_response('"Hello there."') == "Hello there."
    assert parse_response("  Hello there.\n") == "Hello there."
    assert parse_response("Hello.") == "Hello."
