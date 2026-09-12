"""Best-effort on-demand ISR revalidation of Next.js catalog pages.

When catalog rows change, POST the affected cache tags to the Next app
(`NEXT_REVALIDATE_URL` + `NEXT_REVALIDATE_SECRET`). Never raises, never
blocks the save; runs after commit. No-op when the URL is not configured.
"""
import logging

import requests
from django.conf import settings
from django.db import transaction
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver

from .models import DeviceFamily, DeviceModel, Issue, ModelIssue

logger = logging.getLogger(__name__)


def revalidate_tags(tags):
    url = getattr(settings, "NEXT_REVALIDATE_URL", "")
    secret = getattr(settings, "NEXT_REVALIDATE_SECRET", "")
    if not url:
        return

    def _send():
        try:
            response = requests.post(
                url,
                json={"secret": secret, "tags": sorted(set(tags))},
                timeout=3,
                allow_redirects=False,
            )
        except Exception as exc:  # noqa: BLE001 — best effort
            logger.warning("Next revalidation failed: %s", exc)
            return
        if response.status_code != 200:
            logger.warning("Next revalidation returned HTTP %s from %s", response.status_code, url)

    transaction.on_commit(_send)


def _tags_for(instance):
    if isinstance(instance, DeviceFamily):
        return ["catalog", f"family:{instance.slug}"]
    if isinstance(instance, DeviceModel):
        return ["catalog", f"family:{instance.family.slug}", f"model:{instance.family.slug}/{instance.slug}"]
    if isinstance(instance, ModelIssue):
        m = instance.model
        return ["catalog", f"family:{m.family.slug}", f"model:{m.family.slug}/{m.slug}"]
    if isinstance(instance, Issue):
        return ["catalog"]
    return ["catalog"]


@receiver(post_save, sender=DeviceFamily)
@receiver(post_save, sender=DeviceModel)
@receiver(post_save, sender=Issue)
@receiver(post_save, sender=ModelIssue)
@receiver(post_delete, sender=DeviceFamily)
@receiver(post_delete, sender=DeviceModel)
@receiver(post_delete, sender=Issue)
@receiver(post_delete, sender=ModelIssue)
def _on_catalog_change(sender, instance, **kwargs):
    revalidate_tags(_tags_for(instance))


@receiver(m2m_changed, sender=Issue.applies_to.through)
def _on_issue_families_change(sender, instance, **kwargs):
    revalidate_tags(["catalog"])
