import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  buildMediaUrl,
  consumeAttraction,
  getAttractions,
  getClientData,
  getFoods,
  getStoredUser,
  getUserPurchaseReceipts,
  persistUserData,
  purchaseFood,
} from '../api/api';

const PAYMENT_SOURCE_BRACELET = 'BRACELET_BALANCE';
const PAYMENT_SOURCE_ACCOUNT = 'ACCOUNT_BALANCE';

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
  const [attractions, setAttractions] = useState([]);
  const [foods, setFoods] = useState([]);
  const [bracelets, setBracelets] = useState([]);
  const [selectedBraceletId, setSelectedBraceletId] = useState('');
  const [accountBalance, setAccountBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeAction, setActiveAction] = useState('');

  const hasSession = Boolean(localStorage.getItem('access_token'));
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

        if (!hasSession) {
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
  }, [hasSession]);

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

    const storedUser = getStoredUser();
    if (storedUser) {
      persistUserData({
        ...storedUser,
        account_balance: nextBalance,
      });
    }
  };

  const handleRequireSession = () => {
    toast.error('Inicia sesion para usar esta funcionalidad.');
    navigate('/login');
  };

  const handleConsumeAttraction = async (attraction) => {
    if (!hasSession) {
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
      toast.success(result.detail);
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
    if (!hasSession) {
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
      toast.success(result.detail);
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
      <div className="min-h-screen bg-fondoPrincipal px-6 py-16 text-center text-white">
        Cargando atracciones y comidas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondoPrincipal px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        {hasSession ? (
          <section className="mx-auto mb-10 max-w-4xl rounded-lg bg-teal-800/50 px-5 py-4 shadow-lg">
            <div className="grid gap-4 text-sm md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center">
              <label className="block">
                <span className="mb-1 block font-bold">Brazalete activo</span>
                <select
                  value={selectedBraceletId}
                  onChange={(event) => setSelectedBraceletId(event.target.value)}
                  className="w-full rounded bg-fondoInput px-3 py-2 text-white outline-none"
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
                <span className="block font-bold">Usos disponibles</span>
                <span>{selectedBracelet?.attraction_uses_remaining ?? 0}</span>
              </div>
              <div>
                <span className="block font-bold">Saldo brazalete</span>
                <span>{formatCurrency(selectedBracelet?.current_balance)}</span>
              </div>
              <div>
                <span className="block font-bold">Saldo cuenta</span>
                <span>{formatCurrency(accountBalance)}</span>
              </div>
            </div>
          </section>
        ) : null}

        {errorMessage ? (
          <div className="mx-auto mb-8 max-w-3xl rounded bg-red-950/50 px-5 py-3 text-center text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <section>
          <h1 className="text-center font-montserrat text-4xl font-extrabold">
            Atracciones
          </h1>

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
                  !hasSession ||
                  (selectedBracelet &&
                    remainingUses >= requiredUses &&
                    requiredUses > 0);
                const isProcessing = activeAction === `attraction-${attraction.id}`;

                return (
                  <article
                    key={attraction.id}
                    className="mx-auto flex w-full max-w-[280px] flex-col items-center text-center"
                  >
                    <div className="w-full border-4 border-sky-300 bg-sky-300">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={attraction.name}
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center bg-teal-900 text-sm">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <h2 className="mt-2 text-sm font-extrabold text-black">
                      {attraction.name}
                    </h2>
                    <p className="mt-5 min-h-[88px] text-left text-sm font-bold leading-5 text-white">
                      {attraction.description}
                    </p>
                    <p className="mt-4 text-sm font-extrabold">
                      Gasta {formatUsesLabel(requiredUses)}
                    </p>
                    {hasSession && selectedBracelet ? (
                      <p className="mt-1 text-xs text-white/80">
                        Te quedan {remainingUses} usos
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={!canConsume || isProcessing}
                      onClick={() => handleConsumeAttraction(attraction)}
                      className="mt-5 rounded bg-neutral-900 px-8 py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-black disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-white/60"
                    >
                      {isProcessing
                        ? 'Procesando...'
                        : canConsume
                          ? 'Usar Atraccion'
                          : 'Sin usos'}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-28 pb-24">
          <h2 className="text-center font-montserrat text-4xl font-extrabold">
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
                const userBalance = Number(accountBalance ?? 0);
                const foodPrice = Number(food.price ?? 0);
                const canPayWithBracelet =
                  hasSession && selectedBracelet && braceletBalance >= foodPrice;
                const canPayWithAccount =
                  hasSession &&
                  selectedBracelet &&
                  braceletBalance < foodPrice &&
                  userBalance >= foodPrice;
                const paymentSource = canPayWithAccount
                  ? PAYMENT_SOURCE_ACCOUNT
                  : PAYMENT_SOURCE_BRACELET;
                const canBuy =
                  !hasSession ||
                  canPayWithBracelet ||
                  canPayWithAccount;
                const isProcessing =
                  activeAction === `food-${food.id}-${paymentSource}`;

                return (
                  <article
                    key={food.id}
                    className="mx-auto flex w-full max-w-[280px] flex-col items-center text-center"
                  >
                    <div className="w-full border-4 border-red-600 bg-red-600">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={food.name}
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center bg-teal-900 text-sm">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <h3 className="mt-2 text-sm font-extrabold text-black">
                      {food.name}
                    </h3>
                    <p className="mt-4 text-sm font-extrabold">
                      {formatCurrency(food.price)}
                    </p>
                    {hasSession && selectedBracelet ? (
                      <p className="mt-1 min-h-[32px] text-xs text-white/80">
                        Brazalete {formatCurrency(braceletBalance)} / Cuenta{' '}
                        {formatCurrency(userBalance)}
                      </p>
                    ) : (
                      <p className="mt-1 min-h-[32px] text-xs text-white/80">
                        Inicia sesion para comprar
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={!canBuy || isProcessing}
                      onClick={() => handlePurchaseFood(food, paymentSource)}
                      className="mt-5 rounded bg-neutral-900 px-10 py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-black disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-white/60"
                    >
                      {isProcessing
                        ? 'Procesando...'
                        : canPayWithAccount
                          ? 'Pagar con Cuenta'
                          : canBuy
                            ? 'Comprar'
                            : 'Sin saldo'}
                    </button>
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
