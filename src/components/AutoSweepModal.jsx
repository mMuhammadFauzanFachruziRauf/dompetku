import React, { useState, useMemo } from 'react';
import Icon from './ui/Icon';
import { formatRupiah } from '../utils/helpers';
import { useTransaction } from '../contexts/TransactionContext';

export default function AutoSweepModal({ isOpen, onClose, remainingBudget, savingsGoals }) {
  const { depositToSavingsGoal } = useTransaction();
  
  // State for dynamic allocation rows
  const [allocations, setAllocations] = useState([
    { id: Date.now().toString(), goalId: '', amount: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Calculate totals
  const totalSwept = useMemo(() => {
    return allocations.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  }, [allocations]);

  const leftover = remainingBudget - totalSwept;
  const isOverAllocated = leftover < 0;

  if (!isOpen) return null;

  const handleAddRow = () => {
    setAllocations([...allocations, { id: Date.now().toString(), goalId: '', amount: '' }]);
  };

  const handleRemoveRow = (id) => {
    setAllocations(allocations.filter(a => a.id !== id));
  };

  const handleChangeRow = (id, field, value) => {
    setAllocations(allocations.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Filter valid rows
    const validRows = allocations.filter(a => a.goalId && parseFloat(a.amount) > 0);
    
    if (validRows.length === 0) {
      setErrorMsg('Pilih minimal satu celengan dan masukkan nominal.');
      return;
    }

    if (isOverAllocated) {
      setErrorMsg('Total yang disapu melebihi sisa budget saat ini.');
      return;
    }

    setLoading(true);

    try {
      // Execute all valid deposits
      for (const row of validRows) {
        const amount = parseFloat(row.amount);
        const res = await depositToSavingsGoal(row.goalId, amount);
        if (res.error) {
          throw new Error(`Gagal menyapu dana ke Celengan: ${res.error}`);
        }
      }
      
      setSuccessMsg('Tutup Buku berhasil! Dana sisa telah dialokasikan ke Celengan.');
      setTimeout(() => {
        onClose();
        // Reset state for next use
        setAllocations([{ id: Date.now().toString(), goalId: '', amount: '' }]);
        setSuccessMsg('');
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillMax = (id) => {
    const amountToFill = remainingBudget - (totalSwept - (parseFloat(allocations.find(a => a.id === id)?.amount) || 0));
    if (amountToFill > 0) {
      handleChangeRow(id, 'amount', amountToFill.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={loading ? undefined : onClose}></div>
      <div className="relative w-full max-w-xl glass-card bg-surface-container-high/95 p-6 md:p-8 animate-slide-up rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Icon name="cleaning_services" sizeClass="text-[24px]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface">Tutup Buku</h2>
              <p className="text-sm text-on-surface-variant">Sapu sisa budget ke Celengan</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
            <Icon name="close" />
          </button>
        </div>

        {/* Budget Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30">
            <p className="text-xs font-semibold text-on-surface-variant mb-1">Sisa Budget Bulan Ini</p>
            <p className="text-xl font-bold text-on-surface">{formatRupiah(remainingBudget)}</p>
          </div>
          <div className={`p-4 rounded-2xl border ${isOverAllocated ? 'bg-error/10 border-error/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
            <p className={`text-xs font-semibold mb-1 ${isOverAllocated ? 'text-error' : 'text-emerald-600'}`}>Sisa Belum Disapu</p>
            <p className={`text-xl font-bold ${isOverAllocated ? 'text-error' : 'text-emerald-600'}`}>{formatRupiah(leftover)}</p>
          </div>
        </div>

        <div className="w-full h-px bg-outline-variant/30 mb-6"></div>

        {/* Dynamic Allocations */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-bold text-on-surface">Alokasi Celengan</h3>
          
          {allocations.map((row, idx) => (
            <div key={row.id} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 p-3 rounded-2xl bg-surface-dim border border-outline-variant/20 hover:border-emerald-500/30 transition-colors">
              <div className="w-full sm:flex-1">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 px-1">Celengan</label>
                <select 
                  value={row.goalId}
                  onChange={(e) => handleChangeRow(row.id, 'goalId', e.target.value)}
                  className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm font-semibold border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Pilih Celengan --</option>
                  {savingsGoals.map(sg => (
                    <option key={sg.id} value={sg.id}>{sg.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:flex-1">
                <div className="flex items-center justify-between px-1 mb-1">
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Nominal (Rp)</label>
                  <button onClick={() => handleFillMax(row.id)} className="text-[10px] font-bold text-emerald-500 hover:underline">MAX</button>
                </div>
                <input 
                  type="number"
                  value={row.amount}
                  onChange={(e) => handleChangeRow(row.id, 'amount', e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm font-bold text-emerald-500 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button 
                onClick={() => handleRemoveRow(row.id)}
                disabled={allocations.length === 1}
                className="w-full sm:w-auto p-2 text-error hover:bg-error/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex justify-center mt-2 sm:mt-0"
                title="Hapus baris"
              >
                <Icon name="delete" sizeClass="text-[20px]" />
              </button>
            </div>
          ))}

          <button 
            onClick={handleAddRow}
            className="w-full py-3 rounded-xl border border-dashed border-emerald-500/50 text-emerald-500 text-sm font-bold hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="add" sizeClass="text-[18px]" />
            Tambah Celengan Lain
          </button>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2">
            <Icon name="error" sizeClass="text-[18px] text-error" />
            <p className="text-xs font-semibold text-error">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
            <Icon name="check_circle" sizeClass="text-[18px] text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-600">{successMsg}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-outline-variant/30">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || isOverAllocated || totalSwept <= 0}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? "Menyapu Dana..." : "Sapu Sekarang"}
          </button>
        </div>

      </div>
    </div>
  );
}
