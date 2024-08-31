import { useState } from "react";
import axios from "axios";

export function RegistroForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dinero, setDinero] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:8000/api/clientes/", {
        nombre: nombre,
        apellido: apellido,
        correo: email,
        contrasena: password,
        dinero_cuenta: dinero,
      });

      if (res.status === 201) {
        alert("Cliente registrado exitosamente");
        // Limpiar los campos después del registro
        setEmail("");
        setPassword("");
        setNombre("");
        setApellido("");
        setDinero("");
        setError("");
      } else {
        setError("Error en el registro");
      }
    } catch (error) {
      setError("Error en el servidor o datos inválidos");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-fondoPrincipal">
      <form
        onSubmit={handleRegister}
        className="bg-[#00474F] p-8 rounded-lg shadow-lg"
      >
        <h1 className="text-white text-center mb-6 text-2xl">
          Registro de usuario
        </h1>
        <div className="mb-4">
          <label className="text-white block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-4">
          <label className="text-white block mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-4">
          <label className="text-white block mb-2">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-4">
          <label className="text-white block mb-2">Apellido</label>
          <input
            type="text"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-6">
          <label className="text-white block mb-2">Dinero</label>
          <input
            type="number"
            value={dinero}
            onChange={(e) => setDinero(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-green-600 text-white rounded-lg"
        >
          Crear cuenta
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </form>
    </div>
  );
}
