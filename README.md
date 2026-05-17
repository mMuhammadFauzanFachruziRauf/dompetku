# DompetKu 💚

Aplikasi pencatat keuangan pribadi cerdas berbasis React, Vite, TailwindCSS, dan Supabase. Dirancang untuk pencatatan cepat, analisis sederhana, dan kontrol anggaran berbasis *envelope budgeting*.

---

## ✨ Fitur Utama

### 🧠 Smart Input & Bahasa Natural
* Cukup ketik transaksi dalam satu kalimat: `"makan nasgor 20000"`
* Sistem otomatis mendeteksi nominal, jenis transaksi (pengeluaran), dan kategori secara cerdas.

### 💳 Multi-Wallet & Sinkronisasi Saldo
* Manajemen banyak kantong penyimpanan sekaligus (Bank Jago, DANA, BCA, Dompet Tunai, dll).
* Fitur **Quick Action Transfer** antar-dompet yang otomatis memotong dan menambah saldo secara *real-time* tanpa merusak laporan pengeluaran rutin.

### 💰 Envelope Budgeting Scoped per Bulan (50/30/20)
* Alokasi anggaran ketat berdasarkan metode finansial teruji: *Needs* (50%), *Wants* (30%), dan *Savings* (20%).
* Anggaran terisolasi penuh per periode bulan; mengubah budget bulan ini tidak akan merusak data historis bulan lalu.

### 📈 Visualisasi Tren Harian (Trend Analysis)
* Grafik garis (*Line Chart*) interaktif menggunakan `recharts` yang responsif untuk melacak naik-turun pengeluaran harian.
* Mempermudah pengguna mendeteksi *spending spikes* (lonjakan pengeluaran) pada tanggal tertentu.

### 📊 Export Laporan Excel Premium
* Fitur unduh laporan bulanan langsung ke format `.xlsx` profesional ditenagai oleh `exceljs`.
* Desain visual modern: *Header* berwarna tegas, format mata uang rupiah otomatis, pewarnaan teks (merah untuk pengeluaran), serta formula **AutoSum (Total Otomatis)** di bagian bawah tabel.

### ⏳ Time Travel Navigation
* Kemampuan berpindah antar-bulan untuk memantau riwayat transaksi, catatan gaji bulanan yang dinamis, serta evaluasi sisa anggaran masa lalu.

---

## 🚀 Setup Lokal (Development)

### 1. Clone Repository
```bash
git clone [https://github.com/mMuhammadFauzanFachruziRauf/dompetku.git](https://github.com/mMuhammadFauzanFachruziRauf/dompetku.git)
cd dompetku
2. Install Dependencies
Bash
npm install
3. Environment Variables
Buat file .env di root direktori:

Cuplikan kode
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
4. Jalankan Aplikasi
Bash
npm run dev
Akses di: http://localhost:5173

🌐 Deployment (Google Cloud Run)
1. Build Image via Cloud Build
Bash
gcloud builds submit --config cloudbuild.yaml .
2. Deploy ke Cloud Run
Bash
gcloud run deploy dompetku-service \
  --image asia-southeast2-docker.pkg.dev/PROJECT_ID/dompetku-repo/dompetku-app:v1 \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --port 8080
🛠️ Tech Stack & Libraries
Frontend: React.js, Vite, Tailwind CSS

Database & Auth: Supabase (PostgreSQL)

Charts: Recharts

Excel Engine: ExcelJS & File-Saver

Icons: Lucide React

📌 Status Proyek
🟢 Production Ready (MVP Stabilized)