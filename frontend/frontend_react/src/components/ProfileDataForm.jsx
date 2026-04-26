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
  });

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
        });
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
    setUserData({ ...userData, [e.target.name]: e.target.value });
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
    <div className="bg-teal-700 p-8 rounded-lg mb-10 max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div className="mb-4" key={field.name}>
            <label className="block text-white mb-2">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={userData[field.name] ?? ''}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
        ))}

        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-teal-500 text-white px-4 py-2 rounded"
          >
            Editar Informacion
          </button>
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleDeleteAccount}
          >
            Eliminar Cuenta
          </button>
        </div>
      </form>
    </div>
  );
}
