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



// Composant ProtectedRoute (garde-le pour les dashboards)
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  // Fallback decode si user null
  let effectiveUser = user;
  if (!user && token) {
    try {
      const decoded = jwtDecode(token);
      effectiveUser = { role: decoded.role || decoded.userRole };
      console.log('Fallback decode:', effectiveUser.role); // Debug temporaire
    } catch (err) {
      console.error('Decode failed:', err);
    }
  }
  console.log('ProtectedRoute check:', { role: effectiveUser?.role, required: allowedRole }); // Debug
  if (!effectiveUser || effectiveUser.role !== allowedRole) {
    console.warn('Accès refusé:', { role: effectiveUser?.role, required: allowedRole });
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Export useAuth pour imports
export { useAuth } from './utils/auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <div className="app-wrapper"> {/* Wrapper flex pour push footer */}
        <Header />
        <Routes>
          {/* Routes PUBLIQUES (en DEHORS de ProtectedRoute) */}
          <Route path="/" element={<Accueil />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/register" element={<LoginRegister />} />
          <Route path="/hotel/:id" element={<HotelDetail />} />
           <Route path="/hotels" element={<HotelList />} />
           <Route path="/mes-reservations" element={<MesReservations />} />
           <Route path="/reservation/:hotelId/:chambreId" element={<Reservation />} />

          {/* Routes PROTÉGÉES (avec ProtectedRoute) */}
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
            <ProtectedRoute allowedRole="PERSONNEL"> {/* Si restreint au personnel */}
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
            
          {/* Catch-all 404 pour debug */}
          <Route path="*" element={<div>404 - Route non trouvée : {window.location.pathname}</div>} />
        </Routes>
        <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

























// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import './App.css';
// import Accueil from './pages/Accueil';
// import LoginRegister from './pages/LoginRegister';
// import { AuthProvider, useAuth } from './utils/auth';  
// import Header from './components/Header';
// import Footer from "./components/Footer";
// import DashboardPersonnel from './pages/DashboardPersonnel';
// import PhotosHotels from './pages/PhotosHotels';
// import PhotosChambres from './pages/PhotosChambres';
// import DashboardAdmin from './pages/DashboardAdmin';
// import DashboardClient from './pages/DashboardClient';
// import HotelDetail from './pages/HotelDetail';
// import { jwtDecode } from 'jwt-decode'; // Fix : Named import au lieu de default

// // Composant ProtectedRoute déplacé EN DEHORS de App (fix scope)
// const ProtectedRoute = ({ children, allowedRole }) => {
//   const { user } = useAuth();
//   const token = localStorage.getItem('token');

//   // Fallback decode si user null
//   let effectiveUser = user;
//   if (!user && token) {
//     try {
//       const decoded = jwtDecode(token);
//       effectiveUser = { role: decoded.role || decoded.userRole };
//       console.log('Fallback decode:', effectiveUser.role); // Debug temporaire
//     } catch (err) {
//       console.error('Decode failed:', err);
//     }
//   }

//   console.log('ProtectedRoute check:', { role: effectiveUser?.role, required: allowedRole }); // Debug

//   if (!effectiveUser || effectiveUser.role !== allowedRole) {
//     console.warn('Accès refusé:', { role: effectiveUser?.role, required: allowedRole });
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// // Export useAuth pour imports
// export { useAuth } from './utils/auth';

// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Header />
//         <Routes>
//           <Route path="/" element={<Accueil />} />
//           <Route path="/login" element={<LoginRegister />} />
//           <Route path="/register" element={<LoginRegister />} />
//           <Route path="/hotel/:id" element={<HotelDetail />} />
//           <Route path="/dashboard/admin" element={<DashboardAdmin />} />
//           <Route path="/dashboard/personnel" element={<DashboardPersonnel />} />
//           <Route path="/photos-hotels" element={<PhotosHotels />} />
//           <Route path="/photos-chambres" element={<PhotosChambres />} />
//           <Route path="/dashboard/client" element={ <ProtectedRoute allowedRole="CLIENT"><DashboardClient /></ProtectedRoute> } />
//           <Route path="/hotel/:id" element={ <ProtectedRoute allowedRole="CLIENT"><HotelDetail /></ProtectedRoute> } />
//         </Routes>
//         <Footer />
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;










































// import React from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import './App.css';
// import Accueil from './pages/Accueil';
// import LoginRegister from './pages/LoginRegister';
// import { AuthProvider } from './utils/auth';  
// import Header from './components/Header';
// import Footer from "./components/Footer";
// // import HotelDetail from './pages/HotelDetail';
// import DashboardPersonnel from './pages/DashboardPersonnel';
// import PhotosHotels from './pages/PhotosHotels';
// import PhotosChambres from './pages/PhotosChambres';
// import DashboardAdmin from './pages/DashboardAdmin';

// // Export useAuth pour imports
// export { useAuth } from './utils/auth';

// function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <Header />
//         <Routes>
//           <Route path="/" element={<Accueil />} />
//           <Route path="/login" element={<LoginRegister />} />
//           <Route path="/register" element={<LoginRegister />} />
//           {/* <Route path="/hotel/:id" element={<HotelDetail />} /> */}
//           <Route path="/dashboard/admin" element={<DashboardAdmin />} />
//           <Route path="/dashboard/personnel" element={<DashboardPersonnel />} />
//           <Route path="/photos-hotels" element={<PhotosHotels />} />
//           <Route path="/photos-chambres" element={<PhotosChambres />} />
//         </Routes>
//         <Footer />
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }

// export default App;