import React from "react";
import Icon from "./ui/Icon";
import { formatRupiah } from "../utils/helpers";

export default function AutoSplitPreviewModal({
  open,
  incomeAmount,
  allocations,
  isValid,
  remaining,
  error,
  onConfirm,
  onCancel,
  isExecuting
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup"
        onClick={!isExecuting ? onCancel : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md glass-card border border-emerald-500/30 bg-surface-container-high/95 p-6 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
            <Icon name="call_split" sizeClass="text-[32px] text-emerald-400" />
          </div>

          <h3 className="text-lg font-bold text-on-surface mb-2">Auto-Split Gaji</h3>
          <p className="text-sm text-on-surface-variant text-center leading-relaxed mb-4">
            Pemasukan ini akan otomatis dibagikan sesuai aturan yang telah kamu buat.
          </p>

          <div className="w-full rounded-xl bg-surface-dim border border-outline-variant/30 p-4 space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm border-b border-outline-variant/20 pb-2">
              <span className="text-on-surface-variant">Total Pemasukan</span>
              <span className="font-bold text-emerald-400">{formatRupiah(incomeAmount)}</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {allocations.map((alloc, idx) => (
                <div key={idx} className="flex flex-col gap-1 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface flex items-center gap-1.5">
                      <Icon name={alloc.type === "fixed" ? "push_pin" : alloc.type === "waterfall" ? "water_drop" : "percent"} sizeClass="text-[12px] text-secondary" />
                      {alloc.name} {alloc.type === "percentage" ? `(${alloc.percentage}%)` : ""}
                    </span>
                    <span className="font-bold text-error">-{formatRupiah(alloc.amount)}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant ml-4.5 flex items-center gap-1">
                    <Icon name="subdirectory_arrow_right" sizeClass="text-[10px]" />
                    {alloc.targetName}
                  </span>
                </div>
              ))}
              {allocations.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-2">Tidak ada potongan.</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm border-t border-outline-variant/20 pt-2 mt-2">
              <span className="text-on-surface-variant font-semibold">Sisa Bersih</span>
              <span className={`font-bold ${remaining < 0 ? "text-error" : "text-emerald-400"}`}>
                {remaining < 0 ? "-" : ""}{formatRupiah(Math.abs(remaining))}
              </span>
            </div>
          </div>

          {isValid && remaining > 0 && (
            <div className="w-full p-3 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2 text-left">
              <Icon name="info" sizeClass="text-[16px] text-blue-500 mt-0.5" />
              <p className="text-xs font-semibold text-blue-500 leading-relaxed">
                💡 Info: Terdapat sisa dana {formatRupiah(remaining)} yang tidak teralokasi ke aturan mana pun. Dana ini akan otomatis mengendap di dompet asal (sebagai saldo bebas/darurat).
              </p>
            </div>
          )}

          {!isValid && (
            <div className="w-full p-3 mb-6 rounded-xl bg-error/10 border border-error/30 flex items-start gap-2 text-left">
              <Icon name="error" sizeClass="text-[16px] text-error mt-0.5" />
              <p className="text-xs font-semibold text-error leading-relaxed">
                {error || "Total potongan melebihi nominal pemasukan. Silakan sesuaikan rule Auto-Split di pengaturan atau masukkan nominal yang lebih besar."}
              </p>
            </div>
          )}

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isExecuting}
              className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!isValid || isExecuting}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-900 text-sm font-bold hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Terapkan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
