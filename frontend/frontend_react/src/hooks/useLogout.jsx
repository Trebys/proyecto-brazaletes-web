// src/hooks/useLogout.jsx
const useLogout = () => {
  const handleLogout = () => {
    // Elimina los tokens del localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");

    //RECORDAR REDIRIGIR MANUALMENTE EN CADA LLAMADA DE ESTA FUNCIÓN YA QUE NO SE PUEDE USAR useNavigate AQUI
  };

  return {
    handleLogout,
  };
};

export default useLogout;
