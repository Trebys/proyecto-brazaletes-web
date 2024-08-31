import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Función para verificar si el token de acceso está presente en el localStorage
const useAuth = () => {
  const accessToken = localStorage.getItem("access_token");
  return accessToken ? true : false;
};

const PrivateRoutes = () => {
  const isAuth = useAuth();

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;
