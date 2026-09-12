"""Public catalog API.

Two tiers, by design (defence against bulk extraction):

* Cascades for the wizard — small, scoped lists (never copy, never prices,
  never "everything"). These are the only catalog endpoints the Next proxy
  exposes to browsers.
* Page-data endpoints — full page payloads for Next's server-side render.
  They require the shared `X-Catalog-Key` (CATALOG_PAGES_SECRET) because in
  production nginx forwards all of /api/ to Django, and they are never cached
  by shared caches.
"""
import hmac

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from content.localize import request_lang
from content.views import PublicCachedAPIView

from .models import DeviceFamily, DeviceModel, Issue, ModelIssue
from .payloads import (
    family_brief,
    family_page,
    issue_brief,
    model_brief,
    model_page,
    offering_page,
    sitemap_payload,
)

CASCADE_MAX_MODELS = 120


# --------------------------------------------------------------- cascades
class FamilyListView(PublicCachedAPIView):
    def get(self, request):
        lang = request_lang(request)
        families = DeviceFamily.objects.filter(is_active=True)
        return Response([family_brief(f, lang) for f in families])


class YearListView(PublicCachedAPIView):
    def get(self, request):
        family = get_object_or_404(
            DeviceFamily, slug=request.query_params.get("family", ""), is_active=True
        )
        years = (
            family.device_models.filter(is_active=True, release_year__isnull=False)
            .values_list("release_year", flat=True)
            .distinct()
        )
        return Response(sorted(set(years), reverse=True))


class ModelListView(PublicCachedAPIView):
    def get(self, request):
        family_slug = request.query_params.get("family", "")
        if not family_slug:
            return Response({"detail": "family is required."}, status=status.HTTP_400_BAD_REQUEST)
        family = get_object_or_404(DeviceFamily, slug=family_slug, is_active=True)
        qs = family.device_models.filter(is_active=True)
        year = request.query_params.get("year")
        if year:
            if not year.isdigit():
                return Response({"detail": "year must be a number."}, status=400)
            qs = qs.filter(release_year=int(year))
        lang = request_lang(request)
        return Response([model_brief(m, lang) for m in qs[:CASCADE_MAX_MODELS]])


class IssueListView(PublicCachedAPIView):
    def get(self, request):
        lang = request_lang(request)
        family_slug = request.query_params.get("family", "")
        model_slug = request.query_params.get("model", "")
        if not family_slug:
            return Response({"detail": "family is required."}, status=400)
        family = get_object_or_404(DeviceFamily, slug=family_slug, is_active=True)
        if model_slug:
            model = get_object_or_404(DeviceModel, family=family, slug=model_slug, is_active=True)
            issues = Issue.objects.filter(
                is_active=True, offerings__model=model, offerings__is_active=True
            ).distinct()
        else:
            issues = Issue.objects.filter(is_active=True, applies_to=family).distinct()
        return Response([issue_brief(i, lang) for i in issues])


# --------------------------------------------------------------- pages (server-only)
class HasCatalogKey(BasePermission):
    """Server-to-server key. Blank secret = allowed only with DEBUG (local dev)."""

    def has_permission(self, request, view):
        secret = getattr(settings, "CATALOG_PAGES_SECRET", "")
        if not secret:
            return settings.DEBUG
        return hmac.compare_digest(request.headers.get("X-Catalog-Key", ""), secret)


class ServerPageView(APIView):
    authentication_classes = []
    permission_classes = [HasCatalogKey]

    def permission_denied(self, request, message=None, code=None):
        raise NotFound()

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "private, no-store"
        return response


class IndexPageView(ServerPageView):
    def get(self, request):
        lang = request_lang(request)
        families = DeviceFamily.objects.filter(is_active=True)
        return Response({"families": [family_brief(f, lang) for f in families]})


class FamilyPageView(ServerPageView):
    def get(self, request, family):
        lang = request_lang(request)
        fam = get_object_or_404(DeviceFamily, slug=family, is_active=True)
        return Response(family_page(fam, lang))


class ModelPageView(ServerPageView):
    def get(self, request, family, model):
        lang = request_lang(request)
        obj = get_object_or_404(
            DeviceModel.objects.select_related("family"),
            family__slug=family, family__is_active=True, slug=model, is_active=True,
        )
        return Response(model_page(obj, lang))


class OfferingPageView(ServerPageView):
    def get(self, request, family, model, issue):
        lang = request_lang(request)
        offering = get_object_or_404(
            ModelIssue.objects.select_related("model__family", "issue"),
            model__family__slug=family, model__family__is_active=True,
            model__slug=model, model__is_active=True,
            issue__slug=issue, issue__is_active=True, is_active=True,
        )
        return Response(offering_page(offering, lang))


class SitemapDataView(ServerPageView):
    def get(self, request):
        return Response(sitemap_payload())
