import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export function PerfilClientePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-center text-2xl font-bold">Mi Perfil</h1>

      <div className="mb-6 flex justify-center space-x-4">
        <Link
          to="info"
          className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-500"
        >
          Datos de Perfil
        </Link>
        <Link
          to="mis-brazaletes"
          className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-500"
        >
          Mis Brazaletes
        </Link>
        <Link
          to="historial-movimientos"
          className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-500"
        >
          Historial
        </Link>
      </div>

      <Outlet />
    </div>
  );
}
