/**
 * Menghitung pembagian gaji berdasarkan rule auto-split.
 * @param {number} incomeAmount - Nominal pemasukan.
 * @param {Array} rules - List of auto_split_rules.
 * @param {Array} wallets - List of wallets for validation/mapping.
 * @param {Array} savingsGoals - List of savings goals for validation/mapping.
 * @returns {Object} { allocations: Array, isValid: boolean, remaining: number, error: string }
 */
export function calculateAutoSplit(incomeAmount, rules = [], wallets = [], savingsGoals = []) {
  if (incomeAmount <= 0) {
    return { allocations: [], isValid: true, remaining: 0, error: "" };
  }

  // Pisahkan rule berdasarkan tipe, karena prioritas eksekusi: fixed -> waterfall -> percentage
  const fixedRules = rules.filter(r => r.type === "fixed").sort((a, b) => a.priority - b.priority);
  const waterfallRules = rules.filter(r => r.type === "waterfall").sort((a, b) => a.priority - b.priority);
  const percentRules = rules.filter(r => r.type === "percentage").sort((a, b) => a.priority - b.priority);

  let remaining = incomeAmount;
  let allocations = [];
  let errorMsg = "";

  // Tahap 1: Hitung potongan fixed
  for (const rule of fixedRules) {
    const amount = Number(rule.value) || 0;
    
    // Resolve target nama untuk UI
    let targetName = "Tujuan tidak diketahui";
    if (rule.target_wallet_id) {
      const wallet = wallets.find(w => w.id === rule.target_wallet_id);
      targetName = wallet ? `Dompet: ${wallet.name}` : "Dompet Tidak Ditemukan";
    } else if (rule.target_savings_goal_id) {
      const sg = savingsGoals.find(s => String(s.id) === String(rule.target_savings_goal_id));
      targetName = sg ? `Celengan: ${sg.name}` : "Celengan Tidak Ditemukan";
    }

    allocations.push({
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
      amount: amount,
      targetName,
      targetWalletId: rule.target_wallet_id,
      targetSavingsGoalId: rule.target_savings_goal_id
    });

    remaining -= amount;
  }

  // Validasi tahap 1: Apakah potongan fixed melebihi total pendapatan?
  if (remaining < 0) {
    return {
      allocations,
      isValid: false,
      remaining,
      error: "Total potongan tetap (fixed) melebihi nominal pemasukan."
    };
  }

  // Tahap 1.5: Hitung potongan waterfall (Batas Maksimal)
  for (const rule of waterfallRules) {
    if (remaining <= 0) break; // Jika uang habis, berhenti

    const maxCap = Number(rule.value) || 0;
    const amount = Math.min(remaining, maxCap);

    let targetName = "Tujuan tidak diketahui";
    if (rule.target_wallet_id) {
      const wallet = wallets.find(w => w.id === rule.target_wallet_id);
      targetName = wallet ? `Dompet: ${wallet.name}` : "Dompet Tidak Ditemukan";
    } else if (rule.target_savings_goal_id) {
      const sg = savingsGoals.find(s => String(s.id) === String(rule.target_savings_goal_id));
      targetName = sg ? `Celengan: ${sg.name}` : "Celengan Tidak Ditemukan";
    }

    allocations.push({
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
      amount: amount,
      targetName,
      targetWalletId: rule.target_wallet_id,
      targetSavingsGoalId: rule.target_savings_goal_id
    });

    remaining -= amount;
  }

  const baseForPercentage = remaining; // Sisa uang untuk dihitung persentasenya

  // Tahap 2: Hitung potongan persentase dari sisa
  for (const rule of percentRules) {
    const pct = Number(rule.value) || 0;
    // Hindari persentase negatif atau > 100
    const safePct = Math.max(0, Math.min(100, pct));
    const amount = (safePct / 100) * baseForPercentage;

    let targetName = "Tujuan tidak diketahui";
    if (rule.target_wallet_id) {
      const wallet = wallets.find(w => w.id === rule.target_wallet_id);
      targetName = wallet ? `Dompet: ${wallet.name}` : "Dompet Tidak Ditemukan";
    } else if (rule.target_savings_goal_id) {
      const sg = savingsGoals.find(s => String(s.id) === String(rule.target_savings_goal_id));
      targetName = sg ? `Celengan: ${sg.name}` : "Celengan Tidak Ditemukan";
    }

    allocations.push({
      ruleId: rule.id,
      name: rule.name,
      type: rule.type,
      amount: amount,
      percentage: safePct,
      targetName,
      targetWalletId: rule.target_wallet_id,
      targetSavingsGoalId: rule.target_savings_goal_id
    });

    remaining -= amount;
  }

  // Validasi tahap 2: Apakah potongan total (fixed + persentase) melebihi pendapatan?
  // Harusnya tidak mungkin jika persentase dihitung dari sisa, namun untuk berjaga-jaga:
  if (remaining < 0) {
    return {
      allocations,
      isValid: false,
      remaining,
      error: "Kesalahan kalkulasi: Total potongan melebihi nominal pemasukan."
    };
  }

  return {
    allocations,
    isValid: true,
    remaining,
    error: ""
  };
}
