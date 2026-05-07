import { useState, useEffect, useMemo } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import { getMeta, formatRupiah } from "../utils/helpers";
import Icon from "./ui/Icon";

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
  const { categories, wallets, walletBalances, updateTransaction } = useTransaction();
  
  const [jenis, setJenis] = useState("Pengeluaran");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [catatan, setCatatan] = useState("");
  const [walletId, setWalletId] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      const txJenis = (transaction.jenis || "").toLowerCase();
      const inferredType = txJenis === "transfer"
        ? "Transfer"
        : txJenis === "pemasukan" || transaction.nominal < 0
          ? "Pemasukan"
          : "Pengeluaran";
      setJenis(inferredType);
      setNominal(Math.abs(transaction.nominal).toString());
      setKategori(transaction.kategori);
      setCatatan(transaction.catatan || "");
      const initialWalletId = transaction.wallet_id || wallets[0]?.id || "";
      const initialToWalletId = transaction.to_wallet_id || wallets.find((w) => w.id !== initialWalletId)?.id || "";
      setWalletId(initialWalletId);
      setFromWalletId(initialWalletId);
      setToWalletId(initialToWalletId);
      setError("");
      setWarning("");
    }
  }, [isOpen, transaction, wallets]);

  const parsedNominal = parseFloat(String(nominal).replace(/\./g, "").replace(/,/g, "")) || 0;
  const currentTxType = (transaction?.jenis || "").toLowerCase() || (transaction?.nominal < 0 ? "pemasukan" : "pengeluaran");
  const currentTxAbs = Math.abs(Number(transaction?.nominal || 0));
  const currentSourceWalletId = transaction?.wallet_id;

  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedFromWallet = wallets.find((w) => w.id === fromWalletId);
  const selectedToWallet = wallets.find((w) => w.id === toWalletId);
  const availableToWallets = wallets.filter((w) => w.id !== fromWalletId);

  // Group categories for dropdown
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, { Needs: [], Wants: [], Savings: [], Income: [] });

  const selectableCategories = jenis === "Pemasukan"
    ? groupedCategories.Income
    : [...groupedCategories.Needs, ...groupedCategories.Wants, ...groupedCategories.Savings];

  useEffect(() => {
    if (jenis === "Transfer") return;
    if (!selectableCategories.some((c) => c.name === kategori)) {
      setKategori(selectableCategories[0]?.name || "");
    }
  }, [jenis, selectableCategories, kategori]);

  const getWalletBalance = (id) => Number(
    walletBalances?.[id]?.balance ??
    wallets.find((w) => w.id === id)?.starting_balance ??
    0
  );

  const validation = useMemo(() => {
    if (!parsedNominal || parsedNominal <= 0) return { insufficient: false, sourceWalletName: "", sourceBalance: 0 };
    if (jenis === "Pemasukan") return { insufficient: false, sourceWalletName: "", sourceBalance: 0 };

    const sourceId = jenis === "Transfer" ? fromWalletId : walletId;
    if (!sourceId) return { insufficient: false, sourceWalletName: "", sourceBalance: 0 };

    let effectiveBalance = getWalletBalance(sourceId);
    if (currentSourceWalletId === sourceId) {
      if (currentTxType === "pengeluaran" || currentTxType === "transfer") {
        effectiveBalance += currentTxAbs;
      } else if (currentTxType === "pemasukan") {
        effectiveBalance -= currentTxAbs;
      }
    }

    const sourceWalletName = wallets.find((w) => w.id === sourceId)?.name || "Dompet";
    return {
      insufficient: parsedNominal > effectiveBalance,
      sourceWalletName,
      sourceBalance: effectiveBalance,
    };
  }, [parsedNominal, jenis, walletId, fromWalletId, walletBalances, wallets, currentSourceWalletId, currentTxType, currentTxAbs]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!transaction) return;
    setError("");
    setWarning("");

    const nom = parseFloat(nominal.replace(/\./g, "").replace(/,/g, ""));
    if (!nom || nom <= 0) {
      setError("Nominal harus diisi dan lebih dari 0");
      return;
    }
    if (jenis === "Transfer") {
      if (!fromWalletId || !toWalletId) {
        setError("Pilih dompet asal dan tujuan terlebih dahulu");
        return;
      }
      if (fromWalletId === toWalletId) {
        setError("Dompet asal dan tujuan tidak boleh sama");
        return;
      }
    } else if (!walletId) {
      setError("Pilih dompet / rekening terlebih dahulu");
      return;
    }
    if (validation.insufficient) {
      setWarning(`⚠️ Saldo ${validation.sourceWalletName} tidak mencukupi (Tersisa: ${formatRupiah(validation.sourceBalance, true)})`);
      return;
    }

    setLoading(true);
    const isIncome = jenis === "Pemasukan";
    const isTransfer = jenis === "Transfer";
    const finalNominal = isTransfer ? nom : (isIncome ? -nom : nom);
    const finalKat = isTransfer ? "Transfer" : kategori;
    const finalJenis = isTransfer ? "transfer" : (isIncome ? "pemasukan" : "pengeluaran");
    
    const result = await updateTransaction(transaction.id, {
      nominal: finalNominal,
      kategori: finalKat,
      catatan: catatan || finalKat,
      jenis: finalJenis,
      wallet_id: isTransfer ? fromWalletId : walletId,
      to_wallet_id: isTransfer ? toWalletId : null,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result?.success) {
      console.log("Edit modal: save success", result);
      setShowSuccess(true);
      // Close modal after showing success message
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    }
  };

  if (!isOpen || !transaction) return null;
  const formId = `edit-transaction-form-${transaction.id}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-surface-container-high/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Icon name="check_circle" sizeClass="text-[32px] text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-emerald-400">Transaksi Berhasil!</p>
              <p className="text-sm text-on-surface-variant mt-1">Perubahan telah disimpan</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold text-on-surface">Edit Transaksi</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="close" sizeClass="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <form id={formId} onSubmit={handleSave} className="min-h-0 overflow-y-auto max-h-[70vh] p-6 space-y-4">
          {/* Toggle Jenis */}
          <div className="flex bg-surface-dim rounded-xl p-1 border border-outline-variant/30">
            <button type="button" onClick={() => setJenis("Pengeluaran")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${jenis === "Pengeluaran" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Pengeluaran</button>
            <button type="button" onClick={() => setJenis("Pemasukan")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${jenis === "Pemasukan" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Pemasukan Tambahan</button>
            <button type="button" onClick={() => setJenis("Transfer")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${jenis === "Transfer" ? "bg-primary/20 text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Transfer</button>
          </div>

          {/* Wallet selector for expense/income */}
          {(jenis === "Pengeluaran" || jenis === "Pemasukan") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Pilih Dompet / Rekening
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name={selectedWallet?.icon || "👛"} sizeClass="text-[18px]" />
                </span>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({formatRupiah(getWalletBalance(wallet.id), true)})
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name="expand_more" sizeClass="text-[18px]" />
                </span>
              </div>
            </div>
          )}

          {/* Transfer-only fields */}
          {jenis === "Transfer" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                  Dari Dompet
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    <Icon name={selectedFromWallet?.icon || "👛"} sizeClass="text-[18px]" />
                  </span>
                  <select
                    value={fromWalletId}
                    onChange={(e) => {
                      const nextFrom = e.target.value;
                      setFromWalletId(nextFrom);
                      if (nextFrom === toWalletId) {
                        const fallback = wallets.find((w) => w.id !== nextFrom);
                        setToWalletId(fallback ? fallback.id : "");
                      }
                    }}
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} ({formatRupiah(getWalletBalance(wallet.id), true)})
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    <Icon name="expand_more" sizeClass="text-[18px]" />
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                  Ke Dompet
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    <Icon name={selectedToWallet?.icon || "👛"} sizeClass="text-[18px]" />
                  </span>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
                  >
                    {availableToWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} ({formatRupiah(getWalletBalance(wallet.id), true)})
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    <Icon name="expand_more" sizeClass="text-[18px]" />
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Nominal (Rp)
            </label>
          <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="payments" sizeClass="text-[18px]" />
              </span>
              <input
                type="number" value={nominal}
                onChange={e => setNominal(e.target.value)}
                placeholder="50000"
                className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-base font-semibold focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
              />
            </div>
            {validation.insufficient && (
              <p className="mt-2 text-xs text-error font-semibold">
                ⚠️ Saldo {validation.sourceWalletName} tidak mencukupi (Tersisa: {formatRupiah(validation.sourceBalance, true)})
              </p>
            )}
          </div>

          {/* Kategori */}
          {(jenis === "Pengeluaran" || jenis === "Pemasukan") && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Kategori
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectableCategories.map((c) => {
                  const meta = getMeta(c.name, categories);
                  const isActive = kategori === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setKategori(c.name)}
                      className={`flex items-center gap-2 text-left p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-on-surface"
                          : "bg-surface-dim border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon name={meta.icon} className={meta.color} sizeClass="text-[16px]" />
                      </div>
                      <span className="text-xs font-semibold truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Catatan <span className="normal-case font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="notes" sizeClass="text-[18px]" />
              </span>
              <input
                type="text" value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Keterangan singkat..."
                className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
          {warning && <p className="text-xs text-error">{warning}</p>}
        </form>
        <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 flex-shrink-0 bg-surface-container-high">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form={formId}
            disabled={loading || validation.insufficient}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
