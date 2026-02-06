import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { NotificationProvider } from "./components/common/PopupNotification";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupAnalyticsPage from "./pages/GroupAnalyticsPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import ResourceLibraryPage from "./pages/ResourceLibraryPage";
import PomodoroTimerPage from "./pages/PomodoroTimerPage";
import PageLoader from "./components/common/PageLoader";
import MainLayout from "./components/common/MainLayout";
import { Toaster } from "react-hot-toast";
import ChatPage from "./pages/ChatPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import GroupJoinPage from "./pages/GroupJoinPage";
// import SubscriptionPage from "./pages/SubscriptionPage"; // Moved down


import { useLocation } from "react-router-dom";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  return <>{children}</>;
}

function PremiumRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPremium } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!isPremium) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

import SubscriptionPage from "./pages/SubscriptionPage";

function LoginRedirect() {
  const { isAuthenticated, isPremium } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirect');

  if (!isAuthenticated) return <LoginPage />;

  if (!isPremium) return <Navigate to="/subscription" replace />;

  return <Navigate to={redirectTo || "/dashboard"} replace />;
}

function SignupRedirect() {
  const { isAuthenticated, isPremium } = useAuth();
  if (!isAuthenticated) return <SignUpPage />;
  if (isPremium) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/subscription" replace />;
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/signup" element={<SignupRedirect />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/password-reset-confirm" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<GoogleCallbackPage />} />

      {/* Authenticated but Subscription-Required Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/subscription/verify" element={<SubscriptionPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>

      {/* Premium Only Routes */}
      <Route element={
        <PremiumRoute>
          <MainLayout />
        </PremiumRoute>
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/groups/join/:groupId/:token" element={<GroupJoinPage />} />
        <Route path="/groups/:id/analytics" element={<GroupAnalyticsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/planner" element={<StudyPlannerPage />} />
        <Route path="/resources" element={<ResourceLibraryPage />} />
        <Route path="/pomodoro" element={<PomodoroTimerPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <PomodoroProvider>
        <NotificationProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </PomodoroProvider>
    </AuthProvider>
  );
}

export default App;
