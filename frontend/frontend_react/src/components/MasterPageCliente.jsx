import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import perfilIcon from '/images/perfil.svg';
import { useAuth } from '../auth/AuthContext.jsx';

export function MasterPageCliente() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-fondoPrincipal">
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-fondoLogin px-8 py-4 text-white">
        <button
          type="button"
          className="flex cursor-pointer items-center space-x-4"
          onClick={() => navigate('/inicio')}
        >
          <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-10" />
          <span className="text-xl font-bold">Fantasy Land</span>
        </button>

        <div className="flex space-x-6">
          <Link to="/inicio" className="cursor-pointer">
            Inicio
          </Link>
          <Link to="/comprar-brazaletes" className="cursor-pointer">
            Compra de Brazaletes
          </Link>
          <Link to="/atracciones-comidas" className="cursor-pointer">
            Atracciones y Comidas
          </Link>
          <Link to="/contacto" className="cursor-pointer">
            Contacto
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/mi-perfil')}
                className="flex items-center rounded-full bg-white px-3 py-1 text-fondoLogin"
              >
                <img src={perfilIcon} alt="Perfil" className="mr-2 h-5 w-5" />
                <span>{user.username}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-red-600 px-3 py-1 text-white"
              >
                Cerrar Sesion
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="rounded-full bg-white px-3 py-1 text-fondoLogin"
            >
              Iniciar Sesion
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-fondoLogin py-4 text-white">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-8" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Fantasy Land</span>
              <p className="text-sm">Sobre nosotros</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="mb-2 text-lg font-bold">Redes Sociales</h2>
            <div className="flex space-x-3">
              <a href="#" aria-label="Facebook">
                <img src="/images/facebook.svg" alt="Facebook Logo" className="h-6" />
              </a>
              <a href="#" aria-label="Instagram">
                <img
                  src="/images/instagram.svg"
                  alt="Instagram Logo"
                  className="h-6"
                />
              </a>
              <a href="#" aria-label="TikTok">
                <img src="/images/tiktok.svg" alt="TikTok Logo" className="h-6" />
              </a>
            </div>
          </div>

          <div className="flex items-center">
            <Link to="/terminos-condiciones" className="text-lg font-bold">
              Terminos y condiciones
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
