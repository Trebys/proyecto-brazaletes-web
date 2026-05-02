import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import perfilIcon from '/images/perfil.svg';
import { useAuth } from '../auth/AuthContext.jsx';

const footerSocialLinks = [
  {
    name: 'Facebook',
    icon: '/images/facebook.svg',
  },
  {
    name: 'Instagram',
    icon: '/images/instagram.svg',
  },
  {
    name: 'TikTok',
    icon: '/images/tiktok.svg',
  },
];

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

  const handleSocialClick = (socialName) => {
    toast(`Redireccion ficticia a ${socialName}.`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-fondoPrincipal">
      <nav className="sticky top-0 z-50 flex flex-col gap-4 bg-fondoLogin px-6 py-4 text-white lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <button
          type="button"
          className="flex cursor-pointer items-center space-x-4"
          onClick={() => navigate('/inicio')}
        >
          <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-10" />
          <span className="text-xl font-bold">Fantasy Land</span>
        </button>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold lg:text-base">
          <Link to="/inicio" className="cursor-pointer">
            Inicio
          </Link>
          <Link to="/comprar-brazaletes" className="cursor-pointer">
            Compra de Brazaletes
          </Link>
          <Link to="/atracciones-comidas" className="cursor-pointer">
            Atracciones y Comidas
          </Link>
          <Link to="/sobre-nosotros" className="cursor-pointer">
            Sobre Nosotros
          </Link>
          <Link to="/contacto" className="cursor-pointer">
            Contacto
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2">
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
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
          <div className="flex items-center space-x-2">
            <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-8" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Fantasy Land</span>
              <Link to="/sobre-nosotros" className="text-sm hover:underline">
                Sobre nosotros
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="mb-2 text-lg font-bold">Redes Sociales</h2>
            <div className="flex space-x-3">
              {footerSocialLinks.map((social) => (
                <button
                  key={social.name}
                  type="button"
                  onClick={() => handleSocialClick(social.name)}
                  aria-label={social.name}
                  className="transition hover:opacity-80"
                >
                  <img src={social.icon} alt="" className="h-6" />
                </button>
              ))}
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
