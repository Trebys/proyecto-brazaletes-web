# paypal_client.py

import os
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
from django.conf import settings
import requests


class PayPalClient:
    def __init__(self):
        client_id = settings.PAYPAL_CLIENT_ID
        client_secret = settings.PAYPAL_CLIENT_SECRET
        env_type = settings.PAYPAL_ENV  # "sandbox" or "live"

        if env_type == "sandbox":
            self.environment = SandboxEnvironment(
                client_id=client_id,
                client_secret=client_secret
            )
            self.base_url = "https://api-m.sandbox.paypal.com"
        else:
            self.environment = LiveEnvironment(
                client_id=client_id,
                client_secret=client_secret
            )
            self.base_url = "https://api-m.paypal.com"

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
        data = resp.json()
        return data["access_token"]
