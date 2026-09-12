"""Staff APIs for the device catalog (families, models, issues, offerings, matrix)."""
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Count, Q
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.admin_views import AdminAPIView, AdminPagination

from .images import MAX_UPLOAD_BYTES, InvalidImage, clear_image, image_stem, set_image, url_of
from .models import DeviceFamily, DeviceModel, Issue, ModelIssue

FAMILY_FIELDS = [
    "slug", "name_en", "name_bn", "kind", "icon", "display_order", "is_active",
    "intro_en", "intro_bn", "content_en", "content_bn", "faq",
    "seo_title_en", "seo_title_bn", "seo_description_en", "seo_description_bn",
]
MODEL_FIELDS = [
    "slug", "name_en", "name_bn", "line", "size_label", "chip", "generation", "release_year",
    "release_label", "model_numbers", "apple_identifier", "display_order", "is_active",
    "is_featured", "notes_en", "notes_bn", "content_en", "content_bn", "faq",
    "seo_title_en", "seo_title_bn", "seo_description_en", "seo_description_bn", "reference_source",
]
ISSUE_FIELDS = [
    "slug", "name_en", "name_bn", "category", "icon", "display_order", "is_active",
    "default_content_en", "default_content_bn", "default_faq",
]
OFFERING_FIELDS = [
    "is_active", "price_from", "price_options", "reference_price", "turnaround_hours",
    "warranty_days", "content_en", "content_bn", "faq", "index_policy", "content_status",
]
LIST_FIELDS = {"faq", "default_faq", "model_numbers", "price_options"}
DECIMAL_FIELDS = {"price_from", "reference_price"}
INT_FIELDS = {"display_order", "release_year", "turnaround_hours", "warranty_days"}
BOOL_FIELDS = {"is_active", "is_featured"}


# --------------------------------------------------------------- helpers
class ValidationFailed(Exception):
    def __init__(self, errors):
        super().__init__("validation failed")
        self.errors = errors


def _clean(data, allowed, *, model_cls=None, instance=None, required=()):
    """Whitelist + coerce incoming fields; raise ValidationFailed with DRF-style errors."""
    errors = {}
    cleaned = {}
    for key in allowed:
        if key not in data:
            continue
        value = data[key]
        try:
            if key in LIST_FIELDS:
                if value is None:
                    value = []
                if not isinstance(value, list):
                    raise ValueError("must be a list")
            elif key in DECIMAL_FIELDS:
                if value in (None, ""):
                    value = None
                else:
                    value = Decimal(str(value))
                    if value < 0:
                        raise ValueError("must be ≥ 0")
            elif key in INT_FIELDS:
                if value in (None, ""):
                    value = None if key != "display_order" and key != "warranty_days" else 0
                else:
                    value = int(value)
                    if value < 0:
                        raise ValueError("must be ≥ 0")
            elif key in BOOL_FIELDS:
                value = bool(value)
            elif key == "category":
                if value not in Issue.Category.values:
                    raise ValueError("invalid category")
            elif key == "kind":
                if value not in DeviceFamily.Kind.values:
                    raise ValueError("invalid kind")
            elif key == "index_policy":
                if value not in ModelIssue.IndexPolicy.values:
                    raise ValueError("invalid index policy")
            elif key == "content_status":
                if value not in ModelIssue.ContentStatus.values:
                    raise ValueError("invalid status")
            elif isinstance(value, str):
                value = value.strip()
            cleaned[key] = value
        except (ValueError, InvalidOperation) as exc:
            errors[key] = [str(exc) or "Invalid value."]
    for key in required:
        if not (cleaned.get(key) or (instance is not None and getattr(instance, key, None))):
            errors[key] = ["This field is required."]
    if errors:
        raise ValidationFailed(errors)
    return cleaned


def _ensure_slug(cleaned, instance, name_field="name_en"):
    if instance is None and not cleaned.get("slug"):
        cleaned["slug"] = slugify(cleaned.get(name_field, ""))[:80]
    if "slug" in cleaned:
        cleaned["slug"] = slugify(cleaned["slug"])[:80]
        if not cleaned["slug"]:
            raise ValidationFailed({"slug": ["Slug cannot be empty."]})
    return cleaned


def family_admin_payload(f, model_count=None):
    payload = {key: getattr(f, key) for key in FAMILY_FIELDS}
    payload.update(
        {
            "id": f.id,
            "image": url_of(f.image),
            "model_count": model_count if model_count is not None else f.device_models.count(),
            "updated_at": f.updated_at.isoformat(),
        }
    )
    return payload


def model_admin_payload(m, offering_count=None):
    payload = {key: getattr(m, key) for key in MODEL_FIELDS}
    payload.update(
        {
            "id": m.id,
            "image": url_of(m.image),
            "family": {"id": m.family_id, "slug": m.family.slug, "name_en": m.family.name_en},
            "offering_count": offering_count if offering_count is not None else m.offerings.count(),
            "updated_at": m.updated_at.isoformat(),
        }
    )
    return payload


def issue_admin_payload(i, offering_count=None):
    payload = {key: getattr(i, key) for key in ISSUE_FIELDS}
    payload.update(
        {
            "id": i.id,
            "image": url_of(i.image),
            "applies_to": list(i.applies_to.values_list("id", flat=True)),
            "offering_count": offering_count if offering_count is not None else i.offerings.count(),
            "updated_at": i.updated_at.isoformat(),
        }
    )
    return payload


def offering_admin_payload(o):
    payload = {key: getattr(o, key) for key in OFFERING_FIELDS}
    payload["price_from"] = str(o.price_from) if o.price_from is not None else None
    payload["reference_price"] = str(o.reference_price) if o.reference_price is not None else None
    payload.update(
        {
            "id": o.id,
            "image": url_of(o.image),
            "issue_image": url_of(o.issue.image),
            "model_id": o.model_id,
            "issue": {
                "id": o.issue_id, "slug": o.issue.slug, "name_en": o.issue.name_en,
                "category": o.issue.category,
            },
            "unique_words": o.unique_words,
            "is_indexable": o.is_indexable,
            "updated_at": o.updated_at.isoformat(),
        }
    )
    return payload


def _validation_response(exc):
    return Response(exc.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------------------------------------------- families
class FamilyListCreateView(AdminAPIView):
    def get(self, request):
        families = DeviceFamily.objects.annotate(n=Count("device_models")).order_by("display_order", "name_en")
        return Response({"results": [family_admin_payload(f, f.n) for f in families]})

    def post(self, request):
        try:
            cleaned = _ensure_slug(_clean(request.data, FAMILY_FIELDS, required=("name_en",)), None)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if DeviceFamily.objects.filter(slug=cleaned["slug"]).exists():
            return Response({"slug": ["A family with this slug already exists."]}, status=400)
        family = DeviceFamily.objects.create(**cleaned)
        return Response(family_admin_payload(family, 0), status=status.HTTP_201_CREATED)


class FamilyDetailView(AdminAPIView):
    def get(self, request, family_id):
        return Response(family_admin_payload(get_object_or_404(DeviceFamily, pk=family_id)))

    def patch(self, request, family_id):
        family = get_object_or_404(DeviceFamily, pk=family_id)
        try:
            cleaned = _ensure_slug(_clean(request.data, FAMILY_FIELDS, instance=family), family)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if "slug" in cleaned and DeviceFamily.objects.filter(slug=cleaned["slug"]).exclude(pk=family.pk).exists():
            return Response({"slug": ["A family with this slug already exists."]}, status=400)
        for key, value in cleaned.items():
            setattr(family, key, value)
        family.save()
        return Response(family_admin_payload(family))

    def delete(self, request, family_id):
        family = get_object_or_404(DeviceFamily, pk=family_id)
        if family.device_models.exists():
            return Response(
                {"detail": "Family has models; archive it (is_active=false) or delete the models first."},
                status=400,
            )
        family.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FamilyReorderView(AdminAPIView):
    def post(self, request):
        order = request.data.get("order")
        if not isinstance(order, list) or not all(isinstance(i, int) for i in order):
            return Response({"order": ["Must be a list of ids."]}, status=400)
        families = {f.id: f for f in DeviceFamily.objects.filter(id__in=order)}
        if len(families) != len(set(order)):
            return Response({"order": ["Unknown id."]}, status=400)
        with transaction.atomic():
            for index, fid in enumerate(order):
                DeviceFamily.objects.filter(pk=fid).update(display_order=index)
        return Response({"detail": "ok"})


# --------------------------------------------------------------- models
class ModelListCreateView(AdminAPIView):
    def get(self, request):
        # Explicit order: Meta.ordering is dropped from GROUP BY (annotate) queries.
        qs = (
            DeviceModel.objects.select_related("family")
            .annotate(n=Count("offerings"))
            .order_by("-release_year", "display_order", "name_en", "id")
        )
        family_slug = request.query_params.get("family")
        if family_slug:
            qs = qs.filter(family__slug=family_slug)
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name_en__icontains=search) | Q(name_bn__icontains=search)
                | Q(slug__icontains=search) | Q(chip__icontains=search)
                | Q(model_numbers__icontains=search)
            )
        year = request.query_params.get("year")
        if year and year.isdigit():
            qs = qs.filter(release_year=int(year))
        line = request.query_params.get("line")
        if line:
            qs = qs.filter(line=line)
        active = request.query_params.get("is_active")
        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))
        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response([model_admin_payload(m, m.n) for m in page])

    def post(self, request):
        family = get_object_or_404(DeviceFamily, pk=request.data.get("family_id"))
        try:
            cleaned = _ensure_slug(_clean(request.data, MODEL_FIELDS, required=("name_en",)), None)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if DeviceModel.objects.filter(family=family, slug=cleaned["slug"]).exists():
            return Response({"slug": ["A model with this slug already exists in this family."]}, status=400)
        model = DeviceModel.objects.create(family=family, **cleaned)
        return Response(model_admin_payload(model, 0), status=status.HTTP_201_CREATED)


class ModelDetailView(AdminAPIView):
    def get(self, request, model_id):
        return Response(model_admin_payload(get_object_or_404(DeviceModel.objects.select_related("family"), pk=model_id)))

    def patch(self, request, model_id):
        model = get_object_or_404(DeviceModel.objects.select_related("family"), pk=model_id)
        try:
            cleaned = _ensure_slug(_clean(request.data, MODEL_FIELDS, instance=model), model)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if "family_id" in request.data:
            model.family = get_object_or_404(DeviceFamily, pk=request.data["family_id"])
        slug = cleaned.get("slug", model.slug)
        if DeviceModel.objects.filter(family=model.family, slug=slug).exclude(pk=model.pk).exists():
            return Response({"slug": ["A model with this slug already exists in this family."]}, status=400)
        for key, value in cleaned.items():
            setattr(model, key, value)
        model.save()
        return Response(model_admin_payload(model))

    def delete(self, request, model_id):
        model = get_object_or_404(DeviceModel, pk=model_id)
        model.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModelDuplicateView(AdminAPIView):
    """Yearly refresh helper: copy a model (attributes + offerings) as a new row."""

    def post(self, request, model_id):
        source = get_object_or_404(DeviceModel.objects.select_related("family"), pk=model_id)
        try:
            cleaned = _clean(request.data, MODEL_FIELDS)
        except ValidationFailed as exc:
            return _validation_response(exc)
        data = {key: getattr(source, key) for key in MODEL_FIELDS}
        data.update(cleaned)
        if "slug" not in cleaned:
            data["slug"] = f"{source.slug}-copy"
        data["slug"] = slugify(data["slug"])[:80]
        if "name_en" not in cleaned:
            data["name_en"] = f"{source.name_en} (copy)"
        data["is_active"] = cleaned.get("is_active", False)
        data["reference_source"] = f"duplicate of #{source.pk}"
        data["image"] = source.image.name  # shared file; released only when unreferenced
        if DeviceModel.objects.filter(family=source.family, slug=data["slug"]).exists():
            return Response({"slug": ["A model with this slug already exists in this family."]}, status=400)
        with transaction.atomic():
            new = DeviceModel.objects.create(family=source.family, **data)
            for o in source.offerings.all():
                ModelIssue.objects.create(
                    model=new, issue=o.issue, is_active=o.is_active,
                    price_from=o.price_from, price_options=o.price_options,
                    reference_price=o.reference_price, turnaround_hours=o.turnaround_hours,
                    warranty_days=o.warranty_days, content_status=ModelIssue.ContentStatus.DRAFT,
                    image=o.image.name,
                )
        return Response(model_admin_payload(new), status=status.HTTP_201_CREATED)


class ModelApplyIssuesView(AdminAPIView):
    def post(self, request, model_id):
        model = get_object_or_404(DeviceModel, pk=model_id)
        ids = request.data.get("issue_ids")
        if not isinstance(ids, list):
            return Response({"issue_ids": ["Must be a list of ids."]}, status=400)
        issues = list(Issue.objects.filter(id__in=ids))
        if len(issues) != len(set(ids)):
            return Response({"issue_ids": ["Unknown id."]}, status=400)
        created = 0
        with transaction.atomic():
            for issue in issues:
                _, was_created = ModelIssue.objects.get_or_create(model=model, issue=issue)
                created += int(was_created)
        return Response({"created": created, "total": model.offerings.count()})


class ModelOfferingsView(AdminAPIView):
    def get(self, request, model_id):
        model = get_object_or_404(DeviceModel, pk=model_id)
        offerings = model.offerings.select_related("issue")
        return Response([offering_admin_payload(o) for o in offerings])


class OfferingDetailView(AdminAPIView):
    def patch(self, request, offering_id):
        offering = get_object_or_404(ModelIssue.objects.select_related("issue", "model"), pk=offering_id)
        try:
            cleaned = _clean(request.data, OFFERING_FIELDS, instance=offering)
        except ValidationFailed as exc:
            return _validation_response(exc)
        for key, value in cleaned.items():
            setattr(offering, key, value)
        offering.save()
        return Response(offering_admin_payload(offering))

    def delete(self, request, offering_id):
        get_object_or_404(ModelIssue, pk=offering_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------- issues
class IssueListCreateView(AdminAPIView):
    def get(self, request):
        issues = (
            Issue.objects.prefetch_related("applies_to")
            .annotate(n=Count("offerings"))
            .order_by("display_order", "name_en")
        )
        return Response({"results": [issue_admin_payload(i, i.n) for i in issues]})

    def post(self, request):
        try:
            cleaned = _ensure_slug(_clean(request.data, ISSUE_FIELDS, required=("name_en",)), None)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if Issue.objects.filter(slug=cleaned["slug"]).exists():
            return Response({"slug": ["An issue with this slug already exists."]}, status=400)
        issue = Issue.objects.create(**cleaned)
        if isinstance(request.data.get("applies_to"), list):
            issue.applies_to.set(DeviceFamily.objects.filter(id__in=request.data["applies_to"]))
        return Response(issue_admin_payload(issue, 0), status=status.HTTP_201_CREATED)


class IssueDetailView(AdminAPIView):
    def get(self, request, issue_id):
        return Response(issue_admin_payload(get_object_or_404(Issue, pk=issue_id)))

    def patch(self, request, issue_id):
        issue = get_object_or_404(Issue, pk=issue_id)
        try:
            cleaned = _ensure_slug(_clean(request.data, ISSUE_FIELDS, instance=issue), issue)
        except ValidationFailed as exc:
            return _validation_response(exc)
        if "slug" in cleaned and Issue.objects.filter(slug=cleaned["slug"]).exclude(pk=issue.pk).exists():
            return Response({"slug": ["An issue with this slug already exists."]}, status=400)
        for key, value in cleaned.items():
            setattr(issue, key, value)
        issue.save()
        if isinstance(request.data.get("applies_to"), list):
            issue.applies_to.set(DeviceFamily.objects.filter(id__in=request.data["applies_to"]))
        return Response(issue_admin_payload(issue))

    def delete(self, request, issue_id):
        issue = get_object_or_404(Issue, pk=issue_id)
        if issue.offerings.exists():
            return Response(
                {"detail": "Issue is used by offerings; archive it (is_active=false) instead."},
                status=400,
            )
        issue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------- matrix
class MatrixView(AdminAPIView):
    def get(self, request):
        family = get_object_or_404(DeviceFamily, slug=request.query_params.get("family", ""))
        models = list(family.device_models.all())
        issues = list(Issue.objects.filter(Q(applies_to=family) | Q(offerings__model__family=family)).distinct())
        cells = ModelIssue.objects.filter(model__family=family).select_related("issue")
        return Response(
            {
                "family": {"id": family.id, "slug": family.slug, "name_en": family.name_en},
                "models": [
                    {"id": m.id, "slug": m.slug, "name_en": m.name_en, "release_year": m.release_year, "line": m.line}
                    for m in models
                ],
                "issues": [
                    {"id": i.id, "slug": i.slug, "name_en": i.name_en, "category": i.category}
                    for i in issues
                ],
                "cells": [
                    {
                        "id": c.id, "model_id": c.model_id, "issue_id": c.issue_id,
                        "is_active": c.is_active,
                        "price_from": str(c.price_from) if c.price_from is not None else None,
                        "reference_price": str(c.reference_price) if c.reference_price is not None else None,
                        "content_status": c.content_status,
                    }
                    for c in cells
                ],
            }
        )

    def post(self, request):
        cells = request.data.get("cells")
        if not isinstance(cells, list) or len(cells) > 2000:
            return Response({"cells": ["Must be a list of ≤ 2000 cells."]}, status=400)
        created = updated = 0
        with transaction.atomic():
            for cell in cells:
                if not isinstance(cell, dict):
                    return Response({"cells": ["Each cell must be an object."]}, status=400)
                model = get_object_or_404(DeviceModel, pk=cell.get("model_id"))
                issue = get_object_or_404(Issue, pk=cell.get("issue_id"))
                try:
                    cleaned = _clean(cell, ["is_active", "price_from"])
                except ValidationFailed as exc:
                    return _validation_response(exc)
                offering, was_created = ModelIssue.objects.get_or_create(model=model, issue=issue)
                for key, value in cleaned.items():
                    setattr(offering, key, value)
                offering.save()
                created += int(was_created)
                updated += int(not was_created)
        return Response({"created": created, "updated": updated})


# --------------------------------------------------------------- images
IMAGE_TARGETS = {
    "families": (DeviceFamily.objects.all(), "families"),
    "models": (DeviceModel.objects.select_related("family"), "models"),
    "issues": (Issue.objects.all(), "issues"),
    "offerings": (ModelIssue.objects.select_related("model__family", "issue"), "issues"),
}


class CatalogImageView(AdminAPIView):
    """POST multipart `image` to set/replace, DELETE to remove. Stored as WebP."""

    parser_classes = [MultiPartParser, FormParser]

    def _target(self, kind, pk):
        if kind not in IMAGE_TARGETS:
            raise Http404
        queryset, folder = IMAGE_TARGETS[kind]
        return get_object_or_404(queryset, pk=pk), folder

    def post(self, request, kind, pk):
        instance, folder = self._target(kind, pk)
        upload = request.FILES.get("image")
        if upload is None:
            return Response({"image": ["Choose an image file."]}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > MAX_UPLOAD_BYTES:
            return Response({"image": ["Images must be 5 MB or smaller."]}, status=status.HTTP_400_BAD_REQUEST)
        try:
            set_image(instance, folder, image_stem(instance), upload.read())
        except InvalidImage as exc:
            return Response({"image": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"image": url_of(instance.image)})

    def delete(self, request, kind, pk):
        instance, _ = self._target(kind, pk)
        clear_image(instance)
        return Response({"image": ""})

