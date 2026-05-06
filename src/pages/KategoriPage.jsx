import { useState } from "react";
import { useTransaction } from "../contexts/TransactionContext";
import IconPicker from "../components/ui/IconPicker";

export default function KategoriPage({ setTab }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useTransaction();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Needs",
    keywords: "",
    icon: "restaurant",
    color: "text-emerald-400"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({
        name: cat.name,
        type: cat.type,
        keywords: cat.keywords,
        icon: cat.icon,
        color: cat.color
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        type: "Needs",
        keywords: "",
        icon: "restaurant",
        color: "text-emerald-400"
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Nama kategori wajib diisi");
      return;
    }
    
    setLoading(true);
    setError("");

    // Prepare keywords (lowercase, remove spaces around commas)
    const processedKeywords = formData.keywords
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0)
      .join(",");

    const payload = { ...formData, keywords: processedKeywords };

    let res;
    if (editingId) {
      res = await updateCategory(editingId, payload);
    } else {
      res = await addCategory(payload);
    }

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      handleCloseModal();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus kategori ini? Transaksi yang sudah menggunakan kategori ini tidak akan terhapus, namun ikonnya mungkin kembali ke default.")) {
      await deleteCategory(id);
    }
  };

  // Group categories by type
  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, { Needs: [], Wants: [], Savings: [] });

  const TYPE_LABELS = {
    Needs: "🏠 Kebutuhan (Needs)",
    Wants: "🎯 Keinginan (Wants)",
    Savings: "💰 Tabungan (Savings)"
  };

  return (
    <div className="px-4 md:px-8 pt-4 md:pt-6 pb-6 max-w-[900px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Kelola Kategori</h2>
          <p className="text-sm text-on-surface-variant mt-0.5">Sesuaikan ikon, warna, dan kata kunci smart input</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-900 text-sm font-bold hover:bg-emerald-400 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden md:inline">Kategori Baru</span>
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-6">
        {["Needs", "Wants", "Savings"].map(type => (
          <div key={type} className="glass-card p-6">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4">
              {TYPE_LABELS[type]}
            </h3>
            
            {grouped[type].length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 italic">Belum ada kategori</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[type].map(cat => {
                  const bgClass = cat.color.replace("text-", "bg-") + "/10";
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-dim border border-outline-variant/30 hover:border-outline-variant/60 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bgClass}`}>
                          <span className={`material-symbols-outlined text-[20px] ${cat.color}`}>{cat.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{cat.name}</p>
                          <p className="text-[10px] text-on-surface-variant truncate opacity-70 mt-0.5">
                            {cat.keywords ? cat.keywords.split(",").join(", ") : "Tidak ada keyword"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-high border border-outline-variant/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-on-surface">{editingId ? "Edit Kategori" : "Kategori Baru"}</h3>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Nama Kategori</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="Cth: Makan Siang"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Grup</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "Needs", label: "Needs" },
                    { val: "Wants", label: "Wants" },
                    { val: "Savings", label: "Savings" }
                  ].map(t => (
                    <button
                      key={t.val} type="button"
                      onClick={() => setFormData({...formData, type: t.val})}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                        formData.type === t.val 
                          ? "bg-emerald-500 text-slate-900 border-emerald-500" 
                          : "bg-surface-dim text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <IconPicker
                selectedIcon={formData.icon}
                selectedColor={formData.color}
                onSelectIcon={(icon) => setFormData({...formData, icon})}
                onSelectColor={(color) => setFormData({...formData, color})}
              />

              {/* Keywords */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
                  Kata Kunci Smart Input
                </label>
                <p className="text-[10px] text-on-surface-variant/70 mb-2 leading-tight">
                  Pisahkan dengan koma. Jika pengguna mengetik kata ini, akan otomatis masuk ke kategori ini.
                </p>
                <textarea
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  rows={3}
                  className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="Cth: jajan, kopi, nasgor, bakso"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end gap-3 flex-shrink-0 bg-surface-container-high">
              <button
                type="button" onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Batal
              </button>
              <button
                type="button" onClick={handleSubmit} disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
