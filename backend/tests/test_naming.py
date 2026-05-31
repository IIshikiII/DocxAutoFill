from domain.naming import apply_template


def test_replaces_single_placeholder():
    assert apply_template("tpl <название>.docx", "Иванов") == "tpl Иванов.docx"


def test_replaces_all_placeholders():
    assert apply_template("<a> и <b>", "X") == "X и X"


def test_no_placeholder_is_unchanged():
    assert apply_template("plain.docx", "X") == "plain.docx"
