import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  buildMediaUrl,
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
    image,
    attraction_uses,
  } = bracelet_type || {};
  const imageUrl = buildMediaUrl(image);
  const fechaCompra = purchase_date
    ? new Date(purchase_date).toLocaleDateString('es-ES')
    : 'No especificado';

  return (
    <div className="section-container flex min-h-[calc(100vh-88px)] flex-col items-center justify-center py-10">
      <p className="section-eyebrow">Compra confirmada</p>
      <div className="mb-6 mt-3 font-montserrat text-3xl font-extrabold text-white">Recibo de Compra</div>

      <div className="surface-card w-full max-w-xl p-6">
        <h3 className="mb-4 font-montserrat text-2xl font-extrabold text-slate-950">
          Resumen de la compra
        </h3>

        <div className="mb-4 flex items-center rounded-md bg-slate-50 p-3">
          <img
            src={imageUrl}
            alt={typeName || 'Brazalete'}
            className="h-20 w-20 rounded object-cover"
          />
          <div className="ml-4 text-lg font-extrabold text-slate-950">
            {typeName || 'Brazalete'}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <table className="w-full text-sm text-slate-800">
            <tbody>
              <tr>
                <td className="py-2 font-semibold">Comprador</td>
                <td className="text-right">{fullName}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Fecha de compra</td>
                <td className="text-right">{fechaCompra}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">ID de Recibo</td>
                <td className="text-right">{id}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Codigo brazalete</td>
                <td className="text-right">{bracelet_code || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Numero Compra</td>
                <td className="text-right">{purchase_code || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Tipo</td>
                <td className="text-right">{typeName || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Precio Brazalete</td>
                <td className="text-right">${price ?? '0.00'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Usos atracciones</td>
                <td className="text-right">
                  {bracelet?.attraction_uses_remaining ?? attraction_uses ?? 0}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Saldo Comidas</td>
                <td className="text-right">
                  ${bracelet?.current_balance ?? food_balance ?? '0.00'}
                </td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Total Pagado</td>
                <td className="text-right">${amount_paid ?? '0.00'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Metodo de Pago</td>
                <td className="text-right">{getMethodLabel(payment_method)}</td>
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
