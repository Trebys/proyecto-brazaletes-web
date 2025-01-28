import { useEffect, useRef } from 'react';
import api from '../api/api.js';

export function AutoLogout({ children }) {
  // Utilizamos useRef para mantener una referencia al temporizador
  const logoutTimerRef = useRef(null);

  // Función para cerrar la sesión
  const handleLogout = async () => {
    try {
      await api.post('/logout/');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al cerrar sesión automáticamente', error);
    }
  };

  // Función para verificar si el token puede ser refrescado
  const handleTokenRefresh = async () => {
    try {
      await api.post('/refresh-token/');
      resetLogoutTimer();
    } catch (error) {
      console.error('Token expired or cannot be refreshed', error);
      handleLogout();
    }
  };

  // Función para reiniciar el temporizador
  const resetLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    logoutTimerRef.current = setTimeout(
      () => {
        handleTokenRefresh();
      },
      5 * 60 * 1000
    ); // 5 minuto para pruebas pero debo correguirlo para mostrar un mensaje de inactividad y demas procesos referentes a la inactividad
  };

  // Efecto para registrar los eventos de usuario
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (accessToken && userData) {
      // Registrar eventos de usuario
      const events = ['mousemove', 'keydown', 'click', 'scroll'];
      events.forEach((event) =>
        window.addEventListener(event, resetLogoutTimer)
      );

      // Iniciar el temporizador de inactividad
      resetLogoutTimer();

      // Limpiar eventos y temporizadores cuando se desmonte el componente
      return () => {
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        events.forEach((event) =>
          window.removeEventListener(event, resetLogoutTimer)
        );
      };
    }
  }, []); // Dejar el array de dependencias vacío para que solo se ejecute una vez al montar el componente

  return <>{children}</>;
}
