const getRequiredEnv = (name) => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const API_BASE_URL = getRequiredEnv('VITE_API_BASE_URL');
export const PAYPAL_CLIENT_ID = getRequiredEnv('VITE_PAYPAL_CLIENT_ID');
