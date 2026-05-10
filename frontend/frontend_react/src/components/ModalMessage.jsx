import React from 'react';

function ModalMessage({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  variant = 'info',
  closeOnBackdrop = true,
}) {
  if (!visible) {
    return null;
  }

  const isConfirm = Boolean(onConfirm);
  const variantClasses = {
    info: 'bg-teal-700 hover:bg-teal-800',
    success: 'bg-emerald-700 hover:bg-emerald-800',
    danger: 'bg-red-700 hover:bg-red-800',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
      role="presentation"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-white/10 bg-fondoLogin p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-message-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="modal-message-title" className="font-montserrat text-xl font-extrabold">
          {title}
        </h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-teal-50">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {isConfirm ? (
            <button
              type="button"
              className="min-h-11 rounded-md border border-white/25 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-white/10"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`min-h-11 rounded-md px-4 py-2 text-sm font-extrabold text-white transition ${
              variantClasses[variant] || variantClasses.info
            }`}
            onClick={isConfirm ? onConfirm : onClose}
          >
            {isConfirm ? confirmLabel : 'Ok'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalMessage;
