import React, { useEffect, useState } from "react";

export function PerfilClientePage() {
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    account_balance: "",
  });

  const [bracelets, setBracelets] = useState([]);

  // Suponiendo que guardas el token en localStorage
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    // Fetch user data and bracelets data from the API
    fetchUserData();
    // fetchBraceletsData(); // Comentado hasta que la API esté disponible
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user-profile", {
        method: "POST", // Cambié de GET a POST porque tu API espera POST
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Agrega el token al encabezado
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData({
          username: data.username,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: "******", // Do not expose the real password, just show ******
          account_balance: data.account_balance,
        });
      } else {
        console.error("Failed to fetch user data:", response.status);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // const fetchBraceletsData = async () => {
  //   try {
  //     const response = await fetch("http://localhost:8000/api/user-bracelets", {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Token ${token}`, // Agrega el token al encabezado
  //       },
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       setBracelets(data);
  //     } else {
  //       console.error("Failed to fetch bracelets data:", response.status);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching bracelets data:", error);
  //   }
  // };

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Submit the updated user data to the API
    try {
      const response = await fetch("http://localhost:8000/api/user-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`, // Agrega el token al encabezado
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        console.log("User data updated successfully");
      } else {
        console.error("Error updating user data");
      }
    } catch (error) {
      console.error("Network error while updating user data:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-center text-2xl font-bold mb-6">Perfil Cliente</h1>
      <div className="max-w-md mx-auto bg-teal-700 p-8 rounded-lg mb-10">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-white mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              value={userData.first_name}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={userData.last_name}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="mb-4">
            <label className="block text-white mb-2">Account Balance</label>
            <input
              type="text"
              name="account_balance"
              value={userData.account_balance}
              onChange={handleChange}
              className="w-full p-2 rounded text-black"
            />
          </div>
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-teal-500 text-white px-4 py-2 rounded"
            >
              Edit Information
            </button>
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>

      {/* Comentado hasta que la API esté disponible */}
      {/* <h2 className="text-center text-2xl font-bold mb-6">My Bracelets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bracelets.map((bracelet, index) => (
          <div key={index} className="bg-blue-500 p-6 rounded-lg">
            <p>
              <strong>Comprador:</strong> {bracelet.comprador}
            </p>
            <p>
              <strong>Número brazaletes:</strong> {bracelet.numero_brazaletes}
            </p>
            <p>
              <strong>Fecha de compra:</strong> {bracelet.fecha_compra}
            </p>
            <p>
              <strong>Tipo:</strong> {bracelet.tipo}
            </p>
            <p>
              <strong>Uso atracciones:</strong> {bracelet.uso_atracciones}
            </p>
            <p>
              <strong>Saldo brazalete:</strong> {bracelet.saldo_brazalete}
            </p>
            <p>
              <strong>Número Compra:</strong> {bracelet.numero_compra}
            </p>
          </div>
        ))}
      </div> */}
    </div>
  );
}
