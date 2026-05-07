import { useAuth } from "../contexts/AuthContext";
import { useTransaction } from "../contexts/TransactionContext";
import { formatRupiah, formatDate, getMeta } from "../utils/helpers";
import Icon from "../components/ui/Icon";
import { useState } from "react";

function OnboardingBanner({ selectedDate, updateCurrentMonthSalary }) {
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const monthName = selectedDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const handleSave = async (isZero = false) => {
    const finalVal = isZero ? 0 : val;
    if (!isZero && (!val || val < 0)) return;
    setLoading(true);
    await updateCurrentMonthSalary(finalVal, note, true);
    setLoading(false);
  };

  return (
    <div className="glass-card p-6 md:p-10 border border-emerald-500/30 bg-surface-container-high/80 relative overflow-hidden animate-slide-up shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2 shadow-inner">
          <Icon name="waving_hand" sizeClass="text-[40px] text-emerald-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">Selamat Datang di DompetKu!</h2>
        <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
          Untuk mulai menggunakan DompetKu secara maksimal dan melihat ringkasan budget Anda, silakan atur Pemasukan Bulanan utama Anda terlebih dahulu.
        </p>
        
        <div className="w-full mt-6 space-y-4 pt-4 border-t border-outline-variant/20">
          <div className="text-left">
            <label className="block text-sm font-semibold text-on-surface mb-1.5 capitalize">
              Gaji & Catatan {monthName}
            </label>
            <p className="text-xs text-on-surface-variant mb-3">
              Nominal ini khusus untuk bulan yang sedang dipilih.
            </p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="payments" sizeClass="text-[18px]" />
            </span>
            <input
              type="number"
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="Contoh: 5000000"
              className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-4 text-on-surface text-base font-bold focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-on-surface-variant/40 placeholder:font-normal"
            />
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Catatan Gaji, misalnya: Potongan telat 100k"
            rows={3}
            className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3.5 text-on-surface text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-on-surface-variant/40 resize-none"
          />
          <button
            onClick={() => handleSave()}
            disabled={!val || val < 0 || loading}
            className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? "Menyimpan..." : "Mulai Gunakan DompetKu"}
            {!loading && <Icon name="arrow_forward" sizeClass="text-[18px]" />}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="w-full bg-transparent border border-outline-variant/30 text-on-surface-variant font-bold py-4 rounded-xl hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center"
          >
            Saya belum ada pemasukan tetap
          </button>
        </div>
      </div>
    </div>
  );
}

function DonutChart({ pct }) {
  const R = 70, CIRC = 2 * Math.PI * R;
  const dash  = (pct / 100) * CIRC;
  const color = pct >= 90 ? "#ffb4ab" : pct >= 70 ? "#ffb2b7" : "#4edea3";
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      <circle cx={80} cy={80} r={R} fill="none" stroke="#1f1f21" strokeWidth={14}/>
      <circle cx={80} cy={80} r={R} fill="none" stroke={color} strokeWidth={14}
        strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round"
        transform="rotate(-90 80 80)" style={{transition:"stroke-dasharray 0.8s ease"}}/>
      <text x={80} y={74} textAnchor="middle" fill="#e4e2e4" fontSize={22} fontWeight={700} fontFamily="Inter">{pct}%</text>
      <text x={80} y={92} textAnchor="middle" fill="#909097" fontSize={11} fontFamily="Inter">terpakai</text>
    </svg>
  );
}

function StatCard({ label, value, icon, color="text-on-surface", sub }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant">{label}</p>
        <Icon name={icon} className={color} sizeClass="text-[18px]" />
      </div>
      <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-xs text-on-surface-variant">{sub}</p>}
    </div>
  );
}

function TxRow({ tx, categories }) {
  const m = getMeta(tx.kategori, categories);
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-dim border border-outline-variant/20 hover:border-outline-variant/50 hover:bg-surface-container-high transition-all">
      <div className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon name={m.icon} className={m.color} sizeClass="text-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface truncate">{tx.catatan || tx.kategori}</p>
        <p className="text-xs text-on-surface-variant">{tx.kategori} · {formatDate(tx.tanggal)}</p>
      </div>
      <p className={`text-sm font-bold flex-shrink-0 ${tx.nominal < 0 ? "text-emerald-400" : "text-error"}`}>
        {tx.nominal < 0 ? "+" : "-"}{formatRupiah(Math.abs(tx.nominal))}
      </p>
    </div>
  );
}

function CategoryBars({ byCategory, totalSpent, categories }) {
  const sorted = Object.entries(byCategory)
    .filter(([kat]) => {
      const category = categories.find((c) => c.name === kat);
      return category && category.type !== "Income";
    })
    .sort((a,b) => b[1]-a[1])
    .slice(0,5);
  if (!sorted.length) return (
    <div className="flex flex-col items-center justify-center h-28 text-on-surface-variant">
      <Icon name="bar_chart" sizeClass="text-[32px] mb-2" />
      <p className="text-xs">Belum ada data</p>
    </div>
  );
  return (
    <div className="space-y-3">
      {sorted.map(([kat, val]) => {
        const m   = getMeta(kat, categories);
        const pct = totalSpent > 0 ? Math.round((val/totalSpent)*100) : 0;
        return (
          <div key={kat}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Icon name={m.icon} className={m.color} sizeClass="text-[14px]" />
                <span className="text-xs font-medium text-on-surface-variant">{kat}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface">{formatRupiah(val, true)}</span>
                <span className="text-xs text-on-surface-variant w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${m.bgBase}`}
                style={{width:`${pct}%`}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BudgetRings({ byCategory, income, categories }) {
  const calc = (type) => Object.entries(byCategory)
    .filter(([k]) => {
      const cat = categories.find(c => c.name === k);
      return cat && cat.type === type;
    })
    .reduce((s,[,v]) => s+v, 0);

  const items = [
    {label:"Needs",   val:calc("Needs"),   color:"#4edea3", ideal:"50%"},
    {label:"Wants",   val:calc("Wants"),   color:"#ffb2b7", ideal:"30%"},
    {label:"Savings", val:calc("Savings"), color:"#bec6e0", ideal:"20%"},
  ].map(i => ({...i, pct: income > 0 ? Math.round((i.val/income)*100) : 0}));

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(item => (
        <div key={item.label} className="flex flex-col items-center gap-2">
          <svg width={64} height={64} viewBox="0 0 64 64">
            <circle cx={32} cy={32} r={26} fill="none" stroke="#1f1f21" strokeWidth={7}/>
            <circle cx={32} cy={32} r={26} fill="none" stroke={item.color} strokeWidth={7}
              strokeDasharray={`${(item.pct/100)*163.4} 163.4`} strokeLinecap="round"
              transform="rotate(-90 32 32)"/>
            <text x={32} y={37} textAnchor="middle" fill="#e4e2e4" fontSize={13} fontWeight={700} fontFamily="Inter">
              {item.pct}%
            </text>
          </svg>
          <div className="text-center">
            <p className="text-xs font-semibold text-on-surface">{item.label}</p>
            <p className="text-[10px] text-on-surface-variant">ideal {item.ideal}</p>
            <p className="text-[11px] font-bold text-on-surface mt-0.5">{formatRupiah(item.val, true)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ setTab }) {
  const { user } = useAuth();
  const {
    transactions,
    categories,
    loading,
    income,
    hasOnboarded,
    totalSpent,
    remaining,
    pct,
    byCategory,
    expenseByCategory,
    selectedDate,
    updateCurrentMonthSalary,
    wallets,
    walletBalances,
  } = useTransaction();

  const name = user?.user_metadata?.full_name?.split(" ")[0] || "Kamu";
  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 19 ? "Selamat sore" : "Selamat malam";
  const avgPerDay = transactions.length > 0 ? Math.round(totalSpent / Math.max(now.getDate(), 1)) : 0;

  if (!loading && !hasOnboarded) {
    return (
      <div className="px-4 md:px-8 pt-10 pb-6 max-w-[800px] mx-auto">
        <OnboardingBanner selectedDate={selectedDate} updateCurrentMonthSalary={updateCurrentMonthSalary} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[1200px] mx-auto space-y-5">

      {/* Greeting */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-on-surface">
          {greeting}, <span className="text-emerald-400">{name}</span> 👋
        </h2>
        <p className="text-sm text-on-surface-variant mt-0.5">
          {now.toLocaleDateString("id-ID", {weekday:"long", day:"numeric", month:"long", year:"numeric"})}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sisa Budget" icon="account_balance_wallet"
          value={formatRupiah(remaining, true)}
          color={remaining < 0 ? "text-error" : "text-secondary"}
          sub={`dari ${formatRupiah(income, true)}`}/>
        <StatCard label="Pengeluaran" icon="trending_down"
          value={formatRupiah(totalSpent, true)} color="text-error"
          sub={`${pct}% dari penghasilan`}/>
        <StatCard label="Transaksi" icon="receipt_long"
          value={`${transactions.length}x`} color="text-primary" sub="bulan ini"/>
        <StatCard label="Rata-rata/hari" icon="today"
          value={formatRupiah(avgPerDay, true)} color="text-on-surface" sub="pengeluaran harian"/>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Donut + 50/30/20 */}
        <section className="lg:col-span-5 glass-card p-6 flex flex-col gap-5">
          <h3 className="text-base font-bold text-on-surface">Ringkasan Budget</h3>
          <div className="flex items-center gap-5">
            <DonutChart pct={pct}/>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Pengeluaran</p>
                <p className="text-lg font-bold text-error">{formatRupiah(totalSpent, true)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-0.5">Sisa</p>
                <p className={`text-lg font-bold ${remaining < 0 ? "text-error" : "text-secondary"}`}>
                  {formatRupiah(remaining, true)}
                </p>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{width:`${pct}%`, background: pct>=90?"#ffb4ab":pct>=70?"#ffb2b7":"#4edea3"}}/>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant/30"/>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
              50/30/20 Rule
            </p>
            <BudgetRings byCategory={byCategory} income={income} categories={categories}/>
          </div>
        </section>

        {/* Recent transactions */}
        <section className="lg:col-span-7 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-on-surface">Transaksi Terakhir</h3>
            <button onClick={() => setTab("riwayat")}
              className="text-xs font-semibold text-secondary hover:underline uppercase tracking-widest">
              Lihat semua →
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin h-7 w-7 text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
              </svg>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <Icon name="receipt_long" sizeClass="text-[40px] text-on-surface-variant mb-3" />
              <p className="text-sm text-on-surface-variant">Belum ada transaksi bulan ini</p>
              <button onClick={() => setTab("catat")}
                className="mt-3 text-xs font-bold text-secondary hover:underline">
                Catat sekarang →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0,4).map(tx => <TxRow key={tx.id} tx={tx} categories={categories}/>)}
            </div>
          )}
        </section>

        {/* Category breakdown full width */}
        <section className="lg:col-span-12 glass-card p-6">
          <h3 className="text-base font-bold text-on-surface mb-5">Pengeluaran per Kategori</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CategoryBars byCategory={expenseByCategory} totalSpent={totalSpent} categories={categories}/>
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Aksi Cepat</p>
              {[
                {label:"Catat pengeluaran baru", icon:"add_circle",  color:"text-secondary", action:()=>setTab("catat")},
                {label:"Lihat semua riwayat",    icon:"receipt_long",color:"text-primary",   action:()=>setTab("riwayat")},
                {label:"Lihat statistik",         icon:"bar_chart",   color:"text-tertiary",  action:()=>setTab("statistik")},
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-dim border border-outline-variant/20 hover:border-outline-variant/60 hover:bg-surface-container-high transition-all text-left">
                  <Icon name={item.icon} className={`${item.color}`} sizeClass="text-[20px]" />
                    <span className="text-sm font-medium text-on-surface">{item.label}</span>
                    <Icon name="chevron_right" sizeClass="text-[16px] text-on-surface-variant ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-12 glass-card p-6">
          <h3 className="text-base font-bold text-on-surface mb-4">Saldo Dompet</h3>
          {wallets.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Belum ada dompet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wallets.map((wallet) => {
                const balance = walletBalances?.[wallet.id]?.balance ?? Number(wallet.starting_balance || 0);
                return (
                  <div
                    key={wallet.id}
                    className="p-4 rounded-xl bg-surface-dim border border-outline-variant/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant flex-shrink-0">
                        <Icon name={wallet.icon || "👛"} sizeClass="text-[20px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{wallet.name}</p>
                        <p className="text-xs text-on-surface-variant">Saldo saat ini</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${balance < 0 ? "text-error" : "text-secondary"}`}>
                      {formatRupiah(balance, true)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
