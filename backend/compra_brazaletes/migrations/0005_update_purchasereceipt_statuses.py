from django.db import migrations, models


def migrate_receipt_statuses(apps, schema_editor):
    PurchaseReceipt = apps.get_model('compra_brazaletes', 'PurchaseReceipt')
    PurchaseReceipt.objects.filter(status='CREATED').update(status='CAPTURED')


class Migration(migrations.Migration):

    dependencies = [
        ('compra_brazaletes', '0004_purchasereceipt_status'),
    ]

    operations = [
        migrations.RunPython(migrate_receipt_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='purchasereceipt',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pendiente'),
                    ('APPROVED', 'Aprobado'),
                    ('CAPTURED', 'Capturado'),
                    ('REFUNDED', 'Reembolsado'),
                ],
                default='PENDING',
                max_length=20,
            ),
        ),
    ]
