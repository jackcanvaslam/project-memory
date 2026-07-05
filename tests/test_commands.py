from localflow.commands import match_command, normalize


def test_exact_match():
    assert match_command("new line") == ["enter"]
    assert match_command("delete that") == ["ctrl+z"]


def test_punctuation_and_case_normalized():
    assert normalize("New line.") == "new line"
    assert match_command("New Line.") == ["enter"]
    assert match_command("Select all!") == ["ctrl+a"]


def test_dictation_is_not_a_command():
    assert match_command("please add a new line to the file") is None
    assert match_command("") is None
