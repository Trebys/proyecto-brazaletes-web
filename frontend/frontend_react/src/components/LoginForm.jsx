import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  consumeSessionMessage,
  isAdminUser,
  loginUser,
  persistUserData,
} from '../api/api';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => consumeSessionMessage() || '');
  const [loading, setLoading] = useState(false);

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
        const { Token, User } = res.data;
        localStorage.setItem('access_token', Token);
        persistUserData(User);
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
        localStorage.removeItem('access_token');
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
    <div className="min-h-screen bg-fondoPrincipal flex justify-center items-center">
      <form
        className="w-full max-w-sm bg-fondoLogin p-8 rounded-lg shadow-md"
        onSubmit={handleLogin}
      >
        <a
          onClick={() => navigate('/inicio')}
          className="text-white text-sm mb-4 inline-block cursor-pointer"
        >
          Regresar
        </a>
        <h1 className="text-center text-white text-2xl mb-6 font-bold">
          Iniciar sesion
        </h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Email o Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full p-2 text-teal-900 rounded bg-teal-700 placeholder-teal-200 focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 text-teal-900 rounded bg-teal-700 placeholder-teal-200 focus:outline-none"
          />
          <a
            href="#"
            className="text-white inline-block mt-2 hover:underline font-bold text-lg"
          >
            Olvidaste la contrasena?
          </a>
        </div>
        <button
          type="submit"
          className={`w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Iniciar sesion'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="flex justify-between items-center mt-6">
          <span className="text-white font-bold text-lg">No tienes cuenta?</span>
          <a
            onClick={() => navigate('/registro')}
            className="text-green-400 hover:underline font-bold text-lg cursor-pointer"
          >
            Registrate
          </a>
        </div>
      </form>
    </div>
  );
}
