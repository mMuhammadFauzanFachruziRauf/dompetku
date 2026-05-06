import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const TransactionContext = createContext(null);

const DEFAULT_INCOME = 0;
const DEFAULT_SALARY_INFO = { amount: DEFAULT_INCOME, note: "" };

const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const normalizeSalaryInfo = (info) => ({
  amount: Number(info?.amount) || 0,
  note: typeof info?.note === "string" ? info.note : "",
});

const DEFAULT_CATEGORIES = [
  { name: "Makan", type: "Needs", keywords: "makan,minum,jajan,kopi,nasgor,bakso,warteg,nasi,soto,ayam,mie,burger,pizza", icon: "restaurant", color: "text-orange-400" },
  { name: "Kendaraan", type: "Needs", keywords: "gojek,grab,bensin,parkir,motor,ojek,bbm", icon: "directions_car", color: "text-blue-400" },
  { name: "Belanja", type: "Wants", keywords: "shopee,tokopedia,baju,sepatu,beli,lazada", icon: "shopping_bag", color: "text-purple-400" },
  { name: "Hiburan", type: "Wants", keywords: "nonton,bioskop,netflix,spotify,game,youtube,disney", icon: "movie", color: "text-pink-400" },
  { name: "Keluarga", type: "Needs", keywords: "keluarga,rumah", icon: "family_restroom", color: "text-green-400" },
  { name: "Keperluan", type: "Needs", keywords: "listrik,token,air,pulsa", icon: "inventory_2", color: "text-slate-400" },
  { name: "Persediaan", type: "Needs", keywords: "sabun,shampoo,odol,beras,minyak", icon: "local_pharmacy", color: "text-yellow-400" },
  { name: "E-Wallet", type: "Needs", keywords: "gopay,dana,ovo,shopeepay", icon: "account_balance_wallet", color: "text-cyan-400" },
  { name: "BPJS", type: "Needs", keywords: "bpjs,kesehatan", icon: "health_and_safety", color: "text-teal-400" },
  { name: "Hadiah", type: "Wants", keywords: "hadiah,kado", icon: "card_giftcard", color: "text-rose-400" },
  { name: "Travel", type: "Wants", keywords: "travel,tiket,hotel,pesawat,kereta", icon: "flight", color: "text-indigo-400" },
  { name: "Tabungan Umum", type: "Savings", keywords: "tabungan,menabung,nabung", icon: "savings", color: "text-emerald-400" },
  { name: "Dana Darurat", type: "Savings", keywords: "darurat", icon: "security", color: "text-lime-400" },
];

export function TransactionProvider({ children }) {
  const { user } = useAuth();
  const isInjecting = useRef(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlySalaries, setMonthlySalaries] = useState({});
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [shortcuts, setShortcuts] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const now = selectedDate;
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data, error: err } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("tanggal", start)
      .lte("tanggal", end)
      .order("tanggal", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setTransactions(data ?? []);
    setLoading(false);
  }, [user, selectedDate]);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("monthly_income, monthly_salaries, has_onboarded, quick_shortcuts, category_budgets")
      .eq("id", user.id)
      .single();
    if (data) {
      setMonthlySalaries(data.monthly_salaries || {});
      setHasOnboarded(data.has_onboarded || false);
      if (data.quick_shortcuts) {
        setShortcuts(data.quick_shortcuts);
      } else {
        setShortcuts(["Makan siang 50000", "Bensin 20k", "Kopi 15000", "Gojek 25000"]);
      }
      if (data.category_budgets) {
        setCategoryBudgets(data.category_budgets);
      } else {
        setCategoryBudgets({});
      }
    }
  }, [user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (err) { setError(err.message); return; }

    // Lazy initialization
    if (!data || data.length === 0) {
      if (isInjecting.current) return;
      isInjecting.current = true;
      try {
        const defaults = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
        const { data: inserted, error: insertErr } = await supabase
          .from("categories")
          .insert(defaults)
          .select();

        if (insertErr) { setError(insertErr.message); return; }
        setCategories(inserted ?? []);
      } finally {
        isInjecting.current = false;
      }
    } else {
      setCategories(data);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchProfile();
      fetchCategories();
    } else {
      setTransactions([]);
      setCategories([]);
      setLoading(false);
    }
  }, [user, fetchTransactions, fetchProfile, fetchCategories]);

  // ── Kategori CRUD ────────────────────────────────────────────────────────
  const addCategory = async (cat) => {
    if (!user) return { error: "Belum login" };
    const { data, error: err } = await supabase
      .from("categories")
      .insert([{ ...cat, user_id: user.id }])
      .select()
      .single();
    if (err) return { error: err.message };
    setCategories(prev => [...prev, data]);
    return { data };
  };

  const updateCategory = async (id, cat) => {
    const { error: err } = await supabase
      .from("categories")
      .update(cat)
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...cat } : c));
    return { success: true };
  };

  const deleteCategory = async (id) => {
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setCategories(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  // ── Update penghasilan ───────────────────────────────────────────────────
  const selectedMonthKey = useMemo(() => getMonthKey(selectedDate), [selectedDate]);
  const currentMonthSalaryInfo = useMemo(
    () => normalizeSalaryInfo(monthlySalaries[selectedMonthKey] || DEFAULT_SALARY_INFO),
    [monthlySalaries, selectedMonthKey]
  );
  const income = currentMonthSalaryInfo.amount;

  const updateCurrentMonthSalary = async (newAmount, newNote = "", setOnboarded = false) => {
    if (!user) return { error: "Belum login" };
    const numericAmount = Number(newAmount);
    if (isNaN(numericAmount) || numericAmount < 0) return { error: "Nominal tidak valid" };

    const nextMonthlySalaries = {
      ...(monthlySalaries || {}),
      [selectedMonthKey]: {
        amount: numericAmount,
        note: typeof newNote === "string" ? newNote : "",
      },
    };

    const payload = {
      id: user.id,
      monthly_salaries: nextMonthlySalaries,
      monthly_income: numericAmount,
    };
    if (setOnboarded) payload.has_onboarded = true;

    const { error: err } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: 'id' });

    if (err) return { error: err.message };
    setMonthlySalaries(nextMonthlySalaries);
    if (setOnboarded) setHasOnboarded(true);
    return { success: true };
  };

  const updateIncome = (newIncome, setOnboarded = false) =>
    updateCurrentMonthSalary(newIncome, currentMonthSalaryInfo.note, setOnboarded);

  // ── Update Shortcuts ─────────────────────────────────────────────────────
  const updateShortcuts = async (newShortcuts) => {
    if (!user) return { error: "Belum login" };
    const { error: err } = await supabase
      .from("profiles")
      .upsert({ id: user.id, quick_shortcuts: newShortcuts }, { onConflict: 'id' });

    if (err) return { error: err.message };
    setShortcuts(newShortcuts);
    return { success: true };
  };

  // ── Update Category Budgets ───────────────────────────────────────────────
  const updateCategoryBudgets = async (newBudgets) => {
    if (!user) return { error: "Belum login" };
    const { error: err } = await supabase
      .from("profiles")
      .upsert({ id: user.id, category_budgets: newBudgets }, { onConflict: 'id' });

    if (err) return { error: err.message };
    setCategoryBudgets(newBudgets);
    return { success: true };
  };

  // ── Tambah & Hapus Transaksi ─────────────────────────────────────────────
  const addTransaction = async ({ nominal, kategori, catatan = "", tanggal }) => {
    if (!user) return { error: "Belum login" };
    
    const payload = { user_id: user.id, nominal, kategori, catatan };
    if (tanggal) {
      payload.tanggal = tanggal;
    }
    
    const { data, error: err } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single();
      
    if (err) return { error: err.message };
    
    // Only add to state if the transaction is in the currently selected month
    const txDate = new Date(data.tanggal);
    if (
      txDate.getFullYear() === selectedDate.getFullYear() &&
      txDate.getMonth() === selectedDate.getMonth()
    ) {
      setTransactions((prev) => [...prev, data].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    }
    return { data };
  };

  const updateTransaction = async (id, updatedData) => {
    if (!user) return { error: "Belum login" };
    const { error: err } = await supabase
      .from("transactions")
      .update(updatedData)
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
    );
    return { success: true };
  };

  const deleteTransaction = async (id) => {
    const { error: err } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    return { success: true };
  };

  // ── Computed values ──────────────────────────────────────────────────────
  const totalSpent = transactions.filter(t => t.nominal > 0).reduce((s, t) => s + t.nominal, 0);
  const totalIncomeTx = transactions.filter(t => t.nominal < 0).reduce((s, t) => s + Math.abs(t.nominal), 0);
  const remaining = income + totalIncomeTx - totalSpent;
  const totalIncomeAll = income + totalIncomeTx;
  const pct = totalIncomeAll > 0 ? Math.min(Math.round((totalSpent / totalIncomeAll) * 100), 100) : 0;

  const byCategory = transactions.filter(t => t.nominal > 0).reduce((acc, t) => {
    acc[t.kategori] = (acc[t.kategori] || 0) + t.nominal;
    return acc;
  }, {});

  const getBudgetProgress = useCallback(() => {
    if (!categoryBudgets || Object.keys(categoryBudgets).length === 0) return [];

    return Object.entries(categoryBudgets).map(([category, limit]) => {
      const spent = byCategory[category] || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { category, limit, spent, remaining, percentage };
    });
  }, [categoryBudgets, byCategory]);

  const value = {
    transactions,
    categories,
    loading,
    error,
    income,
    monthlySalaries,
    currentMonthSalaryInfo,
    hasOnboarded,
    shortcuts,
    categoryBudgets,
    selectedDate,
    totalSpent,
    remaining,
    pct,
    byCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    updateIncome,
    updateCurrentMonthSalary,
    updateShortcuts,
    updateCategoryBudgets,
    getBudgetProgress,
    setSelectedDate,
    refetch: fetchTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransaction harus dipakai di dalam <TransactionProvider>");
  return ctx;
}
