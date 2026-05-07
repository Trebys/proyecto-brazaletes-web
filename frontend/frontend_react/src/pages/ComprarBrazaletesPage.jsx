// ComprarBrazaletesPage.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  buildMediaUrl,
  createPurchaseReceipt,
  getTiposBrazaletes,
  persistPurchaseReceiptId,
} from '../api/api';
import { PayPalButton } from '../components/PayPalButton';
import ModalMessage from '../components/ModalMessage';
import { useAuth } from '../auth/AuthContext';

export function ComprarBrazaletesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { state } = location || {};
  const defaultTipoId = state?.tipoId || null;

  const [tipos, setTipos] = useState([]);
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal "Debes iniciar sesión"
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTiposBrazaletes();
        setTipos(data);

        if (defaultTipoId) {
          const found = data.find((t) => t.id === defaultTipoId);
          if (found) {
            setSelectedTipo(found);
            return;
          }
        }

        if (data.length > 0) {
          setSelectedTipo(data[0]);
        }
      } catch (error) {
        console.error('Error al obtener tipos de brazaletes:', error);
      }
    })();
  }, [defaultTipoId]);

  const handleSelectChange = (e) => {
    const tipoId = parseInt(e.target.value, 10);
    const found = tipos.find((t) => t.id === tipoId);
    setSelectedTipo(found || null);
    setPurchaseError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPurchaseError('');

    if (!selectedTipo) {
      return;
    }

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // ... lógicas si sí está logueado
    setIsSubmitting(true);
    try {
      console.log('Compra con saldo interno:', selectedTipo);
      // Ejemplo al comprar con saldo interno:
      const result = await createPurchaseReceipt(selectedTipo.id);
      // Supongamos que "result.id" es el ID del PurchaseReceipt
      persistPurchaseReceiptId(result.id);
      alert(
        `Compra exitosa con saldo interno. Recibo: ${result.purchase_code}`
      );

      navigate('/recibo-compra');
    } catch (err) {
      console.error('Error en compra interna:', err);
      const detail =
        err.response?.data?.detail ||
        'No fue posible completar la compra. Revisa tu saldo e intenta de nuevo.';
      setPurchaseError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ↙ Callback que PayPalButton llamará si detecta que no hay login
  const handleNotLoggedIn = () => {
    setShowLoginModal(true);
  };

  return (
    <div className="section-container flex min-h-[calc(100vh-88px)] flex-col justify-center py-12">
      {/* Modal */}
      <ModalMessage
        visible={showLoginModal}
        title="Debes iniciar sesión"
        message="Por favor, inicia sesión antes de realizar la compra."
        onClose={() => {
          setShowLoginModal(false);
          // Opcional: navigate('/login') si deseas redirigir
        }}
      />

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="section-eyebrow">Compra de brazaletes</p>
          <h1 className="mt-3 font-montserrat text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Elige tu pase y completa tu compra.
          </h1>
          <p className="section-copy mt-5">
            Puedes pagar con saldo interno o continuar con PayPal. Si aun no
            inicias sesion, te pediremos entrar antes de confirmar la compra.
          </p>
          {selectedTipo ? (
            <div className="surface-card mt-8 overflow-hidden p-5">
              <div className="flex gap-4">
                <img
                  src={buildMediaUrl(selectedTipo.image_url || selectedTipo.image)}
                  alt={selectedTipo.name}
                  className="h-24 w-28 rounded-md object-cover"
                />
                <div>
                  <h2 className="font-montserrat text-xl font-extrabold">
                    {selectedTipo.name}
                  </h2>
                  <p className="mt-1 text-2xl font-extrabold text-teal-800">
                    ${selectedTipo.price}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedTipo.description || 'Brazalete disponible para compra.'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

      <div className="surface-card w-full p-6">
        <h2 className="font-montserrat text-2xl font-extrabold text-slate-950">
          Formulario de compra
        </h2>

        {/* COMPRAR CON SALDO INTERNO */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label" htmlFor="tipoBrazalete">
              Nombre de producto
            </label>
            <select
              id="tipoBrazalete"
              className="form-input"
              onChange={handleSelectChange}
              value={selectedTipo ? selectedTipo.id : ''}
            >
              {tipos.length === 0 ? (
                <option value="">No hay tipos disponibles</option>
              ) : null}
              {tipos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex justify-center rounded-md bg-slate-50 p-3">
            {selectedTipo && (selectedTipo.image_url || selectedTipo.image) ? (
              <img
                src={buildMediaUrl(selectedTipo.image_url || selectedTipo.image)}
                alt={selectedTipo.name}
                className="max-h-40 rounded-md object-cover"
              />
            ) : (
              <p className="text-slate-500">No hay imagen</p>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="precio">
              Precio del producto
            </label>
            <input
              id="precio"
              className="form-input"
              value={selectedTipo ? `$${selectedTipo.price}` : ''}
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="form-label" htmlFor="detalles">
              Detalles del producto
            </label>
            <textarea
              id="detalles"
              className="form-input"
              rows={3}
              readOnly
              value={selectedTipo ? selectedTipo.description : ''}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTipo || isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Procesando compra...' : 'Comprar (saldo interno)'}
          </button>

          {purchaseError ? (
            <div
              className="mt-4 rounded border border-red-300 bg-red-950/40 px-3 py-2 text-sm text-red-100"
              role="alert"
            >
              {purchaseError}
            </div>
          ) : null}
        </form>

        {/* COMPRAR CON PAYPAL */}
        <div className="mt-6 text-center">
          <h2 className="mb-3 text-lg font-extrabold text-slate-900">
            O comprar con PayPal
          </h2>
          {selectedTipo && (
            <PayPalButton
              braceletTypeId={selectedTipo.id}
              price={String(selectedTipo.price)}
              onNotLoggedIn={handleNotLoggedIn} //  <<--- PASAMOS EL CALLBACK
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
