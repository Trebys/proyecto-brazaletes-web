import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdministradorPage } from './pages/AdministradorPage';
import { Toaster } from 'react-hot-toast';
import { RegistroForm } from './components/RegistroForm';
import { InicioPage } from './pages/InicioPage';
import { MasterPageCliente } from './components/MasterPageCliente';
import { ComprarBrazaletesPage } from './pages/ComprarBrazaletesPage';
import PrivateRoutes from './components/PrivateRoutes';
import { PerfilClientePage } from './pages/PerfilClientePage';
import { AtraccionesComidasPage } from './pages/AtraccionesComidasPage';
import { ContactoPage } from './pages/ContactoPage';
import { SobreNosotrosPage } from './pages/SobreNosotrosPage';
import { TerminosCondicionesPage } from './pages/TerminosCondicionesPage';
import { ReciboCompraPage } from './pages/ReciboCompraPage';
import { AuthProvider } from './auth/AuthContext';
import { AutoLogout } from './components/AutoLogout';
import { ProfileDataForm } from './components/ProfileDataForm';
import { MyBracelets } from './components/MyBracelets';
import { BraceletMovementHistory } from './components/BraceletMovementHistory';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AutoLogout>
          <Routes>
            <Route path="/" element={<Navigate to="/inicio" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroForm />} />

            <Route element={<PrivateRoutes requireAdmin />}>
              <Route path="/administrador" element={<AdministradorPage />} />
            </Route>

            <Route element={<MasterPageCliente />}>
              <Route path="/inicio" element={<InicioPage />} />
              <Route
                path="/comprar-brazaletes"
                element={<ComprarBrazaletesPage />}
              />
              <Route path="/recibo-compra" element={<ReciboCompraPage />} />
              <Route
                path="/atracciones-comidas"
                element={<AtraccionesComidasPage />}
              />
              <Route path="/sobre-nosotros" element={<SobreNosotrosPage />} />
              <Route path="/contacto" element={<ContactoPage />} />
              <Route
                path="/terminos-condiciones"
                element={<TerminosCondicionesPage />}
              />

              <Route element={<PrivateRoutes />}>
                <Route path="/mi-perfil" element={<PerfilClientePage />}>
                  <Route index element={<Navigate to="info" replace />} />
                  <Route path="info" element={<ProfileDataForm />} />
                  <Route path="mis-brazaletes" element={<MyBracelets />} />
                  <Route
                    path="historial-movimientos"
                    element={<BraceletMovementHistory />}
                  />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/inicio" replace />} />
            </Route>
          </Routes>
          <Toaster />
        </AutoLogout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
