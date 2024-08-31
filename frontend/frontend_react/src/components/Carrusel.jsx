import React, { useState } from "react";

const images = [
  "/images/FotoCarrusel.jpg",
  "/images/FotoCarrusel2.jpeg",
  "/images/FotoCarrusel3.jpg", // Añade las rutas de tus imágenes aquí
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
    <div className="relative w-full md:w-1/2">
      <img
        src={images[currentIndex]}
        alt="Carrusel"
        className="w-full h-auto rounded-lg shadow-lg"
      />
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
      >
        &lt;
      </button>
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-gray-700 text-white p-2 rounded-full"
      >
        &gt;
      </button>
    </div>
  );
}
