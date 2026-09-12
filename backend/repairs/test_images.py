"""Catalog images: WebP normalisation, shared-file lifecycle, admin upload, folder import."""
import json
import shutil
import tempfile
from io import BytesIO
from pathlib import Path
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from repairs import images
from repairs.models import DeviceFamily, DeviceModel, Issue, ModelIssue

User = get_user_model()


def png_bytes(size=(64, 48), color=(10, 120, 200, 255)):
    buffer = BytesIO()
    Image.new("RGBA", size, color).save(buffer, "PNG")
    return buffer.getvalue()


class MediaRootMixin:
    def setUp(self):
        super().setUp()
        self.media_root = tempfile.mkdtemp()
        override = override_settings(MEDIA_ROOT=self.media_root, CATALOG_PAGES_SECRET="page-key")
        override.enable()
        self.addCleanup(override.disable)
        self.addCleanup(shutil.rmtree, self.media_root, ignore_errors=True)
        self.family = DeviceFamily.objects.create(slug="iphone", name_en="iPhone")
        self.model = DeviceModel.objects.create(family=self.family, slug="15-pro", name_en="iPhone 15 Pro")
        self.other = DeviceModel.objects.create(family=self.family, slug="15", name_en="iPhone 15")
        self.issue = Issue.objects.create(slug="screen-replacement", name_en="Screen Replacement")
        self.offering = ModelIssue.objects.create(model=self.model, issue=self.issue)
        self.other_offering = ModelIssue.objects.create(model=self.other, issue=self.issue)

    def stored(self, name):
        return (Path(self.media_root) / name).exists()


class ImageHelperTests(MediaRootMixin, TestCase):
    def test_to_webp_converts_and_caps_size(self):
        webp = images.to_webp(png_bytes((2000, 1000)), max_edge=512)
        with Image.open(BytesIO(webp)) as out:
            self.assertEqual(out.format, "WEBP")
            self.assertEqual(max(out.size), 512)

    def test_to_webp_rejects_non_images(self):
        with self.assertRaises(images.InvalidImage):
            images.to_webp(b"<svg onload=alert(1)>", 512)
        with self.assertRaises(images.InvalidImage):
            images.to_webp(b"%PDF-1.4 not an image", 512)

    def test_replacing_releases_old_file_unless_still_shared(self):
        first = images.set_image(self.offering, "issues", "icon", png_bytes(color=(1, 2, 3, 255)))
        self.other_offering.image.name = first
        self.other_offering.save()
        second = images.set_image(self.offering, "issues", "icon", png_bytes(color=(9, 9, 9, 255)))
        self.assertNotEqual(first, second)
        self.assertTrue(self.stored(first))  # still used by the other offering
        images.clear_image(self.other_offering)
        self.assertFalse(self.stored(first))
        self.assertTrue(self.stored(second))

    def test_same_picture_reuses_the_same_file(self):
        a = images.set_image(self.model, "models", "iphone-15-pro", png_bytes())
        b = images.set_image(self.model, "models", "iphone-15-pro", png_bytes())
        self.assertEqual(a, b)
        self.assertTrue(a.startswith("catalog/models/iphone-15-pro-") and a.endswith(".webp"))


class AdminImageUploadTests(MediaRootMixin, TestCase):
    def setUp(self):
        super().setUp()
        staff = User.objects.create_user(username="staff", email="s@example.com", password="x", is_staff=True, is_superuser=True)
        self.client = APIClient()
        self.client.force_authenticate(staff)

    def upload(self, kind, pk, content, name="photo.png"):
        return self.client.post(
            f"/api/admin/catalog/{kind}/{pk}/image/",
            {"image": SimpleUploadedFile(name, content, content_type="image/png")},
            format="multipart",
        )

    def test_upload_replace_and_remove(self):
        r = self.upload("models", self.model.pk, png_bytes())
        self.assertEqual(r.status_code, 200, r.content)
        self.assertRegex(r.json()["image"], r"^/media/catalog/models/iphone-15-pro-[0-9a-f]{10}\.webp$")
        detail = self.client.get(f"/api/admin/catalog/models/{self.model.pk}/").json()
        self.assertEqual(detail["image"], r.json()["image"])
        r = self.client.delete(f"/api/admin/catalog/models/{self.model.pk}/image/")
        self.assertEqual(r.json(), {"image": ""})
        self.model.refresh_from_db()
        self.assertFalse(self.model.image)

    def test_every_kind_accepts_an_image(self):
        for kind, pk in (("families", self.family.pk), ("issues", self.issue.pk), ("offerings", self.offering.pk)):
            self.assertEqual(self.upload(kind, pk, png_bytes()).status_code, 200, kind)

    def test_rejects_bad_files_unknown_kinds_and_non_staff(self):
        self.assertEqual(self.upload("models", self.model.pk, b"not an image").status_code, 400)
        with mock.patch("repairs.admin_views.MAX_UPLOAD_BYTES", 10):
            self.assertEqual(self.upload("models", self.model.pk, png_bytes()).status_code, 400)
        self.assertEqual(self.upload("users", 1, png_bytes()).status_code, 404)
        plain = APIClient()
        plain.force_authenticate(User.objects.create_user(username="p", email="p@example.com", password="x"))
        r = plain.post(f"/api/admin/catalog/models/{self.model.pk}/image/", {"image": SimpleUploadedFile("a.png", png_bytes())}, format="multipart")
        self.assertEqual(r.status_code, 403)

    def test_image_fields_cannot_be_set_through_json(self):
        self.client.patch(f"/api/admin/catalog/models/{self.model.pk}/", {"image": "../../etc/passwd"}, format="json")
        self.model.refresh_from_db()
        self.assertFalse(self.model.image)

    def test_public_pages_expose_urls_with_issue_icon_fallback(self):
        images.set_image(self.issue, "issues", "screen", png_bytes(color=(5, 5, 5, 255)))
        images.set_image(self.offering, "issues", "screen-iphone", png_bytes(color=(6, 6, 6, 255)))
        public = APIClient()
        public.credentials(HTTP_X_CATALOG_KEY="page-key")
        page = public.get("/api/catalog/pages/model/iphone/15/").json()
        self.assertEqual(page["offerings"][0]["image"], self.issue.image.url)  # fallback
        page = public.get("/api/catalog/pages/model/iphone/15-pro/").json()
        self.assertEqual(page["offerings"][0]["image"], ModelIssue.objects.get(pk=self.offering.pk).image.url)


class ImportCatalogImagesTests(MediaRootMixin, TestCase):
    def make_folder(self):
        folder = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, folder, ignore_errors=True)
        (folder / "models").mkdir()
        (folder / "groups").mkdir()
        (folder / "issues").mkdir()
        (folder / "models" / "iphone__15-pro.png").write_bytes(png_bytes(color=(1, 1, 1, 255)))
        (folder / "groups" / "iphone.png").write_bytes(png_bytes(color=(2, 2, 2, 255)))
        icon = png_bytes(color=(3, 3, 3, 255))
        # the crawl stores one icon under several names — must become one file
        (folder / "issues" / "screen-replacement__iphone__15-pro.png").write_bytes(icon)
        (folder / "issues" / "screen-replacement__iphone__15.png").write_bytes(icon)
        plan = {
            "version": 1,
            "families": {"iphone": "groups/iphone.png"},
            "models": {"iphone/15-pro": "models/iphone__15-pro.png", "iphone/gone": "models/iphone__15-pro.png"},
            "issues": {"screen-replacement": "issues/screen-replacement__iphone__15-pro.png"},
            "offerings": {
                "iphone/15-pro/screen-replacement": "issues/screen-replacement__iphone__15-pro.png",
                "iphone/15/screen-replacement": "issues/screen-replacement__iphone__15.png",
            },
        }
        (folder / "catalog_images.json").write_text(json.dumps(plan))
        return folder

    def test_portable_folder_import_is_idempotent_and_keeps_owner_images(self):
        folder = self.make_folder()
        call_command("import_catalog_images", "--images-dir", str(folder), verbosity=0, stdout=BytesIOText())
        for obj in (self.family, self.model, self.issue, self.offering, self.other_offering):
            obj.refresh_from_db()
            self.assertTrue(obj.image, obj)
            self.assertTrue(obj.image.name.endswith(".webp"))
        self.assertEqual(self.offering.image.name, self.other_offering.image.name)  # deduplicated
        self.assertEqual(self.issue.image.name, self.offering.image.name)

        owner = images.set_image(self.model, "models", "owner-photo", png_bytes(color=(200, 0, 0, 255)))
        call_command("import_catalog_images", "--images-dir", str(folder), verbosity=0, stdout=BytesIOText())
        self.model.refresh_from_db()
        self.assertEqual(self.model.image.name, owner)

        call_command("import_catalog_images", "--images-dir", str(folder), "--overwrite", verbosity=0, stdout=BytesIOText())
        self.model.refresh_from_db()
        self.assertNotEqual(self.model.image.name, owner)
        self.assertFalse(self.stored(owner))  # replaced and unreferenced → removed

    def test_dry_run_writes_nothing(self):
        folder = self.make_folder()
        call_command("import_catalog_images", "--images-dir", str(folder), "--dry-run", verbosity=0, stdout=BytesIOText())
        self.model.refresh_from_db()
        self.assertFalse(self.model.image)
        self.assertFalse((Path(self.media_root) / "catalog").exists())


class BytesIOText:
    """Swallow command output in tests."""

    def write(self, *_):
        pass

    def flush(self):
        pass
