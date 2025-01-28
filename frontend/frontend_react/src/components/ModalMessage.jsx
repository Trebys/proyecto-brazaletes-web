// ModalMessage.jsx
import React from 'react';

function ModalMessage({ visible, title, message, onClose }) {
  if (!visible) {
    return null; // Si no está visible, no renderizamos nada
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Si quieres cerrar al hacer click fuera del modal
    >
      <div
        className="bg-green-800 p-6 rounded shadow-md text-white w-80"
        onClick={(e) => e.stopPropagation()} // Evita cerrar si clic en modal
      >
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>
        <button
          className="bg-teal-700 px-4 py-2 rounded hover:bg-teal-600"
          onClick={onClose}
        >
          Ok
        </button>
      </div>
    </div>
  );
}

export default ModalMessage;
