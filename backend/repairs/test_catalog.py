"""Device catalog: rendering, public cascades/pages, staff API, import."""
from decimal import Decimal
from pathlib import Path

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from repairs.models import DeviceFamily, DeviceModel, Issue, ModelIssue
from repairs.rendering import build_context, markdown_to_html, render, substitute

User = get_user_model()
CSV_DIR = Path(__file__).resolve().parents[2] / "research" / "ifixit-crawl" / "csv"


def make_catalog():
    family = DeviceFamily.objects.create(slug="iphone", name_en="iPhone", name_bn="আইফোন", kind="phone")
    model = DeviceModel.objects.create(
        family=family, slug="15-pro", name_en="iPhone 15 Pro", name_bn="আইফোন 15 Pro",
        line="Pro", chip="A17 Pro", release_year=2023, model_numbers=["A2848"],
    )
    older = DeviceModel.objects.create(
        family=family, slug="13", name_en="iPhone 13", release_year=2021,
    )
    issue = Issue.objects.create(
        slug="screen-replacement", name_en="Screen Replacement", name_bn="স্ক্রিন পরিবর্তন",
        category="screen",
        default_content_en="## {{model.name}} screen in {{city}}\n\nWe fix the {{model.name}} ({{model.chip}}).",
        default_content_bn="## {{city}}-এ {{model.name}} স্ক্রিন",
        default_faq=[{"q_en": "How long for {{model.name}}?", "a_en": "Same day."}],
    )
    issue.applies_to.add(family)
    offering = ModelIssue.objects.create(model=model, issue=issue, price_from=Decimal("7500"))
    ModelIssue.objects.create(model=older, issue=issue)
    return family, model, older, issue, offering


class RenderingTests(TestCase):
    def test_substitute_unknown_vars_blank(self):
        self.assertEqual(substitute("A {{ x.y }} B", {}), "A  B")

    def test_markdown_sanitized(self):
        html = markdown_to_html("# Hi\n\n<script>alert(1)</script>**bold**")
        self.assertIn("<h1>", html)
        self.assertIn("<strong>bold</strong>", html)
        self.assertNotIn("<script>", html)

    def test_context_and_render(self):
        family, model, _, issue, offering = make_catalog()
        ctx = build_context("en", family=family, model=model, issue=issue, offering=offering)
        self.assertEqual(ctx["model.name"], "iPhone 15 Pro")
        self.assertEqual(ctx["price_from"], "৳ 7,500")
        html = render(issue.default_content_en, ctx)
        self.assertIn("iPhone 15 Pro screen in Dhaka", html)
        self.assertIn("(A17 Pro)", html)


class IndexPolicyTests(TestCase):
    def test_auto_requires_published_and_words(self):
        _, _, _, _, offering = make_catalog()
        self.assertFalse(offering.is_indexable)
        offering.content_status = "published"
        offering.content_en = "word " * 300
        self.assertTrue(offering.is_indexable)
        offering.index_policy = "noindex"
        self.assertFalse(offering.is_indexable)
        offering.index_policy = "index"
        offering.content_en = ""
        self.assertTrue(offering.is_indexable)


@override_settings(CATALOG_PAGES_SECRET="page-key")
class PublicCatalogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.credentials(HTTP_X_CATALOG_KEY="page-key")
        self.family, self.model, self.older, self.issue, self.offering = make_catalog()

    def test_page_data_requires_server_key_and_is_never_shared_cached(self):
        anon = APIClient()
        for url in ("/api/catalog/pages/sitemap/", "/api/catalog/pages/family/iphone/"):
            self.assertEqual(anon.get(url).status_code, 404)
            self.assertEqual(anon.get(url, HTTP_X_CATALOG_KEY="wrong").status_code, 404)
        ok = self.client.get("/api/catalog/pages/family/iphone/")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok["Cache-Control"], "private, no-store")
        # cascades stay public and shared-cacheable
        self.assertEqual(anon.get("/api/catalog/families/")["Cache-Control"], "public, max-age=300")

    @override_settings(CATALOG_PAGES_SECRET="", DEBUG=False)
    def test_blank_key_fails_closed_outside_debug(self):
        self.assertEqual(self.client.get("/api/catalog/pages/index/").status_code, 404)

    def test_cascades(self):
        r = self.client.get("/api/catalog/families/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()[0]["slug"], "iphone")
        self.assertEqual(r.json()[0]["model_count"], 2)
        self.assertEqual(self.client.get("/api/catalog/years/?family=iphone").json(), [2023, 2021])
        models = self.client.get("/api/catalog/models/?family=iphone&year=2023").json()
        self.assertEqual([m["slug"] for m in models], ["15-pro"])
        issues = self.client.get("/api/catalog/issues/?family=iphone&model=15-pro").json()
        self.assertEqual(issues[0]["slug"], "screen-replacement")
        self.assertNotIn("content_html", issues[0])

    def test_models_require_family(self):
        self.assertEqual(self.client.get("/api/catalog/models/").status_code, 400)
        self.assertEqual(self.client.get("/api/catalog/issues/").status_code, 400)

    def test_bengali_fallback(self):
        r = self.client.get("/api/catalog/models/?family=iphone&lang=bn").json()
        names = {m["slug"]: m["name"] for m in r}
        self.assertEqual(names["15-pro"], "আইফোন 15 Pro")
        self.assertEqual(names["13"], "iPhone 13")  # bn blank → en

    def test_family_page(self):
        r = self.client.get("/api/catalog/pages/family/iphone/")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["family"]["seo"]["title"], "iPhone Repair in Dhaka — Screen, Battery & More | Apple Lab")
        self.assertEqual(data["years"], [2023, 2021])
        self.assertEqual([i["slug"] for i in data["issues"]], ["screen-replacement"])

    def test_model_page(self):
        data = self.client.get("/api/catalog/pages/model/iphone/15-pro/").json()
        self.assertEqual(data["offerings"][0]["price_from_display"], "৳ 7,500")
        self.assertEqual([m["slug"] for m in data["related"]], ["13"])
        self.assertIn("iPhone 15 Pro Repair Dhaka", data["model"]["seo"]["title"])

    def test_offering_page_uses_template_and_is_not_indexable(self):
        data = self.client.get("/api/catalog/pages/offering/iphone/15-pro/screen-replacement/").json()
        self.assertIn("iPhone 15 Pro screen in Dhaka", data["offering"]["content_html"])
        self.assertTrue(data["offering"]["content_is_template"])
        self.assertFalse(data["offering"]["indexable"])
        self.assertEqual(data["offering"]["faq"][0]["question"], "How long for iPhone 15 Pro?")
        bn = self.client.get("/api/catalog/pages/offering/iphone/15-pro/screen-replacement/?lang=bn").json()
        self.assertIn("ঢাকা-এ আইফোন 15 Pro স্ক্রিন", bn["offering"]["content_html"])

    def test_inactive_hidden(self):
        self.model.is_active = False
        self.model.save()
        self.assertEqual(self.client.get("/api/catalog/pages/model/iphone/15-pro/").status_code, 404)
        self.assertEqual(self.client.get("/api/catalog/pages/offering/iphone/15-pro/screen-replacement/").status_code, 404)
        self.assertNotIn("15-pro", [m["slug"] for m in self.client.get("/api/catalog/models/?family=iphone").json()])

    def test_sitemap_excludes_unindexable_offerings(self):
        data = self.client.get("/api/catalog/pages/sitemap/").json()
        self.assertEqual(len(data["models"]), 2)
        self.assertEqual(data["offerings"], [])
        self.offering.index_policy = "index"
        self.offering.save()
        data = self.client.get("/api/catalog/pages/sitemap/").json()
        self.assertEqual(data["offerings"][0]["issue"], "screen-replacement")


class CatalogAdminAPITests(TestCase):
    def setUp(self):
        self.family, self.model, self.older, self.issue, self.offering = make_catalog()
        self.staff = User.objects.create_user(username="staff", email="s@example.com", password="x", is_staff=True, is_superuser=True)
        self.user = User.objects.create_user(username="plain", email="p@example.com", password="x")
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    def test_models_list_is_newest_first(self):
        DeviceModel.objects.create(family=self.family, slug="6", name_en="iPhone 6", release_year=2014)
        slugs = [m["slug"] for m in self.client.get("/api/admin/catalog/models/?family=iphone").json()["results"]]
        self.assertEqual(slugs, ["15-pro", "13", "6"])

    def test_permissions(self):
        anon = APIClient()
        self.assertEqual(anon.get("/api/admin/catalog/families/").status_code, 401)
        plain = APIClient()
        plain.force_authenticate(self.user)
        self.assertEqual(plain.get("/api/admin/catalog/families/").status_code, 403)

    def test_family_crud_and_guards(self):
        r = self.client.post("/api/admin/catalog/families/", {"name_en": "Mac Studio", "kind": "desktop"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["slug"], "mac-studio")
        dup = self.client.post("/api/admin/catalog/families/", {"name_en": "Mac Studio"}, format="json")
        self.assertEqual(dup.status_code, 400)
        self.assertEqual(self.client.delete(f"/api/admin/catalog/families/{self.family.id}/").status_code, 400)
        self.assertEqual(self.client.delete(f"/api/admin/catalog/families/{r.json()['id']}/").status_code, 204)

    def test_model_create_duplicate_apply(self):
        r = self.client.post(
            "/api/admin/catalog/models/",
            {"family_id": self.family.id, "name_en": "iPhone 16 Pro", "release_year": 2024, "model_numbers": ["A3101"]},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()["slug"], "iphone-16-pro")
        dup = self.client.post(
            f"/api/admin/catalog/models/{self.model.id}/duplicate/",
            {"slug": "15-pro-max", "name_en": "iPhone 15 Pro Max"},
            format="json",
        )
        self.assertEqual(dup.status_code, 201)
        new = DeviceModel.objects.get(slug="15-pro-max")
        self.assertFalse(new.is_active)
        self.assertEqual(new.offerings.count(), 1)
        self.assertEqual(new.offerings.first().price_from, Decimal("7500"))
        battery = Issue.objects.create(slug="battery-replacement", name_en="Battery Replacement")
        applied = self.client.post(
            f"/api/admin/catalog/models/{new.id}/apply-issues/", {"issue_ids": [battery.id, self.issue.id]}, format="json"
        )
        self.assertEqual(applied.json(), {"created": 1, "total": 2})

    def test_matrix_roundtrip(self):
        r = self.client.get("/api/admin/catalog/matrix/?family=iphone")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.json()["models"]), 2)
        self.assertEqual(len(r.json()["cells"]), 2)
        post = self.client.post(
            "/api/admin/catalog/matrix/",
            {"cells": [{"model_id": self.older.id, "issue_id": self.issue.id, "price_from": "6500", "is_active": True}]},
            format="json",
        )
        self.assertEqual(post.json(), {"created": 0, "updated": 1})
        self.assertEqual(ModelIssue.objects.get(model=self.older).price_from, Decimal("6500"))
        bad = self.client.post(
            "/api/admin/catalog/matrix/",
            {"cells": [{"model_id": self.older.id, "issue_id": self.issue.id, "price_from": "-1"}]},
            format="json",
        )
        self.assertEqual(bad.status_code, 400)

    def test_offering_patch_and_issue_guard(self):
        r = self.client.patch(
            f"/api/admin/catalog/offerings/{self.offering.id}/",
            {"content_status": "published", "content_en": "unique " * 260, "turnaround_hours": 4},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["is_indexable"])
        self.assertEqual(self.client.delete(f"/api/admin/catalog/issues/{self.issue.id}/").status_code, 400)


@pytest.mark.skipif(not CSV_DIR.exists(), reason="research crawl not present")
class ImportCatalogTests(TestCase):
    def test_import_is_idempotent_and_keeps_prices_private(self):
        call_command("import_catalog", verbosity=0)
        counts = (DeviceFamily.objects.count(), DeviceModel.objects.count(), Issue.objects.count(), ModelIssue.objects.count())
        self.assertEqual(counts[0], 10)
        self.assertEqual(counts[1], 191)
        self.assertGreaterEqual(counts[3], 1500)
        self.assertFalse(ModelIssue.objects.filter(price_from__isnull=False).exists())
        self.assertTrue(ModelIssue.objects.filter(reference_price__isnull=False).exists())
        # placeholder competitor prices are not treated as reference
        screen = Issue.objects.get(slug="screen-replacement")
        self.assertFalse(ModelIssue.objects.filter(issue=screen, reference_price=1000).exists())
        m5 = DeviceModel.objects.get(family__slug="macbook-air", slug="13-inch-a3449-m5")
        self.assertEqual(m5.chip, "M5")
        self.assertEqual(m5.model_numbers, ["A3449"])
        self.assertEqual(m5.size_label, "13″")
        pro = DeviceModel.objects.get(family__slug="iphone", slug="15-pro")
        self.assertEqual(pro.line, "Pro")
        self.assertEqual(pro.chip, "A17 Pro")
        self.assertEqual(pro.name_bn, "আইফোন 15 Pro")
        # owner-set price survives a re-import
        offering = ModelIssue.objects.filter(model=pro, issue=screen).first()
        offering.price_from = Decimal("12000")
        offering.save()
        call_command("import_catalog", verbosity=0)
        self.assertEqual(
            (DeviceFamily.objects.count(), DeviceModel.objects.count(), Issue.objects.count(), ModelIssue.objects.count()),
            counts,
        )
        offering.refresh_from_db()
        self.assertEqual(offering.price_from, Decimal("12000"))
        self.assertTrue(Issue.objects.get(slug="face-id-repair").applies_to.filter(slug="iphone").exists())
        # slugs unique per family
        self.assertEqual(
            DeviceModel.objects.values("family", "slug").distinct().count(), DeviceModel.objects.count()
        )

    def test_public_names_follow_apple_style_and_owner_edits_survive(self):
        call_command("import_catalog", verbosity=0)
        names = set(DeviceModel.objects.values_list("name_en", flat=True))
        self.assertIn("iPhone SE (2022)", names)
        self.assertIn("iPhone 13 mini", names)
        self.assertIn("Mac mini M4", names)
        self.assertFalse([n for n in names if " Inch" in n or "Series SE" in n])
        pro = DeviceModel.objects.get(family__slug="iphone", slug="15-pro")
        pro.name_en = "iPhone 15 Pro (owner)"
        pro.save()
        call_command("import_catalog", verbosity=0)
        pro.refresh_from_db()
        self.assertEqual(pro.name_en, "iPhone 15 Pro (owner)")
        call_command("import_catalog", "--overwrite", verbosity=0)
        pro.refresh_from_db()
        self.assertEqual(pro.name_en, "iPhone 15 Pro")


@override_settings(NEXT_REVALIDATE_URL="http://next.test/revalidate", NEXT_REVALIDATE_SECRET="s")
class RevalidationSignalTests(TestCase):
    def test_save_triggers_best_effort_post(self):
        from unittest import mock

        with mock.patch("repairs.signals.requests.post") as post:
            with self.captureOnCommitCallbacks(execute=True):
                DeviceFamily.objects.create(slug="ipad", name_en="iPad")
            post.assert_called_once()
            self.assertIn("family:ipad", post.call_args.kwargs["json"]["tags"])
        with mock.patch("repairs.signals.requests.post", side_effect=RuntimeError("down")):
            with self.captureOnCommitCallbacks(execute=True):
                DeviceFamily.objects.create(slug="imac", name_en="iMac")  # must not raise

    def test_non_200_response_is_logged_and_redirects_not_followed(self):
        from unittest import mock

        with mock.patch("repairs.signals.requests.post") as post:
            post.return_value.status_code = 307
            with self.assertLogs("repairs.signals", level="WARNING") as logs:
                with self.captureOnCommitCallbacks(execute=True):
                    DeviceFamily.objects.create(slug="mac-mini", name_en="Mac mini")
            self.assertIs(post.call_args.kwargs["allow_redirects"], False)
            self.assertIn("HTTP 307", logs.output[0])


class CatalogSeedTests(TestCase):
    def test_committed_seed_loads_without_prices_and_keeps_owner_edits(self):
        call_command("seed_catalog", verbosity=0)
        self.assertEqual(DeviceFamily.objects.count(), 10)
        self.assertEqual(DeviceModel.objects.count(), 191)
        self.assertGreaterEqual(ModelIssue.objects.count(), 1500)
        self.assertFalse(ModelIssue.objects.filter(price_from__isnull=False).exists())
        self.assertFalse(ModelIssue.objects.filter(reference_price__isnull=False).exists())
        self.assertFalse(DeviceModel.objects.exclude(reference_source="").exists())
        pro = DeviceModel.objects.get(family__slug="iphone", slug="15-pro")
        self.assertEqual((pro.chip, pro.release_year), ("A17 Pro", 2023))
        offering = ModelIssue.objects.get(model=pro, issue__slug="screen-replacement")
        offering.price_from = Decimal("15000")
        offering.save()
        pro.name_en = "Owner name"
        pro.save()
        counts = (DeviceModel.objects.count(), ModelIssue.objects.count())
        call_command("seed_catalog", verbosity=0)
        self.assertEqual((DeviceModel.objects.count(), ModelIssue.objects.count()), counts)
        pro.refresh_from_db()
        offering.refresh_from_db()
        self.assertEqual(pro.name_en, "Owner name")
        self.assertEqual(offering.price_from, Decimal("15000"))

    def test_export_round_trip(self):
        from repairs.seeding import export_seed, load_seed

        make_catalog()
        ModelIssue.objects.filter(model__slug="13").update(is_active=False)
        data = export_seed()
        self.assertNotIn("price", str(data["offerings"]))
        ModelIssue.objects.all().delete()
        DeviceModel.objects.all().delete()
        Issue.objects.all().delete()
        DeviceFamily.objects.all().delete()
        counts = load_seed(data)
        self.assertEqual(counts["models"], 2)
        self.assertEqual(counts["offerings_created"], 2)
        self.assertFalse(ModelIssue.objects.get(model__slug="13").is_active)
        self.assertIsNone(ModelIssue.objects.get(model__slug="15-pro").price_from)
