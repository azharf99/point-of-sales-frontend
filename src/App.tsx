import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { setAuth, clearAuth } = useAuthStore();
  
  useEffect(() => {
    const checkAuth = async () => {
      if (localStorage.getItem('token')) {
        try {
          const res = await authApi.getProfile();
          if (res.success) {
            setAuth(res.data, localStorage.getItem('token')!);
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      }
    };
    checkAuth();
  }, [setAuth, clearAuth]);

  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

function App() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Initial handshake to set CSRF cookie and restore session
    const initApp = async () => {
      try {
        const res = await authApi.getProfile();
        if (res.success && localStorage.getItem('token')) {
          setAuth(res.data, localStorage.getItem('token')!);
        }
      } catch {
        // Only clear if we actually had a token but it's now invalid
        if (localStorage.getItem('token')) {
          clearAuth();
        }
      }
    };
    initApp();
  }, [setAuth, clearAuth]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
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
    </Router>
  );
}

export default App;
