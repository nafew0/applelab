"""Auto-page engine: variable substitution + Markdown → sanitized HTML.

Templates (Issue.default_content_*, family/model content) may use
``{{ model.name }}``, ``{{ model.chip }}``, ``{{ model.year }}``,
``{{ model.numbers }}``, ``{{ family.name }}``, ``{{ issue.name }}``,
``{{ price_from }}``, ``{{ brand }}``, ``{{ city }}``, ``{{ area }}``.
Unknown variables render as empty strings (never raw braces on a page).
"""
import re

import markdown
import nh3

from content.localize import pick

VAR_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}")

BRAND = {"en": "Apple Lab", "bn": "অ্যাপল ল্যাব"}
CITY = {"en": "Dhaka", "bn": "ঢাকা"}
AREA = {"en": "Dhanmondi", "bn": "ধানমন্ডি"}
NUMBER_SEP = {"en": ", ", "bn": ", "}


def format_bdt(value) -> str:
    """৳ 7,500 style; empty when None."""
    if value is None:
        return ""
    return f"৳ {int(value):,}"


def build_context(lang: str, family=None, model=None, issue=None, offering=None) -> dict:
    ctx = {"brand": BRAND[lang], "city": CITY[lang], "area": AREA[lang]}
    if family is not None:
        ctx["family.name"] = pick(family, "name", lang)
        ctx["family.slug"] = family.slug
    if model is not None:
        ctx.update(
            {
                "model.name": pick(model, "name", lang),
                "model.chip": model.chip or "",
                "model.year": str(model.release_year or ""),
                "model.line": model.line or "",
                "model.size": model.size_label or "",
                "model.numbers": NUMBER_SEP[lang].join(model.model_numbers or []),
                "model.generation": model.generation or "",
            }
        )
        if family is None:
            ctx["family.name"] = pick(model.family, "name", lang)
            ctx["family.slug"] = model.family.slug
    if issue is not None:
        ctx["issue.name"] = pick(issue, "name", lang)
        ctx["issue.slug"] = issue.slug
    if offering is not None:
        ctx["price_from"] = format_bdt(offering.price_from)
        ctx["warranty_days"] = str(offering.warranty_days)
        ctx["turnaround_hours"] = str(offering.turnaround_hours or "")
    return ctx


def substitute(text: str, ctx: dict) -> str:
    if not text:
        return ""
    return VAR_RE.sub(lambda m: str(ctx.get(m.group(1), "")), text)


def markdown_to_html(text: str) -> str:
    if not text:
        return ""
    html = markdown.markdown(text, extensions=["extra", "sane_lists"])
    return nh3.clean(html)


def render(text: str, ctx: dict) -> str:
    """Substitute variables then convert Markdown to sanitized HTML."""
    return markdown_to_html(substitute(text, ctx))


def render_faq(items, ctx: dict, lang: str) -> list:
    """[{q_en,q_bn,a_en,a_bn}] → [{question, answer_html}] in ``lang`` with EN fallback."""
    out = []
    for item in items or []:
        question = item.get(f"q_{lang}") or item.get("q_en") or ""
        answer = item.get(f"a_{lang}") or item.get("a_en") or ""
        if not question:
            continue
        out.append(
            {
                "question": substitute(question, ctx),
                "answer_html": render(answer, ctx),
            }
        )
    return out
