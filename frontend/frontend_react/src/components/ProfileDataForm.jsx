import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getClientData,
  submitClientData,
  deleteClientAccount,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';
import ModalMessage from './ModalMessage';

const formatApiError = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return 'No se pudieron actualizar tus datos. Intenta de nuevo.';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (data.message || data.detail || data.error) {
    return data.message || data.detail || data.error;
  }

  return Object.entries(data)
    .map(([field, messages]) => {
      const text = Array.isArray(messages) ? messages.join(' ') : String(messages);
      return `${field}: ${text}`;
    })
    .join(' ');
};

export function ProfileDataForm() {
  const navigate = useNavigate();
  const { updateUser, clearAuth } = useAuth();
  const [userData, setUserData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    account_balance: '',
    profile_image: null,
  });
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await getClientData();
        setUserData({
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: '******',
          account_balance: data.account_balance,
          profile_image: null,
        });
        setProfileImagePreview(data.profile_image_url || '');
        updateUser(data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('No se pudieron cargar tus datos. Recarga la pagina.');
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [updateUser]);

  const fields = [
    { name: 'username', label: 'Usuario', type: 'text' },
    { name: 'first_name', label: 'Nombre', type: 'text' },
    { name: 'last_name', label: 'Apellido', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'password', label: 'Contrasena', type: 'password' },
    { name: 'account_balance', label: 'Saldo de Cuenta', type: 'text' },
  ];

  const handleChange = (e) => {
    const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
    setUserData({ ...userData, [e.target.name]: value });

    if (e.target.type === 'file' && value) {
      setProfileImagePreview(URL.createObjectURL(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || saving) {
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await submitClientData(userData);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      toast.success('Datos actualizados correctamente.');
    } catch (error) {
      console.error('Error updating user data:', error);
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteModalVisible(false);
    try {
      await deleteClientAccount();
      clearAuth();
      toast.success('Cuenta eliminada con exito.');
      navigate('/inicio', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('No se pudo eliminar la cuenta.');
    }
  };

  return (
    <div className="surface-card mx-auto mb-10 max-w-xl p-6 md:p-8">
      <ModalMessage
        visible={deleteModalVisible}
        title="Eliminar cuenta"
        message="Esta accion desactivara tu cuenta y cerrara la sesion actual. Tus datos de acceso se eliminaran, pero el historial de compras y recibos puede conservarse como registro operativo. Deseas continuar?"
        variant="danger"
        confirmLabel="Eliminar"
        cancelLabel="Conservar cuenta"
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteAccount}
      />
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative h-28 w-28">
            <div className="h-full w-full overflow-hidden rounded-full border-4 border-white bg-teal-50 shadow-md">
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Imagen de perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src="/images/perfil.svg"
                  alt=""
                  className="h-full w-full bg-white object-contain p-5"
                />
              )}
            </div>
            <label
              htmlFor="profile_image"
              aria-label="Editar imagen de perfil"
              title="Editar imagen de perfil"
              className="absolute bottom-1 right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-teal-700 text-white shadow-md transition hover:bg-teal-800"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </label>
            <input
              id="profile_image"
              type="file"
              name="profile_image"
              accept="image/*"
              onChange={handleChange}
              disabled={loading || saving}
              className="sr-only"
            />
          </div>
          <p className="text-sm font-bold text-teal-950">Imagen de perfil</p>
        </div>

        {fields.map((field) => (
          <div className="mb-4" key={field.name}>
            <label className="form-label">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={userData[field.name] ?? ''}
              onChange={handleChange}
              disabled={loading || saving}
              className="form-input"
            />
          </div>
        ))}

        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading || saving}
            className="btn-primary"
          >
            {loading ? 'Cargando datos...' : saving ? 'Guardando...' : 'Editar Informacion'}
          </button>
          <button
            type="button"
            disabled={loading || saving}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-800"
            onClick={() => setDeleteModalVisible(true)}
          >
            Eliminar Cuenta
          </button>
        </div>
      </form>
    </div>
  );
}
