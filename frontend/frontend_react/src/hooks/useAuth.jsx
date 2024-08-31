// src/hooks/useAuth.js
import { useNavigate } from "react-router-dom";

const useAuth = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Elimina los tokens del localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");

    // Redirige al usuario al login
    navigate("/login");
  };

  return {
    handleLogout,
  };
};

export default useAuth;
