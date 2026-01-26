from celery import shared_task
from .email.email_handler import send_welcome_email
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email_task(self, email, username, client_url):
    try:
        logger.info(f"Sending welcome email to {email}")
        return send_welcome_email(email, username, client_url)
    except Exception as e:
        logger.error(f"Error sending welcome email: {e}")
        self.retry(exc=e, countdown=10)