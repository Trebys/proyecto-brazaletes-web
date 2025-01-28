import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carrusel } from '../components/Carrusel';
import {} from '../api/api'; //Mover la construccion de URL\Apis al archivo y llamar las funciones cuando esten creadas
import { getTiposBrazaletes } from '../api/api';
export function InicioPage() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState([]);

  // Mapea nombre -> color de fondo
  function getCardColor(nombre) {
    if (!nombre) {
      // Si nombre es undefined, null o string vacío
      return 'bg-gray-100';
    }
    switch (nombre.toLowerCase()) {
      case 'estándar':
      case 'estandar':
        return 'bg-[#bbf7d0]';
      case 'especial':
        return 'bg-[#fed7aa]';
      case 'premium':
        return 'bg-[#bfdbfe]';
      default:
        return 'bg-gray-100';
    }
  }

  // Construye la URL de imagen
  function getImagenUrl(path) {
    if (!path) {
      return '/images/FotoBrazaletes.jpg';
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `http://localhost:8000/media/${path}`;
  }

  useEffect(() => {
    (async () => {
      try {
        const data = await getTiposBrazaletes();
        setTipos(data);
      } catch (error) {
        console.error('Error al obtener tipos de brazaletes:', error);
      }
    })();
  }, []);

  // InicioPage.jsx
  const handleComprar = (tipoId) => {
    // Sin chequear token aquí
    navigate('/comprar-brazaletes', { state: { tipoId } });
  };

  return (
    // Contenedor general con scroll normal
    <div className="overflow-y-auto">
      {/* Sección 1: Bienvenidos */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center md:w-3/4">
          <h2 className="text-4xl font-bold">¡Bienvenidos a FantasyLand!</h2>
          <p className="text-lg m-8">
            FantasyLand es un parque de atracciones de ensueño, diseñado para
            ofrecer diversión ilimitada y experiencias inolvidables para
            visitantes de todas las edades. Situado en un entorno pintoresco, el
            parque combina tecnología de vanguardia con la magia de los cuentos
            de hadas, brindando un escape perfecto de la rutina diaria.
          </p>
        </div>
        <Carrusel />
      </section>

      {/* Sección 2: Brazaletes */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          Tipos de brazaletes
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className={`w-60 p-4 rounded-lg shadow-lg text-center ${getCardColor(
                tipo.name
              )}`}
            >
              {/* Imagen */}
              <img
                src={getImagenUrl(tipo.image)}
                alt={tipo.name}
                className="mx-auto mb-4 h-32 object-cover"
              />
              <h3 className="text-xl font-semibold text-black drop-shadow-lg">
                {tipo.name}
              </h3>
              <p className="text-lg font-bold mt-2 text-gray-700 drop-shadow-lg">
                ${tipo.price}
              </p>
              {tipo.description && (
                <p className="mt-2 font-bold text-gray-700 drop-shadow-lg">
                  {tipo.description}
                </p>
              )}
              <button
                className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-full hover:bg-teal-800"
                onClick={() => handleComprar(tipo.id)}
              >
                Comprar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Sección 3: Testimonios */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8">Testimonios</h2>
        <div className="flex flex-col items-center space-y-8 max-w-lg">
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg w-full">
            <p className="font-semibold text-gray-600">Usuario123</p>
            <p className="text-sm text-gray-600">
              ¡Un lugar increíble para toda la familia!
            </p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-lg w-full">
            <p className="font-semibold text-gray-600">Fernanda Sánchez</p>
            <p className="text-sm text-gray-600">
              Las atracciones y el ambiente son espectaculares. ¡Lo recomiendo
              al 100%!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
