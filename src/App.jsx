import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Accueil from './pages/Accueil';
import LoginRegister from './pages/LoginRegister';
import { AuthProvider, useAuth } from './utils/auth';  
import Header from './components/Header';
import Footer from "./components/Footer";
import DashboardPersonnel from './pages/DashboardPersonnel';
import PhotosHotels from './pages/PhotosHotels';
import PhotosChambres from './pages/PhotosChambres';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardClient from './pages/DashboardClient';
import HotelDetail from './pages/HotelDetail';
import { jwtDecode } from 'jwt-decode'; 
import HotelList from './pages/HotelList';
import Reservation from './pages/Reservation';
import Paiement from './pages/Paiement';
import MesReservations from './pages/MesReservations';
import PaiementSuccess from './pages/PaiementSuccess';
import MesFactures from './pages/MesFactures';

// Composant ProtectedRoute
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  
  let effectiveUser = user;
  if (!user && token) {
    try {
      const decoded = jwtDecode(token);
      effectiveUser = { role: decoded.role || decoded.userRole };
    } catch (err) {
      console.error('Decode failed:', err);
    }
  }

  if (!effectiveUser || effectiveUser.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export { useAuth } from './utils/auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-wrapper">
          <Header />
          <main>
            <Routes>
              {/* Routes PUBLIQUES */}
              <Route path="/" element={<Accueil />} />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="/register" element={<LoginRegister />} />
              <Route path="/hotel/:id" element={<HotelDetail />} />
              <Route path="/hotels" element={<HotelList />} />

              {/* Routes PROTÉGÉES */}
              <Route path="/reservation/:hotelId/:chambreId" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <Reservation />
                </ProtectedRoute>
              } />

              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRole="MODERATEUR">
                  <DashboardAdmin />
                </ProtectedRoute>
              } />

              <Route path="/dashboard/personnel" element={
                <ProtectedRoute allowedRole="PERSONNEL">
                  <DashboardPersonnel />
                </ProtectedRoute>
              } />

              <Route path="/photos-hotels" element={
                <ProtectedRoute allowedRole="PERSONNEL">
                  <PhotosHotels />
                </ProtectedRoute>
              } />

              <Route path="/photos-chambres" element={
                <ProtectedRoute allowedRole="PERSONNEL">
                  <PhotosChambres />
                </ProtectedRoute>
              } />

              <Route path="/dashboard/client" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <DashboardClient />
                </ProtectedRoute>
              } />

              {/* Route de paiement avec paramètre reservationId */}
              <Route path="/paiement/:reservationId" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <Paiement />
                </ProtectedRoute>
              } />
              
              <Route path="/paiement/success" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <PaiementSuccess />
                </ProtectedRoute>
              } />

              <Route path="/mes-reservations" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <MesReservations />
                </ProtectedRoute>
              } />

              <Route path="/mes-factures" element={
                <ProtectedRoute allowedRole="CLIENT">
                  <MesFactures />
                </ProtectedRoute>
              } />
                
              {/* Catch-all 404 */}
              <Route path="*" element={<div>404 - Route non trouvée : {window.location.pathname}</div>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
