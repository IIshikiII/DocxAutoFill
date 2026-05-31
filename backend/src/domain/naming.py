import re


def apply_template(template: str, value: str) -> str:
    """Replace the first <…> placeholder in template with value."""
    return re.sub(r"<[^<>]*>", value, template)
