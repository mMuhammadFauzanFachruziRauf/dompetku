import { useState, useMemo } from "react";
import { useTransaction }    from "../contexts/TransactionContext";
import { formatRupiah, getMeta, formatDate } from "../utils/helpers";
import { downloadExcel }     from "../utils/exportExcel";
import EditTransactionModal  from "../components/EditTransactionModal";

const ALL = "Semua";

export default function RiwayatPage({ setTab }) {
  const { transactions, categories, loading, deleteTransaction } = useTransaction();
  const [filterKat, setFilterKat] = useState(ALL);
  const [search,    setSearch]    = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [editingTx,  setEditingTx]  = useState(null);

  const CATS = [ALL, ...categories.map(c => c.name)];

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => transactions.filter(tx => {
    const matchKat = filterKat === ALL || tx.kategori === filterKat;
    const matchSearch = !search || [tx.catatan, tx.kategori].join(" ")
      .toLowerCase().includes(search.toLowerCase());
    return matchKat && matchSearch;
  }), [transactions, filterKat, search]);

  const totalFilteredExpense = filtered.filter(t => t.nominal > 0).reduce((s,t) => s + t.nominal, 0);

  // ── Group by date ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(tx => {
      const d   = new Date(tx.tanggal);
      const now = new Date();
      let key;
      if (d.toDateString() === now.toDateString()) key = "Hari Ini";
      else if (d.toDateString() === new Date(Date.now()-86400000).toDateString()) key = "Kemarin";
      else key = d.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    });
    return Object.entries(map);
  }, [filtered]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async id => {
    setDeletingId(id);
    await deleteTransaction(id);
    setDeletingId(null); setConfirmId(null);
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[900px] mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Riwayat Transaksi</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">Semua pengeluaranmu bulan ini</p>
        </div>
        <button
          onClick={() => downloadExcel(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">table_view</span>
          <span className="hidden md:inline">Export Excel</span>
          <span className="md:hidden">Excel</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors text-[18px]">
          search
        </span>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full bg-surface-container/70 border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all"/>
      </div>

      {/* Filter chips — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATS.map(kat => {
          const isActive = filterKat === kat;
          const m = kat !== ALL ? getMeta(kat, categories) : null;
          return (
            <button key={kat} onClick={() => setFilterKat(kat)}
              className={`flex-shrink-0 flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border ${
                isActive
                  ? "bg-emerald-500 text-slate-900 border-emerald-500"
                  : "bg-surface-container/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface"
              }`}>
              {m && <span className={`material-symbols-outlined text-[12px] ${isActive ? "" : m.color}`}>{m.icon}</span>}
              {kat === ALL ? "✨ Semua" : kat}
            </button>
          );
        })}
      </div>

      {/* Summary strip */}
      <div className="glass-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">receipt_long</span>
          <p className="text-xs font-semibold text-on-surface-variant">
            {filtered.length} transaksi{filterKat !== ALL && ` · ${filterKat}`}
          </p>
        </div>
        <p className="text-sm font-bold text-error">-{formatRupiah(totalFilteredExpense)}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-7 w-7 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">folder_open</span>
          <p className="text-sm font-semibold text-on-surface-variant">Tidak ada transaksi</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">
            {search || filterKat !== ALL ? "Coba ganti filter atau kata pencarian" : "Belum ada transaksi bulan ini"}
          </p>
          {!search && filterKat === ALL && (
            <button onClick={() => setTab("catat")}
              className="mt-5 px-5 py-2.5 bg-emerald-500 text-slate-900 text-xs font-bold rounded-xl hover:bg-emerald-400 transition-all">
              + Catat Sekarang
            </button>
          )}
        </div>
      )}

      {/* Grouped list */}
      {!loading && grouped.map(([tanggal, txList]) => (
        <div key={tanggal}>
          {/* Date header */}
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">{tanggal}</p>
            <p className="text-[11px] font-semibold text-error/70">
              -{formatRupiah(txList.filter(t => t.nominal > 0).reduce((s,t) => s+t.nominal, 0))}
            </p>
          </div>

          {/* Transactions */}
          <div className="glass-card overflow-hidden">
            {txList.map((tx, i) => {
              const m = getMeta(tx.kategori, categories);
              const isConf = confirmId === tx.id;
              const isDel  = deletingId === tx.id;
              return (
                <div key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-all ${
                    i < txList.length - 1 ? "border-b border-outline-variant/20" : ""
                  } ${isConf ? "bg-error/5" : "hover:bg-surface-container-high/50"}`}>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[18px] ${m.color}`}>{m.icon}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{tx.catatan || tx.kategori}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        {tx.kategori}
                      </span>
                      <span className="text-[9px] text-outline">•</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(tx.tanggal).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}
                      </span>
                    </div>
                  </div>

                  {/* Amount + delete */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.nominal < 0 ? "text-emerald-400" : "text-error"}`}>
                      {tx.nominal < 0 ? "+" : "-"}{formatRupiah(Math.abs(tx.nominal))}
                    </p>
                    {!isConf ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingTx(tx)}
                          className="text-[10px] text-outline hover:text-emerald-400 transition-colors font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">edit</span> Edit
                        </button>
                        <button onClick={() => setConfirmId(tx.id)}
                          className="text-[10px] text-outline hover:text-error transition-colors font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">delete</span> Hapus
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button onClick={() => setConfirmId(null)}
                          className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                          Batal
                        </button>
                        <button onClick={() => handleDelete(tx.id)} disabled={isDel}
                          className="text-[10px] font-bold text-slate-900 bg-error px-2 py-0.5 rounded-full disabled:opacity-60">
                          {isDel ? "..." : "Hapus"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
}
