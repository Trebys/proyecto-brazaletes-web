// PerfilClientePage.jsx
import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { ProfileDataForm } from '../components/ProfileDataForm';
import { MyBracelets } from '../components/MyBracelets';

export function PerfilClientePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-center text-2xl font-bold mb-6">Mi Perfil</h1>

      {/* Barra de navegación interna */}
      <div className="flex space-x-4 justify-center mb-6">
        <Link
          to="info"
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-500"
        >
          Datos de Perfil
        </Link>
        <Link
          to="mis-brazaletes"
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-500"
        >
          Mis Brazaletes
        </Link>
      </div>

      {/* Aquí van las rutas anidadas */}
      <Routes>
        <Route path="info" element={<ProfileDataForm />} />
        <Route path="mis-brazaletes" element={<MyBracelets />} />

        {/* Ruta por defecto dentro de /perfil */}
        <Route
          path=""
          element={
            <div className="text-center text-white">
              Elige una opción de perfil.
            </div>
          }
        />
      </Routes>
    </div>
  );
}
