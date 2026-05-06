import { useMemo } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import { formatRupiah, getMeta } from "../utils/helpers";

export default function StatistikPage() {
  const { transactions, categories, loading, income, totalSpent, remaining, byCategory } = useTransaction();

  const needsTotal   = useMemo(() => categories.filter(c=>c.type==='Needs').reduce((s,c)   => s + (byCategory[c.name]||0), 0), [categories, byCategory]);
  const wantsTotal   = useMemo(() => categories.filter(c=>c.type==='Wants').reduce((s,c)   => s + (byCategory[c.name]||0), 0), [categories, byCategory]);
  const savingsTotal = useMemo(() => categories.filter(c=>c.type==='Savings').reduce((s,c) => s + (byCategory[c.name]||0), 0), [categories, byCategory]);

  const top5 = useMemo(() =>
    Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0,8)
  , [byCategory]);

  const maxVal = top5[0]?.[1] || 1;

  // Daily spending this month (expenses only)
  const dailyMap = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (tx.nominal > 0) {
        const d = new Date(tx.tanggal).getDate();
        map[d] = (map[d] || 0) + tx.nominal;
      }
    });
    return map;
  }, [transactions]);

  const today     = new Date().getDate();
  const days      = Array.from({length: today}, (_, i) => i + 1);
  const maxDaily  = Math.max(...days.map(d => dailyMap[d] || 0), 1);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
      </svg>
    </div>
  );

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[1200px] mx-auto space-y-5">

      <div>
        <h2 className="text-xl font-bold text-on-surface">Statistik</h2>
        <p className="text-sm text-on-surface-variant mt-0.5">Analisis pengeluaranmu bulan ini</p>
      </div>

      {/* Needs / Wants / Savings comparison */}
      <section className="glass-card p-6">
        <h3 className="text-sm font-bold text-on-surface mb-5">Kebutuhan vs Keinginan vs Tabungan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label:"Needs",   val:needsTotal,   color:"#4edea3", ideal:0.5, bg:"bg-emerald-400/10" },
            { label:"Wants",   val:wantsTotal,   color:"#ffb2b7", ideal:0.3, bg:"bg-pink-400/10"    },
            { label:"Savings", val:savingsTotal, color:"#bec6e0", ideal:0.2, bg:"bg-primary/10"     },
          ].map(item => {
            const actual = income > 0 ? item.val / income : 0;
            const diff   = actual - item.ideal;
            return (
              <div key={item.label} className={`p-4 rounded-xl ${item.bg} border border-outline-variant/20`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    diff <= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-error/20 text-error"
                  }`}>
                    {diff <= 0 ? "✓" : "▲"} {Math.abs(Math.round(diff*100))}%
                  </span>
                </div>
                <p className="text-xl font-bold text-on-surface">{formatRupiah(item.val, true)}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {Math.round(actual * 100)}% dari penghasilan · ideal {Math.round(item.ideal*100)}%
                </p>
                <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{width:`${Math.min(actual/item.ideal, 1)*100}%`, background: item.color}}/>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Category bar chart */}
      <section className="glass-card p-6">
        <h3 className="text-sm font-bold text-on-surface mb-5">Top Kategori</h3>
        {top5.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] mb-2">bar_chart</span>
            <p className="text-sm">Belum ada data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {top5.map(([kat, val]) => {
              const m   = getMeta(kat, categories);
              const pct = Math.round((val / maxVal) * 100);
              const ofIncome = income > 0 ? Math.round((val/income)*100) : 0;
              return (
                <div key={kat} className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[16px] ${m.color}`}>{m.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-on-surface">{kat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant">{ofIncome}% income</span>
                        <span className="text-sm font-bold text-on-surface">{formatRupiah(val, true)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${m.bgBase}`}
                        style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Daily spending bar chart */}
      <section className="glass-card p-6">
        <h3 className="text-sm font-bold text-on-surface mb-5">Pengeluaran Harian (Bulan Ini)</h3>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px] mb-2">show_chart</span>
            <p className="text-sm">Belum ada data</p>
          </div>
        ) : (
          <div className="flex items-end gap-1 h-32 overflow-x-auto no-scrollbar pb-6 relative">
            {days.map(d => {
              const val = dailyMap[d] || 0;
              const h   = val > 0 ? Math.max((val / maxDaily) * 100, 8) : 0;
              const isToday = d === today;
              return (
                <div key={d} className="flex flex-col items-center gap-1 flex-shrink-0" style={{minWidth: days.length > 20 ? 16 : 24}}>
                  <div className="w-full flex items-end justify-center" style={{height: 100}}>
                    <div
                      className="w-full rounded-t-sm transition-all duration-500"
                      style={{
                        height: val > 0 ? `${h}%` : "2px",
                        background: isToday ? "#4edea3" : val > 0 ? "#45464d" : "#1f1f21",
                        minHeight: val > 0 ? 4 : 2,
                      }}
                    />
                  </div>
                  <span className={`text-[9px] ${isToday ? "text-secondary font-bold" : "text-on-surface-variant/40"}`}>
                    {d}
                  </span>
                </div>
              );
            })}
            {/* Zero line */}
            <div className="absolute bottom-6 left-0 right-0 h-px bg-outline-variant/20 pointer-events-none"/>
          </div>
        )}
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Penghasilan",  val:formatRupiah(income, true),      icon:"account_balance",      color:"text-primary"   },
          { label:"Total Pengeluaran",  val:formatRupiah(totalSpent, true),  icon:"trending_down",        color:"text-error"     },
          { label:"Sisa Budget",        val:formatRupiah(remaining, true),   icon:"savings",              color:remaining<0?"text-error":"text-secondary" },
          { label:"Rata-rata/transaksi",val:transactions.length > 0 ? formatRupiah(Math.round(totalSpent/transactions.length), true) : "Rp 0",
            icon:"calculate", color:"text-on-surface" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
            <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
