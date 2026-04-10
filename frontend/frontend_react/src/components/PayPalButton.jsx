import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createPayPalOrder, capturePayPalOrder } from '../api/api';
import { useNavigate } from 'react-router-dom';

/**
 * @param {string} braceletTypeId - El ID del brazalete
 * @param {string} price - El precio, en formato "25.00"
 * @param {function} onNotLoggedIn - Callback opcional para indicar que el usuario no está logueado
 */
export function PayPalButton({ braceletTypeId, price, onNotLoggedIn }) {
  const navigate = useNavigate();

  // Función para crear la orden en PayPal
  const handleCreateOrder = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      if (onNotLoggedIn) {
        onNotLoggedIn();
      }
      throw new Error('Usuario no logueado');
    }

    const orderData = await createPayPalOrder(
      price,
      'USD',
      `Brazalete ${braceletTypeId}`
    );
    return orderData.id;
  };

  // Función para capturar (finalizar) la orden
  const handleApprove = async (data) => {
    try {
      // PayPalButton.jsx, en handleApprove:
      const result = await capturePayPalOrder(data.orderID, braceletTypeId);
      // "result.receipt_id" es tu ID de PurchaseReceipt
      localStorage.setItem('receiptId', result.receipt_id);
      console.log('Captura final:', result);
      alert(`Pago completado! Recibo: ${result.receipt_id}`);
      navigate('/recibo-compra');
    } catch (error) {
      console.error('Error capturando orden PayPal:', error);
      alert('Hubo un error al capturar la orden de PayPal.');
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        'client-id':
          'AU0eVc0ia1q4vBWAIQtEX65Q3GO4OMMiV-GaCC6XkzJmcTpbd73XMsRm48v7Y1V3yzwwZaVyBulh6MVB',
        currency: 'USD',
      }}
    >
      <PayPalButtons
        style={{
          color: 'gold',
          layout: 'horizontal',
          label: 'paypal',
          shape: 'pill',
          tagline: false,
          height: 45,
        }}
        createOrder={async () => {
          try {
            return await handleCreateOrder();
          } catch (error) {
            console.error('PayPal createOrder error:', error);
          }
        }}
        onApprove={handleApprove}
        onError={(err) => {
          console.error('Error en PayPal:', err);
        }}
      />
    </PayPalScriptProvider>
  );
}
