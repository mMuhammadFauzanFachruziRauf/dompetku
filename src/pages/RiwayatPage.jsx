import { useState, useMemo, useEffect } from "react";
import { useTransaction }    from "../contexts/TransactionContext";
import { formatRupiah, getMeta, formatDate } from "../utils/helpers";
import Icon from "../components/ui/Icon";
import { downloadExcel }     from "../utils/exportExcel";
import EditTransactionModal  from "../components/EditTransactionModal";

const ALL = "Semua";
const WALLET_ALL = "Semua Dompet";
const TYPE_ALL = "Semua";
const TYPE_INCOME = "Pemasukan";
const TYPE_EXPENSE = "Pengeluaran";

const pillBase = "flex-shrink-0 whitespace-nowrap text-[11px] font-bold px-3 py-1.5 rounded-full transition-all border";
const pillInactive = "bg-surface-container/60 text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface";
const filterScrollRow = "flex w-full min-w-0 flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-2 no-scrollbar touch-pan-x [-webkit-overflow-scrolling:touch]";
const filterScrollRowBleed = `${filterScrollRow} -mx-4 px-4 md:mx-0 md:px-0`;

export default function RiwayatPage({ setTab }) {
  const { transactions, transactionsRevision, categories, wallets, loading, deleteTransaction } = useTransaction();
  const [filterKat, setFilterKat] = useState(ALL);
  const [filterWallet, setFilterWallet] = useState(WALLET_ALL);
  const [filterType, setFilterType] = useState(TYPE_ALL);
  const [search,    setSearch]    = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [editingTx,  setEditingTx]  = useState(null);
  const [displayTransactions, setDisplayTransactions] = useState([]);

  useEffect(() => {
    setDisplayTransactions(transactions.map((tx) => ({ ...tx })));
  }, [transactions, transactionsRevision]);

  const CAT_OPTIONS = [
    { key: "all", value: ALL, label: "✨ Semua" },
    ...categories.map((c, index) => ({
      key: c.id || `${c.name}-${index}`,
      value: c.name,
      label: c.name,
    })),
  ];

  const WALLET_OPTIONS = useMemo(() => [
    { key: "all", value: WALLET_ALL, label: WALLET_ALL, icon: null },
    ...wallets.map((w) => ({
      key: w.id,
      value: w.id,
      label: w.name,
      icon: w.icon,
    })),
  ], [wallets]);

  const selectedWalletLabel = useMemo(() => {
    if (filterWallet === WALLET_ALL) return null;
    return wallets.find((w) => w.id === filterWallet)?.name || null;
  }, [filterWallet, wallets]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => displayTransactions.filter(tx => {
    const matchKat = filterKat === ALL || tx.kategori === filterKat;
    const matchSearch = !search || [tx.catatan, tx.kategori].join(" ")
      .toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === TYPE_ALL
      || (filterType === TYPE_INCOME ? tx.nominal < 0 : tx.nominal > 0);
    const matchWallet = filterWallet === WALLET_ALL
      || tx.wallet_id === filterWallet
      || tx.to_wallet_id === filterWallet;
    return matchKat && matchSearch && matchType && matchWallet;
  }), [displayTransactions, filterKat, filterWallet, search, filterType]);

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
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[900px] mx-auto space-y-4 min-w-0">

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
          <Icon name="table_view" sizeClass="text-[16px]" />
          <span className="hidden md:inline">Export Excel</span>
          <span className="md:hidden">Excel</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative group">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
          <Icon name="search" sizeClass="text-[18px]" />
        </span>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari transaksi..."
          className="w-full bg-surface-container/70 border border-outline-variant/30 rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all"/>
      </div>

      {/* Filters */}
      <div className="space-y-3 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-0.5">Tipe</p>
          <div className={filterScrollRow}>
            <button onClick={() => setFilterType(TYPE_ALL)}
              className={`${pillBase} ${filterType === TYPE_ALL ? "bg-surface-container/80 text-on-surface border-outline-variant/40" : pillInactive}`}>
              Semua
            </button>
            <button onClick={() => setFilterType(TYPE_INCOME)}
              className={`${pillBase} ${filterType === TYPE_INCOME ? "bg-emerald-500 text-slate-900 border-emerald-500" : pillInactive}`}>
              Pemasukan
            </button>
            <button onClick={() => setFilterType(TYPE_EXPENSE)}
              className={`${pillBase} ${filterType === TYPE_EXPENSE ? "bg-error text-slate-900 border-error" : pillInactive}`}>
              Pengeluaran
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-0.5">Kategori</p>
          <div className={filterScrollRowBleed}>
            {CAT_OPTIONS.map((catOpt) => {
              const isActive = filterKat === catOpt.value;
              const m = catOpt.value !== ALL ? getMeta(catOpt.value, categories) : null;
              return (
                <button key={catOpt.key} onClick={() => setFilterKat(catOpt.value)}
                  className={`${pillBase} flex items-center gap-1.5 ${
                    isActive ? "bg-emerald-500 text-slate-900 border-emerald-500" : pillInactive
                  }`}>
                  {m && <Icon name={m.icon} className={`${isActive ? "" : m.color}`} sizeClass="text-[12px]" />}
                  {catOpt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 px-0.5">Dompet</p>
          <div className={filterScrollRowBleed}>
            {WALLET_OPTIONS.map((walletOpt) => {
              const isActive = filterWallet === walletOpt.value;
              return (
                <button key={walletOpt.key} onClick={() => setFilterWallet(walletOpt.value)}
                  className={`${pillBase} flex items-center gap-1.5 ${
                    isActive ? "bg-primary/90 text-slate-900 border-primary" : pillInactive
                  }`}>
                  {walletOpt.icon && (
                    <span className="text-[12px] leading-none">{walletOpt.icon}</span>
                  )}
                  {!walletOpt.icon && walletOpt.value === WALLET_ALL && (
                    <Icon name="account_balance_wallet" sizeClass="text-[12px]" />
                  )}
                  {walletOpt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="glass-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="receipt_long" sizeClass="text-[16px] text-on-surface-variant" />
          <p className="text-xs font-semibold text-on-surface-variant">
            {filtered.length} transaksi
            {filterKat !== ALL && ` · ${filterKat}`}
            {selectedWalletLabel && ` · ${selectedWalletLabel}`}
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
          <Icon name="folder_open" sizeClass="text-[48px] text-on-surface-variant/30 mb-4" />
          <p className="text-sm font-semibold text-on-surface-variant">Tidak ada transaksi</p>
          <p className="text-xs text-on-surface-variant/60 mt-1">
            {search || filterKat !== ALL || filterWallet !== WALLET_ALL
              ? "Coba ganti filter atau kata pencarian"
              : "Belum ada transaksi bulan ini"}
          </p>
          {!search && filterKat === ALL && filterWallet === WALLET_ALL && (
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
          <div className="glass-card">
            {txList.map((tx, i) => {
              const m = getMeta(tx.kategori, categories);
              const walletName = tx.wallets?.name || tx.to_wallet?.name || tx.wallet?.name || "";
              const isConf = confirmId === tx.id;
              const isDel  = deletingId === tx.id;
              return (
                <div key={tx.id}
                  className={`flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3.5 transition-all ${
                    i < txList.length - 1 ? "border-b border-outline-variant/20" : ""
                  } ${isConf ? "bg-error/5" : "hover:bg-surface-container-high/50"}`}>

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={m.icon} className={m.color} sizeClass="text-[18px]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{tx.catatan || tx.kategori}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                        {tx.kategori}
                      </span>
                      {walletName ? (
                        <>
                          <span className="text-[9px] text-outline">•</span>
                          <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">{walletName}</span>
                        </>
                      ) : null}
                      <span className="text-[9px] text-outline">•</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(tx.tanggal).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}
                      </span>
                    </div>
                  </div>

                  {/* Amount + delete */}
                  <div className="w-full md:w-auto order-last md:order-none flex flex-col items-start md:items-end gap-1.5 md:flex-shrink-0 mt-2 md:mt-0">
                    <p className={`text-sm font-bold ${tx.nominal < 0 ? "text-emerald-400" : "text-error"}`}>
                      {tx.nominal < 0 ? "+" : "-"}{formatRupiah(Math.abs(tx.nominal))}
                    </p>
                    {!isConf ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingTx(tx)}
                          className="text-[10px] text-outline hover:text-emerald-400 transition-colors font-semibold flex items-center gap-0.5">
                          <Icon name="edit" sizeClass="text-[12px]" /> Edit
                        </button>
                        <button onClick={() => setConfirmId(tx.id)}
                          className="text-[10px] text-outline hover:text-error transition-colors font-semibold flex items-center gap-0.5">
                          <Icon name="delete" sizeClass="text-[12px]" /> Hapus
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
