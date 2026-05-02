import React from 'react';
import { Link } from 'react-router-dom';

const experienceHighlights = [
  {
    title: 'Concepto inmersivo',
    description:
      'Fantasy Land combina atracciones, alimentos y ambientacion tematica para construir una visita completa, no solo una fila de juegos aislados.',
  },
  {
    title: 'Experiencia guiada por brazalete',
    description:
      'El brazalete funciona como pase de acceso y saldo operativo, permitiendo que el visitante concentre su energia en disfrutar el recorrido.',
  },
  {
    title: 'Operacion integrada',
    description:
      'La compra, el catalogo, los consumos y la administracion trabajan juntos para mantener una visita organizada y confiable.',
  },
];

const visitValues = [
  'Diversion para familias, grupos de amigos y visitantes de distintas edades.',
  'Compra anticipada de brazaletes para reducir friccion al llegar al parque.',
  'Atracciones y comidas conectadas al estado real del brazalete del cliente.',
  'Atencion operativa para mantener catalogos, ventas y movimientos auditables.',
];

export function SobreNosotrosPage() {
  return (
    <div className="bg-fondoPrincipal text-white">
      <section className="relative overflow-hidden">
        <img
          src="/images/FotoCarrusel2.jpeg"
          alt="Atraccion principal de Fantasy Land"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/90 via-teal-900/75 to-teal-700/35" />

        <div className="relative mx-auto grid min-h-[520px] max-w-6xl items-center px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">
              Sobre nosotros
            </p>
            <h1 className="mt-4 max-w-3xl font-montserrat text-4xl font-extrabold leading-tight md:text-6xl">
              Fantasy Land es una experiencia de parque conectada de principio a
              fin.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-teal-50">
              Somos un parque de atracciones donde la compra de brazaletes, el
              acceso a juegos, el consumo de alimentos y la atencion operativa
              trabajan como un mismo recorrido digital.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/comprar-brazaletes"
                className="rounded-md bg-white px-5 py-3 text-center text-sm font-extrabold text-teal-900 shadow-lg transition hover:bg-teal-50"
              >
                Ver brazaletes
              </Link>
              <Link
                to="/atracciones-comidas"
                className="rounded-md border border-white/70 px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-white/10"
              >
                Explorar atracciones
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-4 md:mt-0">
            <div className="rounded-lg bg-white/14 p-5 shadow-xl backdrop-blur">
              <span className="text-4xl font-extrabold">360</span>
              <p className="mt-2 text-sm font-semibold text-teal-50">
                grados de experiencia: compra, visita, consumo y seguimiento
                administrativo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-teal-950/70 p-5 shadow-lg">
                <span className="text-3xl font-extrabold">1</span>
                <p className="mt-2 text-sm text-teal-50">
                  brazalete como centro de la experiencia.
                </p>
              </div>
              <div className="rounded-lg bg-white p-5 text-teal-950 shadow-lg">
                <span className="text-3xl font-extrabold">24/7</span>
                <p className="mt-2 text-sm font-semibold">
                  canales digitales disponibles para planear tu visita.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">
            Nuestra propuesta
          </p>
            <h2 className="mt-3 font-montserrat text-3xl font-extrabold">
            Un parque pensado para visitas mas simples.
          </h2>
          <p className="mt-5 leading-7 text-white/85">
            Fantasy Land toma la idea clasica de un parque familiar y la lleva a
            una experiencia gestionada por software. El visitante puede elegir
            su brazalete, entrar al recorrido, usar atracciones y comprar comida
            con reglas claras, mientras el sistema mantiene trazabilidad de cada
            movimiento.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {experienceHighlights.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-lg bg-white p-5 text-teal-950 shadow-xl"
            >
              <h3 className="font-montserrat text-lg font-extrabold">
                {highlight.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {highlight.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-teal-950/35">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-lg shadow-2xl">
            <img
              src="/images/FotoCarrusel3.jpg"
              alt="Visitantes disfrutando Fantasy Land"
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-100">
              Valor para el visitante
            </p>
            <h2 className="mt-3 font-montserrat text-3xl font-extrabold">
              Menos friccion, mas tiempo para disfrutar.
            </h2>
            <p className="mt-5 leading-7 text-white/85">
              El objetivo de la experiencia es que el visitante entienda rapido
              que puede hacer, que incluye su brazalete y como continuar su
              recorrido. La tecnologia queda al servicio de una visita mas
              simple, medible y memorable.
            </p>

            <ul className="mt-7 grid gap-3">
              {visitValues.map((value) => (
                <li
                  key={value}
                  className="rounded-md border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-teal-50"
                >
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 rounded-lg bg-white p-6 text-teal-950 shadow-2xl md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="font-montserrat text-2xl font-extrabold">
              Antes de visitarnos, revisa la informacion esencial.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-700">
              Conoce nuestras recomendaciones, condiciones de acceso, uso de
              brazaletes y reglas generales para disfrutar Fantasy Land con
              tranquilidad.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <Link
              to="/terminos-condiciones"
              className="rounded-md bg-fondoLogin px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-teal-900"
            >
              Ver terminos
            </Link>
            <Link
              to="/contacto"
              className="rounded-md border border-teal-900 px-5 py-3 text-center text-sm font-extrabold text-teal-900 transition hover:bg-teal-50"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
