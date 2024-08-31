import React from "react";
import { Carrusel } from "../components/Carrusel"; // Asegúrate de importar el componente Carrusel

export function InicioPage() {
  return (
    <div className="px-4 py-8">
      {/* Sección de Carrusel y Descripción */}
      <section className="mb-16">
        <div className="flex flex-col items-center">
          {/* Descripción del parque */}
          <div className="mt-8 text-center md:w-3/4">
            <h2 className="text-4xl font-bold">¡Bienvenidos a FantasyLand!</h2>
            <p className="text-lg m-8">
              FantasyLand es un parque de atracciones de ensueño, diseñado para
              ofrecer diversión ilimitada y experiencias inolvidables para
              visitantes de todas las edades. Situado en un entorno pintoresco,
              el parque combina tecnología de vanguardia con la magia de los
              cuentos de hadas, brindando un escape perfecto de la rutina
              diaria.
            </p>
          </div>
          {/* Carrusel de fotos */}
          <Carrusel /> {/* Usa el componente Carrusel aquí */}
        </div>
      </section>

      {/* Sección de Brazaletes */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Tipos de brazaletes
        </h2>
        <div className="flex justify-center space-x-4">
          {/* Brazalete Estándar */}
          <div className="bg-green-200 p-4 rounded-lg shadow-lg text-center">
            <img
              src="/images/FotoBrazaletes.jpg" // Sustituye con la ruta de tu imagen
              alt="Brazalete Estándar"
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold">Estándar</h3>
            <p className="mt-2">Incluye la entrada al parque</p>
            <p className="text-lg font-bold mt-2">$25</p>
            <button className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-full hover:bg-teal-800">
              Comprar
            </button>
          </div>

          {/* Brazalete Especial */}
          <div className="bg-orange-200 p-4 rounded-lg shadow-lg text-center">
            <img
              src="/images/FotoBrazaletes.jpg" // Sustituye con la ruta de tu imagen
              alt="Brazalete Especial"
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold">Especial</h3>
            <p className="mt-2">
              Incluye entrada al parque y acceso a 10 atracciones
            </p>
            <p className="text-lg font-bold mt-2">$40</p>
            <button className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-full hover:bg-teal-800">
              Comprar
            </button>
          </div>

          {/* Brazalete Premium */}
          <div className="bg-blue-200 p-4 rounded-lg shadow-lg text-center">
            <img
              src="/images/FotoBrazaletes.jpg" // Sustituye con la ruta de tu imagen
              alt="Brazalete Premium"
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold">Premium</h3>
            <p className="mt-2">
              Incluye entrada al parque, 10 atracciones y $50 para comidas
            </p>
            <p className="text-lg font-bold mt-2">$75</p>
            <button className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-full hover:bg-teal-800">
              Comprar
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Testimonios */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Testimonios</h2>
        <div className="flex flex-col items-center space-y-8">
          {/* Testimonio 1 */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg w-full md:w-1/2">
            <p className="font-semibold text-gray-600">Usuario123</p>
            <p className="text-sm text-gray-600">
              "¡Un lugar increíble para toda la familia!"
            </p>
          </div>

          {/* Testimonio 2 */}
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg w-full md:w-1/2">
            <p className="font-semibold text-gray-600">Fernanda Sánchez</p>
            <p className="text-sm text-gray-600">
              "Las atracciones y el ambiente son espectaculares. ¡Lo recomiendo
              al 100%!"
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
