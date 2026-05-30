import { useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmPasswordReset, requestPasswordReset } from '../api/api';

const formatApiError = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return 'No pudimos completar la solicitud. Intenta de nuevo.';
  }

  if (data.message || data.detail || data.error) {
    return data.message || data.detail || data.error;
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      return `${field}: ${text}`;
    })
    .join(' ');
};

export function PasswordResetPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('request');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await requestPasswordReset({
        username: username.trim(),
        email: email.trim(),
      });
      setMessage(data.message);
      setStep('confirm');
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      const data = await confirmPasswordReset({
        username: username.trim(),
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setMessage(data.message);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-fondoLogin shadow-[0_28px_70px_rgba(0,0,0,0.28)] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden min-h-[560px] overflow-hidden lg:block">
          <img
            src="/images/FotoCarrusel.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/95 via-teal-900/78 to-fondoLogin/45" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <Link
              to="/login"
              aria-label="Regresar al login"
              title="Regresar al login"
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
                Recuperacion
              </p>
              <h2 className="mt-3 max-w-md font-montserrat text-4xl font-extrabold leading-tight">
                Recupera el acceso a tu visita.
              </h2>
            </div>
          </div>
        </section>

        <section className="p-6 text-white sm:p-8 lg:p-10">
          <Link
            to="/login"
            aria-label="Regresar al login"
            title="Regresar al login"
            className="mb-6 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md bg-white/12 text-2xl font-extrabold leading-none text-teal-50 transition hover:bg-white/20 lg:hidden"
          >
            &larr;
          </Link>

          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200">
              Cuenta segura
            </p>
            <h1 className="mt-3 font-montserrat text-3xl font-extrabold">
              Cambiar contrasena
            </h1>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              Ingresa tu usuario y correo registrado. Deben coincidir con la misma cuenta.
            </p>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Usuario
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="form-input-dark"
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Email registrado
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="form-input-dark"
                  autoComplete="email"
                  required
                />
              </label>

              <button
                type="submit"
                className={`btn-primary mt-2 w-full bg-emerald-600 hover:bg-emerald-700 ${
                  loading ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar codigo'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Usuario
                </span>
                <input
                  type="text"
                  value={username}
                  readOnly
                  className="form-input-dark cursor-not-allowed bg-white/80"
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Email registrado
                </span>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="form-input-dark cursor-not-allowed bg-white/80"
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Codigo
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="form-input-dark text-center tracking-[0.35em]"
                  maxLength={6}
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Nueva contrasena
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="form-input-dark"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-bold text-teal-50">
                  Confirmar contrasena
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="form-input-dark"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <button
                type="submit"
                className={`btn-primary mt-2 w-full bg-emerald-600 hover:bg-emerald-700 ${
                  loading ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Actualizar contrasena'}
              </button>
            </form>
          )}

          {message && (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="mt-8 rounded-md border border-white/12 bg-white/8 p-4">
            <p className="text-sm font-bold text-white">Ya tienes acceso?</p>
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
