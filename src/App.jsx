import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth }       from "./contexts/AuthContext";
import { TransactionProvider }          from "./contexts/TransactionContext";
import AppLayout                        from "./components/layout/AppLayout";
import LoginPage                        from "./pages/LoginPage";
import RegisterPage                     from "./pages/RegisterPage";
import DashboardPage                    from "./pages/DashboardPage";
import CatatPage                        from "./pages/CatatPage";
import RiwayatPage                      from "./pages/RiwayatPage";
import StatistikPage                    from "./pages/StatistikPage";
import KategoriPage                     from "./pages/KategoriPage";
import BudgetPage                       from "./pages/BudgetPage";
import Icon from "./components/ui/Icon";

// ── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Icon name="account_balance_wallet" sizeClass="text-[28px] text-emerald-400" />
          </div>
          <div className="absolute -inset-1 rounded-3xl border border-emerald-500/20 animate-ping opacity-30" />
        </div>
        <p className="text-sm font-semibold text-on-surface-variant tracking-widest uppercase">Memuat DompetKu...</p>
      </div>
    </div>
  );
}

// ── Main App Shell — mengelola tab & render halaman ────────────────────────────
function ProtectedApp() {
  const [tab, setTab] = useState("dashboard");

  const renderPage = () => {
    switch (tab) {
      case "dashboard":  return <DashboardPage  setTab={setTab} />;
      case "catat":      return <CatatPage       setTab={setTab} />;
      case "budget":     return <BudgetPage      setTab={setTab} />;
      case "riwayat":    return <RiwayatPage     setTab={setTab} />;
      case "statistik":  return <StatistikPage   setTab={setTab} />;
      case "kategori":   return <KategoriPage    setTab={setTab} />;
      default:           return <DashboardPage  setTab={setTab} />;
    }
  };

  return (
    <AppLayout tab={tab} setTab={setTab}>
      {renderPage()}
    </AppLayout>
  );
}

// ── Protected Route ────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return (
    <TransactionProvider>
      {children}
    </TransactionProvider>
  );
}

// ── Guest Route ────────────────────────────────────────────────────────────────
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

// ── Routes ─────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/"         element={<ProtectedRoute><ProtectedApp /></ProtectedRoute>} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
