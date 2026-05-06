---

## 📋 Rangkuman Lengkap Proyek DompetKu

### 🏗️ Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 + dark theme (Stitch palette) |
| Icons | Material Symbols Outlined (Google) |
| Auth & DB | Supabase (PostgreSQL) |
| Routing | React Router DOM v6 |
| Deploy target | Vercel / Netlify |

---

### 📁 Struktur Proyek Lengkap
```
dompetku/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx     ← Shell utama (sidebar + bottom nav)
│   │   │   └── Sidebar.jsx       ← Komponen sidebar (unused, sudah di AppLayout)
│   │   └── ui/
│   │       ├── Button.jsx        ← Tombol reusable
│   │       └── Input.jsx         ← Input reusable
│   ├── contexts/
│   │   ├── AuthContext.jsx       ← State login global (Supabase auth)
│   │   └── TransactionContext.jsx← State transaksi global (CRUD Supabase)
│   ├── lib/
│   │   └── supabase.js           ← Koneksi Supabase client
│   ├── pages/
│   │   ├── LoginPage.jsx         ← Halaman login (dark theme)
│   │   ├── RegisterPage.jsx      ← Halaman daftar + password strength
│   │   ├── DashboardPage.jsx     ← Dashboard utama (bento grid)
│   │   ├── CatatPage.jsx         ← Form catat (smart input + manual)
│   │   ├── RiwayatPage.jsx       ← Riwayat + filter + hapus
│   │   └── StatistikPage.jsx     ← Grafik & statistik
│   ├── utils/
│   │   └── helpers.js            ← formatRupiah, parseSmartInput, getMeta, dll
│   ├── App.jsx                   ← Router + ProtectedRoute + tab management
│   └── main.jsx                  ← Entry point
├── supabase/
│   └── schema.sql                ← SQL tabel (transactions + profiles)
├── .env.local                    ← VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
└── index.html                    ← Dark mode class + Material Symbols link
```

---

### ⚙️ Fitur yang Sudah Jalan
| Fitur | Detail |
|-------|--------|
| **Auth** | Register, login, logout, forgot password via Supabase |
| **Proteksi Route** | Belum login → redirect `/login` otomatis |
| **Smart Input** | Ketik `"Makan siang 50000"` → parser auto-detect kategori & nominal (support `50k`, `50.000`, `1jt`) |
| **Form Manual** | Nominal + kategori dropdown (Needs/Wants/Savings) + catatan |
| **Dashboard** | Donut chart, stat cards, transaksi terakhir, category bars, 50/30/20 rule |
| **Riwayat** | List grouped per hari, filter kategori, search, hapus dengan konfirmasi |
| **Statistik** | Grafik harian, breakdown per kategori, pie Needs/Wants/Savings |
| **Responsive** | Mobile (bottom nav) + Desktop (sidebar kiri 280px) |
| **Dark Mode** | Full Stitch dark palette (slate + emerald) |

---

### 🗄️ Database Supabase (Schema)
```sql
-- Tabel utama
transactions (
  id         uuid PRIMARY KEY,
  user_id    uuid REFERENCES auth.users,
  nominal    integer NOT NULL,
  kategori   text NOT NULL,
  catatan    text,
  tanggal    timestamptz DEFAULT now()
)

-- Profil user
profiles (
  id             uuid REFERENCES auth.users PRIMARY KEY,
  full_name      text,
  monthly_income integer DEFAULT 2592000
)
```
RLS (Row Level Security) aktif — user hanya bisa akses data miliknya sendiri.

---

### 💰 Kategori Pengeluaran
```
Needs   → Keluarga, Keperluan, Makan, Persediaan, Kendaraan, E-Wallet, BPJS
Wants   → Belanja, Hiburan, Hadiah, Travel
Savings → Tabungan Umum, Dana Darurat (dengan Ojan)
```
Income default: **Rp 2.592.000/bulan**

---

### 🚧 Yang Belum Dikerjakan
| Tahap | Fitur |
|-------|-------|
| **Deploy** | Push ke Vercel + set environment variables |
| **Setting income** | Edit penghasilan bulanan dari UI |
| **Export data** | Download CSV transaksi |
| **Notifikasi** | Alert ketika budget hampir habis |

---