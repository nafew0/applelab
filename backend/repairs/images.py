"""Catalog image storage.

Every catalog image — admin upload or `import_catalog_images` — is re-encoded
to WebP (strips metadata, caps the long edge, rejects non-images) and stored
under `catalog/<kind>/<stem>-<content hash>.webp`. The hash makes names
deterministic (re-importing the same picture reuses the file) and changes the
URL whenever the picture changes, so browsers and CDNs never show a stale one.
One file may back many rows (a repair icon shared by dozens of models), so a
file is deleted only when no catalog row references it any more.
"""
import hashlib
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils.text import slugify
from PIL import Image, ImageOps, UnidentifiedImageError

from .models import DeviceFamily, DeviceModel, Issue, ModelIssue

MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_SOURCE_PIXELS = 40_000_000  # decompression-bomb guard
ALLOWED_FORMATS = {"PNG", "JPEG", "WEBP", "GIF"}
MAX_EDGE = {"families": 1200, "models": 1200, "issues": 512}
WEBP_QUALITY = 85

IMAGE_MODELS = (DeviceFamily, DeviceModel, Issue, ModelIssue)


class InvalidImage(ValueError):
    pass


def to_webp(data: bytes, max_edge: int) -> bytes:
    try:
        with Image.open(BytesIO(data)) as source:
            if source.format not in ALLOWED_FORMATS:
                raise InvalidImage("Use a PNG, JPEG, WebP or GIF image.")
            if source.width * source.height > MAX_SOURCE_PIXELS:
                raise InvalidImage("Image dimensions are too large.")
            source.load()
            image = ImageOps.exif_transpose(source)
            has_alpha = image.mode in ("RGBA", "LA", "PA") or (
                image.mode == "P" and "transparency" in image.info
            )
            image = image.convert("RGBA" if has_alpha else "RGB")
            image.thumbnail((max_edge, max_edge), Image.LANCZOS)
            out = BytesIO()
            image.save(out, "WEBP", quality=WEBP_QUALITY)
            if has_alpha:  # line-art icons compress far better losslessly
                lossless = BytesIO()
                image.save(lossless, "WEBP", lossless=True)
                if lossless.tell() < out.tell():
                    out = lossless
    except InvalidImage:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, ValueError) as exc:
        raise InvalidImage("This file is not a readable image.") from exc
    return out.getvalue()


def store(kind: str, stem: str, webp: bytes) -> str:
    """Save WebP bytes under a content-addressed name; returns the storage name."""
    digest = hashlib.sha256(webp).hexdigest()[:10]
    name = f"catalog/{kind}/{slugify(stem)[:80] or 'image'}-{digest}.webp"
    if default_storage.exists(name):
        return name  # same stem + same bytes → same file
    saved = default_storage.save(name, ContentFile(webp))
    return saved


def is_referenced(name: str) -> bool:
    return any(model.objects.filter(image=name).exists() for model in IMAGE_MODELS)


def release(name: str) -> None:
    """Delete a stored file once no catalog row points at it."""
    if name and not is_referenced(name) and default_storage.exists(name):
        default_storage.delete(name)


def url_of(field) -> str:
    """Site-relative URL (/media/…): served by nginx in production, proxied by Next in dev."""
    return field.url if field else ""


def set_image(instance, kind: str, stem: str, data: bytes) -> str:
    webp = to_webp(data, MAX_EDGE[kind])
    old = instance.image.name
    name = store(kind, stem, webp)
    instance.image.name = name
    instance.save(update_fields=["image", "updated_at"])
    if old and old != name:
        release(old)
    return name


def clear_image(instance) -> None:
    old = instance.image.name
    if not old:
        return
    instance.image = ""
    instance.save(update_fields=["image", "updated_at"])
    release(old)


def image_stem(instance) -> str:
    """Readable file stem for a catalog row (the hash keeps it unique)."""
    if isinstance(instance, DeviceFamily):
        return instance.slug
    if isinstance(instance, DeviceModel):
        return f"{instance.family.slug}-{instance.slug}"
    if isinstance(instance, Issue):
        return instance.slug
    return f"{instance.issue.slug}-{instance.model.family.slug}-{instance.model.slug}"
