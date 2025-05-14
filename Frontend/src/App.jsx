import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';


// Import các trang
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReviewPage from './pages/ReviewPage';
import LearnPage from './pages/LearnPage';
import NotebookPage from './pages/NotebookPage';
import ProgressPage from './pages/ProgressPage';

// Import Layout
import Layout from './components/Layout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return <div>Đang tải...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;  
  }
  
  return children;
};

const App = () => {
  const { checkAuth } = useAuthStore();
  
  // Kiểm tra xác thực khi ứng dụng khởi động
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/review" replace />} />
        <Route path="review" element={
          <ProtectedRoute>
            <ReviewPage />
          </ProtectedRoute>
        } />
        <Route path="learn" element={
          <ProtectedRoute>
            <LearnPage />
          </ProtectedRoute>
        } />
        <Route path="notebook" element={
          <ProtectedRoute>
            <NotebookPage />
          </ProtectedRoute>
        } />
        <Route path="progress" element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;