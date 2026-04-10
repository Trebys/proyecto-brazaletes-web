import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const persistUserData = (user) => {
  localStorage.setItem('user_data', JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
};

export const getStoredUser = () => {
  const rawUser = localStorage.getItem('user_data');

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
  return api.post('login/', {
    identifier,
    password,
  });
};

export const getClientData = async () => {
  try {
    const response = await api.post('user-profile/', null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${localStorage.getItem('access_token')}`,
      },
    });

    if (response.status === 200) {
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No token found');
    return;
  }

  try {
    const response = await api.patch('edit-user/', userData, {
      headers: {
        'Content-Type': 'application/json',
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
  const token = localStorage.getItem('access_token');
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
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.error('No token found');
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
  }
};

export const registerClient = async (clientData) => {
  try {
    const response = await api.post('register/', clientData);
    return response;
  } catch (error) {
    throw error;
  }
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
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
