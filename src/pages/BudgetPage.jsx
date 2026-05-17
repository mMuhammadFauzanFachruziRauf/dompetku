import { useState, useEffect } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import { formatRupiah, getMeta } from "../utils/helpers";
import Icon from "../components/ui/Icon";

export default function BudgetPage() {
  const { getBudgetProgress, categories, categoryBudgets, currentMonthCategoryBudgets, updateCategoryBudgets } = useTransaction();

  // Progress Data
  const progressData = getBudgetProgress();

  // Management Form State
  const [localBudgets, setLocalBudgets] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setLocalBudgets(currentMonthCategoryBudgets || {});
  }, [currentMonthCategoryBudgets]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBudgetChange = (category, value) => {
    const numericVal = Number(value.replace(/\D/g, ""));
    setLocalBudgets(prev => ({
      ...prev,
      [category]: numericVal
    }));
  };

  const handleSaveBudgets = async () => {
    setLoading(true);
    // filter out empty/0 values
    const cleanBudgets = Object.entries(localBudgets).reduce((acc, [k, v]) => {
      if (v > 0) acc[k] = v;
      return acc;
    }, {});

    const { error } = await updateCategoryBudgets(cleanBudgets);
    setLoading(false);

    if (error) {
      showToast(`❌ ${error}`, false);
    } else {
      showToast("✅ Alokasi berhasil disimpan!");
    }
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[800px] mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-up ${toast.ok ? "bg-emerald-500 text-slate-900" : "bg-error text-slate-900"
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface">Sistem Amplop</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">Pantau dan kelola batas pengeluaran kategori bulananmu.</p>
      </div>

      {/* ── Progress Section ── */}
      <section className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="monitoring" sizeClass="text-[20px] text-emerald-400" />
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Progress Bulan Ini</h3>
        </div>

        {progressData.length === 0 ? (
          <div className="text-center py-6 bg-surface-dim rounded-xl border border-outline-variant/30">
            <p className="text-sm text-on-surface-variant">Belum ada alokasi budget yang diatur.</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">Silakan atur di bagian manajemen di bawah.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {progressData.map((item, idx) => {
              const meta = getMeta(item.category, categories);
              let barColor = "bg-emerald-500";
              if (item.percentage >= 100) barColor = "bg-error";
              else if (item.percentage >= 75) barColor = "bg-orange-500";

              return (
                <div key={idx} className="bg-surface-dim rounded-xl p-4 border border-outline-variant/30">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center`}>
                        <Icon name={meta.icon} className={meta.color} sizeClass="text-[16px]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{item.category}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          Terpakai: {formatRupiah(item.spent, true)} / {formatRupiah(item.limit, true)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${item.remaining < 0 ? "text-error" : "text-emerald-400"}`}>
                        {item.remaining < 0 ? `Overbudget: ${formatRupiah(item.remaining)}` : `Sisa: ${formatRupiah(item.remaining)}`}
                      </p>
                      <p className={`text-[11px] font-semibold mt-0.5 ${item.percentage >= 100 ? "text-error" : "text-on-surface-variant"}`}>
                        {item.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Management Section ── */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="tune" sizeClass="text-[20px] text-primary" />
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Manajemen Alokasi</h3>
        </div>

        <p className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
          <span className="font-bold text-emerald-400">Info:</span> Atur jatah bulanan di sini. Angka ini akan menjadi patokan tetap untuk bulan-bulan berikutnya sampai kamu mengubahnya lagi.
        </p>

        <div className="space-y-3 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {categories.filter(c => c.type === "Needs" || c.type === "Wants").map((cat) => {
            const val = localBudgets[cat.name] || "";
            const meta = getMeta(cat.name, categories);
            return (
              <div key={cat.id} className="flex items-center justify-between bg-surface-dim p-3 rounded-xl border border-outline-variant/30 hover:border-outline-variant/50 transition-all">
                <div className="flex items-center gap-2 w-1/2">
                  <div className={`w-7 h-7 rounded-full ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={meta.icon} className={meta.color} sizeClass="text-[14px]" />
                  </div>
                  <p className="text-xs font-semibold text-on-surface truncate">{cat.name}</p>
                </div>
                <div className="relative w-[130px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={val ? Number(val).toLocaleString("id-ID") : ""}
                    onChange={(e) => handleBudgetChange(cat.name, e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface-container-high border border-outline-variant/50 rounded-lg pl-8 pr-3 py-2 text-on-surface text-xs font-bold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-right"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSaveBudgets}
          disabled={loading}
          className="w-full mt-4 bg-emerald-500 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
        >
          {loading
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" /></svg>Menyimpan...</>
            : <><Icon name="save" sizeClass="text-[18px]" />Simpan Alokasi</>
          }
        </button>
      </section>
    </div>
  );
}
