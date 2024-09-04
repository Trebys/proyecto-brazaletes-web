import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function LoginForm() {
  const [identifier, setIdentifier] = useState(""); // Cambiar 'email' a 'identifier'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Para manejar el estado de carga

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Activar el estado de carga

    try {
      const res = await axios.post("http://localhost:8000/api/login/", {
        identifier, // Usar 'identifier' en lugar de 'correo'
        password, // Usar 'password' en lugar de 'contrasena'
      });

      if (res.status === 200) {
        const { Token, User } = res.data;

        // Guardar el token en el localStorage
        localStorage.setItem("access_token", Token);

        // Guardar los datos del usuario en localStorage o en el estado si es necesario
        // Puedes personalizar esto según la estructura de tu usuario
        localStorage.setItem("user_data", JSON.stringify(User));

        // Navegar según el rol o tipo de usuario, si tienes lógica de roles
        alert(`Bienvenido, ${User.username}`);
        navigate("/inicio");
        setError("");
      } else {
        setError("Credenciales incorrectas");
      }
    } catch (error) {
      setError("Error en el servidor o credenciales incorrectas");
    } finally {
      setLoading(false); // Desactivar el estado de carga
    }
  };

  return (
    <div className="min-h-screen bg-fondoPrincipal flex justify-center items-center">
      <form
        className="w-full max-w-sm bg-fondoLogin p-8 rounded-lg shadow-md"
        onSubmit={handleLogin}
      >
        <a
          href=""
          onClick={() => {
            navigate("/inicio");
          }}
          className="text-white text-sm mb-4 inline-block"
        >
          ← Regresar
        </a>
        <h1 className="text-center text-white text-2xl mb-6 font-bold">
          Iniciar sesión
        </h1>
        <div className="mb-4">
          <input
            type="text" // Cambiado a 'text' ya que puede ser username o email
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
            className="text-white  inline-block mt-2 hover:underline font-bold text-lg"
          >
            ¿Olvidaste la contraseña?
          </a>
        </div>
        <button
          type="submit"
          className={`w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading} // Desactivar el botón si está cargando
        >
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        <div className="flex justify-between items-center mt-6">
          <span className="text-white font-bold text-lg">
            ¿No tienes cuenta?
          </span>
          <a
            onClick={() => {
              navigate("/registro");
            }}
            className="text-green-400 hover:underline font-bold text-lg"
          >
            Regístrate
          </a>
        </div>
      </form>
    </div>
  );
}
