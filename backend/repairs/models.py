"""AppleLab device catalog.

family → model → issue, with `ModelIssue` as the offering cell (price/content
for one repair on one model). Structured model attributes (line, size, chip,
year, A-numbers) replace hierarchy levels so a new device generation is a new
row in admin, never a schema change.

Bilingual fields follow the template convention (`_en` / `_bn`, bn falls back
to en). Money is Decimal BDT. Public pages render Markdown content through
`repairs.rendering`.
"""
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

# Catalog images are stored as WebP by `repairs.images` (admin uploads and the
# `import_catalog_images` command); one file may back many rows (repair icons).
IMAGE_MAX_LENGTH = 255


class DeviceFamily(models.Model):
    class Kind(models.TextChoices):
        PHONE = "phone", "Phone"
        TABLET = "tablet", "Tablet"
        LAPTOP = "laptop", "Laptop"
        DESKTOP = "desktop", "Desktop"
        WATCH = "watch", "Watch"
        AUDIO = "audio", "Audio"
        HEADSET = "headset", "Headset"

    slug = models.SlugField(max_length=60, unique=True)
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.PHONE)
    icon = models.CharField(max_length=50, blank=True)  # curated icon key
    image = models.ImageField(upload_to="catalog/families/", max_length=IMAGE_MAX_LENGTH, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    intro_en = models.TextField(blank=True)  # one short paragraph
    intro_bn = models.TextField(blank=True)
    content_en = models.TextField(blank=True)  # Markdown
    content_bn = models.TextField(blank=True)
    faq = models.JSONField(default=list, blank=True)  # [{q_en,q_bn,a_en,a_bn}]

    seo_title_en = models.CharField(max_length=160, blank=True)
    seo_title_bn = models.CharField(max_length=160, blank=True)
    seo_description_en = models.CharField(max_length=320, blank=True)
    seo_description_bn = models.CharField(max_length=320, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name_en"]
        verbose_name_plural = "device families"

    def __str__(self):
        return self.name_en


class DeviceModel(models.Model):
    family = models.ForeignKey(
        DeviceFamily, on_delete=models.PROTECT, related_name="device_models"
    )
    slug = models.SlugField(max_length=80)
    name_en = models.CharField(max_length=140)
    name_bn = models.CharField(max_length=140, blank=True)

    # Structured attributes (drive filtering, facts blocks and templates)
    line = models.CharField(max_length=40, blank=True)  # Pro, Air, mini, SE, Ultra, standard…
    size_label = models.CharField(max_length=20, blank=True)  # 13″, 45mm
    chip = models.CharField(max_length=60, blank=True)  # M5, A17 Pro
    generation = models.CharField(max_length=30, blank=True)  # 10th gen
    release_year = models.PositiveSmallIntegerField(null=True, blank=True)
    release_label = models.CharField(max_length=40, blank=True)  # Late 2018
    model_numbers = models.JSONField(default=list, blank=True)  # ["A3449"]
    apple_identifier = models.CharField(max_length=40, blank=True)

    image = models.ImageField(upload_to="catalog/models/", max_length=IMAGE_MAX_LENGTH, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    notes_en = models.TextField(blank=True)  # model-specific known faults (Markdown)
    notes_bn = models.TextField(blank=True)
    content_en = models.TextField(blank=True)
    content_bn = models.TextField(blank=True)
    faq = models.JSONField(default=list, blank=True)

    seo_title_en = models.CharField(max_length=160, blank=True)
    seo_title_bn = models.CharField(max_length=160, blank=True)
    seo_description_en = models.CharField(max_length=320, blank=True)
    seo_description_bn = models.CharField(max_length=320, blank=True)

    reference_source = models.CharField(max_length=300, blank=True)  # internal provenance
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-release_year", "display_order", "name_en"]
        constraints = [
            models.UniqueConstraint(fields=["family", "slug"], name="uniq_model_slug_per_family"),
        ]
        indexes = [models.Index(fields=["family", "release_year"])]

    def __str__(self):
        return self.name_en


class Issue(models.Model):
    class Category(models.TextChoices):
        SCREEN = "screen", "Screen"
        BATTERY = "battery", "Battery"
        POWER = "power", "Power & charging"
        BOARD = "board", "Logic board"
        AUDIO = "audio", "Audio"
        CAMERA = "camera", "Camera & sensors"
        INPUT = "input", "Keyboard, buttons & touch"
        BODY = "body", "Body & housing"
        SOFTWARE = "software", "Software"
        UPGRADE = "upgrade", "Upgrades"
        LIQUID = "liquid", "Liquid damage"
        CONNECTIVITY = "connectivity", "Connectivity"
        OTHER = "other", "Other"

    slug = models.SlugField(max_length=80, unique=True)
    name_en = models.CharField(max_length=100)
    name_bn = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    icon = models.CharField(max_length=50, blank=True)
    image = models.ImageField(  # default icon when an offering has none of its own
        upload_to="catalog/issues/", max_length=IMAGE_MAX_LENGTH, blank=True
    )
    applies_to = models.ManyToManyField(DeviceFamily, blank=True, related_name="issues")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Auto-page engine: Markdown with {{model.name}}-style variables
    default_content_en = models.TextField(blank=True)
    default_content_bn = models.TextField(blank=True)
    default_faq = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "name_en"]

    def __str__(self):
        return self.name_en


class ModelIssue(models.Model):
    """One repair offering on one model (a price card and, when indexable, a page)."""

    class IndexPolicy(models.TextChoices):
        AUTO = "auto", "Auto (published + unique content)"
        INDEX = "index", "Always index"
        NOINDEX = "noindex", "Never index"

    class ContentStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        REVIEW = "review", "In review"
        PUBLISHED = "published", "Published"

    MIN_UNIQUE_WORDS = 250

    model = models.ForeignKey(DeviceModel, on_delete=models.CASCADE, related_name="offerings")
    issue = models.ForeignKey(Issue, on_delete=models.PROTECT, related_name="offerings")
    is_active = models.BooleanField(default=True)

    price_from = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    price_options = models.JSONField(default=list, blank=True)  # [{label, price, warranty_days}]
    reference_price = models.DecimalField(  # INTERNAL: competitor/market reference, never public
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    turnaround_hours = models.PositiveIntegerField(null=True, blank=True)
    warranty_days = models.PositiveIntegerField(default=90)
    image = models.ImageField(  # device-specific repair icon; blank → issue.image
        upload_to="catalog/issues/", max_length=IMAGE_MAX_LENGTH, blank=True
    )

    content_en = models.TextField(blank=True)  # override; blank → issue default template
    content_bn = models.TextField(blank=True)
    faq = models.JSONField(default=list, blank=True)
    index_policy = models.CharField(
        max_length=10, choices=IndexPolicy.choices, default=IndexPolicy.AUTO
    )
    content_status = models.CharField(
        max_length=10, choices=ContentStatus.choices, default=ContentStatus.DRAFT
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["issue__display_order", "issue__name_en"]
        constraints = [
            models.UniqueConstraint(fields=["model", "issue"], name="uniq_offering_per_model_issue"),
        ]

    def __str__(self):
        return f"{self.model} — {self.issue}"

    @property
    def display_image(self):
        return self.image or self.issue.image

    @property
    def unique_words(self) -> int:
        return len(self.content_en.split())

    @property
    def is_indexable(self) -> bool:
        if not self.is_active:
            return False
        if self.index_policy == self.IndexPolicy.INDEX:
            return True
        if self.index_policy == self.IndexPolicy.NOINDEX:
            return False
        return (
            self.content_status == self.ContentStatus.PUBLISHED
            and self.unique_words >= self.MIN_UNIQUE_WORDS
        )
