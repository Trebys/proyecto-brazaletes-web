import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api/api'; // <-- importamos nuestra función
import api from '../api/api.js';

export function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/inicio';
  const rememberedTipoId = location.state?.tipoId || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamamos a nuestra función centralizada
      const res = await loginUser(identifier, password);

      if (res.status === 200) {
        const { Token, User } = res.data;
        localStorage.setItem('access_token', Token);
        localStorage.setItem('user_data', JSON.stringify(User));
        alert(`Bienvenido, ${User.username}`);
        setError('');

        // Redirigimos a "from" o a /inicio
        navigate(from, {
          state: rememberedTipoId ? { tipoId: rememberedTipoId } : {},
        });
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('access_token');
        setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
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
          ← Regresar
        </a>
        <h1 className="text-center text-white text-2xl mb-6 font-bold">
          Iniciar sesión
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
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 text-teal-900 rounded bg-teal-700 placeholder-teal-200 focus:outline-none"
          />
          <a
            href="#"
            className="text-white inline-block mt-2 hover:underline font-bold text-lg"
          >
            ¿Olvidaste la contraseña?
          </a>
        </div>
        <button
          type="submit"
          className={`w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Iniciar sesión'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        <div className="flex justify-between items-center mt-6">
          <span className="text-white font-bold text-lg">
            ¿No tienes cuenta?
          </span>
          <a
            onClick={() => navigate('/registro')}
            className="text-green-400 hover:underline font-bold text-lg cursor-pointer"
          >
            Regístrate
          </a>
        </div>
      </form>
    </div>
  );
}
