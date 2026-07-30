import React from "react";
import Icon from "./ui/Icon";
import { formatRupiah, formatDate } from "../utils/helpers";

/**
 * Komponen untuk menampilkan proporsi pembagian gaji terakhir di Dashboard.
 */
export default function RecentAutoSplitCard({ incomeTx, allocations }) {
  if (!incomeTx || !allocations || allocations.length === 0) {
    return null; // Tidak perlu tampil jika tidak ada history
  }

  const incomeAmount = Math.abs(Number(incomeTx.nominal || 0));
  
  // Calculate remaining
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  const remaining = Math.max(0, incomeAmount - totalAllocated);
  
  // Prepare data for stacked bar
  const segments = [
    ...allocations.map(a => ({
      name: a.name,
      amount: a.amount,
      pct: (a.amount / incomeAmount) * 100,
      color: a.type === "fixed" ? "bg-orange-400" : "bg-primary",
      icon: a.type === "fixed" ? "push_pin" : "percent"
    })),
    {
      name: "Sisa Bersih",
      amount: remaining,
      pct: (remaining / incomeAmount) * 100,
      color: "bg-emerald-400",
      icon: "account_balance_wallet"
    }
  ];

  return (
    <div className="glass-card p-5 md:p-6 space-y-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Icon name="call_split" sizeClass="text-[16px] text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-on-surface leading-tight">Auto-Split Terakhir</h3>
            <p className="text-[10px] text-on-surface-variant">{formatDate(incomeTx.tanggal)}</p>
          </div>
        </div>
        <p className="text-sm font-black text-emerald-400">{formatRupiah(incomeAmount)}</p>
      </div>

      {/* Horizontal Stacked Bar */}
      <div className="relative z-10">
        <div className="h-4 flex w-full rounded-full overflow-hidden bg-surface-container-highest border border-outline-variant/10 shadow-inner mb-3">
          {segments.map((seg, idx) => (
            seg.pct > 0 && (
              <div
                key={idx}
                style={{ width: `${seg.pct}%` }}
                className={`h-full ${seg.color} transition-all duration-700 ease-out hover:opacity-80`}
                title={`${seg.name}: ${formatRupiah(seg.amount)} (${Math.round(seg.pct)}%)`}
              />
            )
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
          {segments.map((seg, idx) => (
            seg.pct > 0 && (
              <div key={idx} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${seg.color}`} />
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                  {seg.name} <span className="font-bold text-on-surface opacity-80">{Math.round(seg.pct)}%</span>
                </span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
