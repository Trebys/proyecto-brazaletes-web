import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClientData,
  submitClientData,
  deleteClientAccount,
} from '../api/api';
import { useAuth } from '../auth/AuthContext';

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
    try {
      const updatedUser = await submitClientData(userData);
      if (updatedUser) {
        updateUser(updatedUser);
      }
      alert('User data updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Error updating user data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (window.confirm('Estas seguro de eliminar tu cuenta?')) {
        await deleteClientAccount();
        clearAuth();
        alert('Cuenta eliminada con exito.');
        navigate('/inicio', { replace: true });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
    }
  };

  return (
    <div className="surface-card mx-auto mb-10 max-w-xl p-6 md:p-8">
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
              className="form-input"
            />
          </div>
        ))}

        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <button
            type="submit"
            className="btn-primary"
          >
            Editar Informacion
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-red-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-800"
            onClick={handleDeleteAccount}
          >
            Eliminar Cuenta
          </button>
        </div>
      </form>
    </div>
  );
}
