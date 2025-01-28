import { useState } from 'react';
import { registerClient } from '../api/api'; // Asegúrate de ajustar la ruta si es necesario
export function RegistroForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    const clientData = {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      account_balance: accountBalance,
    };

    try {
      const res = await registerClient(clientData);

      if (res.status === 201) {
        alert('Cliente registrado exitosamente');
        // Limpiar los campos después del registro
        setUsername('');
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setAccountBalance('');
        setError('');
      } else {
        setError('Error en el registro');
      }
    } catch (error) {
      setError('Error en el servidor o datos inválidos');
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
          <label className="text-white block mb-2">Nombre de usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
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
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-4">
          <label className="text-white block mb-2">Apellido</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
          />
        </div>
        <div className="mb-6">
          <label className="text-white block mb-2">Saldo de la cuenta</label>
          <input
            type="number"
            value={accountBalance}
            onChange={(e) => setAccountBalance(e.target.value)}
            className="w-full p-2 rounded bg-[#387E83] text-white"
            step="0.01" // Permite valores decimales con dos dígitos después del punto
            min="0" // Valor mínimo permitido
            placeholder="0.00"
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
