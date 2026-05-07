import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export function PerfilClientePage() {
  return (
    <div className="section-container py-10">
      <div className="mb-8 text-center">
        <p className="section-eyebrow">Cuenta y brazaletes</p>
        <h1 className="section-title mt-3">Mi perfil</h1>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <Link
          to="info"
          className="btn-secondary bg-white"
        >
          Datos de Perfil
        </Link>
        <Link
          to="mis-brazaletes"
          className="btn-secondary bg-white"
        >
          Mis Brazaletes
        </Link>
        <Link
          to="historial-movimientos"
          className="btn-secondary bg-white"
        >
          Historial
        </Link>
      </div>

      <Outlet />
    </div>
  );
}
