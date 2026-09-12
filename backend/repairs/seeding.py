"""Committed catalog seed: export the catalog structure to JSON and load it back.

The seed carries only Apple Lab's own catalog — Apple product facts (names,
years, chips, A-numbers) and our original copy. It never carries prices,
competitor reference prices or crawl source URLs, so it is safe to commit and
is what CI and production load (`manage.py seed_catalog`).
"""
from django.db import transaction

from .models import DeviceFamily, DeviceModel, Issue, ModelIssue

SEED_VERSION = 1

FAMILY_FIELDS = (
    "name_en", "name_bn", "kind", "icon", "display_order", "is_active",
    "intro_en", "intro_bn", "content_en", "content_bn", "faq",
    "seo_title_en", "seo_title_bn", "seo_description_en", "seo_description_bn",
)
ISSUE_FIELDS = (
    "name_en", "name_bn", "category", "icon", "display_order", "is_active",
    "default_content_en", "default_content_bn", "default_faq",
)
MODEL_FIELDS = (
    "name_en", "name_bn", "line", "size_label", "chip", "generation", "release_year",
    "release_label", "model_numbers", "apple_identifier", "display_order", "is_active",
    "is_featured", "notes_en", "notes_bn", "content_en", "content_bn", "faq",
    "seo_title_en", "seo_title_bn", "seo_description_en", "seo_description_bn",
)


def upsert(model_cls, lookup: dict, fields: dict, overwrite: bool):
    """Create with `fields`; on an existing row only overwrite when asked, so a
    re-seed or re-import never clobbers what the owner edited in the admin."""
    obj = model_cls.objects.filter(**lookup).first()
    if obj is None:
        return model_cls.objects.create(**lookup, **fields)
    if overwrite:
        for key, value in fields.items():
            setattr(obj, key, value)
        obj.save()
    return obj


def _pick(obj, fields):
    return {name: getattr(obj, name) for name in fields}


def export_seed() -> dict:
    families = DeviceFamily.objects.order_by("display_order", "slug")
    issues = Issue.objects.prefetch_related("applies_to").order_by("display_order", "slug")
    models = DeviceModel.objects.select_related("family").order_by("family__display_order", "display_order", "slug")
    offerings = (
        ModelIssue.objects.select_related("model__family", "issue")
        .order_by("model__family__display_order", "model__slug", "issue__display_order")
    )
    offering_map: dict[str, list[str]] = {}
    inactive: list[str] = []
    for o in offerings:
        key = f"{o.model.family.slug}/{o.model.slug}"
        offering_map.setdefault(key, []).append(o.issue.slug)
        if not o.is_active:
            inactive.append(f"{key}/{o.issue.slug}")
    return {
        "version": SEED_VERSION,
        "families": [{"slug": f.slug, **_pick(f, FAMILY_FIELDS)} for f in families],
        "issues": [
            {
                "slug": i.slug,
                **_pick(i, ISSUE_FIELDS),
                "applies_to": sorted(f.slug for f in i.applies_to.all()),
            }
            for i in issues
        ],
        "models": [{"family": m.family.slug, "slug": m.slug, **_pick(m, MODEL_FIELDS)} for m in models],
        # "family/model" -> issue slugs. Structure only; no prices of any kind.
        "offerings": offering_map,
        "inactive_offerings": inactive,
    }


@transaction.atomic
def load_seed(data: dict, overwrite: bool = False) -> dict:
    if data.get("version") != SEED_VERSION:
        raise ValueError(f"Unsupported catalog seed version: {data.get('version')!r}")

    families = {}
    for row in data["families"]:
        fields = {k: row[k] for k in FAMILY_FIELDS if k in row}
        families[row["slug"]] = upsert(DeviceFamily, {"slug": row["slug"]}, fields, overwrite)

    issues = {}
    for row in data["issues"]:
        fields = {k: row[k] for k in ISSUE_FIELDS if k in row}
        issue = upsert(Issue, {"slug": row["slug"]}, fields, overwrite)
        issue.applies_to.add(*[families[s] for s in row.get("applies_to", []) if s in families])
        issues[row["slug"]] = issue

    models = {}
    for row in data["models"]:
        family = families[row["family"]]
        fields = {k: row[k] for k in MODEL_FIELDS if k in row}
        models[(row["family"], row["slug"])] = upsert(
            DeviceModel, {"family": family, "slug": row["slug"]}, fields, overwrite
        )

    inactive = set(data.get("inactive_offerings", []))
    created = 0
    for key, issue_slugs in data["offerings"].items():
        family_slug, model_slug = key.split("/", 1)
        model = models.get((family_slug, model_slug))
        if model is None:
            continue
        for issue_slug in issue_slugs:
            issue = issues.get(issue_slug)
            if issue is None:
                continue
            _, was_created = ModelIssue.objects.get_or_create(
                model=model, issue=issue, defaults={"is_active": f"{key}/{issue_slug}" not in inactive}
            )
            created += int(was_created)

    return {
        "families": len(families),
        "issues": len(issues),
        "models": len(models),
        "offerings_created": created,
    }
