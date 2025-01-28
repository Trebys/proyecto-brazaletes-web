import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { createPayPalOrder, capturePayPalOrder } from '../api/api';

/**
 * @param {string} braceletTypeId - El ID del brazalete
 * @param {string} price - El precio, en formato "25.00"
 * @param {function} onNotLoggedIn - Callback opcional para indicar que el usuario no está logueado
 */
function PayPalButton({ braceletTypeId, price, onNotLoggedIn }) {
  // Función para crear la orden en PayPal
  const handleCreateOrder = async () => {
    // 1. Verifica si hay token
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Si no hay token, llama el callback y lanza un error
      if (onNotLoggedIn) {
        onNotLoggedIn();
      }
      throw new Error('Usuario no logueado');
    }

    // 2. Usuario logueado => crear la orden con el backend
    const orderData = await createPayPalOrder(
      price,
      'USD',
      `Brazalete ${braceletTypeId}`
    );
    return orderData.id; // Retornar el ID a PayPal
  };

  // Función para capturar (finalizar) la orden
  const handleApprove = async (data) => {
    try {
      const result = await capturePayPalOrder(data.orderID, braceletTypeId);
      console.log('Captura final:', result);
      alert(`Pago completado! Recibo: ${result.receipt_id}`);
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
          // Llamamos a handleCreateOrder, atrapando errores
          try {
            return await handleCreateOrder();
          } catch (error) {
            console.error('PayPal createOrder error:', error);
            // Retornamos undefined o lanzamos para que PayPal no abra la ventana
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

export default PayPalButton;
