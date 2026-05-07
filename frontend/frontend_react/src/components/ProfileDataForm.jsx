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
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-teal-50 shadow-md">
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
          <label className="w-full">
            <span className="form-label text-center">Imagen de perfil</span>
            <input
              type="file"
              name="profile_image"
              accept="image/*"
              onChange={handleChange}
              className="form-input file:mr-3 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-1 file:text-white"
            />
          </label>
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
