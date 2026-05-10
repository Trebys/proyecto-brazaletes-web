import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createTestimonial,
  getBraceletTypeImageUrl,
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
    <div className="h-[calc(100vh-76px)] snap-y snap-proximity overflow-y-auto bg-fondoPrincipal text-white">
      <section className="section-container grid min-h-[calc(100vh-76px)] snap-start items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div>
          <p className="section-eyebrow">Parque, brazaletes y experiencias</p>
          <h1 className="mt-4 font-montserrat text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Fantasy Land hace que cada visita empiece con una experiencia clara.
          </h1>
          <p className="section-copy mt-6 max-w-2xl">
            Compra tu brazalete, explora atracciones, disfruta alimentos y
            conserva el control de tus consumos desde un flujo digital pensado
            para visitantes de todas las edades.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate('/comprar-brazaletes')}
              className="btn-primary"
            >
              Comprar brazalete
            </button>
            <button
              type="button"
              onClick={() => navigate('/atracciones-comidas')}
              className="btn-secondary border-white bg-white/10 text-white hover:bg-white/20"
            >
              Ver atracciones
            </button>
          </div>
        </div>
        <Carrusel />
      </section>

      <section className="section-container flex min-h-[calc(100vh-76px)] snap-start flex-col justify-center py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-eyebrow">Elige tu pase</p>
          <h2 className="section-title mt-3">Tipos de brazaletes</h2>
          <p className="section-copy mt-4">
            Encuentra el brazalete que mejor acompana tu recorrido por el parque.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tipos.map((tipo) => {
            const bgClass = getBraceletBgColor(tipo.name);
            const imageUrl = getBraceletTypeImageUrl(tipo) || '/images/FotoBrazaletes.jpg';

            return (
              <div
                key={tipo.id}
                className={`surface-card flex min-h-[360px] flex-col overflow-hidden p-5 text-center ${bgClass}`}
              >
                <div className="overflow-hidden rounded-md bg-white/75">
                  <img
                    src={imageUrl}
                    alt={tipo.name}
                    className="h-40 w-full object-cover"
                  />
                </div>
                <h3 className="mt-5 font-montserrat text-xl font-extrabold text-slate-950">
                  {tipo.name}
                </h3>
                <p className="mt-2 text-2xl font-extrabold text-teal-900">
                  ${tipo.price}
                </p>
                {tipo.description && (
                  <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-700">
                    {tipo.description}
                  </p>
                )}
                <button
                  type="button"
                  className="btn-primary mt-5 w-full"
                  onClick={() => handleComprar(tipo.id)}
                >
                  Comprar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-[calc(100vh-76px)] snap-start flex-col justify-center bg-teal-950 py-16 text-white">
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-amber-200">
              Lo que cuentan los visitantes
            </p>
            <h2 className="mt-3 font-montserrat text-3xl font-extrabold md:text-4xl">
              Testimonios
            </h2>
          </div>

          <div className="surface-card mt-10 p-5 md:p-8">
            {testimonials.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {testimonials.map((testimonial) => (
                  <article
                    key={testimonial.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center"
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

                    <div className="min-w-0 flex-1 text-slate-900">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                          {testimonial.visible_name}
                        </h3>
                        <time className="text-xs font-semibold uppercase text-gray-500">
                          {formatTestimonialDate(testimonial.created_at)}
                        </time>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
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

          <div className="glass-panel mt-8 p-5">
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
                  className="btn-secondary border-white bg-white text-teal-900 hover:bg-teal-50"
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
                    className="form-input-dark min-h-28"
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
                    className="btn-dark"
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
