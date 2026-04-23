import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PomodoroProvider } from "./contexts/PomodoroContext";
import { NotificationProvider } from "./components/common/PopupNotification";
import { Toaster } from "react-hot-toast";
import PageLoader from "./components/common/PageLoader";
import MainLayout from "./components/common/MainLayout";

// ── Code-split page imports ──────────────────────────────────
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const GoogleCallbackPage = lazy(() => import("./pages/GoogleCallbackPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage"));
const GroupAnalyticsPage = lazy(() => import("./pages/GroupAnalyticsPage"));
const GroupJoinPage = lazy(() => import("./pages/GroupJoinPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const StudyPlannerPage = lazy(() => import("./pages/StudyPlannerPage"));
const ResourceLibraryPage = lazy(() => import("./pages/ResourceLibraryPage"));
const PomodoroTimerPage = lazy(() => import("./pages/PomodoroTimerPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ── Route guards ─────────────────────────────────────────────

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

// ── Login/Signup smart redirects ─────────────────────────────

function LoginRedirect() {
  const { isAuthenticated, isPremium } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect");

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

// ── Landing page with auth-aware redirect ────────────────────

function LandingRedirect() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}

// ── App routes ───────────────────────────────────────────────

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingRedirect />} />
        <Route path="/login" element={<LoginRedirect />} />
        <Route path="/signup" element={<SignupRedirect />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/password-reset-confirm" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />

        {/* Authenticated but Subscription-Required Routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/subscription/verify" element={<SubscriptionPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Premium Only Routes */}
        <Route element={<PremiumRoute><MainLayout /></PremiumRoute>}>
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
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// ── App entry ────────────────────────────────────────────────

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
