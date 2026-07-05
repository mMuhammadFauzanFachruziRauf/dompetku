// ── Format Rupiah ─────────────────────────────────────────────────────────────
export function formatRupiah(n, compact = false) {
  const abs = Math.abs(n);
  if (compact) {
    if (abs >= 1_000_000) return `Rp ${(abs / 1_000_000).toFixed(1).replace('.0','').replace('.',',')}jt`;
    if (abs >= 1_000)     return `Rp ${(abs / 1_000).toFixed(0)}rb`;
  }
  return "Rp " + abs.toLocaleString("id-ID");
}

export function formatDate(iso) {
  const d   = new Date(iso);
  const now = new Date();
  const isToday     = d.toDateString() === now.toDateString();
  const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (isToday)     return `Hari ini, ${time}`;
  if (isYesterday) return `Kemarin, ${time}`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + `, ${time}`;
}

export function formatDateGroup(iso) {
  const d   = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Hari Ini";
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export function parseAmount(str) {
  str = str.toLowerCase().trim();
  if (str.endsWith("k"))  return parseFloat(str.slice(0, -1)) * 1000;
  if (str.endsWith("jt")) return parseFloat(str.slice(0, -2)) * 1_000_000;
  return parseFloat(str.replace(/\./g, "").replace(/,/g, "")) || 0;
}

const LOCALIZED_CATEGORY_PATTERNS = [
  { category: "Makan", patterns: ["nasi padang", "mie balap", "mcd", "mcdonalds", "mcdonald", "padang", "warteg", "indomie", "kfc", "pizza hut"] },
  { category: "Kendaraan", patterns: ["bensin", "minyak", "maxim", "grab", "gojek", "parkir", "tol", "ojol"] },
  { category: "Persediaan", patterns: ["skincare", "cushion", "makeup", "kosmetik", "parfum", "deterjen", "tissue"] },
  { category: "Belanja", patterns: ["shopee", "tokopedia", "lazada", "uniqlo", "zara"] },
  { category: "Hiburan", patterns: ["netflix", "spotify", "bioskop", "nonton", "game"] },
];

/**
 * Rule-based category inference from free-text description.
 * Returns { category, source } or null.
 */
export function inferCategoryFromText(text, categories = [], options = {}) {
  const { jenis = "Pengeluaran" } = options;
  const lower = (text || "").trim().toLowerCase();
  if (!lower) return null;

  const eligible = categories.filter((c) => {
    if (jenis === "Pemasukan") return c.type === "Income";
    if (jenis === "Pengeluaran") return c.type !== "Income";
    return c.type !== "Income";
  });
  if (eligible.length === 0) return null;

  const categoryExists = (name) => eligible.some((c) => c.name === name);

  for (const { category, patterns } of LOCALIZED_CATEGORY_PATTERNS) {
    if (!categoryExists(category)) continue;
    if (patterns.some((p) => lower.includes(p))) {
      return { category, source: "pattern" };
    }
  }

  for (const cat of eligible) {
    if (!cat.keywords) continue;
    const keywords = cat.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    const words = lower.split(/\s+/);

    let matched = keywords.some((kw) => lower.includes(kw));
    if (!matched) {
      matched = words.some(
        (w) => w.length >= 4 && keywords.some((kw) => kw.startsWith(w) || w.startsWith(kw))
      );
    }
    if (matched) return { category: cat.name, source: "keyword" };
  }

  return null;
}

export function checkSpendingAnomaly(amount, totalMonthlyIncome, remaining) {
  const nom = Number(amount) || 0;
  if (nom <= 0) return null;

  const triggers = [];
  if (totalMonthlyIncome > 0 && nom >= totalMonthlyIncome * 0.2) {
    triggers.push("large_single");
  }
  if (remaining - nom < 0) {
    triggers.push("negative_budget");
  }
  return triggers.length > 0 ? triggers : null;
}

export function parseSmartInput(text, categories = []) {
  const trimmed = text.trim();
  const match   = trimmed.match(/^(.*?)\s*([\d][\d.,]*(?:k|jt)?)\s*$/i);
  if (!match) return null;
  
  const descRaw = match[1].trim();
  const desc    = descRaw.replace(/\+/g, '').trim();
  let nominal = parseAmount(match[2]);
  if (!nominal || nominal <= 0) return null;
  
  const lower   = desc.toLowerCase();
  
  // Income detection
  const incomeKeywords = ["gaji", "bonus", "pemasukan", "dikasih", "transfer", "income", "thr"];
  const isIncome = trimmed.includes("+") || incomeKeywords.some(kw => lower.includes(kw));

  if (isIncome) {
    return { nominal: -nominal, kategori: "Pemasukan Tambahan", catatan: desc || "Pemasukan Tambahan", isIncome: true };
  }

  let kategori = "Lainnya";
  if (categories.some((c) => c.name === "Keperluan")) {
    kategori = "Keperluan";
  }

  const inferred = inferCategoryFromText(desc, categories, { jenis: "Pengeluaran" });
  if (inferred) {
    kategori = inferred.category;
  }

  return { nominal, kategori, catatan: desc || kategori, isIncome: false };
}

export function getMeta(katName, categories = []) {
  if (katName === "Pemasukan Tambahan") {
    return { 
      icon: "south_west", 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      bgBase: "bg-emerald-500" 
    };
  }
  const cat = categories.find(c => c.name === katName);
  if (cat) {
    return { 
      icon: cat.icon, 
      color: cat.color, 
      bg: cat.color.replace("text-", "bg-") + "/10",
      bgBase: cat.color.replace("text-", "bg-") // For progress bars
    };
  }
  return { 
    icon: "payments", 
    color: "text-slate-400", 
    bg: "bg-slate-400/10",
    bgBase: "bg-slate-400"
  };
}

export function isMaterialIcon(name) {
  if (!name || typeof name !== 'string') return false;
  // Allow lowercase letters, digits and underscores (e.g. inventory_2)
  return /^[a-z0-9_]+$/.test(name);
}
