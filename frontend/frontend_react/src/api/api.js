import axios from 'axios';

// Crear la instancia de Axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api/', // Cambia la URL por la de tu backend
});

//Crear funcion para Login y llamarla en Login Form
export const loginUser = async (identifier, password) => {
  // asumiendo que tu endpoint es '/login/' en el backend
  return api.post('login/', {
    identifier,
    password,
  });
};

// Función para obtener los datos del usuario
export const getClientData = async () => {
  try {
    const response = await api.post('user-profile/', null, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${localStorage.getItem('access_token')}`, // Agrega el token al encabezado
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error('Failed to fetch user data:', response.status);
      throw new Error('Failed to fetch user data');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
// Función para enviar datos del cliente al backend
export const submitClientData = async (userData) => {
  const token = localStorage.getItem('access_token'); // Obtén el token del localStorage
  if (!token) {
    console.error('No token found');
    return; // Si no hay token, no es necesario hacer la solicitud
  }

  try {
    const response = await api.patch('edit-user/', userData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`, // Añadir el token de autenticación
      },
    });

    if (response.status === 200) {
      console.log('User data updated successfully:', response.data);
      return response.data; // Devuelve los datos de la respuesta en caso de éxito
    } else {
      console.error('Failed to update user data:', response.status);
      throw new Error('Failed to update user data'); // Lanza error si la respuesta no es exitosa
    }
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error; // Lanza el error para que pueda ser manejado en el componente
  }
};

// Función para eliminar la cuenta de usuario
export const deleteClientAccount = async () => {
  const token = localStorage.getItem('access_token'); // Obtén el token del localStorage
  if (!token) {
    console.error('No token found');
    return; // Si no hay token, no es necesario hacer la solicitud
  }
  try {
    const response = await api.delete('delete-user/', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`, // Añadir el token de autenticación
      },
    });

    if (response.status === 204) {
      // Eliminar tokens del localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      console.log('Account deleted successfully');
    } else {
      console.error('Unexpected response status:', response.status);
      throw new Error('Failed to delete account');
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error; // Lanza el error para que pueda ser manejado en el componente
  }
};

// Función para cerrar sesión
export const Logout = async () => {
  const token = localStorage.getItem('access_token'); // Obtén el token del localStorage
  if (!token) {
    console.error('No token found');
    return; // Si no hay token, no es necesario hacer la solicitud
  }

  try {
    // Llamada al backend para invalidar el token
    const response = await api.post(
      'logout/',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`, // Se usa 'Token' en lugar de 'Bearer'
        },
      }
    );

    if (response.status === 200) {
      // Mostrar el mensaje recibido desde el backend
      console.log(response.data.message); // Aquí recibes el mensaje "Logout successful."

      // Eliminar token y user_data de localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      console.log('Sesión cerrada correctamente');
    } else {
      console.error('Error al cerrar sesión en el backend');
    }
  } catch (error) {
    // Si hay un error, puedes acceder al mensaje de error si es devuelto por el backend
    if (error.response) {
      console.error('Error al cerrar sesión:', error.response.data.error); // Recibe el error "Token not found"
    } else {
      // Handle the error appropriately
      alert('Error al cerrar sesión: ' + error.message);
    }
  }
};

// Función para registrar un cliente
export const registerClient = async (clientData) => {
  try {
    const response = await api.post('register/', clientData);
    return response; // Devuelve la respuesta de la API
  } catch (error) {
    // Lanza el error para que pueda ser manejado en el componente
    throw error;
  }
};

export const getTiposBrazaletes = async () => {
  try {
    // GET a la ruta 'compra_brazaletes/tipos/'
    const response = await api.get('compra_brazaletes/tipos/');
    return response.data; // Retorna solo la data
  } catch (error) {
    console.error('Error obteniendo tipos de brazaletes:', error);
    throw error;
  }
};

export const createPurchaseReceipt = async (braceletTypeId) => {
  // POST al mismo endpoint, pero enviando "bracelet_type_id"
  const response = await api.post('compra_brazaletes/recibos/', {
    bracelet_type_id: braceletTypeId, // <--- clave
  });
  return response.data;
};

// Funciones para la lógica de pago con PayPal, usando AXIOS en vez de fetch

export const createPayPalOrder = async (amount, currency, description) => {
  try {
    const response = await api.post('compra_brazaletes/paypal/create-order/', {
      amount,
      currency,
      description,
    });
    // En Axios, la respuesta viene en response.data
    return response.data; // { id, status, links }
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
    return response.data; // { id, status, receipt_id, etc. }
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw new Error('Error capturing PayPal order');
  }
};

// Interceptar las solicitudes de envio al backend (adjuntar token si está presente)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`; // Cambiado a 'Token' en lugar de 'Bearer'
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Interceptar las respuestas recibidas del backend (manejar errores de autorización) COMENTADA PARA EVITAR REDIRECCIONES

/*
api.interceptors.response.use(
    (response) => {
        // Procesar la respuesta exitosa
        return response;
    },
    (error) => {
        // Manejo global de errores
        if (error.response && error.response.status === 401) {
            // Si la respuesta es un error 401 (No autorizado), redirige al login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
*/

export default api;
