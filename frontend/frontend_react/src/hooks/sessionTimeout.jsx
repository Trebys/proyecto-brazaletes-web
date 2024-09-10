// sessionTimeout.jsx
import useLogout from "../hooks/useLogout"; // Importar la función de logout

export const setupInactivityTimeout = (timeoutDuration = 600000) => {
  const { handleLogout } = useLogout(); // Obtener la lógica de deslogueo desde el hook useLogout
  let inactivityTimeout;

  const resetInactivityTimeout = () => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }

    // Configura el temporizador de inactividad para el tiempo especificado
    inactivityTimeout = setTimeout(() => {
      handleLogout(); // Usar la función de deslogueo cuando se alcance el tiempo de inactividad
    }, timeoutDuration);
  };

  const trackUserActivity = () => {
    window.addEventListener("mousemove", resetInactivityTimeout);
    window.addEventListener("click", resetInactivityTimeout);
    window.addEventListener("keydown", resetInactivityTimeout);
    window.addEventListener("scroll", resetInactivityTimeout);

    resetInactivityTimeout(); // Inicializar el temporizador al cargar la página
  };

  const cleanup = () => {
    clearTimeout(inactivityTimeout);
    window.removeEventListener("mousemove", resetInactivityTimeout);
    window.removeEventListener("click", resetInactivityTimeout);
    window.removeEventListener("keydown", resetInactivityTimeout);
    window.removeEventListener("scroll", resetInactivityTimeout);
  };

  return {
    trackUserActivity,
    cleanup,
  };
};
