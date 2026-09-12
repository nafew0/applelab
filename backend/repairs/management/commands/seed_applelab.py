"""Seed the database with AppleLab's real business configuration (idempotent).

This seed is the canonical source for SiteConfig and the pipeline stages for
AppleLab. Re-running it resets those fields to the values below — make
permanent changes in this file, not only in the admin. Social URLs and
analytics IDs on SiteConfig are left untouched so admin-entered values
survive a re-seed.

Running the command twice yields identical database state:

* SiteConfig (pk=1) is updated in place.
* The eight repair-lifecycle stages are ``update_or_create``'d by slug.
* The template's generic stages (new/contacted/qualified/booked/won/lost)
  are archived (``is_active=False``), never deleted — leads may still
  reference them.
* Demo leads from ``seed_demo`` (reference ``LD-DEMO-*``) are removed.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from content.models import SiteConfig
from leads.models import Lead, PipelineStage

SITE_CONFIG = {
    "site_name": "Apple Lab",
    "tagline_en": "Bangladesh's most trusted Apple repair lab — since 2010",
    "tagline_bn": "২০১০ সাল থেকে বাংলাদেশের সবচেয়ে বিশ্বস্ত অ্যাপল রিপেয়ার ল্যাব",
    "phone_primary": "01603-710044",
    "phone_secondary": "01737-292828",
    "email": "jusef@applelab.com.bd",
    "whatsapp_number": "8801603710044",
    "address_en": "ADC Empire Plaza, 183 Satmasjid Road\nDhanmondi, Dhaka 1205",
    "address_bn": "এডিসি এম্পায়ার প্লাজা, ১৮৩ সাতমসজিদ রোড\nধানমন্ডি, ঢাকা ১২০৫",
    "hours_en": "Saturday – Thursday · 10 AM – 9 PM\nClosed on Fridays & public holidays",
    "hours_bn": "শনিবার – বৃহস্পতিবার · সকাল ১০টা – রাত ৯টা\nশুক্রবার ও সরকারি ছুটির দিনে বন্ধ",
    "google_maps_embed_url": (
        "https://www.google.com/maps?q=ADC%20Empire%20Plaza%2C%20183%20Satmasjid"
        "%20Road%2C%20Dhanmondi%2C%20Dhaka%201205&output=embed"
    ),
    "meta_title_en": "Apple Lab — Bangladesh's most trusted Apple repair lab",
    "meta_description_en": (
        "MacBook, iPhone, iPad, iMac and Apple Watch repair in Dhanmondi, Dhaka. "
        "Genuine parts, free diagnosis and a 90-day warranty on every repair."
    ),
    "meta_title_bn": "অ্যাপল ল্যাব — বাংলাদেশের সবচেয়ে বিশ্বস্ত অ্যাপল রিপেয়ার ল্যাব",
    "meta_description_bn": (
        "ধানমন্ডি, ঢাকায় ম্যাকবুক, আইফোন, আইপ্যাড, আইম্যাক ও অ্যাপল ওয়াচ মেরামত। "
        "জেনুইন পার্টস, ফ্রি ডায়াগনসিস এবং প্রতিটি মেরামতে ৯০ দিনের ওয়ারেন্টি।"
    ),
}

# The repair lifecycle. Order here is the board order; the first entry is the
# default stage for newly captured leads (see leads.pipeline.get_default_stage).
REPAIR_STAGES = [
    {"slug": "pending", "name": "Pending", "color": "#FF9F0A", "order": 0},
    {"slug": "confirmed", "name": "Confirmed", "color": "#007AFF", "order": 1},
    {"slug": "diagnosed", "name": "Diagnosed", "color": "#AF52DE", "order": 2},
    {"slug": "in_progress", "name": "In Progress", "color": "#009BFF", "order": 3},
    {"slug": "ready", "name": "Ready for Pickup", "color": "#34C759", "order": 4},
    {
        "slug": "completed",
        "name": "Completed",
        "color": "#30B14A",
        "order": 5,
        "is_terminal": True,
        "counts_as_converted": True,
    },
    {
        "slug": "cancelled",
        "name": "Cancelled",
        "color": "#8E8E93",
        "order": 6,
        "is_terminal": True,
        "requires_reason": True,
    },
    {
        "slug": "no_fix",
        "name": "Could Not Repair",
        "color": "#FF3B30",
        "order": 7,
        "is_terminal": True,
        "requires_reason": True,
    },
]

STAGE_FLAG_DEFAULTS = {
    "is_terminal": False,
    "counts_as_converted": False,
    "requires_reason": False,
}

# Template-era generic stages: archived, never deleted.
GENERIC_STAGE_SLUGS = ["new", "contacted", "qualified", "booked", "won", "lost"]

DEMO_REFERENCE_PREFIX = "LD-DEMO-"


class Command(BaseCommand):
    help = "Seed AppleLab SiteConfig and repair pipeline stages (idempotent)."

    @transaction.atomic
    def handle(self, *args, **options):
        config = SiteConfig.get_solo()
        for field, value in SITE_CONFIG.items():
            setattr(config, field, value)
        config.save()
        self.stdout.write("SiteConfig updated: Apple Lab")

        for data in REPAIR_STAGES:
            defaults = {**STAGE_FLAG_DEFAULTS, **data, "is_active": True}
            slug = defaults.pop("slug")
            PipelineStage.objects.update_or_create(slug=slug, defaults=defaults)
        self.stdout.write(f"Repair stages ensured: {len(REPAIR_STAGES)}")

        archived = PipelineStage.objects.filter(
            slug__in=GENERIC_STAGE_SLUGS, is_active=True
        ).update(is_active=False)
        self.stdout.write(f"Generic stages archived: {archived}")

        # delete() reports cascaded rows too (transitions, activities); count
        # only the leads themselves.
        _, deleted_by_model = Lead.objects.filter(
            reference__startswith=DEMO_REFERENCE_PREFIX
        ).delete()
        removed = deleted_by_model.get(Lead._meta.label, 0)
        self.stdout.write(f"Demo leads removed: {removed}")

        self.stdout.write(self.style.SUCCESS("AppleLab seed complete (idempotent)."))
