import axios from 'axios';
import { API_BASE_URL, SESSION_IDLE_TIMEOUT_SECONDS } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const TOKEN_KEY = 'access_token';
const USER_DATA_KEY = 'user_data';
const SESSION_POLICY_KEY = 'session_policy';
const SESSION_MESSAGE_KEY = 'session_message';
const PURCHASE_STORAGE_KEYS = [
  'receiptId',
  'paypal_order_id',
  'paypalOrderId',
  '__paypal_storage__',
];

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const persistUserData = (user) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

export const persistAuthSession = ({ token, user, session }) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    persistUserData(user);
  }

  persistSessionPolicy(session);
};

export const persistPurchaseReceiptId = (receiptId) => {
  localStorage.setItem('receiptId', receiptId);
};

export const getStoredPurchaseReceiptId = () => {
  return localStorage.getItem('receiptId');
};

export const clearPurchaseStorage = () => {
  PURCHASE_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(SESSION_POLICY_KEY);
  clearPurchaseStorage();
};

export const persistSessionPolicy = (session) => {
  if (!session?.idle_timeout_seconds) {
    return;
  }

  localStorage.setItem(
    SESSION_POLICY_KEY,
    JSON.stringify({
      idle_timeout_seconds: Number(session.idle_timeout_seconds),
    })
  );
};

export const getStoredSessionIdleTimeoutMs = () => {
  const rawSessionPolicy = localStorage.getItem(SESSION_POLICY_KEY);

  if (!rawSessionPolicy) {
    return SESSION_IDLE_TIMEOUT_SECONDS * 1000;
  }

  try {
    const sessionPolicy = JSON.parse(rawSessionPolicy);
    const seconds = Number(sessionPolicy.idle_timeout_seconds);
    return Number.isFinite(seconds) && seconds > 0
      ? seconds * 1000
      : SESSION_IDLE_TIMEOUT_SECONDS * 1000;
  } catch (error) {
    console.error('Error parsing stored session policy:', error);
    localStorage.removeItem(SESSION_POLICY_KEY);
    return SESSION_IDLE_TIMEOUT_SECONDS * 1000;
  }
};

export const setSessionMessage = (message) => {
  localStorage.setItem(SESSION_MESSAGE_KEY, message);
};

export const consumeSessionMessage = () => {
  const message = localStorage.getItem(SESSION_MESSAGE_KEY);
  localStorage.removeItem(SESSION_MESSAGE_KEY);
  return message;
};

export const getSessionExpiredMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (
    typeof detail === 'string' &&
    detail.trim() &&
    !detail.toLowerCase().includes('invalid token')
  ) {
    return detail;
  }

  return 'Tu sesion ya no esta activa. Inicia sesion nuevamente.';
};

export const buildMediaUrl = (path) => {
  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.replace(/^\/+/, '').replace(/^media\//, '');
  return new URL(`/media/${normalizedPath}`, API_BASE_URL).toString();
};

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_DATA_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error('Error parsing stored user:', error);
    clearStoredAuth();
    return null;
  }
};

export const isAdminUser = (user) => {
  return Boolean(user?.is_admin || user?.is_staff || user?.is_superuser);
};

export const loginUser = async (identifier, password) => {
  const response = await api.post('login/', {
    identifier,
    password,
  });

  persistSessionPolicy(response.data.session);
  return response;
};

export const getClientData = async () => {
  try {
    const response = await api.post('user-profile/', null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${getStoredToken()}`,
      },
    });

    if (response.status === 200) {
      persistSessionPolicy(response.data.session);
      persistUserData(response.data);
      return response.data;
    }

    console.error('Failed to fetch user data:', response.status);
    throw new Error('Failed to fetch user data');
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const submitClientData = async (userData) => {
  const token = getStoredToken();
  if (!token) {
    console.error('No token found');
    return;
  }

  try {
    const hasProfileImage = Boolean(userData.profile_image);
    const payload = hasProfileImage ? new FormData() : userData;

    if (hasProfileImage) {
      Object.entries(userData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          payload.append(key, value);
        }
      });
    }

    const response = await api.patch('edit-user/', payload, {
      headers: {
        ...(hasProfileImage ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Token ${token}`,
      },
    });

    if (response.status === 200) {
      console.log('User data updated successfully:', response.data);
      persistUserData(response.data);
      return response.data;
    }

    console.error('Failed to update user data:', response.status);
    throw new Error('Failed to update user data');
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

export const deleteClientAccount = async () => {
  const token = getStoredToken();
  if (!token) {
    console.error('No token found');
    return;
  }

  try {
    const response = await api.delete('delete-user/', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });

    if (response.status === 204) {
      clearStoredAuth();
      console.log('Account deleted successfully');
      return;
    }

    console.error('Unexpected response status:', response.status);
    throw new Error('Failed to delete account');
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const Logout = async () => {
  const token = getStoredToken();
  if (!token) {
    clearStoredAuth();
    return;
  }

  try {
    const response = await api.post(
      'logout/',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      }
    );

    if (response.status === 200) {
      console.log(response.data.message);
      clearStoredAuth();
      console.log('Sesion cerrada correctamente');
      return;
    }

    console.error('Error al cerrar sesion en el backend');
  } catch (error) {
    if (error.response) {
      console.error('Error al cerrar sesion:', error.response.data.error);
    } else {
      alert('Error al cerrar sesion: ' + error.message);
    }
  } finally {
    clearStoredAuth();
  }
};

export const registerClient = async (clientData) => {
  try {
    const payload = { ...clientData };
    if (payload.account_balance === '') {
      delete payload.account_balance;
    }

    const response = await api.post('register/', payload);
    persistSessionPolicy(response.data.session);
    return response;
  } catch (error) {
    throw error;
  }
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('password-reset/request/', { email });
  return response.data;
};

export const confirmPasswordReset = async ({ email, code, newPassword }) => {
  const response = await api.post('password-reset/confirm/', {
    email,
    code,
    new_password: newPassword,
  });
  return response.data;
};

export const getTiposBrazaletes = async () => {
  try {
    const response = await api.get('compra_brazaletes/tipos/');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo tipos de brazaletes:', error);
    throw error;
  }
};

export const getAdminBraceletTypes = async () => {
  const response = await api.get('compra_brazaletes/tipos/?include_inactive=1');
  return response.data;
};

export const createAdminBraceletType = async (braceletTypeData) => {
  const response = await api.post('compra_brazaletes/tipos/', braceletTypeData);
  return response.data;
};

export const updateAdminBraceletType = async (braceletTypeId, braceletTypeData) => {
  const response = await api.patch(
    `compra_brazaletes/tipos/${braceletTypeId}/`,
    braceletTypeData
  );
  return response.data;
};

export const deleteAdminBraceletType = async (braceletTypeId) => {
  await api.delete(`compra_brazaletes/tipos/${braceletTypeId}/`);
};

export const getAdminClients = async () => {
  const response = await api.get('Users/');
  return response.data;
};

export const createAdminClient = async (clientData) => {
  const response = await registerClient(clientData);
  return response.data;
};

export const updateAdminClient = async (clientId, clientData) => {
  const response = await api.patch(`Users/${clientId}/`, clientData);
  return response.data;
};

export const deleteAdminClient = async (clientId) => {
  await api.delete(`Users/${clientId}/`);
};

export const getAdminBracelets = async () => {
  const response = await api.get('compra_brazaletes/brazaletes/');
  return response.data;
};

export const createAdminBracelet = async (braceletData) => {
  const response = await api.post('compra_brazaletes/brazaletes/', braceletData);
  return response.data;
};

export const updateAdminBracelet = async (braceletId, braceletData) => {
  const response = await api.patch(
    `compra_brazaletes/brazaletes/${braceletId}/`,
    braceletData
  );
  return response.data;
};

export const deleteAdminBracelet = async (braceletId) => {
  await api.delete(`compra_brazaletes/brazaletes/${braceletId}/`);
};

export const getAdminReceipts = async () => {
  const response = await api.get('compra_brazaletes/recibos/');
  return response.data;
};

export const getBraceletTransactions = async (params = {}) => {
  const response = await api.get('compra_brazaletes/transacciones/', { params });
  return response.data;
};

export const getTestimonials = async () => {
  const response = await api.get('testimonios/');
  return response.data;
};

export const createTestimonial = async (testimonialData) => {
  const response = await api.post('testimonios/', testimonialData);
  return response.data;
};

export const getAdminTestimonials = async () => {
  const response = await api.get('testimonios/');
  return response.data;
};

export const updateAdminTestimonial = async (testimonialId, testimonialData) => {
  const response = await api.patch(`testimonios/${testimonialId}/`, testimonialData);
  return response.data;
};

export const updateAdminReceipt = async (receiptId, receiptData) => {
  const response = await api.patch(
    `compra_brazaletes/recibos/${receiptId}/`,
    receiptData
  );
  return response.data;
};

export const deleteAdminReceipt = async (receiptId) => {
  await api.delete(`compra_brazaletes/recibos/${receiptId}/`);
};

export const createAdminAttraction = async (attractionData) => {
  const response = await api.post('atracciones-comidas/attractions/', attractionData);
  return response.data;
};

export const updateAdminAttraction = async (attractionId, attractionData) => {
  const response = await api.patch(
    `atracciones-comidas/attractions/${attractionId}/`,
    attractionData
  );
  return response.data;
};

export const deleteAdminAttraction = async (attractionId) => {
  await api.delete(`atracciones-comidas/attractions/${attractionId}/`);
};

export const createAdminFood = async (foodData) => {
  const response = await api.post('atracciones-comidas/foods/', foodData);
  return response.data;
};

export const updateAdminFood = async (foodId, foodData) => {
  const response = await api.patch(
    `atracciones-comidas/foods/${foodId}/`,
    foodData
  );
  return response.data;
};

export const deleteAdminFood = async (foodId) => {
  await api.delete(`atracciones-comidas/foods/${foodId}/`);
};

export const getAttractions = async () => {
  const response = await api.get('atracciones-comidas/attractions/');
  return response.data;
};

export const getFoods = async () => {
  const response = await api.get('atracciones-comidas/foods/');
  return response.data;
};

export const consumeAttraction = async (attractionId, braceletId) => {
  const response = await api.post(
    `atracciones-comidas/attractions/${attractionId}/consume/`,
    {
      bracelet_id: braceletId,
    }
  );
  return response.data;
};

export const purchaseFood = async (foodId, braceletId, paymentSource) => {
  const response = await api.post(
    `atracciones-comidas/foods/${foodId}/purchase/`,
    {
      bracelet_id: braceletId,
      payment_source: paymentSource,
    }
  );
  return response.data;
};

export const createPurchaseReceipt = async (braceletTypeId) => {
  const response = await api.post('compra_brazaletes/recibos/', {
    bracelet_type_id: braceletTypeId,
  });
  return response.data;
};

export const createPayPalOrder = async (amount, currency, description) => {
  try {
    const response = await api.post('compra_brazaletes/paypal/create-order/', {
      amount,
      currency,
      description,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw new Error('Error creating PayPal order');
  }
};

export const capturePayPalOrder = async (orderID, braceletTypeId) => {
  try {
    const response = await api.post('compra_brazaletes/paypal/capture-order/', {
      orderID,
      bracelet_type_id: braceletTypeId,
    });
    return response.data;
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw new Error('Error capturing PayPal order');
  }
};

export const getPurchaseReceiptById = async (receiptId) => {
  try {
    const response = await api.get(`compra_brazaletes/recibos/${receiptId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching the PurchaseReceipt:', error);
    throw error;
  }
};

export const getUserPurchaseReceipts = async () => {
  try {
    const response = await api.get('compra_brazaletes/recibos/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user receipts:', error);
    throw error;
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    persistSessionPolicy(response.data?.session);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      setSessionMessage(getSessionExpiredMessage(error));
    }

    return Promise.reject(error);
  }
);

export default api;
