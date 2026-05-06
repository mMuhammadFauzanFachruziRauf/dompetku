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
  
  // Default fallback category if no match
  let kategori = "Lainnya";
  if (categories.some(c => c.name === "Keperluan")) {
    kategori = "Keperluan";
  }
  
  // Find match in dynamic categories
  for (const cat of categories) {
    if (!cat.keywords) continue;
    const keywords = cat.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
    const words = lower.split(/\s+/);
    
    // 1. Direct includes match (e.g., "makan siang" includes "makan")
    let matched = keywords.some(kw => lower.includes(kw));
    
    // 2. Partial typo match (e.g., user typed "bensi", keyword is "bensin")
    // Only check words >= 4 chars to prevent false positives with short words
    if (!matched) {
      matched = words.some(w => w.length >= 4 && keywords.some(kw => kw.startsWith(w) || w.startsWith(kw)));
    }

    if (matched) {
      kategori = cat.name;
      break;
    }
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
