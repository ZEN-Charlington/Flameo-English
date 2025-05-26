import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useProgressStore from './store/progressStore';

// Import các trang
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReviewPage from './pages/ReviewPage';
import LearnPage from './pages/LearnPage';
import TopicDetailPage from './pages/TopicDetailPage';
import LessonPage from './pages/LessonPage';
import NotebookPage from './pages/NotebookPage';
import ProgressPage from './pages/ProgressPage';
import OTPVerificationPage from  './pages/OTPVerificationPage';

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
  const { checkAuth, user } = useAuthStore();
  const { fetchAllProgress } = useProgressStore();
  
  // Kiểm tra xác thực khi ứng dụng khởi động
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Tải dữ liệu tiến độ khi user đã xác thực
  useEffect(() => {
    if (user) {
      fetchAllProgress().catch(err => console.error("Error fetching progress data:", err));
    }
  }, [user, fetchAllProgress]);
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      
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
        <Route path="topics/:topicId" element={
          <ProtectedRoute>
            <TopicDetailPage />
          </ProtectedRoute>
        } />
        <Route path="lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonPage />
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