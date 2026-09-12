import re
from io import StringIO

from django.core.cache import cache
from django.core.management import call_command
from django.test import TestCase, override_settings

from rest_framework.test import APITestCase

from content.models import SiteConfig
from leads.models import Lead, PipelineStage
from leads.pipeline import get_default_stage
from leads.tests import CAPTURE_URL, capture_payload

from .management.commands.seed_applelab import (
    GENERIC_STAGE_SLUGS,
    REPAIR_STAGES,
    SITE_CONFIG,
)

REPAIR_SLUGS = [stage["slug"] for stage in REPAIR_STAGES]


def seed():
    out = StringIO()
    call_command("seed_applelab", stdout=out)
    return out.getvalue()


def db_snapshot():
    return {
        "stages_total": PipelineStage.objects.count(),
        "stages_active": PipelineStage.objects.filter(is_active=True).count(),
        "leads": Lead.objects.count(),
        "config_pks": list(SiteConfig.objects.values_list("pk", flat=True)),
    }


def config_values():
    config = SiteConfig.get_solo()
    return {field: getattr(config, field) for field in SITE_CONFIG}


class SeedAppleLabTests(TestCase):
    def test_running_twice_is_idempotent(self):
        seed()
        first_snapshot = db_snapshot()
        first_config = config_values()
        first_stages = list(
            PipelineStage.objects.order_by("order").values(
                "slug", "name", "color", "order", "is_active", "is_terminal"
            )
        )

        seed()

        self.assertEqual(db_snapshot(), first_snapshot)
        self.assertEqual(first_snapshot["config_pks"], [1])
        self.assertEqual(config_values(), first_config)
        self.assertEqual(
            list(
                PipelineStage.objects.order_by("order").values(
                    "slug", "name", "color", "order", "is_active", "is_terminal"
                )
            ),
            first_stages,
        )

    def test_site_config_has_applelab_values(self):
        seed()
        config = SiteConfig.get_solo()
        self.assertEqual(config.site_name, "Apple Lab")
        self.assertEqual(config.phone_primary, "01603-710044")
        self.assertEqual(config.whatsapp_number, "8801603710044")
        self.assertEqual(
            config.address_en,
            "ADC Empire Plaza, 183 Satmasjid Road\nDhanmondi, Dhaka 1205",
        )
        self.assertEqual(
            config.hours_bn,
            "শনিবার – বৃহস্পতিবার · সকাল ১০টা – রাত ৯টা\nশুক্রবার ও সরকারি ছুটির দিনে বন্ধ",
        )
        self.assertEqual(
            config.meta_title_en,
            "Apple Lab — Bangladesh's most trusted Apple repair lab",
        )
        self.assertEqual(config_values(), SITE_CONFIG)

    def test_active_stages_are_repair_lifecycle_in_order(self):
        seed()
        active = list(PipelineStage.objects.filter(is_active=True).order_by("order"))
        self.assertEqual([stage.slug for stage in active], REPAIR_SLUGS)
        self.assertEqual([stage.order for stage in active], list(range(8)))

        by_slug = {stage.slug: stage for stage in active}
        for data in REPAIR_STAGES:
            stage = by_slug[data["slug"]]
            self.assertEqual(stage.name, data["name"])
            self.assertEqual(stage.color, data["color"])
            self.assertEqual(stage.is_terminal, data.get("is_terminal", False))
            self.assertEqual(
                stage.counts_as_converted, data.get("counts_as_converted", False)
            )
            self.assertEqual(
                stage.requires_reason, data.get("requires_reason", False)
            )

        terminal = {s.slug for s in active if s.is_terminal}
        self.assertEqual(terminal, {"completed", "cancelled", "no_fix"})
        self.assertEqual(
            {s.slug for s in active if s.counts_as_converted}, {"completed"}
        )
        self.assertEqual(
            {s.slug for s in active if s.requires_reason}, {"cancelled", "no_fix"}
        )
        self.assertEqual(get_default_stage().slug, "pending")

    def test_reseed_restores_stage_edited_in_admin(self):
        seed()
        PipelineStage.objects.filter(slug="ready").update(
            name="Renamed", color="#000000", is_active=False
        )
        seed()
        stage = PipelineStage.objects.get(slug="ready")
        self.assertEqual(stage.name, "Ready for Pickup")
        self.assertEqual(stage.color, "#34C759")
        self.assertTrue(stage.is_active)

    def test_archives_generic_stages_and_removes_demo_leads(self):
        call_command("seed_demo", stdout=StringIO())
        self.assertTrue(
            Lead.objects.filter(reference__startswith="LD-DEMO-").exists()
        )
        self.assertEqual(
            PipelineStage.objects.filter(
                slug__in=GENERIC_STAGE_SLUGS, is_active=True
            ).count(),
            len(GENERIC_STAGE_SLUGS),
        )

        output = seed()

        generic = PipelineStage.objects.filter(slug__in=GENERIC_STAGE_SLUGS)
        self.assertEqual(generic.count(), len(GENERIC_STAGE_SLUGS))
        self.assertFalse(generic.filter(is_active=True).exists())
        self.assertFalse(
            Lead.objects.filter(reference__startswith="LD-DEMO-").exists()
        )
        self.assertEqual(
            list(
                PipelineStage.objects.filter(is_active=True)
                .order_by("order")
                .values_list("slug", flat=True)
            ),
            REPAIR_SLUGS,
        )
        self.assertIn("Generic stages archived: 6", output)
        self.assertIn("Demo leads removed: 8", output)

        # A second run has nothing left to archive or remove.
        output = seed()
        self.assertIn("Generic stages archived: 0", output)
        self.assertIn("Demo leads removed: 0", output)

    def test_preserves_social_urls_and_analytics_ids(self):
        config = SiteConfig.get_solo()
        config.facebook_url = "https://facebook.com/applelabbd"
        config.instagram_url = "https://instagram.com/applelabbd"
        config.ga4_measurement_id = "G-TEST1234"
        config.save()

        seed()

        config = SiteConfig.get_solo()
        self.assertEqual(config.facebook_url, "https://facebook.com/applelabbd")
        self.assertEqual(config.instagram_url, "https://instagram.com/applelabbd")
        self.assertEqual(config.ga4_measurement_id, "G-TEST1234")
        self.assertEqual(config.site_name, "Apple Lab")


@override_settings(LEADS_REFERENCE_PREFIX="APL")
class AppleLabCaptureTests(APITestCase):
    def setUp(self):
        super().setUp()
        cache.clear()
        seed()

    def test_capture_uses_apl_prefix_and_pending_stage(self):
        response = self.client.post(CAPTURE_URL, capture_payload(), format="json")
        self.assertEqual(response.status_code, 201)
        reference = response.data["reference"]
        self.assertRegex(reference, r"^APL-\d{6}-\d{5}$")

        lead = Lead.objects.get(reference=reference)
        self.assertEqual(lead.stage.slug, "pending")
        self.assertTrue(re.fullmatch(r"APL-\d{6}-00001", reference))
