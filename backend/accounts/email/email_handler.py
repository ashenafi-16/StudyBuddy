# accounts/email/email_handler.py
from ..templates.email_templates import create_welcome_email_template
from .resend_client import resend_client

def send_welcome_email(email: str, username: str, client_url: str):
    html_body = create_welcome_email_template(username, client_url)
 
    email_data = {
        "from": resend_client.sender,
        "to": email,
        "subject": f"Welcome to StudyBuddy, {username}! 🎉",
        "html": html_body
    }

    return resend_client.send(email_data)