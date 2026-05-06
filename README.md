# DompetKu 💚

Aplikasi pencatat keuangan pribadi berbasis React + Supabase.

---

## 🚀 Cara Setup (Ikuti urutan ini!)

### 1. Clone / buka folder proyek
```bash
cd dompetku
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Buat project baru (gratis)
3. Masuk ke **Project Settings → API**
4. Copy **Project URL** dan **anon/public key**

### 4. Buat file `.env.local`
Duplikat file `.env.example` dan isi:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Jalankan di lokal
```bash
npm run dev
```
Buka [http://localhost:5173](http://localhost:5173)

---

## 📁 Struktur Proyek

```
src/
├── components/ui/   ← Button, Input (reusable)
├── contexts/        ← AuthContext (state global auth)
├── lib/             ← supabase.js (koneksi client)
├── pages/           ← LoginPage, RegisterPage, DashboardPage
├── App.jsx          ← Router + ProtectedRoute
└── main.jsx         ← Entry point
```

---

## 🌐 Deploy ke Vercel

```bash
# Install Vercel CLI (sekali saja)
npm i -g vercel

# Deploy
vercel

# Tambahkan environment variables di Vercel dashboard
# Settings → Environment Variables → tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
```

---

## 📋 Roadmap

- [x] Tahap 1 — Setup proyek & konfigurasi
- [x] Tahap 2 — Login & Register (Auth)
- [ ] Tahap 3 — Dashboard & Context transaksi
- [ ] Tahap 4 — Form catat pengeluaran (Smart Input)
- [ ] Tahap 5 — Riwayat & filter
- [ ] Tahap 6 — Statistik & grafik
- [ ] Tahap 7 — Deploy Vercel
