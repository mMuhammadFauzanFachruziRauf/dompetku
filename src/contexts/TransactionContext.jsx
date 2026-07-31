import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const TransactionContext = createContext(null);

const DEFAULT_INCOME = 0;
const DEFAULT_SALARY_INFO = { amount: DEFAULT_INCOME, note: "" };

const ROLLOVER_STORAGE_KEY = "__rollover__";

const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const computeMonthBudgetTotals = (txList, year, month, resolveTransactionType) => {
  let monthIncome = 0;
  let monthExpenses = 0;

  for (const tx of txList) {
    const txDate = new Date(tx.tanggal);
    if (txDate.getFullYear() !== year || txDate.getMonth() !== month) continue;

    const txType = resolveTransactionType(tx);
    const amount = Math.abs(Number(tx.nominal || 0));
    if (txType === "pemasukan") monthIncome += amount;
    else if (txType === "pengeluaran") monthExpenses += amount;
  }

  return { income: monthIncome, expenses: monthExpenses, leftover: monthIncome - monthExpenses };
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
  const [transactionsRevision, setTransactionsRevision] = useState(0);
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

  // ─── CELENGAN (SAVINGS GOALS) STATE ────────────────────────────────>
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [savingsTransactions, setSavingsTransactions] = useState([]);
  const [savingsLoading, setSavingsLoading] = useState(true);

  // ─── AUTO-SPLIT RULES STATE ───────────────────────────────────────>
  const [autoSplitRules, setAutoSplitRules] = useState([]);
  const [autoSplitLoading, setAutoSplitLoading] = useState(false);

  const fetchSavingsGoals = useCallback(async () => {
    if (!user) return;
    setSavingsLoading(true);
    
    const { data: goals, error: goalsErr } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
      
    if (!goalsErr && goals) {
      setSavingsGoals(goals);
    }

    const { data: txs, error: txsErr } = await supabase
      .from("savings_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false });

    if (!txsErr && txs) {
      setSavingsTransactions(txs);
    }
    
    setSavingsLoading(false);
  }, [user]);

  const addSavingsGoal = async (goal) => {
    const newGoal = {
      ...goal,
      user_id: user.id,
      current_amount: 0
    };
    
    const { data, error } = await supabase
      .from("savings_goals")
      .insert([newGoal])
      .select()
      .single();
      
    if (error) return { error: error.message };
    
    setSavingsGoals(prev => [...prev, data]);
    return { data };
  };

  const depositToSavingsGoal = async (goalId, amount) => {
    const { data: tx, error: txError } = await supabase
      .from("savings_transactions")
      .insert([{
        goal_id: goalId,
        user_id: user.id,
        amount: Number(amount)
      }])
      .select()
      .single();

    if (txError) return { error: txError.message };

    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return { error: "Goal not found" };
    
    const newAmount = Number(goal.current_amount) + Number(amount);
    const { error: updateError } = await supabase
      .from("savings_goals")
      .update({ current_amount: newAmount })
      .eq("id", goalId);
      
    if (updateError) return { error: updateError.message };

    setSavingsTransactions(prev => [tx, ...prev]);
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount } : g));
    return { data: tx };
  };

  const withdrawFromSavings = async (goalId, amount, type, expenseDetails = null) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (!goal) return { error: "Celengan tidak ditemukan" };
    if (goal.current_amount < amount) return { error: "Saldo celengan tidak mencukupi" };

    if (type === 'SPEND' && expenseDetails) {
      const txResult = await addTransaction({
        ...expenseDetails,
        nominal: amount,
        jenis: "pengeluaran"
      });
      if (txResult.error) return { error: txResult.error };
    }

    const { data: tx, error: txError } = await supabase
      .from("savings_transactions")
      .insert([{
        goal_id: goalId,
        user_id: user.id,
        amount: -Number(amount)
      }])
      .select()
      .single();

    if (txError) return { error: txError.message };

    const newAmount = Number(goal.current_amount) - Number(amount);
    const { error: updateError } = await supabase
      .from("savings_goals")
      .update({ current_amount: newAmount })
      .eq("id", goalId);

    if (updateError) return { error: updateError.message };

    setSavingsTransactions(prev => [tx, ...prev]);
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, current_amount: newAmount } : g));
    return { success: true };
  };
  const updateSavingsGoal = async (goalId, updates) => {
    const { data, error } = await supabase
      .from("savings_goals")
      .update(updates)
      .eq("id", goalId)
      .select()
      .single();
      
    if (error) return { error: error.message };
    
    setSavingsGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...data } : g));
    return { data };
  };

  const deleteSavingsGoal = async (goalId) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    if (goal && Number(goal.current_amount) > 0) {
      return { error: "Cairkan atau kosongkan saldo celengan terlebih dahulu sebelum menghapus!" };
    }

    const { error } = await supabase
      .from("savings_goals")
      .delete()
      .eq("id", goalId);
      
    if (error) return { error: error.message };
    
    setSavingsGoals(prev => prev.filter(g => g.id !== goalId));
    setSavingsTransactions(prev => prev.filter(t => t.goal_id !== goalId));
    
    // Also remove any auto-split rules targeting this goal
    const rulesToDelete = autoSplitRules.filter(r => r.target_savings_goal_id === goalId);
    for (const rule of rulesToDelete) {
      await deleteAutoSplitRule(rule.id);
    }
    
    return { success: true };
  };

  // <──────────────────────────────── END OF CELENGAN ────────────────>

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
    setTransactions(Array.isArray(data) ? [...data] : []);
    setTransactionsRevision((r) => r + 1);
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

  useEffect(() => {
    if (!user) {
      // Clear state when logged out
      setTransactions([]);
      setTransactionsRevision((r) => r + 1);
      setAllTransactions([]);
      setWallets([]);
      setCategories([]);
      setMonthlySalaries({});
      setHasOnboarded(false);
      setShortcuts([]);
      setCategoryBudgets({});
      setSavingsGoals([]); // Clear savings goals on logout
      setSavingsTransactions([]); // Clear savings transactions on logout
      setAutoSplitRules([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let subscription = null;
    let fallbackTimeout = null;

    const runFetches = async () => {
      if (cancelled) return;
      try {
        await Promise.all([
          fetchTransactions(),
          fetchAllTransactionsForBalances(),
          fetchProfile(),
          fetchCategories(),
          fetchWallets(),
          fetchSavingsGoals(), // Fetch savings goals
          fetchAutoSplitRules(),
        ]);
      } catch (e) {
        // swallow - individual fetchers set errors
      }
    };

    (async () => {
      // 1) If there's already an attached session, run immediately.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await runFetches();
        return;
      }

      // 2) Otherwise, wait for the SIGNED_IN event via onAuthStateChange
      //    as the most reliable indicator that the client has the token.
      const { data } = supabase.auth.onAuthStateChange((event, sess) => {
        if (event === "SIGNED_IN" && sess) {
          runFetches();
        }
      });
      subscription = data.subscription;

      // 3) Fallback: if SIGNED_IN never arrives within a short window,
      //    run fetches anyway (covers edge cases like same-tab redirects).
      fallbackTimeout = setTimeout(() => {
        runFetches();
      }, 800);
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.unsubscribe();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [user, fetchTransactions, fetchAllTransactionsForBalances, fetchProfile, fetchCategories, fetchWallets, fetchSavingsGoals]);

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

  // Dynamic income: compute from actual `pemasukan` transactions for selected month
  // `transactions` already contains only the currently selected month's transactions
  const income = useMemo(() => {
    return transactions
      .filter((t) => resolveTransactionType(t) === "pemasukan")
      .reduce((s, t) => s + Math.abs(Number(t.nominal || 0)), 0);
  }, [transactions, resolveTransactionType]);

  const previousMonthDate = useMemo(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1),
    [selectedDate]
  );

  const previousMonthLeftover = useMemo(() => {
    const { leftover } = computeMonthBudgetTotals(
      allTransactions,
      previousMonthDate.getFullYear(),
      previousMonthDate.getMonth(),
      resolveTransactionType
    );
    return leftover;
  }, [allTransactions, previousMonthDate, resolveTransactionType]);

  const budgetRollover = useMemo(
    () => categoryBudgets?.[ROLLOVER_STORAGE_KEY] || {},
    [categoryBudgets]
  );

  const rolloverAmount = useMemo(() => {
    const raw = budgetRollover?.[selectedMonthKey];
    return Number(raw) > 0 ? Number(raw) : 0;
  }, [budgetRollover, selectedMonthKey]);

  const isCurrentCalendarMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth()
    );
  }, [selectedDate]);

  const canClaimRollover = isCurrentCalendarMonth
    && previousMonthLeftover > 0
    && rolloverAmount === 0;

  const claimBudgetRollover = async () => {
    if (!user) return { error: "Belum login" };
    if (!canClaimRollover) return { error: "Sisa budget bulan lalu tidak tersedia" };

    const amount = Math.round(previousMonthLeftover);
    if (amount <= 0) return { error: "Tidak ada sisa budget untuk ditarik" };

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("category_budgets")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") return { error: fetchError.message };

    const currentBudgets = profile?.category_budgets || {};
    const currentRollover = currentBudgets[ROLLOVER_STORAGE_KEY] || {};
    if (Number(currentRollover[selectedMonthKey]) > 0) {
      return { error: "Sisa budget bulan lalu sudah ditarik" };
    }

    const nextBudgets = {
      ...currentBudgets,
      [ROLLOVER_STORAGE_KEY]: {
        ...currentRollover,
        [selectedMonthKey]: amount,
      },
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        category_budgets: nextBudgets,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (upsertError) return { error: upsertError.message };

    setCategoryBudgets(nextBudgets);
    return { success: true, amount };
  };

  const updateCurrentMonthSalary = async (newAmount, newNote = "", setOnboarded = false) => {
    if (!user) return { error: "Belum login" };
    const numericAmount = Number(newAmount);
    if (isNaN(numericAmount) || numericAmount < 0) return { error: "Nominal tidak valid" };

    // Fetch latest monthly_salaries from DB
    const { data: profileData, error: fetchErr } = await supabase
      .from("profiles")
      .select("monthly_salaries")
      .eq("id", user.id)
      .single();
    if (fetchErr) return { error: fetchErr.message };
    const latestMonthlySalaries = profileData?.monthly_salaries || {};

    const mergedMonthlySalaries = {
      ...latestMonthlySalaries,
      [selectedMonthKey]: {
        amount: numericAmount,
        note: typeof newNote === "string" ? newNote : "",
      },
    };

    const payload = {
      id: user.id,
      monthly_salaries: mergedMonthlySalaries,
      monthly_income: numericAmount,
    };
    if (setOnboarded) payload.has_onboarded = true;

    const { error: err } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: 'id' });

    if (err) return { error: err.message };
    setMonthlySalaries(mergedMonthlySalaries);
    if (setOnboarded) setHasOnboarded(true);
    return { success: true };
  };

  const markOnboarded = async () => {
    if (!user) return { error: "Belum login" };
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: user.id, has_onboarded: true }, { onConflict: 'id' });
    if (err) return { error: err.message };
    setHasOnboarded(true);
    return { success: true };
  };

  const updateIncome = (newIncome, setOnboarded = false) =>
    updateCurrentMonthSalary(newIncome, "", setOnboarded);

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
  const updateCategoryBudget = async (categoryName, amount) => {
    try {
      if (!user) return { error: "Belum login" };

      // 1. Convert safely to a plain number primitive (handle event objects or raw values)
      let numericAmount = 0;
      if (amount && typeof amount === 'object') {
        if (amount.target) numericAmount = Number(amount.target.value);
        else if ('amount' in amount) numericAmount = Number(amount.amount);
      } else {
        numericAmount = Number(amount);
      }
      if (isNaN(numericAmount)) numericAmount = 0;

      // 2. Fetch the absolute freshest profiles data from Supabase
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('category_budgets')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentBudgets = profile?.category_budgets || {};

      // 3. Force initialize the nested structure correctly: { "2026-05": {} }
      if (!currentBudgets[selectedMonthKey] || typeof currentBudgets[selectedMonthKey] !== 'object') {
        currentBudgets[selectedMonthKey] = {};
      }

      // 4. CRITICAL: Plain primitive number assignment. NO SPREAD OPERATOR.
      currentBudgets[selectedMonthKey][categoryName] = numericAmount;

      // console.log("🔥 REAL DEBUG - FINAL OBJECT GOING TO SUPABASE:", currentBudgets);

      // 5. Upsert back to database
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          category_budgets: currentBudgets,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      // 6. Sync to local state
      setCategoryBudgets(currentBudgets);
      return { error: null };
    } catch (error) {
      console.error("Error updating category budget:", error);
      return { error };
    }
  };

  const updateCategoryBudgets = async (newBudgets) => {
    try {
      if (!user) return { error: "Belum login" };

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('category_budgets')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const currentBudgets = profile?.category_budgets || {};

      if (!currentBudgets[selectedMonthKey] || typeof currentBudgets[selectedMonthKey] !== 'object') {
        currentBudgets[selectedMonthKey] = {};
      }

      // Clean and map incoming budgets as plain numbers
      const cleanedMonthBudgets = {};
      Object.keys(newBudgets).forEach((cat) => {
        cleanedMonthBudgets[cat] = Number(newBudgets[cat]) || 0;
      });

      currentBudgets[selectedMonthKey] = {
        ...currentBudgets[selectedMonthKey],
        ...cleanedMonthBudgets
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          category_budgets: currentBudgets,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;
      setCategoryBudgets(currentBudgets);
      return { error: null };
    } catch (error) {
      console.error("Error updating category budgets:", error);
      return { error };
    }
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

    const resolvedJenis = typeof jenis === "string"
      ? jenis.toLowerCase()
      : (Number(nominal) < 0 ? "pemasukan" : "pengeluaran");
    const nominalAbs = Math.abs(Number(nominal || 0));
    if ((resolvedJenis === "pengeluaran" || resolvedJenis === "transfer") && wallet_id) {
      const walletBalance = Number(
        walletBalances?.[wallet_id]?.balance ??
        wallets.find((w) => w.id === wallet_id)?.starting_balance ??
        0
      );
      if (nominalAbs > walletBalance) {
        const message = "Saldo tidak mencukupi di dompet ini!";
        return { success: false, message, error: message };
      }
    }

    const payload = { user_id: user.id, nominal, kategori, catatan };
    if (resolvedJenis) payload.jenis = resolvedJenis;
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
      setTransactions((prev) =>
        [...prev, data].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      );
      setTransactionsRevision((r) => r + 1);
    }
    setAllTransactions((prev) => [...prev, data].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)));
    return { data };
  };

  const updateTransaction = async (id, updatedData) => {
    if (!user) return { error: "Belum login" };

    // Create clean payload - only include fields that are actually being updated
    const cleanPayload = {};
    if (updatedData.nominal !== undefined) {
      const parsedNominal = Number(updatedData.nominal);
      if (!Number.isFinite(parsedNominal)) return { error: "Nominal tidak valid" };
      cleanPayload.nominal = parsedNominal;
    }
    if (updatedData.kategori !== undefined) cleanPayload.kategori = updatedData.kategori;
    if (updatedData.catatan !== undefined) cleanPayload.catatan = updatedData.catatan;
    if (updatedData.jenis !== undefined) cleanPayload.jenis = updatedData.jenis;
    if (updatedData.wallet_id !== undefined) cleanPayload.wallet_id = updatedData.wallet_id;
    if (updatedData.to_wallet_id !== undefined) cleanPayload.to_wallet_id = updatedData.to_wallet_id;
    if (updatedData.tanggal !== undefined) cleanPayload.tanggal = updatedData.tanggal;

    // Fix nominal sign logic - expenses should be positive (displayed as -), income should be negative (displayed as +)
    const effectiveJenis = (cleanPayload.jenis ?? updatedData.jenis ?? "").toLowerCase();
    if (cleanPayload.nominal !== undefined && effectiveJenis) {
      const abs = Math.abs(cleanPayload.nominal);
      if (effectiveJenis === "pemasukan") {
        cleanPayload.nominal = -abs; // Income stored as negative (displays as +)
      } else if (effectiveJenis === "pengeluaran") {
        cleanPayload.nominal = abs; // Expenses stored as positive (displays as -)
      } else if (effectiveJenis === "transfer") {
        cleanPayload.nominal = abs; // Transfers stored as positive
      }
    }

    const txIdStr = String(id);
    console.log("Updating TX ID:", id, "with payload:", cleanPayload);
    console.log("ID type:", typeof id, "ID value:", id);
    console.log("Payload being sent:", cleanPayload);
    console.log("Current user ID:", user.id);

    // Add user_id explicitly to handle RLS policies
    const { data, error } = await supabase
      .from("transactions")
      .update(cleanPayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select();
    
    console.log("Supabase error if any:", error);
    console.log("Supabase response data:", data);
    console.log("Rows affected:", data?.length || 0);
    
    if (error) return { error: error.message };

    // Check if any rows were actually updated
    if (!data || data.length === 0) {
      console.log("No rows were updated - possible RLS policy blocking or ID mismatch");
      return { error: "Transaksi tidak ditemukan atau tidak memiliki izin untuk diubah" };
    }

    // Use the actual updated data from Supabase response
    const updatedTransaction = data[0];
    
    setTransactions((prev) => {
      const updated = prev.map((t) => (String(t.id) === txIdStr ? updatedTransaction : t));
      return [...updated]; // Ensure new array reference
    });
    setAllTransactions((prev) => {
      const updated = prev.map((t) => (String(t.id) === txIdStr ? updatedTransaction : t));
      return [...updated]; // Ensure new array reference
    });
    setTransactionsRevision((r) => r + 1);

    // Refresh both current month transactions and all-time list for wallet balances to ensure consistency
    // Note: These fetches will get the latest data from server and update state again
    await fetchTransactions();
    await fetchAllTransactionsForBalances();

    const result = { success: true, data: updatedTransaction };
    console.log("Update response success:", result);
    return result;
  };

  const deleteTransaction = async (id) => {
    const { error: err } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setTransactions((prev) => [...prev.filter((t) => String(t.id) !== String(id))]);
    setAllTransactions((prev) => [...prev.filter((t) => String(t.id) !== String(id))]);
    setTransactionsRevision((r) => r + 1);
    return { success: true };
  };

  // ── Auto-Split ───────────────────────────────────────────────────────────
  const fetchAutoSplitRules = useCallback(async () => {
    if (!user) return;
    setAutoSplitLoading(true);
    const { data, error: err } = await supabase
      .from("auto_split_rules")
      .select("*")
      .eq("user_id", user.id)
      .order("priority", { ascending: true });
    
    if (!err && data) {
      setAutoSplitRules(data);
    }
    setAutoSplitLoading(false);
  }, [user]);

  const addAutoSplitRule = async (rule) => {
    if (!user) return { error: "Belum login" };
    const { data, error: err } = await supabase
      .from("auto_split_rules")
      .insert([{ ...rule, user_id: user.id }])
      .select()
      .single();
    if (err) return { error: err.message };
    setAutoSplitRules(prev => [...prev, data].sort((a,b) => a.priority - b.priority));
    return { data };
  };

  const updateAutoSplitRule = async (id, rule) => {
    if (!user) return { error: "Belum login" };
    const { data, error: err } = await supabase
      .from("auto_split_rules")
      .update(rule)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (err) return { error: err.message };
    setAutoSplitRules(prev => prev.map(r => r.id === id ? data : r).sort((a,b) => a.priority - b.priority));
    return { success: true };
  };

  const deleteAutoSplitRule = async (id) => {
    if (!user) return { error: "Belum login" };
    const { error: err } = await supabase
      .from("auto_split_rules")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (err) return { error: err.message };
    setAutoSplitRules(prev => prev.filter(r => r.id !== id));
    return { success: true };
  };

  const executeAutoSplit = async (incomeTxPayload, allocations) => {
    // 1. Catat pemasukan utamanya
    const incomeResult = await addTransaction(incomeTxPayload);
    if (incomeResult.error) return { error: incomeResult.error };

    // 2. Lakukan alokasi (transfer & setor celengan)
    for (const alloc of allocations) {
      if (alloc.targetWalletId) {
        // Buat transaksi transfer
        await addTransaction({
          nominal: alloc.amount,
          kategori: "Transfer",
          catatan: `Auto-Split: ${alloc.name}`,
          tanggal: incomeTxPayload.tanggal,
          jenis: "transfer",
          wallet_id: incomeTxPayload.wallet_id, // Dari dompet pemasukan
          to_wallet_id: alloc.targetWalletId,   // Ke dompet tujuan
        });
      } else if (alloc.targetSavingsGoalId) {
        // Buat transaksi pengeluaran (dianggap ditabung = uang keluar dari dompet fisik)
        await addTransaction({
          nominal: alloc.amount,
          kategori: "Tabungan Umum",
          catatan: `Auto-Split Celengan: ${alloc.name}`,
          tanggal: incomeTxPayload.tanggal,
          jenis: "pengeluaran",
          wallet_id: incomeTxPayload.wallet_id, // Dari dompet pemasukan
        });
        // Catat ke sistem celengan
        await depositToSavingsGoal(alloc.targetSavingsGoalId, alloc.amount);
      }
    }
    return { success: true, incomeData: incomeResult.data };
  };

  // ── Computed values ──────────────────────────────────────────────────────
  
  // New Calculation for Savings this month
  const savingsAllocatedThisMonth = useMemo(() => {
    const now = selectedDate;
    const year = now.getFullYear();
    const month = now.getMonth();

    return savingsTransactions.reduce((total, st) => {
      const txDate = new Date(st.transaction_date);
      if (txDate.getFullYear() === year && txDate.getMonth() === month) {
        return total + st.amount;
      }
      return total;
    }, 0);
  }, [savingsTransactions, selectedDate]);

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

  // Baseline for budgets & 50/30/20 includes optional rollover (no wallet impact)
  const totalMonthlyIncome = income + rolloverAmount;
  // IMPORTANT: Adjust remaining budget to account for savings
  const remaining = totalMonthlyIncome - totalSpent - savingsAllocatedThisMonth;
  const pct = totalMonthlyIncome > 0
    ? Math.max(0, Math.min(Math.round(((totalSpent + savingsAllocatedThisMonth) / totalMonthlyIncome) * 100), 100))
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

    return Object.entries(currentMonthCategoryBudgets)
      .filter(([category]) => category !== ROLLOVER_STORAGE_KEY)
      .map(([category, limit]) => {
      const spent = byCategory[category] || 0;
      const remaining = limit - spent;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return { category, limit, spent, remaining, percentage };
    });
  }, [currentMonthCategoryBudgets, byCategory]);

  const value = {
    transactions,
    transactionsRevision,
    allTransactions,
    wallets,
    setWallets,
    walletBalances,
    categories,
    loading,
    error,
    income,
    totalMonthlyIncome,
    rolloverAmount,
    previousMonthLeftover,
    canClaimRollover,
    claimBudgetRollover,
    isCurrentCalendarMonth,
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
    markOnboarded,
    updateShortcuts,
    updateCategoryBudgets,
    updateCategoryBudget,
    getBudgetProgress,
    setSelectedDate,
    
    // Savings Goals exports
    savingsGoals,
    savingsTransactions,
    savingsLoading,
    savingsAllocatedThisMonth,
    addSavingsGoal,
    updateSavingsGoal,
    depositToSavingsGoal,
    withdrawFromSavings,
    deleteSavingsGoal,

    // Auto-Split exports
    autoSplitRules,
    autoSplitLoading,
    fetchAutoSplitRules,
    addAutoSplitRule,
    updateAutoSplitRule,
    deleteAutoSplitRule,
    executeAutoSplit,
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
