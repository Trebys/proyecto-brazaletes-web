# paypal_client.py

import os
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
from django.conf import settings


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
        else:
            self.environment = LiveEnvironment(
                client_id=client_id,
                client_secret=client_secret
            )

        # Creates the PayPalHttpClient object
        self.client = PayPalHttpClient(self.environment)
