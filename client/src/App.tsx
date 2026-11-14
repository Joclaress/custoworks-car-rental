import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollToHash } from './components/ScrollToHash';
import { CloudServerNotice } from './components/CloudServerNotice';
import { FacebookMessengerWidget } from './components/FacebookMessengerWidget';

import { HomePage } from './pages/HomePage';
import { VehiclesPage } from './pages/VehiclesPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';
import { BookingWizardPage } from './pages/BookingWizardPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { TrackBookingPage } from './pages/TrackBookingPage';
import { ContactPage } from './pages/ContactPage';
import { PriceListPage } from './pages/PriceListPage';
import { PartnerProgramPage } from './pages/PartnerProgramPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; staffOnly?: boolean }> = ({
  children,
  staffOnly = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (staffOnly && user.role !== 'ADMIN' && user.role !== 'STAFF') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToHash />
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/vehicles/:slug" element={<VehicleDetailPage />} />
              <Route path="/rates" element={<PriceListPage />} />
              <Route path="/pricelist" element={<PriceListPage />} />
              <Route path="/book" element={<BookingWizardPage />} />
              <Route path="/calendar" element={<BookingWizardPage />} />
              <Route path="/availability" element={<BookingWizardPage />} />
              <Route path="/track" element={<TrackBookingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/partner" element={<PartnerProgramPage />} />
              <Route path="/become-a-partner" element={<PartnerProgramPage />} />

              {/* Protected Customer Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <CustomerDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Staff / Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute staffOnly={true}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <CloudServerNotice />
          <FacebookMessengerWidget />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

