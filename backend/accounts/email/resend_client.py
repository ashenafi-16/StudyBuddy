import resend
from django.conf import settings

class ResendClient:
    def __init__(self):
        resend.api_key = settings.RESEND_API_KEY
        self.sender = settings.EMAIL_FROM
    
    def send(self, data:dict):

        return resend.Emails.send(data)

resend_client = ResendClient()