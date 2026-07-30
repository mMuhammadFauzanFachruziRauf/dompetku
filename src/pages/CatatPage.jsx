import { useState, useEffect, useCallback } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import {
  parseSmartInput,
  inferCategoryFromText,
  checkSpendingAnomaly,
  getMeta,
  formatRupiah,
} from "../utils/helpers";
import Icon from "../components/ui/Icon";
import { useSearchParams } from "react-router-dom";
import { calculateAutoSplit } from "../utils/autoSplitLogic";
import AutoSplitPreviewModal from "../components/AutoSplitPreviewModal";

function BudgetWarningModal({ open, amount, remaining, totalMonthlyIncome, onConfirm, onCancel }) {
  if (!open) return null;

  const projectedRemaining = remaining - amount;
  const pctOfIncome = totalMonthlyIncome > 0
    ? Math.round((amount / totalMonthlyIncome) * 100)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md glass-card border border-orange-500/30 bg-surface-container-high/95 p-6 shadow-2xl animate-slide-up overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-4">
            <Icon name="savings" sizeClass="text-[32px] text-orange-400" />
          </div>

          <h3 className="text-lg font-bold text-on-surface mb-2">Belanja Besar Terdeteksi</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
            Wah, belanjanya lumayan besar hari ini. Yakin udah sesuai budget 50/30/20 kamu?
          </p>

          <div className="w-full rounded-xl bg-surface-dim border border-outline-variant/30 p-4 space-y-2 mb-6 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Nominal transaksi</span>
              <span className="font-bold text-error">{formatRupiah(amount)}</span>
            </div>
            {pctOfIncome !== null && pctOfIncome >= 20 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Dari penghasilan bulan ini</span>
                <span className="font-bold text-orange-400">{pctOfIncome}%</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Sisa budget setelah ini</span>
              <span className={`font-bold ${projectedRemaining < 0 ? "text-error" : "text-secondary"}`}>
                {projectedRemaining < 0 ? "-" : ""}{formatRupiah(Math.abs(projectedRemaining))}
              </span>
            </div>
          </div>

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onConfirm?.()}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 text-sm font-bold hover:bg-emerald-400 transition-all active:scale-[0.98]"
            >
              Tetap Catat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatatPage({ setTab }) {
  const [searchParams] = useSearchParams();
  const {
    addTransaction,
    categories,
    shortcuts,
    wallets,
    walletBalances,
    totalMonthlyIncome,
    remaining,
    autoSplitRules,
    executeAutoSplit,
    savingsGoals,
  } = useTransaction();

  // Auto Split state
  const [autoSplitModal, setAutoSplitModal] = useState(null);
  const [autoSplitExecuting, setAutoSplitExecuting] = useState(false);

  const triggerAutoSplitModal = (nominalAmount, executeSaveFn) => {
    if (autoSplitRules && autoSplitRules.length > 0) {
      const splitResult = calculateAutoSplit(nominalAmount, autoSplitRules, wallets, savingsGoals);
      setAutoSplitModal({
        ...splitResult,
        incomeAmount: nominalAmount,
        onConfirm: () => {
          executeSaveFn(true, splitResult.allocations);
        }
      });
      return true;
    }
    return false;
  };

  // Smart input state
  const [smartText,    setSmartText]    = useState("");
  const [smartPreview, setSmartPreview] = useState(null);
  const [smartError,   setSmartError]   = useState("");
  const [smartLoading, setSmartLoading] = useState(false);

  // Manual form state
  const [jenis,    setJenis]    = useState("Pengeluaran");
  const [nominal,  setNominal]  = useState("");
  const [kategori, setKategori] = useState("Lainnya");
  const [catatan,  setCatatan]  = useState("");
  const [tanggal,  setTanggal]  = useState(new Date().toISOString().split("T")[0]);
  const [walletId, setWalletId] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [manLoading, setManLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [autoInferredCategory, setAutoInferredCategory] = useState(null);
  const [warningModal, setWarningModal] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Smart input handlers
  const handleSmartChange = (val) => {
    setSmartText(val);
    setSmartError("");
    setSmartPreview(val.trim() ? parseSmartInput(val, categories) : null);
  };

  const submitSmartTransaction = async (isAutoSplitConfirmed = false, allocations = []) => {
    const parsed = parseSmartInput(smartText, categories);
    if (!parsed) { setSmartError("Format tidak dikenali. Contoh: 'Makan siang 50000'"); return; }
    
    if (isAutoSplitConfirmed) setAutoSplitExecuting(true);
    else setSmartLoading(true);

    let error = null;
    if (isAutoSplitConfirmed) {
      const payload = { ...parsed, nominal: -Math.abs(parsed.nominal) };
      const res = await executeAutoSplit(payload, allocations);
      error = res.error;
    } else {
      const res = await addTransaction(parsed);
      error = res.error;
    }

    setSmartLoading(false);
    setAutoSplitExecuting(false);
    setAutoSplitModal(null);
    if (error) { setSmartError(error); return; }
    showToast(`✅ Dicatat ke ${parsed.kategori}!`);
    setSmartText(""); setSmartPreview(null); setSmartError("");
    setTimeout(() => setTab("dashboard"), 800);
  };

  const handleSmartSubmit = () => {
    const parsed = parseSmartInput(smartText, categories);
    if (!parsed) { setSmartError("Format tidak dikenali. Contoh: 'Makan siang 50000'"); return; }

    if (parsed.isIncome) {
      if (triggerAutoSplitModal(Math.abs(parsed.nominal), submitSmartTransaction)) return;
    } else {
      const anomaly = checkSpendingAnomaly(parsed.nominal, totalMonthlyIncome, remaining);
      if (anomaly) {
        setWarningModal({
          amount: parsed.nominal,
          onConfirm: () => {
            setWarningModal(null);
            submitSmartTransaction();
          },
        });
        return;
      }
    }

    submitSmartTransaction();
  };

  const applyAutoCategory = useCallback((text, currentJenis) => {
    if (currentJenis !== "Pengeluaran" && currentJenis !== "Pemasukan") return;
    const inferred = inferCategoryFromText(text, categories, { jenis: currentJenis });
    if (inferred) {
      setKategori(inferred.category);
      setAutoInferredCategory(inferred.category);
    } else {
      setAutoInferredCategory(null);
    }
  }, [categories]);

  const handleCatatanChange = (val) => {
    setCatatan(val);
    if (!categoryManuallySet && (jenis === "Pengeluaran" || jenis === "Pemasukan")) {
      applyAutoCategory(val, jenis);
    }
  };

  const handleKategoriChange = (val) => {
    setKategori(val);
    setCategoryManuallySet(true);
    setAutoInferredCategory(null);
  };

  const executeManualSubmit = async (isAutoSplitConfirmed = false, allocations = []) => {
    const nom = parseFloat(String(nominal).replace(/\./g,"").replace(/,/g,""));
    if (!nom || nom <= 0) { showToast("❌ Nominal harus diisi dan lebih dari 0", false); return; }
    if (isInsufficientBalance) { showToast("❌ Saldo tidak mencukupi di dompet ini!", false); return; }
    if (jenis === "Transfer") {
      if (!fromWalletId || !toWalletId) {
        showToast("❌ Pilih dompet asal dan tujuan terlebih dahulu", false);
        return;
      }
      if (fromWalletId === toWalletId) {
        showToast("❌ Dompet asal dan tujuan tidak boleh sama", false);
        return;
      }
    } else if (!walletId) {
      showToast("❌ Pilih dompet / rekening terlebih dahulu", false);
      return;
    }
    setManLoading(true);
    const isIncome = jenis === "Pemasukan";
    const isTransfer = jenis === "Transfer";
    const finalNominal = isTransfer ? nom : (isIncome ? -nom : nom);
    const finalKat = isTransfer ? "Transfer" : kategori;
    
    // Combine date with current time to maintain chronological ordering
    const now = new Date();
    const [y, m, d] = tanggal.split("-");
    const dateObj = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
    
    const payload = { 
      nominal: finalNominal, 
      kategori: finalKat, 
      catatan: catatan || finalKat,
      tanggal: dateObj.toISOString(),
      jenis: isTransfer ? "transfer" : (isIncome ? "pemasukan" : "pengeluaran"),
      wallet_id: isTransfer ? fromWalletId : walletId,
      to_wallet_id: isTransfer ? toWalletId : null,
    };

    if (isAutoSplitConfirmed) setAutoSplitExecuting(true);
    else setManLoading(true);

    let error = null;
    if (isAutoSplitConfirmed) {
      const res = await executeAutoSplit(payload, allocations);
      error = res.error;
    } else {
      const res = await addTransaction(payload);
      error = res.error;
    }

    setManLoading(false);
    setAutoSplitExecuting(false);
    setAutoSplitModal(null);
    if (error) { showToast(`❌ ${error}`, false); return; }

    // Success notification (use clearer message for Pemasukan)
    if (isTransfer) {
      showToast("✅ Transfer berhasil dicatat!");
    } else if (isIncome) {
      showToast("✅ Pemasukan berhasil dicatat!");
    } else {
      showToast(`✅ Dicatat ke ${finalKat}!`);
    }

    // Reset form inputs
    setNominal("");
    setCatatan("");
    setTanggal(new Date().toISOString().split("T")[0]);
    if (wallets && wallets.length > 0) {
      setWalletId(wallets[0].id);
      setFromWalletId(wallets[0].id);
      const nextTo = wallets.find((w) => w.id !== wallets[0].id);
      setToWalletId(nextTo ? nextTo.id : "");
    }

    // reset kategori to sensible default after submit
    if (!isTransfer && categories && categories.length > 0) {
      const defaultList = categories.filter(c => c.type === (isIncome ? "Income" : "Needs"));
      setKategori(defaultList.length > 0 ? defaultList[0].name : categories[0].name);
    } else if (!isTransfer) {
      setKategori("Lainnya");
    }
    setCategoryManuallySet(false);
    setAutoInferredCategory(null);

    setTimeout(() => setTab("dashboard"), isIncome ? 1400 : 800);
  };

  const handleManualSubmit = () => {
    const nom = parseFloat(String(nominal).replace(/\./g,"").replace(/,/g,""));
    if (!nom || nom <= 0) { showToast("❌ Nominal harus diisi dan lebih dari 0", false); return; }
    if (isInsufficientBalance) { showToast("❌ Saldo tidak mencukupi di dompet ini!", false); return; }
    if (jenis === "Transfer") {
      if (!fromWalletId || !toWalletId) {
        showToast("❌ Pilih dompet asal dan tujuan terlebih dahulu", false);
        return;
      }
      if (fromWalletId === toWalletId) {
        showToast("❌ Dompet asal dan tujuan tidak boleh sama", false);
        return;
      }
    } else if (!walletId) {
      showToast("❌ Pilih dompet / rekening terlebih dahulu", false);
      return;
    }

    if (jenis === "Pemasukan") {
      if (triggerAutoSplitModal(nom, executeManualSubmit)) return;
    }

    if (jenis === "Pengeluaran") {
      const anomaly = checkSpendingAnomaly(nom, totalMonthlyIncome, remaining);
      if (anomaly) {
        setWarningModal({
          amount: nom,
          onConfirm: () => {
            setWarningModal(null);
            executeManualSubmit();
          },
        });
        return;
      }
    }

    executeManualSubmit();
  };

  const preview = smartPreview;
  const previewMeta = preview ? getMeta(preview.kategori, categories) : null;

  // Group categories for dropdown (include Income)
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, { Needs: [], Wants: [], Savings: [], Income: [] });

  // Keep selected category in sync when categories or jenis change
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    setCategoryManuallySet(false);
    setAutoInferredCategory(null);
    if (jenis === "Pemasukan") {
      const incomeCats = categories.filter(c => c.type === "Income");
      if (incomeCats.length > 0) setKategori(incomeCats[0].name);
      else setKategori(categories[0].name);
    } else {
      // expense default: first Needs/Wants/Savings present
      const expenseOrder = ["Needs", "Wants", "Savings"];
      let found = null;
      for (const t of expenseOrder) {
        const list = categories.filter(c => c.type === t);
        if (list.length > 0) { found = list[0].name; break; }
      }
      setKategori(found || categories[0].name);
    }
  }, [categories, jenis]);

  useEffect(() => {
    if (!wallets || wallets.length === 0) return;
    const firstWalletId = wallets[0].id;
    if (!walletId) setWalletId(firstWalletId);
    if (!fromWalletId) setFromWalletId(firstWalletId);
    if (!toWalletId || toWalletId === firstWalletId) {
      const nextTo = wallets.find((w) => w.id !== firstWalletId);
      setToWalletId(nextTo ? nextTo.id : "");
    }
  }, [wallets, walletId, fromWalletId, toWalletId]);

  const availableToWallets = wallets.filter((w) => w.id !== fromWalletId);
  const selectedWallet = wallets.find((w) => w.id === walletId);
  const selectedFromWallet = wallets.find((w) => w.id === fromWalletId);
  const selectedToWallet = wallets.find((w) => w.id === toWalletId);
  const getWalletBalance = (id) => Number(
    walletBalances?.[id]?.balance ?? wallets.find((w) => w.id === id)?.starting_balance ?? 0
  );
  const parsedNominal = parseFloat(String(nominal).replace(/\./g, "").replace(/,/g, "")) || 0;
  const sourceWallet = jenis === "Transfer" ? selectedFromWallet : selectedWallet;
  const sourceWalletBalance = sourceWallet
    ? Number(walletBalances?.[sourceWallet.id]?.balance ?? sourceWallet.starting_balance ?? 0)
    : 0;
  const needsBalanceValidation = jenis === "Pengeluaran" || jenis === "Transfer";
  const isInsufficientBalance = needsBalanceValidation && parsedNominal > 0 && parsedNominal > sourceWalletBalance;

  // Handle localStorage flag for auto-opening Transfer tab
  useEffect(() => {
    // Check for localStorage flag (from Dashboard quick action)
    if (localStorage.getItem('openTransferTab') === 'true') {
      setJenis('Transfer');
      localStorage.removeItem('openTransferTab'); // clean up immediately
      return;
    }
    
    // Fallback to URL parameter for direct links
    if (searchParams.get('transfer') === 'true') {
      setJenis('Transfer');
      // Clean up the URL parameter
      searchParams.delete('transfer');
      window.history.replaceState(null, '', `?${searchParams.toString()}`);
    }
  }, [searchParams]);

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[800px] mx-auto space-y-5">
      <BudgetWarningModal
        open={!!warningModal}
        amount={warningModal?.amount ?? 0}
        remaining={remaining}
        totalMonthlyIncome={totalMonthlyIncome}
        onConfirm={warningModal?.onConfirm}
        onCancel={() => setWarningModal(null)}
      />

      <AutoSplitPreviewModal
        open={!!autoSplitModal}
        incomeAmount={autoSplitModal?.incomeAmount ?? 0}
        allocations={autoSplitModal?.allocations ?? []}
        isValid={autoSplitModal?.isValid ?? true}
        remaining={autoSplitModal?.remaining ?? 0}
        error={autoSplitModal?.error}
        onConfirm={autoSplitModal?.onConfirm}
        onCancel={() => setAutoSplitModal(null)}
        isExecuting={autoSplitExecuting}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-up ${
          toast.ok ? "bg-emerald-500 text-slate-900" : "bg-error text-slate-900"
        }`}>
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-on-surface">Catat Pengeluaran</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">Ketik cepat atau isi form manual</p>
      </div>

      {/* ── Smart Input ── */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="auto_awesome" sizeClass="text-[18px] text-emerald-400" />
          <h3 className="text-sm font-bold text-on-surface">Input Cepat</h3>
          <span className="text-xs text-on-surface-variant">— kategori otomatis terdeteksi</span>
        </div>

        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors">
            <Icon name="edit_note" sizeClass="text-[20px]" />
          </span>
          <input
            value={smartText}
            onChange={e => handleSmartChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !smartLoading && handleSmartSubmit()}
            placeholder="Ketik pengeluaran (Cth: Makan siang 50000)"
            className="w-full bg-surface-dim text-on-surface text-sm rounded-xl border border-outline-variant/50 px-4 py-4 pl-12 pr-24 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/50"
          />
          <button
            onClick={handleSmartSubmit}
            disabled={!smartText.trim() || smartLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-40 transition-all active:scale-95 ${
              preview?.isIncome 
                ? "bg-secondary hover:bg-secondary/80 shadow-[0_0_12px_rgba(78,222,163,0.4)]" 
                : "bg-emerald-500 hover:bg-emerald-400"
            }`}
          >
            {smartLoading ? "..." : preview?.isIncome ? "+ Pemasukan" : "Catat"}
          </button>
        </div>

        {/* Error */}
        {smartError && (
          <p className="text-xs text-error flex items-center gap-1.5">
            <Icon name="error" sizeClass="text-[14px]" />
            {smartError}
          </p>
        )}

        {/* Live preview */}
        {preview && !smartError && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full ${previewMeta.bg} flex items-center justify-center`}>
                <Icon name={previewMeta.icon} className={`${previewMeta.color}`} sizeClass="text-[16px]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-secondary">{preview.kategori}</p>
                <p className="text-xs text-on-surface-variant">{preview.catatan}</p>
              </div>
            </div>
            <p className="text-base font-bold text-error">{formatRupiah(preview.nominal)}</p>
          </div>
        )}

        {/* Hint chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {shortcuts && shortcuts.map((h, i) => (
            <button key={i} onClick={() => handleSmartChange(h)}
              className="text-xs px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:border-secondary/50 hover:text-secondary transition-all">
              {h}
            </button>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant/30"/>
        <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest">atau isi manual</span>
        <div className="flex-1 h-px bg-outline-variant/30"/>
      </div>

      {/* ── Manual Form ── */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="tune" sizeClass="text-[18px] text-primary" />
          <h3 className="text-sm font-bold text-on-surface">Form Manual</h3>
        </div>

        {/* Primary Action Tabs */}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setJenis("Pengeluaran")} 
            className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
              jenis === "Pengeluaran" 
                ? "bg-error text-white border-error shadow-lg" 
                : "bg-surface-dim text-on-surface-variant border-outline-variant/30 hover:border-error/50 hover:text-error"
            }`}
          >
            <Icon name="trending_down" sizeClass="text-[18px] mb-1" />
            <div>Pengeluaran</div>
          </button>
          <button 
            onClick={() => setJenis("Pemasukan")} 
            className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
              jenis === "Pemasukan" 
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg" 
                : "bg-surface-dim text-on-surface-variant border-outline-variant/30 hover:border-emerald-500/50 hover:text-emerald-400"
            }`}
          >
            <Icon name="add_circle" sizeClass="text-[18px] mb-1" />
            <div>Pemasukan</div>
          </button>
          <button 
            onClick={() => setJenis("Transfer")} 
            className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
              jenis === "Transfer" 
                ? "bg-primary text-white border-primary shadow-lg" 
                : "bg-surface-dim text-on-surface-variant border-outline-variant/30 hover:border-primary/50 hover:text-primary"
            }`}
          >
            <Icon name="swap_horiz" sizeClass="text-[18px] mb-1" />
            <div>Transfer</div>
          </button>
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
                    {wallet.name} ({formatRupiah(getWalletBalance(wallet.id))})
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
          <div className="space-y-4">
            <div className="bg-surface-dim rounded-xl p-4 border-2 border-primary/20">
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Kirim Dari:
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
                  className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({formatRupiah(getWalletBalance(wallet.id))})
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name="expand_more" sizeClass="text-[18px]" />
                </span>
              </div>
            </div>

            {/* Visual Flow Indicator */}
            <div className="flex justify-center py-2">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-8 h-0.5 bg-primary/60"></div>
                <Icon name="arrow_downward" sizeClass="text-[24px]" />
                <div className="w-8 h-0.5 bg-primary/60"></div>
              </div>
            </div>

            <div className="bg-surface-dim rounded-xl p-4 border-2 border-emerald-500/20">
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Terima Di:
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name={selectedToWallet?.icon || "👛"} sizeClass="text-[18px]" />
                </span>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all appearance-none"
                >
                  {availableToWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name} ({formatRupiah(getWalletBalance(wallet.id))})
                    </option>
                  ))}
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name="expand_more" sizeClass="text-[18px]" />
                </span>
              </div>
            </div>

            {/* Self-transfer validation warning */}
            {fromWalletId === toWalletId && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-xl">
                <p className="text-xs text-error font-semibold flex items-center gap-2">
                  <Icon name="error" sizeClass="text-[16px]" />
                  Dompet asal dan tujuan tidak boleh sama
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tanggal Transaksi */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
            Tanggal Transaksi
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="calendar_today" sizeClass="text-[18px]" />
            </span>
            <input
              type="date" 
              value={tanggal}
              onChange={e => setTanggal(e.target.value)}
              className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
            />
          </div>
        </div>

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
              className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-base font-semibold focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40 placeholder:font-normal"
            />
          </div>
          {isInsufficientBalance && sourceWallet && (
            <p className="mt-2 text-xs text-error font-semibold">
              ⚠️ Saldo {sourceWallet.name} tidak mencukupi (Tersisa: {formatRupiah(sourceWalletBalance, true)})
            </p>
          )}
        </div>

        {/* Nama transaksi — drives smart category */}
        {(jenis === "Pengeluaran" || jenis === "Pemasukan") && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Nama Transaksi / Catatan
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="notes" sizeClass="text-[18px]" />
              </span>
              <input
                type="text"
                value={catatan}
                onChange={(e) => handleCatatanChange(e.target.value)}
                placeholder="Cth: Nasi Padang, Bensin, Skincare..."
                className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all placeholder:text-on-surface-variant/40"
              />
            </div>
            {autoInferredCategory && !categoryManuallySet && (
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                <Icon name="auto_awesome" sizeClass="text-[14px]" />
                Kategori otomatis: <span className="font-bold">{autoInferredCategory}</span>
                <span className="text-on-surface-variant">— bisa diubah manual</span>
              </p>
            )}
          </div>
        )}

        {/* Kategori */}
        {(jenis === "Pengeluaran" || jenis === "Pemasukan") && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Kategori
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name={getMeta(kategori, categories).icon} sizeClass="text-[18px]" />
              </span>
              <select
                value={kategori}
                onChange={(e) => handleKategoriChange(e.target.value)}
                className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
              >
                {jenis === "Pemasukan" ? (
                  <optgroup label="💸 Pemasukan (Income)">
                    {(groupedCategories.Income || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </optgroup>
                ) : (
                  <>
                    <optgroup label="🏠 Kebutuhan (Needs)">
                      {groupedCategories.Needs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                    <optgroup label="🎯 Keinginan (Wants)">
                      {groupedCategories.Wants.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                    <optgroup label="💰 Tabungan (Savings)">
                      {groupedCategories.Savings.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  </>
                )}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                <Icon name="expand_more" sizeClass="text-[18px]" />
              </span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleManualSubmit}
          disabled={manLoading || isInsufficientBalance || (jenis === "Transfer" && fromWalletId === toWalletId)}
          className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
        >
          {manLoading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>Menyimpan...</>
            : <><Icon name="save" sizeClass="text-[18px]" />{jenis === "Pemasukan" ? "Simpan Pemasukan" : (jenis === "Transfer" ? "Simpan Transfer" : "Simpan Pengeluaran")}</>
          }
        </button>
      </section>
    </div>
  );
}
