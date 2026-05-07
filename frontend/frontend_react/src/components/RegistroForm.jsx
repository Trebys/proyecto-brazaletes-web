import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerClient } from '../api/api';

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
      setError('Error en el servidor o datos invalidos');
    }
  };

  return (
    <div className="app-shell flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-lg bg-fondoLogin shadow-[0_28px_70px_rgba(0,0,0,0.28)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden min-h-[650px] overflow-hidden lg:block">
          <img
            src="/images/FotoCarrusel3.jpg"
            alt="Visitantes en Fantasy Land"
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
                Nueva cuenta
              </p>
              <h2 className="mt-3 max-w-md font-montserrat text-4xl font-extrabold leading-tight">
                Prepara tu visita desde antes de llegar.
              </h2>
              <p className="mt-5 max-w-md text-sm font-semibold leading-6 text-teal-50">
                Crea tu perfil para comprar brazaletes, consultar recibos y
                usar tu saldo dentro de la experiencia.
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
              Comienza aqui
            </p>
            <h1 className="mt-3 font-montserrat text-3xl font-extrabold">
              Registro de usuario
            </h1>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              Completa tus datos para crear una cuenta de visitante.
            </p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-bold text-teal-50">
                    Nombre
                  </span>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="form-input-dark"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-bold text-teal-50">
                    Apellido
                  </span>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="form-input-dark"
                  />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Nombre de usuario
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input-dark"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-dark"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Contrasena
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-dark"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Saldo inicial de la cuenta
                </span>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  className="form-input-dark"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary mt-6 w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Crear cuenta
            </button>
            {error && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
          </form>

          <div className="mt-8 rounded-md border border-white/12 bg-white/8 p-4">
            <p className="text-sm font-bold text-white">Ya tienes cuenta?</p>
            <Link
              to="/login"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-extrabold text-fondoLogin transition hover:bg-teal-50"
            >
              Iniciar sesion
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
