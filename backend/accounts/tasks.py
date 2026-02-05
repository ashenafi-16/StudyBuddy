from celery import shared_task
from .email.email_handler import send_welcome_email
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import EmailMultiAlternatives
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

@shared_task
def send_password_reset_email_task(email_address,uid, token):
    subject = "Reset Your StudyBuddy Password"

    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

    context = {
        'reset_url': reset_url,
        'user_email': email_address
    }
    html_content = render_to_string('emails/password_reset.html', context)

    text_content = f"""
    Hello,
    
    We received a request to reset your StudyBuddy password. 
    Please use the link below to set a new one:
    
    {reset_url}
    
    If you did not request this, please ignore this email.
    """

    email = EmailMultiAlternatives(
        subject, 
        text_content, 
        settings.EMAIL_HOST_USER,
        [email_address]
    )

    email.attach_alternative(html_content, 'text/html')

    email.send()