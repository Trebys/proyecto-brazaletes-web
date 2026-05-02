import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildMediaUrl,
  createTestimonial,
  getTestimonials,
  getTiposBrazaletes,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { Carrusel } from '../components/Carrusel';

export function InicioPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialForm, setTestimonialForm] = useState({
    comment: '',
    rating: 5,
  });
  const [testimonialStatus, setTestimonialStatus] = useState('');
  const [testimonialError, setTestimonialError] = useState('');
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

  function getBraceletBgColor(typeName) {
    if (!typeName) return 'bg-gray-100';
    const lower = typeName.toLowerCase();

    if (lower.includes('estandar')) {
      return 'bg-braceletEstandar';
    }
    if (lower.includes('especial')) {
      return 'bg-braceletEspecial';
    }
    if (lower.includes('premium')) {
      return 'bg-braceletPremium';
    }
    return 'bg-gray-100';
  }

  function getImagenUrl(path) {
    if (!path) {
      return '/images/FotoBrazaletes.jpg';
    }
    return buildMediaUrl(path);
  }

  const loadTestimonials = async () => {
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (error) {
      console.error('Error al obtener testimonios:', error);
    }
  };

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

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleComprar = (tipoId) => {
    navigate('/comprar-brazaletes', { state: { tipoId } });
  };

  const handleTestimonialChange = (event) => {
    const { name, value } = event.target;
    setTestimonialForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleRatingSelect = (rating) => {
    setTestimonialForm((currentForm) => ({
      ...currentForm,
      rating,
    }));
  };

  const handleTestimonialSubmit = async (event) => {
    event.preventDefault();
    setTestimonialError('');
    setTestimonialStatus('');
    setIsSubmittingTestimonial(true);

    try {
      await createTestimonial({
        ...testimonialForm,
        rating: testimonialForm.rating ? Number(testimonialForm.rating) : null,
      });
      setTestimonialForm({
        comment: '',
        rating: 5,
      });
      setTestimonialStatus(
        'Gracias. Tu testimonio quedo pendiente de revision antes de publicarse.'
      );
      await loadTestimonials();
    } catch (error) {
      const responseData = error?.response?.data;
      const detail =
        responseData?.detail ||
        responseData?.comment?.[0] ||
        responseData?.rating?.[0] ||
        'No pudimos registrar el testimonio. Intentalo de nuevo.';
      setTestimonialError(detail);
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  const formatTestimonialDate = (dateValue) => {
    if (!dateValue) {
      return '';
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateValue));
  };

  const renderStars = (rating) => {
    if (!rating) {
      return null;
    }

    const normalizedRating = Math.max(1, Math.min(5, Number(rating)));
    return (
      <div
        className="flex gap-1 text-lg leading-none text-amber-500"
        aria-label={`${normalizedRating} de 5 estrellas`}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>{index < normalizedRating ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  const renderRatingInput = () => (
    <div className="flex gap-1" role="radiogroup" aria-label="Valoracion">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        const isActive = rating <= Number(testimonialForm.rating);

        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={rating === Number(testimonialForm.rating)}
            aria-label={`${rating} de 5 estrellas`}
            onClick={() => handleRatingSelect(rating)}
            className={`text-3xl leading-none transition ${
              isActive ? 'text-amber-400' : 'text-white/45'
            } hover:text-amber-300`}
          >
            {isActive ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="overflow-y-auto">
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center md:w-3/4">
          <h2 className="text-4xl font-bold">Bienvenidos a FantasyLand</h2>
          <p className="text-lg m-8">
            FantasyLand es un parque de atracciones de ensueno, disenado para
            ofrecer diversion ilimitada y experiencias inolvidables para
            visitantes de todas las edades. Situado en un entorno pintoresco, el
            parque combina tecnologia de vanguardia con la magia de los cuentos
            de hadas, brindando un escape perfecto de la rutina diaria.
          </p>
        </div>
        <Carrusel />
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          Tipos de brazaletes
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {tipos.map((tipo) => {
            const bgClass = getBraceletBgColor(tipo.name);

            return (
              <div
                key={tipo.id}
                className={`w-60 p-4 rounded-lg shadow-lg text-center ${bgClass}`}
              >
                <img
                  src={getImagenUrl(tipo.image_url || tipo.image)}
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
            );
          })}
        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl border-t border-white/40 pt-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Testimonios
          </h2>

          <div className="bg-white text-gray-900 p-5 md:p-8 shadow-xl">
            {testimonials.length > 0 ? (
              <div className="space-y-5">
                {testimonials.map((testimonial) => (
                  <article
                    key={testimonial.id}
                    className="flex flex-col gap-4 rounded-md border border-gray-200 p-4 sm:flex-row sm:items-center"
                  >
                    {testimonial.profile_image_url ? (
                      <img
                        src={testimonial.profile_image_url}
                        alt={testimonial.visible_name}
                        className="h-24 w-24 rounded-sm object-cover"
                      />
                    ) : (
                      <img
                        src="/images/perfil.svg"
                        alt=""
                        className="h-24 w-24 rounded-sm bg-teal-50 object-contain p-4"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                          {testimonial.visible_name}
                        </h3>
                        <time className="text-xs font-semibold uppercase text-gray-500">
                          {formatTestimonialDate(testimonial.created_at)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {testimonial.comment}
                      </p>
                      <div className="mt-3">{renderStars(testimonial.rating)}</div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-gray-600">
                Aun no hay testimonios publicados. Se el primero en compartir tu
                experiencia.
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg bg-white/10 p-5 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Comparte tu experiencia</h3>
                <p className="mt-1 max-w-2xl text-sm text-white/80">
                  Los comentarios se revisan antes de aparecer en la pagina de
                  inicio para mantener contenido claro y consistente.
                </p>
              </div>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-md bg-white px-4 py-2 text-sm font-bold text-teal-800 hover:bg-teal-50"
                >
                  Iniciar sesion
                </button>
              )}
            </div>

            {isAuthenticated && (
              <form
                onSubmit={handleTestimonialSubmit}
                className="mt-5 grid gap-4 md:grid-cols-[1fr_220px] md:items-start"
              >
                <div className="grid gap-4">
                  <textarea
                    name="comment"
                    value={testimonialForm.comment}
                    onChange={handleTestimonialChange}
                    placeholder="Cuenta que te gusto de FantasyLand"
                    className="min-h-28 rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-200"
                    maxLength={800}
                    required
                  />
                </div>

                <div className="grid gap-4">
                  <div className="text-sm font-semibold">
                    Valoracion
                    <div className="mt-2">{renderRatingInput()}</div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingTestimonial}
                    className="rounded-md bg-teal-950 px-4 py-2 text-sm font-bold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingTestimonial ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}

            {testimonialStatus && (
              <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                {testimonialStatus}
              </p>
            )}
            {testimonialError && (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {testimonialError}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
