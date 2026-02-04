import uuid
import requests
from django.conf import settings


class ChapaService:
    """
    Chapa Payment Gateway Service
    """

    BASE_URL = "https://api.chapa.co/v1"

    def __init__(self):
        # Explicit mock mode (NEVER auto-detect from env)
        self.is_mock = getattr(settings, "CHAPA_MOCK_MODE", False)

    def get_auth_headers(self):
        """
        Authorization headers for Chapa API
        """
        if not settings.CHAPA_SECRET_KEY:
            raise ValueError("CHAPA_SECRET_KEY is not set")

        return {
            "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
            "Content-Type": "application/json",
        }

    def generate_tx_ref(self):
        """
        Generate unique transaction reference
        """
        return f"SB-{uuid.uuid4().hex[:12].upper()}"

    def initialize_payment(
        self,
        amount,
        email,
        first_name,
        last_name,
        tx_ref,
        callback_url,
        return_url,
        customization=None,
    ):
        """
        Initialize payment with Chapa
        """

        payload = {
            "amount": str(amount),
            "currency": "ETB",
            "email": email,
            "first_name": first_name,
            "last_name": last_name or first_name,
            "tx_ref": tx_ref,
            "callback_url": callback_url,
            "return_url": return_url,
            "customization": customization or {},
        }

        # ---------- MOCK MODE ----------
        if self.is_mock:
            return {
                "success": True,
                "checkout_url": return_url,
                "tx_ref": tx_ref,
                "data": {
                    "status": "success",
                    "message": "Mock payment initialized",
                },
            }

        # ---------- REAL CHAPA CALL ----------
        try:
            response = requests.post(
                f"{self.BASE_URL}/transaction/initialize",
                json=payload,
                headers=self.get_auth_headers(),
                timeout=30,
            )

            data = response.json()

            if response.status_code == 200 and data.get("status") == "success":
                return {
                    "success": True,
                    "checkout_url": data["data"]["checkout_url"],
                    "tx_ref": tx_ref,
                    "data": data["data"],
                }

            return {
                "success": False,
                "message": data.get("message", "Payment initialization failed"),
                "status_code": response.status_code,
                "data": data,
            }

        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "data": None,
            }

    def verify_payment(self, tx_ref):
        """
        Verify payment with Chapa
        """

        # ---------- MOCK MODE ----------
        if self.is_mock:
            return {
                "success": True,
                "verified": True,
                "data": {
                    "status": "success",
                    "tx_ref": tx_ref,
                    "amount": 0,
                    "currency": "ETB",
                },
            }

        # ---------- REAL CHAPA CALL ----------
        try:
            response = requests.get(
                f"{self.BASE_URL}/transaction/verify/{tx_ref}",
                headers=self.get_auth_headers(),
                timeout=30,
            )

            data = response.json()

            if response.status_code == 200 and data.get("status") == "success":
                return {
                    "success": True,
                    "verified": data["data"]["status"] == "success",
                    "data": data["data"],
                }

            return {
                "success": False,
                "verified": False,
                "message": data.get("message", "Verification failed"),
                "status_code": response.status_code,
                "data": data,
            }

        except Exception as e:
            return {
                "success": False,
                "verified": False,
                "message": str(e),
                "data": None,
            }


# Singleton instance
chapa_service = ChapaService()
