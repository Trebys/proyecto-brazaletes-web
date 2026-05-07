import React, { useState } from 'react';

const images = [
  '/images/FotoCarrusel.jpg',
  '/images/FotoCarrusel2.jpeg',
  '/images/FotoCarrusel3.jpg', // Añade las rutas de tus imágenes aquí
];

export function Carrusel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-white/70 bg-white shadow-[0_22px_50px_rgba(15,45,42,0.20)]">
      <img
        src={images[currentIndex]}
        alt="Atracciones de Fantasy Land"
        className="h-[260px] w-full object-cover sm:h-[360px] lg:h-[440px]"
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Imagen anterior"
        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-xl font-extrabold text-teal-950 shadow transition hover:bg-white"
      >
        &lt;
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Imagen siguiente"
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md bg-white/90 text-xl font-extrabold text-teal-950 shadow transition hover:bg-white"
      >
        &gt;
      </button>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`Ver imagen ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 w-8 rounded-full transition ${
              index === currentIndex ? 'bg-white' : 'bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
