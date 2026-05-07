import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBraceletTransactions } from '../api/api';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.results || [];
};

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  return `$${numericValue.toFixed(2)}`;
};

const formatDate = (value) => {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatDelta = (value, kind = 'money') => {
  const numericValue = Number(value ?? 0);

  if (kind === 'money') {
    return `${numericValue > 0 ? '+' : ''}${formatCurrency(numericValue)}`;
  }

  return `${numericValue > 0 ? '+' : ''}${numericValue}`;
};

const transactionLabels = {
  ACTIVATION: 'Activacion',
  ATTRACTION_CONSUMPTION: 'Consumo de atraccion',
  FOOD_CONSUMPTION: 'Consumo de comida',
  ADMIN_ADJUSTMENT: 'Ajuste administrativo',
  REVERSAL: 'Reverso',
};

const getMovementBraceletLabel = (movement) => {
  const code = movement.bracelet?.bracelet_code || `#${movement.bracelet?.id || movement.id}`;
  const typeName = movement.bracelet?.bracelet_type?.name;
  return typeName ? `${code} - ${typeName}` : code;
};

export function BraceletMovementHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedBraceletId = searchParams.get('bracelet') || '';

  useEffect(() => {
    const loadMovements = async () => {
      setLoading(true);
      setError('');

      try {
        const params = selectedBraceletId ? { bracelet_id: selectedBraceletId } : {};
        const data = await getBraceletTransactions(params);
        setMovements(normalizeList(data));
      } catch (requestError) {
        console.error('Error fetching bracelet movements:', requestError);
        setError('No se pudo cargar el historial de movimientos.');
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, [selectedBraceletId]);

  const braceletOptions = useMemo(() => {
    const optionsById = new Map();

    movements.forEach((movement) => {
      const braceletId = movement.bracelet?.id;
      if (!braceletId || optionsById.has(String(braceletId))) {
        return;
      }

      optionsById.set(String(braceletId), {
        id: String(braceletId),
        label: getMovementBraceletLabel(movement),
      });
    });

    return Array.from(optionsById.values());
  }, [movements]);

  const handleBraceletFilterChange = (event) => {
    const braceletId = event.target.value;

    if (!braceletId) {
      setSearchParams({});
      return;
    }

    setSearchParams({ bracelet: braceletId });
  };

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-montserrat text-2xl font-extrabold text-white">Historial de movimientos</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Consulta las activaciones, consumos, ajustes y reversos registrados en tus brazaletes.
          </p>
        </div>

        <label className="w-full md:w-80">
          <span className="form-label">
            Brazalete
          </span>
          <select
            value={selectedBraceletId}
            onChange={handleBraceletFilterChange}
            className="form-input"
          >
            <option value="">Todos mis brazaletes</option>
            {braceletOptions.map((bracelet) => (
              <option key={bracelet.id} value={bracelet.id}>
                {bracelet.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="surface-card p-6 text-center text-slate-600">
          Cargando movimientos...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && movements.length === 0 ? (
        <div className="surface-card p-6 text-center text-slate-600">
          No hay movimientos registrados para esta seleccion.
        </div>
      ) : null}

      {!loading && !error && movements.length > 0 ? (
        <div className="table-shell overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fondoLogin text-white">
              <tr>
                <th className="px-4 py-3 font-bold">Fecha</th>
                <th className="px-4 py-3 font-bold">Brazalete</th>
                <th className="px-4 py-3 font-bold">Tipo</th>
                <th className="px-4 py-3 font-bold">Concepto</th>
                <th className="px-4 py-3 font-bold">Saldo</th>
                <th className="px-4 py-3 font-bold">Usos</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-t border-gray-200 align-top">
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(movement.occurred_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">
                      {movement.bracelet?.bracelet_code || `#${movement.bracelet?.id || movement.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.bracelet?.bracelet_type?.name || 'Sin tipo'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                      {transactionLabels[movement.transaction_type] || movement.transaction_type}
                    </span>
                  </td>
                  <td className="min-w-64 px-4 py-3">
                    <p className="font-semibold text-gray-900">{movement.concept}</p>
                    {movement.reverted_transaction_id ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Revierte movimiento #{movement.reverted_transaction_id}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">
                      {formatDelta(movement.balance_delta)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(movement.balance_before)} a {formatCurrency(movement.balance_after)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900">
                      {formatDelta(movement.uses_delta, 'uses')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.uses_before} a {movement.uses_after}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
