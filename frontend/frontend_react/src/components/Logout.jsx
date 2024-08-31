import React from "react";
import useAuth from "../hooks/useAuth"; // Ajusta la ruta según corresponda

const Logout = () => {
  const { handleLogout } = useAuth();

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
