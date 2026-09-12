"""Attach catalog images from an images folder (the research crawl layout).

    images/
      groups/<group>.<ext>                     category pictures  → DeviceFamily.image
      devices/<family>__<device>.<ext>         device-line pictures (MacBook families)
      models/<family>__<model>.<ext>           model photos       → DeviceModel.image
      issues/<file>.<ext>                      repair icons       → ModelIssue.image (+ Issue.image default)
      manifest_services.csv                    crawl service_id → issues/ file
      catalog_images.json                      written here: every file keyed by OUR slugs

Where the crawl CSVs and an `import_catalog`-built catalog exist (local dev), the
command resolves everything to our slugs and (re)writes `catalog_images.json`.
Anywhere else (production) it reads that JSON, so migrating is: copy the folder
to the server, run this command. Images are re-encoded to WebP on the way in
(`repairs.images`). Existing images are kept unless `--overwrite`.
"""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from PIL import Image, UnidentifiedImageError

from repairs.images import MAX_EDGE, InvalidImage, release, store, to_webp
from repairs.models import DeviceFamily, DeviceModel, Issue, ModelIssue
from repairs.signals import revalidate_tags

from .import_catalog import MERGE

DEFAULT_DIR = Path(__file__).resolve().parents[4] / "research" / "ifixit-crawl" / "images"
MAP_FILE = "catalog_images.json"
IMAGE_EXTS = (".webp", ".png", ".jpg", ".jpeg", ".gif")

# The crawl's shared "macbook-series" picture shows only Airs, so the two
# MacBook families use their own device-line pictures instead.
FAMILY_SOURCES = {
    "iphone": "groups/iphone",
    "ipad": "groups/ipad-series",
    "macbook-air": "devices/macbook-air__macbook-air-13-inch",
    "macbook-pro": "devices/macbook-pro__macbook-pro-14-inch",
    "imac": "groups/imac-series",
    "mac-mini": "groups/mac-mini",
    "mac-studio": "groups/mac-studio",
    "apple-watch": "groups/apple-watch-series",
    "airpods": "groups/airpods-series",
    "vision-pro": "groups/vision-pro-series",
}


def _icon_stem(rel: str) -> str:
    """`issues/<issue>__<family>__<model>.png` → `<issue>__<family>`: icons are shared per family."""
    return "__".join(Path(rel).stem.split("__")[:2])


def _find(images_dir: Path, stem: str) -> str | None:
    for ext in IMAGE_EXTS:
        if (images_dir / f"{stem}{ext}").is_file():
            return f"{stem}{ext}"
    return None


class Command(BaseCommand):
    help = "Attach family/model/repair images from an images folder (WebP, owner uploads kept)."

    def add_arguments(self, parser):
        parser.add_argument("--images-dir", default=str(DEFAULT_DIR))
        parser.add_argument("--overwrite", action="store_true", help="Replace images that are already set.")
        parser.add_argument("--dry-run", action="store_true", help="Report what would change; write nothing.")

    # ------------------------------------------------------------------ plan
    def build_plan(self, images_dir: Path) -> dict | None:
        """Resolve files to our slugs from the crawl CSVs + DB provenance (local only)."""
        crawl_dir = images_dir.parent
        services_csv = crawl_dir / "csv" / "services.csv"
        models_csv = crawl_dir / "csv" / "models.csv"
        manifest = images_dir / "manifest_services.csv"
        if not (services_csv.exists() and models_csv.exists() and manifest.exists()):
            return None
        by_source = {
            m.reference_source: m
            for m in DeviceModel.objects.select_related("family").exclude(reference_source="")
        }
        if not by_source:
            return None

        plan = {"version": 1, "families": {}, "models": {}, "offerings": {}, "issues": {}}
        for family_slug, stem in FAMILY_SOURCES.items():
            found = _find(images_dir, stem)
            if found:
                plan["families"][family_slug] = found
        for path in sorted((images_dir / "models").glob("*")):
            if path.suffix.lower() in IMAGE_EXTS and "__" in path.stem:
                family_slug, model_slug = path.stem.split("__", 1)
                plan["models"][f"{family_slug}/{model_slug}"] = f"models/{path.name}"

        model_url = {}
        with open(models_csv, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                model_url[(row["device_endpoint"], row["endpoint"])] = row["url"]
        service_file = {}
        with open(manifest, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                if row["local_path"]:
                    service_file[row["service_id"]] = row["local_path"].removeprefix("images/")
        issue_votes = defaultdict(Counter)
        with open(services_csv, newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                rel = service_file.get(row["service_id"])
                issue_slug = MERGE.get(row["issue_key"])
                model = by_source.get(model_url.get((row["device_endpoint"], row["model_endpoint"]), ""))
                if not (rel and issue_slug and model and (images_dir / rel).is_file()):
                    continue
                key = f"{model.family.slug}/{model.slug}/{issue_slug}"
                plan["offerings"].setdefault(key, rel)  # merged competitor keys: first wins
                issue_votes[issue_slug][rel] += 1
        plan["issues"] = {slug: votes.most_common(1)[0][0] for slug, votes in sorted(issue_votes.items())}
        return plan

    # ---------------------------------------------------------------- attach
    def handle(self, *args, **options):
        images_dir = Path(options["images_dir"]).resolve()
        if not images_dir.is_dir():
            raise CommandError(f"Missing images folder: {images_dir}")
        dry_run, overwrite = options["dry_run"], options["overwrite"]

        plan = self.build_plan(images_dir)
        map_path = images_dir / MAP_FILE
        if plan is not None:
            if not dry_run:
                map_path.write_text(json.dumps(plan, indent=1, sort_keys=True) + "\n", encoding="utf-8")
            self.stdout.write(f"Resolved images from the crawl → {map_path.name}")
        elif map_path.exists():
            plan = json.loads(map_path.read_text(encoding="utf-8"))
            self.stdout.write(f"Using {map_path.name}")
        else:
            raise CommandError(
                f"No {MAP_FILE} in {images_dir} and no crawl data to build it from. "
                "Run this command once where research/ifixit-crawl and import_catalog data exist."
            )

        self._stored: dict[tuple[str, str], str] = {}
        self._replaced: set[str] = set()
        self._images_dir = images_dir
        self._dry_run = dry_run
        now = timezone.now()
        counts = Counter()

        with transaction.atomic():
            for family_slug, rel in plan["families"].items():
                qs = DeviceFamily.objects.filter(slug=family_slug)
                counts.update(self._assign(qs, rel, "families", family_slug, overwrite, now, "families"))
            for key, rel in plan["models"].items():
                family_slug, model_slug = key.split("/", 1)
                qs = DeviceModel.objects.filter(family__slug=family_slug, slug=model_slug)
                counts.update(self._assign(qs, rel, "models", f"{family_slug}-{model_slug}", overwrite, now, "models"))
            for issue_slug, rel in plan["issues"].items():
                qs = Issue.objects.filter(slug=issue_slug)
                counts.update(self._assign(qs, rel, "issues", _icon_stem(rel), overwrite, now, "issues"))
            offering_pk = {
                f"{family_slug}/{model_slug}/{issue_slug}": pk
                for pk, family_slug, model_slug, issue_slug in ModelIssue.objects.values_list(
                    "pk", "model__family__slug", "model__slug", "issue__slug"
                )
            }
            by_file = defaultdict(list)
            for key, rel in plan["offerings"].items():
                by_file[rel].append(key)
            for rel, keys in by_file.items():
                ids = [offering_pk[key] for key in keys if key in offering_pk]
                counts["offerings: no matching row"] += len(keys) - len(ids)
                qs = ModelIssue.objects.filter(pk__in=ids)
                counts.update(self._assign(qs, rel, "issues", _icon_stem(rel), overwrite, now, "offerings"))
            if dry_run:
                transaction.set_rollback(True)

        if not dry_run:
            for name in self._replaced:
                release(name)
            if any(k.endswith("attached") for k in counts):
                revalidate_tags(["catalog"])

        prefix = "[dry run] " if dry_run else ""
        for key in sorted(counts):
            self.stdout.write(f"  {key}: {counts[key]}")
        self.stdout.write(self.style.SUCCESS(f"{prefix}Catalog images done: {len(self._stored)} files stored"))

    def _assign(self, qs, rel, folder, stem, overwrite, now, label):
        rows = list(qs.values_list("pk", "image"))
        if not rows:
            return {f"{label}: no matching row": 1}
        targets = [(pk, old) for pk, old in rows if overwrite or not old]
        result = Counter({f"{label}: kept existing": len(rows) - len(targets)})
        if not targets:
            return result
        name = self._stored_name(rel, folder, stem)
        if name is None:
            result[f"{label}: unreadable file"] += len(targets)
            return result
        changed = [pk for pk, old in targets if old != name]
        if changed:
            qs.model.objects.filter(pk__in=changed).update(image=name, updated_at=now)
            self._replaced.update(old for pk, old in targets if old and old != name)
        result[f"{label}: attached"] += len(changed)
        result[f"{label}: already current"] += len(targets) - len(changed)
        return result

    def _stored_name(self, rel, folder, stem):
        path = self._images_dir / rel
        try:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError as exc:
            self.stderr.write(f"  skipped {rel}: {exc}")
            return None
        cache_key = (digest, folder)  # the crawl saved one icon under many names
        if cache_key not in self._stored:
            try:
                if self._dry_run:
                    with Image.open(path) as probe:
                        probe.verify()
                    self._stored[cache_key] = f"(dry run) {rel}"
                else:
                    webp = to_webp(path.read_bytes(), MAX_EDGE[folder])
                    self._stored[cache_key] = store(folder, stem, webp)
            except (OSError, InvalidImage, UnidentifiedImageError) as exc:
                self.stderr.write(f"  skipped {rel}: {exc}")
                return None
        return self._stored[cache_key]
