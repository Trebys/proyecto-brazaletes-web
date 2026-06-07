import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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

const NAV_LINKS = [
  { to: '/inicio', label: 'Inicio' },
  { to: '/comprar-brazaletes', label: 'Compra de Brazaletes' },
  { to: '/atracciones-comidas', label: 'Atracciones y Comidas' },
  { to: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 transition ${
    isActive
      ? 'bg-white text-fondoLogin shadow-sm'
      : 'text-white hover:bg-white/10'
  }`;

export function MasterPageCliente() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navigateAndClose = (path) => {
    closeMobileMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMobileMenu();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const handleSocialClick = (socialName) => {
    toast(`Redireccion ficticia a ${socialName}.`);
  };

  return (
    <div className="app-shell flex flex-col">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-fondoLogin/95 px-4 py-3 text-white shadow-[0_10px_30px_rgba(0,0,0,0.14)] backdrop-blur lg:px-8 relative">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-3"
              onClick={() => navigateAndClose('/inicio')}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white shadow-sm lg:h-12 lg:w-12">
                <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-8 lg:h-9" />
              </span>
              <span className="font-montserrat text-lg font-extrabold tracking-wide sm:text-xl">
                Fantasy Land
              </span>
            </button>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/30 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 lg:hidden"
              aria-label={isMobileMenuOpen ? 'Cerrar menu de navegacion' : 'Abrir menu de navegacion'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="client-mobile-menu"
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-6 rounded bg-current" />
                <span className="block h-0.5 w-6 rounded bg-current" />
                <span className="block h-0.5 w-6 rounded bg-current" />
              </span>
            </button>
          </div>

          <div className="hidden flex-wrap justify-center gap-x-1 gap-y-2 text-sm font-extrabold lg:flex lg:text-[0.95rem]">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center justify-center gap-2 lg:flex">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/mi-perfil')}
                  className="flex min-h-10 items-center rounded-md bg-white px-3 py-2 text-sm font-extrabold text-fondoLogin shadow-sm transition hover:bg-teal-50"
                >
                  <img src={perfilIcon} alt="Perfil" className="mr-2 h-5 w-5" />
                  <span>{user.username}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-10 rounded-md bg-red-700 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-red-800"
                >
                  Cerrar Sesion
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="min-h-10 rounded-md bg-white px-4 py-2 text-sm font-extrabold text-fondoLogin shadow-sm transition hover:bg-teal-50"
              >
                Iniciar Sesion
              </button>
            )}
          </div>

          <div
            id="client-mobile-menu"
            className={`${isMobileMenuOpen ? 'grid' : 'hidden'} absolute right-4 top-[calc(100%+0.5rem)] w-[min(82vw,20rem)] gap-1 rounded-lg border border-white/20 bg-fondoLogin/95 p-2 text-sm font-extrabold shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur lg:hidden`}
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `rounded-md px-4 py-3 text-left transition ${
                    isActive
                      ? 'bg-white text-fondoLogin shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 grid gap-2 border-t border-white/15 pt-3">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigateAndClose('/mi-perfil')}
                    className="flex min-h-11 items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-extrabold text-fondoLogin shadow-sm transition hover:bg-teal-50"
                  >
                    <img src={perfilIcon} alt="Perfil" className="mr-2 h-5 w-5" />
                    <span>{user.username}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="min-h-11 rounded-md bg-red-700 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-red-800"
                  >
                    Cerrar Sesion
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateAndClose('/login')}
                  className="min-h-11 rounded-md bg-white px-4 py-2 text-sm font-extrabold text-fondoLogin shadow-sm transition hover:bg-teal-50"
                >
                  Iniciar Sesion
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-fondoLogin px-4 py-8 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white">
              <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-8" />
            </span>
            <div className="flex flex-col">
              <span className="font-montserrat text-lg font-extrabold">Fantasy Land</span>
              <Link to="/sobre-nosotros" className="text-sm font-semibold text-teal-50 hover:underline">
                Sobre nosotros
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.16em] text-teal-50">Redes Sociales</h2>
            <div className="flex space-x-3">
              {footerSocialLinks.map((social) => (
                <button
                  key={social.name}
                  type="button"
                  onClick={() => handleSocialClick(social.name)}
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 transition hover:bg-white/20"
                >
                  <img src={social.icon} alt="" className="h-6" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <Link to="/terminos-condiciones" className="rounded-md border border-white/25 px-4 py-2 text-sm font-extrabold transition hover:bg-white/10">
              Terminos y condiciones
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
