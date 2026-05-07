import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  buildMediaUrl,
  consumeAttraction,
  getAttractions,
  getClientData,
  getFoods,
  getUserPurchaseReceipts,
  purchaseFood,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';

const PAYMENT_SOURCE_BRACELET = 'BRACELET_BALANCE';

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  return `$${numericValue.toFixed(2)}`;
};

const formatUsesLabel = (uses) => {
  const numericUses = Number(uses ?? 0);
  return numericUses === 1 ? '1 uso' : `${numericUses} usos`;
};

const getUniqueBracelets = (receipts) => {
  const uniqueBracelets = [];
  const seenBracelets = new Set();

  receipts.forEach((receipt) => {
    const bracelet = receipt?.bracelet;
    if (!bracelet?.id || seenBracelets.has(bracelet.id)) {
      return;
    }

    seenBracelets.add(bracelet.id);
    uniqueBracelets.push(bracelet);
  });

  return uniqueBracelets;
};

const buildBraceletLabel = (bracelet) => {
  const typeName = bracelet?.bracelet_type?.name || 'Brazalete';
  const braceletCode = bracelet?.bracelet_code || `#${bracelet?.id}`;
  return `${typeName} - ${braceletCode}`;
};

export function AtraccionesComidasPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [attractions, setAttractions] = useState([]);
  const [foods, setFoods] = useState([]);
  const [bracelets, setBracelets] = useState([]);
  const [selectedBraceletId, setSelectedBraceletId] = useState('');
  const [accountBalance, setAccountBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeAction, setActiveAction] = useState('');

  const selectedBracelet = bracelets.find(
    (bracelet) => String(bracelet.id) === String(selectedBraceletId)
  );

  useEffect(() => {
    let ignore = false;

    const loadPageData = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [attractionsData, foodsData] = await Promise.all([
          getAttractions(),
          getFoods(),
        ]);

        if (ignore) {
          return;
        }

        setAttractions(attractionsData);
        setFoods(foodsData);

        if (!isAuthenticated) {
          return;
        }

        const [receiptsData, userData] = await Promise.all([
          getUserPurchaseReceipts(),
          getClientData(),
        ]);

        if (ignore) {
          return;
        }

        const uniqueBracelets = getUniqueBracelets(receiptsData);
        setBracelets(uniqueBracelets);
        setAccountBalance(userData.account_balance ?? '0.00');
        if (uniqueBracelets.length > 0) {
          setSelectedBraceletId(String(uniqueBracelets[0].id));
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        console.error('Error loading attractions and foods page:', error);
        setErrorMessage('No pudimos cargar el catalogo en este momento.');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadPageData();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const syncBraceletState = (updatedBracelet) => {
    setBracelets((currentBracelets) =>
      currentBracelets.map((bracelet) =>
        bracelet.id === updatedBracelet.id ? updatedBracelet : bracelet
      )
    );
  };

  const syncAccountBalanceState = (nextBalance) => {
    if (nextBalance === undefined || nextBalance === null) {
      return;
    }

    setAccountBalance(nextBalance);

    if (user) {
      updateUser({
        ...user,
        account_balance: nextBalance,
      });
    }
  };

  const handleRequireSession = () => {
    toast.error('Inicia sesion para usar esta funcionalidad.');
    navigate('/login');
  };

  const handleConsumeAttraction = async (attraction) => {
    if (!isAuthenticated) {
      handleRequireSession();
      return;
    }

    if (!selectedBracelet) {
      toast.error('Primero necesitas seleccionar un brazalete valido.');
      return;
    }

    setActiveAction(`attraction-${attraction.id}`);

    try {
      const result = await consumeAttraction(attraction.id, selectedBracelet.id);
      syncBraceletState(result.bracelet);
      toast.success(`${result.detail} Movimiento #${result.transaction_id}`);
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        'No fue posible registrar el uso de la atraccion.';
      toast.error(detail);
    } finally {
      setActiveAction('');
    }
  };

  const handlePurchaseFood = async (food, paymentSource) => {
    if (!isAuthenticated) {
      handleRequireSession();
      return;
    }

    if (!selectedBracelet) {
      toast.error('Primero necesitas seleccionar un brazalete valido.');
      return;
    }

    setActiveAction(`food-${food.id}-${paymentSource}`);

    try {
      const result = await purchaseFood(food.id, selectedBracelet.id, paymentSource);
      syncBraceletState(result.bracelet);
      syncAccountBalanceState(result.account_balance);
      toast.success(`${result.detail} Movimiento #${result.transaction_id}`);
    } catch (error) {
      const detail =
        error.response?.data?.detail || 'No fue posible completar la compra.';
      toast.error(detail);
    } finally {
      setActiveAction('');
    }
  };

  if (loading) {
    return (
      <div className="app-shell px-6 py-16 text-center text-slate-700">
        Cargando atracciones y comidas...
      </div>
    );
  }

  return (
    <div className="app-shell px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="section-eyebrow">Catalogo del parque</p>
          <h1 className="section-title mt-3">Atracciones y comidas</h1>
          <p className="section-copy mx-auto mt-4 max-w-2xl">
            Consulta lo que puedes disfrutar y usa tu brazalete activo para
            registrar consumos durante la visita.
          </p>
        </header>

        {isAuthenticated ? (
          <section className="surface-card mx-auto mb-10 max-w-5xl px-5 py-4">
            <div className="grid gap-4 text-sm md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center">
              <label className="block">
                <span className="form-label">Brazalete activo</span>
                <select
                  value={selectedBraceletId}
                  onChange={(event) => setSelectedBraceletId(event.target.value)}
                  className="form-input"
                >
                  {bracelets.length === 0 ? (
                    <option value="">Sin brazaletes</option>
                  ) : (
                    bracelets.map((bracelet) => (
                      <option key={bracelet.id} value={bracelet.id}>
                        {buildBraceletLabel(bracelet)}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Usos disponibles</span>
                <span className="text-lg font-extrabold text-slate-950">{selectedBracelet?.attraction_uses_remaining ?? 0}</span>
              </div>
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Saldo brazalete</span>
                <span className="text-lg font-extrabold text-slate-950">{formatCurrency(selectedBracelet?.current_balance)}</span>
              </div>
              <div>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Saldo cuenta</span>
                <span className="text-lg font-extrabold text-slate-950">{formatCurrency(accountBalance)}</span>
              </div>
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <div className="mx-auto mb-8 max-w-3xl rounded-md border border-red-200 bg-red-50 px-5 py-3 text-center text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section>
          <h2 className="text-center font-montserrat text-3xl font-extrabold text-white">
            Atracciones
          </h2>

          <div className="mt-10 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.length === 0 ? (
              <p className="col-span-full text-center text-white/80">
                No hay atracciones registradas.
              </p>
            ) : (
              attractions.map((attraction) => {
                const imageUrl = buildMediaUrl(
                  attraction.photo_url || attraction.photo
                );
                const requiredUses = Number(attraction.usage_points ?? 0);
                const remainingUses = Number(
                  selectedBracelet?.attraction_uses_remaining ?? 0
                );
                const canConsume =
                  !isAuthenticated ||
                  (selectedBracelet &&
                    remainingUses >= requiredUses &&
                    requiredUses > 0);
                const isProcessing = activeAction === `attraction-${attraction.id}`;

                return (
                  <article
                    key={attraction.id}
                    className="surface-card mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden text-center"
                  >
                    <div className="w-full bg-sky-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={attraction.name}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-teal-900 text-sm text-white">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-montserrat text-lg font-extrabold text-slate-950">
                      {attraction.name}
                    </h3>
                    <p className="mt-3 flex-1 text-left text-sm font-semibold leading-6 text-slate-600">
                      {attraction.description}
                    </p>
                    <p className="mt-4 text-sm font-extrabold text-teal-800">
                      Gasta {formatUsesLabel(requiredUses)}
                    </p>
                    {isAuthenticated && selectedBracelet ? (
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Te quedan {remainingUses} usos
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!canConsume || isProcessing}
                      onClick={() => handleConsumeAttraction(attraction)}
                      className="btn-dark mt-5 w-full"
                    >
                      {isProcessing
                        ? 'Procesando...'
                        : canConsume
                          ? 'Usar Atraccion'
                          : 'Sin usos'}
                    </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-28 pb-24">
          <h2 className="text-center font-montserrat text-3xl font-extrabold text-white">
            Comidas
          </h2>

          <div className="mt-10 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {foods.length === 0 ? (
              <p className="col-span-full text-center text-white/80">
                No hay comidas registradas.
              </p>
            ) : (
              foods.map((food) => {
                const imageUrl = buildMediaUrl(food.photo_url || food.photo);
                const braceletBalance = Number(
                  selectedBracelet?.current_balance ?? 0
                );
                const foodPrice = Number(food.price ?? 0);
                const canPayWithBracelet =
                  isAuthenticated && selectedBracelet && braceletBalance >= foodPrice;
                const paymentSource = PAYMENT_SOURCE_BRACELET;
                const canBuy = !isAuthenticated || canPayWithBracelet;
                const isProcessing =
                  activeAction === `food-${food.id}-${paymentSource}`;

                return (
                  <article
                    key={food.id}
                    className="surface-card mx-auto flex h-full w-full max-w-[320px] flex-col overflow-hidden text-center"
                  >
                    <div className="w-full bg-amber-100">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={food.name}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-44 items-center justify-center bg-teal-900 text-sm text-white">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-montserrat text-lg font-extrabold text-slate-950">
                      {food.name}
                    </h3>
                    <p className="mt-3 text-2xl font-extrabold text-teal-800">
                      {formatCurrency(food.price)}
                    </p>
                    {isAuthenticated && selectedBracelet ? (
                      <p className="mt-2 min-h-[32px] text-xs font-semibold text-slate-500">
                        Saldo disponible {formatCurrency(braceletBalance)}
                      </p>
                    ) : (
                      <p className="mt-2 min-h-[32px] text-xs font-semibold text-slate-500">
                        Inicia sesion para comprar
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!canBuy || isProcessing}
                      onClick={() => handlePurchaseFood(food, paymentSource)}
                      className="btn-dark mt-5 w-full"
                    >
                      {isProcessing
                        ? 'Procesando...'
                        : canBuy
                            ? 'Comprar'
                            : 'Sin saldo'}
                    </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
