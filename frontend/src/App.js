import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Prestations from './pages/Prestations';
import Contact from './pages/Contact';
import Reservation from './pages/Reservation';
import ReservationSuccess from './pages/ReservationSuccess';
import AvantApres from './pages/AvantApres';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPrestations from './pages/admin/AdminPrestations';
import AdminReservations from './pages/admin/AdminReservations';
import AdminContacts from './pages/admin/AdminContacts';
import AdminParametres from './pages/admin/AdminParametres';
import AdminHoraires from './pages/admin/AdminHoraires';
import AdminHomepage from './pages/admin/AdminHomepage';
import AdminAvantApres from './pages/admin/AdminAvantApres';
import AdminTemoignages from './pages/admin/AdminTemoignages';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><Home /></main>
              <Footer />
            </div>
          } />
          <Route path="/prestations" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><Prestations /></main>
              <Footer />
            </div>
          } />
          <Route path="/contact" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><Contact /></main>
              <Footer />
            </div>
          } />
          <Route path="/reservation" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><Reservation /></main>
              <Footer />
            </div>
          } />
          <Route path="/reservation-success" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><ReservationSuccess /></main>
              <Footer />
            </div>
          } />
          <Route path="/avant-apres" element={
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow"><AvantApres /></main>
              <Footer />
            </div>
          } />

          {/* Routes admin */}
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/prestations" element={<ProtectedRoute><AdminPrestations /></ProtectedRoute>} />
          <Route path="/admin/reservations" element={<ProtectedRoute><AdminReservations /></ProtectedRoute>} />
          <Route path="/admin/contacts" element={<ProtectedRoute><AdminContacts /></ProtectedRoute>} />
          <Route path="/admin/horaires" element={<ProtectedRoute><AdminHoraires /></ProtectedRoute>} />
          <Route path="/admin/homepage-content" element={<ProtectedRoute><AdminHomepage /></ProtectedRoute>} />
          <Route path="/admin/avant-apres" element={<ProtectedRoute><AdminAvantApres /></ProtectedRoute>} />
          <Route path="/admin/temoignages" element={<ProtectedRoute><AdminTemoignages /></ProtectedRoute>} />
          <Route path="/admin/parametres" element={<ProtectedRoute><AdminParametres /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;