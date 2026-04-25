const getRequiredEnv = (name) => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const API_BASE_URL = getRequiredEnv('VITE_API_BASE_URL');
export const PAYPAL_CLIENT_ID = getRequiredEnv('VITE_PAYPAL_CLIENT_ID');

const sessionIdleTimeoutMinutes = Number(
  import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MINUTES || 15
);

export const SESSION_IDLE_TIMEOUT_SECONDS = sessionIdleTimeoutMinutes * 60;
