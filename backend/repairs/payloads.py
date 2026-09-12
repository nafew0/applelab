"""Payload builders shared by public page endpoints and staff APIs."""
from django.db.models import Count, Q

from content.localize import pick

from .models import DeviceModel, Issue, ModelIssue
from .rendering import build_context, format_bdt, render, render_faq, substitute

SEO_TITLE_MAX = 70
SEO_DESC_MAX = 320


def _default_family_seo(family, lang, top_issue_names):
    name = pick(family, "name", lang)
    issues = ", ".join(top_issue_names[:3]) or ("screen, battery, logic board" if lang == "en" else "স্ক্রিন, ব্যাটারি, লজিক বোর্ড")
    if lang == "bn":
        return (
            f"{name} রিপেয়ার ঢাকা — স্ক্রিন, ব্যাটারি ও আরও | অ্যাপল ল্যাব",
            f"ধানমন্ডি, ঢাকায় অ্যাপল ল্যাব প্রতিটি {name} মডেল মেরামত করে: {issues}। জেনুইন পার্টস, ফ্রি ডায়াগনসিস, ৯০ দিনের ওয়ারেন্টি।",
        )
    return (
        f"{name} Repair in Dhaka — Screen, Battery & More | Apple Lab",
        f"Apple Lab repairs every {name} model in Dhanmondi, Dhaka: {issues}. Genuine parts, free diagnosis, 90-day warranty.",
    )


def _default_model_seo(model, lang):
    name = pick(model, "name", lang)
    if lang == "bn":
        return (
            f"{name} রিপেয়ার ঢাকা — স্ক্রিন ও ব্যাটারির দাম | অ্যাপল ল্যাব",
            f"ঢাকায় {name} মেরামত: স্ক্রিন, ব্যাটারি, চার্জিং, লজিক বোর্ড। জেনুইন পার্টস, ফ্রি ডায়াগনসিস, ৯০ দিনের ওয়ারেন্টি। অ্যাপল ল্যাব, ধানমন্ডি।",
        )
    return (
        f"{name} Repair Dhaka — Screen & Battery Price | Apple Lab",
        f"{name} repair in Dhaka: screen, battery, charging, logic board. Genuine parts, free diagnosis, 90-day warranty. Apple Lab, Dhanmondi.",
    )


def _default_offering_seo(model, issue, lang):
    m = pick(model, "name", lang)
    i = pick(issue, "name", lang)
    if lang == "bn":
        return (
            f"{m} {i} ঢাকা — দাম ও সময় | অ্যাপল ল্যাব",
            f"ঢাকায় {m} {i}: জেনুইন পার্টস, ফ্রি ডায়াগনসিস, ৯০ দিনের ওয়ারেন্টি। অ্যাপল ল্যাব, ধানমন্ডি।",
        )
    return (
        f"{m} {i} in Dhaka — Price & Time | Apple Lab",
        f"{m} {i} at Apple Lab, Dhanmondi, Dhaka: genuine parts, free diagnosis, 90-day warranty. Same-day for most repairs.",
    )


def seo_payload(obj, lang, default_title, default_description, ctx):
    title = pick(obj, "seo_title", lang) or default_title
    description = pick(obj, "seo_description", lang) or default_description
    return {
        "title": substitute(title, ctx)[:SEO_TITLE_MAX * 2],
        "description": substitute(description, ctx)[:SEO_DESC_MAX],
    }


def family_brief(family, lang, model_count=None):
    return {
        "slug": family.slug,
        "name": pick(family, "name", lang),
        "kind": family.kind,
        "icon": family.icon,
        "hero_image": family.hero_image,
        "model_count": (
            model_count
            if model_count is not None
            else family.device_models.filter(is_active=True).count()
        ),
        "intro": pick(family, "intro", lang),
    }


def model_brief(model, lang):
    return {
        "slug": model.slug,
        "family": model.family.slug,
        "name": pick(model, "name", lang),
        "line": model.line,
        "size_label": model.size_label,
        "chip": model.chip,
        "generation": model.generation,
        "release_year": model.release_year,
        "release_label": model.release_label,
        "model_numbers": model.model_numbers or [],
        "image": model.image,
        "is_featured": model.is_featured,
    }


def issue_brief(issue, lang):
    return {
        "slug": issue.slug,
        "name": pick(issue, "name", lang),
        "category": issue.category,
        "icon": issue.icon,
    }


def offering_card(offering, lang):
    return {
        "issue": issue_brief(offering.issue, lang),
        "price_from": str(offering.price_from) if offering.price_from is not None else None,
        "price_from_display": format_bdt(offering.price_from),
        "price_options": offering.price_options or [],
        "turnaround_hours": offering.turnaround_hours,
        "warranty_days": offering.warranty_days,
        "is_indexable": offering.is_indexable,
    }


def family_top_issues(family, limit=12):
    """Issues with active offerings across the family, most common first."""
    return (
        Issue.objects.filter(
            is_active=True,
            offerings__is_active=True,
            offerings__model__family=family,
            offerings__model__is_active=True,
        )
        .annotate(n=Count("offerings"))
        .order_by("-n", "display_order", "name_en")[:limit]
    )


def family_page(family, lang):
    models = list(family.device_models.filter(is_active=True))
    issues = list(family_top_issues(family))
    ctx = build_context(lang, family=family)
    title, description = _default_family_seo(
        family, lang, [pick(i, "name", lang) for i in issues]
    )
    years = sorted({m.release_year for m in models if m.release_year}, reverse=True)
    lines = sorted({m.line for m in models if m.line})
    return {
        "family": {
            **family_brief(family, lang, model_count=len(models)),
            "content_html": render(pick(family, "content", lang), ctx),
            "faq": render_faq(family.faq, ctx, lang),
            "seo": seo_payload(family, lang, title, description, ctx),
        },
        "models": [model_brief(m, lang) for m in models],
        "issues": [issue_brief(i, lang) for i in issues],
        "years": years,
        "lines": lines,
    }


def related_models(model, limit=6):
    qs = DeviceModel.objects.filter(family=model.family, is_active=True).exclude(pk=model.pk)
    if model.release_year:
        qs = qs.filter(
            Q(release_year__gte=model.release_year - 2) & Q(release_year__lte=model.release_year + 2)
        )
    return list(qs[:limit])


def model_page(model, lang):
    ctx = build_context(lang, family=model.family, model=model)
    offerings = list(
        model.offerings.filter(is_active=True, issue__is_active=True).select_related("issue")
    )
    title, description = _default_model_seo(model, lang)
    return {
        "family": family_brief(model.family, lang),
        "model": {
            **model_brief(model, lang),
            "notes_html": render(pick(model, "notes", lang), ctx),
            "content_html": render(pick(model, "content", lang), ctx),
            "faq": render_faq(model.faq, ctx, lang),
            "seo": seo_payload(model, lang, title, description, ctx),
        },
        "offerings": [offering_card(o, lang) for o in offerings],
        "related": [model_brief(m, lang) for m in related_models(model)],
    }


def offering_page(offering, lang):
    model = offering.model
    issue = offering.issue
    ctx = build_context(lang, family=model.family, model=model, issue=issue, offering=offering)
    override = pick(offering, "content", lang)
    content_source = override or pick(issue, "default_content", lang)
    faq_items = offering.faq or issue.default_faq
    title, description = _default_offering_seo(model, issue, lang)
    return {
        "family": family_brief(model.family, lang),
        "model": model_brief(model, lang),
        "issue": issue_brief(issue, lang),
        "offering": {
            **offering_card(offering, lang),
            "content_html": render(content_source, ctx),
            "content_is_template": not bool(override),
            "faq": render_faq(faq_items, ctx, lang),
            "seo": {"title": substitute(title, ctx), "description": substitute(description, ctx)},
            "indexable": offering.is_indexable,
        },
        "siblings": [
            issue_brief(o.issue, lang)
            for o in model.offerings.filter(is_active=True, issue__is_active=True)
            .exclude(pk=offering.pk)
            .select_related("issue")[:12]
        ],
    }


def sitemap_payload():
    from .models import DeviceFamily

    families = DeviceFamily.objects.filter(is_active=True)
    models = DeviceModel.objects.filter(is_active=True, family__is_active=True).select_related("family")
    offerings = (
        ModelIssue.objects.filter(
            is_active=True, model__is_active=True, model__family__is_active=True, issue__is_active=True
        )
        .select_related("model__family", "issue")
    )
    return {
        "families": [{"slug": f.slug, "updated_at": f.updated_at.isoformat()} for f in families],
        "models": [
            {"family": m.family.slug, "slug": m.slug, "updated_at": m.updated_at.isoformat()}
            for m in models
        ],
        "offerings": [
            {
                "family": o.model.family.slug,
                "model": o.model.slug,
                "issue": o.issue.slug,
                "updated_at": o.updated_at.isoformat(),
            }
            for o in offerings
            if o.is_indexable
        ],
    }
