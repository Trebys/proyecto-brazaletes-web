import React from 'react';

const termsSections = [
  {
    title: '1. Acceso al parque',
    content:
      'El ingreso a Fantasy Land esta sujeto a disponibilidad, horarios publicados, medidas de seguridad y validacion del brazalete o comprobante correspondiente.',
  },
  {
    title: '2. Uso de brazaletes',
    content:
      'Los brazaletes son personales durante la visita y pueden incluir usos de atracciones, saldo para alimentos u otros beneficios segun el tipo adquirido. El visitante debe conservarlo en buen estado.',
  },
  {
    title: '3. Atracciones y restricciones',
    content:
      'Algunas atracciones pueden tener restricciones de estatura, edad, salud, clima, mantenimiento o capacidad. El personal del parque puede negar el acceso cuando exista riesgo para el visitante o terceros.',
  },
  {
    title: '4. Alimentos y saldo',
    content:
      'El saldo asociado al brazalete puede usarse en alimentos participantes mientras exista disponibilidad. Los precios y productos pueden cambiar sin previo aviso por razones operativas.',
  },
  {
    title: '5. Pagos y comprobantes',
    content:
      'Las compras digitales generan un comprobante asociado al usuario y al brazalete emitido. El visitante debe revisar los datos antes de confirmar la compra.',
  },
  {
    title: '6. Cambios, cancelaciones y reembolsos',
    content:
      'Las solicitudes de cambio o reembolso se revisan caso por caso conforme a la fecha de compra, el uso del brazalete, el metodo de pago y las politicas operativas vigentes.',
  },
  {
    title: '7. Seguridad y conducta',
    content:
      'Los visitantes deben seguir indicaciones del personal, respetar filas, cuidar instalaciones y evitar conductas que pongan en riesgo a otras personas. Fantasy Land puede retirar a quien incumpla estas reglas.',
  },
  {
    title: '8. Datos personales',
    content:
      'Los datos proporcionados en registro, compra, perfil o contacto se usan para operar la visita, atender solicitudes y mejorar la experiencia del visitante conforme a practicas razonables de privacidad.',
  },
];

export function TerminosCondicionesPage() {
  return (
    <div className="app-shell">
      <section className="bg-teal-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">
            Informacion legal
          </p>
          <h1 className="mt-4 font-montserrat text-4xl font-extrabold md:text-5xl">
            Terminos y condiciones de Fantasy Land
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-teal-50">
            Estos terminos regulan el uso del sitio, la compra de brazaletes y
            la experiencia general dentro del parque. Al comprar o utilizar un
            brazalete, el visitante acepta estas condiciones.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="rounded-lg bg-white p-6 text-teal-950 shadow-2xl md:p-8">
          <div className="grid gap-5">
            {termsSections.map((section) => (
              <article
                key={section.title}
                className="rounded-md border border-gray-200 p-4"
              >
                <h2 className="font-montserrat text-lg font-extrabold">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {section.content}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-md bg-teal-50 p-4 text-sm leading-6 text-teal-900">
            Ultima actualizacion: mayo de 2026. Para dudas sobre estos terminos,
            contacta a Fantasy Land desde la pagina de Contactenos.
          </div>
        </div>
      </section>
    </div>
  );
}
