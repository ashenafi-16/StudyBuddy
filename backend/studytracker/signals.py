from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import StudyActivity, StudyStreak
from django.db import transaction
from .utils import update_streak

@receiver(post_save, sender=StudyActivity)
def handle_study_activity(sender, instance, created, **kwargs):
    # automatically update the user's streak whenever they log a new study activity
    if created:
        # we use on_commit to ensure the activity is fully saved
        # to the DB before we start calculating streaks.
        transaction.on_commit(lambda: update_streak(instance.user))