from django.core.management.base import BaseCommand
from studytracker.models import Achievement


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        achievements = [
            ("1 Month Consistency", 30),
            ("3 Months Champion", 90),
            ("6 Months Master", 180),
            ("1 Year Legend", 365),
        ]

        for name, days in achievements:
            Achievement.objects.get_or_create(
                name=name,
                required_days=days
            )

        self.stdout.write("Achievements created successfully")
