import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import perfilIcon from '/images/perfil.svg';
import { Logout } from '../api/api.js'; // Importa la función Logout

export function MasterPageCliente({ children }) {
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem('user_data')) || null
  );
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await Logout(); // Llamar a la función de Logout centralizada

      // Limpiar el estado local
      setUserData(null);

      // Redirigir al login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-fondoPrincipal">
      <nav className="bg-fondoLogin text-white py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div
          className="flex items-center space-x-4 cursor-pointer"
          onClick={() => navigate('/inicio')}
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
            onClick={() => navigate('/inicio')}
            className="cursor-pointer"
          >
            Inicio
          </a>
          <a
            href="/comprar-brazaletes"
            onClick={() => navigate('/comprar-brazaletes')}
            className="cursor-pointer"
          >
            Compra de Brazaletes
          </a>
          <a
            href="/atracciones-comidas"
            onClick={() => navigate('/atracciones-comidas')}
            className="cursor-pointer"
          >
            Atracciones y Comidas
          </a>
          <a
            href="/contacto"
            onClick={() => navigate('/contacto')}
            className="cursor-pointer"
          >
            Contacto
          </a>
        </div>
        <div className="flex items-center space-x-2">
          {userData ? (
            <>
              <button
                onClick={() => navigate('/mi-perfil')}
                className="bg-white text-fondoLogin px-3 py-1 rounded-full flex items-center"
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
              onClick={() => navigate('/login')}
              className="bg-white text-fondoLogin px-3 py-1 rounded-full"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-fondoLogin text-white py-4">
        <div className="container mx-auto flex justify-between items-center">
          {/* Columna 1: Logo y 'Sobre nosotros' */}
          <div className="flex items-center space-x-2">
            <img
              src="/images/logo.svg"
              alt="Fantasy Land Logo"
              className="h-8" // Tamaño más pequeño
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Fantasy Land</span>
              <p className="text-sm">Sobre nosotros</p>
            </div>
          </div>

          {/* Columna 2: Redes Sociales */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold mb-2">Redes Sociales</h2>
            <div className="flex space-x-3">
              <a href="#">
                <img
                  src="/images/facebook.svg"
                  alt="Facebook Logo"
                  className="h-6" // Tamaño reducido de íconos
                />
              </a>
              <a href="#">
                <img
                  src="/images/instagram.svg"
                  alt="Instagram Logo"
                  className="h-6"
                />
              </a>
              <a href="#">
                <img
                  src="/images/tiktok.svg"
                  alt="TikTok Logo"
                  className="h-6"
                />
              </a>
            </div>
          </div>

          {/* Columna 3: Términos y condiciones */}
          <div className="flex items-center">
            <a href="/terminos-condiciones" className="text-lg font-bold">
              Términos y condiciones
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
