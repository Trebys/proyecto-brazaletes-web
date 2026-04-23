import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  Logout,
  buildMediaUrl,
  createAdminAttraction,
  createAdminBracelet,
  createAdminBraceletType,
  createAdminClient,
  createAdminFood,
  deleteAdminAttraction,
  deleteAdminBracelet,
  deleteAdminBraceletType,
  deleteAdminClient,
  deleteAdminFood,
  deleteAdminReceipt,
  getAdminBracelets,
  getAdminBraceletTypes,
  getAdminClients,
  getAdminReceipts,
  getAttractions,
  getFoods,
  getStoredUser,
  updateAdminAttraction,
  updateAdminBracelet,
  updateAdminBraceletType,
  updateAdminClient,
  updateAdminFood,
  updateAdminReceipt,
} from '../api/api';

const ADMIN_SECTIONS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'brazaletes', label: 'Brazaletes' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'comidas', label: 'Comidas' },
  { id: 'atracciones', label: 'Atracciones' },
];

const RECEIPT_STATUSES = ['PENDING', 'APPROVED', 'CAPTURED', 'REFUNDED'];

const initialClientForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  account_balance: '0.00',
};

const initialBraceletForm = {
  bracelet_type_id: '',
  current_balance: '0.00',
  attraction_uses_remaining: '0',
};

const initialBraceletTypeForm = {
  name: '',
  price: '0.00',
  food_balance: '0.00',
  attraction_uses: '0',
  description: '',
  image: null,
  is_active: true,
};

const initialFoodForm = {
  name: '',
  description: '',
  price: '0.00',
  photo: null,
};

const initialAttractionForm = {
  name: '',
  description: '',
  usage_points: '1',
  photo: null,
};

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

const buildFormData = (values, fileField = 'photo') => {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (key === fileField && !value) {
      return;
    }

    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  return formData;
};

function AdminButton({ children, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-neutral-900 text-white hover:bg-black',
    ghost: 'border border-white/40 text-white hover:bg-white/10',
    danger: 'bg-red-800 text-white hover:bg-red-900',
  };

  return (
    <button
      type="button"
      className={`min-h-10 rounded px-4 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

function TextField({ label, name, value, onChange, type = 'text', required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/75">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        required={required}
        onChange={onChange}
        className="w-full rounded border border-white/10 bg-fondoInput px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
      />
    </label>
  );
}

function FileField({ label, name, onChange, required = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/75">
        {label}
      </span>
      <input
        type="file"
        name={name}
        required={required}
        accept="image/*"
        onChange={onChange}
        className="w-full rounded border border-white/10 bg-fondoInput px-3 py-2 text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-neutral-900 file:px-3 file:py-1 file:text-white"
      />
    </label>
  );
}

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-neutral-200 text-neutral-800',
    success: 'bg-emerald-100 text-emerald-900',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-900',
    info: 'bg-cyan-100 text-cyan-900',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function getNestedValue(row, path) {
  if (!path) {
    return '';
  }

  return path.split('.').reduce((value, key) => value?.[key], row);
}

function getSortValue(row, column) {
  if (column.sortValue) {
    return column.sortValue(row);
  }

  return getNestedValue(row, column.key);
}

function compareValues(firstValue, secondValue) {
  const firstNumber = Number(firstValue);
  const secondNumber = Number(secondValue);

  if (!Number.isNaN(firstNumber) && !Number.isNaN(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'es', {
    numeric: true,
    sensitivity: 'base',
  });
}

function DataTable({ columns, rows, emptyText, title }) {
  const [searchValue, setSearchValue] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: columns[0]?.key || '', direction: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const searchableRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(normalizedSearch)
    );
  }, [rows, searchValue]);

  const sortedRows = useMemo(() => {
    const sortableColumn = columns.find((column) => column.key === sortConfig.key);

    if (!sortableColumn || sortableColumn.sortable === false) {
      return searchableRows;
    }

    return [...searchableRows].sort((firstRow, secondRow) => {
      const order = compareValues(
        getSortValue(firstRow, sortableColumn),
        getSortValue(secondRow, sortableColumn)
      );

      return sortConfig.direction === 'asc' ? order : -order;
    });
  }, [columns, searchableRows, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const pageStart = (safeCurrentPage - 1) * pageSize;
  const pageRows = sortedRows.slice(pageStart, pageStart + pageSize);
  const firstVisibleRow = sortedRows.length === 0 ? 0 : pageStart + 1;
  const lastVisibleRow = Math.min(pageStart + pageSize, sortedRows.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, pageSize, rows]);

  const handleSort = (column) => {
    if (column.sortable === false) {
      return;
    }

    setSortConfig((current) => {
      if (current.key === column.key) {
        return {
          key: column.key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key: column.key, direction: 'asc' };
    });
  };

  return (
    <div className="overflow-hidden rounded border border-white/20 bg-white text-neutral-950 shadow-lg">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-neutral-950">{title}</h2>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            {sortedRows.length} registros
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
              Buscar
            </span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-10 w-64 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-fondoLogin"
              placeholder="ID, nombre, correo, codigo..."
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-neutral-500">
              Filas
            </span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-10 rounded border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-fondoLogin"
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-neutral-100">
              {columns.map((column) => {
                const isSorted = sortConfig.key === column.key;
                const sortIcon = isSorted
                  ? sortConfig.direction === 'asc'
                    ? '\u2191'
                    : '\u2193'
                  : '\u2195';

                return (
                  <th key={column.key} className="border-b border-neutral-300 px-4 py-3 font-extrabold">
                    <button
                      type="button"
                      disabled={column.sortable === false}
                      onClick={() => handleSort(column)}
                      className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-default"
                    >
                      <span>{column.label}</span>
                      {column.sortable === false ? null : (
                        <span className="text-base leading-none text-neutral-500">{sortIcon}</span>
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-neutral-600" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-200 transition hover:bg-cyan-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.render ? column.render(row) : getNestedValue(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        <span>
          Mostrando {firstVisibleRow}-{lastVisibleRow} de {sortedRows.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="rounded border border-neutral-300 px-3 py-1 font-bold text-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-bold text-neutral-800">
            {safeCurrentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={safeCurrentPage === pageCount}
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            className="rounded border border-neutral-300 px-3 py-1 font-bold text-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

function CatalogPreview({ item, kind }) {
  const imageUrl = buildMediaUrl(item.image_url || item.image || item.photo_url || item.photo);

  return (
    <div className="flex items-center gap-3">
      <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-teal-900">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div>
        <p className="font-bold">{item.name}</p>
        <p className="text-xs text-neutral-600">{kind}</p>
      </div>
    </div>
  );
}

export function AdministradorPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [activeSection, setActiveSection] = useState('resumen');
  const [clients, setClients] = useState([]);
  const [bracelets, setBracelets] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [braceletTypes, setBraceletTypes] = useState([]);
  const [foods, setFoods] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [selectedBraceletTypeId, setSelectedBraceletTypeId] = useState('');
  const [braceletTypeForm, setBraceletTypeForm] = useState(initialBraceletTypeForm);
  const [selectedBraceletId, setSelectedBraceletId] = useState('');
  const [braceletForm, setBraceletForm] = useState(initialBraceletForm);
  const [selectedReceiptId, setSelectedReceiptId] = useState('');
  const [receiptStatus, setReceiptStatus] = useState('CAPTURED');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [foodForm, setFoodForm] = useState(initialFoodForm);
  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [attractionForm, setAttractionForm] = useState(initialAttractionForm);

  const adminUser = getStoredUser();

  const loadAdminData = async () => {
    setLoading(true);

    try {
      const [
        clientsData,
        braceletsData,
        receiptsData,
        braceletTypesData,
        foodsData,
        attractionsData,
      ] = await Promise.all([
        getAdminClients(),
        getAdminBracelets(),
        getAdminReceipts(),
        getAdminBraceletTypes(),
        getFoods(),
        getAttractions(),
      ]);

      setClients(normalizeList(clientsData));
      setBracelets(normalizeList(braceletsData));
      setReceipts(normalizeList(receiptsData));
      setBraceletTypes(normalizeList(braceletTypesData));
      setFoods(normalizeList(foodsData));
      setAttractions(normalizeList(attractionsData));
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('No se pudo cargar el panel administrativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogout = async () => {
    await Logout();
    navigate('/login');
  };

  const handleDelete = async (message, action) => {
    if (!window.confirm(message)) {
      return;
    }

    setSaving(true);
    try {
      await action();
      await loadAdminData();
      toast.success('Registro eliminado.');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('No se pudo eliminar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const handleClientChange = (event) => {
    setClientForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleClientSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (selectedClientId) {
        const { password, ...payload } = clientForm;
        await updateAdminClient(selectedClientId, payload);
        toast.success('Cliente actualizado.');
      } else {
        await createAdminClient(clientForm);
        toast.success('Cliente registrado.');
      }

      setSelectedClientId('');
      setClientForm(initialClientForm);
      await loadAdminData();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  const editClient = (client) => {
    setSelectedClientId(String(client.id));
    setClientForm({
      username: client.username || '',
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      email: client.email || '',
      password: '',
      account_balance: client.account_balance ?? '0.00',
    });
  };

  const handleBraceletChange = (event) => {
    setBraceletForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleBraceletSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (selectedBraceletId) {
        await updateAdminBracelet(selectedBraceletId, braceletForm);
        toast.success('Brazalete actualizado.');
      } else {
        await createAdminBracelet(braceletForm);
        toast.success('Brazalete creado.');
      }

      setSelectedBraceletId('');
      setBraceletForm(initialBraceletForm);
      await loadAdminData();
    } catch (error) {
      console.error('Error saving bracelet:', error);
      toast.error('No se pudo guardar el brazalete.');
    } finally {
      setSaving(false);
    }
  };

  const editBracelet = (bracelet) => {
    setSelectedBraceletId(String(bracelet.id));
    setBraceletForm({
      bracelet_type_id: bracelet.bracelet_type?.id || '',
      current_balance: bracelet.current_balance ?? '0.00',
      attraction_uses_remaining: bracelet.attraction_uses_remaining ?? '0',
    });
  };

  const handleBraceletTypeChange = (event) => {
    const { name, type, checked, value, files } = event.target;
    const nextValue = type === 'file' ? files[0] : type === 'checkbox' ? checked : value;

    setBraceletTypeForm((current) => ({
      ...current,
      [name]: nextValue,
    }));
  };

  const handleBraceletTypeSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildFormData(braceletTypeForm, 'image');

      if (selectedBraceletTypeId) {
        await updateAdminBraceletType(selectedBraceletTypeId, payload);
        toast.success('Tipo de brazalete actualizado.');
      } else {
        await createAdminBraceletType(payload);
        toast.success('Tipo de brazalete creado.');
      }

      setSelectedBraceletTypeId('');
      setBraceletTypeForm(initialBraceletTypeForm);
      await loadAdminData();
    } catch (error) {
      console.error('Error saving bracelet type:', error);
      toast.error('No se pudo guardar el tipo de brazalete.');
    } finally {
      setSaving(false);
    }
  };

  const editBraceletType = (braceletType) => {
    setSelectedBraceletTypeId(String(braceletType.id));
    setBraceletTypeForm({
      name: braceletType.name || '',
      price: braceletType.price ?? '0.00',
      food_balance: braceletType.food_balance ?? '0.00',
      attraction_uses: braceletType.attraction_uses ?? '0',
      description: braceletType.description || '',
      image: null,
      is_active: Boolean(braceletType.is_active),
    });
  };

  const toggleBraceletTypeActive = async (braceletType) => {
    setSaving(true);
    try {
      await updateAdminBraceletType(braceletType.id, {
        is_active: !braceletType.is_active,
      });
      await loadAdminData();
      toast.success(braceletType.is_active ? 'Tipo desactivado.' : 'Tipo activado.');
    } catch (error) {
      console.error('Error updating bracelet type status:', error);
      toast.error('No se pudo cambiar el estado del tipo.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptSubmit = async (event) => {
    event.preventDefault();

    if (!selectedReceiptId) {
      toast.error('Selecciona una venta para editar.');
      return;
    }

    setSaving(true);
    try {
      await updateAdminReceipt(selectedReceiptId, { status: receiptStatus });
      setSelectedReceiptId('');
      setReceiptStatus('CAPTURED');
      await loadAdminData();
      toast.success('Venta actualizada.');
    } catch (error) {
      console.error('Error updating receipt:', error);
      toast.error('No se pudo actualizar la venta.');
    } finally {
      setSaving(false);
    }
  };

  const editReceipt = (receipt) => {
    setSelectedReceiptId(String(receipt.id));
    setReceiptStatus(receipt.status || 'CAPTURED');
  };

  const handleFoodChange = (event) => {
    const value = event.target.type === 'file' ? event.target.files[0] : event.target.value;
    setFoodForm((current) => ({
      ...current,
      [event.target.name]: value,
    }));
  };

  const handleFoodSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildFormData(foodForm);
      if (selectedFoodId) {
        await updateAdminFood(selectedFoodId, payload);
        toast.success('Comida actualizada.');
      } else {
        await createAdminFood(payload);
        toast.success('Comida creada.');
      }

      setSelectedFoodId('');
      setFoodForm(initialFoodForm);
      await loadAdminData();
    } catch (error) {
      console.error('Error saving food:', error);
      toast.error('No se pudo guardar la comida.');
    } finally {
      setSaving(false);
    }
  };

  const editFood = (food) => {
    setSelectedFoodId(String(food.id));
    setFoodForm({
      name: food.name || '',
      description: food.description || '',
      price: food.price ?? '0.00',
      photo: null,
    });
  };

  const handleAttractionChange = (event) => {
    const value = event.target.type === 'file' ? event.target.files[0] : event.target.value;
    setAttractionForm((current) => ({
      ...current,
      [event.target.name]: value,
    }));
  };

  const handleAttractionSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildFormData(attractionForm);
      if (selectedAttractionId) {
        await updateAdminAttraction(selectedAttractionId, payload);
        toast.success('Atraccion actualizada.');
      } else {
        await createAdminAttraction(payload);
        toast.success('Atraccion creada.');
      }

      setSelectedAttractionId('');
      setAttractionForm(initialAttractionForm);
      await loadAdminData();
    } catch (error) {
      console.error('Error saving attraction:', error);
      toast.error('No se pudo guardar la atraccion.');
    } finally {
      setSaving(false);
    }
  };

  const editAttraction = (attraction) => {
    setSelectedAttractionId(String(attraction.id));
    setAttractionForm({
      name: attraction.name || '',
      description: attraction.description || '',
      usage_points: attraction.usage_points ?? '1',
      photo: null,
    });
  };

  const totals = {
    clients: clients.filter((client) => !client.is_staff).length,
    bracelets: bracelets.length,
    receipts: receipts.length,
    income: receipts.reduce((sum, receipt) => sum + Number(receipt.amount_paid || 0), 0),
  };

  return (
    <div className="flex min-h-screen flex-col bg-fondoPrincipal text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-fondoLogin px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveSection('resumen')}
            className="flex items-center gap-3"
          >
            <img src="/images/logo.svg" alt="Fantasy Land Logo" className="h-10" />
            <span className="text-left text-xl font-extrabold leading-5">
              Fantasy<br />Land
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`rounded px-3 py-2 text-sm font-extrabold transition ${
                  activeSection === section.id
                    ? 'bg-cyan-500 text-fondoLogin'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/mi-perfil')}
              className="flex items-center rounded-full bg-white px-3 py-1 text-fondoLogin"
            >
              <img src="/images/perfil.svg" alt="Perfil" className="mr-2 h-5 w-5" />
              {adminUser?.username || 'Admin'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-600 px-3 py-1 text-white"
            >
              Cerrar Sesion
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8">
        <header className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">
            Panel operativo
          </p>
          <h1 className="mt-3 font-montserrat text-3xl font-extrabold md:text-5xl">
            Sistema de Gestion FantasyLand
          </h1>
        </header>

        {loading ? (
          <div className="py-24 text-center text-lg font-bold">Cargando panel...</div>
        ) : (
          <>
            <section className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="rounded bg-teal-950/70 p-5">
                <p className="text-sm text-white/70">Clientes</p>
                <p className="mt-2 text-3xl font-extrabold">{totals.clients}</p>
              </div>
              <div className="rounded bg-teal-950/70 p-5">
                <p className="text-sm text-white/70">Brazaletes</p>
                <p className="mt-2 text-3xl font-extrabold">{totals.bracelets}</p>
              </div>
              <div className="rounded bg-teal-950/70 p-5">
                <p className="text-sm text-white/70">Tipos activos</p>
                <p className="mt-2 text-3xl font-extrabold">
                  {braceletTypes.filter((type) => type.is_active).length}
                </p>
              </div>
              <div className="rounded bg-teal-950/70 p-5">
                <p className="text-sm text-white/70">Ventas</p>
                <p className="mt-2 text-3xl font-extrabold">{totals.receipts}</p>
              </div>
              <div className="rounded bg-teal-950/70 p-5">
                <p className="text-sm text-white/70">Ingresos registrados</p>
                <p className="mt-2 text-3xl font-extrabold">{formatCurrency(totals.income)}</p>
              </div>
            </section>

            {activeSection === 'resumen' ? (
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('clientes')}
                  className="rounded bg-neutral-900 p-8 text-left shadow-lg transition hover:bg-black"
                >
                  <span className="text-2xl font-extrabold">Gestionar clientes</span>
                  <span className="mt-3 block text-sm text-white/70">
                    Alta, consulta, saldo y baja de cuentas de cliente.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('brazaletes')}
                  className="rounded bg-neutral-900 p-8 text-left shadow-lg transition hover:bg-black"
                >
                  <span className="text-2xl font-extrabold">Gestionar brazaletes</span>
                  <span className="mt-3 block text-sm text-white/70">
                    Catalogo de tipos, brazaletes emitidos, saldos y usos.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('ventas')}
                  className="rounded bg-neutral-900 p-8 text-left shadow-lg transition hover:bg-black"
                >
                  <span className="text-2xl font-extrabold">Gestionar ventas</span>
                  <span className="mt-3 block text-sm text-white/70">
                    Revision de recibos, metodos de pago, estado y montos.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('comidas')}
                  className="rounded bg-neutral-900 p-8 text-left shadow-lg transition hover:bg-black"
                >
                  <span className="text-2xl font-extrabold">Gestionar comidas</span>
                  <span className="mt-3 block text-sm text-white/70">
                    Alta, edicion, precios e imagenes del catalogo de comidas.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('atracciones')}
                  className="rounded bg-neutral-900 p-8 text-left shadow-lg transition hover:bg-black"
                >
                  <span className="text-2xl font-extrabold">Gestionar atracciones</span>
                  <span className="mt-3 block text-sm text-white/70">
                    Alta, edicion, usos requeridos e imagenes del catalogo.
                  </span>
                </button>
              </section>
            ) : null}

            {activeSection === 'brazaletes' ? (
              <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
                <DataTable
                  title="Tipos de brazalete"
                  emptyText="No hay tipos de brazalete registrados."
                  rows={braceletTypes}
                  columns={[
                    {
                      key: 'name',
                      label: 'Tipo',
                      render: (type) => <CatalogPreview item={type} kind="Tipo de brazalete" />,
                    },
                    {
                      key: 'price',
                      label: 'Precio',
                      render: (type) => formatCurrency(type.price),
                      sortValue: (type) => Number(type.price || 0),
                    },
                    {
                      key: 'food_balance',
                      label: 'Saldo comida',
                      render: (type) => formatCurrency(type.food_balance),
                      sortValue: (type) => Number(type.food_balance || 0),
                    },
                    {
                      key: 'attraction_uses',
                      label: 'Usos',
                      sortValue: (type) => Number(type.attraction_uses || 0),
                    },
                    {
                      key: 'is_active',
                      label: 'Estado',
                      render: (type) => (
                        <Badge tone={type.is_active ? 'success' : 'neutral'}>
                          {type.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      ),
                      sortValue: (type) => (type.is_active ? 'Activo' : 'Inactivo'),
                    },
                    { key: 'description', label: 'Descripcion' },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (type) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editBraceletType(type)}>Editar</AdminButton>
                          <AdminButton onClick={() => toggleBraceletTypeActive(type)} disabled={saving}>
                            {type.is_active ? 'Desactivar' : 'Activar'}
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() =>
                              handleDelete('Eliminar este tipo de brazalete?', () =>
                                deleteAdminBraceletType(type.id)
                              )
                            }
                          >
                            Eliminar
                          </AdminButton>
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleBraceletTypeSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">
                    {selectedBraceletTypeId ? 'Editar tipo' : 'Crear tipo'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <TextField label="Nombre" name="name" value={braceletTypeForm.name} onChange={handleBraceletTypeChange} required />
                    <TextField label="Precio" name="price" type="number" value={braceletTypeForm.price} onChange={handleBraceletTypeChange} required />
                    <TextField label="Saldo comida" name="food_balance" type="number" value={braceletTypeForm.food_balance} onChange={handleBraceletTypeChange} required />
                    <TextField label="Usos de atraccion" name="attraction_uses" type="number" value={braceletTypeForm.attraction_uses} onChange={handleBraceletTypeChange} required />
                    <TextField label="Descripcion" name="description" value={braceletTypeForm.description} onChange={handleBraceletTypeChange} />
                    <FileField label="Imagen" name="image" onChange={handleBraceletTypeChange} required={!selectedBraceletTypeId} />
                    <label className="flex items-center gap-3 rounded border border-white/10 bg-fondoInput px-3 py-2 text-sm font-bold text-white">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={braceletTypeForm.is_active}
                        onChange={handleBraceletTypeChange}
                        className="h-4 w-4"
                      />
                      Disponible para compra
                    </label>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedBraceletTypeId('');
                        setBraceletTypeForm(initialBraceletTypeForm);
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}

            {activeSection === 'clientes' ? (
              <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <DataTable
                  title="Clientes registrados"
                  emptyText="No hay clientes registrados."
                  rows={clients}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'username', label: 'Usuario' },
                    { key: 'first_name', label: 'Nombre' },
                    { key: 'last_name', label: 'Apellido' },
                    { key: 'email', label: 'Correo' },
                    {
                      key: 'account_balance',
                      label: 'Saldo',
                      render: (client) => formatCurrency(client.account_balance),
                      sortValue: (client) => Number(client.account_balance || 0),
                    },
                    {
                      key: 'role',
                      label: 'Rol',
                      render: (client) => (
                        <Badge tone={client.is_staff ? 'info' : 'neutral'}>
                          {client.is_staff ? 'Admin' : 'Cliente'}
                        </Badge>
                      ),
                      sortValue: (client) => (client.is_staff ? 'Admin' : 'Cliente'),
                    },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (client) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editClient(client)}>Editar</AdminButton>
                          {!client.is_staff ? (
                            <AdminButton
                              variant="danger"
                              onClick={() =>
                                handleDelete('Eliminar este cliente?', () =>
                                  deleteAdminClient(client.id)
                                )
                              }
                            >
                              Eliminar
                            </AdminButton>
                          ) : null}
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleClientSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">
                    {selectedClientId ? 'Editar cliente' : 'Registrar cliente'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <TextField label="Usuario" name="username" value={clientForm.username} onChange={handleClientChange} required />
                    <TextField label="Nombre" name="first_name" value={clientForm.first_name} onChange={handleClientChange} required />
                    <TextField label="Apellido" name="last_name" value={clientForm.last_name} onChange={handleClientChange} required />
                    <TextField label="Correo" name="email" type="email" value={clientForm.email} onChange={handleClientChange} required />
                    {!selectedClientId ? (
                      <TextField label="Contrasena" name="password" type="password" value={clientForm.password} onChange={handleClientChange} required />
                    ) : null}
                    <TextField label="Saldo de cuenta" name="account_balance" type="number" value={clientForm.account_balance} onChange={handleClientChange} />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedClientId('');
                        setClientForm(initialClientForm);
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}

            {activeSection === 'brazaletes' ? (
              <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <DataTable
                  title="Brazaletes registrados"
                  emptyText="No hay brazaletes registrados."
                  rows={bracelets}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'bracelet_code', label: 'Codigo' },
                    {
                      key: 'type',
                      label: 'Tipo',
                      render: (bracelet) => bracelet.bracelet_type?.name || 'Sin tipo',
                      sortValue: (bracelet) => bracelet.bracelet_type?.name || '',
                    },
                    {
                      key: 'current_balance',
                      label: 'Saldo',
                      render: (bracelet) => formatCurrency(bracelet.current_balance),
                      sortValue: (bracelet) => Number(bracelet.current_balance || 0),
                    },
                    {
                      key: 'attraction_uses_remaining',
                      label: 'Usos',
                      sortValue: (bracelet) => Number(bracelet.attraction_uses_remaining || 0),
                    },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (bracelet) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editBracelet(bracelet)}>Editar</AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() =>
                              handleDelete('Eliminar este brazalete?', () =>
                                deleteAdminBracelet(bracelet.id)
                              )
                            }
                          >
                            Eliminar
                          </AdminButton>
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleBraceletSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">
                    {selectedBraceletId ? 'Editar brazalete' : 'Crear brazalete'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/75">
                        Tipo
                      </span>
                      <select
                        name="bracelet_type_id"
                        value={braceletForm.bracelet_type_id}
                        required
                        onChange={handleBraceletChange}
                        className="w-full rounded border border-white/10 bg-fondoInput px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                      >
                        <option value="">Seleccionar tipo</option>
                        {braceletTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}{type.is_active ? '' : ' (inactivo)'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TextField label="Saldo" name="current_balance" type="number" value={braceletForm.current_balance} onChange={handleBraceletChange} />
                    <TextField label="Usos restantes" name="attraction_uses_remaining" type="number" value={braceletForm.attraction_uses_remaining} onChange={handleBraceletChange} />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedBraceletId('');
                        setBraceletForm(initialBraceletForm);
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}

            {activeSection === 'ventas' ? (
              <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <DataTable
                  title="Ventas registradas"
                  emptyText="No hay ventas registradas."
                  rows={receipts}
                  columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'purchase_code', label: 'Codigo' },
                    {
                      key: 'user',
                      label: 'Cliente',
                      render: (receipt) => receipt.user?.username || `Usuario ${receipt.user?.id || ''}`,
                      sortValue: (receipt) => receipt.user?.username || '',
                    },
                    {
                      key: 'bracelet',
                      label: 'Brazalete',
                      render: (receipt) => receipt.bracelet?.bracelet_code || 'Sin codigo',
                      sortValue: (receipt) => receipt.bracelet?.bracelet_code || '',
                    },
                    {
                      key: 'purchase_date',
                      label: 'Fecha',
                      render: (receipt) => formatDate(receipt.purchase_date),
                      sortValue: (receipt) => new Date(receipt.purchase_date || 0).getTime(),
                    },
                    {
                      key: 'amount_paid',
                      label: 'Monto',
                      render: (receipt) => formatCurrency(receipt.amount_paid),
                      sortValue: (receipt) => Number(receipt.amount_paid || 0),
                    },
                    { key: 'payment_method', label: 'Metodo' },
                    {
                      key: 'status',
                      label: 'Estado',
                      render: (receipt) => (
                        <Badge
                          tone={
                            receipt.status === 'CAPTURED'
                              ? 'success'
                              : receipt.status === 'REFUNDED'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {receipt.status}
                        </Badge>
                      ),
                    },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (receipt) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editReceipt(receipt)}>Editar</AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() =>
                              handleDelete('Eliminar esta venta?', () =>
                                deleteAdminReceipt(receipt.id)
                              )
                            }
                          >
                            Eliminar
                          </AdminButton>
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleReceiptSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">Editar estado de venta</h2>
                  <p className="mt-2 text-sm text-white/70">
                    Venta seleccionada: {selectedReceiptId || 'ninguna'}
                  </p>
                  <label className="mt-4 block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-white/75">
                      Estado
                    </span>
                    <select
                      value={receiptStatus}
                      onChange={(event) => setReceiptStatus(event.target.value)}
                      className="w-full rounded border border-white/10 bg-fondoInput px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
                    >
                      {RECEIPT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedReceiptId('');
                        setReceiptStatus('CAPTURED');
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}

            {activeSection === 'comidas' ? (
              <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <DataTable
                  title="Comidas registradas"
                  emptyText="No hay comidas registradas."
                  rows={foods}
                  columns={[
                    {
                      key: 'name',
                      label: 'Comida',
                      render: (food) => <CatalogPreview item={food} kind="Comida" />,
                    },
                    { key: 'description', label: 'Descripcion' },
                    {
                      key: 'price',
                      label: 'Precio',
                      render: (food) => formatCurrency(food.price),
                      sortValue: (food) => Number(food.price || 0),
                    },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (food) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editFood(food)}>Editar</AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() =>
                              handleDelete('Eliminar esta comida?', () =>
                                deleteAdminFood(food.id)
                              )
                            }
                          >
                            Eliminar
                          </AdminButton>
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleFoodSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">
                    {selectedFoodId ? 'Editar comida' : 'Crear comida'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <TextField label="Nombre" name="name" value={foodForm.name} onChange={handleFoodChange} required />
                    <TextField label="Descripcion" name="description" value={foodForm.description} onChange={handleFoodChange} required />
                    <TextField label="Precio" name="price" type="number" value={foodForm.price} onChange={handleFoodChange} required />
                    <FileField label="Imagen" name="photo" onChange={handleFoodChange} required={!selectedFoodId} />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedFoodId('');
                        setFoodForm(initialFoodForm);
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}

            {activeSection === 'atracciones' ? (
              <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <DataTable
                  title="Atracciones registradas"
                  emptyText="No hay atracciones registradas."
                  rows={attractions}
                  columns={[
                    {
                      key: 'name',
                      label: 'Atraccion',
                      render: (attraction) => <CatalogPreview item={attraction} kind="Atraccion" />,
                    },
                    { key: 'description', label: 'Descripcion' },
                    {
                      key: 'usage_points',
                      label: 'Usos requeridos',
                      sortValue: (attraction) => Number(attraction.usage_points || 0),
                    },
                    {
                      key: 'actions',
                      label: 'Acciones',
                      sortable: false,
                      render: (attraction) => (
                        <div className="flex flex-wrap gap-2">
                          <AdminButton onClick={() => editAttraction(attraction)}>Editar</AdminButton>
                          <AdminButton
                            variant="danger"
                            onClick={() =>
                              handleDelete('Eliminar esta atraccion?', () =>
                                deleteAdminAttraction(attraction.id)
                              )
                            }
                          >
                            Eliminar
                          </AdminButton>
                        </div>
                      ),
                    },
                  ]}
                />

                <form onSubmit={handleAttractionSubmit} className="rounded bg-teal-950/70 p-5">
                  <h2 className="text-xl font-extrabold">
                    {selectedAttractionId ? 'Editar atraccion' : 'Crear atraccion'}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <TextField label="Nombre" name="name" value={attractionForm.name} onChange={handleAttractionChange} required />
                    <TextField label="Descripcion" name="description" value={attractionForm.description} onChange={handleAttractionChange} required />
                    <TextField label="Usos requeridos" name="usage_points" type="number" value={attractionForm.usage_points} onChange={handleAttractionChange} required />
                    <FileField label="Imagen" name="photo" onChange={handleAttractionChange} required={!selectedAttractionId} />
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminButton type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</AdminButton>
                    <AdminButton
                      variant="ghost"
                      onClick={() => {
                        setSelectedAttractionId('');
                        setAttractionForm(initialAttractionForm);
                      }}
                    >
                      Limpiar
                    </AdminButton>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        )}
      </main>

      <footer className="bg-fondoLogin px-4 py-6 text-center">
        <img src="/images/logo.svg" alt="Fantasy Land Logo" className="mx-auto h-14" />
        <p className="mt-2 text-lg font-extrabold">Fantasy Land System</p>
        <p className="text-sm font-extrabold text-white">&copy; Fantasy Land {currentYear}</p>
      </footer>
    </div>
  );
}
