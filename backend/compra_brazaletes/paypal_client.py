from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from paypalcheckoutsdk.core import LiveEnvironment, PayPalHttpClient, SandboxEnvironment
import requests


class PayPalClient:
    def __init__(self):
        client_id = settings.PAYPAL_CLIENT_ID
        client_secret = settings.PAYPAL_CLIENT_SECRET
        env_type = settings.PAYPAL_ENV  # "sandbox" or "live"

        if not client_id or not client_secret:
            raise ImproperlyConfigured(
                "PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be configured."
            )

        if env_type == "sandbox":
            self.environment = SandboxEnvironment(
                client_id=client_id,
                client_secret=client_secret
            )
            self.base_url = "https://api-m.sandbox.paypal.com"
        elif env_type == "live":
            self.environment = LiveEnvironment(
                client_id=client_id,
                client_secret=client_secret
            )
            self.base_url = "https://api-m.paypal.com"
        else:
            raise ImproperlyConfigured("PAYPAL_ENV must be 'sandbox' or 'live'.")

        self.client_id = client_id
        self.client_secret = client_secret
        self.client = PayPalHttpClient(self.environment)

    def get_access_token(self):
        """
        Obtiene un access_token via OAuth2 con client_id/client_secret.
        """
        url = f"{self.base_url}/v1/oauth2/token"
        resp = requests.post(
            url,
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
            auth=(self.client_id, self.client_secret),
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["access_token"]
