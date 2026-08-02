import React, { useState } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import Icon from "../components/ui/Icon";
import { formatRupiah } from "../utils/helpers";

export default function AutoSplitSettingsPage({ setTab }) {
  const {
    autoSplitRules,
    autoSplitLoading,
    addAutoSplitRule,
    updateAutoSplitRule,
    deleteAutoSplitRule,
    wallets,
    savingsGoals,
    transactions,
    addTransaction,
  } = useTransaction();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRuleForPayment, setSelectedRuleForPayment] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("fixed");
  const [value, setValue] = useState("");
  const [targetType, setTargetType] = useState("wallet");
  const [targetId, setTargetId] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resetForm = () => {
    setName("");
    setType("fixed");
    setValue("");
    setTargetType("wallet");
    setTargetId(wallets.length > 0 ? wallets[0].id : "");
    setEditingId(null);
    setErrorMsg("");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setName(rule.name);
    setType(rule.type);
    setValue(rule.value);
    if (rule.target_wallet_id) {
      setTargetType("wallet");
      setTargetId(rule.target_wallet_id);
    } else if (rule.target_savings_goal_id) {
      setTargetType("savings");
      setTargetId(rule.target_savings_goal_id);
    }
    setEditingId(rule.id);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setErrorMsg("");
    if (!name.trim()) { setErrorMsg("Nama tidak boleh kosong"); return; }
    const numValue = Number(value);
    if (!numValue || numValue <= 0) { setErrorMsg("Nilai harus lebih dari 0"); return; }
    if (type === "percentage" && numValue > 100) { setErrorMsg("Persentase maksimal 100%"); return; }
    if (!targetId) { setErrorMsg("Target dompet/celengan harus dipilih"); return; }

    setSaving(true);
    
    // Fixed ditaruh di urutan awal (priority = 1), Waterfall di tengah (priority = 2), Percentage di akhir (priority = 3)
    let priority = 3;
    if (type === "fixed") priority = 1;
    else if (type === "waterfall") priority = 2;
    
    const payload = {
      name,
      type,
      value: numValue,
      priority,
      target_wallet_id: targetType === "wallet" ? targetId : null,
      target_savings_goal_id: targetType === "savings" ? targetId : null,
    };

    let result;
    if (editingId) {
      result = await updateAutoSplitRule(editingId, payload);
    } else {
      result = await addAutoSplitRule(payload);
    }

    setSaving(false);
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus aturan auto-split ini?")) {
      const result = await deleteAutoSplitRule(id);
      if (result.error) alert(result.error);
    }
  };

  const confirmPayBill = async () => {
    if (!selectedRuleForPayment) return;
    setIsPaying(true);
    
    await addTransaction({
      jenis: "pengeluaran",
      nominal: selectedRuleForPayment.value,
      kategori: "Tagihan", // Or generic
      catatan: selectedRuleForPayment.name,
      wallet_id: selectedRuleForPayment.target_wallet_id || wallets[0]?.id,
      tanggal: new Date().toISOString()
    });
    
    setIsPaying(false);
    setSelectedRuleForPayment(null);
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[800px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTab("dashboard")}
              className="w-10 h-10 rounded-full bg-surface-dim border border-outline-variant/30 flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <Icon name="arrow_back" sizeClass="text-[20px]" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-on-surface">Auto-Split Gaji</h2>
          </div>
          <p className="text-sm text-on-surface-variant mt-2 max-w-xl">
            Atur pembagian otomatis pemasukanmu. Potongan Nominal Tetap (Fixed) akan diprioritaskan, sisanya akan dibagi berdasarkan Persentase.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-500 text-slate-900 font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Icon name="add" sizeClass="text-[18px]" />
          <span className="hidden md:inline">Tambah Rule</span>
        </button>
      </div>

      {autoSplitLoading ? (
        <div className="flex justify-center py-10">
          <svg className="animate-spin h-7 w-7 text-emerald-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
          </svg>
        </div>
      ) : autoSplitRules.length === 0 ? (
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center">
          <Icon name="account_tree" sizeClass="text-[64px] text-emerald-500/20 mb-4" />
          <p className="text-base font-bold text-on-surface mb-2">Belum ada rule pembagian</p>
          <p className="text-sm text-on-surface-variant max-w-xs mb-6">
            Klik Tambah Rule untuk mulai membagi gajimu secara otomatis ke dompet dan celengan.
          </p>
          <button onClick={openAddModal} className="text-sm font-bold text-emerald-400 hover:underline">
            + Buat Rule Pertamamu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {autoSplitRules.map((rule, idx) => {
            const isFixed = rule.type === 'fixed';
            let isPaid = false;
            
            if (isFixed && transactions && transactions.length > 0) {
              isPaid = transactions.some(t => {
                const rawJenis = typeof t.jenis === 'string' ? t.jenis.toLowerCase() : "";
                const isExpense = rawJenis === 'pengeluaran' || Number(t.nominal || 0) > 0;
                return isExpense && t.catatan?.toLowerCase() === rule.name.toLowerCase();
              });
            }

            let spentForRule = 0;
            if (!isFixed && transactions && transactions.length > 0) {
              spentForRule = transactions.filter(t => {
                const rawJenis = typeof t.jenis === 'string' ? t.jenis.toLowerCase() : "";
                const isExpense = rawJenis === 'pengeluaran' || Number(t.nominal || 0) > 0;
                // Cocokkan nama kategori atau deskripsi dengan nama rule
                return isExpense && (t.kategori?.toLowerCase() === rule.name.toLowerCase() || t.catatan?.toLowerCase() === rule.name.toLowerCase());
              }).reduce((acc, curr) => acc + Math.abs(Number(curr.nominal || 0)), 0);
            }

            const ruleValue = Number(rule.value || 0);
            const isMaxCap = rule.type === 'waterfall';
            const progressPct = isMaxCap && ruleValue > 0 ? Math.min(100, Math.round((spentForRule / ruleValue) * 100)) : 0;
            const isOverspent = isMaxCap && spentForRule >= ruleValue;

            return (
            <div key={rule.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4" style={{borderLeftColor: rule.type === 'fixed' ? '#fb923c' : rule.type === 'waterfall' ? '#60a5fa' : '#4edea3'}}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${rule.type === 'fixed' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' : rule.type === 'waterfall' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                  <Icon name={rule.type === 'fixed' ? 'push_pin' : rule.type === 'waterfall' ? 'water_drop' : 'percent'} sizeClass="text-[18px]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    {rule.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${rule.type === 'fixed' ? 'bg-orange-500/20 text-orange-400' : rule.type === 'waterfall' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {rule.type === 'waterfall' ? 'MAX CAP' : rule.type.toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-lg font-black mt-1">
                    {rule.type === 'percentage' ? `${rule.value}%` : formatRupiah(rule.value)}
                  </p>
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                    <Icon name="subdirectory_arrow_right" sizeClass="text-[12px]" />
                    Target: {rule.target_wallet_id ? wallets.find(w => w.id === rule.target_wallet_id)?.name : savingsGoals.find(s => String(s.id) === String(rule.target_savings_goal_id))?.name}
                  </p>
                  
                  {/* BILL TRACKER LOGIC */}
                  {isFixed && (
                    <div className="mt-3">
                      {isPaid ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold">
                          <Icon name="check_circle" sizeClass="text-[14px]" />
                          Sudah Dibayar Bulan Ini
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedRuleForPayment(rule)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition-colors text-xs font-bold"
                        >
                          <Icon name="credit_card" sizeClass="text-[16px]" />
                          Catat Pembayaran
                        </button>
                      )}
                    </div>
                  )}

                  {/* SMART PROGRESS MONITOR (MAX CAP) */}
                  {isMaxCap && (
                    <div className="mt-4 max-w-sm">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Monitor Pengeluaran</span>
                        <span className={`text-[10px] font-bold ${isOverspent ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {formatRupiah(spentForRule)} / {formatRupiah(ruleValue)}
                        </span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${isOverspent ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${progressPct}%`, transition: 'width 0.5s ease-in-out' }}
                        ></div>
                      </div>
                      {isOverspent && (
                        <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                          <Icon name="warning" sizeClass="text-[12px]" />
                          Batas Maksimal Tercapai
                        </p>
                      )}
                    </div>
                  )}

                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => openEditModal(rule)}
                  className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Icon name="edit" sizeClass="text-[18px]" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Icon name="delete" sizeClass="text-[18px]" />
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md glass-card bg-surface-container-high/95 p-6 animate-slide-up overflow-hidden">
            <h3 className="text-lg font-bold text-on-surface mb-4">{editingId ? "Edit Rule" : "Tambah Rule"}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nama Potongan</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Cth: WiFi, Ortu, Liburan"
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Tipe Potongan</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setType("fixed")}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-colors ${type === "fixed" ? "border-orange-400 bg-orange-400/10 text-orange-400" : "border-outline-variant/30 text-on-surface-variant"}`}
                  >
                    Nominal Tetap
                  </button>
                  <button
                    onClick={() => setType("waterfall")}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-colors ${type === "waterfall" ? "border-blue-400 bg-blue-400/10 text-blue-400" : "border-outline-variant/30 text-on-surface-variant"}`}
                  >
                    Batas Maksimal
                  </button>
                  <button
                    onClick={() => setType("percentage")}
                    className={`py-2 rounded-xl text-xs sm:text-sm font-bold border-2 transition-colors ${type === "percentage" ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-outline-variant/30 text-on-surface-variant"}`}
                  >
                    Persentase
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  {type === "percentage" ? "Persentase (%)" : "Nominal (Rp)"}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "20" : "300000"}
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value);
                      setTargetId(e.target.value === "wallet" ? (wallets[0]?.id || "") : (savingsGoals[0]?.id || ""));
                    }}
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none appearance-none"
                  >
                    <option value="wallet">Dompet</option>
                    <option value="savings">Celengan</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Pilih {targetType === "wallet" ? "Dompet" : "Celengan"}</label>
                  <select
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-3 py-3 text-sm focus:border-emerald-500 focus:outline-none appearance-none"
                  >
                    {targetType === "wallet" 
                      ? wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                      : savingsGoals.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    }
                  </select>
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-error text-xs font-semibold mt-4">{errorMsg}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface-variant"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 text-sm font-bold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Payment Confirmation Modal */}
      {selectedRuleForPayment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setSelectedRuleForPayment(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm glass-card bg-surface-container-high/95 p-6 animate-slide-up overflow-hidden shadow-2xl border border-emerald-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Icon name="credit_card" sizeClass="text-[32px] text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Konfirmasi Pembayaran</h3>
              <p className="text-sm text-on-surface-variant mb-6">
                Catat pembayaran tagihan <span className="font-bold text-on-surface">{selectedRuleForPayment.name}</span> sebesar <span className="font-bold text-emerald-400">{formatRupiah(selectedRuleForPayment.value)}</span>?
              </p>
              
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRuleForPayment(null)}
                  disabled={isPaying}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmPayBill}
                  disabled={isPaying}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 text-sm font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>Memproses...</>
                  ) : "Ya, Catat"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
