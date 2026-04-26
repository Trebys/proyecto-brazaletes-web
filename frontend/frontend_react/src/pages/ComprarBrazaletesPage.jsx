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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTipo) {
      return;
    }

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // ... lógicas si sí está logueado
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
    }
  };

  // ↙ Callback que PayPalButton llamará si detecta que no hay login
  const handleNotLoggedIn = () => {
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8">
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

      <div className="bg-fondoLogin w-full max-w-md p-6 rounded-lg shadow-md text-white">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Formulario de Compra
        </h1>

        {/* COMPRAR CON SALDO INTERNO */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="tipoBrazalete">
              Nombre de producto
            </label>
            <select
              id="tipoBrazalete"
              className="w-full p-2 rounded bg-fondoInput text-white"
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

          <div className="p-2 rounded flex justify-center">
            {selectedTipo && (selectedTipo.image_url || selectedTipo.image) ? (
              <img
                src={buildMediaUrl(selectedTipo.image_url || selectedTipo.image)}
                alt={selectedTipo.name}
                className="max-h-32 object-cover"
              />
            ) : (
              <p className="text-white">No hay imagen</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="precio">
              Precio del producto
            </label>
            <input
              id="precio"
              className="w-full p-2 rounded bg-fondoInput text-white"
              value={selectedTipo ? `$${selectedTipo.price}` : ''}
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold" htmlFor="detalles">
              Detalles del producto
            </label>
            <textarea
              id="detalles"
              className="w-full p-2 rounded bg-fondoInput text-white"
              rows={3}
              readOnly
              value={selectedTipo ? selectedTipo.description : ''}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedTipo}
            className="w-full p-3 rounded bg-green-700 text-white font-bold hover:bg-green-600"
          >
            Comprar (saldo interno)
          </button>
        </form>

        {/* COMPRAR CON PAYPAL */}
        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold mb-2">O comprar con PayPal</h2>
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
  );
}
