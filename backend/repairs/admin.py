"""Django admin fallback for the catalog (the React admin is the primary UI)."""
from django.contrib import admin

from .models import DeviceFamily, DeviceModel, Issue, ModelIssue


class ModelIssueInline(admin.TabularInline):
    model = ModelIssue
    extra = 0
    fields = ("issue", "is_active", "price_from", "reference_price", "content_status", "index_policy")


@admin.register(DeviceFamily)
class DeviceFamilyAdmin(admin.ModelAdmin):
    list_display = ("name_en", "slug", "kind", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    prepopulated_fields = {"slug": ("name_en",)}
    search_fields = ("name_en", "name_bn", "slug")


@admin.register(DeviceModel)
class DeviceModelAdmin(admin.ModelAdmin):
    list_display = ("name_en", "family", "line", "chip", "release_year", "is_active", "is_featured")
    list_filter = ("family", "line", "release_year", "is_active")
    search_fields = ("name_en", "name_bn", "slug", "chip", "model_numbers")
    inlines = [ModelIssueInline]


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ("name_en", "slug", "category", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    list_filter = ("category", "applies_to")
    filter_horizontal = ("applies_to",)
    search_fields = ("name_en", "name_bn", "slug")


@admin.register(ModelIssue)
class ModelIssueAdmin(admin.ModelAdmin):
    list_display = ("model", "issue", "is_active", "price_from", "content_status", "index_policy")
    list_filter = ("content_status", "index_policy", "issue__category", "model__family")
    search_fields = ("model__name_en", "issue__name_en")
