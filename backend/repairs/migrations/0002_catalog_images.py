from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("repairs", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(model_name="devicefamily", old_name="hero_image", new_name="image"),
        migrations.AlterField(
            model_name="devicefamily",
            name="image",
            field=models.ImageField(blank=True, max_length=255, upload_to="catalog/families/"),
        ),
        migrations.AlterField(
            model_name="devicemodel",
            name="image",
            field=models.ImageField(blank=True, max_length=255, upload_to="catalog/models/"),
        ),
        migrations.AddField(
            model_name="issue",
            name="image",
            field=models.ImageField(blank=True, max_length=255, upload_to="catalog/issues/"),
        ),
        migrations.AddField(
            model_name="modelissue",
            name="image",
            field=models.ImageField(blank=True, max_length=255, upload_to="catalog/issues/"),
        ),
    ]
