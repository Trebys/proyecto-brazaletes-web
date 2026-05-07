import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  clearStoredAuth,
  consumeSessionMessage,
  isAdminUser,
  loginUser,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => consumeSessionMessage() || '');
  const [loading, setLoading] = useState(false);
  const { storeAuthSession } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/inicio';
  const rememberedTipoId = location.state?.tipoId || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginUser(identifier, password);

      if (res.status === 200) {
        const { Token, User, session } = res.data;
        storeAuthSession({ token: Token, user: User, session });
        alert(res.data.message || `Bienvenido, ${User.username}`);
        setError('');

        const targetPath = isAdminUser(User) && from === '/inicio'
          ? '/administrador'
          : from;

        navigate(targetPath, {
          state: rememberedTipoId ? { tipoId: rememberedTipoId } : {},
        });
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        clearStoredAuth();
        setError('Tu sesion ha expirado. Por favor, inicia sesion de nuevo.');
        navigate('/login');
      } else {
        setError('Error en el servidor o credenciales incorrectas');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-fondoLogin shadow-[0_28px_70px_rgba(0,0,0,0.28)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden min-h-[560px] overflow-hidden lg:block">
          <img
            src="/images/FotoCarrusel2.jpeg"
            alt="Atracciones de Fantasy Land"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/95 via-teal-900/78 to-fondoLogin/45" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <Link
              to="/inicio"
              aria-label="Regresar al inicio"
              title="Regresar al inicio"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/12 text-2xl font-extrabold leading-none transition hover:bg-white/20"
            >
              &larr;
            </Link>

            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-md bg-white">
                  <img src="/images/logo.svg" alt="" className="h-10" />
                </span>
                <span className="font-montserrat text-2xl font-extrabold">
                  Fantasy Land
                </span>
              </div>
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-teal-100">
                Acceso de visitantes
              </p>
              <h2 className="mt-3 max-w-md font-montserrat text-4xl font-extrabold leading-tight">
                Vuelve a tu experiencia sin perder el ritmo.
              </h2>
              <p className="mt-5 max-w-md text-sm font-semibold leading-6 text-teal-50">
                Consulta tus brazaletes, revisa compras y continua explorando
                atracciones y alimentos desde tu cuenta.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 text-white sm:p-8 lg:p-10">
          <Link
            to="/inicio"
            aria-label="Regresar al inicio"
            title="Regresar al inicio"
            className="mb-6 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-white/12 text-2xl font-extrabold leading-none text-teal-50 transition hover:bg-white/20 lg:hidden"
          >
            &larr;
          </Link>

          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200">
              Bienvenido
            </p>
            <h1 className="mt-3 font-montserrat text-3xl font-extrabold">
              Iniciar sesion
            </h1>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              Entra con tu usuario o correo para seguir gestionando tu visita.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Email o usuario
                </span>
                <input
                  type="text"
                  placeholder="tuusuario o correo@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-input-dark"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Contrasena
                </span>
                <input
                  type="password"
                  placeholder="Tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-dark"
                />
              </label>
            </div>

            <div className="mt-3 flex justify-end">
              <span className="text-xs font-semibold text-white/55">
                Recuperacion de contrasena pendiente
              </span>
            </div>

            <button
              type="submit"
              className={`btn-primary mt-6 w-full bg-emerald-600 hover:bg-emerald-700 ${
                loading ? 'cursor-not-allowed opacity-50' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Iniciar sesion'}
            </button>
            {error && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </form>

          <div className="mt-8 rounded-md border border-white/12 bg-white/8 p-4">
            <p className="text-sm font-bold text-white">No tienes cuenta?</p>
            <Link
              to="/registro"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-extrabold text-fondoLogin transition hover:bg-teal-50"
            >
              Crear cuenta
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
