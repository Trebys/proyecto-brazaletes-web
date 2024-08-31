import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { ClientePage } from "./pages/ClientePage";
import { AdministradorPage } from "./pages/AdministradorPage";
import { Toaster } from "react-hot-toast";
import { RegistroForm } from "./components/RegistroForm";
import { InicioPage } from "./pages/InicioPage";
import { MasterPageCliente } from "./components/MasterPageCliente";
import { ComprarBrazaletesPage } from "./pages/ComprarBrazaletesPage";
import PrivateRoutes from "./components/PrivateRoutes";
import { PerfilClientePage } from "./pages/PerfilClientePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas sin navbar y footer */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroForm />} />

        {/* Rutas con navbar y footer */}
        <Route
          path="/*"
          element={
            <MasterPageCliente>
              <Routes>
                <Route path="/" element={<Navigate to="/inicio" />} />
                <Route path="/inicio" element={<InicioPage />} />

                {/* Rutas protegidas */}
                <Route element={<PrivateRoutes />}>
                  <Route
                    path="/comprar-brazaletes"
                    element={<ComprarBrazaletesPage />}
                  />
                  <Route path="/mi-perfil" element={<PerfilClientePage />} />
                  <Route path="/cliente" element={<ClientePage />} />
                  <Route
                    path="/administrador"
                    element={<AdministradorPage />}
                  />
                </Route>
              </Routes>
            </MasterPageCliente>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
