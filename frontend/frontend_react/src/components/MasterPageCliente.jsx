import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import perfilIcon from "/images/perfil.svg";

export function MasterPageCliente({ children }) {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  // useEffect para buscar el token en el local storage cuando se monte el componente
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    console.log("Inicio de pagina y Token de acceso:", accessToken);
    if (accessToken) {
      setToken(accessToken);
      fetchUserData(accessToken);
    }
  }, []);

  const handleLogout = () => {
    // Elimina el token del localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    // Redirige al usuario a la página de inicio de sesión o a la página principal
    navigate("/login");
  };

  // Función para obtener los datos del usuario desde la API
  const fetchUserData = async (accessToken) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/perfil-cliente/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        console.log("Datos del usuario:", data);
      } else {
        console.error(
          "Error al obtener los datos del usuario:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error de red al obtener los datos del usuario:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-fondoPrincipal">
      {/* Navbar */}
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
            className="cursor-pointer"
            onClick={() => navigate("/inicio")}
          >
            Inicio
          </a>
          <a
            href="/comprar-brazaletes"
            className="cursor-pointer"
            onClick={() => navigate("/comprar-brazaletes")}
          >
            Compra de Brazaletes
          </a>
          <a
            href="/atracciones-comidas"
            className="cursor-pointer"
            onClick={() => navigate("/atracciones-comidas")}
          >
            Atracciones y Comidas
          </a>
          <a
            href="/contacto"
            className="cursor-pointer"
            onClick={() => navigate("/contacto")}
          >
            Contacto
          </a>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/mi-perfil")}
            className="bg-white text-teal-700 px-3 py-1 rounded-full flex items-center"
          >
            <img src={perfilIcon} alt="Perfil" className="w-5 h-5 mr-2" />
          </button>

          {/* Muestra el nombre de usuario o el token si está presente */}
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-teal-700 px-3 py-1 rounded-full"
          >
            {userData ? userData.nombre : "Iniciar Sesión"}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded-full"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      {/* Footer */}
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
