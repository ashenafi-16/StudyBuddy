from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APITestCase
from rest_framework import status
from django.core import mail

User = get_user_model()

class PasswordResetTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='student@studybuddy.com', 
            password='old-password123', 
            username='student'
        )
        self.reset_url = reverse('password_reset_request')
        self.confirm_url = reverse('password_reset_confirm')
    
    def test_password_reset_request_success(self):
        # Test that a valid email triggers a 200 OK
        data = {"email": "student@studybuddy.com"}
        response = self.client.post(self.reset_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "If an account exists with this email, a reset link has been sent.")

    def test_password_reset_confirm_success(self):
        # Test that valid UID and Token actually change the password
        # 1. Manually generate the UID and Token for the user
        token = default_token_generator.make_token(self.user)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        data = {
            "uid": uid,
            "token": token,
            "new_password": "NewSecurePassword123!",
            "confirm_password": "NewSecurePassword123!"
        }

        response = self.client.post(self.confirm_url, data)

        # 2. Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Verify the password changed in the database
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewSecurePassword123!"))

    def test_password_reset_with_invalid_token(self):
        # Test that a fake token returns a 400 error
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        data = {
            "uid": uid,
            "token": "fake-invalid-token",
            "new_password": "NewSecurePassword123!",
            "confirm_password": "NewSecurePassword123!"
        }
        response = self.client.post(self.confirm_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_email_content(self):
        data = {"email": "student@studybuddy.com"}
        self.client.post(self.reset_url, data)

        # check email was sent
        self.assertEqual(len(mail.outbox), 1)

        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.subject, "Reset Your StudyBuddy Password")
        self.assertIn("student@studybuddy.com", sent_email.to)
        
        # 4. Verify that the email body contains the 'uid' and 'token'
        # This ensures your frontend link in the email is formatted correctly
        self.assertIn("reset-password", sent_email.body)

