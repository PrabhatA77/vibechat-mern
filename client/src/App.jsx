import React, { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import FloatingShape from './components/FloatingShape.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import EmailVerificationPage from './pages/EmailVerificationPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext.jsx';

// ⭐ Protected Route
const ProtectedRoute = ({ children }) => {
  const { authUser, loading } = useContext(AuthContext);

  // ⏳ Wait until checkAuth finishes
  if (loading) return <LoadingSpinner />;

  // 🚫 Not logged in
  if (!authUser) return <Navigate to="/login" replace />;

  // 🚫 Logged in but email not verified
  if (!authUser.isVerified) return <Navigate to="/verify-email" replace />;

  return children;
};

// ⭐ Redirect Authenticated User (signup/login pages)
const RedirectAuthenticateUser = ({ children }) => {
  const { authUser, loading } = useContext(AuthContext);

  // ⏳ Wait for checkAuth
  if (loading) return <LoadingSpinner />;

  if (authUser && authUser.isVerified) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center relative overflow-hidden">

      <FloatingShape color="bg-purple-500" size="w-64 h-64" top="-5%" left="10%" delay={0} />
      <FloatingShape color="bg-blue-500" size="w-48 h-48" top="70%" left="80%" delay={5} />
      <FloatingShape color="bg-indigo-500" size="w-32 h-32" top="40%" left="-10%" delay={2} />
      <FloatingShape color="bg-violet-500" size="w-24 h-24" top="30%" left="60%" delay={3} />

      <Toaster />

      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />

        <Route path="/signup" element={
          <RedirectAuthenticateUser>
            <SignUpPage />
          </RedirectAuthenticateUser>
        } />

        <Route path="/login" element={
          <RedirectAuthenticateUser>
            <LoginPage />
          </RedirectAuthenticateUser>
        } />

        <Route path="/verify-email" element={<EmailVerificationPage />} />

        <Route path="/forgot-password" element={
          <RedirectAuthenticateUser>
            <ForgotPasswordPage />
          </RedirectAuthenticateUser>
        } />

        <Route path="/reset-password" element={ <ResetPasswordPage /> } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-center" />
    </div>
  );
};

export default App;
