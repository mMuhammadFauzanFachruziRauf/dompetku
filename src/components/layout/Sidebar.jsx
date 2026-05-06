import { useAuth }        from "../../contexts/AuthContext";
import { useTransaction }  from "../../contexts/TransactionContext";

// ── Format helper (lokal, ringan) ────────────────────────────────────────────
function fmt(n) {
  return "Rp " + Math.abs(n).toLocaleString("id-ID");
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Beranda",   icon: DashIcon  },
  { key: "catat",     label: "Catat",     icon: PenIcon   },
  { key: "riwayat",   label: "Riwayat",   icon: ListIcon  },
  { key: "statistik", label: "Statistik", icon: ChartIcon },
];

export default function Sidebar({ tab, setTab }) {
  const { user, signOut }             = useAuth();
  const { remaining, totalSpent, pct, income } = useTransaction();
  const name  = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kamu";
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const ringColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f97316" : "#10b981";

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 bg-white border-r border-stone-100 min-h-screen sticky top-0 h-screen overflow-y-auto">

      {/* ── Logo ── */}
      <div className="px-6 pt-8 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-900 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            💚
          </div>
          <div>
            <p className="font-extrabold text-stone-900 text-[15px] leading-tight">DompetKu</p>
            <p className="text-[11px] text-stone-400 font-medium">Kelola keuangan</p>
          </div>
        </div>
      </div>

      {/* ── Budget snapshot ── */}
      <div className="mx-4 mt-5 mb-2 bg-gradient-to-br from-brand-900 to-brand-800 rounded-2xl p-4 text-white relative overflow-hidden">
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" aria-hidden="true"/>
        <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-2">Sisa Budget</p>

        {/* Mini ring */}
        <div className="flex items-center gap-3 mb-3">
          <svg width="44" height="44" viewBox="0 0 44 44" aria-label={`${pct}% terpakai`} role="img" className="flex-shrink-0">
            <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5"/>
            <circle cx="22" cy="22" r="17" fill="none"
              stroke={ringColor} strokeWidth="5"
              strokeDasharray={`${(Math.min(pct,100)/100)*(2*Math.PI*17)} ${2*Math.PI*17}`}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
            <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="800" fill="white">{pct}%</text>
          </svg>
          <div>
            <p className="text-[18px] font-black leading-tight" style={{ color: remaining < 0 ? "#fca5a5" : "white" }}>
              {remaining < 0 ? "-" : ""}{fmt(remaining)}
            </p>
            <p className="text-[10px] text-emerald-200">dari {fmt(income)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: ringColor }}
          />
        </div>

        {/* Stats row */}
        <div className="flex justify-between mt-3">
          <div>
            <p className="text-[9px] text-emerald-200 font-semibold">KELUAR</p>
            <p className="text-[12px] font-bold text-red-300">{fmt(totalSpent)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-emerald-200 font-semibold">SISA</p>
            <p className="text-[12px] font-bold" style={{ color: remaining < 0 ? "#fca5a5" : "#6ee7b7" }}>
              {remaining < 0 ? "-" : ""}{fmt(remaining)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4" aria-label="Navigasi utama">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-2">Menu</p>
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-current={active ? "page" : undefined}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 mb-0.5",
                active
                  ? "bg-brand-900 text-white shadow-sm shadow-brand-900/30"
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
              ].join(" ")}
            >
              <Icon active={active} />
              <span className="font-semibold text-[13px]">{label}</span>
              {key === "catat" && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-white/20 text-white" : "bg-brand-50 text-brand-700"}`}>
                  +
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User profile ── */}
      <div className="px-3 pb-6 border-t border-stone-100 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 text-[11px] font-extrabold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-stone-800 truncate">{name}</p>
            <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Logout"
            className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Icon components ───────────────────────────────────────────────────────────
function DashIcon({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/>
      <line x1="2"  y1="20" x2="22" y2="20"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  );
}
