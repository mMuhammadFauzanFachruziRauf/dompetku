import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTransaction } from "../../contexts/TransactionContext";
import { formatRupiah } from "../../utils/helpers";
import SettingsModal from "../SettingsModal";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard",    icon: "dashboard",              iconFilled: "dashboard"             },
  { key: "catat",     label: "Catat",        icon: "add_circle",             iconFilled: "add_circle"            },
  { key: "budget",    label: "Budget",       icon: "account_balance_wallet", iconFilled: "account_balance_wallet" },
  { key: "riwayat",   label: "Riwayat",      icon: "receipt_long",           iconFilled: "receipt_long"          },
  { key: "statistik", label: "Statistik",    icon: "bar_chart",              iconFilled: "bar_chart"             },
];

const MonthSelector = () => {
  const { selectedDate, setSelectedDate } = useTransaction();
  
  const handlePrev = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNext = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const monthName = selectedDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  
  return (
    <div className="flex items-center gap-1 bg-surface-dim border border-outline-variant/30 rounded-xl px-1.5 py-1">
      <button onClick={handlePrev} className="p-1 text-on-surface-variant hover:text-emerald-400 transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
      </button>
      <span className="text-xs font-bold text-on-surface min-w-[90px] text-center capitalize">{monthName}</span>
      <button onClick={handleNext} className="p-1 text-on-surface-variant hover:text-emerald-400 transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
};

export default function AppLayout({ tab, setTab, children }) {
  const { user, signOut } = useAuth();
  const { remaining, loading } = useTransaction();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── SIDEBAR (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col h-screen w-[280px] bg-slate-900/70 backdrop-blur-xl border-r border-slate-800/50 fixed left-0 top-0 z-50 overflow-y-auto">

        {/* Logo */}
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-2xl font-black tracking-tighter text-emerald-400">DompetKu</h1>
          <p className="text-xs text-on-surface-variant mt-1">Lacak keuangan, bebas ribet.</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-4">
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={[
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left relative",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:bg-emerald-400 before:rounded-r-full"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100",
                ].join(" ")}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="text-xs font-semibold tracking-widest uppercase">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sisa Budget Widget */}
        <div className="mx-4 mb-4">
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5" />
            <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-1 relative z-10">
              Sisa Budget
            </p>
            <p className={`text-xl font-bold relative z-10 ${remaining < 0 ? "text-error" : "text-secondary"}`}>
              {loading ? "—" : formatRupiah(remaining)}
            </p>
            <button
              onClick={() => setTab("catat")}
              className="w-full mt-3 bg-emerald-500 text-slate-900 text-xs font-bold py-2 rounded-lg hover:bg-emerald-400 transition-colors relative z-10"
            >
              + Catat Pengeluaran
            </button>
          </div>
        </div>

        {/* User Widget */}
        <div className="px-4 pb-8 relative z-50">
          <button
            onClick={() => setShowUserMenu(p => !p)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800/40 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-on-surface truncate">{name}</p>
              <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
            </div>
            <span className="material-symbols-outlined text-slate-500 text-[16px]">unfold_more</span>
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-surface-container-high border border-outline-variant/50 rounded-xl overflow-hidden shadow-2xl animate-slide-up">
              <button
                onClick={() => {
                  setShowSettings(true);
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest transition-colors border-b border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[18px]">settings</span>
                Pengaturan
              </button>
              <button
                onClick={() => {
                  setTab("kategori");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest transition-colors border-b border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[18px]">category</span>
                Kelola Kategori
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN AREA ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-[280px] min-h-screen">

        {/* Top bar (desktop) */}
        <header className="hidden md:flex fixed top-0 right-0 h-14 w-full md:w-[calc(100%-280px)] z-40 bg-slate-900/30 backdrop-blur-md border-b border-slate-800/50 items-center justify-between px-8">
          <div>
            <p className="text-sm font-semibold text-on-surface capitalize">
              {NAV_ITEMS.find(n => n.key === tab)?.label ?? "Dashboard"}
            </p>
            <p className="text-xs text-on-surface-variant">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <MonthSelector />
            <div className="h-6 w-px bg-outline-variant/30 hidden lg:block" />
            <button
              onClick={() => setShowUserMenu(p => !p)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/40 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm text-on-surface-variant">{name}</span>
            </button>
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-slate-900/70 backdrop-blur-md border-b border-slate-800/50 flex items-center justify-between px-5">
          <h1 className="text-lg font-black text-emerald-400 tracking-tighter">DompetKu</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setTab("kategori")} className="flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
               <span className="material-symbols-outlined text-[20px]">category</span>
            </button>
            <button onClick={() => setShowSettings(true)} className="flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
               <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
            <button onClick={signOut} className="flex items-center justify-center text-error hover:text-error/80 transition-colors">
               <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile Month Selector */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/50 px-5 py-2 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant">Periode</p>
          <MonthSelector />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pt-[104px] md:pt-14 pb-20 md:pb-8">
          {children}
        </main>

        {/* ── BOTTOM NAV (mobile) ──────────────────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50 flex">
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${isActive ? "text-emerald-400" : "text-slate-500"}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className={`text-[9px] font-bold tracking-widest uppercase ${isActive ? "text-emerald-400" : "text-slate-600"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
