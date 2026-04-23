from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('compra_brazaletes', '0006_bracelettransaction'),
    ]

    operations = [
        migrations.AddField(
            model_name='bracelettype',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
