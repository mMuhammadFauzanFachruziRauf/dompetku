import { useState, useEffect } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import { getMeta } from "../utils/helpers";
import Icon from "./ui/Icon";

export default function EditTransactionModal({ isOpen, onClose, transaction }) {
  const { categories, updateTransaction } = useTransaction();
  
  const [jenis, setJenis] = useState("Pengeluaran");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && transaction) {
      const isIncome = transaction.nominal < 0;
      setJenis(isIncome ? "Pemasukan" : "Pengeluaran");
      setNominal(Math.abs(transaction.nominal).toString());
      setKategori(transaction.kategori);
      setCatatan(transaction.catatan || "");
      setError("");
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  // Group categories for dropdown
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, { Needs: [], Wants: [], Savings: [] });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    const nom = parseFloat(nominal.replace(/\./g, "").replace(/,/g, ""));
    if (!nom || nom <= 0) {
      setError("Nominal harus diisi dan lebih dari 0");
      return;
    }

    setLoading(true);
    const finalNominal = jenis === "Pemasukan" ? -nom : nom;
    const finalKat = jenis === "Pemasukan" ? "Pemasukan Tambahan" : kategori;
    
    const { error: err } = await updateTransaction(transaction.id, {
      nominal: finalNominal,
      kategori: finalKat,
      catatan: catatan || finalKat
    });
    
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Edit Transaksi</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="close" sizeClass="text-[20px]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Toggle Jenis */}
          <div className="flex bg-surface-dim rounded-xl p-1 border border-outline-variant/30">
            <button type="button" onClick={() => setJenis("Pengeluaran")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${jenis === "Pengeluaran" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Pengeluaran</button>
            <button type="button" onClick={() => setJenis("Pemasukan")} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${jenis === "Pemasukan" ? "bg-emerald-500/20 text-emerald-400 shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Pemasukan Tambahan</button>
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
                className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-4 py-3.5 text-on-surface text-base font-semibold focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
              />
            </div>
          </div>

          {/* Kategori */}
          {jenis === "Pengeluaran" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Kategori
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Icon name={getMeta(kategori, categories).icon} sizeClass="text-[18px]" />
                </span>
                <select
                  value={kategori} onChange={e => setKategori(e.target.value)}
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl pl-11 pr-10 py-3.5 text-on-surface text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all appearance-none"
                >
                  <optgroup label="🏠 Kebutuhan (Needs)">
                    {groupedCategories.Needs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="🎯 Keinginan (Wants)">
                    {groupedCategories.Wants.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </optgroup>
                  <optgroup label="💰 Tabungan (Savings)">
                    {groupedCategories.Savings.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </optgroup>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                  <Icon name="expand_more" sizeClass="text-[18px]" />
                </span>
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
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
