import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentPending = lazy(() => import('./pages/PaymentPending'));
const PaymentError = lazy(() => import('./pages/PaymentError'));

import { Loader2 } from 'lucide-react';

import { useSettingsStore } from './store/settingsStore';
import { startSyncEngine } from './offline/syncEngine';
import { OfflineIndicator } from './components/OfflineIndicator';

// Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-slate-500 font-medium animate-pulse">Loading page...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Public Route Component (Redirects authenticated users)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

type SetAuthType = (user: { id: number; name: string; username: string; role: 'admin' | 'staff' }) => void;

function App() {
  const setAuth = useAuthStore((state) => state.setAuth) as SetAuthType;
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setInitializing = useAuthStore((state) => state.setInitializing);

  useEffect(() => {
    // Initial handshake to set CSRF cookie and restore session
    const initApp = async () => {
      try {
        // 1. Handshake to set CSRF cookie
        await authApi.handshake();
        
        // 2. Retrieve profile to restore session if cookie is present
        const res = await authApi.getProfile();
        if (res.success && res.data) {
          setAuth(res.data);
          useSettingsStore.getState().fetchSettings();
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };
    initApp();
  }, [setAuth, clearAuth, setInitializing]);

  // Drain any sales left in the outbox by a previous session, then keep
  // watching for reconnects for the lifetime of the app.
  useEffect(() => startSyncEngine(), []);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Page - Always Accessible */}
          <Route path="/" element={<Landing />} />

          {/* Payment Status Routes */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-pending" element={<PaymentPending />} />
          <Route path="/payment-error" element={<PaymentError />} />

          {/* Auth Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/pos" element={
            <ProtectedRoute>
              <POS />
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/customers" element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <OfflineIndicator />
    </Router>
  );
}

export default App;
