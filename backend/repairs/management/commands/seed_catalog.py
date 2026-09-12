import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from repairs.seeding import load_seed

DEFAULT_SEED = Path(__file__).resolve().parents[2] / "seed" / "catalog.json"


class Command(BaseCommand):
    help = "Load the committed device catalog seed (idempotent; never touches prices)."

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_SEED))
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Also rewrite names/content of existing rows (discards owner edits to those fields).",
        )

    def handle(self, *args, **options):
        path = Path(options["file"])
        if not path.exists():
            raise CommandError(f"Missing {path}")
        try:
            counts = load_seed(json.loads(path.read_text(encoding="utf-8")), overwrite=options["overwrite"])
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(
            self.style.SUCCESS(
                "Catalog seed loaded: "
                f"families={counts['families']} issues={counts['issues']} "
                f"models={counts['models']} new offerings={counts['offerings_created']}"
            )
        )
