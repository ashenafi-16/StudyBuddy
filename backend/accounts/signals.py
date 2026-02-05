from django.dispatch import receiver
from django_rest_passwordreset.signals import reset_password_token_created
from .tasks import send_password_reset_email_task

@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    # .delay() tells Celery to put this in the Redis queue

    send_password_reset_email_task.delay(
        email_address=reset_password_token.user.email, 
        token=reset_password_token.key

    )