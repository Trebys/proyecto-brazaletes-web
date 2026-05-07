import React, { useState } from 'react';
import toast from 'react-hot-toast';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  subject: 'informacion',
  visitDate: '',
  message: '',
  acceptsContact: false,
};

const socialLinks = [
  {
    name: 'Facebook',
    handle: '@FantasyLandMx',
    icon: '/images/facebook.svg',
  },
  {
    name: 'Instagram',
    handle: '@fantasyland.parque',
    icon: '/images/instagram.svg',
  },
  {
    name: 'TikTok',
    handle: '@fantasyland_oficial',
    icon: '/images/tiktok.svg',
  },
];

export function ContactoPage() {
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.success('Gracias. Recibimos tu mensaje y te contactaremos pronto.');
    setFormData(initialForm);
  };

  const handleSocialClick = (socialName) => {
    toast(`Redireccion ficticia a ${socialName}.`);
  };

  return (
    <div className="app-shell">
      <section className="relative overflow-hidden">
        <img
          src="/images/FotoCarrusel.jpg"
          alt="Entrada principal de Fantasy Land"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/95 via-teal-900/84 to-teal-700/52" />

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">
            Contactenos
          </p>
          <h1 className="mt-4 max-w-3xl font-montserrat text-4xl font-extrabold text-white md:text-6xl">
            Estamos listos para ayudarte a planear tu visita.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-teal-50">
            Escribenos para resolver dudas sobre brazaletes, horarios,
            atracciones, alimentos, eventos especiales o recomendaciones antes
            de llegar al parque.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-6 text-teal-950 shadow-2xl"
        >
          <h2 className="font-montserrat text-2xl font-extrabold">
            Envia tu mensaje
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Los campos marcados como obligatorios nos ayudan a darte una
            respuesta clara y oportuna.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Nombre completo</span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                minLength={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold">Correo electronico</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold">Telefono</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold">Fecha de visita</span>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold">Motivo</span>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                <option value="informacion">Informacion general</option>
                <option value="brazaletes">Compra o uso de brazaletes</option>
                <option value="eventos">Eventos y grupos</option>
                <option value="alimentos">Alimentos y atracciones</option>
                <option value="soporte">Soporte de cuenta</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-bold">Mensaje</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={1000}
                className="min-h-36 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>

          <label className="mt-5 flex gap-3 text-sm leading-6 text-gray-700">
            <input
              type="checkbox"
              name="acceptsContact"
              checked={formData.acceptsContact}
              onChange={handleChange}
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-700 focus:ring-teal-600"
            />
            Acepto que Fantasy Land use estos datos para responder mi solicitud.
          </label>

          <button
            type="submit"
            className="mt-6 rounded-md bg-fondoLogin px-5 py-3 text-sm font-extrabold text-white transition hover:bg-teal-900"
          >
            Enviar mensaje
          </button>
        </form>

        <aside className="grid gap-5">
          <div className="rounded-lg bg-fondoLogin p-6 text-white shadow-xl">
            <h2 className="font-montserrat text-2xl font-extrabold">
              Informacion de atencion
            </h2>
            <div className="mt-5 grid gap-4 text-sm text-teal-50">
              <p>
                <span className="block font-bold text-white">Horario</span>
                Lunes a domingo, 10:00 a 20:00 hrs.
              </p>
              <p>
                <span className="block font-bold text-white">Ubicacion</span>
                Avenida Fantasia 100, Zona Familiar, Ciudad Aventura.
              </p>
              <p>
                <span className="block font-bold text-white">Telefono</span>
                +52 55 0101 2026
              </p>
              <p>
                <span className="block font-bold text-white">Correo</span>
                atencion@fantasyland.example
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 text-teal-950 shadow-xl">
            <h2 className="font-montserrat text-2xl font-extrabold">
              Redes sociales
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Estos accesos son ficticios y muestran un aviso sin salir del
              sitio.
            </p>
            <div className="mt-5 grid gap-3">
              {socialLinks.map((social) => (
                <button
                  key={social.name}
                  type="button"
                  onClick={() => handleSocialClick(social.name)}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 text-left transition hover:bg-teal-50"
                >
                  <span className="flex items-center gap-3">
                    <img src={social.icon} alt="" className="h-6 w-6" />
                    <span>
                      <span className="block text-sm font-extrabold">
                        {social.name}
                      </span>
                      <span className="text-xs text-gray-600">{social.handle}</span>
                    </span>
                  </span>
                  <span className="text-xs font-bold uppercase text-teal-700">
                    Ver
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
