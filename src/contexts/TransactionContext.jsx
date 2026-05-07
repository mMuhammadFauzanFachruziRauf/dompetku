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
  // Default income categories
  { name: "Cash", type: "Income", keywords: "cash,tunai", icon: "account_balance_wallet", color: "text-emerald-400" },
  { name: "E-Wallet", type: "Income", keywords: "gopay,dana,ovo,shopeepay,bca", icon: "credit_card", color: "text-cyan-400" },
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
  const isInjectingWallet = useRef(false);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
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
      .select("*, wallets:wallet_id(name, icon), to_wallet:to_wallet_id(name, icon)")
      .eq("user_id", user.id)
      .gte("tanggal", start)
      .lte("tanggal", end)
      .order("tanggal", { ascending: false });

    if (err) { setError(err.message); setLoading(false); return; }
    setTransactions(data ?? []);
    setLoading(false);
  }, [user, selectedDate]);

  const fetchAllTransactionsForBalances = useCallback(async () => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from("transactions")
      .select("id, jenis, nominal, kategori, wallet_id, to_wallet_id, tanggal")
      .eq("user_id", user.id)
      .order("tanggal", { ascending: true });

    if (err) {
      setError(err.message);
      return;
    }

    setAllTransactions(data ?? []);
  }, [user]);

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

  const fetchWallets = useCallback(async () => {
    if (!user) return;

    const { data, error: err } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      return;
    }

    if (!data || data.length === 0) {
      if (isInjectingWallet.current) return;
      isInjectingWallet.current = true;

      const { data: latestData, error: latestErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (latestErr) {
        isInjectingWallet.current = false;
        setError(latestErr.message);
        return;
      }

      if (latestData && latestData.length > 0) {
        isInjectingWallet.current = false;
        setWallets(latestData);
        return;
      }

      const { error: insertErr } = await supabase
        .from("wallets")
        .insert([
          {
            user_id: user.id,
            name: "Cash",
            icon: "👛",
            starting_balance: 0,
          },
        ]);

      if (insertErr) {
        isInjectingWallet.current = false;
        setError(insertErr.message);
        return;
      }

      const { data: seededData, error: seededErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (seededErr) {
        isInjectingWallet.current = false;
        setError(seededErr.message);
        return;
      }

      setWallets(seededData ?? []);
      isInjectingWallet.current = false;
      return;
    }

    setWallets(data);
  }, [user]);

  const addWallet = async ({ name, icon = "👛", starting_balance = 0 }) => {
    if (!user) return { error: "Belum login" };
    const cleanName = (name || "").trim();
    const initialBalance = Number(starting_balance);
    if (!cleanName) return { error: "Nama dompet wajib diisi" };
    if (!Number.isFinite(initialBalance)) return { error: "Saldo awal tidak valid" };

    const { data, error: err } = await supabase
      .from("wallets")
      .insert([
        {
          user_id: user.id,
          name: cleanName,
          icon: icon || "👛",
          starting_balance: initialBalance,
        },
      ])
      .select()
      .single();
    if (err) return { error: err.message };

    setWallets((prev) => [...prev, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    return { data };
  };

  const updateWallet = async (id, payload) => {
    if (!user) return { error: "Belum login" };
    const next = { ...payload };
    if (typeof next.name === "string") next.name = next.name.trim();
    if (!next.name) return { error: "Nama dompet wajib diisi" };
    if (next.starting_balance !== undefined) {
      const parsed = Number(next.starting_balance);
      if (!Number.isFinite(parsed)) return { error: "Saldo awal tidak valid" };
      next.starting_balance = parsed;
    }

    const { data, error: err } = await supabase
      .from("wallets")
      .update(next)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (err) return { error: err.message };

    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
    return { data };
  };

  const deleteWallet = async (id) => {
    if (!user) return { error: "Belum login" };
    if (wallets.length <= 1) return { error: "Minimal harus ada 1 dompet" };

    const { error: err } = await supabase
      .from("wallets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };

    setWallets((prev) => prev.filter((w) => w.id !== id));
    return { success: true };
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    await Promise.all([
      fetchTransactions(),
      fetchAllTransactionsForBalances(),
      fetchProfile(),
      fetchCategories(),
      fetchWallets(),
    ]);
  }, [user, fetchTransactions, fetchAllTransactionsForBalances, fetchProfile, fetchCategories, fetchWallets]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setTransactions([]);
      setAllTransactions([]);
      setWallets([]);
      setCategories([]);
      setLoading(false);
    }
  }, [user, fetchData]);

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
  const currentMonthCategoryBudgets = useMemo(
    () => categoryBudgets?.[selectedMonthKey] || {},
    [categoryBudgets, selectedMonthKey]
  );
  const currentMonthSalaryInfo = useMemo(
    () => normalizeSalaryInfo(monthlySalaries[selectedMonthKey] || DEFAULT_SALARY_INFO),
    [monthlySalaries, selectedMonthKey]
  );
  const income = currentMonthSalaryInfo.amount;
  const categoryTypeByName = useMemo(() => {
    const map = {};
    for (const category of categories) {
      map[category.name] = category.type;
    }
    return map;
  }, [categories]);

  const resolveTransactionType = useCallback((tx) => {
    const rawJenis = typeof tx?.jenis === "string" ? tx.jenis.toLowerCase() : "";
    if (rawJenis === "pemasukan" || rawJenis === "pengeluaran" || rawJenis === "transfer") {
      return rawJenis;
    }
    const categoryType = categoryTypeByName[tx?.kategori];
    if (categoryType === "Income") return "pemasukan";
    if (categoryType) return "pengeluaran";
    return Number(tx?.nominal || 0) < 0 ? "pemasukan" : "pengeluaran";
  }, [categoryTypeByName]);

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

  const updateCategoryBudget = async (categoryName, newLimit) => {
    if (!user) return { error: "Belum login" };
    if (!categoryName || typeof categoryName !== "string") return { error: "Kategori tidak valid" };

    const parsedLimit = Number(newLimit);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 0) return { error: "Batas budget tidak valid" };

    const nextBudgets = {
      ...(categoryBudgets || {}),
      [selectedMonthKey]: {
        ...(categoryBudgets?.[selectedMonthKey] || {}),
        [categoryName]: parsedLimit,
      },
    };

    const { error: err } = await supabase
      .from("profiles")
      .upsert({ id: user.id, category_budgets: nextBudgets }, { onConflict: "id" });

    if (err) return { error: err.message };
    setCategoryBudgets(nextBudgets);
    return { success: true };
  };

  // ── Tambah & Hapus Transaksi ─────────────────────────────────────────────
  const addTransaction = async ({
    nominal,
    kategori,
    catatan = "",
    tanggal,
    jenis,
    wallet_id,
    to_wallet_id,
  }) => {
    if (!user) return { error: "Belum login" };
    
    const payload = { user_id: user.id, nominal, kategori, catatan };
    if (jenis) payload.jenis = jenis;
    if (wallet_id) payload.wallet_id = wallet_id;
    if (to_wallet_id) payload.to_wallet_id = to_wallet_id;
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
    setAllTransactions((prev) => [...prev, data].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)));
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
  const totalSpent = transactions
    .filter((t) => resolveTransactionType(t) === "pengeluaran")
    .reduce((s, t) => s + Math.abs(Number(t.nominal || 0)), 0);
  const totalIncomeTx = transactions
    .filter((t) => resolveTransactionType(t) === "pemasukan")
    .reduce((s, t) => s + Math.abs(Number(t.nominal || 0)), 0);
  const totalWalletStartingBalance = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.starting_balance || 0),
    0
  );
  const totalBaseIncome = income + totalWalletStartingBalance;
  const remaining = totalBaseIncome + totalIncomeTx - totalSpent;
  const totalMonthlyIncome = totalBaseIncome + totalIncomeTx;
  const pct = totalMonthlyIncome > 0
    ? Math.max(0, Math.min(Math.round((totalSpent / totalMonthlyIncome) * 100), 100))
    : 0;

  const byCategory = transactions
    .filter((t) => resolveTransactionType(t) === "pengeluaran")
    .reduce((acc, t) => {
      acc[t.kategori] = (acc[t.kategori] || 0) + Math.abs(Number(t.nominal || 0));
      return acc;
    }, {});

  const expenseByCategory = transactions
    .filter((t) => resolveTransactionType(t) === "pengeluaran")
    .filter((t) => categoryTypeByName[t.kategori] !== "Income")
    .reduce((acc, t) => {
      acc[t.kategori] = (acc[t.kategori] || 0) + Math.abs(Number(t.nominal || 0));
      return acc;
    }, {});

  const walletBalances = useMemo(() => {
    const base = {};

    for (const wallet of wallets) {
      base[wallet.id] = {
        walletId: wallet.id,
        name: wallet.name,
        icon: wallet.icon,
        startingBalance: Number(wallet.starting_balance || 0),
        balance: Number(wallet.starting_balance || 0),
      };
    }

    for (const tx of allTransactions) {
      const nominalAbs = Math.abs(Number(tx.nominal || 0));
      if (!nominalAbs) continue;

      const txType = resolveTransactionType(tx);
      if (txType === "pemasukan" && tx.wallet_id && base[tx.wallet_id]) {
        base[tx.wallet_id].balance += nominalAbs;
      } else if (txType === "pengeluaran" && tx.wallet_id && base[tx.wallet_id]) {
        base[tx.wallet_id].balance -= nominalAbs;
      } else if (txType === "transfer") {
        if (tx.wallet_id && base[tx.wallet_id]) base[tx.wallet_id].balance -= nominalAbs;
        if (tx.to_wallet_id && base[tx.to_wallet_id]) base[tx.to_wallet_id].balance += nominalAbs;
      }
    }

    return base;
  }, [wallets, allTransactions, resolveTransactionType]);

  const getBudgetProgress = useCallback(() => {
    if (!currentMonthCategoryBudgets || Object.keys(currentMonthCategoryBudgets).length === 0) return [];

    return Object.entries(currentMonthCategoryBudgets).map(([category, limit]) => {
      const spent = byCategory[category] || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { category, limit, spent, remaining, percentage };
    });
  }, [currentMonthCategoryBudgets, byCategory]);

  const value = {
    transactions,
    allTransactions,
    wallets,
    setWallets,
    walletBalances,
    categories,
    loading,
    error,
    income,
    monthlySalaries,
    currentMonthSalaryInfo,
    hasOnboarded,
    shortcuts,
    categoryBudgets,
    currentMonthCategoryBudgets,
    selectedDate,
    totalSpent,
    remaining,
    pct,
    byCategory,
    expenseByCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addWallet,
    updateWallet,
    deleteWallet,
    updateIncome,
    updateCurrentMonthSalary,
    updateShortcuts,
    updateCategoryBudgets,
    updateCategoryBudget,
    getBudgetProgress,
    setSelectedDate,
    refetch: fetchData,
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
