import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserPurchaseReceipts, persistPurchaseReceiptId } from '../api/api';

function getBraceletBgColor(typeName) {
  if (!typeName) return 'bg-gray-100';
  const lower = typeName.toLowerCase();

  if (lower.includes('estándar') || lower.includes('estandar'))
    return 'bg-braceletEstandar';
  if (lower.includes('especial')) return 'bg-braceletEspecial';
  if (lower.includes('premium')) return 'bg-braceletPremium';
  return 'bg-gray-100';
}

export function MyBracelets() {
  const navigate = useNavigate();
  const [bracelets, setBracelets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getUserPurchaseReceipts();
        setBracelets(data);
      } catch (error) {
        console.error('Error fetching bracelets:', error);
      }
    })();
  }, []);

  const handleViewReceipt = (receiptId) => {
    persistPurchaseReceiptId(receiptId);
    navigate('/recibo-compra');
  };

  const handleViewMovements = (braceletId) => {
    if (!braceletId) {
      navigate('/mi-perfil/historial-movimientos');
      return;
    }

    navigate(`/mi-perfil/historial-movimientos?bracelet=${braceletId}`);
  };

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-center mb-6">Mis Brazaletes</h2>
      <div className="flex flex-col space-y-6">
        {bracelets.map((receipt) => {
          const { id, user, bracelet, purchase_date, purchase_code } = receipt;
          const typeName = bracelet?.bracelet_type?.name || '';
          const cardColorClass = getBraceletBgColor(typeName);

          const fullName =
            user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username || 'No especificado';

          const fechaCompra = purchase_date
            ? new Date(purchase_date).toLocaleDateString('es-ES')
            : 'N/A';

          return (
            <div
              key={id}
              className={`${cardColorClass} p-6 rounded-lg text-black`}
            >
              <table className="w-full text-sm mb-4">
                <tbody>
                  <tr>
                    <td className="py-1 font-semibold">Comprador</td>
                    <td className="text-right">{fullName}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Número brazaletes</td>
                    <td className="text-right">
                      {bracelet?.bracelet_code || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Fecha de compra</td>
                    <td className="text-right">{fechaCompra}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Tipo</td>
                    <td className="text-right">{typeName}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Usos atracciones</td>
                    <td className="text-right">
                      {bracelet?.attraction_uses_remaining ?? 'No aplica'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Saldo brazalete</td>
                    <td className="text-right">
                      {bracelet?.current_balance !== undefined &&
                      bracelet?.current_balance !== null
                        ? `$${bracelet.current_balance}`
                        : 'No aplica'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-semibold">Número Compra</td>
                    <td className="text-right">{purchase_code || id}</td>
                  </tr>
                </tbody>
              </table>
              {/* Botón "Ver Recibo" */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleViewReceipt(id)}
                  className="rounded bg-black px-3 py-2 text-white hover:bg-gray-800"
                >
                  Ver Recibo
                </button>
                <button
                  onClick={() => handleViewMovements(bracelet?.id)}
                  className="rounded bg-teal-700 px-3 py-2 text-white hover:bg-teal-600"
                >
                  Ver movimientos
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
