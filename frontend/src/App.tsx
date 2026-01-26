import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Groups";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupAnalyticsPage from "./pages/GroupAnalyticsPage";
// import { useAuthStore } from "./store/useAuthStore";
import PageLoader from "./components/common/PageLoader";
import {Toaster} from "react-hot-toast";
import ChatPage from "./pages/ChatPage";
 

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const {isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const {loading, isAuthenticated } = useAuth();
  if (loading) return <PageLoader />
 


  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute> } />
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}/>
      <Route path="/signup" element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/" replace />}/>
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <Groups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:id"
        element={
          <ProtectedRoute>
            <GroupDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/groups/:id/analytics"
        element={
          <ProtectedRoute>
            <GroupAnalyticsPage />
          </ProtectedRoute>
        }/>

    </Routes>
);
}



function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-900 relative flex items-center justify-center p-4 overflow-hidden">
      {/* Digital learning matrix */}
      <div className="absolute inset-0">
        {/* Binary/learning data stream */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute font-mono text-xs text-green-400/30 animate-data-stream"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              {Math.random() > 0.5 ? '01' : '10'}
            </div>
          ))}
        </div>
        
        {/* Neural network nodes */}
        <div className="absolute top-1/4 left-1/4 size-3 bg-cyan-400/30 rounded-full shadow-[0_0_10px_#00ffff]" />
        <div className="absolute top-1/3 right-1/3 size-4 bg-emerald-400/30 rounded-full shadow-[0_0_10px_#00ffaa]" />
        <div className="absolute bottom-1/3 left-1/3 size-3.5 bg-blue-400/30 rounded-full shadow-[0_0_10px_#0088ff]" />
        
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
          <line x1="25%" y1="25%" x2="33%" y2="33%" stroke="#00ffff" strokeWidth="1" />
          <line x1="33%" y1="33%" x2="67%" y2="33%" stroke="#00ffaa" strokeWidth="1" />
          <line x1="67%" y1="33%" x2="75%" y2="25%" stroke="#0088ff" strokeWidth="1" />
        </svg>
        
        {/* Focus gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-emerald-500/10 rounded-full blur-3xl" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#334155_1px,transparent_1px),linear-gradient(180deg,#334155_1px,transparent_1px)] bg-[size:30px_30px] opacity-5" />
      </div>
      
      <style>{`
        @keyframes data-stream {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          10%, 90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100px);
            opacity: 0;
          }
        }
        .animate-data-stream {
          animation: data-stream 10s linear infinite;
        }
      `}</style>
    
    
      <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <Router>
            <AppRoutes />
          </Router>
      </AuthProvider>
    </div>
    
  );
}

export default App;


