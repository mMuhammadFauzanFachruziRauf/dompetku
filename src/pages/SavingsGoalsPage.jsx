import React, { useState } from 'react';
import { useTransaction } from '../contexts/TransactionContext';
import AppLayout from '../components/layout/AppLayout';
import Icon from '../components/ui/Icon';
import { formatRupiah } from '../utils/helpers';

// --- Reusable Components ---

const SavingsGoalCard = ({ goal, onDeposit, onWithdraw, onEdit, onDelete }) => {
  const hasTarget = goal.target_amount > 0;
  const percentage = hasTarget ? Math.min(Math.max(Math.round((goal.current_amount / goal.target_amount) * 100), 0), 100) : 0;
  const remaining = hasTarget ? goal.target_amount - goal.current_amount : 0;

  return (
    <div className="bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col min-w-0">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Icon name="savings" sizeClass="text-[20px]" />
            </div>
            <div>
              <p className="text-base font-bold text-on-surface">{goal.name}</p>
              {goal.target_date && (
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <Icon name="event" sizeClass="text-[12px]" />
                  {new Date(goal.target_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(goal)} className="p-1.5 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors" title="Edit Celengan">
              <Icon name="edit" sizeClass="text-[18px]" />
            </button>
            <button onClick={() => onDelete(goal)} className="p-1.5 text-error hover:bg-error/10 rounded-full transition-colors" title="Hapus Celengan">
              <Icon name="delete" sizeClass="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-on-surface-variant mb-1">Total Terkumpul</p>
          <p className="text-2xl font-black text-emerald-500">{formatRupiah(goal.current_amount)}</p>
        </div>

        {hasTarget && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-on-surface-variant">Target: {formatRupiah(goal.target_amount)}</span>
              <span className="text-xs font-bold text-emerald-500">{percentage}%</span>
            </div>
            <div className="w-full bg-surface-variant rounded-full h-2 overflow-hidden" style={{ minWidth: '10px', minHeight: '8px' }}>
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percentage || 0}%`, minWidth: '10px', minHeight: '8px' }}></div>
            </div>
            {remaining > 0 ? (
              <p className="text-[10px] text-right mt-1.5 text-on-surface-variant">
                Sisa {formatRupiah(remaining)} lagi
              </p>
            ) : (
              <p className="text-[10px] text-right mt-1.5 text-emerald-500 font-bold">
                Target Tercapai! 🎉
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 border-t border-outline-variant/30 divide-x divide-outline-variant/30 bg-surface">
        <button onClick={() => onWithdraw(goal)} className="py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-variant/50 transition-colors flex items-center justify-center gap-2">
          <Icon name="remove_circle_outline" sizeClass="text-[18px]" />
          Cairkan
        </button>
        <button onClick={() => onDeposit(goal)} className="py-3 text-sm font-bold text-emerald-500 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
          <Icon name="add_circle" sizeClass="text-[18px]" />
          Isi Saldo
        </button>
      </div>
    </div>
  );
};

const GoalFormModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setTargetAmount(initialData.target_amount ? initialData.target_amount.toString() : '');
        setTargetDate(initialData.target_date || '');
      } else {
        setName('');
        setTargetAmount('');
        setTargetDate('');
      }
      setErrorMsg('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Nama celengan wajib diisi');
      return;
    }
    
    setLoading(true);
    const payload = { 
      name, 
      target_amount: targetAmount ? parseFloat(targetAmount) : null,
      target_date: targetDate || null
    };
    
    const res = await onSave(payload, initialData?.id);
    setLoading(false);
    
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-md glass-card bg-surface-container-high/95 p-6 animate-slide-up rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-on-surface mb-4">
          {initialData ? 'Edit Celengan' : 'Tambah Celengan Baru'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nama Celengan *</label>
            <input type="text" placeholder="Cth: Dana Darurat, Motor Baru" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Nominal (Opsional)</label>
            <input type="number" placeholder="Kosongkan jika hanya menabung bebas" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Tanggal (Opsional)</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        {errorMsg && <p className="text-error text-xs font-semibold mt-4">{errorMsg}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition-colors">{loading ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </div>
    </div>
  );
};

const DepositModal = ({ isOpen, onClose, onDeposit, goal, wallets }) => {
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [loading, setLoading] = useState(false);
  
  React.useEffect(() => {
    if (isOpen && wallets?.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (amount > 0 && walletId) {
      setLoading(true);
      await onDeposit(goal.id, parseFloat(amount), walletId);
      setLoading(false);
      setAmount('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-sm glass-card bg-surface-container-high/95 p-6 animate-slide-up rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-on-surface mb-1">Isi Saldo Celengan</h2>
        <p className="text-sm text-emerald-500 font-semibold mb-5">{goal?.name}</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Sumber Dana (Dompet)</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none appearance-none">
              <option value="" disabled>Pilih Dompet...</option>
              {wallets?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nominal (Rp)</label>
            <input type="number" placeholder="Cth: 50000" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !amount || !walletId} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-900 bg-emerald-500 hover:bg-emerald-400 transition-colors disabled:opacity-50">{loading ? "Memproses..." : "Isi Saldo"}</button>
        </div>
      </div>
    </div>
  );
};

const WithdrawModal = ({ isOpen, onClose, onWithdraw, goal, wallets, categories }) => {
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('REALLOCATE'); // 'REALLOCATE' or 'SPEND'
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [categoryName, setCategoryName] = useState(categories[0]?.name || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setErrorMsg('');
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Nominal pencairan tidak valid');
      return;
    }
    
    if (numAmount > goal.current_amount) {
      setErrorMsg(`Saldo maksimal yang bisa dicairkan: ${formatRupiah(goal.current_amount)}`);
      return;
    }

    setLoading(true);
    
    let expenseDetails = null;
    
    if (!walletId) {
      setErrorMsg('Pilih dompet terlebih dahulu');
      return;
    }

    if (actionType === 'SPEND') {
      if (!categoryName) {
        setErrorMsg('Pilih kategori untuk pengeluaran');
        setLoading(false);
        return;
      }
      expenseDetails = {
        wallet_id: walletId,
        kategori: categoryName,
        catatan: note || `Pencairan Celengan: ${goal.name}`,
        tanggal: new Date().toISOString()
      };
    } else {
      expenseDetails = {
        wallet_id: walletId
      };
    }

    const res = await onWithdraw(goal.id, numAmount, actionType, expenseDetails);
    
    setLoading(false);
    
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setAmount('');
      setNote('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-md glass-card bg-surface-container-high/95 p-6 animate-slide-up rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold text-on-surface mb-1">Cairkan Celengan</h2>
        <p className="text-sm text-emerald-500 font-semibold mb-5">{goal?.name}</p>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Nominal Cair (Rp)</label>
            <input 
              type="number" 
              placeholder={`Maks: ${goal?.current_amount}`} 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full bg-surface-dim border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none" 
            />
            <button onClick={() => setAmount(goal?.current_amount)} className="text-[10px] font-bold text-emerald-500 mt-1 hover:underline">
              Cairkan Semua ({formatRupiah(goal?.current_amount || 0)})
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-2">Tujuan Pencairan</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActionType("REALLOCATE")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-colors flex flex-col items-center gap-1 ${actionType === "REALLOCATE" ? "border-blue-400 bg-blue-400/10 text-blue-400" : "border-outline-variant/30 text-on-surface-variant"}`}
              >
                <Icon name="account_balance_wallet" sizeClass="text-[18px]" />
                Tarik ke Budget
              </button>
              <button
                onClick={() => setActionType("SPEND")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-colors flex flex-col items-center gap-1 ${actionType === "SPEND" ? "border-orange-400 bg-orange-400/10 text-orange-400" : "border-outline-variant/30 text-on-surface-variant"}`}
              >
                <Icon name="shopping_cart" sizeClass="text-[18px]" />
                Pakai Belanja
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">
              {actionType === 'REALLOCATE' 
                ? "💡 Dana akan dikembalikan ke Sisa Budget bulan ini sebagai saldo bebas." 
                : "💡 Saldo akan dicairkan sekaligus dicatat sebagai Transaksi Pengeluaran fisik."}
            </p>
          </div>

          <div className="space-y-4 p-4 rounded-xl bg-surface-dim border border-outline-variant/30">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                {actionType === 'REALLOCATE' ? "Dompet Tujuan Pencairan" : "Dompet Sumber Pengeluaran"}
              </label>
              <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none appearance-none">
                <option value="" disabled>Pilih Dompet...</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            
            {actionType === 'SPEND' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Kategori</label>
                  <select value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none appearance-none">
                    {categories.filter(c => c.type !== 'Income').map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Catatan Pengeluaran (Opsional)</label>
                  <input type="text" placeholder={`Cth: Beli motor baru`} value={note} onChange={e => setNote(e.target.value)} className="w-full bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
                </div>
              </>
            )}
          </div>
        </div>

        {errorMsg && <p className="text-error text-xs font-semibold mt-4">{errorMsg}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !amount || !walletId} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-error hover:bg-error/80 transition-colors disabled:opacity-50 shadow-md">
            {loading ? "Memproses..." : "Konfirmasi Cairkan"}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Page Component ---

export default function SavingsGoalsPage() {
  const { 
    savingsGoals, 
    savingsLoading, 
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToSavingsGoal,
    withdrawFromSavings,
    wallets,
    categories
  } = useTransaction();

  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenFormModal = (goal = null) => {
    setSelectedGoal(goal);
    setFormModalOpen(true);
  };

  const handleSaveGoal = async (payload, id) => {
    if (id) {
      return await updateSavingsGoal(id, payload);
    } else {
      return await addSavingsGoal(payload);
    }
  };

  const handleDeleteGoal = (goal) => {
    setGoalToDelete(goal);
    setDeleteErrorMsg('');
  };

  const confirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    setIsDeleting(true);
    setDeleteErrorMsg('');
    const res = await deleteSavingsGoal(goalToDelete.id);
    setIsDeleting(false);
    if (res.error) {
      setDeleteErrorMsg(res.error);
    } else {
      setGoalToDelete(null);
    }
  };

  const handleOpenDepositModal = (goal) => {
    setSelectedGoal(goal);
    setDepositModalOpen(true);
  };

  const handleOpenWithdrawModal = (goal) => {
    setSelectedGoal(goal);
    setWithdrawModalOpen(true);
  };

  const totalCurrentAmount = savingsGoals.reduce((sum, goal) => sum + Number(goal.current_amount), 0);
  const totalTargetAmount = savingsGoals.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0);

  return (
    <>
      <div className="w-full max-w-full overflow-x-hidden flex-1 p-4 md:p-6 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-on-surface">Celengan</h1>
            <p className="text-sm text-on-surface-variant mt-1">Alokasikan dana untuk mimpimu secara fleksibel.</p>
          </div>
          <button 
            onClick={() => handleOpenFormModal()} 
            className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all active:scale-[0.98]"
          >
            <Icon name="add" sizeClass="text-[20px]" />
            <span>Buat Celengan</span>
          </button>
        </header>

        {/* --- Summary --- */}
        <div className="mb-8 p-6 bg-surface-container-low border border-outline-variant/30 rounded-2xl relative overflow-hidden flex flex-col md:flex-row justify-between md:items-end gap-4">

          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-on-surface-variant mb-1">Total Dana di Celengan</h3>
            <p className="text-4xl font-black text-emerald-500">{formatRupiah(totalCurrentAmount)}</p>
          </div>
          {totalTargetAmount > 0 && (
            <div className="relative z-10 text-left md:text-right">
              <p className="text-xs text-on-surface-variant font-semibold">Total Target Keseluruhan</p>
              <p className="text-lg font-bold text-on-surface">{formatRupiah(totalTargetAmount)}</p>
            </div>
          )}
        </div>


        {/* --- Goals Grid --- */}
        {savingsLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            {savingsGoals.map(goal => (
              <SavingsGoalCard 
                key={goal.id} 
                goal={goal} 
                onDeposit={handleOpenDepositModal} 
                onWithdraw={handleOpenWithdrawModal}
                onEdit={handleOpenFormModal}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
        
        {!savingsLoading && savingsGoals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl bg-surface-container-lowest">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                  <Icon name="savings" sizeClass="text-[40px]" />
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Mulai Celengan Pertamamu!</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mb-6">Buat target menabung khusus seperti Dana Darurat, Beli Gadget, atau Liburan, dan lacak progressnya di sini.</p>
                <button onClick={() => handleOpenFormModal()} className="text-sm font-bold text-emerald-500 hover:underline">
                  + Tambah Celengan
                </button>
            </div>
        )}
      </div>

      {/* --- Modals --- */}
      <GoalFormModal 
        isOpen={isFormModalOpen} 
        onClose={() => setFormModalOpen(false)} 
        onSave={handleSaveGoal}
        initialData={selectedGoal}
      />
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => setDepositModalOpen(false)} 
        onDeposit={depositToSavingsGoal}
        goal={selectedGoal}
        wallets={wallets}
      />
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setWithdrawModalOpen(false)} 
        onWithdraw={withdrawFromSavings}
        goal={selectedGoal}
        wallets={wallets}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => { setGoalToDelete(null); setDeleteErrorMsg(''); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm glass-card bg-surface-container-high/95 p-6 animate-slide-up overflow-hidden shadow-2xl border border-error/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-error/15 border border-error/30 flex items-center justify-center mb-4">
                <Icon name="delete_forever" sizeClass="text-[32px] text-error" />
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">Hapus Celengan?</h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Yakin ingin menghapus celengan <span className="font-bold text-on-surface">{goalToDelete.name}</span>?
              </p>

              {deleteErrorMsg && (
                <div className="w-full bg-error/10 border border-error/20 rounded-xl p-3 mb-6">
                  <p className="text-xs font-semibold text-error text-left">{deleteErrorMsg}</p>
                </div>
              )}
              
              <div className="flex w-full gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => { setGoalToDelete(null); setDeleteErrorMsg(''); }}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteGoal}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-error text-white text-sm font-bold hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/></svg>Menghapus...</>
                  ) : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
