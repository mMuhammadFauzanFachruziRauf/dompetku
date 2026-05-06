import { useState, useEffect } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import { formatRupiah } from "../utils/helpers";

export default function SettingsModal({ isOpen, onClose }) {
  const { income, updateIncome, shortcuts, updateShortcuts } = useTransaction();
  const [inputIncome, setInputIncome] = useState("");
  const [localShortcuts, setLocalShortcuts] = useState([]);
  const [newShortcut, setNewShortcut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputIncome(income.toString());
      setLocalShortcuts([...(shortcuts || [])]);
      setError("");
      setSuccess(false);
      setNewShortcut("");
    }
  }, [isOpen, income, shortcuts]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const numericVal = Number(inputIncome.replace(/\D/g, ""));
    if (numericVal < 0 || isNaN(numericVal)) {
      setError("Nominal tidak valid.");
      return;
    }

    setLoading(true);
    const { error: err1 } = await updateIncome(numericVal);
    const { error: err2 } = await updateShortcuts(localShortcuts);
    setLoading(false);

    if (err1 || err2) {
      setError(err1 || err2);
    } else {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleAddShortcut = () => {
    if (!newShortcut.trim()) return;
    if (localShortcuts.includes(newShortcut.trim())) return;
    setLocalShortcuts(prev => [...prev, newShortcut.trim()]);
    setNewShortcut("");
  };

  const handleRemoveShortcut = (s) => {
    setLocalShortcuts(prev => prev.filter(item => item !== s));
  };

  const handleInputChange = (e) => {
    // Hanya angka
    const val = e.target.value.replace(/\D/g, "");
    setInputIncome(val);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Pengaturan</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Penghasilan Bulanan
            </label>
            <p className="text-xs text-on-surface-variant mb-3">
              Nominal ini akan digunakan untuk menghitung sisa budget dan persentase pengeluaran 50/30/20.
            </p>
            
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                Rp
              </span>
              <input
                type="text"
                value={inputIncome ? Number(inputIncome).toLocaleString("id-ID") : ""}
                onChange={handleInputChange}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl pl-12 pr-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                placeholder="0"
                required
              />
            </div>
            {error && <p className="text-xs text-error mt-2">{error}</p>}
            {success && <p className="text-xs text-emerald-400 mt-2">Pengaturan berhasil diperbarui!</p>}
          </div>

          <div className="pt-2 border-t border-outline-variant/20">
            <label className="block text-sm font-semibold text-on-surface mt-2 mb-1.5">
              Kelola Shortcut Cepat
            </label>
            <p className="text-xs text-on-surface-variant mb-3">
              Tambahkan shortcut pengeluaran untuk input yang lebih cepat.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newShortcut}
                onChange={e => setNewShortcut(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddShortcut())}
                placeholder="Cth: Nasi Goreng 25000"
                className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={handleAddShortcut}
                disabled={!newShortcut.trim()}
                className="bg-surface-container-high border border-outline-variant/30 text-on-surface font-semibold px-4 rounded-xl hover:bg-surface-container-highest transition-colors disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
              {localShortcuts.length === 0 ? (
                <p className="text-xs text-on-surface-variant italic">Belum ada shortcut.</p>
              ) : (
                localShortcuts.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface">
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveShortcut(s)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-900" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
