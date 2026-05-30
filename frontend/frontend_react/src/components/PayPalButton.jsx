import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  createPayPalOrder,
  capturePayPalOrder,
  persistPurchaseReceiptId,
} from '../api/api';
import { useNavigate } from 'react-router-dom';
import { PAYPAL_CLIENT_ID } from '../config/env';
import { useAuth } from '../auth/AuthContext';

/**
 * @param {string} braceletTypeId - El ID del brazalete
 * @param {string} price - El precio, en formato "25.00"
 * @param {function} onNotLoggedIn - Callback opcional para indicar que el usuario no está logueado
 */
export function PayPalButton({
  braceletTypeId,
  price,
  onNotLoggedIn,
  onSuccess,
  onError,
}) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Función para crear la orden en PayPal
  const handleCreateOrder = async () => {
    if (!isAuthenticated) {
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
      persistPurchaseReceiptId(result.receipt_id);
      console.log('Captura final:', result);
      onSuccess?.(result.receipt_id);
      navigate('/recibo-compra');
    } catch (error) {
      console.error('Error capturando orden PayPal:', error);
      onError?.(error);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        'client-id': PAYPAL_CLIENT_ID,
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
            throw error;
          }
        }}
        onApprove={handleApprove}
        onError={(err) => {
          console.error('Error en PayPal:', err);
          onError?.(err);
        }}
      />
    </PayPalScriptProvider>
  );
}
