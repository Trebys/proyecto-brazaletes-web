// ReciboCompraPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPurchaseReceiptById } from '../api/api';

// Función para convertir la ruta de la BD a una URL absoluta
const getImagenUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `http://localhost:8000/media/${path}`;
};

// Traductor de método de pago
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
    const storedReceiptId = localStorage.getItem('receiptId');
    if (!storedReceiptId) {
      console.warn('No se encontró "receiptId" en localStorage.');
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
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        Cargando recibo...
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        No se encontró información del recibo.
      </div>
    );
  }

  // Desestructuramos lo que nos devuelve el endpoint
  const {
    id,
    user,
    bracelet,
    purchase_date,
    purchase_code,
    amount_paid,
    payment_method, // <--- método de pago
  } = receiptData;

  // Nombre del usuario
  const { first_name, last_name, username } = user || {};
  const fullName =
    first_name || last_name
      ? `${first_name ?? ''} ${last_name ?? ''}`.trim()
      : username || 'No especificado';

  // Datos del brazalete
  const { bracelet_code, bracelet_type } = bracelet || {};
  const {
    name: typeName,
    price,
    food_balance,
    image,
    attraction_uses,
  } = bracelet_type || {};

  // Imagen
  const imageUrl = getImagenUrl(image);

  // Fecha de compra formateada
  const fechaCompra = purchase_date
    ? new Date(purchase_date).toLocaleDateString('es-ES')
    : 'No especificado';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-white text-3xl font-bold mb-6">Recibo de Compra</div>

      <div className="bg-teal-900 rounded-2xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-white text-2xl font-semibold mb-4">
          Resumen de la compra
        </h3>

        <div className="flex items-center mb-4">
          {/* Mostrar imagen del brazalete */}
          <img
            src={imageUrl}
            alt={typeName || 'Brazalete'}
            className="w-20 h-20 rounded"
          />
          <div className="text-white text-lg font-medium ml-4">
            {typeName || 'Brazalete'}
          </div>
        </div>

        <div className="bg-teal-800 p-4 rounded-lg">
          <table className="w-full text-white text-sm">
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
                <td className="py-2 font-semibold">Código brazalete</td>
                <td className="text-right">{bracelet_code || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Número Compra</td>
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
                <td className="text-right">{attraction_uses ?? 0}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Saldo Comidas</td>
                <td className="text-right">${food_balance ?? '0.00'}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">Total Pagado</td>
                <td className="text-right">${amount_paid ?? '0.00'}</td>
              </tr>
              {/* Nueva fila Método de Pago */}
              <tr>
                <td className="py-2 font-semibold">Método de Pago</td>
                <td className="text-right">{getMethodLabel(payment_method)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-white text-lg font-bold">
        ¡Gracias por su compra!
      </div>
      <button
        className="mt-4 bg-black text-white py-2 px-6 rounded hover:bg-gray-800 transition"
        onClick={() => navigate('/inicio')}
      >
        Volver al Inicio
      </button>
    </div>
  );
}
