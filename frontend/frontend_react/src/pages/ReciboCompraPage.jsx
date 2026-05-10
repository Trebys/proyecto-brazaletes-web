import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getBraceletTypeImageUrl,
  getPurchaseReceiptById,
  getStoredPurchaseReceiptId,
} from '../api/api';

const getMethodLabel = (method) => {
  switch (method) {
    case 'INTERNAL':
      return 'Saldo Interno';
    case 'PAYPAL':
      return 'PayPal';
    default:
      return 'Desconocido';
  }
};

export function ReciboCompraPage() {
  const navigate = useNavigate();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedReceiptId = getStoredPurchaseReceiptId();
    if (!storedReceiptId) {
      console.warn('No se encontro un recibo de compra pendiente.');
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const data = await getPurchaseReceiptById(storedReceiptId);
        setReceiptData(data);
      } catch (error) {
        console.error('Error obteniendo el recibo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, []);

  if (loading) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center text-slate-700">
        Cargando recibo...
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center text-slate-700">
        No se encontro informacion del recibo.
      </div>
    );
  }

  const {
    id,
    user,
    bracelet,
    purchase_date,
    purchase_code,
    amount_paid,
    payment_method,
  } = receiptData;

  const { first_name, last_name, username } = user || {};
  const fullName =
    first_name || last_name
      ? `${first_name ?? ''} ${last_name ?? ''}`.trim()
      : username || 'No especificado';

  const { bracelet_code, bracelet_type } = bracelet || {};
  const {
    name: typeName,
    price,
    food_balance,
    attraction_uses,
  } = bracelet_type || {};
  const imageUrl = getBraceletTypeImageUrl(bracelet_type);
  const fechaCompra = purchase_date
    ? new Date(purchase_date).toLocaleDateString('es-ES')
    : 'No especificado';

  return (
    <div className="section-container flex min-h-[calc(100vh-88px)] flex-col items-center justify-center py-10">
      <p className="section-eyebrow">Compra confirmada</p>
      <div className="mb-6 mt-3 font-montserrat text-3xl font-extrabold text-white">Recibo de Compra</div>

      <div className="w-full max-w-2xl bg-fondoLogin px-6 py-7 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:px-9">
        <h3 className="mb-6 font-montserrat text-2xl font-extrabold">
          3. Resumen de la compra
        </h3>

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={typeName || 'Brazalete'}
              className="h-28 w-28 shrink-0 object-cover"
            />
          ) : null}
          <h4 className="font-montserrat text-2xl font-extrabold">
            Brazalete {typeName || 'N/A'}
          </h4>
        </div>

        <div>
          <table className="w-full table-fixed text-left text-sm text-white">
            <tbody>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Comprador</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{fullName}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Fecha de compra</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{fechaCompra}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">ID de Recibo</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{id}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Codigo brazalete</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{bracelet_code || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Numero Compra</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{purchase_code || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Tipo</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">{typeName || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Precio Brazalete</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">${price ?? '0.00'}</td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Usos atracciones</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">
                  {bracelet?.attraction_uses_remaining ?? attraction_uses ?? 0}
                </td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Saldo Comidas</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">
                  ${bracelet?.current_balance ?? food_balance ?? '0.00'}
                </td>
              </tr>
              <tr>
                <td className="border-b border-white/35 py-2 pr-4 font-extrabold">Total Pagado</td>
                <td className="border-b border-white/35 py-2 text-right font-bold">${amount_paid ?? '0.00'}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-extrabold">Metodo de Pago</td>
                <td className="py-2 text-right font-bold">{getMethodLabel(payment_method)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-lg font-extrabold text-slate-800">
        Gracias por tu compra.
      </div>
      <button
        className="btn-dark mt-4"
        onClick={() => navigate('/inicio')}
      >
        Volver al Inicio
      </button>
    </div>
  );
}
