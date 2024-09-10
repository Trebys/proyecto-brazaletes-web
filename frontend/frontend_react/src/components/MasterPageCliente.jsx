import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import perfilIcon from "/images/perfil.svg";
import useLogout from "../hooks/useLogout";

export function MasterPageCliente({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchUserData(token);
    }
  }, [token]); // Elimina navigate de las dependencias

  const handleLogout = () => {
    setToken(null);
    setUserData(null);
    useLogout();
    navigate("/login"); // Usar el hook de logout para manejar el cierre de sesión
  };

  const fetchUserData = async (accessToken) => {
    try {
      const response = await fetch("http://localhost:8000/api/user-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error("Error de red al obtener los datos del usuario:", error);
      handleLogout();
    }
  };

  //Revisar ya que no se usa
  const handleProtectedRoute = (route) => {
    if (token) {
      navigate(route);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-fondoPrincipal">
      <nav className="bg-teal-700 text-white py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div
          className="flex items-center space-x-4 cursor-pointer"
          onClick={() => navigate("/inicio")}
        >
          <img
            src="/images/logo.svg"
            alt="Fantasy Land Logo"
            className="h-10"
          />
          <span className="text-xl font-bold">Fantasy Land</span>
        </div>
        <div className="flex space-x-6">
          <a
            href="/inicio"
            onClick={() => navigate("/inicio")}
            className="cursor-pointer"
          >
            Inicio
          </a>
          <a
            href="/comprar-brazaletes"
            onClick={() => navigate("/comprar-brazaletes")}
            className="cursor-pointer"
          >
            Compra de Brazaletes
          </a>
          <a
            href="/atracciones-comidas"
            onClick={() => navigate("/atracciones-comidas")}
            className="cursor-pointer"
          >
            Atracciones y Comidas
          </a>
          <a
            href="/contacto"
            onClick={() => navigate("/contacto")}
            className="cursor-pointer"
          >
            Contacto
          </a>
        </div>
        <div className="flex items-center space-x-2">
          {userData ? (
            <>
              <button
                onClick={() => navigate("/mi-perfil")}
                className="bg-white text-teal-700 px-3 py-1 rounded-full flex items-center"
              >
                <img src={perfilIcon} alt="Perfil" className="w-5 h-5 mr-2" />
                <span>{userData.username}</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-full"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-teal-700 px-3 py-1 rounded-full"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-teal-700 text-white py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <img
              src="/images/logo.svg"
              alt="Fantasy Land Logo"
              className="h-10"
            />
            <span className="text-lg font-bold">Fantasy Land</span>
            <p>Sobre nosotros</p>
          </div>
          <div className="flex space-x-4">
            <a href="#">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#">
              <i className="fab fa-tiktok"></i>
            </a>
          </div>
          <div>
            <a href="/terminos-condiciones">Términos y condiciones</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
