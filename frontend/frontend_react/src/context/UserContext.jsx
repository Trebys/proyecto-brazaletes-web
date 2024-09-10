import React, { createContext, useState, useEffect } from "react";
import { setupInactivityTimeout } from "../hooks/sessionTimeout"; // Asegúrate de ajustar el path si es necesario
import useLogout from "../hooks/useLogout"; // Asegúrate de ajustar el path si es necesario

export const UserContext = createContext();

export function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const token = localStorage.getItem("access_token");
  const { handleLogout } = useLogout(); // Usamos el hook de logout para manejar el cierre de sesión

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/user-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else if (response.status === 401) {
          handleLogout(); // Usar handleLogout en lugar de logout
        } else {
          console.error("Failed to fetch user data:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const refreshToken = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/refresh-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("access_token", data.Token);
          setUserData(data.User);
        } else {
          handleLogout(); // Usar handleLogout en lugar de logout
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
        handleLogout(); // Usar handleLogout si falla el refresh
      }
    };

    if (token) {
      fetchUserData();

      // Configurar el seguimiento de inactividad
      const { trackUserActivity, cleanup } = setupInactivityTimeout(
        handleLogout, // Usar handleLogout en la inactividad
        600000 // 10 minutos
      );
      trackUserActivity();

      // Refrescar el token cada 10 minutos
      const refreshInterval = setInterval(refreshToken, 600000);

      return () => {
        clearInterval(refreshInterval);
        cleanup(); // Limpiar eventos de inactividad cuando se desmonta
      };
    }
  }, [token, handleLogout]);

  return (
    <UserContext.Provider value={{ userData }}>{children}</UserContext.Provider>
  );
}
