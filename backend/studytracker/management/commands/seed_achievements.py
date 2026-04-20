from django.core.management.base import BaseCommand
from studytracker.models import Achievement


class Command(BaseCommand):
    help = 'Seed achievement badges for streak milestones'

    def handle(self, *args, **options):
        achievements = [
            {
                'name': 'Rising Star',
                'required_days': 7,
                'description': 'Study for 7 consecutive days',
                'icon_name': 'badge_7d',
            },
            {
                'name': 'Consistent Learner',
                'required_days': 30,
                'description': 'Maintain a 1-month study streak',
                'icon_name': 'badge_1m',
            },
            {
                'name': 'Knowledge Seeker',
                'required_days': 90,
                'description': 'Maintain a 3-month study streak',
                'icon_name': 'badge_3m',
            },
            {
                'name': 'Dedicated Scholar',
                'required_days': 180,
                'description': 'Maintain a 6-month study streak',
                'icon_name': 'badge_6m',
            },
            {
                'name': 'Master of Discipline',
                'required_days': 365,
                'description': 'Maintain a 1-year study streak',
                'icon_name': 'badge_1y',
            },
        ]

        for ach in achievements:
            obj, created = Achievement.objects.update_or_create(
                required_days=ach['required_days'],
                defaults=ach
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status}: {obj.name} ({obj.required_days} days)')

        self.stdout.write(self.style.SUCCESS(f'Done — {len(achievements)} achievements seeded.'))
