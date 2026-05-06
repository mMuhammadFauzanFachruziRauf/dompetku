# DompetKu 💚

Aplikasi pencatat keuangan pribadi cerdas berbasis React, Vite, TailwindCSS, dan Supabase. Dirancang untuk pencatatan cepat, analisis sederhana, dan kontrol anggaran berbasis *envelope budgeting*.

---

## ✨ Fitur Utama

### 🧠 Smart Input

Input transaksi dengan bahasa natural.

```txt
"makan nasgor 20000"
```

Langsung terdeteksi sebagai pengeluaran + kategori otomatis.

### 💰 Envelope Budgeting (50/30/20)

* **Needs (50%)** → kebutuhan utama
* **Wants (30%)** → gaya hidup
* **Savings (20%)** → tabungan & investasi

### 📆 Dynamic Monthly Salary

* Gaji bisa berbeda tiap bulan
* Bisa ditambahkan catatan khusus

### 🗂️ Kategori Terstruktur

* Income & Expense dipisah jelas
* Dukungan ikon & emoji

### ⏳ Time Travel

* Lihat histori bulan sebelumnya
* Pantau sisa anggaran tiap bulan

### 📊 Export Excel

* Export laporan otomatis
* Format sudah rapi & siap pakai

---

## 🚀 Setup Lokal (Development)

### 1. Clone Repository

```bash
git clone https://github.com/mMuhammadFauzanFachruziRauf/dompetku.git
cd dompetku
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Buat project baru
3. Ambil:

   * Project URL
   * anon/public key
4. Jalankan SQL di folder:

```bash
/supabase/
```

---

### 4. Environment Variables

Buat file `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

---

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Akses di:

```
http://localhost:5173
```

---

## 🌐 Deployment (Google Cloud Run)

### 1. Build Image

```bash
gcloud builds submit --config cloudbuild.yaml .
```

### 2. Deploy

```bash
gcloud run deploy dompetku-service \
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/dompetku-repo/dompetku-app:v1 \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --port 8080
```

---

## 📁 Struktur Proyek

```bash
src/
├── components/
├── contexts/
├── lib/
├── pages/
├── utils/
├── App.jsx
└── main.jsx
```

---

## 🛠️ Tech Stack

* React
* Vite
* TailwindCSS
* Supabase
* Google Cloud Run

---

## 📋 Roadmap

* [x] Setup project
* [x] Auth Supabase
* [x] Dashboard & DB Sync
* [x] Smart Input
* [x] Kategori & Emoji
* [x] Time Travel
* [x] Statistik 50/30/20
* [x] Export Excel
* [x] Deployment Cloud Run

---

## 💡 Catatan Pengembangan

Aplikasi ini dibuat sebagai portofolio dengan fokus pada:

* UX sederhana
* Kecepatan input
* Insight keuangan yang praktis

---

## 📌 Status

🟢 Production Ready (MVP)

---
