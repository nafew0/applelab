import json
from pathlib import Path

from django.core.management.base import BaseCommand

from repairs.seeding import export_seed

DEFAULT_SEED = Path(__file__).resolve().parents[2] / "seed" / "catalog.json"


class Command(BaseCommand):
    help = "Write the current catalog structure (no prices) to the committed seed file."

    def add_arguments(self, parser):
        parser.add_argument("--file", default=str(DEFAULT_SEED))

    def handle(self, *args, **options):
        path = Path(options["file"])
        path.parent.mkdir(parents=True, exist_ok=True)
        data = export_seed()
        offerings = data.pop("offerings")
        body = json.dumps(data, ensure_ascii=False, indent=1)
        # One line per model keeps the 2k+ offering pairs compact and diffable.
        lines = ",\n".join(
            f"  {json.dumps(key)}: {json.dumps(slugs)}" for key, slugs in offerings.items()
        )
        body = body[:-2] + ',\n "offerings": {\n' + lines + "\n }\n}"
        path.write_text(body + "\n", encoding="utf-8")
        self.stdout.write(
            self.style.SUCCESS(
                f"Wrote {path}: families={len(data['families'])} issues={len(data['issues'])} "
                f"models={len(data['models'])} offerings={sum(len(v) for v in offerings.values())}"
            )
        )
